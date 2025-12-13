/**
 * Onboarding Routes
 * API endpoints for onboarding checklist management
 *
 * @module api/routes/console/onboarding
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { onboardingService } from '../../../services/onboarding.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('onboarding-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/onboarding/dashboard
 * Get onboarding dashboard with stats
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const [stats, activeOnboardings, myPendingItems] = await Promise.all([
      onboardingService.getOnboardingStats(organizationId),
      onboardingService.getOnboardingInstances(organizationId, { status: 'in_progress' }),
      onboardingService.getPendingItemsForUser(userId, organizationId),
    ]);

    res.json({
      success: true,
      stats,
      activeOnboardings: {
        items: activeOnboardings,
        count: activeOnboardings.length,
      },
      myPendingItems: {
        items: myPendingItems,
        count: myPendingItems.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get onboarding dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/onboarding/stats
 * Get onboarding statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await onboardingService.getOnboardingStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get onboarding stats', { error });
    next(error);
  }
});

// ============================================================
// TEMPLATES
// ============================================================

/**
 * GET /api/console/onboarding/templates
 * Get all onboarding templates
 */
router.get('/templates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const templates = await onboardingService.getTemplates(organizationId);

    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    logger.error('Failed to get onboarding templates', { error });
    next(error);
  }
});

/**
 * GET /api/console/onboarding/templates/:id
 * Get a specific template
 */
router.get('/templates/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const template = await onboardingService.getTemplateById(id, organizationId);

    if (!template) {
      throw ApiErrors.notFound('Template');
    }

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error('Failed to get onboarding template', { error });
    next(error);
  }
});

/**
 * POST /api/console/onboarding/templates
 * Create a new onboarding template
 */
router.post('/templates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { templateName, description, positionTypes, employmentTypes, items, defaultDurationDays } = req.body;

    if (!templateName || !items || !Array.isArray(items)) {
      throw ApiErrors.badRequest('templateName and items array are required');
    }

    const template = await onboardingService.createTemplate(
      organizationId,
      {
        templateName,
        description,
        positionTypes,
        employmentTypes,
        items,
        defaultDurationDays,
      },
      userId
    );

    logger.info('Onboarding template created', {
      templateId: template.id,
      name: templateName,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error('Failed to create onboarding template', { error });
    next(error);
  }
});

// ============================================================
// ONBOARDING INSTANCES
// ============================================================

/**
 * GET /api/console/onboarding
 * Get onboarding instances with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, position, healthStatus, fromStartDate, toStartDate } = req.query;

    const instances = await onboardingService.getOnboardingInstances(organizationId, {
      status: status as string,
      positionTitle: position as string,
      healthStatus: healthStatus as string,
      fromStartDate: fromStartDate as string,
      toStartDate: toStartDate as string,
    });

    res.json({
      success: true,
      onboardings: instances,
      count: instances.length,
    });
  } catch (error) {
    logger.error('Failed to get onboarding instances', { error });
    next(error);
  }
});

/**
 * GET /api/console/onboarding/my-items
 * Get pending items for current user
 */
router.get('/my-items', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const items = await onboardingService.getPendingItemsForUser(userId, organizationId);

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    logger.error('Failed to get my pending items', { error });
    next(error);
  }
});

/**
 * GET /api/console/onboarding/:id
 * Get a specific onboarding instance with all items
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const onboarding = await onboardingService.getOnboardingById(id, organizationId);

    if (!onboarding) {
      throw ApiErrors.notFound('Onboarding');
    }

    res.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    logger.error('Failed to get onboarding', { error });
    next(error);
  }
});

/**
 * GET /api/console/onboarding/:id/by-category
 * Get onboarding items grouped by category
 */
router.get('/:id/by-category', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const itemsByCategory = await onboardingService.getItemsByCategory(id, organizationId);

    res.json({
      success: true,
      onboardingId: id,
      categories: itemsByCategory,
    });
  } catch (error) {
    logger.error('Failed to get items by category', { error });
    next(error);
  }
});

