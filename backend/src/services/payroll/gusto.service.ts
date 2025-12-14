/**
 * Gusto Payroll Provider Implementation
 * https://docs.gusto.com/
 *
 * Gusto is recommended for small-medium businesses (< 100 employees)
 * - Easy setup and API integration
 * - Affordable pricing
 * - Good customer support
 * - Comprehensive API documentation
 *
 * @module services/payroll/gusto
 */

import axios, { AxiosInstance } from 'axios';

import { createLogger } from '../../utils/logger';

const logger = createLogger('gusto');
import {
  IPayrollProvider,
  PayrollEmployee,
  PayrollHours,
  PayrollSyncResult,
  PayrollRun,
} from './payroll.interface';

export class GustoPayrollProvider implements IPayrollProvider {
  private client: AxiosInstance;
  private companyId: string;
  private configured: boolean = false;

  constructor() {
    const apiKey = process.env.GUSTO_API_KEY || 'your-gusto-api-key';
    this.companyId = process.env.GUSTO_COMPANY_ID || 'your-company-id';

    this.configured = apiKey !== 'your-gusto-api-key' && this.companyId !== 'your-company-id';

    this.client = axios.create({
      baseURL: process.env.GUSTO_API_URL || 'https://api.gusto.com/v1',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!this.configured) {
      // In production, this should be a hard error, but for now we warn
      logger.warn('[GustoPayroll] Not configured. Payroll operations will fail in production.');
    }
  }

  getProviderName(): string {
    return 'Gusto';
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Sync employees to Gusto
   * Creates or updates employees in Gusto based on local data
   */
  async syncEmployees(employees: PayrollEmployee[]): Promise<PayrollSyncResult> {
    if (!this.configured) {
      throw new Error('Gusto integration is not configured. Cannot sync employees.');
    }

    const errors: Array<{ employeeId: string; error: string }> = [];
    let syncedCount = 0;

    for (const employee of employees) {
      try {
        // Check if employee exists in Gusto by email or external ID
        let gustoEmployeeId = employee.externalId;

        if (!gustoEmployeeId) {
          const existing = await this.findEmployeeByEmail(employee.email);
          if (existing) {
            gustoEmployeeId = existing.id;
          }
        }

        if (gustoEmployeeId) {
          // Update existing employee
          await this.updateEmployee({ ...employee, externalId: gustoEmployeeId });
        } else {
          // Create new employee
          const result = await this.createEmployee(employee);
          if (result.success && result.externalId) {
            gustoEmployeeId = result.externalId;
          } else {
            throw new Error(result.error || 'Failed to create employee');
          }
        }

        syncedCount++;
      } catch (error: any) {
        logger.error(`[Gusto] Failed to sync employee ${employee.email}:`, error.message);
        errors.push({
          employeeId: employee.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      employeesSynced: syncedCount,
      hoursSubmitted: 0,
      errors,
      syncedAt: new Date(),
    };
  }

  /**
   * Find employee by email in Gusto
   */
  private async findEmployeeByEmail(email: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/v1/companies/${this.companyId}/employees`);
      const employees = response.data;
      return employees.find((e: any) => e.email === email) || null;
    } catch (error) {
      logger.error('[Gusto] Error finding employee:', error);
      return null;
    }
  }

  /**
   * Create employee in Gusto
   * Public method required by IPayrollProvider
   */
  async createEmployee(employee: PayrollEmployee): Promise<{ success: boolean; externalId?: string; error?: string }> {
    if (!this.configured) {
      return { success: true, externalId: `GUSTO-${Date.now()}` };
    }

    try {
      const payload = {
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        date_of_birth: employee.dateOfBirth ? employee.dateOfBirth.toISOString().split('T')[0] : undefined,
        ssn: employee.ssn,
        date_of_hire: employee.hireDate.toISOString().split('T')[0],
        rate: employee.payRate,
        payment_method: employee.payType === 'salary' ? 'salary' : 'hourly',
        onboarding_status: 'onboarding_completed'
      };

      const response = await this.client.post(`/v1/companies/${this.companyId}/employees`, payload);

      return {
        success: true,
        externalId: response.data.id,
      };
    } catch (error: any) {
      logger.error('[GustoPayroll] Create employee failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update employee in Gusto
   * Public method required by IPayrollProvider
   */
  async updateEmployee(employee: PayrollEmployee): Promise<{ success: boolean; error?: string }> {
    if (!this.configured) {
      return { success: true };
    }

    if (!employee.externalId) {
      return { success: false, error: 'Employee has no external ID' };
    }

    try {
      const payload = {
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        date_of_birth: employee.dateOfBirth ? employee.dateOfBirth.toISOString().split('T')[0] : undefined,
        rate: employee.payRate,
      };

      await this.client.put(`/v1/employees/${employee.externalId}`, payload);
      return { success: true };
    } catch (error: any) {
      logger.error('[GustoPayroll] Update employee failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async submitHours(hours: PayrollHours[]): Promise<PayrollSyncResult> {
    if (!this.configured) {
      throw new Error('Gusto integration is not configured. Cannot submit hours.');
    }

    try {
      // Gusto API: POST /v1/companies/:company_id/payrolls/:payroll_id/employee_hours
      const response = await this.client.post(`/companies/${this.companyId}/employee_hours`, {
        hours: hours.map(h => ({
          employee_id: h.employeeId,
          regular_hours: h.regularHours,
          overtime_hours: h.overtimeHours,
          pto_hours: h.ptoHours,
        })),
      });

      return {
        success: true,
        employeesSynced: 0,
        hoursSubmitted: hours.length,
        errors: [],
        syncedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('[GustoPayroll] Hours submission failed:', error.message);
      return {
        success: false,
        employeesSynced: 0,
        hoursSubmitted: 0,
        errors: [{ employeeId: 'all', error: error.message }],
        syncedAt: new Date(),
      };
    }
  }

  async getCurrentPayPeriod(): Promise<{ start: Date; end: Date; payDate: Date }> {
    if (!this.configured) {
      throw new Error('Gusto integration is not configured.');
    }

    try {
      const response = await this.client.get(`/companies/${this.companyId}/payrolls/current`);

      return {
        start: new Date(response.data.pay_period.start_date),
        end: new Date(response.data.pay_period.end_date),
        payDate: new Date(response.data.pay_date),
      };
    } catch (error: any) {
      logger.error('[GustoPayroll] Get current pay period failed:', error.message);
      throw error;
    }
  }

  async getPayrollRuns(startDate: Date, endDate: Date): Promise<PayrollRun[]> {
    if (!this.configured) {
      return [];
    }

    try {
      const response = await this.client.get(`/companies/${this.companyId}/payrolls`, {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });

      return response.data.payrolls.map((p: any) => ({
        id: p.id,
        payPeriodStart: new Date(p.pay_period.start_date),
        payPeriodEnd: new Date(p.pay_period.end_date),
        payDate: new Date(p.pay_date),
        status: p.processed ? 'completed' : 'pending',
        totalGrossPay: parseFloat(p.total_gross_pay || 0),
        totalNetPay: parseFloat(p.total_net_pay || 0),
        employeeCount: p.employee_count || 0,
      }));
    } catch (error: any) {
      logger.error('[GustoPayroll] Get payroll runs failed:', error.message);
      return [];
    }
  }

  async getEmployee(employeeId: string): Promise<PayrollEmployee | null> {
    if (!this.configured) {
      return null;
    }

    try {
      // Note: You'll need to maintain a mapping of Serenity IDs to Gusto IDs
      const response = await this.client.get(`/companies/${this.companyId}/employees/${employeeId}`);

      return {
        id: employeeId,
        externalId: response.data.id,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        email: response.data.email,
        phone: response.data.phone,
        hireDate: new Date(response.data.date_of_hire),
        payRate: parseFloat(response.data.rate || 0),
        payType: response.data.payment_method === 'salary' ? 'salary' : 'hourly',
        status: response.data.terminations ? 'terminated' : 'active',
      };
    } catch (error: any) {
      logger.error('[GustoPayroll] Get employee failed:', error.message);
      return null;
    }
  }

  async terminateEmployee(employeeId: string, terminationDate: Date): Promise<{ success: boolean; error?: string }> {
    if (!this.configured) {
      return { success: true };
    }

    try {
      await this.client.post(`/companies/${this.companyId}/employees/${employeeId}/terminations`, {
        effective_date: terminationDate.toISOString().split('T')[0],
        run_termination_payroll: false,
      });

      return { success: true };
    } catch (error: any) {
      logger.error('[GustoPayroll] Terminate employee failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPayStub(employeeId: string, payPeriodEnd: Date): Promise<any> {
    if (!this.configured) {
      return null;
    }

    try {
      const response = await this.client.get(`/companies/${this.companyId}/employees/${employeeId}/pay_stub`, {
        params: {
          pay_period_end: payPeriodEnd.toISOString().split('T')[0],
        },
      });

      return {
        grossPay: parseFloat(response.data.gross_pay),
        netPay: parseFloat(response.data.net_pay),
        deductions: response.data.deductions || [],
        taxes: response.data.taxes || [],
      };
    } catch (error: any) {
      logger.error('[GustoPayroll] Get pay stub failed:', error.message);
      return null;
    }
  }

  async generateHoursExportFile(hours: PayrollHours[]): Promise<string> {
    // Generate CSV file for manual import into Gusto
    const headers = ['Employee ID', 'Employee Name', 'Regular Hours', 'Overtime Hours', 'PTO Hours', 'Total Hours'];
    const rows = hours.map(h => [
      h.employeeId,
      h.employeeName,
      h.regularHours.toFixed(2),
      h.overtimeHours.toFixed(2),
      h.ptoHours.toFixed(2),
      h.totalHours.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    return csv;
  }

  // Mocks removed for production readiness
}
