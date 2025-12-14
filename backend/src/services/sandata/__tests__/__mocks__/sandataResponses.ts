/**
 * Mock Sandata API Responses
 * Used for unit testing without real API calls
 */

import type {
  SandataAuthResponse,
  SandataIndividualResponse,
  SandataEmployeeResponse,
  SandataVisitResponse,
  SandataApiResponse,
  SandataVisit,
  SandataIndividual,
  SandataEmployee,
} from '../../types';

// ============================================================================
// Authentication Responses
// ============================================================================

export const MOCK_AUTH_SUCCESS: SandataAuthResponse = {
  access_token: 'mock_access_token_abc123xyz',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'evv:read evv:write',
};

export const MOCK_AUTH_ERROR_401 = {
  error: 'invalid_client',
  error_description: 'Invalid client credentials',
};

// ============================================================================
// Individual (Client) Responses
// ============================================================================

export const MOCK_INDIVIDUAL_SUCCESS: SandataIndividualResponse = {
  individualId: 'SND_IND_123456',
  status: 'created',
  message: 'Individual created successfully',
};

export const MOCK_INDIVIDUAL_UPDATE_SUCCESS: SandataIndividualResponse = {
  individualId: 'SND_IND_123456',
  status: 'updated',
  message: 'Individual updated successfully',
};

export const MOCK_INDIVIDUAL_404 = {
  error: {
    code: 'BUS_IND_404',
    message: 'Individual not found',
    field: 'individualId',
  },
};

// ============================================================================
// Employee (Caregiver) Responses
// ============================================================================

export const MOCK_EMPLOYEE_SUCCESS: SandataEmployeeResponse = {
  employeeId: 'SND_EMP_789012',
  status: 'created',
  message: 'Employee created successfully',
};

export const MOCK_EMPLOYEE_UPDATE_SUCCESS: SandataEmployeeResponse = {
  employeeId: 'SND_EMP_789012',
  status: 'updated',
  message: 'Employee updated successfully',
};

export const MOCK_EMPLOYEE_404 = {
  error: {
    code: 'BUS_EMP_404',
    message: 'Employee not found',
    field: 'employeeId',
  },
};

// ============================================================================
// Visit Responses
// ============================================================================

export const MOCK_VISIT_ACCEPTED: SandataVisitResponse = {
  visitId: 'SND_VISIT_456789',
  status: 'accepted',
  message: 'Visit accepted successfully',
  errors: [],
};

export const MOCK_VISIT_REJECTED_GEOFENCE: SandataVisitResponse = {
  visitId: '',
  status: 'rejected',
  message: 'Visit rejected due to validation errors',
  errors: [
    {
      field: 'clockInLocation',
      code: 'VAL_GEOFENCE',
      message: 'Clock-in location is outside geofence radius',
      severity: 'error',
    },
  ],
};

export const MOCK_VISIT_REJECTED_MISSING_FIELDS: SandataVisitResponse = {
  visitId: '',
  status: 'rejected',
  message: 'Visit rejected due to missing required fields',
  errors: [
    {
      field: 'serviceCode',
      code: 'VAL_001',
      message: 'Service code is required',
      severity: 'error',
    },
    {
      field: 'individualId',
      code: 'VAL_001',
      message: 'Individual ID is required',
      severity: 'error',
    },
  ],
};

export const MOCK_VISIT_REJECTED_AUTHORIZATION: SandataVisitResponse = {
  visitId: '',
  status: 'rejected',
  message: 'Visit rejected - authorization exceeded',
  errors: [
    {
      field: 'units',
      code: 'BUS_AUTH_EXCEEDED',
      message: 'Visit units exceed remaining authorized units',
      severity: 'error',
    },
  ],
};

// ============================================================================
// HTTP Error Responses
// ============================================================================

export const MOCK_429_RATE_LIMIT = {
  status: 429,
  statusText: 'Too Many Requests',
  headers: {
    'retry-after': '60',
  },
  data: {
    error: {
      code: '429',
      message: 'Rate limit exceeded. Please retry after 60 seconds.',
    },
  },
};

export const MOCK_500_INTERNAL_ERROR = {
  status: 500,
  statusText: 'Internal Server Error',
  data: {
    error: {
      code: '500',
      message: 'Internal server error occurred',
    },
  },
};

export const MOCK_503_SERVICE_UNAVAILABLE = {
  status: 503,
  statusText: 'Service Unavailable',
  data: {
    error: {
      code: '503',
      message: 'Service temporarily unavailable',
    },
  },
};

// ============================================================================
// Complete API Response Wrappers
// ============================================================================

export const MOCK_API_RESPONSE_SUCCESS = <T>(data: T): SandataApiResponse<T> => ({
  success: true,
  statusCode: 200,
  data,
  timestamp: new Date().toISOString(),
});

export const MOCK_API_RESPONSE_ERROR = (code: string, message: string, statusCode: number = 400): SandataApiResponse => ({
  success: false,
  statusCode,
  error: {
    code,
    message,
  },
  timestamp: new Date().toISOString(),
});

// ============================================================================
// Sample Data Entities
// ============================================================================

