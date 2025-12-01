/**
 * API Entry Point
 * Express application with domain-separated routes
 *
 * Domains:
 * - /api/public  - Public-facing endpoints (careers, applications)
 * - /api/console - Console/ERP endpoints (authenticated staff)
 * - /api/admin   - Admin configuration endpoints (admin role only)
 * - /api/mobile  - Mobile app endpoints (EVV clock-in/out)
 *
 * @module api
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '../utils/logger';
import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';
import { consoleRouter } from './routes/console';
import { adminRouter } from './routes/admin';
import { mobileRouter } from './routes/mobile';
import partnersRouter from './partners/partners.routes';
import webhooksRouter from './routes/webhooks';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';

const logger = createLogger('api');

export interface ApiConfig {
  port: number;
  corsOrigins: string[];
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * Create Express application with all routes and middleware
 */
export function createApp(config: ApiConfig): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
  }));

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health check (no auth required)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Webhooks (no rate limiting or auth - external services)
  app.use('/api/webhooks', webhooksRouter);

  // Rate limiting (applied to all routes except webhooks)
  app.use(rateLimiter);

  // Domain-separated routes
  app.use('/api/auth', authRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/console', consoleRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/mobile', mobileRouter);
  app.use('/api/partners', partnersRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express application configured', {
    domains: ['auth', 'public', 'console', 'admin', 'mobile', 'webhooks'],
    environment: config.nodeEnv,
  });

  return app;
}

/**
 * Start the API server
 */
export async function startServer(config: ApiConfig): Promise<void> {
  const app = createApp(config);

  const server = app.listen(config.port, () => {
    logger.info(`API server started`, {
      port: config.port,
      environment: config.nodeEnv,
      corsOrigins: config.corsOrigins,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}
