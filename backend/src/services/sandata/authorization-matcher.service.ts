/**
 * Ohio Alt-EVV Authorization Matcher Service
 * Validates visits against authorizations before Sandata submission
 *
 * CRITICAL: Authorization matching prevents BUS_AUTH_MISSING and BUS_AUTH_EXCEEDED rejections
 *
 * Features:
 * - Validates visit has active authorization
 * - Checks authorization units remaining
 * - Prevents over-authorization (blocks if configured)
 * - Handles authorization date ranges
 * - Supports multiple authorizations per client/service
 * - Claims gate logic (disabled/warn/strict modes)
 *
 * @module services/sandata/authorization-matcher.service
 */

import { getSandataBusinessRules } from '../../config/sandata';

/**
 * Authorization data from database
 */
export interface Authorization {
  id: string;
  clientId: string;
  payer: string;
  payerProgram: string;
  procedureCode: string;
  modifiers?: string[];

  // Units
  authorizedUnits: number;
  usedUnits: number;
  remainingUnits: number;

  // Date range
  startDate: Date;
  endDate: Date;

  // Status
  status: 'active' | 'expired' | 'suspended' | 'pending';
  authorizationNumber: string;

  // Metadata
  requiresPriorAuth: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Visit data for authorization matching
 */
export interface VisitForAuthCheck {
  id: string;
  clientId: string;
  serviceDate: Date;
  payer: string;
  payerProgram: string;
  procedureCode: string;
  modifiers?: string[];
  units: number; // Billable units for this visit
}

/**
 * Authorization match result
 */
export interface AuthorizationMatchResult {
  isValid: boolean;
  matchedAuthorization?: Authorization;
  errors: string[];
  warnings: string[];
  severity: 'allow' | 'warn' | 'block';
}

/**
 * Claims gate mode
 */
export type ClaimsGateMode = 'disabled' | 'warn' | 'strict';

/**
 * Ohio Alt-EVV Authorization Matcher Service
 */
export class AuthorizationMatcherService {
  private readonly businessRules = getSandataBusinessRules();

  /**
   * Validate visit against authorizations
   *
   * @param visit - Visit data to validate
   * @param authorizations - Array of authorizations for this client
   * @param claimsGateMode - Claims gate mode ('disabled', 'warn', 'strict')
   * @returns Authorization match result
   */
  async validateVisit(
    visit: VisitForAuthCheck,
    authorizations: Authorization[],
    claimsGateMode: ClaimsGateMode = 'warn'
  ): Promise<AuthorizationMatchResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // If claims gate is disabled, skip all validation
    if (claimsGateMode === 'disabled') {
      return {
        isValid: true,
        errors: [],
        warnings: ['Claims gate is disabled - visit not validated against authorizations'],
        severity: 'allow',
      };
    }

    // Filter authorizations that match this visit
    const matchingAuthorizations = this.findMatchingAuthorizations(visit, authorizations);

    if (matchingAuthorizations.length === 0) {
      const error = `No active authorization found for client ${visit.clientId}, ` +
        `service ${visit.procedureCode} (${visit.payer}/${visit.payerProgram}) ` +
        `on ${visit.serviceDate.toISOString().split('T')[0]}`;

      if (this.businessRules.requireAuthorizationMatch) {
        errors.push(error);
        return {
          isValid: false,
          errors,
          warnings,
          severity: claimsGateMode === 'strict' ? 'block' : 'warn',
        };
      } else {
        warnings.push(error + ' (authorization not required by configuration)');
        return {
          isValid: true,
          errors,
          warnings,
          severity: 'warn',
        };
      }
    }

    // Find best matching authorization (most units remaining)
    const bestMatch = this.selectBestAuthorization(matchingAuthorizations, visit);

    // Check if authorization has enough units
    if (bestMatch.remainingUnits < visit.units) {
      const error = `Authorization ${bestMatch.authorizationNumber} has insufficient units. ` +
        `Remaining: ${bestMatch.remainingUnits}, Required: ${visit.units}. ` +
        `This will exceed authorized units.`;

      if (this.businessRules.blockOverAuthorization) {
        errors.push(error);
        return {
          isValid: false,
          matchedAuthorization: bestMatch,
          errors,
          warnings,
          severity: claimsGateMode === 'strict' ? 'block' : 'warn',
        };
      } else {
        warnings.push(error + ' (over-authorization allowed by configuration)');
      }
    }

    // Check if authorization is active
    if (bestMatch.status !== 'active') {
      errors.push(
        `Authorization ${bestMatch.authorizationNumber} is not active (status: ${bestMatch.status})`
      );
      return {
        isValid: false,
        matchedAuthorization: bestMatch,
        errors,
        warnings,
        severity: 'block',
      };
    }

    // Check if visit date is within authorization date range
    if (visit.serviceDate < bestMatch.startDate || visit.serviceDate > bestMatch.endDate) {
      errors.push(
        `Visit date ${visit.serviceDate.toISOString().split('T')[0]} is outside authorization date range ` +
          `(${bestMatch.startDate.toISOString().split('T')[0]} to ${bestMatch.endDate.toISOString().split('T')[0]})`
      );
      return {
        isValid: false,
        matchedAuthorization: bestMatch,
        errors,
        warnings,
        severity: 'block',
      };
    }

