/**
 * Serenity ERP Backend Server
 * HIPAA-compliant, AI-driven ERP system for home health agencies
 */

import dotenv from 'dotenv';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

import { createApp } from './api';

// Set default port
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';

async function startServer() {
  try {
    logger.info('Starting Serenity ERP Backend Server', {
      port: PORT,
      environment: NODE_ENV,
      version: '1.0.0'
    });

    const app = createApp({
      port: PORT,
      corsOrigins: ['*'], // Allow all for dev
      nodeEnv: NODE_ENV
    });

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is listening on port ${PORT}`);
    });

    // Basic health check endpoint for now
    logger.info('Server startup completed successfully', {
      port: PORT,
      timestamp: new Date().toISOString()
    });

    // Keep the process running
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

    logger.info(`Serenity ERP Backend Server is running`, {
      environment: NODE_ENV,
      port: PORT,
      startedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { startServer };