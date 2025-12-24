/**
 * Sandata Alternative EVV API Types
 * Based on Ohio Medicaid Alt-EVV v4.3 Specification
 *
 * These types define the complete API contract with Sandata for:
 * - Individuals (Clients/Patients)
 * - Employees (Caregivers)
 * - Visits (EVV Records)
 *
 * @module services/sandata/types
 */

// ============================================================================
// Base Types
// ============================================================================

export type SandataEnvironment = 'sandbox' | 'production';

export type SandataTransactionType = 'individual' | 'employee' | 'visit' | 'visit_correction' | 'void';

export type SandataStatus = 'not_submitted' | 'pending' | 'accepted' | 'rejected' | 'error' | 'retrying';

export type ClaimsGateMode = 'disabled' | 'warn' | 'strict';

export type RoundingMode = 'nearest' | 'up' | 'down';

// ============================================================================
// API Request/Response Wrapper Types
// ============================================================================

export interface SandataApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: SandataApiError;
  transactionId?: string;
  timestamp: string;
}

export interface SandataApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface SandataPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Authentication
// ============================================================================

export interface SandataAuthRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
  scope?: string;
}

export interface SandataAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  scope: string;
}

export interface SandataAuthToken {
  token: string;
  expiresAt: Date;
  isExpired: () => boolean;
}

// ============================================================================
// Individual (Client/Patient) Types
// ============================================================================

export interface SandataIndividual {
  // Required fields
  individualId?: string; // Sandata's ID (returned after creation)
  providerId: string; // ODME Provider ID
  lastName: string;
  firstName: string;
  dateOfBirth: string; // YYYY-MM-DD
  medicaidNumber: string; // 10 digits for Ohio

  // Optional fields
  middleName?: string;
  ssn?: string; // Encrypted
  gender?: 'M' | 'F' | 'X' | 'U'; // Male, Female, Non-binary, Unknown
  address?: SandataAddress;
  phoneNumber?: string;
  email?: string;

  // Status
  status?: 'active' | 'inactive' | 'pending';
  effectiveDate?: string; // YYYY-MM-DD
  terminationDate?: string; // YYYY-MM-DD

  // Medicaid specific
  medicaidEligibilityStartDate?: string;
  medicaidEligibilityEndDate?: string;

  // Internal reference (Serenity's client ID)
  externalId?: string; // Our UUID
}

export interface SandataIndividualCreateRequest {
  individual: Omit<SandataIndividual, 'individualId'>;
}

export interface SandataIndividualUpdateRequest {
  individual: SandataIndividual;
}

export interface SandataIndividualResponse {
  individualId: string;
  status: 'created' | 'updated' | 'active';
  message?: string;
}

// ============================================================================
// Employee (Caregiver) Types
// ============================================================================

export interface SandataEmployee {
  // Required fields
  employeeId?: string; // Sandata's ID
  providerId: string; // ODME Provider ID
  lastName: string;
  firstName: string;
  dateOfBirth: string; // YYYY-MM-DD
  ssn?: string; // Encrypted, may be required by some states
  socialSecurityNumber?: string; // Decrypted 9-digit SSN

  // Optional fields
  middleName?: string;
  gender?: 'M' | 'F' | 'X' | 'U';
  address?: SandataAddress;
  phoneNumber?: string;
  email?: string;

  // Employment
  hireDate?: string;
  terminationDate?: string;
  status?: 'active' | 'inactive' | 'pending';

  // Credentials (for Ohio compliance)
  certifications?: SandataEmployeeCertification[];

  // Internal reference
  externalId?: string; // Our UUID
}

export interface SandataEmployeeCertification {
  certificationType: string; // e.g., 'HHA', 'CNA', 'PCA'
  certificationNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expirationDate: string;
}

export interface SandataEmployeeCreateRequest {
  employee: Omit<SandataEmployee, 'employeeId'>;
}

export interface SandataEmployeeUpdateRequest {
  employee: SandataEmployee;
}

export interface SandataEmployeeResponse {
  employeeId: string;
  status: 'created' | 'updated' | 'active';
  message?: string;
}

// ============================================================================
// Visit (EVV Record) Types - CRITICAL FOR ALT-EVV
// ============================================================================

export interface SandataVisit {
  // Required: Ohio Medicaid 6-element EVV compliance
  visitId?: string; // Sandata's ID
  providerId: string; // ODME Provider ID

  // Element 1: Service Type
  serviceCode: string; // HCPCS code (e.g., 'T1019', 'T1020')
  serviceName?: string;

  // Element 2: Individual (Client)
  individualId: string; // Sandata Individual ID
  individualName?: string; // For display

