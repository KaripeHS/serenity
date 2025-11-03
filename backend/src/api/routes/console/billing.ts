/**
 * Billing Routes
 * API endpoints for claims management and revenue cycle
 *
 * @module api/routes/console/billing
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getClaimsGateService } from '../../../modules/billing/claims-gate.service';
import { getEDI837GeneratorService } from '../../../modules/billing/edi-generator.service';

const router = Router();
const claimsGateService = getClaimsGateService();
const edi837Generator = getEDI837GeneratorService();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/billing/claims-readiness
 * Get claims readiness report for a date range
 */
router.get('/claims-readiness', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('startDate and endDate are required');
    }

    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw ApiErrors.badRequest('Invalid date format');
    }

    const report = await claimsGateService.getClaimsReadinessReport(start, end, organizationId);

    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/billing/claims-readiness/validate
 * Validate a single visit for claims readiness
 */
router.post('/claims-readiness/validate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.body;

    if (!visitId) {
      throw ApiErrors.badRequest('visitId is required');
    }

    const validation = await claimsGateService.validateClaimReadiness(visitId);

    res.json(validation);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/billing/claims/generate
 * Generate claims file (enforces claims gate)
 */
router.post('/claims/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitIds, format = '837', forceSubmit = false } = req.body;

    if (!visitIds || !Array.isArray(visitIds) || visitIds.length === 0) {
      throw ApiErrors.badRequest('visitIds array is required');
    }

    // Enforce claims gate
    if (!forceSubmit) {
      const gateCheck = await claimsGateService.canGenerateClaims(visitIds);
      if (!gateCheck.allowed) {
        return res.status(400).json({
          success: false,
          error: 'Claims gate validation failed',
          blockedVisits: gateCheck.errors,
          message: 'Fix validation errors or use forceSubmit=true to override (requires approval)'
        });
      }
    } else {
      // Force submit requires special permission and audit log
      if (!req.user?.permissions?.includes('force_claims_submission')) {
        throw ApiErrors.forbidden('Force claims submission requires special permission');
      }

      // TODO: Log force submit to audit trail
      // await auditLog.create({
      //   userId: req.user.id,
      //   action: 'force_claims_submission',
      //   details: { visitIds, reason: req.body.forceReason || 'No reason provided' }
      // });

      console.log(`[CLAIMS] Force submit by ${req.user.email} for ${visitIds.length} visits`);
    }

    // Generate claims file
    const claimsFileId = `claims-${Date.now()}`;
    const fileName = `claims_${new Date().toISOString().split('T')[0]}.${format}`;

    // Mock visit data (TODO: fetch from database)
    const mockVisits = visitIds.map((id, index) => ({
      id,
      visitDate: new Date(),
      serviceCode: index % 2 === 0 ? 'T1019' : 'S5125',
      billableUnits: 8,
      diagnosisCode: 'Z7409',
      authorizationNumber: `AUTH-${index + 1}`,
      client: {
        id: `client-${index + 1}`,
        firstName: 'Margaret',
        lastName: 'Johnson',
        dateOfBirth: new Date('1940-05-15'),
        medicaidNumber: `OH${(1234567890 + index).toString()}`,
        addressLine1: '123 Main St',
        city: 'Dayton',
        state: 'OH',
        zipCode: '45402'
      },
      caregiver: {
        id: `cg-${index + 1}`,
        firstName: 'Mary',
        lastName: 'Smith',
        npi: '1234567890'
      },
      placeOfService: '12' // Home
    }));

    const organizationInfo = {
      name: 'SERENITY CARE PARTNERS',
      npi: '1234567890',
      taxId: '123456789',
      addressLine1: '456 Care Lane',
      city: 'Dayton',
      state: 'OH',
      zipCode: '45402',
      contactName: 'Gloria CEO',
      contactPhone: '9375551234'
    };

    const clearinghouse = {
      name: 'OHIO MEDICAID',
      id: 'OHMEDICAID',
      submissionId: 'OH837SUBMIT'
    };

    // Generate 837P file
    const claimsFileContent = await edi837Generator.generate837P(
      mockVisits,
      organizationInfo,
      clearinghouse
    );

    // TODO: Save to database and file storage
    // await db.query(`
    //   INSERT INTO claims_files (id, organization_id, format, visit_count, file_content, status, created_by, created_at)
    //   VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())
    // `, [claimsFileId, organizationId, format, visitIds.length, claimsFileContent, req.user?.id]);

    console.log(`[CLAIMS] Generated ${format} claims file: ${claimsFileId} with ${visitIds.length} visits`);

    res.json({
      success: true,
      claimsFileId,
      fileName,
      format,
      visitCount: visitIds.length,
      status: 'pending',
      message: 'Claims file generated successfully',
      downloadUrl: `/api/console/billing/claims/${claimsFileId}/download`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/billing/claims/:claimsFileId
 * Get claims file details
 */
router.get('/claims/:claimsFileId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { claimsFileId } = req.params;

    // TODO: Query database for claims file
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT *
    //   FROM claims_files
    //   WHERE id = $1 AND organization_id = $2
    // `, [claimsFileId, req.user?.organizationId]);

    // Mock claims file details
    const claimsFile = {
      id: claimsFileId,
      organizationId: req.user?.organizationId,
      format: '837',
      visitCount: 150,
      totalAmount: 37500,
      status: 'pending',
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
      submittedAt: null,
      fileName: `claims_${new Date().toISOString().split('T')[0]}.837`
    };

    res.json(claimsFile);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/billing/claims/:claimsFileId/download
 * Download claims file
 */
router.get('/claims/:claimsFileId/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { claimsFileId } = req.params;

    // TODO: Retrieve claims file from storage
    // const fileContent = await getClaimsFileContent(claimsFileId);

    // Mock file content (sample 837 format)
    const fileContent = `ISA*00*          *00*          *ZZ*SERENITY001   *ZZ*CLEARING001   *251103*1530*U*00401*000000001*0*:*~
GS*HC*SERENITY001*CLEARING001*20251103*1530*1*X*004010~
ST*837*0001~
BHT*0019*00*1234567890*20251103*1530*CH~
NM1*41*2*SERENITY CARE PARTNERS*****46*123456789~
PER*IC*GLORIA CEO*TE*9375551234~
NM1*40*2*OHIO MEDICAID*****46*987654321~
HL*1**20*1~
NM1*85*2*SERENITY CARE PARTNERS*****XX*1234567890~
SE*8*0001~
GE*1*1~
IEA*1*000000001~`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="claims_${claimsFileId}.837"`);
    res.send(fileContent);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/billing/dashboard
 * Get billing dashboard metrics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { period = '30' } = req.query; // Last 30 days by default

    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';
    const daysBack = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const endDate = new Date();

    // Get claims readiness report
    const report = await claimsGateService.getClaimsReadinessReport(startDate, endDate, organizationId);

    // TODO: Get additional billing metrics
    // - Claims submitted vs accepted
    // - Denial rate
    // - Revenue by service code
    // - Outstanding AR
    // - Collections rate

    const dashboard = {
      period: {
        days: daysBack,
        startDate: report.startDate,
        endDate: report.endDate
      },
      claimsReadiness: {
        billableVisits: report.billableVisits,
        blockedVisits: report.blockedVisits,
        billablePercentage: report.billablePercentage,
        topBlockReasons: Object.entries(report.blockReasons)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([reason, count]) => ({ reason, count }))
      },
      revenue: {
        estimated: report.estimatedRevenue.billable,
        atRisk: report.estimatedRevenue.blocked,
        total: report.estimatedRevenue.total
      },
      // Mock additional metrics
      claims: {
        submitted: 145,
        accepted: 138,
        rejected: 7,
        pending: 12,
        acceptanceRate: 95.2
      },
      denials: {
        count: 7,
        denialRate: 4.8,
        topReasons: [
          { code: 'B7', description: 'Invalid authorization', count: 3 },
          { code: 'M80', description: 'Missing signature', count: 2 },
          { code: 'CO-16', description: 'Lack of medical necessity', count: 2 }
        ]
      },
      accountsReceivable: {
        outstanding: 125000,
        aging: {
          '0-30': 85000,
          '31-60': 25000,
          '61-90': 10000,
          '90+': 5000
        }
      }
    };

    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

export default router;
