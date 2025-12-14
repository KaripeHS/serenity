/**
 * Offline Sync Service
 * Manages offline data synchronization for mobile app
 *
 * Features:
 * - Offline queue management
 * - Conflict resolution
 * - Background sync
 * - Optimistic updates
 */

import { pool } from '../../config/database';

interface SyncQueueItem {
  id: string;
  userId: string;
  organizationId: string;
  entityType: string; // 'visit', 'check_in', 'expense', 'note'
  operation: 'create' | 'update' | 'delete';
  data: any;
  localTimestamp: Date;
  serverTimestamp?: Date;
  status: 'pending' | 'synced' | 'conflict' | 'error';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
}

export class OfflineSyncService {
  /**
   * Add item to sync queue
   */
  async addToQueue(
    userId: string,
    organizationId: string,
    entityType: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<string> {
    const result = await pool.query(
      `
      INSERT INTO offline_sync_queue (
        user_id,
        organization_id,
        entity_type,
        operation,
        data,
        local_timestamp,
        status,
        attempts
      ) VALUES ($1, $2, $3, $4, $5, NOW(), 'pending', 0)
      RETURNING id
      `,
      [userId, organizationId, entityType, operation, JSON.stringify(data)]
    );

    return result.rows[0].id;
  }

  /**
   * Process sync queue for a user
   */
  async syncUserQueue(userId: string): Promise<{
    synced: number;
    conflicts: number;
    errors: number;
  }> {
    // Get pending items
    const result = await pool.query(
      `
      SELECT *
      FROM offline_sync_queue
      WHERE user_id = $1
        AND status = 'pending'
        AND attempts < 3
      ORDER BY local_timestamp ASC
      LIMIT 100
      `,
      [userId]
    );

    let synced = 0;
    let conflicts = 0;
    let errors = 0;

    for (const item of result.rows) {
      try {
        const success = await this.processSyncItem(item);

        if (success) {
          await this.markSynced(item.id);
          synced++;
        } else {
          await this.markConflict(item.id);
          conflicts++;
        }
      } catch (error) {
        await this.markError(item.id, (error as Error).message);
        errors++;
      }
    }

    return { synced, conflicts, errors };
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: any): Promise<boolean> {
    const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;

    switch (item.entity_type) {
      case 'visit_check_in':
        return await this.syncCheckIn(item, data);
      case 'expense':
        return await this.syncExpense(item, data);
      case 'visit_note':
        return await this.syncVisitNote(item, data);
      default:
        throw new Error(`Unknown entity type: ${item.entity_type}`);
    }
  }

  /**
   * Sync check-in data
   */
  private async syncCheckIn(item: any, data: any): Promise<boolean> {
    // Check if check-in already exists (server version)
    const existing = await pool.query(
      `
      SELECT * FROM visit_check_ins
      WHERE visit_id = $1
      `,
      [data.visit_id]
    );

    if (existing.rows.length > 0) {
      // Conflict: server has newer data
      const serverTimestamp = new Date(existing.rows[0].check_in_time);
      const localTimestamp = new Date(item.local_timestamp);

      if (serverTimestamp > localTimestamp) {
        return false; // Conflict: server wins
      }
    }

    // No conflict or local is newer: apply change
    if (item.operation === 'create' || item.operation === 'update') {
      await pool.query(
        `
        INSERT INTO visit_check_ins (
          visit_id,
          check_in_time,
          check_in_latitude,
          check_in_longitude,
          check_out_time,
          check_out_latitude,
          check_out_longitude,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (visit_id) DO UPDATE SET
          check_in_time = EXCLUDED.check_in_time,
          check_in_latitude = EXCLUDED.check_in_latitude,
          check_in_longitude = EXCLUDED.check_in_longitude,
          check_out_time = EXCLUDED.check_out_time,
          check_out_latitude = EXCLUDED.check_out_latitude,
          check_out_longitude = EXCLUDED.check_out_longitude,
          notes = EXCLUDED.notes
        `,
        [
          data.visit_id,
          data.check_in_time,
          data.check_in_latitude,
          data.check_in_longitude,
          data.check_out_time,
          data.check_out_latitude,
          data.check_out_longitude,
          data.notes
        ]
      );
    }

    return true;
  }

  /**
   * Sync expense data
   */
  private async syncExpense(item: any, data: any): Promise<boolean> {
    if (item.operation === 'create') {
      // Check for duplicate
      const existing = await pool.query(
        `
        SELECT id FROM caregiver_expenses
        WHERE caregiver_id = $1
          AND expense_date = $2
          AND amount = $3
          AND created_at >= $4 - INTERVAL '1 hour'
        `,
        [data.caregiver_id, data.expense_date, data.amount, item.local_timestamp]
      );

      if (existing.rows.length > 0) {
        return true; // Already exists, mark as synced
      }

      await pool.query(
        `
        INSERT INTO caregiver_expenses (
          organization_id,
          caregiver_id,
          expense_type,
          amount,
          expense_date,
          description,
          receipt_url,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
        `,
        [
          item.organization_id,
          data.caregiver_id,
          data.expense_type,
          data.amount,
          data.expense_date,
          data.description,
          data.receipt_url
        ]
      );
    }

    return true;
  }

  /**
   * Sync visit notes
   */
  private async syncVisitNote(item: any, data: any): Promise<boolean> {
    // Check if note already exists
    const existing = await pool.query(
      `
      SELECT * FROM care_notes
      WHERE visit_id = $1
      `,
      [data.visit_id]
    );

    if (existing.rows.length > 0) {
      // Conflict check
      const serverUpdated = new Date(existing.rows[0].updated_at);
      const localUpdated = new Date(item.local_timestamp);

      if (serverUpdated > localUpdated) {
        return false; // Server version is newer
      }
    }

    if (item.operation === 'create' || item.operation === 'update') {
      await pool.query(
        `
        INSERT INTO care_notes (
          visit_id,
          caregiver_id,
          note_type,
          content,
          created_at
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (visit_id) DO UPDATE SET
          content = EXCLUDED.content,
          updated_at = NOW()
        `,
        [
          data.visit_id,
          data.caregiver_id,
          data.note_type,
          data.content,
          item.local_timestamp
        ]
      );
    }

    return true;
  }

  /**
   * Mark item as synced
   */
  private async markSynced(itemId: string): Promise<void> {
    await pool.query(
      `
      UPDATE offline_sync_queue
      SET status = 'synced',
          server_timestamp = NOW(),
          attempts = attempts + 1,
          last_attempt = NOW()
      WHERE id = $1
      `,
      [itemId]
    );
  }

  /**
   * Mark item as conflicted
   */
  private async markConflict(itemId: string): Promise<void> {
    await pool.query(
      `
      UPDATE offline_sync_queue
      SET status = 'conflict',
          attempts = attempts + 1,
          last_attempt = NOW()
      WHERE id = $1
      `,
      [itemId]
    );
  }

  /**
   * Mark item as error
   */
  private async markError(itemId: string, error: string): Promise<void> {
    await pool.query(
      `
      UPDATE offline_sync_queue
      SET status = 'error',
          attempts = attempts + 1,
          last_attempt = NOW(),
          error = $2
      WHERE id = $1
      `,
      [itemId, error]
    );
  }

  /**
   * Get sync status for user
   */
  async getSyncStatus(userId: string): Promise<{
    pending: number;
    synced: number;
    conflicts: number;
    errors: number;
    lastSync: Date | null;
  }> {
    const result = await pool.query(
      `
      SELECT
        status,
        COUNT(*) as count
      FROM offline_sync_queue
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY status
      `,
      [userId]
    );

    const lastSyncResult = await pool.query(
      `
      SELECT MAX(server_timestamp) as last_sync
      FROM offline_sync_queue
      WHERE user_id = $1 AND status = 'synced'
      `,
      [userId]
    );

    const statusCounts = {
      pending: 0,
      synced: 0,
      conflicts: 0,
      errors: 0
    };

    result.rows.forEach(row => {
      statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count);
    });

    return {
      ...statusCounts,
      lastSync: lastSyncResult.rows[0]?.last_sync || null
    };
  }

