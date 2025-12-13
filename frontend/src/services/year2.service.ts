/**
 * Year 2 Service
 * Frontend service for DODD, HPC, Consumer-Directed, and Payroll features
 */
import { request } from './api';

// ==========================================
// DODD Types
// ==========================================

export interface DoddCertification {
  id: string;
  certificationType: string;
  certificationNumber: string;
  issuedDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  serviceTypes: string[];
  createdAt: string;
}

export interface CaregiverDoddStatus {
  caregiverId: string;
  name: string;
  email: string;
  backgroundCheckDate: string | null;
  backgroundCheckStatus: string | null;
  orientationCompleted: boolean;
  orientationDate: string | null;
  evvCertified: boolean;
  evvCertificationDate: string | null;
  isDoddEligible: boolean;
}

export interface DoddDashboard {
  hasCertification: boolean;
  certificationStatus: string | null;
  certificationExpiration: string | null;
  stats: {
    totalCaregivers: number;
    doddEligible: number;
    pendingOrientation: number;
    pendingEvv: number;
    pendingBackgroundCheck: number;
  };
}

// ==========================================
// HPC Types
// ==========================================

export interface HpcServiceCode {
  id: string;
  serviceCode: string;
  serviceName: string;
  serviceCategory: string;
  unitType: string;
  unitMinutes: number;
  rates: {
    standard: number;
    enhanced: number | null;
    intensive: number | null;
  };
  requiresPriorAuth: boolean;
  requiresIsp: boolean;
  requiresDoddEligibleCaregiver: boolean;
}

export interface HpcAuthorization {
  id: string;
  clientId: string;
  clientName: string;
  clientMedicaidId: string;
  serviceCode: string;
  serviceName: string;
  rate: number;
  ispNumber: string | null;
  ispStartDate: string;
  ispEndDate: string;
  unitsAuthorized: number;
  unitsPeriod: string;
  unitsUsed: number;
  unitsRemaining: number;
  utilizationPercent: number;
  priorAuthNumber: string | null;
  status: string;
}

export interface HpcDashboard {
  summary: {
    activeAuthorizations: number;
    expiredAuthorizations: number;
    suspendedAuthorizations: number;
    expiringSoon: number;
    avgUtilization: number;
  };
  byServiceCode: Array<{
    serviceCode: string;
    serviceName: string;
    authCount: number;
    totalAuthorized: number;
    totalUsed: number;
    potentialRevenue: number;
    utilization: number;
  }>;
}

// ==========================================
// Consumer-Directed Types
// ==========================================

export interface CdEmployer {
  id: string;
  clientId: string;
  clientName: string;
  clientMedicaidId: string;
  employerOfRecordName: string;
  employerOfRecordRelationship: string;
  fmsAccountNumber: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  authorizedMonthlyBudget: number | null;
  status: string;
  activeWorkersCount: number;
  mtdHours: number;
}

export interface CdWorker {
  id: string;
  caregiverId: string | null;
  name: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  maxHoursPerWeek: number | null;
  effectiveDate: string;
  terminationDate: string | null;
  status: string;
  mtdHours: number;
  ytdHours: number;
}

