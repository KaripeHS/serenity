/**
 * Environment Configuration
 * Controls behavior between development and production
 */

export const environment = {
  /**
   * Current environment mode
   * Uses Vite's built-in MODE which is automatically set based on build command
   */
  mode: import.meta.env.MODE || 'development',

  /**
   * API base URL
   */
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',

  /**
   * Whether to allow mock data fallbacks
   * CRITICAL: This should NEVER be true in production
   * Mock data in production confuses users with fake information
   */
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',

  /**
   * Check if running in production
   * Uses Vite's built-in PROD flag which is true for production builds
   */
  isProduction: import.meta.env.PROD === true,

  /**
   * Check if running in development
   * Uses Vite's built-in DEV flag which is true for development
   */
  isDevelopment: import.meta.env.DEV === true,
};

// Declare global constants defined by Vite
declare const __PROD__: boolean;
declare const __DEV__: boolean;

/**
 * Helper to check if mock data should be used
 * Returns false in production to prevent showing fake data to users
 */
export function shouldUseMockData(): boolean {
  // CRITICAL: __PROD__ is replaced at build time by Vite
  // In production builds, this becomes: if (true) return false;
  // This GUARANTEES no mock data in production
  if (__PROD__) {
    return false;
  }
  // In development, respect the flag
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/**
 * Helper to get empty state message for production
 */
export function getNoDataMessage(context: string): string {
  return `No ${context} data available yet`;
}

export default environment;
