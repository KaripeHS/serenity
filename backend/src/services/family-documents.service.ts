/**
 * Family Documents Service
 * HIPAA-compliant document sharing between organization and family
 *
 * Phase 3, Months 9-10 - Family Portal
 */

import { getDbClient } from '../database/client';

interface ShareDocumentData {
  clientId: string;
  categoryId?: string;
  title: string;
  description?: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  storagePath: string;
  storageBucket?: string;
  containsPhi?: boolean;
  hipaaConsentRequired?: boolean;
  accessExpires?: string;
  tags?: string[];
  metadata?: any;
  sharedBy: string;
}

interface DocumentFilters {
  categoryId?: string;
  containsPhi?: boolean;
  fromDate?: string;
  toDate?: string;
}

interface HipaaConsentData {
  familyMemberId: string;
  clientId: string;
  consentType: string;
  consentVersion: string;
  consentText: string;
  signatureData?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class FamilyDocumentsService {
  // ============================================
  // DOCUMENT CATEGORIES
  // ============================================

  /**
   * Get document categories
   */
  async getCategories(organizationId?: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT * FROM family_document_categories
      WHERE (organization_id IS NULL OR organization_id = $1)
        AND is_active = TRUE
      ORDER BY sort_order, name
    `,
      [organizationId || null]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      requiresHipaaConsent: row.requires_hipaa_consent,
    }));
  }

  // ============================================
  // DOCUMENT MANAGEMENT (Staff)
  // ============================================

  /**
   * Share a document with family
   */
  async shareDocument(
    organizationId: string,
    data: ShareDocumentData
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO family_documents (
        organization_id, client_id, category_id,
        title, description, file_name, file_type, file_size,
        storage_path, storage_bucket,
        contains_phi, hipaa_consent_required,
        shared_with_family, shared_at, shared_by,
        access_expires, tags, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        TRUE, NOW(), $13, $14, $15, $16
      )
      RETURNING *
    `,
      [
        organizationId,
        data.clientId,
        data.categoryId || null,
        data.title,
        data.description || null,
        data.fileName,
        data.fileType || null,
        data.fileSize || null,
        data.storagePath,
        data.storageBucket || null,
        data.containsPhi !== false,
        data.hipaaConsentRequired !== false,
        data.sharedBy,
        data.accessExpires || null,
        data.tags || [],
        JSON.stringify(data.metadata || {}),
      ]
    );

    // Notify family members
    const familyMembers = await db.query(
      `SELECT id FROM family_members WHERE client_id = $1 AND status = 'active'`,
      [data.clientId]
    );

    for (const fm of familyMembers.rows) {
      await db.query(
        `
        INSERT INTO family_notifications (
          family_member_id,
          notification_type, title, body, data,
          send_push, send_email
        ) VALUES ($1, 'document_shared', 'New Document Shared', $2, $3, TRUE, TRUE)
      `,
        [
          fm.id,
          `A new document "${data.title}" has been shared with you.`,
          JSON.stringify({ documentId: result.rows[0].id }),
        ]
      );
    }

    return result.rows[0];
  }