/**
 * POST /api/console/onboarding
 * Create a new onboarding instance
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      templateId,
      employeeId,
      caregiverId,
      applicantId,
      newHireName,
      positionTitle,
      department,
      startDate,
      mentorId,
      supervisorId,
      hrContactId,
      customItems,
    } = req.body;

    if (!positionTitle || !startDate) {
      throw ApiErrors.badRequest('positionTitle and startDate are required');
    }

    if (!employeeId && !caregiverId && !applicantId) {
      throw ApiErrors.badRequest('One of employeeId, caregiverId, or applicantId is required');
    }

    const onboarding = await onboardingService.createOnboarding(
      organizationId,
      {
        templateId,
        employeeId,
        caregiverId,
        applicantId,
        newHireName,
        positionTitle,
        department,
        startDate,
        mentorId,
        supervisorId,
        hrContactId,
        customItems,
      },
      userId
    );

    logger.info('Onboarding created', {
      onboardingId: onboarding.id,
      position: positionTitle,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      onboarding,
    });
  } catch (error) {
    logger.error('Failed to create onboarding', { error });
    next(error);
  }
});

// ============================================================
// ONBOARDING ITEMS
// ============================================================

/**
 * PUT /api/console/onboarding/items/:itemId
 * Update an onboarding item
 */
router.put('/items/:itemId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { itemId } = req.params;
    const { status, completionNotes, documentUrl } = req.body;

    const item = await onboardingService.updateItem(
      itemId,
      organizationId,
      { status, completionNotes, documentUrl },
      userId
    );

    if (!item) {
      throw ApiErrors.notFound('Onboarding item');
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    logger.error('Failed to update onboarding item', { error });
    next(error);
  }
});

/**
 * POST /api/console/onboarding/items/:itemId/complete
 * Mark an item as complete
 */
router.post('/items/:itemId/complete', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { itemId } = req.params;
    const { notes, documentUrl } = req.body;

    const item = await onboardingService.completeItem(
      itemId,
      organizationId,
      userId,
      notes,
      documentUrl
    );

    if (!item) {
      throw ApiErrors.notFound('Onboarding item');
    }

    logger.info('Onboarding item completed', {
      itemId,
      completedBy: userId,
    });

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    logger.error('Failed to complete onboarding item', { error });
    next(error);
  }
});

/**
 * POST /api/console/onboarding/items/:itemId/skip
 * Skip an optional item
 */
router.post('/items/:itemId/skip', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { itemId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw ApiErrors.badRequest('reason is required');
    }

    const item = await onboardingService.skipItem(itemId, organizationId, reason, userId);

    if (!item) {
      throw ApiErrors.notFound('Onboarding item');
    }

    logger.info('Onboarding item skipped', {
      itemId,
      reason,
      skippedBy: userId,
    });

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    logger.error('Failed to skip onboarding item', { error });
    next(error);
  }
});

/**
 * POST /api/console/onboarding/items/:itemId/verify-document
 * Verify a document for an item
 */
router.post('/items/:itemId/verify-document', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { itemId } = req.params;
    const item = await onboardingService.verifyDocument(itemId, organizationId, userId);

    if (!item) {
      throw ApiErrors.notFound('Onboarding item');
    }

    logger.info('Document verified', {
      itemId,
      verifiedBy: userId,
    });

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    logger.error('Failed to verify document', { error });
    next(error);
  }
});

// ============================================================
// ONBOARDING STATUS
// ============================================================

/**
 * PUT /api/console/onboarding/:id/status
 * Update onboarding status
 */
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw ApiErrors.badRequest('status is required');
    }

    const onboarding = await onboardingService.updateOnboardingStatus(
      id,
      organizationId,
      status,
      status === 'completed' ? userId : undefined
    );

    if (!onboarding) {
      throw ApiErrors.notFound('Onboarding');
    }

    logger.info('Onboarding status updated', {
      onboardingId: id,
      status,
      updatedBy: userId,
    });

    res.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    logger.error('Failed to update onboarding status', { error });
    next(error);
  }
});

/**
 * POST /api/console/onboarding/:id/note
 * Add a note to onboarding
 */
router.post('/:id/note', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      throw ApiErrors.badRequest('note is required');
    }

    const timestamp = new Date().toISOString();
    const formattedNote = `[${timestamp}] ${req.user?.userId}: ${note}`;

    const onboarding = await onboardingService.addNote(id, organizationId, formattedNote);

    if (!onboarding) {
      throw ApiErrors.notFound('Onboarding');
    }

    res.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    logger.error('Failed to add note', { error });
    next(error);
  }
});

export default router;