export const MOCK_INDIVIDUAL: SandataIndividual = {
  providerId: 'OH_ODME_123456',
  lastName: 'Doe',
  firstName: 'Jane',
  dateOfBirth: '1950-05-15',
  medicaidNumber: '1234567890',
  address: {
    street1: '123 Main St',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43215',
  },
  phoneNumber: '614-555-0100',
  status: 'active',
  externalId: '550e8400-e29b-41d4-a716-446655440000',
};

export const MOCK_EMPLOYEE: SandataEmployee = {
  providerId: 'OH_ODME_123456',
  lastName: 'Smith',
  firstName: 'John',
  dateOfBirth: '1985-08-20',
  address: {
    street1: '456 Oak Ave',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43212',
  },
  phoneNumber: '614-555-0200',
  hireDate: '2023-01-15',
  status: 'active',
  externalId: '660e8400-e29b-41d4-a716-446655440001',
};

export const MOCK_VISIT_VALID: SandataVisit = {
  providerId: 'OH_ODME_123456',
  serviceCode: 'T1019',
  individualId: 'SND_IND_123456',
  employeeId: 'SND_EMP_789012',
  serviceDate: '2025-11-03',
  clockInTime: '2025-11-03T09:00:00Z',
  clockOutTime: '2025-11-03T11:00:00Z',
  clockInLocation: {
    latitude: 39.9612,
    longitude: -82.9988,
    accuracy: 10,
    timestamp: '2025-11-03T09:00:00Z',
  },
  clockOutLocation: {
    latitude: 39.9615,
    longitude: -82.9985,
    accuracy: 12,
    timestamp: '2025-11-03T11:00:00Z',
  },
  units: 8, // 2 hours = 8 units (15-min increments)
  authorizationNumber: 'AUTH-2025-001',
  verificationMethod: 'gps',
  visitKey: 'SND_IND_123456_SND_EMP_789012_20251103_T1019',
  externalId: '770e8400-e29b-41d4-a716-446655440002',
};

export const MOCK_VISIT_MISSING_FIELDS: Partial<SandataVisit> = {
  providerId: 'OH_ODME_123456',
  // Missing: serviceCode, individualId, employeeId, etc.
  serviceDate: '2025-11-03',
};

export const MOCK_VISIT_GEOFENCE_VIOLATION: SandataVisit = {
  ...MOCK_VISIT_VALID,
  clockInLocation: {
    latitude: 40.0000, // ~2.8 miles away from client address
    longitude: -83.0000,
    accuracy: 10,
    timestamp: '2025-11-03T09:00:00Z',
  },
};

export const MOCK_VISIT_INVALID_TIMES: SandataVisit = {
  ...MOCK_VISIT_VALID,
  clockInTime: '2025-11-03T11:00:00Z',
  clockOutTime: '2025-11-03T09:00:00Z', // Clock-out before clock-in
};

export const MOCK_VISIT_LONG_DURATION: SandataVisit = {
  ...MOCK_VISIT_VALID,
  clockInTime: '2025-11-03T09:00:00Z',
  clockOutTime: '2025-11-04T12:00:00Z', // 27 hours - forgot to clock out?
};

// ============================================================================
// GPS Coordinates (Columbus, OH area)
// ============================================================================

export const COLUMBUS_COORDINATES = {
  // Downtown Columbus
  downtown: { latitude: 39.9612, longitude: -82.9988 },

  // Client address (for geofence tests)
  clientAddress: { latitude: 39.9610, longitude: -82.9990 },

  // Within geofence (0.1 miles away)
  withinGeofence: { latitude: 39.9625, longitude: -82.9980 },

  // Outside geofence (1 mile away)
  outsideGeofence: { latitude: 39.9750, longitude: -82.9980 },

  // Way outside (10 miles away)
  farOutside: { latitude: 40.0500, longitude: -83.0500 },
};

// ============================================================================
// Authorization Data
// ============================================================================

export const MOCK_AUTHORIZATION_ACTIVE = {
  authorizationNumber: 'AUTH-2025-001',
  serviceCode: 'T1019',
  authorizedUnits: 100,
  usedUnits: 50,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};

export const MOCK_AUTHORIZATION_EXPIRED = {
  authorizationNumber: 'AUTH-2024-001',
  serviceCode: 'T1019',
  authorizedUnits: 100,
  usedUnits: 50,
  startDate: '2024-01-01',
  endDate: '2024-12-31', // Expired
};

export const MOCK_AUTHORIZATION_EXCEEDED = {
  authorizationNumber: 'AUTH-2025-002',
  serviceCode: 'T1019',
  authorizedUnits: 100,
  usedUnits: 98, // Only 2 units remaining
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};

// ============================================================================
// Helper Functions
// ============================================================================

export function createMockVisit(overrides: Partial<SandataVisit> = {}): SandataVisit {
  return {
    ...MOCK_VISIT_VALID,
    ...overrides,
  };
}

export function createMockIndividual(overrides: Partial<SandataIndividual> = {}): SandataIndividual {
  return {
    ...MOCK_INDIVIDUAL,
    ...overrides,
  };
}

export function createMockEmployee(overrides: Partial<SandataEmployee> = {}): SandataEmployee {
  return {
    ...MOCK_EMPLOYEE,
    ...overrides,
  };
}
