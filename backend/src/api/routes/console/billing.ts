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
import { getPayrollExportService } from '../../../modules/billing/payroll-export.service';
import { PrivateBillingService } from '../../../modules/billing/private-billing.service';
import { BillingService } from '../../../modules/billing/billing.service';
import { getDbClient } from '../../../database/client';
import { AuditLogger } from '../../../audit/logger';

const router = Router();
const claimsGateService = getClaimsGateService();
const edi837Generator = getEDI837GeneratorService();
const payrollExportService = getPayrollExportService();

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
      if (!req.user?.permissions?.includes('force_claims_submission' as any)) {
        throw ApiErrors.forbidden('Force claims submission requires special permission');
      }

      // TODO: Log force submit to audit trail
      // await auditLog.create({
      //   userId: req.user.id,
      //   action: 'force_claims_submission',
      //   details: { visitIds, reason: req.body.forceReason || 'No reason provided' }
      // });

      console.log(`[CLAIMS] Force submit by ${req.user.userId} for ${visitIds.length} visits`);
    }

    // Generate claims file
    const claimsFileId = `claims-${Date.now()}`;
    const fileName = `claims_${new Date().toISOString().split('T')[0]}.${format}`;

    // Fetch real visit data for claims
    const requestVisits = await claimsGateService.getClaimsDataForEDI(visitIds);

    if (requestVisits.length === 0) {
      throw ApiErrors.badRequest('No valid visits found for claims generation');
    }

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
      requestVisits,
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
      createdBy: req.user?.userId,
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

/**
 * GET /api/console/billing/denials
 * Get denied claims list
 */
