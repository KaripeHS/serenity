/**
 * Clinical Routes
 * API endpoints for care plans, medical info, and clinical data
 * Supports both Mobile App and Console
 *
 * @module api/routes/clinical
 */
import { Router, Request, Response, NextFunction } from 'express';
import { clinicalService, CARE_TASK_TEMPLATES } from '../../services/clinical.service';
import { createLogger } from '../../utils/logger';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { ApiErrors } from '../middleware/error-handler';

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

/**
 * GET /api/clinical/task-templates
 * Get care task templates (for building care plans)
 */
router.get('/task-templates', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const templates = clinicalService.getCareTaskTemplates(category as string);

    res.json({
      success: true,
      category: category || 'all',
      templates,
      categories: Object.keys(CARE_TASK_TEMPLATES).map(k => k.toLowerCase()),
    });
  } catch (error) {
    logger.error('Failed to get task templates', { error });
    res.status(500).json({ error: 'Failed to get task templates' });
  }
});

/**
 * GET /api/clinical/intake-checklist
 * Get client intake checklist
 */
router.get('/intake-checklist', async (_req: Request, res: Response) => {
  try {
    const checklist = clinicalService.getIntakeChecklist();
    res.json({
      success: true,
      checklist,
    });
  } catch (error) {
    logger.error('Failed to get intake checklist', { error });
    res.status(500).json({ error: 'Failed to get intake checklist' });
  }
});

// Protected routes (require authentication)
router.use(requireAuth);

/**
 * GET /api/clinical/clients/:clientId/care-plan
 * Get full care plan for a client
 */
router.get('/clients/:clientId/care-plan', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params;
    const carePlan = await clinicalService.getCarePlan(clientId);

    if (!carePlan) {
      res.json({
        success: true,
        carePlan: null,
        message: 'No active care plan found',
      });
      return;
    }

    res.json({
      success: true,
      carePlan,
    });
  } catch (error) {
    logger.error('Failed to get care plan', { error });
    next(error);
  }
});

/**
 * POST /api/clinical/clients/:clientId/care-plan
 * Create a new care plan
 */
router.post('/clients/:clientId/care-plan', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params;
    const { goals, tasks, specialInstructions, preferences, emergencyProcedures } = req.body;

    if (!req.user?.organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const carePlanId = await clinicalService.createCarePlan(
      clientId,
      req.user.organizationId,
      { goals, tasks, specialInstructions, preferences, emergencyProcedures },
      req.user.userId
    );

    res.status(201).json({
      success: true,
      carePlanId,
      message: 'Care plan created successfully',
    });
  } catch (error) {
    logger.error('Failed to create care plan', { error });
    next(error);
  }
});

/**
 * PUT /api/clinical/care-plans/:carePlanId
 * Update a care plan
 */
router.put('/care-plans/:carePlanId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { carePlanId } = req.params;
    const { goals, tasks, specialInstructions, preferences, emergencyProcedures } = req.body;

    await clinicalService.updateCarePlan(
      carePlanId,
      { goals, tasks, specialInstructions, preferences, emergencyProcedures },
      req.user?.userId
    );

    res.json({
      success: true,
      message: 'Care plan updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update care plan', { error });
    next(error);
  }
});

/**
 * PUT /api/clinical/clients/:clientId/medical-info
 * Update client medical info
 */
router.put('/clients/:clientId/medical-info', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params;
    const { allergies, diagnoses, medications, physicianName, physicianPhone } = req.body;

    await clinicalService.updateMedicalInfo(
      clientId,
      { allergies, diagnoses, medications, physicianName, physicianPhone },
      req.user?.userId
    );

    res.json({
      success: true,
      message: 'Medical info updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update medical info', { error });
    next(error);
  }
});

/**
 * POST /api/clinical/visits/:visitId/tasks
 * Document visit task completion
 */
router.post('/visits/:visitId/tasks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      throw ApiErrors.badRequest('Tasks must be an array');
    }

    await clinicalService.documentVisitTasks(
      visitId,
      tasks,
      req.user?.userId
    );

    res.json({
      success: true,
      message: 'Tasks documented successfully',
      taskCount: tasks.length,
    });
  } catch (error) {
    logger.error('Failed to document tasks', { error });
    next(error);
  }
});

/**
 * GET /api/clinical/clients/:clientId/intake-status
 * Get client intake completion status
 */
router.get('/clients/:clientId/intake-status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params;
    const intakeStatus = await clinicalService.validateIntake(clientId);

    res.json({
      success: true,
      clientId,
      ...intakeStatus,
    });
  } catch (error) {
    logger.error('Failed to get intake status', { error });
    next(error);
  }
});

export const clinicalRouter = router;
