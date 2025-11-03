/**
 * Comprehensive Notifications Service for Serenity ERP
 * Handles AI-driven notifications, reminders, and PHI-free messaging
 */

import { DatabaseClient } from '../database/client';
import { AuditLogger } from '../audit/logger';
import { UserContext, UserRole } from '../auth/access-control';
import { createLogger, apiLogger } from '../utils/logger';

export interface Notification {
  id: string;
  organizationId: string;
  userId?: string;
  userRole?: UserRole;
  type: NotificationType;
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  isRead: boolean;
  isSent: boolean;
  sendAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum NotificationType {
  REMINDER = 'reminder',
  ALERT = 'alert',
  WARNING = 'warning',
  INFO = 'info',
  TASK = 'task',
  APPROVAL = 'approval',
  SYSTEM = 'system'
}

export enum NotificationCategory {
  EVV = 'evv',
  SCHEDULING = 'scheduling',
  CREDENTIALING = 'credentialing',
  BILLING = 'billing',
  HR = 'hr',
  COMPLIANCE = 'compliance',
  SECURITY = 'security',
  SYSTEM = 'system',
  FAMILY = 'family'
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerEvent: string;
  conditions: NotificationCondition[];
  recipients: NotificationRecipient[];
  template: NotificationTemplate;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface NotificationRecipient {
  type: 'user' | 'role' | 'email' | 'phone';
  target: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
}

export interface NotificationTemplate {
  title: string;
  message: string;
  variables: string[];
  isPhiSafe: boolean;
}

export interface NotificationChannel {
  name: string;
  isEnabled: boolean;
  config: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  sent: number;
  read: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byChannel: Record<string, number>;
}

export class NotificationsService {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
    this.initializeChannels();
  }

  /**
   * Initialize notification channels
   */
  private initializeChannels(): void {
    this.channels.set('email', {
      name: 'Email',
      isEnabled: true,
      config: {
        smtpHost: process.env.SMTP_HOST || 'localhost',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || ''
      }
    });

    this.channels.set('sms', {
      name: 'SMS',
      isEnabled: true,
      config: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || ''
      }
    });

    this.channels.set('push', {
      name: 'Push Notification',
      isEnabled: true,
      config: {
        firebaseServerKey: process.env.FIREBASE_SERVER_KEY || ''
      }
    });

    this.channels.set('in_app', {
      name: 'In-App Notification',
      isEnabled: true,
      config: {}
    });
  }

