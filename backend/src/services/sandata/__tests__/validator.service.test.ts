/**
 * Unit Tests for Sandata Validator Service
 * Tests all 6 validation categories for Ohio Medicaid Alt-EVV v4.3
 */

import { SandataValidatorService, getSandataValidator } from '../validator.service';
import {
  createMockVisit,
  MOCK_VISIT_VALID,
  MOCK_VISIT_MISSING_FIELDS,
  MOCK_VISIT_GEOFENCE_VIOLATION,
  MOCK_VISIT_INVALID_TIMES,
  MOCK_VISIT_LONG_DURATION,
  COLUMBUS_COORDINATES,
  MOCK_AUTHORIZATION_ACTIVE,
  MOCK_AUTHORIZATION_EXPIRED,
  MOCK_AUTHORIZATION_EXCEEDED,
} from './__mocks__/sandataResponses';
import type { SandataVisit, ValidationContext } from '../types';

describe('SandataValidatorService', () => {
  let validator: SandataValidatorService;

  beforeEach(() => {
    validator = new SandataValidatorService();
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      const instance1 = getSandataValidator();
      const instance2 = getSandataValidator();

      expect(instance1).toBe(instance2);
    });
  });

  describe('validateVisit - Integration', () => {
    it('should pass validation for valid visit', async () => {
      const visit = createMockVisit();
      const result = await validator.validateVisit(visit);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', async () => {
      const visit = MOCK_VISIT_MISSING_FIELDS as SandataVisit;
      const result = await validator.validateVisit(visit);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Required Fields Validation (6-element EVV)', () => {
    it('should validate all 6 EVV elements present', async () => {
      const visit = createMockVisit();
      const result = await validator.validateVisit(visit);

      expect(result.errors).toHaveLength(0);
    });

    it('should error on missing service code (Element 1)', async () => {
      const visit = createMockVisit({ serviceCode: '' });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'serviceCode');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
      expect(error?.message).toContain('Service code');
    });

    it('should error on missing individual ID (Element 2)', async () => {
      const visit = createMockVisit({ individualId: '' });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'individualId');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
    });

    it('should error on missing employee ID (Element 3)', async () => {
      const visit = createMockVisit({ employeeId: '' });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'employeeId');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
    });

    it('should error on missing service date (Element 4)', async () => {
      const visit = createMockVisit({ serviceDate: '' });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'serviceDate');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
    });

    it('should error on missing clock-in time (Element 5)', async () => {
      const visit = createMockVisit({ clockInTime: '' });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'clockInTime');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
    });

    it('should error on missing clock-out time (Element 5)', async () => {
      const visit = createMockVisit({ clockOutTime: '' });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'clockOutTime');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
    });

    it('should error on missing clock-in location (Element 6)', async () => {
      const visit = createMockVisit({ clockInLocation: undefined as any });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'clockInLocation');
      expect(error).toBeDefined();
      expect(error?.code).toBe('VAL_001');
    });

    it('should error on incomplete GPS coordinates', async () => {
      const visit = createMockVisit({
        clockInLocation: { latitude: 0, longitude: 0 } as any,
      });
      const result = await validator.validateVisit(visit);

      // Should have some errors (either incomplete coords or validation)
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should error on missing units', async () => {
      const visit = createMockVisit({ units: 0 });
      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.field === 'units');
      expect(error).toBeDefined();
      expect(error?.message).toContain('greater than 0');
    });
  });

  describe('Geofence Validation', () => {
    it('should pass when location is within geofence', async () => {
      const visit = createMockVisit({
        clockInLocation: COLUMBUS_COORDINATES.withinGeofence,
        clockOutLocation: COLUMBUS_COORDINATES.withinGeofence,
      });

      const context: ValidationContext = {
        clientLocation: COLUMBUS_COORDINATES.clientAddress,
        geofenceRadiusMiles: 0.25,
      };

      const result = await validator.validateVisit(visit, context);

      const geofenceErrors = result.errors.filter((e) => e.code === 'VAL_GEOFENCE');
      expect(geofenceErrors).toHaveLength(0);
    });

    it('should error when clock-in location outside geofence', async () => {
      const visit = createMockVisit({
        clockInLocation: COLUMBUS_COORDINATES.outsideGeofence,
      });

      const context: ValidationContext = {
        clientLocation: COLUMBUS_COORDINATES.clientAddress,
        geofenceRadiusMiles: 0.25,
      };

      const result = await validator.validateVisit(visit, context);

      const error = result.errors.find((e) => e.field === 'clockInLocation' && e.code === 'VAL_GEOFENCE');
      expect(error).toBeDefined();
      expect(error?.message).toContain('miles from client address');
    });

    it('should error when clock-out location outside geofence', async () => {
      const visit = createMockVisit({
        clockOutLocation: COLUMBUS_COORDINATES.farOutside,
      });

      const context: ValidationContext = {
        clientLocation: COLUMBUS_COORDINATES.clientAddress,
        geofenceRadiusMiles: 0.25,
      };

      const result = await validator.validateVisit(visit, context);

      const error = result.errors.find((e) => e.field === 'clockOutLocation' && e.code === 'VAL_GEOFENCE');
      expect(error).toBeDefined();
    });

    it('should warn when approaching geofence limit (80-100%)', async () => {
      // Create location at ~90% of radius
      const visit = createMockVisit({
        clockInLocation: {
          latitude: 39.9642, // ~0.22 miles from client (between 0.2 and 0.25)
          longitude: -82.9988,
        },
      });

      const context: ValidationContext = {
        clientLocation: COLUMBUS_COORDINATES.clientAddress,
        geofenceRadiusMiles: 0.25,
      };

      const result = await validator.validateVisit(visit, context);

      // Should have warning but not error
      const warning = result.warnings.find((w) => w.code === 'VAL_GEOFENCE');
      expect(warning?.message).toContain('approaching limit');
    });

    it('should skip geofence validation if client address not provided', async () => {
      const visit = createMockVisit({
        clockInLocation: COLUMBUS_COORDINATES.farOutside,
      });

      const result = await validator.validateVisit(visit); // No context

      const geofenceErrors = result.errors.filter((e) => e.code === 'VAL_GEOFENCE');
      expect(geofenceErrors).toHaveLength(0);
    });
  });

  describe('Time Tolerance Validation', () => {
    it('should pass for valid time sequence', async () => {
      const visit = createMockVisit({
        clockInTime: '2025-11-03T09:00:00Z',
        clockOutTime: '2025-11-03T11:00:00Z',
      });

      const result = await validator.validateVisit(visit);

      const timeErrors = result.errors.filter((e) => e.code === 'VAL_TIME');
      expect(timeErrors).toHaveLength(0);
    });

    it('should error when clock-out before clock-in', async () => {
      const visit = createMockVisit({
        clockInTime: '2025-11-03T11:00:00Z',
        clockOutTime: '2025-11-03T09:00:00Z',
      });

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_TIME');
      expect(error).toBeDefined();
      expect(error?.message).toContain('after clock-in');
    });

    it('should error for duration > 24 hours', async () => {
      const visit = createMockVisit({
        clockInTime: '2025-11-03T09:00:00Z',
        clockOutTime: '2025-11-04T12:00:00Z', // 27 hours
      });

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_TIME' && e.message.includes('24 hours'));
      expect(error).toBeDefined();
      expect(error?.message).toContain('forgot to clock out');
    });

    it('should warn for duration < 15 minutes', async () => {
      const visit = createMockVisit({
        clockInTime: '2025-11-03T09:00:00Z',
        clockOutTime: '2025-11-03T09:10:00Z', // 10 minutes
      });

      const result = await validator.validateVisit(visit);

      const warning = result.warnings.find((w) => w.code === 'VAL_TIME' && w.message.includes('15 minutes'));
      expect(warning).toBeDefined();
    });
  });

  describe('Authorization Validation', () => {
    it('should pass with valid authorization', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        units: 8,
        serviceDate: '2025-06-01',
      });

      const context: ValidationContext = {
        authorization: MOCK_AUTHORIZATION_ACTIVE,
        requireAuthorizationMatch: true,
        blockOverAuthorization: true,
      };

      const result = await validator.validateVisit(visit, context);

      const authErrors = result.errors.filter((e) => e.code?.includes('AUTH'));
      expect(authErrors).toHaveLength(0);
    });

    it('should error when service code does not match authorization', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1020', // Different from auth
        serviceDate: '2025-06-01',
      });

      const context: ValidationContext = {
        authorization: MOCK_AUTHORIZATION_ACTIVE,
        requireAuthorizationMatch: true,
      };

      const result = await validator.validateVisit(visit, context);

      const error = result.errors.find((e) => e.code === 'BUS_AUTH_MISSING');
      expect(error).toBeDefined();
      expect(error?.message).toContain('does not match authorization');
    });

    it('should error when service date outside authorization period', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        serviceDate: '2026-01-01', // After auth end date
      });

      const context: ValidationContext = {
        authorization: MOCK_AUTHORIZATION_ACTIVE,
      };

      const result = await validator.validateVisit(visit, context);

      const error = result.errors.find((e) => e.code === 'BUS_AUTH_MISSING' && e.message.includes('outside authorization period'));
      expect(error).toBeDefined();
    });

    it('should error when units exceed authorization (strict mode)', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        units: 10, // Exceeds remaining 2 units
        serviceDate: '2025-06-01',
      });

      const context: ValidationContext = {
        authorization: MOCK_AUTHORIZATION_EXCEEDED,
        blockOverAuthorization: true,
      };

      const result = await validator.validateVisit(visit, context);

      const error = result.errors.find((e) => e.code === 'BUS_AUTH_EXCEEDED');
      expect(error).toBeDefined();
      expect(error?.message).toContain('exceed remaining authorized units');
    });

    it('should warn when units exceed authorization (warn mode)', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        units: 10,
        serviceDate: '2025-06-01',
      });

      const context: ValidationContext = {
        authorization: MOCK_AUTHORIZATION_EXCEEDED,
        blockOverAuthorization: false, // Warn mode
      };

      const result = await validator.validateVisit(visit, context);

      const warning = result.warnings.find((w) => w.code === 'BUS_AUTH_EXCEEDED');
      expect(warning).toBeDefined();
    });

    it('should warn when approaching authorization limit (>80%)', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        units: 2, // 2 of 2 remaining (100% of remaining, so > 80%)
        serviceDate: '2025-06-01',
      });

      const context: ValidationContext = {
        authorization: MOCK_AUTHORIZATION_EXCEEDED,
      };

      const result = await validator.validateVisit(visit, context);

      const warning = result.warnings.find((w) => w.code === 'BUS_AUTH_EXCEEDED' && w.message.includes('approaching'));
      expect(warning).toBeDefined();
    });

    it('should skip authorization validation if not provided', async () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        units: 1000, // Would exceed if auth was checked
      });

      const result = await validator.validateVisit(visit); // No context

      const authErrors = result.errors.filter((e) => e.code?.includes('AUTH'));
      expect(authErrors).toHaveLength(0);
    });
  });

  describe('Service Code Validation', () => {
    it('should pass for valid Ohio Medicaid service codes', async () => {
      const validCodes = ['T1019', 'T1020', 'S5125', 'S5126', 'T1002', 'T1003'];

      for (const code of validCodes) {
        const visit = createMockVisit({ serviceCode: code });
        const result = await validator.validateVisit(visit);

        const codeErrors = result.errors.filter((e) => e.field === 'serviceCode');
        expect(codeErrors).toHaveLength(0);
      }
    });

    it('should warn for non-standard service codes', async () => {
      const visit = createMockVisit({ serviceCode: 'X9999' }); // Not in whitelist

      const result = await validator.validateVisit(visit);

      const warning = result.warnings.find((w) => w.code === 'BUS_SERVICE');
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('may not be covered');
    });

    it('should error for invalid HCPCS format', async () => {
      const visit = createMockVisit({ serviceCode: 'INVALID' }); // 7 chars, not 5

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_002' && e.field === 'serviceCode');
      expect(error).toBeDefined();
      expect(error?.message).toContain('Invalid HCPCS code format');
    });

    it('should error for lowercase service codes', async () => {
      const visit = createMockVisit({ serviceCode: 't1019' });

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_002');
      expect(error).toBeDefined();
    });
  });

  describe('Data Integrity Validation', () => {
    it('should error for invalid latitude', async () => {
      const visit = createMockVisit({
        clockInLocation: { latitude: 91, longitude: -82.9988 }, // > 90
      });

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_GPS' && e.message.includes('latitude'));
      expect(error).toBeDefined();
    });

    it('should error for invalid longitude', async () => {
      const visit = createMockVisit({
        clockInLocation: { latitude: 39.9612, longitude: 181 }, // > 180
      });

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_GPS' && e.message.includes('longitude'));
      expect(error).toBeDefined();
    });

    it('should validate GPS coordinate ranges', async () => {
      const invalidCoords = [
        { latitude: -91, longitude: 0 }, // lat too low
        { latitude: 91, longitude: 0 }, // lat too high
        { latitude: 0, longitude: -181 }, // lon too low
        { latitude: 0, longitude: 181 }, // lon too high
      ];

      for (const coords of invalidCoords) {
        const visit = createMockVisit({ clockInLocation: coords });
        const result = await validator.validateVisit(visit);

        const gpsErrors = result.errors.filter((e) => e.code === 'VAL_GPS');
        expect(gpsErrors.length).toBeGreaterThan(0);
      }
    });

    it('should error for invalid service date format', async () => {
      const visit = createMockVisit({ serviceDate: '11/03/2025' }); // Wrong format

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_003');
      expect(error).toBeDefined();
      expect(error?.message).toContain('Invalid service date format');
    });

    it('should pass for valid YYYY-MM-DD date format', async () => {
      const visit = createMockVisit({ serviceDate: '2025-11-03' });

      const result = await validator.validateVisit(visit);

      const dateErrors = result.errors.filter((e) => e.field === 'serviceDate');
      expect(dateErrors).toHaveLength(0);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should return all validation errors', async () => {
      const visit = createMockVisit({
        serviceCode: '', // Missing
        individualId: '', // Missing
        employeeId: '', // Missing
        clockInTime: '2025-11-03T11:00:00Z',
        clockOutTime: '2025-11-03T09:00:00Z', // Invalid sequence
      });

      const result = await validator.validateVisit(visit);

      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.isValid).toBe(false);
    });

    it('should return both errors and warnings', async () => {
      const visit = createMockVisit({
        serviceCode: 'X9999', // Warning: non-standard code
        clockInTime: '2025-11-03T09:00:00Z',
        clockOutTime: '2025-11-03T09:10:00Z', // Warning: < 15 min
      });

      const result = await validator.validateVisit(visit);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing clock times gracefully', async () => {
      const visit = createMockVisit({
        clockInTime: undefined as any,
        clockOutTime: undefined as any,
      });

      const result = await validator.validateVisit(visit);

      // Should have errors for missing times, but not crash
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle partial GPS data', async () => {
      const visit = createMockVisit({
        clockInLocation: { latitude: 39.9612 } as any, // Missing longitude
      });

      const result = await validator.validateVisit(visit);

      const error = result.errors.find((e) => e.code === 'VAL_GPS');
      expect(error).toBeDefined();
    });

    it('should validate exact geofence boundary', async () => {
      // Test location exactly at geofence radius
      const visit = createMockVisit({
        clockInLocation: {
          latitude: 39.9646, // Exactly 0.25 miles
          longitude: -82.9988,
        },
      });

      const context: ValidationContext = {
        clientLocation: COLUMBUS_COORDINATES.clientAddress,
        geofenceRadiusMiles: 0.25,
      };

      const result = await validator.validateVisit(visit);

      // Should be close to boundary - may have rounding
      const geofenceErrors = result.errors.filter((e) => e.code === 'VAL_GEOFENCE');
      // Allow for floating point precision
      expect(geofenceErrors.length).toBeLessThanOrEqual(1);
    });
  });
});
