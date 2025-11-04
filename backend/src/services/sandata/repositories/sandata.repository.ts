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
