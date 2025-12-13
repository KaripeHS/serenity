/**
 * HR & Talent Dashboard Service
 * Workforce management for 500+ staff with AI-powered recruiting
 * Integrates with backend APIs with mock fallback
 */

import { applicantsApi, interviewsApi, onboardingApi, Applicant as ApiApplicant, Interview, OnboardingChecklist, ApplicantPipelineSummary } from './api';

export interface Applicant {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  stage: 'applied' | 'screening' | 'interview' | 'background' | 'offer' | 'hired' | 'rejected';
  score: number;
  appliedDate: string;
  lastActivity: string;
  skills: string[];
  experience: number;
  certifications: string[];
  source?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  hireDate: string;
  performanceScore: number;
  retentionRisk: 'low' | 'medium' | 'high';
  certifications: string[];
  upcomingRenewals: string[];
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewPeriod: string;
  overallScore: number;
  goals: Array<{ description: string; status: 'completed' | 'in-progress' | 'not-started' }>;
  strengths: string[];
  improvements: string[];
  nextReviewDate: string;
}

export interface SkillsGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  affectedRoles: string[];
}

export interface HRDashboardMetrics {
  totalStaff: number;
  openPositions: number;
  pendingApplications: number;
  trainingCompliance: number;
  avgTimeToHire: number;
  turnoverRate: number;
}

export interface RecruitingDashboard {
  pipeline: ApplicantPipelineSummary;
  needsAction: { items: Applicant[]; count: number };
  sourceAnalytics: any;
  todaysInterviews: Interview[];
}

// Map API applicant to local format
function mapApiApplicant(apiApplicant: ApiApplicant): Applicant {
  return {
    id: apiApplicant.id,
    name: `${apiApplicant.first_name} ${apiApplicant.last_name}`,
    position: apiApplicant.position_applied_for,
    email: apiApplicant.email,
    phone: apiApplicant.phone,
    stage: apiApplicant.stage === 'applied' ? 'screening' : apiApplicant.stage as any,
    score: 85, // Default score - would come from assessment service
    appliedDate: apiApplicant.created_at,
    lastActivity: apiApplicant.updated_at,
    skills: apiApplicant.skills || [],
    experience: parseInt(apiApplicant.experience_level || '0') || 0,
    certifications: apiApplicant.certifications || [],
    source: apiApplicant.source,
  };
}

class HRDashboardService {
  /**
   * Get full recruiting dashboard with pipeline, actions, and interviews
   */
  async getRecruitingDashboard(): Promise<RecruitingDashboard> {
    try {
      const [dashboardData, todaysInterviews] = await Promise.all([
        applicantsApi.getDashboard(),
        interviewsApi.getTodaysInterviews().catch(() => ({ interviews: [] })),
      ]);

      return {
        pipeline: dashboardData.pipeline,
        needsAction: {
          items: dashboardData.needsAction.items.map(mapApiApplicant),
          count: dashboardData.needsAction.count,
        },
        sourceAnalytics: dashboardData.sourceAnalytics,
        todaysInterviews: todaysInterviews.interviews,
      };
    } catch (error) {
      console.warn('Backend API not available, using mock data');
      return this.getMockRecruitingDashboard();
    }
  }

  /**
   * Get all applicants in recruiting pipeline
   */
  async getRecruitingPipeline(filters?: { stage?: string; position?: string }): Promise<Applicant[]> {
    try {
      const response = await applicantsApi.getApplicants(filters);
      return response.applicants.map(mapApiApplicant);
    } catch (error) {
      console.warn('Backend API not available, using mock data for recruiting pipeline');
      return this.getMockRecruitingPipeline();
    }
  }

  /**
   * Get a single applicant by ID
   */
  async getApplicant(id: string): Promise<Applicant | null> {
    try {
      const response = await applicantsApi.getApplicant(id);
      return mapApiApplicant(response.applicant);
    } catch (error) {
      console.warn('Backend API not available');
      return null;
    }
  }

  /**
   * Advance applicant to next stage
   */
  async advanceApplicant(id: string, stage: string): Promise<Applicant | null> {
    try {
      const response = await applicantsApi.advanceStage(id, stage);
      return mapApiApplicant(response.applicant);
    } catch (error) {
      console.error('Failed to advance applicant:', error);
      throw error;
    }
  }

  /**
   * Reject an applicant
   */
  async rejectApplicant(id: string, reason: string): Promise<Applicant | null> {
    try {
      const response = await applicantsApi.rejectApplicant(id, reason);
      return mapApiApplicant(response.applicant);
    } catch (error) {
      console.error('Failed to reject applicant:', error);
      throw error;
    }
  }

