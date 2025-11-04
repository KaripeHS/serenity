/**
 * Ohio Alt-EVV Appendix G Validator Service
 * Validates Payer/Program/Procedure/Modifier combinations for Ohio Alt-EVV v4.3
 *
 * CRITICAL: Appendix G validation is REQUIRED to prevent visit rejections
 *
 * Appendix G contains ~200 valid combinations of:
 * - Payer (5-character code, e.g., "ODJFS")
 * - PayerProgram (e.g., "PASSPORT", "MYCARE")
 * - ProcedureCode (HCPCS code, e.g., "T1019", "S5125")
 * - Modifiers (array of modifier codes, e.g., ["U4", "UD"])
 *
 * Invalid combinations will be rejected by Sandata with error code BUS_SERVICE
 * or VAL_001, resulting in unpaid visits and compliance violations.
 *
 * Features:
 * - Validates payer/program/procedure combinations against Appendix G
 * - Validates modifiers are allowed for specific procedure codes
 * - Caches Appendix G data for performance
 * - Provides detailed error messages for invalid combinations
 * - Supports loading Appendix G from database or configuration file
 *
 * @module services/sandata/appendix-g-validator.service
 */

import type { AppendixGCombination } from './ohio-types';

/**
 * Validation result for Appendix G check
 */
export interface AppendixGValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  matchedCombination?: AppendixGCombination;
}

/**
 * Appendix G entry with all fields
 */
export interface AppendixGEntry {
  payer: string;
  payerProgram: string;
  procedureCode: string;
  validModifiers: string[];
  description?: string;
  effectiveDate?: string;
  endDate?: string;
  requiresAuthorization?: boolean;
  maxUnitsPerDay?: number;
  maxUnitsPerWeek?: number;
}

/**
 * Ohio Alt-EVV Appendix G Validator Service
 */
export class AppendixGValidatorService {
  private appendixGCache: Map<string, AppendixGEntry> = new Map();
  private cacheInitialized: boolean = false;

  /**
   * Validate payer/program/procedure/modifier combination
   *
   * @param payer - Payer code (e.g., "ODJFS")
   * @param payerProgram - Payer program code (e.g., "PASSPORT")
   * @param procedureCode - HCPCS procedure code (e.g., "T1019")
   * @param modifiers - Array of modifier codes (e.g., ["U4", "UD"])
   * @returns Validation result with errors if invalid
   */
  async validate(
    payer: string,
    payerProgram: string,
    procedureCode: string,
    modifiers: string[] = []
  ): Promise<AppendixGValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Ensure Appendix G data is loaded
      await this.ensureCacheInitialized();

      // Normalize inputs (uppercase, trim whitespace)
      const normalizedPayer = payer.trim().toUpperCase();
      const normalizedProgram = payerProgram.trim().toUpperCase();
      const normalizedProcedure = procedureCode.trim().toUpperCase();
      const normalizedModifiers = modifiers.map((m) => m.trim().toUpperCase());

      // Find matching combination
      const key = this.generateCacheKey(normalizedPayer, normalizedProgram, normalizedProcedure);
      const entry = this.appendixGCache.get(key);

      if (!entry) {
        errors.push(
          `Invalid payer/program/procedure combination: ` +
            `Payer="${normalizedPayer}", Program="${normalizedProgram}", Procedure="${normalizedProcedure}". ` +
            `This combination is not in Ohio Alt-EVV Appendix G and will be rejected by Sandata.`
        );

        // Provide helpful suggestions
        const suggestions = this.findSimilarCombinations(
          normalizedPayer,
          normalizedProgram,
          normalizedProcedure
        );
        if (suggestions.length > 0) {
          warnings.push(
            `Did you mean one of these valid combinations? ${suggestions.join(', ')}`
          );
        }

        return {
          isValid: false,
          errors,
          warnings,
        };
      }

