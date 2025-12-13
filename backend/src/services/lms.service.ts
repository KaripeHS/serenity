/**
 * LMS (Learning Management System) Service
 * Manages course content, quizzes, learning paths, and certificates
 *
 * Extends the existing training system with full LMS capabilities
 *
 * @module services/lms
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('lms-service');

interface CourseModule {
  id?: string;
  trainingTypeId: string;
  moduleOrder: number;
  title: string;
  description?: string;
  contentType: string;
  contentData?: Record<string, any>;
  estimatedDurationMinutes?: number;
  isRequired?: boolean;
  passingScore?: number;
  maxAttempts?: number;
  isActive?: boolean;
}

interface Quiz {
  id?: string;
  trainingTypeId: string;
  moduleId?: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showCorrectAnswers?: boolean;
  allowReview?: boolean;
  questionsToDisplay?: number;
}

interface QuizQuestion {
  id?: string;
  quizId: string;
  questionOrder: number;
  questionType: string;
  questionText: string;
  questionMediaUrl?: string;
  explanation?: string;
  points?: number;
  partialCredit?: boolean;
  answerData: Record<string, any>;
}

interface LearningPath {
  id?: string;
  organizationId?: string;
  name: string;
  description?: string;
  category?: string;
  targetRoles?: string[];
  targetSkillLevel?: string;
  isSequential?: boolean;
  estimatedTotalHours?: number;
  completionBadge?: string;
  completionCertificateTemplateId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

interface CertificateTemplate {
  id?: string;
  organizationId?: string;
  name: string;
  description?: string;
  templateType?: string;
  templateData?: Record<string, any>;
  isDefault?: boolean;
  isActive?: boolean;
}

class LmsService {
  private db = getDbClient();

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  /**
   * Get LMS dashboard metrics
   */
  async getDashboard(organizationId: string): Promise<any> {
    try {
      // Try to use the view if it exists
      const viewQuery = `SELECT * FROM lms_dashboard WHERE organization_id = $1`;

      try {
        const result = await this.db.query(viewQuery, [organizationId]);
        if (result.rows.length > 0) {
          return result.rows[0];
        }
      } catch (e) {
        // View might not exist
      }

      // Fallback: compute manually
      const metricsQuery = `
        SELECT
          COUNT(DISTINCT t.id) as total_courses,
          COUNT(DISTINCT ta.id) as total_assignments,
          COUNT(DISTINCT ta.id) FILTER (WHERE ta.status = 'completed') as completed_assignments,
          COUNT(DISTINCT ta.id) FILTER (WHERE ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived')) as overdue_assignments
        FROM training_types t
        LEFT JOIN training_assignments ta ON ta.training_type_id = t.id
        WHERE t.organization_id = $1 OR t.organization_id IS NULL
      `;

      const result = await this.db.query(metricsQuery, [organizationId]);
      return {
        totalCourses: parseInt(result.rows[0]?.total_courses || 0),
        totalAssignments: parseInt(result.rows[0]?.total_assignments || 0),
        completedAssignments: parseInt(result.rows[0]?.completed_assignments || 0),
        overdueAssignments: parseInt(result.rows[0]?.overdue_assignments || 0),
        totalLearningPaths: 0,
        certificatesIssued: 0,
        avgQuizScore: null,
        avgCourseRating: null
      };
    } catch (error) {
      logger.error('Error getting LMS dashboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // COURSE MODULES
  // ============================================================================

  /**
   * Get modules for a training/course
   */
  async getCourseModules(trainingTypeId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM course_modules
        WHERE training_type_id = $1 AND is_active = true
        ORDER BY module_order
      `;
      const result = await this.db.query(query, [trainingTypeId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting course modules:', error);
      return [];
    }
  }

  /**
   * Create a course module
   */
  async createModule(module: CourseModule): Promise<any> {
    try {
      const query = `
        INSERT INTO course_modules (
          training_type_id, module_order, title, description,
          content_type, content_data, estimated_duration_minutes,
          is_required, passing_score, max_attempts, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        module.trainingTypeId,
        module.moduleOrder,
        module.title,
        module.description,
        module.contentType,
        JSON.stringify(module.contentData || {}),
        module.estimatedDurationMinutes,
        module.isRequired !== false,
        module.passingScore,
        module.maxAttempts,
        module.isActive !== false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating course module:', error);
      throw error;
    }
  }

  /**
   * Update a course module
   */
  async updateModule(moduleId: string, updates: Partial<CourseModule>): Promise<any> {
    try {
      const allowedFields = [
        'module_order', 'title', 'description', 'content_type', 'content_data',
        'estimated_duration_minutes', 'is_required', 'passing_score', 'max_attempts', 'is_active'
      ];

      const fieldMap: Record<string, string> = {
        moduleOrder: 'module_order',
        contentType: 'content_type',
        contentData: 'content_data',
        estimatedDurationMinutes: 'estimated_duration_minutes',
        isRequired: 'is_required',
        passingScore: 'passing_score',
        maxAttempts: 'max_attempts',
        isActive: 'is_active'
      };

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        if (allowedFields.includes(dbField) && value !== undefined) {
          setClauses.push(`${dbField} = $${paramIndex++}`);
          params.push(key === 'contentData' ? JSON.stringify(value) : value);
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(moduleId);

      const query = `
        UPDATE course_modules
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating course module:', error);
      throw error;
    }
  }

  // ============================================================================
  // QUIZZES
  // ============================================================================

  /**
   * Get quizzes for a training/course
   */
  async getCourseQuizzes(trainingTypeId: string): Promise<any[]> {
    try {
      const query = `
        SELECT q.*,
          (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id AND is_active = true) as question_count
        FROM course_quizzes q
        WHERE q.training_type_id = $1 AND q.is_active = true
      `;
      const result = await this.db.query(query, [trainingTypeId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting course quizzes:', error);
      return [];
    }
  }

  /**
   * Create a quiz
   */
  async createQuiz(quiz: Quiz): Promise<any> {
    try {
      const query = `
        INSERT INTO course_quizzes (
          training_type_id, module_id, title, description,
          time_limit_minutes, passing_score, max_attempts,
          shuffle_questions, shuffle_answers, show_correct_answers,
          allow_review, questions_to_display, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        quiz.trainingTypeId,
        quiz.moduleId,
        quiz.title,
        quiz.description,
        quiz.timeLimitMinutes,
        quiz.passingScore || 70,
        quiz.maxAttempts || 3,
        quiz.shuffleQuestions !== false,
        quiz.shuffleAnswers !== false,
        quiz.showCorrectAnswers !== false,
        quiz.allowReview !== false,
        quiz.questionsToDisplay,
        true
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating quiz:', error);
      throw error;
    }
  }

  /**
   * Get quiz with questions (for taking the quiz)
   */
  async getQuizWithQuestions(quizId: string, shuffleQuestions: boolean = true): Promise<any> {
    try {
      const quizQuery = `SELECT * FROM course_quizzes WHERE id = $1`;
      const quizResult = await this.db.query(quizQuery, [quizId]);

      if (quizResult.rows.length === 0) {
        return null;
      }

      const quiz = quizResult.rows[0];

      let questionsQuery = `
        SELECT id, question_order, question_type, question_text, question_media_url, points
        FROM quiz_questions
        WHERE quiz_id = $1 AND is_active = true
      `;

      if (shuffleQuestions && quiz.shuffle_questions) {
        questionsQuery += ' ORDER BY RANDOM()';
      } else {
        questionsQuery += ' ORDER BY question_order';
      }

      if (quiz.questions_to_display) {
        questionsQuery += ` LIMIT ${quiz.questions_to_display}`;
      }

      const questionsResult = await this.db.query(questionsQuery, [quizId]);

      // Get answer options without revealing correct answers
      const questions = questionsResult.rows.map(q => {
        const options = this.getAnswerOptions(q);
        return {
          ...q,
          options: quiz.shuffle_answers ? this.shuffleArray(options) : options
        };
      });

      return {
        ...quiz,
        questions
      };
    } catch (error) {
      logger.error('Error getting quiz with questions:', error);
      throw error;
    }
  }

  /**
   * Get answer options without correct answer
   */
  private getAnswerOptions(question: any): any[] {
    // This would need to query the full question to get answer_data
    // For now, return empty array - actual implementation would parse answer_data
    return [];
  }

  /**
   * Shuffle array helper
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Add a question to a quiz
   */
  async addQuizQuestion(question: QuizQuestion): Promise<any> {
    try {
      const query = `
        INSERT INTO quiz_questions (
          quiz_id, question_order, question_type, question_text,
          question_media_url, explanation, points, partial_credit, answer_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        question.quizId,
        question.questionOrder,
        question.questionType,
        question.questionText,
        question.questionMediaUrl,
        question.explanation,
        question.points || 1,
        question.partialCredit || false,
        JSON.stringify(question.answerData)
      ]);

      // Update total_questions count
      await this.db.query(`
        UPDATE course_quizzes
        SET total_questions = (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1 AND is_active = true)
        WHERE id = $1
      `, [question.quizId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error adding quiz question:', error);
      throw error;
    }
  }

  /**
   * Start a quiz attempt
   */
  async startQuizAttempt(
    quizId: string,
    userId: string,
    trainingAssignmentId?: string
  ): Promise<any> {
    try {
      // Check max attempts
      const attemptsQuery = `
        SELECT COUNT(*) as attempts FROM quiz_attempts
        WHERE quiz_id = $1 AND user_id = $2
      `;
      const attemptsResult = await this.db.query(attemptsQuery, [quizId, userId]);
      const attempts = parseInt(attemptsResult.rows[0].attempts);

      const quizQuery = `SELECT max_attempts FROM course_quizzes WHERE id = $1`;
      const quizResult = await this.db.query(quizQuery, [quizId]);
      const maxAttempts = quizResult.rows[0]?.max_attempts || 3;

      if (attempts >= maxAttempts) {
        throw new Error(`Maximum attempts (${maxAttempts}) reached for this quiz`);
      }

      const query = `
        INSERT INTO quiz_attempts (quiz_id, user_id, training_assignment_id, attempt_number, status)
        VALUES ($1, $2, $3, $4, 'in_progress')
        RETURNING *
      `;

      const result = await this.db.query(query, [
        quizId,
        userId,
        trainingAssignmentId,
        attempts + 1
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error starting quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Submit quiz answers and grade
   */
  async submitQuizAttempt(
    attemptId: string,
    answers: Record<string, any>
  ): Promise<any> {
    try {
      // Get attempt and quiz details
      const attemptQuery = `
        SELECT qa.*, cq.passing_score
        FROM quiz_attempts qa
        JOIN course_quizzes cq ON qa.quiz_id = cq.id
        WHERE qa.id = $1
      `;
      const attemptResult = await this.db.query(attemptQuery, [attemptId]);

      if (attemptResult.rows.length === 0) {
        throw new Error('Quiz attempt not found');
      }

      const attempt = attemptResult.rows[0];

      // Get questions and grade
      const questionsQuery = `
        SELECT id, points, answer_data FROM quiz_questions
        WHERE quiz_id = $1 AND is_active = true
      `;
      const questionsResult = await this.db.query(questionsQuery, [attempt.quiz_id]);

      let totalPoints = 0;
      let pointsEarned = 0;
      let questionsCorrect = 0;
      const gradedAnswers: Record<string, any> = {};

      for (const question of questionsResult.rows) {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        const isCorrect = this.gradeAnswer(question, userAnswer);

        if (isCorrect) {
          pointsEarned += question.points;
          questionsCorrect++;
        }

        gradedAnswers[question.id] = {
          selected: userAnswer,
          correct: isCorrect,
          points: isCorrect ? question.points : 0
        };
      }

      const score = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0;
      const passed = score >= attempt.passing_score;
      const status = passed ? 'passed' : 'failed';

      // Update attempt
      const updateQuery = `
        UPDATE quiz_attempts
        SET
          completed_at = NOW(),
          time_spent_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
          status = $2,
          score = $3,
          questions_answered = $4,
          questions_correct = $5,
          total_points = $6,
          points_earned = $7,
          answers = $8
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(updateQuery, [
        attemptId,
        status,
        score,
        Object.keys(answers).length,
        questionsCorrect,
        totalPoints,
        pointsEarned,
        JSON.stringify(gradedAnswers)
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error submitting quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Grade a single answer
   */
  private gradeAnswer(question: any, userAnswer: any): boolean {
    if (!userAnswer) return false;

    const answerData = question.answer_data;

    switch (question.question_type) {
      case 'multiple_choice':
        const correctOption = answerData.options?.find((o: any) => o.is_correct);
        return correctOption?.id === userAnswer;

      case 'true_false':
        return answerData.correct_answer === userAnswer;

      case 'multiple_select':
        const correctIds = answerData.options
          ?.filter((o: any) => o.is_correct)
          .map((o: any) => o.id) || [];
        const userIds = Array.isArray(userAnswer) ? userAnswer : [];
        return (
          correctIds.length === userIds.length &&
          correctIds.every((id: string) => userIds.includes(id))
        );

      default:
        return false;
    }
  }

  // ============================================================================
  // LEARNING PATHS
  // ============================================================================

  /**
   * Get all learning paths
   */
  async getLearningPaths(organizationId: string): Promise<any[]> {
    try {
      const query = `
        SELECT lp.*,
          (SELECT COUNT(*) FROM learning_path_items WHERE learning_path_id = lp.id) as item_count,
          (SELECT COUNT(*) FROM user_learning_path_progress WHERE learning_path_id = lp.id) as enrollment_count,
          (SELECT COUNT(*) FROM user_learning_path_progress WHERE learning_path_id = lp.id AND status = 'completed') as completion_count
        FROM learning_paths lp
        WHERE (lp.organization_id = $1 OR lp.organization_id IS NULL)
          AND lp.is_active = true
        ORDER BY lp.is_featured DESC, lp.name
      `;
      const result = await this.db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting learning paths:', error);
      return [];
    }
  }

  /**
   * Create a learning path
   */
  async createLearningPath(path: LearningPath): Promise<any> {
    try {
      const query = `
        INSERT INTO learning_paths (
          organization_id, name, description, category,
          target_roles, target_skill_level, is_sequential,
          estimated_total_hours, completion_badge,
          completion_certificate_template_id, is_active, is_featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        path.organizationId,
        path.name,
        path.description,
        path.category,
        path.targetRoles,
        path.targetSkillLevel,
        path.isSequential !== false,
        path.estimatedTotalHours,
        path.completionBadge,
        path.completionCertificateTemplateId,
        path.isActive !== false,
        path.isFeatured || false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating learning path:', error);
      throw error;
    }
  }

  /**
   * Get learning path with items
   */
  async getLearningPathWithItems(pathId: string): Promise<any> {
    try {
      const pathQuery = `SELECT * FROM learning_paths WHERE id = $1`;
      const pathResult = await this.db.query(pathQuery, [pathId]);

      if (pathResult.rows.length === 0) {
        return null;
      }

      const itemsQuery = `
        SELECT lpi.*, tt.name as training_name, tt.description as training_description,
          tt.duration_minutes, tt.category
        FROM learning_path_items lpi
        JOIN training_types tt ON lpi.training_type_id = tt.id
        WHERE lpi.learning_path_id = $1
        ORDER BY lpi.item_order
      `;
      const itemsResult = await this.db.query(itemsQuery, [pathId]);

      return {
        ...pathResult.rows[0],
        items: itemsResult.rows
      };
    } catch (error) {
      logger.error('Error getting learning path with items:', error);
      throw error;
    }
  }

  /**
   * Enroll user in a learning path
   */
  async enrollInLearningPath(
    userId: string,
    learningPathId: string,
    enrolledBy?: string
  ): Promise<any> {
    try {
      // Get total items count
      const itemsQuery = `SELECT COUNT(*) as count FROM learning_path_items WHERE learning_path_id = $1`;
      const itemsResult = await this.db.query(itemsQuery, [learningPathId]);
      const totalItems = parseInt(itemsResult.rows[0].count);

      // Get first item
      const firstItemQuery = `
        SELECT id FROM learning_path_items
        WHERE learning_path_id = $1
        ORDER BY item_order
        LIMIT 1
      `;
      const firstItemResult = await this.db.query(firstItemQuery, [learningPathId]);
      const currentItemId = firstItemResult.rows[0]?.id;

      const query = `
        INSERT INTO user_learning_path_progress (
          user_id, learning_path_id, enrolled_by, total_items, current_item_id
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, learning_path_id) DO NOTHING
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId,
        learningPathId,
        enrolledBy,
        totalItems,
        currentItemId
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error enrolling in learning path:', error);
      throw error;
    }
  }

  /**
   * Get user's learning path progress
   */
  async getUserLearningPathProgress(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT ulp.*, lp.name as path_name, lp.description as path_description,
          lp.category, lp.estimated_total_hours
        FROM user_learning_path_progress ulp
        JOIN learning_paths lp ON ulp.learning_path_id = lp.id
        WHERE ulp.user_id = $1
        ORDER BY ulp.enrolled_at DESC
      `;
      const result = await this.db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user learning path progress:', error);
      return [];
    }
  }

  // ============================================================================
  // CERTIFICATES
  // ============================================================================

  /**
   * Get certificate templates
   */
  async getCertificateTemplates(organizationId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM certificate_templates
        WHERE (organization_id = $1 OR organization_id IS NULL)
          AND is_active = true
        ORDER BY is_default DESC, name
      `;
      const result = await this.db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting certificate templates:', error);
      return [];
    }
  }

  /**
   * Create a certificate template
   */
  async createCertificateTemplate(template: CertificateTemplate): Promise<any> {
    try {
      const query = `
        INSERT INTO certificate_templates (
          organization_id, name, description, template_type, template_data, is_default, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        template.organizationId,
        template.name,
        template.description,
        template.templateType || 'standard',
        JSON.stringify(template.templateData || {}),
        template.isDefault || false,
        template.isActive !== false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating certificate template:', error);
      throw error;
    }
  }

  /**
   * Issue a certificate
   */
  async issueCertificate(
    organizationId: string,
    userId: string,
    data: {
      trainingAssignmentId?: string;
      learningPathId?: string;
      certificateTemplateId?: string;
      title: string;
      courseName: string;
      completionDate: string;
      score?: number;
      hoursCompleted?: number;
      verifiedByName?: string;
      verifiedByTitle?: string;
      expiresAt?: string;
    }
  ): Promise<any> {
    try {
      // Generate certificate number and verification code
      const certNumberResult = await this.db.query(`SELECT generate_certificate_number() as number`);
      const certNumber = certNumberResult.rows[0]?.number || `CERT-${Date.now()}`;

      const verificationResult = await this.db.query(`SELECT generate_verification_code() as code`);
      const verificationCode = verificationResult.rows[0]?.code || `${Date.now()}`;

      const query = `
        INSERT INTO issued_certificates (
          organization_id, user_id, training_assignment_id, learning_path_id,
          certificate_template_id, certificate_number, title, course_name,
          completion_date, score, hours_completed, verification_code,
          verified_by_name, verified_by_title, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        organizationId,
        userId,
        data.trainingAssignmentId,
        data.learningPathId,
        data.certificateTemplateId,
        certNumber,
        data.title,
        data.courseName,
        data.completionDate,
        data.score,
        data.hoursCompleted,
        verificationCode,
        data.verifiedByName,
        data.verifiedByTitle,
        data.expiresAt
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error issuing certificate:', error);
      throw error;
    }
  }

  /**
   * Get user's certificates
   */
  async getUserCertificates(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT ic.*, ct.name as template_name
        FROM issued_certificates ic
        LEFT JOIN certificate_templates ct ON ic.certificate_template_id = ct.id
        WHERE ic.user_id = $1 AND ic.is_revoked = false
        ORDER BY ic.completion_date DESC
      `;
      const result = await this.db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user certificates:', error);
      return [];
    }
  }

  /**
   * Verify a certificate by verification code
   */
  async verifyCertificate(verificationCode: string): Promise<any> {
    try {
      const query = `
        SELECT ic.*, u.first_name, u.last_name
        FROM issued_certificates ic
        JOIN users u ON ic.user_id = u.id
        WHERE ic.verification_code = $1
      `;
      const result = await this.db.query(query, [verificationCode]);

      if (result.rows.length === 0) {
        return { valid: false, message: 'Certificate not found' };
      }

      const cert = result.rows[0];

      if (cert.is_revoked) {
        return {
          valid: false,
          message: 'This certificate has been revoked',
          revokedAt: cert.revoked_at,
          revokedReason: cert.revoked_reason
        };
      }

      if (cert.expires_at && new Date(cert.expires_at) < new Date()) {
        return {
          valid: false,
          message: 'This certificate has expired',
          expiredAt: cert.expires_at
        };
      }

      return {
        valid: true,
        certificate: {
          number: cert.certificate_number,
          title: cert.title,
          recipientName: `${cert.first_name} ${cert.last_name}`,
          courseName: cert.course_name,
          completionDate: cert.completion_date,
          score: cert.score,
          verifiedBy: cert.verified_by_name,
          issuedAt: cert.created_at,
          expiresAt: cert.expires_at
        }
      };
    } catch (error) {
      logger.error('Error verifying certificate:', error);
      throw error;
    }
  }

  // ============================================================================
  // COURSE RATINGS
  // ============================================================================

  /**
   * Submit a course rating
   */
  async submitCourseRating(
    trainingTypeId: string,
    userId: string,
    trainingAssignmentId: string,
    rating: number,
    data: {
      feedback?: string;
      contentQuality?: number;
      difficultyLevel?: string;
      relevance?: number;
      wouldRecommend?: boolean;
    }
  ): Promise<any> {
    try {
      const query = `
        INSERT INTO course_ratings (
          training_type_id, user_id, training_assignment_id,
          rating, feedback, content_quality, difficulty_level, relevance, would_recommend
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (training_type_id, user_id, training_assignment_id)
        DO UPDATE SET
          rating = EXCLUDED.rating,
          feedback = EXCLUDED.feedback,
          content_quality = EXCLUDED.content_quality,
          difficulty_level = EXCLUDED.difficulty_level,
          relevance = EXCLUDED.relevance,
          would_recommend = EXCLUDED.would_recommend
        RETURNING *
      `;

      const result = await this.db.query(query, [
        trainingTypeId,
        userId,
        trainingAssignmentId,
        rating,
        data.feedback,
        data.contentQuality,
        data.difficultyLevel,
        data.relevance,
        data.wouldRecommend
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error submitting course rating:', error);
      throw error;
    }
  }

  /**
   * Get course ratings summary
   */
  async getCourseRatings(trainingTypeId: string): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_ratings,
          AVG(rating) as avg_rating,
          AVG(content_quality) as avg_content_quality,
          AVG(relevance) as avg_relevance,
          COUNT(*) FILTER (WHERE would_recommend) as would_recommend_count,
          COUNT(*) FILTER (WHERE difficulty_level = 'too_easy') as too_easy_count,
          COUNT(*) FILTER (WHERE difficulty_level = 'just_right') as just_right_count,
          COUNT(*) FILTER (WHERE difficulty_level = 'too_hard') as too_hard_count
        FROM course_ratings
        WHERE training_type_id = $1
      `;

      const result = await this.db.query(query, [trainingTypeId]);

      // Get recent feedback
      const feedbackQuery = `
        SELECT feedback, rating, created_at
        FROM course_ratings
        WHERE training_type_id = $1 AND feedback IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const feedbackResult = await this.db.query(feedbackQuery, [trainingTypeId]);

      return {
        ...result.rows[0],
        recentFeedback: feedbackResult.rows
      };
    } catch (error) {
      logger.error('Error getting course ratings:', error);
      throw error;
    }
  }
}

export const lmsService = new LmsService();
