/**
 * Client Assessment Service
 * Manages standardized ADL/IADL assessments, physician orders, and care plans
 *
 * Compliance Requirements (OAC 173-39-02.11):
 * - Initial assessment before service delivery
 * - Annual reassessments
 * - Assessments on change in condition
 * - Physician orders for all services
 * - Individualized care plans
 *
 * @module services/client-assessment
 */

import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { NotificationsService, NotificationType, NotificationCategory } from './notifications.service';
import { UserContext } from '../auth/access-control';
import { AuditLogger } from '../audit/logger';

const logger = createLogger('ClientAssessmentService');

export interface ClientAssessment {
  id: string;
  organizationId: string;
  clientId: string;
  assessmentType: 'initial' | 'annual' | 'change_in_condition' | 'reassessment' | 'discharge';
  assessmentDate: Date;
  assessmentPeriodStart?: Date;
  assessmentPeriodEnd?: Date;
  assessorId: string;
  assessorRole?: string;
  assessmentLocation?: string;

  // ADL scores
  adlBathing?: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  adlDressing?: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  adlToileting?: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  adlTransferring?: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  adlContinence?: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';
  adlFeeding?: 'independent' | 'supervision' | 'limited_assistance' | 'extensive_assistance' | 'total_dependence';

  // IADL scores
  iadlMealPreparation?: string;
  iadlHousekeeping?: string;
  iadlLaundry?: string;
  iadlShopping?: string;
  iadlTransportation?: string;
  iadlMedicationManagement?: string;
  iadlFinances?: string;

  // Mobility & Safety
  mobilityStatus?: 'fully_ambulatory' | 'uses_cane' | 'uses_walker' | 'uses_wheelchair' | 'bedbound';
  fallRisk?: 'low' | 'moderate' | 'high';
  fallRiskFactors: any[];
  assistiveDevices: any[];

  // Cognitive Status
  cognitiveStatus?: 'alert_oriented' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  dementiaDiagnosis: boolean;
  wanderingRisk: boolean;
  memoryDeficit: boolean;
  decisionMakingCapacity?: 'full_capacity' | 'limited_capacity' | 'no_capacity';

  // Medical Conditions
  diagnoses: any[];
  medications: any[];
  allergies?: string;

  // Nutritional Status
  nutritionalStatus?: 'well_nourished' | 'at_risk' | 'malnourished';
  specialDiet?: string;
  swallowingDifficulty: boolean;
  aspirationRisk: boolean;

  // Skin Integrity
  skinIntegrity?: 'intact' | 'at_risk' | 'impaired';
  pressureUlcers: any[];
  wounds: any[];

  // Pain Assessment
  painPresent: boolean;
  painLevel?: number;
  painLocation?: string;
  painFrequency?: string;

  // Psychosocial
  livingSituation?: string;
  supportSystem?: 'strong' | 'adequate' | 'limited' | 'none';
  caregiverBurden?: 'none' | 'mild' | 'moderate' | 'severe';
  safetyConcerns?: string;
  environmentalHazards: any[];

  // Service Needs
  servicesRequired: any[];
  frequencyRecommended?: string;
  estimatedHoursPerWeek?: number;

  // Goals & Care Plan
  clientGoals: any[];
  carePlanNotes?: string;

  // Follow-up
  nextAssessmentDueDate?: Date;
  reassessmentTrigger?: string;

