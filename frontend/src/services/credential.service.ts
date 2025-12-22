/**
 * Credential Service
 * Frontend service for credential management and expiration tracking
 * Integrates with backend APIs with mock fallback
 */

import { request } from './api';
import { loggerService } from '../shared/services/logger.service';
import { shouldUseMockData } from '../config/environment';

// ==========================================
// Types
// ==========================================

export type CredentialType =
  | 'BCI_BACKGROUND_CHECK'
  | 'FBI_BACKGROUND_CHECK'
  | 'CPR_FIRST_AID'
  | 'STNA'
  | 'HHA'
  | 'DRIVERS_LICENSE'
  | 'AUTO_INSURANCE'
  | 'EVV_TRAINING'
  | 'HIPAA_TRAINING'
  | 'ABUSE_NEGLECT_TRAINING'
  | string;

export type AlertLevel = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NOTICE' | 'INFO' | 'OK';

export type CredentialStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';

export interface Credential {
  id: string;
  caregiverId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  credentialType: CredentialType;
  credentialName?: string;
  credentialNumber?: string;
  issueDate?: string;
  expirationDate: string;
  status: CredentialStatus;
  daysLeft: number;
  documentUrl?: string;
  verificationStatus?: string;
  renewalRequired?: boolean;
  renewalInProgress?: boolean;
}

export interface CredentialAlert {
  id: string;
  caregiverId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  credentialType: CredentialType;
  expirationDate: string;
  daysLeft: number;
  alertLevel: AlertLevel;
  message: string;
}

export interface CredentialTypeInfo {
  type: CredentialType;
  name: string;
  description: string;
  required: boolean;
  renewalPeriod: number | null;
  notes: string;
}

export interface CredentialDashboard {
  complianceRate: number;
  totalCredentials: number;
  validCredentials: number;
  alerts: {
    EXPIRED: { count: number; credentials: Credential[] };
    CRITICAL: { count: number; credentials: Credential[] };
    WARNING: { count: number; credentials: Credential[] };
    NOTICE: { count: number; credentials: Credential[] };
    INFO: { count: number; credentials: Credential[] };
  };
  byCredentialType: Array<{
    credentialType: CredentialType;
    total: number;
    expired: number;
    expiringSoon: number;
    valid: number;
  }>;
  caregiversWithIssues: Array<{
    caregiverId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    expiredCredentials: Array<{
      type: CredentialType;
      expirationDate: string;
      daysLeft: number;
    }>;
    expiredCount: number;
  }>;
  thresholds: {
    CRITICAL: number;
    WARNING: number;
    NOTICE: number;
    INFO: number;
  };
}

export interface CredentialSummary {
  expired: number;
  expiring_7_days: number;
  expiring_15_days: number;
  expiring_30_days: number;
  total_active: number;
}

export interface ComplianceReport {
  generatedAt: string;
  organizationId: string;
  summary: {
    totalCaregivers: number;
    fullyCompliant: number;
    partiallyCompliant: number;
    overallComplianceRate: number;
  };
  caregivers: Array<{
    caregiverId: string;
    firstName: string;
    lastName: string;
    email: string;
    hireDate: string;
    totalRequired: number;
    validCount: number;
    missingCount: number;
    expiredCount: number;
    expiringCount: number;
    compliancePercent: number;
    credentials: Array<{
      type: CredentialType;
      status: string;
      expirationDate: string | null;
    }>;
  }>;
}

// ==========================================
// Service
// ==========================================

class CredentialService {
  /**
   * Get comprehensive credential dashboard
   */
  async getDashboard(): Promise<CredentialDashboard> {
    try {
      const data = await request<{ dashboard: CredentialDashboard }>('/api/console/credentials/dashboard');
      return data.dashboard;
    } catch (error) {
      loggerService.warn('Failed to fetch credential dashboard');
      if (shouldUseMockData()) {
        return this.getMockDashboard();
      }
      throw error;
    }
  }

  /**
   * Get credentials expiring within specified days
   */
  async getExpiringCredentials(days: number = 30): Promise<Credential[]> {
    try {
      const data = await request<{ credentials: any[]; count: number }>(
        `/api/console/credentials/expiring?days=${days}`
      );
      return data.credentials.map(this.mapCredential);
    } catch (error) {
      loggerService.warn('Failed to fetch expiring credentials');
      return [];
    }
  }