  /**
   * Hire an applicant
   */
  async hireApplicant(id: string): Promise<Applicant | null> {
    try {
      const response = await applicantsApi.hireApplicant(id);
      return mapApiApplicant(response.applicant);
    } catch (error) {
      console.error('Failed to hire applicant:', error);
      throw error;
    }
  }

  /**
   * Schedule an interview
   */
  async scheduleInterview(data: {
    applicantId: string;
    interviewType: 'phone' | 'video' | 'in_person';
    scheduledAt: string;
    durationMinutes?: number;
    interviewerId?: string;
  }): Promise<Interview | null> {
    try {
      const response = await interviewsApi.scheduleInterview(data);
      return response.interview;
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      throw error;
    }
  }

  /**
   * Get today's scheduled interviews
   */
  async getTodaysInterviews(): Promise<Interview[]> {
    try {
      const response = await interviewsApi.getTodaysInterviews();
      return response.interviews;
    } catch (error) {
      console.warn('Backend API not available');
      return [];
    }
  }

  /**
   * Get onboarding checklists
   */
  async getOnboardingChecklists(status?: string): Promise<OnboardingChecklist[]> {
    try {
      const response = await onboardingApi.getChecklists({ status });
      return response.checklists;
    } catch (error) {
      console.warn('Backend API not available');
      return [];
    }
  }

  /**
   * Get source analytics for recruiting
   */
  async getSourceAnalytics(period?: string): Promise<any> {
    try {
      const response = await applicantsApi.getSourceAnalytics(period);
      return response.analytics;
    } catch (error) {
      console.warn('Backend API not available');
      return this.getMockSourceAnalytics();
    }
  }

