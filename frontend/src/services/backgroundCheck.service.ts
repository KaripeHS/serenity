/**
 * Background Check Service
 * Frontend service for background check management and compliance tracking
 */
import { request } from './api';
import { loggerService } from '../shared/services/logger.service';

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
      return this.getMockDashboard();
    }
  }

  async getComplianceStats(): Promise<ComplianceStats> {
    try {
      const data = await request<{ stats: ComplianceStats }>('/api/console/background-checks/stats');
      return data.stats;
    } catch (error) {
      loggerService.error('Failed to fetch stats', { error });
      return this.getMockDashboard().stats;
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
      return this.getMockDashboard().needingChecks.items;
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
      return this.getMockDashboard().recentChecks.items;
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
      return this.getMockOffenses();
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
        totalCaregivers: 45,
        compliant: 38,
        nonCompliant: 7,
        expiringSoon: 5,
        neverChecked: 2,
        complianceRate: 84.4,
        avgDaysToExpiration: 245,
        checksByType: {
          bci: 40,
          bci_fbi: 35,
          fbi_only: 5,
          reference: 45,
          drug_screen: 42,
          driving_record: 12
        },
        checksByStatus: {
          pending: 3,
          submitted: 2,
          in_progress: 1,
          completed: 85,
          failed: 0,
          expired: 5
        }
      },
      needingChecks: {
        items: [
          {
            caregiverId: 'cg1',
            name: 'Maria Rodriguez',
            email: 'maria@example.com',
            hireDate: '2024-01-15',
            checkStatus: 'expiring_soon',
            daysUntilExpiration: 28,
            lastCheckDate: '2023-03-20',
            lastCheckType: 'bci_fbi',
            livedOutsideOhio5yr: false
          },
          {
            caregiverId: 'cg2',
            name: 'David Chen',
            email: 'david@example.com',
            hireDate: '2024-02-01',
            checkStatus: 'expired',
            daysUntilExpiration: -15,
            lastCheckDate: '2023-02-28',
            lastCheckType: 'bci',
            livedOutsideOhio5yr: true
          },
          {
            caregiverId: 'cg3',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            hireDate: '2024-11-15',
            checkStatus: 'never_checked',
            livedOutsideOhio5yr: false
          },
          {
            caregiverId: 'cg4',
            name: 'Michael Brown',
            email: 'michael@example.com',
            hireDate: '2024-03-01',
            checkStatus: 'expiring_soon',
            daysUntilExpiration: 45,
            lastCheckDate: '2023-04-15',
            lastCheckType: 'bci_fbi',
            livedOutsideOhio5yr: true
          }
        ],
        count: 4,
        byStatus: {
          neverChecked: 1,
          expired: 1,
          expiringSoon: 2
        }
      },
      recentChecks: {
        items: [
          {
            id: 'bc1',
            organizationId: 'org1',
            caregiverId: 'cg5',
            caregiverName: 'Jennifer Smith',
            checkType: 'bci_fbi',
            status: 'completed',
            result: 'clear',
            requestedAt: '2024-03-01T10:00:00Z',
            requestedBy: 'admin1',
            submittedAt: '2024-03-02T09:00:00Z',
            completedAt: '2024-03-10T14:30:00Z',
            expiresAt: '2025-03-10T14:30:00Z'
          },
          {
            id: 'bc2',
            organizationId: 'org1',
            caregiverId: 'cg6',
            caregiverName: 'Robert Williams',
            checkType: 'bci',
            status: 'in_progress',
            requestedAt: '2024-03-08T11:00:00Z',
            requestedBy: 'admin1',
            submittedAt: '2024-03-09T08:00:00Z'
          },
          {
            id: 'bc3',
            organizationId: 'org1',
            applicantId: 'app1',
            applicantName: 'Emily Davis',
            checkType: 'bci_fbi',
            status: 'completed',
            result: 'flagged',
            requestedAt: '2024-03-05T09:00:00Z',
            requestedBy: 'admin1',
            completedAt: '2024-03-12T16:00:00Z',
            findings: 'Minor traffic violation from 2019'
          }
        ],
        count: 3
      }
    };
  }

  private getMockOffenses(): DisqualifyingOffense[] {
    return [
      {
        id: '1',
        offenseCode: '2903.01',
        offenseName: 'Aggravated Murder',
        category: 'violent_crime',
        disqualificationPeriod: 'permanent',
        ohioRevisedCode: 'ORC 2903.01'
      },
      {
        id: '2',
        offenseCode: '2903.02',
        offenseName: 'Murder',
        category: 'violent_crime',
        disqualificationPeriod: 'permanent',
        ohioRevisedCode: 'ORC 2903.02'
      },
      {
        id: '3',
        offenseCode: '2911.01',
        offenseName: 'Aggravated Robbery',
        category: 'violent_crime',
        disqualificationPeriod: '10_years',
        ohioRevisedCode: 'ORC 2911.01'
      },
      {
        id: '4',
        offenseCode: '2913.02',
        offenseName: 'Theft',
        category: 'property_crime',
        disqualificationPeriod: '5_years',
        ohioRevisedCode: 'ORC 2913.02',
        notes: 'Felony theft only'
      },
      {
        id: '5',
        offenseCode: '2925.03',
        offenseName: 'Trafficking in Drugs',
        category: 'drug_offense',
        disqualificationPeriod: '10_years',
        ohioRevisedCode: 'ORC 2925.03'
      }
    ];
  }
}

export const backgroundCheckService = new BackgroundCheckService();
