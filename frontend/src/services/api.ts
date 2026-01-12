/**
 * API Client for Serenity ERP
 * Handles all HTTP communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Token storage keys
const ACCESS_TOKEN_KEY = 'serenity_access_token';
const REFRESH_TOKEN_KEY = 'serenity_refresh_token';

/**
 * Get stored tokens
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear tokens (logout)
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Make authenticated API request
 */
/**
 * Make authenticated API request
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the request with new token
      const newToken = getAccessToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!retryResponse.ok) {
        throw new ApiError(retryResponse.status, retryResponse.statusText);
      }

      return retryResponse.json();
    } else {
      // Refresh failed - throw error and let the calling code/auth context handle it
      // DON'T clear tokens or redirect here - let DashboardLayout handle auth state
      console.warn('[API] Token refresh failed for:', endpoint);
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json();
}

/**
 * Try to refresh the access token
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Auth API
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    status: string;
  };
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    status: string;
    permissions?: string[];
    podMemberships?: PodMembership[];
  };
}

export interface PodMembership {
  podId: string;
  podCode: string;
  podName: string;
  roleInPod: string;
  isPrimary: boolean;
  accessLevel: 'standard' | 'elevated' | 'emergency';
  expiresAt?: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorData);
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserResponse> {
    return request<UserResponse>('/api/auth/me');
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
};

// ============================================================================
// Console API (Dashboard Data)
// ============================================================================

export interface Shift {
  id: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  podId: string;
  podCode: string;
}

export interface Caregiver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  podId: string;
  podCode: string;
  certifications: string[];
}

export interface Authorization {
  id: string;
  authorizationNumber: string;
  serviceCode: string;
  unitsApproved: number;
  unitsUsed: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  medicaidNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  status: string;
  podId?: string;
  podCode?: string;
  podName?: string;
  authorizations?: Authorization[];
}

export interface Pod {
  id: string;
  code: string;
  name: string;
  region: string;
  status: string;
  caregiverCount: number;
  clientCount: number;
}

export const consoleApi = {
  /**
   * Get today's shifts
   */
  async getShifts(): Promise<{ shifts: Shift[] }> {
    return request<{ shifts: Shift[] }>('/api/console/shifts');
  },

  /**
   * Get all caregivers
   */
  async getCaregivers(): Promise<{ caregivers: Caregiver[] }> {
    return request<{ caregivers: Caregiver[] }>('/api/console/caregivers');
  },

  /**
   * Get all clients
   */
  async getClients(organizationId: string): Promise<{ clients: Client[] }> {
    return request<{ clients: Client[] }>(`/api/console/clients/${organizationId}`);
  },

  /**
   * Get single client details
   */
  async getClient(organizationId: string, clientId: string): Promise<Client> {
    return request<Client>(`/api/console/clients/${organizationId}/${clientId}`);
  },

  /**
   * Get client schedule
   */
  async getClientSchedule(organizationId: string, clientId: string, startDate?: string, endDate?: string): Promise<{ shifts: Shift[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request<{ shifts: Shift[] }>(`/api/console/clients/${organizationId}/${clientId}/schedule?${params.toString()}`);
  },

  /**
   * Get all pods
   */
  async getPods(): Promise<{ pods: Pod[] }> {
    return request<{ pods: Pod[] }>('/api/console/pods');
  },
};

// ============================================================================
// Health API
// ============================================================================

