/**
 * Intake Access Code Routes (Console/Admin)
 * API endpoints for managing client intake access codes and invitations
 *
 * @module api/routes/console/intake
 */
import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import { getEmailService } from '../../../services/notifications/email.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('intake-routes');

// All routes require authentication
router.use(requireAuth);

/**
 * Generate a secure access code
 * Format: INTAKE-XXXXXX (6 alphanumeric characters)
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `INTAKE-${code}`;
}

/**
 * Generate a reference token for submissions
 * Format: REF-YYYYMMDD-XXXX
 */
function generateReferenceToken(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${year}${month}${day}-${suffix}`;
}

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/console/intake/dashboard
 * Get intake invitation dashboard with stats
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const db = getDbClient();

    // Get stats
    const [codesResult, submissionsResult, phoneCodeResult] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_codes,
          COUNT(*) FILTER (WHERE status = 'sent') as sent_codes,
          COUNT(*) FILTER (WHERE status = 'used') as used_codes,
          COUNT(*) FILTER (WHERE status = 'expired') as expired_codes,
          COUNT(*) as total_codes
        FROM intake_access_codes
        WHERE organization_id = $1
      `, [organizationId]),
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
          COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_submissions,
          COUNT(*) FILTER (WHERE status = 'imported') as imported_submissions,
          COUNT(*) as total_submissions
        FROM intake_submissions
        WHERE organization_id = $1
      `, [organizationId]),
      db.query(`
        SELECT code, expires_at
        FROM intake_phone_codes
        WHERE organization_id = $1
      `, [organizationId]),
    ]);

    // Get recent invitations
    const recentInvitations = await db.query(`
      SELECT
        id, code, code_type, client_email, client_name, client_phone,
        status, expires_at, created_at, used_at
      FROM intake_access_codes
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [organizationId]);

    // Get pending submissions
    const pendingSubmissions = await db.query(`
      SELECT
        id, reference_token, form_data, data_flags, status, created_at
      FROM intake_submissions
      WHERE organization_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 20
    `, [organizationId]);

    res.json({
      success: true,
      stats: {
        codes: codesResult.rows[0],
        submissions: submissionsResult.rows[0],
      },
      phoneCode: phoneCodeResult.rows[0] || null,
      recentInvitations: recentInvitations.rows,
      pendingSubmissions: pendingSubmissions.rows,
    });
  } catch (error) {
    logger.error('Failed to get intake dashboard', { error });
    next(error);
  }
});

// ============================================================
// ACCESS CODE MANAGEMENT
// ============================================================

/**
 * POST /api/console/intake/send-invitation
 * Send an intake invitation with access code via email
 */
router.post('/send-invitation', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { clientEmail, clientName, clientPhone, expiresInHours = 72 } = req.body;

    if (!clientEmail) {
      throw ApiErrors.badRequest('Client email is required');
    }

    const db = getDbClient();

    // Generate unique access code
    const code = generateAccessCode();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Insert access code
    const result = await db.query(`
      INSERT INTO intake_access_codes (
        organization_id, code, code_type, client_email, client_name, client_phone,
        status, expires_at, created_by
      ) VALUES ($1, $2, 'email', $3, $4, $5, 'pending', $6, $7)
      RETURNING id, code, expires_at
    `, [organizationId, code, clientEmail, clientName || null, clientPhone || null, expiresAt, userId]);

    const accessCode = result.rows[0];

    // Send email with invitation
    try {
      const emailService = getEmailService();
      const intakeUrl = `https://serenitycarepartners.com/client-intake?code=${code}`;

      await emailService.sendEmail({
        to: clientEmail,
        subject: 'Complete Your Care Intake Form - Serenity Care Partners',
        text: `Welcome${clientName ? `, ${clientName}` : ''}!\n\nYou've been invited to complete our Client Intake Form.\n\nYour Secure Access Code: ${code}\n\nThis code expires in ${expiresInHours} hours.\n\nClick here to start: ${intakeUrl}\n\nIf you have questions, call us at (513) 400-5113.\n\nYour information is protected and secure. We comply with all HIPAA privacy requirements.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #3b82f6; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Serenity Care Partners</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">Welcome${clientName ? `, ${clientName}` : ''}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You've been invited to complete our Client Intake Form. This secure form will help us
                understand your care needs and prepare for our first meeting.
              </p>

              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Your Secure Access Code:</p>
                <p style="font-size: 28px; font-weight: bold; color: #3b82f6; letter-spacing: 2px; margin: 0; font-family: monospace;">
                  ${code}
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                  This code expires in ${expiresInHours} hours
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${intakeUrl}"
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px;
                          text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Start Your Intake Form
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${intakeUrl}" style="color: #3b82f6;">${intakeUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

              <p style="color: #9ca3af; font-size: 12px;">
                Your information is protected and secure. We comply with all HIPAA privacy requirements.
                If you have questions, call us at (513) 400-5113.
              </p>
            </div>
          </div>
        `,
      });

      // Update status to 'sent'
      await db.query(`
        UPDATE intake_access_codes
        SET status = 'sent', updated_at = NOW()
        WHERE id = $1
      `, [accessCode.id]);

      logger.info('Intake invitation sent successfully', {
        codeId: accessCode.id,
        clientEmail,
        organizationId,
      });

      res.json({
        success: true,
        message: 'Invitation sent successfully',
        accessCode: {
          id: accessCode.id,
          code: accessCode.code,
          expiresAt: accessCode.expires_at,
        },
      });
    } catch (emailError) {
      logger.error('Failed to send intake invitation email', { error: emailError });
      // Still return success with the code, but note email failed
      res.json({
        success: true,
        message: 'Code created but email failed to send. Please share the code manually.',
        accessCode: {
          id: accessCode.id,
          code: accessCode.code,
          expiresAt: accessCode.expires_at,
        },
        emailSent: false,
      });
    }
  } catch (error) {
    logger.error('Failed to create intake invitation', { error });
    next(error);
  }
});

