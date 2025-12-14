/**
 * Auth middleware type shim
 * Re-exports from api/middleware/auth for backward compatibility
 */

export * from '../api/middleware/auth';
import { AuthenticatedRequest as AuthReq, requireAuth } from '../api/middleware/auth';

// Provide aliases for backward compatibility
export type AuthRequest = AuthReq;
export const authenticate = requireAuth;
