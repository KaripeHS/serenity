/**
 * CRITICAL SECURITY MIDDLEWARE
 * Implements comprehensive security headers and protection measures
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger';
import { environmentService } from '../config/environment';

const securityLogger = createLogger('security');

// Rate limiting configuration
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      securityLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({ error: message });
    }
  });
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: ["no-referrer"] },
  xssFilter: true
});

// Rate limiters
export const globalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth attempts per windowMs
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  60, // limit each IP to 60 API calls per minute
  'API rate limit exceeded'
);

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove potential XSS vectors
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      environmentService.getApplicationConfig().corsOrigin,
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.warn('CORS violation attempt', { origin });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Pod-Context',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining']
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to headers
  res.setHeader('X-Request-ID', requestId);
  req.headers['x-request-id'] = requestId;

  // Log request
  securityLogger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    securityLogger[logLevel]('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length')
    });
  });

  next();
};

// Security event logging
export const logSecurity = (
  eventType: string,
  details: any,
  req: Request,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  securityLogger.warn('Security event detected', {
    eventType,
    severity,
    details,
    requestId: req.headers['x-request-id'],
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// PHI detection middleware
export const phiDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // DOB
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
  ];

  const checkForPHI = (obj: any, path = ''): boolean => {
    if (typeof obj === 'string') {
      return phiPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (checkForPHI(obj[key], `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  const containsPHI = checkForPHI(req.body) || checkForPHI(req.query) || checkForPHI(req.params);

  if (containsPHI) {
    logSecurity('phi_in_request', {
      message: 'Potential PHI detected in request',
      hasBody: !!req.body,
      hasQuery: Object.keys(req.query).length > 0,
      hasParams: Object.keys(req.params).length > 0
    }, req, 'high');
  }

  next();
};

// Error handling middleware
export const securityErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logSecurity('security_error', {
    error: error.message,
    stack: environmentService.isDevelopment() ? error.stack : undefined
  }, req, 'high');

  // Don't expose internal errors in production
  const message = environmentService.isProduction()
    ? 'Internal server error'
    : error.message;

  res.status(500).json({
    error: message,
    requestId: req.headers['x-request-id']
  });
};

export default {
  securityHeaders,
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  sanitizeRequest,
  corsOptions,
  requestLogger,
  logSecurity,
  phiDetectionMiddleware,
  securityErrorHandler
};