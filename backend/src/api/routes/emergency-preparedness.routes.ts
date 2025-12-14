/**
 * Emergency Preparedness Routes
 * API endpoints for disaster recovery planning and DR testing
 * Compliance: OAC 173-39-02.6 - Emergency Preparedness
 *
 * @module api/routes/emergency-preparedness
 */
import { Router, Response, NextFunction } from 'express';
import emergencyPreparednessService from '../../services/emergency-preparedness.service';
import { createLogger } from '../../utils/logger';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/authorization';

const router = Router();
const logger = createLogger('emergency-preparedness-api');

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// Disaster Recovery Plan Management
// ============================================================================

/**
 * POST /api/emergency/drp
 * Create a new disaster recovery plan
 * Roles: administrator, compliance_officer
 */
router.post('/drp', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      planVersion,
      planName,
      effectiveDate,
      expirationDate,
      nextReviewDate,
      disasterTypes,
      rtoHours,
      rpoHours,
      emergencyContacts,
      onCallSchedule,
      clientNotificationProcedure,
      staffNotificationProcedure,
      payerNotificationProcedure,
      familyNotificationProcedure,
      serviceContinuityPlan,
      criticalFunctions,
      backupProcedures,
      alternativeCareArrangements,
      itRecoveryPlan,
      dataBackupFrequency,
      backupLocation,
      systemRestorationSteps,
      emergencySuppliesList,
      emergencyFundAmount,
      distributionList
    } = req.body;

    if (!planVersion || !nextReviewDate) {
      res.status(400).json({ error: 'Missing required fields: planVersion, nextReviewDate' });
      return;
    }

    const drp = await emergencyPreparednessService.createDRP(
      {
        planVersion,
        planName,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        nextReviewDate: new Date(nextReviewDate),
        disasterTypes,
        rtoHours,
        rpoHours,
        emergencyContacts,
        onCallSchedule,
        clientNotificationProcedure,
        staffNotificationProcedure,
        payerNotificationProcedure,
        familyNotificationProcedure,
        serviceContinuityPlan,
        criticalFunctions,
        backupProcedures,
        alternativeCareArrangements,
        itRecoveryPlan,
        dataBackupFrequency,
        backupLocation,
        systemRestorationSteps,
        emergencySuppliesList,
        emergencyFundAmount,
        distributionList
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'Disaster recovery plan created successfully',
      drp
    });
  } catch (error) {
    logger.error('Failed to create DRP', error);
    next(error);
  }
});

/**
 * GET /api/emergency/drp/active
 * Get the active disaster recovery plan
 * Roles: All authenticated users
 */
router.get('/drp/active', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const drp = await emergencyPreparednessService.getActiveDRP(req.userContext!.organizationId);

    if (!drp) {
      res.status(404).json({
        success: false,
        error: 'No active disaster recovery plan found'
      });
      return;
    }

    res.json({
      success: true,
      drp
    });
  } catch (error) {
    logger.error('Failed to get active DRP', error);
    next(error);
  }
});

/**
 * GET /api/emergency/drp/:planId
 * Get a specific disaster recovery plan
 * Roles: administrator, compliance_officer, clinical_director
 */
router.get('/drp/:planId', requireRoles(['administrator', 'compliance_officer', 'clinical_director']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    const drp = await emergencyPreparednessService.getDRP(planId);

    if (!drp) {
      res.status(404).json({
        success: false,
        error: 'Disaster recovery plan not found'
      });
      return;
    }

    res.json({
      success: true,
      drp
    });
  } catch (error) {
    logger.error('Failed to get DRP', error);
    next(error);
  }
});

/**
 * PUT /api/emergency/drp/:planId
 * Update a disaster recovery plan
 * Roles: administrator, compliance_officer
 */
router.put('/drp/:planId', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    const drp = await emergencyPreparednessService.updateDRP(planId, req.body, req.userContext!);

    res.json({
      success: true,
      message: 'Disaster recovery plan updated successfully',
      drp
    });
  } catch (error) {
    logger.error('Failed to update DRP', error);
    next(error);
  }
});

/**
 * POST /api/emergency/drp/:planId/approve
 * Approve and activate a disaster recovery plan
 * Roles: administrator
 */
router.post('/drp/:planId/approve', requireRoles(['administrator']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    const drp = await emergencyPreparednessService.approveDRP(planId, req.userContext!);

    res.json({
      success: true,
      message: 'Disaster recovery plan approved and activated successfully',
      drp
    });
  } catch (error) {
    logger.error('Failed to approve DRP', error);
    next(error);
  }
});

