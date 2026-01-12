/**
 * Public Intake Routes
 * Unauthenticated endpoints for client self-service intake form
 *
 * @module api/public/intake
 */
import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { publicRateLimiter } from '../middleware/rate-limiter';
import { getDbClient } from '../../database/client';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('public-intake');

// Apply rate limiting
router.use(publicRateLimiter);

// Default organization ID (Serenity Care Partners)
const DEFAULT_ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039';

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

/**
 * POST /api/public/intake/verify-code
 * Verify an access code is valid
 */
router.post('/verify-code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Access code is required',
      });
    }

    const db = getDbClient();
    const normalizedCode = code.toUpperCase().trim();

    // First check if it's an email-based access code
    const emailCodeResult = await db.query(`
      SELECT id, code, client_email, client_name, expires_at, status, organization_id
      FROM intake_access_codes
      WHERE code = $1 AND status IN ('pending', 'sent')
    `, [normalizedCode]);

    if (emailCodeResult.rowCount && emailCodeResult.rowCount > 0) {
      const accessCode = emailCodeResult.rows[0];

      // Check if expired
      if (new Date(accessCode.expires_at) < new Date()) {
        // Mark as expired
        await db.query(`
          UPDATE intake_access_codes SET status = 'expired', updated_at = NOW()
          WHERE id = $1
        `, [accessCode.id]);

        return res.status(400).json({
          success: false,
          error: 'This access code has expired. Please contact us for a new code.',
        });
      }

      logger.info('Email access code verified', { codeId: accessCode.id });

      return res.json({
        success: true,
        codeType: 'email',
        codeId: accessCode.id,
        clientName: accessCode.client_name,
        clientEmail: accessCode.client_email,
      });
    }

    // Check if it's the universal phone code
    const phoneCodeResult = await db.query(`
      SELECT code, expires_at, organization_id
      FROM intake_phone_codes
      WHERE code = $1
    `, [normalizedCode]);

    if (phoneCodeResult.rowCount && phoneCodeResult.rowCount > 0) {
      const phoneCode = phoneCodeResult.rows[0];

      // Check if expired
      if (phoneCode.expires_at && new Date(phoneCode.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'This access code has expired. Please contact us for a new code.',
        });
      }

      logger.info('Phone access code verified');

      return res.json({
        success: true,
        codeType: 'phone',
      });
    }

    // Code not found
    logger.warn('Invalid access code attempted', { code: normalizedCode });
    return res.status(400).json({
      success: false,
      error: 'Invalid access code. Please check your code and try again.',
    });
  } catch (error) {
    logger.error('Error verifying access code', { error });
    next(error);
  }
});

/**
 * POST /api/public/intake/submit
 * Submit the intake form
 */