  /**
   * Get expired credentials
   */
  async getExpiredCredentials(): Promise<Credential[]> {
    try {
      const data = await request<{ credentials: any[]; count: number }>(
        '/api/console/credentials/expired'
      );
      return data.credentials.map(this.mapCredential);
    } catch (error) {
      loggerService.warn('Failed to fetch expired credentials');
      return [];
    }
  }

  /**
   * Get credential summary stats
   */
  async getSummary(): Promise<CredentialSummary> {
    try {
      const data = await request<{ summary: CredentialSummary }>('/api/console/credentials/summary');
      return data.summary;
    } catch (error) {
      loggerService.warn('Failed to fetch credential summary');
      return {
        expired: 0,
        expiring_7_days: 0,
        expiring_15_days: 0,
        expiring_30_days: 0,
        total_active: 0,
      };
    }
  }

  /**
   * Get alerts for notification display
   */
  async getAlerts(threshold: number = 30): Promise<CredentialAlert[]> {
    try {
      const data = await request<{ alerts: CredentialAlert[]; count: number }>(
        `/api/console/credentials/alerts?threshold=${threshold}`
      );
      return data.alerts;
    } catch (error) {
      loggerService.warn('Failed to fetch credential alerts');
      return [];
    }
  }

  /**
   * Get credential types with requirements
   */
  async getCredentialTypes(): Promise<CredentialTypeInfo[]> {
    try {
      const data = await request<{ credentialTypes: CredentialTypeInfo[] }>(
        '/api/console/credentials/types'
      );
      return data.credentialTypes;
    } catch (error) {
      loggerService.warn('Failed to fetch credential types');
      if (shouldUseMockData()) {
        return this.getMockCredentialTypes();
      }
      return [];
    }
  }

  /**
   * Get credentials for a specific caregiver
   */
  async getCaregiverCredentials(caregiverId: string): Promise<Credential[]> {
    try {
      const data = await request<{ credentials: any[]; count: number }>(
        `/api/console/credentials/caregiver/${caregiverId}`
      );
      return data.credentials.map((c: any) => ({
        ...this.mapCredential(c),
        caregiverId,
      }));
    } catch (error) {
      loggerService.warn('Failed to fetch caregiver credentials');
      return [];
    }
  }