  // Element 3: Service Provider (Caregiver)
  employeeId: string; // Sandata Employee ID
  employeeName?: string; // For display

  // Element 4: Service Date/Time
  serviceDate: string; // YYYY-MM-DD

  // Element 5: Clock In/Out Times
  clockInTime: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss
  clockOutTime: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss

  // Element 6: Location (GPS)
  clockInLocation: SandataLocation;
  clockOutLocation: SandataLocation;

  // Additional required fields
  units: number; // Billable units (15-min increments typically)

  // Optional but important
  authorizationNumber?: string; // Service authorization
  placeOfService?: string; // POS code
  modifiers?: string[]; // Billing modifiers (e.g., ['U4', 'UD'])

  // Visit metadata
  visitKey?: string; // Our deterministic key
  visitStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Verification
  verificationMethod?: 'gps' | 'telephony' | 'fixed_device';
  deviceInfo?: SandataDeviceInfo;

  // Internal reference
  externalId?: string; // Our EVV record UUID
  shiftId?: string; // Our shift UUID
}

export interface SandataLocation {
  latitude: number; // Decimal degrees (e.g., 39.9612)
  longitude: number; // Decimal degrees (e.g., -82.9988)
  accuracy?: number; // Meters
  timestamp?: string; // ISO 8601
  address?: SandataAddress;
}

export interface SandataAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string; // 2-letter code (e.g., 'OH')
  zipCode: string; // 5 or 9 digits
  county?: string;
}

export interface SandataDeviceInfo {
  deviceId?: string;
  deviceType?: 'mobile' | 'tablet' | 'fixed' | 'telephony';
  platform?: 'ios' | 'android' | 'web';
  appVersion?: string;
}

export interface SandataVisitCreateRequest {
  visit: Omit<SandataVisit, 'visitId'>;
}

export interface SandataVisitUpdateRequest {
  visit: SandataVisit;
}

export interface SandataVisitResponse {
  visitId: string;
  status: 'accepted' | 'rejected' | 'pending';
  message?: string;
  errors?: SandataVisitValidationError[];
}

export interface SandataVisitValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// Visit Correction & Void
// ============================================================================

export interface SandataVisitCorrectionRequest {
  originalVisitId: string;
  correctedVisit: SandataVisit;
  correctionReason: string;
}

export interface SandataVisitVoidRequest {
  visitId: string;
  voidReason: string;
}

// ============================================================================
// Validation Rules (Pre-Submission)
// ============================================================================

