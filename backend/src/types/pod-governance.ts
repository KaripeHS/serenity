/**
 * Pod Governance Type Definitions
 * Serenity ERP - Pod Structure & Access Control
 */

// ============================================================================
// Core Pod Types
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'home_health' | 'hospice' | 'assisted_living';
  status: 'active' | 'inactive' | 'suspended';
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  timezone: string;
  evvProvider: 'ohio_medicaid' | 'clearcare' | 'wellsky';
  complianceLevel: 'hipaa_standard' | 'hipaa_high' | 'hitech_plus';
  podCapacityDefault: number;
  autoAuditEnabled: boolean;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  phiRedactionLevel: 'none' | 'partial' | 'full';
}

export interface Pod {
  id: string;
  organizationId: string;
  code: string; // e.g., "CIN-A", "COL-B"
  name: string;
  city: string;
  state: string;
  region?: string;
  status: PodStatus;
  capacity: number;
  teamLeadId?: string;
  teamLead?: User;
  coverageArea?: GeographicArea;
  serviceTypes: ServiceType[];
  metrics?: PodMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export type PodStatus = 'active' | 'inactive' | 'suspended';

export type ServiceType =
  | 'personal_care'
  | 'companionship'
  | 'homemaker'
  | 'respite'
  | 'skilled_nursing'
  | 'therapy';

export interface GeographicArea {
  zipCodes: string[];
  boundaries?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  serviceRadius?: number; // miles
}

export interface PodMetrics {
  id: string;
  podId: string;
  metricDate: Date;
  activeCaregivers: number;
  activeClients: number;
  visitsCompleted: number;
  evvComplianceRate: number;
  clientSatisfactionScore: number;
  revenueGenerated: number;
  metricsData: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// Enhanced User Types
// ============================================================================

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  emergencyContact?: EmergencyContact;
  preferences: UserPreferences;
  podMemberships?: PodMembership[];
  attributes?: UserAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole =
  | 'founder'
  | 'security_officer'
  | 'compliance_officer'
  | 'finance_director'
  | 'billing_manager'
  | 'rcm_analyst'
  | 'scheduler'
  | 'field_supervisor'
  | 'hr_manager'
  | 'credentialing_specialist'
  | 'it_admin'
  | 'support_agent'
  | 'caregiver'
  | 'client'
  | 'family'
  | 'payer_auditor'
  | 'ai_service';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: string[];
}

export interface DashboardPreferences {
  layout: 'compact' | 'standard' | 'detailed';
  widgets: string[];
  refreshInterval: number;
}

export interface PodMembership {
  id: string;
  userId: string;
  podId: string;
  pod?: Pod;
  roleInPod: string;
  isPrimary: boolean;
  accessLevel: AccessLevel;
  grantedBy?: string;
  grantedAt: Date;
  expiresAt?: Date;
  status: MembershipStatus;
}

export type AccessLevel = 'standard' | 'elevated' | 'emergency';
export type MembershipStatus = 'active' | 'inactive' | 'suspended';

// ============================================================================
// Access Control Types
// ============================================================================

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Permission =
  // User management
  | 'user:create' | 'user:read' | 'user:update' | 'user:delete' | 'user:manage_roles'
  // Client management (PHI)
  | 'client:create' | 'client:read' | 'client:update' | 'client:delete' | 'client:phi_access'
  // Scheduling
  | 'schedule:create' | 'schedule:read' | 'schedule:update' | 'schedule:delete' | 'schedule:assign'
  // EVV
  | 'evv:create' | 'evv:read' | 'evv:update' | 'evv:override' | 'evv:submit'
  // Billing
  | 'billing:create' | 'billing:read' | 'billing:update' | 'billing:submit' | 'billing:approve'
  // HR & Credentials
  | 'hr:create' | 'hr:read' | 'hr:update' | 'hr:delete' | 'credential:verify'
  // Security & Audit
  | 'audit:read' | 'security:manage' | 'incident:manage'
  // AI Agents
  | 'ai:interact' | 'ai:admin'
  // System Admin
  | 'system:config' | 'system:backup' | 'system:monitor'
  // Pod Management
  | 'pod:create' | 'pod:read' | 'pod:update' | 'pod:delete' | 'pod:assign_users'
  // Governance
  | 'governance:jit_grant' | 'governance:break_glass' | 'governance:audit_export';

export interface UserAttribute {
  id: string;
  userId: string;
  attributeName: string;
  attributeValue: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  grantedBy?: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface UserContext {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  podAccess: string[];
  attributes: UserAttribute[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface AccessRequest {
  action: Permission;
  resource: {
    type: string;
    id?: string;
    podId?: string;
    attributes?: Record<string, any>;
  };
  context: {
    dataClassification?: DataClassification;
    purpose?: string;
    emergency?: boolean;
    environment?: Record<string, any>;
  };
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  conditions?: string[];
  auditRequired: boolean;
  dataClassification: DataClassification;
  restrictions?: AccessRestriction[];
}

export interface AccessRestriction {
  type: 'time' | 'location' | 'approval' | 'mfa' | 'purpose';
  description: string;
  metadata?: Record<string, any>;
}

export type DataClassification = 'public' | 'internal' | 'confidential' | 'phi';

// ============================================================================
// JIT Access and Break-Glass Types
// ============================================================================

export interface JITAccessGrant {
  id: string;
  userId: string;
  grantedBy: string;
  approvedBy?: string;
  permissions: Permission[];
  justification: string;
  emergencyType?: EmergencyType;
  durationMinutes: number;
  grantedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
  status: JITStatus;
  usageCount: number;
}

export type JITStatus = 'pending' | 'active' | 'expired' | 'revoked';

export interface BreakGlassAccess {
  id: string;
  userId: string;
  emergencyType: EmergencyType;
  emergencyDescription: string;
  severity: EmergencySeverity;
  permissionsGranted: Permission[];
  clientsAffected?: string[];
  activatedAt: Date;
  expiresAt: Date;
  deactivatedAt?: Date;
  deactivatedBy?: string;
  incidentId?: string;
  complianceReviewRequired: boolean;
  complianceReviewedAt?: Date;
  complianceReviewedBy?: string;
}

export type EmergencyType =
  | 'client_care_emergency'
  | 'system_outage'
  | 'security_incident'
  | 'data_breach'
  | 'natural_disaster'
  | 'regulatory_audit';

export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// Separation of Duties Types
// ============================================================================

export interface SODViolation {
  id: string;
  organizationId: string;
  userId: string;
  violationType: string;
  description: string;
  permissionsInvolved: Permission[];
  detectedAt: Date;
  severity: EmergencySeverity;
  status: ViolationStatus;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export type ViolationStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

// ============================================================================
// Core Data Types (Pod-Aware)
// ============================================================================

export interface Client {
  id: string;
  organizationId: string;
  podId: string;
  pod?: Pod;
  clientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  ssnEncrypted?: string;
  medicaidNumber?: string;
  address: Address;
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
  carePlan: CarePlan;
  status: ClientStatus;
  admissionDate?: Date;
  dischargeDate?: Date;
  dataClassification: DataClassification;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientStatus = 'active' | 'inactive' | 'discharged' | 'suspended';

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface MedicalInfo {
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  medications?: Medication[];
  allergies?: string[];
  mobilityAids?: string[];
  cognitiveStatus?: string;
  dietaryRestrictions?: string[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  notes?: string;
}

export interface CarePlan {
  goals: string[];
  services: CarePlanService[];
  frequency: string;
  duration?: string;
  specialInstructions?: string[];
  lastReviewed?: Date;
  nextReview?: Date;
}

export interface CarePlanService {
  type: ServiceType;
  frequency: string;
  duration: number; // minutes
  tasks: string[];
}

export interface Caregiver {
  id: string;
  userId: string;
  user?: User;
  organizationId: string;
  podId: string;
  pod?: Pod;
  employeeCode: string;
  hireDate: Date;
  employmentStatus: EmploymentStatus;
  payRate?: number;
  certifications: Certification[];
  specializations: string[];
  maximumClients: number;
  availability: Availability;
  performanceMetrics: PerformanceMetrics;
  backgroundCheckStatus: BackgroundCheckStatus;
  backgroundCheckDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EmploymentStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';
export type BackgroundCheckStatus = 'pending' | 'in_progress' | 'cleared' | 'flagged' | 'failed';

export interface Certification {
  type: string;
  number?: string;
  issuedBy: string;
  issuedDate: Date;
  expiresDate?: Date;
  status: 'active' | 'expired' | 'suspended';
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface Availability {
  schedule: WeeklySchedule;
  timeOff: TimeOffPeriod[];
  maxHoursPerWeek?: number;
  travelRadius?: number; // miles
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  available: boolean;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  breaks?: BreakPeriod[];
}

export interface BreakPeriod {
  startTime: string;
  endTime: string;
  type: 'lunch' | 'break' | 'unavailable';
}

export interface TimeOffPeriod {
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'sick' | 'personal' | 'emergency';
  approved: boolean;
  reason?: string;
}

export interface PerformanceMetrics {
  onTimePercentage?: number;
  clientSatisfactionScore?: number;
  completionRate?: number;
  evvComplianceRate?: number;
  lastEvaluation?: Date;
  nextEvaluation?: Date;
  goals?: string[];
  notes?: string;
}

// ============================================================================
// Visit and EVV Types
// ============================================================================

export interface Visit {
  id: string;
  organizationId: string;
  podId: string;
  pod?: Pod;
  clientId: string;
  client?: Client;
  caregiverId: string;
  caregiver?: Caregiver;
  visitCode: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  serviceType: ServiceType;
  status: VisitStatus;
  notes?: string;
  careTasks: CareTask[];
  evvRecord?: EVVRecord;
  createdAt: Date;
  updatedAt: Date;
}

export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface CareTask {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  notes?: string;
  completedAt?: Date;
}

export interface EVVRecord {
  id: string;
  organizationId: string;
  podId: string;
  visitId: string;
  caregiverId: string;
  clientId: string;
  clockInTime?: Date;
  clockOutTime?: Date;
  clockInLocation?: GPSLocation;
  clockOutLocation?: GPSLocation;
  clockInMethod: EVVMethod;
  clockOutMethod?: EVVMethod;
  totalHours?: number;
  serviceVerification: ServiceVerification;
  ohioEVVSubmitted: boolean;
  ohioEVVResponse?: any;
  complianceStatus: ComplianceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type EVVMethod = 'gps' | 'proximity' | 'phone' | 'manual' | 'biometric';
export type ComplianceStatus = 'pending' | 'compliant' | 'non_compliant' | 'override';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  address?: string;
}

export interface ServiceVerification {
  tasksCompleted: string[];
  clientSignature?: string;
  caregiverNotes?: string;
  photoVerification?: string[];
  witnessSignature?: string;
}

// ============================================================================
// Audit and Security Types
// ============================================================================

export interface AuditEvent {
  id: string;
  organizationId: string;
  podId?: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  ipAddress?: string;
  userAgent?: string;
  eventData: Record<string, any>;
  phiAccessed: boolean;
  dataClassification: DataClassification;
  timestamp: Date;
}

export interface SecurityIncident {
  id: string;
  organizationId: string;
  podId?: string;
  incidentType: string;
  severity: EmergencySeverity;
  title: string;
  description: string;
  reportedBy?: string;
  assignedTo?: string;
  status: IncidentStatus;
  phiInvolved: boolean;
  affectedUsers?: string[];
  affectedClients?: string[];
  containmentActions?: string[];
  resolutionNotes?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export interface ComplianceExport {
  id: string;
  organizationId: string;
  exportType: string;
  podIds?: string[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
  requestedBy: string;
  generatedAt: Date;
  filePath?: string;
  fileSize?: number;
  encryptionKeyId?: string;
  accessLog: AccessLogEntry[];
  expiresAt?: Date;
  status: ExportStatus;
}

export type ExportStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'expired';

export interface AccessLogEntry {
  userId: string;
  accessedAt: Date;
  ipAddress: string;
  purpose: string;
  downloaded: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  traceId?: string;
}

export interface ResponseMetadata {
  pagination?: PaginationInfo;
  filters?: Record<string, any>;
  sort?: SortInfo;
  executionTime?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortInfo {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Pod Management API Types
// ============================================================================

export interface CreatePodRequest {
  code: string;
  name: string;
  city: string;
  state: string;
  region?: string;
  capacity?: number;
  teamLeadId?: string;
  coverageArea?: GeographicArea;
  serviceTypes?: ServiceType[];
}

export interface UpdatePodRequest {
  name?: string;
  capacity?: number;
  teamLeadId?: string;
  coverageArea?: GeographicArea;
  serviceTypes?: ServiceType[];
  status?: PodStatus;
}

export interface PodAssignmentRequest {
  userId: string;
  roleInPod: string;
  accessLevel?: AccessLevel;
  isPrimary?: boolean;
  expiresAt?: Date;
}

export interface JITAccessRequest {
  userId: string;
  permissions: Permission[];
  justification: string;
  durationMinutes: number;
  emergencyType?: EmergencyType;
  approvalRequired?: boolean;
}

export interface BreakGlassRequest {
  emergencyType: EmergencyType;
  emergencyDescription: string;
  severity: EmergencySeverity;
  clientsAffected?: string[];
}

// ============================================================================
// Dashboard and Reporting Types
// ============================================================================

export interface PodDashboardData {
  pod: Pod;
  metrics: PodMetrics;
  alerts: PodAlert[];
  recentActivity: AuditEvent[];
  complianceStatus: ComplianceStatus;
  performanceIndicators: PerformanceIndicator[];
}

export interface PodAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: EmergencySeverity;
  title: string;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface PerformanceIndicator {
  name: string;
  value: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export interface GovernanceDashboardData {
  organization: Organization;
  pods: Pod[];
  activeUsers: number;
  activeJITGrants: JITAccessGrant[];
  recentBreakGlass: BreakGlassAccess[];
  sodViolations: SODViolation[];
  securityIncidents: SecurityIncident[];
  complianceScore: number;
}