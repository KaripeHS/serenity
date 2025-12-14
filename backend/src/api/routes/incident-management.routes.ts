/**
 * Incident Management Routes
 * API endpoints for critical incident tracking and 24-hour ODA reporting
 * Compliance: OAC 173-39-02.10 - Incident Reporting Requirements
 *
 * @module api/routes/incident-management
 */
import { Router, Response, NextFunction } from 'express';
import incidentManagementService from '../../services/incident-management.service';
import { createLogger } from '../../utils/logger';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/authorization';

const router = Router();
const logger = createLogger('incident-management-api');

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// Incident Management
// ============================================================================

/**
 * POST /api/incidents
 * Report a new incident
 * Roles: All authenticated users can report incidents
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      incidentType,
      severity,
      incidentDate,
      discoveryDate,
      clientId,
      caregiverId,
      witnessIds,
      location,
      description,
      immediateActionsTaken,
      injuriesSustained,
      medicalTreatmentRequired,
      medicalFacility
    } = req.body;

    if (!incidentType || !severity || !incidentDate || !discoveryDate || !location || !description) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const incident = await incidentManagementService.reportIncident(
      {
        incidentType,
        severity,
        incidentDate: new Date(incidentDate),
        discoveryDate: new Date(discoveryDate),
        clientId,
        caregiverId,
        witnessIds,
        location,
        description,
        immediateActionsTaken,
        injuriesSustained,
        medicalTreatmentRequired: medicalTreatmentRequired || false,
        medicalFacility
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      incident
    });
  } catch (error) {
    logger.error('Failed to report incident', error);
    next(error);
  }
});

/**
 * GET /api/incidents
 * Get incidents with filters
 * Roles: compliance_officer, clinical_director, administrator
 */
router.get('/', requireRoles(['compliance_officer', 'clinical_director', 'administrator', 'field_supervisor']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { severity, status, startDate, endDate, clientId, caregiverId } = req.query;

    const filters: any = {};
    if (severity) filters.severity = severity as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (clientId) filters.clientId = clientId as string;
    if (caregiverId) filters.caregiverId = caregiverId as string;

    const incidents = await incidentManagementService.getIncidents(req.userContext!.organizationId, filters);

    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (error) {
    logger.error('Failed to get incidents', error);
    next(error);
  }
});

/**
 * PUT /api/incidents/:incidentId
 * Update an incident
 * Roles: compliance_officer, clinical_director, administrator
 */
router.put('/:incidentId', requireRoles(['compliance_officer', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { incidentId } = req.params;
    const incident = await incidentManagementService.updateIncident(incidentId, req.body, req.userContext!);

    res.json({
      success: true,
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    logger.error('Failed to update incident', error);
    next(error);
  }
});

/**
 * POST /api/incidents/:incidentId/report-to-oda
 * Mark incident as reported to ODA
 * Roles: compliance_officer, clinical_director, administrator
 */
router.post('/:incidentId/report-to-oda', requireRoles(['compliance_officer', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { incidentId } = req.params;
    const { odaCaseNumber } = req.body;

    if (!odaCaseNumber) {
      res.status(400).json({ error: 'ODA case number is required' });
      return;
    }

    const incident = await incidentManagementService.reportToODA(incidentId, odaCaseNumber, req.userContext!);

    res.json({
      success: true,
      message: 'Incident reported to ODA successfully',
      incident
    });
  } catch (error) {
    logger.error('Failed to report incident to ODA', error);
    next(error);
  }
});

/**
 * GET /api/incidents/overdue
 * Get overdue incident reports
 * Roles: compliance_officer, clinical_director, administrator
 */
router.get('/overdue', requireRoles(['compliance_officer', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const overdueIncidents = await incidentManagementService.getOverdueIncidents(req.userContext!.organizationId);

    res.json({
      success: true,
      count: overdueIncidents.length,
      overdueIncidents
    });
  } catch (error) {
    logger.error('Failed to get overdue incidents', error);
    next(error);
  }
});

// ============================================================================
// Investigation Management
// ============================================================================

/**
 * POST /api/incidents/investigations/:investigationId/start
 * Start an investigation
 * Roles: compliance_officer, clinical_director, administrator
 */
router.post('/investigations/:investigationId/start', requireRoles(['compliance_officer', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { investigationId } = req.params;
    const { investigatorId } = req.body;

    const investigation = await incidentManagementService.startInvestigation(
      investigationId,
      investigatorId || req.userContext!.userId,
      req.userContext!
    );

    res.json({
      success: true,
      message: 'Investigation started successfully',
      investigation
    });
  } catch (error) {
    logger.error('Failed to start investigation', error);
    next(error);
  }
});

/**
 * POST /api/incidents/investigations/:investigationId/complete
 * Complete an investigation
 * Roles: compliance_officer, clinical_director, administrator
 */
router.post('/investigations/:investigationId/complete', requireRoles(['compliance_officer', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { investigationId } = req.params;
    const {
      rootCauseAnalysis,
      contributingFactors,
      timelineOfEvents,
      correctiveActions,
      preventiveMeasures,
      trainingRequired,
      policyUpdatesRequired,
      policyUpdates
    } = req.body;

    if (!rootCauseAnalysis || !contributingFactors || !correctiveActions) {
      res.status(400).json({ error: 'Missing required fields: rootCauseAnalysis, contributingFactors, correctiveActions' });
      return;
    }

    const investigation = await incidentManagementService.completeInvestigation(
      investigationId,
      {
        rootCauseAnalysis,
        contributingFactors,
        timelineOfEvents,
        correctiveActions,
        preventiveMeasures,
        trainingRequired,
        policyUpdatesRequired,
        policyUpdates
      },
      req.userContext!
    );

    res.json({
      success: true,
      message: 'Investigation completed successfully',
      investigation
    });
  } catch (error) {
    logger.error('Failed to complete investigation', error);
    next(error);
  }
});

/**
 * GET /api/incidents/investigations/pending
 * Get pending investigations
 * Roles: compliance_officer, clinical_director, administrator
 */
router.get('/investigations/pending', requireRoles(['compliance_officer', 'clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pendingInvestigations = await incidentManagementService.getPendingInvestigations(req.userContext!.organizationId);

    res.json({
      success: true,
      count: pendingInvestigations.length,
      pendingInvestigations
    });
  } catch (error) {
    logger.error('Failed to get pending investigations', error);
    next(error);
  }
});

/**
 * POST /api/incidents/send-deadline-alerts
 * Manually trigger deadline alerts
 * Roles: clinical_director, administrator
 */
router.post('/send-deadline-alerts', requireRoles(['clinical_director', 'administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alertsSent = await incidentManagementService.sendDeadlineAlerts(req.userContext!.organizationId, req.userContext!);

    res.json({
      success: true,
      message: 'Deadline alerts sent successfully',
      alertsSent
    });
  } catch (error) {
    logger.error('Failed to send deadline alerts', error);
    next(error);
  }
});

export const incidentManagementRouter = router;
