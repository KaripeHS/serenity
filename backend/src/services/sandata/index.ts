/**
 * Sandata Alternative EVV Services
 * Export all Sandata integration services, types, and utilities
 *
 * @module services/sandata
 */

// Types
export * from './types';

// HTTP Client
import { SandataClient, getSandataClient, resetSandataClient } from './client';
export { SandataClient, getSandataClient, resetSandataClient };

// Validator
import { SandataValidatorService, getSandataValidator } from './validator.service';
export { SandataValidatorService, getSandataValidator };

// Orchestration Services
import {
  SandataIndividualsService,
  getSandataIndividualsService,
  resetSandataIndividualsService,
} from './individuals.service';

export {
  SandataIndividualsService,
  getSandataIndividualsService,
  resetSandataIndividualsService,
};

import {
  SandataEmployeesService,
  getSandataEmployeesService,
  resetSandataEmployeesService,
} from './employees.service';

export {
  SandataEmployeesService,
  getSandataEmployeesService,
  resetSandataEmployeesService,
};

import {
  SandataVisitsService,
  getSandataVisitsService,
  resetSandataVisitsService,
} from './visits.service';

export {
  SandataVisitsService,
  getSandataVisitsService,
  resetSandataVisitsService,
};

import {
  SandataCorrectionsService,
  getSandataCorrectionsService,
  resetSandataCorrectionsService,
} from './corrections.service';

export {
  SandataCorrectionsService,
  getSandataCorrectionsService,
  resetSandataCorrectionsService,
};

// Utilities
export * as VisitKeyUtils from './visitKey';
export * as RoundingUtils from './rounding';

// Configuration (re-export for convenience)
import {
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
};

/**
 * Complete Sandata service facade
 * Provides a unified interface to all Sandata functionality
 */
export class SandataService {
  private static instance: SandataService;

  private constructor(
    public readonly client: ReturnType<typeof getSandataClient>,
    public readonly validator: ReturnType<typeof getSandataValidator>
  ) { }

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