    // Success - authorization is valid
    return {
      isValid: true,
      matchedAuthorization: bestMatch,
      errors: [],
      warnings,
      severity: 'allow',
    };
  }

  /**
   * Find authorizations that match the visit
   *
   * @param visit - Visit data
   * @param authorizations - Array of authorizations
   * @returns Array of matching authorizations
   */
  private findMatchingAuthorizations(
    visit: VisitForAuthCheck,
    authorizations: Authorization[]
  ): Authorization[] {
    return authorizations.filter((auth) => {
      // Must match client
      if (auth.clientId !== visit.clientId) {
        return false;
      }

      // Must match payer/program
      if (auth.payer !== visit.payer || auth.payerProgram !== visit.payerProgram) {
        return false;
      }

      // Must match procedure code
      if (auth.procedureCode !== visit.procedureCode) {
        return false;
      }

      // Check if modifiers match (if authorization specifies modifiers)
      if (auth.modifiers && auth.modifiers.length > 0 && visit.modifiers) {
        const authModsSet = new Set(auth.modifiers);
        const visitModsMatch = visit.modifiers.every((mod) => authModsSet.has(mod));
        if (!visitModsMatch) {
          return false;
        }
      }

      // Must be active
      if (auth.status !== 'active') {
        return false;
      }

      // Must be within date range
      if (visit.serviceDate < auth.startDate || visit.serviceDate > auth.endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Select best authorization from matching authorizations
   * Prefers authorization with most units remaining
   *
   * @param authorizations - Array of matching authorizations
   * @param visit - Visit data
   * @returns Best matching authorization
   */
  private selectBestAuthorization(
    authorizations: Authorization[],
    visit: VisitForAuthCheck
  ): Authorization {
    // Sort by remaining units (descending)
    const sorted = [...authorizations].sort((a, b) => b.remainingUnits - a.remainingUnits);

    // Return authorization with most units remaining
    return sorted[0];
  }

  /**
   * Calculate units for a visit
   * Based on clock in/out times and rounding rules
   *
   * @param clockInTime - Clock in timestamp
   * @param clockOutTime - Clock out timestamp
   * @param roundingMinutes - Rounding interval (6 or 15 minutes)
   * @returns Number of billable units (15-minute increments)
   */
  calculateUnits(
    clockInTime: Date,
    clockOutTime: Date,
    roundingMinutes: number = 6
  ): number {
    // Calculate duration in minutes
    const durationMs = clockOutTime.getTime() - clockInTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    // Round to nearest interval
    const roundedMinutes = Math.round(durationMinutes / roundingMinutes) * roundingMinutes;

    // Convert to 15-minute units (standard billing unit)
    const units = Math.ceil(roundedMinutes / 15);

    return units;
  }

  /**
   * Check if client has any active authorizations
   *
   * @param clientId - Client UUID
   * @param authorizations - Array of authorizations
   * @returns True if client has at least one active authorization
   */
  hasActiveAuthorizations(clientId: string, authorizations: Authorization[]): boolean {
    return authorizations.some(
      (auth) =>
        auth.clientId === clientId &&
        auth.status === 'active' &&
        new Date() >= auth.startDate &&
        new Date() <= auth.endDate
    );
  }

  /**
   * Get authorization summary for a client
   *
   * @param clientId - Client UUID
   * @param authorizations - Array of authorizations
   * @returns Authorization summary
   */
  getAuthorizationSummary(clientId: string, authorizations: Authorization[]): {
    totalAuthorizations: number;
    activeAuthorizations: number;
    totalUnitsAuthorized: number;
    totalUnitsUsed: number;
    totalUnitsRemaining: number;
  } {
    const clientAuths = authorizations.filter((auth) => auth.clientId === clientId);
    const activeAuths = clientAuths.filter((auth) => auth.status === 'active');

    const totalUnitsAuthorized = clientAuths.reduce((sum, auth) => sum + auth.authorizedUnits, 0);
    const totalUnitsUsed = clientAuths.reduce((sum, auth) => sum + auth.usedUnits, 0);
    const totalUnitsRemaining = clientAuths.reduce((sum, auth) => sum + auth.remainingUnits, 0);

    return {
      totalAuthorizations: clientAuths.length,
      activeAuthorizations: activeAuths.length,
      totalUnitsAuthorized,
      totalUnitsUsed,
      totalUnitsRemaining,
    };
  }
}

/**
 * Singleton instance
 */
let authorizationMatcherInstance: AuthorizationMatcherService | null = null;

/**
 * Get Authorization Matcher Service singleton
 */
export function getAuthorizationMatcherService(): AuthorizationMatcherService {
  if (!authorizationMatcherInstance) {
    authorizationMatcherInstance = new AuthorizationMatcherService();
  }
  return authorizationMatcherInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetAuthorizationMatcherService(): void {
  authorizationMatcherInstance = null;
}

export default AuthorizationMatcherService;
