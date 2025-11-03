/**
 * Public Routes
 * Unauthenticated public-facing endpoints
 *
 * @module api/routes/public
 */

import { Router, Request, Response } from 'express';
import { publicRateLimiter } from '../../middleware/rate-limiter';

const router = Router();

// Apply lenient rate limiting to public routes
router.use(publicRateLimiter);

/**
 * GET /api/public/careers/jobs
 * Get all active job listings
 */
router.get('/careers/jobs', async (req: Request, res: Response, next) => {
  try {
    // TODO: Fetch from database
    res.json({
      jobs: [
        {
          id: 'job-1',
          title: 'Home Health Aide (HHA)',
          type: 'caregiver',
          description: 'Provide compassionate care to clients in their homes',
          payRange: '$15-18/hour',
          requirements: ['HHA certification', 'Clean background check', 'Valid driver\'s license'],
          postedAt: new Date().toISOString(),
        },
        {
          id: 'job-2',
          title: 'Licensed Practical Nurse (LPN)',
          type: 'nurse',
          description: 'Deliver skilled nursing care to clients',
          payRange: '$22-26/hour',
          requirements: ['Active LPN license', 'Clean background check', 'Reliable transportation'],
          postedAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/public/careers/apply
 * Submit a job application
 */
router.post('/careers/apply', async (req: Request, res: Response, next) => {
  try {
    const { firstName, lastName, email, phone, role, availability, consent } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !role) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Missing required fields',
      });
    }

    if (!consent) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Consent is required to submit application',
      });
    }

    // TODO: Store application in database
    // TODO: Send confirmation email

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: `app-${Date.now()}`,
    });
  } catch (error) {
    next(error);
  }
});

export { router as publicRouter };
