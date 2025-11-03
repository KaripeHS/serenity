/**
 * Request Logger Middleware
 * Logs all incoming requests with timing and status
 *
 * @module api/middleware
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../utils/logger';

const logger = createLogger('request');

/**
 * Express middleware to log all requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
