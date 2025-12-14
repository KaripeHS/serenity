/**
 * Clinical Supervision Service
 * Manages RN/LPN supervisory visits and competency assessments per OAC 173-39-02.11(C)(4)
 *
 * Compliance Requirements:
 * - Quarterly RN supervisory visits for all caregivers
 * - Initial home assessment before first client visit
 * - Competency verification and ongoing assessment
 * - Care plan review and signoff
 *
 * @module services/clinical-supervision
 */

import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { NotificationsService, NotificationType, NotificationCategory } from './notifications.service';
import { UserContext } from '../auth/access-control';
import { AuditLogger } from '../audit/logger';

const logger = createLogger('ClinicalSupervisionService');

// Types
export type VisitType = 'initial' | 'quarterly' | 'annual' | 'incident_triggered' | 'on_demand';
export type CompetencyLevel = 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
export type SupervisoryVisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface SupervisoryVisit {
  id: string;
  organizationId: string;
  caregiverId: string;
  supervisorId: string;
  visitType: VisitType;
  visitDate: Date;
  visitLocation?: string;
  clientId?: string;
  competenciesAssessed?: any[];
  carePlanReviewed: boolean;
  policyComplianceReviewed: boolean;
  documentationReviewed: boolean;
  caregiverStrengths?: string;
  areasForImprovement?: string;
  actionItems?: any[];
  trainingRecommended?: string[];
  nextVisitDueDate: Date;
  followUpRequired: boolean;
  followUpNotes?: string;
  supervisorSignature?: string;
  supervisorSignatureDate?: Date;
  caregiverSignature?: string;
  caregiverSignatureDate?: Date;
  status: SupervisoryVisitStatus;
  completionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CompetencyAssessment {
  id: string;
  supervisoryVisitId: string;
  competencyType: string;
  competencyCategory?: string;
  competencyLevel: CompetencyLevel;
  demonstrationObserved: boolean;
  demonstrationLocation?: string;
  meetsStandard: boolean;
  requiresAdditionalTraining: boolean;
  requiresRemediation: boolean;
  notes?: string;
  evidenceDocuments?: string[];
  assessedAt: Date;
  assessedBy: string;
}

export interface SupervisionSchedule {
  id: string;
  organizationId: string;
  caregiverId: string;
  supervisorId: string;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  lastVisitDate?: Date;
  nextVisitDueDate: Date;
  isOverdue: boolean;
  daysOverdue: number;
  alertDaysBefore: number;
  alertSent: boolean;
  alertSentAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetencyStandard {
  id: string;
  organizationId?: string;
  competencyCode: string;
  competencyName: string;
  competencyCategory?: string;
  description?: string;
  requiredForRoles: string[];
  initialAssessmentRequired: boolean;
  annualReassessmentRequired: boolean;
  evaluationCriteria?: any[];
  passingThreshold: number;
  referenceDocuments?: any[];
  trainingResources?: any[];
  active: boolean;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ClinicalSupervisionService {
  private db: DatabaseClient;
  private notificationsService: NotificationsService;
  private auditLogger: AuditLogger;

  constructor(db?: DatabaseClient, auditLogger?: AuditLogger) {
    this.db = db || getDbClient();
    this.auditLogger = auditLogger || new AuditLogger('clinical-supervision');
    this.notificationsService = new NotificationsService(this.db, this.auditLogger);
  }

  // ============================================================================
  // Supervisory Visit Management
  // ============================================================================

  /**
   * Schedule a supervisory visit
   */
  async scheduleVisit(
    data: {
      caregiverId: string;
      supervisorId: string;
      visitType: VisitType;
      visitDate: Date;
      visitLocation?: string;
      clientId?: string;
    },
    userContext: UserContext
  ): Promise<SupervisoryVisit> {
    try {
      // Validate supervisor is RN
      const supervisor = await this.db.query(
        `SELECT role FROM users WHERE id = $1`,
        [data.supervisorId]
      );

      if (!supervisor.rows[0] || !['rn', 'clinical_director', 'administrator'].includes(supervisor.rows[0].role)) {
        throw new Error('Supervisor must be an RN, Clinical Director, or Administrator');
      }

      // Calculate next visit due date
      const nextVisitDueDate = this.calculateNextVisitDueDate(data.visitDate, data.visitType);

      const result = await this.db.query(
        `INSERT INTO supervisory_visits (
          organization_id, caregiver_id, supervisor_id, visit_type, visit_date,
          visit_location, client_id, next_visit_due_date, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9)
        RETURNING *`,
        [
          userContext.organizationId, data.caregiverId, data.supervisorId, data.visitType,
          data.visitDate, data.visitLocation || 'office', data.clientId || null,
          nextVisitDueDate, userContext.userId
        ]
      );

      const visit = this.mapRowToSupervisoryVisit(result.rows[0]);

      // Send notifications
      await this.notificationsService.createNotification({
        organizationId: userContext.organizationId,
        userId: data.supervisorId,
        type: NotificationType.TASK,
        category: NotificationCategory.COMPLIANCE,
        priority: 'medium',
        title: 'Supervisory Visit Scheduled',
        message: `You have a supervisory visit scheduled for ${data.visitDate.toLocaleDateString()}`,
        data: { visitId: visit.id },
        sendAt: new Date(),
        createdBy: userContext.userId
      }, userContext);

      logger.info('Supervisory visit scheduled', { visitId: visit.id, caregiverId: data.caregiverId });
      return visit;
    } catch (error) {
      logger.error('Failed to schedule supervisory visit', error);
      throw error;
    }
  }

  /**
   * Complete a supervisory visit
   */
  async completeVisit(
    visitId: string,
    data: {
      carePlanReviewed: boolean;
      policyComplianceReviewed: boolean;
      documentationReviewed: boolean;
      caregiverStrengths?: string;
      areasForImprovement?: string;
      actionItems?: Array<{ description: string; deadline: Date; completed: boolean }>;
      trainingRecommended?: string[];
      supervisorSignature: string;
      caregiverSignature?: string;
      completionNotes?: string;
    },
    userContext: UserContext
  ): Promise<SupervisoryVisit> {
    try {
      const result = await this.db.query(
        `UPDATE supervisory_visits
        SET status = 'completed', care_plan_reviewed = $2, policy_compliance_reviewed = $3,
            documentation_reviewed = $4, caregiver_strengths = $5, areas_for_improvement = $6,
            action_items = $7, training_recommended = $8, supervisor_signature = $9,
            supervisor_signature_date = NOW(), caregiver_signature = $10,
            caregiver_signature_date = CASE WHEN $10 IS NOT NULL THEN NOW() ELSE NULL END,
            completion_notes = $11, updated_at = NOW(), updated_by = $12
        WHERE id = $1 RETURNING *`,
        [
          visitId, data.carePlanReviewed, data.policyComplianceReviewed, data.documentationReviewed,
          data.caregiverStrengths || null, data.areasForImprovement || null,
          JSON.stringify(data.actionItems || []), JSON.stringify(data.trainingRecommended || []),
          data.supervisorSignature, data.caregiverSignature || null, data.completionNotes || null,
          userContext.userId
        ]
      );

      const visit = this.mapRowToSupervisoryVisit(result.rows[0]);

      // Check for remediation needs
      const remediationCount = await this.checkRemediationNeeds(visitId, userContext);
      if (remediationCount > 0) {
        await this.notifyRemediationRequired(visit.caregiverId, remediationCount, visitId, userContext);
      }

      logger.info('Supervisory visit completed', { visitId });
      return visit;
    } catch (error) {
      logger.error('Failed to complete supervisory visit', error);
      throw error;
    }
  }

  /**
   * Get supervisory visits for a caregiver
   */
  async getCaregiverVisits(
    caregiverId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      visitType?: VisitType;
      status?: SupervisoryVisitStatus;
    }
  ): Promise<SupervisoryVisit[]> {
    try {
      let query = `
        SELECT sv.*, s.first_name || ' ' || s.last_name AS supervisor_name
        FROM supervisory_visits sv
        JOIN users s ON sv.supervisor_id = s.id
        WHERE sv.caregiver_id = $1
      `;
      const params: any[] = [caregiverId];
      let paramIndex = 2;

      if (filters?.startDate) {
        query += ` AND sv.visit_date >= $${paramIndex++}`;
        params.push(filters.startDate);
      }
      if (filters?.endDate) {
        query += ` AND sv.visit_date <= $${paramIndex++}`;
        params.push(filters.endDate);
      }
      if (filters?.visitType) {
        query += ` AND sv.visit_type = $${paramIndex++}`;
        params.push(filters.visitType);
      }
      if (filters?.status) {
        query += ` AND sv.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      query += ` ORDER BY sv.visit_date DESC`;

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.mapRowToSupervisoryVisit(row));
    } catch (error) {
      logger.error('Failed to get caregiver visits', error);
      throw error;
    }
  }

  // ============================================================================
  // Competency Assessment Management
  // ============================================================================

  /**
   * Add competency assessment to a visit
   */
  async addCompetencyAssessment(
    visitId: string,
    data: {
      competencyType: string;
      competencyCategory?: string;
      competencyLevel: CompetencyLevel;
      demonstrationObserved: boolean;
      demonstrationLocation?: string;
      meetsStandard: boolean;
      requiresAdditionalTraining: boolean;
      requiresRemediation: boolean;
      notes?: string;
      evidenceDocuments?: string[];
    },
    userContext: UserContext
  ): Promise<CompetencyAssessment> {
    try {
      const result = await this.db.query(
        `INSERT INTO competency_assessments (
          supervisory_visit_id, competency_type, competency_category, competency_level,
          demonstration_observed, demonstration_location, meets_standard,
          requires_additional_training, requires_remediation, notes, evidence_documents,
          assessed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          visitId, data.competencyType, data.competencyCategory || null, data.competencyLevel,
          data.demonstrationObserved, data.demonstrationLocation || null, data.meetsStandard,
          data.requiresAdditionalTraining, data.requiresRemediation, data.notes || null,
          JSON.stringify(data.evidenceDocuments || []), userContext.userId
        ]
      );

      logger.info('Competency assessment added', { visitId, competencyType: data.competencyType });
      return this.mapRowToCompetencyAssessment(result.rows[0]);
    } catch (error) {
      logger.error('Failed to add competency assessment', error);
      throw error;
    }
  }

  /**
   * Get competency history for a caregiver
   */
  async getCaregiverCompetencyHistory(caregiverId: string, userContext: UserContext): Promise<{
    caregiver: any;
    assessments: any[];
    summary: {
      totalAssessments: number;
      competenciesPassed: number;
      competenciesFailed: number;
      requiresRemediation: number;
      lastAssessmentDate: Date | null;
    };
  }> {
    try {
      const caregiverResult = await this.db.query(
        `SELECT id, first_name, last_name, role, hire_date FROM users WHERE id = $1`,
        [caregiverId]
      );

      const assessmentsResult = await this.db.query(
        `SELECT ca.*, sv.visit_date, u.first_name || ' ' || u.last_name AS assessor_name
        FROM competency_assessments ca
        JOIN supervisory_visits sv ON ca.supervisory_visit_id = sv.id
        JOIN users u ON ca.assessed_by = u.id
        WHERE sv.caregiver_id = $1
        ORDER BY sv.visit_date DESC`,
        [caregiverId]
      );

      const assessments = assessmentsResult.rows;
      const summary = {
        totalAssessments: assessments.length,
        competenciesPassed: assessments.filter(a => a.meets_standard === true).length,
        competenciesFailed: assessments.filter(a => a.meets_standard === false).length,
        requiresRemediation: assessments.filter(a => a.requires_remediation === true).length,
        lastAssessmentDate: assessments.length > 0 ? assessments[0].visit_date : null
      };

      return { caregiver: caregiverResult.rows[0], assessments, summary };
    } catch (error) {
      logger.error('Failed to get caregiver competency history', error);
      throw error;
    }
  }

  // ============================================================================
  // Supervision Schedule Management
  // ============================================================================

  /**
   * Get overdue supervisory visits
   */
  async getOverdueVisits(organizationId: string): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM overdue_supervision_visits WHERE organization_id = $1 ORDER BY days_overdue DESC`,
        [organizationId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get overdue visits', error);
      throw error;
    }
  }

  /**
   * Get upcoming supervisory visits
   */
  async getUpcomingVisits(organizationId: string, days: number = 30): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT ss.*, u.first_name || ' ' || u.last_name AS caregiver_name,
                sup.first_name || ' ' || sup.last_name AS supervisor_name
        FROM supervision_schedules ss
        JOIN users u ON ss.caregiver_id = u.id
        LEFT JOIN users sup ON ss.supervisor_id = sup.id
        WHERE ss.organization_id = $1 AND ss.active = true
          AND ss.next_visit_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2::interval
        ORDER BY ss.next_visit_due_date ASC`,
        [organizationId, `${days} days`]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get upcoming visits', error);
      throw error;
    }
  }

  /**
   * Send alerts for upcoming and overdue visits
   */
  async sendSupervisionAlerts(organizationId: string, userContext: UserContext): Promise<{
    overdueAlertsSent: number;
    upcomingAlertsSent: number;
  }> {
    try {
      let overdueAlertsSent = 0;
      let upcomingAlertsSent = 0;

      // Overdue visits
      const overdueVisits = await this.getOverdueVisits(organizationId);
      for (const visit of overdueVisits) {
        await this.notificationsService.createNotification({
          organizationId,
          userId: visit.supervisorId,
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority: 'high',
          title: 'Supervisory Visit Overdue',
          message: `Supervisory visit for ${visit.caregiverName} is ${visit.daysOverdue} days overdue.`,
          data: { caregiverId: visit.caregiverId },
          sendAt: new Date(),
          createdBy: userContext.userId
        }, userContext);
        overdueAlertsSent++;
      }

      // Upcoming visits (14 days before)
      const upcomingVisits = await this.db.query(
        `SELECT ss.*, u.first_name || ' ' || u.last_name AS caregiver_name
        FROM supervision_schedules ss
        JOIN users u ON ss.caregiver_id = u.id
        WHERE ss.organization_id = $1 AND ss.active = true
          AND ss.next_visit_due_date = CURRENT_DATE + INTERVAL '14 days'
          AND ss.alert_sent = false`,
        [organizationId]
      );

      for (const schedule of upcomingVisits.rows) {
        await this.notificationsService.createNotification({
          organizationId,
          userId: schedule.supervisor_id,
          type: NotificationType.REMINDER,
          category: NotificationCategory.COMPLIANCE,
          priority: 'medium',
          title: 'Supervisory Visit Due Soon',
          message: `Supervisory visit for ${schedule.caregiver_name} is due in 14 days.`,
          data: { caregiverId: schedule.caregiver_id },
          sendAt: new Date(),
          createdBy: userContext.userId
        }, userContext);

        await this.db.query(
          `UPDATE supervision_schedules SET alert_sent = true, alert_sent_at = NOW() WHERE id = $1`,
          [schedule.id]
        );
        upcomingAlertsSent++;
      }

      logger.info('Supervision alerts sent', { organizationId, overdueAlertsSent, upcomingAlertsSent });
      return { overdueAlertsSent, upcomingAlertsSent };
    } catch (error) {
      logger.error('Failed to send supervision alerts', error);
      throw error;
    }
  }

  // ============================================================================
  // Competency Standards Management
  // ============================================================================

  /**
   * Get all competency standards
   */
  async getCompetencyStandards(organizationId?: string): Promise<CompetencyStandard[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM competency_standards
        WHERE (organization_id IS NULL OR organization_id = $1) AND active = true
        ORDER BY competency_category, competency_code`,
        [organizationId || null]
      );
      return result.rows.map(row => this.mapRowToCompetencyStandard(row));
    } catch (error) {
      logger.error('Failed to get competency standards', error);
      throw error;
    }
  }

  /**
   * Get required competencies for a role
   */
  async getRequiredCompetenciesForRole(role: string, organizationId?: string): Promise<CompetencyStandard[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM competency_standards
        WHERE (organization_id IS NULL OR organization_id = $1) AND active = true
          AND required_for_roles @> $2
        ORDER BY competency_category, competency_code`,
        [organizationId || null, JSON.stringify([role])]
      );
      return result.rows.map(row => this.mapRowToCompetencyStandard(row));
    } catch (error) {
      logger.error('Failed to get required competencies for role', error);
      throw error;
    }
  }

  /**
   * Check caregiver competency compliance
   */
  async checkCaregiverCompetencyCompliance(caregiverId: string): Promise<{
    compliant: boolean;
    totalRequired: number;
    totalMet: number;
    missingCompetencies: string[];
    remediationRequired: string[];
  }> {
    try {
      const caregiverResult = await this.db.query(
        `SELECT role, organization_id FROM users WHERE id = $1`,
        [caregiverId]
      );
      const caregiver = caregiverResult.rows[0];

      const requiredCompetencies = await this.getRequiredCompetenciesForRole(
        caregiver.role,
        caregiver.organization_id
      );

      const assessmentsResult = await this.db.query(
        `SELECT DISTINCT ON (ca.competency_type) ca.competency_type, ca.meets_standard, ca.requires_remediation
        FROM competency_assessments ca
        JOIN supervisory_visits sv ON ca.supervisory_visit_id = sv.id
        WHERE sv.caregiver_id = $1 AND sv.status = 'completed'
        ORDER BY ca.competency_type, sv.visit_date DESC`,
        [caregiverId]
      );

      const assessments = assessmentsResult.rows;
      const assessedCompetencies = new Set(assessments.map(a => a.competency_type));
      const metCompetencies = new Set(assessments.filter(a => a.meets_standard === true).map(a => a.competency_type));
      const remediationRequired = assessments.filter(a => a.requires_remediation === true).map(a => a.competency_type);
      const missingCompetencies = requiredCompetencies
        .filter(c => !assessedCompetencies.has(c.competencyCode))
        .map(c => c.competencyCode);

      const compliant = missingCompetencies.length === 0 && remediationRequired.length === 0;

      return {
        compliant,
        totalRequired: requiredCompetencies.length,
        totalMet: metCompetencies.size,
        missingCompetencies,
        remediationRequired
      };
    } catch (error) {
      logger.error('Failed to check caregiver competency compliance', error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateNextVisitDueDate(visitDate: Date, visitType: VisitType): Date {
    const nextDate = new Date(visitDate);
    switch (visitType) {
      case 'initial':
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 3);
    }
    return nextDate;
  }

  private async checkRemediationNeeds(visitId: string, userContext: UserContext): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM competency_assessments
      WHERE supervisory_visit_id = $1 AND requires_remediation = true`,
      [visitId]
    );
    return parseInt(result.rows[0].count);
  }

  private async notifyRemediationRequired(
    caregiverId: string,
    count: number,
    visitId: string,
    userContext: UserContext
  ): Promise<void> {
    await this.notificationsService.createNotification({
      organizationId: userContext.organizationId,
      userId: caregiverId,
      type: NotificationType.ALERT,
      category: NotificationCategory.COMPLIANCE,
      priority: 'high',
      title: 'Competency Remediation Required',
      message: `Your recent supervisory visit identified ${count} competency area(s) requiring additional training.`,
      data: { visitId },
      sendAt: new Date(),
      createdBy: userContext.userId
    }, userContext);
  }

  private mapRowToSupervisoryVisit(row: any): SupervisoryVisit {
    return {
      id: row.id,
      organizationId: row.organization_id,
      caregiverId: row.caregiver_id,
      supervisorId: row.supervisor_id,
      visitType: row.visit_type,
      visitDate: row.visit_date,
      visitLocation: row.visit_location,
      clientId: row.client_id,
      competenciesAssessed: row.competencies_assessed || [],
      carePlanReviewed: row.care_plan_reviewed,
      policyComplianceReviewed: row.policy_compliance_reviewed,
      documentationReviewed: row.documentation_reviewed,
      caregiverStrengths: row.caregiver_strengths,
      areasForImprovement: row.areas_for_improvement,
      actionItems: row.action_items || [],
      trainingRecommended: row.training_recommended || [],
      nextVisitDueDate: row.next_visit_due_date,
      followUpRequired: row.follow_up_required,
      followUpNotes: row.follow_up_notes,
      supervisorSignature: row.supervisor_signature,
      supervisorSignatureDate: row.supervisor_signature_date,
      caregiverSignature: row.caregiver_signature,
      caregiverSignatureDate: row.caregiver_signature_date,
      status: row.status,
      completionNotes: row.completion_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapRowToCompetencyAssessment(row: any): CompetencyAssessment {
    return {
      id: row.id,
      supervisoryVisitId: row.supervisory_visit_id,
      competencyType: row.competency_type,
      competencyCategory: row.competency_category,
      competencyLevel: row.competency_level,
      demonstrationObserved: row.demonstration_observed,
      demonstrationLocation: row.demonstration_location,
      meetsStandard: row.meets_standard,
      requiresAdditionalTraining: row.requires_additional_training,
      requiresRemediation: row.requires_remediation,
      notes: row.notes,
      evidenceDocuments: row.evidence_documents || [],
      assessedAt: row.assessed_at,
      assessedBy: row.assessed_by
    };
  }

  private mapRowToCompetencyStandard(row: any): CompetencyStandard {
    return {
      id: row.id,
      organizationId: row.organization_id,
      competencyCode: row.competency_code,
      competencyName: row.competency_name,
      competencyCategory: row.competency_category,
      description: row.description,
      requiredForRoles: row.required_for_roles || [],
      initialAssessmentRequired: row.initial_assessment_required,
      annualReassessmentRequired: row.annual_reassessment_required,
      evaluationCriteria: row.evaluation_criteria || [],
      passingThreshold: row.passing_threshold,
      referenceDocuments: row.reference_documents || [],
      trainingResources: row.training_resources || [],
      active: row.active,
      effectiveDate: row.effective_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new ClinicalSupervisionService();
