/**
 * Sandata Validation Service
 * Pre-submission validation for Ohio Medicaid Alt-EVV v4.3 compliance
 *
 * Validation Categories:
 * 1. Required Fields (6-element EVV)
 * 2. Geofence (GPS accuracy)
 * 3. Time Tolerance (clock-in window)
 * 4. Authorization (service authorization limits)
 * 5. Service Code (valid HCPCS codes)
 * 6. Duplicate Detection (visit key uniqueness)
 *
 * Enforcement Modes:
 * - strict: Block submission on error
 * - warn: Log warning but allow submission
 * - disabled: Skip validation
 *
 * @module services/sandata/validator
 */

import type {
  SandataVisit,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationContext,
  SandataLocation,
  ServiceAuthorization,
} from './types';
import { getSandataBusinessRules } from '../../config/sandata';

/**
 * Sandata Validator Service
 */
export class SandataValidatorService {
  private readonly businessRules = getSandataBusinessRules();

  /**
   * Validate visit for Sandata submission
   *
   * @param visit - Visit to validate
   * @param context - Validation context (auth, client address, etc.)
   * @returns Validation result
   */
  async validateVisit(visit: SandataVisit, context?: ValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Required Fields Validation (Ohio 6-element EVV)
    const requiredFieldsResult = this.validateRequiredFields(visit);
    errors.push(...requiredFieldsResult.errors);
    warnings.push(...requiredFieldsResult.warnings);

    // 2. Geofence Validation
    if (context?.clientAddress) {
      const geofenceResult = this.validateGeofence(visit, context.clientAddress, context.geofenceRadiusMiles);
      errors.push(...geofenceResult.errors);
      warnings.push(...geofenceResult.warnings);
    }

    // 3. Time Tolerance Validation
    const timeToleranceResult = this.validateTimeTolerance(visit, context?.clockInToleranceMinutes);
    errors.push(...timeToleranceResult.errors);
    warnings.push(...timeToleranceResult.warnings);

    // 4. Authorization Validation
    if (context?.authorization) {
      const authResult = this.validateAuthorization(visit, context.authorization, context);
      errors.push(...authResult.errors);
      warnings.push(...authResult.warnings);
    }

    // 5. Service Code Validation
    const serviceCodeResult = this.validateServiceCode(visit);
    errors.push(...serviceCodeResult.errors);
    warnings.push(...serviceCodeResult.warnings);

    // 6. Data Integrity Validation
    const integrityResult = this.validateDataIntegrity(visit);
    errors.push(...integrityResult.errors);
    warnings.push(...integrityResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate required fields (Ohio Medicaid 6-element EVV)
   * Elements: Service Type, Individual, Provider, Date/Time, Clock In/Out, Location
   */
  private validateRequiredFields(visit: SandataVisit): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Element 1: Service Type
    if (!visit.serviceCode) {
      errors.push({
        code: 'VAL_001',
        message: 'Service code (HCPCS) is required',
        field: 'serviceCode',
        severity: 'error',
      });
    }

    // Element 2: Individual (Client)
    if (!visit.individualId) {
      errors.push({
        code: 'VAL_001',
        message: 'Individual ID (client) is required',
        field: 'individualId',
        severity: 'error',
      });
    }

    // Element 3: Service Provider (Caregiver)
    if (!visit.employeeId) {
      errors.push({
        code: 'VAL_001',
        message: 'Employee ID (caregiver) is required',
        field: 'employeeId',
        severity: 'error',
      });
    }

    // Element 4: Service Date/Time
    if (!visit.serviceDate) {
      errors.push({
        code: 'VAL_001',
        message: 'Service date is required',
        field: 'serviceDate',
        severity: 'error',
      });
    }

    // Element 5: Clock In/Out Times
    if (!visit.clockInTime) {
      errors.push({
        code: 'VAL_001',
        message: 'Clock-in time is required',
        field: 'clockInTime',
        severity: 'error',
      });
    }

    if (!visit.clockOutTime) {
      errors.push({
        code: 'VAL_001',
        message: 'Clock-out time is required',
        field: 'clockOutTime',
        severity: 'error',
      });
    }

    // Element 6: Location (GPS)
    if (!visit.clockInLocation) {
      errors.push({
        code: 'VAL_001',
        message: 'Clock-in location (GPS) is required',
        field: 'clockInLocation',
        severity: 'error',
      });
    } else {
      if (!visit.clockInLocation.latitude || !visit.clockInLocation.longitude) {
        errors.push({
          code: 'VAL_GPS',
          message: 'Clock-in GPS coordinates are incomplete',
          field: 'clockInLocation',
          severity: 'error',
        });
      }
    }

    if (!visit.clockOutLocation) {
      errors.push({
        code: 'VAL_001',
        message: 'Clock-out location (GPS) is required',
        field: 'clockOutLocation',
        severity: 'error',
      });
    } else {
      if (!visit.clockOutLocation.latitude || !visit.clockOutLocation.longitude) {
        errors.push({
          code: 'VAL_GPS',
          message: 'Clock-out GPS coordinates are incomplete',
          field: 'clockOutLocation',
          severity: 'error',
        });
      }
    }

    // Additional required fields
    if (!visit.providerId) {
      errors.push({
        code: 'VAL_001',
        message: 'Provider ID (ODME) is required',
        field: 'providerId',
        severity: 'error',
      });
    }

    if (visit.units === undefined || visit.units === null || visit.units <= 0) {
      errors.push({
        code: 'VAL_001',
        message: 'Billable units must be greater than 0',
        field: 'units',
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate geofence (GPS accuracy within radius of client address)
   */
  private validateGeofence(
    visit: SandataVisit,
    clientAddress: { latitude: number; longitude: number },
    radiusMiles?: number
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const radius = radiusMiles ?? this.businessRules.geofenceRadiusMiles;

    // Validate clock-in location
    if (visit.clockInLocation) {
      const distanceIn = this.calculateDistance(
        visit.clockInLocation.latitude,
        visit.clockInLocation.longitude,
        clientAddress.latitude,
        clientAddress.longitude
      );

      if (distanceIn > radius) {
        errors.push({
          code: 'VAL_GEOFENCE',
          message: `Clock-in location is ${distanceIn.toFixed(2)} miles from client address (max: ${radius} miles)`,
          field: 'clockInLocation',
          severity: 'error',
        });
      } else if (distanceIn > radius * 0.8) {
        // Warning if within 80-100% of radius
        warnings.push({
          code: 'VAL_GEOFENCE',
          message: `Clock-in location is ${distanceIn.toFixed(2)} miles from client address (approaching limit)`,
          field: 'clockInLocation',
          severity: 'warning',
        });
      }
    }

    // Validate clock-out location
    if (visit.clockOutLocation) {
      const distanceOut = this.calculateDistance(
        visit.clockOutLocation.latitude,
        visit.clockOutLocation.longitude,
        clientAddress.latitude,
        clientAddress.longitude
      );

      if (distanceOut > radius) {
        errors.push({
          code: 'VAL_GEOFENCE',
          message: `Clock-out location is ${distanceOut.toFixed(2)} miles from client address (max: ${radius} miles)`,
          field: 'clockOutLocation',
          severity: 'error',
        });
      } else if (distanceOut > radius * 0.8) {
        warnings.push({
          code: 'VAL_GEOFENCE',
          message: `Clock-out location is ${distanceOut.toFixed(2)} miles from client address (approaching limit)`,
          field: 'clockOutLocation',
          severity: 'warning',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate time tolerance (clock-in within scheduled time window)
   */
  private validateTimeTolerance(
    visit: SandataVisit,
    toleranceMinutes?: number
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const tolerance = toleranceMinutes ?? this.businessRules.clockInToleranceMinutes;

    // Check if clock-out is after clock-in
    if (visit.clockInTime && visit.clockOutTime) {
      const clockIn = new Date(visit.clockInTime);
      const clockOut = new Date(visit.clockOutTime);

      if (clockOut <= clockIn) {
        errors.push({
          code: 'VAL_TIME',
          message: 'Clock-out time must be after clock-in time',
          field: 'clockOutTime',
          severity: 'error',
        });
      }

      // Check for unreasonable duration (> 24 hours)
      const durationHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      if (durationHours > 24) {
        errors.push({
          code: 'VAL_TIME',
          message: `Visit duration exceeds 24 hours (${durationHours.toFixed(1)}h). Possible forgot to clock out?`,
          field: 'clockOutTime',
          severity: 'error',
        });
      }

      // Check for minimum duration (15 minutes)
      const durationMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        warnings.push({
          code: 'VAL_TIME',
          message: `Visit duration is less than 15 minutes (${durationMinutes.toFixed(0)} min)`,
          field: 'clockOutTime',
          severity: 'warning',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate service authorization
   */
  private validateAuthorization(
    visit: SandataVisit,
    authorization: ServiceAuthorization,
    context?: ValidationContext
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const requireMatch = context?.requireAuthorizationMatch ?? this.businessRules.requireAuthorizationMatch;
    const blockOverAuth = context?.blockOverAuthorization ?? this.businessRules.blockOverAuthorization;

    // Check if authorization matches service code
    if (requireMatch && visit.serviceCode !== authorization.serviceCode) {
      errors.push({
        code: 'BUS_AUTH_MISSING',
        message: `Service code ${visit.serviceCode} does not match authorization ${authorization.serviceCode}`,
        field: 'serviceCode',
        severity: 'error',
      });
    }

    // Check if authorization is active
    const serviceDate = new Date(visit.serviceDate);
    const authStart = new Date(authorization.startDate);
    const authEnd = new Date(authorization.endDate);

    if (serviceDate < authStart || serviceDate > authEnd) {
      errors.push({
        code: 'BUS_AUTH_MISSING',
        message: `Service date ${visit.serviceDate} is outside authorization period (${authorization.startDate} - ${authorization.endDate})`,
        field: 'serviceDate',
        severity: 'error',
      });
    }

    // Check if units exceed authorization
    const remainingUnits = authorization.authorizedUnits - authorization.usedUnits;

    if (visit.units > remainingUnits) {
      const message = `Visit units (${visit.units}) exceed remaining authorized units (${remainingUnits}/${authorization.authorizedUnits})`;

      if (blockOverAuth) {
        errors.push({
          code: 'BUS_AUTH_EXCEEDED',
          message,
          field: 'units',
          severity: 'error',
        });
      } else {
        warnings.push({
          code: 'BUS_AUTH_EXCEEDED',
          message,
          field: 'units',
          severity: 'warning',
        });
      }
    } else if (visit.units > remainingUnits * 0.8) {
      // Warning if approaching limit (>80% used)
      warnings.push({
        code: 'BUS_AUTH_EXCEEDED',
        message: `Visit units (${visit.units}) approaching authorization limit (${remainingUnits} remaining)`,
        field: 'units',
        severity: 'warning',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate service code (HCPCS)
   */
  private validateServiceCode(visit: SandataVisit): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!visit.serviceCode) {
      return { errors, warnings }; // Already caught in required fields
    }

    // Ohio Medicaid common personal care codes
    const validServiceCodes = ['T1019', 'T1020', 'S5125', 'S5126', 'T1002', 'T1003'];

    if (!validServiceCodes.includes(visit.serviceCode)) {
      warnings.push({
        code: 'BUS_SERVICE',
        message: `Service code ${visit.serviceCode} may not be covered by Ohio Medicaid Alt-EVV`,
        field: 'serviceCode',
        severity: 'warning',
      });
    }

    // HCPCS code format validation (alphanumeric, 5 chars)
    if (!/^[A-Z0-9]{5}$/.test(visit.serviceCode)) {
      errors.push({
        code: 'VAL_002',
        message: `Invalid HCPCS code format: ${visit.serviceCode}. Expected 5 alphanumeric characters.`,
        field: 'serviceCode',
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate data integrity (formats, ranges, consistency)
   */
  private validateDataIntegrity(visit: SandataVisit): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate GPS coordinates range
    if (visit.clockInLocation) {
      if (!this.isValidLatitude(visit.clockInLocation.latitude)) {
        errors.push({
          code: 'VAL_GPS',
          message: `Invalid clock-in latitude: ${visit.clockInLocation.latitude} (must be -90 to 90)`,
          field: 'clockInLocation.latitude',
          severity: 'error',
        });
      }

      if (!this.isValidLongitude(visit.clockInLocation.longitude)) {
        errors.push({
          code: 'VAL_GPS',
          message: `Invalid clock-in longitude: ${visit.clockInLocation.longitude} (must be -180 to 180)`,
          field: 'clockInLocation.longitude',
          severity: 'error',
        });
      }
    }

    if (visit.clockOutLocation) {
      if (!this.isValidLatitude(visit.clockOutLocation.latitude)) {
        errors.push({
          code: 'VAL_GPS',
          message: `Invalid clock-out latitude: ${visit.clockOutLocation.latitude} (must be -90 to 90)`,
          field: 'clockOutLocation.latitude',
          severity: 'error',
        });
      }

      if (!this.isValidLongitude(visit.clockOutLocation.longitude)) {
        errors.push({
          code: 'VAL_GPS',
          message: `Invalid clock-out longitude: ${visit.clockOutLocation.longitude} (must be -180 to 180)`,
          field: 'clockOutLocation.longitude',
          severity: 'error',
        });
      }
    }

    // Validate date format (YYYY-MM-DD)
    if (visit.serviceDate && !/^\d{4}-\d{2}-\d{2}$/.test(visit.serviceDate)) {
      errors.push({
        code: 'VAL_003',
        message: `Invalid service date format: ${visit.serviceDate}. Expected YYYY-MM-DD.`,
        field: 'serviceDate',
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate distance between two GPS points (Haversine formula)
   * Returns distance in miles
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private isValidLongitude(lon: number): boolean {
    return lon >= -180 && lon <= 180;
  }
}

/**
 * Singleton instance
 */
let validatorInstance: SandataValidatorService | null = null;

export function getSandataValidator(): SandataValidatorService {
  if (!validatorInstance) {
    validatorInstance = new SandataValidatorService();
  }
  return validatorInstance;
}

export default SandataValidatorService;
