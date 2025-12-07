/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user to request
 *
 * @module api/middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrors } from './error-handler';
import { createLogger } from '../../utils/logger';
import * as jwt from 'jsonwebtoken';
import { getSandataRepository } from '../../services/sandata/repositories/sandata.repository';
import { getDbClient } from '../../database/client';
import { UserContext, UserRole } from '../../auth/access-control';

const logger = createLogger('auth-middleware');
const JWT_SECRET = process.env.JWT_SECRET || 'serenity-erp-secret-key-change-in-production';
const repository = getSandataRepository(getDbClient());

/**
 * Extended Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}

/**
 * Middleware to require authentication
 * Validates JWT token and attaches user to request
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiErrors.unauthorized('No authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // TODO: Validate JWT token using auth.service.ts
    // For now, mock validation (replace with real JWT verification)
    const user = await validateToken(token);

    if (!user) {
      throw ApiErrors.unauthorized('Invalid or expired token');
    }

    // Attach user to request
    req.user = user;

    logger.debug('User authenticated', {
      userId: user.userId,
      role: user.role,
      path: req.path,
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiErrors.unauthorized('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw ApiErrors.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require organization access
 */
export function requireOrganization(organizationId: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiErrors.unauthorized('Authentication required');
      }

      if (req.user.organizationId !== organizationId) {
        throw ApiErrors.forbidden('Access denied to this organization');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);
    const user = await validateToken(token);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

/**
 * Validate JWT token and return user
 */
async function validateToken(token: string): Promise<UserContext | null> {
  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Fetch user from database to ensure they still exist and are active
    const user = await repository.getUser(decoded.id);

    if (!user || user.status !== 'active') {
      logger.warn('Token validation failed: user not found or inactive', {
        userId: decoded.id,
      });
      return null;
    }

    // Return user info
    return {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role as UserRole,
      permissions: [], // TODO: Load permissions based on role
      attributes: [], // TODO: Load attributes
      sessionId: 'session-' + Date.now(), // Mock session ID
      ipAddress: 'unknown',
      userAgent: 'unknown'
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token');
    } else {
      logger.error('Token validation error', { error });
    }
    return null;
  }
}
