/**
 * Public Routes
 * Unauthenticated public-facing endpoints
 *
 * @module api/routes/public
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { publicRateLimiter } from '../../middleware/rate-limiter';
import { getDbClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { getEmailService } from '../../services/notifications/email.service';
import contentRouter from './content';

const router = Router();
const logger = createLogger('public-api');

// Apply lenient rate limiting to public routes
router.use(publicRateLimiter);

// Default organization ID (first org in system - Serenity Care Partners)
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

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
      firstName,
      lastName,
      email,
      phone,
      address,
      jobId,
      availability,
      hasLicense,
      consent
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !jobId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Missing required fields: firstName, lastName, email, phone, jobId',
      });
    }

    if (!consent) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Consent is required to submit application',
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
    const applicationId = uuidv4();

    // Store application in database
    await db.insert('applicants', {
      id: applicationId,
      organization_id: DEFAULT_ORG_ID,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address: address || '',
      position_applied_for: jobId,
      application_date: new Date(),
      source: 'website',
      availability: availability || 'full-time',
      has_license: hasLicense || false,
      status: 'new',
      current_stage: 'application_received',
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info('Application submitted successfully', {
      applicationId,
      email,
      jobId,
      organizationId: DEFAULT_ORG_ID
    });

    // Send confirmation emails (non-blocking)
    // Don't wait for emails to send - return success immediately
    setImmediate(async () => {
      try {
        // Fetch job title for email
        const jobResult = await db.query(
          'SELECT title FROM job_requisitions WHERE id = $1',
          [jobId]
        );

        const jobTitle = jobResult.rows[0]?.title || 'Home Health Position';
        const emailService = getEmailService();

        // Send confirmation email to applicant
        await emailService.sendApplicationConfirmation({
          applicantName: `${firstName} ${lastName}`,
          applicantEmail: email,
          jobTitle,
          applicationId,
          submittedAt: new Date().toISOString()
        });

        // Send alert email to HR
        await emailService.sendNewApplicationAlert({
          applicantName: `${firstName} ${lastName}`,
          applicantEmail: email,
          applicantPhone: phone,
          jobTitle,
          applicationId,
          submittedAt: new Date().toISOString(),
          experience: hasLicense ? 'Licensed caregiver' : 'Not specified',
          availability: availability || 'full-time'
        });

        logger.info('Application confirmation emails sent', { applicationId });
      } catch (emailError) {
        // Log email errors but don't fail the application submission
        logger.error('Failed to send application emails', {
          applicationId,
          error: emailError
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: applicationId,
    });
  } catch (error) {
    logger.error('Error submitting application', { error });
    next(error);
  }
});

/**
 * Mount Content Management Routes
 * Public endpoints for website content
 */
router.use('/content', contentRouter);

export { router as publicRouter };
