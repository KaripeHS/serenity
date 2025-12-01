import { Router, Request, Response } from 'express';
import { LeadsService } from '../../modules/crm/leads.service';
import { createLogger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();
const leadsService = new LeadsService();
const logger = createLogger('admin-leads-api');

/**
 * GET /api/admin/leads
 * List all leads with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string | undefined;
        const leads = await leadsService.getLeads({ status });

        return res.json({
            success: true,
            data: leads
        });
    } catch (error) {
        logger.error('Failed to fetch leads', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/leads/stats
 * Get pipeline analytics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = await leadsService.getPipelineStats();
        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to fetch lead stats', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * PATCH /api/admin/leads/:id
 * Update lead status or details
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const lead = await leadsService.updateLead(id, updates);

        return res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        logger.error('Failed to update lead', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