router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, formData } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Access code is required',
      });
    }

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'Form data is required',
      });
    }

    const db = getDbClient();
    const normalizedCode = code.toUpperCase().trim();

    let organizationId = DEFAULT_ORG_ID;
    let accessCodeId: string | null = null;

    // Verify the code first
    // Check email-based code
    const emailCodeResult = await db.query(`
      SELECT id, organization_id, status, expires_at
      FROM intake_access_codes
      WHERE code = $1 AND status IN ('pending', 'sent')
    `, [normalizedCode]);

    if (emailCodeResult.rowCount && emailCodeResult.rowCount > 0) {
      const accessCode = emailCodeResult.rows[0];

      // Check if expired
      if (new Date(accessCode.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'This access code has expired.',
        });
      }

      organizationId = accessCode.organization_id;
      accessCodeId = accessCode.id;
    } else {
      // Check phone code
      const phoneCodeResult = await db.query(`
        SELECT organization_id, expires_at
        FROM intake_phone_codes
        WHERE code = $1
      `, [normalizedCode]);

      if (phoneCodeResult.rowCount && phoneCodeResult.rowCount > 0) {
        const phoneCode = phoneCodeResult.rows[0];
        if (phoneCode.expires_at && new Date(phoneCode.expires_at) < new Date()) {
          return res.status(400).json({
            success: false,
            error: 'This access code has expired.',
          });
        }
        organizationId = phoneCode.organization_id;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid access code.',
        });
      }
    }

    // Generate reference token
    const referenceToken = generateReferenceToken();

    // Validate and flag data issues
    const dataFlags = validateFormData(formData);

    // Insert submission
    const submissionResult = await db.query(`
      INSERT INTO intake_submissions (
        organization_id, access_code_id, reference_token, form_data, data_flags, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, reference_token
    `, [organizationId, accessCodeId, referenceToken, JSON.stringify(formData), JSON.stringify(dataFlags)]);

    const submission = submissionResult.rows[0];

    // If email code, mark as used
    if (accessCodeId) {
      await db.query(`
        UPDATE intake_access_codes
        SET status = 'used', used_at = NOW(), submission_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [submission.id, accessCodeId]);
    }

    logger.info('Intake form submitted successfully', {
      submissionId: submission.id,
      referenceToken: submission.reference_token,
      organizationId,
      hasAccessCodeId: !!accessCodeId,
      flagCount: dataFlags.length,
    });

    res.json({
      success: true,
      referenceToken: submission.reference_token,
      message: 'Your intake form has been submitted successfully. A care coordinator will contact you within 1-2 business days.',
    });
  } catch (error) {
    logger.error('Error submitting intake form', { error });
    next(error);
  }
});

/**
 * Validate form data and return any flags/warnings
 */
function validateFormData(formData: any): { field: string; message: string; severity: 'warning' | 'info' }[] {
  const flags: { field: string; message: string; severity: 'warning' | 'info' }[] = [];

  try {
    // Age validation
    if (formData.contact?.dateOfBirth) {
      const dob = new Date(formData.contact.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      if (age < 18) {
        flags.push({
          field: 'dateOfBirth',
          message: `Patient is a minor (age ${age}). Verify guardian information.`,
          severity: 'warning',
        });
      }
      if (age > 100) {
        flags.push({
          field: 'dateOfBirth',
          message: `Verify date of birth - patient would be ${age} years old.`,
          severity: 'warning',
        });
      }
    }

    // Phone number duplicate check
    if (formData.contact?.primaryPhone && formData.emergencyContacts?.[0]?.phone) {
      if (formData.contact.primaryPhone === formData.emergencyContacts[0].phone) {
        flags.push({
          field: 'emergencyPhone',
          message: 'Emergency contact phone is the same as patient phone.',
          severity: 'warning',
        });
      }
    }

    // Ohio service area check
    if (formData.address?.state && formData.address.state !== 'OH') {
      flags.push({
        field: 'state',
        message: `Address is in ${formData.address.state}, outside Ohio service area.`,
        severity: 'warning',
      });
    }

    // Missing physician info
    if (!formData.medical?.primaryPhysician) {
      flags.push({
        field: 'primaryPhysician',
        message: 'No primary physician listed. Follow up to obtain.',
        severity: 'info',
      });
    }

    // Missing email
    if (!formData.contact?.email) {
      flags.push({
        field: 'email',
        message: 'No email address provided. Phone will be primary contact method.',
        severity: 'info',
      });
    }

    // Check consent completeness
    if (!formData.consent?.consentToServices) {
      flags.push({
        field: 'consent',
        message: 'Services consent not checked. May need follow-up.',
        severity: 'warning',
      });
    }

    // Emergency contact authorization
    if (formData.emergencyContacts?.[0] && !formData.emergencyContacts[0].isAuthorizedRepresentative) {
      flags.push({
        field: 'emergencyContact',
        message: 'Emergency contact not marked as authorized representative.',
        severity: 'info',
      });
    }
  } catch (e) {
    logger.warn('Error during form validation', { error: e });
  }

  return flags;
}

/**
 * GET /api/public/intake/status/:referenceToken
 * Check submission status by reference token
 */
router.get('/status/:referenceToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceToken } = req.params;

    const db = getDbClient();
    const result = await db.query(`
      SELECT status, created_at
      FROM intake_submissions
      WHERE reference_token = $1
    `, [referenceToken]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    const submission = result.rows[0];

    res.json({
      success: true,
      status: submission.status,
      submittedAt: submission.created_at,
      statusMessage: getStatusMessage(submission.status),
    });
  } catch (error) {
    logger.error('Error checking submission status', { error });
    next(error);
  }
});

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Your submission is being reviewed by our care team.';
    case 'reviewed':
      return 'Your submission has been reviewed. A care coordinator will contact you soon.';
    case 'imported':
      return 'Your information has been processed and a care plan is being developed.';
    case 'rejected':
      return 'Please contact our office for more information about your submission.';
    default:
      return 'Status unknown';
  }
}

export default router;
