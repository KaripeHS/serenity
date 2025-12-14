/**
 * Breach Notification Service
 * Manages HIPAA breach notifications with automated 60-day deadlines
 *
 * Compliance Requirements (HIPAA Breach Notification Rule 45 CFR §§ 164.400-414):
 * - Individual notification within 60 days of discovery
 * - HHS notification within 60 days (>=500 individuals) or annually (<500)
 * - Media notification within 60 days (>=500 individuals in same state)
 * - Business associate notification within 60 days
 * - Four-factor risk assessment
 *
 * @module services/breach-notification
 */

import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { NotificationsService, NotificationType, NotificationCategory } from './notifications.service';
import { UserContext } from '../auth/access-control';
import { AuditLogger } from '../audit/logger';

const logger = createLogger('BreachNotificationService');

export interface BreachIncident {
  id: string;
  organizationId: string;
  breachNumber: string;
  breachType: string;
  breachCategory?: 'electronic' | 'paper' | 'verbal' | 'other';

  discoveryDate: Date;
  estimatedBreachDate?: Date;
  breachEndDate?: Date;

  // Deadlines (auto-calculated)
  individualNotificationDeadline?: Date;
  hhsNotificationDeadline?: Date;
  mediaNotificationDeadline?: Date;
  businessAssociateNotificationDeadline?: Date;

  // PHI Information
  phiInvolved: boolean;
  phiTypes: any[];
  phiElements: any[];
  safeguardsInPlace: boolean;
  safeguardsDescription?: string;

  // Risk Assessment
  riskLevel: 'low' | 'moderate' | 'high';
  riskAssessmentDate?: Date;
  riskAssessmentConductedBy?: string;
  riskAssessmentNotes?: string;

  // Four-Factor Risk Analysis
  factor1NatureExtent?: string;
  factor2UnauthorizedPerson?: string;
  factor3PhiAcquired?: boolean;
  factor4Mitigation?: string;

  probabilityOfHarm?: 'low' | 'moderate' | 'high';
  potentialHarmType: any[];

  // Affected Individuals
  individualsAffected: number;
  individualsNotified: number;
  residentsOfState?: string;

  // Location & Scope
  locationOfBreach?: string;
  departmentsAffected: any[];
  systemsAffected: any[];

  // Description
  description: string;
  causeOfBreach?: string;
  howDiscovered?: string;

  // Immediate Actions
  immediateActionsTaken?: string;
  breachContained: boolean;
  containmentDate?: Date;

  // Notifications
  individualsNotifiedStatus: 'not_started' | 'in_progress' | 'completed' | 'not_required';
  individualsNotificationDate?: Date;
  individualsNotificationMethod?: string;

  hhsNotified: boolean;
  hhsNotificationDate?: Date;
  hhsConfirmationNumber?: string;

  mediaNotified: boolean;
  mediaNotificationDate?: Date;
  mediaOutletsContacted: any[];

  businessAssociatesNotified: boolean;
  businessAssociatesNotificationDate?: Date;

  // Investigation
  investigationStatus: 'pending' | 'in_progress' | 'completed' | 'not_required';
  investigationLeadId?: string;
  investigationStartedDate?: Date;
  investigationCompletedDate?: Date;
  rootCause?: string;
  investigationFindings?: string;

  // Corrective Actions
  correctiveActions: any[];
  policyUpdatesRequired: boolean;
  trainingRequired: boolean;

  // Reporting
  reportableToHhs: boolean;
  reportableToState: boolean;
  stateNotificationRequired: boolean;
  stateNotificationDate?: Date;

  // Documentation
  documentationComplete: boolean;
  documentationUrls: any[];

