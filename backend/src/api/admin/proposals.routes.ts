import { Router, Request, Response } from 'express';
import { ProposalsService, createProposalSchema } from '../../modules/crm/proposals.service';
import { createLogger } from '../../utils/logger';

const router = Router();
const proposalsService = new ProposalsService();
const logger = createLogger('proposals-api');

/**
 * POST /api/admin/proposals
 * Create a new proposal (draft or pending approval)
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const validation = createProposalSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error.errors });
        }

        const proposal = await proposalsService.createProposal(validation.data);
        return res.status(201).json({ success: true, data: proposal });
    } catch (error) {
        logger.error('Failed to create proposal', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/proposals
 * Get all proposals, optionally filtered by status
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string;
        const proposals = await proposalsService.getProposals(status);
        return res.json({ success: true, data: proposals });
    } catch (error) {
        logger.error('Failed to fetch proposals', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * PATCH /api/admin/proposals/:id/status
 * Update proposal status (e.g. approve)
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, error: 'Status is required' });
        }

        const proposal = await proposalsService.updateStatus(req.params.id, status);
        return res.json({ success: true, data: proposal });
    } catch (error) {
        logger.error('Failed to update proposal status', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
