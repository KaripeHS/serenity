
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createLogger } from '../utils/logger';
import { securityHeaders, corsOptions } from '../middleware/security';
import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';
import { consoleRouter } from './routes/console';
import { adminRouter } from './routes/admin';
import { mobileRouter } from './routes/mobile';
import partnersRouter from './partners/partners.routes';
import caregiverPortalRouter from './routes/caregiver/portal.routes';
import webhooksRouter from './routes/webhooks';
import aiRouter from './routes/console/ai.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';
import operationsRouter from './routes/operations.routes';
import complianceRouter from './routes/compliance.routes';
import { clinicalRouter } from './routes/clinical';
import patientPortalRouter from './routes/patient/portal.routes';
import familyPortalRouter from './routes/family/portal.routes';
import { familyRouter } from './routes/family';

const logger = createLogger('api');

export interface ApiConfig {
  port: number;
  corsOrigins: string[];
  nodeEnv: 'development' | 'production' | 'test';
}

export function createApp(config: ApiConfig): Application {
  const app = express();

  // Trust proxy for Cloud Run (required for rate limiting and IP detection)
  app.set('trust proxy', true);

  // Security and CORS middleware
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  // CORS middleware already handles OPTIONS requests (preflight)

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Webhooks (before rate limiting)
  app.use('/api/webhooks', webhooksRouter);

  // Rate limiting
  app.use(rateLimiter);

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/console', consoleRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/mobile', mobileRouter);
  app.use('/api/partners', partnersRouter);
  app.use('/api/caregiver', caregiverPortalRouter);
  app.use('/api/console/ai', aiRouter);
  app.use('/api/operations', operationsRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/clinical', clinicalRouter);
  app.use('/api/patient', patientPortalRouter);
  app.use('/api/family', familyPortalRouter);
  app.use('/api/family', familyRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
    });
  });

  app.use(errorHandler);

  logger.info('Express application configured', {
    environment: config.nodeEnv,
  });

  return app;
}

export async function startServer(config: ApiConfig): Promise<never> {
  const app = createApp(config);

  return new Promise<never>((_resolve, reject) => {
    const server = app.listen(config.port, () => {
      logger.info(`API server started`, {
        port: config.port,
        environment: config.nodeEnv,
        corsOrigins: config.corsOrigins,
      });
    });

    server.on('error', (error) => {
      logger.error('Failed to start server', { error });
      reject(error);
    });

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
  });
}
