// Training Management Service - Ohio Home Care Requirements
// CPR/First Aid, EVV Training, DODD Requirements, Annual In-Services

import { trainingApi } from './api';
import { shouldUseMockData } from '../config/environment';

export interface TrainingRequirement {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'mandatory' | 'role_specific' | 'optional';
  requiredFor: ('all' | 'stna' | 'hha' | 'rn' | 'lpn' | 'dodd')[];
  renewalPeriodMonths: number | null; // null = one-time
  inPersonRequired: boolean;
  source: 'odh' | 'oda' | 'dodd' | 'osha' | 'company';
}

export interface CaregiverTraining {
  id: string;
  caregiverId: string;
  caregiverName: string;
  trainingId: string;
  trainingName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired' | 'due_soon';
  assignedDate: string;
  dueDate: string;
  completedDate: string | null;
  expirationDate: string | null;
  certificateUrl: string | null;
  score: number | null; // For tests
  attempts: number;
  completedBy: string | null; // Instructor name for in-person
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  trainingName: string;
  sessionType: 'online' | 'in_person' | 'hybrid';
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  location: string | null;
  instructor: string | null;
  capacity: number;
  enrolled: number;
  enrolledCaregivers: { id: string; name: string }[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface TrainingDashboardStats {
  totalCaregivers: number;
  fullyCompliant: number;
  complianceRate: number;
  trainingsExpiringSoon: number;
  overdueTrainings: number;
  upcomingSessions: number;
  byCategory: {
    mandatory: { total: number; compliant: number };
    roleSpecific: { total: number; compliant: number };
    optional: { total: number; completed: number };
  };
}

// Ohio-specific training requirements
export const ohioTrainingRequirements: TrainingRequirement[] = [
  {
    id: 'tr-001',
    name: 'CPR Certification',
    code: 'CPR',
    description: 'American Heart Association or Red Cross CPR certification with in-person skills assessment',
    category: 'mandatory',
    requiredFor: ['all'],
    renewalPeriodMonths: 24,
    inPersonRequired: true,
    source: 'odh'
  },
  {
    id: 'tr-002',
    name: 'First Aid Certification',
    code: 'FA',
    description: 'Basic first aid certification with emergency response training',
    category: 'mandatory',
    requiredFor: ['all'],
    renewalPeriodMonths: 24,
    inPersonRequired: true,
    source: 'odh'
  },
  {
    id: 'tr-003',
    name: 'EVV System Training',
    code: 'EVV',
    description: 'Electronic Visit Verification system operation - Sandata Mobile Connect',
    category: 'mandatory',
    requiredFor: ['all'],
    renewalPeriodMonths: null,
    inPersonRequired: false,
    source: 'oda'
  },
  {
    id: 'tr-004',
    name: 'HIPAA Privacy & Security',
    code: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act compliance training',
    category: 'mandatory',
    requiredFor: ['all'],
    renewalPeriodMonths: 12,
    inPersonRequired: false,
    source: 'company'
  },
  {
    id: 'tr-005',
    name: 'Infection Control & Prevention',
    code: 'ICP',
    description: 'Standard precautions, hand hygiene, PPE usage',
    category: 'mandatory',
    requiredFor: ['all'],
    renewalPeriodMonths: 12,
    inPersonRequired: false,
    source: 'osha'
  },
  {
    id: 'tr-006',
    name: 'Patient Rights & Abuse Prevention',
    code: 'PRAP',
    description: 'Client rights, recognizing and reporting abuse, neglect, exploitation',
    category: 'mandatory',
    requiredFor: ['all'],
    renewalPeriodMonths: 12,
    inPersonRequired: false,
    source: 'odh'
  },
  {
    id: 'tr-007',
    name: 'Medication Assistance',
    code: 'MED',
    description: 'Assisting with self-administration of medications (non-skilled)',
    category: 'role_specific',
    requiredFor: ['stna', 'hha'],
    renewalPeriodMonths: 24,
    inPersonRequired: true,
    source: 'odh'
  },
  {
    id: 'tr-008',
    name: 'DODD Provider Training',
    code: 'DODD',
    description: 'Department of Developmental Disabilities provider certification training',
    category: 'role_specific',
    requiredFor: ['dodd'],
    renewalPeriodMonths: 12,
    inPersonRequired: true,
    source: 'dodd'
  },
  {
    id: 'tr-009',
    name: 'Dementia Care Basics',
    code: 'DEM',
    description: 'Understanding dementia, communication strategies, behavioral approaches',
    category: 'optional',
    requiredFor: ['all'],
    renewalPeriodMonths: null,
    inPersonRequired: false,
    source: 'company'
  },
  {
    id: 'tr-010',
    name: 'Body Mechanics & Safe Transfers',
    code: 'LIFT',
    description: 'Proper lifting techniques, transfer assistance, injury prevention',
    category: 'mandatory',
    requiredFor: ['stna', 'hha'],
    renewalPeriodMonths: 24,
    inPersonRequired: true,
    source: 'osha'
  }
];

// Mock caregiver training data
export const mockCaregiverTrainings: CaregiverTraining[] = [];

// Mock training sessions
export const mockTrainingSessions: TrainingSession[] = [];

export const mockTrainingStats: TrainingDashboardStats = {
  totalCaregivers: 0,
  fullyCompliant: 0,
  complianceRate: 0,
  trainingsExpiringSoon: 0,
  overdueTrainings: 0,
  upcomingSessions: 0,
  byCategory: {
    mandatory: { total: 0, compliant: 0 },
    roleSpecific: { total: 0, compliant: 0 },
    optional: { total: 0, completed: 0 }
  }
};

// Utility functions
export function getStatusColor(status: CaregiverTraining['status']): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'due_soon': return 'bg-yellow-100 text-yellow-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'not_started': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getCategoryColor(category: TrainingRequirement['category']): string {
  switch (category) {
    case 'mandatory': return 'bg-red-100 text-red-800';
    case 'role_specific': return 'bg-purple-100 text-purple-800';
    case 'optional': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// API Service Functions (with mock data fallback)
// ============================================================================

export const trainingService = {
  async getTypes(): Promise<TrainingRequirement[]> {
    if (shouldUseMockData()) {
      return ohioTrainingRequirements;
    }
    try {
      const result = await trainingApi.getTypes();
      return result.types.map(t => ({
        id: t.id,
        name: t.name,
        code: t.name.substring(0, 4).toUpperCase(),
        description: t.name,
        category: t.is_mandatory ? 'mandatory' : 'optional',
        requiredFor: ['all'] as const,
        renewalPeriodMonths: t.validity_period_months,
        inPersonRequired: t.requires_in_person,
        source: 'company' as const,
      })) as TrainingRequirement[];
    } catch (error) {
      console.error('Failed to fetch training types', error);
      throw error;
    }
  },

  async getAssignments(filters?: { status?: string; category?: string; overdue?: boolean; userId?: string }): Promise<{ assignments: CaregiverTraining[]; summary: any }> {
    if (shouldUseMockData()) {
      return {
        assignments: [],
        summary: {
          overdue: 0,
          dueSoon: 0,
          compliant: 0,
          pending: 0,
        },
      };
    }
    try {
      const result = await trainingApi.getAssignments(filters);
      return {
        assignments: result.assignments.map(a => ({
          id: a.id,
          caregiverId: a.user_id,
          caregiverName: a.user_name,
          trainingId: a.training_type_id,
          trainingName: a.training_name,
          status: mapApiStatusToLocal(a.complianceStatus),
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: a.due_date,
          completedDate: a.completed_date || null,
          expirationDate: a.expires_at || null,
          certificateUrl: null,
          score: a.score || null,
          attempts: 1,
          completedBy: null,
        })),
        summary: result.summary,
      };
    } catch (error) {
      console.error('Failed to fetch assignments', error);
      throw error;
    }
  },

  async getDashboard(): Promise<TrainingDashboardStats> {
    if (shouldUseMockData()) {
      return mockTrainingStats;
    }
    try {
      const result = await trainingApi.getDashboard();
      return {
        totalCaregivers: result.dashboard.totalEmployees,
        fullyCompliant: result.dashboard.compliant,
        complianceRate: result.dashboard.complianceRate,
        trainingsExpiringSoon: result.dashboard.dueSoon,
        overdueTrainings: result.dashboard.overdue,
        upcomingSessions: 3,
        byCategory: {
          mandatory: { total: 36, compliant: result.dashboard.compliant },
          roleSpecific: { total: 8, compliant: 6 },
          optional: { total: 12, completed: 5 },
        },
      };
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
      throw error;
    }
  },

  async getExpiring(days?: number): Promise<CaregiverTraining[]> {
    if (shouldUseMockData()) {
      return [];
    }
    try {
      const result = await trainingApi.getExpiring(days);
      return result.assignments.map(a => ({
        id: a.id,
        caregiverId: a.user_id,
        caregiverName: a.user_name,
        trainingId: a.training_type_id,
        trainingName: a.training_name,
        status: 'due_soon' as const,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: a.due_date,
        completedDate: a.completed_date || null,
        expirationDate: a.expires_at || null,
        certificateUrl: null,
        score: a.score || null,
        attempts: 1,
        completedBy: null,
      }));
    } catch (error) {
      console.error('Failed to fetch expiring', error);
      throw error;
    }
  },

  async assignTraining(data: { userId: string; trainingTypeId: string; dueDate: string; priority?: string; notes?: string }): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      await trainingApi.assignTraining(data);
      return { success: true };
    } catch (error) {
      console.error('Failed to assign training', error);
      return { success: false };
    }
  },

  async updateStatus(assignmentId: string, data: { status: string; score?: number; notes?: string }): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      await trainingApi.updateStatus(assignmentId, data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update status', error);
      return { success: false };
    }
  },

  // Get mock data directly
  getRequirements(): TrainingRequirement[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return ohioTrainingRequirements;
  },

  getAllTrainings(): CaregiverTraining[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockCaregiverTrainings;
  },

  getSessions(): TrainingSession[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockTrainingSessions;
  },

  getStats(): TrainingDashboardStats {
    if (!shouldUseMockData()) {
      return {
        totalCaregivers: 0,
        fullyCompliant: 0,
        complianceRate: 0,
        trainingsExpiringSoon: 0,
        overdueTrainings: 0,
        upcomingSessions: 0,
        byCategory: {
          mandatory: { total: 0, compliant: 0 },
          roleSpecific: { total: 0, compliant: 0 },
          optional: { total: 0, completed: 0 }
        }
      };
    }
    return mockTrainingStats;
  },
};

function mapApiStatusToLocal(status: string): CaregiverTraining['status'] {
  switch (status) {
    case 'compliant': return 'completed';
    case 'overdue': return 'expired';
    case 'due_soon': return 'due_soon';
    case 'pending': return 'not_started';
    default: return 'not_started';
  }
}
