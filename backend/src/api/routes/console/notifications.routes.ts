/**
 * Unified Notifications Routes
 * Aggregates alerts and notifications from all system areas for the notification bell
 *
 * Notification sources:
 * - Credential expirations
 * - Coverage gaps
 * - Training overdue
 * - Claims denials
 * - Incidents
 * - Authorization expirations
 * - System alerts
 *
 * @module api/routes/console/notifications
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('notifications-routes');

// All routes require authentication
router.use(requireAuth);

export interface SystemNotification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  category: 'credentials' | 'coverage' | 'training' | 'claims' | 'incidents' | 'authorizations' | 'compliance' | 'system';
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * GET /api/console/notifications
 * Get all notifications for the current user
 * Aggregates alerts from multiple sources
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!organizationId || !userId) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const db = getDbClient();
    const notifications: SystemNotification[] = [];
    const now = new Date();

    // 1. Check for expiring credentials (within 30 days)
    try {
      const credentialsResult = await db.query(
        `SELECT
          sc.id,
          sc.credential_type,
          sc.expiration_date,
          u.first_name,
          u.last_name
        FROM staff_credentials sc
        JOIN users u ON sc.staff_id = u.id
        WHERE sc.organization_id = $1
          AND sc.expiration_date IS NOT NULL
          AND sc.expiration_date <= NOW() + INTERVAL '30 days'
          AND sc.expiration_date >= NOW() - INTERVAL '7 days'
        ORDER BY sc.expiration_date ASC
        LIMIT 10`,
        [organizationId]
      );

      for (const cred of credentialsResult.rows) {
        const expDate = new Date(cred.expiration_date);
        const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = daysUntil < 0;

        notifications.push({
          id: `cred-${cred.id}`,
          type: isExpired || daysUntil <= 7 ? 'alert' : 'warning',
          category: 'credentials',
          title: isExpired ? 'Credential Expired' : 'Credential Expiring',
          message: `${cred.first_name} ${cred.last_name}'s ${cred.credential_type} ${isExpired ? 'expired' : `expires in ${daysUntil} days`}`,
          link: '/dashboard/credentials',
          createdAt: cred.expiration_date,
          read: false,
          priority: isExpired ? 'critical' : daysUntil <= 7 ? 'high' : 'medium'
        });
      }
    } catch (e) {
      logger.debug('Could not fetch credential notifications', { error: e });
    }

    // 2. Check for coverage gaps (if user has access to operations)
    if (['CEO', 'COO', 'CFO', 'FOUNDER', 'ADMINISTRATOR', 'SCHEDULER', 'POD_LEAD'].includes(userRole || '')) {
      try {
        const gapsResult = await db.query(
          `SELECT COUNT(*) as gap_count
           FROM shifts s
           WHERE s.organization_id = $1
             AND s.status = 'unassigned'
             AND s.scheduled_date >= CURRENT_DATE
             AND s.scheduled_date <= CURRENT_DATE + INTERVAL '3 days'`,
          [organizationId]
        );

        const gapCount = parseInt(gapsResult.rows[0]?.gap_count || '0');
        if (gapCount > 0) {
          notifications.push({
            id: `coverage-gaps-${now.toISOString().split('T')[0]}`,
            type: 'alert',
            category: 'coverage',
            title: 'Coverage Gaps',
            message: `${gapCount} unassigned shift${gapCount > 1 ? 's' : ''} in the next 3 days`,
            link: '/dashboard/dispatch',
            createdAt: now.toISOString(),
            read: false,
            priority: gapCount >= 5 ? 'critical' : gapCount >= 3 ? 'high' : 'medium'
          });
        }
      } catch (e) {
        logger.debug('Could not fetch coverage gap notifications', { error: e });
      }
    }

    // 3. Check for overdue training
    try {
      const trainingResult = await db.query(
        `SELECT COUNT(*) as overdue_count
         FROM staff_training_assignments sta
         WHERE sta.organization_id = $1
           AND sta.status = 'in_progress'
           AND sta.due_date < NOW()`,
        [organizationId]
      );

      const overdueCount = parseInt(trainingResult.rows[0]?.overdue_count || '0');
      if (overdueCount > 0) {
        notifications.push({
          id: `training-overdue-${now.toISOString().split('T')[0]}`,
          type: 'warning',
          category: 'training',
          title: 'Training Overdue',
          message: `${overdueCount} staff member${overdueCount > 1 ? 's have' : ' has'} overdue training`,
          link: '/dashboard/training',
          createdAt: now.toISOString(),
          read: false,
          priority: overdueCount >= 5 ? 'high' : 'medium'
        });
      }
    } catch (e) {
      logger.debug('Could not fetch training notifications', { error: e });
    }

    // 4. Check for pending incidents
    if (['CEO', 'COO', 'CFO', 'FOUNDER', 'ADMINISTRATOR', 'DON', 'RN', 'CLINICAL_SUPERVISOR'].includes(userRole || '')) {
      try {
        const incidentsResult = await db.query(
          `SELECT COUNT(*) as incident_count
           FROM incidents i
           WHERE i.organization_id = $1
             AND i.status IN ('reported', 'under_review')`,
          [organizationId]
        );

        const incidentCount = parseInt(incidentsResult.rows[0]?.incident_count || '0');
        if (incidentCount > 0) {
          notifications.push({
            id: `incidents-pending-${now.toISOString().split('T')[0]}`,
            type: 'alert',
            category: 'incidents',
            title: 'Pending Incidents',
            message: `${incidentCount} incident${incidentCount > 1 ? 's' : ''} pending review`,
            link: '/dashboard/incidents',
            createdAt: now.toISOString(),
            read: false,
            priority: incidentCount >= 3 ? 'high' : 'medium'
          });
        }
      } catch (e) {
        logger.debug('Could not fetch incident notifications', { error: e });
      }
    }

    // 5. Check for expiring authorizations (within 30 days)
    if (['CEO', 'COO', 'CFO', 'FOUNDER', 'ADMINISTRATOR', 'BILLER', 'BILLING_MANAGER'].includes(userRole || '')) {
      try {
        const authResult = await db.query(
          `SELECT COUNT(*) as auth_count
           FROM patient_authorizations pa
           WHERE pa.organization_id = $1
             AND pa.end_date IS NOT NULL
             AND pa.end_date <= NOW() + INTERVAL '30 days'
             AND pa.end_date >= NOW()
             AND pa.status = 'active'`,
          [organizationId]
        );

        const authCount = parseInt(authResult.rows[0]?.auth_count || '0');
        if (authCount > 0) {
          notifications.push({
            id: `auth-expiring-${now.toISOString().split('T')[0]}`,
            type: 'warning',
            category: 'authorizations',
            title: 'Authorizations Expiring',
            message: `${authCount} authorization${authCount > 1 ? 's' : ''} expiring within 30 days`,
            link: '/dashboard/authorizations',
            createdAt: now.toISOString(),
            read: false,
            priority: authCount >= 5 ? 'high' : 'medium'
          });
        }
      } catch (e) {
        logger.debug('Could not fetch authorization notifications', { error: e });
      }
    }

    // 6. Check for denied claims
    if (['CEO', 'COO', 'CFO', 'FOUNDER', 'ADMINISTRATOR', 'BILLER', 'BILLING_MANAGER'].includes(userRole || '')) {
      try {
        const claimsResult = await db.query(
          `SELECT COUNT(*) as denial_count
           FROM claims c
           WHERE c.organization_id = $1
             AND c.status = 'denied'
             AND c.denial_date >= NOW() - INTERVAL '7 days'`,
          [organizationId]
        );

        const denialCount = parseInt(claimsResult.rows[0]?.denial_count || '0');
        if (denialCount > 0) {
          notifications.push({
            id: `claims-denied-${now.toISOString().split('T')[0]}`,
            type: 'alert',
            category: 'claims',
            title: 'Claims Denied',
            message: `${denialCount} claim${denialCount > 1 ? 's' : ''} denied in the past week`,
            link: '/dashboard/denials',
            createdAt: now.toISOString(),
            read: false,
            priority: denialCount >= 5 ? 'high' : 'medium'
          });
        }
      } catch (e) {
        logger.debug('Could not fetch claims notifications', { error: e });
      }
    }

    // 7. Check for new job applications (HR roles)
    if (['CEO', 'COO', 'FOUNDER', 'ADMINISTRATOR', 'HR_MANAGER', 'RECRUITER'].includes(userRole || '')) {
      try {
        const applicationsResult = await db.query(
          `SELECT COUNT(*) as app_count
           FROM job_applications ja
           WHERE ja.organization_id = $1
             AND ja.status = 'new'`,
          [organizationId]
        );

        const appCount = parseInt(applicationsResult.rows[0]?.app_count || '0');
        if (appCount > 0) {
          notifications.push({
            id: `applications-new-${now.toISOString().split('T')[0]}`,
            type: 'info',
            category: 'system',
            title: 'New Applications',
            message: `${appCount} new job application${appCount > 1 ? 's' : ''} pending review`,
            link: '/dashboard/hr',
            createdAt: now.toISOString(),
            read: false,
            priority: 'low'
          });
        }
      } catch (e) {
        logger.debug('Could not fetch application notifications', { error: e });
      }
    }

    // Sort by priority and then by date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Calculate unread count (for now all are unread since we don't track read status yet)
    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      success: true,
      notifications: notifications.slice(0, 20), // Limit to 20 notifications
      unreadCount,
      totalCount: notifications.length
    });

  } catch (error) {
    logger.error('Failed to fetch notifications', { error });
    next(error);
  }
});

/**
 * POST /api/console/notifications/:id/read
 * Mark a notification as read
 */
router.post('/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // For now, just acknowledge - would normally track in a user_notifications table
    logger.info(`Notification ${id} marked as read by user ${userId}`);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Failed to mark notification as read', { error });
    next(error);
  }
});

/**
 * POST /api/console/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // For now, just acknowledge - would normally update user_notifications table
    logger.info(`All notifications marked as read by user ${userId}`);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error });
    next(error);
  }
});

export default router;
