/**
 * Training Routes
 * API endpoints for training management and compliance tracking
 *
 * @module api/routes/console/training
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { trainingService } from '../../../services/training.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('training-routes');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/training/types
 * Get all available training types
 */
router.get('/types', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const types = await trainingService.getTrainingTypes(organizationId);

    res.json({
      success: true,
      types,
      count: types.length,
    });
  } catch (error) {
    logger.error('Failed to get training types', { error });
    next(error);
  }
});

/**
 * GET /api/console/training/assignments
 * Get all training assignments (admin view)
 */
router.get('/assignments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, category, overdue, userId } = req.query;

    const assignments = await trainingService.getAllAssignments(organizationId, {
      status: status as string,
      category: category as string,
      overdue: overdue === 'true',
      userId: userId as string,
    });

    res.json({
      success: true,
      assignments,
      count: assignments.length,
      summary: {
        overdue: assignments.filter(a => a.complianceStatus === 'overdue').length,
        dueSoon: assignments.filter(a => a.complianceStatus === 'due_soon').length,
        compliant: assignments.filter(a => a.complianceStatus === 'compliant').length,
        pending: assignments.filter(a => a.complianceStatus === 'pending').length,
      },
    });
  } catch (error) {
    logger.error('Failed to get training assignments', { error });
    next(error);
  }
});

/**
 * GET /api/console/training/my-assignments
 * Get current user's training assignments
 */
router.get('/my-assignments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Authentication required');
    }

    const assignments = await trainingService.getUserAssignments(organizationId, userId);

    res.json({
      success: true,
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    logger.error('Failed to get user training assignments', { error });
    next(error);
  }
});

/**
 * GET /api/console/training/users/:userId/assignments
 * Get training assignments for a specific user
 */
router.get('/users/:userId/assignments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { userId } = req.params;

    const assignments = await trainingService.getUserAssignments(organizationId, userId);

    res.json({
      success: true,
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    logger.error('Failed to get user training assignments', { error });
    next(error);
  }
});

/**
 * POST /api/console/training/assign
 * Assign training to a user
 */
router.post('/assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const assignedBy = req.user?.userId;
    if (!organizationId || !assignedBy) {
      throw ApiErrors.unauthorized('Authentication required');
    }

    const { userId, trainingTypeId, dueDate, priority, notes } = req.body;

    if (!userId || !trainingTypeId || !dueDate) {
      throw ApiErrors.badRequest('userId, trainingTypeId, and dueDate are required');
    }

    const assignment = await trainingService.assignTraining(
      organizationId,
      { userId, trainingTypeId, dueDate, priority, notes },
      assignedBy
    );

    res.status(201).json({
      success: true,
      assignment,
      message: 'Training assigned successfully',
    });
  } catch (error) {
    logger.error('Failed to assign training', { error });
    next(error);
  }
});

/**
 * POST /api/console/training/bulk-assign
 * Bulk assign training to multiple users
 */
router.post('/bulk-assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const assignedBy = req.user?.userId;
    if (!organizationId || !assignedBy) {
      throw ApiErrors.unauthorized('Authentication required');
    }

    const { userIds, trainingTypeId, dueDate, priority } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw ApiErrors.badRequest('userIds array is required');
    }

    if (!trainingTypeId || !dueDate) {
      throw ApiErrors.badRequest('trainingTypeId and dueDate are required');
    }

    const result = await trainingService.bulkAssignTraining(
      organizationId,
      { userIds, trainingTypeId, dueDate, priority },
      assignedBy
    );

    res.status(201).json({
      success: true,
      ...result,
      message: `Assigned training to ${result.assigned} users (${result.skipped} skipped)`,
    });
  } catch (error) {
    logger.error('Failed to bulk assign training', { error });
    next(error);
  }
});

/**
 * PUT /api/console/training/assignments/:id/status
 * Update assignment status (start, complete, verify)
 */
router.put('/assignments/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { status, score, notes, verifyCompletion } = req.body;

    if (!status) {
      throw ApiErrors.badRequest('status is required');
    }

    const validStatuses = ['assigned', 'in_progress', 'completed', 'failed', 'waived'];
    if (!validStatuses.includes(status)) {
      throw ApiErrors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const assignment = await trainingService.updateAssignmentStatus(
      organizationId,
      id,
      {
        status,
        score,
        notes,
        verifiedBy: verifyCompletion ? currentUserId : undefined,
      }
    );

    res.json({
      success: true,
      assignment,
      message: `Training status updated to ${status}`,
    });
  } catch (error) {
    logger.error('Failed to update assignment status', { error });
    next(error);
  }
});

/**
 * GET /api/console/training/compliance
 * Get training compliance report
 */
router.get('/compliance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const report = await trainingService.getComplianceReport(organizationId);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error('Failed to get compliance report', { error });
    next(error);
  }
});

/**
 * GET /api/console/training/expiring
 * Get training that will expire soon
 */
router.get('/expiring', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { days } = req.query;
    const daysAhead = days ? parseInt(days as string) : 60;

    const expiring = await trainingService.getExpiringTraining(organizationId, daysAhead);

    res.json({
      success: true,
      assignments: expiring,
      count: expiring.length,
      lookAheadDays: daysAhead,
    });
  } catch (error) {
    logger.error('Failed to get expiring training', { error });
    next(error);
  }
});

/**
 * GET /api/console/training/dashboard
 * Get training dashboard summary
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [report, expiring] = await Promise.all([
      trainingService.getComplianceReport(organizationId),
      trainingService.getExpiringTraining(organizationId, 30),
    ]);

    res.json({
      success: true,
      dashboard: {
        complianceRate: report.complianceRate,
        totalEmployees: report.totalEmployees,
        compliant: report.compliantCount,
        overdue: report.overdueCount,
        dueSoon: report.dueSoonCount,
        expiringIn30Days: expiring.length,
        byCategory: report.byCategory,
        topIssues: report.byTraining
          .filter(t => t.overdue > 0)
          .slice(0, 5),
      },
    });
  } catch (error) {
    logger.error('Failed to get training dashboard', { error });
    next(error);
  }
});

export default router;