      // Validate modifiers
      if (normalizedModifiers.length > 0) {
        const invalidModifiers = normalizedModifiers.filter(
          (mod) => !entry.validModifiers.includes(mod)
        );

        if (invalidModifiers.length > 0) {
          errors.push(
            `Invalid modifiers for ${normalizedProcedure}: [${invalidModifiers.join(', ')}]. ` +
              `Valid modifiers for this procedure are: [${entry.validModifiers.join(', ')}]`
          );
        }
      } else {
        // No modifiers provided - check if they're required
        if (entry.validModifiers.length > 0) {
          warnings.push(
            `No modifiers provided for ${normalizedProcedure}. ` +
              `Valid modifiers are: [${entry.validModifiers.join(', ')}]`
          );
        }
      }

      // Check date validity (if effective/end dates are set)
      if (entry.effectiveDate || entry.endDate) {
        const today = new Date().toISOString().split('T')[0];

        if (entry.effectiveDate && today < entry.effectiveDate) {
          errors.push(
            `Procedure ${normalizedProcedure} is not yet effective. Effective date: ${entry.effectiveDate}`
          );
        }

        if (entry.endDate && today > entry.endDate) {
          errors.push(
            `Procedure ${normalizedProcedure} is no longer valid. End date: ${entry.endDate}`
          );
        }
      }

