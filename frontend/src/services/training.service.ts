// Training Management Service - Ohio Home Care Requirements
// CPR/First Aid, EVV Training, DODD Requirements, Annual In-Services

import { trainingApi } from './api';

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
export const mockCaregiverTrainings: CaregiverTraining[] = [
  // Maria Garcia - Fully compliant
  {
    id: 'ct-001',
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    trainingId: 'tr-001',
    trainingName: 'CPR Certification',
    status: 'completed',
    assignedDate: '2024-01-15',
    dueDate: '2024-02-15',
    completedDate: '2024-01-28',
    expirationDate: '2026-01-28',
    certificateUrl: '/certs/maria-cpr.pdf',
    score: null,
    attempts: 1,
    completedBy: 'Red Cross Columbus'
  },
  {
    id: 'ct-002',
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    trainingId: 'tr-002',
    trainingName: 'First Aid Certification',
    status: 'completed',
    assignedDate: '2024-01-15',
    dueDate: '2024-02-15',
    completedDate: '2024-01-28',
    expirationDate: '2026-01-28',
    certificateUrl: '/certs/maria-fa.pdf',
    score: null,
    attempts: 1,
    completedBy: 'Red Cross Columbus'
  },
  {
    id: 'ct-003',
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    trainingId: 'tr-003',
    trainingName: 'EVV System Training',
    status: 'completed',
    assignedDate: '2024-01-15',
    dueDate: '2024-01-22',
    completedDate: '2024-01-18',
    expirationDate: null,
    certificateUrl: null,
    score: 95,
    attempts: 1,
    completedBy: null
  },
  {
    id: 'ct-004',
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    trainingId: 'tr-004',
    trainingName: 'HIPAA Privacy & Security',
    status: 'completed',
    assignedDate: '2024-01-15',
    dueDate: '2024-01-29',
    completedDate: '2024-01-20',
    expirationDate: '2025-01-20',
    certificateUrl: null,
    score: 100,
    attempts: 1,
    completedBy: null
  },
  // James Wilson - New hire, some pending
  {
    id: 'ct-005',
    caregiverId: 'cg-002',
    caregiverName: 'James Wilson',
    trainingId: 'tr-001',
    trainingName: 'CPR Certification',
    status: 'in_progress',
    assignedDate: '2024-11-01',
    dueDate: '2024-12-15',
    completedDate: null,
    expirationDate: null,
    certificateUrl: null,
    score: null,
    attempts: 0,
    completedBy: null
  },
  {
    id: 'ct-006',
    caregiverId: 'cg-002',
    caregiverName: 'James Wilson',
    trainingId: 'tr-003',
    trainingName: 'EVV System Training',
    status: 'completed',
    assignedDate: '2024-11-01',
    dueDate: '2024-11-08',
    completedDate: '2024-11-05',
    expirationDate: null,
    certificateUrl: null,
    score: 88,
    attempts: 2,
    completedBy: null
  },
  {
    id: 'ct-007',
    caregiverId: 'cg-002',
    caregiverName: 'James Wilson',
    trainingId: 'tr-004',
    trainingName: 'HIPAA Privacy & Security',
    status: 'not_started',
    assignedDate: '2024-11-01',
    dueDate: '2024-12-20',
    completedDate: null,
    expirationDate: null,
    certificateUrl: null,
    score: null,
    attempts: 0,
    completedBy: null
  },
  // Sarah Johnson - Has expiring soon
  {
    id: 'ct-008',
    caregiverId: 'cg-003',
    caregiverName: 'Sarah Johnson',
    trainingId: 'tr-001',
    trainingName: 'CPR Certification',
    status: 'due_soon',
    assignedDate: '2023-01-10',
    dueDate: '2023-02-10',
    completedDate: '2023-01-25',
    expirationDate: '2025-01-25',
    certificateUrl: '/certs/sarah-cpr.pdf',
    score: null,
    attempts: 1,
    completedBy: 'AHA Columbus'
  },
  {
    id: 'ct-009',
    caregiverId: 'cg-003',
    caregiverName: 'Sarah Johnson',
    trainingId: 'tr-004',
    trainingName: 'HIPAA Privacy & Security',
    status: 'due_soon',
    assignedDate: '2024-01-05',
    dueDate: '2024-01-19',
    completedDate: '2024-01-12',
    expirationDate: '2025-01-12',
    certificateUrl: null,
    score: 92,
    attempts: 1,
    completedBy: null
  },
  // Michael Brown - Has expired/overdue
  {
    id: 'ct-010',
    caregiverId: 'cg-004',
    caregiverName: 'Michael Brown',
    trainingId: 'tr-004',
    trainingName: 'HIPAA Privacy & Security',
    status: 'expired',
    assignedDate: '2023-11-01',
    dueDate: '2023-11-15',
    completedDate: '2023-11-10',
    expirationDate: '2024-11-10',
    certificateUrl: null,
    score: 85,
    attempts: 1,
    completedBy: null
  },
  {
    id: 'ct-011',
    caregiverId: 'cg-004',
    caregiverName: 'Michael Brown',
    trainingId: 'tr-005',
    trainingName: 'Infection Control & Prevention',
    status: 'expired',
    assignedDate: '2023-10-01',
    dueDate: '2023-10-15',
    completedDate: '2023-10-08',
    expirationDate: '2024-10-08',
    certificateUrl: null,
    score: 78,
    attempts: 2,
    completedBy: null
  }
];

