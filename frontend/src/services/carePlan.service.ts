// Care Plan Service - Client Care Plans and Authorization Tracking

import { clinicalApi } from './api';
import { shouldUseMockData } from '../config/environment';

export interface CarePlan {
  id: string;
  clientId: string;
  clientName: string;
  status: 'draft' | 'active' | 'pending_approval' | 'expired' | 'archived';
  effectiveDate: string;
  expirationDate: string;
  payer: {
    id: string;
    name: string;
    type: 'medicaid' | 'private_pay' | 'insurance' | 'va';
  };
  authorization: {
    number: string;
    unitsAuthorized: number;
    unitsUsed: number;
    unitType: 'hours' | '15min' | 'visits';
    startDate: string;
    endDate: string;
  };
  services: CarePlanService[];
  careTeam: CareTeamMember[];
  goals: CareGoal[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface CarePlanService {
  id: string;
  serviceCode: string;
  serviceName: string;
  frequency: string;
  duration: string;
  instructions: string;
  requiresCredential: string[];
}

export interface CareTeamMember {
  id: string;
  role: 'primary_caregiver' | 'backup_caregiver' | 'care_coordinator' | 'nurse' | 'family_contact';
  name: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface CareGoal {
  id: string;
  category: 'adl' | 'iadl' | 'safety' | 'social' | 'health';
  description: string;
  targetDate: string;
  status: 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  progress: number;
  notes: string;
}

export interface ADLAssessment {
  bathing: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  dressing: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  toileting: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  transferring: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  continence: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  feeding: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
}

export interface IADLAssessment {
  mealPreparation: 'independent' | 'needs_help' | 'unable';
  housekeeping: 'independent' | 'needs_help' | 'unable';
  laundry: 'independent' | 'needs_help' | 'unable';
  transportation: 'independent' | 'needs_help' | 'unable';
  shopping: 'independent' | 'needs_help' | 'unable';
  medicationManagement: 'independent' | 'needs_help' | 'unable';
  financialManagement: 'independent' | 'needs_help' | 'unable';
  phoneUse: 'independent' | 'needs_help' | 'unable';
}

// Mock care plans
export const mockCarePlans: CarePlan[] = [
  {
    id: 'cp-001',
    clientId: 'cl-001',
    clientName: 'Dorothy Williams',
    status: 'active',
    effectiveDate: '2024-01-01',
    expirationDate: '2024-12-31',
    payer: {
      id: 'payer-001',
      name: 'Ohio Medicaid - PASSPORT',
      type: 'medicaid'
    },
    authorization: {
      number: 'AUTH-2024-001234',
      unitsAuthorized: 480,
      unitsUsed: 320,
      unitType: '15min',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    services: [
      {
        id: 'svc-001',
        serviceCode: 'T1019',
        serviceName: 'Personal Care',
        frequency: '5 days/week',
        duration: '4 hours/day',
        instructions: 'Assist with bathing, dressing, grooming. Client uses walker.',
        requiresCredential: ['CPR', 'First Aid']
      },
      {
        id: 'svc-002',
        serviceCode: 'S5130',
        serviceName: 'Homemaker',
        frequency: '3 days/week',
        duration: '2 hours/day',
        instructions: 'Light housekeeping, laundry, meal preparation. Diabetic diet.',
        requiresCredential: []
      }
    ],
    careTeam: [
      {
        id: 'ct-001',
        role: 'primary_caregiver',
        name: 'Maria Garcia',
        phone: '614-555-1234',
        email: 'maria.garcia@email.com',
        isPrimary: true
      },
      {
        id: 'ct-002',
        role: 'backup_caregiver',
        name: 'Sarah Johnson',
        phone: '614-555-5678',
        email: 'sarah.johnson@email.com',
        isPrimary: false
      },
      {
        id: 'ct-003',
        role: 'care_coordinator',
        name: 'Jennifer Adams',
        phone: '614-555-9999',
        email: 'jadams@serenitycarepartners.com',
        isPrimary: false
      }
    ],
    goals: [
      {
        id: 'goal-001',
        category: 'adl',
        description: 'Maintain independence in feeding with supervision',
        targetDate: '2024-06-30',
        status: 'achieved',
        progress: 100,
        notes: 'Client successfully maintains feeding independence'
      },
      {
        id: 'goal-002',
        category: 'safety',
        description: 'Reduce fall risk through daily mobility exercises',
        targetDate: '2024-12-31',
        status: 'in_progress',
        progress: 65,
        notes: 'Client participates in exercises 4/5 days per week'
      }
    ],
    createdAt: '2023-12-15T10:00:00Z',
    updatedAt: '2024-11-20T14:30:00Z',
    createdBy: 'Jennifer Adams',
    approvedBy: 'Dr. Smith',
    approvedAt: '2023-12-20T09:00:00Z'
  },
  {
    id: 'cp-002',
    clientId: 'cl-002',
    clientName: 'Robert Johnson',
    status: 'active',
    effectiveDate: '2024-06-01',
    expirationDate: '2025-05-31',
    payer: {
      id: 'payer-002',
      name: 'Private Pay',
      type: 'private_pay'
    },
    authorization: {
      number: 'PP-2024-5678',
      unitsAuthorized: 160,
      unitsUsed: 80,
      unitType: 'hours',
      startDate: '2024-06-01',
      endDate: '2025-05-31'
    },
    services: [
      {
        id: 'svc-003',
        serviceCode: 'S5130',
        serviceName: 'Homemaker',
        frequency: '2 days/week',
        duration: '3 hours/day',
        instructions: 'Housekeeping, meal prep, grocery shopping assistance',
        requiresCredential: []
      }
    ],
    careTeam: [
      {
        id: 'ct-004',
        role: 'primary_caregiver',
        name: 'James Wilson',
        phone: '614-555-2345',
        email: 'james.wilson@email.com',
        isPrimary: true
      }
    ],
    goals: [
      {
        id: 'goal-003',
        category: 'iadl',
        description: 'Maintain clean and organized living environment',
        targetDate: '2025-05-31',
        status: 'in_progress',
        progress: 80,
        notes: 'Client home consistently well-maintained'
      }
    ],
    createdAt: '2024-05-20T11:00:00Z',
    updatedAt: '2024-10-15T09:00:00Z',
    createdBy: 'Jennifer Adams',
    approvedBy: null,
    approvedAt: null
  },
  {
    id: 'cp-003',
    clientId: 'cl-003',
    clientName: 'Margaret Davis',
    status: 'pending_approval',
    effectiveDate: '2025-01-01',
    expirationDate: '2025-12-31',
    payer: {
      id: 'payer-003',
      name: 'Ohio Medicaid - MyCare',
      type: 'medicaid'
    },
    authorization: {
      number: 'PENDING',
      unitsAuthorized: 520,
      unitsUsed: 0,
      unitType: '15min',
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    },
    services: [
      {
        id: 'svc-004',
        serviceCode: 'T1019',
        serviceName: 'Personal Care',
        frequency: '7 days/week',
        duration: '3 hours/day',
        instructions: 'Full personal care assistance. Client has early-stage dementia.',
        requiresCredential: ['CPR', 'First Aid', 'Dementia Care']
      },
      {
        id: 'svc-005',
        serviceCode: 'S5150',
        serviceName: 'Respite Care',
        frequency: '1 day/week',
        duration: '4 hours',
        instructions: 'Caregiver respite. Engage client in activities.',
        requiresCredential: ['CPR']
      }
    ],
    careTeam: [],
    goals: [
      {
        id: 'goal-004',
        category: 'safety',
        description: 'Implement dementia safety protocols',
        targetDate: '2025-03-31',
        status: 'in_progress',
        progress: 20,
        notes: 'Initial assessment completed'
      }
    ],
    createdAt: '2024-12-10T14:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
    createdBy: 'Jennifer Adams',
    approvedBy: null,
    approvedAt: null
  }
];

// Service code options (Ohio Medicaid)
export const serviceCodeOptions = [
  { code: 'T1019', name: 'Personal Care', rate: 7.24, unitType: '15min' },
  { code: 'S5130', name: 'Homemaker', rate: 5.85, unitType: '15min' },
  { code: 'S5150', name: 'Respite Care (In-Home)', rate: 6.50, unitType: '15min' },
  { code: 'S5151', name: 'Respite Care (Facility)', rate: 8.20, unitType: '15min' },
  { code: 'T2025', name: 'Waiver Services', rate: 7.15, unitType: '15min' }
];

// Goal category options
export const goalCategories = [
  { id: 'adl', name: 'Activities of Daily Living (ADL)', description: 'Bathing, dressing, toileting, transferring, feeding' },
  { id: 'iadl', name: 'Instrumental ADL', description: 'Cooking, cleaning, shopping, medication management' },
  { id: 'safety', name: 'Safety', description: 'Fall prevention, emergency preparedness, home safety' },
  { id: 'social', name: 'Social & Emotional', description: 'Social engagement, mental health, quality of life' },
  { id: 'health', name: 'Health Management', description: 'Chronic disease management, vital signs, nutrition' }
];

// Utility functions
export function getStatusColor(status: CarePlan['status']): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'archived': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getGoalStatusColor(status: CareGoal['status']): string {
  switch (status) {
    case 'achieved': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'modified': return 'bg-yellow-100 text-yellow-800';
    case 'discontinued': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function calculateAuthorizationUsage(auth: CarePlan['authorization']): number {
  return Math.round((auth.unitsUsed / auth.unitsAuthorized) * 100);
}

export function getAuthorizationStatus(auth: CarePlan['authorization']): 'ok' | 'warning' | 'critical' {
  const usage = calculateAuthorizationUsage(auth);
  if (usage >= 90) return 'critical';
  if (usage >= 75) return 'warning';
  return 'ok';
}

// ============================================================================
// API Service Functions (with mock data fallback)
// ============================================================================

export const carePlanService = {
  async getCarePlan(clientId: string): Promise<CarePlan | null> {
    if (shouldUseMockData()) {
      return mockCarePlans.find(cp => cp.clientId === clientId) || null;
    }
    try {
      const result = await clinicalApi.getCarePlan(clientId);
      if (!result.carePlan) return null;
      // Map API response to local interface if needed
      // For now, return mock data since the API structure is different
      return mockCarePlans.find(cp => cp.clientId === clientId) || null;
    } catch (error) {
      console.error('Failed to fetch care plan', error);
      return null;
    }
  },

  async getAllCarePlans(): Promise<CarePlan[]> {
    if (shouldUseMockData()) {
      return mockCarePlans;
    }
    // API doesn't have a bulk endpoint, return empty for now
    return [];
  },

  async createCarePlan(clientId: string, data: Partial<CarePlan>): Promise<{ success: boolean; carePlanId?: string }> {
    if (shouldUseMockData()) {
      return { success: true, carePlanId: 'new-cp-001' };
    }
    try {
      const result = await clinicalApi.createCarePlan(clientId, {
        goals: data.goals?.map(g => g.description) || [],
        tasks: data.services?.map(s => ({
          id: s.id,
          name: s.serviceName,
          category: 'personal_care',
          frequency: s.frequency,
          instructions: s.instructions,
          required: true,
        })) || [],
        specialInstructions: '',
        preferences: {},
        emergencyProcedures: '',
      });
      return { success: true, carePlanId: result.carePlanId };
    } catch (error) {
      console.error('Failed to create care plan', error);
      return { success: false };
    }
  },

  async updateCarePlan(carePlanId: string, data: Partial<CarePlan>): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      await clinicalApi.updateCarePlan(carePlanId, {
        goals: data.goals?.map(g => g.description),
        tasks: data.services?.map(s => ({
          id: s.id,
          name: s.serviceName,
          category: 'personal_care',
          frequency: s.frequency,
          instructions: s.instructions,
          required: true,
        })),
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to update care plan', error);
      return { success: false };
    }
  },

  async getTaskTemplates(category?: string): Promise<any[]> {
    if (shouldUseMockData()) {
      return [];
    }
    try {
      const result = await clinicalApi.getTaskTemplates(category);
      return result.templates;
    } catch (error) {
      console.error('Failed to fetch task templates', error);
      return [];
    }
  },

  async updateMedicalInfo(clientId: string, data: any): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      await clinicalApi.updateMedicalInfo(clientId, data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update medical info', error);
      return { success: false };
    }
  },

  // Get mock data directly
  getAll(): CarePlan[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockCarePlans;
  },

  getServiceCodes(): typeof serviceCodeOptions {
    if (!shouldUseMockData()) {
      return [];
    }
    return serviceCodeOptions;
  },

  getGoalCategories(): typeof goalCategories {
    if (!shouldUseMockData()) {
      return [];
    }
    return goalCategories;
  },
};
