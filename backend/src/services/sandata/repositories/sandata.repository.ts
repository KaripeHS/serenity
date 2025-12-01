/**
 * Sandata Repository
 * Database access layer for Sandata integration tables
 *
 * Provides clean interface for:
 * - sandata_transactions (audit trail)
 * - sandata_config (organization settings)
 * - evv_records (visit data with Sandata IDs)
 * - clients (with Sandata client IDs)
 * - users (with Sandata employee IDs)
 *
 * @module services/sandata/repositories
 */

import { DatabaseClient, QueryContext } from '../../../database/client';
import type { SandataTransaction, SandataConfig } from '../types';

/**
 * Database row types (mapped from PostgreSQL tables)
 */
export interface SandataTransactionRow {
  id: string;
  transaction_type: string;
  transaction_id?: string;
  request_payload: any;
  response_payload?: any;
  http_status_code?: number;
  status: string;
  sandata_status_code?: string;
  error_code?: string;
  error_message?: string;
  error_category?: string;
  retry_count: number;
  max_retries: number;
  last_retry_at?: Date;
  next_retry_at?: Date;
  submitted_at: Date;
  responded_at?: Date;
  duration_ms?: number;
  evv_record_id?: string;
  organization_id: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SandataConfigRow {
  id: string;
  organization_id: string;
  sandata_provider_id: string;
  client_id_encrypted: string;
  client_secret_encrypted: string;
  sandbox_enabled: boolean;
  api_endpoint_override?: string;
  geofence_radius_miles: number;
  clockin_tolerance_minutes: number;
  rounding_minutes: number;
  rounding_mode: string;
  max_retry_attempts: number;
  retry_delay_seconds: number;
  claims_gate_mode: string;
  require_authorization_match: boolean;
  block_over_authorization: boolean;
  auto_submit_enabled: boolean;
  corrections_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  updated_by?: string;
}

export interface EVVRecordRow {
  id: string;
  shift_id: string;
  client_id: string;
  caregiver_id: string;
  service_code: string;
  service_date: Date;
  clock_in_time: Date;
  clock_out_time: Date;
  clock_in_latitude: number;
  clock_in_longitude: number;
  clock_out_latitude: number;
  clock_out_longitude: number;
  billable_units?: number;
  authorization_number?: string;
  visit_key?: string;
  sandata_visit_id?: string;
  sandata_status?: string;
  sandata_submitted_at?: Date;
  sandata_rejected_reason?: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  medicaid_number?: string;
  sandata_client_id?: string;
  evv_consent_date?: Date;
  evv_consent_status?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_number?: string;
  email?: string;
  status: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  sandata_employee_id?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_number?: string;
  email?: string;
  hire_date?: Date;
  termination_date?: Date;
  status: string;
  role: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Sandata Repository
 */
export class SandataRepository {
  constructor(private db: DatabaseClient) {}

  // ============================================================================
  // Sandata Transactions
  // ============================================================================