export interface SandataValidationRule {
  ruleId: string;
  ruleType: 'geofence' | 'time_tolerance' | 'authorization' | 'service_code' | 'required_field';
  isBlocking: boolean; // If true, prevents submission
  validate: (visit: SandataVisit, context?: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  geofenceRadiusMiles?: number;
  clockInToleranceMinutes?: number;
  requireAuthorizationMatch?: boolean;
  blockOverAuthorization?: boolean;
  clientLocation?: SandataLocation;
  authorization?: ServiceAuthorization;
}

export interface ServiceAuthorization {
  authorizationNumber: string;
  serviceCode: string;
  authorizedUnits: number;
  usedUnits: number;
  startDate: string;
  endDate: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning';
}

// ============================================================================
// Database Entity Types (Our internal representation)
// ============================================================================

export interface SandataTransaction {
  id: string; // UUID
  transactionType: SandataTransactionType;
  transactionId?: string; // Sandata's ID
  requestPayload: Record<string, any>;
  responsePayload?: Record<string, any>;
  httpStatusCode?: number;
  status: SandataStatus;
  sandataStatusCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;
  submittedAt: Date;
  respondedAt?: Date;
  durationMs?: number;
  evvRecordId?: string;
  organizationId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SandataConfig {
  id: string;
  organizationId: string;
  sandataProviderId: string;
  sandboxEnabled: boolean;
  apiEndpointOverride?: string;
  geofenceRadiusMiles: number;
  clockInToleranceMinutes: number;
  roundingMinutes: number;
  roundingMode: RoundingMode;
  maxRetryAttempts: number;
  retryDelaySeconds: number;
  claimsGateMode: ClaimsGateMode;
  requireAuthorizationMatch: boolean;
  blockOverAuthorization: boolean;
  autoSubmitEnabled: boolean;
  correctionsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

// ============================================================================
// Retry & Queue Types
// ============================================================================

export interface SandataRetryPolicy {
  maxAttempts: number;
  delaySeconds: number;
  backoffMultiplier?: number; // Exponential backoff (1.5, 2, etc.)
  maxDelaySeconds?: number; // Cap on exponential backoff
}

export interface SandataQueueJob {
  jobId: string;
  transactionId: string;
  evvRecordId: string;
  attempt: number;
  scheduledFor: Date;
  priority: 'high' | 'normal' | 'low';
  payload: SandataVisitCreateRequest;
}

// ============================================================================
// Error Taxonomy (Ohio Alt-EVV v4.3)
// ============================================================================

export const SANDATA_ERROR_TAXONOMY = {
  // Authentication (4xx)
  AUTH_INVALID_CREDENTIALS: '401_AUTH',
  AUTH_TOKEN_EXPIRED: '401_EXPIRED',
  AUTH_FORBIDDEN: '403_FORBIDDEN',

  // Validation (VAL_xxx)
  VAL_MISSING_FIELD: 'VAL_001',
  VAL_INVALID_FORMAT: 'VAL_002',
  VAL_INVALID_DATE: 'VAL_003',
  VAL_GEOFENCE_VIOLATION: 'VAL_GEOFENCE',
  VAL_TIME_TOLERANCE: 'VAL_TIME',
  VAL_DUPLICATE_VISIT: 'VAL_DUP',
  VAL_INVALID_GPS: 'VAL_GPS',

  // Business Rules (BUS_xxx)
  BUS_NO_AUTHORIZATION: 'BUS_AUTH_MISSING',
  BUS_OVER_AUTHORIZATION: 'BUS_AUTH_EXCEEDED',
  BUS_INVALID_SERVICE_CODE: 'BUS_SERVICE',
  BUS_INDIVIDUAL_NOT_FOUND: 'BUS_IND_404',
  BUS_EMPLOYEE_NOT_FOUND: 'BUS_EMP_404',
  BUS_INVALID_PROVIDER: 'BUS_PROVIDER',

  // System (5xx)
  SYS_RATE_LIMIT: '429',
  SYS_INTERNAL_ERROR: '500',
  SYS_SERVICE_UNAVAILABLE: '503',
  SYS_GATEWAY_TIMEOUT: '504',
  SYS_TIMEOUT: 'TIMEOUT',
  SYS_NETWORK_ERROR: 'NETWORK',
} as const;

export type SandataErrorCode = typeof SANDATA_ERROR_TAXONOMY[keyof typeof SANDATA_ERROR_TAXONOMY];

// ============================================================================
// Visit Key Generation
// ============================================================================

export interface VisitKeyComponents {
  clientId: string; // Sandata Individual ID or our UUID
  caregiverId: string; // Sandata Employee ID or our UUID
  serviceDate: string; // YYYY-MM-DD
  serviceCode: string; // HCPCS
}

// ============================================================================
// Time Rounding
// ============================================================================

export interface RoundingResult {
  originalTime: Date;
  roundedTime: Date;
  roundingMinutes: number;
  roundingMode: RoundingMode;
  differenceMinutes: number;
}

export interface TimeRoundingOptions {
  roundingMinutes: number; // 6 or 15
  roundingMode: RoundingMode;
  preserveMidnight?: boolean; // Handle midnight boundary
}

// ============================================================================
// Metrics & Monitoring
// ============================================================================

export interface SandataMetrics {
  submissionsTotal: number;
  submissionsAccepted: number;
  submissionsRejected: number;
  submissionsError: number;
  acceptanceRate: number; // Percentage
  averageResponseTimeMs: number;
  queueDepth: number;
  retriesInProgress: number;
  lastSubmissionAt?: Date;
  last24hBacklog: number;
}

export interface SandataSLO {
  metric: 'time_to_ack' | 'daily_backlog_zero' | 'acceptance_rate';
  target: number;
  current: number;
  status: 'green' | 'yellow' | 'red';
  lastChecked: Date;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isSandataError(response: SandataApiResponse): response is SandataApiResponse & { error: SandataApiError } {
  return !!response && !response.success && response.error !== undefined && !!response.error.code && !!response.error.message;
}

export function isVisitAccepted(response: SandataVisitResponse): boolean {
  return !!response && response.status === 'accepted';
}

export function isVisitRejected(response: SandataVisitResponse): boolean {
  return !!response && response.status === 'rejected';
}

// ============================================================================
// Utility Type Exports
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make certain visit fields required for submission
export type SandataVisitSubmission = RequiredFields<
  SandataVisit,
  'providerId' | 'serviceCode' | 'individualId' | 'employeeId' | 'serviceDate' | 'clockInTime' | 'clockOutTime' | 'clockInLocation' | 'clockOutLocation' | 'units'
>;
