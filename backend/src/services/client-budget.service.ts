/**
 * Client Budget & Funds Management Service
 * Serenity Care Partners
 *
 * Best-in-Class Feature: Real-time visibility into client private-pay
 * or waiver fund balances with automated low-balance alerts
 *
 * @module services/client-budget
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const db = getDbClient();
const logger = createLogger('client-budget-service');

// ============================================================================
// Types
// ============================================================================

export interface ClientBudget {
  id: string;
  clientId: string;
  organizationId: string;
  authorizationId?: string;
  budgetType: 'private_pay' | 'medicaid_waiver' | 'insurance' | 'grant' | 'other';
  fundingSource?: string;
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  effectiveDate: Date;
  expirationDate?: Date;
  renewalDate?: Date;
  hourlyRate?: number;
  totalAuthorizedHours?: number;
  usedHours: number;
  alertThresholdPercent: number;
  alertThresholdAmount?: number;
  status: 'active' | 'low_balance' | 'exhausted' | 'expired' | 'pending';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetTransaction {
  id: string;
  budgetId: string;
  transactionType: 'visit' | 'manual_adjustment' | 'payment' | 'refund' | 'deposit' | 'correction';
  visitId?: string;
  claimId?: string;
  amount: number;
  hoursUsed?: number;
  description: string;
  balanceAfter: number;
  createdBy?: string;
  createdAt: Date;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  alertType: 'low_balance' | 'approaching_limit' | 'expiring_soon' | 'exhausted' | 'needs_renewal';
  message: string;
  thresholdValue?: number;
  currentValue: number;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface BudgetForecast {
  id: string;
  budgetId: string;
  forecastDate: Date;
  projectedBalance: number;
  projectedExhaustionDate?: Date;
  weeklyBurnRate: number;
  weeksRemaining?: number;
  confidence: 'high' | 'medium' | 'low';
  assumptions?: any;
  createdAt: Date;
}

export interface BudgetDashboard {
  totalActiveBudgets: number;
  totalBudgetAmount: number;
  totalUsed: number;
  totalRemaining: number;
  utilizationRate: number;
  lowBalanceCount: number;
  expiringWithin30Days: number;
  exhaustedCount: number;
  averageWeeksRemaining: number;
}

export interface ClientBudgetSummary {
  clientId: string;
  clientName: string;
  budgetCount: number;
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  utilizationPercent: number;
  hasLowBalance: boolean;
  earliestExpiration?: Date;
  weeksRemaining?: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

class ClientBudgetService {
  /**
   * Get budget dashboard summary for the organization
   */
  async getDashboard(organizationId: string): Promise<BudgetDashboard> {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') as total_active,
          COALESCE(SUM(total_budget) FILTER (WHERE status = 'active'), 0) as total_budget,
          COALESCE(SUM(used_amount) FILTER (WHERE status = 'active'), 0) as total_used,
          COALESCE(SUM(remaining_amount) FILTER (WHERE status = 'active'), 0) as total_remaining,
          COUNT(*) FILTER (WHERE status = 'low_balance') as low_balance_count,
          COUNT(*) FILTER (WHERE expiration_date <= NOW() + INTERVAL '30 days' AND status = 'active') as expiring_soon,
          COUNT(*) FILTER (WHERE status = 'exhausted') as exhausted_count
        FROM client_budgets
        WHERE organization_id = $1
      `, [organizationId]);

      const stats = result.rows[0];

      // Calculate average weeks remaining from forecasts
      const forecastResult = await db.query(`
        SELECT AVG(weeks_remaining) as avg_weeks
        FROM budget_forecasts bf
        JOIN client_budgets cb ON cb.id = bf.budget_id
        WHERE cb.organization_id = $1
          AND cb.status = 'active'
          AND bf.created_at = (
            SELECT MAX(created_at) FROM budget_forecasts WHERE budget_id = bf.budget_id
          )
      `, [organizationId]);

      const totalBudget = parseFloat(stats.total_budget) || 0;
      const totalUsed = parseFloat(stats.total_used) || 0;

      return {
        totalActiveBudgets: parseInt(stats.total_active) || 0,
        totalBudgetAmount: totalBudget,
        totalUsed: totalUsed,
        totalRemaining: parseFloat(stats.total_remaining) || 0,
        utilizationRate: totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0,
        lowBalanceCount: parseInt(stats.low_balance_count) || 0,
        expiringWithin30Days: parseInt(stats.expiring_soon) || 0,
        exhaustedCount: parseInt(stats.exhausted_count) || 0,
        averageWeeksRemaining: parseFloat(forecastResult.rows[0]?.avg_weeks) || 0
      };
    } catch (error) {
      logger.error('Failed to get budget dashboard', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get all budgets for the organization
   */
  async getBudgets(organizationId: string, filters?: {
    clientId?: string;
    status?: string;
    budgetType?: string;
    lowBalanceOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ budgets: ClientBudget[]; count: number }> {
    try {
      let query = `
        SELECT cb.*,
          c.first_name || ' ' || c.last_name as client_name
        FROM client_budgets cb
        JOIN clients c ON c.id = cb.client_id
        WHERE cb.organization_id = $1
      `;
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (filters?.clientId) {
        query += ` AND cb.client_id = $${paramIndex++}`;
        params.push(filters.clientId);
      }

      if (filters?.status) {
        query += ` AND cb.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters?.budgetType) {
        query += ` AND cb.budget_type = $${paramIndex++}`;
        params.push(filters.budgetType);
      }

      if (filters?.lowBalanceOnly) {
        query += ` AND cb.status IN ('low_balance', 'exhausted')`;
      }

      // Get count
      const countResult = await db.query(
        `SELECT COUNT(*) FROM (${query}) sub`,
        params
      );

      // Add ordering and pagination
      query += ` ORDER BY cb.status ASC, cb.remaining_amount ASC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return {
        budgets: result.rows.map(this.mapBudgetRow),
        count: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Failed to get budgets', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get budgets for a specific client
   */
  async getClientBudgets(clientId: string): Promise<ClientBudget[]> {
    try {
      const result = await db.query(`
        SELECT * FROM client_budgets
        WHERE client_id = $1
        ORDER BY status ASC, expiration_date ASC
      `, [clientId]);

      return result.rows.map(this.mapBudgetRow);
    } catch (error) {
      logger.error('Failed to get client budgets', { error, clientId });
      throw error;
    }
  }

  /**
   * Get a single budget by ID
   */
  async getBudgetById(budgetId: string): Promise<ClientBudget | null> {
    try {
      const result = await db.query(`
        SELECT * FROM client_budgets WHERE id = $1
      `, [budgetId]);

      return result.rows.length > 0 ? this.mapBudgetRow(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to get budget', { error, budgetId });
      throw error;
    }
  }

  /**
   * Create a new client budget
   */
  async createBudget(data: {
    clientId: string;
    organizationId: string;
    authorizationId?: string;
    budgetType: string;
    fundingSource?: string;
    totalBudget: number;
    effectiveDate: Date;
    expirationDate?: Date;
    renewalDate?: Date;
    hourlyRate?: number;
    totalAuthorizedHours?: number;
    alertThresholdPercent?: number;
    alertThresholdAmount?: number;
    notes?: string;
  }): Promise<ClientBudget> {
    try {
      const result = await db.query(`
        INSERT INTO client_budgets (
          client_id, organization_id, authorization_id, budget_type, funding_source,
          total_budget, remaining_amount, effective_date, expiration_date, renewal_date,
          hourly_rate, total_authorized_hours, alert_threshold_percent, alert_threshold_amount,
          notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active')
        RETURNING *
      `, [
        data.clientId,
        data.organizationId,
        data.authorizationId,
        data.budgetType,
        data.fundingSource,
        data.totalBudget,
        data.effectiveDate,
        data.expirationDate,
        data.renewalDate,
        data.hourlyRate,
        data.totalAuthorizedHours,
        data.alertThresholdPercent || 20,
        data.alertThresholdAmount,
        data.notes
      ]);

      logger.info('Client budget created', { budgetId: result.rows[0].id, clientId: data.clientId });

      return this.mapBudgetRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create budget', { error, data });
      throw error;
    }
  }

  /**
   * Update a client budget
   */
  async updateBudget(budgetId: string, updates: Partial<ClientBudget>): Promise<ClientBudget> {
    try {
      const result = await db.query(`
        UPDATE client_budgets SET
          total_budget = COALESCE($2, total_budget),
          expiration_date = COALESCE($3, expiration_date),
          renewal_date = COALESCE($4, renewal_date),
          hourly_rate = COALESCE($5, hourly_rate),
          total_authorized_hours = COALESCE($6, total_authorized_hours),
          alert_threshold_percent = COALESCE($7, alert_threshold_percent),
          alert_threshold_amount = COALESCE($8, alert_threshold_amount),
          notes = COALESCE($9, notes),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        budgetId,
        updates.totalBudget,
        updates.expirationDate,
        updates.renewalDate,
        updates.hourlyRate,
        updates.totalAuthorizedHours,
        updates.alertThresholdPercent,
        updates.alertThresholdAmount,
        updates.notes
      ]);

      // Recalculate remaining amount
      await this.recalculateBudget(budgetId);

      return this.mapBudgetRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update budget', { error, budgetId });
      throw error;
    }
  }

  /**
   * Record a transaction against a budget
   */
  async recordTransaction(data: {
    budgetId: string;
    transactionType: string;
    amount: number;
    hoursUsed?: number;
    description: string;
    visitId?: string;
    claimId?: string;
    createdBy?: string;
  }): Promise<BudgetTransaction> {
    try {
      // Get current budget
      const budget = await this.getBudgetById(data.budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const balanceAfter = budget.remainingAmount - data.amount;

      const result = await db.query(`
        INSERT INTO budget_transactions (
          budget_id, transaction_type, amount, hours_used, description,
          visit_id, claim_id, balance_after, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        data.budgetId,
        data.transactionType,
        data.amount,
        data.hoursUsed,
        data.description,
        data.visitId,
        data.claimId,
        balanceAfter,
        data.createdBy
      ]);

      // Update the budget balance
      await this.recalculateBudget(data.budgetId);

      logger.info('Budget transaction recorded', {
        transactionId: result.rows[0].id,
        budgetId: data.budgetId,
        amount: data.amount
      });

      return this.mapTransactionRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to record transaction', { error, data });
      throw error;
    }
  }

  /**
   * Get transactions for a budget
   */
  async getTransactions(budgetId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<BudgetTransaction[]> {
    try {
      let query = `
        SELECT bt.*,
          v.visit_date,
          c.first_name || ' ' || c.last_name as caregiver_name
        FROM budget_transactions bt
        LEFT JOIN visits v ON v.id = bt.visit_id
        LEFT JOIN caregivers cg ON cg.id = v.caregiver_id
        LEFT JOIN users c ON c.id = cg.id
        WHERE bt.budget_id = $1
      `;
      const params: any[] = [budgetId];
      let paramIndex = 2;

      if (filters?.startDate) {
        query += ` AND bt.created_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters?.endDate) {
        query += ` AND bt.created_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY bt.created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows.map(this.mapTransactionRow);
    } catch (error) {
      logger.error('Failed to get transactions', { error, budgetId });
      throw error;
    }
  }

  /**
   * Get active alerts for the organization
   */
  async getAlerts(organizationId: string, filters?: {
    budgetId?: string;
    alertType?: string;
    unacknowledgedOnly?: boolean;
  }): Promise<BudgetAlert[]> {
    try {
      let query = `
        SELECT ba.*,
          cb.client_id,
          c.first_name || ' ' || c.last_name as client_name
        FROM budget_alerts ba
        JOIN client_budgets cb ON cb.id = ba.budget_id
        JOIN clients c ON c.id = cb.client_id
        WHERE cb.organization_id = $1
      `;
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (filters?.budgetId) {
        query += ` AND ba.budget_id = $${paramIndex++}`;
        params.push(filters.budgetId);
      }

      if (filters?.alertType) {
        query += ` AND ba.alert_type = $${paramIndex++}`;
        params.push(filters.alertType);
      }

      if (filters?.unacknowledgedOnly) {
        query += ` AND ba.is_acknowledged = FALSE`;
      }

      query += ` ORDER BY ba.created_at DESC`;

      const result = await db.query(query, params);

      return result.rows.map(this.mapAlertRow);
    } catch (error) {
      logger.error('Failed to get alerts', { error, organizationId });
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      await db.query(`
        UPDATE budget_alerts SET
          is_acknowledged = TRUE,
          acknowledged_by = $2,
          acknowledged_at = NOW()
        WHERE id = $1
      `, [alertId, userId]);

      logger.info('Budget alert acknowledged', { alertId, userId });
    } catch (error) {
      logger.error('Failed to acknowledge alert', { error, alertId });
      throw error;
    }
  }

  /**
   * Get budget forecast
   */
  async getForecast(budgetId: string): Promise<BudgetForecast | null> {
    try {
      const result = await db.query(`
        SELECT * FROM budget_forecasts
        WHERE budget_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [budgetId]);

      return result.rows.length > 0 ? this.mapForecastRow(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to get forecast', { error, budgetId });
      throw error;
    }
  }

  /**
   * Generate a new forecast for a budget
   */
  async generateForecast(budgetId: string): Promise<BudgetForecast> {
    try {
      const budget = await this.getBudgetById(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      // Calculate weekly burn rate from last 4 weeks
      const burnResult = await db.query(`
        SELECT
          COALESCE(SUM(amount), 0) as total_spend,
          COUNT(DISTINCT DATE_TRUNC('week', created_at)) as weeks
        FROM budget_transactions
        WHERE budget_id = $1
          AND transaction_type IN ('visit', 'manual_adjustment')
          AND amount > 0
          AND created_at >= NOW() - INTERVAL '4 weeks'
      `, [budgetId]);

      const totalSpend = parseFloat(burnResult.rows[0].total_spend) || 0;
      const weeks = parseInt(burnResult.rows[0].weeks) || 1;
      const weeklyBurnRate = totalSpend / Math.max(weeks, 1);

      // Calculate weeks remaining
      const weeksRemaining = weeklyBurnRate > 0
        ? Math.floor(budget.remainingAmount / weeklyBurnRate)
        : null;

      // Calculate projected exhaustion date
      const projectedExhaustionDate = weeksRemaining !== null
        ? new Date(Date.now() + weeksRemaining * 7 * 24 * 60 * 60 * 1000)
        : null;

      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low';
      if (weeks >= 4) {
        confidence = 'high';
      } else if (weeks >= 2) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      // Insert forecast
      const result = await db.query(`
        INSERT INTO budget_forecasts (
          budget_id, forecast_date, projected_balance, projected_exhaustion_date,
          weekly_burn_rate, weeks_remaining, confidence, assumptions
        ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        budgetId,
        budget.remainingAmount,
        projectedExhaustionDate,
        weeklyBurnRate,
        weeksRemaining,
        confidence,
        JSON.stringify({
          weeksAnalyzed: weeks,
          totalSpendAnalyzed: totalSpend,
          generatedAt: new Date().toISOString()
        })
      ]);

      logger.info('Budget forecast generated', {
        budgetId,
        weeklyBurnRate,
        weeksRemaining,
        confidence
      });

      return this.mapForecastRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to generate forecast', { error, budgetId });
      throw error;
    }
  }

  /**
   * Get client budget summaries for the organization
   */
  async getClientSummaries(organizationId: string): Promise<ClientBudgetSummary[]> {
    try {
      const result = await db.query(`
        SELECT
          c.id as client_id,
          c.first_name || ' ' || c.last_name as client_name,
          COUNT(cb.id) as budget_count,
          COALESCE(SUM(cb.total_budget), 0) as total_budget,
          COALESCE(SUM(cb.used_amount), 0) as total_used,
          COALESCE(SUM(cb.remaining_amount), 0) as total_remaining,
          BOOL_OR(cb.status IN ('low_balance', 'exhausted')) as has_low_balance,
          MIN(cb.expiration_date) FILTER (WHERE cb.status = 'active') as earliest_expiration,
          MIN(bf.weeks_remaining) as weeks_remaining
        FROM clients c
        LEFT JOIN client_budgets cb ON cb.client_id = c.id AND cb.status IN ('active', 'low_balance')
        LEFT JOIN budget_forecasts bf ON bf.budget_id = cb.id
          AND bf.created_at = (SELECT MAX(created_at) FROM budget_forecasts WHERE budget_id = cb.id)
        WHERE c.organization_id = $1
          AND cb.id IS NOT NULL
        GROUP BY c.id, c.first_name, c.last_name
        ORDER BY has_low_balance DESC, total_remaining ASC
      `, [organizationId]);

      return result.rows.map(row => ({
        clientId: row.client_id,
        clientName: row.client_name,
        budgetCount: parseInt(row.budget_count) || 0,
        totalBudget: parseFloat(row.total_budget) || 0,
        totalUsed: parseFloat(row.total_used) || 0,
        totalRemaining: parseFloat(row.total_remaining) || 0,
        utilizationPercent: row.total_budget > 0
          ? Math.round((row.total_used / row.total_budget) * 100)
          : 0,
        hasLowBalance: row.has_low_balance || false,
        earliestExpiration: row.earliest_expiration ? new Date(row.earliest_expiration) : undefined,
        weeksRemaining: row.weeks_remaining ? parseFloat(row.weeks_remaining) : undefined
      }));
    } catch (error) {
      logger.error('Failed to get client summaries', { error, organizationId });
      throw error;
    }
  }

  /**
   * Add funds to a budget (payment/deposit)
   */
  async addFunds(budgetId: string, amount: number, description: string, userId?: string): Promise<BudgetTransaction> {
    return this.recordTransaction({
      budgetId,
      transactionType: 'deposit',
      amount: -amount, // Negative to increase balance
      description,
      createdBy: userId
    });
  }

  /**
   * Check and create alerts for budgets needing attention
   */
  async checkAlerts(organizationId: string): Promise<number> {
    try {
      // Call the database function to check alerts
      const result = await db.query(`
        SELECT check_budget_alerts($1) as alerts_created
      `, [organizationId]);

      return parseInt(result.rows[0]?.alerts_created) || 0;
    } catch (error) {
      logger.error('Failed to check budget alerts', { error, organizationId });
      throw error;
    }
  }

  /**
   * Recalculate budget used/remaining amounts
   */
  private async recalculateBudget(budgetId: string): Promise<void> {
    await db.query(`
      UPDATE client_budgets cb SET
        used_amount = COALESCE((
          SELECT SUM(amount)
          FROM budget_transactions
          WHERE budget_id = cb.id
            AND amount > 0
        ), 0),
        used_hours = COALESCE((
          SELECT SUM(hours_used)
          FROM budget_transactions
          WHERE budget_id = cb.id
            AND hours_used > 0
        ), 0),
        remaining_amount = total_budget - COALESCE((
          SELECT SUM(amount)
          FROM budget_transactions
          WHERE budget_id = cb.id
            AND amount > 0
        ), 0),
        status = CASE
          WHEN remaining_amount <= 0 THEN 'exhausted'
          WHEN remaining_amount <= total_budget * (alert_threshold_percent / 100.0) THEN 'low_balance'
          WHEN expiration_date < NOW() THEN 'expired'
          ELSE 'active'
        END,
        updated_at = NOW()
      WHERE id = $1
    `, [budgetId]);
  }

  // ============================================================================
  // Row Mappers
  // ============================================================================

  private mapBudgetRow(row: any): ClientBudget {
    return {
      id: row.id,
      clientId: row.client_id,
      organizationId: row.organization_id,
      authorizationId: row.authorization_id,
      budgetType: row.budget_type,
      fundingSource: row.funding_source,
      totalBudget: parseFloat(row.total_budget) || 0,
      usedAmount: parseFloat(row.used_amount) || 0,
      remainingAmount: parseFloat(row.remaining_amount) || 0,
      effectiveDate: new Date(row.effective_date),
      expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
      renewalDate: row.renewal_date ? new Date(row.renewal_date) : undefined,
      hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : undefined,
      totalAuthorizedHours: row.total_authorized_hours ? parseFloat(row.total_authorized_hours) : undefined,
      usedHours: parseFloat(row.used_hours) || 0,
      alertThresholdPercent: parseFloat(row.alert_threshold_percent) || 20,
      alertThresholdAmount: row.alert_threshold_amount ? parseFloat(row.alert_threshold_amount) : undefined,
      status: row.status,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapTransactionRow(row: any): BudgetTransaction {
    return {
      id: row.id,
      budgetId: row.budget_id,
      transactionType: row.transaction_type,
      visitId: row.visit_id,
      claimId: row.claim_id,
      amount: parseFloat(row.amount) || 0,
      hoursUsed: row.hours_used ? parseFloat(row.hours_used) : undefined,
      description: row.description,
      balanceAfter: parseFloat(row.balance_after) || 0,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at)
    };
  }

  private mapAlertRow(row: any): BudgetAlert {
    return {
      id: row.id,
      budgetId: row.budget_id,
      alertType: row.alert_type,
      message: row.message,
      thresholdValue: row.threshold_value ? parseFloat(row.threshold_value) : undefined,
      currentValue: parseFloat(row.current_value) || 0,
      isAcknowledged: row.is_acknowledged,
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      createdAt: new Date(row.created_at)
    };
  }

  private mapForecastRow(row: any): BudgetForecast {
    return {
      id: row.id,
      budgetId: row.budget_id,
      forecastDate: new Date(row.forecast_date),
      projectedBalance: parseFloat(row.projected_balance) || 0,
      projectedExhaustionDate: row.projected_exhaustion_date ? new Date(row.projected_exhaustion_date) : undefined,
      weeklyBurnRate: parseFloat(row.weekly_burn_rate) || 0,
      weeksRemaining: row.weeks_remaining ? parseFloat(row.weeks_remaining) : undefined,
      confidence: row.confidence,
      assumptions: row.assumptions,
      createdAt: new Date(row.created_at)
    };
  }
}

// Export singleton instance
export default new ClientBudgetService();
