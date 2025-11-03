/**
 * Comprehensive Payroll Service for Serenity ERP
 * Handles payroll calculation, FLSA compliance, tax processing, and NACHA file generation
 */

import { DatabaseClient } from '../database/client';
import { AuditLogger } from '../audit/logger';
import { UserContext } from '../auth/access-control';
import { createLogger, payrollLogger } from '../utils/logger';

export interface PayrollPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: 'draft' | 'processed' | 'paid' | 'cancelled';
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  employeeCount: number;
  createdAt: Date;
  processedBy?: string;
  processedAt?: Date;
}

export interface PayrollEntry {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  regularRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  stateDisabilityTax: number;
  otherDeductions: number;
  netPay: number;
  ytdGross: number;
  ytdTaxes: number;
  createdAt: Date;
}

export interface TaxWithholding {
  federalWithholdingRate: number;
  stateWithholdingRate: number;
  socialSecurityRate: number;
  medicareRate: number;
  stateDisabilityRate: number;
  socialSecurityWageBase: number; // 2024: $160,200
  medicareAdditionalRate: number; // 0.9% on wages over $200,000
  medicareAdditionalThreshold: number;
}

export interface NACHAFile {
  fileHeader: string;
  batchHeader: string;
  entryRecords: string[];
  batchTrailer: string;
  fileTrailer: string;
  totalAmount: number;
  entryCount: number;
}