  /**
   * Add a new credential
   */
  async addCredential(data: {
    caregiverId: string;
    credentialType: CredentialType;
    credentialNumber?: string;
    issueDate?: string;
    expirationDate?: string;
    documentUrl?: string;
    notes?: string;
  }): Promise<Credential | null> {
    try {
      const response = await request<{ credential: any }>('/api/console/credentials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return this.mapCredential(response.credential);
    } catch (error) {
      loggerService.error('Failed to add credential', { error });
      throw error;
    }
  }

  /**
   * Update a credential
   */
  async updateCredential(
    credentialId: string,
    data: {
      expirationDate?: string;
      number?: string;
      status?: string;
    }
  ): Promise<Credential | null> {
    try {
      const response = await request<{ credential: any }>(
        `/api/console/credentials/${credentialId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return this.mapCredential(response.credential);
    } catch (error) {
      loggerService.error('Failed to update credential', { error });
      throw error;
    }
  }

  /**
   * Renew a credential
   */
  async renewCredential(
    credentialId: string,
    data: {
      newExpirationDate: string;
      newCredentialNumber?: string;
      documentUrl?: string;
      notes?: string;
    }
  ): Promise<Credential | null> {
    try {
      const response = await request<{ credential: any }>(
        `/api/console/credentials/${credentialId}/renew`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return this.mapCredential(response.credential);
    } catch (error) {
      loggerService.error('Failed to renew credential', { error });
      throw error;
    }
  }

  /**
   * Delete a credential (soft delete)
   */
  async deleteCredential(credentialId: string): Promise<boolean> {
    try {
      await request(`/api/console/credentials/${credentialId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      loggerService.error('Failed to delete credential', { error });
      throw error;
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(): Promise<ComplianceReport | null> {
    try {
      const data = await request<{ report: ComplianceReport }>(
        '/api/console/credentials/compliance-report'
      );
      return data.report;
    } catch (error) {
      loggerService.warn('Failed to fetch compliance report');
      return null;
    }
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  private mapCredential(raw: any): Credential {
    const daysLeft = raw.daysLeft ?? raw.days_left ??
      (raw.expirationDate || raw.expiration_date
        ? Math.floor((new Date(raw.expirationDate || raw.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0);

    let status: CredentialStatus = 'valid';
    if (daysLeft < 0) {
      status = 'expired';
    } else if (daysLeft <= 30) {
      status = 'expiring_soon';
    }

    return {
      id: raw.id,
      caregiverId: raw.caregiverId || raw.caregiver_id || raw.user_id,
      firstName: raw.firstName || raw.first_name,
      lastName: raw.lastName || raw.last_name,
      email: raw.email,
      phone: raw.phone,
      credentialType: raw.credentialType || raw.credential_type || raw.type,
      credentialName: this.getCredentialName(raw.credentialType || raw.credential_type || raw.type),
      credentialNumber: raw.credentialNumber || raw.credential_number || raw.number,
      issueDate: raw.issueDate || raw.issue_date,
      expirationDate: raw.expirationDate || raw.expiration_date,
      status,
      daysLeft,
      documentUrl: raw.documentUrl || raw.document_url,
      verificationStatus: raw.verificationStatus || raw.verification_status,
      renewalRequired: daysLeft <= 30,
      renewalInProgress: false,
    };
  }

  private getCredentialName(type: string): string {
    const names: Record<string, string> = {
      BCI_BACKGROUND_CHECK: 'BCI Background Check',
      FBI_BACKGROUND_CHECK: 'FBI Background Check',
      CPR_FIRST_AID: 'CPR/First Aid Certification',
      STNA: 'STNA Certification',
      HHA: 'Home Health Aide Certification',
      DRIVERS_LICENSE: "Driver's License",
      AUTO_INSURANCE: 'Auto Insurance',
      EVV_TRAINING: 'EVV Training',
      HIPAA_TRAINING: 'HIPAA Training',
      ABUSE_NEGLECT_TRAINING: 'Abuse/Neglect Recognition Training',
      CPR: 'CPR/First Aid Certification',
      BCI: 'BCI Background Check',
      FBI: 'FBI Background Check',
      TB: 'TB Test Results',
    };
    return names[type] || type;
  }

  private getMockCredentialTypes(): CredentialTypeInfo[] {
    return [
      {
        type: 'BCI_BACKGROUND_CHECK',
        name: 'BCI Background Check',
        description: 'Ohio Bureau of Criminal Investigation background check',
        required: true,
        renewalPeriod: null,
        notes: 'Required for all staff. No expiration.',
      },
      {
        type: 'FBI_BACKGROUND_CHECK',
        name: 'FBI Background Check',
        description: 'Federal Bureau of Investigation background check',
        required: false,
        renewalPeriod: null,
        notes: 'Required if lived outside Ohio in past 5 years.',
      },
      {
        type: 'CPR_FIRST_AID',
        name: 'CPR/First Aid Certification',
        description: 'Current CPR and First Aid certification with in-person skills assessment',
        required: true,
        renewalPeriod: 24,
        notes: 'Must include hands-on skills assessment.',
      },
      {
        type: 'STNA',
        name: 'State Tested Nursing Assistant',
        description: 'Ohio STNA certification',
        required: false,
        renewalPeriod: 24,
        notes: 'Required for personal care services under T1019 billing.',
      },
      {
        type: 'DRIVERS_LICENSE',
        name: "Valid Driver's License",
        description: 'Current state driver\'s license',
        required: true,
        renewalPeriod: 48,
        notes: 'Required for caregivers who transport clients.',
      },
      {
        type: 'AUTO_INSURANCE',
        name: 'Auto Insurance',
        description: 'Current auto insurance policy',
        required: true,
        renewalPeriod: 12,
        notes: 'Minimum liability coverage required.',
      },
    ];
  }

  private getMockDashboard(): CredentialDashboard {
    return {
      complianceRate: 0,
      totalCredentials: 0,
      validCredentials: 0,
      alerts: {
        EXPIRED: { count: 0, credentials: [] },
        CRITICAL: { count: 0, credentials: [] },
        WARNING: { count: 0, credentials: [] },
        NOTICE: { count: 0, credentials: [] },
        INFO: { count: 0, credentials: [] },
      },
      byCredentialType: [],
      caregiversWithIssues: [],
      thresholds: {
        CRITICAL: 7,
        WARNING: 30,
        NOTICE: 60,
        INFO: 90,
      },
    };
  }
}

export const credentialService = new CredentialService();