  /**
   * Get conflicts for resolution
   */
  async getConflicts(userId: string): Promise<SyncQueueItem[]> {
    const result = await pool.query(
      `
      SELECT *
      FROM offline_sync_queue
      WHERE user_id = $1
        AND status = 'conflict'
      ORDER BY local_timestamp DESC
      LIMIT 50
      `,
      [userId]
    );

    return result.rows;
  }

  /**
   * Resolve conflict (choose local or server version)
   */
  async resolveConflict(
    itemId: string,
    resolution: 'use_local' | 'use_server' | 'merge'
  ): Promise<void> {
    const item = await pool.query(
      `
      SELECT * FROM offline_sync_queue WHERE id = $1
      `,
      [itemId]
    );

    if (item.rows.length === 0) {
      throw new Error('Conflict item not found');
    }

    const queueItem = item.rows[0];

    if (resolution === 'use_local') {
      // Force apply local version
      await this.processSyncItem(queueItem);
      await this.markSynced(itemId);
    } else if (resolution === 'use_server') {
      // Discard local version
      await pool.query(
        `
        DELETE FROM offline_sync_queue WHERE id = $1
        `,
        [itemId]
      );
    } else {
      // Merge - application-specific logic
      throw new Error('Merge resolution not yet implemented');
    }
  }

  /**
   * Clean old synced items
   */
  async cleanOldItems(daysOld: number = 30): Promise<number> {
    const result = await pool.query(
      `
      DELETE FROM offline_sync_queue
      WHERE status = 'synced'
        AND server_timestamp < NOW() - INTERVAL '${daysOld} days'
      `
    );

    return result.rowCount || 0;
  }
}

export const offlineSyncService = new OfflineSyncService();
