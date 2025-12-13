/**
 * DODD (Department of Developmental Disabilities) Service
 * Manages DODD provider certification and caregiver eligibility
 *
 * Phase 3, Months 11-12 - Year 2 Preparation
 */

import { getDbClient } from '../database/client';

interface CreateCertificationData {
  certificationType: string;
  certificationNumber?: string;
  applicationDate?: string;
  doddRepName?: string;
  doddRepEmail?: string;
  doddRepPhone?: string;
  notes?: string;
}

interface UpdateCertificationData {
  certificationNumber?: string;
  certificationStatus?: string;
  approvalDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  doddRepName?: string;
  doddRepEmail?: string;
  doddRepPhone?: string;
  evvTrainingComplete?: boolean;
  evvTrainingDate?: string;
  staffTrainingComplete?: boolean;
  staffTrainingDate?: string;
  notes?: string;
}

interface CaregiverDoddRequirements {
  backgroundCheckDate?: string;
  backgroundCheckStatus?: string;
  orientationComplete?: boolean;
  orientationDate?: string;
  evvCertified?: boolean;
  evvCertificationDate?: string;
  notes?: string;
}

export class DoddService {
  // ============================================
  // ORGANIZATION CERTIFICATIONS
  // ============================================

  /**
   * Get all DODD certifications for organization
   */
  async getCertifications(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT * FROM dodd_certifications
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `,
      [organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      certificationType: row.certification_type,
      certificationNumber: row.certification_number,
      status: row.certification_status,
      applicationDate: row.application_date,
      approvalDate: row.approval_date,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      doddRep: {
        name: row.dodd_rep_name,
        email: row.dodd_rep_email,
        phone: row.dodd_rep_phone,
      },
      training: {
        evvComplete: row.evv_training_complete,
        evvDate: row.evv_training_date,
        staffComplete: row.staff_training_complete,
        staffDate: row.staff_training_date,
      },
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get certification by ID
   */
  async getCertification(
    certificationId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `SELECT * FROM dodd_certifications WHERE id = $1 AND organization_id = $2`,
      [certificationId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      certificationType: row.certification_type,
      certificationNumber: row.certification_number,
      status: row.certification_status,
      applicationDate: row.application_date,
      approvalDate: row.approval_date,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      doddRep: {
        name: row.dodd_rep_name,
        email: row.dodd_rep_email,
        phone: row.dodd_rep_phone,
      },
      training: {
        evvComplete: row.evv_training_complete,
        evvDate: row.evv_training_date,
        staffComplete: row.staff_training_complete,
        staffDate: row.staff_training_date,
      },
      notes: row.notes,
    };
  }

  /**
   * Create a DODD certification application
   */
  async createCertification(
    organizationId: string,
    data: CreateCertificationData
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO dodd_certifications (
        organization_id, certification_type, certification_number,
        application_date, dodd_rep_name, dodd_rep_email, dodd_rep_phone, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        organizationId,
        data.certificationType,
        data.certificationNumber || null,
        data.applicationDate || new Date().toISOString().split('T')[0],
        data.doddRepName || null,
        data.doddRepEmail || null,
        data.doddRepPhone || null,
        data.notes || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update certification
   */
  async updateCertification(
    certificationId: string,
    organizationId: string,
    data: UpdateCertificationData
  ): Promise<any | null> {
    const db = await getDbClient();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      certificationNumber: 'certification_number',
      certificationStatus: 'certification_status',
      approvalDate: 'approval_date',
      effectiveDate: 'effective_date',
      expirationDate: 'expiration_date',
      doddRepName: 'dodd_rep_name',
      doddRepEmail: 'dodd_rep_email',
      doddRepPhone: 'dodd_rep_phone',
      evvTrainingComplete: 'evv_training_complete',
      evvTrainingDate: 'evv_training_date',
      staffTrainingComplete: 'staff_training_complete',
      staffTrainingDate: 'staff_training_date',
      notes: 'notes',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        values.push((data as any)[key]);
      }
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = NOW()`);
    values.push(certificationId, organizationId);

