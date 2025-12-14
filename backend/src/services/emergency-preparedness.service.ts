/**
 * Emergency Preparedness Service
 * Manages disaster recovery plans and DR testing per OAC 173-39-02.6
 *
 * Compliance Requirements:
 * - Documented disaster recovery plan
 * - Annual DR testing with results logged
 * - Emergency contact directory
 * - Service continuity procedures
 *
 * @module services/emergency-preparedness
 */

import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { NotificationsService, NotificationType, NotificationCategory } from './notifications.service';
import { UserContext } from '../auth/access-control';
import { AuditLogger } from '../audit/logger';

const logger = createLogger('EmergencyPreparednessService');

export interface DisasterRecoveryPlan {
  id: string;
  organizationId: string;
  planVersion: string;
  planName: string;
  effectiveDate: Date;
  expirationDate?: Date;
  nextReviewDate: Date;
  disasterTypes: string[];
  rtoHours: number;
  rpoHours: number;
  emergencyContacts: any[];
  onCallSchedule: any;
  clientNotificationProcedure?: string;
  staffNotificationProcedure?: string;
  payerNotificationProcedure?: string;
  familyNotificationProcedure?: string;
  serviceContinuityPlan?: string;
  criticalFunctions: any[];
  backupProcedures?: string;
  alternativeCareArrangements?: string;
  itRecoveryPlan?: string;
  dataBackupFrequency: string;
  backupLocation?: string;
  systemRestorationSteps?: string;
  emergencySuppliesList: any[];
  emergencyFundAmount?: number;
  approvedBy?: string;
  approvedDate?: Date;
  distributionList: any[];
  status: 'draft' | 'approved' | 'active' | 'expired' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface DRTestLog {
  id: string;
  planId: string;
  testDate: Date;
  testType: 'tabletop_exercise' | 'simulation' | 'partial_failover' | 'full_failover' | 'communication_test' | 'backup_restoration_test';
  testScenario: string;
  testCoordinatorId?: string;
  participants: any[];
  testObjectives: any[];
  successCriteria: any[];
  startTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
  testResults?: string;
  passed: boolean;
  gapsIdentified: any[];
  strengthsIdentified: any[];
  lessonsLearned?: string;
  correctiveActions: any[];
  planUpdatesRequired: boolean;
  planUpdatesCompleted: boolean;
  nextTestRecommendedDate?: Date;
  followUpNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  id: string;
  organizationId: string;
  contactName: string;
  contactRole: string;
  contactType: 'internal' | 'external_agency' | 'vendor' | 'emergency_service';
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  available247: boolean;
  availableHours?: string;
  priorityLevel: number;
  useCases?: string;
  active: boolean;
  lastVerifiedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EmergencyPreparednessService {
  private db: DatabaseClient;
  private notificationsService: NotificationsService;
  private auditLogger: AuditLogger;

  constructor(db?: DatabaseClient, auditLogger?: AuditLogger) {
    this.db = db || getDbClient();
    this.auditLogger = auditLogger || new AuditLogger('emergency-preparedness');
    this.notificationsService = new NotificationsService(this.db, this.auditLogger);
  }

  // ============================================================================
  // Disaster Recovery Plan Management
  // ============================================================================

  /**
   * Create a new disaster recovery plan
   */
  async createDRP(
    data: {
      planVersion: string;
      planName?: string;
      effectiveDate: Date;
      nextReviewDate: Date;
      disasterTypes: string[];
      rtoHours: number;
      rpoHours: number;
      emergencyContacts?: any[];
      onCallSchedule?: any;
      clientNotificationProcedure?: string;
      staffNotificationProcedure?: string;
      serviceContinuityPlan?: string;
      criticalFunctions?: any[];
      itRecoveryPlan?: string;
      dataBackupFrequency?: string;
      backupLocation?: string;
    },
    userContext: UserContext
  ): Promise<DisasterRecoveryPlan> {
    try {
      const result = await this.db.query(
        `INSERT INTO disaster_recovery_plans (
          organization_id, plan_version, plan_name, effective_date, next_review_date,
          disaster_types, rto_hours, rpo_hours, emergency_contacts, on_call_schedule,
          client_notification_procedure, staff_notification_procedure,
          service_continuity_plan, critical_functions, it_recovery_plan,
          data_backup_frequency, backup_location, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'draft', $18)
        RETURNING *`,
        [
          userContext.organizationId,
          data.planVersion,
          data.planName || 'Disaster Recovery & Business Continuity Plan',
          data.effectiveDate,
          data.nextReviewDate,
          JSON.stringify(data.disasterTypes),
          data.rtoHours,
          data.rpoHours,
          JSON.stringify(data.emergencyContacts || []),
          JSON.stringify(data.onCallSchedule || {}),
          data.clientNotificationProcedure || null,
          data.staffNotificationProcedure || null,
          data.serviceContinuityPlan || null,
          JSON.stringify(data.criticalFunctions || []),
          data.itRecoveryPlan || null,
          data.dataBackupFrequency || 'daily',
          data.backupLocation || null,
          userContext.userId
        ]
      );

      logger.info('DRP created', { planId: result.rows[0].id, version: data.planVersion });
      return this.mapRowToDRP(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create DRP', error);
      throw error;
    }
  }

  /**
   * Approve and activate a DRP
   */
  async approveDRP(planId: string, userContext: UserContext): Promise<DisasterRecoveryPlan> {
    try {
      // Deactivate current active plan
      await this.db.query(
        `UPDATE disaster_recovery_plans SET status = 'expired' WHERE organization_id = $1 AND status = 'active'`,
        [userContext.organizationId]
      );

      // Activate new plan
      const result = await this.db.query(
        `UPDATE disaster_recovery_plans
        SET status = 'approved', approved_by = $2, approved_date = CURRENT_DATE, updated_at = NOW(), updated_by = $2
        WHERE id = $1
        RETURNING *`,
        [planId, userContext.userId]
      );

      // Activate the plan
      await this.db.query(
        `UPDATE disaster_recovery_plans SET status = 'active' WHERE id = $1`,
        [planId]
      );

      logger.info('DRP approved and activated', { planId });
      return this.mapRowToDRP(result.rows[0]);
    } catch (error) {
      logger.error('Failed to approve DRP', error);
      throw error;
    }
  }

  /**
   * Get active DRP
   */
  async getActiveDRP(organizationId: string): Promise<DisasterRecoveryPlan | null> {
    try {
      const result = await this.db.query(
        `SELECT * FROM disaster_recovery_plans WHERE organization_id = $1 AND status = 'active' LIMIT 1`,
        [organizationId]
      );

      return result.rows.length > 0 ? this.mapRowToDRP(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to get active DRP', error);
      throw error;
    }
  }

  // ============================================================================
  // DR Testing Management
  // ============================================================================

  /**
   * Schedule and log a DR test
   */
  async logDRTest(
    data: {
      planId: string;
      testDate: Date;
      testType: DRTestLog['testType'];
      testScenario: string;
      testCoordinatorId?: string;
      participants: any[];
      testObjectives: any[];
      successCriteria: any[];
    },
    userContext: UserContext
  ): Promise<DRTestLog> {
    try {
      const result = await this.db.query(
        `INSERT INTO dr_test_logs (
          plan_id, test_date, test_type, test_scenario, test_coordinator_id,
          participants, test_objectives, success_criteria
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          data.planId,
          data.testDate,
          data.testType,
          data.testScenario,
          data.testCoordinatorId || userContext.userId,
          JSON.stringify(data.participants),
          JSON.stringify(data.testObjectives),
          JSON.stringify(data.successCriteria)
        ]
      );

      logger.info('DR test scheduled', { testId: result.rows[0].id, testType: data.testType });
      return this.mapRowToDRTest(result.rows[0]);
    } catch (error) {
      logger.error('Failed to log DR test', error);
      throw error;
    }
  }

  /**
   * Complete a DR test
   */
  async completeDRTest(
    testId: string,
    data: {
      startTime: Date;
      endTime: Date;
      testResults: string;
      passed: boolean;
      gapsIdentified: any[];
      strengthsIdentified?: any[];
      lessonsLearned?: string;
      correctiveActions: any[];
      planUpdatesRequired: boolean;
      nextTestRecommendedDate?: Date;
    },
    userContext: UserContext
  ): Promise<DRTestLog> {
    try {
      const durationMinutes = Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60));

      const result = await this.db.query(
        `UPDATE dr_test_logs
        SET start_time = $2, end_time = $3, duration_minutes = $4, test_results = $5,
            passed = $6, gaps_identified = $7, strengths_identified = $8, lessons_learned = $9,
            corrective_actions = $10, plan_updates_required = $11, next_test_recommended_date = $12,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          testId,
          data.startTime,
          data.endTime,
          durationMinutes,
          data.testResults,
          data.passed,
          JSON.stringify(data.gapsIdentified),
          JSON.stringify(data.strengthsIdentified || []),
          data.lessonsLearned || null,
          JSON.stringify(data.correctiveActions),
          data.planUpdatesRequired,
          data.nextTestRecommendedDate || null
        ]
      );

      // Send notifications for gaps and corrective actions
      if (data.gapsIdentified.length > 0) {
        await this.notificationsService.createNotification({
          organizationId: userContext.organizationId,
          type: NotificationType.WARNING,
          category: NotificationCategory.COMPLIANCE,
          priority: 'high',
          title: 'DR Test Gaps Identified',
          message: `${data.gapsIdentified.length} gap(s) identified in recent DR test. Review and address.`,
          data: { testId, gaps: data.gapsIdentified },
          sendAt: new Date(),
          createdBy: userContext.userId
        }, userContext);
      }

      logger.info('DR test completed', { testId, passed: data.passed });
      return this.mapRowToDRTest(result.rows[0]);
    } catch (error) {
      logger.error('Failed to complete DR test', error);
      throw error;
    }
  }

  /**
   * Get DR test history for a plan
   */
  async getDRTestHistory(planId: string): Promise<DRTestLog[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM dr_test_logs WHERE plan_id = $1 ORDER BY test_date DESC`,
        [planId]
      );

      return result.rows.map(row => this.mapRowToDRTest(row));
    } catch (error) {
      logger.error('Failed to get DR test history', error);
      throw error;
    }
  }

  // ============================================================================
  // Emergency Contacts Management
  // ============================================================================

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    data: {
      contactName: string;
      contactRole: string;
      contactType: EmergencyContact['contactType'];
      primaryPhone: string;
      secondaryPhone?: string;
      email?: string;
      address?: string;
      available247: boolean;
      availableHours?: string;
      priorityLevel: number;
      useCases?: string;
    },
    userContext: UserContext
  ): Promise<EmergencyContact> {
    try {
      const result = await this.db.query(
        `INSERT INTO emergency_contacts (
          organization_id, contact_name, contact_role, contact_type, primary_phone,
          secondary_phone, email, address, available_24_7, available_hours,
          priority_level, use_cases
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          userContext.organizationId,
          data.contactName,
          data.contactRole,
          data.contactType,
          data.primaryPhone,
          data.secondaryPhone || null,
          data.email || null,
          data.address || null,
          data.available247,
          data.availableHours || null,
          data.priorityLevel,
          data.useCases || null
        ]
      );

      logger.info('Emergency contact added', { contactId: result.rows[0].id, role: data.contactRole });
      return this.mapRowToEmergencyContact(result.rows[0]);
    } catch (error) {
      logger.error('Failed to add emergency contact', error);
      throw error;
    }
  }

  /**
   * Get all emergency contacts
   */
  async getEmergencyContacts(organizationId: string): Promise<EmergencyContact[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM emergency_contacts WHERE organization_id = $1 AND active = true ORDER BY priority_level ASC, contact_name ASC`,
        [organizationId]
      );

      return result.rows.map(row => this.mapRowToEmergencyContact(row));
    } catch (error) {
      logger.error('Failed to get emergency contacts', error);
      throw error;
    }
  }

  // ============================================================================
  // Compliance Checking
  // ============================================================================

  /**
   * Check emergency preparedness compliance
   */
  async checkCompliance(organizationId: string): Promise<{
    compliant: boolean;
    hasActiveDRP: boolean;
    annualTestCompleted: boolean;
    hasEmergencyContacts: boolean;
    nextDRPReview?: Date;
    lastDRTest?: Date;
    issues: string[];
  }> {
    try {
      const result = await this.db.query(
        `SELECT * FROM emergency_preparedness_compliance WHERE organization_id = $1`,
        [organizationId]
      );

      const compliance = result.rows[0];
      const issues: string[] = [];

      if (!compliance.has_active_drp) {
        issues.push('No active disaster recovery plan');
      }
      if (!compliance.annual_test_completed) {
        issues.push('Annual DR test not completed in last 12 months');
      }
      if (compliance.active_emergency_contacts < 3) {
        issues.push('Insufficient emergency contacts (minimum 3 recommended)');
      }

      return {
        compliant: compliance.has_active_drp && compliance.annual_test_completed && compliance.active_emergency_contacts >= 3,
        hasActiveDRP: compliance.has_active_drp,
        annualTestCompleted: compliance.annual_test_completed,
        hasEmergencyContacts: compliance.active_emergency_contacts >= 3,
        nextDRPReview: compliance.next_drp_review,
        issues
      };
    } catch (error) {
      logger.error('Failed to check compliance', error);
      throw error;
    }
  }

  /**
   * Send DRP review reminders
   */
  async sendDRPReviewReminders(organizationId: string, userContext: UserContext): Promise<number> {
    try {
      const result = await this.db.query(
        `SELECT * FROM active_drp_status WHERE organization_id = $1 AND review_status IN ('overdue', 'due_soon')`,
        [organizationId]
      );

      let remindersSent = 0;

      for (const drp of result.rows) {
        const priority = drp.review_status === 'overdue' ? 'high' : 'medium';

        // Send to administrators
        const admins = await this.db.query(
          `SELECT id FROM users WHERE organization_id = $1 AND role IN ('administrator', 'clinical_director', 'compliance_officer')`,
          [organizationId]
        );

        for (const admin of admins.rows) {
          await this.notificationsService.createNotification({
            organizationId,
            userId: admin.id,
            type: NotificationType.REMINDER,
            category: NotificationCategory.COMPLIANCE,
            priority,
            title: 'DRP Review Required',
            message: `Disaster Recovery Plan review is ${drp.review_status}. Please review and update.`,
            data: { planId: drp.id, reviewStatus: drp.review_status },
            sendAt: new Date(),
            createdBy: userContext.userId
          }, userContext);
        }

        remindersSent++;
      }

      logger.info('DRP review reminders sent', { organizationId, remindersSent });
      return remindersSent;
    } catch (error) {
      logger.error('Failed to send DRP review reminders', error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapRowToDRP(row: any): DisasterRecoveryPlan {
    return {
      id: row.id,
      organizationId: row.organization_id,
      planVersion: row.plan_version,
      planName: row.plan_name,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      nextReviewDate: row.next_review_date,
      disasterTypes: row.disaster_types || [],
      rtoHours: row.rto_hours,
      rpoHours: row.rpo_hours,
      emergencyContacts: row.emergency_contacts || [],
      onCallSchedule: row.on_call_schedule || {},
      clientNotificationProcedure: row.client_notification_procedure,
      staffNotificationProcedure: row.staff_notification_procedure,
      payerNotificationProcedure: row.payer_notification_procedure,
      familyNotificationProcedure: row.family_notification_procedure,
      serviceContinuityPlan: row.service_continuity_plan,
      criticalFunctions: row.critical_functions || [],
      backupProcedures: row.backup_procedures,
      alternativeCareArrangements: row.alternative_care_arrangements,
      itRecoveryPlan: row.it_recovery_plan,
      dataBackupFrequency: row.data_backup_frequency,
      backupLocation: row.backup_location,
      systemRestorationSteps: row.system_restoration_steps,
      emergencySuppliesList: row.emergency_supplies_list || [],
      emergencyFundAmount: row.emergency_fund_amount,
      approvedBy: row.approved_by,
      approvedDate: row.approved_date,
      distributionList: row.distribution_list || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapRowToDRTest(row: any): DRTestLog {
    return {
      id: row.id,
      planId: row.plan_id,
      testDate: row.test_date,
      testType: row.test_type,
      testScenario: row.test_scenario,
      testCoordinatorId: row.test_coordinator_id,
      participants: row.participants || [],
      testObjectives: row.test_objectives || [],
      successCriteria: row.success_criteria || [],
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: row.duration_minutes,
      testResults: row.test_results,
      passed: row.passed,
      gapsIdentified: row.gaps_identified || [],
      strengthsIdentified: row.strengths_identified || [],
      lessonsLearned: row.lessons_learned,
      correctiveActions: row.corrective_actions || [],
      planUpdatesRequired: row.plan_updates_required,
      planUpdatesCompleted: row.plan_updates_completed,
      nextTestRecommendedDate: row.next_test_recommended_date,
      followUpNotes: row.follow_up_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToEmergencyContact(row: any): EmergencyContact {
    return {
      id: row.id,
      organizationId: row.organization_id,
      contactName: row.contact_name,
      contactRole: row.contact_role,
      contactType: row.contact_type,
      primaryPhone: row.primary_phone,
      secondaryPhone: row.secondary_phone,
      email: row.email,
      address: row.address,
      available247: row.available_24_7,
      availableHours: row.available_hours,
      priorityLevel: row.priority_level,
      useCases: row.use_cases,
      active: row.active,
      lastVerifiedDate: row.last_verified_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new EmergencyPreparednessService();
