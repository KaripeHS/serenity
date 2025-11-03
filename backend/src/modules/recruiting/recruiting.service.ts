/**
 * Complete Recruiting and Talent Management Service for Serenity ERP
 * Handles end-to-end talent lifecycle: sourcing, screening, hiring, performance, retention
 */

import { DatabaseClient } from '../../database/client';
import { AuditLogger } from '../../audit/logger';
import { UserContext } from '../../auth/access-control';
import { AIAgentService } from '../ai/agent.service';

export interface Applicant {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;

  // Application details
  positionAppliedFor: string;
  applicationDate: Date;
  source: 'website' | 'referral' | 'indeed' | 'ziprecruiter' | 'facebook' | 'other';
  referredBy?: string;

  // Resume and qualifications
  resumeFileId?: string;
  parsedResumeData?: any;
  experience: ExperienceLevel;
  certifications: string[];
  skills: string[];
  availability: Availability;

  // Screening results
  aiScreeningScore?: number;
  aiScreeningNotes?: string;
  backgroundCheckStatus?: BackgroundCheckStatus;
  referenceCheckStatus?: ReferenceCheckStatus;

  // Application status
  status: ApplicantStatus;
  currentStage: RecruitingStage;

  // Interview tracking
  interviews: Interview[];

  // Decision tracking
  hiredDate?: Date;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Interview {
  id: string;
  applicantId: string;
  interviewType: 'phone' | 'video' | 'in_person';
  scheduledDate: Date;
  interviewerId: string;

  // AI-generated interview questions
  questions: InterviewQuestion[];
  responses: InterviewResponse[];

  // Interview results
  overallRating: number; // 1-10 scale
  notes: string;
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';

  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  completedAt?: Date;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'situational' | 'culture_fit';
  aiGenerated: boolean;
  expectedResponseCriteria?: string;
}

export interface InterviewResponse {
  questionId: string;
  response: string;
  rating: number; // 1-5 scale
  notes?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: string; // e.g., "2024-Q1", "2024-Annual"
  reviewType: 'quarterly' | 'annual' | 'probationary' | 'improvement';

  // Performance metrics
  metrics: PerformanceMetric[];
  overallRating: number; // 1-5 scale

  // Goals and implementation
  goalsAchieved: Goal[];
  newGoals: Goal[];
  implementationPlan: DevelopmentPlan;

  // Compensation discussions
  currentSalary: number;
  recommendedSalaryAdjustment?: number;
  promotionRecommended: boolean;

  // Review participants
  reviewedBy: string; // Manager
  reviewedAt: Date;
  employeeSignedAt?: Date;

  status: 'draft' | 'pending_employee_input' | 'completed' | 'disputed';
}

export interface PerformanceMetric {
  category: string;
  description: string;
  rating: number; // 1-5 scale
  weight: number; // percentage of total review
  comments: string;
}

export interface Goal {
  id: string;
  description: string;
  category: 'performance' | 'skill_implementation' | 'career' | 'compliance';
  targetDate: Date;
  progress: number; // 0-100%
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DevelopmentPlan {
  skillGaps: string[];
  trainingRecommendations: string[];
  mentorshipNeeds: string[];
  careerPathOptions: string[];
  timeframe: string;
}

export interface RetentionRisk {
  id: string;
  employeeId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  calculatedAt: Date;

  // Retention strategies
  recommendedActions: RetentionAction[];
  actionsTaken: RetentionAction[];
}

export interface RiskFactor {
  factor: string;
  impact: number; // 1-10 scale
  description: string;
}

export interface RetentionAction {
  action: string;
  category: 'compensation' | 'implementation' | 'recognition' | 'workload' | 'culture';
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  implementedAt?: Date;
  effectiveness?: number; // 1-10 scale after implementation
}

export enum ApplicantStatus {
  NEW = 'new',
  SCREENING = 'screening',
  INTERVIEWING = 'interviewing',
  REFERENCE_CHECK = 'reference_check',
  BACKGROUND_CHECK = 'background_check',
  OFFER_PENDING = 'offer_pending',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

export enum RecruitingStage {
  APPLICATION = 'application',
  AI_SCREENING = 'ai_screening',
  PHONE_SCREEN = 'phone_screen',
  INTERVIEWS = 'interviews',
  FINAL_REVIEW = 'final_review',
  OFFER = 'offer',
  ONBOARDING = 'onboarding'
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert'
}

export enum BackgroundCheckStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  CLEAR = 'clear',
  CONCERNS = 'concerns',
  FAILED = 'failed'
}

export enum ReferenceCheckStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  POSITIVE = 'positive',
  MIXED = 'mixed',
  NEGATIVE = 'negative'
}

export interface Availability {
  fullTime: boolean;
  partTime: boolean;
  weekends: boolean;
  nights: boolean;
  holidays: boolean;
  preferredSchedule?: string;
}

export class RecruitingService {
  constructor(
    private db: DatabaseClient,
    private auditLogger: AuditLogger,
    private aiAgent: AIAgentService
  ) {}