  /**
   * Create a new notification
   */
  async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead' | 'isSent'>,
    userContext: UserContext
  ): Promise<Notification> {
    try {
      const notificationId = await this.generateNotificationId();
      const now = new Date();

      // Ensure PHI safety
      if (!this.isPhiSafe(notification.title, notification.message)) {
        throw new Error('Notification content contains potential PHI');
      }

      await this.db.query(`
        INSERT INTO notifications (
          id, organization_id, user_id, user_role, type, category, priority,
          title, message, action_url, action_text, data, is_read, is_sent,
          send_at, expires_at, created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        notificationId,
        notification.organizationId,
        notification.userId,
        notification.userRole,
        notification.type,
        notification.category,
        notification.priority,
        notification.title,
        notification.message,
        notification.actionUrl,
        notification.actionText,
        JSON.stringify(notification.data || {}),
        false,
        false,
        notification.sendAt,
        notification.expiresAt,
        now,
        now,
        userContext.userId
      ]);

      // Schedule notification sending
      await this.scheduleNotification(notificationId);

      // Log notification creation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'notification_created',
        resource: 'notification',
        details: {
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          recipientId: notification.userId,
          recipientRole: notification.userRole
        },
      });

      return await this.getNotificationById(notificationId, userContext);

    } catch (error) {
      apiLogger.error('Create notification error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Create bulk notifications (for role-based notifications)
   */
  async createBulkNotifications(
    template: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead' | 'isSent'>,
    recipients: Array<{ userId?: string; userRole?: UserRole }>,
    userContext: UserContext
  ): Promise<Notification[]> {
    try {
      const notifications: Notification[] = [];

      for (const recipient of recipients) {
        const notification = await this.createNotification({
          ...template,
          ...(recipient.userId && { userId: recipient.userId }),
          ...(recipient.userRole && { userRole: recipient.userRole })
        }, userContext);
        
        notifications.push(notification);
      }

      return notifications;

    } catch (error) {
      apiLogger.error('Create bulk notifications error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Send notification using appropriate channels
   */
  async sendNotification(notificationId: string, channels?: string[]): Promise<boolean> {
    try {
      const notification = await this.getNotificationByIdInternal(notificationId);
      
      if (notification.isSent) {
        return true; // Already sent
      }

      if (new Date() < notification.sendAt) {
        return false; // Not time to send yet
      }

      if (notification.expiresAt && new Date() > notification.expiresAt) {
        // Mark as expired
        await this.db.query(
          'UPDATE notifications SET is_sent = true, updated_at = NOW() WHERE id = $1',
          [notificationId]
        );
        return false;
      }

      const sendChannels = channels || ['in_app']; // Default to in-app only
      let sentSuccessfully = false;

      // Send to each channel
      for (const channelName of sendChannels) {
        const channel = this.channels.get(channelName);
        if (channel?.isEnabled) {
          try {
            const result = await this.sendToChannel(notification, channelName, channel);
            if (result) {
              sentSuccessfully = true;
            }
          } catch (error) {
            apiLogger.error(`Failed to send notification ${notificationId} via ${channelName}:`, error as Record<string, any>);
          }
        }
      }

      if (sentSuccessfully) {
        await this.db.query(
          'UPDATE notifications SET is_sent = true, updated_at = NOW() WHERE id = $1',
          [notificationId]
        );

        // Log successful send
        await this.auditLogger.logActivity({
          userId: 'system',
          action: 'notification_sent',
          resource: 'notification',
            details: {
            channels: sendChannels,
            type: notification.type,
            priority: notification.priority
          },
          });
      }

      return sentSuccessfully;

    } catch (error) {
      apiLogger.error('Send notification error:', error as Record<string, any>);
      return false;
    }
  }

  /**
   * Send credential expiration reminders
   */
  async sendCredentialExpirationReminders(userContext: UserContext): Promise<number> {
    try {
      const expiringCredentials = await this.db.query(`
        SELECT c.id, c.credential_type, c.expiration_date, 
               u.id as user_id, u.first_name, u.last_name, u.email
        FROM credentials c
        JOIN users u ON c.user_id = u.id
        WHERE c.organization_id = $1
        AND c.status = 'active'
        AND c.expiration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.category = 'credentialing' 
          AND n.data->>'credentialId' = c.id 
          AND n.created_at > NOW() - INTERVAL '7 days'
        )
      `, [userContext.organizationId]);

      let remindersSent = 0;

      for (const cred of expiringCredentials.rows) {
        const daysUntilExpiry = Math.ceil(
          (new Date(cred.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const priority = daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low';

        await this.createNotification({
          organizationId: userContext.organizationId,
          userId: cred.user_id,
          type: NotificationType.REMINDER,
          category: NotificationCategory.CREDENTIALING,
          priority,
          title: `${cred.credential_type} Expiring Soon`,
          message: `Your ${cred.credential_type} credential expires in ${daysUntilExpiry} day(s). Please renew to avoid scheduling restrictions.`,
          actionUrl: '/credentials/renew',
          actionText: 'Renew Credential',
          data: {
            credentialId: cred.id,
            credentialType: cred.credential_type,
            expirationDate: cred.expiration_date,
            daysUntilExpiry
          },
          sendAt: new Date(),
          createdBy: 'system'
        }, userContext);

        remindersSent++;
      }

      return remindersSent;

    } catch (error) {
      apiLogger.error('Send credential expiration reminders error:', error as Record<string, any>);
      return 0;
    }
  }

  /**
   * Send EVV missing records alerts
   */
  async sendMissingEVVAlerts(userContext: UserContext): Promise<number> {
    try {
      const missingEVV = await this.db.query(`
        SELECT s.id, s.client_id, s.caregiver_id, s.start_time, s.end_time,
               u.first_name, u.last_name, u.email
        FROM shifts s
        JOIN users u ON s.caregiver_id = u.id
        WHERE s.organization_id = $1
        AND s.start_time < NOW() - INTERVAL '2 hours'
        AND s.status = 'confirmed'
        AND NOT EXISTS (
          SELECT 1 FROM evv_records ev 
          WHERE ev.shift_id = s.id 
          AND ev.clock_in_time IS NOT NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.category = 'evv' 
          AND n.data->>'shiftId' = s.id 
          AND n.created_at > NOW() - INTERVAL '4 hours'
        )
      `, [userContext.organizationId]);

      let alertsSent = 0;

      for (const shift of missingEVV.rows) {
        const hoursLate = Math.floor(
          (Date.now() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60)
        );

        await this.createNotification({
          organizationId: userContext.organizationId,
          userId: shift.caregiver_id,
          type: NotificationType.ALERT,
          category: NotificationCategory.EVV,
          priority: hoursLate > 24 ? 'critical' : 'high',
          title: 'Missing EVV Record',
          message: `You have a missing EVV record for a shift that started ${hoursLate} hours ago. Please complete EVV verification to ensure proper billing.`,
          actionUrl: '/evv/complete',
          actionText: 'Complete EVV',
          data: {
            shiftId: shift.id,
            startTime: shift.start_time,
            hoursLate
          },
          sendAt: new Date(),
          createdBy: 'system'
        }, userContext);

        // Also notify supervisor
        const supervisors = await this.db.query(
          'SELECT id FROM users WHERE role = $1 AND organization_id = $2',
          ['field_supervisor', userContext.organizationId]
        );

        for (const supervisor of supervisors.rows) {
          await this.createNotification({
            organizationId: userContext.organizationId,
            userId: supervisor.id,
            type: NotificationType.WARNING,
            category: NotificationCategory.EVV,
            priority: 'medium',
            title: 'Caregiver Missing EVV',
            message: `${shift.first_name} ${shift.last_name} has not completed EVV for a shift ${hoursLate} hours ago.`,
            actionUrl: `/staff/${shift.caregiver_id}/evv`,
            actionText: 'View Details',
            data: {
              shiftId: shift.id,
              caregiverId: shift.caregiver_id,
              caregiverName: `${shift.first_name} ${shift.last_name}`,
              hoursLate
            },
            sendAt: new Date(),
            createdBy: 'system'
          }, userContext);
        }

        alertsSent++;
      }

      return alertsSent;

    } catch (error) {
      apiLogger.error('Send missing EVV alerts error:', error as Record<string, any>);
      return 0;
    }
  }

  /**
   * Send billing deadline reminders
   */
  async sendBillingDeadlineReminders(userContext: UserContext): Promise<number> {
    try {
      // Check for services approaching billing deadline (typically end of month)
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0); // Last day of current month

      const daysUntilDeadline = Math.ceil(
        (endOfMonth.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline > 7) {
        return 0; // Too early for reminders
      }

      const unbilledServices = await this.db.query(`
        SELECT COUNT(*) as unbilled_count
        FROM evv_records er
        WHERE er.organization_id = $1
        AND er.clock_out_time IS NOT NULL
        AND er.is_valid = true
        AND NOT EXISTS (
          SELECT 1 FROM billing_records br 
          WHERE br.evv_record_id = er.id
        )
        AND er.clock_in_time >= DATE_TRUNC('month', CURRENT_DATE)
      `, [userContext.organizationId]);

      const unbilledCount = parseInt(unbilledServices.rows[0].unbilled_count);

      if (unbilledCount === 0) {
        return 0;
      }

      // Notify billing staff
      const billingStaff = await this.db.query(
        'SELECT id FROM users WHERE role IN ($1, $2) AND organization_id = $3',
        ['billing_manager', 'rcm_analyst', userContext.organizationId]
      );

      let remindersSent = 0;

      for (const staff of billingStaff.rows) {
        await this.createNotification({
          organizationId: userContext.organizationId,
          userId: staff.id,
          type: NotificationType.REMINDER,
          category: NotificationCategory.BILLING,
          priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
          title: 'Billing Deadline Approaching',
          message: `${unbilledCount} unbilled services need to be processed. Deadline is in ${daysUntilDeadline} day(s).`,
          actionUrl: '/billing/pending',
          actionText: 'View Pending',
          data: {
            unbilledCount,
            daysUntilDeadline,
            deadline: endOfMonth
          },
          sendAt: new Date(),
          createdBy: 'system'
        }, userContext);

        remindersSent++;
      }

      return remindersSent;

    } catch (error) {
      apiLogger.error('Send billing deadline reminders error:', error as Record<string, any>);
      return 0;
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(
    userId: string,
    userContext: UserContext,
    filters?: {
      isRead?: boolean;
      category?: NotificationCategory;
      priority?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      let whereConditions = [
        'organization_id = $1',
        '(user_id = $2 OR user_role = $3)',
        '(expires_at IS NULL OR expires_at > NOW())'
      ];
      let params: any[] = [userContext.organizationId, userId, userContext.role];
      let paramIndex = 4;

      if (filters?.isRead !== undefined) {
        whereConditions.push(`is_read = $${paramIndex++}`);
        params.push(filters.isRead);
      }

      if (filters?.category) {
        whereConditions.push(`category = $${paramIndex++}`);
        params.push(filters.category);
      }

      if (filters?.priority) {
        whereConditions.push(`priority = $${paramIndex++}`);
        params.push(filters.priority);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await this.db.query(
        `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      
      const query = `
        SELECT * FROM notifications
        WHERE ${whereClause}
        ORDER BY priority = 'critical' DESC, priority = 'high' DESC, created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      const notifications = result.rows.map(row => this.mapRowToNotification(row));

      return { notifications, total };

    } catch (error) {
      apiLogger.error('Get user notifications error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userContext: UserContext): Promise<void> {
    try {
      await this.db.query(`
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE id = $1 
        AND organization_id = $2
        AND (user_id = $3 OR user_role = $4)
      `, [notificationId, userContext.organizationId, userContext.userId, userContext.role]);

      // Log read action
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'notification_read',
        resource: 'notification',
        details: {},
      });

    } catch (error) {
      apiLogger.error('Mark notification as read error:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Process scheduled notifications (called by cron job)
   */
  async processScheduledNotifications(): Promise<number> {
    try {
      const pendingNotifications = await this.db.query(`
        SELECT id FROM notifications
        WHERE is_sent = false
        AND send_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY priority = 'critical' DESC, priority = 'high' DESC, send_at ASC
        LIMIT 100
      `);

      let processedCount = 0;

      for (const notification of pendingNotifications.rows) {
        try {
          const sent = await this.sendNotification(notification.id, ['in_app', 'email']);
          if (sent) {
            processedCount++;
          }
        } catch (error) {
          apiLogger.error(`Failed to process notification ${notification.id}:`, error as Record<string, any>);
        }
      }

      return processedCount;

    } catch (error) {
      apiLogger.error('Process scheduled notifications error:', error as Record<string, any>);
      return 0;
    }
  }

  // Private helper methods

  private async scheduleNotification(notificationId: string): Promise<void> {
    // In a production system, this would integrate with a job queue (Redis, Bull, etc.)
    // For now, we rely on the processScheduledNotifications method being called regularly
    apiLogger.info(`Notification ${notificationId} scheduled for processing`);
  }

  private async sendToChannel(
    notification: Notification,
    channelName: string,
    channel: NotificationChannel
  ): Promise<boolean> {
    switch (channelName) {
      case 'email':
        return this.sendEmail(notification, channel.config);
      case 'sms':
        return this.sendSMS(notification, channel.config);
      case 'push':
        return this.sendPushNotification(notification, channel.config);
      case 'in_app':
        return true; // In-app notifications are stored in database, always "sent"
      default:
        return false;
    }
  }

  private async sendEmail(notification: Notification, config: any): Promise<boolean> {
    try {
      // production email sending - would integrate with actual email service
      apiLogger.info(`Sending email: ${notification.title} to ${notification.userId}`);
      return true;
    } catch (error) {
      apiLogger.error('Send email error:', error as Record<string, any>);
      return false;
    }
  }

  private async sendSMS(notification: Notification, config: any): Promise<boolean> {
    try {
      // production SMS sending - would integrate with Twilio or similar
      apiLogger.info(`Sending SMS: ${notification.title} to ${notification.userId}`);
      return true;
    } catch (error) {
      apiLogger.error('Send SMS error:', error as Record<string, any>);
      return false;
    }
  }

  private async sendPushNotification(notification: Notification, config: any): Promise<boolean> {
    try {
      // production push notification - would integrate with Firebase or similar
      apiLogger.info(`Sending push: ${notification.title} to ${notification.userId}`);
      return true;
    } catch (error) {
      apiLogger.error('Send push notification error:', error as Record<string, any>);
      return false;
    }
  }

  private isPhiSafe(title: string, message: string): boolean {
    // PHI patterns to avoid
    const phiPatterns = [
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN
      /\b\d{3}-?\d{3}-?\d{4}\b/, // Phone number
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // Date of birth pattern
      /\bDOB\b/i,
      /\bDate of Birth\b/i,
      /\bMRN\b/i,
      /\bMedical Record\b/i
    ];

    const combinedText = `${title} ${message}`;
    
    return !phiPatterns.some(pattern => pattern.test(combinedText));
  }

  private async getNotificationById(notificationId: string, userContext: UserContext): Promise<Notification> {
    const result = await this.db.query(
      'SELECT * FROM notifications WHERE id = $1 AND organization_id = $2',
      [notificationId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  private async getNotificationByIdInternal(notificationId: string): Promise<Notification> {
    const result = await this.db.query('SELECT * FROM notifications WHERE id = $1', [notificationId]);

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      userRole: row.user_role,
      type: row.type,
      category: row.category,
      priority: row.priority,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      actionText: row.action_text,
      data: row.data ? JSON.parse(row.data) : {},
      isRead: row.is_read,
      isSent: row.is_sent,
      sendAt: row.send_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  private async generateNotificationId(): Promise<string> {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}