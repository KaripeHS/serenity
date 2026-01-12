/**
 * Server Entry Point
 * Starts the Express API server
 *
 * @module server
 */

// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { startServer } from './api';
import { createLogger } from './utils/logger';
import { marketingAutomationJob } from './jobs/marketing-automation.job';
import { ClinicalRiskMonitor } from './jobs/clinical-risk-monitor.job';

const logger = createLogger('server');
const BUILD_VERSION = 'dashboard-fix-v1'; // Force rebuild

async function main() {
  try {
    // Get configuration from environment
    const port = parseInt(process.env.PORT || '3000');
    const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

    logger.info('Starting Serenity API server', {
      port,
      nodeEnv,
      corsOrigins,
    });

    // Initialize background jobs
    marketingAutomationJob.start();
    const clinicalRiskMonitor = new ClinicalRiskMonitor();
    clinicalRiskMonitor.start();

    // Start server
    await startServer({
      port,
      nodeEnv,
      corsOrigins,
    });

    logger.info('Server started successfully');
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  });
}

export { main };