  /**
   * Log a transaction to the audit trail
   */
  async createTransaction(
    transaction: {
      transactionType: string;
      transactionId?: string;
      requestPayload: any;
      responsePayload?: any;
      httpStatusCode?: number;
      status: string;
      sandataStatusCode?: string;
      errorCode?: string;
      errorMessage?: string;
      errorCategory?: string;
      retryCount?: number;
      maxRetries?: number;
      evvRecordId?: string;
      organizationId: string;
      createdBy?: string;
    },
    context?: QueryContext
  ): Promise<SandataTransactionRow> {
    const result = await this.db.query<SandataTransactionRow>(
      `
      INSERT INTO sandata_transactions (
        transaction_type, transaction_id, request_payload, response_payload,
        http_status_code, status, sandata_status_code, error_code, error_message,
        error_category, retry_count, max_retries, submitted_at, responded_at,
        evv_record_id, organization_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(),
              CASE WHEN $4 IS NOT NULL THEN NOW() ELSE NULL END, $13, $14, $15)
      RETURNING *
      `,
      [
        transaction.transactionType,
        transaction.transactionId,
        JSON.stringify(transaction.requestPayload),
        transaction.responsePayload ? JSON.stringify(transaction.responsePayload) : null,
        transaction.httpStatusCode,
        transaction.status,
        transaction.sandataStatusCode,
        transaction.errorCode,
        transaction.errorMessage,
        transaction.errorCategory,
        transaction.retryCount || 0,
        transaction.maxRetries || 5,
        transaction.evvRecordId,
        transaction.organizationId,
        transaction.createdBy,
      ],
      context
    );

    return result.rows[0];
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string, context?: QueryContext): Promise<SandataTransactionRow | null> {
    const result = await this.db.query<SandataTransactionRow>(
      'SELECT * FROM sandata_transactions WHERE id = $1',
      [transactionId],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Get transactions for an EVV record
   */
  async getTransactionsByEVVRecord(
    evvRecordId: string,
    context?: QueryContext
  ): Promise<SandataTransactionRow[]> {
    const result = await this.db.query<SandataTransactionRow>(
      `
      SELECT * FROM sandata_transactions
      WHERE evv_record_id = $1
      ORDER BY created_at DESC
      `,
      [evvRecordId],
      context
    );

    return result.rows;
  }

  /**
   * Get failed transactions that can be retried
   */
  async getRetryableTransactions(organizationId: string, context?: QueryContext): Promise<SandataTransactionRow[]> {
    const result = await this.db.query<SandataTransactionRow>(
      `
      SELECT * FROM sandata_transactions
      WHERE organization_id = $1
        AND status IN ('error', 'retrying')
        AND retry_count < max_retries
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      ORDER BY created_at ASC
      LIMIT 100
      `,
      [organizationId],
      context
    );

    return result.rows;
  }

  /**
   * Update transaction for retry
   */
  async updateTransactionForRetry(
    transactionId: string,
    nextRetryAt: Date,
    context?: QueryContext
  ): Promise<void> {
    await this.db.query(
      `
      UPDATE sandata_transactions
      SET retry_count = retry_count + 1,
          last_retry_at = NOW(),
          next_retry_at = $2,
          status = 'retrying',
          updated_at = NOW()
      WHERE id = $1
      `,
      [transactionId, nextRetryAt],
      context
    );
  }

  // ============================================================================
  // Sandata Configuration
  // ============================================================================

  /**
   * Get Sandata configuration for an organization
   */
  async getConfig(organizationId: string, context?: QueryContext): Promise<SandataConfigRow | null> {
    const result = await this.db.query<SandataConfigRow>(
      'SELECT * FROM sandata_config WHERE organization_id = $1',
      [organizationId],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Update Sandata configuration
   */
  async updateConfig(
    organizationId: string,
    updates: Partial<SandataConfigRow>,
    context?: QueryContext
  ): Promise<SandataConfigRow> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'organization_id' && key !== 'created_at') {
        updateFields.push(`${key} = $${paramIndex++}`);
        updateValues.push(value);
      }
    });

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(organizationId);

    const result = await this.db.query<SandataConfigRow>(
      `
      UPDATE sandata_config
      SET ${updateFields.join(', ')}
      WHERE organization_id = $${paramIndex}
      RETURNING *
      `,
      updateValues,
      context
    );

    return result.rows[0];
  }

  // ============================================================================
  // EVV Records
  // ============================================================================

