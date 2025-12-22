/**
 * Background Check Service
 * Frontend service for background check management and compliance tracking
 */
import { request } from './api';
import { loggerService } from '../shared/services/logger.service';
import { shouldUseMockData } from '../config/environment';

// ==========================================
// Types
// ==========================================

export type CheckType = 'bci' | 'bci_fbi' | 'fbi_only' | 'reference' | 'drug_screen' | 'driving_record';
export type CheckStatus = 'pending' | 'submitted' | 'in_progress' | 'completed' | 'failed' | 'expired';
export type CheckResult = 'clear' | 'flagged' | 'disqualified' | 'pending_review';
export type CaregiverCheckStatus = 'never_checked' | 'valid' | 'expired' | 'expiring_soon';

export interface BackgroundCheck {
  id: string;
  organizationId: string;
  caregiverId?: string;
  caregiverName?: string;
  employeeId?: string;
  applicantId?: string;
  applicantName?: string;
  checkType: CheckType;
  checkProvider?: string;
  status: CheckStatus;
  result?: CheckResult;
  requestedAt: string;
  requestedBy: string;
  submittedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  submissionReference?: string;
  findings?: string;
  disqualifyingOffenses?: string[];
  reportFileUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewDecision?: 'approved' | 'denied' | 'conditional';
  reviewNotes?: string;
  conditions?: string[];
  // Ohio-specific
  livedOutsideOhio5yr?: boolean;
  fingerprintDate?: string;
  fingerprintLocation?: string;
}

export interface CaregiverNeedingCheck {
  caregiverId: string;
  name: string;
  email: string;
  phone?: string;
  hireDate: string;
  lastCheckDate?: string;
  lastCheckType?: CheckType;
  checkStatus: CaregiverCheckStatus;
  daysUntilExpiration?: number;
  livedOutsideOhio5yr?: boolean;
}

export interface ComplianceStats {
  totalCaregivers: number;
  compliant: number;
  nonCompliant: number;
  expiringSoon: number;
  neverChecked: number;
  complianceRate: number;
  avgDaysToExpiration: number;
  checksByType: Record<CheckType, number>;
  checksByStatus: Record<CheckStatus, number>;
}

export interface BackgroundCheckDashboard {
  stats: ComplianceStats;
  needingChecks: {
    items: CaregiverNeedingCheck[];
    count: number;
    byStatus: {
      neverChecked: number;
      expired: number;
      expiringSoon: number;
    };
  };
  recentChecks: {
    items: BackgroundCheck[];
    count: number;
  };
}

export interface DisqualifyingOffense {
  id: string;
  offenseCode: string;
  offenseName: string;
  category: string;
  disqualificationPeriod: string;
  ohioRevisedCode: string;
  notes?: string;
}

export interface ReferenceCheck {
  id: string;
  backgroundCheckId: string;
  referenceName: string;
  referenceRelationship: string;
  referenceCompany?: string;
  referencePhone?: string;
  referenceEmail?: string;
  status: 'pending' | 'completed' | 'unable_to_contact';
  completedAt?: string;
  completedBy?: string;
  overallRating?: number;
  wouldRehire?: boolean;
  concernsRaised?: boolean;
  concernDetails?: string;
  notes?: string;
}

// ==========================================
// Service
// ==========================================

class BackgroundCheckService {
  // Dashboard
  async getDashboard(): Promise<BackgroundCheckDashboard> {
    try {
      const data = await request<BackgroundCheckDashboard>('/api/console/background-checks/dashboard');
      return data;
    } catch (error) {
      loggerService.error('Failed to fetch dashboard', { error });
      if (shouldUseMockData()) {
        return this.getMockDashboard();
      }
      throw error;
    }
  }

  async getComplianceStats(): Promise<ComplianceStats> {
    try {
      const data = await request<{ stats: ComplianceStats }>('/api/console/background-checks/stats');
      return data.stats;
    } catch (error) {
      loggerService.error('Failed to fetch stats', { error });
      if (shouldUseMockData()) {
        return this.getMockDashboard().stats;
      }
      throw error;
    }
  }

  // Caregivers needing checks
  async getCaregiversNeedingChecks(filters?: {
    status?: CaregiverCheckStatus;
    limit?: number;
  }): Promise<CaregiverNeedingCheck[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    try {
      const data = await request<{ caregivers: CaregiverNeedingCheck[] }>(
        `/api/console/background-checks/caregivers-needing-checks?${params}`
      );
      return data.caregivers;
    } catch (error) {
      loggerService.error('Failed to fetch caregivers needing checks', { error });
      if (shouldUseMockData()) {
        return this.getMockDashboard().needingChecks.items;
      }
      return [];
    }
  }

