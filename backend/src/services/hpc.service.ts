import { getDbClient } from '../database/client';

interface CreateHpcAuthorizationData {
  clientId: string;
  serviceCodeId: string;
  ispNumber?: string;
  ispStartDate: string;
  ispEndDate: string;
  unitsAuthorized: number;
  unitsPeriod: 'weekly' | 'monthly' | 'yearly' | 'isp_period';
  priorAuthNumber?: string;
  notes?: string;
}

interface UpdateHpcAuthorizationData {
  serviceCodeId?: string;
  ispNumber?: string;
  ispStartDate?: string;
  ispEndDate?: string;
  unitsAuthorized?: number;
  unitsPeriod?: 'weekly' | 'monthly' | 'yearly' | 'isp_period';
  priorAuthNumber?: string;
  status?: 'active' | 'suspended' | 'expired' | 'terminated';
  notes?: string;
}

interface AuthorizationFilters {
  clientId?: string;
  serviceCode?: string;
  status?: string;
  expiringWithinDays?: number;
}

interface UsageData {
  authorizationId: string;
  visitId: string;
  unitsUsed: number;
  serviceDate: string;
}

export class HpcService {
  // ==========================================
  // HPC Service Code Management
  // ==========================================

  async getServiceCodes(organizationId: string, activeOnly: boolean = true): Promise<any[]> {
    const db = getDbClient();

    let query = `
      SELECT
        id,
        service_code,
        service_name,
        service_category,
        unit_type,
        unit_minutes,
        rate_standard,
        rate_enhanced,
        rate_intensive,
        modifier_codes,
        requires_prior_auth,
        requires_isp,
        requires_dodd_eligible_caregiver,
        billing_notes,
        effective_date,
        end_date,
        is_active,
        created_at
      FROM hpc_service_codes
      WHERE 1=1
    `;

    if (activeOnly) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY service_category, service_code`;

    const result = await db.query(query);

    return result.rows.map(row => ({
      id: row.id,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      serviceCategory: row.service_category,
      unitType: row.unit_type,
      unitMinutes: row.unit_minutes,
      rates: {
        standard: parseFloat(row.rate_standard),
        enhanced: row.rate_enhanced ? parseFloat(row.rate_enhanced) : null,
        intensive: row.rate_intensive ? parseFloat(row.rate_intensive) : null
      },
      modifierCodes: row.modifier_codes,
      requiresPriorAuth: row.requires_prior_auth,
      requiresIsp: row.requires_isp,
      requiresDoddEligibleCaregiver: row.requires_dodd_eligible_caregiver,
      billingNotes: row.billing_notes,
      effectiveDate: row.effective_date,
      endDate: row.end_date,
      isActive: row.is_active,
      createdAt: row.created_at
    }));
  }

  async getServiceCodeByCode(serviceCode: string): Promise<any | null> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        id,
        service_code,
        service_name,
        service_category,
        unit_type,
        unit_minutes,
        rate_standard,
        rate_enhanced,
        rate_intensive,
        modifier_codes,
        requires_prior_auth,
        requires_isp,
        requires_dodd_eligible_caregiver,
        billing_notes
      FROM hpc_service_codes
      WHERE service_code = $1 AND is_active = true
    `, [serviceCode]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      serviceCategory: row.service_category,
      unitType: row.unit_type,
      unitMinutes: row.unit_minutes,
      rates: {
        standard: parseFloat(row.rate_standard),
        enhanced: row.rate_enhanced ? parseFloat(row.rate_enhanced) : null,
        intensive: row.rate_intensive ? parseFloat(row.rate_intensive) : null
      },
      modifierCodes: row.modifier_codes,
      requiresPriorAuth: row.requires_prior_auth,
      requiresIsp: row.requires_isp,
      requiresDoddEligibleCaregiver: row.requires_dodd_eligible_caregiver,
      billingNotes: row.billing_notes
    };
  }

  // ==========================================
  // HPC Authorization Management
  // ==========================================

  async getAuthorizations(organizationId: string, filters: AuthorizationFilters = {}): Promise<any[]> {
    const db = getDbClient();
    const params: any[] = [organizationId];
    let paramIndex = 2;

    let query = `
      SELECT
        a.id,
        a.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.medicaid_id as client_medicaid_id,
        a.service_code_id,
        s.service_code,
        s.service_name,
        s.rate_standard,
        a.isp_number,
        a.isp_start_date,
        a.isp_end_date,
        a.units_authorized,
        a.units_period,
        a.units_used,
        a.prior_auth_number,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      JOIN hpc_service_codes s ON s.id = a.service_code_id
      WHERE c.organization_id = $1
    `;

    if (filters.clientId) {
      query += ` AND a.client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    if (filters.serviceCode) {
      query += ` AND s.service_code = $${paramIndex}`;
      params.push(filters.serviceCode);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.expiringWithinDays) {
      query += ` AND a.isp_end_date <= CURRENT_DATE + $${paramIndex}::interval`;
      params.push(`${filters.expiringWithinDays} days`);
      paramIndex++;
    }

    query += ` ORDER BY a.isp_end_date ASC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      clientMedicaidId: row.client_medicaid_id,
      serviceCodeId: row.service_code_id,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      rate: parseFloat(row.rate_standard),
      ispNumber: row.isp_number,
      ispStartDate: row.isp_start_date,
      ispEndDate: row.isp_end_date,
      unitsAuthorized: row.units_authorized,
      unitsPeriod: row.units_period,
      unitsUsed: row.units_used,
      unitsRemaining: row.units_authorized - row.units_used,
      utilizationPercent: row.units_authorized > 0 ?
        Math.round((row.units_used / row.units_authorized) * 100) : 0,
      priorAuthNumber: row.prior_auth_number,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getAuthorizationById(authorizationId: string, organizationId: string): Promise<any | null> {
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        a.id,
        a.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.medicaid_id as client_medicaid_id,
        a.service_code_id,
        s.service_code,
        s.service_name,
        s.unit_minutes,
        s.rate_standard,
        s.rate_enhanced,
        s.rate_intensive,
        a.isp_number,
        a.isp_start_date,
        a.isp_end_date,
        a.units_authorized,
        a.units_period,
        a.units_used,
        a.prior_auth_number,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      JOIN hpc_service_codes s ON s.id = a.service_code_id
      WHERE a.id = $1 AND c.organization_id = $2
    `, [authorizationId, organizationId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Get usage history
    const usageResult = await db.query(`
      SELECT
        visit_id,
        units_used,
        service_date,
        created_at
      FROM hpc_authorization_usage
      WHERE authorization_id = $1
      ORDER BY service_date DESC
      LIMIT 50
    `, [authorizationId]);

    return {
      id: row.id,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      clientMedicaidId: row.client_medicaid_id,
      serviceCodeId: row.service_code_id,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      unitMinutes: row.unit_minutes,
      rates: {
        standard: parseFloat(row.rate_standard),
        enhanced: row.rate_enhanced ? parseFloat(row.rate_enhanced) : null,
        intensive: row.rate_intensive ? parseFloat(row.rate_intensive) : null
      },
      ispNumber: row.isp_number,
      ispStartDate: row.isp_start_date,
      ispEndDate: row.isp_end_date,
      unitsAuthorized: row.units_authorized,
      unitsPeriod: row.units_period,
      unitsUsed: row.units_used,
      unitsRemaining: row.units_authorized - row.units_used,
      utilizationPercent: row.units_authorized > 0 ?
        Math.round((row.units_used / row.units_authorized) * 100) : 0,
      priorAuthNumber: row.prior_auth_number,
      status: row.status,
      notes: row.notes,
      usageHistory: usageResult.rows.map(u => ({
        visitId: u.visit_id,
        unitsUsed: u.units_used,
        serviceDate: u.service_date,
        createdAt: u.created_at
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createAuthorization(organizationId: string, data: CreateHpcAuthorizationData): Promise<any> {
    const db = getDbClient();

    // Verify client belongs to organization
    const clientCheck = await db.query(`
      SELECT id FROM clients WHERE id = $1 AND organization_id = $2
    `, [data.clientId, organizationId]);

    if (clientCheck.rows.length === 0) {
      throw new Error('Client not found in organization');
    }

    // Verify service code exists
    const serviceCheck = await db.query(`
      SELECT id, requires_prior_auth FROM hpc_service_codes WHERE id = $1 AND is_active = true
    `, [data.serviceCodeId]);

    if (serviceCheck.rows.length === 0) {
      throw new Error('Invalid service code');
    }

    // Check if prior auth is required but not provided
    if (serviceCheck.rows[0].requires_prior_auth && !data.priorAuthNumber) {
      throw new Error('Prior authorization number is required for this service');
    }

    const result = await db.query(`
      INSERT INTO hpc_authorizations (
        client_id,
        service_code_id,
        isp_number,
        isp_start_date,
        isp_end_date,
        units_authorized,
        units_period,
        prior_auth_number,
        notes,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING id, created_at
    `, [
      data.clientId,
      data.serviceCodeId,
      data.ispNumber || null,
      data.ispStartDate,
      data.ispEndDate,
      data.unitsAuthorized,
      data.unitsPeriod,
      data.priorAuthNumber || null,
      data.notes || null
    ]);

    return {
      id: result.rows[0].id,
      ...data,
      status: 'active',
      unitsUsed: 0,
      createdAt: result.rows[0].created_at
    };
  }

  async updateAuthorization(
    authorizationId: string,
    organizationId: string,
    data: UpdateHpcAuthorizationData
  ): Promise<any | null> {
    const db = getDbClient();

    // Verify authorization exists and belongs to organization
    const existing = await db.query(`
      SELECT a.id
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      WHERE a.id = $1 AND c.organization_id = $2
    `, [authorizationId, organizationId]);

    if (existing.rows.length === 0) return null;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.serviceCodeId) {
      updates.push(`service_code_id = $${paramIndex}`);
      params.push(data.serviceCodeId);
      paramIndex++;
    }

    if (data.ispNumber !== undefined) {
      updates.push(`isp_number = $${paramIndex}`);
      params.push(data.ispNumber);
      paramIndex++;
    }

    if (data.ispStartDate) {
      updates.push(`isp_start_date = $${paramIndex}`);
      params.push(data.ispStartDate);
      paramIndex++;
    }

    if (data.ispEndDate) {
      updates.push(`isp_end_date = $${paramIndex}`);
      params.push(data.ispEndDate);
      paramIndex++;
    }

    if (data.unitsAuthorized !== undefined) {
      updates.push(`units_authorized = $${paramIndex}`);
      params.push(data.unitsAuthorized);
      paramIndex++;
    }

    if (data.unitsPeriod) {
      updates.push(`units_period = $${paramIndex}`);
      params.push(data.unitsPeriod);
      paramIndex++;
    }

    if (data.priorAuthNumber !== undefined) {
      updates.push(`prior_auth_number = $${paramIndex}`);
      params.push(data.priorAuthNumber);
      paramIndex++;
    }

    if (data.status) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(data.notes);
      paramIndex++;
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    params.push(authorizationId);

    await db.query(`
      UPDATE hpc_authorizations
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, params);

    return this.getAuthorizationById(authorizationId, organizationId);
  }

  // ==========================================
  // Authorization Usage Tracking
  // ==========================================

  async recordUsage(organizationId: string, usage: UsageData): Promise<any> {
    const db = getDbClient();

    // Verify authorization exists and get current usage
    const authResult = await db.query(`
      SELECT
        a.id,
        a.units_authorized,
        a.units_used,
        a.units_period,
        a.isp_start_date,
        a.isp_end_date,
        a.status
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      WHERE a.id = $1 AND c.organization_id = $2
    `, [usage.authorizationId, organizationId]);

    if (authResult.rows.length === 0) {
      throw new Error('Authorization not found');
    }

    const auth = authResult.rows[0];

    if (auth.status !== 'active') {
      throw new Error('Authorization is not active');
    }

    // Check if service date is within ISP period
    const serviceDate = new Date(usage.serviceDate);
    if (serviceDate < new Date(auth.isp_start_date) || serviceDate > new Date(auth.isp_end_date)) {
      throw new Error('Service date is outside ISP period');
    }

    // Calculate available units based on period
    const availableUnits = await this.calculateAvailableUnits(
      usage.authorizationId,
      auth.units_authorized,
      auth.units_period,
      usage.serviceDate
    );

    if (usage.unitsUsed > availableUnits) {
      throw new Error(`Insufficient units available. Available: ${availableUnits}, Requested: ${usage.unitsUsed}`);
    }

    // Record usage
    await db.query(`
      INSERT INTO hpc_authorization_usage (
        authorization_id,
        visit_id,
        units_used,
        service_date
      ) VALUES ($1, $2, $3, $4)
    `, [usage.authorizationId, usage.visitId, usage.unitsUsed, usage.serviceDate]);

    // Update total usage
    await db.query(`
      UPDATE hpc_authorizations
      SET units_used = units_used + $1, updated_at = NOW()
      WHERE id = $2
    `, [usage.unitsUsed, usage.authorizationId]);

    return {
      authorizationId: usage.authorizationId,
      visitId: usage.visitId,
      unitsUsed: usage.unitsUsed,
      totalUsed: auth.units_used + usage.unitsUsed,
      remainingTotal: auth.units_authorized - auth.units_used - usage.unitsUsed
    };
  }

  async calculateAvailableUnits(
    authorizationId: string,
    unitsAuthorized: number,
    unitsPeriod: string,
    serviceDate: string
  ): Promise<number> {
    const db = getDbClient();

    if (unitsPeriod === 'isp_period') {
      // For ISP period, just check total usage
      const result = await db.query(`
        SELECT COALESCE(SUM(units_used), 0) as total_used
        FROM hpc_authorization_usage
        WHERE authorization_id = $1
      `, [authorizationId]);

      return unitsAuthorized - parseInt(result.rows[0].total_used);
    }

    // Calculate period boundaries
    const date = new Date(serviceDate);
    let periodStart: Date;
    let periodEnd: Date;

    if (unitsPeriod === 'weekly') {
      // Start of week (Sunday)
      periodStart = new Date(date);
      periodStart.setDate(date.getDate() - date.getDay());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
    } else if (unitsPeriod === 'monthly') {
      periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
      periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    } else if (unitsPeriod === 'yearly') {
      periodStart = new Date(date.getFullYear(), 0, 1);
      periodEnd = new Date(date.getFullYear(), 11, 31);
    } else {
      throw new Error('Invalid units period');
    }

    const result = await db.query(`
      SELECT COALESCE(SUM(units_used), 0) as period_used
      FROM hpc_authorization_usage
      WHERE authorization_id = $1
        AND service_date >= $2
        AND service_date <= $3
    `, [authorizationId, periodStart.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]]);

    return unitsAuthorized - parseInt(result.rows[0].period_used);
  }

  // ==========================================
  // Authorization Alerts & Reports
  // ==========================================

  async getExpiringAuthorizations(organizationId: string, days: number = 30): Promise<any[]> {
    return this.getAuthorizations(organizationId, {
      status: 'active',
      expiringWithinDays: days
    });
  }

  async getLowUtilizationAlerts(organizationId: string, thresholdPercent: number = 50): Promise<any[]> {
    const db = getDbClient();

    // Find authorizations that are past halfway through their period but under threshold utilization
    const result = await db.query(`
      SELECT
        a.id,
        a.client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        s.service_code,
        s.service_name,
        a.isp_start_date,
        a.isp_end_date,
        a.units_authorized,
        a.units_used,
        ROUND((a.units_used::numeric / NULLIF(a.units_authorized, 0)) * 100, 1) as utilization_percent,
        ROUND(
          EXTRACT(EPOCH FROM (CURRENT_DATE - a.isp_start_date)) /
          NULLIF(EXTRACT(EPOCH FROM (a.isp_end_date - a.isp_start_date)), 0) * 100, 1
        ) as period_elapsed_percent
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      JOIN hpc_service_codes s ON s.id = a.service_code_id
      WHERE c.organization_id = $1
        AND a.status = 'active'
        AND CURRENT_DATE BETWEEN a.isp_start_date AND a.isp_end_date
        AND EXTRACT(EPOCH FROM (CURRENT_DATE - a.isp_start_date)) /
            NULLIF(EXTRACT(EPOCH FROM (a.isp_end_date - a.isp_start_date)), 0) > 0.5
        AND (a.units_used::numeric / NULLIF(a.units_authorized, 0)) * 100 < $2
      ORDER BY utilization_percent ASC
    `, [organizationId, thresholdPercent]);

    return result.rows.map(row => ({
      authorizationId: row.id,
      clientId: row.client_id,
      clientName: `${row.client_first_name} ${row.client_last_name}`,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      ispStartDate: row.isp_start_date,
      ispEndDate: row.isp_end_date,
      unitsAuthorized: row.units_authorized,
      unitsUsed: row.units_used,
      utilizationPercent: parseFloat(row.utilization_percent) || 0,
      periodElapsedPercent: parseFloat(row.period_elapsed_percent) || 0,
      alertType: 'low_utilization'
    }));
  }

  async getAuthorizationDashboard(organizationId: string): Promise<any> {
    const db = getDbClient();

    // Get summary stats
    const statsResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE a.status = 'active') as active_count,
        COUNT(*) FILTER (WHERE a.status = 'expired') as expired_count,
        COUNT(*) FILTER (WHERE a.status = 'suspended') as suspended_count,
        COUNT(*) FILTER (
          WHERE a.status = 'active'
          AND a.isp_end_date <= CURRENT_DATE + INTERVAL '30 days'
        ) as expiring_soon,
        AVG(
          CASE WHEN a.status = 'active' AND a.units_authorized > 0
          THEN (a.units_used::numeric / a.units_authorized) * 100
          END
        ) as avg_utilization
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      WHERE c.organization_id = $1
    `, [organizationId]);

    const stats = statsResult.rows[0];

    // Get service code breakdown
    const byServiceResult = await db.query(`
      SELECT
        s.service_code,
        s.service_name,
        COUNT(*) as auth_count,
        SUM(a.units_authorized) as total_authorized,
        SUM(a.units_used) as total_used,
        SUM(a.units_authorized * s.rate_standard) as potential_revenue
      FROM hpc_authorizations a
      JOIN clients c ON c.id = a.client_id
      JOIN hpc_service_codes s ON s.id = a.service_code_id
      WHERE c.organization_id = $1 AND a.status = 'active'
      GROUP BY s.id, s.service_code, s.service_name
      ORDER BY auth_count DESC
    `, [organizationId]);

    return {
      summary: {
        activeAuthorizations: parseInt(stats.active_count),
        expiredAuthorizations: parseInt(stats.expired_count),
        suspendedAuthorizations: parseInt(stats.suspended_count),
        expiringSoon: parseInt(stats.expiring_soon),
        avgUtilization: stats.avg_utilization ? parseFloat(stats.avg_utilization).toFixed(1) : 0
      },
      byServiceCode: byServiceResult.rows.map(row => ({
        serviceCode: row.service_code,
        serviceName: row.service_name,
        authCount: parseInt(row.auth_count),
        totalAuthorized: parseInt(row.total_authorized),
        totalUsed: parseInt(row.total_used),
        potentialRevenue: parseFloat(row.potential_revenue) || 0,
        utilization: row.total_authorized > 0 ?
          Math.round((parseInt(row.total_used) / parseInt(row.total_authorized)) * 100) : 0
      }))
    };
  }

  // ==========================================
  // Client HPC Eligibility Check
  // ==========================================

  async checkClientHpcEligibility(clientId: string, organizationId: string): Promise<any> {
    const db = getDbClient();

    // Get client info and active authorizations
    const clientResult = await db.query(`
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.medicaid_id,
        c.status as client_status,
        COUNT(a.id) FILTER (WHERE a.status = 'active') as active_auths,
        SUM(a.units_authorized - a.units_used) FILTER (WHERE a.status = 'active') as total_remaining_units
      FROM clients c
      LEFT JOIN hpc_authorizations a ON a.client_id = c.id
      WHERE c.id = $1 AND c.organization_id = $2
      GROUP BY c.id
    `, [clientId, organizationId]);

    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }

    const client = clientResult.rows[0];

    // Check organization DODD certification
    const doddCertResult = await db.query(`
      SELECT id, status, expiration_date
      FROM dodd_certifications
      WHERE organization_id = $1
        AND certification_type = 'hpc_provider'
        AND status = 'active'
    `, [organizationId]);

    const hasDoddCert = doddCertResult.rows.length > 0;

    return {
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      medicaidId: client.medicaid_id,
      clientStatus: client.client_status,
      eligibility: {
        hasMedicaidId: !!client.medicaid_id,
        isActiveClient: client.client_status === 'active',
        organizationHasDoddCert: hasDoddCert,
        hasActiveAuthorizations: parseInt(client.active_auths) > 0
      },
      authorizations: {
        activeCount: parseInt(client.active_auths),
        totalRemainingUnits: parseInt(client.total_remaining_units) || 0
      },
      canReceiveHpcServices:
        !!client.medicaid_id &&
        client.client_status === 'active' &&
        hasDoddCert &&
        parseInt(client.active_auths) > 0
    };
  }
}

export const hpcService = new HpcService();