      // Add warnings for special requirements
      if (entry.requiresAuthorization) {
        warnings.push(
          `Procedure ${normalizedProcedure} requires prior authorization. Ensure authorization number is provided.`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        matchedCombination: entry,
      };
    } catch (error) {
      errors.push(`Appendix G validation failed: ${this.getErrorMessage(error)}`);
      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Get all valid procedure codes for a payer/program combination
   *
   * @param payer - Payer code
   * @param payerProgram - Payer program code
   * @returns Array of valid procedure codes
   */
  async getValidProcedureCodes(payer: string, payerProgram: string): Promise<string[]> {
    await this.ensureCacheInitialized();

    const normalizedPayer = payer.trim().toUpperCase();
    const normalizedProgram = payerProgram.trim().toUpperCase();

    const procedureCodes: string[] = [];

    for (const entry of this.appendixGCache.values()) {
      if (entry.payer === normalizedPayer && entry.payerProgram === normalizedProgram) {
        procedureCodes.push(entry.procedureCode);
      }
    }

    return procedureCodes.sort();
  }

  /**
   * Get all valid payer programs for a payer
   *
   * @param payer - Payer code
   * @returns Array of valid payer programs
   */
  async getValidPayerPrograms(payer: string): Promise<string[]> {
    await this.ensureCacheInitialized();

    const normalizedPayer = payer.trim().toUpperCase();
    const programs = new Set<string>();

    for (const entry of this.appendixGCache.values()) {
      if (entry.payer === normalizedPayer) {
        programs.add(entry.payerProgram);
      }
    }

    return Array.from(programs).sort();
  }

  /**
   * Get valid modifiers for a procedure code
   *
   * @param payer - Payer code
   * @param payerProgram - Payer program code
   * @param procedureCode - HCPCS procedure code
   * @returns Array of valid modifiers
   */
  async getValidModifiers(
    payer: string,
    payerProgram: string,
    procedureCode: string
  ): Promise<string[]> {
    await this.ensureCacheInitialized();

    const key = this.generateCacheKey(
      payer.trim().toUpperCase(),
      payerProgram.trim().toUpperCase(),
      procedureCode.trim().toUpperCase()
    );

    const entry = this.appendixGCache.get(key);
    return entry?.validModifiers || [];
  }

  /**
   * Initialize Appendix G cache
   * Loads data from database or configuration file
   */
  private async ensureCacheInitialized(): Promise<void> {
    if (this.cacheInitialized) {
      return;
    }

    // Load Appendix G data
    // TODO: Load from database in production
    // For Phase 1, use hardcoded sample data
    await this.loadAppendixGData();

    this.cacheInitialized = true;
  }

  /**
   * Load Appendix G data into cache
   * Loads from database (migration 023_appendix_g_payer_procedure_codes.sql)
   */
  private async loadAppendixGData(): Promise<void> {
    try {
      // Try to load from database
      await this.loadFromDatabase();
    } catch (error) {
      // Fallback to sample data if database not available
      console.warn('[AppendixG] Failed to load from database, using sample data:', error);
      await this.loadSampleData();
    }
  }

  /**
   * Load Appendix G data from database
   */
  private async loadFromDatabase(): Promise<void> {
    const { getDbClient } = await import('../../database/client');
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        payer,
        payer_program AS "payerProgram",
        procedure_code AS "procedureCode",
        valid_modifiers AS "validModifiers",
        description,
        requires_authorization AS "requiresAuthorization",
        max_units_per_day AS "maxUnitsPerDay",
        max_units_per_week AS "maxUnitsPerWeek",
        effective_date AS "effectiveDate",
        end_date AS "endDate"
      FROM appendix_g_codes
      WHERE is_active = TRUE
        AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      ORDER BY payer, payer_program, procedure_code
    `);

    const entries: AppendixGEntry[] = result.rows.map((row) => ({
      payer: row.payer,
      payerProgram: row.payerProgram,
      procedureCode: row.procedureCode,
      validModifiers: row.validModifiers || [],
      description: row.description,
      requiresAuthorization: row.requiresAuthorization,
      maxUnitsPerDay: row.maxUnitsPerDay,
      maxUnitsPerWeek: row.maxUnitsPerWeek,
      effectiveDate: row.effectiveDate,
      endDate: row.endDate,
    }));

    // Populate cache
    for (const entry of entries) {
      const key = this.generateCacheKey(entry.payer, entry.payerProgram, entry.procedureCode);
      this.appendixGCache.set(key, entry);
    }

    console.log(`[AppendixG] Loaded ${this.appendixGCache.size} valid combinations from database`);
  }

  /**
   * Load sample Appendix G data (fallback when database not available)
   * DEPRECATED: Use database migration 023 instead
   */
  private async loadSampleData(): Promise<void> {
    // Sample Appendix G entries for Ohio Alt-EVV v4.3
    // CRITICAL: This is a PARTIAL list for demonstration
    // Full Appendix G should be loaded from database (migration 023)
    const sampleEntries: AppendixGEntry[] = [
      // ODJFS - PASSPORT Program
      {
        payer: 'ODJFS',
        payerProgram: 'PASSPORT',
        procedureCode: 'T1019',
        validModifiers: ['U4', 'UD'],
        description: 'Personal care services - PASSPORT',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'PASSPORT',
        procedureCode: 'S5125',
        validModifiers: ['U4', 'UD'],
        description: 'Attendant care services - PASSPORT',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'PASSPORT',
        procedureCode: 'T1020',
        validModifiers: ['U4', 'UD'],
        description: 'Personal care services - per diem - PASSPORT',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'PASSPORT',
        procedureCode: 'S5130',
        validModifiers: ['U4', 'UD'],
        description: 'Homemaker services - PASSPORT',
        requiresAuthorization: true,
      },

      // ODJFS - MYCARE Program
      {
        payer: 'ODJFS',
        payerProgram: 'MYCARE',
        procedureCode: 'T1019',
        validModifiers: ['U4', 'UD'],
        description: 'Personal care services - MyCare Ohio',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'MYCARE',
        procedureCode: 'S5125',
        validModifiers: ['U4', 'UD'],
        description: 'Attendant care services - MyCare Ohio',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'MYCARE',
        procedureCode: 'S5130',
        validModifiers: ['U4', 'UD'],
        description: 'Homemaker services - MyCare Ohio',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'MYCARE',
        procedureCode: 'S5135',
        validModifiers: ['U4', 'UD'],
        description: 'Companion services - MyCare Ohio',
        requiresAuthorization: false,
      },

      // ODJFS - ASSISTED LIVING Program
      {
        payer: 'ODJFS',
        payerProgram: 'ASSISTEDLIVING',
        procedureCode: 'T1019',
        validModifiers: ['U4', 'UD'],
        description: 'Personal care services - Assisted Living',
        requiresAuthorization: true,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'ASSISTEDLIVING',
        procedureCode: 'S5125',
        validModifiers: ['U4', 'UD'],
        description: 'Attendant care services - Assisted Living',
        requiresAuthorization: true,
      },

      // ODJFS - PACE Program
      {
        payer: 'ODJFS',
        payerProgram: 'PACE',
        procedureCode: 'T1019',
        validModifiers: ['U4', 'UD'],
        description: 'Personal care services - PACE',
        requiresAuthorization: false,
      },
      {
        payer: 'ODJFS',
        payerProgram: 'PACE',
        procedureCode: 'S5125',
        validModifiers: ['U4', 'UD'],
        description: 'Attendant care services - PACE',
        requiresAuthorization: false,
      },

      // Add more combinations as needed...
      // TODO: Load full Appendix G from official ODM documentation
    ];

    // Populate cache
    for (const entry of sampleEntries) {
      const key = this.generateCacheKey(entry.payer, entry.payerProgram, entry.procedureCode);
      this.appendixGCache.set(key, entry);
    }

    console.log(`[AppendixG] Loaded ${this.appendixGCache.size} valid combinations into cache`);
  }

  /**
   * Generate cache key for payer/program/procedure combination
   */
  private generateCacheKey(payer: string, payerProgram: string, procedureCode: string): string {
    return `${payer}|${payerProgram}|${procedureCode}`;
  }

  /**
   * Find similar combinations (for suggestion purposes)
   */
  private findSimilarCombinations(
    payer: string,
    payerProgram: string,
    procedureCode: string
  ): string[] {
    const suggestions: string[] = [];

    // Find combinations with same payer and program
    for (const entry of this.appendixGCache.values()) {
      if (entry.payer === payer && entry.payerProgram === payerProgram) {
        suggestions.push(`${entry.procedureCode} (${entry.description || 'no description'})`);
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Clear cache (for testing or reloading)
   */
  clearCache(): void {
    this.appendixGCache.clear();
    this.cacheInitialized = false;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    initialized: boolean;
    payers: string[];
    programs: string[];
  } {
    const payers = new Set<string>();
    const programs = new Set<string>();

    for (const entry of this.appendixGCache.values()) {
      payers.add(entry.payer);
      programs.add(entry.payerProgram);
    }

    return {
      size: this.appendixGCache.size,
      initialized: this.cacheInitialized,
      payers: Array.from(payers).sort(),
      programs: Array.from(programs).sort(),
    };
  }

  /**
   * Export all Appendix G entries (for debugging/reporting)
   */
  async exportAllEntries(): Promise<AppendixGEntry[]> {
    await this.ensureCacheInitialized();
    return Array.from(this.appendixGCache.values());
  }

  /**
   * Import Appendix G entries from array
   * Use this to load official Appendix G data
   */
  importEntries(entries: AppendixGEntry[]): void {
    this.appendixGCache.clear();

    for (const entry of entries) {
      const key = this.generateCacheKey(entry.payer, entry.payerProgram, entry.procedureCode);
      this.appendixGCache.set(key, entry);
    }

    this.cacheInitialized = true;
    console.log(`[AppendixG] Imported ${this.appendixGCache.size} combinations`);
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Unknown error occurred';
  }
}

/**
 * Singleton instance
 */
let appendixGValidatorInstance: AppendixGValidatorService | null = null;

/**
 * Get Appendix G Validator Service singleton
 */
export function getAppendixGValidatorService(): AppendixGValidatorService {
  if (!appendixGValidatorInstance) {
    appendixGValidatorInstance = new AppendixGValidatorService();
  }
  return appendixGValidatorInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetAppendixGValidatorService(): void {
  appendixGValidatorInstance = null;
}

export default AppendixGValidatorService;
