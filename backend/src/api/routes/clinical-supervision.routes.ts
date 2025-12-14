/**
 * Clinical Supervision Routes
 * API endpoints for RN/LPN supervisory visits and competency assessments
 * Compliance: OAC 173-39-02.11(C)(4) - Quarterly RN supervision requirement
 *
 * @module api/routes/clinical-supervision
 */
import { Router, Response, NextFunction } from 'express';
import clinicalSupervisionService from '../../services/clinical-supervision.service';
import { createLogger } from '../../utils/logger';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/authorization';

const router = Router();
const logger = createLogger('clinical-supervision-api');

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// Supervisory Visit Management
// ============================================================================

/**
 * POST /api/clinical-supervision/visits
 * Schedule a supervisory visit
 * Roles: rn, clinical_director, administrator, hr_manager
 */
router.post('/visits', requireRoles(['rn', 'clinical_director', 'administrator', 'hr_manager']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId, supervisorId, visitType, visitDate, visitLocation, clientId } = req.body;

    if (!caregiverId || !supervisorId || !visitType || !visitDate) {
      res.status(400).json({ error: 'Missing required fields: caregiverId, supervisorId, visitType, visitDate' });
      return;
    }

    const visit = await clinicalSupervisionService.scheduleVisit(
      {
        caregiverId,
        supervisorId,
        visitType,
        visitDate: new Date(visitDate),
        visitLocation,
        clientId
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'Supervisory visit scheduled successfully',
      visit
    });
  } catch (error) {
    logger.error('Failed to schedule supervisory visit', error);
    next(error);
  }
});

/**
 * PUT /api/clinical-supervision/visits/:visitId/complete
 * Complete a supervisory visit
 * Roles: rn, clinical_director, administrator
 */
router.put('/visits/:visitId/complete', requireRoles(['rn', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const {
      carePlanReviewed,
      policyComplianceReviewed,
      documentationReviewed,
      caregiverStrengths,
      areasForImprovement,
      actionItems,
      trainingRecommended,
      supervisorSignature,
      caregiverSignature,
      completionNotes
    } = req.body;

    if (!supervisorSignature) {
      res.status(400).json({ error: 'Supervisor signature is required' });
      return;
    }

    const visit = await clinicalSupervisionService.completeVisit(
      visitId,
      {
        carePlanReviewed: carePlanReviewed ?? false,
        policyComplianceReviewed: policyComplianceReviewed ?? false,
        documentationReviewed: documentationReviewed ?? false,
        caregiverStrengths,
        areasForImprovement,
        actionItems,
        trainingRecommended,
        supervisorSignature,
        caregiverSignature,
        completionNotes
      },
      req.userContext!
    );

    res.json({
      success: true,
      message: 'Supervisory visit completed successfully',
      visit
    });
  } catch (error) {
    logger.error('Failed to complete supervisory visit', error);
    next(error);
  }
});

/**
 * GET /api/clinical-supervision/caregivers/:caregiverId/visits
 * Get all supervisory visits for a caregiver
 * Roles: All authenticated users (with proper org filtering)
 */
router.get('/caregivers/:caregiverId/visits', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;
    const { startDate, endDate, visitType, status } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (visitType) filters.visitType = visitType as string;
    if (status) filters.status = status as string;

    const visits = await clinicalSupervisionService.getCaregiverVisits(caregiverId, filters);

    res.json({
      success: true,
      caregiverId,
      visitCount: visits.length,
      visits
    });
  } catch (error) {
    logger.error('Failed to get caregiver visits', error);
    next(error);
  }
});

// ============================================================================
// Competency Assessment Management
// ============================================================================

/**
 * POST /api/clinical-supervision/visits/:visitId/assessments
 * Add a competency assessment to a visit
 * Roles: rn, clinical_director, administrator
 */
router.post('/visits/:visitId/assessments', requireRoles(['rn', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const {
      competencyType,
      competencyCategory,
      competencyLevel,
      demonstrationObserved,
      demonstrationLocation,
      meetsStandard,
      requiresAdditionalTraining,
      requiresRemediation,
      notes,
      evidenceDocuments
    } = req.body;

    if (!competencyType || !competencyLevel || meetsStandard === undefined || requiresAdditionalTraining === undefined || requiresRemediation === undefined) {
      res.status(400).json({ error: 'Missing required fields: competencyType, competencyLevel, meetsStandard, requiresAdditionalTraining, requiresRemediation' });
      return;
    }

    const assessment = await clinicalSupervisionService.addCompetencyAssessment(
      visitId,
      {
        competencyType,
        competencyCategory,
        competencyLevel,
        demonstrationObserved: demonstrationObserved ?? false,
        demonstrationLocation,
        meetsStandard,
        requiresAdditionalTraining,
        requiresRemediation,
        notes,
        evidenceDocuments
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'Competency assessment added successfully',
      assessment
    });
  } catch (error) {
    logger.error('Failed to add competency assessment', error);
    next(error);
  }
});

