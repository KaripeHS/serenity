/**
 * Mobile Notifications Routes
 * Push notification device registration and management
 *
 * @module api/routes/mobile/notifications
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('mobile-notifications');

/**
 * POST /api/mobile/notifications/register-device
 * Register a device for push notifications
 */
router.post('/register-device', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { pushToken, platform } = req.body;

        if (!userId) throw ApiErrors.unauthorized();
        if (!pushToken) throw ApiErrors.badRequest('Push token is required');

        const db = getDbClient();

        // Upsert device token for user
        await db.query(
            `INSERT INTO user_devices (user_id, push_token, platform, last_active, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW(), NOW())
             ON CONFLICT (user_id, push_token)
             DO UPDATE SET
                last_active = NOW(),
                platform = EXCLUDED.platform,
                updated_at = NOW()`,
            [userId, pushToken, platform || 'unknown']
        );

        logger.info(`Device registered for user ${userId}`, { platform });

        res.json({ success: true, message: 'Device registered for notifications' });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/mobile/notifications/unregister-device
 * Unregister a device (on logout)
 */
router.delete('/unregister-device', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { pushToken } = req.body;

        if (!userId) throw ApiErrors.unauthorized();

        const db = getDbClient();

        if (pushToken) {
            // Remove specific token
            await db.query(
                `DELETE FROM user_devices WHERE user_id = $1 AND push_token = $2`,
                [userId, pushToken]
            );
        } else {
            // Remove all tokens for user (full logout)
            await db.query(
                `DELETE FROM user_devices WHERE user_id = $1`,
                [userId]
            );
        }

        res.json({ success: true, message: 'Device unregistered' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/mobile/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw ApiErrors.unauthorized();

        const db = getDbClient();
        const result = await db.query(
            `SELECT push_enabled, email_enabled, sms_enabled,
                    shift_reminders, visit_updates, message_alerts
             FROM user_notification_preferences
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Return defaults
            res.json({
                pushEnabled: true,
                emailEnabled: true,
                smsEnabled: false,
                shiftReminders: true,
                visitUpdates: true,
                messageAlerts: true
            });
        } else {
            const prefs = result.rows[0];
            res.json({
                pushEnabled: prefs.push_enabled,
                emailEnabled: prefs.email_enabled,
                smsEnabled: prefs.sms_enabled,
                shiftReminders: prefs.shift_reminders,
                visitUpdates: prefs.visit_updates,
                messageAlerts: prefs.message_alerts
            });
        }
    } catch (error) {
        next(error);
    }
});

export const notificationsRouter = router;
