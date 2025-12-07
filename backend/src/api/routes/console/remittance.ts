/**
 * Remittance (835) API Routes
 *
 * Endpoints for processing Electronic Remittance Advice (835) files:
 * - Upload and parse 835 files
 * - Auto-post payments to claims
 * - Review pending payments
 * - Reconcile bank deposits
 * - View remittance history
 *
 * @module api/routes/console/remittance
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { remittanceAutoPostingService } from '../../../services/billing/remittance-auto-posting.service';
import { edi835ParserService } from '../../../services/billing/edi-835-parser.service';
import { logger } from '../../../utils/logger';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept .txt, .835, .edi files
    const allowedExtensions = ['.txt', '.835', '.edi', '.x12'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .txt, .835, .edi, or .x12 files are allowed.'));
    }
  }
});

/**
 * POST /api/console/remittance/upload
 * Upload and parse 835 file (preview only, no auto-posting)
 */
router.post('/upload', upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');

    // Parse 835 file
    const ediData = await edi835ParserService.parse(fileContent);

    // Calculate summary statistics
    const summary = {
      totalPayment: ediData.payment.totalPayment,
      paymentMethod: ediData.payment.paymentMethod,
      paymentDate: ediData.payment.paymentDate,
      payerName: ediData.payment.payerName,
      checkNumber: ediData.payment.checkNumber,
      claimCount: ediData.claims.length,
      totalCharged: ediData.claims.reduce((sum, c) => sum + c.chargedAmount, 0),
      totalPaid: ediData.claims.reduce((sum, c) => sum + c.paidAmount, 0),
      totalAdjustments: ediData.claims.reduce((sum, c) => {
        return sum + c.adjustments.reduce((adjSum, adj) => adjSum + adj.amount, 0);
      }, 0),
      claims: ediData.claims.map(claim => ({
        claimId: claim.claimId,
        status: edi835ParserService.getClaimStatusDescription(claim.claimStatus),
        chargedAmount: claim.chargedAmount,
        paidAmount: claim.paidAmount,
        patientName: `${claim.patient.firstName} ${claim.patient.lastName}`,
        adjustments: edi835ParserService.calculateAdjustmentsByGroup(claim)
      }))
    };

    res.json({
      success: true,
      summary,
      message: `Successfully parsed 835 file with ${ediData.claims.length} claims`
    });
  } catch (error) {
    logger.error('Error uploading 835 file:', error);
    res.status(500).json({
      error: 'Failed to parse 835 file',
      message: error.message
    });
  }
});

/**
 * POST /api/console/remittance/process
 * Upload and process 835 file with auto-posting
 */
router.post('/process', upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const {
      autoPost = true,
      requireManualReview = false,
      matchThreshold = 0.95,
      organizationId,
      userId
    } = req.body;

    // Validate required fields
    if (!organizationId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: organizationId, userId'
      });
    }

    // Process remittance
    const result = await remittanceAutoPostingService.processRemittance(fileContent, {
      autoPost: autoPost === 'true' || autoPost === true,
      requireManualReview: requireManualReview === 'true' || requireManualReview === true,
      matchThreshold: parseFloat(matchThreshold) || 0.95,
      organizationId,
      userId
    });

    res.json({
      success: result.success,
      remittanceId: result.remittanceId,
      summary: {
        paymentAmount: result.paymentAmount,
        claimsProcessed: result.claimsProcessed,
        claimsMatched: result.claimsMatched,
        claimsFailed: result.claimsFailed
      },
      details: result.details,
      errors: result.errors,
      message: result.success
        ? `Successfully processed remittance with ${result.claimsMatched} matched claims`
        : `Processed with errors: ${result.claimsFailed} failed claims`
    });
  } catch (error) {
    logger.error('Error processing 835 file:', error);
    res.status(500).json({
      error: 'Failed to process 835 file',
      message: error.message
    });
  }
});

/**
 * GET /api/console/remittance/:id
 * Get remittance details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const summary = await remittanceAutoPostingService.getRemittanceSummary(id);

    res.json({
      success: true,
      remittance: summary
    });
  } catch (error) {
    logger.error('Error fetching remittance:', error);
    res.status(500).json({
      error: 'Failed to fetch remittance',
      message: error.message
    });
  }
});

/**
 * POST /api/console/remittance/:id/reconcile
 * Reconcile remittance with bank deposit
 */
router.post('/:id/reconcile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bankDepositAmount, bankDepositDate } = req.body;

    if (!bankDepositAmount || !bankDepositDate) {
      return res.status(400).json({
        error: 'Missing required fields: bankDepositAmount, bankDepositDate'
      });
    }

    const result = await remittanceAutoPostingService.reconcileRemittance(
      id,
      parseFloat(bankDepositAmount),
      new Date(bankDepositDate)
    );

    res.json({
      success: result.matched,
      matched: result.matched,
      difference: result.difference,
      message: result.matched
        ? 'Remittance reconciled successfully'
        : `Reconciliation failed: $${result.difference.toFixed(2)} difference`
    });
  } catch (error) {
    logger.error('Error reconciling remittance:', error);
    res.status(500).json({
      error: 'Failed to reconcile remittance',
      message: error.message
    });
  }
});

/**
 * POST /api/console/remittance/:id/reprocess
 * Reprocess failed claims
 */
router.post('/:id/reprocess', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await remittanceAutoPostingService.reprocessFailedClaims(id);

    res.json({
      success: result.success,
      summary: {
        claimsProcessed: result.claimsProcessed,
        claimsMatched: result.claimsMatched,
        claimsFailed: result.claimsFailed
      },
      message: `Reprocessed ${result.claimsMatched} claims`
    });
  } catch (error) {
    logger.error('Error reprocessing claims:', error);
    res.status(500).json({
      error: 'Failed to reprocess claims',
      message: error.message
    });
  }
});

/**
 * GET /api/console/remittance
 * List remittances with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // In real implementation, this would query database with filters
    // For now, return mock data
    const remittances = [];

    res.json({
      success: true,
      remittances,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        totalPages: 0
      }
    });
  } catch (error) {
    logger.error('Error listing remittances:', error);
    res.status(500).json({
      error: 'Failed to list remittances',
      message: error.message
    });
  }
});

export default router;