  /**
   * Create new applicant and trigger AI screening
   */
  async createApplicant(
    applicantData: Partial<Applicant>,
    userContext: UserContext
  ): Promise<Applicant> {
    const applicant: Applicant = {
      id: crypto.randomUUID(),
      organizationId: userContext.organizationId,
      ...applicantData,
      applicationDate: new Date(),
      status: ApplicantStatus.NEW,
      currentStage: RecruitingStage.APPLICATION,
      interviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userContext.userId
    } as Applicant;

    await this.db.insert('applicants', applicant);

    // Trigger AI screening
    if (applicant.resumeFileId) {
      await this.performAIScreening(applicant.id, userContext);
    }

    await this.auditLogger.log({
      userId: userContext.userId,
      action: 'create_applicant',
      resourceType: 'applicant',
      resourceId: applicant.id,
      metadata: {
        position: applicant.positionAppliedFor,
        source: applicant.source
      }
    });

    return applicant;
  }

  /**
   * Parse resume using AI and extract structured data
   */
  async parseResume(resumeFileId: string): Promise<any> {
    // In a real implementation, this would process the resume file
    const aiPrompt = `
    Analyze this resume and extract structured information:
    1. Contact information
    2. Work experience (positions, companies, dates, responsibilities)
    3. Education (degrees, institutions, dates)
    4. Skills and certifications
    5. Overall experience level
    6. Healthcare/caregiving experience relevance

    Return as structured JSON.
    `;

    const parsedData = await this.aiAgent.processDocument(resumeFileId, aiPrompt);
    return parsedData;
  }

  /**
   * AI-powered applicant screening
   */
  async performAIScreening(
    applicantId: string,
    userContext: UserContext
  ): Promise<void> {
    const applicant = await this.db.findOne('applicants', { id: applicantId });

    // Parse resume if not already done
    if (applicant.resumeFileId && !applicant.parsedResumeData) {
      applicant.parsedResumeData = await this.parseResume(applicant.resumeFileId);
    }

    const screeningPrompt = `
    Screen this applicant for a ${applicant.positionAppliedFor} position at a home health agency:

    Applicant Data:
    ${JSON.stringify(applicant, null, 2)}

    Evaluate based on:
    1. Healthcare/caregiving experience relevance (40%)
    2. Required certifications and qualifications (30%)
    3. Communication skills evident in application (15%)
    4. Availability and schedule flexibility (15%)

    Provide:
    - Score (0-100)
    - Key strengths
    - Areas of concern
    - Recommendation (proceed/reject/request_more_info)
    - Suggested interview questions if proceeding
    `;

    const screeningResult = await this.aiAgent.executeAgent(
      'recruiting_screener_agent',
      screeningPrompt
    );

    // Update applicant with screening results
    await this.db.update('applicants', applicantId, {
      aiScreeningScore: screeningResult.score,
      aiScreeningNotes: screeningResult.notes,
      status: screeningResult.recommendation === 'proceed' ?
        ApplicantStatus.INTERVIEWING : ApplicantStatus.REJECTED,
      currentStage: screeningResult.recommendation === 'proceed' ?
        RecruitingStage.PHONE_SCREEN : RecruitingStage.AI_SCREENING,
      updatedAt: new Date()
    });

    // Generate interview questions if proceeding
    if (screeningResult.recommendation === 'proceed') {
      await this.generateInterviewQuestions(applicantId, applicant.positionAppliedFor);
    }

    await this.auditLogger.log({
      userId: 'ai_agent',
      action: 'ai_screening',
      resourceType: 'applicant',
      resourceId: applicantId,
      metadata: {
        score: screeningResult.score,
        recommendation: screeningResult.recommendation
      }
    });
  }

