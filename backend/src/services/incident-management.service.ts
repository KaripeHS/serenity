/**
 * Incident Management Service
 * Handles critical incident tracking and 24-hour ODA reporting per OAC 173-39-02.10
 *
 * Compliance Requirements:
 * - Critical incidents must be reported to ODA within 24 hours
 * - Reportable incidents within 5 business days
 * - Root cause analysis within 5 days (critical) or 10 days (reportable)
 * - Corrective action plan implementation tracking
 *
 * @module services/incident-management
 */

import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { NotificationsService, NotificationType, NotificationCategory } from './notifications.service';
import { UserContext } from '../auth/access-control';
import { AuditLogger } from '../audit/logger';

const logger = createLogger('IncidentManagementService');

// Types
export type IncidentType =
  | 'death'
  | 'serious_injury'
  | 'abuse_suspicion'
  | 'neglect_suspicion'
  | 'exploitation_suspicion'
  | 'medication_error'
  | 'fall_with_injury'
  | 'emergency_room_visit'
  | 'hospitalization'
  | 'missing_person'
  | 'fire'
  | 'natural_disaster'
  | 'criminal_activity'
  | 'law_enforcement_contact'
  | 'rights_violation'
  | 'property_damage'
  | 'unusual_occurrence'
  | 'other';