  /**
   * Get EVV record by ID
   */
  async getEVVRecord(evvRecordId: string, context?: QueryContext): Promise<EVVRecordRow | null> {
    const result = await this.db.query<EVVRecordRow>(
      'SELECT * FROM evv_records WHERE id = $1',
      [evvRecordId],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Update EVV record with Sandata details
   */
  async updateEVVRecordSandataDetails(
    evvRecordId: string,
    updates: {
      visitKey?: string;
      sandataVisitId?: string;
      sandataStatus?: string;
      sandataSubmittedAt?: Date;
      sandataRejectedReason?: string;
      billableUnits?: number;
    },
    context?: QueryContext
  ): Promise<EVVRecordRow> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.visitKey !== undefined) {
      updateFields.push(`visit_key = $${paramIndex++}`);
      updateValues.push(updates.visitKey);
    }
    if (updates.sandataVisitId !== undefined) {
      updateFields.push(`sandata_visit_id = $${paramIndex++}`);
      updateValues.push(updates.sandataVisitId);
    }
    if (updates.sandataStatus !== undefined) {
      updateFields.push(`sandata_status = $${paramIndex++}`);
      updateValues.push(updates.sandataStatus);
    }
    if (updates.sandataSubmittedAt !== undefined) {
      updateFields.push(`sandata_submitted_at = $${paramIndex++}`);
      updateValues.push(updates.sandataSubmittedAt);
    }
    if (updates.sandataRejectedReason !== undefined) {
      updateFields.push(`sandata_rejected_reason = $${paramIndex++}`);
      updateValues.push(updates.sandataRejectedReason);
    }
    if (updates.billableUnits !== undefined) {
      updateFields.push(`billable_units = $${paramIndex++}`);
      updateValues.push(updates.billableUnits);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(evvRecordId);

    const result = await this.db.query<EVVRecordRow>(
      `
      UPDATE evv_records
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
      `,
      updateValues,
      context
    );

    return result.rows[0];
  }

  /**
   * Get EVV records pending Sandata submission
   */
  async getPendingEVVRecords(organizationId: string, limit: number = 100, context?: QueryContext): Promise<EVVRecordRow[]> {
    const result = await this.db.query<EVVRecordRow>(
      `
      SELECT * FROM evv_records
      WHERE organization_id = $1
        AND (sandata_status IS NULL OR sandata_status = 'not_submitted')
        AND clock_out_time IS NOT NULL
      ORDER BY service_date ASC, clock_in_time ASC
      LIMIT $2
      `,
      [organizationId, limit],
      context
    );

    return result.rows;
  }

  /**
   * Get rejected EVV records that need fixing
   */
  async getRejectedEVVRecords(organizationId: string, context?: QueryContext): Promise<EVVRecordRow[]> {
    const result = await this.db.query<EVVRecordRow>(
      `
      SELECT * FROM evv_records
      WHERE organization_id = $1
        AND sandata_status = 'rejected'
      ORDER BY sandata_submitted_at DESC
      `,
      [organizationId],
      context
    );

    return result.rows;
  }

  // ============================================================================
  // Clients
  // ============================================================================

  /**
   * Get client by ID
   */
  async getClient(clientId: string, context?: QueryContext): Promise<ClientRow | null> {
    const result = await this.db.query<ClientRow>(
      'SELECT * FROM clients WHERE id = $1',
      [clientId],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Update client with Sandata ID
   */
  async updateClientSandataId(
    clientId: string,
    sandataClientId: string,
    context?: QueryContext
  ): Promise<ClientRow> {
    const result = await this.db.query<ClientRow>(
      `
      UPDATE clients
      SET sandata_client_id = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [clientId, sandataClientId],
      context
    );

    return result.rows[0];
  }

  /**
   * Get clients needing Sandata sync
   */
  async getClientsNeedingSync(organizationId: string, limit: number = 50, context?: QueryContext): Promise<ClientRow[]> {
    const result = await this.db.query<ClientRow>(
      `
      SELECT * FROM clients
      WHERE organization_id = $1
        AND sandata_client_id IS NULL
        AND evv_consent_status = 'signed'
        AND status = 'active'
      ORDER BY created_at ASC
      LIMIT $2
      `,
      [organizationId, limit],
      context
    );

    return result.rows;
  }

  // ============================================================================
  // Users (Caregivers)
  // ============================================================================

  /**
   * Get user by ID
   */
  async getUser(userId: string, context?: QueryContext): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [userId],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Update user with Sandata ID
   */
  async updateUserSandataId(
    userId: string,
    sandataEmployeeId: string,
    context?: QueryContext
  ): Promise<UserRow> {
    const result = await this.db.query<UserRow>(
      `
      UPDATE users
      SET sandata_employee_id = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [userId, sandataEmployeeId],
      context
    );

    return result.rows[0];
  }

  /**
   * Get caregivers needing Sandata sync
   */
  async getCaregiversNeedingSync(organizationId: string, limit: number = 50, context?: QueryContext): Promise<UserRow[]> {
    const result = await this.db.query<UserRow>(
      `
      SELECT * FROM users
      WHERE organization_id = $1
        AND sandata_employee_id IS NULL
        AND role IN ('caregiver', 'aide', 'nurse', 'cna', 'hha', 'pca')
        AND status = 'active'
      ORDER BY hire_date ASC
      LIMIT $2
      `,
      [organizationId, limit],
      context
    );

    return result.rows;
  }

  // ============================================================================
  // Authentication - Users
  // ============================================================================

  /**
   * Get user by email (for login)
   */
  async getUserByEmail(email: string, context?: QueryContext): Promise<UserRow & { password_hash: string; pod_id?: string; phone_number?: string } | null> {
    const result = await this.db.query<UserRow & { password_hash: string; pod_id?: string; phone_number?: string }>(
      `SELECT u.*,
              (SELECT pod_id FROM user_pod_memberships WHERE user_id = u.id AND is_primary = true LIMIT 1) as pod_id
       FROM users u
       WHERE LOWER(email) = LOWER($1)`,
      [email],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  async createUser(
    user: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      organizationId?: string | null;
      role: string;
      status: string;
      phone?: string;
    },
    context?: QueryContext
  ): Promise<string> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, first_name, last_name, organization_id, role, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        user.email.toLowerCase(),
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.organizationId,
        user.role,
        user.status,
        user.phone || null,
      ],
      context
    );

    return result.rows[0].id;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updates: {
      passwordHash?: string;
      firstName?: string;
      lastName?: string;
      status?: string;
      phone?: string;
      updatedBy?: string;
    },
    context?: QueryContext
  ): Promise<void> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.passwordHash !== undefined) {
      updateFields.push(`password_hash = $${paramIndex++}`);
      updateValues.push(updates.passwordHash);
    }
    if (updates.firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      updateValues.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      updateValues.push(updates.lastName);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }
    if (updates.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(updates.phone);
    }

    if (updateFields.length === 0) return;

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    await this.db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues,
      context
    );
  }

  // ============================================================================
  // Authentication - Sessions
  // ============================================================================

