/**
 * Automation & Document Processing Type Definitions
 * Serenity ERP - Automation System Types
 */

// ============================================================================
// Document Template Types
// ============================================================================

export interface SectionFormatting {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  indentation?: number;
  listStyleType?: 'none' | 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'upper-alpha';
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  headerLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'custom' | 'conditional' | 'cross_field';
  condition?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  errorCode?: string;
  priority: number;
  dependencies?: string[];

  // Type-specific properties
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
  customValidator?: string;
  crossFieldTarget?: string;
  crossFieldComparison?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface NotificationConfig {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'system';
  enabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';

  // Delivery settings
  recipients: NotificationRecipient[];
  channels: NotificationChannel[];
  schedule?: NotificationSchedule;

  // Content settings
  template: string;
  subject?: string;
  body: string;
  variables?: Record<string, any>;

  // Retry & delivery
  retryPolicy: RetryPolicy;
  deliveryOptions: DeliveryOptions;

  // Conditions
  conditions?: NotificationCondition[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  organizationId: string;
  podId?: string;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'role' | 'group' | 'external';
  identifier: string; // user ID, role name, email, etc.
  name?: string;
  contact?: {
    email?: string;
    phone?: string;
    webhookUrl?: string;
  };
  preferences?: {
    preferredChannel?: 'email' | 'sms' | 'push';
    timeZone?: string;
    quietHours?: {
      start: string;
      end: string;
    };
  };
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook' | 'system';
  config: Record<string, any>;
  fallbackChannel?: string;
  enabled: boolean;
}

export interface NotificationSchedule {
  type: 'immediate' | 'delayed' | 'recurring' | 'conditional';
  delay?: number; // minutes
  recurringPattern?: {
    frequency: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
    interval: number;
    endDate?: Date;
    maxOccurrences?: number;
  };
  conditions?: string[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  retryableErrors?: string[];
}

export interface DeliveryOptions {
  batchSize?: number;
  throttleRate?: number; // notifications per minute
  trackDelivery: boolean;
  requireConfirmation?: boolean;
  expirationTime?: number; // minutes
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

// ============================================================================
// Alert Types
// ============================================================================

export type AlertType =
  | 'system_error'
  | 'security_breach'
  | 'data_integrity'
  | 'compliance_violation'
  | 'performance_degradation'
  | 'resource_exhaustion'
  | 'authentication_failure'
  | 'authorization_denied'
  | 'workflow_failure'
  | 'data_validation_error'
  | 'external_service_failure'
  | 'backup_failure'
  | 'configuration_error'
  | 'network_connectivity'
  | 'database_connection'
  | 'file_system_error'
  | 'quality_concern'
  | 'deadline_approaching'
  | 'task_overdue'
  | 'capacity_threshold'
  | 'budget_threshold'
  | 'user_activity_anomaly'
  | 'business_rule_violation'
  | 'integration_failure'
  | 'audit_finding'
  | 'regulatory_deadline'
  | 'license_expiration';

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  title: string;
  description: string;
  source: string;

  // Context
  organizationId: string;
  podId?: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;

  // Details
  details?: Record<string, any>;
  stackTrace?: string;
  errorCode?: string;

  // Actions
  suggestedActions?: string[];
  automatedActions?: string[];

  // Workflow
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  firstOccurrence: Date;
  lastOccurrence: Date;
  occurrenceCount: number;

  // Related
  parentAlertId?: string;
  relatedAlerts?: string[];
  notificationsSent?: string[];
}

// ============================================================================
// Paperwork Agent Types
// ============================================================================

export interface PaperworkAgent {
  id: string;
  organizationId: string;
  podId?: string;
  name: string;
  description: string;
  type: 'form_filler' | 'document_processor' | 'compliance_checker' | 'data_extractor';
  status: 'active' | 'inactive' | 'paused' | 'error';
  version: string;

  // Configuration
  configuration: AgentConfiguration;
  triggers: AgentTrigger[];
  actions: AgentAction[];
  rules: AgentRule[];

  // Performance
  metrics: AgentMetrics;

  // Security
  permissions: string[];
  accessLevel: 'read' | 'write' | 'admin';
  encryptionRequired: boolean;

  // Audit
  auditConfig: AuditConfiguration;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface AgentConfiguration {
  batchSize: number;
  processingMode: 'real_time' | 'batch' | 'scheduled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number; // seconds

  // AI Configuration
  aiProvider: 'openai' | 'anthropic' | 'azure' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;

  // Processing Configuration
  inputFormats: string[];
  outputFormats: string[];
  qualityThreshold: number;
  confidenceThreshold: number;

  // Error Handling
  errorHandling: ErrorHandlingConfig;
  retryPolicy: RetryPolicy;

  // Notifications
  notificationConfig: NotificationConfig;
}

export interface AgentTrigger {
  id: string;
  type: 'schedule' | 'event' | 'webhook' | 'manual' | 'file_upload' | 'status_change';
  config: Record<string, any>;
  enabled: boolean;
  conditions?: string[];
}

export interface AgentAction {
  id: string;
  type: 'extract_data' | 'fill_form' | 'validate_data' | 'send_notification' | 'update_record' | 'generate_report';
  config: Record<string, any>;
  order: number;
  conditions?: string[];
  onSuccess?: string;
  onFailure?: string;
}

export interface AgentRule {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'transformation' | 'routing' | 'approval' | 'compliance';
  expression: string;
  priority: number;
  enabled: boolean;
  errorMessage?: string;
}

export interface AgentMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageProcessingTime: number;
  averageConfidenceScore: number;
  documentsProcessed: number;
  errorsLastWeek: number;
  performanceScore: number;
  lastUpdated: Date;
}

export interface ErrorHandlingConfig {
  strategy: 'fail_fast' | 'continue_on_error' | 'retry_with_fallback';
  maxErrors: number;
  fallbackAction?: string;
  notifyOnError: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface AuditConfiguration {
  enabled: boolean;
  logLevel: 'basic' | 'detailed' | 'full';
  retentionDays: number;
  includeInputData: boolean;
  includeOutputData: boolean;
  trackPerformanceMetrics: boolean;
  complianceMode: boolean;
}

// ============================================================================
// Generation Types
// ============================================================================

export interface GeneratedDocument {
  id: string;
  templateId: string;
  organizationId: string;
  podId?: string;
  generatedBy: string;
  format: 'pdf' | 'docx' | 'html' | 'txt' | 'xlsx';
  title: string;
  content: string | Buffer;
  metadata: GenerationMetadata;
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface GenerationMetadata {
  dataSourcesUsed: string[];
  variablesResolved: Record<string, any>;
  sectionsGenerated: string[];
  generationTimeMs: number;
  aiTokensUsed?: number;
  qualityScore?: number;
  approvalRequired: boolean;
  reviewers?: string[];
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}