export interface OvertimeAnalysis {
  employeeId: string;
  employeeName: string;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  overtimePercent: number;
  costImpact: number;
  recommendation: string;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export class PayrollService {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;

  // 2024 Tax Rates and Limits
  private readonly TAX_CONFIG: TaxWithholding = {
    federalWithholdingRate: 0.12, // Simplified rate - would use actual tables
    stateWithholdingRate: 0.04, // Ohio rate - would vary by state
    socialSecurityRate: 0.062,
    medicareRate: 0.0145,
    stateDisabilityRate: 0.005, // Ohio SDI rate
    socialSecurityWageBase: 160200,
    medicareAdditionalRate: 0.009,
    medicareAdditionalThreshold: 200000
  };

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  /**
   * Create new payroll period
   */
  async createPayrollPeriod(
    startDate: Date,
    endDate: Date,
    payDate: Date,
    userContext: UserContext
  ): Promise<PayrollPeriod> {
    try {
      const periodId = await this.generatePayrollPeriodId();
      const now = new Date();

      await this.db.query(`
        INSERT INTO payroll_periods (
          id, start_date, end_date, pay_date, status, total_gross,
          total_net, total_taxes, employee_count, created_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        periodId,
        startDate,
        endDate,
        payDate,
        'draft',
        0, 0, 0, 0,
        now,
        userContext.userId
      ]);

      // Log payroll period creation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'payroll_period_created',
        resource: 'payroll_period',
        details: {
          startDate,
          endDate,
          payDate
        },
      });

      return await this.getPayrollPeriodById(periodId, userContext);

    } catch (error) {
      payrollLogger.error('Create payroll period error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Calculate payroll for all employees in period
   */
  async calculatePayroll(
    payrollPeriodId: string,
    userContext: UserContext
  ): Promise<{ entries: PayrollEntry[]; summary: PayrollPeriod }> {
    try {
      const period = await this.getPayrollPeriodById(payrollPeriodId, userContext);
      
      if (period.status !== 'draft') {
        throw new Error('Can only calculate payroll for draft periods');
      }

      // Get all active employees
      const employeesQuery = `
        SELECT u.id, u.first_name, u.last_name, u.hourly_rate, u.salary,
               u.hire_date, u.organization_id
        FROM users u
        WHERE u.organization_id = $1
        AND u.role = 'caregiver'
        AND u.is_active = true
        AND u.hire_date <= $2
        ORDER BY u.last_name, u.first_name
      `;

      const employeesResult = await this.db.query(employeesQuery, [
        userContext.organizationId,
        period.endDate
      ]);

      const payrollEntries: PayrollEntry[] = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalTaxes = 0;

      for (const employee of employeesResult.rows) {
        const entry = await this.calculateEmployeePayroll(
          employee,
          period,
          payrollPeriodId,
          userContext
        );

        if (entry) {
          payrollEntries.push(entry);
          totalGross += entry.grossPay;
          totalNet += entry.netPay;
          totalTaxes += (entry.federalTax + entry.stateTax + entry.socialSecurityTax + 
                         entry.medicareTax + entry.stateDisabilityTax);
        }
      }

      // Update payroll period totals
      await this.db.query(`
        UPDATE payroll_periods 
        SET total_gross = $1, total_net = $2, total_taxes = $3, employee_count = $4,
            updated_at = NOW()
        WHERE id = $5
      `, [totalGross, totalNet, totalTaxes, payrollEntries.length, payrollPeriodId]);

      // Log payroll calculation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'payroll_calculated',
        resource: 'payroll_period',
        details: {
          employeeCount: payrollEntries.length,
          totalGross,
          totalNet,
          totalTaxes
        },
      });

      const updatedPeriod = await this.getPayrollPeriodById(payrollPeriodId, userContext);
      return { entries: payrollEntries, summary: updatedPeriod };

    } catch (error) {
      payrollLogger.error('Calculate payroll error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Calculate individual employee payroll
   */
  private async calculateEmployeePayroll(
    employee: any,
    period: PayrollPeriod,
    payrollPeriodId: string,
    userContext: UserContext
  ): Promise<PayrollEntry | null> {
    try {
      // Get EVV records for the period
      const hoursQuery = `
        SELECT 
          SUM(EXTRACT(EPOCH FROM (er.clock_out_time - er.clock_in_time)) / 3600) as total_hours,
          COUNT(*) as shift_count
        FROM evv_records er
        JOIN shifts s ON er.shift_id = s.id
        WHERE er.caregiver_id = $1
        AND er.clock_in_time >= $2
        AND er.clock_in_time <= $3
        AND er.clock_out_time IS NOT NULL
        AND er.is_valid = true
      `;

      const hoursResult = await this.db.query(hoursQuery, [
        employee.id,
        period.startDate,
        period.endDate
      ]);

      const totalHours = parseFloat(hoursResult.rows[0]?.total_hours || '0');
      
      if (totalHours === 0) {
        return null; // No hours worked
      }

      // Calculate regular, overtime, and double time hours (FLSA compliance)
      const { regularHours, overtimeHours, doubleTimeHours } = this.calculateFLSAHours(totalHours);

      const hourlyRate = parseFloat(employee.hourly_rate || '0');
      if (hourlyRate === 0) {
        throw new Error(`No hourly rate set for employee ${employee.first_name} ${employee.last_name}`);
      }

      const overtimeRate = hourlyRate * 1.5;
      const doubleTimeRate = hourlyRate * 2.0;

      const grossPay = (regularHours * hourlyRate) + 
                      (overtimeHours * overtimeRate) + 
                      (doubleTimeHours * doubleTimeRate);

      // Get YTD totals
      const ytdTotals = await this.getYTDTotals(employee.id, period.endDate);

      // Calculate taxes
      const taxes = this.calculateTaxes(grossPay, ytdTotals.ytdGross + grossPay);

      const totalTaxes = taxes.federalTax + taxes.stateTax + taxes.socialSecurityTax + 
                        taxes.medicareTax + taxes.stateDisabilityTax;
      const netPay = grossPay - totalTaxes;

      const entryId = await this.generatePayrollEntryId();

      // Insert payroll entry
      await this.db.query(`
        INSERT INTO payroll_entries (
          id, payroll_period_id, employee_id, regular_hours, overtime_hours, double_time_hours,
          regular_rate, overtime_rate, double_time_rate, gross_pay, federal_tax, state_tax,
          social_security_tax, medicare_tax, state_disability_tax, other_deductions, net_pay,
          ytd_gross, ytd_taxes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        entryId, payrollPeriodId, employee.id, regularHours, overtimeHours, doubleTimeHours,
        hourlyRate, overtimeRate, doubleTimeRate, grossPay, taxes.federalTax, taxes.stateTax,
        taxes.socialSecurityTax, taxes.medicareTax, taxes.stateDisabilityTax, 0, netPay,
        ytdTotals.ytdGross + grossPay, ytdTotals.ytdTaxes + totalTaxes, new Date()
      ]);

      return {
        id: entryId,
        payrollPeriodId,
        employeeId: employee.id,
        regularHours,
        overtimeHours,
        doubleTimeHours,
        regularRate: hourlyRate,
        overtimeRate,
        doubleTimeRate,
        grossPay,
        federalTax: taxes.federalTax,
        stateTax: taxes.stateTax,
        socialSecurityTax: taxes.socialSecurityTax,
        medicareTax: taxes.medicareTax,
        stateDisabilityTax: taxes.stateDisabilityTax,
        otherDeductions: 0,
        netPay,
        ytdGross: ytdTotals.ytdGross + grossPay,
        ytdTaxes: ytdTotals.ytdTaxes + totalTaxes,
        createdAt: new Date()
      };

    } catch (error) {
      payrollLogger.error(`Calculate employee payroll error for ${employee.id}:`, error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Calculate FLSA-compliant hours
   */
  private calculateFLSAHours(totalHours: number): {
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
  } {
    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    if (totalHours <= 40) {
      regularHours = totalHours;
    } else if (totalHours <= 60) {
      regularHours = 40;
      overtimeHours = totalHours - 40;
    } else {
      regularHours = 40;
      overtimeHours = 20;
      doubleTimeHours = totalHours - 60;
    }

    return {
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      doubleTimeHours: Math.round(doubleTimeHours * 100) / 100
    };
  }

  /**
   * Calculate federal, state, and payroll taxes
   */
  private calculateTaxes(grossPay: number, ytdGross: number): {
    federalTax: number;
    stateTax: number;
    socialSecurityTax: number;
    medicareTax: number;
    stateDisabilityTax: number;
  } {
    // Federal withholding (simplified - would use IRS tables)
    const federalTax = Math.round(grossPay * this.TAX_CONFIG.federalWithholdingRate * 100) / 100;

    // State withholding
    const stateTax = Math.round(grossPay * this.TAX_CONFIG.stateWithholdingRate * 100) / 100;

    // Social Security tax (subject to wage base)
    let socialSecurityTax = 0;
    const prevYtdGross = ytdGross - grossPay;
    if (prevYtdGross < this.TAX_CONFIG.socialSecurityWageBase) {
      const taxableWages = Math.min(grossPay, this.TAX_CONFIG.socialSecurityWageBase - prevYtdGross);
      socialSecurityTax = Math.round(taxableWages * this.TAX_CONFIG.socialSecurityRate * 100) / 100;
    }

    // Medicare tax (no wage base limit)
    let medicareTax = Math.round(grossPay * this.TAX_CONFIG.medicareRate * 100) / 100;

    // Additional Medicare tax (0.9% on wages over $200,000)
    if (ytdGross > this.TAX_CONFIG.medicareAdditionalThreshold) {
      const additionalWages = Math.min(grossPay, ytdGross - this.TAX_CONFIG.medicareAdditionalThreshold);
      medicareTax += Math.round(additionalWages * this.TAX_CONFIG.medicareAdditionalRate * 100) / 100;
    }

    // State disability insurance
    const stateDisabilityTax = Math.round(grossPay * this.TAX_CONFIG.stateDisabilityRate * 100) / 100;

    return {
      federalTax,
      stateTax,
      socialSecurityTax,
      medicareTax,
      stateDisabilityTax
    };
  }

  /**
   * Generate NACHA ACH file for direct deposit
   */
  async generateNACHAFile(
    payrollPeriodId: string,
    userContext: UserContext
  ): Promise<NACHAFile> {
    try {
      const period = await this.getPayrollPeriodById(payrollPeriodId, userContext);
      
      if (period.status !== 'processed') {
        throw new Error('Can only generate NACHA file for processed payroll');
      }

      // Get payroll entries with employee bank info
      const entriesQuery = `
        SELECT pe.*, u.first_name, u.last_name, bi.routing_number, bi.account_number, bi.account_type
        FROM payroll_entries pe
        JOIN users u ON pe.employee_id = u.id
        JOIN bank_info bi ON u.id = bi.user_id
        WHERE pe.payroll_period_id = $1
        AND pe.net_pay > 0
        AND bi.is_active = true
        ORDER BY u.last_name, u.first_name
      `;

      const entriesResult = await this.db.query(entriesQuery, [payrollPeriodId]);
      const entries = entriesResult.rows;

      if (entries.length === 0) {
        throw new Error('No entries with bank information found');
      }

      // NACHA File Header Record (Type 1)
      const fileHeader = this.buildFileHeader(period.payDate);

      // Batch Header Record (Type 5)
      const batchHeader = this.buildBatchHeader(period.payDate, entries.length, period.totalNet);

      // Entry Detail Records (Type 6)
      const entryRecords: string[] = [];
      let totalAmount = 0;

      for (const entry of entries) {
        const entryRecord = this.buildEntryRecord(entry, entryRecords.length + 1);
        entryRecords.push(entryRecord);
        totalAmount += entry.net_pay;
      }

      // Batch Control Record (Type 8)
      const batchTrailer = this.buildBatchTrailer(entries.length, totalAmount);

      // File Control Record (Type 9)
      const fileTrailer = this.buildFileTrailer(entries.length, totalAmount);

      const nachaFile: NACHAFile = {
        fileHeader,
        batchHeader,
        entryRecords,
        batchTrailer,
        fileTrailer,
        totalAmount,
        entryCount: entries.length
      };

      // Log NACHA file generation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'nacha_file_generated',
        resource: 'payroll_period',
        details: {
          entryCount: entries.length,
          totalAmount,
          payDate: period.payDate
        },
      });

      return nachaFile;

    } catch (error) {
      payrollLogger.error('Generate NACHA file error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Analyze overtime patterns and costs
   */
  async analyzeOvertime(
    startDate: Date,
    endDate: Date,
    userContext: UserContext
  ): Promise<OvertimeAnalysis[]> {
    try {
      const analysisQuery = `
        SELECT 
          u.id as employee_id,
          u.first_name || ' ' || u.last_name as employee_name,
          u.hourly_rate,
          SUM(pe.regular_hours) as total_regular,
          SUM(pe.overtime_hours) as total_overtime,
          SUM(pe.double_time_hours) as total_double_time,
          SUM(pe.regular_hours + pe.overtime_hours + pe.double_time_hours) as total_hours,
          AVG(pe.overtime_hours) as avg_overtime_per_period,
          COUNT(pe.id) as periods_worked
        FROM users u
        JOIN payroll_entries pe ON u.id = pe.employee_id
        JOIN payroll_periods pp ON pe.payroll_period_id = pp.id
        WHERE u.organization_id = $1
        AND pp.start_date >= $2
        AND pp.end_date <= $3
        AND u.role = 'caregiver'
        GROUP BY u.id, u.first_name, u.last_name, u.hourly_rate
        HAVING SUM(pe.overtime_hours + pe.double_time_hours) > 0
        ORDER BY SUM(pe.overtime_hours + pe.double_time_hours) DESC
      `;

      const result = await this.db.query(analysisQuery, [
        userContext.organizationId,
        startDate,
        endDate
      ]);

      const analyses: OvertimeAnalysis[] = [];

      for (const row of result.rows) {
        const totalHours = parseFloat(row.total_hours);
        const overtimeHours = parseFloat(row.total_overtime);
        const doubleTimeHours = parseFloat(row.total_double_time);
        const regularHours = parseFloat(row.total_regular);
        const hourlyRate = parseFloat(row.hourly_rate);

        const overtimePercent = totalHours > 0 ? ((overtimeHours + doubleTimeHours) / totalHours) * 100 : 0;
        
        // Calculate cost impact
        const regularCost = regularHours * hourlyRate;
        const overtimeCost = (overtimeHours * hourlyRate * 1.5) + (doubleTimeHours * hourlyRate * 2.0);
        const costImpact = overtimeCost - (overtimeHours + doubleTimeHours) * hourlyRate;

        // Determine trend (would compare to previous periods)
        const trendDirection = 'stable' as const; // Simplified

        let recommendation = '';
        if (overtimePercent > 30) {
          recommendation = 'Consider hiring additional staff or redistributing workload';
        } else if (overtimePercent > 20) {
          recommendation = 'Monitor overtime levels and optimize scheduling';
        } else if (overtimePercent > 10) {
          recommendation = 'Acceptable overtime levels, continue monitoring';
        } else {
          recommendation = 'Low overtime usage, efficient scheduling';
        }

        analyses.push({
          employeeId: row.employee_id,
          employeeName: row.employee_name,
          regularHours,
          overtimeHours,
          doubleTimeHours,
          overtimePercent: Math.round(overtimePercent * 100) / 100,
          costImpact: Math.round(costImpact * 100) / 100,
          recommendation,
          trendDirection
        });
      }

      return analyses;

    } catch (error) {
      payrollLogger.error('Analyze overtime error:', error as Record<string, any>);
      throw error;
    }
  }

  // Private helper methods for NACHA file generation
  private buildFileHeader(effectiveDate: Date): string {
    const immediateDestination = '123456789'; // Bank routing number
    const immediateOrigin = '1234567890'; // Company ID
    const fileCreationDate = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const fileCreationTime = new Date().toTimeString().slice(0, 4);
    const fileIdModifier = 'A';
    const recordSize = '094';
    const blockingFactor = '10';
    const formatCode = '1';
    const immediateDestinationName = 'BANK NAME'.padEnd(23);
    const immediateOriginName = 'COMPANY NAME'.padEnd(23);
    const referenceCode = ''.padEnd(8);

    return `1${immediateDestination}${immediateOrigin}${fileCreationDate}${fileCreationTime}${fileIdModifier}${recordSize}${blockingFactor}${formatCode}${immediateDestinationName}${immediateOriginName}${referenceCode}`;
  }

  private buildBatchHeader(effectiveDate: Date, entryCount: number, totalAmount: number): string {
    const serviceClassCode = '200'; // Credits only
    const companyName = 'COMPANY NAME'.padEnd(16);
    const companyDiscretionaryData = ''.padEnd(20);
    const companyId = '1234567890';
    const standardEntryClassCode = 'PPD';
    const companyEntryDescription = 'PAYROLL'.padEnd(10);
    const companyDescriptiveDate = ''.padEnd(6);
    const effectiveDateStr = effectiveDate.toISOString().slice(2, 10).replace(/-/g, '');
    const settlementDate = ''.padEnd(3);
    const originatorStatusCode = '1';
    const originatingDFI = '12345678';
    const batchNumber = '0000001';

    return `5${serviceClassCode}${companyName}${companyDiscretionaryData}${companyId}${standardEntryClassCode}${companyEntryDescription}${companyDescriptiveDate}${effectiveDateStr}${settlementDate}${originatorStatusCode}${originatingDFI}${batchNumber}`;
  }

  private buildEntryRecord(entry: any, traceNumber: number): string {
    const transactionCode = entry.account_type === 'checking' ? '22' : '32';
    const receivingDFI = entry.routing_number.slice(0, 8);
    const checkDigit = entry.routing_number.slice(8);
    const accountNumber = entry.account_number.padEnd(17).slice(0, 17);
    const amount = Math.round(entry.net_pay * 100).toString().padStart(10, '0');
    const individualIdNumber = entry.employee_id.slice(0, 15).padEnd(15);
    const individualName = `${entry.first_name} ${entry.last_name}`.slice(0, 22).padEnd(22);
    const discretionaryData = ''.padEnd(2);
    const addendaRecordIndicator = '0';
    const traceNumberStr = `12345678${traceNumber.toString().padStart(7, '0')}`;

    return `6${transactionCode}${receivingDFI}${checkDigit}${accountNumber}${amount}${individualIdNumber}${individualName}${discretionaryData}${addendaRecordIndicator}${traceNumberStr}`;
  }

  private buildBatchTrailer(entryCount: number, totalAmount: number): string {
    const serviceClassCode = '200';
    const entryAddendaCount = entryCount.toString().padStart(6, '0');
    const entryHash = '0'.padStart(10, '0'); // Simplified
    const totalDebits = '0'.padStart(12, '0');
    const totalCredits = Math.round(totalAmount * 100).toString().padStart(12, '0');
    const companyId = '1234567890';
    const messageAuthenticationCode = ''.padEnd(19);
    const reserved = ''.padEnd(6);
    const originatingDFI = '12345678';
    const batchNumber = '0000001';

    return `8${serviceClassCode}${entryAddendaCount}${entryHash}${totalDebits}${totalCredits}${companyId}${messageAuthenticationCode}${reserved}${originatingDFI}${batchNumber}`;
  }

  private buildFileTrailer(entryCount: number, totalAmount: number): string {
    const batchCount = '000001';
    const blockCount = '000001';
    const entryAddendaCount = entryCount.toString().padStart(8, '0');
    const entryHash = '0'.padStart(10, '0');
    const totalDebits = '000000000000';
    const totalCredits = Math.round(totalAmount * 100).toString().padStart(12, '0');
    const reserved = ''.padEnd(39);

    return `9${batchCount}${blockCount}${entryAddendaCount}${entryHash}${totalDebits}${totalCredits}${reserved}`;
  }

  // Additional helper methods
  private async getPayrollPeriodById(periodId: string, userContext: UserContext): Promise<PayrollPeriod> {
    const result = await this.db.query(
      'SELECT * FROM payroll_periods WHERE id = $1 AND organization_id = $2',
      [periodId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Payroll period not found');
    }

    return this.mapRowToPayrollPeriod(result.rows[0]);
  }

  private async getYTDTotals(employeeId: string, asOfDate: Date): Promise<{ ytdGross: number; ytdTaxes: number }> {
    const yearStart = new Date(asOfDate.getFullYear(), 0, 1);
    
    const result = await this.db.query(`
      SELECT 
        COALESCE(SUM(gross_pay), 0) as ytd_gross,
        COALESCE(SUM(federal_tax + state_tax + social_security_tax + medicare_tax + state_disability_tax), 0) as ytd_taxes
      FROM payroll_entries pe
      JOIN payroll_periods pp ON pe.payroll_period_id = pp.id
      WHERE pe.employee_id = $1
      AND pp.start_date >= $2
      AND pp.end_date < $3
    `, [employeeId, yearStart, asOfDate]);

    return {
      ytdGross: parseFloat(result.rows[0].ytd_gross || '0'),
      ytdTaxes: parseFloat(result.rows[0].ytd_taxes || '0')
    };
  }

  private mapRowToPayrollPeriod(row: any): PayrollPeriod {
    return {
      id: row.id,
      startDate: row.start_date,
      endDate: row.end_date,
      payDate: row.pay_date,
      status: row.status,
      totalGross: parseFloat(row.total_gross || '0'),
      totalNet: parseFloat(row.total_net || '0'),
      totalTaxes: parseFloat(row.total_taxes || '0'),
      employeeCount: parseInt(row.employee_count || '0'),
      createdAt: row.created_at,
      processedBy: row.processed_by,
      processedAt: row.processed_at
    };
  }

  private async generatePayrollPeriodId(): Promise<string> {
    return `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generatePayrollEntryId(): Promise<string> {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}