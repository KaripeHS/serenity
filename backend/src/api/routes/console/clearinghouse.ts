/**
 * Clearinghouse API Routes
 * Electronic claims submission and remittance processing
 *
 * @module api/routes/console/clearinghouse
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { getClearinghouseService } from '../../../services/billing/clearinghouse.service';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/console/clearinghouse/submit
 * Submit claims to clearinghouse
 */
router.post('/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { claimIds, payer, fileName } = req.body;

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'claimIds array is required and must not be empty',
      });
    }

    if (!payer) {
      return res.status(400).json({
        success: false,
        error: 'payer is required',
      });
    }

    const clearinghouseService = getClearinghouseService();

    const result = await clearinghouseService.submitClaims({
      claimIds,
      payer,
      submissionDate: new Date(),
      fileName,
    });

    res.json({
      success: true,
      submission: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/clearinghouse/acknowledgment/:submissionId
 * Check acknowledgment status (997/999)
 */
router.get('/acknowledgment/:submissionId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { submissionId } = req.params;

    const clearinghouseService = getClearinghouseService();
    const status = await clearinghouseService.checkAcknowledgment(submissionId);

    res.json({
      success: true,
      acknowledgment: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/clearinghouse/remittance
 * Get remittance advice (835 - payment information)
 */
router.get('/remittance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let start = new Date();
    start.setDate(start.getDate() - 30); // Default: last 30 days
    let end = new Date();

    if (startDate) {
      start = new Date(startDate as string);
    }

    if (endDate) {
      end = new Date(endDate as string);
    }

    const clearinghouseService = getClearinghouseService();
    const remittances = await clearinghouseService.getRemittanceAdvice(start, end);

    res.json({
      success: true,
      remittances,
      count: remittances.length,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/clearinghouse/remittance/:remittanceId/download
 * Download 835 remittance file
 */
router.get('/remittance/:remittanceId/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { remittanceId } = req.params;

    const clearinghouseService = getClearinghouseService();
    const fileContent = await clearinghouseService.downloadRemittanceFile(remittanceId);

    // Return as downloadable file
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="835_${remittanceId}.txt"`,
    });

    res.send(fileContent);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/clearinghouse/submissions
 * Get submission history
 */
router.get('/submissions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;

    const clearinghouseService = getClearinghouseService();
    const submissions = await clearinghouseService.getSubmissionHistory(Number(days));

    res.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/clearinghouse/validate/:claimId
 * Validate claim before submission
 */
router.post('/validate/:claimId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { claimId } = req.params;

    const clearinghouseService = getClearinghouseService();
    const validation = await clearinghouseService.validateClaim(claimId);

    res.json({
      success: true,
      claimId,
      validation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
