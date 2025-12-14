/**
 * Authorization middleware
 * Basic role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { UserContext } from '../auth/access-control';

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
  userContext?: {
    userId: string;
    organizationId: string;
    role: string;
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (roles.length > 0 && !roles.includes(req.user.role as string)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Set userContext for compatibility
    req.userContext = {
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      role: req.user.role as string
    };

    next();
  };
}

export const authorize = requireRole;
