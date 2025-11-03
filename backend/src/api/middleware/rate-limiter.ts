/**
 * Rate Limiter Middleware
 * Prevents abuse with request rate limiting
 *
 * @module api/middleware
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Default rate limiter: 100 requests per 15 minutes
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'TooManyRequests',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Strict rate limiter for auth endpoints: 5 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts, please try again later',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Lenient rate limiter for public endpoints: 300 requests per 15 minutes
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests, please try again later',
  },
});
