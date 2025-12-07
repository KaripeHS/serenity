/**
 * Authentication Routes
 * Handles user login, logout, token refresh, and session management
 *
 * @module api/routes/auth
 */

import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limiter';
import { ApiErrors } from '../../middleware/error-handler';
import { getSandataRepository } from '../../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../../database/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { auditLogger } from '../../../audit/logger';
import { UserRole } from '../../../auth/access-control';

const router = Router();
const repository = getSandataRepository(getDbClient());

// JWT secret (TODO: Move to environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'serenity-erp-secret-key-change-in-production';
const JWT_EXPIRES_IN = '8h'; // 8 hour sessions
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 day refresh tokens

/**
 * Generate JWT access token
 */
function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

/**
 * POST /api/auth/register
 * Register a new user (first-time setup or admin creating users)
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      organizationId,
      role = 'client', // Default to client if public
    } = req.body;

    // Security: Public registration only allowed for Client/Family
    if (role !== 'client' && role !== 'family') {
      throw ApiErrors.forbidden('Public registration is restricted to Clients and Family members. Staff must be onboarded by an administrator.');
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      throw ApiErrors.badRequest('email, password, firstName, and lastName are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ApiErrors.badRequest('Invalid email format');
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      throw ApiErrors.badRequest('Password must be at least 8 characters');
    }

    // Check if email already exists
    const existingUser = await repository.getUserByEmail(email);
    if (existingUser) {
      throw ApiErrors.conflict('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = await repository.createUser({
      email,
      passwordHash,
      first_name: firstName,
      last_name: lastName,
      organization_id: organizationId || '',
      role,
      status: 'active',
    });

    // Fetch created user
    const user = await repository.getUser(userId);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await repository.createSession({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
      },
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      message: 'User registered successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiErrors.badRequest('email and password are required');
    }

    // Fetch user by email
    const user = await repository.getUserByEmail(email);
    if (!user) {
      throw ApiErrors.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw ApiErrors.forbidden('Account is inactive. Please contact administrator.');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw ApiErrors.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await repository.createSession({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    });

    // Audit log
    await repository.createAuditLog({
      userId: user.id,
      organizationId: user.organization_id,
      action: 'user_login',
      entityType: 'session',
      entityId: user.id,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
      },
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw ApiErrors.badRequest('refreshToken is required');
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      throw ApiErrors.unauthorized('Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw ApiErrors.unauthorized('Invalid token type');
    }

    // Check if session exists and is valid
    const session = await repository.getSessionByRefreshToken(refreshToken);
    if (!session || session.revoked_at || new Date() > new Date(session.expires_at)) {
      throw ApiErrors.unauthorized('Session expired or revoked');
    }

    // Fetch user
    const user = await repository.getUser(decoded.id);
    if (!user || user.status !== 'active') {
      throw ApiErrors.unauthorized('User not found or inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      accessToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token and invalidate session
 */
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific session
      await repository.revokeSession(refreshToken);
    }

    // Audit log
    await repository.createAuditLog({
      userId: req.user?.userId,
      organizationId: req.user?.organizationId,
      action: 'user_logout',
      entityType: 'session',
      entityId: req.user?.userId,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiErrors.unauthorized('User not authenticated');
    }

    // Fetch full user profile
    const user = await repository.getUser(userId);
    if (!user) {
      throw ApiErrors.notFound('User');
    }

    // Get organization details
    const organization = user.organization_id
      ? await repository.getOrganization(user.organization_id)
      : null;

    // Get pod details if assigned
    const pod = user.pod_id ? await repository.getPod(user.pod_id) : null;

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      phoneNumber: user.phone_number,
      organization: organization
        ? {
          id: organization.id,
          name: organization.name,
        }
        : null,
      pod: pod
        ? {
          id: pod.id,
          name: pod.name,
        }
        : null,
      sandataEmployeeId: user.sandata_employee_id,
      hireDate: user.hire_date,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put(
  '/change-password',
  requireAuth,
  authRateLimiter,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw ApiErrors.badRequest('currentPassword and newPassword are required');
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        throw ApiErrors.badRequest('New password must be at least 8 characters');
      }

      // Fetch user
      const user = await repository.getUser(userId!);
      if (!user) {
        throw ApiErrors.notFound('User');
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        throw ApiErrors.unauthorized('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await repository.updateUser(userId!, {
        passwordHash: newPasswordHash,
        updated_by: userId,
      });

      // Revoke all existing sessions (force re-login)
      await repository.revokeAllUserSessions(userId!);

      // Audit log
      await repository.createAuditLog({
        userId: userId,
        organizationId: user.organization_id,
        action: 'password_changed',
        entityType: 'user',
        entityId: userId!,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });

      res.json({
        message: 'Password changed successfully. Please log in again.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset (sends email with reset token)
 */
router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw ApiErrors.badRequest('email is required');
    }

    // Fetch user by email
    const user = await repository.getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
      return;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      {
        id: user.id,
        type: 'password_reset',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in database
    await repository.createPasswordResetToken({
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // TODO: Send email with reset link
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetLink);

    // Audit log
    await repository.createAuditLog({
      userId: user.id,
      organizationId: user.organization_id,
      action: 'password_reset_requested',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });

    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 */
router.post('/reset-password', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw ApiErrors.badRequest('token and newPassword are required');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw ApiErrors.badRequest('Password must be at least 8 characters');
    }

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw ApiErrors.unauthorized('Invalid or expired reset token');
    }

    if (decoded.type !== 'password_reset') {
      throw ApiErrors.unauthorized('Invalid token type');
    }

    // Check if token exists and is valid
    const resetTokenRecord = await repository.getPasswordResetToken(token);
    if (
      !resetTokenRecord ||
      resetTokenRecord.used_at ||
      new Date() > new Date(resetTokenRecord.expires_at)
    ) {
      throw ApiErrors.unauthorized('Reset token expired or already used');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await repository.updateUser(decoded.id, {
      passwordHash,
    });

    // Mark token as used
    await repository.markPasswordResetTokenUsed(token);

    // Revoke all existing sessions (force re-login)
    await repository.revokeAllUserSessions(decoded.id);

    // Audit log
    await repository.createAuditLog({
      userId: decoded.id,
      action: 'password_reset_completed',
      entityType: 'user',
      entityId: decoded.id,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });

    res.json({
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user?.userId;

    const sessions = await repository.getUserSessions(userId!);

    res.json({
      sessions: sessions.map((session: any) => ({
        id: session.id,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        userAgent: session.user_agent,
        ipAddress: session.ip_address,
        isCurrentSession: session.refresh_token === req.body.refreshToken,
      })),
      count: sessions.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete(
  '/sessions/:sessionId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;

      // Verify session belongs to user
      const session = await repository.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        throw ApiErrors.notFound('Session');
      }

      // Revoke session
      await repository.revokeSessionById(sessionId);

      res.json({
        message: 'Session revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/break-glass
 * Request emergency access to a patient outside of assigned caseload
 */
router.post(
  '/break-glass',
  requireAuth,
  authRateLimiter,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const userId = req.user?.userId;
      const { patientId, reason } = req.body;

      if (!patientId || !reason) {
        throw ApiErrors.badRequest('patientId and reason are required');
      }

      // 1. Log the attempt
      auditLogger.logSecurity('phi_access_violation', 'high', {
        userId,
        organizationId: req.user?.organizationId,
        details: {
          action: 'break_glass_request',
          patientId,
          reason,
          description: 'Break-Glass Access Requested'
        }
      });

      // 2. Insert permit into DB
      const db = getDbClient();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result = await db.query(
        `INSERT INTO break_glass_requests (user_id, client_id, reason, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, expires_at`,
        [userId, patientId, reason, expiresAt]
      );

      // 3. Log success
      auditLogger.logSecurity('privilege_escalation', 'critical', {
        userId,
        details: {
          requestId: result.rows[0].id,
          patientId,
          description: 'Break-Glass Access GRANTED'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Emergency access granted for 24 hours',
        permitId: result.rows[0].id,
        expiresAt: result.rows[0].expires_at
      });

    } catch (error) {
      next(error);
    }
  }
);

export { router as authRouter };
