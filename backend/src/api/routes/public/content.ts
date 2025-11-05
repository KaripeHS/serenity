/**
 * Public Content API Routes
 * Serves published content to the public website (no authentication required)
 */

import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// ============================================================================
// PUBLIC PAGES
// ============================================================================

/**
 * GET /api/public/content/pages/:slug
 * Get a published page with its sections by slug
 */
router.get('/pages/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    // Get page - only published pages
    const pageResult = await (req as any).db.query(
      `SELECT * FROM pages
       WHERE page_slug = $1 AND published = true
       ORDER BY updated_at DESC
       LIMIT 1`,
      [slug]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    const page = pageResult.rows[0];

    // Get sections - only published sections
    const sectionsResult = await (req as any).db.query(
      `SELECT * FROM page_sections
       WHERE page_id = $1 AND published = true
       ORDER BY position`,
      [page.id]
    );

    res.json({
      success: true,
      data: {
        ...page,
        sections: sectionsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/content/pages
 * List all published pages
 */
router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await (req as any).db.query(
      `SELECT page_slug, page_title, meta_description
       FROM pages
       WHERE published = true
       ORDER BY page_slug`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PUBLIC TEAM MEMBERS
// ============================================================================

/**
 * GET /api/public/content/team-members
 * Get published team members
 */
router.get('/team-members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { featured } = req.query;

    let query = `SELECT * FROM team_members WHERE published = true`;
    const params: any[] = [];

    if (featured === 'true') {
      query += ` AND featured = true`;
    }

    query += ` ORDER BY display_order, full_name`;

    const result = await (req as any).db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PUBLIC TESTIMONIALS
// ============================================================================

/**
 * GET /api/public/content/testimonials
 * Get published testimonials
 */
router.get('/testimonials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { featured, limit } = req.query;

    let query = `SELECT * FROM testimonials WHERE published = true`;
    const params: any[] = [];

    if (featured === 'true') {
      query += ` AND featured = true`;
    }

    query += ` ORDER BY display_order, created_at DESC`;

    if (limit) {
      const limitNum = parseInt(limit as string);
      if (!isNaN(limitNum) && limitNum > 0) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limitNum);
      }
    }

    const result = await (req as any).db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PUBLIC SERVICES
// ============================================================================

/**
 * GET /api/public/content/services
 * Get published services
 */
router.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { featured } = req.query;

    let query = `SELECT * FROM services WHERE published = true`;
    const params: any[] = [];

    if (featured === 'true') {
      query += ` AND featured = true`;
    }

    query += ` ORDER BY display_order, service_name`;

    const result = await (req as any).db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/content/services/:slug
 * Get a specific service by slug
 */
router.get('/services/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await (req as any).db.query(
      `SELECT * FROM services
       WHERE service_slug = $1 AND published = true
       LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PUBLIC ORGANIZATION SETTINGS
// ============================================================================

/**
 * GET /api/public/content/settings
 * Get organization settings (public info only)
 */
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the first organization's settings
    // In a multi-tenant setup, you'd need to identify the organization
    const result = await (req as any).db.query(
      `SELECT
        primary_phone,
        primary_email,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        business_hours,
        patient_satisfaction_rate,
        total_pods,
        years_of_experience,
        cities_served,
        total_caregivers,
        total_clients_served,
        facebook_url,
        twitter_url,
        linkedin_url,
        instagram_url,
        privacy_policy_url,
        terms_of_service_url
       FROM organization_settings
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
