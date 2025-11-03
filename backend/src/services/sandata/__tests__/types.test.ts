/**
 * Unit Tests for Sandata Types and Type Guards
 * Tests type validation, type guards, and error taxonomy
 */

import {
  // Type guards (only those that exist in types.ts)
  isSandataError,
  isVisitAccepted,
  isVisitRejected,
  // Error taxonomy
  SANDATA_ERROR_TAXONOMY,
  SandataErrorCode,
  // Types
  SandataApiResponse,
  SandataVisitResponse,
  SandataTransaction,
  ValidationError,
  ValidationWarning,
  SandataVisit,
  SandataLocation,
  SandataStatus,
  SandataTransactionType,
} from '../types';
import {
  MOCK_VISIT_ACCEPTED,
  MOCK_VISIT_REJECTED_GEOFENCE,
  MOCK_INDIVIDUAL_SUCCESS,
  MOCK_API_RESPONSE_SUCCESS,
  MOCK_API_RESPONSE_ERROR,
  createMockVisit,
} from './__mocks__/sandataResponses';

describe('Sandata Types and Type Guards', () => {
  describe('isSandataError', () => {
    it('should return true for valid error response', () => {
      const errorResponse = {
        error: {
          code: 'VAL_001',
          message: 'Validation failed',
        },
      };

      expect(isSandataError(errorResponse)).toBe(true);
    });

    it('should return true for error with field and severity', () => {
      const errorResponse = {
        error: {
          code: 'VAL_GEOFENCE',
          message: 'Outside geofence',
          field: 'clockInLocation',
          severity: 'error',
        },
      };

      expect(isSandataError(errorResponse)).toBe(true);
    });

    it('should return false for success response', () => {
      const successResponse = {
        visitId: 'SND_VISIT_123',
        status: 'accepted',
        message: 'Visit accepted',
      };

      expect(isSandataError(successResponse)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isSandataError(null)).toBe(false);
      expect(isSandataError(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isSandataError({})).toBe(false);
    });

    it('should return false for error without code or message', () => {
      expect(isSandataError({ error: {} })).toBe(false);
      expect(isSandataError({ error: { code: 'VAL_001' } })).toBe(false);
      expect(isSandataError({ error: { message: 'Error' } })).toBe(false);
    });
  });

  describe('isVisitAccepted', () => {
    it('should return true for accepted visit response', () => {
      expect(isVisitAccepted(MOCK_VISIT_ACCEPTED)).toBe(true);
    });

    it('should return true for accepted status regardless of errors array', () => {
      const response = {
        ...MOCK_VISIT_ACCEPTED,
        errors: [
          {
            field: 'units',
            code: 'VAL_WARN',
            message: 'Warning only',
            severity: 'warning' as const,
          },
        ],
      };

      expect(isVisitAccepted(response)).toBe(true);
    });

    it('should return false for rejected visit response', () => {
      expect(isVisitAccepted(MOCK_VISIT_REJECTED_GEOFENCE)).toBe(false);
    });

    it('should return false for pending status', () => {
      const pendingResponse = {
        visitId: '',
        status: 'pending',
        message: 'Processing',
        errors: [],
      };

      expect(isVisitAccepted(pendingResponse)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isVisitAccepted(null as any)).toBe(false);
      expect(isVisitAccepted(undefined as any)).toBe(false);
    });
  });

  describe('isVisitRejected', () => {
    it('should return true for rejected visit response', () => {
      expect(isVisitRejected(MOCK_VISIT_REJECTED_GEOFENCE)).toBe(true);
    });

    it('should return true for any rejected status', () => {
      const rejectedResponse = {
        visitId: '',
        status: 'rejected',
        message: 'Rejected',
        errors: [],
      };

      expect(isVisitRejected(rejectedResponse)).toBe(true);
    });

    it('should return false for accepted visit response', () => {
      expect(isVisitRejected(MOCK_VISIT_ACCEPTED)).toBe(false);
    });

    it('should return false for pending status', () => {
      const pendingResponse = {
        visitId: '',
        status: 'pending',
        message: 'Processing',
        errors: [],
      };

      expect(isVisitRejected(pendingResponse)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isVisitRejected(null as any)).toBe(false);
      expect(isVisitRejected(undefined as any)).toBe(false);
    });
  });

  describe('Transaction Status Checks', () => {
    it('should identify accepted status', () => {
      const transaction: Partial<SandataTransaction> = {
        status: 'accepted',
        errorCode: null,
      };

      expect(transaction.status).toBe('accepted');
      expect(transaction.errorCode).toBeNull();
    });

    it('should identify error status', () => {
      const transaction: Partial<SandataTransaction> = {
        status: 'error',
        errorCode: 'VAL_001',
      };

      expect(transaction.status).toBe('error');
      expect(transaction.errorCode).toBe('VAL_001');
    });

    it('should identify retrying status', () => {
      const transaction: Partial<SandataTransaction> = {
        status: 'retrying',
        retryCount: 2,
        maxRetries: 5,
      };

      expect(transaction.status).toBe('retrying');
      expect(transaction.retryCount).toBeLessThan(transaction.maxRetries!);
    });

    it('should identify rejected status', () => {
      const transaction: Partial<SandataTransaction> = {
        status: 'rejected',
        errorCode: 'VAL_GEOFENCE',
      };

      expect(transaction.status).toBe('rejected');
    });
  });

  describe('Validation Errors and Warnings', () => {
    it('should distinguish error severity', () => {
      const error: ValidationError = {
        code: 'VAL_001',
        message: 'Service code is required',
        field: 'serviceCode',
        severity: 'error',
      };

      expect(error.severity).toBe('error');
    });

    it('should distinguish warning severity', () => {
      const warning: ValidationWarning = {
        code: 'VAL_WARN',
        message: 'Units approaching limit',
        field: 'units',
        severity: 'warning',
      };

      expect(warning.severity).toBe('warning');
    });

    it('should validate error structure', () => {
      const error: ValidationError = {
        code: 'VAL_GEOFENCE',
        message: 'Outside geofence',
        field: 'clockInLocation',
        severity: 'error',
      };

      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('field');
      expect(error).toHaveProperty('severity');
    });
  });

  describe('SANDATA_ERROR_TAXONOMY', () => {
    it('should contain all expected error codes', () => {
      const expectedCodes = [
        'AUTH_INVALID_CREDENTIALS',
        'AUTH_TOKEN_EXPIRED',
        'AUTH_FORBIDDEN',
        'VAL_MISSING_FIELD',
        'VAL_INVALID_FORMAT',
        'VAL_INVALID_DATE',
        'VAL_GEOFENCE_VIOLATION',
        'VAL_TIME_TOLERANCE',
        'VAL_DUPLICATE_VISIT',
        'VAL_INVALID_GPS',
        'BUS_NO_AUTHORIZATION',
        'BUS_OVER_AUTHORIZATION',
        'BUS_INVALID_SERVICE_CODE',
        'BUS_INDIVIDUAL_NOT_FOUND',
        'BUS_EMPLOYEE_NOT_FOUND',
        'BUS_INVALID_PROVIDER',
        'SYS_RATE_LIMIT',
        'SYS_INTERNAL_ERROR',
        'SYS_SERVICE_UNAVAILABLE',
        'SYS_GATEWAY_TIMEOUT',
        'SYS_TIMEOUT',
        'SYS_NETWORK_ERROR',
      ];

      expectedCodes.forEach((code) => {
        expect(SANDATA_ERROR_TAXONOMY[code]).toBeDefined();
        expect(typeof SANDATA_ERROR_TAXONOMY[code]).toBe('string');
      });
    });

    it('should have correct auth error codes', () => {
      expect(SANDATA_ERROR_TAXONOMY.AUTH_INVALID_CREDENTIALS).toBe('401_AUTH');
      expect(SANDATA_ERROR_TAXONOMY.AUTH_TOKEN_EXPIRED).toBe('401_EXPIRED');
      expect(SANDATA_ERROR_TAXONOMY.AUTH_FORBIDDEN).toBe('403');
    });

    it('should have correct validation error codes', () => {
      expect(SANDATA_ERROR_TAXONOMY.VAL_MISSING_FIELD).toBe('VAL_001');
      expect(SANDATA_ERROR_TAXONOMY.VAL_INVALID_FORMAT).toBe('VAL_002');
      expect(SANDATA_ERROR_TAXONOMY.VAL_GEOFENCE_VIOLATION).toBe('VAL_GEOFENCE');
      expect(SANDATA_ERROR_TAXONOMY.VAL_DUPLICATE_VISIT).toBe('VAL_DUP');
    });

    it('should have correct business rule error codes', () => {
      expect(SANDATA_ERROR_TAXONOMY.BUS_NO_AUTHORIZATION).toBe('BUS_AUTH_MISSING');
      expect(SANDATA_ERROR_TAXONOMY.BUS_OVER_AUTHORIZATION).toBe('BUS_AUTH_EXCEEDED');
      expect(SANDATA_ERROR_TAXONOMY.BUS_INDIVIDUAL_NOT_FOUND).toBe('BUS_IND_404');
      expect(SANDATA_ERROR_TAXONOMY.BUS_EMPLOYEE_NOT_FOUND).toBe('BUS_EMP_404');
    });

    it('should have correct system error codes', () => {
      expect(SANDATA_ERROR_TAXONOMY.SYS_RATE_LIMIT).toBe('429');
      expect(SANDATA_ERROR_TAXONOMY.SYS_INTERNAL_ERROR).toBe('500');
      expect(SANDATA_ERROR_TAXONOMY.SYS_SERVICE_UNAVAILABLE).toBe('503');
      expect(SANDATA_ERROR_TAXONOMY.SYS_GATEWAY_TIMEOUT).toBe('504');
      expect(SANDATA_ERROR_TAXONOMY.SYS_TIMEOUT).toBe('TIMEOUT');
      expect(SANDATA_ERROR_TAXONOMY.SYS_NETWORK_ERROR).toBe('NETWORK');
    });

    it('should have unique error code values', () => {
      const values = Object.values(SANDATA_ERROR_TAXONOMY);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('SandataStatus Type', () => {
    it('should support all expected status values', () => {
      const validStatuses: SandataStatus[] = [
        'not_submitted',
        'pending',
        'accepted',
        'rejected',
        'error',
        'retrying',
      ];

      validStatuses.forEach((status) => {
        const transaction: Partial<SandataTransaction> = { status };
        expect(transaction.status).toBe(status);
      });
    });

    it('should distinguish between lifecycle stages', () => {
      // Pre-submission
      const notSubmitted: SandataStatus = 'not_submitted';
      expect(notSubmitted).toBe('not_submitted');

      // In-flight
      const pending: SandataStatus = 'pending';
      expect(pending).toBe('pending');

      // Terminal states
      const accepted: SandataStatus = 'accepted';
      const rejected: SandataStatus = 'rejected';
      expect(accepted).toBe('accepted');
      expect(rejected).toBe('rejected');

      // Retry state
      const retrying: SandataStatus = 'retrying';
      expect(retrying).toBe('retrying');
    });
  });

  describe('SandataLocation Type', () => {
    it('should accept valid GPS coordinates', () => {
      const location: SandataLocation = {
        latitude: 39.9612,
        longitude: -82.9988,
        accuracy: 10,
        timestamp: '2025-11-03T09:00:00Z',
      };

      expect(location.latitude).toBe(39.9612);
      expect(location.longitude).toBe(-82.9988);
      expect(location.accuracy).toBe(10);
    });

    it('should allow negative coordinates', () => {
      const location: SandataLocation = {
        latitude: -33.8688,
        longitude: 151.2093,
        accuracy: 15,
        timestamp: '2025-11-03T09:00:00Z',
      };

      expect(location.latitude).toBe(-33.8688);
      expect(location.longitude).toBe(151.2093);
    });

    it('should support optional address field', () => {
      const location: SandataLocation = {
        latitude: 39.9612,
        longitude: -82.9988,
        accuracy: 10,
        timestamp: '2025-11-03T09:00:00Z',
        address: {
          street1: '123 Main St',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43215',
        },
      };

      expect(location.address).toBeDefined();
      expect(location.address?.city).toBe('Columbus');
    });
  });

  describe('SandataVisit Type Structure', () => {
    it('should enforce all required 6-element EVV fields', () => {
      const visit = createMockVisit({
        serviceCode: 'T1019',
        individualId: 'IND123',
        employeeId: 'EMP456',
        serviceDate: '2025-11-03',
        clockInTime: '2025-11-03T09:00:00Z',
        clockOutTime: '2025-11-03T11:00:00Z',
      });

      // Element 1: Service Type
      expect(visit.serviceCode).toBe('T1019');

      // Element 2: Individual
      expect(visit.individualId).toBe('IND123');

      // Element 3: Service Provider
      expect(visit.employeeId).toBe('EMP456');

      // Element 4: Date/Time
      expect(visit.serviceDate).toBe('2025-11-03');
      expect(visit.clockInTime).toBe('2025-11-03T09:00:00Z');
      expect(visit.clockOutTime).toBe('2025-11-03T11:00:00Z');

      // Element 5: Location (GPS)
      expect(visit.clockInLocation).toBeDefined();
      expect(visit.clockOutLocation).toBeDefined();
      expect(visit.clockInLocation.latitude).toBeDefined();
      expect(visit.clockInLocation.longitude).toBeDefined();

      // Element 6: Verification (implicit in location method)
      expect(visit.verificationMethod).toBeDefined();
    });

    it('should include all optional fields', () => {
      const visit = createMockVisit({
        visitKey: 'TEST_KEY',
        authorizationNumber: 'AUTH-123',
        externalId: 'EXT-123',
      });

      expect(visit.visitKey).toBe('TEST_KEY');
      expect(visit.authorizationNumber).toBe('AUTH-123');
      expect(visit.externalId).toBe('EXT-123');
    });
  });

  describe('SandataApiResponse Type', () => {
    it('should support success responses with data', () => {
      const response = MOCK_API_RESPONSE_SUCCESS({ visitId: 'VISIT123' });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.visitId).toBe('VISIT123');
      expect(response.error).toBeUndefined();
    });

    it('should support error responses without data', () => {
      const response = MOCK_API_RESPONSE_ERROR('VAL_001', 'Validation failed', 400);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('VAL_001');
      expect(response.data).toBeUndefined();
    });

    it('should include timestamp in all responses', () => {
      const successResponse = MOCK_API_RESPONSE_SUCCESS({ test: true });
      const errorResponse = MOCK_API_RESPONSE_ERROR('ERR', 'Error', 500);

      expect(successResponse.timestamp).toBeDefined();
      expect(errorResponse.timestamp).toBeDefined();

      // Should be valid ISO date string
      expect(new Date(successResponse.timestamp).toISOString()).toBe(successResponse.timestamp);
    });

    it('should include statusCode in all responses', () => {
      const successResponse = MOCK_API_RESPONSE_SUCCESS({ test: true });
      const errorResponse = MOCK_API_RESPONSE_ERROR('ERR', 'Error', 404);

      expect(successResponse.statusCode).toBe(200);
      expect(errorResponse.statusCode).toBe(404);
    });
  });

  describe('Type Narrowing', () => {
    it('should narrow SandataApiResponse to success type', () => {
      const response: SandataApiResponse<{ visitId: string }> = MOCK_API_RESPONSE_SUCCESS({
        visitId: 'VISIT123',
      });

      if (response.success) {
        // TypeScript should narrow data to be defined
        expect(response.data).toBeDefined();
        expect(response.data.visitId).toBe('VISIT123');
      }
    });

    it('should narrow SandataApiResponse to error type', () => {
      const response: SandataApiResponse = MOCK_API_RESPONSE_ERROR('ERR', 'Error', 400);

      if (!response.success) {
        // TypeScript should narrow error to be defined
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe('ERR');
      }
    });

    it('should narrow visit response by status', () => {
      const acceptedResponse = MOCK_VISIT_ACCEPTED;
      const rejectedResponse = MOCK_VISIT_REJECTED_GEOFENCE;

      if (isVisitAccepted(acceptedResponse)) {
        expect(acceptedResponse.status).toBe('accepted');
        expect(acceptedResponse.visitId).toBeTruthy();
      }

      if (isVisitRejected(rejectedResponse)) {
        expect(rejectedResponse.status).toBe('rejected');
        expect(rejectedResponse.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('SandataTransactionType', () => {
    it('should support all transaction types', () => {
      const transactionTypes: SandataTransactionType[] = [
        'individual',
        'employee',
        'visit',
        'visit_correction',
        'void',
      ];

      transactionTypes.forEach((type) => {
        const transaction: Partial<SandataTransaction> = {
          transactionType: type,
        };
        expect(transaction.transactionType).toBe(type);
      });
    });

    it('should distinguish between transaction types', () => {
      const visitTransaction: SandataTransactionType = 'visit';
      const correctionTransaction: SandataTransactionType = 'visit_correction';
      const voidTransaction: SandataTransactionType = 'void';

      expect(visitTransaction).not.toBe(correctionTransaction);
      expect(correctionTransaction).not.toBe(voidTransaction);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty errors array', () => {
      const response = {
        visitId: 'VISIT123',
        status: 'accepted' as const,
        message: 'Success',
        errors: [],
      };

      expect(isVisitAccepted(response)).toBe(true);
      expect(response.errors).toHaveLength(0);
    });

    it('should handle missing optional fields', () => {
      const visit = createMockVisit({
        visitKey: undefined,
        authorizationNumber: undefined,
        externalId: undefined,
      });

      expect(visit.visitKey).toBeUndefined();
      expect(visit.authorizationNumber).toBeUndefined();
      expect(visit.externalId).toBeUndefined();

      // Required fields should still be present
      expect(visit.serviceCode).toBeDefined();
      expect(visit.individualId).toBeDefined();
    });

    it('should handle transaction with zero retries', () => {
      const transaction: Partial<SandataTransaction> = {
        status: 'retrying',
        retryCount: 0,
        maxRetries: 5,
      };

      expect(transaction.retryCount).toBe(0);
      expect(transaction.retryCount).toBeLessThan(transaction.maxRetries!);
    });

    it('should handle transaction with max retries', () => {
      const transaction: Partial<SandataTransaction> = {
        status: 'error',
        retryCount: 5,
        maxRetries: 5,
      };

      expect(transaction.retryCount).toBe(transaction.maxRetries);
    });

    it('should handle undefined error in API response', () => {
      const response: SandataApiResponse = {
        success: true,
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };

      expect(response.error).toBeUndefined();
      expect(response.data).toBeUndefined();
    });
  });

  describe('Type Exports', () => {
    it('should export SandataErrorCode as string literal union', () => {
      const validCode: SandataErrorCode = '401_AUTH';
      const validCode2: SandataErrorCode = 'VAL_001';
      const validCode3: SandataErrorCode = '429';

      expect(typeof validCode).toBe('string');
      expect(typeof validCode2).toBe('string');
      expect(typeof validCode3).toBe('string');
    });

    it('should properly type SandataApiResponse with generic', () => {
      interface TestData {
        id: string;
        name: string;
      }

      const response: SandataApiResponse<TestData> = {
        success: true,
        statusCode: 200,
        data: { id: '123', name: 'Test' },
        timestamp: new Date().toISOString(),
      };

      expect(response.data?.id).toBe('123');
      expect(response.data?.name).toBe('Test');
    });
  });
});