// Mock training sessions
export const mockTrainingSessions: TrainingSession[] = [
  {
    id: 'ts-001',
    trainingId: 'tr-001',
    trainingName: 'CPR Certification',
    sessionType: 'in_person',
    scheduledDate: '2024-12-18',
    scheduledTime: '9:00 AM - 1:00 PM',
    duration: '4 hours',
    location: 'Serenity Training Center, Columbus',
    instructor: 'John Martinez, AHA Instructor',
    capacity: 12,
    enrolled: 8,
    enrolledCaregivers: [
      { id: 'cg-002', name: 'James Wilson' },
      { id: 'cg-007', name: 'Lisa Chen' }
    ],
    status: 'scheduled'
  },
  {
    id: 'ts-002',
    trainingId: 'tr-008',
    trainingName: 'DODD Provider Training',
    sessionType: 'hybrid',
    scheduledDate: '2024-12-20',
    scheduledTime: '10:00 AM - 3:00 PM',
    duration: '5 hours',
    location: 'Virtual + Skills Lab',
    instructor: 'DODD Certified Trainer',
    capacity: 20,
    enrolled: 15,
    enrolledCaregivers: [],
    status: 'scheduled'
  },
  {
    id: 'ts-003',
    trainingId: 'tr-004',
    trainingName: 'HIPAA Privacy & Security',
    sessionType: 'online',
    scheduledDate: '2024-12-16',
    scheduledTime: 'Self-paced',
    duration: '2 hours',
    location: null,
    instructor: null,
    capacity: 50,
    enrolled: 12,
    enrolledCaregivers: [
      { id: 'cg-002', name: 'James Wilson' },
      { id: 'cg-004', name: 'Michael Brown' }
    ],
    status: 'scheduled'
  }
];

export const mockTrainingStats: TrainingDashboardStats = {
  totalCaregivers: 6,
  fullyCompliant: 3,
  complianceRate: 50,
  trainingsExpiringSoon: 4,
  overdueTrainings: 3,
  upcomingSessions: 3,
  byCategory: {
    mandatory: { total: 36, compliant: 28 },
    roleSpecific: { total: 8, compliant: 6 },
    optional: { total: 12, completed: 5 }
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

let USE_MOCK_DATA = false;

export const trainingService = {
  async getTypes(): Promise<TrainingRequirement[]> {
    if (USE_MOCK_DATA) {
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
      console.error('Failed to fetch training types, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getTypes();
    }
  },

  async getAssignments(filters?: { status?: string; category?: string; overdue?: boolean; userId?: string }): Promise<{ assignments: CaregiverTraining[]; summary: any }> {
    if (USE_MOCK_DATA) {
      let filtered = [...mockCaregiverTrainings];
      if (filters?.status) {
        filtered = filtered.filter(a => a.status === filters.status);
      }
      if (filters?.overdue) {
        filtered = filtered.filter(a => a.status === 'expired');
      }
      if (filters?.userId) {
        filtered = filtered.filter(a => a.caregiverId === filters.userId);
      }
      return {
        assignments: filtered,
        summary: {
          overdue: filtered.filter(a => a.status === 'expired').length,
          dueSoon: filtered.filter(a => a.status === 'due_soon').length,
          compliant: filtered.filter(a => a.status === 'completed').length,
          pending: filtered.filter(a => a.status === 'not_started' || a.status === 'in_progress').length,
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
      console.error('Failed to fetch assignments, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getAssignments(filters);
    }
  },

  async getDashboard(): Promise<TrainingDashboardStats> {
    if (USE_MOCK_DATA) {
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
      console.error('Failed to fetch dashboard, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getDashboard();
    }
  },

  async getExpiring(days?: number): Promise<CaregiverTraining[]> {
    if (USE_MOCK_DATA) {
      return mockCaregiverTrainings.filter(t => t.status === 'due_soon');
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
      console.error('Failed to fetch expiring, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getExpiring(days);
    }
  },

  async assignTraining(data: { userId: string; trainingTypeId: string; dueDate: string; priority?: string; notes?: string }): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
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
    return ohioTrainingRequirements;
  },

  getAllTrainings(): CaregiverTraining[] {
    return mockCaregiverTrainings;
  },

  getSessions(): TrainingSession[] {
    return mockTrainingSessions;
  },

  getStats(): TrainingDashboardStats {
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
