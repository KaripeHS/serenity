/**
 * Sandata Alternative EVV Configuration
 * Serenity ERP - Ohio Medicaid Alt-EVV v4.3 Integration
 *
 * PHASE 0-1: PLACEHOLDER VALUES
 * - Real credentials must be provided by Nov 30, 2025 for Phase 2
 * - Never commit real credentials to Git
 * - Production secrets stored in AWS Secrets Manager
 */

export interface SandataEnvironmentConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  providerId: string;
  apiVersion: string;
}

export interface SandataBusinessRules {
  geofenceRadiusMiles: number;
  clockInToleranceMinutes: number;
  roundingMinutes: number;
  roundingMode: 'nearest' | 'up' | 'down';
  maxRetryAttempts: number;
  retryDelaySeconds: number;
  requireAuthorizationMatch: boolean;
  blockOverAuthorization: boolean;
}

export interface SandataFeatureFlags {
  enabled: boolean;
  submissionsEnabled: boolean;
  sandboxMode: boolean;
  claimsGateEnabled: boolean;
  claimsGateMode: 'disabled' | 'warn' | 'strict';
  correctionsEnabled: boolean;
}

export interface SandataConfig {
  sandbox: SandataEnvironmentConfig;
  production: SandataEnvironmentConfig;
  businessRules: SandataBusinessRules;
  featureFlags: SandataFeatureFlags;
}

/**
 * Sandata Configuration Object
 *
 * IMPORTANT:
 * - Secrets are read from environment variables
 * - For Phase 0-1, placeholders are used
 * - For Phase 2+, real credentials from AWS Secrets Manager
 */
const sandataConfig: SandataConfig = {
  // Sandbox environment (Phase 0-1)
  sandbox: {
    baseUrl: process.env.SANDATA_SANDBOX_URL || 'https://sandbox-api.sandata.com/v4.3',
    clientId: process.env.SANDATA_SANDBOX_CLIENT_ID || 'SERENITY_SANDBOX_CLIENT_ID',
    clientSecret: process.env.SANDATA_SANDBOX_SECRET || 'PLACEHOLDER_SECRET',
    providerId: process.env.SANDATA_PROVIDER_ID || 'OH_ODME_123456', // PLACEHOLDER
    apiVersion: 'v4.3',
  },

  // Production environment (Phase 2+)
  production: {
    baseUrl: process.env.SANDATA_PRODUCTION_URL || 'https://api.sandata.com/v4.3',
    clientId: process.env.SANDATA_PRODUCTION_CLIENT_ID || 'SERENITY_PROD_CLIENT_ID',
    clientSecret: process.env.SANDATA_PRODUCTION_SECRET || 'PLACEHOLDER_SECRET',
    providerId: process.env.SANDATA_PROVIDER_ID || 'OH_ODME_123456', // PLACEHOLDER
    apiVersion: 'v4.3',
  },

  // Business rules (from Manifesto v2.3)
  businessRules: {
    geofenceRadiusMiles: Number(process.env.SANDATA_GEOFENCE_RADIUS) || 0.25,
    clockInToleranceMinutes: Number(process.env.SANDATA_CLOCK_TOLERANCE) || 15,
    roundingMinutes: Number(process.env.SANDATA_ROUNDING_MINUTES) || 6,
    roundingMode: (process.env.SANDATA_ROUNDING_MODE as 'nearest' | 'up' | 'down') || 'nearest',
    maxRetryAttempts: Number(process.env.SANDATA_MAX_RETRIES) || 3,
    retryDelaySeconds: Number(process.env.SANDATA_RETRY_DELAY) || 300, // 5 minutes
    requireAuthorizationMatch: process.env.SANDATA_REQUIRE_AUTH_MATCH !== 'false', // Default true
    blockOverAuthorization: process.env.SANDATA_BLOCK_OVER_AUTH !== 'false', // Default true
  },

  // Feature flags (read from database via system_config, these are fallbacks)
  featureFlags: {
    enabled: process.env.ALT_EVV_ENABLED === 'true' || false,
    submissionsEnabled: process.env.SANDATA_SUBMISSIONS_ENABLED === 'true' || false,
    sandboxMode: process.env.SANDATA_SANDBOX_MODE !== 'false', // Default true for safety
    claimsGateEnabled: process.env.CLAIMS_GATE_ENABLED === 'true' || false,
    claimsGateMode: (process.env.CLAIMS_GATE_MODE as 'disabled' | 'warn' | 'strict') || 'warn',
    correctionsEnabled: process.env.SANDATA_CORRECTIONS_ENABLED !== 'false', // Default true
  },
};

/**
 * Get active Sandata configuration based on sandbox mode
 */
export function getActiveSandataConfig(): SandataEnvironmentConfig {
  return sandataConfig.featureFlags.sandboxMode
    ? sandataConfig.sandbox
    : sandataConfig.production;
}

/**
 * Get Sandata business rules
 */