  status: 'discovered' | 'under_investigation' | 'notifications_in_progress' | 'resolved' | 'closed';

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class BreachNotificationService {
  private db: DatabaseClient;
  private notificationsService: NotificationsService;
  private auditLogger: AuditLogger;

  constructor(
    db?: DatabaseClient,
    notificationsService?: NotificationsService,
    auditLogger?: AuditLogger
  ) {
    this.db = db || getDbClient();
    this.notificationsService = notificationsService || new NotificationsService(this.db);
    this.auditLogger = auditLogger || new AuditLogger(this.db);
  }

  // ============================================================================
  // Breach Incident Management
  // ============================================================================

  /**
   * Report a new breach incident
   */
  async reportBreach(
    data: Partial<BreachIncident>,
    userContext: UserContext
  ): Promise<BreachIncident> {
    const result = await this.db.query(
      `INSERT INTO breach_incidents (
        organization_id, breach_type, breach_category,
        discovery_date, estimated_breach_date, breach_end_date,
        phi_involved, phi_types, phi_elements, safeguards_in_place, safeguards_description,
        risk_level, risk_assessment_date, risk_assessment_conducted_by, risk_assessment_notes,
        factor_1_nature_extent, factor_2_unauthorized_person, factor_3_phi_acquired, factor_4_mitigation,
        probability_of_harm, potential_harm_type,
        individuals_affected, residents_of_state,
        location_of_breach, departments_affected, systems_affected,
        description, cause_of_breach, how_discovered,
        immediate_actions_taken, breach_contained, containment_date,
        reportable_to_hhs, reportable_to_state,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21,
        $22, $23,
        $24, $25, $26,
        $27, $28, $29,
        $30, $31, $32,
        $33, $34,
        $35, $36
      ) RETURNING *`,
      [
        userContext.organizationId, data.breachType, data.breachCategory,
        data.discoveryDate, data.estimatedBreachDate, data.breachEndDate,
        data.phiInvolved !== false, JSON.stringify(data.phiTypes || []), JSON.stringify(data.phiElements || []), data.safeguardsInPlace || false, data.safeguardsDescription,
        data.riskLevel, data.riskAssessmentDate, data.riskAssessmentConductedBy || userContext.userId, data.riskAssessmentNotes,
        data.factor1NatureExtent, data.factor2UnauthorizedPerson, data.factor3PhiAcquired, data.factor4Mitigation,
        data.probabilityOfHarm, JSON.stringify(data.potentialHarmType || []),
        data.individualsAffected || 0, data.residentsOfState,
        data.locationOfBreach, JSON.stringify(data.departmentsAffected || []), JSON.stringify(data.systemsAffected || []),
        data.description, data.causeOfBreach, data.howDiscovered,
        data.immediateActionsTaken, data.breachContained || false, data.containmentDate,
        data.individualsAffected && data.individualsAffected >= 500, data.reportableToState || false,
        data.status || 'discovered', userContext.userId
      ]
    );

    const breach = this.mapRowToBreach(result.rows[0]);

    // Send critical alerts for high-risk breaches
    if (breach.riskLevel === 'high' || breach.individualsAffected >= 500) {
      await this.sendBreachAlerts(breach, userContext);
    }

    await this.auditLogger.log({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BREACH_REPORTED',
      resourceType: 'breach_incident',
      resourceId: breach.id,
      details: {
        breachNumber: breach.breachNumber,
        breachType: data.breachType,
        individualsAffected: data.individualsAffected,
        riskLevel: data.riskLevel
      }
    });

    logger.info('Breach incident reported', {
      breachId: breach.id,
      breachNumber: breach.breachNumber,
      individualsAffected: breach.individualsAffected,
      riskLevel: breach.riskLevel
    });

    return breach;
  }

  /**
   * Update breach incident
   */
  async updateBreach(
    breachId: string,
    data: Partial<BreachIncident>,
    userContext: UserContext
  ): Promise<BreachIncident> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateFields = [
      'breach_type', 'breach_category', 'description', 'cause_of_breach', 'how_discovered',
      'immediate_actions_taken', 'breach_contained', 'containment_date',
      'individuals_affected', 'investigation_status', 'investigation_findings', 'root_cause',
      'status'
    ];

    for (const field of updateFields) {
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (data[camelField as keyof BreachIncident] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(data[camelField as keyof BreachIncident]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_by = $${paramIndex}`);
    values.push(userContext.userId);
    paramIndex++;

    updates.push(`updated_at = NOW()`);

    values.push(breachId);
    values.push(userContext.organizationId);

    const query = `
      UPDATE breach_incidents
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Breach incident not found');
    }

    const breach = this.mapRowToBreach(result.rows[0]);

    await this.auditLogger.log({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BREACH_UPDATED',
      resourceType: 'breach_incident',
      resourceId: breach.id,
      details: { updatedFields: Object.keys(data) }
    });

    logger.info('Breach incident updated', { breachId: breach.id });

    return breach;
  }

  /**
   * Notify individuals of breach
   */
  async notifyIndividuals(
    breachId: string,
    notificationMethod: string,
    userContext: UserContext
  ): Promise<BreachIncident> {
    const result = await this.db.query(
      `UPDATE breach_incidents
       SET individuals_notified_status = 'completed',
           individuals_notification_date = NOW(),
           individuals_notification_method = $1,
           updated_by = $2,
           updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [notificationMethod, userContext.userId, breachId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Breach incident not found');
    }

    const breach = this.mapRowToBreach(result.rows[0]);

    await this.auditLogger.log({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BREACH_INDIVIDUALS_NOTIFIED',
      resourceType: 'breach_incident',
      resourceId: breach.id,
      details: { notificationMethod }
    });

    logger.info('Breach individual notifications sent', {
      breachId: breach.id,
      individualsAffected: breach.individualsAffected,
      method: notificationMethod
    });

    return breach;
  }

  /**
   * Report breach to HHS
   */
  async reportToHHS(
    breachId: string,
    confirmationNumber: string,
    userContext: UserContext
  ): Promise<BreachIncident> {
    const result = await this.db.query(
      `UPDATE breach_incidents
       SET hhs_notified = true,
           hhs_notification_date = NOW(),
           hhs_confirmation_number = $1,
           updated_by = $2,
           updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [confirmationNumber, userContext.userId, breachId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Breach incident not found');
    }

    const breach = this.mapRowToBreach(result.rows[0]);

    await this.auditLogger.log({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BREACH_REPORTED_TO_HHS',
      resourceType: 'breach_incident',
      resourceId: breach.id,
      details: { confirmationNumber }
    });

    logger.info('Breach reported to HHS', {
      breachId: breach.id,
      confirmationNumber
    });

    return breach;
  }

  /**
   * Notify media of breach (for 500+ individuals)
   */
  async notifyMedia(
    breachId: string,
    mediaOutlets: any[],
    userContext: UserContext
  ): Promise<BreachIncident> {
    const result = await this.db.query(
      `UPDATE breach_incidents
       SET media_notified = true,
           media_notification_date = NOW(),
           media_outlets_contacted = $1,
           updated_by = $2,
           updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [JSON.stringify(mediaOutlets), userContext.userId, breachId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Breach incident not found');
    }

    const breach = this.mapRowToBreach(result.rows[0]);

    await this.auditLogger.log({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BREACH_MEDIA_NOTIFIED',
      resourceType: 'breach_incident',
      resourceId: breach.id,
      details: { mediaOutlets: mediaOutlets.length }
    });

    logger.info('Media notified of breach', {
      breachId: breach.id,
      outletsContacted: mediaOutlets.length
    });

    return breach;
  }

  // ============================================================================
  // Alerts & Monitoring
  // ============================================================================

  /**
   * Get overdue breach notifications
   */
  async getOverdueNotifications(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM overdue_breach_notifications WHERE organization_id = $1 ORDER BY deadline_missed`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get upcoming breach deadlines (within 14 days)
   */
  async getUpcomingDeadlines(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM upcoming_breach_deadlines WHERE organization_id = $1 ORDER BY deadline`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Send automated breach notification deadline alerts
   */
  async sendDeadlineAlerts(organizationId: string, userContext: UserContext): Promise<{
    overdueAlertsSent: number;
    upcomingAlertsSent: number;
  }> {
    // Send overdue alerts
    const overdueNotifications = await this.getOverdueNotifications(organizationId);

    for (const notification of overdueNotifications) {
      await this.notificationsService.createNotification(
        {
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority: 'critical',
          title: 'HIPAA Breach Notification OVERDUE',
          message: `${notification.overdue_notification_type} for breach ${notification.breach_number} is overdue by ${Math.floor(notification.time_overdue / (1000 * 60 * 60 * 24))} days. IMMEDIATE ACTION REQUIRED.`,
          metadata: {
            breachId: notification.id,
            breachNumber: notification.breach_number,
            notificationType: notification.overdue_notification_type,
            deadlineMissed: notification.deadline_missed,
            timeOverdue: notification.time_overdue
          },
          actionUrl: `/compliance/breaches/${notification.id}`,
          actionText: 'Take Action Now'
        },
        userContext
      );
    }

    // Send upcoming deadline alerts
    const upcomingDeadlines = await this.getUpcomingDeadlines(organizationId);

    for (const deadline of upcomingDeadlines) {
      const daysRemaining = Math.floor(
        (new Date(deadline.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const priority = daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'high' : 'medium';

      await this.notificationsService.createNotification(
        {
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority,
          title: `HIPAA Breach Notification Due: ${daysRemaining} days`,
          message: `${deadline.deadline_type} for breach ${deadline.breach_number} is due in ${daysRemaining} days.`,
          metadata: {
            breachId: deadline.id,
            breachNumber: deadline.breach_number,
            deadlineType: deadline.deadline_type,
            deadline: deadline.deadline,
            daysRemaining
          },
          actionUrl: `/compliance/breaches/${deadline.id}`,
          actionText: 'Complete Notification'
        },
        userContext
      );
    }

    logger.info('Breach notification deadline alerts sent', {
      overdueCount: overdueNotifications.length,
      upcomingCount: upcomingDeadlines.length,
      organizationId
    });

    return {
      overdueAlertsSent: overdueNotifications.length,
      upcomingAlertsSent: upcomingDeadlines.length
    };
  }

  /**
   * Send critical breach alerts to privacy officer and administrators
   */
  private async sendBreachAlerts(breach: BreachIncident, userContext: UserContext): Promise<void> {
    const priority = breach.individualsAffected >= 500 ? 'critical' : 'high';

    await this.notificationsService.createNotification(
      {
        type: NotificationType.ALERT,
        category: NotificationCategory.SECURITY,
        priority,
        title: `${breach.riskLevel === 'high' ? 'HIGH RISK ' : ''}HIPAA Breach Reported`,
        message: `Breach ${breach.breachNumber}: ${breach.description}. ${breach.individualsAffected} individuals affected. Risk level: ${breach.riskLevel}. ${breach.individualsAffected >= 500 ? 'IMMEDIATE HHS & MEDIA NOTIFICATION REQUIRED.' : ''}`,
        metadata: {
          breachId: breach.id,
          breachNumber: breach.breachNumber,
          individualsAffected: breach.individualsAffected,
          riskLevel: breach.riskLevel,
          reportableToHhs: breach.reportableToHhs
        },
        actionUrl: `/compliance/breaches/${breach.id}`,
        actionText: 'Review Breach'
      },
      userContext
    );
  }

  /**
   * Check breach notification compliance
   */
  async checkCompliance(organizationId: string): Promise<{
    compliant: boolean;
    issues: string[];
    totalBreaches: number;
    breaches500Plus: number;
    hhsNotificationsOverdue: number;
    individualNotificationsOverdue: number;
  }> {
    const result = await this.db.query(
      `SELECT * FROM breach_compliance_summary WHERE organization_id = $1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      return {
        compliant: true,
        issues: [],
        totalBreaches: 0,
        breaches500Plus: 0,
        hhsNotificationsOverdue: 0,
        individualNotificationsOverdue: 0
      };
    }

    const summary = result.rows[0];
    const issues: string[] = [];

    if (parseInt(summary.hhs_notifications_overdue) > 0) {
      issues.push(`${summary.hhs_notifications_overdue} HHS notification(s) overdue`);
    }

    if (parseInt(summary.individual_notifications_overdue) > 0) {
      issues.push(`${summary.individual_notifications_overdue} individual notification(s) overdue`);
    }

    return {
      compliant: issues.length === 0,
      issues,
      totalBreaches: parseInt(summary.total_breaches),
      breaches500Plus: parseInt(summary.breaches_500_plus),
      hhsNotificationsOverdue: parseInt(summary.hhs_notifications_overdue),
      individualNotificationsOverdue: parseInt(summary.individual_notifications_overdue)
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapRowToBreach(row: any): BreachIncident {
    return {
      id: row.id,
      organizationId: row.organization_id,
      breachNumber: row.breach_number,
      breachType: row.breach_type,
      breachCategory: row.breach_category,
      discoveryDate: row.discovery_date,
      estimatedBreachDate: row.estimated_breach_date,
      breachEndDate: row.breach_end_date,
      individualNotificationDeadline: row.individual_notification_deadline,
      hhsNotificationDeadline: row.hhs_notification_deadline,
      mediaNotificationDeadline: row.media_notification_deadline,
      businessAssociateNotificationDeadline: row.business_associate_notification_deadline,
      phiInvolved: row.phi_involved,
      phiTypes: row.phi_types || [],
      phiElements: row.phi_elements || [],
      safeguardsInPlace: row.safeguards_in_place,
      safeguardsDescription: row.safeguards_description,
      riskLevel: row.risk_level,
      riskAssessmentDate: row.risk_assessment_date,
      riskAssessmentConductedBy: row.risk_assessment_conducted_by,
      riskAssessmentNotes: row.risk_assessment_notes,
      factor1NatureExtent: row.factor_1_nature_extent,
      factor2UnauthorizedPerson: row.factor_2_unauthorized_person,
      factor3PhiAcquired: row.factor_3_phi_acquired,
      factor4Mitigation: row.factor_4_mitigation,
      probabilityOfHarm: row.probability_of_harm,
      potentialHarmType: row.potential_harm_type || [],
      individualsAffected: row.individuals_affected,
      individualsNotified: row.individuals_notified,
      residentsOfState: row.residents_of_state,
      locationOfBreach: row.location_of_breach,
      departmentsAffected: row.departments_affected || [],
      systemsAffected: row.systems_affected || [],
      description: row.description,
      causeOfBreach: row.cause_of_breach,
      howDiscovered: row.how_discovered,
      immediateActionsTaken: row.immediate_actions_taken,
      breachContained: row.breach_contained,
      containmentDate: row.containment_date,
      individualsNotifiedStatus: row.individuals_notified_status,
      individualsNotificationDate: row.individuals_notification_date,
      individualsNotificationMethod: row.individuals_notification_method,
      hhsNotified: row.hhs_notified,
      hhsNotificationDate: row.hhs_notification_date,
      hhsConfirmationNumber: row.hhs_confirmation_number,
      mediaNotified: row.media_notified,
      mediaNotificationDate: row.media_notification_date,
      mediaOutletsContacted: row.media_outlets_contacted || [],
      businessAssociatesNotified: row.business_associates_notified,
      businessAssociatesNotificationDate: row.business_associates_notification_date,
      investigationStatus: row.investigation_status,
      investigationLeadId: row.investigation_lead_id,
      investigationStartedDate: row.investigation_started_date,
      investigationCompletedDate: row.investigation_completed_date,
      rootCause: row.root_cause,
      investigationFindings: row.investigation_findings,
      correctiveActions: row.corrective_actions || [],
      policyUpdatesRequired: row.policy_updates_required,
      trainingRequired: row.training_required,
      reportableToHhs: row.reportable_to_hhs,
      reportableToState: row.reportable_to_state,
      stateNotificationRequired: row.state_notification_required,
      stateNotificationDate: row.state_notification_date,
      documentationComplete: row.documentation_complete,
      documentationUrls: row.documentation_urls || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

export default new BreachNotificationService();
