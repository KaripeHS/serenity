/**
 * Sandata SequenceID Service
 * Manages Ohio Alt-EVV v4.3 SequenceID generation and tracking
 *
 * CRITICAL: SequenceID is REQUIRED for Ohio Alt-EVV v4.3 compliance
 *
 * Features:
 * - Thread-safe SequenceID increment (uses PostgreSQL row locking)
 * - Independent sequences for Patient, Staff, and Visit
 * - Multi-tenant isolation (per organization)
 * - Idempotency support (same SequenceID = update, not duplicate)
 *
 * SequenceID Rules (Ohio Alt-EVV v4.3):
 * - Must start at 1 for first submission
 * - Must increment by 1 for each new/updated record
 * - Re-POSTing same SequenceID = update existing record
 * - Re-POSTing higher SequenceID = new version of record
 * - Patient, Staff, Visit have INDEPENDENT sequences
 *
 * @module services/sandata/sequence.service
 */

import { getDbClient } from '../../database/client';
import type { SequenceID } from './ohio-types';

/**
 * Record type for SequenceID tracking
 */
export type SandataRecordType = 'patient' | 'staff' | 'visit';

/**
 * SequenceID metadata
 */
export interface SequenceMetadata {
  organizationId: string;
  recordType: SandataRecordType;
  currentSequenceId: SequenceID;
  lastUpdated: Date;
}

/**
 * SequenceID Service
 */
export class SandataSequenceService {
  private readonly db = getDbClient();