export function getSandataBusinessRules(): SandataBusinessRules {
  return sandataConfig.businessRules;
}

/**
 * Get Sandata feature flags
 */
export function getSandataFeatureFlags(): SandataFeatureFlags {
  return sandataConfig.featureFlags;
}

/**
 * Validate Sandata configuration
 * Returns true if configuration is valid, throws error otherwise
 */
export function validateSandataConfig(): boolean {
  const config = getActiveSandataConfig();
  const errors: string[] = [];

  // Check required fields
  if (!config.baseUrl) {
    errors.push('Sandata base URL is required');
  }

  if (!config.clientId || config.clientId === 'SERENITY_SANDBOX_CLIENT_ID' || config.clientId === 'SERENITY_PROD_CLIENT_ID') {
    errors.push('Sandata client ID is a placeholder - real credentials required for Phase 2');
  }

  if (!config.clientSecret || config.clientSecret === 'PLACEHOLDER_SECRET') {
    errors.push('Sandata client secret is a placeholder - real credentials required for Phase 2');
  }

  if (!config.providerId || config.providerId === 'OH_ODME_123456') {
    errors.push('Sandata provider ID is a placeholder - real ODME Provider ID required for Phase 2');
  }

  // Validate business rules
  const rules = getSandataBusinessRules();
  if (rules.geofenceRadiusMiles <= 0 || rules.geofenceRadiusMiles > 10) {
    errors.push('Geofence radius must be between 0 and 10 miles');
  }

  if (rules.roundingMinutes !== 6 && rules.roundingMinutes !== 15) {
    errors.push('Rounding minutes must be 6 or 15 (industry standard)');
  }

  if (errors.length > 0) {
    const errorMessage = `Sandata configuration validation failed:\n${errors.join('\n')}`;

    // In Phase 0-1, log warnings instead of throwing
    if (sandataConfig.featureFlags.sandboxMode) {
      logger.warn('SANDATA CONFIG WARNING (Phase 0-1 - Placeholders OK)', { errorMessage });
      return true; // Allow placeholders in Phase 0-1
    } else {
      // In production/Phase 2+, throw error
      throw new Error(errorMessage);
    }
  }

  return true;
}

/**
 * Sandata API Endpoints
 */
export const SANDATA_ENDPOINTS = {
  auth: '/oauth/token',
  individuals: {
    create: '/individuals',
    update: '/individuals/:id',
    get: '/individuals/:id',
    search: '/individuals/search',
  },
  employees: {
    create: '/employees',
    update: '/employees/:id',
    get: '/employees/:id',
    search: '/employees/search',
  },
  visits: {
    create: '/visits',
    update: '/visits/:id',
    get: '/visits/:id',
    search: '/visits/search',
    void: '/visits/:id/void',
  },
  status: '/health',
} as const;

/**
 * Sandata Error Codes (Ohio Alt-EVV v4.3)
 * Based on Manifesto Appendix D error taxonomy
 */
export const SANDATA_ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: '401_AUTH',
  AUTH_TOKEN_EXPIRED: '401_EXPIRED',

  // Validation errors
  VALIDATION_MISSING_FIELD: 'VAL_001',
  VALIDATION_INVALID_FORMAT: 'VAL_002',
  VALIDATION_GEOFENCE_VIOLATION: 'VAL_GEOFENCE',
  VALIDATION_TIME_TOLERANCE: 'VAL_TIME',
  VALIDATION_DUPLICATE_VISIT: 'VAL_DUP',

  // Business rule errors
  BUSINESS_NO_AUTHORIZATION: 'BUS_AUTH',
  BUSINESS_OVER_AUTHORIZATION: 'BUS_OVER',
  BUSINESS_INVALID_SERVICE_CODE: 'BUS_SVC',

  // System errors
  SYSTEM_RATE_LIMIT: '429',
  SYSTEM_INTERNAL_ERROR: '500',
  SYSTEM_SERVICE_UNAVAILABLE: '503',
  SYSTEM_TIMEOUT: 'TIMEOUT',
} as const;

/**
 * Sandata Status Codes
 */
export const SANDATA_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  ERROR: 'error',
  RETRYING: 'retrying',
} as const;

/**
 * Export default config
 */
export default sandataConfig;

/**
 * Kill switch - allows instant disabling of Sandata submissions
 * Set SANDATA_KILL_SWITCH=true in environment to disable all submissions
 */
export function isSandataKillSwitchActive(): boolean {
  return process.env.SANDATA_KILL_SWITCH === 'true';
}

/**
 * Check if Sandata is enabled and ready
 */
export function isSandataEnabled(): boolean {
  if (isSandataKillSwitchActive()) {
    logger.warn('SANDATA KILL SWITCH ACTIVE - All submissions disabled');
    return false;
  }

  return sandataConfig.featureFlags.enabled && sandataConfig.featureFlags.submissionsEnabled;
}
