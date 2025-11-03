/**
 * Server Entry Point
 * Starts the Express API server
 *
 * @module server
 */

import { startServer } from './api';
import { createLogger } from './utils/logger';
import { environmentService } from './config/environment';

const logger = createLogger('server');

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

// Run if this is the main module
if (require.main === module) {
  main();
}

export { main };
