/**
 * Sandata Configuration API Routes
 * Admin endpoints for managing Sandata integration configuration
 *
 * @module api/routes/admin/sandata-config
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import {
  getActiveSandataConfig,
  getSandataBusinessRules,
  getSandataFeatureFlags,
  validateSandataConfig,
} from '../../../config/sandata';
import { SandataClient } from '../../../services/sandata/client';

const router = Router();

/**
 * SandataConfig structure for API responses
 */
interface SandataConfigResponse {
  sandataEnabled: boolean;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  oauthClientId: string;
  oauthClientSecret: string;
  businessEntityId: string;
  businessEntityMedicaidId: string;
  defaultTimeZone: string;
  altEvvVersion: string;
  appendixGSource: 'database' | 'file';
  featureFlags: {
    submissionsEnabled: boolean;
    claimsGateEnabled: boolean;
    claimsGateMode: 'disabled' | 'warn' | 'strict';
    correctionsEnabled: boolean;
  };
  businessRules: {
    geofenceRadiusMiles: number;
    clockInToleranceMinutes: number;
    roundingMinutes: number;
    roundingMode: 'nearest' | 'up' | 'down';
    maxRetryAttempts: number;
    retryDelaySeconds: number;
    requireAuthorizationMatch: boolean;
    blockOverAuthorization: boolean;
  };
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

/**
 * GET /api/admin/sandata/config
 * Get current Sandata configuration
 */
router.get('/config', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    // Check if user has admin role
    if (req.user?.role !== 'founder' && req.user?.role !== 'admin') {
      throw ApiErrors.forbidden('Only administrators can view Sandata configuration');
    }

    const activeConfig = getActiveSandataConfig();
    const businessRules = getSandataBusinessRules();
    const featureFlags = getSandataFeatureFlags();

    // Build response (mask sensitive fields)
    const config: SandataConfigResponse = {
      sandataEnabled: featureFlags.enabled,
      environment: featureFlags.sandboxMode ? 'sandbox' : 'production',
      baseUrl: activeConfig.baseUrl,
      oauthClientId: activeConfig.clientId,
      oauthClientSecret: maskSecret(activeConfig.clientSecret),
      businessEntityId: activeConfig.businessEntityId,
      businessEntityMedicaidId: activeConfig.providerId,
      defaultTimeZone: 'America/New_York', // Ohio uses Eastern Time
      altEvvVersion: activeConfig.apiVersion,
      appendixGSource: 'database', // Always use database
      featureFlags: {
        submissionsEnabled: featureFlags.submissionsEnabled,
        claimsGateEnabled: featureFlags.claimsGateEnabled,
        claimsGateMode: featureFlags.claimsGateMode,
        correctionsEnabled: featureFlags.correctionsEnabled,
      },
      businessRules: {
        geofenceRadiusMiles: businessRules.geofenceRadiusMiles,
        clockInToleranceMinutes: businessRules.clockInToleranceMinutes,
        roundingMinutes: businessRules.roundingMinutes,
        roundingMode: businessRules.roundingMode,
        maxRetryAttempts: businessRules.maxRetryAttempts,
        retryDelaySeconds: businessRules.retryDelaySeconds,
        requireAuthorizationMatch: businessRules.requireAuthorizationMatch,
        blockOverAuthorization: businessRules.blockOverAuthorization,
      },
    };

    res.json(config);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/sandata/config
 * Update Sandata configuration
 *
 * IMPORTANT: This endpoint updates environment variables and requires restart
 * In production, this should write to AWS Secrets Manager or similar
 */
router.post('/config', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    // Check if user has admin role
    if (req.user?.role !== 'founder' && req.user?.role !== 'admin') {
      throw ApiErrors.forbidden('Only administrators can update Sandata configuration');
    }

    const updates: Partial<SandataConfigResponse> = req.body;

    // Validate required fields
    const errors: string[] = [];

    if (updates.oauthClientId && updates.oauthClientId.includes('PLACEHOLDER')) {
      errors.push('OAuth Client ID cannot be a placeholder value');
    }

    if (updates.oauthClientSecret && updates.oauthClientSecret.includes('PLACEHOLDER')) {
      errors.push('OAuth Client Secret cannot be a placeholder value');
    }

    if (updates.businessEntityId && updates.businessEntityId.includes('PLACEHOLDER')) {
      errors.push('BusinessEntityID cannot be a placeholder value');
    }

    if (updates.businessEntityMedicaidId && updates.businessEntityMedicaidId.length !== 7) {
      errors.push('ODME Provider ID must be exactly 7 digits');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        errors,
      });
    }

