/**
 * Payroll Provider Interface
 * Abstraction layer for payroll systems (Gusto, ADP, etc.)
 *
 * This interface ensures easy switching between payroll providers
 * without changing business logic code.
 *
 * @module services/payroll/interface
 */

export interface PayrollHours {
  employeeId: string;
  employeeName: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  regularHours: number;
  overtimeHours: number;
  ptoHours: number;
  holidayHours: number;
  totalHours: number;
  visits: Array<{
    visitId: string;
    date: Date;
    clockIn: Date;
    clockOut: Date;
    duration: number;
    isOvertime: boolean;
  }>;
}

export interface PayrollEmployee {
  id: string; // Internal Serenity ID
  externalId?: string; // Payroll system ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date; // Required for new employees
  ssn?: string;      // Required for new employees (handle securely)
  hireDate: Date;
  payRate: number;
  payType: 'hourly' | 'salary';
  status: 'active' | 'inactive' | 'terminated';
  department?: string;
  position?: string;
}

export interface PayrollSyncResult {
  success: boolean;
  employeesSynced: number;
  hoursSubmitted: number;
  errors: Array<{
    employeeId: string;
    error: string;
  }>;
  syncedAt: Date;
}

export interface PayrollRun {
  id: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  payDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalGrossPay: number;
  totalNetPay: number;
  employeeCount: number;
}

export interface PayrollTaxInfo {
  employeeId: string;
  w4Info: {
    filingStatus: string;
    allowances: number;
    additionalWithholding: number;
  };
  stateTax: {
    state: string;
    filingStatus: string;
    allowances: number;
  };
}

/**
 * Payroll Provider Interface
 *
 * All payroll providers (Gusto, ADP, etc.) must implement this interface
 */
export interface IPayrollProvider {
  /**
   * Provider name
   */
  getProviderName(): string;

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Sync employees from Serenity to payroll system
   */
  syncEmployees(employees: PayrollEmployee[]): Promise<PayrollSyncResult>;

  /**
   * Submit hours for a pay period
   */
  submitHours(hours: PayrollHours[]): Promise<PayrollSyncResult>;

  /**
   * Get current pay period
   */
  getCurrentPayPeriod(): Promise<{
    start: Date;
    end: Date;
    payDate: Date;
  }>;

  /**
   * Get payroll runs history
   */
  getPayrollRuns(startDate: Date, endDate: Date): Promise<PayrollRun[]>;

  /**
   * Get employee from payroll system
   */
  getEmployee(employeeId: string): Promise<PayrollEmployee | null>;

  /**
   * Create employee in payroll system
   */
  createEmployee(employee: PayrollEmployee): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }>;

  /**
   * Update employee in payroll system
   */
  updateEmployee(employee: PayrollEmployee): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Terminate employee in payroll system
   */
  terminateEmployee(employeeId: string, terminationDate: Date): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Get pay stub for employee
   */
  getPayStub(employeeId: string, payPeriodEnd: Date): Promise<{
    grossPay: number;
    netPay: number;
    deductions: Array<{
      type: string;
      amount: number;
    }>;
    taxes: Array<{
      type: string;
      amount: number;
    }>;
  } | null>;

  /**
   * Generate hours export file (CSV format)
   * For manual import if API not available
   */
  generateHoursExportFile(hours: PayrollHours[]): Promise<string>;
}

/**
 * Factory function to create payroll provider instance
 */
export function createPayrollProvider(providerName: 'gusto' | 'adp'): IPayrollProvider {
  // Dynamic import based on provider
  switch (providerName) {
    case 'gusto':
      const { GustoPayrollProvider } = require('./gusto.service');
      return new GustoPayrollProvider();
    case 'adp':
      const { ADPPayrollProvider } = require('./adp.service');
      return new ADPPayrollProvider();
    default:
      throw new Error(`Unknown payroll provider: ${providerName}`);
  }
}

/**
 * Get configured payroll provider from environment
 */
export function getPayrollProvider(): IPayrollProvider {
  const providerName = (process.env.PAYROLL_PROVIDER || 'gusto') as 'gusto' | 'adp';
  return createPayrollProvider(providerName);
}