export interface CdTimesheet {
  id: string;
  workerId: string;
  workerName: string;
  hourlyRate: number;
  employerId: string;
  employerName: string;
  clientId: string;
  clientName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  totalHours: number;
  totalAmount: number;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

export interface CdDashboard {
  summary: {
    activeEmployers: number;
    activeWorkers: number;
    pendingTimesheets: number;
    mtdApprovedHours: number;
    mtdApprovedAmount: number;
  };
  recentActivity: Array<{
    timesheetId: string;
    workerName: string;
    clientName: string;
    payPeriod: string;
    totalHours: number;
    status: string;
    submittedAt: string | null;
  }>;
}

// ==========================================
// Payroll Types
// ==========================================

export interface PayrollProvider {
  id: string;
  providerName: string;
  environment: string;
  companyId: string | null;
  hasApiKey: boolean;
  status: string;
  lastSyncAt: string | null;
}

export interface EmployeeMapping {
  caregiverId: string;
  name: string;
  email: string;
  status: string;
  mapping: {
    id: string;
    externalEmployeeId: string;
    payRateHourly: number;
    payRateOvertime: number | null;
    payFrequency: string;
    department: string | null;
    costCenter: string | null;
    lastSyncedAt: string | null;
    syncStatus: string;
  } | null;
}

export interface PayrollRun {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  status: string;
  totals: {
    regularHours: number;
    overtimeHours: number;
    grossPay: number;
    bonus: number;
    deductions: number;
    netPay: number;
  };
  employeeCount: number;
  providerBatchId: string | null;
  submittedAt: string | null;
  processedAt: string | null;
}

export interface PayrollDashboard {
  provider: {
    name: string;
    status: string;
    lastSyncAt: string | null;
  } | null;
  summary: {
    draftRuns: number;
    approvedRuns: number;
    submittedRuns: number;
    processedRuns: number;
    mtdGrossPay: number;
    ytdGrossPay: number;
  };
  unmappedEmployees: number;
  recentRuns: Array<{
    id: string;
    payPeriod: string;
    payDate: string;
    status: string;
    totalGrossPay: number;
    employeeCount: number;
  }>;
}

class Year2Service {
  // ==========================================
  // DODD Methods
  // ==========================================

  async getDoddCertifications(): Promise<DoddCertification[]> {
    const data = await request<{ certifications: DoddCertification[] }>('/api/console/year2/dodd/certifications');
    return data.certifications;
  }

  async createDoddCertification(certification: Partial<DoddCertification>): Promise<DoddCertification> {
    const data = await request<{ certification: DoddCertification }>('/api/console/year2/dodd/certifications', {
      method: 'POST',
      body: JSON.stringify(certification)
    });
    return data.certification;
  }

  async getCaregiverDoddStatus(): Promise<CaregiverDoddStatus[]> {
    const data = await request<{ caregivers: CaregiverDoddStatus[] }>('/api/console/year2/dodd/caregivers');
    return data.caregivers;
  }

  async getDoddEligibleCaregivers(): Promise<CaregiverDoddStatus[]> {
    const data = await request<{ caregivers: CaregiverDoddStatus[] }>('/api/console/year2/dodd/eligible-caregivers');
    return data.caregivers;
  }

  async getDoddDashboard(): Promise<DoddDashboard> {
    const data = await request<DoddDashboard>('/api/console/year2/dodd/dashboard');
    return data;
  }

  async updateCaregiverDoddRequirements(caregiverId: string, requirements: any): Promise<any> {
    const data = await request<any>(`/api/console/year2/dodd/caregivers/${caregiverId}`, {
      method: 'PATCH',
      body: JSON.stringify(requirements)
    });
    return data;
  }

  // ==========================================
  // HPC Methods
  // ==========================================

  async getHpcServiceCodes(activeOnly: boolean = true): Promise<HpcServiceCode[]> {
    const data = await request<{ serviceCodes: HpcServiceCode[] }>(`/api/console/year2/hpc/service-codes?activeOnly=${activeOnly}`);
    return data.serviceCodes;
  }

  async getHpcAuthorizations(filters?: {
    clientId?: string;
    serviceCode?: string;
    status?: string;
    expiringWithinDays?: number;
  }): Promise<HpcAuthorization[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.serviceCode) params.append('serviceCode', filters.serviceCode);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.expiringWithinDays) params.append('expiringWithinDays', filters.expiringWithinDays.toString());

