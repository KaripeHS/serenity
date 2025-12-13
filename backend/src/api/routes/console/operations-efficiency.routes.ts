/**
 * Operations Efficiency Routes
 * API endpoints for scheduling recommendations, travel optimization,
 * caregiver performance, and client satisfaction
 *
 * @module api/routes/console/operations-efficiency
 */
import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { schedulingRecommendationsService } from '../../../services/scheduling-recommendations.service';
import { travelOptimizationService } from '../../../services/travel-optimization.service';
import { caregiverPerformanceService } from '../../../services/caregiver-performance.service';
import { clientSatisfactionService } from '../../../services/client-satisfaction.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('operations-efficiency-routes');

// All routes require authentication
router.use(requireAuth);

// ============================================================
// SCHEDULING RECOMMENDATIONS
// ============================================================

/**
 * GET /api/console/operations/recommendations/dashboard
 * Get recommendations dashboard
 */
router.get('/recommendations/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await schedulingRecommendationsService.getDashboard(organizationId);

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    logger.error('Failed to get recommendations dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/recommendations
 * Get scheduling recommendations
 */
router.get('/recommendations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, type, priority } = req.query;

    const recommendations = await schedulingRecommendationsService.getRecommendations(organizationId, {
      status: status as string,
      type: type as string,
      priority: priority as string,
    });

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    logger.error('Failed to get recommendations', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/recommendations/:id
 * Get a specific recommendation
 */
router.get('/recommendations/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const recommendation = await schedulingRecommendationsService.getRecommendationById(id, organizationId);

    if (!recommendation) {
      throw ApiErrors.notFound('Recommendation');
    }

    res.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    logger.error('Failed to get recommendation', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/recommendations/:id/accept
 * Accept a recommendation
 */
router.post('/recommendations/:id/accept', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const recommendation = await schedulingRecommendationsService.acceptRecommendation(id, organizationId, userId);

    if (!recommendation) {
      throw ApiErrors.notFound('Recommendation');
    }

    res.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    logger.error('Failed to accept recommendation', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/recommendations/:id/reject
 * Reject a recommendation
 */
router.post('/recommendations/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { reason } = req.body;

    const recommendation = await schedulingRecommendationsService.rejectRecommendation(id, organizationId, userId, reason);

    if (!recommendation) {
      throw ApiErrors.notFound('Recommendation');
    }

    res.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    logger.error('Failed to reject recommendation', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/recommendations/generate
 * Generate new recommendations
 */
router.post('/recommendations/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const result = await schedulingRecommendationsService.generateAllRecommendations(organizationId);

    logger.info('Recommendations generated', {
      organizationId,
      ...result,
    });

    res.json({
      success: true,
      generated: result,
    });
  } catch (error) {
    logger.error('Failed to generate recommendations', { error });
    next(error);
  }
});

// ============================================================
// TRAVEL OPTIMIZATION
// ============================================================

/**
 * GET /api/console/operations/travel/stats
 * Get travel statistics
 */
router.get('/travel/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const stats = await travelOptimizationService.getTravelStats(organizationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get travel stats', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/travel/client-locations
 * Get all client locations
 */
router.get('/travel/client-locations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const locations = await travelOptimizationService.getClientLocations(organizationId);

    res.json({
      success: true,
      locations,
      count: locations.length,
    });
  } catch (error) {
    logger.error('Failed to get client locations', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/travel/client-location
 * Create or update client location
 */
router.post('/travel/client-location', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      clientId,
      addressType,
      streetAddress,
      apartment,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      accessInstructions,
      parkingNotes,
      gateCode,
    } = req.body;

    if (!clientId || !streetAddress || !city || !zipCode) {
      throw ApiErrors.badRequest('clientId, streetAddress, city, and zipCode are required');
    }

    const location = await travelOptimizationService.upsertClientLocation({
      clientId,
      addressType,
      streetAddress,
      apartment,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      accessInstructions,
      parkingNotes,
      gateCode,
    });

    res.json({
      success: true,
      location,
    });
  } catch (error) {
    logger.error('Failed to upsert client location', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/travel/caregiver-locations
 * Get all caregiver locations
 */
router.get('/travel/caregiver-locations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const locations = await travelOptimizationService.getCaregiverLocations(organizationId);

    res.json({
      success: true,
      locations,
      count: locations.length,
    });
  } catch (error) {
    logger.error('Failed to get caregiver locations', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/travel/caregiver-location
 * Create or update caregiver location
 */
router.post('/travel/caregiver-location', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      caregiverId,
      streetAddress,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      maxTravelDistanceMiles,
      preferredAreas,
      hasReliableTransportation,
      transportationType,
    } = req.body;

    if (!caregiverId || !streetAddress || !city || !zipCode) {
      throw ApiErrors.badRequest('caregiverId, streetAddress, city, and zipCode are required');
    }

    const location = await travelOptimizationService.upsertCaregiverLocation({
      caregiverId,
      streetAddress,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      maxTravelDistanceMiles,
      preferredAreas,
      hasReliableTransportation,
      transportationType,
    });

    res.json({
      success: true,
      location,
    });
  } catch (error) {
    logger.error('Failed to upsert caregiver location', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/travel/caregivers-in-range/:clientId
 * Find caregivers within range of a client
 */
router.get('/travel/caregivers-in-range/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { clientId } = req.params;
    const { maxDistance } = req.query;

    const caregivers = await travelOptimizationService.findCaregiversInRange(
      organizationId,
      clientId,
      maxDistance ? parseInt(maxDistance as string) : undefined
    );

    res.json({
      success: true,
      caregivers,
      count: caregivers.length,
    });
  } catch (error) {
    logger.error('Failed to find caregivers in range', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/travel/optimize-route
 * Optimize a route for a caregiver
 */
router.post('/travel/optimize-route', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId, clientIds } = req.body;

    if (!caregiverId || !clientIds || !Array.isArray(clientIds)) {
      throw ApiErrors.badRequest('caregiverId and clientIds array are required');
    }

    const result = await travelOptimizationService.optimizeRoute(caregiverId, clientIds);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to optimize route', { error });
    next(error);
  }
});

// ============================================================
// CAREGIVER PERFORMANCE
// ============================================================

/**
 * GET /api/console/operations/performance/dashboard
 * Get caregiver performance dashboard
 */
router.get('/performance/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await caregiverPerformanceService.getDashboard(organizationId);

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    logger.error('Failed to get performance dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/performance/leaderboard
 * Get performance leaderboard
 */
router.get('/performance/leaderboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { tier, podId } = req.query;

    const leaderboard = await caregiverPerformanceService.getLeaderboard(organizationId, {
      tier: tier as string,
      podId: podId as string,
    });

    res.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/performance/caregiver/:caregiverId
 * Get performance for a specific caregiver
 */
router.get('/performance/caregiver/:caregiverId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { caregiverId } = req.params;

    const [monthly, history] = await Promise.all([
      caregiverPerformanceService.getMonthlyPerformance(caregiverId, organizationId),
      caregiverPerformanceService.getPerformanceHistory(caregiverId, organizationId),
    ]);

    res.json({
      success: true,
      current: monthly,
      history,
    });
  } catch (error) {
    logger.error('Failed to get caregiver performance', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/performance/calculate
 * Calculate performance for all caregivers
 */
router.post('/performance/calculate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { date } = req.body;

    const result = await caregiverPerformanceService.calculateAllPerformance(organizationId, date);

    logger.info('Performance calculated', {
      organizationId,
      ...result,
    });

    res.json({
      success: true,
      calculated: result,
    });
  } catch (error) {
    logger.error('Failed to calculate performance', { error });
    next(error);
  }
});

// ============================================================
// CLIENT SATISFACTION
// ============================================================

/**
 * GET /api/console/operations/satisfaction/dashboard
 * Get satisfaction dashboard
 */
router.get('/satisfaction/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const dashboard = await clientSatisfactionService.getDashboard(organizationId);

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    logger.error('Failed to get satisfaction dashboard', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/satisfaction/templates
 * Get survey templates
 */
router.get('/satisfaction/templates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const templates = await clientSatisfactionService.getTemplates(organizationId);

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    logger.error('Failed to get survey templates', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/satisfaction/templates
 * Create survey template
 */
router.post('/satisfaction/templates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { name, description, surveyType, questions, autoSend, sendFrequency } = req.body;

    if (!name || !surveyType || !questions) {
      throw ApiErrors.badRequest('name, surveyType, and questions are required');
    }

    const template = await clientSatisfactionService.createTemplate(organizationId, {
      name,
      description,
      surveyType,
      questions,
      autoSend,
      sendFrequency,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error('Failed to create survey template', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/satisfaction/responses
 * Get survey responses
 */
router.get('/satisfaction/responses', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, templateId, clientId, caregiverId, fromDate, toDate } = req.query;

    const responses = await clientSatisfactionService.getResponses(organizationId, {
      status: status as string,
      templateId: templateId as string,
      clientId: clientId as string,
      caregiverId: caregiverId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json({
      success: true,
      responses,
      count: responses.length,
    });
  } catch (error) {
    logger.error('Failed to get survey responses', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/satisfaction/responses
 * Submit survey response
 */
router.post('/satisfaction/responses', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const {
      templateId,
      respondentType,
      respondentId,
      respondentName,
      respondentEmail,
      respondentPhone,
      clientId,
      caregiverId,
      visitId,
      responses,
      comments,
    } = req.body;

    if (!templateId || !respondentType || !responses) {
      throw ApiErrors.badRequest('templateId, respondentType, and responses are required');
    }

    const response = await clientSatisfactionService.submitResponse(organizationId, {
      templateId,
      respondentType,
      respondentId,
      respondentName,
      respondentEmail,
      respondentPhone,
      clientId,
      caregiverId,
      visitId,
      responses,
      comments,
    });

    res.status(201).json({
      success: true,
      response,
    });
  } catch (error) {
    logger.error('Failed to submit survey response', { error });
    next(error);
  }
});

/**
 * POST /api/console/operations/satisfaction/responses/:id/follow-up
 * Record follow-up on a response
 */
router.post('/satisfaction/responses/:id/follow-up', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      throw ApiErrors.badRequest('notes is required');
    }

    const response = await clientSatisfactionService.recordFollowUp(id, organizationId, userId, notes);

    if (!response) {
      throw ApiErrors.notFound('Survey response');
    }

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    logger.error('Failed to record follow-up', { error });
    next(error);
  }
});

/**
 * GET /api/console/operations/satisfaction/client/:clientId
 * Get client satisfaction score
 */
router.get('/satisfaction/client/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { clientId } = req.params;
    const { month } = req.query;

    const score = await clientSatisfactionService.getClientSatisfactionScore(
      clientId,
      organizationId,
      month as string
    );

    res.json({
      success: true,
      score,
    });
  } catch (error) {
    logger.error('Failed to get client satisfaction score', { error });
    next(error);
  }
});

export default router;
