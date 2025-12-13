/**
 * Authorization Service
 * Manages client service authorizations, utilization tracking, and renewals
 *
 * @module services/authorization
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('authorization-service');

export interface Authorization {
  id: string;
  clientId: string;
  payerId: string;
  organizationId: string;
  authorizationNumber: string;
  serviceCode: string;
  description?: string;
  unitsApproved: number;
  unitsUsed: number;
  unitsRemaining: number;
  utilizationPercent: number;
  startDate: string;
  endDate: string;
  daysUntilExpiry: number;
  status: 'active' | 'expired' | 'pending' | 'exhausted';
  frequencyLimit?: string;
  frequencyType?: 'daily' | 'weekly' | 'monthly' | 'per_auth';
  maxUnitsPerFrequency?: number;
  unitType: '15min' | 'hourly' | 'visit' | 'day';
  priorAuthRequired: boolean;
  diagnosisCodes?: string[];
  notes?: string;
  renewalStatus?: 'not_needed' | 'pending' | 'submitted' | 'approved' | 'denied';
  healthStatus: 'healthy' | 'units_low' | 'expiring_soon' | 'expired' | 'exhausted';
  clientName?: string;
  payerName?: string;
}

export interface AuthorizationAlert {
  id: string;
  authorizationNumber: string;
  clientId: string;
  clientName: string;
  payerId: string;
  payerName: string;
  serviceCode: string;
  endDate: string;
  daysRemaining: number;
  unitsApproved: number;
  unitsRemaining: number;
  alertType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  renewalStatus?: string;
}

export interface AuthorizationUsage {
  id: string;
  authorizationId: string;
  visitId?: string;
  usageDate: string;
  unitsUsed: number;
  billingCode?: string;
  notes?: string;
}

export interface RenewalRequest {
  id: string;
  originalAuthorizationId: string;
  newAuthorizationId?: string;
  organizationId: string;
  requestedUnits: number;
  requestedStartDate: string;
  requestedEndDate: string;
  clinicalJustification?: string;
  supportingDocuments?: string[];
  submittedAt?: string;
  submittedBy?: string;
  payerReferenceNumber?: string;
  status: 'draft' | 'submitted' | 'approved' | 'denied' | 'partial' | 'pending_info';
  approvedUnits?: number;
  approvedStartDate?: string;
  approvedEndDate?: string;
  denialReason?: string;
  respondedAt?: string;
  appealDeadline?: string;
  appealSubmitted: boolean;
}

class AuthorizationService {
  /**
   * Get all authorizations for a client
   */
  async getClientAuthorizations(
    clientId: string,
    organizationId: string,
    options: {
      status?: string;
      includeExpired?: boolean;
    } = {}
  ): Promise<Authorization[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM authorization_status
      WHERE client_id = $1 AND organization_id = $2
    `;
    const params: any[] = [clientId, organizationId];

    if (options.status) {
      query += ` AND status = $3`;
      params.push(options.status);
    } else if (!options.includeExpired) {
      query += ` AND status != 'expired'`;
    }

    query += ` ORDER BY end_date ASC`;

    const result = await db.query(query, params);

    return result.rows.map(this.mapAuthorizationRow);
  }

  /**
   * Get authorization by ID
   */
  async getAuthorizationById(
    authorizationId: string,
    organizationId: string
  ): Promise<Authorization | null> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM authorization_status
       WHERE id = $1 AND organization_id = $2`,
      [authorizationId, organizationId]
    );

    if (result.rows.length === 0) return null;

    return this.mapAuthorizationRow(result.rows[0]);
  }

  /**
   * Create a new authorization
   */
  async createAuthorization(
    organizationId: string,
    data: {
      clientId: string;
      payerId: string;
      authorizationNumber?: string;
      serviceCode: string;
      description?: string;
      unitsApproved: number;
      startDate: string;
      endDate: string;
      frequencyLimit?: string;
      frequencyType?: string;
      maxUnitsPerFrequency?: number;
      unitType?: string;
      priorAuthRequired?: boolean;
      diagnosisCodes?: string[];
      notes?: string;
    }
  ): Promise<Authorization> {
    const db = await getDbClient();

    const result = await db.query(
      `INSERT INTO authorizations (
        organization_id, client_id, payer_id, authorization_number,
        service_code, description, units_approved, start_date, end_date,
        frequency_limit, frequency_type, max_units_per_frequency,
        unit_type, prior_auth_required, diagnosis_codes, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active')
      RETURNING id`,
      [
        organizationId,
        data.clientId,
        data.payerId,
        data.authorizationNumber,
        data.serviceCode,
        data.description,
        data.unitsApproved,
        data.startDate,
        data.endDate,
        data.frequencyLimit,
        data.frequencyType,
        data.maxUnitsPerFrequency,
        data.unitType || '15min',
        data.priorAuthRequired || false,
        data.diagnosisCodes,
        data.notes,
      ]
    );

    logger.info('Authorization created', {
      authorizationId: result.rows[0].id,
      clientId: data.clientId,
      serviceCode: data.serviceCode,
    });

    return this.getAuthorizationById(result.rows[0].id, organizationId) as Promise<Authorization>;
  }

  /**
   * Update an authorization
   */
  async updateAuthorization(
    authorizationId: string,
    organizationId: string,
    data: Partial<{
      authorizationNumber: string;
      description: string;
      unitsApproved: number;
      startDate: string;
      endDate: string;
      status: string;
      frequencyLimit: string;
      frequencyType: string;
      maxUnitsPerFrequency: number;
      priorAuthRequired: boolean;
      diagnosisCodes: string[];
      notes: string;
      renewalStatus: string;
    }>
  ): Promise<Authorization | null> {
    const db = await getDbClient();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(authorizationId, organizationId);

    await db.query(
      `UPDATE authorizations SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}`,
      values
    );

    logger.info('Authorization updated', { authorizationId });

    return this.getAuthorizationById(authorizationId, organizationId);
  }

  /**
   * Record authorization usage
   */
  async recordUsage(
    authorizationId: string,
    organizationId: string,
    usage: {
      visitId?: string;
      usageDate: string;
      unitsUsed: number;
      billingCode?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string; remainingUnits: number }> {
    const db = await getDbClient();

    // Check authorization validity first
    const validityCheck = await db.query(
      `SELECT * FROM check_authorization_validity($1, $2::DATE, $3)`,
      [authorizationId, usage.usageDate, usage.unitsUsed]
    );

    const validity = validityCheck.rows[0];
    if (!validity.is_valid) {
      return {
        success: false,
        message: validity.reason,
        remainingUnits: validity.remaining_units,
      };
    }

    // Record the usage
    await db.query(
      `INSERT INTO authorization_usage (
        authorization_id, visit_id, usage_date, units_used, billing_code, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        authorizationId,
        usage.visitId,
        usage.usageDate,
        usage.unitsUsed,
        usage.billingCode,
        usage.notes,
      ]
    );

    // Also update the legacy units_used column
    await db.query(
      `UPDATE authorizations
       SET units_used = units_used + $1, updated_at = NOW()
       WHERE id = $2`,
      [usage.unitsUsed, authorizationId]
    );

    logger.info('Authorization usage recorded', {
      authorizationId,
      unitsUsed: usage.unitsUsed,
      visitId: usage.visitId,
    });

    return {
      success: true,
      message: 'Usage recorded',
      remainingUnits: validity.remaining_units - usage.unitsUsed,
    };
  }

  /**
   * Get usage history for an authorization
   */
  async getUsageHistory(
    authorizationId: string,
    organizationId: string
  ): Promise<AuthorizationUsage[]> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT au.* FROM authorization_usage au
       JOIN authorizations a ON a.id = au.authorization_id
       WHERE au.authorization_id = $1 AND a.organization_id = $2
       ORDER BY au.usage_date DESC`,
      [authorizationId, organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      authorizationId: row.authorization_id,
      visitId: row.visit_id,
      usageDate: row.usage_date,
      unitsUsed: row.units_used,
      billingCode: row.billing_code,
      notes: row.notes,
    }));
  }

  /**
   * Get authorization alerts dashboard
   */
  async getAlertsDashboard(
    organizationId: string,
    options: {
      severity?: string;
      clientId?: string;
      payerId?: string;
    } = {}
  ): Promise<AuthorizationAlert[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM authorization_alerts_dashboard
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (options.severity) {
      query += ` AND severity = $2`;
      params.push(options.severity);
    }
    if (options.clientId) {
      query += ` AND client_id = $${params.length + 1}`;
      params.push(options.clientId);
    }
    if (options.payerId) {
      query += ` AND payer_id = $${params.length + 1}`;
      params.push(options.payerId);
    }

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      authorizationNumber: row.authorization_number,
      clientId: row.client_id,
      clientName: row.client_name,
      payerId: row.payer_id,
      payerName: row.payer_name,
      serviceCode: row.service_code,
      endDate: row.end_date,
      daysRemaining: row.days_remaining,
      unitsApproved: row.units_approved,
      unitsRemaining: row.units_remaining,
      alertType: row.alert_type,
      severity: row.severity,
      renewalStatus: row.renewal_status,
    }));
  }

  /**
   * Get authorization summary statistics
   */
  async getAuthorizationStats(organizationId: string): Promise<{
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    exhausted: number;
    lowUnits: number;
    needsRenewal: number;
    averageUtilization: number;
  }> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE health_status = 'expiring_soon') AS expiring_soon,
        COUNT(*) FILTER (WHERE status = 'expired' OR health_status = 'expired') AS expired,
        COUNT(*) FILTER (WHERE status = 'exhausted' OR health_status = 'exhausted') AS exhausted,
        COUNT(*) FILTER (WHERE health_status = 'units_low') AS low_units,
        COUNT(*) FILTER (WHERE renewal_status IN ('pending', 'submitted')) AS needs_renewal,
        ROUND(AVG(utilization_percent), 1) AS avg_utilization
      FROM authorization_status
      WHERE organization_id = $1`,
      [organizationId]
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total) || 0,
      active: parseInt(row.active) || 0,
      expiringSoon: parseInt(row.expiring_soon) || 0,
      expired: parseInt(row.expired) || 0,
      exhausted: parseInt(row.exhausted) || 0,
      lowUnits: parseInt(row.low_units) || 0,
      needsRenewal: parseInt(row.needs_renewal) || 0,
      averageUtilization: parseFloat(row.avg_utilization) || 0,
    };
  }

  /**
   * Create a renewal request
   */
  async createRenewalRequest(
    organizationId: string,
    data: {
      originalAuthorizationId: string;
      requestedUnits: number;
      requestedStartDate: string;
      requestedEndDate: string;
      clinicalJustification?: string;
      supportingDocuments?: string[];
    }
  ): Promise<RenewalRequest> {
    const db = await getDbClient();

    const result = await db.query(
      `INSERT INTO authorization_renewals (
        organization_id, original_authorization_id,
        requested_units, requested_start_date, requested_end_date,
        clinical_justification, supporting_documents, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
      RETURNING *`,
      [
        organizationId,
        data.originalAuthorizationId,
        data.requestedUnits,
        data.requestedStartDate,
        data.requestedEndDate,
        data.clinicalJustification,
        data.supportingDocuments,
      ]
    );

    // Update the authorization renewal status
    await db.query(
      `UPDATE authorizations SET renewal_status = 'pending', updated_at = NOW()
       WHERE id = $1`,
      [data.originalAuthorizationId]
    );

    logger.info('Renewal request created', {
      renewalId: result.rows[0].id,
      originalAuthId: data.originalAuthorizationId,
    });

    return this.mapRenewalRow(result.rows[0]);
  }

  /**
   * Submit a renewal request to the payer
   */
  async submitRenewalRequest(
    renewalId: string,
    organizationId: string,
    submittedBy: string,
    payerReferenceNumber?: string
  ): Promise<RenewalRequest> {
    const db = await getDbClient();

    const result = await db.query(
      `UPDATE authorization_renewals
       SET status = 'submitted',
           submitted_at = NOW(),
           submitted_by = $3,
           payer_reference_number = $4,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [renewalId, organizationId, submittedBy, payerReferenceNumber]
    );

    if (result.rows.length === 0) {
      throw new Error('Renewal request not found');
    }

    // Update original authorization
    await db.query(
      `UPDATE authorizations SET renewal_status = 'submitted', updated_at = NOW()
       WHERE id = $1`,
      [result.rows[0].original_authorization_id]
    );

    logger.info('Renewal request submitted', { renewalId });

    return this.mapRenewalRow(result.rows[0]);
  }

  /**
   * Process renewal response from payer
   */
  async processRenewalResponse(
    renewalId: string,
    organizationId: string,
    response: {
      status: 'approved' | 'denied' | 'partial' | 'pending_info';
      approvedUnits?: number;
      approvedStartDate?: string;
      approvedEndDate?: string;
      denialReason?: string;
      appealDeadline?: string;
    }
  ): Promise<RenewalRequest> {
    const db = await getDbClient();

    const result = await db.query(
      `UPDATE authorization_renewals
       SET status = $3,
           approved_units = $4,
           approved_start_date = $5,
           approved_end_date = $6,
           denial_reason = $7,
           appeal_deadline = $8,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [
        renewalId,
        organizationId,
        response.status,
        response.approvedUnits,
        response.approvedStartDate,
        response.approvedEndDate,
        response.denialReason,
        response.appealDeadline,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Renewal request not found');
    }

    const renewal = result.rows[0];

    // Update original authorization status
    await db.query(
      `UPDATE authorizations SET renewal_status = $2, updated_at = NOW()
       WHERE id = $1`,
      [renewal.original_authorization_id, response.status]
    );

    // If approved, create the new authorization
    if (response.status === 'approved' || response.status === 'partial') {
      const origAuth = await db.query(
        `SELECT * FROM authorizations WHERE id = $1`,
        [renewal.original_authorization_id]
      );

      if (origAuth.rows.length > 0) {
        const orig = origAuth.rows[0];
        const newAuth = await db.query(
          `INSERT INTO authorizations (
            organization_id, client_id, payer_id, authorization_number,
            service_code, description, units_approved, start_date, end_date,
            frequency_limit, frequency_type, max_units_per_frequency,
            unit_type, prior_auth_required, diagnosis_codes, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active')
          RETURNING id`,
          [
            orig.organization_id,
            orig.client_id,
            orig.payer_id,
            renewal.payer_reference_number, // New auth number
            orig.service_code,
            orig.description,
            response.approvedUnits || renewal.requested_units,
            response.approvedStartDate || renewal.requested_start_date,
            response.approvedEndDate || renewal.requested_end_date,
            orig.frequency_limit,
            orig.frequency_type,
            orig.max_units_per_frequency,
            orig.unit_type,
            orig.prior_auth_required,
            orig.diagnosis_codes,
          ]
        );

        // Link the new authorization to the renewal
        await db.query(
          `UPDATE authorization_renewals SET new_authorization_id = $1 WHERE id = $2`,
          [newAuth.rows[0].id, renewalId]
        );

        logger.info('New authorization created from renewal', {
          renewalId,
          newAuthId: newAuth.rows[0].id,
        });
      }
    }

    logger.info('Renewal response processed', { renewalId, status: response.status });

    return this.mapRenewalRow(result.rows[0]);
  }

  /**
   * Get renewal requests for an organization
   */
  async getRenewalRequests(
    organizationId: string,
    options: {
      status?: string;
      clientId?: string;
    } = {}
  ): Promise<RenewalRequest[]> {
    const db = await getDbClient();

    let query = `
      SELECT ar.*, a.client_id, c.first_name, c.last_name
      FROM authorization_renewals ar
      JOIN authorizations a ON a.id = ar.original_authorization_id
      JOIN clients c ON c.id = a.client_id
      WHERE ar.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (options.status) {
      query += ` AND ar.status = $2`;
      params.push(options.status);
    }
    if (options.clientId) {
      query += ` AND a.client_id = $${params.length + 1}`;
      params.push(options.clientId);
    }

    query += ` ORDER BY ar.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(this.mapRenewalRow);
  }

  /**
   * Check authorization for scheduling/billing
   */
  async validateForService(
    clientId: string,
    organizationId: string,
    serviceCode: string,
    serviceDate: string,
    unitsNeeded: number
  ): Promise<{
    valid: boolean;
    authorization?: Authorization;
    message: string;
  }> {
    const db = await getDbClient();

    // Find active authorization for this service
    const authResult = await db.query(
      `SELECT * FROM authorization_status
       WHERE client_id = $1
         AND organization_id = $2
         AND service_code = $3
         AND status = 'active'
         AND start_date <= $4::DATE
         AND end_date >= $4::DATE
       ORDER BY end_date ASC
       LIMIT 1`,
      [clientId, organizationId, serviceCode, serviceDate]
    );

    if (authResult.rows.length === 0) {
      return {
        valid: false,
        message: `No active authorization found for service code ${serviceCode} on ${serviceDate}`,
      };
    }

    const auth = this.mapAuthorizationRow(authResult.rows[0]);

    if (auth.unitsRemaining < unitsNeeded) {
      return {
        valid: false,
        authorization: auth,
        message: `Insufficient units: ${auth.unitsRemaining} remaining, ${unitsNeeded} needed`,
      };
    }

    return {
      valid: true,
      authorization: auth,
      message: 'Authorization valid',
    };
  }

  /**
   * Run expiration check and update statuses
   */
  async runExpirationCheck(): Promise<{ expired: number }> {
    const db = await getDbClient();

    const result = await db.query(`
      UPDATE authorizations
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'active' AND end_date < CURRENT_DATE
      RETURNING id
    `);

    logger.info('Expiration check completed', { expired: result.rowCount });

    return { expired: result.rowCount || 0 };
  }

  private mapAuthorizationRow(row: any): Authorization {
    return {
      id: row.id,
      clientId: row.client_id,
      payerId: row.payer_id,
      organizationId: row.organization_id,
      authorizationNumber: row.authorization_number,
      serviceCode: row.service_code,
      description: row.description,
      unitsApproved: row.units_approved,
      unitsUsed: row.units_used,
      unitsRemaining: row.units_remaining,
      utilizationPercent: parseFloat(row.utilization_percent) || 0,
      startDate: row.start_date,
      endDate: row.end_date,
      daysUntilExpiry: row.days_until_expiry,
      status: row.status,
      frequencyLimit: row.frequency_limit,
      frequencyType: row.frequency_type,
      maxUnitsPerFrequency: row.max_units_per_frequency,
      unitType: row.unit_type || '15min',
      priorAuthRequired: row.prior_auth_required,
      diagnosisCodes: row.diagnosis_codes,
      notes: row.notes,
      renewalStatus: row.renewal_status,
      healthStatus: row.health_status,
      clientName: row.client_name,
      payerName: row.payer_name,
    };
  }

  private mapRenewalRow(row: any): RenewalRequest {
    return {
      id: row.id,
      originalAuthorizationId: row.original_authorization_id,
      newAuthorizationId: row.new_authorization_id,
      organizationId: row.organization_id,
      requestedUnits: row.requested_units,
      requestedStartDate: row.requested_start_date,
      requestedEndDate: row.requested_end_date,
      clinicalJustification: row.clinical_justification,
      supportingDocuments: row.supporting_documents,
      submittedAt: row.submitted_at,
      submittedBy: row.submitted_by,
      payerReferenceNumber: row.payer_reference_number,
      status: row.status,
      approvedUnits: row.approved_units,
      approvedStartDate: row.approved_start_date,
      approvedEndDate: row.approved_end_date,
      denialReason: row.denial_reason,
      respondedAt: row.responded_at,
      appealDeadline: row.appeal_deadline,
      appealSubmitted: row.appeal_submitted,
    };
  }
}

export const authorizationService = new AuthorizationService();
