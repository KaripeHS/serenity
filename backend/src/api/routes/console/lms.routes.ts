/**
 * LMS (Learning Management System) Routes
 * API endpoints for course content, quizzes, learning paths, and certificates
 *
 * Extends the existing training system with full LMS capabilities
 *
 * @module api/routes/console/lms
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { lmsService as LmsService } from '../../../services/lms.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('lms-routes');

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * GET /api/console/lms/dashboard
 * Get LMS dashboard metrics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const dashboard = await LmsService.getDashboard(organizationId);

    res.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COURSE MODULES
// ============================================================================

/**
 * GET /api/console/lms/courses/:trainingTypeId/modules
 * Get modules for a course
 */
router.get('/courses/:trainingTypeId/modules', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { trainingTypeId } = req.params;

    const modules = await LmsService.getCourseModules(trainingTypeId);

    res.json({
      modules,
      count: modules.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/courses/:trainingTypeId/modules
 * Create a course module
 */
router.post('/courses/:trainingTypeId/modules', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { trainingTypeId } = req.params;
    const {
      moduleOrder,
      title,
      description,
      contentType,
      contentData,
      estimatedDurationMinutes,
      isRequired,
      passingScore,
      maxAttempts
    } = req.body;

    if (!title || !contentType) {
      throw ApiErrors.badRequest('Missing required fields: title, contentType');
    }

    const module = await LmsService.createModule({
      trainingTypeId,
      moduleOrder: moduleOrder || 1,
      title,
      description,
      contentType,
      contentData,
      estimatedDurationMinutes,
      isRequired,
      passingScore,
      maxAttempts
    });

    logger.info(`Course module created: ${module.id} for training ${trainingTypeId}`);

    res.status(201).json({
      module,
      message: 'Course module created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/lms/modules/:moduleId
 * Update a course module
 */
router.put('/modules/:moduleId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { moduleId } = req.params;
    const updates = req.body;

    const module = await LmsService.updateModule(moduleId, updates);

    logger.info(`Course module updated: ${moduleId}`);

    res.json({
      module,
      message: 'Course module updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// QUIZZES
// ============================================================================

/**
 * GET /api/console/lms/courses/:trainingTypeId/quizzes
 * Get quizzes for a course
 */
router.get('/courses/:trainingTypeId/quizzes', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { trainingTypeId } = req.params;

    const quizzes = await LmsService.getCourseQuizzes(trainingTypeId);

    res.json({
      quizzes,
      count: quizzes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/courses/:trainingTypeId/quizzes
 * Create a quiz
 */
router.post('/courses/:trainingTypeId/quizzes', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { trainingTypeId } = req.params;
    const {
      moduleId,
      title,
      description,
      timeLimitMinutes,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showCorrectAnswers,
      allowReview,
      questionsToDisplay
    } = req.body;

    if (!title) {
      throw ApiErrors.badRequest('Missing required field: title');
    }

    const quiz = await LmsService.createQuiz({
      trainingTypeId,
      moduleId,
      title,
      description,
      timeLimitMinutes,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showCorrectAnswers,
      allowReview,
      questionsToDisplay
    });

    logger.info(`Quiz created: ${quiz.id} for training ${trainingTypeId}`);

    res.status(201).json({
      quiz,
      message: 'Quiz created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/lms/quizzes/:quizId
 * Get a quiz with questions (for taking)
 */
router.get('/quizzes/:quizId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { quizId } = req.params;
    const { shuffle } = req.query;

    const quiz = await LmsService.getQuizWithQuestions(
      quizId,
      shuffle !== 'false'
    );

    if (!quiz) {
      throw ApiErrors.notFound('Quiz not found');
    }

    res.json({
      quiz,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/quizzes/:quizId/questions
 * Add a question to a quiz
 */
router.post('/quizzes/:quizId/questions', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { quizId } = req.params;
    const {
      questionOrder,
      questionType,
      questionText,
      questionMediaUrl,
      explanation,
      points,
      partialCredit,
      answerData
    } = req.body;

    if (!questionType || !questionText || !answerData) {
      throw ApiErrors.badRequest('Missing required fields: questionType, questionText, answerData');
    }

    const question = await LmsService.addQuizQuestion({
      quizId,
      questionOrder: questionOrder || 1,
      questionType,
      questionText,
      questionMediaUrl,
      explanation,
      points,
      partialCredit,
      answerData
    });

    logger.info(`Quiz question added: ${question.id} to quiz ${quizId}`);

    res.status(201).json({
      question,
      message: 'Quiz question added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/quizzes/:quizId/start
 * Start a quiz attempt
 */
router.post('/quizzes/:quizId/start', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user?.userId;
    const { trainingAssignmentId } = req.body;

    if (!userId) {
      throw ApiErrors.badRequest('User context required');
    }

    const attempt = await LmsService.startQuizAttempt(quizId, userId, trainingAssignmentId);

    logger.info(`Quiz attempt started: ${attempt.id} by user ${userId}`);

    res.status(201).json({
      attempt,
      message: 'Quiz attempt started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/quiz-attempts/:attemptId/submit
 * Submit quiz answers
 */
router.post('/quiz-attempts/:attemptId/submit', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      throw ApiErrors.badRequest('Missing required field: answers (object)');
    }

    const result = await LmsService.submitQuizAttempt(attemptId, answers);

    logger.info(`Quiz submitted: ${attemptId}, score: ${result.score}%`);

    res.json({
      result,
      message: result.status === 'passed' ? 'Congratulations! You passed!' : 'Quiz completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEARNING PATHS
// ============================================================================

/**
 * GET /api/console/lms/learning-paths
 * Get all learning paths
 */
router.get('/learning-paths', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const paths = await LmsService.getLearningPaths(organizationId);

    res.json({
      paths,
      count: paths.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/learning-paths
 * Create a learning path
 */
router.post('/learning-paths', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      name,
      description,
      category,
      targetRoles,
      targetSkillLevel,
      isSequential,
      estimatedTotalHours,
      completionBadge,
      completionCertificateTemplateId,
      isFeatured
    } = req.body;

    if (!name) {
      throw ApiErrors.badRequest('Missing required field: name');
    }

    const path = await LmsService.createLearningPath({
      organizationId,
      name,
      description,
      category,
      targetRoles,
      targetSkillLevel,
      isSequential,
      estimatedTotalHours,
      completionBadge,
      completionCertificateTemplateId,
      isFeatured
    });

    logger.info(`Learning path created: ${path.id} - ${name}`);

    res.status(201).json({
      path,
      message: 'Learning path created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/lms/learning-paths/:pathId
 * Get a learning path with items
 */
router.get('/learning-paths/:pathId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { pathId } = req.params;

    const path = await LmsService.getLearningPathWithItems(pathId);

    if (!path) {
      throw ApiErrors.notFound('Learning path not found');
    }

    res.json({
      path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/learning-paths/:pathId/enroll
 * Enroll in a learning path
 */
router.post('/learning-paths/:pathId/enroll', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { pathId } = req.params;
    const currentUserId = req.user?.userId;
    const { userId } = req.body;

    const targetUserId = userId || currentUserId;

    if (!targetUserId) {
      throw ApiErrors.badRequest('User context required');
    }

    const enrollment = await LmsService.enrollInLearningPath(
      targetUserId,
      pathId,
      userId ? currentUserId : undefined // If enrolling someone else, record who did it
    );

    logger.info(`User ${targetUserId} enrolled in learning path ${pathId}`);

    res.status(201).json({
      enrollment,
      message: 'Successfully enrolled in learning path',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/lms/my-learning-paths
 * Get current user's learning path progress
 */
router.get('/my-learning-paths', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiErrors.badRequest('User context required');
    }

    const progress = await LmsService.getUserLearningPathProgress(userId);

    res.json({
      progress,
      count: progress.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CERTIFICATES
// ============================================================================

/**
 * GET /api/console/lms/certificate-templates
 * Get certificate templates
 */
router.get('/certificate-templates', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const templates = await LmsService.getCertificateTemplates(organizationId);

    res.json({
      templates,
      count: templates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/certificate-templates
 * Create a certificate template
 */
router.post('/certificate-templates', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { name, description, templateType, templateData, isDefault } = req.body;

    if (!name) {
      throw ApiErrors.badRequest('Missing required field: name');
    }

    const template = await LmsService.createCertificateTemplate({
      organizationId,
      name,
      description,
      templateType,
      templateData,
      isDefault
    });

    logger.info(`Certificate template created: ${template.id} - ${name}`);

    res.status(201).json({
      template,
      message: 'Certificate template created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/lms/certificates/issue
 * Issue a certificate
 */
router.post('/certificates/issue', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      userId,
      trainingAssignmentId,
      learningPathId,
      certificateTemplateId,
      title,
      courseName,
      completionDate,
      score,
      hoursCompleted,
      verifiedByName,
      verifiedByTitle,
      expiresAt
    } = req.body;

    if (!userId || !title || !courseName || !completionDate) {
      throw ApiErrors.badRequest('Missing required fields: userId, title, courseName, completionDate');
    }

    const certificate = await LmsService.issueCertificate(organizationId, userId, {
      trainingAssignmentId,
      learningPathId,
      certificateTemplateId,
      title,
      courseName,
      completionDate,
      score,
      hoursCompleted,
      verifiedByName,
      verifiedByTitle,
      expiresAt
    });

    logger.info(`Certificate issued: ${certificate.certificate_number} to user ${userId}`);

    res.status(201).json({
      certificate,
      message: 'Certificate issued successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/lms/my-certificates
 * Get current user's certificates
 */
router.get('/my-certificates', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiErrors.badRequest('User context required');
    }

    const certificates = await LmsService.getUserCertificates(userId);

    res.json({
      certificates,
      count: certificates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/lms/certificates/verify/:code
 * Verify a certificate by verification code
 */
router.get('/certificates/verify/:code', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { code } = req.params;

    const verification = await LmsService.verifyCertificate(code);

    res.json({
      verification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COURSE RATINGS
// ============================================================================

/**
 * POST /api/console/lms/courses/:trainingTypeId/rate
 * Submit a course rating
 */
router.post('/courses/:trainingTypeId/rate', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { trainingTypeId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiErrors.badRequest('User context required');
    }

    const {
      trainingAssignmentId,
      rating,
      feedback,
      contentQuality,
      difficultyLevel,
      relevance,
      wouldRecommend
    } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw ApiErrors.badRequest('Rating must be between 1 and 5');
    }

    const courseRating = await LmsService.submitCourseRating(
      trainingTypeId,
      userId,
      trainingAssignmentId,
      rating,
      { feedback, contentQuality, difficultyLevel, relevance, wouldRecommend }
    );

    logger.info(`Course rated: ${trainingTypeId} by user ${userId}`);

    res.status(201).json({
      rating: courseRating,
      message: 'Thank you for your feedback!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/lms/courses/:trainingTypeId/ratings
 * Get course ratings summary
 */
router.get('/courses/:trainingTypeId/ratings', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { trainingTypeId } = req.params;

    const ratings = await LmsService.getCourseRatings(trainingTypeId);

    res.json({
      ratings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