  /**
   * Get documents for a client (staff view)
   */
  async getClientDocuments(
    clientId: string,
    organizationId: string,
    filters: DocumentFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        fd.*,
        fdc.name AS category_name,
        fdc.icon AS category_icon,
        u.first_name || ' ' || u.last_name AS shared_by_name
      FROM family_documents fd
      LEFT JOIN family_document_categories fdc ON fdc.id = fd.category_id
      LEFT JOIN users u ON u.id = fd.shared_by
      WHERE fd.client_id = $1
        AND fd.organization_id = $2
        AND fd.status = 'active'
    `;

    const params: any[] = [clientId, organizationId];
    let paramIndex = 3;

    if (filters.categoryId) {
      query += ` AND fd.category_id = $${paramIndex++}`;
      params.push(filters.categoryId);
    }

    if (filters.containsPhi !== undefined) {
      query += ` AND fd.contains_phi = $${paramIndex++}`;
      params.push(filters.containsPhi);
    }

    if (filters.fromDate) {
      query += ` AND fd.created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND fd.created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += ` ORDER BY fd.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      category: row.category_id
        ? {
            id: row.category_id,
            name: row.category_name,
            icon: row.category_icon,
          }
        : null,
      containsPhi: row.contains_phi,
      hipaaConsentRequired: row.hipaa_consent_required,
      sharedWithFamily: row.shared_with_family,
      sharedAt: row.shared_at,
      sharedBy: row.shared_by_name,
      accessExpires: row.access_expires,
      tags: row.tags,
      createdAt: row.created_at,
    }));
  }

  /**
   * Revoke document sharing
   */
  async revokeSharing(
    documentId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE family_documents
      SET shared_with_family = FALSE, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `,
      [documentId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Archive document
   */
  async archiveDocument(
    documentId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE family_documents
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `,
      [documentId, organizationId]
    );

    return result.rows[0] || null;
  }

  // ============================================
  // DOCUMENT ACCESS (Family)
  // ============================================

  /**
   * Get shared documents for family member
   */
  async getFamilyDocuments(
    familyMemberId: string,
    clientId: string,
    filters: DocumentFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    // Get HIPAA consent status for this family member
    const consentResult = await db.query(
      `
      SELECT consent_type FROM family_hipaa_consents
      WHERE family_member_id = $1
        AND client_id = $2
        AND consent_type = 'phi_access'
        AND is_active = TRUE
    `,
      [familyMemberId, clientId]
    );

    const hasPhiConsent = consentResult.rows.length > 0;

    let query = `
      SELECT
        fd.*,
        fdc.name AS category_name,
        fdc.icon AS category_icon
      FROM family_documents fd
      LEFT JOIN family_document_categories fdc ON fdc.id = fd.category_id
      WHERE fd.client_id = $1
        AND fd.shared_with_family = TRUE
        AND fd.status = 'active'
        AND (fd.access_expires IS NULL OR fd.access_expires > NOW())
    `;

    // If no PHI consent, filter out PHI documents that require it
    if (!hasPhiConsent) {
      query += ` AND (fd.contains_phi = FALSE OR fd.hipaa_consent_required = FALSE)`;
    }

    const params: any[] = [clientId];
    let paramIndex = 2;

    if (filters.categoryId) {
      query += ` AND fd.category_id = $${paramIndex++}`;
      params.push(filters.categoryId);
    }

    query += ` ORDER BY fd.shared_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      category: row.category_id
        ? {
            id: row.category_id,
            name: row.category_name,
            icon: row.category_icon,
          }
        : null,
      containsPhi: row.contains_phi,
      sharedAt: row.shared_at,
      accessExpires: row.access_expires,
      tags: row.tags,
    }));
  }

  /**
   * Get document for viewing/download (family member)
   */
  async getDocumentForFamily(
    documentId: string,
    familyMemberId: string,
    clientId: string,
    action: string,
    accessInfo: { ipAddress?: string; userAgent?: string }
  ): Promise<any | null> {
    const db = await getDbClient();

    // Get document
    const docResult = await db.query(
      `
      SELECT fd.*, fm.organization_id
      FROM family_documents fd
      JOIN family_members fm ON fm.client_id = fd.client_id AND fm.id = $2
      WHERE fd.id = $1
        AND fd.client_id = $3
        AND fd.shared_with_family = TRUE
        AND fd.status = 'active'
        AND (fd.access_expires IS NULL OR fd.access_expires > NOW())
    `,
      [documentId, familyMemberId, clientId]
    );

    if (docResult.rows.length === 0) {
      return null;
    }

    const doc = docResult.rows[0];

    // Check PHI consent if required
    if (doc.contains_phi && doc.hipaa_consent_required) {
      const consent = await db.query(
        `
        SELECT id FROM family_hipaa_consents
        WHERE family_member_id = $1
          AND client_id = $2
          AND consent_type = 'phi_access'
          AND is_active = TRUE
      `,
        [familyMemberId, clientId]
      );

      if (consent.rows.length === 0) {
        throw new Error('HIPAA consent required to access this document');
      }
    }

    // Log access (HIPAA audit trail)
    await db.query(
      `
      INSERT INTO family_document_access_log (
        document_id, family_member_id,
        action, ip_address, user_agent, device_info,
        was_successful
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    `,
      [
        documentId,
        familyMemberId,
        action,
        accessInfo.ipAddress || null,
        accessInfo.userAgent || null,
        JSON.stringify({}),
      ]
    );

    return {
      id: doc.id,
      title: doc.title,
      fileName: doc.file_name,
      fileType: doc.file_type,
      storagePath: doc.storage_path,
      storageBucket: doc.storage_bucket,
    };
  }

  // ============================================
  // HIPAA CONSENT
  // ============================================

  /**
   * Record HIPAA consent
   */
  async recordHipaaConsent(
    organizationId: string,
    data: HipaaConsentData
  ): Promise<any> {
    const db = await getDbClient();

    // Deactivate any existing consent of this type
    await db.query(
      `
      UPDATE family_hipaa_consents
      SET is_active = FALSE
      WHERE family_member_id = $1
        AND client_id = $2
        AND consent_type = $3
        AND is_active = TRUE
    `,
      [data.familyMemberId, data.clientId, data.consentType]
    );

    // Record new consent
    const result = await db.query(
      `
      INSERT INTO family_hipaa_consents (
        organization_id, client_id, family_member_id,
        consent_type, consent_version, consent_text,
        signature_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        organizationId,
        data.clientId,
        data.familyMemberId,
        data.consentType,
        data.consentVersion,
        data.consentText,
        data.signatureData || null,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get consent status for family member
   */
  async getConsentStatus(
    familyMemberId: string,
    clientId: string
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        consent_type,
        consent_version,
        consented_at,
        is_active,
        revoked_at
      FROM family_hipaa_consents
      WHERE family_member_id = $1 AND client_id = $2
      ORDER BY consented_at DESC
    `,
      [familyMemberId, clientId]
    );

    return result.rows.map((row) => ({
      type: row.consent_type,
      version: row.consent_version,
      consentedAt: row.consented_at,
      isActive: row.is_active,
      revokedAt: row.revoked_at,
    }));
  }

  /**
   * Revoke HIPAA consent
   */
  async revokeConsent(
    familyMemberId: string,
    clientId: string,
    consentType: string,
    reason: string
  ): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `
      UPDATE family_hipaa_consents
      SET is_active = FALSE,
          revoked_at = NOW(),
          revoked_reason = $4
      WHERE family_member_id = $1
        AND client_id = $2
        AND consent_type = $3
        AND is_active = TRUE
    `,
      [familyMemberId, clientId, consentType, reason]
    );
  }

  // ============================================
  // DOCUMENT ACCESS LOG (HIPAA Audit)
  // ============================================

  /**
   * Get document access log (staff view)
   */
  async getDocumentAccessLog(
    documentId: string,
    organizationId: string
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        fal.*,
        fm.first_name || ' ' || fm.last_name AS family_member_name,
        u.first_name || ' ' || u.last_name AS staff_name
      FROM family_document_access_log fal
      LEFT JOIN family_members fm ON fm.id = fal.family_member_id
      LEFT JOIN users u ON u.id = fal.staff_user_id
      JOIN family_documents fd ON fd.id = fal.document_id
      WHERE fal.document_id = $1
        AND fd.organization_id = $2
      ORDER BY fal.accessed_at DESC
    `,
      [documentId, organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      accessedBy: row.family_member_id
        ? {
            type: 'family',
            id: row.family_member_id,
            name: row.family_member_name,
          }
        : {
            type: 'staff',
            id: row.staff_user_id,
            name: row.staff_name,
          },
      ipAddress: row.ip_address,
      wasSuccessful: row.was_successful,
      failureReason: row.failure_reason,
      accessedAt: row.accessed_at,
    }));
  }

  /**
   * Get all document access for audit (organization-wide)
   */
  async getAuditLog(
    organizationId: string,
    days: number = 30
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        fal.*,
        fd.title AS document_title,
        c.first_name || ' ' || c.last_name AS client_name,
        fm.first_name || ' ' || fm.last_name AS family_member_name
      FROM family_document_access_log fal
      JOIN family_documents fd ON fd.id = fal.document_id
      JOIN clients c ON c.id = fd.client_id
      LEFT JOIN family_members fm ON fm.id = fal.family_member_id
      WHERE fd.organization_id = $1
        AND fal.accessed_at >= NOW() - ($2 || ' days')::INTERVAL
      ORDER BY fal.accessed_at DESC
    `,
      [organizationId, days]
    );

    return result.rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      documentTitle: row.document_title,
      clientName: row.client_name,
      action: row.action,
      accessedBy: row.family_member_name || 'Staff',
      ipAddress: row.ip_address,
      wasSuccessful: row.was_successful,
      accessedAt: row.accessed_at,
    }));
  }
}

export const familyDocumentsService = new FamilyDocumentsService();
