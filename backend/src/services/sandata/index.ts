/**
 * Sandata Alternative EVV Services
 * Export all Sandata integration services, types, and utilities
 *
 * @module services/sandata
 */

// Types
export * from './types';

// HTTP Client
export { SandataClient, getSandataClient, resetSandataClient } from './client';

// Validator
export { SandataValidatorService, getSandataValidator } from './validator.service';

// Orchestration Services
export {
  SandataIndividualsService,
  getSandataIndividualsService,
  resetSandataIndividualsService,
} from './individuals.service';

export {
  SandataEmployeesService,
  getSandataEmployeesService,
  resetSandataEmployeesService,
} from './employees.service';

export {
  SandataVisitsService,
  getSandataVisitsService,
  resetSandataVisitsService,
} from './visits.service';

export {
  SandataCorrectionsService,
  getSandataCorrectionsService,
  resetSandataCorrectionsService,
} from './corrections.service';

// Utilities
export * as VisitKeyUtils from './visitKey';
export * as RoundingUtils from './rounding';

// Configuration (re-export for convenience)
export {
  getActiveSandataConfig,
  getSandataBusinessRules,
  getSandataFeatureFlags,
  isSandataEnabled,
  isSandataKillSwitchActive,
  validateSandataConfig,
  SANDATA_ENDPOINTS,
  SANDATA_ERROR_CODES,
  SANDATA_STATUS,
} from '../../config/sandata';

/**
 * Complete Sandata service facade
 * Provides a unified interface to all Sandata functionality
 */
export class SandataService {
  private static instance: SandataService;

  private constructor(
    public readonly client: ReturnType<typeof getSandataClient>,
    public readonly validator: ReturnType<typeof getSandataValidator>
  ) {}

  static getInstance(): SandataService {
    if (!SandataService.instance) {
      SandataService.instance = new SandataService(
        getSandataClient(),
        getSandataValidator()
      );
    }
    return SandataService.instance;
  }

  /**
   * Health check - verify Sandata API is reachable
   */
  async healthCheck(): Promise<boolean> {
    return await this.client.healthCheck();
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      enabled: isSandataEnabled(),
      killSwitchActive: isSandataKillSwitchActive(),
      config: this.client.getConfig(),
      businessRules: getSandataBusinessRules(),
      featureFlags: getSandataFeatureFlags(),
    };
  }
}

/**
 * Get Sandata service facade
 */
export function getSandataService(): SandataService {
  return SandataService.getInstance();
}

export default {
  getSandataService,
  getSandataClient,
  getSandataValidator,
  getSandataIndividualsService,
  getSandataEmployeesService,
  getSandataVisitsService,
  getSandataCorrectionsService,
};
