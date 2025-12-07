/**
 * Comprehensive Access Control System for Serenity ERP
 * Implements RBAC (Role-Based Access Control) + ABAC (Attribute-Based Access Control)
 * with Row-Level Security (RLS) enforcement
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '../database/client';
import { AuditLogger } from '../audit/logger';
import { PHIDetector } from '../security/phi-detector';
import { createLogger } from '../utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

export enum UserRole {
  FOUNDER = 'founder',
  SECURITY_OFFICER = 'security_officer',
  COMPLIANCE_OFFICER = 'compliance_officer',
  FINANCE_DIRECTOR = 'finance_director',
  BILLING_MANAGER = 'billing_manager',
  RCM_ANALYST = 'rcm_analyst',
  SCHEDULER = 'scheduler',
  FIELD_SUPERVISOR = 'field_supervisor',
  HR_MANAGER = 'hr_manager',
  CREDENTIALING_SPECIALIST = 'credentialing_specialist',
  IT_ADMIN = 'it_admin',
  SUPPORT_AGENT = 'support_agent',
  // Clinical Roles
  RN_CASE_MANAGER = 'rn_case_manager',
  LPN_LVN = 'lpn_lvn',
  THERAPIST = 'therapist', // PT, OT, SLP
  CLINICAL_DIRECTOR = 'clinical_director',

  // ODD/Support Roles
  QIDP = 'qidp',
  DSP_MED = 'dsp_med',
  DSP_BASIC = 'dsp_basic',

  // Administrative
  INSURANCE_MANAGER = 'insurance_manager',
  BILLING_CODER = 'billing_coder',

  // Legacy (Deprecated)
  CAREGIVER = 'caregiver',

  CLIENT = 'client',
  FAMILY = 'family',
  PAYER_AUDITOR = 'payer_auditor',
  AI_SERVICE = 'ai_service'
}

export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Client management (PHI)
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  CLIENT_PHI_ACCESS = 'client:phi_access',
  CLIENT_ASSESS = 'client:assess', // OASIS, Evaluation

  // Clinical
  MED_ADMINISTER = 'med:administer',
  MED_ORDER = 'med:order',
  CARE_PLAN_WRITE = 'care_plan:write',
  CARE_PLAN_READ = 'care_plan:read',
  BEHAVIOR_PLAN_WRITE = 'behavior_plan:write',
  BEHAVIOR_LOG_WRITE = 'behavior_log:write',

  // Scheduling
  SCHEDULE_CREATE = 'schedule:create',
  SCHEDULE_READ = 'schedule:read',
  SCHEDULE_UPDATE = 'schedule:update',
  SCHEDULE_DELETE = 'schedule:delete',
  SCHEDULE_ASSIGN = 'schedule:assign',

  // EVV
  EVV_CREATE = 'evv:create',
  EVV_READ = 'evv:read',
  EVV_UPDATE = 'evv:update',
  EVV_OVERRIDE = 'evv:override',
  EVV_SUBMIT = 'evv:submit',

  // Billing
  BILLING_CREATE = 'billing:create',
  BILLING_READ = 'billing:read',
  BILLING_UPDATE = 'billing:update',
  BILLING_SUBMIT = 'billing:submit',
  BILLING_APPROVE = 'billing:approve',

  // HR & Credentials
  HR_CREATE = 'hr:create',
  HR_READ = 'hr:read',
  HR_UPDATE = 'hr:update',
  HR_DELETE = 'hr:delete',
  CREDENTIAL_VERIFY = 'credential:verify',

  // Security & Audit
  AUDIT_READ = 'audit:read',
  SECURITY_MANAGE = 'security:manage',
  INCIDENT_MANAGE = 'incident:manage',

  // AI Agents
  AI_INTERACT = 'ai:interact',
  AI_ADMIN = 'ai:admin',

  // System Admin
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_MONITOR = 'system:monitor'
}

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  PHI = 'phi'
}

export interface UserContext {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  attributes: UserAttribute[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

export interface UserAttribute {
  name: string;
  value: string;
  expiresAt?: Date;
  isActive: boolean;
}

// Extend Express Request interface to include user and auditLogger
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
      auditLogger?: AuditLogger;
    }
  }
}

export interface AccessRequest {
  action: Permission;
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, any>;
  };
  context: {
    dataClassification?: DataClassification;
    purpose?: string;
    environment?: Record<string, any>;
  };
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  conditions?: string[];
  auditRequired: boolean;
  dataClassification: DataClassification;
}

// ============================================================================
// Role-Based Access Control (RBAC) Configuration
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.FOUNDER]: [
    // Full system access
    ...Object.values(Permission)
  ],

  [UserRole.SECURITY_OFFICER]: [
    Permission.USER_READ,
    Permission.AUDIT_READ,
    Permission.SECURITY_MANAGE,
    Permission.INCIDENT_MANAGE,
    Permission.SYSTEM_MONITOR,
    Permission.AI_ADMIN
  ],

  [UserRole.COMPLIANCE_OFFICER]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.CLIENT_PHI_ACCESS,
    Permission.SCHEDULE_READ,
    Permission.EVV_READ,
    Permission.BILLING_READ,
    Permission.HR_READ,
    Permission.AUDIT_READ,
    Permission.INCIDENT_MANAGE,
    Permission.AI_INTERACT
  ],

  [UserRole.FINANCE_DIRECTOR]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.EVV_READ,
    Permission.BILLING_CREATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_APPROVE,
    Permission.HR_READ,
    Permission.AI_INTERACT
  ],

  [UserRole.BILLING_MANAGER]: [
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.EVV_READ,
    Permission.BILLING_CREATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_SUBMIT,
    Permission.AI_INTERACT
  ],

  [UserRole.RCM_ANALYST]: [
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.EVV_READ,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.AI_INTERACT
  ],

  [UserRole.SCHEDULER]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_ASSIGN,
    Permission.EVV_READ,
    Permission.HR_READ,
    Permission.AI_INTERACT
  ],

  [UserRole.FIELD_SUPERVISOR]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.EVV_READ,
    Permission.EVV_UPDATE,
    Permission.HR_READ,
    Permission.AI_INTERACT
  ],

  [UserRole.HR_MANAGER]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.HR_CREATE,
    Permission.HR_READ,
    Permission.HR_UPDATE,
    Permission.HR_DELETE,
    Permission.CREDENTIAL_VERIFY,
    Permission.AI_INTERACT
  ],

  [UserRole.CREDENTIALING_SPECIALIST]: [
    Permission.USER_READ,
    Permission.HR_READ,
    Permission.HR_UPDATE,
    Permission.CREDENTIAL_VERIFY,
    Permission.AI_INTERACT
  ],

  [UserRole.IT_ADMIN]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_BACKUP,
    Permission.SYSTEM_MONITOR,
    Permission.SECURITY_MANAGE,
    Permission.AI_ADMIN
  ],

  [UserRole.SUPPORT_AGENT]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.AI_INTERACT
  ],

  [UserRole.CAREGIVER]: [
    Permission.SCHEDULE_READ,
    Permission.EVV_CREATE,
    Permission.EVV_READ,
    Permission.HR_READ,
    Permission.AI_INTERACT
  ],

  // Clinical Roles
  [UserRole.RN_CASE_MANAGER]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.CLIENT_PHI_ACCESS,
    Permission.CLIENT_ASSESS,
    Permission.CARE_PLAN_WRITE,
    Permission.CARE_PLAN_READ,
    Permission.MED_ORDER,
    Permission.MED_ADMINISTER,
    Permission.SCHEDULE_READ,
    Permission.EVV_CREATE,
    Permission.EVV_READ,
    Permission.HR_READ
  ],

  [UserRole.LPN_LVN]: [
    Permission.CLIENT_READ,
    Permission.CLIENT_PHI_ACCESS,
    Permission.CARE_PLAN_READ,
    Permission.MED_ADMINISTER,
    Permission.SCHEDULE_READ,
    Permission.EVV_CREATE
  ],

  [UserRole.DSP_MED]: [
    Permission.CLIENT_READ,
    Permission.CARE_PLAN_READ,
    Permission.MED_ADMINISTER,
    Permission.BEHAVIOR_LOG_WRITE,
    Permission.SCHEDULE_READ,
    Permission.EVV_CREATE
  ],

  [UserRole.DSP_BASIC]: [
    Permission.CLIENT_READ,
    Permission.CARE_PLAN_READ,
    Permission.BEHAVIOR_LOG_WRITE,
    Permission.SCHEDULE_READ,
    Permission.EVV_CREATE
  ],

  [UserRole.QIDP]: [
    Permission.CLIENT_READ,
    Permission.CLIENT_PHI_ACCESS,
    Permission.CARE_PLAN_WRITE,
    Permission.CARE_PLAN_READ,
    Permission.BEHAVIOR_PLAN_WRITE,
    Permission.BEHAVIOR_LOG_WRITE,
    Permission.SCHEDULE_UPDATE
  ],

  [UserRole.THERAPIST]: [
    Permission.CLIENT_READ,
    Permission.CLIENT_PHI_ACCESS,
    Permission.CLIENT_ASSESS, // Evaluations
    Permission.CARE_PLAN_WRITE, // Therapy goals
    Permission.SCHEDULE_READ
  ],

  [UserRole.CLINICAL_DIRECTOR]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.CLIENT_PHI_ACCESS,
    Permission.CLIENT_ASSESS,
    Permission.INCIDENT_MANAGE,
    Permission.AUDIT_READ,
    Permission.CARE_PLAN_READ,
    Permission.CARE_PLAN_WRITE
  ],

  [UserRole.INSURANCE_MANAGER]: [
    Permission.CLIENT_READ,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE
  ],

  [UserRole.BILLING_CODER]: [
    Permission.CLIENT_READ,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE
  ],



  [UserRole.CLIENT]: [
    Permission.SCHEDULE_READ,
    Permission.AI_INTERACT
  ],

  [UserRole.FAMILY]: [
    Permission.SCHEDULE_READ,
    Permission.AI_INTERACT
  ],

  [UserRole.PAYER_AUDITOR]: [
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.EVV_READ,
    Permission.BILLING_READ,
    Permission.AUDIT_READ
  ],

  [UserRole.AI_SERVICE]: [
    Permission.USER_READ,
    Permission.CLIENT_READ,
    Permission.SCHEDULE_READ,
    Permission.EVV_READ,
    Permission.BILLING_READ,
    Permission.HR_READ,
    Permission.AI_INTERACT
  ]
};

// ============================================================================
// Attribute-Based Access Control (ABAC) Engine
// ============================================================================

export class ABACEngine {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;
  private phiDetector: PHIDetector;

  constructor(db: DatabaseClient, auditLogger: AuditLogger, phiDetector: PHIDetector) {
    this.db = db;
    this.auditLogger = auditLogger;
    this.phiDetector = phiDetector;
  }

  /**
   * Evaluate access request using ABAC policies
   */
  async evaluateAccess(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    try {
      // Start with RBAC check
      const rbacAllowed = this.checkRBACPermission(user.role, request.action);
      if (!rbacAllowed) {
        return {
          allowed: false,
          reason: `Role ${user.role} does not have permission ${request.action}`,
          auditRequired: true,
          dataClassification: request.context.dataClassification || DataClassification.INTERNAL
        };
      }

      // Apply attribute-based restrictions
      const abacDecision = await this.evaluateABACRules(user, request);
      if (!abacDecision.allowed) {
        return abacDecision;
      }

      // Apply data classification restrictions
      const dataClassDecision = this.evaluateDataClassification(user, request);
      if (!dataClassDecision.allowed) {
        return dataClassDecision;
      }

      // Apply separation of duties
      const sodDecision = await this.evaluateSeparationOfDuties(user, request);
      if (!sodDecision.allowed) {
        return sodDecision;
      }

      // Apply time-based restrictions
      const timeDecision = this.evaluateTimeRestrictions(user, request);
      if (!timeDecision.allowed) {
        return timeDecision;
      }

      // Apply location-based restrictions
      const locationDecision = this.evaluateLocationRestrictions(user, request);
      if (!locationDecision.allowed) {
        return locationDecision;
      }

      return {
        allowed: true,
        reason: 'Access granted based on RBAC and ABAC evaluation',
        auditRequired: this.requiresAudit(request),
        dataClassification: request.context.dataClassification || DataClassification.INTERNAL
      };

    } catch (error) {
      await this.auditLogger.logSecurity("suspicious_activity", "high", {
        userId: user.userId,
        details: { error: error instanceof Error ? error.message : String(error), request }
      });

      return {
        allowed: false,
        reason: 'Access control evaluation failed',
        auditRequired: true,
        dataClassification: DataClassification.CONFIDENTIAL
      };
    }
  }

  /**
   * Check RBAC permission
   */
  private checkRBACPermission(role: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Evaluate ABAC rules based on user attributes
   */
  private async evaluateABACRules(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    // Caseload-based access control (Primary for Clinicians)
    if (request.resource.type === 'client' && request.resource.id) {
      if (this.isClinician(user.role)) {
        const caseloadAccess = await this.checkCaseloadAccess(user, request);
        if (caseloadAccess.allowed) {
          return caseloadAccess;
        }
      }
    }

    // Pod-based access control
    if (request.resource.type === 'client' || request.resource.type === 'shift') {
      const podAccess = await this.checkPodAccess(user, request);
      if (!podAccess.allowed) {
        return podAccess;
      }
    }

    // Client assignment-based access
    if (request.resource.type === 'shift' && user.role === UserRole.CAREGIVER) {
      const assignmentAccess = await this.checkAssignmentAccess(user, request);
      if (!assignmentAccess.allowed) {
        return assignmentAccess;
      }
    }

    // Family member access restrictions
    if (user.role === UserRole.FAMILY) {
      const familyAccess = await this.checkFamilyAccess(user, request);
      if (!familyAccess.allowed) {
        return familyAccess;
      }
    }

    return {
      allowed: true,
      reason: 'ABAC rules satisfied',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  // Helper methods for Caseload logic
  private async checkCaseloadAccess(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    if (!request.resource.id) return { allowed: false, reason: 'No resource ID', auditRequired: false, dataClassification: DataClassification.INTERNAL };

    // Queries new caseloads table
    const result = await this.db.query(
      'SELECT status FROM caseloads WHERE clinician_id = $1 AND client_id = $2 AND status = \'active\'',
      [user.userId, request.resource.id]
    );

    if (result.rows.length > 0) {
      return {
        allowed: true,
        reason: 'Active caseload assignment',
        auditRequired: false,
        dataClassification: DataClassification.PHI
      };
    }

    // Check for "Break Glass" emergency permit
    const breakGlass = await this.db.query(
      `SELECT id FROM break_glass_requests 
       WHERE user_id = $1 AND client_id = $2 AND expires_at > NOW()`,
      [user.userId, request.resource.id]
    );

    if (breakGlass.rows.length > 0) {
      // Log critical security event for using break-glass
      this.auditLogger.logSecurity('phi_access_violation', 'high', {
        userId: user.userId,
        organizationId: user.organizationId,
        details: {
          action: 'break_glass_access',
          patientId: request.resource.id,
          requestId: breakGlass.rows[0].id,
          description: 'Emergency Break-Glass Access Used'
        }
      });

      return {
        allowed: true,
        reason: 'Emergency Break-Glass permit active',
        auditRequired: true,
        dataClassification: DataClassification.PHI
      };
    }

    return {
      allowed: false,
      reason: 'Patient not in active caseload',
      auditRequired: true,
      dataClassification: DataClassification.PHI
    };
  }

  private isClinician(role: UserRole): boolean {
    return [
      UserRole.RN_CASE_MANAGER,
      UserRole.LPN_LVN,
      UserRole.THERAPIST,
      UserRole.QIDP,
      UserRole.DSP_MED,
      UserRole.DSP_BASIC
    ].includes(role);
  }

  /**
   * Check pod-based access control
   */
  private async checkPodAccess(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    // Get user's pod access attributes
    const podAttributes = user.attributes.filter(attr =>
      attr.name === 'pod_access' && attr.isActive &&
      (!attr.expiresAt || attr.expiresAt > new Date())
    );

    if (podAttributes.length === 0 && !this.hasHighLevelRole(user.role)) {
      return {
        allowed: false,
        reason: 'User has no pod access assignments',
        auditRequired: true,
        dataClassification: DataClassification.PHI
      };
    }

    // For specific resource access, check pod membership
    if (request.resource.id) {
      const resourcePod = await this.getResourcePod(request.resource.type, request.resource.id);
      const userPods = podAttributes.map(attr => attr.value);

      if (resourcePod && !userPods.includes(resourcePod) && !this.hasHighLevelRole(user.role)) {
        return {
          allowed: false,
          reason: `User does not have access to pod ${resourcePod}`,
          auditRequired: true,
          dataClassification: DataClassification.PHI
        };
      }
    }

    return {
      allowed: true,
      reason: 'Pod access verified',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  /**
   * Check caregiver assignment access
   */
  private async checkAssignmentAccess(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    if (request.resource.type === 'shift' && request.resource.id) {
      const shift = await this.db.query(
        'SELECT caregiver_id FROM shifts WHERE id = $1',
        [request.resource.id]
      );

      if (shift.rows.length > 0 && shift.rows[0].caregiver_id !== user.userId) {
        return {
          allowed: false,
          reason: 'Caregiver can only access their own shifts',
          auditRequired: true,
          dataClassification: DataClassification.PHI
        };
      }
    }

    return {
      allowed: true,
      reason: 'Assignment access verified',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  /**
   * Check family member access
   */
  private async checkFamilyAccess(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    // Family members can only access their own family member's data
    const familyClients = await this.db.query(
      'SELECT client_id FROM family_members WHERE user_id = $1 AND portal_access = true',
      [user.userId]
    );

    const authorizedClientIds = familyClients.rows.map(row => row.client_id);

    if (request.resource.type === 'client' && request.resource.id) {
      if (!authorizedClientIds.includes(request.resource.id)) {
        return {
          allowed: false,
          reason: 'Family member can only access their own family member data',
          auditRequired: true,
          dataClassification: DataClassification.PHI
        };
      }
    }

    return {
      allowed: true,
      reason: 'Family access verified',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  /**
   * Evaluate data classification restrictions
   */
  private evaluateDataClassification(user: UserContext, request: AccessRequest): AccessDecision {
    const classification = request.context.dataClassification || DataClassification.INTERNAL;

    // PHI access requires special permission
    if (classification === DataClassification.PHI) {
      const hasPHIAccess = user.permissions.includes(Permission.CLIENT_PHI_ACCESS) ||
        this.hasHighLevelRole(user.role);

      if (!hasPHIAccess) {
        return {
          allowed: false,
          reason: 'User does not have PHI access permission',
          auditRequired: true,
          dataClassification: classification
        };
      }
    }

    return {
      allowed: true,
      reason: 'Data classification check passed',
      auditRequired: classification === DataClassification.PHI,
      dataClassification: classification
    };
  }

  /**
   * Evaluate separation of duties constraints
   */
  private async evaluateSeparationOfDuties(user: UserContext, request: AccessRequest): Promise<AccessDecision> {
    // EVV override and claim submission separation
    if (request.action === Permission.BILLING_SUBMIT) {
      const hasEVVOverride = user.permissions.includes(Permission.EVV_OVERRIDE);
      if (hasEVVOverride && !this.hasHighLevelRole(user.role)) {
        return {
          allowed: false,
          reason: 'Separation of duties: Cannot submit claims and override EVV',
          auditRequired: true,
          dataClassification: DataClassification.CONFIDENTIAL
        };
      }
    }

    return {
      allowed: true,
      reason: 'Separation of duties check passed',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  /**
   * Evaluate time-based restrictions
   */
  private evaluateTimeRestrictions(user: UserContext, request: AccessRequest): AccessDecision {
    const now = new Date();
    const hour = now.getHours();

    // Restrict certain operations outside business hours
    const restrictedActions = [
      Permission.BILLING_SUBMIT,
      Permission.USER_CREATE,
      Permission.SYSTEM_CONFIG
    ];

    if (restrictedActions.includes(request.action)) {
      // Business hours: 6 AM - 10 PM
      if (hour < 6 || hour > 22) {
        if (!this.hasEmergencyOverride(user)) {
          return {
            allowed: false,
            reason: 'Operation not allowed outside business hours',
            conditions: ['emergency_override_required'],
            auditRequired: true,
            dataClassification: DataClassification.INTERNAL
          };
        }
      }
    }

    return {
      allowed: true,
      reason: 'Time restrictions check passed',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  /**
   * Evaluate location-based restrictions
   */
  private evaluateLocationRestrictions(user: UserContext, request: AccessRequest): AccessDecision {
    // Check for suspicious geographic access patterns
    // This would integrate with IP geolocation services

    return {
      allowed: true,
      reason: 'Location restrictions check passed',
      auditRequired: false,
      dataClassification: DataClassification.INTERNAL
    };
  }

  /**
   * Helper methods
   */
  private hasHighLevelRole(role: UserRole): boolean {
    return [
      UserRole.FOUNDER,
      UserRole.SECURITY_OFFICER,
      UserRole.COMPLIANCE_OFFICER
    ].includes(role);
  }

  private hasEmergencyOverride(user: UserContext): boolean {
    return user.attributes.some(attr =>
      attr.name === 'emergency_override' &&
      attr.isActive &&
      (!attr.expiresAt || attr.expiresAt > new Date())
    );
  }

  private async getResourcePod(resourceType: string, resourceId: string): Promise<string | null> {
    let query = '';
    switch (resourceType) {
      case 'client':
        query = 'SELECT pod_id FROM clients WHERE id = $1';
        break;
      case 'shift':
        query = 'SELECT pod_id FROM shifts WHERE id = $1';
        break;
      default:
        return null;
    }

    const result = await this.db.query(query, [resourceId]);
    return result.rows[0]?.pod_id || null;
  }

  private requiresAudit(request: AccessRequest): boolean {
    const auditRequiredActions = [
      Permission.CLIENT_PHI_ACCESS,
      Permission.BILLING_SUBMIT,
      Permission.EVV_OVERRIDE,
      Permission.SECURITY_MANAGE,
      Permission.SYSTEM_CONFIG
    ];

    return auditRequiredActions.includes(request.action) ||
      request.context.dataClassification === DataClassification.PHI;
  }
}

// ============================================================================
// Express Middleware
// ============================================================================

export function createAccessControlMiddleware(
  abacEngine: ABACEngine
) {
  return function accessControl(
    requiredPermission: Permission,
    options: {
      resourceType?: string;
      dataClassification?: DataClassification;
      bypassForRoles?: UserRole[];
    } = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as UserContext;
        if (!user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        // Check bypass roles
        if (options.bypassForRoles && options.bypassForRoles.includes(user.role)) {
          return next();
        }

        const accessRequest: AccessRequest = {
          action: requiredPermission,
          resource: {
            type: options.resourceType || 'unknown',
            ...(req.params.id && { id: req.params.id }),
            ...(req.body && { attributes: req.body })
          },
          context: {
            ...(options.dataClassification && { dataClassification: options.dataClassification }),
            purpose: req.headers['x-purpose'] as string || 'unknown',
            environment: {
              userAgent: req.headers['user-agent'] || 'unknown',
              ipAddress: req.ip || 'unknown',
              timestamp: new Date()
            }
          }
        };

        const decision = await abacEngine.evaluateAccess(user, accessRequest);

        if (!decision.allowed) {
          // Log access denial
          await req.auditLogger?.logSecurity("authorization_failure", "medium", {
            userId: user.userId,
            details: {
              permission: requiredPermission,
              reason: decision.reason,
              resource: accessRequest.resource
            }
          });

          return res.status(403).json({
            error: 'Access denied',
            reason: decision.reason,
            conditions: decision.conditions
          });
        }

        // Add data classification header
        res.setHeader('X-Data-Classification', decision.dataClassification);

        // Log successful access if audit required
        if (decision.auditRequired) {
          req.auditLogger?.logAudit(
            'access_granted',
            `${accessRequest.resource.type}`,
            'success',
            {
              userId: user.userId,
              dataClassification: decision.dataClassification,
              accessReason: 'authorized_access'
            }
          );
        }

        next();
      } catch (error) {
        createLogger("access-control").error('Access control middleware error:', error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) });
        res.status(500).json({ error: 'Access control evaluation failed' });
      }
    };
  };
}

// ============================================================================
// JIT Access and Break-Glass
// ============================================================================

export class JITAccessManager {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  /**
   * Grant temporary elevated access
   */
  async grantJITAccess(
    userId: string,
    requestedBy: string,
    permissions: Permission[],
    duration: number, // minutes
    justification: string,
    approver?: string
  ): Promise<{ accessId: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);
    const accessId = `jit_${Date.now()}_${userId}`;

    // Insert JIT access record
    await this.db.query(`
      INSERT INTO user_attributes (user_id, attribute_name, attribute_value, granted_by, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, 'jit_access', accessId, requestedBy, expiresAt]);

    // Log permissions individually
    for (const permission of permissions) {
      await this.db.query(`
        INSERT INTO user_attributes (user_id, attribute_name, attribute_value, granted_by, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, 'jit_permission', permission, requestedBy, expiresAt]);
    }

    // Audit log
    await this.auditLogger.logSecurity("privilege_escalation", "high", {
      userId: requestedBy,
      details: {
        targetUserId: userId,
        permissions,
        duration,
        justification,
        approver,
        accessId,
        expiresAt
      }
    });

    return { accessId, expiresAt };
  }

  /**
   * Activate break-glass access for emergencies
   */
  async activateBreakGlass(
    userId: string,
    emergency: {
      type: string;
      description: string;
      clientsAffected?: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<{ accessId: string; expiresAt: Date }> {
    const duration = this.getBreakGlassDuration(emergency.severity);
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);
    const accessId = `breakglass_${Date.now()}_${userId}`;

    // Grant emergency permissions
    const emergencyPermissions = this.getEmergencyPermissions(emergency.type);

    await this.db.query(`
      INSERT INTO user_attributes (user_id, attribute_name, attribute_value, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [userId, 'break_glass_access', accessId, expiresAt]);

    for (const permission of emergencyPermissions) {
      await this.db.query(`
        INSERT INTO user_attributes (user_id, attribute_name, attribute_value, expires_at)
        VALUES ($1, $2, $3, $4)
      `, [userId, 'emergency_permission', permission, expiresAt]);
    }

    // Create security incident
    await this.db.query(`
      INSERT INTO security_incidents (
        organization_id, incident_type, severity, title, description,
        reported_by, status, phi_involved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'org-id', // Would be retrieved from user context
      'break_glass_access',
      emergency.severity,
      `Break-glass access activated: ${emergency.type}`,
      emergency.description,
      userId,
      'open',
      emergency.clientsAffected && emergency.clientsAffected.length > 0
    ]);

    // Audit log
    await this.auditLogger.logSecurity("account_lockout", "critical", {
      userId,
      details: {
        emergency,
        permissions: emergencyPermissions,
        accessId,
        expiresAt
      }
    });

    return { accessId, expiresAt };
  }

  private getBreakGlassDuration(severity: string): number {
    switch (severity) {
      case 'critical': return 60;  // 1 hour
      case 'high': return 30;     // 30 minutes
      case 'medium': return 15;   // 15 minutes
      case 'low': return 5;       // 5 minutes
      default: return 15;
    }
  }

  private getEmergencyPermissions(emergencyType: string): Permission[] {
    switch (emergencyType) {
      case 'client_care_emergency':
        return [
          Permission.CLIENT_READ,
          Permission.CLIENT_PHI_ACCESS,
          Permission.SCHEDULE_READ,
          Permission.SCHEDULE_UPDATE,
          Permission.EVV_READ,
          Permission.EVV_UPDATE
        ];
      case 'system_outage':
        return [
          Permission.SYSTEM_CONFIG,
          Permission.SYSTEM_MONITOR,
          Permission.USER_UPDATE
        ];
      case 'security_incident':
        return [
          Permission.AUDIT_READ,
          Permission.SECURITY_MANAGE,
          Permission.INCIDENT_MANAGE,
          Permission.USER_READ
        ];
      default:
        return [Permission.AI_INTERACT];
    }
  }
}