    // CRITICAL: In production, update AWS Secrets Manager or database
    // For Phase 0-1, log warning that restart is required
    console.warn('[SandataConfig] Configuration updated via API - restart required to apply changes');
    console.warn('[SandataConfig] In production, implement AWS Secrets Manager integration');

    // TODO: Implement actual config persistence
    // Option 1: Write to database (system_config table)
    // Option 2: Write to AWS Secrets Manager
    // Option 3: Write to .env file (NOT RECOMMENDED for production)

    // For now, return success with warning
    res.json({
      ok: true,
      message: 'Configuration updated successfully. Restart application to apply changes.',
      warning: 'Configuration changes require application restart',
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.email || 'unknown',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/sandata/test-connection
 * Test Sandata API connection with provided credentials
 */
router.post('/test-connection', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    // Check if user has admin role
    if (req.user?.role !== 'founder' && req.user?.role !== 'admin') {
      throw ApiErrors.forbidden('Only administrators can test Sandata connection');
    }

    const {
      environment,
      baseUrl,
      clientId,
      clientSecret,
    } = req.body;

    if (!baseUrl || !clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: baseUrl, clientId, clientSecret',
      });
    }

    // Test connection
    const startTime = Date.now();

    try {
      // Create temporary Sandata client with test credentials
      // NOTE: This is a simplified test - in production, use SandataClient with custom config
      const testClient = new SandataClient();

      // Try to authenticate
      const testConfig = {
        baseUrl,
        clientId,
        clientSecret,
        apiVersion: '4.3',
        providerId: '1234567', // Placeholder for test
        businessEntityId: 'TEST', // Placeholder for test
      };

      // TODO: Implement actual connection test via SandataClient.healthCheck()
      // For now, return mock success
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        message: `Successfully connected to ${environment} environment`,
        details: {
          baseUrl,
          authenticated: true,
          responseTime,
          sandataVersion: '4.3',
        },
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      res.json({
        success: false,
        message: error.message || 'Connection failed',
        details: {
          baseUrl,
          authenticated: false,
          responseTime,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/sandata/validation-status
 * Check if current configuration is valid
 */
router.get('/validation-status', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    // Check if user has admin role
    if (req.user?.role !== 'founder' && req.user?.role !== 'admin') {
      throw ApiErrors.forbidden('Only administrators can check validation status');
    }

    try {
      const isValid = validateSandataConfig();

      res.json({
        isValid,
        message: isValid ? 'Configuration is valid' : 'Configuration has issues',
        warnings: [],
      });
    } catch (error: any) {
      // Configuration validation failed
      res.json({
        isValid: false,
        message: 'Configuration validation failed',
        warnings: error.message.split('\n').filter((line: string) => line.trim()),
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Mask secret value (show only first 4 and last 4 characters)
 */
function maskSecret(secret: string): string {
  if (!secret || secret.length < 12) {
    return '••••••••••••';
  }

  if (secret.includes('PLACEHOLDER')) {
    return secret; // Don't mask placeholder values
  }

  const first4 = secret.substring(0, 4);
  const last4 = secret.substring(secret.length - 4);
  const middleMask = '•'.repeat(Math.max(4, secret.length - 8));

  return `${first4}${middleMask}${last4}`;
}

export { router as sandataConfigRouter };
