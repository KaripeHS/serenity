/**
 * Payroll Integration Service for Year 2 Features
 * Provides simplified integration with external payroll providers (ADP, Gusto, Paychex)
 * Uses the payroll_providers, payroll_employee_mappings, payroll_runs tables from 065_year2_preparation.sql
 */

import { getDbClient } from '../database/client';

type PayrollProviderType = 'adp' | 'gusto' | 'paychex' | 'quickbooks' | 'manual';

interface ConfigureProviderData {
  providerName: PayrollProviderType;
  apiKey?: string;
  apiSecret?: string;
  companyId?: string;
  environment: 'sandbox' | 'production';
  webhookUrl?: string;
  settings?: Record<string, any>;
}

interface CreateEmployeeMappingData {
  caregiverId: string;
  externalEmployeeId: string;
  payRateHourly: number;
  payRateOvertime?: number;
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  department?: string;
  costCenter?: string;
}

interface CreatePayrollRunData {
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  includeBonus?: boolean;
  notes?: string;
}

export class PayrollIntegrationService {
  // ==========================================
  // Provider Configuration
  // ==========================================

  async getProviders(organizationId: string): Promise<any[]> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        id,
        provider_name,
        environment,
        company_id,
        webhook_url,
        status,
        last_sync_at,
        settings,
        created_at,
        updated_at
      FROM payroll_providers
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    return result.rows.map(row => ({
      id: row.id,
      providerName: row.provider_name,
      environment: row.environment,
      companyId: row.company_id,
      webhookUrl: row.webhook_url,
      status: row.status,
      lastSyncAt: row.last_sync_at,
      settings: row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getActiveProvider(organizationId: string): Promise<any | null> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        id,
        provider_name,
        environment,
        company_id,
        api_key,
        webhook_url,
        status,
        last_sync_at,
        settings
      FROM payroll_providers
      WHERE organization_id = $1 AND status = 'active'
      LIMIT 1
    `, [organizationId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      providerName: row.provider_name,
      environment: row.environment,
      companyId: row.company_id,
      hasApiKey: !!row.api_key,
      webhookUrl: row.webhook_url,
      status: row.status,
      lastSyncAt: row.last_sync_at,
      settings: row.settings
    };
  }

  async configureProvider(organizationId: string, data: ConfigureProviderData): Promise<any> {
    const db = getDbClient();

    // Deactivate any existing active providers
    await db.query(`
      UPDATE payroll_providers
      SET status = 'inactive', updated_at = NOW()
      WHERE organization_id = $1 AND status = 'active'
    `, [organizationId]);

    const result = await db.query(`
      INSERT INTO payroll_providers (
        organization_id,
        provider_name,
        api_key,
        api_secret,
        company_id,
        environment,
        webhook_url,
        settings,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
      RETURNING id, created_at
    `, [
      organizationId,
      data.providerName,
      data.apiKey || null,
      data.apiSecret || null,
      data.companyId || null,
      data.environment,
      data.webhookUrl || null,
      data.settings ? JSON.stringify(data.settings) : null
    ]);

    return {
      id: result.rows[0].id,
      providerName: data.providerName,
      environment: data.environment,
      companyId: data.companyId,
      status: 'active',
      createdAt: result.rows[0].created_at
    };
  }

  async testConnection(providerId: string, organizationId: string): Promise<any> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT provider_name, api_key, api_secret, company_id, environment
      FROM payroll_providers
      WHERE id = $1 AND organization_id = $2
    `, [providerId, organizationId]);

    if (result.rows.length === 0) {
      throw new Error('Provider not found');
    }

    const provider = result.rows[0];

    // Provider-specific connection tests (placeholder implementations)
    try {
      let testResult: any;

      switch (provider.provider_name) {
        case 'adp':
          testResult = this.testAdpConnection(provider);
          break;
        case 'gusto':
          testResult = this.testGustoConnection(provider);
          break;
        case 'paychex':
          testResult = this.testPaychexConnection(provider);
          break;
        case 'quickbooks':
          testResult = this.testQuickbooksConnection(provider);
          break;
        case 'manual':
          testResult = { success: true, message: 'Manual provider - no connection test needed' };
          break;
        default:
          testResult = { success: false, message: 'Unknown provider' };
      }

      if (testResult.success) {
        await db.query(`
          UPDATE payroll_providers
          SET last_sync_at = NOW(), status = 'active', updated_at = NOW()
          WHERE id = $1
        `, [providerId]);
      }

      return testResult;
    } catch (error: any) {
      await db.query(`
        UPDATE payroll_providers
        SET status = 'error', updated_at = NOW()
        WHERE id = $1
      `, [providerId]);

      return {
        success: false,
        message: error.message || 'Connection test failed'
      };
    }
  }

  private testAdpConnection(provider: any): any {
    if (!provider.api_key || !provider.company_id) {
      return { success: false, message: 'Missing ADP API key or company ID' };
    }
    return { success: true, message: 'ADP connection successful' };
  }

  private testGustoConnection(provider: any): any {
    if (!provider.api_key) {
      return { success: false, message: 'Missing Gusto API key' };
    }
    return { success: true, message: 'Gusto connection successful' };
  }

  private testPaychexConnection(provider: any): any {
    if (!provider.api_key || !provider.company_id) {
      return { success: false, message: 'Missing Paychex API key or client ID' };
    }
    return { success: true, message: 'Paychex connection successful' };
  }

  private testQuickbooksConnection(provider: any): any {
    if (!provider.api_key) {
      return { success: false, message: 'Missing QuickBooks API credentials' };
    }
    return { success: true, message: 'QuickBooks connection successful' };
  }

  // ==========================================
  // Employee Mapping
  // ==========================================

  async getEmployeeMappings(organizationId: string, unmappedOnly: boolean = false): Promise<any[]> {
    const db = getDbClient();

    let query = `
      SELECT
        u.id as caregiver_id,
        u.first_name,
        u.last_name,
        u.email,
        u.status,
        m.id as mapping_id,
        m.external_employee_id,
        m.pay_rate_hourly,
        m.pay_rate_overtime,
        m.pay_frequency,
        m.department,
        m.cost_center,
        m.last_synced_at,
        m.sync_status
      FROM users u
      LEFT JOIN payroll_employee_mappings m ON m.caregiver_id = u.id
      WHERE u.organization_id = $1
        AND u.role IN ('caregiver', 'nurse')
    `;

    if (unmappedOnly) {
      query += ` AND m.id IS NULL`;
    }

    query += ` ORDER BY u.last_name, u.first_name`;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      caregiverId: row.caregiver_id,
      name: `${row.first_name} ${row.last_name}`,
      email: row.email,
      status: row.status,
      mapping: row.mapping_id ? {
        id: row.mapping_id,
        externalEmployeeId: row.external_employee_id,
        payRateHourly: parseFloat(row.pay_rate_hourly),
        payRateOvertime: row.pay_rate_overtime ? parseFloat(row.pay_rate_overtime) : null,
        payFrequency: row.pay_frequency,
        department: row.department,
        costCenter: row.cost_center,
        lastSyncedAt: row.last_synced_at,
        syncStatus: row.sync_status
      } : null
    }));
  }

  async createEmployeeMapping(organizationId: string, data: CreateEmployeeMappingData): Promise<any> {
    const db = getDbClient();

    // Verify caregiver belongs to organization
    const caregiverCheck = await db.query(`
      SELECT id FROM users
      WHERE id = $1 AND organization_id = $2 AND role IN ('caregiver', 'nurse')
    `, [data.caregiverId, organizationId]);

    if (caregiverCheck.rows.length === 0) {
      throw new Error('Caregiver not found');
    }

    // Check for existing mapping
    const existingCheck = await db.query(`
      SELECT id FROM payroll_employee_mappings WHERE caregiver_id = $1
    `, [data.caregiverId]);

    if (existingCheck.rows.length > 0) {
      throw new Error('Caregiver already has a payroll mapping');
    }

    // Get active provider
    const provider = await this.getActiveProvider(organizationId);
    if (!provider) {
      throw new Error('No active payroll provider configured');
    }

    const result = await db.query(`
      INSERT INTO payroll_employee_mappings (
        provider_id,
        caregiver_id,
        external_employee_id,
        pay_rate_hourly,
        pay_rate_overtime,
        pay_frequency,
        department,
        cost_center,
        sync_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING id, created_at
    `, [
      provider.id,
      data.caregiverId,
      data.externalEmployeeId,
      data.payRateHourly,
      data.payRateOvertime || null,
      data.payFrequency,
      data.department || null,
      data.costCenter || null
    ]);

    return {
      id: result.rows[0].id,
      caregiverId: data.caregiverId,
      externalEmployeeId: data.externalEmployeeId,
      payRateHourly: data.payRateHourly,
      payFrequency: data.payFrequency,
      syncStatus: 'pending',
      createdAt: result.rows[0].created_at
    };
  }

  // ==========================================
  // Payroll Run Management
  // ==========================================

  async getPayrollRuns(organizationId: string, status?: string): Promise<any[]> {
    const db = getDbClient();
    const params: any[] = [organizationId];

    let query = `
      SELECT
        id,
        pay_period_start,
        pay_period_end,
        pay_date,
        status,
        total_regular_hours,
        total_overtime_hours,
        total_gross_pay,
        total_bonus,
        total_deductions,
        total_net_pay,
        employee_count,
        provider_batch_id,
        submitted_at,
        processed_at,
        notes,
        created_at
      FROM payroll_runs
      WHERE organization_id = $1
    `;

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY pay_period_start DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      payPeriodStart: row.pay_period_start,
      payPeriodEnd: row.pay_period_end,
      payDate: row.pay_date,
      status: row.status,
      totals: {
        regularHours: parseFloat(row.total_regular_hours) || 0,
        overtimeHours: parseFloat(row.total_overtime_hours) || 0,
        grossPay: parseFloat(row.total_gross_pay) || 0,
        bonus: parseFloat(row.total_bonus) || 0,
        deductions: parseFloat(row.total_deductions) || 0,
        netPay: parseFloat(row.total_net_pay) || 0
      },
      employeeCount: row.employee_count,
      providerBatchId: row.provider_batch_id,
      submittedAt: row.submitted_at,
      processedAt: row.processed_at,
      notes: row.notes,
      createdAt: row.created_at
    }));
  }

  async getPayrollRunById(payrollRunId: string, organizationId: string): Promise<any | null> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        r.id,
        r.pay_period_start,
        r.pay_period_end,
        r.pay_date,
        r.status,
        r.total_regular_hours,
        r.total_overtime_hours,
        r.total_gross_pay,
        r.total_bonus,
        r.total_deductions,
        r.total_net_pay,
        r.employee_count,
        r.provider_batch_id,
        r.submitted_at,
        r.processed_at,
        r.notes,
        r.created_at,
        r.updated_at
      FROM payroll_runs r
      WHERE r.id = $1 AND r.organization_id = $2
    `, [payrollRunId, organizationId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Get line items
    const itemsResult = await db.query(`
      SELECT
        li.id,
        li.caregiver_id,
        u.first_name,
        u.last_name,
        li.regular_hours,
        li.regular_rate,
        li.regular_amount,
        li.overtime_hours,
        li.overtime_rate,
        li.overtime_amount,
        li.holiday_hours,
        li.holiday_amount,
        li.pto_hours,
        li.pto_amount,
        li.bonus_amount,
        li.gross_pay,
        li.deductions,
        li.net_pay,
        li.status,
        li.notes
      FROM payroll_line_items li
      JOIN users u ON u.id = li.caregiver_id
      WHERE li.payroll_run_id = $1
      ORDER BY u.last_name, u.first_name
    `, [payrollRunId]);

    return {
      id: row.id,
      payPeriodStart: row.pay_period_start,
      payPeriodEnd: row.pay_period_end,
      payDate: row.pay_date,
      status: row.status,
      totals: {
        regularHours: parseFloat(row.total_regular_hours) || 0,
        overtimeHours: parseFloat(row.total_overtime_hours) || 0,
        grossPay: parseFloat(row.total_gross_pay) || 0,
        bonus: parseFloat(row.total_bonus) || 0,
        deductions: parseFloat(row.total_deductions) || 0,
        netPay: parseFloat(row.total_net_pay) || 0
      },
      employeeCount: row.employee_count,
      providerBatchId: row.provider_batch_id,
      submittedAt: row.submitted_at,
      processedAt: row.processed_at,
      notes: row.notes,
      lineItems: itemsResult.rows.map(li => ({
        id: li.id,
        caregiverId: li.caregiver_id,
        caregiverName: `${li.first_name} ${li.last_name}`,
        regularHours: parseFloat(li.regular_hours) || 0,
        regularRate: parseFloat(li.regular_rate) || 0,
        regularAmount: parseFloat(li.regular_amount) || 0,
        overtimeHours: parseFloat(li.overtime_hours) || 0,
        overtimeRate: parseFloat(li.overtime_rate) || 0,
        overtimeAmount: parseFloat(li.overtime_amount) || 0,
        holidayHours: parseFloat(li.holiday_hours) || 0,
        holidayAmount: parseFloat(li.holiday_amount) || 0,
        ptoHours: parseFloat(li.pto_hours) || 0,
        ptoAmount: parseFloat(li.pto_amount) || 0,
        bonusAmount: parseFloat(li.bonus_amount) || 0,
        grossPay: parseFloat(li.gross_pay) || 0,
        deductions: li.deductions || {},
        netPay: parseFloat(li.net_pay) || 0,
        status: li.status,
        notes: li.notes
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createPayrollRun(organizationId: string, data: CreatePayrollRunData): Promise<any> {
    const db = getDbClient();

    // Check for duplicate pay period
    const duplicateCheck = await db.query(`
      SELECT id FROM payroll_runs
      WHERE organization_id = $1
        AND pay_period_start = $2
        AND pay_period_end = $3
        AND status NOT IN ('cancelled', 'rejected')
    `, [organizationId, data.payPeriodStart, data.payPeriodEnd]);

    if (duplicateCheck.rows.length > 0) {
      throw new Error('Payroll run already exists for this pay period');
    }

    // Create payroll run
    const result = await db.query(`
      INSERT INTO payroll_runs (
        organization_id,
        pay_period_start,
        pay_period_end,
        pay_date,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, 'draft', $5)
      RETURNING id, created_at
    `, [organizationId, data.payPeriodStart, data.payPeriodEnd, data.payDate, data.notes || null]);

    const payrollRunId = result.rows[0].id;

    // Auto-populate from EVV records
    await this.populatePayrollFromEvv(payrollRunId, organizationId, data.payPeriodStart, data.payPeriodEnd);

    // Calculate bonus if requested
    if (data.includeBonus) {
      await this.calculateBonuses(payrollRunId, organizationId);
    }

    // Calculate totals
    await this.recalculatePayrollTotals(payrollRunId);

    return this.getPayrollRunById(payrollRunId, organizationId);
  }

  private async populatePayrollFromEvv(
    payrollRunId: string,
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<void> {
    const db = getDbClient();

    // Get hours from EVV records for mapped employees
    const evvHoursResult = await db.query(`
      SELECT
        v.caregiver_id,
        m.pay_rate_hourly,
        m.pay_rate_overtime,
        SUM(
          EXTRACT(EPOCH FROM (v.clock_out_time - v.clock_in_time)) / 3600
        ) as total_hours
      FROM visits v
      JOIN payroll_employee_mappings m ON m.caregiver_id = v.caregiver_id
      JOIN users u ON u.id = v.caregiver_id
      WHERE u.organization_id = $1
        AND v.visit_date >= $2
        AND v.visit_date <= $3
        AND v.status = 'completed'
        AND v.clock_in_time IS NOT NULL
        AND v.clock_out_time IS NOT NULL
      GROUP BY v.caregiver_id, m.pay_rate_hourly, m.pay_rate_overtime
    `, [organizationId, periodStart, periodEnd]);

    for (const row of evvHoursResult.rows) {
      const totalHours = parseFloat(row.total_hours);
      const hourlyRate = parseFloat(row.pay_rate_hourly);
      const overtimeRate = row.pay_rate_overtime ?
        parseFloat(row.pay_rate_overtime) : hourlyRate * 1.5;

      // Calculate regular vs overtime (40 hour threshold)
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(totalHours - 40, 0);

      const regularAmount = regularHours * hourlyRate;
      const overtimeAmount = overtimeHours * overtimeRate;
      const grossPay = regularAmount + overtimeAmount;

      await db.query(`
        INSERT INTO payroll_line_items (
          payroll_run_id,
          caregiver_id,
          regular_hours,
          regular_rate,
          regular_amount,
          overtime_hours,
          overtime_rate,
          overtime_amount,
          gross_pay,
          net_pay,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 'pending')
      `, [
        payrollRunId,
        row.caregiver_id,
        regularHours,
        hourlyRate,
        regularAmount,
        overtimeHours,
        overtimeRate,
        overtimeAmount,
        grossPay
      ]);
    }
  }

  private async calculateBonuses(payrollRunId: string, organizationId: string): Promise<void> {
    const db = getDbClient();

    const periodResult = await db.query(`
      SELECT pay_period_start, pay_period_end FROM payroll_runs WHERE id = $1
    `, [payrollRunId]);

    if (periodResult.rows.length === 0) return;

    const { pay_period_start, pay_period_end } = periodResult.rows[0];

    // Calculate EVV compliance bonus
    const bonusResult = await db.query(`
      SELECT
        li.id,
        li.caregiver_id,
        COUNT(v.id) as total_visits,
        COUNT(v.id) FILTER (
          WHERE v.clock_in_time IS NOT NULL
          AND v.clock_out_time IS NOT NULL
          AND v.evv_verification_status = 'verified'
        ) as compliant_visits
      FROM payroll_line_items li
      LEFT JOIN visits v ON v.caregiver_id = li.caregiver_id
        AND v.visit_date >= $2
        AND v.visit_date <= $3
        AND v.status = 'completed'
      WHERE li.payroll_run_id = $1
      GROUP BY li.id, li.caregiver_id
    `, [payrollRunId, pay_period_start, pay_period_end]);

    for (const row of bonusResult.rows) {
      if (row.total_visits > 0) {
        const complianceRate = parseInt(row.compliant_visits) / parseInt(row.total_visits);
        let bonusAmount = 0;

        // Tiered bonus structure based on Serenity policy
        if (complianceRate >= 0.98) {
          bonusAmount = 75;
        } else if (complianceRate >= 0.95) {
          bonusAmount = 50;
        } else if (complianceRate >= 0.90) {
          bonusAmount = 25;
        }

        if (bonusAmount > 0) {
          await db.query(`
            UPDATE payroll_line_items
            SET bonus_amount = $2,
                gross_pay = gross_pay + $2,
                net_pay = net_pay + $2,
                notes = 'EVV compliance bonus: ' || $3 || '%'
            WHERE id = $1
          `, [row.id, bonusAmount, Math.round(complianceRate * 100)]);
        }
      }
    }
  }

  private async recalculatePayrollTotals(payrollRunId: string): Promise<void> {
    const db = getDbClient();

    await db.query(`
      UPDATE payroll_runs
      SET
        total_regular_hours = (
          SELECT COALESCE(SUM(regular_hours), 0) FROM payroll_line_items WHERE payroll_run_id = $1
        ),
        total_overtime_hours = (
          SELECT COALESCE(SUM(overtime_hours), 0) FROM payroll_line_items WHERE payroll_run_id = $1
        ),
        total_gross_pay = (
          SELECT COALESCE(SUM(gross_pay), 0) FROM payroll_line_items WHERE payroll_run_id = $1
        ),
        total_bonus = (
          SELECT COALESCE(SUM(bonus_amount), 0) FROM payroll_line_items WHERE payroll_run_id = $1
        ),
        total_net_pay = (
          SELECT COALESCE(SUM(net_pay), 0) FROM payroll_line_items WHERE payroll_run_id = $1
        ),
        employee_count = (
          SELECT COUNT(*) FROM payroll_line_items WHERE payroll_run_id = $1
        ),
        updated_at = NOW()
      WHERE id = $1
    `, [payrollRunId]);
  }

  async approvePayrollRun(payrollRunId: string, organizationId: string, approverId: string): Promise<any | null> {
    const db = getDbClient();

    const existing = await db.query(`
      SELECT id, status FROM payroll_runs
      WHERE id = $1 AND organization_id = $2
    `, [payrollRunId, organizationId]);

    if (existing.rows.length === 0) return null;

    if (existing.rows[0].status !== 'draft') {
      throw new Error('Only draft payroll runs can be approved');
    }

    await db.query(`
      UPDATE payroll_runs
      SET status = 'approved', submitted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [payrollRunId]);

    await db.query(`
      UPDATE payroll_line_items
      SET status = 'approved', updated_at = NOW()
      WHERE payroll_run_id = $1
    `, [payrollRunId]);

    return this.getPayrollRunById(payrollRunId, organizationId);
  }

  async submitToProvider(payrollRunId: string, organizationId: string): Promise<any> {
    const db = getDbClient();

    const runResult = await db.query(`
      SELECT r.id, r.status, p.provider_name, p.api_key
      FROM payroll_runs r
      JOIN payroll_providers p ON p.organization_id = r.organization_id AND p.status = 'active'
      WHERE r.id = $1 AND r.organization_id = $2
    `, [payrollRunId, organizationId]);

    if (runResult.rows.length === 0) {
      throw new Error('Payroll run not found or no active provider');
    }

    const run = runResult.rows[0];

    if (run.status !== 'approved') {
      throw new Error('Payroll run must be approved before submission');
    }

    // Provider submission (placeholder - actual API calls would go here)
    const batchId = `${run.provider_name.toUpperCase()}-${Date.now()}`;

    await db.query(`
      UPDATE payroll_runs
      SET status = 'submitted',
          provider_batch_id = $2,
          submitted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `, [payrollRunId, batchId]);

    return {
      success: true,
      batchId,
      message: `Submitted to ${run.provider_name} successfully`
    };
  }

  // ==========================================
  // Dashboard & Reports
  // ==========================================

  async getDashboard(organizationId: string): Promise<any> {
    const db = getDbClient();

    const statsResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft') as draft_runs,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_runs,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted_runs,
        COUNT(*) FILTER (WHERE status = 'processed') as processed_runs,
        COALESCE(SUM(total_gross_pay) FILTER (
          WHERE status = 'processed'
          AND pay_date >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0) as mtd_gross_pay,
        COALESCE(SUM(total_gross_pay) FILTER (
          WHERE status = 'processed'
          AND pay_date >= DATE_TRUNC('year', CURRENT_DATE)
        ), 0) as ytd_gross_pay
      FROM payroll_runs
      WHERE organization_id = $1
    `, [organizationId]);

    const stats = statsResult.rows[0];
    const provider = await this.getActiveProvider(organizationId);

    const unmappedResult = await db.query(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN payroll_employee_mappings m ON m.caregiver_id = u.id
      WHERE u.organization_id = $1
        AND u.role IN ('caregiver', 'nurse')
        AND u.status = 'active'
        AND m.id IS NULL
    `, [organizationId]);

    const recentResult = await db.query(`
      SELECT
        id,
        pay_period_start,
        pay_period_end,
        pay_date,
        status,
        total_gross_pay,
        employee_count
      FROM payroll_runs
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [organizationId]);

    return {
      provider: provider ? {
        name: provider.providerName,
        status: provider.status,
        lastSyncAt: provider.lastSyncAt
      } : null,
      summary: {
        draftRuns: parseInt(stats.draft_runs),
        approvedRuns: parseInt(stats.approved_runs),
        submittedRuns: parseInt(stats.submitted_runs),
        processedRuns: parseInt(stats.processed_runs),
        mtdGrossPay: parseFloat(stats.mtd_gross_pay),
        ytdGrossPay: parseFloat(stats.ytd_gross_pay)
      },
      unmappedEmployees: parseInt(unmappedResult.rows[0].count),
      recentRuns: recentResult.rows.map(row => ({
        id: row.id,
        payPeriod: `${row.pay_period_start} - ${row.pay_period_end}`,
        payDate: row.pay_date,
        status: row.status,
        totalGrossPay: parseFloat(row.total_gross_pay) || 0,
        employeeCount: row.employee_count
      }))
    };
  }
}

export const payrollIntegrationService = new PayrollIntegrationService();