  /**
   * Create a session (for JWT refresh tokens)
   */
  async createSession(
    session: {
      userId: string;
      refreshToken: string;
      expiresAt: Date;
      userAgent?: string | null;
      ipAddress?: string | null;
    },
    context?: QueryContext
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        session.userId,
        session.refreshToken,
        session.expiresAt,
        session.userAgent,
        session.ipAddress,
      ],
      context
    );
  }

  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(
    refreshToken: string,
    context?: QueryContext
  ): Promise<{ id: string; user_id: string; refresh_token: string; expires_at: Date; revoked_at: Date | null } | null> {
    const result = await this.db.query<{ id: string; user_id: string; refresh_token: string; expires_at: Date; revoked_at: Date | null }>(
      `SELECT * FROM sessions
       WHERE refresh_token = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()`,
      [refreshToken],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Get session by ID
   */
  async getSession(
    sessionId: string,
    context?: QueryContext
  ): Promise<{ id: string; user_id: string; refresh_token: string; expires_at: Date; revoked_at: Date | null } | null> {
    const result = await this.db.query<{ id: string; user_id: string; refresh_token: string; expires_at: Date; revoked_at: Date | null }>(
      `SELECT * FROM sessions WHERE id = $1`,
      [sessionId],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(
    userId: string,
    context?: QueryContext
  ): Promise<Array<{ id: string; created_at: Date; expires_at: Date; user_agent: string | null; ip_address: string | null; refresh_token: string }>> {
    const result = await this.db.query<{ id: string; created_at: Date; expires_at: Date; user_agent: string | null; ip_address: string | null; refresh_token: string }>(
      `SELECT id, created_at, expires_at, user_agent, ip_address, refresh_token
       FROM sessions
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId],
      context
    );

    return result.rows;
  }

  /**
   * Revoke a session by refresh token
   */
  async revokeSession(refreshToken: string, context?: QueryContext): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE refresh_token = $1`,
      [refreshToken],
      context
    );
  }

  /**
   * Revoke a session by ID
   */
  async revokeSessionById(sessionId: string, context?: QueryContext): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE id = $1`,
      [sessionId],
      context
    );
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string, context?: QueryContext): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
      context
    );
  }

  // ============================================================================
  // Authentication - Password Reset
  // ============================================================================

  /**
   * Create password reset token
   */
  async createPasswordResetToken(
    data: {
      userId: string;
      token: string;
      expiresAt: Date;
    },
    context?: QueryContext
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [data.userId, data.token, data.expiresAt],
      context
    );
  }

  /**
   * Get password reset token
   */
  async getPasswordResetToken(
    token: string,
    context?: QueryContext
  ): Promise<{ id: string; user_id: string; token: string; expires_at: Date; used_at: Date | null } | null> {
    const result = await this.db.query<{ id: string; user_id: string; token: string; expires_at: Date; used_at: Date | null }>(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [token],
      context
    );

    return result.rows[0] || null;
  }

  /**
   * Mark password reset token as used
   */
  async markPasswordResetTokenUsed(token: string, context?: QueryContext): Promise<void> {
    await this.db.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`,
      [token],
      context
    );
  }

  // ============================================================================
  // Authentication - Audit Logs
  // ============================================================================

  /**
   * Create audit log entry
   */
  async createAuditLog(
    log: {
      userId?: string;
      organizationId?: string;
      action: string;
      entityType: string;
      entityId: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      metadata?: any;
    },
    context?: QueryContext
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO audit_events (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        log.userId,
        log.organizationId,
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress,
        log.userAgent,
        log.metadata ? JSON.stringify(log.metadata) : null,
      ],
      context
    );
  }

  // ============================================================================
  // Organizations
  // ============================================================================

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string, context?: QueryContext): Promise<{ id: string; name: string; slug: string; status: string } | null> {
    const result = await this.db.query<{ id: string; name: string; slug: string; status: string }>(
      `SELECT id, name, slug, status FROM organizations WHERE id = $1`,
      [organizationId],
      context
    );

    return result.rows[0] || null;
  }

  // ============================================================================
  // Pods
  // ============================================================================

  /**
   * Get pod by ID
   */
  async getPod(podId: string, context?: QueryContext): Promise<{ id: string; pod_name: string; code: string; city: string; state: string } | null> {
    const result = await this.db.query<{ id: string; pod_name: string; code: string; city: string; state: string }>(
      `SELECT id, name as pod_name, code, city, state FROM pods WHERE id = $1`,
      [podId],
      context
    );

    return result.rows[0] || null;
  }

  // ============================================================================
  // Shifts
  // ============================================================================

  /**
   * Get shift by ID with full details
   */
  async getShift(shiftId: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      `SELECT s.*,
              u.first_name as caregiver_first_name, u.last_name as caregiver_last_name,
              c.first_name as client_first_name, c.last_name as client_last_name,
              p.name as pod_name
       FROM shifts s
       LEFT JOIN users u ON s.caregiver_id = u.id
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN pods p ON s.pod_id = p.id
       WHERE s.id = $1`,
      [shiftId],
      context
    );
    return result.rows[0] || null;
  }

  /**
   * Get shifts with filters
   */
  async getShiftsWithFilters(filters: {
    organizationId: string;
    startDate?: string;
    endDate?: string;
    caregiverId?: string;
    clientId?: string;
    podId?: string;
    status?: string;
    limit?: number;
  }, context?: QueryContext): Promise<any[]> {
    let query = `
      SELECT s.id, s.organization_id, s.caregiver_id, s.client_id, s.pod_id,
             s.scheduled_start as scheduled_start_time, s.scheduled_end as scheduled_end_time,
             s.actual_start as actual_start_time, s.actual_end as actual_end_time,
             s.status, s.service_code, s.evv_record_id, s.created_at,
             CONCAT(u.first_name, ' ', u.last_name) as caregiver_name,
             CONCAT(c.first_name, ' ', c.last_name) as client_name,
             p.name as pod_name
       FROM shifts s
       LEFT JOIN users u ON s.caregiver_id = u.id
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN pods p ON s.pod_id = p.id
       WHERE s.organization_id = $1
    `;
    const params: any[] = [filters.organizationId];
    let paramIndex = 2;

    if (filters.startDate) {
      query += ` AND s.scheduled_start >= $${paramIndex++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND s.scheduled_start <= $${paramIndex++}`;
      params.push(filters.endDate);
    }
    if (filters.caregiverId) {
      query += ` AND s.caregiver_id = $${paramIndex++}`;
      params.push(filters.caregiverId);
    }
    if (filters.clientId) {
      query += ` AND s.client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }
    if (filters.podId) {
      query += ` AND s.pod_id = $${paramIndex++}`;
      params.push(filters.podId);
    }
    if (filters.status) {
      query += ` AND s.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY s.scheduled_start DESC LIMIT $${paramIndex}`;
    params.push(filters.limit || 100);

    const result = await this.db.query(query, params, context);
    return result.rows;
  }

  /**
   * Get shifts by date
   */
  async getShiftsByDate(organizationId: string, date: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT s.id, s.organization_id, s.caregiver_id, s.client_id, s.pod_id,
              s.scheduled_start as scheduled_start_time, s.scheduled_end as scheduled_end_time,
              s.actual_start as actual_start_time, s.actual_end as actual_end_time,
              s.status, s.service_code,
              CONCAT(u.first_name, ' ', u.last_name) as caregiver_name,
              CONCAT(c.first_name, ' ', c.last_name) as client_name,
              p.name as pod_name
       FROM shifts s
       LEFT JOIN users u ON s.caregiver_id = u.id
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN pods p ON s.pod_id = p.id
       WHERE s.organization_id = $1
         AND DATE(s.scheduled_start) = $2
       ORDER BY s.scheduled_start`,
      [organizationId, date],
      context
    );
    return result.rows;
  }

  /**
   * Create a new shift
   */
  async createShift(shift: {
    organizationId: string;
    caregiverId: string;
    clientId: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    serviceCode?: string | null;
    authorizationNumber?: string | null;
    status: string;
    notes?: string | null;
    createdBy?: string;
  }, context?: QueryContext): Promise<string> {
    // Get pod_id from client
    const client = await this.getClient(shift.clientId, context);
    const podId = client?.pod_id;

    const result = await this.db.query<{ id: string }>(
      `INSERT INTO shifts (organization_id, pod_id, caregiver_id, client_id, scheduled_start, scheduled_end, service_code, authorization_number, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        shift.organizationId,
        podId,
        shift.caregiverId,
        shift.clientId,
        shift.scheduledStartTime,
        shift.scheduledEndTime,
        shift.serviceCode,
        shift.authorizationNumber,
        shift.status,
        shift.notes,
        shift.createdBy,
      ],
      context
    );
    return result.rows[0].id;
  }

  /**
   * Update a shift
   */
  async updateShift(shiftId: string, updates: {
    caregiverId?: string;
    clientId?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    status?: string;
    serviceCode?: string;
    authorizationNumber?: string;
    notes?: string;
    updatedBy?: string;
  }, context?: QueryContext): Promise<void> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.caregiverId !== undefined) {
      updateFields.push(`caregiver_id = $${paramIndex++}`);
      updateValues.push(updates.caregiverId);
    }
    if (updates.clientId !== undefined) {
      updateFields.push(`client_id = $${paramIndex++}`);
      updateValues.push(updates.clientId);
    }
    if (updates.scheduledStartTime !== undefined) {
      updateFields.push(`scheduled_start = $${paramIndex++}`);
      updateValues.push(updates.scheduledStartTime);
    }
    if (updates.scheduledEndTime !== undefined) {
      updateFields.push(`scheduled_end = $${paramIndex++}`);
      updateValues.push(updates.scheduledEndTime);
    }
    if (updates.actualStartTime !== undefined) {
      updateFields.push(`actual_start = $${paramIndex++}`);
      updateValues.push(updates.actualStartTime);
    }
    if (updates.actualEndTime !== undefined) {
      updateFields.push(`actual_end = $${paramIndex++}`);
      updateValues.push(updates.actualEndTime);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }
    if (updates.serviceCode !== undefined) {
      updateFields.push(`service_code = $${paramIndex++}`);
      updateValues.push(updates.serviceCode);
    }
    if (updates.authorizationNumber !== undefined) {
      updateFields.push(`authorization_number = $${paramIndex++}`);
      updateValues.push(updates.authorizationNumber);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(updates.notes);
    }

    if (updateFields.length === 0) return;

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(shiftId);

    await this.db.query(
      `UPDATE shifts SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues,
      context
    );
  }

  /**
   * Delete a shift
   */
  async deleteShift(shiftId: string, context?: QueryContext): Promise<void> {
    await this.db.query('DELETE FROM shifts WHERE id = $1', [shiftId], context);
  }

  // ============================================================================
  // Clients
  // ============================================================================

  /**
   * Get client by ID
   */
  async getClient(clientId: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      `SELECT c.*, p.name as pod_name, p.code as pod_code
       FROM clients c
       LEFT JOIN pods p ON c.pod_id = p.id
       WHERE c.id = $1`,
      [clientId],
      context
    );
    return result.rows[0] || null;
  }

  /**
   * Get clients for organization
   */
  async getClients(organizationId: string, limit: number = 100, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT c.*, p.name as pod_name, p.code as pod_code
       FROM clients c
       LEFT JOIN pods p ON c.pod_id = p.id
       WHERE c.organization_id = $1
       ORDER BY c.last_name, c.first_name
       LIMIT $2`,
      [organizationId, limit],
      context
    );
    return result.rows;
  }

  // ============================================================================
  // Users (extended)
  // ============================================================================

  /**
   * Get user by ID
   */
  async getUser(userId: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      `SELECT u.*,
              (SELECT pod_id FROM user_pod_memberships WHERE user_id = u.id AND is_primary = true LIMIT 1) as pod_id
       FROM users u
       WHERE u.id = $1`,
      [userId],
      context
    );
    return result.rows[0] || null;
  }

  /**
   * Get active users by role
   */
  async getActiveUsers(organizationId: string, role: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT u.*,
              upm.pod_id,
              p.name as pod_name
       FROM users u
       LEFT JOIN user_pod_memberships upm ON u.id = upm.user_id AND upm.is_primary = true
       LEFT JOIN pods p ON upm.pod_id = p.id
       WHERE u.organization_id = $1
         AND u.role = $2
         AND u.status = 'active'
       ORDER BY u.last_name, u.first_name`,
      [organizationId, role],
      context
    );
    return result.rows;
  }

  // ============================================================================
  // Pod Members
  // ============================================================================

  /**
   * Get pod members
   */
  async getPodMembers(podId: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone as phone_number, u.role, u.status,
              upm.role_in_pod, upm.is_primary
       FROM users u
       JOIN user_pod_memberships upm ON u.id = upm.user_id
       WHERE upm.pod_id = $1
         AND upm.status = 'active'
       ORDER BY u.last_name, u.first_name`,
      [podId],
      context
    );
    return result.rows;
  }

  // ============================================================================
  // Morning Check-Ins
  // ============================================================================

  /**
   * Get morning check-ins for a date
   */
  async getMorningCheckIns(organizationId: string, date: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT mci.*,
              CONCAT(u.first_name, ' ', u.last_name) as user_name,
              upm.pod_id,
              p.name as pod_name
       FROM morning_check_ins mci
       JOIN users u ON mci.user_id = u.id
       LEFT JOIN user_pod_memberships upm ON u.id = upm.user_id AND upm.is_primary = true
       LEFT JOIN pods p ON upm.pod_id = p.id
       WHERE mci.organization_id = $1
         AND mci.check_in_date = $2
       ORDER BY mci.check_in_time DESC`,
      [organizationId, date],
      context
    );
    return result.rows;
  }

  /**
   * Get morning check-in for a user on a date
   */
  async getMorningCheckIn(userId: string, date: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      `SELECT * FROM morning_check_ins
       WHERE user_id = $1 AND check_in_date = $2`,
      [userId, date],
      context
    );
    return result.rows[0] || null;
  }

  /**
   * Get morning check-in by ID
   */
  async getMorningCheckInById(checkInId: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      'SELECT * FROM morning_check_ins WHERE id = $1',
      [checkInId],
      context
    );
    return result.rows[0] || null;
  }

  /**
   * Create morning check-in
   */
  async createMorningCheckIn(checkIn: {
    userId: string;
    organizationId: string;
    date: string;
    status: string;
    checkInTime: string;
    notes?: string | null;
    recordedBy?: string;
  }, context?: QueryContext): Promise<string> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO morning_check_ins (user_id, organization_id, check_in_date, status, check_in_time, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        checkIn.userId,
        checkIn.organizationId,
        checkIn.date,
        checkIn.status,
        checkIn.checkInTime,
        checkIn.notes,
        checkIn.recordedBy,
      ],
      context
    );
    return result.rows[0].id;
  }

  /**
   * Update morning check-in
   */
  async updateMorningCheckIn(checkInId: string, updates: {
    status?: string;
    notes?: string | null;
    updatedBy?: string;
  }, context?: QueryContext): Promise<void> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(updates.notes);
    }

    if (updateFields.length === 0) return;

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(checkInId);

    await this.db.query(
      `UPDATE morning_check_ins SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues,
      context
    );
  }

  /**
   * Get morning check-ins with filters
   */
  async getMorningCheckInsWithFilters(filters: {
    organizationId: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }, context?: QueryContext): Promise<any[]> {
    let query = `
      SELECT mci.*,
             CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM morning_check_ins mci
      JOIN users u ON mci.user_id = u.id
      WHERE mci.organization_id = $1
    `;
    const params: any[] = [filters.organizationId];
    let paramIndex = 2;

    if (filters.userId) {
      query += ` AND mci.user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }
    if (filters.startDate) {
      query += ` AND mci.check_in_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND mci.check_in_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }
    if (filters.status) {
      query += ` AND mci.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY mci.check_in_date DESC, mci.check_in_time DESC LIMIT $${paramIndex}`;
    params.push(filters.limit || 30);

    const result = await this.db.query(query, params, context);
    return result.rows;
  }

  /**
   * Get morning check-in stats
   */
  async getMorningCheckInStats(organizationId: string, startDate: string, endDate: string, context?: QueryContext): Promise<{
    total_check_ins: number;
    available_count: number;
    unavailable_count: number;
    late_count: number;
    absent_count: number;
  }> {
    const result = await this.db.query<{
      total_check_ins: string;
      available_count: string;
      unavailable_count: string;
      late_count: string;
      absent_count: string;
    }>(
      `SELECT
         COUNT(*) as total_check_ins,
         COUNT(*) FILTER (WHERE status = 'available') as available_count,
         COUNT(*) FILTER (WHERE status = 'unavailable') as unavailable_count,
         COUNT(*) FILTER (WHERE status = 'late') as late_count,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_count
       FROM morning_check_ins
       WHERE organization_id = $1
         AND check_in_date >= $2
         AND check_in_date <= $3`,
      [organizationId, startDate, endDate],
      context
    );

    const row = result.rows[0];
    return {
      total_check_ins: parseInt(row.total_check_ins) || 0,
      available_count: parseInt(row.available_count) || 0,
      unavailable_count: parseInt(row.unavailable_count) || 0,
      late_count: parseInt(row.late_count) || 0,
      absent_count: parseInt(row.absent_count) || 0,
    };
  }

  // ============================================================================
  // EVV Records
  // ============================================================================

  /**
   * Get EVV record by ID
   */
  async getEVVRecord(evvRecordId: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      'SELECT * FROM evv_records WHERE id = $1',
      [evvRecordId],
      context
    );
    return result.rows[0] || null;
  }

  // ============================================================================
  // Certifications
  // ============================================================================

  /**
   * Get user certifications
   */
  async getUserCertifications(userId: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM certifications
       WHERE user_id = $1
       ORDER BY expiration_date DESC`,
      [userId],
      context
    );
    return result.rows;
  }

  /**
   * Get certification by ID
   */
  async getCertification(certificationId: string, context?: QueryContext): Promise<any | null> {
    const result = await this.db.query(
      'SELECT * FROM certifications WHERE id = $1',
      [certificationId],
      context
    );
    return result.rows[0] || null;
  }

  /**
   * Create certification
   */
  async createCertification(cert: {
    userId: string;
    certificationType: string;
    certificationNumber?: string;
    issuingAuthority: string;
    issueDate: string;
    expirationDate: string;
    status: string;
    createdBy?: string;
  }, context?: QueryContext): Promise<string> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO certifications (user_id, certification_type, certification_number, issuing_authority, issue_date, expiration_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        cert.userId,
        cert.certificationType,
        cert.certificationNumber,
        cert.issuingAuthority,
        cert.issueDate,
        cert.expirationDate,
        cert.status,
      ],
      context
    );
    return result.rows[0].id;
  }

  /**
   * Update certification
   */
  async updateCertification(certificationId: string, updates: {
    status?: string;
    expirationDate?: string;
    updatedBy?: string;
  }, context?: QueryContext): Promise<void> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }
    if (updates.expirationDate !== undefined) {
      updateFields.push(`expiration_date = $${paramIndex++}`);
      updateValues.push(updates.expirationDate);
    }

    if (updateFields.length === 0) return;

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(certificationId);

    await this.db.query(
      `UPDATE certifications SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues,
      context
    );
  }

  // ============================================================================
  // Caregiver-specific queries
  // ============================================================================

  /**
   * Get caregiver's clients
   */
  async getCaregiverClients(caregiverId: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT DISTINCT c.*
       FROM clients c
       JOIN shifts s ON c.id = s.client_id
       WHERE s.caregiver_id = $1
         AND c.status = 'active'
       ORDER BY c.last_name, c.first_name
       LIMIT 50`,
      [caregiverId],
      context
    );
    return result.rows;
  }

  /**
   * Get caregiver's recent shifts
   */
  async getCaregiverRecentShifts(caregiverId: string, limit: number = 10, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT s.*,
              CONCAT(c.first_name, ' ', c.last_name) as client_name
       FROM shifts s
       JOIN clients c ON s.client_id = c.id
       WHERE s.caregiver_id = $1
       ORDER BY s.scheduled_start DESC
       LIMIT $2`,
      [caregiverId, limit],
      context
    );
    return result.rows;
  }

  /**
   * Get caregiver's shifts by date range
   */
  async getCaregiverShiftsByDateRange(caregiverId: string, startDate: string, endDate: string, context?: QueryContext): Promise<any[]> {
    const result = await this.db.query(
      `SELECT s.*,
              CONCAT(c.first_name, ' ', c.last_name) as client_name
       FROM shifts s
       JOIN clients c ON s.client_id = c.id
       WHERE s.caregiver_id = $1
         AND DATE(s.scheduled_start) >= $2
         AND DATE(s.scheduled_start) <= $3
       ORDER BY s.scheduled_start`,
      [caregiverId, startDate, endDate],
      context
    );
    return result.rows;
  }

  /**
   * Get caregiver performance metrics
   */
  async getCaregiverMetrics(caregiverId: string, context?: QueryContext): Promise<{
    total_shifts_completed: number;
    total_hours_worked: number;
    evv_compliance_rate: number;
    on_time_rate: number;
  }> {
    const result = await this.db.query<{
      total_shifts_completed: string;
      total_hours_worked: string;
      evv_compliance_rate: string;
      on_time_rate: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as total_shifts_completed,
         COALESCE(SUM(EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600) FILTER (WHERE status = 'completed'), 0) as total_hours_worked,
         CASE
           WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0
           THEN (COUNT(*) FILTER (WHERE status = 'completed' AND evv_record_id IS NOT NULL)::float / COUNT(*) FILTER (WHERE status = 'completed')::float * 100)
           ELSE 0
         END as evv_compliance_rate,
         CASE
           WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0
           THEN (COUNT(*) FILTER (WHERE status = 'completed' AND actual_start <= scheduled_start + INTERVAL '15 minutes')::float / COUNT(*) FILTER (WHERE status = 'completed')::float * 100)
           ELSE 0
         END as on_time_rate
       FROM shifts
       WHERE caregiver_id = $1
         AND scheduled_start >= NOW() - INTERVAL '90 days'`,
      [caregiverId],
      context
    );

    const row = result.rows[0];
    return {
      total_shifts_completed: parseInt(row.total_shifts_completed) || 0,
      total_hours_worked: parseFloat(row.total_hours_worked) || 0,
      evv_compliance_rate: parseFloat(row.evv_compliance_rate) || 0,
      on_time_rate: parseFloat(row.on_time_rate) || 0,
    };
  }

  // ============================================================================
  // Encryption/Decryption Utilities
  // ============================================================================

  /**
   * Decrypt SSN using PostgreSQL decrypt_ssn() function
   * CRITICAL: Only use when necessary for Sandata submission
   * NEVER log the decrypted SSN
   *
   * @param ssnEncrypted - Encrypted SSN (bytea)
   * @returns Decrypted SSN (9 digits, no dashes)
   */
  async decryptSSN(ssnEncrypted: Buffer | string, context?: QueryContext): Promise<string | null> {
    if (!ssnEncrypted) {
      return null;
    }

    const result = await this.db.query<{ ssn: string }>(
      'SELECT decrypt_ssn($1) AS ssn',
      [ssnEncrypted],
      context
    );

    return result.rows[0]?.ssn || null;
  }

  /**
   * Encrypt SSN using PostgreSQL encrypt_ssn() function
   *
   * @param ssn - Plain text SSN (9 digits, no dashes)
   * @returns Encrypted SSN (bytea)
   */
  async encryptSSN(ssn: string, context?: QueryContext): Promise<Buffer | null> {
    if (!ssn) {
      return null;
    }

    const result = await this.db.query<{ encrypted: Buffer }>(
      'SELECT encrypt_ssn($1) AS encrypted',
      [ssn],
      context
    );

    return result.rows[0]?.encrypted || null;
  }
}

/**
 * Singleton instance
 */
let sandataRepositoryInstance: SandataRepository | null = null;

/**
 * Get Sandata Repository singleton
 */
export function getSandataRepository(db?: DatabaseClient): SandataRepository {
  if (!sandataRepositoryInstance) {
    if (!db) {
      throw new Error('Database client required for first initialization of SandataRepository');
    }
    sandataRepositoryInstance = new SandataRepository(db);
  }
  return sandataRepositoryInstance;
}

/**
 * Reset repository instance (for testing)
 */
export function resetSandataRepository(): void {
  sandataRepositoryInstance = null;
}

export default SandataRepository;