  // Status
  status: 'draft' | 'pending_approval' | 'approved' | 'archived';
  approvedBy?: string;
  approvedDate?: Date;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface PhysicianOrder {
  id: string;
  organizationId: string;
  clientId: string;
  orderNumber: string;
  orderType: 'initial_services' | 'skilled_nursing' | 'therapy' | 'medication' | 'dme' | 'wound_care' | 'other';
  orderDate: Date;
  effectiveDate: Date;
  expirationDate?: Date;

  // Physician Information
  physicianName: string;
  physicianNpi?: string;
  physicianPhone?: string;
  physicianFax?: string;
  physicianAddress?: string;
  physicianSpecialty?: string;

  // Order Details
  servicesOrdered: any[];
  diagnosisCodes: any[];
  medicationsOrdered: any[];
  specialInstructions?: string;
  precautions?: string;

  // Documentation
  orderDocumentUrl?: string;
  signedByPhysician: boolean;
  physicianSignatureDate?: Date;

  // Verbal Orders
  verbalOrder: boolean;
  verbalOrderReceivedBy?: string;
  verbalOrderDate?: Date;
  verbalOrderSignedWithin72Hours: boolean;

  // Recertification
  recertificationRequired: boolean;
  recertificationFrequency?: string;
  nextRecertificationDue?: Date;

  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'superseded';

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CarePlan {
  id: string;
  organizationId: string;
  clientId: string;
  assessmentId?: string;
  physicianOrderId?: string;

  planName: string;
  planType?: 'standard' | 'dementia' | 'chronic_disease' | 'post_hospitalization';
  effectiveDate: Date;
  reviewDate: Date;
  expirationDate?: Date;

  goals: any[];
  interventions: any[];
  serviceSchedule: any[];
  safetyProtocols: any[];
  emergencyProcedures?: string;

  clientPreferences?: string;
  culturalConsiderations?: string;
  languagePreference?: string;

  caregiverInstructions?: string;
  trainingRequired: any[];

  lastModifiedDate?: Date;
  modificationReason?: string;

  developedBy?: string;
  approvedBy?: string;
  approvedDate?: Date;
  clientSignatureObtained: boolean;
  clientSignatureDate?: Date;

  status: 'draft' | 'pending_approval' | 'active' | 'under_review' | 'archived';

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class ClientAssessmentService {
  private db: DatabaseClient;
  private notificationsService: NotificationsService;
  private auditLogger: AuditLogger;

  constructor(
    db?: DatabaseClient,
    notificationsService?: NotificationsService,
    auditLogger?: AuditLogger
  ) {
    this.db = db || getDbClient();
    this.notificationsService = notificationsService || new NotificationsService(this.db, this.auditLogger);
    this.auditLogger = auditLogger || new AuditLogger('client-assessment');
  }

  // ============================================================================
  // Client Assessments
  // ============================================================================

  /**
   * Create a new client assessment
   */
  async createAssessment(
    data: Partial<ClientAssessment>,
    userContext: UserContext
  ): Promise<ClientAssessment> {
    const result = await this.db.query(
      `INSERT INTO client_assessments (
        organization_id, client_id, assessment_type, assessment_date,
        assessment_period_start, assessment_period_end,
        assessor_id, assessor_role, assessment_location,
        adl_bathing, adl_dressing, adl_toileting, adl_transferring, adl_continence, adl_feeding,
        iadl_meal_preparation, iadl_housekeeping, iadl_laundry, iadl_shopping,
        iadl_transportation, iadl_medication_management, iadl_finances,
        mobility_status, fall_risk, fall_risk_factors, assistive_devices,
        cognitive_status, dementia_diagnosis, wandering_risk, memory_deficit, decision_making_capacity,
        diagnoses, medications, allergies,
        nutritional_status, special_diet, swallowing_difficulty, aspiration_risk,
        skin_integrity, pressure_ulcers, wounds,
        pain_present, pain_level, pain_location, pain_frequency,
        living_situation, support_system, caregiver_burden, safety_concerns, environmental_hazards,
        services_required, frequency_recommended, estimated_hours_per_week,
        client_goals, care_plan_notes,
        next_assessment_due_date, reassessment_trigger,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26,
        $27, $28, $29, $30, $31,
        $32, $33, $34,
        $35, $36, $37, $38,
        $39, $40, $41,
        $42, $43, $44, $45,
        $46, $47, $48, $49, $50,
        $51, $52, $53,
        $54, $55,
        $56, $57,
        $58, $59
      ) RETURNING *`,
      [
        userContext.organizationId, data.clientId, data.assessmentType, data.assessmentDate,
        data.assessmentPeriodStart, data.assessmentPeriodEnd,
        data.assessorId, data.assessorRole, data.assessmentLocation,
        data.adlBathing, data.adlDressing, data.adlToileting, data.adlTransferring, data.adlContinence, data.adlFeeding,
        data.iadlMealPreparation, data.iadlHousekeeping, data.iadlLaundry, data.iadlShopping,
        data.iadlTransportation, data.iadlMedicationManagement, data.iadlFinances,
        data.mobilityStatus, data.fallRisk, JSON.stringify(data.fallRiskFactors || []), JSON.stringify(data.assistiveDevices || []),
        data.cognitiveStatus, data.dementiaDiagnosis || false, data.wanderingRisk || false, data.memoryDeficit || false, data.decisionMakingCapacity,
        JSON.stringify(data.diagnoses || []), JSON.stringify(data.medications || []), data.allergies,
        data.nutritionalStatus, data.specialDiet, data.swallowingDifficulty || false, data.aspirationRisk || false,
        data.skinIntegrity, JSON.stringify(data.pressureUlcers || []), JSON.stringify(data.wounds || []),
        data.painPresent || false, data.painLevel, data.painLocation, data.painFrequency,
        data.livingSituation, data.supportSystem, data.caregiverBurden, data.safetyConcerns, JSON.stringify(data.environmentalHazards || []),
        JSON.stringify(data.servicesRequired || []), data.frequencyRecommended, data.estimatedHoursPerWeek,
        JSON.stringify(data.clientGoals || []), data.carePlanNotes,
        data.nextAssessmentDueDate, data.reassessmentTrigger,
        data.status || 'draft', userContext.userId
      ]
    );

    const assessment = this.mapRowToAssessment(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'CLIENT_ASSESSMENT_CREATED',
      resource: 'client_assessment',
      details: { resourceId: assessment.id, clientId: data.clientId, assessmentType: data.assessmentType }
    });

    logger.info('Client assessment created', {
      assessmentId: assessment.id,
      clientId: data.clientId,
      assessmentType: data.assessmentType
    });

    return assessment;
  }

  /**
   * Approve a client assessment
   */
  async approveAssessment(
    assessmentId: string,
    userContext: UserContext
  ): Promise<ClientAssessment> {
    const result = await this.db.query(
      `UPDATE client_assessments
       SET status = 'approved',
           approved_by = $1,
           approved_date = CURRENT_DATE,
           updated_by = $1,
           updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [userContext.userId, assessmentId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Assessment not found');
    }

    const assessment = this.mapRowToAssessment(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'CLIENT_ASSESSMENT_APPROVED',
      resource: 'client_assessment',
      details: { resourceId: assessment.id }
    });

    logger.info('Client assessment approved', { assessmentId: assessment.id });

    return assessment;
  }

  /**
   * Get client assessments with filters
   */
  async getAssessments(
    organizationId: string,
    filters?: {
      clientId?: string;
      assessmentType?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ClientAssessment[]> {
    let query = `SELECT * FROM client_assessments WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.clientId) {
      query += ` AND client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    if (filters?.assessmentType) {
      query += ` AND assessment_type = $${paramIndex}`;
      params.push(filters.assessmentType);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.startDate) {
      query += ` AND assessment_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      query += ` AND assessment_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY assessment_date DESC`;

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapRowToAssessment(row));
  }

  /**
   * Get overdue assessments for alerts
   */
  async getOverdueAssessments(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM overdue_client_assessments WHERE organization_id = $1`,
      [organizationId]
    );

    return result.rows;
  }

  // ============================================================================
  // Physician Orders
  // ============================================================================

  /**
   * Create a physician order
   */
  async createPhysicianOrder(
    data: Partial<PhysicianOrder>,
    userContext: UserContext
  ): Promise<PhysicianOrder> {
    const result = await this.db.query(
      `INSERT INTO physician_orders (
        organization_id, client_id, order_type, order_date, effective_date, expiration_date,
        physician_name, physician_npi, physician_phone, physician_fax, physician_address, physician_specialty,
        services_ordered, diagnosis_codes, medications_ordered, special_instructions, precautions,
        order_document_url, signed_by_physician, physician_signature_date,
        verbal_order, verbal_order_received_by, verbal_order_date, verbal_order_signed_within_72_hours,
        recertification_required, recertification_frequency, next_recertification_due,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23, $24,
        $25, $26, $27,
        $28, $29
      ) RETURNING *`,
      [
        userContext.organizationId, data.clientId, data.orderType, data.orderDate, data.effectiveDate, data.expirationDate,
        data.physicianName, data.physicianNpi, data.physicianPhone, data.physicianFax, data.physicianAddress, data.physicianSpecialty,
        JSON.stringify(data.servicesOrdered || []), JSON.stringify(data.diagnosisCodes || []), JSON.stringify(data.medicationsOrdered || []), data.specialInstructions, data.precautions,
        data.orderDocumentUrl, data.signedByPhysician || false, data.physicianSignatureDate,
        data.verbalOrder || false, data.verbalOrderReceivedBy, data.verbalOrderDate, data.verbalOrderSignedWithin72Hours || false,
        data.recertificationRequired || false, data.recertificationFrequency, data.nextRecertificationDue,
        data.status || 'pending', userContext.userId
      ]
    );

    const order = this.mapRowToPhysicianOrder(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'PHYSICIAN_ORDER_CREATED',
      resource: 'physician_order',
      details: { resourceId: order.id, clientId: data.clientId, orderType: data.orderType, orderNumber: order.orderNumber }
    });

    logger.info('Physician order created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientId: data.clientId
    });

    return order;
  }

  /**
   * Get expiring physician orders (within 30 days)
   */
  async getExpiringOrders(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM expiring_physician_orders WHERE organization_id = $1 ORDER BY expiration_date`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Send alerts for expiring physician orders
   */
  async sendExpiringOrderAlerts(organizationId: string, userContext: UserContext): Promise<number> {
    const expiringOrders = await this.getExpiringOrders(organizationId);

    for (const order of expiringOrders) {
      const priority = order.days_until_expiration <= 7 ? 'high' : 'medium';

      await this.notificationsService.createNotification(
        {
          organizationId: organizationId,
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority,
          title: `Physician Order Expiring Soon`,
          message: `Physician order ${order.order_number} for ${order.client_name} expires in ${order.days_until_expiration} days. Please obtain a new order.`,
          data: {
            orderId: order.id,
            clientId: order.client_id,
            orderNumber: order.order_number,
            expirationDate: order.expiration_date,
            daysUntilExpiration: order.days_until_expiration
          },
          actionUrl: `/clients/${order.client_id}/orders/${order.id}`,
          actionText: 'Review Order',
          sendAt: new Date(),
          createdBy: userContext.userId
        },
        userContext
      );
    }

    logger.info('Expiring order alerts sent', {
      count: expiringOrders.length,
      organizationId
    });

    return expiringOrders.length;
  }

  // ============================================================================
  // Care Plans
  // ============================================================================

  /**
   * Create a care plan
   */
  async createCarePlan(
    data: Partial<CarePlan>,
    userContext: UserContext
  ): Promise<CarePlan> {
    const result = await this.db.query(
      `INSERT INTO care_plans (
        organization_id, client_id, assessment_id, physician_order_id,
        plan_name, plan_type, effective_date, review_date, expiration_date,
        goals, interventions, service_schedule, safety_protocols, emergency_procedures,
        client_preferences, cultural_considerations, language_preference,
        caregiver_instructions, training_required,
        developed_by, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19,
        $20, $21, $22
      ) RETURNING *`,
      [
        userContext.organizationId, data.clientId, data.assessmentId, data.physicianOrderId,
        data.planName || 'Individualized Care Plan', data.planType, data.effectiveDate, data.reviewDate, data.expirationDate,
        JSON.stringify(data.goals || []), JSON.stringify(data.interventions || []), JSON.stringify(data.serviceSchedule || []), JSON.stringify(data.safetyProtocols || []), data.emergencyProcedures,
        data.clientPreferences, data.culturalConsiderations, data.languagePreference,
        data.caregiverInstructions, JSON.stringify(data.trainingRequired || []),
        data.developedBy || userContext.userId, data.status || 'draft', userContext.userId
      ]
    );

    const carePlan = this.mapRowToCarePlan(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'CARE_PLAN_CREATED',
      resource: 'care_plan',
      details: { resourceId: carePlan.id, clientId: data.clientId }
    });

    logger.info('Care plan created', { carePlanId: carePlan.id, clientId: data.clientId });

    return carePlan;
  }

  /**
   * Get care plans due for review
   */
  async getCarePlansDueForReview(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM care_plan_review_status
       WHERE organization_id = $1 AND review_status IN ('overdue', 'due_soon')
       ORDER BY review_date`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Send care plan review alerts
   */
  async sendCarePlanReviewAlerts(organizationId: string, userContext: UserContext): Promise<number> {
    const carePlans = await this.getCarePlansDueForReview(organizationId);

    for (const plan of carePlans) {
      const priority = plan.review_status === 'overdue' ? 'high' : 'medium';

      await this.notificationsService.createNotification(
        {
          organizationId: organizationId,
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority,
          title: plan.review_status === 'overdue' ? 'Care Plan Review Overdue' : 'Care Plan Review Due Soon',
          message: `Care plan for ${plan.client_name} is ${plan.review_status === 'overdue' ? `${plan.days_overdue} days overdue` : 'due for review within 30 days'}.`,
          data: {
            carePlanId: plan.id,
            clientId: plan.client_id,
            reviewDate: plan.review_date,
            daysOverdue: plan.days_overdue
          },
          actionUrl: `/clients/${plan.client_id}/care-plan/${plan.id}`,
          actionText: 'Review Care Plan',
          sendAt: new Date(),
          createdBy: userContext.userId
        },
        userContext
      );
    }

    logger.info('Care plan review alerts sent', {
      count: carePlans.length,
      organizationId
    });

    return carePlans.length;
  }

  /**
   * Check client assessment compliance
   */
  async checkCompliance(organizationId: string): Promise<{
    compliant: boolean;
    issues: string[];
    clientsWithoutCurrentAssessment: number;
    clientsWithoutPhysicianOrder: number;
    clientsWithoutCarePlan: number;
  }> {
    const result = await this.db.query(
      `SELECT
        COUNT(*) FILTER (WHERE NOT annual_assessment_current) AS clients_without_assessment,
        COUNT(*) FILTER (WHERE NOT has_active_physician_order) AS clients_without_physician_order,
        COUNT(*) FILTER (WHERE NOT has_active_care_plan) AS clients_without_care_plan
       FROM client_assessment_compliance
       WHERE organization_id = $1`,
      [organizationId]
    );

    const stats = result.rows[0];
    const issues: string[] = [];

    if (parseInt(stats.clients_without_assessment) > 0) {
      issues.push(`${stats.clients_without_assessment} client(s) missing current annual assessment`);
    }

    if (parseInt(stats.clients_without_physician_order) > 0) {
      issues.push(`${stats.clients_without_physician_order} client(s) missing active physician order`);
    }

    if (parseInt(stats.clients_without_care_plan) > 0) {
      issues.push(`${stats.clients_without_care_plan} client(s) missing active care plan`);
    }

    return {
      compliant: issues.length === 0,
      issues,
      clientsWithoutCurrentAssessment: parseInt(stats.clients_without_assessment),
      clientsWithoutPhysicianOrder: parseInt(stats.clients_without_physician_order),
      clientsWithoutCarePlan: parseInt(stats.clients_without_care_plan)
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapRowToAssessment(row: any): ClientAssessment {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      assessmentType: row.assessment_type,
      assessmentDate: row.assessment_date,
      assessmentPeriodStart: row.assessment_period_start,
      assessmentPeriodEnd: row.assessment_period_end,
      assessorId: row.assessor_id,
      assessorRole: row.assessor_role,
      assessmentLocation: row.assessment_location,
      adlBathing: row.adl_bathing,
      adlDressing: row.adl_dressing,
      adlToileting: row.adl_toileting,
      adlTransferring: row.adl_transferring,
      adlContinence: row.adl_continence,
      adlFeeding: row.adl_feeding,
      iadlMealPreparation: row.iadl_meal_preparation,
      iadlHousekeeping: row.iadl_housekeeping,
      iadlLaundry: row.iadl_laundry,
      iadlShopping: row.iadl_shopping,
      iadlTransportation: row.iadl_transportation,
      iadlMedicationManagement: row.iadl_medication_management,
      iadlFinances: row.iadl_finances,
      mobilityStatus: row.mobility_status,
      fallRisk: row.fall_risk,
      fallRiskFactors: row.fall_risk_factors || [],
      assistiveDevices: row.assistive_devices || [],
      cognitiveStatus: row.cognitive_status,
      dementiaDiagnosis: row.dementia_diagnosis,
      wanderingRisk: row.wandering_risk,
      memoryDeficit: row.memory_deficit,
      decisionMakingCapacity: row.decision_making_capacity,
      diagnoses: row.diagnoses || [],
      medications: row.medications || [],
      allergies: row.allergies,
      nutritionalStatus: row.nutritional_status,
      specialDiet: row.special_diet,
      swallowingDifficulty: row.swallowing_difficulty,
      aspirationRisk: row.aspiration_risk,
      skinIntegrity: row.skin_integrity,
      pressureUlcers: row.pressure_ulcers || [],
      wounds: row.wounds || [],
      painPresent: row.pain_present,
      painLevel: row.pain_level,
      painLocation: row.pain_location,
      painFrequency: row.pain_frequency,
      livingSituation: row.living_situation,
      supportSystem: row.support_system,
      caregiverBurden: row.caregiver_burden,
      safetyConcerns: row.safety_concerns,
      environmentalHazards: row.environmental_hazards || [],
      servicesRequired: row.services_required || [],
      frequencyRecommended: row.frequency_recommended,
      estimatedHoursPerWeek: row.estimated_hours_per_week,
      clientGoals: row.client_goals || [],
      carePlanNotes: row.care_plan_notes,
      nextAssessmentDueDate: row.next_assessment_due_date,
      reassessmentTrigger: row.reassessment_trigger,
      status: row.status,
      approvedBy: row.approved_by,
      approvedDate: row.approved_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapRowToPhysicianOrder(row: any): PhysicianOrder {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      orderNumber: row.order_number,
      orderType: row.order_type,
      orderDate: row.order_date,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      physicianName: row.physician_name,
      physicianNpi: row.physician_npi,
      physicianPhone: row.physician_phone,
      physicianFax: row.physician_fax,
      physicianAddress: row.physician_address,
      physicianSpecialty: row.physician_specialty,
      servicesOrdered: row.services_ordered || [],
      diagnosisCodes: row.diagnosis_codes || [],
      medicationsOrdered: row.medications_ordered || [],
      specialInstructions: row.special_instructions,
      precautions: row.precautions,
      orderDocumentUrl: row.order_document_url,
      signedByPhysician: row.signed_by_physician,
      physicianSignatureDate: row.physician_signature_date,
      verbalOrder: row.verbal_order,
      verbalOrderReceivedBy: row.verbal_order_received_by,
      verbalOrderDate: row.verbal_order_date,
      verbalOrderSignedWithin72Hours: row.verbal_order_signed_within_72_hours,
      recertificationRequired: row.recertification_required,
      recertificationFrequency: row.recertification_frequency,
      nextRecertificationDue: row.next_recertification_due,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapRowToCarePlan(row: any): CarePlan {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      assessmentId: row.assessment_id,
      physicianOrderId: row.physician_order_id,
      planName: row.plan_name,
      planType: row.plan_type,
      effectiveDate: row.effective_date,
      reviewDate: row.review_date,
      expirationDate: row.expiration_date,
      goals: row.goals || [],
      interventions: row.interventions || [],
      serviceSchedule: row.service_schedule || [],
      safetyProtocols: row.safety_protocols || [],
      emergencyProcedures: row.emergency_procedures,
      clientPreferences: row.client_preferences,
      culturalConsiderations: row.cultural_considerations,
      languagePreference: row.language_preference,
      caregiverInstructions: row.caregiver_instructions,
      trainingRequired: row.training_required || [],
      lastModifiedDate: row.last_modified_date,
      modificationReason: row.modification_reason,
      developedBy: row.developed_by,
      approvedBy: row.approved_by,
      approvedDate: row.approved_date,
      clientSignatureObtained: row.client_signature_obtained,
      clientSignatureDate: row.client_signature_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

export default new ClientAssessmentService();
