/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DB_URL = process.env.DB_URL || 'postgresql://test:test@localhost:5432/serenity_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock external services by default
// Mock external services by default
jest.mock('../utils/logger', () => ({
  logger: {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
  },
  auditLogger: {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
  },
  securityLogger: {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
  },
  complianceLogger: {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
  },
  documentLogger: {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
  },
  reminderLogger: {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
  },
  createLogger: () => ({
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
    audit: () => { },
    security: () => { }
  })
}));

// Additional mocks can be added here as needed per test

// Global test timeout
jest.setTimeout(30000); // Increased timeout

// Console suppression for cleaner test output but allow test logs
// We do NOT mock console.log here because we want to see test output
// and we don't want to store app console logs in jest history
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // log: jest.fn(), // Don't mock log, let it print or silence it safely
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { }
};