  /**
   * Get next SequenceID for a given organization and record type
   * Thread-safe - uses PostgreSQL row locking
   *
   * @param organizationId - Organization UUID
   * @param recordType - 'patient', 'staff', or 'visit'
   * @returns Next SequenceID value (guaranteed unique)
   *
   * @example
   * const sequenceId = await sequenceService.getNextSequenceId(orgId, 'patient');
   * // sequenceId = 1 (first patient)
   * const nextSequenceId = await sequenceService.getNextSequenceId(orgId, 'patient');
   * // nextSequenceId = 2 (second patient)
   */
  async getNextSequenceId(
    organizationId: string,
    recordType: SandataRecordType
  ): Promise<SequenceID> {
    try {
      const result = await this.db.query(
        'SELECT get_next_sequence_id($1, $2) AS next_sequence_id',
        [organizationId, recordType]
      );

      const nextSequenceId = result.rows[0]?.next_sequence_id;

      if (!nextSequenceId || nextSequenceId <= 0) {
        throw new Error(
          `Failed to generate SequenceID for org=${organizationId} type=${recordType}`
        );
      }

      return nextSequenceId as SequenceID;
    } catch (error) {
      throw new Error(
        `SequenceID generation failed for org=${organizationId} type=${recordType}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get current SequenceID without incrementing
   *
   * @param organizationId - Organization UUID
   * @param recordType - 'patient', 'staff', or 'visit'
   * @returns Current SequenceID value (0 if none exists)
   *
   * @example
   * const currentSeq = await sequenceService.getCurrentSequenceId(orgId, 'patient');
   * // currentSeq = 42 (current value, not incremented)
   */
  async getCurrentSequenceId(
    organizationId: string,
    recordType: SandataRecordType
  ): Promise<SequenceID> {
    try {
      const result = await this.db.query(
        'SELECT get_current_sequence_id($1, $2) AS current_sequence_id',
        [organizationId, recordType]
      );

      return (result.rows[0]?.current_sequence_id || 0) as SequenceID;
    } catch (error) {
      throw new Error(
        `Failed to get current SequenceID for org=${organizationId} type=${recordType}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get SequenceID metadata for an organization and record type
   *
   * @param organizationId - Organization UUID
   * @param recordType - 'patient', 'staff', or 'visit'
   * @returns SequenceID metadata or null if not initialized
   */
  async getSequenceMetadata(
    organizationId: string,
    recordType: SandataRecordType
  ): Promise<SequenceMetadata | null> {
    try {
      const result = await this.db.query(
        `SELECT
          organization_id,
          record_type,
          current_sequence_id,
          updated_at
        FROM sandata_sequences
        WHERE organization_id = $1 AND record_type = $2`,
        [organizationId, recordType]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      return {
        organizationId: row.organization_id,
        recordType: row.record_type,
        currentSequenceId: row.current_sequence_id,
        lastUpdated: new Date(row.updated_at),
      };
    } catch (error) {
      throw new Error(
        `Failed to get SequenceID metadata for org=${organizationId} type=${recordType}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get all SequenceID metadata for an organization
   *
   * @param organizationId - Organization UUID
   * @returns Array of SequenceID metadata for all record types
   */
  async getAllSequenceMetadata(organizationId: string): Promise<SequenceMetadata[]> {
    try {
      const result = await this.db.query(
        `SELECT
          organization_id,
          record_type,
          current_sequence_id,
          updated_at
        FROM sandata_sequences
        WHERE organization_id = $1
        ORDER BY record_type`,
        [organizationId]
      );

      return result.rows.map((row) => ({
        organizationId: row.organization_id,
        recordType: row.record_type,
        currentSequenceId: row.current_sequence_id,
        lastUpdated: new Date(row.updated_at),
      }));
    } catch (error) {
      throw new Error(
        `Failed to get all SequenceID metadata for org=${organizationId}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Reset SequenceID for a given organization and record type
   *
   * CRITICAL: This should ONLY be used for:
   * - Testing/development environments
   * - Data migration scenarios
   * - Admin-approved manual resets
   *
   * NEVER use in production without approval from Sandata support
   * as it may cause data integrity issues.
   *
   * @param organizationId - Organization UUID
   * @param recordType - 'patient', 'staff', or 'visit'
   * @param newValue - New SequenceID value (default 0)
   */
  async resetSequenceId(
    organizationId: string,
    recordType: SandataRecordType,
    newValue: SequenceID = 0
  ): Promise<void> {
    try {
      await this.db.query('SELECT reset_sequence_id($1, $2, $3)', [
        organizationId,
        recordType,
        newValue,
      ]);
    } catch (error) {
      throw new Error(
        `Failed to reset SequenceID for org=${organizationId} type=${recordType}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Initialize SequenceID sequences for a new organization
   * Creates entries for patient, staff, and visit (all starting at 0)
   *
   * @param organizationId - Organization UUID
   */
  async initializeSequencesForOrganization(organizationId: string): Promise<void> {
    const recordTypes: SandataRecordType[] = ['patient', 'staff', 'visit'];

    try {
      for (const recordType of recordTypes) {
        // Check if already exists
        const existing = await this.getSequenceMetadata(organizationId, recordType);

        if (!existing) {
          // Insert initial sequence
          await this.db.query(
            `INSERT INTO sandata_sequences (organization_id, record_type, current_sequence_id)
            VALUES ($1, $2, 0)
            ON CONFLICT (organization_id, record_type) DO NOTHING`,
            [organizationId, recordType]
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize sequences for org=${organizationId}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get SequenceID for a specific database record
   * Looks up the sandata_sequence_id column for the given record
   *
   * @param recordType - 'patient', 'staff', or 'visit'
   * @param recordId - Database UUID of the record
   * @returns SequenceID or null if not set
   */
  async getRecordSequenceId(
    recordType: SandataRecordType,
    recordId: string
  ): Promise<SequenceID | null> {
    try {
      let tableName: string;
      let result: any;

      switch (recordType) {
        case 'patient':
          tableName = 'clients';
          result = await this.db.query(
            'SELECT sandata_sequence_id FROM clients WHERE id = $1',
            [recordId]
          );
          break;

        case 'staff':
          tableName = 'users';
          result = await this.db.query(
            'SELECT sandata_sequence_id FROM users WHERE id = $1',
            [recordId]
          );
          break;

        case 'visit':
          tableName = 'evv_records';
          result = await this.db.query(
            'SELECT sandata_sequence_id FROM evv_records WHERE id = $1',
            [recordId]
          );
          break;

        default:
          throw new Error(`Invalid record type: ${recordType}`);
      }

      return result.rows[0]?.sandata_sequence_id || null;
    } catch (error) {
      throw new Error(
        `Failed to get record SequenceID for type=${recordType} id=${recordId}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Update SequenceID for a specific database record
   * Saves the SequenceID to the record's sandata_sequence_id column
   *
   * @param recordType - 'patient', 'staff', or 'visit'
   * @param recordId - Database UUID of the record
   * @param sequenceId - SequenceID to save
   */
  async updateRecordSequenceId(
    recordType: SandataRecordType,
    recordId: string,
    sequenceId: SequenceID
  ): Promise<void> {
    try {
      switch (recordType) {
        case 'patient':
          await this.db.query(
            'UPDATE clients SET sandata_sequence_id = $1, updated_at = NOW() WHERE id = $2',
            [sequenceId, recordId]
          );
          break;

        case 'staff':
          await this.db.query(
            'UPDATE users SET sandata_sequence_id = $1, updated_at = NOW() WHERE id = $2',
            [sequenceId, recordId]
          );
          break;

        case 'visit':
          await this.db.query(
            'UPDATE evv_records SET sandata_sequence_id = $1, updated_at = NOW() WHERE id = $2',
            [sequenceId, recordId]
          );
          break;

        default:
          throw new Error(`Invalid record type: ${recordType}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to update record SequenceID for type=${recordType} id=${recordId}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Check if a record needs a new SequenceID
   * Returns true if the record has no SequenceID or if forceUpdate is true
   *
   * @param recordType - 'patient', 'staff', or 'visit'
   * @param recordId - Database UUID of the record
   * @param forceUpdate - If true, always returns true (forces new SequenceID)
   * @returns True if new SequenceID needed, false otherwise
   */
  async needsNewSequenceId(
    recordType: SandataRecordType,
    recordId: string,
    forceUpdate: boolean = false
  ): Promise<boolean> {
    if (forceUpdate) {
      return true;
    }

    const existingSequenceId = await this.getRecordSequenceId(recordType, recordId);
    return existingSequenceId === null;
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Unknown error occurred';
  }
}

/**
 * Singleton instance
 */
let sequenceServiceInstance: SandataSequenceService | null = null;

/**
 * Get Sandata Sequence Service singleton
 */
export function getSandataSequenceService(): SandataSequenceService {
  if (!sequenceServiceInstance) {
    sequenceServiceInstance = new SandataSequenceService();
  }
  return sequenceServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetSandataSequenceService(): void {
  sequenceServiceInstance = null;
}

export default SandataSequenceService;