/**
 * GET /api/clinical-supervision/caregivers/:caregiverId/competency-history
 * Get competency assessment history for a caregiver
 * Roles: rn, clinical_director, administrator, hr_manager
 */
router.get('/caregivers/:caregiverId/competency-history', requireRoles(['rn', 'clinical_director', 'administrator', 'hr_manager']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;
    const history = await clinicalSupervisionService.getCaregiverCompetencyHistory(caregiverId, req.userContext!);

    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    logger.error('Failed to get competency history', error);
    next(error);
  }
});

/**
 * GET /api/clinical-supervision/caregivers/:caregiverId/competency-compliance
 * Check if caregiver meets all required competencies
 * Roles: rn, clinical_director, administrator, hr_manager
 */
router.get('/caregivers/:caregiverId/competency-compliance', requireRoles(['rn', 'clinical_director', 'administrator', 'hr_manager']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { caregiverId } = req.params;
    const compliance = await clinicalSupervisionService.checkCaregiverCompetencyCompliance(caregiverId);

    res.json({
      success: true,
      caregiverId,
      ...compliance
    });
  } catch (error) {
    logger.error('Failed to check competency compliance', error);
    next(error);
  }
});

// ============================================================================
// Supervision Schedule Management
// ============================================================================

/**
 * GET /api/clinical-supervision/overdue-visits
 * Get all overdue supervisory visits for the organization
 * Roles: rn, clinical_director, administrator, hr_manager
 */
router.get('/overdue-visits', requireRoles(['rn', 'clinical_director', 'administrator', 'hr_manager']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const overdueVisits = await clinicalSupervisionService.getOverdueVisits(req.userContext!.organizationId);

    res.json({
      success: true,
      count: overdueVisits.length,
      overdueVisits
    });
  } catch (error) {
    logger.error('Failed to get overdue visits', error);
    next(error);
  }
});

/**
 * GET /api/clinical-supervision/upcoming-visits
 * Get upcoming supervisory visits (default: next 30 days)
 * Roles: rn, clinical_director, administrator, hr_manager
 */
router.get('/upcoming-visits', requireRoles(['rn', 'clinical_director', 'administrator', 'hr_manager']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { days } = req.query;
    const daysParam = days ? parseInt(days as string) : 30;

    const upcomingVisits = await clinicalSupervisionService.getUpcomingVisits(req.userContext!.organizationId, daysParam);

    res.json({
      success: true,
      days: daysParam,
      count: upcomingVisits.length,
      upcomingVisits
    });
  } catch (error) {
    logger.error('Failed to get upcoming visits', error);
    next(error);
  }
});

/**
 * POST /api/clinical-supervision/send-alerts
 * Manually trigger supervision alerts
 * Roles: clinical_director, administrator
 */
router.post('/send-alerts', requireRoles(['clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await clinicalSupervisionService.sendSupervisionAlerts(req.userContext!.organizationId, req.userContext!);

    res.json({
      success: true,
      message: 'Supervision alerts sent successfully',
      ...result
    });
  } catch (error) {
    logger.error('Failed to send supervision alerts', error);
    next(error);
  }
});

// ============================================================================
// Competency Standards Management
// ============================================================================

/**
 * GET /api/clinical-supervision/competency-standards
 * Get all competency standards (system-wide + organization-specific)
 * Roles: All authenticated users
 */
router.get('/competency-standards', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const standards = await clinicalSupervisionService.getCompetencyStandards(req.userContext!.organizationId);

    res.json({
      success: true,
      count: standards.length,
      standards
    });
  } catch (error) {
    logger.error('Failed to get competency standards', error);
    next(error);
  }
});

/**
 * GET /api/clinical-supervision/competency-standards/role/:role
 * Get required competencies for a specific role
 * Roles: rn, clinical_director, administrator, hr_manager
 */
router.get('/competency-standards/role/:role', requireRoles(['rn', 'clinical_director', 'administrator', 'hr_manager']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const standards = await clinicalSupervisionService.getRequiredCompetenciesForRole(role, req.userContext!.organizationId);

    res.json({
      success: true,
      role,
      count: standards.length,
      standards
    });
  } catch (error) {
    logger.error('Failed to get required competencies for role', error);
    next(error);
  }
});

export const clinicalSupervisionRouter = router;
