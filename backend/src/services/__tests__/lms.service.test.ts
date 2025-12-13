/**
 * LMS Service Tests
 * Tests for Learning Management System - courses, quizzes, learning paths, certificates
 */

import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock database client
const mockQuery = jest.fn() as jest.Mock<any>;
jest.mock('../../database/client', () => ({
  getDbClient: () => ({
    query: mockQuery,
  }),
}));

import { lmsService } from '../lms.service';

describe('LmsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return LMS dashboard metrics', async () => {
      const mockDashboardData = {
        rows: [{
          total_courses: '24',
          total_assignments: '892',
          completed_assignments: '756',
          overdue_assignments: '23',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockDashboardData);

      const result = await lmsService.getDashboard('org-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle missing view gracefully', async () => {
      // First query (view) fails
      mockQuery.mockRejectedValueOnce(new Error('View not found'));
      // Fallback query succeeds
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_courses: '10', total_assignments: '50' }],
      });

      const result = await lmsService.getDashboard('org-123');

      expect(result).toBeDefined();
    });
  });

  describe('getCourseModules', () => {
    it('should return modules for a training course', async () => {
      const mockModules = {
        rows: [
          { id: 'mod-1', title: 'Introduction', module_order: 1, content_type: 'video' },
          { id: 'mod-2', title: 'Core Concepts', module_order: 2, content_type: 'text' },
          { id: 'mod-3', title: 'Assessment', module_order: 3, content_type: 'quiz' },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockModules);

      const result = await lmsService.getCourseModules('course-123');

      expect(result).toHaveLength(3);
      expect(result[0].module_order).toBe(1);
    });
  });

  describe('createModule', () => {
    const mockModuleData = {
      trainingTypeId: 'course-123',
      moduleOrder: 1,
      title: 'Introduction to HIPAA',
      description: 'Overview of HIPAA regulations',
      contentType: 'video',
      estimatedDurationMinutes: 30,
      isRequired: true,
      passingScore: 80,
    };

    it('should create a new course module', async () => {
      const mockResult = {
        rows: [{
          id: 'mod-123',
          ...mockModuleData,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await lmsService.createModule(mockModuleData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Introduction to HIPAA');
    });
  });

  describe('updateModule', () => {
    it('should update a module', async () => {
      const mockResult = {
        rows: [{
          id: 'mod-123',
          title: 'Updated Title',
          updated_at: new Date().toISOString(),
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await lmsService.updateModule('mod-123', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('getCourseQuizzes', () => {
    it('should return quizzes for a course', async () => {
      const mockQuizzes = {
        rows: [
          { id: 'quiz-1', title: 'Module 1 Assessment', question_count: '10' },
          { id: 'quiz-2', title: 'Final Exam', question_count: '25' },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockQuizzes);

      const result = await lmsService.getCourseQuizzes('course-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('createQuiz', () => {
    const mockQuizData = {
      trainingTypeId: 'course-123',
      title: 'HIPAA Compliance Quiz',
      description: 'Test your knowledge of HIPAA regulations',
      timeLimitMinutes: 30,
      passingScore: 80,
      maxAttempts: 3,
      shuffleQuestions: true,
      shuffleAnswers: true,
    };

    it('should create a new quiz', async () => {
      const mockResult = {
        rows: [{
          id: 'quiz-123',
          ...mockQuizData,
          is_active: true,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await lmsService.createQuiz(mockQuizData);

      expect(result.title).toBe('HIPAA Compliance Quiz');
    });
  });

  describe('getQuizWithQuestions', () => {
    it('should return quiz with questions for taking', async () => {
      const mockQuiz = {
        rows: [{
          id: 'quiz-123',
          title: 'Test Quiz',
          shuffle_questions: true,
          questions_to_display: 10,
        }],
      };
      const mockQuestions = {
        rows: [
          { id: 'q-1', question_text: 'What is HIPAA?', question_type: 'multiple_choice' },
          { id: 'q-2', question_text: 'True or False?', question_type: 'true_false' },
        ],
      };

      mockQuery
        .mockResolvedValueOnce(mockQuiz)
        .mockResolvedValueOnce(mockQuestions);

      const result = await lmsService.getQuizWithQuestions('quiz-123');

      expect(result).toBeDefined();
      expect(result.questions).toBeDefined();
    });

    it('should return null for non-existent quiz', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await lmsService.getQuizWithQuestions('invalid-quiz');

      expect(result).toBeNull();
    });
  });

  describe('addQuizQuestion', () => {
    const mockQuestionData = {
      quizId: 'quiz-123',
      questionOrder: 1,
      questionType: 'multiple_choice',
      questionText: 'What does HIPAA stand for?',
      points: 1,
      answerData: {
        options: [
          { id: 'a', text: 'Health Insurance...', is_correct: true },
          { id: 'b', text: 'Hospital Info...', is_correct: false },
        ],
      },
    };

    it('should add a question to a quiz', async () => {
      const mockResult = {
        rows: [{
          id: 'question-123',
          quiz_id: 'quiz-123',
          question_order: 1,
          question_type: 'multiple_choice',
          question_text: 'What does HIPAA stand for?',
          points: 1,
        }],
      };
      const mockUpdateCount = { rows: [] };

      mockQuery
        .mockResolvedValueOnce(mockResult)
        .mockResolvedValueOnce(mockUpdateCount);

      const result = await lmsService.addQuizQuestion(mockQuestionData);

      expect(result.question_text).toBe('What does HIPAA stand for?');
    });
  });

  describe('startQuizAttempt', () => {
    it('should start a new quiz attempt', async () => {
      const mockAttemptsCheck = { rows: [{ attempts: '0' }] };
      const mockQuiz = { rows: [{ max_attempts: 3 }] };
      const mockAttempt = {
        rows: [{
          id: 'attempt-123',
          quiz_id: 'quiz-123',
          attempt_number: 1,
          status: 'in_progress',
        }],
      };

      mockQuery
        .mockResolvedValueOnce(mockAttemptsCheck)
        .mockResolvedValueOnce(mockQuiz)
        .mockResolvedValueOnce(mockAttempt);

      const result = await lmsService.startQuizAttempt('quiz-123', 'user-123');

      expect(result.status).toBe('in_progress');
      expect(result.attempt_number).toBe(1);
    });

    it('should reject when max attempts reached', async () => {
      const mockAttemptsCheck = { rows: [{ attempts: '3' }] };
      const mockQuiz = { rows: [{ max_attempts: 3 }] };

      mockQuery
        .mockResolvedValueOnce(mockAttemptsCheck)
        .mockResolvedValueOnce(mockQuiz);

      await expect(
        lmsService.startQuizAttempt('quiz-123', 'user-123')
      ).rejects.toThrow('Maximum attempts');
    });
  });

  describe('submitQuizAttempt', () => {
    it('should grade and submit quiz answers', async () => {
      const mockAttempt = {
        rows: [{
          id: 'attempt-123',
          quiz_id: 'quiz-123',
          passing_score: 80,
        }],
      };
      const mockQuestions = {
        rows: [
          { id: 'q-1', points: 1, answer_data: { correct_answer: true } },
          { id: 'q-2', points: 1, answer_data: { options: [{ id: 'a', is_correct: true }] } },
        ],
      };
      const mockUpdate = {
        rows: [{
          id: 'attempt-123',
          score: 100,
          status: 'passed',
          questions_correct: 2,
        }],
      };

      mockQuery
        .mockResolvedValueOnce(mockAttempt)
        .mockResolvedValueOnce(mockQuestions)
        .mockResolvedValueOnce(mockUpdate);

      const result = await lmsService.submitQuizAttempt('attempt-123', {
        'q-1': true,
        'q-2': 'a',
      });

      expect(result.status).toBe('passed');
    });
  });

  describe('getLearningPaths', () => {
    it('should return all learning paths', async () => {
      const mockPaths = {
        rows: [
          { id: 'path-1', name: 'New Caregiver Onboarding', item_count: '6' },
          { id: 'path-2', name: 'Dementia Care Certification', item_count: '4' },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockPaths);

      const result = await lmsService.getLearningPaths('org-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('createLearningPath', () => {
    const mockPathData = {
      name: 'Advanced Care Certification',
      description: 'Certification track for advanced care skills',
      category: 'Certification',
      isSequential: true,
      estimatedTotalHours: 16,
    };

    it('should create a learning path', async () => {
      const mockResult = {
        rows: [{
          id: 'path-123',
          ...mockPathData,
          is_active: true,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await lmsService.createLearningPath(mockPathData);

      expect(result.name).toBe('Advanced Care Certification');
    });
  });

  describe('enrollInLearningPath', () => {
    it('should enroll user in a learning path', async () => {
      const mockItemsCount = { rows: [{ count: '5' }] };
      const mockFirstItem = { rows: [{ id: 'item-1' }] };
      const mockEnrollment = {
        rows: [{
          user_id: 'user-123',
          learning_path_id: 'path-123',
          total_items: 5,
        }],
      };

      mockQuery
        .mockResolvedValueOnce(mockItemsCount)
        .mockResolvedValueOnce(mockFirstItem)
        .mockResolvedValueOnce(mockEnrollment);

      const result = await lmsService.enrollInLearningPath('user-123', 'path-123');

      expect(result.total_items).toBe(5);
    });
  });

  describe('getCertificateTemplates', () => {
    it('should return certificate templates', async () => {
      const mockTemplates = {
        rows: [
          { id: 'tpl-1', name: 'Standard Certificate', is_default: true },
          { id: 'tpl-2', name: 'Advanced Certification', is_default: false },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockTemplates);

      const result = await lmsService.getCertificateTemplates('org-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('issueCertificate', () => {
    const mockCertData = {
      title: 'HIPAA Compliance Certification',
      courseName: 'HIPAA Compliance Training',
      completionDate: '2024-12-10',
      score: 95,
    };

    it('should issue a certificate', async () => {
      const mockCertNumber = { rows: [{ number: 'CERT-2024-00001' }] };
      const mockVerificationCode = { rows: [{ code: 'ABC123XYZ' }] };
      const mockCertificate = {
        rows: [{
          id: 'cert-123',
          certificate_number: 'CERT-2024-00001',
          ...mockCertData,
        }],
      };

      mockQuery
        .mockResolvedValueOnce(mockCertNumber)
        .mockResolvedValueOnce(mockVerificationCode)
        .mockResolvedValueOnce(mockCertificate);

      const result = await lmsService.issueCertificate('org-123', 'user-123', mockCertData);

      expect(result.certificate_number).toBe('CERT-2024-00001');
    });
  });

  describe('verifyCertificate', () => {
    it('should verify a valid certificate', async () => {
      const mockCertificate = {
        rows: [{
          certificate_number: 'CERT-2024-00001',
          first_name: 'Maria',
          last_name: 'Garcia',
          is_revoked: false,
          expires_at: null,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockCertificate);

      const result = await lmsService.verifyCertificate('ABC123XYZ');

      expect(result.valid).toBe(true);
    });

    it('should return invalid for revoked certificate', async () => {
      const mockCertificate = {
        rows: [{
          certificate_number: 'CERT-2024-00001',
          is_revoked: true,
          revoked_at: '2024-12-01',
          revoked_reason: 'Compliance violation',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockCertificate);

      const result = await lmsService.verifyCertificate('ABC123XYZ');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('revoked');
    });

    it('should return invalid for expired certificate', async () => {
      const mockCertificate = {
        rows: [{
          certificate_number: 'CERT-2024-00001',
          is_revoked: false,
          expires_at: '2024-01-01', // Past date
        }],
      };

      mockQuery.mockResolvedValueOnce(mockCertificate);

      const result = await lmsService.verifyCertificate('ABC123XYZ');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should return not found for invalid code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await lmsService.verifyCertificate('INVALID');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('submitCourseRating', () => {
    it('should submit a course rating', async () => {
      const mockResult = {
        rows: [{
          id: 'rating-123',
          rating: 5,
          feedback: 'Great course!',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await lmsService.submitCourseRating(
        'course-123',
        'user-123',
        'assignment-123',
        5,
        { feedback: 'Great course!', wouldRecommend: true }
      );

      expect(result.rating).toBe(5);
    });
  });

  describe('getCourseRatings', () => {
    it('should return course rating summary', async () => {
      const mockSummary = {
        rows: [{
          total_ratings: '45',
          avg_rating: '4.5',
          avg_content_quality: '4.7',
          would_recommend_count: '40',
        }],
      };
      const mockFeedback = {
        rows: [
          { feedback: 'Very helpful', rating: 5 },
          { feedback: 'Good content', rating: 4 },
        ],
      };

      mockQuery
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockFeedback);

      const result = await lmsService.getCourseRatings('course-123');

      expect(result.total_ratings).toBe('45');
      expect(result.recentFeedback).toHaveLength(2);
    });
  });
});
