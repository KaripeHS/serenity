/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 *
 * @module api/middleware
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../utils/logger';

const logger = createLogger('error-handler');

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('API error occurred', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    code: err.code,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Format error response
  const errorResponse: any = {
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    code: err.code,
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Create a custom API error
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Common error creators
 */
export const ApiErrors = {
  notFound: (resource: string) =>
    createApiError(`${resource} not found`, 404, 'NOT_FOUND'),

  unauthorized: (message: string = 'Unauthorized') =>
    createApiError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    createApiError(message, 403, 'FORBIDDEN'),

  badRequest: (message: string, details?: any) =>
    createApiError(message, 400, 'BAD_REQUEST', details),

  conflict: (message: string) =>
    createApiError(message, 409, 'CONFLICT'),

  internalError: (message: string = 'Internal server error') =>
    createApiError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (service: string) =>
    createApiError(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE'),
};