export type IncidentSeverity = 'critical' | 'reportable' | 'unusual_occurrence';
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';
export type InvestigationStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface Incident {
  id: string;
  organizationId: string;
  incidentNumber: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  incidentDate: Date;
  discoveryDate: Date;
  reportingDeadline: Date;
  clientId?: string;
  caregiverId?: string;
  witnessIds?: string[];
  location: string;
  description: string;
  immediateActionsTaken?: string;
  injuriesSustained?: string;
  medicalTreatmentRequired: boolean;
  medicalFacility?: string;
  status: IncidentStatus;
  reportedToOda: boolean;
  odaNotificationDate?: Date;
  odaCaseNumber?: string;
  odaFollowUpRequired: boolean;
  reportedToAps: boolean;
  apsNotificationDate?: Date;
  apsCaseNumber?: string;
  reportedToLawEnforcement: boolean;
  lawEnforcementAgency?: string;
  lawEnforcementCaseNumber?: string;
  lawEnforcementNotificationDate?: Date;
  reportedToFamily: boolean;
  familyNotificationDate?: Date;
  familyNotifiedBy?: string;
  photosTaken: boolean;
  photoUrls?: string[];
  witnessStatements?: any[];
  supportingDocuments?: any[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Investigation {
  id: string;
  incidentId: string;
  investigationDeadline: Date;
  investigatorId: string;
  startedAt: Date;
  completedAt?: Date;
  rootCauseAnalysis?: string;
  contributingFactors?: any[];
  timelineOfEvents?: string;
  interviews?: any[];
  correctiveActions?: any[];
  preventiveMeasures?: any[];
  trainingRequired?: any[];
  policyUpdatesRequired: boolean;
  policyUpdates?: any[];
  status: InvestigationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class IncidentManagementService {
  private db: DatabaseClient;
  private notificationsService: NotificationsService;
  private auditLogger: AuditLogger;

  constructor(db?: DatabaseClient, auditLogger?: AuditLogger) {
    this.db = db || getDbClient();
    this.auditLogger = auditLogger || new AuditLogger('incident-management');
    this.notificationsService = new NotificationsService(this.db, this.auditLogger);
  }

  // ============================================================================
  // Incident Management
  // ============================================================================

  /**
   * Report a new incident
   */
  async reportIncident(
    data: {
      incidentType: IncidentType;
      severity: IncidentSeverity;
      incidentDate: Date;
      discoveryDate: Date;
      clientId?: string;
      caregiverId?: string;
      witnessIds?: string[];
      location: string;
      description: string;
      immediateActionsTaken?: string;
      injuriesSustained?: string;
      medicalTreatmentRequired: boolean;
      medicalFacility?: string;
    },
    userContext: UserContext
  ): Promise<Incident> {
    try {
      const result = await this.db.query(
        `INSERT INTO incidents (
          organization_id, incident_type, severity, incident_date, discovery_date,
          client_id, caregiver_id, witness_ids, location, description,
          immediate_actions_taken, injuries_sustained, medical_treatment_required,
          medical_facility, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          userContext.organizationId,
          data.incidentType,
          data.severity,
          data.incidentDate,
          data.discoveryDate,
          data.clientId || null,
          data.caregiverId || null,
          JSON.stringify(data.witnessIds || []),
          data.location,
          data.description,
          data.immediateActionsTaken || null,
          data.injuriesSustained || null,
          data.medicalTreatmentRequired,
          data.medicalFacility || null,
          userContext.userId
        ]
      );

      const incident = this.mapRowToIncident(result.rows[0]);

      // Send alerts for critical incidents
      if (incident.severity === 'critical') {
        await this.sendCriticalIncidentAlerts(incident, userContext);
      }

      // Schedule deadline alerts
      await this.scheduleDeadlineAlerts(incident, userContext);

      logger.info('Incident reported', { incidentId: incident.id, incidentNumber: incident.incidentNumber });
      return incident;
    } catch (error) {
      logger.error('Failed to report incident', error);
      throw error;
    }
  }

  /**
   * Update incident details
   */
  async updateIncident(
    incidentId: string,
    data: Partial<Incident>,
    userContext: UserContext
  ): Promise<Incident> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.immediateActionsTaken !== undefined) {
        updates.push(`immediate_actions_taken = $${paramIndex++}`);
        values.push(data.immediateActionsTaken);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }

      updates.push(`updated_by = $${paramIndex++}`);
      values.push(userContext.userId);
      updates.push(`updated_at = NOW()`);

      values.push(incidentId);

      const result = await this.db.query(
        `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      return this.mapRowToIncident(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update incident', error);
      throw error;
    }
  }

  /**
   * Report incident to ODA
   */
  async reportToODA(
    incidentId: string,
    odaCaseNumber: string,
    userContext: UserContext
  ): Promise<Incident> {
    try {
      const result = await this.db.query(
        `UPDATE incidents
        SET reported_to_oda = true, oda_notification_date = NOW(),
            oda_case_number = $2, updated_by = $3, updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [incidentId, odaCaseNumber, userContext.userId]
      );

      const incident = this.mapRowToIncident(result.rows[0]);

      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'incident_reported_to_oda',
        resource: 'incident',
        details: { incidentId, odaCaseNumber, incidentNumber: incident.incidentNumber }
      });

      logger.info('Incident reported to ODA', { incidentId, odaCaseNumber });
      return incident;
    } catch (error) {
      logger.error('Failed to report incident to ODA', error);
      throw error;
    }
  }

  /**
   * Get overdue incident reports
   */
  async getOverdueIncidents(organizationId: string): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM overdue_incident_reports WHERE organization_id = $1 ORDER BY hours_overdue DESC`,
        [organizationId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get overdue incidents', error);
      throw error;
    }
  }

  /**
   * Get incidents by filters
   */
  async getIncidents(
    organizationId: string,
    filters?: {
      severity?: IncidentSeverity;
      status?: IncidentStatus;
      startDate?: Date;
      endDate?: Date;
      clientId?: string;
      caregiverId?: string;
    }
  ): Promise<Incident[]> {
    try {
      let query = 'SELECT * FROM incidents WHERE organization_id = $1';
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (filters?.severity) {
        query += ` AND severity = $${paramIndex++}`;
        params.push(filters.severity);
      }
      if (filters?.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }
      if (filters?.startDate) {
        query += ` AND incident_date >= $${paramIndex++}`;
        params.push(filters.startDate);
      }
      if (filters?.endDate) {
        query += ` AND incident_date <= $${paramIndex++}`;
        params.push(filters.endDate);
      }
      if (filters?.clientId) {
        query += ` AND client_id = $${paramIndex++}`;
        params.push(filters.clientId);
      }
      if (filters?.caregiverId) {
        query += ` AND caregiver_id = $${paramIndex++}`;
        params.push(filters.caregiverId);
      }

      query += ' ORDER BY incident_date DESC';

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.mapRowToIncident(row));
    } catch (error) {
      logger.error('Failed to get incidents', error);
      throw error;
    }
  }

  // ============================================================================
  // Investigation Management
  // ============================================================================

  /**
   * Start an investigation
   */
  async startInvestigation(
    investigationId: string,
    investigatorId: string,
    userContext: UserContext
  ): Promise<Investigation> {
    try {
      const result = await this.db.query(
        `UPDATE incident_investigations
        SET status = 'in_progress', investigator_id = $2, started_at = NOW(), updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [investigationId, investigatorId]
      );

      return this.mapRowToInvestigation(result.rows[0]);
    } catch (error) {
      logger.error('Failed to start investigation', error);
      throw error;
    }
  }

  /**
   * Complete an investigation
   */
  async completeInvestigation(
    investigationId: string,
    data: {
      rootCauseAnalysis: string;
      contributingFactors: any[];
      timelineOfEvents?: string;
      correctiveActions: any[];
      preventiveMeasures?: any[];
      trainingRequired?: any[];
      policyUpdatesRequired?: boolean;
      policyUpdates?: any[];
    },
    userContext: UserContext
  ): Promise<Investigation> {
    try {
      const result = await this.db.query(
        `UPDATE incident_investigations
        SET status = 'completed', completed_at = NOW(), root_cause_analysis = $2,
            contributing_factors = $3, timeline_of_events = $4, corrective_actions = $5,
            preventive_measures = $6, training_required = $7, policy_updates_required = $8,
            policy_updates = $9, updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [
          investigationId,
          data.rootCauseAnalysis,
          JSON.stringify(data.contributingFactors),
          data.timelineOfEvents || null,
          JSON.stringify(data.correctiveActions),
          JSON.stringify(data.preventiveMeasures || []),
          JSON.stringify(data.trainingRequired || []),
          data.policyUpdatesRequired || false,
          JSON.stringify(data.policyUpdates || [])
        ]
      );

      const investigation = this.mapRowToInvestigation(result.rows[0]);

      // Notify about corrective actions
      for (const action of data.correctiveActions) {
        if (action.assignedTo) {
          await this.notificationsService.createNotification({
            organizationId: userContext.organizationId,
            userId: action.assignedTo,
            type: NotificationType.TASK,
            category: NotificationCategory.COMPLIANCE,
            priority: 'high',
            title: 'Corrective Action Assigned',
            message: `You have been assigned a corrective action: ${action.action}`,
            data: { investigationId, action },
            sendAt: new Date(),
            createdBy: userContext.userId
          }, userContext);
        }
      }

      logger.info('Investigation completed', { investigationId });
      return investigation;
    } catch (error) {
      logger.error('Failed to complete investigation', error);
      throw error;
    }
  }

  /**
   * Get pending investigations
   */
  async getPendingInvestigations(organizationId: string): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM pending_incident_investigations WHERE organization_id = $1 ORDER BY investigation_deadline ASC`,
        [organizationId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get pending investigations', error);
      throw error;
    }
  }

  // ============================================================================
  // Alert System
  // ============================================================================

  /**
   * Send deadline alerts for incidents approaching 24-hour deadline
   */
  async sendDeadlineAlerts(organizationId: string, userContext: UserContext): Promise<number> {
    try {
      let alertsSent = 0;

      // Get incidents approaching deadline (12 hours, 20 hours, 24 hours)
      const incidents = await this.db.query(
        `SELECT * FROM incidents
        WHERE organization_id = $1
          AND status NOT IN ('resolved', 'closed')
          AND severity = 'critical'
          AND reported_to_oda = false
          AND reporting_deadline BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`,
        [organizationId]
      );

      for (const incident of incidents.rows) {
        const hoursRemaining = Math.floor(
          (new Date(incident.reporting_deadline).getTime() - Date.now()) / (1000 * 60 * 60)
        );

        let alertType: string;
        let priority: 'low' | 'medium' | 'high' | 'critical';

        if (hoursRemaining <= 4) {
          alertType = 'deadline_24_hours';
          priority = 'critical';
        } else if (hoursRemaining <= 12) {
          alertType = 'deadline_20_hours';
          priority = 'high';
        } else {
          alertType = 'deadline_12_hours';
          priority = 'medium';
        }

        // Check if alert already sent
        const existingAlert = await this.db.query(
          `SELECT id FROM incident_alerts
          WHERE incident_id = $1 AND alert_type = $2`,
          [incident.id, alertType]
        );

        if (existingAlert.rows.length === 0) {
          // Send to compliance officers
          const complianceOfficers = await this.db.query(
            `SELECT id FROM users
            WHERE organization_id = $1 AND role IN ('compliance_officer', 'clinical_director', 'administrator')`,
            [organizationId]
          );

          for (const officer of complianceOfficers.rows) {
            await this.notificationsService.createNotification({
              organizationId,
              userId: officer.id,
              type: NotificationType.ALERT,
              category: NotificationCategory.COMPLIANCE,
              priority,
              title: `Incident Reporting Deadline: ${hoursRemaining} hours remaining`,
              message: `Incident ${incident.incident_number} must be reported to ODA within ${hoursRemaining} hours.`,
              data: { incidentId: incident.id, incidentNumber: incident.incident_number },
              sendAt: new Date(),
              createdBy: userContext.userId
            }, userContext);
          }

          // Log alert
          await this.db.query(
            `INSERT INTO incident_alerts (incident_id, alert_type, alert_priority, recipient_ids)
            VALUES ($1, $2, $3, $4)`,
            [incident.id, alertType, priority, JSON.stringify(complianceOfficers.rows.map(o => o.id))]
          );

          alertsSent++;
        }
      }

      logger.info('Incident deadline alerts sent', { organizationId, alertsSent });
      return alertsSent;
    } catch (error) {
      logger.error('Failed to send deadline alerts', error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async sendCriticalIncidentAlerts(incident: Incident, userContext: UserContext): Promise<void> {
    // Alert compliance officers immediately
    const officers = await this.db.query(
      `SELECT id FROM users
      WHERE organization_id = $1 AND role IN ('compliance_officer', 'clinical_director', 'administrator')`,
      [userContext.organizationId]
    );

    for (const officer of officers.rows) {
      await this.notificationsService.createNotification({
        organizationId: userContext.organizationId,
        userId: officer.id,
        type: NotificationType.ALERT,
        category: NotificationCategory.COMPLIANCE,
        priority: 'critical',
        title: 'Critical Incident Reported',
        message: `Critical incident ${incident.incidentNumber} reported. Must notify ODA within 24 hours.`,
        data: { incidentId: incident.id },
        sendAt: new Date(),
        createdBy: userContext.userId
      }, userContext);
    }
  }

  private async scheduleDeadlineAlerts(incident: Incident, userContext: UserContext): Promise<void> {
    // Alerts will be sent by cron job checking approaching deadlines
    logger.info('Deadline alerts scheduled for incident', { incidentId: incident.id });
  }

  private mapRowToIncident(row: any): Incident {
    return {
      id: row.id,
      organizationId: row.organization_id,
      incidentNumber: row.incident_number,
      incidentType: row.incident_type,
      severity: row.severity,
      incidentDate: row.incident_date,
      discoveryDate: row.discovery_date,
      reportingDeadline: row.reporting_deadline,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      witnessIds: row.witness_ids || [],
      location: row.location,
      description: row.description,
      immediateActionsTaken: row.immediate_actions_taken,
      injuriesSustained: row.injuries_sustained,
      medicalTreatmentRequired: row.medical_treatment_required,
      medicalFacility: row.medical_facility,
      status: row.status,
      reportedToOda: row.reported_to_oda,
      odaNotificationDate: row.oda_notification_date,
      odaCaseNumber: row.oda_case_number,
      odaFollowUpRequired: row.oda_follow_up_required,
      reportedToAps: row.reported_to_aps,
      apsNotificationDate: row.aps_notification_date,
      apsCaseNumber: row.aps_case_number,
      reportedToLawEnforcement: row.reported_to_law_enforcement,
      lawEnforcementAgency: row.law_enforcement_agency,
      lawEnforcementCaseNumber: row.law_enforcement_case_number,
      lawEnforcementNotificationDate: row.law_enforcement_notification_date,
      reportedToFamily: row.reported_to_family,
      familyNotificationDate: row.family_notification_date,
      familyNotifiedBy: row.family_notified_by,
      photosTaken: row.photos_taken,
      photoUrls: row.photo_urls || [],
      witnessStatements: row.witness_statements || [],
      supportingDocuments: row.supporting_documents || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapRowToInvestigation(row: any): Investigation {
    return {
      id: row.id,
      incidentId: row.incident_id,
      investigationDeadline: row.investigation_deadline,
      investigatorId: row.investigator_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      rootCauseAnalysis: row.root_cause_analysis,
      contributingFactors: row.contributing_factors || [],
      timelineOfEvents: row.timeline_of_events,
      interviews: row.interviews || [],
      correctiveActions: row.corrective_actions || [],
      preventiveMeasures: row.preventive_measures || [],
      trainingRequired: row.training_required || [],
      policyUpdatesRequired: row.policy_updates_required,
      policyUpdates: row.policy_updates || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new IncidentManagementService();
