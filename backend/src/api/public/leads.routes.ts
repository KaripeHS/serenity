import { Router, Request, Response } from 'express';
import { LeadsService } from '../../modules/crm/leads.service';
import { createLogger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();
const leadsService = new LeadsService();
const logger = createLogger('public-leads-api');

// Validation schema
const createLeadSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    serviceInterest: z.string().min(1, 'Service interest is required'),
    source: z.string().optional(),
    notes: z.string().optional()
});

/**
 * POST /api/public/leads
 * Submit a new lead from the landing page
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validation = createLeadSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const lead = await leadsService.createLead(validation.data);

        logger.info(`New public lead created: ${lead.id}`);

        return res.status(201).json({
            success: true,
            message: 'Request received successfully',
            leadId: lead.id
        });

    } catch (error) {
        logger.error('Failed to create public lead', { error });
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
