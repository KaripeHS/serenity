/**
 * Onboarding Document Upload Service
 * Manages document uploads for onboarding process
 *
 * Features:
 * - Cloud storage integration (Google Cloud Storage)
 * - Document verification workflow
 * - Support for ID documents, certifications, signed forms
 * - Audit logging for compliance
 */

import { Storage } from '@google-cloud/storage';
import { pool } from '../../config/database';
import crypto from 'crypto';
import { createLogger } from '../../utils/logger';

const logger = createLogger('onboarding-upload');

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  category: string;
  uploadedAt: string;
}

interface DocumentVerification {
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

export class OnboardingUploadService {
  private storage: Storage | null = null;
  private bucketName: string;
  private useLocalStorage: boolean;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'serenity-care-uploads';
    this.useLocalStorage = !process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!this.useLocalStorage) {
      try {
        this.storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_CLOUD_KEYFILE_PATH
        });
        logger.info('[OnboardingUpload] Google Cloud Storage initialized');
      } catch (error) {
        logger.warn('[OnboardingUpload] Cloud Storage initialization failed, using local storage:', error);
        this.useLocalStorage = true;
      }
    }
  }

  /**
   * Upload a document for an onboarding item
   */
  async uploadDocument(
    organizationId: string,
    onboardingItemId: string,
    uploadedBy: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    category: string,
    description?: string
  ): Promise<UploadedDocument | null> {
    try {
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(mimeType)) {
        throw new Error('Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC, DOCX');
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Generate unique filename
      const fileExtension = originalName.split('.').pop() || 'bin';
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const fileName = `onboarding/${organizationId}/${onboardingItemId}/${uniqueId}.${fileExtension}`;

      // Upload to storage
      let fileUrl: string;

      if (this.useLocalStorage) {
        // Local storage (development only)
        fileUrl = `/uploads/${fileName}`;
        logger.warn('[OnboardingUpload] Using local storage. File would be saved to: ' + fileUrl);
      } else {
        // Upload to Google Cloud Storage
        const uploadResult = await this.uploadToGCS(fileName, fileBuffer, mimeType);
        fileUrl = uploadResult.url;
      }

      // Save to database
      const result = await pool.query(
        `
        INSERT INTO onboarding_files (
          id,
          onboarding_item_id,
          organization_id,
          file_name,
          file_type,
          file_size,
          file_url,
          file_category,
          description,
          uploaded_by,
          uploaded_at
        ) VALUES (
          uuid_generate_v4(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        )
        RETURNING id, file_name, file_type, file_url, file_size, file_category as category, uploaded_at
        `,
        [
          onboardingItemId,
          organizationId,
          originalName,
          mimeType,
          fileBuffer.length,
          fileUrl,
          category,
          description,
          uploadedBy
        ]
      );

      // Log upload action
      await this.logAuditAction(
        null,
        onboardingItemId,
        'document_uploaded',
        {
          fileName: originalName,
          fileSize: fileBuffer.length,
          category
        },
        uploadedBy
      );

      const row = result.rows[0];
      return {
        id: row.id,
        fileName: row.file_name,
        fileType: row.file_type,
        fileUrl: row.file_url,
        fileSize: row.file_size,
        category: row.category,
        uploadedAt: row.uploaded_at
      };
    } catch (error: any) {
      logger.error('[OnboardingUpload] Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Get all documents for an onboarding item
   */
  async getDocumentsForItem(onboardingItemId: string): Promise<UploadedDocument[]> {
    const result = await pool.query(
      `
      SELECT
        id, file_name, file_type, file_url, file_size,
        file_category as category, uploaded_at
      FROM onboarding_files
      WHERE onboarding_item_id = $1
      ORDER BY uploaded_at DESC
      `,
      [onboardingItemId]
    );

    return result.rows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      category: row.category,
      uploadedAt: row.uploaded_at
    }));
  }

  /**
   * Verify a document (HR action)
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      await pool.query(
        `
        UPDATE onboarding_files
        SET
          verified = TRUE,
          verified_by = $2,
          verified_at = NOW(),
          verification_notes = $3,
          rejected = FALSE,
          rejected_by = NULL,
          rejected_at = NULL,
          rejection_reason = NULL
        WHERE id = $1
        RETURNING onboarding_item_id
        `,
        [documentId, verifiedBy, notes]
      );

      // Get item ID for audit log
      const itemResult = await pool.query(
        'SELECT onboarding_item_id FROM onboarding_files WHERE id = $1',
        [documentId]
      );

      if (itemResult.rows[0]) {
        await this.logAuditAction(
          null,
          itemResult.rows[0].onboarding_item_id,
          'document_verified',
          { documentId, notes },
          verifiedBy
        );
      }

      return true;
    } catch (error) {
      logger.error('[OnboardingUpload] Error verifying document:', error);
      return false;
    }
  }

  /**
   * Reject a document (HR action)
   */
  async rejectDocument(
    documentId: string,
    rejectedBy: string,
    reason: string
  ): Promise<boolean> {
    try {
      await pool.query(
        `
        UPDATE onboarding_files
        SET
          rejected = TRUE,
          rejected_by = $2,
          rejected_at = NOW(),
          rejection_reason = $3,
          verified = FALSE,
          verified_by = NULL,
          verified_at = NULL,
          verification_notes = NULL
        WHERE id = $1
        `,
        [documentId, rejectedBy, reason]
      );

      // Get item ID for audit log
      const itemResult = await pool.query(
        'SELECT onboarding_item_id FROM onboarding_files WHERE id = $1',
        [documentId]
      );

      if (itemResult.rows[0]) {
        await this.logAuditAction(
          null,
          itemResult.rows[0].onboarding_item_id,
          'document_rejected',
          { documentId, reason },
          rejectedBy
        );
      }

      return true;
    } catch (error) {
      logger.error('[OnboardingUpload] Error rejecting document:', error);
      return false;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, deletedBy: string): Promise<boolean> {
    try {
      // Get document details
      const docResult = await pool.query(
        'SELECT file_url, onboarding_item_id FROM onboarding_files WHERE id = $1',
        [documentId]
      );

      if (docResult.rows.length === 0) {
        throw new Error('Document not found');
      }

      const doc = docResult.rows[0];

      // Delete from cloud storage if applicable
      if (!this.useLocalStorage && this.storage && doc.file_url) {
        try {
          const fileName = doc.file_url.split('/').slice(-4).join('/');
          const bucket = this.storage.bucket(this.bucketName);
          await bucket.file(fileName).delete();
        } catch (err) {
          logger.warn('[OnboardingUpload] Error deleting file from GCS:', err);
        }
      }

      // Delete from database
      await pool.query('DELETE FROM onboarding_files WHERE id = $1', [documentId]);

      // Log deletion
      await this.logAuditAction(
        null,
        doc.onboarding_item_id,
        'document_deleted',
        { documentId },
        deletedBy
      );

      return true;
    } catch (error) {
      logger.error('[OnboardingUpload] Error deleting document:', error);
      return false;
    }
  }

  /**
   * Get documents pending verification for an organization
   */
  async getPendingVerifications(organizationId: string): Promise<Array<{
    id: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    employeeName: string;
    itemName: string;
  }>> {
    const result = await pool.query(
      `
      SELECT
        f.id,
        f.file_name,
        f.file_type,
        f.uploaded_at,
        COALESCE(a.first_name || ' ' || a.last_name, u.first_name || ' ' || u.last_name) as employee_name,
        i.task_name as item_name
      FROM onboarding_files f
      JOIN onboarding_items i ON f.onboarding_item_id = i.id
      JOIN onboarding_instances inst ON i.onboarding_instance_id = inst.id
      LEFT JOIN applicants a ON inst.applicant_id = a.id
      LEFT JOIN users u ON inst.employee_id = u.id
      WHERE f.organization_id = $1
        AND f.verified = FALSE
        AND f.rejected = FALSE
      ORDER BY f.uploaded_at ASC
      `,
      [organizationId]
    );

    return result.rows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      fileType: row.file_type,
      uploadedAt: row.uploaded_at,
      employeeName: row.employee_name,
      itemName: row.item_name
    }));
  }

  /**
   * Upload to Google Cloud Storage
   */
  private async uploadToGCS(
    fileName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ url: string }> {
    if (!this.storage) {
      throw new Error('Cloud storage not initialized');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType
      },
      public: false
    });

    // Generate signed URL (valid for 7 days)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    return { url: signedUrl };
  }

  /**
   * Log audit action
   */
  private async logAuditAction(
    instanceId: string | null,
    itemId: string | null,
    action: string,
    details: object,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await pool.query(
        `
        INSERT INTO onboarding_audit_log (
          onboarding_instance_id,
          onboarding_item_id,
          action,
          action_details,
          performed_by,
          performed_at,
          ip_address,
          user_agent
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
        `,
        [instanceId, itemId, action, JSON.stringify(details), performedBy, ipAddress, userAgent]
      );
    } catch (error) {
      logger.error('[OnboardingUpload] Error logging audit action:', error);
    }
  }
}

export const onboardingUploadService = new OnboardingUploadService();
