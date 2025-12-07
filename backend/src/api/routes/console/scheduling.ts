
import { Router } from 'express';
import { DatabaseClient } from '../../../database/client';
import { SchedulingService } from '../../../modules/scheduling/scheduling.service';
import { AuditLogger } from '../../../audit/logger';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../../auth/access-control';

export function createSchedulingRoutes(db: DatabaseClient, auditLogger: AuditLogger): Router {
    const router = Router();
    const schedulingService = new SchedulingService(db, auditLogger);

    // Get caregiver matches for a specific shift requirement
    router.get('/matches', requireRole(UserRole.IT_ADMIN, UserRole.SCHEDULER, UserRole.FIELD_SUPERVISOR), async (req, res) => {
        try {
            const { clientId, serviceId, start, end, maxDistance, continuity } = req.query;

            if (!clientId || !serviceId || !start || !end) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const matches = await schedulingService.findCaregiverMatches(
                clientId as string,
                serviceId as string,
                {
                    start: new Date(start as string),
                    end: new Date(end as string)
                },
                {
                    maximumDistance: maxDistance ? parseFloat(maxDistance as string) : undefined,
                    continuityOfCare: continuity === 'true'
                }
            );

            res.json(matches);
        } catch (error) {
            console.error('Error finding matches:', error);
            res.status(500).json({ error: 'Failed to find caregiver matches' });
        }
    });

    // Optimize schedule for a date range
    router.get('/optimize', requireRole(UserRole.IT_ADMIN, UserRole.SCHEDULER, UserRole.FIELD_SUPERVISOR), async (req, res) => {
        try {
            const { start, end } = req.query;

            if (!start || !end) {
                return res.status(400).json({ error: 'Missing start/end date parameters' });
            }

            // Ensure user is defined before accessing
            if (!req.user) {
                return res.status(401).json({ error: 'User context required' });
            }

            const optimization = await schedulingService.optimizeSchedule(
                new Date(start as string),
                new Date(end as string),
                req.user
            );

            res.json(optimization);
        } catch (error) {
            console.error('Error optimizing schedule:', error);
            res.status(500).json({ error: 'Failed to optimize schedule' });
        }
    });

    // Get mileage logs
    router.get('/mileage', requireRole(UserRole.IT_ADMIN, UserRole.SCHEDULER, UserRole.FIELD_SUPERVISOR), async (req, res) => {
        try {
            const { start, end } = req.query;
            let query = 'SELECT m.*, u.first_name, u.last_name FROM mileage_logs m JOIN users u ON m.user_id = u.id WHERE m.organization_id = $1';

            if (!req.user) {
                return res.status(401).json({ error: 'User context required' });
            }

            const params: any[] = [req.user.organizationId];

            if (start) {
                params.push(start);
                query += ` AND m.date >= $${params.length}`;
            }
            if (end) {
                params.push(end);
                query += ` AND m.date <= $${params.length}`;
            }
            query += ' ORDER BY m.date DESC';

            const result = await db.query(query, params);
            res.json(result.rows);

        } catch (error) {
            console.error('Error fetching mileage:', error);
            res.status(500).json({ error: 'Failed to fetch mileage logs' });
        }
    });

    // Get simplified clients list for dropdowns
    router.get('/clients', requireRole(UserRole.IT_ADMIN, UserRole.SCHEDULER, UserRole.FIELD_SUPERVISOR), async (req, res) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'User context required' });

            const result = await db.query(
                `SELECT id, first_name, last_name, city, state, address_line_1 
                 FROM clients 
                 WHERE organization_id = $1 AND status = 'active'
                 ORDER BY last_name, first_name`,
                [req.user.organizationId]
            );

            res.json(result.rows.map(r => ({
                id: r.id,
                name: `${r.first_name} ${r.last_name}`,
                address: r.address_line_1, // simplified location for UI
                location: `${r.city}, ${r.state}`
            })));
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Failed to fetch clients' });
        }
    });

    // Get services list for dropdowns
    router.get('/services', requireRole(UserRole.IT_ADMIN, UserRole.SCHEDULER, UserRole.FIELD_SUPERVISOR), async (req, res) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'User context required' });

            const result = await db.query(
                `SELECT id, name, code, billing_code 
                 FROM services 
                 WHERE organization_id = $1 AND is_active = true
                 ORDER BY name`,
                [req.user.organizationId]
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ error: 'Failed to fetch services' });
        }
    });

    return router;
}
