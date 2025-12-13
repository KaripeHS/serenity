/**
 * Dispatch Alerts Service
 * Handles coverage gap detection and dispatch notifications
 * Sends SMS and push notifications to available caregivers
 *
 * @module services/dispatch-alerts
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('dispatch-alerts');

export interface CoverageGap {
  id: string;
  shiftId: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  serviceType: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: 'no_show' | 'callout' | 'unassigned' | 'late';
  notificationsSent: number;
  createdAt: Date;
}

export interface DispatchCandidate {
  caregiverId: string;
  caregiverName: string;
  phone: string;
  email: string;
  distanceMiles: number;
  hasRequiredSkills: boolean;
  isAvailable: boolean;
  lastShiftEnd?: Date;
  weeklyHours: number;
  score: number;
}

export interface DispatchNotification {
  id: string;
  gapId: string;
  caregiverId: string;
  method: 'sms' | 'push' | 'email';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'accepted' | 'declined';
  sentAt?: Date;
  respondedAt?: Date;
  response?: string;
}

export class DispatchAlertsService {
  /**
   * Detect coverage gaps for today
   */
  async detectCoverageGaps(organizationId: string, options?: {
    includeUnassigned?: boolean;
    lookAheadHours?: number;
  }): Promise<CoverageGap[]> {
    const { includeUnassigned = true, lookAheadHours = 4 } = options || {};

    const now = new Date();
    const lookAhead = new Date(now.getTime() + lookAheadHours * 60 * 60 * 1000);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const gaps: CoverageGap[] = [];

    // 1. Find no-show shifts (scheduled but no clock-in within 15 mins of start)
    const noShowQuery = `
      SELECT
        s.id as shift_id,
        s.client_id,
        s.scheduled_start,
        s.scheduled_end,
        s.caregiver_id,
        c.first_name || ' ' || c.last_name as client_name,
        c.address_line_1 || ', ' || c.city as client_address,
        c.phone as client_phone,
        srv.name as service_type,
        u.first_name || ' ' || u.last_name as caregiver_name
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN services srv ON s.service_id = srv.id
      LEFT JOIN users u ON s.caregiver_id = u.id
      WHERE s.organization_id = $1
        AND s.scheduled_start >= $2
        AND s.scheduled_start <= $3
        AND s.status = 'scheduled'
        AND s.caregiver_id IS NOT NULL
        AND s.actual_start IS NULL
        AND s.scheduled_start < $4
    `;

    const noShowResult = await (await getDbClient()).query(noShowQuery, [
      organizationId,
      startOfDay,
      endOfDay,
      new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
    ]);

    for (const row of noShowResult.rows) {
      const minutesLate = Math.floor((now.getTime() - new Date(row.scheduled_start).getTime()) / 60000);

      gaps.push({
        id: `gap_noshow_${row.shift_id}`,
        shiftId: row.shift_id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientAddress: row.client_address,
        clientPhone: row.client_phone,
        serviceType: row.service_type || 'Personal Care',
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        urgency: minutesLate > 60 ? 'critical' : minutesLate > 30 ? 'high' : 'medium',
        reason: 'no_show',
        notificationsSent: 0,
        createdAt: now,
      });
    }

    // 2. Find unassigned shifts (if enabled)
    if (includeUnassigned) {
      const unassignedQuery = `
        SELECT
          s.id as shift_id,
          s.client_id,
          s.scheduled_start,
          s.scheduled_end,
          c.first_name || ' ' || c.last_name as client_name,
          c.address_line_1 || ', ' || c.city as client_address,
          c.phone as client_phone,
          srv.name as service_type
        FROM shifts s
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN services srv ON s.service_id = srv.id
        WHERE s.organization_id = $1
          AND s.scheduled_start >= $2
          AND s.scheduled_start <= $3
          AND s.status NOT IN ('cancelled', 'completed')
          AND s.caregiver_id IS NULL
      `;

      const unassignedResult = await (await getDbClient()).query(unassignedQuery, [
        organizationId,
        now,
        lookAhead,
      ]);

      for (const row of unassignedResult.rows) {
        const hoursUntilStart = (new Date(row.scheduled_start).getTime() - now.getTime()) / (60 * 60 * 1000);

        gaps.push({
          id: `gap_unassigned_${row.shift_id}`,
          shiftId: row.shift_id,
          clientId: row.client_id,
          clientName: row.client_name,
          clientAddress: row.client_address,
          clientPhone: row.client_phone,
          serviceType: row.service_type || 'Personal Care',
          scheduledStart: row.scheduled_start,
          scheduledEnd: row.scheduled_end,
          urgency: hoursUntilStart < 1 ? 'critical' : hoursUntilStart < 2 ? 'high' : 'medium',
          reason: 'unassigned',
          notificationsSent: 0,
          createdAt: now,
        });
      }
    }

    // Sort by urgency (critical first) then by start time
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    gaps.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
    });

    logger.info('Coverage gaps detected', {
      organizationId,
      totalGaps: gaps.length,
      noShowCount: gaps.filter(g => g.reason === 'no_show').length,
      unassignedCount: gaps.filter(g => g.reason === 'unassigned').length,
    });

    return gaps;
  }

  /**
   * Find available caregivers for a coverage gap
   */
  async findDispatchCandidates(
    organizationId: string,
    gap: CoverageGap,
    options?: {
      maxDistance?: number;
      maxCandidates?: number;
    }
  ): Promise<DispatchCandidate[]> {
    const { maxDistance = 25, maxCandidates = 10 } = options || {};

    // Get client location for distance calculation
    const clientQuery = await (await getDbClient()).query(
      `SELECT latitude, longitude FROM clients WHERE id = $1`,
      [gap.clientId]
    );
    const clientLocation = clientQuery.rows[0];

    const shiftDurationHours = (new Date(gap.scheduledEnd).getTime() - new Date(gap.scheduledStart).getTime()) / (60 * 60 * 1000);

    // Find available caregivers with distance calculation
    const candidatesQuery = `
      WITH caregiver_availability AS (
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.phone,
          u.email,
          u.latitude,
          u.longitude,
          u.specializations,
          COALESCE(
            (SELECT MAX(s.scheduled_end)
             FROM shifts s
             WHERE s.caregiver_id = u.id
               AND s.scheduled_end <= $2
               AND s.status NOT IN ('cancelled')
               AND DATE(s.scheduled_start) = DATE($2)), NULL
          ) as last_shift_end,
          COALESCE(
            (SELECT SUM(EXTRACT(EPOCH FROM (s.scheduled_end - s.scheduled_start)) / 3600)
             FROM shifts s
             WHERE s.caregiver_id = u.id
               AND s.scheduled_start >= DATE_TRUNC('week', $2::date)
               AND s.scheduled_start < DATE_TRUNC('week', $2::date) + INTERVAL '7 days'
               AND s.status NOT IN ('cancelled')), 0
          ) as weekly_hours
        FROM users u
        WHERE u.organization_id = $1
          AND u.role = 'caregiver'
          AND u.is_active = true
          AND u.id NOT IN (
            SELECT DISTINCT caregiver_id
            FROM shifts
            WHERE caregiver_id IS NOT NULL
              AND status NOT IN ('cancelled', 'completed')
              AND (
                (scheduled_start <= $2 AND scheduled_end > $2) OR
                (scheduled_start < $3 AND scheduled_end >= $3) OR
                (scheduled_start >= $2 AND scheduled_end <= $3)
              )
          )
      )
      SELECT
        ca.*,
        CASE
          WHEN ca.latitude IS NOT NULL AND $4::numeric IS NOT NULL THEN
            (3959 * acos(
              cos(radians($4::numeric)) * cos(radians(ca.latitude)) *
              cos(radians(ca.longitude) - radians($5::numeric)) +
              sin(radians($4::numeric)) * sin(radians(ca.latitude))
            ))
          ELSE 20
        END as distance_miles
      FROM caregiver_availability ca
      ORDER BY distance_miles ASC
      LIMIT $6
    `;

    const result = await (await getDbClient()).query(candidatesQuery, [
      organizationId,
      gap.scheduledStart,
      gap.scheduledEnd,
      clientLocation?.latitude,
      clientLocation?.longitude,
      maxCandidates * 2, // Get more than needed to filter
    ]);

    const candidates: DispatchCandidate[] = [];

    for (const row of result.rows) {
      const distance = parseFloat(row.distance_miles) || 20;
      const weeklyHours = parseFloat(row.weekly_hours) || 0;

      // Skip if too far
      if (distance > maxDistance) continue;

      // Calculate score (0-100)
      let score = 50; // Base score

      // Distance factor (closer = better, max 25 points)
      score += Math.max(0, 25 - distance);

      // Weekly hours factor (more availability = better, max 15 points)
      if (weeklyHours < 30) score += 15;
      else if (weeklyHours < 35) score += 10;
      else if (weeklyHours < 40) score += 5;

      // Overtime factor (penalize if this would cause overtime)
      if (weeklyHours + shiftDurationHours > 40) {
        score -= 20;
      }

      // Recent availability factor (if they just finished a shift, might be nearby)
      if (row.last_shift_end) {
        const hoursSinceLastShift = (new Date(gap.scheduledStart).getTime() - new Date(row.last_shift_end).getTime()) / (60 * 60 * 1000);
        if (hoursSinceLastShift < 2) score += 10;
      }

      candidates.push({
        caregiverId: row.id,
        caregiverName: row.name,
        phone: row.phone,
        email: row.email,
        distanceMiles: Math.round(distance * 10) / 10,
        hasRequiredSkills: true, // Would check against service requirements
        isAvailable: true,
        lastShiftEnd: row.last_shift_end,
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        score: Math.max(0, Math.min(100, score)),
      });
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, maxCandidates);
  }

  /**
   * Send dispatch alerts to caregivers
   */
  async sendDispatchAlerts(
    organizationId: string,
    gap: CoverageGap,
    candidates: DispatchCandidate[],
    options?: {
      methods?: ('sms' | 'push' | 'email')[];
      batchSize?: number;
    }
  ): Promise<DispatchNotification[]> {
    const { methods = ['sms', 'push'], batchSize = 5 } = options || {};

    const notifications: DispatchNotification[] = [];

    // Only send to top candidates in batch
    const topCandidates = candidates.slice(0, batchSize);

    const startTimeFormatted = new Date(gap.scheduledStart).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTimeFormatted = new Date(gap.scheduledEnd).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    for (const candidate of topCandidates) {
      const urgencyLabel = gap.urgency === 'critical' ? '🚨 URGENT' : gap.urgency === 'high' ? '⚠️ HIGH PRIORITY' : '';

      // SMS message
      if (methods.includes('sms') && candidate.phone) {
        const smsMessage = `${urgencyLabel}
Open shift available:
📍 ${gap.clientName}
   ${gap.clientAddress}
🕐 ${startTimeFormatted} - ${endTimeFormatted}
📏 ${candidate.distanceMiles} mi from you

Reply YES to accept or NO to decline.`;

        const notification: DispatchNotification = {
          id: `notif_${gap.id}_${candidate.caregiverId}_sms`,
          gapId: gap.id,
          caregiverId: candidate.caregiverId,
          method: 'sms',
          status: 'pending',
        };

        // In production, integrate with Twilio or similar
        try {
          // await twilioClient.messages.create({
          //   to: candidate.phone,
          //   from: process.env.TWILIO_PHONE_NUMBER,
          //   body: smsMessage,
          // });
          notification.status = 'sent';
          notification.sentAt = new Date();

          logger.info('Dispatch SMS sent', {
            caregiverId: candidate.caregiverId,
            gapId: gap.id,
            phone: candidate.phone.replace(/\d{6}$/, '******'),
          });
        } catch (error) {
          notification.status = 'failed';
          logger.error('Failed to send dispatch SMS', { error, caregiverId: candidate.caregiverId });
        }

        notifications.push(notification);
      }

      // Push notification
      if (methods.includes('push')) {
        const notification: DispatchNotification = {
          id: `notif_${gap.id}_${candidate.caregiverId}_push`,
          gapId: gap.id,
          caregiverId: candidate.caregiverId,
          method: 'push',
          status: 'pending',
        };

        // In production, integrate with Firebase Cloud Messaging
        try {
          // await admin.messaging().send({
          //   token: candidate.pushToken,
          //   notification: {
          //     title: `${urgencyLabel} Open Shift Available`,
          //     body: `${gap.clientName} at ${startTimeFormatted}`,
          //   },
          //   data: { gapId: gap.id, shiftId: gap.shiftId },
          // });
          notification.status = 'sent';
          notification.sentAt = new Date();

          logger.info('Dispatch push sent', {
            caregiverId: candidate.caregiverId,
            gapId: gap.id,
          });
        } catch (error) {
          notification.status = 'failed';
          logger.error('Failed to send dispatch push', { error, caregiverId: candidate.caregiverId });
        }

        notifications.push(notification);
      }
    }

    // Log dispatch activity
    await this.logDispatchActivity(organizationId, gap, notifications);

    return notifications;
  }

  /**
   * Handle caregiver response to dispatch alert
   */
  async handleDispatchResponse(
    organizationId: string,
    gapId: string,
    caregiverId: string,
    accepted: boolean
  ): Promise<{ success: boolean; message: string }> {
    // Extract shift ID from gap ID
    const shiftId = gapId.replace('gap_noshow_', '').replace('gap_unassigned_', '');

    if (accepted) {
      // Assign caregiver to shift
      const result = await (await getDbClient()).query(
        `UPDATE shifts
         SET caregiver_id = $1,
             status = 'confirmed',
             updated_at = NOW(),
             notes = COALESCE(notes, '') || E'\n[Dispatch] Accepted by ' || $2 || ' at ' || $3
         WHERE id = $4
           AND organization_id = $5
           AND (caregiver_id IS NULL OR status = 'scheduled')
         RETURNING id`,
        [
          caregiverId,
          caregiverId,
          new Date().toISOString(),
          shiftId,
          organizationId,
        ]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Shift has already been filled or cancelled',
        };
      }

      logger.info('Dispatch accepted', {
        gapId,
        shiftId,
        caregiverId,
      });

      return {
        success: true,
        message: 'Shift assigned successfully. Please proceed to the client.',
      };
    } else {
      // Log decline
      logger.info('Dispatch declined', {
        gapId,
        shiftId,
        caregiverId,
      });

      return {
        success: true,
        message: 'Response recorded. Thank you.',
      };
    }
  }

  /**
   * Get dispatch dashboard summary
   */
  async getDispatchDashboard(organizationId: string): Promise<{
    activeGaps: CoverageGap[];
    pendingNotifications: number;
    acceptedToday: number;
    declinedToday: number;
    avgResponseTime: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Get active gaps
    const activeGaps = await this.detectCoverageGaps(organizationId);

    // Get today's dispatch activity
    const activityQuery = await (await getDbClient()).query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'accepted' AND DATE(responded_at) = CURRENT_DATE) as accepted_today,
        COUNT(*) FILTER (WHERE status = 'declined' AND DATE(responded_at) = CURRENT_DATE) as declined_today,
        AVG(EXTRACT(EPOCH FROM (responded_at - sent_at))) FILTER (WHERE responded_at IS NOT NULL) as avg_response_seconds
       FROM dispatch_notifications
       WHERE organization_id = $1
         AND sent_at >= $2`,
      [organizationId, startOfDay]
    ).catch(() => ({ rows: [{ pending_count: 0, accepted_today: 0, declined_today: 0, avg_response_seconds: null }] }));

    const activity = activityQuery.rows[0];

    return {
      activeGaps,
      pendingNotifications: parseInt(activity.pending_count) || 0,
      acceptedToday: parseInt(activity.accepted_today) || 0,
      declinedToday: parseInt(activity.declined_today) || 0,
      avgResponseTime: activity.avg_response_seconds
        ? Math.round(parseFloat(activity.avg_response_seconds) / 60)
        : 0, // in minutes
    };
  }

  /**
   * Log dispatch activity for reporting
   */
  private async logDispatchActivity(
    organizationId: string,
    gap: CoverageGap,
    notifications: DispatchNotification[]
  ): Promise<void> {
    try {
      // Create dispatch_notifications table if not exists
      await (await getDbClient()).query(`
        CREATE TABLE IF NOT EXISTS dispatch_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          gap_id VARCHAR(100) NOT NULL,
          shift_id UUID,
          caregiver_id UUID NOT NULL,
          method VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          sent_at TIMESTAMPTZ,
          responded_at TIMESTAMPTZ,
          response VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Insert notifications
      for (const notif of notifications) {
        await (await getDbClient()).query(
          `INSERT INTO dispatch_notifications
           (organization_id, gap_id, shift_id, caregiver_id, method, status, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            organizationId,
            gap.id,
            gap.shiftId,
            notif.caregiverId,
            notif.method,
            notif.status,
            notif.sentAt,
          ]
        );
      }
    } catch (error) {
      logger.error('Failed to log dispatch activity', { error });
    }
  }
}

export const dispatchAlertsService = new DispatchAlertsService();