    const result = await db.query(
      `
      UPDATE dodd_certifications
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Check if organization has active DODD certification
   */
  async hasActiveCertification(
    organizationId: string,
    certificationType?: string
  ): Promise<boolean> {
    const db = await getDbClient();

    let query = `
      SELECT id FROM dodd_certifications
      WHERE organization_id = $1
        AND certification_status = 'active'
        AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
    `;
    const params: any[] = [organizationId];

    if (certificationType) {
      query += ` AND certification_type = $2`;
      params.push(certificationType);
    }

    const result = await db.query(query, params);
    return result.rows.length > 0;
  }

  // ============================================
  // CAREGIVER DODD REQUIREMENTS
  // ============================================

  /**
   * Get DODD-eligible caregivers
   */
  async getEligibleCaregivers(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cg.id,
        cg.first_name || ' ' || cg.last_name AS name,
        cg.phone,
        cg.email,
        p.name AS pod_name,
        dcr.dodd_background_check_status,
        dcr.dodd_background_check_date,
        dcr.dodd_orientation_complete,
        dcr.dodd_orientation_date,
        dcr.evv_certified,
        dcr.evv_certification_date,
        dcr.is_dodd_eligible,
        dcr.eligibility_verified_at
      FROM caregivers cg
      JOIN dodd_caregiver_requirements dcr ON dcr.caregiver_id = cg.id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      WHERE cg.organization_id = $1
        AND cg.status = 'active'
        AND dcr.is_dodd_eligible = TRUE
      ORDER BY cg.last_name, cg.first_name
    `,
      [organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      podName: row.pod_name,
      backgroundCheck: {
        status: row.dodd_background_check_status,
        date: row.dodd_background_check_date,
      },
      orientation: {
        complete: row.dodd_orientation_complete,
        date: row.dodd_orientation_date,
      },
      evv: {
        certified: row.evv_certified,
        certificationDate: row.evv_certification_date,
      },
      isEligible: row.is_dodd_eligible,
      verifiedAt: row.eligibility_verified_at,
    }));
  }

  /**
   * Get all caregivers with DODD requirement status
   */
  async getCaregiverDoddStatus(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cg.id,
        cg.first_name || ' ' || cg.last_name AS name,
        cg.status AS caregiver_status,
        p.name AS pod_name,
        dcr.dodd_background_check_status,
        dcr.dodd_background_check_date,
        dcr.dodd_orientation_complete,
        dcr.evv_certified,
        dcr.is_dodd_eligible,
        CASE
          WHEN dcr.id IS NULL THEN 'not_started'
          WHEN dcr.is_dodd_eligible = TRUE THEN 'eligible'
          WHEN dcr.dodd_background_check_status = 'pending' THEN 'background_pending'
          WHEN dcr.dodd_background_check_status = 'passed' AND NOT dcr.dodd_orientation_complete THEN 'needs_orientation'
          WHEN dcr.dodd_orientation_complete AND NOT dcr.evv_certified THEN 'needs_evv'
          ELSE 'in_progress'
        END AS eligibility_status
      FROM caregivers cg
      LEFT JOIN dodd_caregiver_requirements dcr ON dcr.caregiver_id = cg.id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      WHERE cg.organization_id = $1
        AND cg.status = 'active'
      ORDER BY cg.last_name, cg.first_name
    `,
      [organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.caregiver_status,
      podName: row.pod_name,
      dodd: {
        backgroundCheckStatus: row.dodd_background_check_status,
        backgroundCheckDate: row.dodd_background_check_date,
        orientationComplete: row.dodd_orientation_complete,
        evvCertified: row.evv_certified,
        isEligible: row.is_dodd_eligible,
        eligibilityStatus: row.eligibility_status,
      },
    }));
  }

  /**
   * Get DODD requirements for a specific caregiver
   */
  async getCaregiverRequirements(
    caregiverId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        dcr.*,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        u.first_name || ' ' || u.last_name AS verified_by_name
      FROM dodd_caregiver_requirements dcr
      JOIN caregivers cg ON cg.id = dcr.caregiver_id
      LEFT JOIN users u ON u.id = dcr.eligibility_verified_by
      WHERE dcr.caregiver_id = $1 AND dcr.organization_id = $2
    `,
      [caregiverId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      caregiverId: row.caregiver_id,
      caregiverName: row.caregiver_name,
      backgroundCheck: {
        date: row.dodd_background_check_date,
        status: row.dodd_background_check_status,
      },
      orientation: {
        complete: row.dodd_orientation_complete,
        date: row.dodd_orientation_date,
      },
      evv: {
        certified: row.evv_certified,
        certificationDate: row.evv_certification_date,
      },
      isEligible: row.is_dodd_eligible,
      verifiedAt: row.eligibility_verified_at,
      verifiedBy: row.verified_by_name,
      notes: row.notes,
    };
  }

  /**
   * Create or update caregiver DODD requirements
   */
  async updateCaregiverRequirements(
    caregiverId: string,
    organizationId: string,
    data: CaregiverDoddRequirements,
    userId: string
  ): Promise<any> {
    const db = await getDbClient();

    // Check if all requirements are met
    const isEligible =
      data.backgroundCheckStatus === 'passed' &&
      data.orientationComplete === true &&
      data.evvCertified === true;

    const result = await db.query(
      `
      INSERT INTO dodd_caregiver_requirements (
        organization_id, caregiver_id,
        dodd_background_check_date, dodd_background_check_status,
        dodd_orientation_complete, dodd_orientation_date,
        evv_certified, evv_certification_date,
        is_dodd_eligible, eligibility_verified_at, eligibility_verified_by,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (caregiver_id) DO UPDATE SET
        dodd_background_check_date = COALESCE($3, dodd_caregiver_requirements.dodd_background_check_date),
        dodd_background_check_status = COALESCE($4, dodd_caregiver_requirements.dodd_background_check_status),
        dodd_orientation_complete = COALESCE($5, dodd_caregiver_requirements.dodd_orientation_complete),
        dodd_orientation_date = COALESCE($6, dodd_caregiver_requirements.dodd_orientation_date),
        evv_certified = COALESCE($7, dodd_caregiver_requirements.evv_certified),
        evv_certification_date = COALESCE($8, dodd_caregiver_requirements.evv_certification_date),
        is_dodd_eligible = $9,
        eligibility_verified_at = CASE WHEN $9 = TRUE THEN NOW() ELSE eligibility_verified_at END,
        eligibility_verified_by = CASE WHEN $9 = TRUE THEN $11 ELSE eligibility_verified_by END,
        notes = COALESCE($12, dodd_caregiver_requirements.notes),
        updated_at = NOW()
      RETURNING *
    `,
      [
        organizationId,
        caregiverId,
        data.backgroundCheckDate || null,
        data.backgroundCheckStatus || null,
        data.orientationComplete || null,
        data.orientationDate || null,
        data.evvCertified || null,
        data.evvCertificationDate || null,
        isEligible,
        isEligible ? new Date() : null,
        isEligible ? userId : null,
        data.notes || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get DODD eligibility dashboard
   */
  async getEligibilityDashboard(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE cg.status = 'active') AS total_caregivers,
        COUNT(*) FILTER (WHERE dcr.is_dodd_eligible = TRUE) AS eligible_caregivers,
        COUNT(*) FILTER (WHERE dcr.dodd_background_check_status = 'pending') AS pending_background,
        COUNT(*) FILTER (WHERE dcr.dodd_background_check_status = 'passed' AND NOT dcr.dodd_orientation_complete) AS needs_orientation,
        COUNT(*) FILTER (WHERE dcr.dodd_orientation_complete AND NOT dcr.evv_certified) AS needs_evv,
        COUNT(*) FILTER (WHERE dcr.id IS NULL) AS not_started
      FROM caregivers cg
      LEFT JOIN dodd_caregiver_requirements dcr ON dcr.caregiver_id = cg.id
      WHERE cg.organization_id = $1
        AND cg.status = 'active'
    `,
      [organizationId]
    );

    const row = result.rows[0];

    // Get certification status
    const certResult = await db.query(
      `
      SELECT
        certification_type,
        certification_status,
        expiration_date
      FROM dodd_certifications
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `,
      [organizationId]
    );

    return {
      caregiverStats: {
        total: parseInt(row.total_caregivers) || 0,
        eligible: parseInt(row.eligible_caregivers) || 0,
        pendingBackground: parseInt(row.pending_background) || 0,
        needsOrientation: parseInt(row.needs_orientation) || 0,
        needsEvv: parseInt(row.needs_evv) || 0,
        notStarted: parseInt(row.not_started) || 0,
      },
      certifications: certResult.rows.map((cert) => ({
        type: cert.certification_type,
        status: cert.certification_status,
        expirationDate: cert.expiration_date,
      })),
    };
  }
}

export const doddService = new DoddService();