  async getEmployees(): Promise<Employee[]> {
    await this.delay(600);
    return [
      {
        id: '1',
        name: 'Maria Rodriguez',
        role: 'Senior Caregiver',
        department: 'Clinical',
        hireDate: '2021-03-15',
        performanceScore: 94,
        retentionRisk: 'low',
        certifications: ['CNA', 'CPR', 'First Aid'],
        upcomingRenewals: ['CPR - expires March 2024']
      },
      {
        id: '2',
        name: 'David Chen',
        role: 'Physical Therapist',
        department: 'Therapy',
        hireDate: '2022-06-10',
        performanceScore: 91,
        retentionRisk: 'medium',
        certifications: ['PT', 'CPR', 'Manual Therapy'],
        upcomingRenewals: []
      }
    ];
  }

  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    await this.delay(400);
    return [
      {
        id: '1',
        employeeId: '1',
        employeeName: 'Maria Rodriguez',
        reviewPeriod: 'Q4 2024',
        overallScore: 94,
        goals: [
          { description: 'Complete advanced wound care training', status: 'completed' },
          { description: 'Mentor 2 new caregivers', status: 'in-progress' },
          { description: 'Maintain 98% patient satisfaction', status: 'completed' }
        ],
        strengths: ['Patient advocacy', 'Clinical skills', 'Reliability'],
        improvements: ['Documentation efficiency', 'Time management'],
        nextReviewDate: '2025-04-15'
      }
    ];
  }

  async getRetentionAnalysis(): Promise<any> {
    await this.delay(700);
    return {
      currentTurnoverRate: 12.5,
      industryAverage: 18.2,
      riskFactors: [
        { factor: 'Workload', impact: 'high', affectedEmployees: 23 },
        { factor: 'Compensation', impact: 'medium', affectedEmployees: 15 },
        { factor: 'Career growth', impact: 'medium', affectedEmployees: 31 }
      ],
      recommendations: [
        'Implement flexible scheduling options',
        'Review compensation benchmarks',
        'Expand professional implementation programs'
      ]
    };
  }

  async getSkillsGapAnalysis(): Promise<SkillsGap[]> {
    await this.delay(600);
    return [
      {
        skill: 'Specialized Wound Care',
        currentLevel: 65,
        requiredLevel: 85,
        gap: 20,
        priority: 'high',
        affectedRoles: ['Registered Nurse', 'Advanced Caregiver']
      },
      {
        skill: 'Mental Health Support',
        currentLevel: 55,
        requiredLevel: 75,
        gap: 20,
        priority: 'medium',
        affectedRoles: ['Caregiver', 'Social Worker']
      },
      {
        skill: 'Technology Proficiency',
        currentLevel: 70,
        requiredLevel: 90,
        gap: 20,
        priority: 'high',
        affectedRoles: ['All Roles']
      }
    ];
  }

  async getCompensationAnalysis(): Promise<any> {
    await this.delay(500);
    return {
      marketPosition: 'Above Average',
      equityScore: 92,
      payRanges: {
        'Registered Nurse': { min: 65000, max: 78000, average: 71500 },
        'Physical Therapist': { min: 72000, max: 85000, average: 78500 },
        'Home Health Aide': { min: 32000, max: 38000, average: 35000 }
      },
      recommendations: [
        'Maintain competitive RN salaries',
        'Review HHA compensation vs market',
        'Consider performance-based bonuses'
      ]
    };
  }

  async getDashboardMetrics(): Promise<HRDashboardMetrics> {
    try {
      // Try to get real data from pipeline
      const pipeline = await applicantsApi.getPipeline();
      return {
        totalStaff: 156,
        openPositions: 12,
        pendingApplications: pipeline.byStage.applied + pipeline.byStage.screening,
        trainingCompliance: 94.5,
        avgTimeToHire: pipeline.avgTimeToHire || 18,
        turnoverRate: 8.2
      };
    } catch (error) {
      // Fall back to mock data
      return {
        totalStaff: 156,
        openPositions: 12,
        pendingApplications: 28,
        trainingCompliance: 94.5,
        avgTimeToHire: 18,
        turnoverRate: 8.2
      };
    }
  }

  // Mock data fallbacks
  private getMockRecruitingDashboard(): RecruitingDashboard {
    return {
      pipeline: {
        total: 45,
        byStage: {
          applied: 15,
          screening: 12,
          interview: 8,
          offer: 3,
          hired: 5,
          rejected: 2,
        },
        thisWeek: 8,
        avgTimeToHire: 18,
      },
      needsAction: {
        items: this.getMockRecruitingPipeline().filter(a => a.stage === 'screening' || a.stage === 'interview'),
        count: 4,
      },
      sourceAnalytics: this.getMockSourceAnalytics(),
      todaysInterviews: [],
    };
  }

  private getMockRecruitingPipeline(): Applicant[] {
    return [
      {
        id: '1',
        name: 'Jennifer Miller',
        position: 'Registered Nurse',
        stage: 'interview',
        score: 92,
        appliedDate: '2024-12-10',
        lastActivity: '2024-12-15',
        skills: ['Patient Care', 'Medication Management', 'Wound Care'],
        experience: 5,
        certifications: ['RN', 'CPR', 'BLS'],
        source: 'Indeed',
      },
      {
        id: '2',
        name: 'Marcus Thompson',
        position: 'Physical Therapist',
        stage: 'background',
        score: 88,
        appliedDate: '2024-12-08',
        lastActivity: '2024-12-14',
        skills: ['Rehabilitation', 'Mobility Training', 'Pain Management'],
        experience: 3,
        certifications: ['PT', 'CPR'],
        source: 'LinkedIn',
      },
      {
        id: '3',
        name: 'Lisa Rodriguez',
        position: 'Home Health Aide',
        stage: 'offer',
        score: 85,
        appliedDate: '2024-12-12',
        lastActivity: '2024-12-16',
        skills: ['Personal Care', 'Companionship', 'Light Housekeeping'],
        experience: 2,
        certifications: ['HHA', 'CPR'],
        source: 'Employee Referral',
      },
      {
        id: '4',
        name: 'Sarah Chen',
        position: 'Registered Nurse',
        stage: 'screening',
        score: 90,
        appliedDate: '2024-12-13',
        lastActivity: '2024-12-13',
        skills: ['Patient Assessment', 'OASIS-C', 'Home Health'],
        experience: 5,
        certifications: ['RN', 'CPR', 'OASIS-C'],
        source: 'Indeed',
      }
    ];
  }

  private getMockSourceAnalytics(): any {
    return {
      sources: [
        { source: 'Indeed', applicants: 45, hired: 12, costPerHire: 150 },
        { source: 'LinkedIn', applicants: 28, hired: 8, costPerHire: 200 },
        { source: 'Employee Referral', applicants: 22, hired: 15, costPerHire: 100 },
        { source: 'Company Website', applicants: 18, hired: 5, costPerHire: 50 },
        { source: 'ZipRecruiter', applicants: 15, hired: 4, costPerHire: 175 },
      ],
      totalApplications: 128,
      totalHired: 44,
      avgCostPerHire: 135,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const hrDashboardService = new HRDashboardService();
