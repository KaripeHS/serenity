/**
 * Logger Service for Mobile
 * Provides structured logging with environment-aware output
 *
 * NOTE: This file intentionally uses console.* methods as it IS the logger.
 * All other files should use loggerService instead of console directly.
 */

/* eslint-disable no-console */

const isDev = __DEV__;

export const loggerService = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      if (data) {
        console.log(`[INFO] ${message}`, data);
      } else {
        console.log(`[INFO] ${message}`);
      }
    }
  },

  error: (message: string, data?: Record<string, unknown>) => {
    // Always log errors
    if (data) {
      console.error(`[ERROR] ${message}`, data);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      if (data) {
        console.warn(`[WARN] ${message}`, data);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      if (data) {
        console.debug(`[DEBUG] ${message}`, data);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
};

/* eslint-enable no-console */