  /**
   * Generate AI-powered interview questions
   */
  async generateInterviewQuestions(
    applicantId: string,
    position: string
  ): Promise<InterviewQuestion[]> {
    const questionPrompt = `
    Generate 10 interview questions for a ${position} candidate at a home health agency.

    Include:
    - 3 technical/clinical questions
    - 3 behavioral questions (past experience scenarios)
    - 2 situational questions (hypothetical scenarios)
    - 2 culture fit questions

    Each question should include:
    - The question text
    - Category
    - Expected response criteria for evaluation

    Focus on Ohio regulations, HIPAA compliance, patient safety, and compassionate care.
    `;

    const generatedQuestions = await this.aiAgent.executeAgent(
      'recruiting_screener_agent',
      questionPrompt
    );

    const questions: InterviewQuestion[] = generatedQuestions.questions.map(q => ({
      id: crypto.randomUUID(),
      question: q.question,
      category: q.category,
      aiGenerated: true,
      expectedResponseCriteria: q.criteria
    }));

    // Store questions for this applicant
    await this.db.insert('interview_question_sets', {
      id: crypto.randomUUID(),
      applicantId,
      position,
      questions,
      generatedAt: new Date()
    });

    return questions;
  }

  /**
   * Schedule interview
   */
  async scheduleInterview(
    applicantId: string,
    interviewData: Partial<Interview>,
    userContext: UserContext
  ): Promise<Interview> {
    const interview: Interview = {
      id: crypto.randomUUID(),
      applicantId,
      ...interviewData,
      status: 'scheduled',
      questions: [],
      responses: []
    } as Interview;

    await this.db.insert('interviews', interview);

    // Update applicant status
    await this.db.update('applicants', applicantId, {
      status: ApplicantStatus.INTERVIEWING,
      currentStage: RecruitingStage.INTERVIEWS,
      updatedAt: new Date()
    });

    await this.auditLogger.log({
      userId: userContext.userId,
      action: 'schedule_interview',
      resourceType: 'interview',
      resourceId: interview.id,
      metadata: { applicantId, interviewDate: interview.scheduledDate }
    });

    return interview;
  }

  /**
   * Performance Review System
   */
  async createPerformanceReview(
    employeeId: string,
    reviewData: Partial<PerformanceReview>,
    userContext: UserContext
  ): Promise<PerformanceReview> {
    const review: PerformanceReview = {
      id: crypto.randomUUID(),
      employeeId,
      ...reviewData,
      reviewedBy: userContext.userId,
      reviewedAt: new Date(),
      status: 'draft'
    } as PerformanceReview;

    await this.db.insert('performance_reviews', review);

    await this.auditLogger.log({
      userId: userContext.userId,
      action: 'create_performance_review',
      resourceType: 'performance_review',
      resourceId: review.id,
      metadata: { employeeId, reviewPeriod: review.reviewPeriod }
    });

    return review;
  }

  /**
   * AI-powered retention risk analysis
   */
  async analyzeRetentionRisk(
    employeeId: string,
    userContext: UserContext
  ): Promise<RetentionRisk> {
    const employee = await this.db.findOne('employees', { id: employeeId });
    const recentReviews = await this.db.find('performance_reviews', {
      employeeId,
      limit: 3,
      orderBy: 'reviewedAt DESC'
    });
    const attendanceData = await this.getAttendanceMetrics(employeeId);
    const compensationData = await this.getCompensationMetrics(employeeId);

    const riskAnalysisPrompt = `
    Analyze retention risk for this employee:

    Employee: ${JSON.stringify(employee)}
    Recent Reviews: ${JSON.stringify(recentReviews)}
    Attendance: ${JSON.stringify(attendanceData)}
    Compensation: ${JSON.stringify(compensationData)}

    Industry context: Home health caregiving, competitive market, high turnover industry

    Evaluate risk factors:
    1. Performance trends
    2. Compensation competitiveness
    3. Attendance patterns
    4. Career implementation progress
    5. Workload and overtime
    6. Length of employment

    Provide:
    - Overall risk level (low/medium/high/critical)
    - Specific risk factors with impact scores
    - Recommended retention actions with priorities
    `;

    const riskAnalysis = await this.aiAgent.executeAgent(
      'retention_analysis_agent',
      riskAnalysisPrompt
    );

    const retentionRisk: RetentionRisk = {
      id: crypto.randomUUID(),
      employeeId,
      riskLevel: riskAnalysis.riskLevel,
      riskFactors: riskAnalysis.riskFactors,
      calculatedAt: new Date(),
      recommendedActions: riskAnalysis.recommendedActions,
      actionsTaken: []
    };

    await this.db.insert('retention_risks', retentionRisk);

    await this.auditLogger.log({
      userId: userContext.userId,
      action: 'analyze_retention_risk',
      resourceType: 'retention_risk',
      resourceId: retentionRisk.id,
      metadata: { employeeId, riskLevel: retentionRisk.riskLevel }
    });

    return retentionRisk;
  }

