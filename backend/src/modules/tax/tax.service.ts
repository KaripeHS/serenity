/**
 * Tax Compliance Service for Serenity ERP
 * Handles federal, Ohio state, and local tax calculations and compliance
 */

import { DatabaseClient } from '../../database/client';
import { AuditLogger } from '../../audit/logger';
import { UserContext } from '../../auth/access-control';

export interface TaxCalculation {
  id: string;
  employeeId: string;
  payPeriodId: string;
  grossPay: number;
  federalWithholding: number;
  ohioStateWithholding: number;
  localWithholding: number;
  socialSecurityTax: number;
  medicareTax: number;
  ohioSUI: number;
  federalUnemployment: number;
  netPay: number;
  calculatedAt: Date;
  taxYear: number;
  municipalityCode?: string;
}

export interface TaxForm {
  id: string;
  formType: 'W2' | '1099_NEC' | '941' | '940' | 'OH_IT501' | 'OH_WR' | 'LOCAL';
  taxYear: number;
  employeeId?: string;
  organizationId: string;
  formData: any;
  generatedAt: Date;
  submittedAt?: Date;
  status: 'draft' | 'ready' | 'submitted' | 'accepted' | 'rejected';
}

export interface TaxDeadline {
  id: string;
  deadline: Date;
  description: string;
  formType: string;
  jurisdiction: 'federal' | 'ohio' | 'local';
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
  reminderSent: boolean;
}

export class TaxService {
  constructor(
    private db: DatabaseClient,
    private auditLogger: AuditLogger
  ) {}