  // Background checks CRUD
  async getBackgroundChecks(filters?: {
    status?: string;
    checkType?: string;
    caregiverId?: string;
    limit?: number;
    offset?: number;
  }): Promise<BackgroundCheck[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.checkType) params.append('checkType', filters.checkType);
    if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    try {
      const data = await request<{ checks: BackgroundCheck[] }>(
        `/api/console/background-checks?${params}`
      );
      return data.checks;
    } catch (error) {
      loggerService.error('Failed to fetch background checks', { error });
      if (shouldUseMockData()) {
        return this.getMockDashboard().recentChecks.items;
      }
      return [];
    }
  }

  async getBackgroundCheckById(id: string): Promise<BackgroundCheck | null> {
    try {
      const data = await request<{ check: BackgroundCheck }>(`/api/console/background-checks/${id}`);
      return data.check;
    } catch (error) {
      loggerService.error('Failed to fetch background check', { error });
      return null;
    }
  }

  async createBackgroundCheck(data: {
    caregiverId?: string;
    employeeId?: string;
    applicantId?: string;
    checkType: CheckType;
    checkProvider?: string;
    reason: string;
    livedOutsideOhio5yr?: boolean;
    subjectDob?: string;
    subjectSsnLast4?: string;
  }): Promise<BackgroundCheck> {
    const result = await request<{ check: BackgroundCheck }>('/api/console/background-checks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return result.check;
  }

  async submitToProvider(id: string, data: {
    submissionReference?: string;
    fingerprintDate?: string;
    fingerprintLocation?: string;
  }): Promise<BackgroundCheck> {
    const result = await request<{ check: BackgroundCheck }>(
      `/api/console/background-checks/${id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return result.check;
  }

  async recordResults(id: string, data: {
    result: CheckResult;
    findings?: string;
    disqualifyingOffenses?: string[];
    reportFileUrl?: string;
  }): Promise<BackgroundCheck> {
    const result = await request<{ check: BackgroundCheck }>(
      `/api/console/background-checks/${id}/results`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return result.check;
  }

  async reviewCheck(id: string, data: {
    decision: 'approved' | 'denied' | 'conditional';
    reviewNotes?: string;
    conditions?: string[];
  }): Promise<BackgroundCheck> {
    const result = await request<{ check: BackgroundCheck }>(
      `/api/console/background-checks/${id}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return result.check;
  }

  // Validation
  async validateCaregiver(caregiverId: string, checkTypes?: CheckType[]): Promise<{
    isValid: boolean;
    caregiverId: string;
    checkTypes: string[];
  }> {
    const types = checkTypes ? checkTypes.join(',') : 'bci,bci_fbi';
    const data = await request<{ isValid: boolean; caregiverId: string; checkTypes: string[] }>(
      `/api/console/background-checks/validate/${caregiverId}?checkTypes=${types}`
    );
    return data;
  }

  // References
  async addReference(checkId: string, data: {
    referenceName: string;
    referenceRelationship: string;
    referenceCompany?: string;
    referencePhone?: string;
    referenceEmail?: string;
  }): Promise<string> {
    const result = await request<{ referenceCheckId: string }>(
      `/api/console/background-checks/${checkId}/references`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return result.referenceCheckId;
  }

  async completeReference(referenceId: string, data: {
    overallRating?: number;
    wouldRehire?: boolean;
    concernsRaised?: boolean;
    concernDetails?: string;
    notes?: string;
  }): Promise<void> {
    await request(`/api/console/background-checks/references/${referenceId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Utilities
  async getDisqualifyingOffenses(): Promise<DisqualifyingOffense[]> {
    try {
      const data = await request<{ offenses: DisqualifyingOffense[] }>(
        '/api/console/background-checks/disqualifying-offenses/list'
      );
      return data.offenses;
    } catch (error) {
      loggerService.error('Failed to fetch offenses', { error });
      if (shouldUseMockData()) {
        return this.getMockOffenses();
      }
      return [];
    }
  }

  async runExpirationCheck(): Promise<{
    expiring: number;
    expired: number;
    remindersSent: number;
  }> {
    const data = await request<{ expiring: number; expired: number; remindersSent: number }>(
      '/api/console/background-checks/run-expiration-check',
      { method: 'POST' }
    );
    return data;
  }

  // Mock data for development
  private getMockDashboard(): BackgroundCheckDashboard {
    return {
      stats: {
        totalCaregivers: 0,
        compliant: 0,
        nonCompliant: 0,
        expiringSoon: 0,
        neverChecked: 0,
        complianceRate: 0,
        avgDaysToExpiration: 0,
        checksByType: {
          bci: 0,
          bci_fbi: 0,
          fbi_only: 0,
          reference: 0,
          drug_screen: 0,
          driving_record: 0
        },
        checksByStatus: {
          pending: 0,
          submitted: 0,
          in_progress: 0,
          completed: 0,
          failed: 0,
          expired: 0
        }
      },
      needingChecks: {
        items: [],
        count: 0,
        byStatus: {
          neverChecked: 0,
          expired: 0,
          expiringSoon: 0
        }
      },
      recentChecks: {
        items: [],
        count: 0
      }
    };
  }

  private getMockOffenses(): DisqualifyingOffense[] {
    return [];
  }
}

export const backgroundCheckService = new BackgroundCheckService();