router.get('/denials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status = 'pending' } = req.query;

    // TODO: Query database for denials
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     d.*,
    //     c.first_name || ' ' || c.last_name as patient_name,
    //     cg.first_name || ' ' || cg.last_name as caregiver_name
    //   FROM denials d
    //   JOIN claims cl ON cl.id = d.claim_id
    //   JOIN evv_records e ON e.id = cl.visit_id
    //   JOIN clients c ON c.id = e.client_id
    //   JOIN caregivers cg ON cg.id = e.caregiver_id
    //   WHERE d.status = $1
    //   ORDER BY d.denial_date DESC
    // `, [status]);

    // Mock denials
    const mockDenials = [
      {
        id: 'denial-001',
        claimId: 'claim-101',
        visitId: 'evv-001',
        patientName: 'Margaret Johnson',
        caregiverName: 'Mary Smith',
        serviceDate: '2025-10-15',
        serviceCode: 'T1019',
        billableUnits: 8,
        claimAmount: 200.00,
        denialCode: 'CO-16',
        denialReason: 'Claim lacks information needed for adjudication',
        denialDate: '2025-10-25',
        status: 'pending',
        daysOld: 9
      },
      {
        id: 'denial-002',
        claimId: 'claim-102',
        visitId: 'evv-002',
        patientName: 'Robert Williams',
        caregiverName: 'John Doe',
        serviceDate: '2025-10-16',
        serviceCode: 'S5125',
        billableUnits: 6,
        claimAmount: 168.00,
        denialCode: 'B7',
        denialReason: 'Provider not certified/eligible on this date',
        denialDate: '2025-10-26',
        status: 'pending',
        daysOld: 8
      }
    ];

    const mockSummary = [
      {
        code: 'CO-16',
        description: 'Claim lacks information',
        count: 5,
        totalAmount: 1000.00,
        recommendedAction: 'Add missing authorization number'
      },
      {
        code: 'B7',
        description: 'Provider not certified',
        count: 3,
        totalAmount: 504.00,
        recommendedAction: 'Verify caregiver credentials are current'
      }
    ];

    res.json({
      denials: mockDenials,
      summary: mockSummary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/billing/denials/:id/resubmit
 * Resubmit corrected claim
 */
router.put('/denials/:id/resubmit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { correctionNotes, visitId } = req.body;

    if (!correctionNotes || !visitId) {
      throw ApiErrors.badRequest('correctionNotes and visitId are required');
    }

    // TODO: Update denial record and regenerate claim
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE denials
    //   SET status = 'corrected', correction_notes = $1, corrected_at = NOW()
    //   WHERE id = $2
    // `, [correctionNotes, id]);

    // Re-validate visit through claims gate
    const validation = await claimsGateService.validateClaimReadiness(visitId);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        message: 'Claim still has validation errors'
      });
    }

    // TODO: Generate new claim file and submit
    console.log(`[BILLING] Resubmitting corrected claim for denial ${id}`);

    res.json({
      success: true,
      message: 'Claim resubmitted successfully',
      denialId: id,
      newClaimId: `claim-resubmit-${Date.now()}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/billing/denials/:id/appeal
 * Submit appeal for denied claim
 */
router.post('/denials/:id/appeal', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { appealLetter, appealDate } = req.body;

    if (!appealLetter) {
      throw ApiErrors.badRequest('appealLetter is required');
    }

    // TODO: Save appeal to database
    // const db = DatabaseClient.getInstance();
    // const appealId = uuidv4();
    // await db.query(`
    //   INSERT INTO appeals (id, denial_id, appeal_letter, appeal_date, status, created_by, created_at)
    //   VALUES ($1, $2, $3, $4, 'submitted', $5, NOW())
    // `, [appealId, id, appealLetter, appealDate, req.user?.id]);
    //
    // await db.query(`
    //   UPDATE denials
    //   SET status = 'appealed', appealed_at = NOW()
    //   WHERE id = $1
    // `, [id]);

    console.log(`[BILLING] Appeal submitted for denial ${id}`);

    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      denialId: id,
      appealId: `appeal-${Date.now()}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/billing/payroll/report
 * Generate payroll report for date range
 */
router.get('/payroll/report', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const report = await payrollExportService.generatePayrollReport(start, end, organizationId);

    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/billing/payroll/export
 * Export payroll as CSV
 */
router.get('/payroll/export', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    if (!startDate || !endDate) {
      throw ApiErrors.badRequest('startDate and endDate are required');
    }

    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw ApiErrors.badRequest('Invalid date format');
    }

    // Generate report
    const report = await payrollExportService.generatePayrollReport(start, end, organizationId);

    // Export in requested format
    let csvContent: string;
    let filename: string;

    if (format === 'adp') {
      csvContent = await payrollExportService.exportAsADP(report);
      filename = `payroll_adp_${report.payPeriodStart}_${report.payPeriodEnd}.csv`;
    } else if (format === 'gusto') {
      csvContent = await payrollExportService.exportAsGusto(report);
      filename = `payroll_gusto_${report.payPeriodStart}_${report.payPeriodEnd}.csv`;
    } else {
      csvContent = await payrollExportService.exportAsCSV(report);
      filename = `payroll_${report.payPeriodStart}_${report.payPeriodEnd}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/billing/private/package
 * Download billing package (Invoice + Visit Logs) for private pay claims
 */
router.get('/private/package', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { claimIds } = req.query;

    if (!claimIds) {
      throw ApiErrors.badRequest('claimIds are required');
    }

    const ids = (claimIds as string).split(',');

    // Initialize services
    const db = getDbClient();
    const auditLogger = new AuditLogger('billing-api');
    const billingService = new BillingService(db, auditLogger);
    const privateBillingService = new PrivateBillingService(db, billingService);

    const zipStream = await privateBillingService.generateBillingPackage(ids, {
      userId: req.user?.userId || 'system',
      organizationId: req.user?.organizationId || '00000000-0000-0000-0000-000000000001',
      role: (req.user?.role || 'admin') as any,
      permissions: [],
      attributes: [],
      sessionId: 'system',
      ipAddress: '127.0.0.1',
      userAgent: 'system'
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="billing_package_${new Date().toISOString().split('T')[0]}.zip"`);

    zipStream.pipe(res);

  } catch (error) {
    next(error);
  }
});
/**
 * GET /api/console/billing/batches
 * Get list of claim batches
 */
router.get('/batches', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const db = getDbClient();

    let query = `
      SELECT *
      FROM claims_batches
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const result = await db.query(query, params);

    res.json(result.rows.map(row => ({
      id: row.id,
      batchNumber: row.batch_number,
      totalClaims: row.claim_count,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      createdDate: row.created_at,
      submissionDate: row.submission_date,
      payer: row.payer_name,
      // For now, empty claims array as details are fetched separately
      claims: []
    })));
  } catch (error) {
    next(error);
  }
});

export default router;
