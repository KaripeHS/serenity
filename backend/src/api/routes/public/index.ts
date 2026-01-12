/**
 * Public Routes
 * Unauthenticated public-facing endpoints
 *
 * @module api/routes/public
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { publicRateLimiter } from '../../middleware/rate-limiter';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';
import { getEmailService } from '../../../services/notifications/email.service';
import { UserContext } from '../../../auth/access-control';

const router = Router();
const logger = createLogger('public-api');

// Apply lenient rate limiting to public routes
router.use(publicRateLimiter);

import leadsRouter from '../../public/leads.routes';
import referralsRouter from '../../public/referrals.routes';
import intakeRouter from '../../public/intake.routes';

router.use('/leads', leadsRouter);
router.use('/referrals', referralsRouter);
router.use('/intake', intakeRouter);

// Default organization ID (first org in system - Serenity Care Partners)
const DEFAULT_ORG_ID = 'acdf0560-4c26-47ad-a38d-2b2153fcb039'; // Serenity Care Partners

/**
 * Generate a short, phone-friendly application ID
 * Format: APP-YYYYMMDD-XXX (e.g., APP-20251229-A7K)
 */
function generateShortApplicationId(): string {
  const now = new Date();
  // Convert to EST (Ohio timezone)
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  // Generate 3-character alphanumeric suffix (base36: 0-9, A-Z)
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `APP-${year}${month}${day}-${suffix}`;
}

/**
 * Format date to EST timezone for Ohio
 */
function formatToEST(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'long',
    timeStyle: 'short'
  });
}

/**
 * GET /api/public/careers/jobs
 * Get all active job listings
 */
router.get('/careers/jobs', async (req: Request, res: Response, next) => {
  try {
    const db = getDbClient();

    const result = await db.query(
      `SELECT
        id,
        title,
        job_type,
        description,
        pay_range,
        requirements,
        posted_at,
        location
      FROM job_requisitions
      WHERE status = $1 AND organization_id = $2
      ORDER BY posted_at DESC`,
      ['active', DEFAULT_ORG_ID]
    );

    logger.info('Fetched job listings', {
      count: result.rows.length,
      organizationId: DEFAULT_ORG_ID
    });

    res.json({
      jobs: result.rows.map(job => ({
        id: job.id,
        title: job.title,
        type: job.job_type,
        description: job.description,
        payRange: job.pay_range,
        requirements: job.requirements || [],
        postedAt: job.posted_at,
        location: job.location || 'Ohio'
      }))
    });
  } catch (error) {
    logger.error('Error fetching job listings', { error });
    next(error);
  }
});

/**
 * POST /api/public/careers/apply
 * Submit a job application
 */
router.post('/careers/apply', async (req: Request, res: Response, next) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      licenseType,
      availability,
      preferredCity,
      desiredPayRange,
      shiftPreference,
      overtimeAvailable,
      willingToTravel,
      priorExperience,
      resume
    } = req.body;

    // Parse full name into first/last
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Validation
    if (!name || !email || !phone || !position) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Missing required fields: name, email, phone, position',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid email format',
      });
    }

    const db = getDbClient();
    const shortApplicationId = generateShortApplicationId();
    const submittedAtEST = formatToEST(new Date());

    // Build availability JSON object
    const availabilityData = {
      type: availability || 'full-time',
      shift: shiftPreference || '',
      overtime: overtimeAvailable || '',
      travel: willingToTravel || '',
      preferredCity: preferredCity || ''
    };

    // Build skills array from prior experience
    const skills: string[] = [];
    if (priorExperience && priorExperience.toLowerCase() !== 'no prior experience') {
      skills.push('Prior healthcare experience');
    }
    if (licenseType && licenseType !== 'N/A') {
      skills.push(licenseType);
    }

    // Determine experience level based on prior experience
    let experienceLevel = 'entry';
    if (priorExperience && priorExperience.length > 50) {
      experienceLevel = 'junior'; // Detailed experience suggests some background
    }

    // Store application in database (let database generate UUID for id)
    await db.insert('applicants', {
      organization_id: DEFAULT_ORG_ID,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address: '', // Not collected in form
      position_applied_for: position,
      application_date: new Date(),
      source: 'website',

      // Enhanced fields from new form
      availability: availabilityData,
      experience_level: experienceLevel,
      certifications: licenseType && licenseType !== 'N/A' ? [licenseType] : [],
      skills,

      // Salary expectations
      desired_salary_min: desiredPayRange ? parsePayRange(desiredPayRange).min : null,
      desired_salary_max: desiredPayRange ? parsePayRange(desiredPayRange).max : null,

      // Resume file handling (if uploaded)
      resume_file_id: resume ? await handleResumeUpload(resume) : null,

      // Parsed resume data includes all optional fields
      parsed_resume_data: {
        priorExperience: priorExperience || '',
        shiftPreference: shiftPreference || '',
        overtimeAvailable: overtimeAvailable || '',
        willingToTravel: willingToTravel || '',
        preferredCity: preferredCity || '',
        licenseType: licenseType || ''
      },

      // Application status
      status: 'new',
      current_stage: 'application',

      // Timestamps
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info('Application submitted successfully', {
      applicationId: shortApplicationId,
      email,
      position,
      organizationId: DEFAULT_ORG_ID
    });

    // Send confirmation emails (non-blocking)
    // Don't wait for emails to send - return success immediately
    setImmediate(async () => {
      try {
        const emailService = getEmailService();

        // Send confirmation email to applicant
        await emailService.sendApplicationConfirmation({
          applicantName: name,
          applicantEmail: email,
          jobTitle: position,
          applicationId: shortApplicationId,
          submittedAt: submittedAtEST  // Already formatted to EST
        });

        // Send alert email to HR with all decision-making data
        await emailService.sendNewApplicationAlert({
          applicantName: name,
          applicantEmail: email,
          applicantPhone: phone,
          jobTitle: position,
          applicationId: shortApplicationId,
          submittedAt: submittedAtEST,  // Already formatted to EST
          experience: priorExperience || 'Not specified',
          availability: availability || 'Full-time',
          // additionalInfo: {
          //   licenseType: licenseType || 'None',
          //   preferredCity: preferredCity || 'Any',
          //   desiredPayRange: desiredPayRange || 'Not specified',
          //   shiftPreference: shiftPreference || 'Flexible',
          //   overtimeAvailable: overtimeAvailable || 'Not specified',
          //   willingToTravel: willingToTravel || 'Not specified'
          // }
        });

        logger.info('Application confirmation emails sent', { applicationId: shortApplicationId });
      } catch (emailError) {
        // Log email errors but don't fail the application submission
        logger.error('Failed to send application emails', {
          applicationId: shortApplicationId,
          error: emailError
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: shortApplicationId,
    });
  } catch (error) {
    logger.error('Error submitting application', { error });
    next(error);
  }
});

// Helper functions
function parsePayRange(rangeString: string): { min: number | null; max: number | null } {
  if (!rangeString) return { min: null, max: null };

  // Handle ranges like "$15-$18/hour", "$42+/hour"
  const match = rangeString.match(/\$(\d+)(?:-\$(\d+))?/);
  if (!match) return { min: null, max: null };

  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : null;

  return { min, max };
}

async function handleResumeUpload(resumeData: any): Promise<string | null> {
  // In production, this would upload to S3 or file storage
  // For now, return a placeholder
  // TODO: Implement actual resume file upload to storage
  return null;
}

export { router as publicRouter };
