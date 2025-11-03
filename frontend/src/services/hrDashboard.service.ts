/**
 * HR & Talent Dashboard Service
 * Workforce management for 500+ staff with AI-powered recruiting
 */

export interface Applicant {
  id: string;
  name: string;
  position: string;
  stage: 'screening' | 'interview' | 'background' | 'offer' | 'hired' | 'rejected';
  score: number;
  appliedDate: string;
  lastActivity: string;
  skills: string[];
  experience: number;
  certifications: string[];
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

class HRDashboardService {
  async getRecruitingPipeline(): Promise<Applicant[]> {
    await this.delay(500);
    return [
      {
        id: '1',
        name: 'Jennifer Miller',
        position: 'Registered Nurse',
        stage: 'interview',
        score: 92,
        appliedDate: '2024-01-10',
        lastActivity: '2024-01-15',
        skills: ['Patient Care', 'Medication Management', 'Wound Care'],
        experience: 5,
        certifications: ['RN', 'CPR', 'BLS']
      },
      {
        id: '2',
        name: 'Marcus Thompson',
        position: 'Physical Therapist',
        stage: 'background',
        score: 88,
        appliedDate: '2024-01-08',
        lastActivity: '2024-01-14',
        skills: ['Rehabilitation', 'Mobility Training', 'Pain Management'],
        experience: 3,
        certifications: ['PT', 'CPR']
      },
      {
        id: '3',
        name: 'Lisa Rodriguez',
        position: 'Home Health Aide',
        stage: 'offer',
        score: 85,
        appliedDate: '2024-01-12',
        lastActivity: '2024-01-16',
        skills: ['Personal Care', 'Companionship', 'Light Housekeeping'],
        experience: 2,
        certifications: ['HHA', 'CPR']
      }
    ];
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
        reviewPeriod: 'Q4 2023',
        overallScore: 94,
        goals: [
          { description: 'Complete advanced wound care training', status: 'completed' },
          { description: 'Mentor 2 new caregivers', status: 'in-progress' },
          { description: 'Maintain 98% patient satisfaction', status: 'completed' }
        ],
        strengths: ['Patient advocacy', 'Clinical skills', 'Reliability'],
        improvements: ['Documentation efficiency', 'Time management'],
        nextReviewDate: '2024-04-15'
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const hrDashboardService = new HRDashboardService();