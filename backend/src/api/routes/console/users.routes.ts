/**
 * User Profile Routes
 * API endpoints for user profile management
 *
 * @module api/routes/console/users
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();
const logger = createLogger('users-routes');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/users/me
 * Get current user's profile
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiErrors.unauthorized();
    }

    const db = getDbClient();
    const result = await db.query(
      `SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.organization_id,
        u.created_at,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON o.id = u.organization_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw ApiErrors.notFound('User');
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      createdAt: user.created_at
    });
  } catch (error) {
    logger.error('Failed to get user profile', { error });
    next(error);
  }
});

/**
 * PUT /api/console/users/me/profile
 * Update current user's profile
 */
router.put('/me/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiErrors.unauthorized();
    }

    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
      throw ApiErrors.badRequest('First name, last name, and email are required');
    }

    const db = getDbClient();

    // Check if email is taken by another user
    const emailCheck = await db.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email.toLowerCase(), userId]
    );

    if (emailCheck.rows.length > 0) {
      throw ApiErrors.conflict('Email is already in use');
    }

    // Update user profile
    const result = await db.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           email = $3,
           phone = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role`,
      [firstName, lastName, email.toLowerCase(), phone || null, userId]
    );

    if (result.rows.length === 0) {
      throw ApiErrors.notFound('User');
    }

    const user = result.rows[0];
    logger.info(`User ${userId} updated their profile`);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Failed to update user profile', { error });
    next(error);
  }
});

/**
 * PUT /api/console/users/me/password
 * Change current user's password
 */
router.put('/me/password', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiErrors.unauthorized();
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiErrors.badRequest('Current password and new password are required');
    }

    // Validate password requirements
    if (newPassword.length < 8) {
      throw ApiErrors.badRequest('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw ApiErrors.badRequest('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw ApiErrors.badRequest('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw ApiErrors.badRequest('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      throw ApiErrors.badRequest('Password must contain at least one special character');
    }

    const db = getDbClient();

    // Get current password hash
    const userResult = await db.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw ApiErrors.notFound('User');
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw ApiErrors.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    logger.info(`User ${userId} changed their password`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Failed to change password', { error });
    next(error);
  }
});

export default router;