/**
 * GET /api/console/intake/invitations
 * Get list of all invitations/access codes
 */
router.get('/invitations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const db = getDbClient();

    let query = `
      SELECT
        iac.id, iac.code, iac.code_type, iac.client_email, iac.client_name,
        iac.client_phone, iac.status, iac.expires_at, iac.used_at,
        iac.created_at, iac.submission_id,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM intake_access_codes iac
      LEFT JOIN users u ON iac.created_by = u.id
      WHERE iac.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (status) {
      params.push(status);
      query += ` AND iac.status = $${params.length}`;
    }

    query += ` ORDER BY iac.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await db.query(query, params);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM intake_access_codes
      WHERE organization_id = $1
      ${status ? `AND status = '${status}'` : ''}
    `, [organizationId]);

    res.json({
      success: true,
      invitations: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    logger.error('Failed to get invitations', { error });
    next(error);
  }
});

/**
 * POST /api/console/intake/revoke/:id
 * Revoke an access code
 */
router.post('/revoke/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const db = getDbClient();

    const result = await db.query(`
      UPDATE intake_access_codes
      SET status = 'revoked', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND status IN ('pending', 'sent')
      RETURNING id
    `, [id, organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Access code not found or cannot be revoked');
    }

    res.json({
      success: true,
      message: 'Access code revoked',
    });
  } catch (error) {
    logger.error('Failed to revoke access code', { error });
    next(error);
  }
});

/**
 * POST /api/console/intake/resend/:id
 * Resend invitation email for an existing code
 */
router.post('/resend/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const db = getDbClient();

    // Get the access code
    const result = await db.query(`
      SELECT id, code, client_email, client_name, expires_at, status
      FROM intake_access_codes
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Access code not found');
    }

    const accessCode = result.rows[0];

    if (accessCode.status === 'used') {
      throw ApiErrors.badRequest('This code has already been used');
    }

    if (!accessCode.client_email) {
      throw ApiErrors.badRequest('No email address associated with this code');
    }

    // Check if expired, extend if so
    let newExpiresAt = accessCode.expires_at;
    if (new Date(accessCode.expires_at) < new Date()) {
      newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // Extend 72 hours
      await db.query(`
        UPDATE intake_access_codes
        SET expires_at = $1, status = 'sent', updated_at = NOW()
        WHERE id = $2
      `, [newExpiresAt, id]);
    }

    // Resend email
    const emailService = getEmailService();
    const intakeUrl = `https://serenitycarepartners.com/client-intake?code=${accessCode.code}`;

    await emailService.sendEmail({
      to: accessCode.client_email,
      subject: 'Reminder: Complete Your Care Intake Form - Serenity Care Partners',
      text: `Reminder: Complete Your Intake Form\n\nThis is a friendly reminder to complete your Client Intake Form.\n\nYour Secure Access Code: ${accessCode.code}\n\nClick here to start: ${intakeUrl}\n\nQuestions? Call us at (513) 400-5113.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Serenity Care Partners</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Reminder: Complete Your Intake Form</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              This is a friendly reminder to complete your Client Intake Form.
            </p>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Your Secure Access Code:</p>
              <p style="font-size: 28px; font-weight: bold; color: #3b82f6; letter-spacing: 2px; margin: 0; font-family: monospace;">
                ${accessCode.code}
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${intakeUrl}"
                 style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Complete Your Form
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px;">
              Questions? Call us at (513) 400-5113.
            </p>
          </div>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'Reminder email sent successfully',
    });
  } catch (error) {
    logger.error('Failed to resend invitation', { error });
    next(error);
  }
});

// ============================================================
// PHONE CODE MANAGEMENT
// ============================================================

/**
 * GET /api/console/intake/phone-code
 * Get the universal phone code for this organization
 */
router.get('/phone-code', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const db = getDbClient();
    const result = await db.query(`
      SELECT code, expires_at, updated_at
      FROM intake_phone_codes
      WHERE organization_id = $1
    `, [organizationId]);

    res.json({
      success: true,
      phoneCode: result.rows[0] || null,
    });
  } catch (error) {
    logger.error('Failed to get phone code', { error });
    next(error);
  }
});

/**
 * POST /api/console/intake/phone-code
 * Create or update the universal phone code
 */
router.post('/phone-code', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { code, expiresInDays = 365 } = req.body;

    if (!code || code.length < 6) {
      throw ApiErrors.badRequest('Code must be at least 6 characters');
    }

    const db = getDbClient();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Upsert the phone code
    await db.query(`
      INSERT INTO intake_phone_codes (organization_id, code, expires_at, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (organization_id)
      DO UPDATE SET code = $2, expires_at = $3, updated_at = NOW()
    `, [organizationId, code.toUpperCase(), expiresAt, userId]);

    res.json({
      success: true,
      message: 'Phone code updated successfully',
      phoneCode: {
        code: code.toUpperCase(),
        expiresAt,
      },
    });
  } catch (error) {
    logger.error('Failed to update phone code', { error });
    next(error);
  }
});

// ============================================================
// SUBMISSIONS MANAGEMENT
// ============================================================

/**
 * GET /api/console/intake/submissions
 * Get list of intake form submissions
 */
router.get('/submissions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const db = getDbClient();

    let query = `
      SELECT
        s.id, s.reference_token, s.form_data, s.data_flags, s.status,
        s.created_at, s.reviewed_at, s.review_notes,
        s.imported_client_id, s.imported_patient_id,
        iac.client_email, iac.client_name, iac.code as access_code,
        u.first_name || ' ' || u.last_name as reviewed_by_name
      FROM intake_submissions s
      LEFT JOIN intake_access_codes iac ON s.access_code_id = iac.id
      LEFT JOIN users u ON s.reviewed_by = u.id
      WHERE s.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await db.query(query, params);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM intake_submissions
      WHERE organization_id = $1
      ${status ? `AND status = '${status}'` : ''}
    `, [organizationId]);

    res.json({
      success: true,
      submissions: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    logger.error('Failed to get submissions', { error });
    next(error);
  }
});

/**
 * GET /api/console/intake/submissions/:id
 * Get a specific submission with full details
 */
router.get('/submissions/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const db = getDbClient();

    const result = await db.query(`
      SELECT
        s.*,
        iac.client_email, iac.client_name, iac.client_phone, iac.code as access_code,
        u.first_name || ' ' || u.last_name as reviewed_by_name
      FROM intake_submissions s
      LEFT JOIN intake_access_codes iac ON s.access_code_id = iac.id
      LEFT JOIN users u ON s.reviewed_by = u.id
      WHERE s.id = $1 AND s.organization_id = $2
    `, [id, organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Submission not found');
    }

    res.json({
      success: true,
      submission: result.rows[0],
    });
  } catch (error) {
    logger.error('Failed to get submission', { error });
    next(error);
  }
});

/**
 * POST /api/console/intake/submissions/:id/review
 * Mark a submission as reviewed
 */
router.post('/submissions/:id/review', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId) {
      throw ApiErrors.unauthorized('Organization context required');
    }

    const { id } = req.params;
    const { notes } = req.body;

    const db = getDbClient();

    const result = await db.query(`
      UPDATE intake_submissions
      SET status = 'reviewed', reviewed_by = $1, reviewed_at = NOW(),
          review_notes = $2, updated_at = NOW()
      WHERE id = $3 AND organization_id = $4
      RETURNING id
    `, [userId, notes || null, id, organizationId]);

    if (result.rowCount === 0) {
      throw ApiErrors.notFound('Submission not found');
    }

    res.json({
      success: true,
      message: 'Submission marked as reviewed',
    });
  } catch (error) {
    logger.error('Failed to review submission', { error });
    next(error);
  }
});

export default router;