  /**
   * Compensation management and market analysis
   */
  async analyzeCompensationEquity(
    organizationId: string,
    userContext: UserContext
  ): Promise<any> {
    const employees = await this.db.find('employees', { organizationId });
    const salaryData = await this.db.query(`
      SELECT
        e.position,
        e.experience_level,
        e.current_salary,
        e.hire_date,
        AVG(pr.overall_rating) as avg_performance
      FROM employees e
      LEFT JOIN performance_reviews pr ON e.id = pr.employee_id
      WHERE e.organization_id = $1
      GROUP BY e.id, e.position, e.experience_level, e.current_salary, e.hire_date
    `, [organizationId]);

    const marketAnalysisPrompt = `
    Analyze compensation equity and market competitiveness:

    Employee Salary Data: ${JSON.stringify(salaryData)}

    For Ohio home health industry, analyze:
    1. Internal equity (similar roles, experience levels)
    2. Market competitiveness (based on 2024 market data)
    3. Performance correlation
    4. Retention risk correlation

    Provide recommendations for:
    - Salary adjustments needed
    - Market positioning improvements
    - Equity corrections
    - Budget impact estimates
    `;

    const analysis = await this.aiAgent.executeAgent(
      'compensation_analysis_agent',
      marketAnalysisPrompt
    );

    return analysis;
  }

  /**
   * Get recruiting pipeline metrics
   */
  async getRecruitingMetrics(organizationId: string): Promise<any> {
    const metrics = await this.db.query(`
      SELECT
        COUNT(*) as total_applicants,
        COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        AVG(ai_screening_score) as avg_screening_score,
        AVG(EXTRACT(DAYS FROM hired_date - application_date)) as avg_time_to_hire
      FROM applicants
      WHERE organization_id = $1
      AND application_date >= CURRENT_DATE - INTERVAL '90 days'
    `, [organizationId]);

    const sourceMetrics = await this.db.query(`
      SELECT
        source,
        COUNT(*) as applicant_count,
        COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'hired')::DECIMAL / COUNT(*) * 100, 2
        ) as conversion_rate
      FROM applicants
      WHERE organization_id = $1
      AND application_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY source
      ORDER BY conversion_rate DESC
    `, [organizationId]);

    return {
      overview: metrics.rows[0],
      sourcePerformance: sourceMetrics,
      pipelineStages: await this.getPipelineStages(organizationId)
    };
  }

  /**
   * Talent retention dashboard metrics
   */
  async getRetentionMetrics(organizationId: string): Promise<any> {
    const retentionData = await this.db.query(`
      SELECT
        COUNT(*) as active_employees,
        COUNT(*) FILTER (WHERE hire_date >= CURRENT_DATE - INTERVAL '90 days') as new_hires_90d,
        COUNT(*) FILTER (WHERE termination_date >= CURRENT_DATE - INTERVAL '90 days') as terminations_90d,
        AVG(EXTRACT(DAYS FROM COALESCE(termination_date, CURRENT_DATE) - hire_date)) as avg_tenure_days
      FROM employees
      WHERE organization_id = $1
    `, [organizationId]);

    const riskDistribution = await this.db.query(`
      SELECT
        risk_level,
        COUNT(*) as employee_count
      FROM retention_risks rr
      JOIN employees e ON rr.employee_id = e.id
      WHERE e.organization_id = $1
      AND rr.calculated_at = (
        SELECT MAX(calculated_at)
        FROM retention_risks rr2
        WHERE rr2.employee_id = rr.employee_id
      )
      GROUP BY risk_level
    `, [organizationId]);

    return {
      retentionOverview: retentionData.rows[0],
      riskDistribution,
      turnoverRate: this.calculateTurnoverRate(retentionData.rows[0])
    };
  }

  // Helper methods
  private async getAttendanceMetrics(employeeId: string): Promise<any> {
    // Implementation would query attendance/shift data
    return {};
  }

  private async getCompensationMetrics(employeeId: string): Promise<any> {
    // Implementation would query salary history and market data
    return {};
  }

  private async getPipelineStages(organizationId: string): Promise<any> {
    return await this.db.query(`
      SELECT
        current_stage,
        COUNT(*) as applicant_count
      FROM applicants
      WHERE organization_id = $1
      AND status NOT IN ('hired', 'rejected', 'withdrawn')
      GROUP BY current_stage
      ORDER BY
        CASE current_stage
          WHEN 'application' THEN 1
          WHEN 'ai_screening' THEN 2
          WHEN 'phone_screen' THEN 3
          WHEN 'interviews' THEN 4
          WHEN 'final_review' THEN 5
          WHEN 'offer' THEN 6
          ELSE 7
        END
    `, [organizationId]);
  }

  private calculateTurnoverRate(data: any): number {
    const { active_employees, terminations_90d } = data;
    return active_employees > 0 ? (terminations_90d / active_employees) * 4 * 100 : 0; // Annualized
  }
}