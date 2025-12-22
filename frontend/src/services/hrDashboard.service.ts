/**
 * HR & Talent Dashboard Service
 * Workforce management for 500+ staff with AI-powered recruiting
 * Integrates with backend APIs with mock fallback
 *
 * IMPORTANT: Mock data is ONLY used in development when VITE_USE_MOCK_DATA=true
 * Production should NEVER show mock data to users
 */

import { applicantsApi, interviewsApi, onboardingApi, Applicant as ApiApplicant, Interview, OnboardingChecklist, ApplicantPipelineSummary } from './api';
import { shouldUseMockData } from '../config/environment';

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
      // Only use mock data in development with flag enabled
      if (shouldUseMockData()) {
        console.warn('Backend API not available, using mock data (development only)');
        return this.getMockRecruitingDashboard();
      }
      // In production, return empty state
      console.error('Backend API not available');
      return this.getEmptyRecruitingDashboard();
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
      // Only use mock data in development
      if (shouldUseMockData()) {
        console.warn('Backend API not available, using mock data for recruiting pipeline');
        return this.getMockRecruitingPipeline();
      }
      console.error('Backend API not available');
      return [];
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
      if (shouldUseMockData()) {
        console.warn('Backend API not available');
        return this.getMockSourceAnalytics();
      }
      return { sources: [], totalApplications: 0, totalHired: 0, avgCostPerHire: 0 };
    }
  }

  async getEmployees(): Promise<Employee[]> {
    // TODO: Implement real API call to /api/console/hr/employees
    return [];
  }

  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    // TODO: Implement real API call
    return [];
  }

  async getRetentionAnalysis(): Promise<any> {
    // TODO: Implement real API call
    return { currentTurnoverRate: 0, industryAverage: 0, riskFactors: [], recommendations: [] };
  }

  async getSkillsGapAnalysis(): Promise<SkillsGap[]> {
    // TODO: Implement real API call
    return [];
  }

  async getCompensationAnalysis(): Promise<any> {
    // TODO: Implement real API call
    return { marketPosition: 'N/A', equityScore: 0, payRanges: {}, recommendations: [] };
  }

  async getDashboardMetrics(): Promise<HRDashboardMetrics> {
    try {
      // Try to get real data from pipeline
      const pipeline = await applicantsApi.getPipeline();
      return {
        totalStaff: 0, // TODO: Get from real users API
        openPositions: 0, // TODO: Get from job requisitions API
        pendingApplications: pipeline.byStage.applied + pipeline.byStage.screening,
        trainingCompliance: 0, // TODO: Get from training API
        avgTimeToHire: pipeline.avgTimeToHire || 0,
        turnoverRate: 0 // TODO: Calculate from real termination data
      };
    } catch (error) {
      return {
        totalStaff: 0,
        openPositions: 0,
        pendingApplications: 0,
        trainingCompliance: 0,
        avgTimeToHire: 0,
        turnoverRate: 0
      };
    }
  }

  // Empty state for production (when API fails and mock data is disabled)
  private getEmptyRecruitingDashboard(): RecruitingDashboard {
    return {
      pipeline: {
        total: 0,
        byStage: {
          applied: 0,
          screening: 0,
          interview: 0,
          offer: 0,
          hired: 0,
          rejected: 0,
        },
        thisWeek: 0,
        avgTimeToHire: 0,
      },
      needsAction: {
        items: [],
        count: 0,
      },
      sourceAnalytics: { sources: [], totalApplications: 0, totalHired: 0, avgCostPerHire: 0 },
      todaysInterviews: [],
    };
  }

  // Mock data fallbacks (only used in development with flag)
  private getMockRecruitingDashboard(): RecruitingDashboard {
    return {
      pipeline: {
        total: 0,
        byStage: {
          applied: 0,
          screening: 0,
          interview: 0,
          offer: 0,
          hired: 0,
          rejected: 0,
        },
        thisWeek: 0,
        avgTimeToHire: 0,
      },
      needsAction: {
        items: [],
        count: 0,
      },
      sourceAnalytics: this.getMockSourceAnalytics(),
      todaysInterviews: [],
    };
  }

  private getMockRecruitingPipeline(): Applicant[] {
    return [];
  }

  private getMockSourceAnalytics(): any {
    return {
      sources: [],
      totalApplications: 0,
      totalHired: 0,
      avgCostPerHire: 0,
    };
  }
}

export const hrDashboardService = new HRDashboardService();
