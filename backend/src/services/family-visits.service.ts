/**
 * Family Visit Updates Service
 * Provides real-time visit notifications and updates for family members
 *
 * Phase 3, Months 9-10 - Family Portal
 */

import { getDbClient } from '../database/client';

interface VisitUpdateData {
  clientId: string;
  shiftId?: string;
  updateCode: string;
  title: string;
  message: string;
  details?: any;
  caregiverId?: string;
  caregiverName?: string;
}

interface VisitFilters {
  fromDate?: string;
  toDate?: string;
  updateType?: string;
  unreadOnly?: boolean;
}

export class FamilyVisitsService {
  /**
   * Get visit update types
   */
  async getUpdateTypes(): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM visit_update_types WHERE is_active = TRUE ORDER BY severity, name`
    );

    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon: row.icon,
      severity: row.severity,
    }));
  }

  /**
   * Create a visit update (called when visit events occur)
   */
  async createVisitUpdate(
    organizationId: string,
    data: VisitUpdateData
  ): Promise<any> {
    const db = await getDbClient();

    // Get update type
    const typeResult = await db.query(
      `SELECT id FROM visit_update_types WHERE code = $1`,
      [data.updateCode]
    );

    const updateTypeId = typeResult.rows[0]?.id;

    const result = await db.query(
      `
      INSERT INTO family_visit_updates (
        organization_id, client_id, shift_id,
        update_type_id, update_code,
        title, message, details,
        caregiver_id, caregiver_name,
        occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `,
      [
        organizationId,
        data.clientId,
        data.shiftId || null,
        updateTypeId || null,
        data.updateCode,
        data.title,
        data.message,
        JSON.stringify(data.details || {}),
        data.caregiverId || null,
        data.caregiverName || null,
      ]
    );

    const update = result.rows[0];

    // Queue notifications for family members who have this notification enabled
    await this.queueFamilyNotifications(organizationId, data.clientId, update);

    return update;
  }

  /**
   * Queue notifications for family members
   */
  private async queueFamilyNotifications(
    organizationId: string,
    clientId: string,
    update: any
  ): Promise<void> {
    const db = await getDbClient();

    // Get family members with relevant notifications enabled
    const notificationField = this.getNotificationField(update.update_code);

    const familyMembers = await db.query(
      `
      SELECT id, notification_method
      FROM family_members
      WHERE client_id = $1
        AND organization_id = $2
        AND status = 'active'
        AND ${notificationField} = TRUE
    `,
      [clientId, organizationId]
    );

    // Queue notifications
    for (const member of familyMembers.rows) {
      await db.query(
        `
        INSERT INTO family_notifications (
          family_member_id,
          notification_type, title, body, data,
          send_push, send_email, send_sms
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8
        )
      `,
        [
          member.id,
          update.update_code,
          update.title,
          update.message,
          JSON.stringify({
            updateId: update.id,
            shiftId: update.shift_id,
            caregiverId: update.caregiver_id,
          }),
          member.notification_method === 'push' ||
            member.notification_method === 'both',
          member.notification_method === 'email' ||
            member.notification_method === 'both',
          member.notification_method === 'sms',
        ]
      );
    }
  }

  /**
   * Map update code to notification preference field
   */
  private getNotificationField(updateCode: string): string {
    const mapping: Record<string, string> = {
      visit_started: 'notify_visit_start',
      visit_ended: 'notify_visit_end',
      visit_running_late: 'notify_schedule_changes',
      visit_cancelled: 'notify_schedule_changes',
      visit_rescheduled: 'notify_schedule_changes',
      caregiver_changed: 'notify_schedule_changes',
      care_note_added: 'notify_care_updates',
      incident_reported: 'notify_care_updates',
      medication_reminder: 'notify_care_updates',
      vital_recorded: 'notify_care_updates',
    };

    return mapping[updateCode] || 'notify_care_updates';
  }

  /**
   * Get visit updates for a family member
   */
  async getVisitUpdates(
    familyMemberId: string,
    clientId: string,
    filters: VisitFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        fvu.*,
        vut.name AS update_type_name,
        vut.icon AS update_type_icon,
        vut.severity,
        (SELECT fur.read_at FROM family_update_reads fur
         WHERE fur.update_id = fvu.id AND fur.family_member_id = $1) AS read_at
      FROM family_visit_updates fvu
      LEFT JOIN visit_update_types vut ON vut.id = fvu.update_type_id
      WHERE fvu.client_id = $2
    `;

    const params: any[] = [familyMemberId, clientId];
    let paramIndex = 3;

    if (filters.fromDate) {
      query += ` AND fvu.occurred_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND fvu.occurred_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    if (filters.updateType) {
      query += ` AND fvu.update_code = $${paramIndex++}`;
      params.push(filters.updateType);
    }

    if (filters.unreadOnly) {
      query += ` AND NOT EXISTS (
        SELECT 1 FROM family_update_reads fur
        WHERE fur.update_id = fvu.id AND fur.family_member_id = $1
      )`;
    }

    query += ` ORDER BY fvu.occurred_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      shiftId: row.shift_id,
      updateCode: row.update_code,
      updateType: row.update_type_name,
      icon: row.update_type_icon,
      severity: row.severity,
      title: row.title,
      message: row.message,
      details: row.details,
      caregiver: row.caregiver_id
        ? {
            id: row.caregiver_id,
            name: row.caregiver_name,
          }
        : null,
      occurredAt: row.occurred_at,
      readAt: row.read_at,
      isRead: !!row.read_at,
    }));
  }

  /**
   * Get recent visit updates (last 7 days) for family member
   */
  async getRecentUpdates(
    familyMemberId: string,
    clientId: string,
    limit: number = 20
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        fvu.*,
        vut.name AS update_type_name,
        vut.icon AS update_type_icon,
        vut.severity,
        (SELECT fur.read_at FROM family_update_reads fur
         WHERE fur.update_id = fvu.id AND fur.family_member_id = $1) AS read_at
      FROM family_visit_updates fvu
      LEFT JOIN visit_update_types vut ON vut.id = fvu.update_type_id
      WHERE fvu.client_id = $2
        AND fvu.occurred_at >= NOW() - INTERVAL '7 days'
      ORDER BY fvu.occurred_at DESC
      LIMIT $3
    `,
      [familyMemberId, clientId, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      shiftId: row.shift_id,
      updateCode: row.update_code,
      updateType: row.update_type_name,
      icon: row.update_type_icon,
      severity: row.severity,
      title: row.title,
      message: row.message,
      details: row.details,
      caregiver: row.caregiver_id
        ? {
            id: row.caregiver_id,
            name: row.caregiver_name,
          }
        : null,
      occurredAt: row.occurred_at,
      readAt: row.read_at,
      isRead: !!row.read_at,
    }));
  }

  /**
   * Mark update as read
   */
  async markAsRead(
    familyMemberId: string,
    updateId: string
  ): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `
      INSERT INTO family_update_reads (update_id, family_member_id)
      VALUES ($1, $2)
      ON CONFLICT (update_id, family_member_id) DO NOTHING
    `,
      [updateId, familyMemberId]
    );
  }

  /**
   * Mark all updates as read for a client
   */
  async markAllAsRead(
    familyMemberId: string,
    clientId: string
  ): Promise<number> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO family_update_reads (update_id, family_member_id)
      SELECT fvu.id, $1
      FROM family_visit_updates fvu
      WHERE fvu.client_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM family_update_reads fur
          WHERE fur.update_id = fvu.id AND fur.family_member_id = $1
        )
    `,
      [familyMemberId, clientId]
    );

    return result.rowCount ?? 0;
  }

  /**
   * Get unread count for a family member
   */
  async getUnreadCount(
    familyMemberId: string,
    clientId: string
  ): Promise<number> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM family_visit_updates fvu
      WHERE fvu.client_id = $2
        AND fvu.occurred_at >= NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM family_update_reads fur
          WHERE fur.update_id = fvu.id AND fur.family_member_id = $1
        )
    `,
      [familyMemberId, clientId]
    );

    return parseInt(result.rows[0]?.count) || 0;
  }

  // ============================================
  // SCHEDULE VIEW FOR FAMILY
  // ============================================

  /**
   * Get upcoming schedule for a client (family view)
   */
  async getUpcomingSchedule(
    clientId: string,
    days: number = 7
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        s.id,
        s.start_time,
        s.end_time,
        s.status,
        cg.id AS caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        cg.phone AS caregiver_phone
      FROM shifts s
      JOIN caregivers cg ON cg.id = s.caregiver_id
      WHERE s.client_id = $1
        AND s.start_time >= NOW()
        AND s.start_time <= NOW() + ($2 || ' days')::INTERVAL
        AND s.status NOT IN ('cancelled', 'missed')
      ORDER BY s.start_time
    `,
      [clientId, days]
    );

    return result.rows.map((row) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      caregiver: {
        id: row.caregiver_id,
        name: row.caregiver_name,
        phone: row.caregiver_phone,
      },
    }));
  }

  /**
   * Get past visits for a client (family view)
   */
  async getPastVisits(
    clientId: string,
    limit: number = 20
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        s.id,
        s.start_time,
        s.end_time,
        s.clock_in_time,
        s.clock_out_time,
        s.status,
        cg.id AS caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        (SELECT COUNT(*) FROM family_visit_updates fvu
         WHERE fvu.shift_id = s.id) AS update_count
      FROM shifts s
      JOIN caregivers cg ON cg.id = s.caregiver_id
      WHERE s.client_id = $1
        AND s.end_time < NOW()
      ORDER BY s.start_time DESC
      LIMIT $2
    `,
      [clientId, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      scheduledStart: row.start_time,
      scheduledEnd: row.end_time,
      actualStart: row.clock_in_time,
      actualEnd: row.clock_out_time,
      status: row.status,
      caregiver: {
        id: row.caregiver_id,
        name: row.caregiver_name,
      },
      updateCount: parseInt(row.update_count) || 0,
    }));
  }

  /**
   * Get today's visit status
   */
  async getTodayStatus(clientId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        s.id,
        s.start_time,
        s.end_time,
        s.clock_in_time,
        s.clock_out_time,
        s.status,
        cg.id AS caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        cg.phone AS caregiver_phone
      FROM shifts s
      JOIN caregivers cg ON cg.id = s.caregiver_id
      WHERE s.client_id = $1
        AND DATE(s.start_time) = CURRENT_DATE
      ORDER BY s.start_time
    `,
      [clientId]
    );

    if (result.rows.length === 0) {
      return { hasVisitToday: false, visits: [] };
    }

    return {
      hasVisitToday: true,
      visits: result.rows.map((row) => ({
        id: row.id,
        scheduledStart: row.start_time,
        scheduledEnd: row.end_time,
        actualStart: row.clock_in_time,
        actualEnd: row.clock_out_time,
        status: row.status,
        isInProgress: row.clock_in_time && !row.clock_out_time,
        caregiver: {
          id: row.caregiver_id,
          name: row.caregiver_name,
          phone: row.caregiver_phone,
        },
      })),
    };
  }

  /**
   * Get care team for a client (family view)
   */
  async getCareTeam(clientId: string): Promise<any[]> {
    const db = await getDbClient();

    // Get caregivers who have worked with this client in the last 30 days
    const result = await db.query(
      `
      SELECT DISTINCT ON (cg.id)
        cg.id,
        cg.first_name || ' ' || cg.last_name AS name,
        cg.phone,
        (SELECT COUNT(*) FROM shifts s
         WHERE s.caregiver_id = cg.id
           AND s.client_id = $1
           AND s.status = 'completed'
           AND s.end_time >= NOW() - INTERVAL '30 days') AS recent_visits,
        (SELECT MAX(s.end_time) FROM shifts s
         WHERE s.caregiver_id = cg.id
           AND s.client_id = $1
           AND s.status = 'completed') AS last_visit
      FROM caregivers cg
      JOIN shifts s ON s.caregiver_id = cg.id
      WHERE s.client_id = $1
        AND s.end_time >= NOW() - INTERVAL '60 days'
        AND cg.status = 'active'
      ORDER BY cg.id, s.end_time DESC
    `,
      [clientId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      recentVisits: parseInt(row.recent_visits) || 0,
      lastVisit: row.last_visit,
    }));
  }

  // ============================================
  // TRIGGER UPDATES FROM VISIT EVENTS
  // ============================================

  /**
   * Trigger visit started update
   */
  async triggerVisitStarted(
    organizationId: string,
    shiftId: string,
    caregiverId: string,
    caregiverName: string,
    clientId: string
  ): Promise<void> {
    await this.createVisitUpdate(organizationId, {
      clientId,
      shiftId,
      updateCode: 'visit_started',
      title: 'Visit Started',
      message: `${caregiverName} has arrived and checked in for today's visit.`,
      caregiverId,
      caregiverName,
      details: { checkedInAt: new Date().toISOString() },
    });
  }

  /**
   * Trigger visit ended update
   */
  async triggerVisitEnded(
    organizationId: string,
    shiftId: string,
    caregiverId: string,
    caregiverName: string,
    clientId: string,
    duration: number
  ): Promise<void> {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationText =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;

    await this.createVisitUpdate(organizationId, {
      clientId,
      shiftId,
      updateCode: 'visit_ended',
      title: 'Visit Completed',
      message: `${caregiverName} has completed today's visit. Duration: ${durationText}.`,
      caregiverId,
      caregiverName,
      details: { duration, checkedOutAt: new Date().toISOString() },
    });
  }

  /**
   * Trigger caregiver running late
   */
  async triggerRunningLate(
    organizationId: string,
    shiftId: string,
    caregiverId: string,
    caregiverName: string,
    clientId: string,
    estimatedArrival: string
  ): Promise<void> {
    await this.createVisitUpdate(organizationId, {
      clientId,
      shiftId,
      updateCode: 'visit_running_late',
      title: 'Running Late',
      message: `${caregiverName} is running a bit late. Estimated arrival: ${estimatedArrival}.`,
      caregiverId,
      caregiverName,
      details: { estimatedArrival },
    });
  }

  /**
   * Trigger visit cancelled
   */
  async triggerVisitCancelled(
    organizationId: string,
    shiftId: string,
    clientId: string,
    reason: string
  ): Promise<void> {
    await this.createVisitUpdate(organizationId, {
      clientId,
      shiftId,
      updateCode: 'visit_cancelled',
      title: 'Visit Cancelled',
      message: `Today's visit has been cancelled. ${reason}`,
      details: { reason },
    });
  }

  /**
   * Trigger caregiver changed
   */
  async triggerCaregiverChanged(
    organizationId: string,
    shiftId: string,
    clientId: string,
    oldCaregiverName: string,
    newCaregiverId: string,
    newCaregiverName: string,
    reason?: string
  ): Promise<void> {
    await this.createVisitUpdate(organizationId, {
      clientId,
      shiftId,
      updateCode: 'caregiver_changed',
      title: 'Caregiver Changed',
      message: `${newCaregiverName} will be providing care instead of ${oldCaregiverName}.${reason ? ` Reason: ${reason}` : ''}`,
      caregiverId: newCaregiverId,
      caregiverName: newCaregiverName,
      details: { oldCaregiverName, reason },
    });
  }
}

export const familyVisitsService = new FamilyVisitsService();
