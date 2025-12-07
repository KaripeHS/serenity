import { Router, Request, Response } from 'express';
import { clinicalService } from '../../services/clinical.service';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('clinical-api');

/**
 * GET /api/clinical/visits/:id/details
 * Fetch clinical details (Care Plan, Meds, ADLs)
 */
router.get('/visits/:id/details', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const data = await clinicalService.getVisitDetails(id);
        res.json(data);
    } catch (error) {
        logger.error(`Clinical API Error: ${error}`);
        res.status(500).json({ error: 'Failed to fetch clinical details' });
    }
});

export const clinicalRouter = router;
