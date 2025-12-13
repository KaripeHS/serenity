/**
 * Push Notification Service
 * Handles device registration, notification sending, and scheduling
 *
 * Supports:
 * - Firebase Cloud Messaging (FCM) for iOS and Android
 * - Shift reminders
 * - Dispatch alerts
 * - Training/credential reminders
 *
 * @module services/push-notification
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('push-notification-service');

// NOTE: In production, import firebase-admin and configure:
// import * as admin from 'firebase-admin';
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

export interface DeviceToken {
  id: string;
  userId: string;
  organizationId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  isActive: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  priority?: 'normal' | 'high';
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  token: string;
}

class PushNotificationService {
  /**
   * Register a device token
   */
  async registerDevice(
    userId: string,
    organizationId: string,
    data: {
      token: string;
      platform: 'ios' | 'android' | 'web';
      deviceId?: string;
      deviceName?: string;
    }
  ): Promise<DeviceToken> {
    const db = await getDbClient();

    // Upsert device token
    const result = await db.query(
      `INSERT INTO device_tokens (
        organization_id, user_id, token, platform, device_id, device_name
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, token) DO UPDATE SET
        platform = EXCLUDED.platform,
        device_id = EXCLUDED.device_id,
        device_name = EXCLUDED.device_name,
        is_active = TRUE,
        failed_count = 0,
        last_error = NULL,
        last_used_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        organizationId,
        userId,
        data.token,
        data.platform,
        data.deviceId,
        data.deviceName,
      ]
    );

    logger.info('Device registered', {
      userId,
      platform: data.platform,
      deviceId: data.deviceId,
    });

    return this.mapDeviceTokenRow(result.rows[0]);
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(userId: string, token: string): Promise<boolean> {
    const db = await getDbClient();

    const result = await db.query(
      `UPDATE device_tokens SET is_active = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND token = $2`,
      [userId, token]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get all active device tokens for a user
   */
  async getUserDevices(userId: string): Promise<DeviceToken[]> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM device_tokens
       WHERE user_id = $1 AND is_active = TRUE AND failed_count < 3`,
      [userId]
    );

    return result.rows.map(this.mapDeviceTokenRow);
  }

  /**
   * Send notification to a user
   */
  async sendToUser(
    userId: string,
    notification: NotificationPayload,
    options: {
      referenceType?: string;
      referenceId?: string;
    } = {}
  ): Promise<NotificationResult[]> {
    const devices = await this.getUserDevices(userId);

    if (devices.length === 0) {
      logger.warn('No active devices for user', { userId });
      return [];
    }

    const results: NotificationResult[] = [];

    for (const device of devices) {
      const result = await this.sendToDevice(device.token, notification, {
        platform: device.platform,
        userId,
        ...options,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Send notification to a specific device
   */
  async sendToDevice(
    token: string,
    notification: NotificationPayload,
    options: {
      platform?: 'ios' | 'android' | 'web';
      userId?: string;
      referenceType?: string;
      referenceId?: string;
    } = {}
  ): Promise<NotificationResult> {
    const db = await getDbClient();

    try {
      // In production, use Firebase Admin SDK:
      // const message = {
      //   token,
      //   notification: { title: notification.title, body: notification.body },
      //   data: notification.data,
      //   android: { priority: notification.priority === 'high' ? 'high' : 'normal' },
      //   apns: { headers: { 'apns-priority': notification.priority === 'high' ? '10' : '5' } }
      // };
      // const messageId = await admin.messaging().send(message);

      // For now, log and simulate success
      logger.info('Push notification sent', {
        token: token.substring(0, 20) + '...',
        title: notification.title,
        platform: options.platform,
      });

      // Log the notification
      if (options.userId) {
        await db.query(
          `INSERT INTO notification_log (
            user_id, channel, title, body, data, status, sent_at,
            reference_type, reference_id
          ) VALUES ($1, 'push', $2, $3, $4, 'sent', NOW(), $5, $6)`,
          [
            options.userId,
            notification.title,
            notification.body,
            JSON.stringify(notification.data || {}),
            options.referenceType,
            options.referenceId,
          ]
        );
      }

      // Update last used timestamp
      await db.query(
        `UPDATE device_tokens SET last_used_at = NOW() WHERE token = $1`,
        [token]
      );

      return {
        success: true,
        messageId: `sim-${Date.now()}`, // Simulated message ID
        token,
      };
    } catch (error: any) {
      logger.error('Failed to send push notification', {
        error: error.message,
        token: token.substring(0, 20) + '...',
      });

      // Mark token as failed
      await db.query(`SELECT mark_token_failed($1, $2)`, [token, error.message]);

      // Log the failure
      if (options.userId) {
        await db.query(
          `INSERT INTO notification_log (
            user_id, channel, title, body, data, status, error_message,
            reference_type, reference_id
          ) VALUES ($1, 'push', $2, $3, $4, 'failed', $5, $6, $7)`,
          [
            options.userId,
            notification.title,
            notification.body,
            JSON.stringify(notification.data || {}),
            error.message,
            options.referenceType,
            options.referenceId,
          ]
        );
      }

      return {
        success: false,
        error: error.message,
        token,
      };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    notification: NotificationPayload,
    options: {
      referenceType?: string;
      referenceId?: string;
    } = {}
  ): Promise<Map<string, NotificationResult[]>> {
    const results = new Map<string, NotificationResult[]>();

    for (const userId of userIds) {
      const userResults = await this.sendToUser(userId, notification, options);
      results.set(userId, userResults);
    }

    return results;
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(
    userId: string,
    organizationId: string,
    scheduledFor: Date,
    templateKey: string,
    templateData: Record<string, any>,
    referenceType: string,
    referenceId: string
  ): Promise<{ id: string }> {
    const db = await getDbClient();

    const result = await db.query(
      `INSERT INTO scheduled_notifications (
        organization_id, user_id, scheduled_for, template_key, template_data,
        reference_type, reference_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (reference_type, reference_id, template_key, scheduled_for) DO UPDATE SET
        template_data = EXCLUDED.template_data,
        status = 'pending'
      RETURNING id`,
      [
        organizationId,
        userId,
        scheduledFor,
        templateKey,
        JSON.stringify(templateData),
        referenceType,
        referenceId,
      ]
    );

    logger.info('Notification scheduled', {
      userId,
      templateKey,
      scheduledFor,
    });

    return { id: result.rows[0].id };
  }

  /**
   * Cancel scheduled notifications
   */
  async cancelScheduledNotifications(
    referenceType: string,
    referenceId: string
  ): Promise<number> {
    const db = await getDbClient();

    const result = await db.query(
      `UPDATE scheduled_notifications
       SET status = 'cancelled'
       WHERE reference_type = $1 AND reference_id = $2 AND status = 'pending'`,
      [referenceType, referenceId]
    );

    return result.rowCount || 0;
  }

  /**
   * Process pending scheduled notifications
   */
  async processPendingNotifications(): Promise<number> {
    const db = await getDbClient();

    // Get pending notifications that are due
    const result = await db.query(`
      SELECT
        sn.*,
        nt.title_template,
        nt.body_template,
        nt.data_template,
        nt.priority
      FROM scheduled_notifications sn
      JOIN notification_templates nt ON nt.template_key = sn.template_key
      WHERE sn.status = 'pending'
        AND sn.scheduled_for <= NOW()
      ORDER BY sn.scheduled_for
      LIMIT 100
    `);

    let processed = 0;

    for (const row of result.rows) {
      try {
        // Apply template data
        const templateData = row.template_data || {};
        let title = row.title_template;
        let body = row.body_template;
        let data = row.data_template || {};

        // Replace {{variable}} placeholders
        Object.entries(templateData).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          title = title.replace(regex, String(value));
          body = body.replace(regex, String(value));
          // Also replace in data values
          Object.keys(data).forEach((dataKey) => {
            if (typeof data[dataKey] === 'string') {
              data[dataKey] = data[dataKey].replace(regex, String(value));
            }
          });
        });

        // Send the notification
        await this.sendToUser(
          row.user_id,
          { title, body, data, priority: row.priority },
          { referenceType: row.reference_type, referenceId: row.reference_id }
        );

        // Mark as sent
        await db.query(
          `UPDATE scheduled_notifications
           SET status = 'sent', sent_at = NOW()
           WHERE id = $1`,
          [row.id]
        );

        processed++;
      } catch (error: any) {
        logger.error('Failed to process scheduled notification', {
          notificationId: row.id,
          error: error.message,
        });

        // Mark as failed
        await db.query(
          `UPDATE scheduled_notifications SET status = 'failed' WHERE id = $1`,
          [row.id]
        );
      }
    }

    if (processed > 0) {
      logger.info('Processed scheduled notifications', { count: processed });
    }

    return processed;
  }

  /**
   * Schedule shift reminders for upcoming shifts
   */
  async scheduleShiftReminders(organizationId: string): Promise<number> {
    const db = await getDbClient();

    // Get shifts needing reminders
    const result = await db.query(`
      SELECT * FROM users_needing_shift_reminders
      WHERE organization_id = $1
    `, [organizationId]);

    let scheduled = 0;

    for (const shift of result.rows) {
      // Schedule 1-hour reminder
      if (new Date(shift.reminder_1hr_at) > new Date()) {
        await this.scheduleNotification(
          shift.user_id,
          organizationId,
          new Date(shift.reminder_1hr_at),
          'shift_reminder_1hr',
          {
            shift_id: shift.shift_id,
            client_name: shift.client_name,
            start_time: new Date(shift.scheduled_start).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
          },
          'shift',
          shift.shift_id
        );
        scheduled++;
      }

      // Schedule 15-minute reminder
      if (new Date(shift.reminder_15min_at) > new Date()) {
        await this.scheduleNotification(
          shift.user_id,
          organizationId,
          new Date(shift.reminder_15min_at),
          'shift_reminder_15min',
          {
            shift_id: shift.shift_id,
            client_name: shift.client_name,
          },
          'shift',
          shift.shift_id
        );
        scheduled++;
      }
    }

    if (scheduled > 0) {
      logger.info('Shift reminders scheduled', { count: scheduled });
    }

    return scheduled;
  }

  /**
   * Send dispatch alert to available caregivers
   */
  async sendDispatchAlerts(
    organizationId: string,
    gapId: string,
    caregiverUserIds: string[],
    gapDetails: {
      clientName: string;
      serviceType: string;
      location: string;
      startTime: string;
    }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const userId of caregiverUserIds) {
      const userResults = await this.sendToUser(
        userId,
        {
          title: 'Coverage Needed',
          body: `${gapDetails.serviceType} coverage needed for ${gapDetails.clientName} at ${gapDetails.startTime}. Available?`,
          data: {
            type: 'dispatch',
            gap_id: gapId,
            action_url: `/dispatch/respond/${gapId}`,
          },
          priority: 'high',
        },
        { referenceType: 'dispatch_gap', referenceId: gapId }
      );
      results.push(...userResults);
    }

    return results;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return defaults
      return {
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: true,
        shiftReminders: true,
        dispatchAlerts: true,
        trainingReminders: true,
        credentialAlerts: true,
        bonusNotifications: true,
        timeOffUpdates: true,
        quietHoursEnabled: false,
      };
    }

    const row = result.rows[0];
    return {
      pushEnabled: row.push_enabled,
      smsEnabled: row.sms_enabled,
      emailEnabled: row.email_enabled,
      shiftReminders: row.shift_reminders,
      dispatchAlerts: row.dispatch_alerts,
      trainingReminders: row.training_reminders,
      credentialAlerts: row.credential_alerts,
      bonusNotifications: row.bonus_notifications,
      timeOffUpdates: row.time_off_updates,
      quietHoursEnabled: row.quiet_hours_enabled,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      quietHoursTimezone: row.quiet_hours_timezone,
    };
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `INSERT INTO notification_preferences (
        user_id, push_enabled, sms_enabled, email_enabled,
        shift_reminders, dispatch_alerts, training_reminders,
        credential_alerts, bonus_notifications, time_off_updates,
        quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id) DO UPDATE SET
        push_enabled = COALESCE($2, notification_preferences.push_enabled),
        sms_enabled = COALESCE($3, notification_preferences.sms_enabled),
        email_enabled = COALESCE($4, notification_preferences.email_enabled),
        shift_reminders = COALESCE($5, notification_preferences.shift_reminders),
        dispatch_alerts = COALESCE($6, notification_preferences.dispatch_alerts),
        training_reminders = COALESCE($7, notification_preferences.training_reminders),
        credential_alerts = COALESCE($8, notification_preferences.credential_alerts),
        bonus_notifications = COALESCE($9, notification_preferences.bonus_notifications),
        time_off_updates = COALESCE($10, notification_preferences.time_off_updates),
        quiet_hours_enabled = COALESCE($11, notification_preferences.quiet_hours_enabled),
        quiet_hours_start = COALESCE($12, notification_preferences.quiet_hours_start),
        quiet_hours_end = COALESCE($13, notification_preferences.quiet_hours_end),
        quiet_hours_timezone = COALESCE($14, notification_preferences.quiet_hours_timezone),
        updated_at = NOW()`,
      [
        userId,
        preferences.pushEnabled,
        preferences.smsEnabled,
        preferences.emailEnabled,
        preferences.shiftReminders,
        preferences.dispatchAlerts,
        preferences.trainingReminders,
        preferences.credentialAlerts,
        preferences.bonusNotifications,
        preferences.timeOffUpdates,
        preferences.quietHoursEnabled,
        preferences.quietHoursStart,
        preferences.quietHoursEnd,
        preferences.quietHoursTimezone,
      ]
    );

    logger.info('Notification preferences updated', { userId });
  }

  private mapDeviceTokenRow(row: any): DeviceToken {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      token: row.token,
      platform: row.platform,
      deviceId: row.device_id,
      deviceName: row.device_name,
      isActive: row.is_active,
    };
  }
}

export const pushNotificationService = new PushNotificationService();