export const healthApi = {
  /**
   * Check API health
   */
  async check(): Promise<{ status: string; database: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

// ============================================================================
// Bonus API
// ============================================================================

export interface BonusConfig {
  ninetyDayBonusAmount: number;
  ninetyDayBonusEnabled: boolean;
  showUpBonusAmount: number;
  showUpBonusEnabled: boolean;
  showUpShiftThreshold: number;
  showUpEvvThreshold: number;
  hoursBonusPercentage: number;
  hoursBonusEnabled: boolean;
  loyaltyBonusEnabled: boolean;
  loyaltyBonusYear1: number;
  loyaltyBonusYear2: number;
  loyaltyBonusYear3: number;
  loyaltyBonusYear4: number;
  loyaltyBonusYear5Plus: number;
}

export interface BonusDashboardResponse {
  period: {
    quarter: number;
    year: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCaregivers: number;
    eligibleForShowUp: number;
    ineligible: number;
    eligibilityRate: number;
    totalPotentialPayout: number;
    newHires: number;
  };
  disqualificationBreakdown: Record<string, number>;
  caregivers: any[];
  timestamp: string;
}

export interface BonusPayout {
  id: string;
  caregiver_id: string;
  caregiver_name: string;
  bonus_type: string;
  period_label: string;
  amount: number;
  status: string;
  scheduled_payout_date: string;
  approved_by_name?: string;
  payroll_reference?: string;
}

export const bonusApi = {
  async getConfig(): Promise<{ config: BonusConfig }> {
    return request<{ config: BonusConfig }>('/api/console/bonus/config');
  },

  async updateConfig(updates: Partial<BonusConfig>): Promise<{ message: string }> {
    return request<{ message: string }>('/api/console/bonus/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getDashboard(quarter?: number, year?: number): Promise<BonusDashboardResponse> {
    const params = new URLSearchParams();
    if (quarter) params.append('quarter', quarter.toString());
    if (year) params.append('year', year.toString());
    return request<BonusDashboardResponse>(`/api/console/bonus/dashboard?${params.toString()}`);
  },

  async getCaregiverBonus(caregiverId: string): Promise<any> {
    return request<any>(`/api/console/bonus/caregivers/${caregiverId}`);
  },

  async getPayouts(filters?: { caregiverId?: string; bonusType?: string; status?: string; year?: number }): Promise<{ payouts: BonusPayout[]; totals: Record<string, number> }> {
    const params = new URLSearchParams();
    if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
    if (filters?.bonusType) params.append('bonusType', filters.bonusType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.year) params.append('year', filters.year.toString());
    return request<{ payouts: BonusPayout[]; totals: Record<string, number> }>(`/api/console/bonus/payouts?${params.toString()}`);
  },

  async createPayout(data: { caregiverId: string; bonusType: string; periodLabel: string; amount: number; scheduledPayoutDate: string }): Promise<{ id: string }> {
    return request<{ id: string }>('/api/console/bonus/payouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approvePayout(payoutId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/console/bonus/payouts/${payoutId}/approve`, {
      method: 'PUT',
    });
  },

  async markPaid(payoutId: string, payrollReference: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/console/bonus/payouts/${payoutId}/paid`, {
      method: 'PUT',
      body: JSON.stringify({ payrollReference }),
    });
  },

  async getNcns(filters?: { caregiverId?: string; startDate?: string; endDate?: string; excused?: boolean }): Promise<{ incidents: any[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.excused !== undefined) params.append('excused', filters.excused.toString());
    return request<{ incidents: any[]; count: number }>(`/api/console/bonus/ncns?${params.toString()}`);
  },

  async getComplaints(filters?: { caregiverId?: string; status?: string }): Promise<{ complaints: any[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
    if (filters?.status) params.append('status', filters.status);
    return request<{ complaints: any[]; count: number }>(`/api/console/bonus/complaints?${params.toString()}`);
  },

  async getCalendar(year?: number): Promise<any> {
    const params = year ? `?year=${year}` : '';
    return request<any>(`/api/console/bonus/calendar${params}`);
  },
};

// ============================================================================
// Training API
// ============================================================================

export interface TrainingType {
  id: string;
  name: string;
  category: string;
  duration_hours: number;
  validity_period_months: number;
  is_mandatory: boolean;
  requires_in_person: boolean;
}

export interface TrainingAssignment {
  id: string;
  user_id: string;
  user_name: string;
  training_type_id: string;
  training_name: string;
  category: string;
  due_date: string;
  status: string;
  completed_date?: string;
  score?: number;
  expires_at?: string;
  complianceStatus: 'compliant' | 'due_soon' | 'overdue' | 'pending';
}

export interface TrainingDashboard {
  complianceRate: number;
  totalEmployees: number;
  compliant: number;
  overdue: number;
  dueSoon: number;
  expiringIn30Days: number;
  byCategory: Record<string, { total: number; compliant: number; overdue: number }>;
  topIssues: any[];
}

export const trainingApi = {
  async getTypes(): Promise<{ types: TrainingType[] }> {
    return request<{ types: TrainingType[] }>('/api/console/training/types');
  },

  async getAssignments(filters?: { status?: string; category?: string; overdue?: boolean; userId?: string }): Promise<{ assignments: TrainingAssignment[]; summary: any }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.overdue) params.append('overdue', 'true');
    if (filters?.userId) params.append('userId', filters.userId);
    return request<{ assignments: TrainingAssignment[]; summary: any }>(`/api/console/training/assignments?${params.toString()}`);
  },

  async getUserAssignments(userId: string): Promise<{ assignments: TrainingAssignment[] }> {
    return request<{ assignments: TrainingAssignment[] }>(`/api/console/training/users/${userId}/assignments`);
  },

  async assignTraining(data: { userId: string; trainingTypeId: string; dueDate: string; priority?: string; notes?: string }): Promise<{ assignment: TrainingAssignment }> {
    return request<{ assignment: TrainingAssignment }>('/api/console/training/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async bulkAssign(data: { userIds: string[]; trainingTypeId: string; dueDate: string; priority?: string }): Promise<{ assigned: number; skipped: number }> {
    return request<{ assigned: number; skipped: number }>('/api/console/training/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(assignmentId: string, data: { status: string; score?: number; notes?: string; verifyCompletion?: boolean }): Promise<{ assignment: TrainingAssignment }> {
    return request<{ assignment: TrainingAssignment }>(`/api/console/training/assignments/${assignmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getCompliance(): Promise<{ report: any }> {
    return request<{ report: any }>('/api/console/training/compliance');
  },

  async getExpiring(days?: number): Promise<{ assignments: TrainingAssignment[] }> {
    const params = days ? `?days=${days}` : '';
    return request<{ assignments: TrainingAssignment[] }>(`/api/console/training/expiring${params}`);
  },

  async getDashboard(): Promise<{ dashboard: TrainingDashboard }> {
    return request<{ dashboard: TrainingDashboard }>('/api/console/training/dashboard');
  },
};

// ============================================================================
// Dispatch API
// ============================================================================

export interface CoverageGap {
  id: string;
  shiftId: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  scheduledStart: string;
  scheduledEnd: string;
  serviceType: string;
  reason: 'no_show' | 'call_off' | 'unassigned' | 'terminated';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'dispatched' | 'covered' | 'cancelled';
  originalCaregiverId?: string;
  originalCaregiverName?: string;
}

export interface DispatchCandidate {
  caregiverId: string;
  caregiverName: string;
  phone: string;
  distanceMiles: number;
  matchScore: number;
  availability: string;
  credentials: string[];
  hoursThisWeek: number;
  previouslyServedClient: boolean;
}

export interface DispatchDashboard {
  totalGaps: number;
  byUrgency: { critical: number; high: number; medium: number; low: number };
  byReason: { no_show: number; call_off: number; unassigned: number };
  availableCaregivers: number;
  fillRateToday: number;
  avgTimeToFill: string;
}

export const dispatchApi = {
  async getDashboard(): Promise<DispatchDashboard> {
    return request<DispatchDashboard>('/api/console/dispatch-alerts/dashboard');
  },

  async getGaps(options?: { includeUnassigned?: boolean; lookAheadHours?: number }): Promise<{ gaps: CoverageGap[]; summary: any }> {
    const params = new URLSearchParams();
    if (options?.includeUnassigned !== undefined) params.append('includeUnassigned', options.includeUnassigned.toString());
    if (options?.lookAheadHours) params.append('lookAheadHours', options.lookAheadHours.toString());
    return request<{ gaps: CoverageGap[]; summary: any }>(`/api/console/dispatch-alerts/gaps?${params.toString()}`);
  },

  async getCandidates(gapId: string, options?: { maxDistance?: number; maxCandidates?: number }): Promise<{ gap: CoverageGap; candidates: DispatchCandidate[] }> {
    const params = new URLSearchParams();
    if (options?.maxDistance) params.append('maxDistance', options.maxDistance.toString());
    if (options?.maxCandidates) params.append('maxCandidates', options.maxCandidates.toString());
    return request<{ gap: CoverageGap; candidates: DispatchCandidate[] }>(`/api/console/dispatch-alerts/gaps/${gapId}/candidates?${params.toString()}`);
  },

  async dispatch(gapId: string, data: { caregiverIds?: string[]; methods?: string[]; batchSize?: number }): Promise<{ message: string; notifications: any[] }> {
    return request<{ message: string; notifications: any[] }>(`/api/console/dispatch-alerts/gaps/${gapId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async assignGap(gapId: string, caregiverId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/console/dispatch-alerts/gaps/${gapId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ caregiverId }),
    });
  },

  async respond(gapId: string, accepted: boolean): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/console/dispatch-alerts/respond', {
      method: 'POST',
      body: JSON.stringify({ gapId, accepted }),
    });
  },

  // Legacy gap routes
  async getActiveGaps(podId?: string): Promise<any> {
    const params = podId ? `?podId=${podId}` : '';
    return request<any>(`/api/console/gaps/active${params}`);
  },

  async markNotified(gapId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/console/gaps/${gapId}/mark-notified`, {
      method: 'POST',
    });
  },

  async markDispatched(gapId: string, replacementCaregiverId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/console/gaps/${gapId}/mark-dispatched`, {
      method: 'POST',
      body: JSON.stringify({ replacementCaregiverId }),
    });
  },

  async markCovered(gapId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/console/gaps/${gapId}/mark-covered`, {
      method: 'POST',
    });
  },

  async cancelGap(gapId: string, reason: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/console/gaps/${gapId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getStatistics(options?: { podId?: string; startDate?: string; endDate?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.podId) params.append('podId', options.podId);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    return request<any>(`/api/console/gaps/statistics?${params.toString()}`);
  },
};

// ============================================================================
// Clinical API (Care Plans)
// ============================================================================

export interface CarePlan {
  id: string;
  client_id: string;
  organization_id: string;
  goals: string[];
  tasks: CareTask[];
  special_instructions: string;
  preferences: Record<string, any>;
  emergency_procedures: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  version: number;
}

export interface CareTask {
  id: string;
  name: string;
  category: string;
  frequency: string;
  instructions: string;
  required: boolean;
}

export const clinicalApi = {
  async getVisitDetails(visitId: string): Promise<any> {
    return request<any>(`/api/clinical/visits/${visitId}/details`);
  },

  async getTaskTemplates(category?: string): Promise<{ templates: any[]; categories: string[] }> {
    const params = category ? `?category=${category}` : '';
    return request<{ templates: any[]; categories: string[] }>(`/api/clinical/task-templates${params}`);
  },

  async getIntakeChecklist(): Promise<{ checklist: any }> {
    return request<{ checklist: any }>('/api/clinical/intake-checklist');
  },

  async getCarePlan(clientId: string): Promise<{ carePlan: CarePlan | null }> {
    return request<{ carePlan: CarePlan | null }>(`/api/clinical/clients/${clientId}/care-plan`);
  },

  async createCarePlan(clientId: string, data: { goals: string[]; tasks: CareTask[]; specialInstructions: string; preferences: Record<string, any>; emergencyProcedures: string }): Promise<{ carePlanId: string }> {
    return request<{ carePlanId: string }>(`/api/clinical/clients/${clientId}/care-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCarePlan(carePlanId: string, data: Partial<{ goals: string[]; tasks: CareTask[]; specialInstructions: string; preferences: Record<string, any>; emergencyProcedures: string }>): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/clinical/care-plans/${carePlanId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateMedicalInfo(clientId: string, data: { allergies?: string[]; diagnoses?: string[]; medications?: any[]; physicianName?: string; physicianPhone?: string }): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/clinical/clients/${clientId}/medical-info`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async documentVisitTasks(visitId: string, tasks: any[]): Promise<{ taskCount: number }> {
    return request<{ taskCount: number }>(`/api/clinical/visits/${visitId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
  },

  async getIntakeStatus(clientId: string): Promise<{ isComplete: boolean; missingItems: string[]; completedItems: string[] }> {
    return request<{ isComplete: boolean; missingItems: string[]; completedItems: string[] }>(`/api/clinical/clients/${clientId}/intake-status`);
  },
};

// ============================================================================
// Applicants / Recruiting API
// ============================================================================

export interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position_applied_for: string;
  source: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  status: 'active' | 'withdrawn' | 'hired' | 'rejected';
  created_at: string;
  updated_at: string;
  experience_level?: string;
  certifications?: string[];
  skills?: string[];
  availability?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  available_start_date?: string;
  referred_by?: string;
}

export interface ApplicantPipelineSummary {
  total: number;
  byStage: {
    applied: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
    rejected: number;
  };
  thisWeek: number;
  avgTimeToHire: number;
}

export const applicantsApi = {
  async getDashboard(): Promise<{ pipeline: ApplicantPipelineSummary; needsAction: { items: Applicant[]; count: number }; sourceAnalytics: any }> {
    return request<any>('/api/console/applicants/dashboard');
  },

  async getPipeline(): Promise<ApplicantPipelineSummary> {
    return request<any>('/api/console/applicants/pipeline');
  },

  async getApplicants(filters?: { status?: string; stage?: string; position?: string; source?: string; search?: string }): Promise<{ applicants: Applicant[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.position) params.append('position', filters.position);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.search) params.append('search', filters.search);
    return request<{ applicants: Applicant[]; count: number }>(`/api/console/applicants?${params.toString()}`);
  },

  async getApplicant(id: string): Promise<{ applicant: Applicant }> {
    return request<{ applicant: Applicant }>(`/api/console/applicants/${id}`);
  },

  async createApplicant(data: Partial<Applicant>): Promise<{ applicant: Applicant }> {
    return request<{ applicant: Applicant }>('/api/console/applicants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApplicant(id: string, data: Partial<Applicant>): Promise<{ applicant: Applicant }> {
    return request<{ applicant: Applicant }>(`/api/console/applicants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async advanceStage(id: string, stage: string): Promise<{ applicant: Applicant }> {
    return request<{ applicant: Applicant }>(`/api/console/applicants/${id}/advance`, {
      method: 'POST',
      body: JSON.stringify({ stage }),
    });
  },

  async rejectApplicant(id: string, reason: string): Promise<{ applicant: Applicant }> {
    return request<{ applicant: Applicant }>(`/api/console/applicants/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async hireApplicant(id: string, employeeId?: string): Promise<{ applicant: Applicant }> {
    return request<{ applicant: Applicant }>(`/api/console/applicants/${id}/hire`, {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    });
  },

  async getSourceAnalytics(period?: string): Promise<{ analytics: any }> {
    const params = period ? `?period=${period}` : '';
    return request<{ analytics: any }>(`/api/console/applicants/analytics/sources${params}`);
  },

  async checkDuplicate(email: string, phone?: string): Promise<{ hasDuplicates: boolean; duplicates: Applicant[] }> {
    const params = new URLSearchParams({ email });
    if (phone) params.append('phone', phone);
    return request<{ hasDuplicates: boolean; duplicates: Applicant[] }>(`/api/console/applicants/check-duplicate?${params.toString()}`);
  },
};

// ============================================================================
// Interviews API
// ============================================================================

export interface Interview {
  id: string;
  applicant_id: string;
  applicant_name: string;
  position: string;
  interview_type: 'phone' | 'video' | 'in_person';
  scheduled_at: string;
  duration_minutes: number;
  interviewer_id: string;
  interviewer_name: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  meeting_link?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}

export const interviewsApi = {
  async getInterviews(filters?: { status?: string; date?: string; interviewerId?: string }): Promise<{ interviews: Interview[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.interviewerId) params.append('interviewerId', filters.interviewerId);
    return request<{ interviews: Interview[]; count: number }>(`/api/console/interviews?${params.toString()}`);
  },

  async getInterview(id: string): Promise<{ interview: Interview }> {
    return request<{ interview: Interview }>(`/api/console/interviews/${id}`);
  },

  async scheduleInterview(data: { applicantId: string; interviewType: string; scheduledAt: string; durationMinutes?: number; interviewerId?: string; location?: string; meetingLink?: string }): Promise<{ interview: Interview }> {
    return request<{ interview: Interview }>('/api/console/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateInterview(id: string, data: Partial<Interview>): Promise<{ interview: Interview }> {
    return request<{ interview: Interview }>(`/api/console/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async completeInterview(id: string, data: { rating: number; feedback: string; recommendation?: string }): Promise<{ interview: Interview }> {
    return request<{ interview: Interview }>(`/api/console/interviews/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelInterview(id: string, reason?: string): Promise<{ interview: Interview }> {
    return request<{ interview: Interview }>(`/api/console/interviews/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getTodaysInterviews(): Promise<{ interviews: Interview[] }> {
    return request<{ interviews: Interview[] }>('/api/console/interviews/today');
  },
};

// ============================================================================
// Onboarding API
// ============================================================================

export interface OnboardingChecklist {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  hire_date: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  items: OnboardingItem[];
}

export interface OnboardingItem {
  id: string;
  step: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  required: boolean;
  order: number;
}

export const onboardingApi = {
  async getChecklists(filters?: { status?: string }): Promise<{ checklists: OnboardingChecklist[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    return request<{ checklists: OnboardingChecklist[]; count: number }>(`/api/console/onboarding?${params.toString()}`);
  },

  async getChecklist(employeeId: string): Promise<{ employee: any; checklist: OnboardingItem[] }> {
    return request<{ employee: any; checklist: OnboardingItem[] }>(`/api/console/onboarding/${employeeId}`);
  },

  async updateItemStatus(employeeId: string, itemId: string, status: string): Promise<{ item: OnboardingItem }> {
    return request<{ item: OnboardingItem }>(`/api/console/onboarding/${employeeId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async addNote(employeeId: string, itemId: string, notes: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/console/onboarding/${employeeId}/items/${itemId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async getProgress(employeeId: string): Promise<{ progress: { total: number; completed: number; percentage: number } }> {
    return request<any>(`/api/console/onboarding/${employeeId}/progress`);
  },

  async completeOnboarding(employeeId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/console/onboarding/${employeeId}/complete`, {
      method: 'POST',
    });
  },
};

// ============================================================================
// AR Aging API
// ============================================================================

export interface ARAgingSummary {
  current: { count: number; amount: number };
  days_1_30: { count: number; amount: number };
  days_31_60: { count: number; amount: number };
  days_61_90: { count: number; amount: number };
  days_91_plus: { count: number; amount: number };
  total: { count: number; amount: number };
}

export interface ARKPIs {
  dso: number; // Days Sales Outstanding
  collectionRate: number;
  denialRate: number;
  cleanClaimRate: number;
  avgPaymentTime: number;
}

export interface ARAgingDetail {
  claim_id: string;
  claim_number: string;
  client_name: string;
  payer_name: string;
  service_date: string;
  submission_date: string;
  amount: number;
  days_outstanding: number;
  bucket: string;
  status: string;
}

export const arAgingApi = {
  async getDashboard(): Promise<{ summary: ARAgingSummary; kpis: ARKPIs; byPayer: any[]; atRisk: any[]; trend: any[] }> {
    return request<any>('/api/console/ar-aging/dashboard');
  },

  async getSummary(): Promise<{ summary: ARAgingSummary }> {
    return request<{ summary: ARAgingSummary }>('/api/console/ar-aging/summary');
  },

  async getByPayer(): Promise<{ byPayer: any[] }> {
    return request<{ byPayer: any[] }>('/api/console/ar-aging/by-payer');
  },

  async getDetails(filters?: { payerId?: string; bucket?: string; clientId?: string }): Promise<{ details: ARAgingDetail[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.payerId) params.append('payerId', filters.payerId);
    if (filters?.bucket) params.append('bucket', filters.bucket);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    return request<{ details: ARAgingDetail[]; count: number }>(`/api/console/ar-aging/details?${params.toString()}`);
  },

  async getKPIs(): Promise<{ kpis: ARKPIs }> {
    return request<{ kpis: ARKPIs }>('/api/console/ar-aging/kpis');
  },

  async getTrend(days?: number): Promise<{ trend: any[] }> {
    const params = days ? `?days=${days}` : '';
    return request<{ trend: any[] }>(`/api/console/ar-aging/trend${params}`);
  },

  async getAtRisk(): Promise<{ atRisk: any[]; count: number }> {
    return request<{ atRisk: any[]; count: number }>('/api/console/ar-aging/at-risk');
  },

  async getPayerPerformance(): Promise<{ performance: any[] }> {
    return request<{ performance: any[] }>('/api/console/ar-aging/payer-performance');
  },

  async generateSnapshot(): Promise<{ snapshot: any }> {
    return request<{ snapshot: any }>('/api/console/ar-aging/snapshot', {
      method: 'POST',
    });
  },

  async getSnapshot(id: string): Promise<{ snapshot: any }> {
    return request<{ snapshot: any }>(`/api/console/ar-aging/snapshot/${id}`);
  },
};

// ============================================================================
// Denials API
// ============================================================================

export interface Denial {
  id: string;
  claim_id: string;
  claim_number: string;
  client_name: string;
  payer_name: string;
  denial_code: string;
  denial_reason: string;
  denied_amount: number;
  denial_date: string;
  status: 'new' | 'in_review' | 'appealed' | 'resolved' | 'written_off';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_to_name?: string;
  appeal_deadline?: string;
  resolution_type?: 'recovered' | 'written_off' | 'upheld';
  recovered_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface DenialDashboard {
  totalDenials: number;
  totalDeniedAmount: number;
  openDenials: number;
  openAmount: number;
  recoveredThisMonth: number;
  recoveryRate: number;
  avgDaysToResolve: number;
  byStatus: Record<string, number>;
  byCode: Array<{ code: string; reason: string; count: number; amount: number }>;
  urgentItems: Denial[];
}

export const denialsApi = {
  async getDashboard(): Promise<DenialDashboard> {
    return request<any>('/api/console/denials/dashboard');
  },

  async getStats(): Promise<{ stats: any }> {
    return request<{ stats: any }>('/api/console/denials/stats');
  },

  async getDenials(filters?: { status?: string; payerId?: string; denialCode?: string; assignedTo?: string; priority?: string }): Promise<{ denials: Denial[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.payerId) params.append('payerId', filters.payerId);
    if (filters?.denialCode) params.append('denialCode', filters.denialCode);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.priority) params.append('priority', filters.priority);
    return request<{ denials: Denial[]; count: number }>(`/api/console/denials?${params.toString()}`);
  },

  async getDenial(id: string): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>(`/api/console/denials/${id}`);
  },

  async createDenial(data: { claimLineId: string; denialCode: string; denialReason?: string; deniedAmount: number; denialDate?: string; payerId?: string; remittanceId?: string }): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>('/api/console/denials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async assignDenial(id: string, assignedTo: string): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>(`/api/console/denials/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo }),
    });
  },

  async startReview(id: string): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>(`/api/console/denials/${id}/start-review`, {
      method: 'POST',
    });
  },

  async fileAppeal(id: string, data: { appealReason: string; appealDeadline?: string; appealReference?: string }): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>(`/api/console/denials/${id}/file-appeal`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resolveDenial(id: string, data: { resolution: 'recovered' | 'written_off' | 'upheld'; recoveredAmount?: number; notes?: string }): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>(`/api/console/denials/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addNote(id: string, note: string): Promise<{ action: any }> {
    return request<{ action: any }>(`/api/console/denials/${id}/add-note`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async setPriority(id: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<{ denial: Denial }> {
    return request<{ denial: Denial }>(`/api/console/denials/${id}/set-priority`, {
      method: 'POST',
      body: JSON.stringify({ priority }),
    });
  },

  async getAnalyticsByCode(): Promise<{ analytics: any[] }> {
    return request<{ analytics: any[] }>('/api/console/denials/analytics/by-code');
  },

  async getAnalyticsByPayer(): Promise<{ analytics: any[] }> {
    return request<{ analytics: any[] }>('/api/console/denials/analytics/by-payer');
  },

  async getTrend(days?: number): Promise<{ trend: any[] }> {
    const params = days ? `?days=${days}` : '';
    return request<{ trend: any[] }>(`/api/console/denials/analytics/trend${params}`);
  },
};

// ============================================================================
// Claims API
// ============================================================================

export interface Claim {
  id: string;
  claim_number: string;
  client_id: string;
  client_name: string;
  payer_id: string;
  payer_name: string;
  service_date_from: string;
  service_date_to: string;
  total_charges: number;
  status: 'draft' | 'validated' | 'submitted' | 'acknowledged' | 'paid' | 'denied' | 'partial';
  submission_date?: string;
  payment_date?: string;
  paid_amount?: number;
  created_at: string;
}

export const claimsApi = {
  async getClaims(filters?: { status?: string; payerId?: string; clientId?: string; fromDate?: string; toDate?: string }): Promise<{ claims: Claim[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.payerId) params.append('payerId', filters.payerId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    return request<{ claims: Claim[]; count: number }>(`/api/console/claims?${params.toString()}`);
  },

  async getClaim(id: string): Promise<{ claim: Claim }> {
    return request<{ claim: Claim }>(`/api/console/claims/${id}`);
  },

  async submitClaim(id: string): Promise<{ claim: Claim }> {
    return request<{ claim: Claim }>(`/api/console/claims/${id}/submit`, {
      method: 'POST',
    });
  },

  async batchSubmit(claimIds: string[]): Promise<{ submitted: number; failed: number; errors: any[] }> {
    return request<{ submitted: number; failed: number; errors: any[] }>('/api/console/claims/batch-submit', {
      method: 'POST',
      body: JSON.stringify({ claimIds }),
    });
  },

  async getDashboard(): Promise<{ pending: number; submitted: number; paid: number; denied: number; revenue: number }> {
    return request<any>('/api/console/claims/dashboard');
  },
};

// Default export for convenience
export default {
  auth: authApi,
  console: consoleApi,
  health: healthApi,
  bonus: bonusApi,
  training: trainingApi,
  dispatch: dispatchApi,
  clinical: clinicalApi,
  applicants: applicantsApi,
  interviews: interviewsApi,
  onboarding: onboardingApi,
  arAging: arAgingApi,
  denials: denialsApi,
  claims: claimsApi,
};