    const data = await request<{ authorizations: HpcAuthorization[] }>(`/api/console/year2/hpc/authorizations?${params}`);
    return data.authorizations;
  }

  async getHpcAuthorizationById(id: string): Promise<HpcAuthorization | null> {
    const data = await request<{ authorization: HpcAuthorization }>(`/api/console/year2/hpc/authorizations/${id}`);
    return data.authorization;
  }

  async createHpcAuthorization(authorization: any): Promise<HpcAuthorization> {
    const data = await request<{ authorization: HpcAuthorization }>('/api/console/year2/hpc/authorizations', {
      method: 'POST',
      body: JSON.stringify(authorization)
    });
    return data.authorization;
  }

  async getHpcExpiringAuthorizations(days: number = 30): Promise<HpcAuthorization[]> {
    const data = await request<{ authorizations: HpcAuthorization[] }>(`/api/console/year2/hpc/expiring?days=${days}`);
    return data.authorizations;
  }

  async getHpcLowUtilizationAlerts(threshold: number = 50): Promise<any[]> {
    const data = await request<{ alerts: any[] }>(`/api/console/year2/hpc/alerts/low-utilization?threshold=${threshold}`);
    return data.alerts;
  }

  async getHpcDashboard(): Promise<HpcDashboard> {
    const data = await request<HpcDashboard>('/api/console/year2/hpc/dashboard');
    return data;
  }

  async checkClientHpcEligibility(clientId: string): Promise<any> {
    const data = await request<any>(`/api/console/year2/hpc/clients/${clientId}/eligibility`);
    return data;
  }

  // ==========================================
  // Consumer-Directed Methods
  // ==========================================

  async getCdEmployers(status?: string): Promise<CdEmployer[]> {
    const params = status ? `?status=${status}` : '';
    const data = await request<{ employers: CdEmployer[] }>(`/api/console/year2/consumer-directed/employers${params}`);
    return data.employers;
  }

  async getCdEmployerById(id: string): Promise<CdEmployer | null> {
    const data = await request<{ employer: CdEmployer }>(`/api/console/year2/consumer-directed/employers/${id}`);
    return data.employer;
  }

  async createCdEmployer(employer: any): Promise<CdEmployer> {
    const data = await request<{ employer: CdEmployer }>('/api/console/year2/consumer-directed/employers', {
      method: 'POST',
      body: JSON.stringify(employer)
    });
    return data.employer;
  }

  async getCdWorkers(employerId: string, status?: string): Promise<CdWorker[]> {
    const params = status ? `?status=${status}` : '';
    const data = await request<{ workers: CdWorker[] }>(`/api/console/year2/consumer-directed/employers/${employerId}/workers${params}`);
    return data.workers;
  }

  async createCdWorker(worker: any): Promise<CdWorker> {
    const data = await request<{ worker: CdWorker }>('/api/console/year2/consumer-directed/workers', {
      method: 'POST',
      body: JSON.stringify(worker)
    });
    return data.worker;
  }

  async getCdTimesheets(filters?: {
    employerId?: string;
    workerId?: string;
    status?: string;
  }): Promise<CdTimesheet[]> {
    const params = new URLSearchParams();
    if (filters?.employerId) params.append('employerId', filters.employerId);
    if (filters?.workerId) params.append('workerId', filters.workerId);
    if (filters?.status) params.append('status', filters.status);

    const data = await request<{ timesheets: CdTimesheet[] }>(`/api/console/year2/consumer-directed/timesheets?${params}`);
    return data.timesheets;
  }

  async getCdTimesheetById(id: string): Promise<CdTimesheet | null> {
    const data = await request<{ timesheet: CdTimesheet }>(`/api/console/year2/consumer-directed/timesheets/${id}`);
    return data.timesheet;
  }

  async createCdTimesheet(timesheet: any): Promise<CdTimesheet> {
    const data = await request<{ timesheet: CdTimesheet }>('/api/console/year2/consumer-directed/timesheets', {
      method: 'POST',
      body: JSON.stringify(timesheet)
    });
    return data.timesheet;
  }

  async submitCdTimesheet(id: string): Promise<CdTimesheet> {
    const data = await request<{ timesheet: CdTimesheet }>(`/api/console/year2/consumer-directed/timesheets/${id}/submit`, {
      method: 'POST'
    });
    return data.timesheet;
  }

  async approveCdTimesheet(id: string): Promise<CdTimesheet> {
    const data = await request<{ timesheet: CdTimesheet }>(`/api/console/year2/consumer-directed/timesheets/${id}/approve`, {
      method: 'POST'
    });
    return data.timesheet;
  }

  async rejectCdTimesheet(id: string, reason: string): Promise<CdTimesheet> {
    const data = await request<{ timesheet: CdTimesheet }>(`/api/console/year2/consumer-directed/timesheets/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return data.timesheet;
  }

  async getCdDashboard(): Promise<CdDashboard> {
    const data = await request<CdDashboard>('/api/console/year2/consumer-directed/dashboard');
    return data;
  }

  async getCdBudgetUtilization(): Promise<any[]> {
    const data = await request<{ utilization: any[] }>('/api/console/year2/consumer-directed/budget-utilization');
    return data.utilization;
  }

  // ==========================================
  // Payroll Methods
  // ==========================================

  async getPayrollProviders(): Promise<PayrollProvider[]> {
    const data = await request<{ providers: PayrollProvider[] }>('/api/console/year2/payroll/providers');
    return data.providers;
  }

  async getActivePayrollProvider(): Promise<PayrollProvider | null> {
    const data = await request<{ provider: PayrollProvider | null }>('/api/console/year2/payroll/providers/active');
    return data.provider;
  }

  async configurePayrollProvider(config: any): Promise<PayrollProvider> {
    const data = await request<{ provider: PayrollProvider }>('/api/console/year2/payroll/providers', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return data.provider;
  }

  async testPayrollProviderConnection(providerId: string): Promise<{ success: boolean; message: string }> {
    const data = await request<{ success: boolean; message: string }>(`/api/console/year2/payroll/providers/${providerId}/test`, {
      method: 'POST'
    });
    return data;
  }

  async getEmployeeMappings(unmappedOnly: boolean = false): Promise<EmployeeMapping[]> {
    const data = await request<{ mappings: EmployeeMapping[] }>(`/api/console/year2/payroll/mappings?unmappedOnly=${unmappedOnly}`);
    return data.mappings;
  }

  async createEmployeeMapping(mapping: any): Promise<any> {
    const data = await request<{ mapping: any }>('/api/console/year2/payroll/mappings', {
      method: 'POST',
      body: JSON.stringify(mapping)
    });
    return data.mapping;
  }

  async getPayrollRuns(status?: string): Promise<PayrollRun[]> {
    const params = status ? `?status=${status}` : '';
    const data = await request<{ runs: PayrollRun[] }>(`/api/console/year2/payroll/runs${params}`);
    return data.runs;
  }

  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    const data = await request<{ run: PayrollRun }>(`/api/console/year2/payroll/runs/${id}`);
    return data.run;
  }

  async createPayrollRun(run: any): Promise<PayrollRun> {
    const data = await request<{ run: PayrollRun }>('/api/console/year2/payroll/runs', {
      method: 'POST',
      body: JSON.stringify(run)
    });
    return data.run;
  }

  async approvePayrollRun(id: string): Promise<PayrollRun> {
    const data = await request<{ run: PayrollRun }>(`/api/console/year2/payroll/runs/${id}/approve`, {
      method: 'POST'
    });
    return data.run;
  }

  async submitPayrollRunToProvider(id: string): Promise<{ success: boolean; batchId: string; message: string }> {
    const data = await request<{ success: boolean; batchId: string; message: string }>(`/api/console/year2/payroll/runs/${id}/submit`, {
      method: 'POST'
    });
    return data;
  }

  async getPayrollDashboard(): Promise<PayrollDashboard> {
    const data = await request<PayrollDashboard>('/api/console/year2/payroll/dashboard');
    return data;
  }
}

export const year2Service = new Year2Service();