/**
 * GET /api/emergency/drp
 * Get all disaster recovery plans
 * Roles: administrator, compliance_officer
 */
router.get('/drp', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const filters: any = {};
    if (status) filters.status = status as string;

    const plans = await emergencyPreparednessService.getAllDRPs(req.userContext!.organizationId, filters);

    res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    logger.error('Failed to get DRPs', error);
    next(error);
  }
});

// ============================================================================
// DR Testing
// ============================================================================

/**
 * POST /api/emergency/dr-tests
 * Log a new DR test
 * Roles: administrator, compliance_officer, clinical_director
 */
router.post('/dr-tests', requireRoles(['administrator', 'compliance_officer', 'clinical_director']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      planId,
      testDate,
      testType,
      testScenario,
      testCoordinatorId,
      participants,
      testObjectives,
      successCriteria
    } = req.body;

    if (!planId || !testDate || !testType || !testScenario) {
      res.status(400).json({ error: 'Missing required fields: planId, testDate, testType, testScenario' });
      return;
    }

    const drTest = await emergencyPreparednessService.logDRTest(
      {
        planId,
        testDate: new Date(testDate),
        testType,
        testScenario,
        testCoordinatorId: testCoordinatorId || req.userContext!.userId,
        participants,
        testObjectives,
        successCriteria
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'DR test logged successfully',
      drTest
    });
  } catch (error) {
    logger.error('Failed to log DR test', error);
    next(error);
  }
});

/**
 * POST /api/emergency/dr-tests/:testId/complete
 * Complete a DR test with results
 * Roles: administrator, compliance_officer, clinical_director
 */
router.post('/dr-tests/:testId/complete', requireRoles(['administrator', 'compliance_officer', 'clinical_director']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params;
    const {
      startTime,
      endTime,
      durationMinutes,
      testResults,
      passed,
      gapsIdentified,
      strengthsIdentified,
      lessonsLearned,
      correctiveActions,
      planUpdatesRequired,
      nextTestRecommendedDate,
      followUpNotes
    } = req.body;

    if (typeof passed !== 'boolean') {
      res.status(400).json({ error: 'Missing required field: passed (boolean)' });
      return;
    }

    const drTest = await emergencyPreparednessService.completeDRTest(
      testId,
      {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        durationMinutes,
        testResults,
        passed,
        gapsIdentified,
        strengthsIdentified,
        lessonsLearned,
        correctiveActions,
        planUpdatesRequired,
        nextTestRecommendedDate: nextTestRecommendedDate ? new Date(nextTestRecommendedDate) : undefined,
        followUpNotes
      },
      req.userContext!
    );

    res.json({
      success: true,
      message: 'DR test completed successfully',
      drTest
    });
  } catch (error) {
    logger.error('Failed to complete DR test', error);
    next(error);
  }
});

/**
 * GET /api/emergency/dr-tests
 * Get DR test history
 * Roles: administrator, compliance_officer, clinical_director
 */
router.get('/dr-tests', requireRoles(['administrator', 'compliance_officer', 'clinical_director']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.query;

    if (!planId) {
      res.status(400).json({ error: 'Missing required query parameter: planId' });
      return;
    }

    const drTests = await emergencyPreparednessService.getDRTestHistory(planId as string);

    res.json({
      success: true,
      count: drTests.length,
      drTests
    });
  } catch (error) {
    logger.error('Failed to get DR test history', error);
    next(error);
  }
});

// ============================================================================
// Emergency Contacts
// ============================================================================

/**
 * POST /api/emergency/contacts
 * Add an emergency contact
 * Roles: administrator, compliance_officer
 */
router.post('/contacts', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      contactName,
      contactRole,
      contactType,
      primaryPhone,
      secondaryPhone,
      email,
      address,
      available247,
      availableHours,
      priorityLevel,
      useCases
    } = req.body;

    if (!contactName || !contactRole || !primaryPhone) {
      res.status(400).json({ error: 'Missing required fields: contactName, contactRole, primaryPhone' });
      return;
    }

    const contact = await emergencyPreparednessService.addEmergencyContact(
      {
        contactName,
        contactRole,
        contactType,
        primaryPhone,
        secondaryPhone,
        email,
        address,
        available247,
        availableHours,
        priorityLevel,
        useCases
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      contact
    });
  } catch (error) {
    logger.error('Failed to add emergency contact', error);
    next(error);
  }
});

/**
 * GET /api/emergency/contacts
 * Get all emergency contacts
 * Roles: All authenticated users
 */
