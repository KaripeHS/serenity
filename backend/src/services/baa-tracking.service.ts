/**
 * Business Associate Agreement (BAA) Tracking Service
 * Manages HIPAA Business Associate Agreements with automated renewal alerts
 *
 * Compliance Requirements (HIPAA Privacy Rule 45 CFR § 164.502(e)):
 * - Written BAA required before PHI disclosure to business associates
 * - BAA must include specific safeguards and restrictions
 * - Covered entity must obtain satisfactory assurances
 * - Termination required if BA breaches agreement
 *
 * @module services/baa-tracking
 */

import { DatabaseClient, getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { NotificationsService, NotificationType, NotificationCategory } from './notifications.service';
import { UserContext } from '../auth/access-control';
import { AuditLogger } from '../audit/logger';

const logger = createLogger('BAATrackingService');

export interface BusinessAssociate {
  id: string;
  organizationId: string;
  baName: string;
  baType: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  businessAddress?: string;
  website?: string;
  phiAccessLevel?: 'full' | 'limited' | 'minimal';
  phiTypesAccessed: any[];
  dataStorageLocation?: string;
  encryptionStandard?: string;
  servicesDescription: string;
  criticalService: boolean;
  annualCost?: number;
  billingFrequency?: string;
  status: 'active' | 'inactive' | 'terminated' | 'pending';
  relationshipStartDate?: Date;
  relationshipEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessAssociateAgreement {
  id: string;
  organizationId: string;
  businessAssociateId: string;
  baaNumber: string;
  agreementType: 'standard_baa' | 'subcontractor_baa' | 'amendment' | 'renewal';
  agreementName?: string;
  executionDate: Date;
  effectiveDate: Date;
  expirationDate?: Date;
  autoRenewal: boolean;
  renewalNoticeDays: number;

  // HIPAA Requirements
  establishesPermittedUses: boolean;
  requiresSafeguards: boolean;
  requiresReportingBreaches: boolean;
  requiresReportingSecurityIncidents: boolean;
  restrictsUseDisclosure: boolean;
  requiresSubcontractorAgreements: boolean;
  allowsTerminationForBreach: boolean;
  requiresReturnDestructionPhi: boolean;
  allRequirementsMet: boolean;

  hasSubcontractors: boolean;
  subcontractors: any[];

  documentUrl?: string;
  signedByBa: boolean;
  baSignatoryName?: string;
  baSignatoryTitle?: string;
  baSignatureDate?: Date;

  signedByCoveredEntity: boolean;
  ceSignatoryName?: string;
  ceSignatoryTitle?: string;
  ceSignatureDate?: Date;

  lastReviewedDate?: Date;
  nextReviewDueDate?: Date;
  complianceVerified: boolean;
  complianceVerificationDate?: Date;
  complianceNotes?: string;

  breachesReported: number;
  lastBreachReportDate?: Date;

  status: 'draft' | 'pending_signature' | 'active' | 'expiring_soon' | 'expired' | 'terminated';

  createdAt: Date;
  updatedAt: Date;
}

export class BAATrackingService {
  private db: DatabaseClient;
  private notificationsService: NotificationsService;
  private auditLogger: AuditLogger;

  constructor(
    db?: DatabaseClient,
    notificationsService?: NotificationsService,
    auditLogger?: AuditLogger
  ) {
    this.db = db || getDbClient();
    this.auditLogger = auditLogger || new AuditLogger('baa-tracking');
    this.notificationsService = notificationsService || new NotificationsService(this.db, this.auditLogger);
  }

  // ============================================================================
  // Business Associate Management
  // ============================================================================

  /**
   * Add a new business associate
   */
  async addBusinessAssociate(
    data: Partial<BusinessAssociate>,
    userContext: UserContext
  ): Promise<BusinessAssociate> {
    const result = await this.db.query(
      `INSERT INTO business_associates (
        organization_id, ba_name, ba_type,
        primary_contact_name, primary_contact_email, primary_contact_phone,
        business_address, website,
        phi_access_level, phi_types_accessed, data_storage_location, encryption_standard,
        services_description, critical_service,
        annual_cost, billing_frequency,
        status, relationship_start_date,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        userContext.organizationId, data.baName, data.baType,
        data.primaryContactName, data.primaryContactEmail, data.primaryContactPhone,
        data.businessAddress, data.website,
        data.phiAccessLevel, JSON.stringify(data.phiTypesAccessed || []), data.dataStorageLocation, data.encryptionStandard,
        data.servicesDescription, data.criticalService || false,
        data.annualCost, data.billingFrequency,
        data.status || 'pending', data.relationshipStartDate || new Date(),
        userContext.userId
      ]
    );

    const ba = this.mapRowToBusinessAssociate(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BUSINESS_ASSOCIATE_ADDED',
      resource: 'business_associate',
      details: { resourceId: ba.id, baName: data.baName, criticalService: data.criticalService }
    });

    logger.info('Business associate added', { baId: ba.id, baName: data.baName });

    return ba;
  }

  /**
   * Get all business associates
   */
  async getBusinessAssociates(
    organizationId: string,
    filters?: { status?: string; criticalOnly?: boolean }
  ): Promise<BusinessAssociate[]> {
    let query = `SELECT * FROM business_associates WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.criticalOnly) {
      query += ` AND critical_service = true`;
    }

    query += ` ORDER BY ba_name`;

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapRowToBusinessAssociate(row));
  }

  // ============================================================================
  // BAA Management
  // ============================================================================

  /**
   * Create a new BAA
   */
  async createBAA(
    data: Partial<BusinessAssociateAgreement>,
    userContext: UserContext
  ): Promise<BusinessAssociateAgreement> {
    const result = await this.db.query(
      `INSERT INTO business_associate_agreements (
        organization_id, business_associate_id, agreement_type, agreement_name,
        execution_date, effective_date, expiration_date, auto_renewal, renewal_notice_days,
        establishes_permitted_uses, requires_safeguards, requires_reporting_breaches,
        requires_reporting_security_incidents, restricts_use_disclosure,
        requires_subcontractor_agreements, allows_termination_for_breach,
        requires_return_destruction_phi,
        has_subcontractors, subcontractors,
        document_url,
        next_review_due_date,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        userContext.organizationId, data.businessAssociateId, data.agreementType || 'standard_baa', data.agreementName,
        data.executionDate, data.effectiveDate, data.expirationDate, data.autoRenewal || false, data.renewalNoticeDays || 90,
        data.establishesPermittedUses || false, data.requiresSafeguards || false, data.requiresReportingBreaches || false,
        data.requiresReportingSecurityIncidents || false, data.restrictsUseDisclosure || false,
        data.requiresSubcontractorAgreements || false, data.allowsTerminationForBreach || false,
        data.requiresReturnDestructionPhi || false,
        data.hasSubcontractors || false, JSON.stringify(data.subcontractors || []),
        data.documentUrl,
        data.nextReviewDueDate,
        data.status || 'draft', userContext.userId
      ]
    );

    const baa = this.mapRowToBAA(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BAA_CREATED',
      resource: 'baa',
      details: { resourceId: baa.id, baaNumber: baa.baaNumber, businessAssociateId: data.businessAssociateId }
    });

    logger.info('BAA created', { baaId: baa.id, baaNumber: baa.baaNumber });

    return baa;
  }

  /**
   * Sign BAA (by covered entity)
   */
  async signBAA(
    baaId: string,
    signatoryName: string,
    signatoryTitle: string,
    userContext: UserContext
  ): Promise<BusinessAssociateAgreement> {
    const result = await this.db.query(
      `UPDATE business_associate_agreements
       SET signed_by_covered_entity = true,
           ce_signatory_name = $1,
           ce_signatory_title = $2,
           ce_signature_date = CURRENT_DATE,
           updated_by = $3,
           updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [signatoryName, signatoryTitle, userContext.userId, baaId, userContext.organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('BAA not found');
    }

    const baa = this.mapRowToBAA(result.rows[0]);

    await this.auditLogger.logActivity({
      userId: userContext.userId,
      organizationId: userContext.organizationId,
      action: 'BAA_SIGNED',
      resource: 'baa',
      details: { resourceId: baa.id, signatoryName, signatoryTitle }
    });

    logger.info('BAA signed by covered entity', { baaId: baa.id });

    return baa;
  }

  /**
   * Get expiring BAAs (within 90 days)
   */
  async getExpiringBAAs(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM expiring_baas WHERE organization_id = $1 ORDER BY expiration_date`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get expired BAAs
   */
  async getExpiredBAAs(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM expired_baas WHERE organization_id = $1 ORDER BY days_expired DESC`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get critical services without active BAA
   */
  async getCriticalServicesWithoutBAA(organizationId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM critical_services_without_baa WHERE organization_id = $1`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Send BAA renewal alerts
   */
  async sendRenewalAlerts(organizationId: string, userContext: UserContext): Promise<{
    expiringAlertsSent: number;
    expiredAlertsSent: number;
    criticalServiceAlertsSent: number;
  }> {
    // Expiring BAAs
    const expiringBAAs = await this.getExpiringBAAs(organizationId);

    for (const baa of expiringBAAs) {
      const priority = baa.days_until_expiration <= 30
        ? (baa.critical_service ? 'critical' : 'high')
        : 'medium';

      await this.notificationsService.createNotification(
        {
          organizationId,
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority,
          title: `BAA Renewal Required: ${baa.ba_name}`,
          message: `Business Associate Agreement ${baa.baa_number} expires in ${baa.days_until_expiration} days. ${baa.critical_service ? 'CRITICAL SERVICE - Immediate action required.' : 'Please initiate renewal process.'}`,
          data: {
            baaId: baa.id,
            baaNumber: baa.baa_number,
            baName: baa.ba_name,
            expirationDate: baa.expiration_date,
            daysUntilExpiration: baa.days_until_expiration,
            criticalService: baa.critical_service
          },
          actionUrl: `/compliance/baa/${baa.id}`,
          actionText: 'Renew BAA',
          sendAt: new Date(),
          createdBy: userContext.userId
        },
        userContext
      );
    }

    // Expired BAAs
    const expiredBAAs = await this.getExpiredBAAs(organizationId);

    for (const baa of expiredBAAs) {
      await this.notificationsService.createNotification(
        {
          organizationId,
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority: 'critical',
          title: `EXPIRED BAA: ${baa.ba_name}`,
          message: `Business Associate Agreement ${baa.baa_number} EXPIRED ${baa.days_expired} days ago. ${baa.critical_service ? 'CRITICAL SERVICE - PHI exposure risk. Terminate relationship immediately or execute new BAA.' : 'Execute new BAA or terminate relationship.'}`,
          data: {
            baaId: baa.id,
            baaNumber: baa.baa_number,
            baName: baa.ba_name,
            expirationDate: baa.expiration_date,
            daysExpired: baa.days_expired,
            criticalService: baa.critical_service
          },
          actionUrl: `/compliance/baa/${baa.id}`,
          actionText: 'Take Action Now',
          sendAt: new Date(),
          createdBy: userContext.userId
        },
        userContext
      );
    }

    // Critical services without BAA
    const criticalServicesWithoutBAA = await this.getCriticalServicesWithoutBAA(organizationId);

    for (const service of criticalServicesWithoutBAA) {
      await this.notificationsService.createNotification(
        {
          organizationId,
          type: NotificationType.ALERT,
          category: NotificationCategory.COMPLIANCE,
          priority: 'critical',
          title: `HIPAA VIOLATION: ${service.ba_name} - No Active BAA`,
          message: `Critical service ${service.ba_name} (${service.ba_type}) has PHI access but NO ACTIVE BAA. This is a HIPAA Privacy Rule violation. Execute BAA immediately or terminate PHI access.`,
          data: {
            baId: service.id,
            baName: service.ba_name,
            baType: service.ba_type,
            phiAccessLevel: service.phi_access_level
          },
          actionUrl: `/compliance/business-associates/${service.id}`,
          actionText: 'Create BAA Now',
          sendAt: new Date(),
          createdBy: userContext.userId
        },
        userContext
      );
    }

    logger.info('BAA renewal alerts sent', {
      expiring: expiringBAAs.length,
      expired: expiredBAAs.length,
      criticalWithoutBAA: criticalServicesWithoutBAA.length,
      organizationId
    });

    return {
      expiringAlertsSent: expiringBAAs.length,
      expiredAlertsSent: expiredBAAs.length,
      criticalServiceAlertsSent: criticalServicesWithoutBAA.length
    };
  }

  /**
   * Check BAA compliance
   */
  async checkCompliance(organizationId: string): Promise<{
    compliant: boolean;
    issues: string[];
    totalBusinessAssociates: number;
    activeBAAs: number;
    expiredBAAs: number;
    expiringBAAs: number;
    nonCompliantBAAs: number;
    criticalServicesWithoutBAA: number;
  }> {
    const result = await this.db.query(
      `SELECT * FROM baa_compliance_summary WHERE organization_id = $1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      return {
        compliant: true,
        issues: [],
        totalBusinessAssociates: 0,
        activeBAAs: 0,
        expiredBAAs: 0,
        expiringBAAs: 0,
        nonCompliantBAAs: 0,
        criticalServicesWithoutBAA: 0
      };
    }

    const summary = result.rows[0];
    const issues: string[] = [];

    // Check for critical services without BAA
    const criticalWithoutBAA = await this.getCriticalServicesWithoutBAA(organizationId);
    const criticalCount = criticalWithoutBAA.length;

    if (criticalCount > 0) {
      issues.push(`${criticalCount} critical service(s) have PHI access without active BAA (HIPAA violation)`);
    }

    if (parseInt(summary.expired_baas) > 0) {
      issues.push(`${summary.expired_baas} expired BAA(s) requiring renewal`);
    }

    if (parseInt(summary.expiring_soon_baas) > 0) {
      issues.push(`${summary.expiring_soon_baas} BAA(s) expiring within 90 days`);
    }

    if (parseInt(summary.non_compliant_baas) > 0) {
      issues.push(`${summary.non_compliant_baas} BAA(s) missing required HIPAA provisions`);
    }

    if (parseInt(summary.overdue_reviews) > 0) {
      issues.push(`${summary.overdue_reviews} BAA(s) with overdue annual reviews`);
    }

    return {
      compliant: issues.length === 0,
      issues,
      totalBusinessAssociates: parseInt(summary.total_business_associates),
      activeBAAs: parseInt(summary.active_baas),
      expiredBAAs: parseInt(summary.expired_baas),
      expiringBAAs: parseInt(summary.expiring_soon_baas),
      nonCompliantBAAs: parseInt(summary.non_compliant_baas),
      criticalServicesWithoutBAA: criticalCount
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapRowToBusinessAssociate(row: any): BusinessAssociate {
    return {
      id: row.id,
      organizationId: row.organization_id,
      baName: row.ba_name,
      baType: row.ba_type,
      primaryContactName: row.primary_contact_name,
      primaryContactEmail: row.primary_contact_email,
      primaryContactPhone: row.primary_contact_phone,
      businessAddress: row.business_address,
      website: row.website,
      phiAccessLevel: row.phi_access_level,
      phiTypesAccessed: row.phi_types_accessed || [],
      dataStorageLocation: row.data_storage_location,
      encryptionStandard: row.encryption_standard,
      servicesDescription: row.services_description,
      criticalService: row.critical_service,
      annualCost: row.annual_cost,
      billingFrequency: row.billing_frequency,
      status: row.status,
      relationshipStartDate: row.relationship_start_date,
      relationshipEndDate: row.relationship_end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToBAA(row: any): BusinessAssociateAgreement {
    return {
      id: row.id,
      organizationId: row.organization_id,
      businessAssociateId: row.business_associate_id,
      baaNumber: row.baa_number,
      agreementType: row.agreement_type,
      agreementName: row.agreement_name,
      executionDate: row.execution_date,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      autoRenewal: row.auto_renewal,
      renewalNoticeDays: row.renewal_notice_days,
      establishesPermittedUses: row.establishes_permitted_uses,
      requiresSafeguards: row.requires_safeguards,
      requiresReportingBreaches: row.requires_reporting_breaches,
      requiresReportingSecurityIncidents: row.requires_reporting_security_incidents,
      restrictsUseDisclosure: row.restricts_use_disclosure,
      requiresSubcontractorAgreements: row.requires_subcontractor_agreements,
      allowsTerminationForBreach: row.allows_termination_for_breach,
      requiresReturnDestructionPhi: row.requires_return_destruction_phi,
      allRequirementsMet: row.all_requirements_met,
      hasSubcontractors: row.has_subcontractors,
      subcontractors: row.subcontractors || [],
      documentUrl: row.document_url,
      signedByBa: row.signed_by_ba,
      baSignatoryName: row.ba_signatory_name,
      baSignatoryTitle: row.ba_signatory_title,
      baSignatureDate: row.ba_signature_date,
      signedByCoveredEntity: row.signed_by_covered_entity,
      ceSignatoryName: row.ce_signatory_name,
      ceSignatoryTitle: row.ce_signatory_title,
      ceSignatureDate: row.ce_signature_date,
      lastReviewedDate: row.last_reviewed_date,
      nextReviewDueDate: row.next_review_due_date,
      complianceVerified: row.compliance_verified,
      complianceVerificationDate: row.compliance_verification_date,
      complianceNotes: row.compliance_notes,
      breachesReported: row.breaches_reported,
      lastBreachReportDate: row.last_breach_report_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new BAATrackingService();
