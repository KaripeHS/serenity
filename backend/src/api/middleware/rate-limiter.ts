/**
 * Rate Limiter Middleware
 * Prevents abuse with request rate limiting
 *
 * @module api/middleware
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Check if we're in a development/test environment
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Default rate limiter: 500 requests per 15 minutes
 * Generous limits for active users while still protecting against abuse
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  validate: { xForwardedForHeader: false, trustProxy: false }, // Disable validation warnings for Cloud Run
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'TooManyRequests',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Rate limiter for auth endpoints: 50 requests per 5 minutes
 * Protects against brute force while allowing reasonable login attempts
 */
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 attempts per 5 minutes
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts, please try again later',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  validate: { xForwardedForHeader: false, trustProxy: false }, // Disable validation warnings for Cloud Run
});

/**
 * Lenient rate limiter for public endpoints: 500 requests per 15 minutes
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests, please try again later',
  },
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  validate: { xForwardedForHeader: false, trustProxy: false }, // Disable validation warnings for Cloud Run
});