router.get('/contacts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { activeOnly } = req.query;
    const contacts = await emergencyPreparednessService.getEmergencyContacts(
      req.userContext!.organizationId,
      activeOnly === 'true'
    );

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    logger.error('Failed to get emergency contacts', error);
    next(error);
  }
});

/**
 * PUT /api/emergency/contacts/:contactId
 * Update an emergency contact
 * Roles: administrator, compliance_officer
 */
router.put('/contacts/:contactId', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;
    const contact = await emergencyPreparednessService.updateEmergencyContact(contactId, req.body, req.userContext!);

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      contact
    });
  } catch (error) {
    logger.error('Failed to update emergency contact', error);
    next(error);
  }
});

/**
 * DELETE /api/emergency/contacts/:contactId
 * Deactivate an emergency contact
 * Roles: administrator, compliance_officer
 */
router.delete('/contacts/:contactId', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;
    await emergencyPreparednessService.deactivateEmergencyContact(contactId, req.userContext!);

    res.json({
      success: true,
      message: 'Emergency contact deactivated successfully'
    });
  } catch (error) {
    logger.error('Failed to deactivate emergency contact', error);
    next(error);
  }
});

// ============================================================================
// Emergency Incidents
// ============================================================================

/**
 * POST /api/emergency/incidents
 * Report a major emergency incident
 * Roles: All authenticated users
 */
router.post('/incidents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      incidentNumber,
      emergencyType,
      severity,
      startTime,
      servicesAffected,
      clientsAffected,
      staffAffected,
      systemsAffected,
      drpActivated
    } = req.body;

    if (!emergencyType || !severity || !startTime) {
      res.status(400).json({ error: 'Missing required fields: emergencyType, severity, startTime' });
      return;
    }

    const incident = await emergencyPreparednessService.reportEmergencyIncident(
      {
        incidentNumber,
        emergencyType,
        severity,
        startTime: new Date(startTime),
        servicesAffected,
        clientsAffected,
        staffAffected,
        systemsAffected,
        drpActivated
      },
      req.userContext!
    );

    res.status(201).json({
      success: true,
      message: 'Emergency incident reported successfully',
      incident
    });
  } catch (error) {
    logger.error('Failed to report emergency incident', error);
    next(error);
  }
});

/**
 * GET /api/emergency/incidents
 * Get emergency incidents
 * Roles: administrator, compliance_officer, clinical_director
 */
router.get('/incidents', requireRoles(['administrator', 'compliance_officer', 'clinical_director']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, severity } = req.query;
    const filters: any = {};
    if (status) filters.status = status as string;
    if (severity) filters.severity = severity as string;

    const incidents = await emergencyPreparednessService.getEmergencyIncidents(req.userContext!.organizationId, filters);

    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (error) {
    logger.error('Failed to get emergency incidents', error);
    next(error);
  }
});

/**
 * PUT /api/emergency/incidents/:incidentId
 * Update an emergency incident
 * Roles: administrator, compliance_officer, clinical_director
 */
router.put('/incidents/:incidentId', requireRoles(['administrator', 'compliance_officer', 'clinical_director']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { incidentId } = req.params;
    const incident = await emergencyPreparednessService.updateEmergencyIncident(incidentId, req.body, req.userContext!);

    res.json({
      success: true,
      message: 'Emergency incident updated successfully',
      incident
    });
  } catch (error) {
    logger.error('Failed to update emergency incident', error);
    next(error);
  }
});

// ============================================================================
// Compliance & Alerts
// ============================================================================

/**
 * GET /api/emergency/compliance
 * Check emergency preparedness compliance status
 * Roles: administrator, compliance_officer
 */
router.get('/compliance', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const compliance = await emergencyPreparednessService.checkCompliance(req.userContext!.organizationId);

    res.json({
      success: true,
      compliance
    });
  } catch (error) {
    logger.error('Failed to check compliance', error);
    next(error);
  }
});

/**
 * POST /api/emergency/send-review-reminders
 * Manually trigger DRP review reminders
 * Roles: administrator, compliance_officer
 */
router.post('/send-review-reminders', requireRoles(['administrator', 'compliance_officer']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const remindersSent = await emergencyPreparednessService.sendDRPReviewReminders(req.userContext!.organizationId, req.userContext!);

    res.json({
      success: true,
      message: 'DRP review reminders sent successfully',
      remindersSent
    });
  } catch (error) {
    logger.error('Failed to send DRP review reminders', error);
    next(error);
  }
});

export const emergencyPreparednessRouter = router;