  /**
   * Calculate federal tax withholding using 2024 tax tables
   */
  async calculateFederalWithholding(
    grossPay: number,
    payFrequency: 'weekly' | 'biweekly' | 'monthly',
    filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household',
    allowances: number,
    additionalWithholding: number = 0
  ): Promise<number> {
    // 2024 Federal Income Tax Withholding Tables
    const federalTaxBrackets: { [key: string]: { min: number; max: number; rate: number; }[] } = {
      single: [
        { min: 0, max: 13850, rate: 0.10 },
        { min: 13850, max: 52850, rate: 0.12 },
        { min: 52850, max: 84200, rate: 0.22 },
        { min: 84200, max: 160275, rate: 0.24 },
        { min: 160275, max: 204100, rate: 0.32 },
        { min: 204100, max: 510300, rate: 0.35 },
        { min: 510300, max: Infinity, rate: 0.37 }
      ],
      married_joint: [
        { min: 0, max: 27700, rate: 0.10 },
        { min: 27700, max: 105700, rate: 0.12 },
        { min: 105700, max: 168400, rate: 0.22 },
        { min: 168400, max: 320550, rate: 0.24 },
        { min: 320550, max: 408200, rate: 0.32 },
        { min: 408200, max: 612350, rate: 0.35 },
        { min: 612350, max: Infinity, rate: 0.37 }
      ],
      head_of_household: [
        { min: 0, max: 20550, rate: 0.10 },
        { min: 20550, max: 78850, rate: 0.12 },
        { min: 78850, max: 164200, rate: 0.22 },
        { min: 164200, max: 209850, rate: 0.24 },
        { min: 209850, max: 523600, rate: 0.32 },
        { min: 523600, max: 628300, rate: 0.35 },
        { min: 628300, max: Infinity, rate: 0.37 }
      ],
      married_separate: [
        { min: 0, max: 13850, rate: 0.10 },
        { min: 13850, max: 52850, rate: 0.12 },
        { min: 52850, max: 84200, rate: 0.22 },
        { min: 84200, max: 160275, rate: 0.24 },
        { min: 160275, max: 204100, rate: 0.32 },
        { min: 204100, max: 306175, rate: 0.35 },
        { min: 306175, max: Infinity, rate: 0.37 }
      ]
    };

    const annualPay = this.convertToAnnual(grossPay, payFrequency);
    const standardDeduction = filingStatus === 'married_joint' ? 27700 : 13850;
    const taxableIncome = Math.max(0, annualPay - standardDeduction - (allowances * 4300));

    const brackets = federalTaxBrackets[filingStatus] || federalTaxBrackets.single;
    let tax = 0;

    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableAtBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        tax += taxableAtBracket * bracket.rate;
      }
    }

    const periodicTax = this.convertFromAnnual(tax, payFrequency);
    return Math.round((periodicTax + additionalWithholding) * 100) / 100;
  }

  /**
   * Calculate Ohio state tax withholding
   */
  async calculateOhioStateWithholding(
    grossPay: number,
    payFrequency: 'weekly' | 'biweekly' | 'monthly',
    filingStatus: 'single' | 'married_joint' | 'married_separate',
    allowances: number
  ): Promise<number> {
    const annualPay = this.convertToAnnual(grossPay, payFrequency);

    // Ohio tax brackets for 2024
    const ohioTaxBrackets = [
      { min: 0, max: 26050, rate: 0.0285 },
      { min: 26050, max: 62450, rate: 0.0321 },
      { min: 62450, max: 104350, rate: 0.0357 },
      { min: 104350, max: 208700, rate: 0.0393 },
      { min: 208700, max: Infinity, rate: 0.0399 }
    ];

    const standardDeduction = filingStatus === 'married_joint' ? 4800 : 2400;
    const personalExemption = allowances * 2650;
    const taxableIncome = Math.max(0, annualPay - standardDeduction - personalExemption);

    let tax = 0;
    for (const bracket of ohioTaxBrackets) {
      if (taxableIncome > bracket.min) {
        const taxableAtBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        tax += taxableAtBracket * bracket.rate;
      }
    }

    return Math.round(this.convertFromAnnual(tax, payFrequency) * 100) / 100;
  }

  /**
   * Calculate Social Security and Medicare taxes (FICA)
   */
  async calculateFICATaxes(grossPay: number, ytdGrossPay: number): Promise<{
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
  }> {
    const ssWageBase = 160200; // 2024 SS wage base
    const ssRate = 0.062;
    const medicareRate = 0.0145;
    const additionalMedicareRate = 0.009;
    const additionalMedicareThreshold = 200000;

    // Social Security tax (capped at wage base)
    const ssWagesThisPeriod = Math.max(0, Math.min(grossPay, ssWageBase - ytdGrossPay));
    const socialSecurity = ssWagesThisPeriod * ssRate;

    // Medicare tax (no cap)
    const medicare = grossPay * medicareRate;

    // Additional Medicare tax (0.9% on wages over $200K)
    let additionalMedicare = 0;
    if (ytdGrossPay + grossPay > additionalMedicareThreshold) {
      const excessWages = Math.max(0, (ytdGrossPay + grossPay) - additionalMedicareThreshold);
      additionalMedicare = Math.min(excessWages, grossPay) * additionalMedicareRate;
    }

    return {
      socialSecurity: Math.round(socialSecurity * 100) / 100,
      medicare: Math.round(medicare * 100) / 100,
      additionalMedicare: Math.round(additionalMedicare * 100) / 100
    };
  }

  /**
   * Calculate unemployment taxes (FUTA and SUTA)
   */
  async calculateUnemploymentTaxes(
    grossPay: number,
    ytdGrossPay: number,
    ohioSUIRate: number = 0.004
  ): Promise<{
    federalUnemployment: number;
    ohioSUI: number;
  }> {
    const futaWageBase = 7000; // 2024 FUTA wage base
    const futaRate = 0.006; // After SUTA credit
    const ohioSUIWageBase = 9000; // 2024 Ohio SUTA wage base

    // FUTA (Federal Unemployment Tax)
    const futaWagesThisPeriod = Math.max(0, Math.min(grossPay, futaWageBase - ytdGrossPay));
    const federalUnemployment = futaWagesThisPeriod * futaRate;

    // Ohio SUTA (State Unemployment Tax)
    const suiWagesThisPeriod = Math.max(0, Math.min(grossPay, ohioSUIWageBase - ytdGrossPay));
    const ohioSUI = suiWagesThisPeriod * ohioSUIRate;

    return {
      federalUnemployment: Math.round(federalUnemployment * 100) / 100,
      ohioSUI: Math.round(ohioSUI * 100) / 100
    };
  }

  /**
   * Generate W-2 form data
   */
  async generateW2(employeeId: string, taxYear: number): Promise<TaxForm> {
    const employee = await this.db.findOne('employees', { id: employeeId });
    const yearlyTotals = await this.db.query(`
      SELECT
        SUM(gross_pay) as total_wages,
        SUM(federal_withholding) as federal_withheld,
        SUM(ohio_state_withholding) as state_withheld,
        SUM(social_security_tax) as ss_tax,
        SUM(medicare_tax) as medicare_tax,
        SUM(social_security_wages) as ss_wages,
        SUM(medicare_wages) as medicare_wages
      FROM tax_calculations
      WHERE employee_id = $1 AND tax_year = $2
    `, [employeeId, taxYear]);

    const w2Data = {
      employeeSSN: employee.ssn,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      employeeAddress: employee.address,
      employerEIN: process.env.COMPANY_EIN,
      employerName: 'Serenity Care Partners',
      employerAddress: process.env.COMPANY_ADDRESS,
      box1_wages: yearlyTotals.rows[0].total_wages,
      box2_federal_withheld: yearlyTotals.rows[0].federal_withheld,
      box3_ss_wages: yearlyTotals.rows[0].ss_wages,
      box4_ss_tax: yearlyTotals.rows[0].ss_tax,
      box5_medicare_wages: yearlyTotals.rows[0].medicare_wages,
      box6_medicare_tax: yearlyTotals.rows[0].medicare_tax,
      box17_state_withheld: yearlyTotals.rows[0].state_withheld,
      box18_local_wages: yearlyTotals.rows[0].total_wages,
      taxYear: taxYear
    };

    const w2Form: TaxForm = {
      id: crypto.randomUUID(),
      formType: 'W2',
      taxYear,
      employeeId,
      organizationId: employee.organization_id,
      formData: w2Data,
      generatedAt: new Date(),
      status: 'ready'
    };

    await this.db.insert('tax_forms', w2Form);

    await this.auditLogger.log({
      userId: 'system',
      action: 'generate_w2',
      resourceType: 'tax_form',
      resourceId: w2Form.id,
      metadata: { employeeId, taxYear }
    });

    return w2Form;
  }

  /**
   * Generate quarterly 941 form
   */
  async generate941(quarter: number, taxYear: number): Promise<TaxForm> {
    const quarterStart = new Date(taxYear, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(taxYear, quarter * 3, 0);

    const quarterlyTotals = await this.db.query(`
      SELECT
        COUNT(DISTINCT employee_id) as employee_count,
        SUM(gross_pay) as total_wages,
        SUM(federal_withholding) as federal_withheld,
        SUM(social_security_tax + medicare_tax) as fica_employee,
        SUM(social_security_tax + medicare_tax) as fica_employer,
        SUM(additional_medicare_tax) as additional_medicare
      FROM tax_calculations
      WHERE calculated_at BETWEEN $1 AND $2
    `, [quarterStart, quarterEnd]);

    const form941Data = {
      ein: process.env.COMPANY_EIN,
      quarter,
      taxYear,
      employeeCount: quarterlyTotals.rows[0].employee_count,
      totalWages: quarterlyTotals.rows[0].total_wages,
      federalWithheld: quarterlyTotals.rows[0].federal_withheld,
      socialSecurityWages: quarterlyTotals.rows[0].total_wages,
      socialSecurityTax: quarterlyTotals.rows[0].fica_employee * 2, // Employee + Employer
      medicareWages: quarterlyTotals.rows[0].total_wages,
      medicareTax: quarterlyTotals.rows[0].fica_employee * 2,
      totalTaxLiability: quarterlyTotals.rows[0].federal_withheld + (quarterlyTotals.rows[0].fica_employee * 2)
    };

    const form941: TaxForm = {
      id: crypto.randomUUID(),
      formType: '941',
      taxYear,
      organizationId: 'serenity_care_partners',
      formData: form941Data,
      generatedAt: new Date(),
      status: 'ready'
    };

    await this.db.insert('tax_forms', form941);
    return form941;
  }

  /**
   * Track tax compliance deadlines
   */
  async trackTaxDeadlines(): Promise<TaxDeadline[]> {
    const currentYear = new Date().getFullYear();
    const deadlines: TaxDeadline[] = [
      // Federal quarterly deadlines
      {
        id: crypto.randomUUID(),
        deadline: new Date(currentYear, 3, 30), // April 30 for Q1
        description: 'Q1 Form 941 Federal Tax Return',
        formType: '941',
        jurisdiction: 'federal',
        status: 'upcoming',
        reminderSent: false
      },
      {
        id: crypto.randomUUID(),
        deadline: new Date(currentYear, 6, 31), // July 31 for Q2
        description: 'Q2 Form 941 Federal Tax Return',
        formType: '941',
        jurisdiction: 'federal',
        status: 'upcoming',
        reminderSent: false
      },
      // Ohio quarterly deadlines
      {
        id: crypto.randomUUID(),
        deadline: new Date(currentYear, 3, 30),
        description: 'Q1 Ohio Withholding Tax Return (IT-501)',
        formType: 'OH_IT501',
        jurisdiction: 'ohio',
        status: 'upcoming',
        reminderSent: false
      },
      // Year-end deadlines
      {
        id: crypto.randomUUID(),
        deadline: new Date(currentYear + 1, 0, 31), // January 31
        description: 'W-2 Distribution to Employees',
        formType: 'W2',
        jurisdiction: 'federal',
        status: 'upcoming',
        reminderSent: false
      }
    ];

    // Update status based on current date
    const now = new Date();
    deadlines.forEach(deadline => {
      if (deadline.deadline < now) {
        deadline.status = 'overdue';
      } else if (deadline.deadline.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        deadline.status = 'due';
      }
    });

    return deadlines;
  }

  /**
   * Helper methods
   */
  private convertToAnnual(amount: number, frequency: string): number {
    const multipliers: { [key: string]: number } = { weekly: 52, biweekly: 26, monthly: 12 };
    return amount * (multipliers[frequency] || 1);
  }

  private convertFromAnnual(amount: number, frequency: string): number {
    const divisors: { [key: string]: number } = { weekly: 52, biweekly: 26, monthly: 12 };
    return amount / (divisors[frequency] || 1);
  }

  /**
   * Calculate comprehensive payroll taxes for an employee
   */
  async calculatePayrollTaxes(
    employeeId: string,
    grossPay: number,
    payPeriodId: string,
    userContext: UserContext
  ): Promise<TaxCalculation> {
    const employee = await this.db.findOne('employees', { id: employeeId });
    const ytdTotals = await this.getYTDTotals(employeeId);

    // Calculate all tax components
    const federalWithholding = await this.calculateFederalWithholding(
      grossPay,
      employee.pay_frequency,
      employee.filing_status,
      employee.federal_allowances,
      employee.additional_federal_withholding || 0
    );

    const ohioStateWithholding = await this.calculateOhioStateWithholding(
      grossPay,
      employee.pay_frequency,
      employee.filing_status,
      employee.state_allowances
    );

    const ficaTaxes = await this.calculateFICATaxes(grossPay, ytdTotals.grossPay);
    const unemploymentTaxes = await this.calculateUnemploymentTaxes(
      grossPay,
      ytdTotals.grossPay,
      employee.sui_rate
    );

    // Calculate local taxes if applicable
    let localWithholding = 0;
    if (employee.municipality_code) {
      localWithholding = await this.calculateLocalTax(
        grossPay,
        employee.municipality_code
      );
    }

    const totalTaxes = federalWithholding + ohioStateWithholding + localWithholding +
                      ficaTaxes.socialSecurity + ficaTaxes.medicare + ficaTaxes.additionalMedicare;

    const netPay = grossPay - totalTaxes;

    const taxCalculation: TaxCalculation = {
      id: crypto.randomUUID(),
      employeeId,
      payPeriodId,
      grossPay,
      federalWithholding,
      ohioStateWithholding,
      localWithholding,
      socialSecurityTax: ficaTaxes.socialSecurity,
      medicareTax: ficaTaxes.medicare + ficaTaxes.additionalMedicare,
      ohioSUI: unemploymentTaxes.ohioSUI,
      federalUnemployment: unemploymentTaxes.federalUnemployment,
      netPay,
      calculatedAt: new Date(),
      taxYear: new Date().getFullYear(),
      municipalityCode: employee.municipality_code
    };

    await this.db.insert('tax_calculations', taxCalculation);

    await this.auditLogger.log({
      userId: userContext.userId,
      action: 'calculate_payroll_taxes',
      resourceType: 'tax_calculation',
      resourceId: taxCalculation.id,
      metadata: { employeeId, grossPay, netPay }
    });

    return taxCalculation;
  }

  private async getYTDTotals(employeeId: string): Promise<{ grossPay: number }> {
    const result = await this.db.query(`
      SELECT COALESCE(SUM(gross_pay), 0) as gross_pay
      FROM tax_calculations
      WHERE employee_id = $1 AND tax_year = $2
    `, [employeeId, new Date().getFullYear()]);

    return { grossPay: result.rows[0].gross_pay };
  }

  private async calculateLocalTax(grossPay: number, municipalityCode: string): Promise<number> {
    // Ohio municipality tax rates (examples)
    const municipalityRates: Record<string, number> = {
      'COLUMBUS': 0.025,
      'CLEVELAND': 0.025,
      'CINCINNATI': 0.019,
      'TOLEDO': 0.0225,
      'AKRON': 0.025,
      'DAYTON': 0.0225
    };

    const rate = municipalityRates[municipalityCode] || 0;
    return Math.round(grossPay * rate * 100) / 100;
  }
}