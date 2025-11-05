/**
 * Admin Content Management API Routes
 * Comprehensive CMS endpoints for managing public website content
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PageSchema = z.object({
  page_slug: z.string().min(1).max(100),
  page_title: z.string().min(1).max(200),
  hero_title: z.string().max(300).optional().nullable(),
  hero_subtitle: z.string().max(500).optional().nullable(),
  hero_cta_text: z.string().max(100).optional().nullable(),
  hero_cta_url: z.string().max(300).optional().nullable(),
  hero_image_url: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  meta_keywords: z.string().optional().nullable(),
  published: z.boolean().default(false),
});

const PageSectionSchema = z.object({
  page_id: z.string().uuid(),
  section_type: z.string().min(1).max(50),
  section_title: z.string().max(300).optional().nullable(),
  section_subtitle: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  content_format: z.enum(['markdown', 'html', 'plain']).default('markdown'),
  image_url: z.string().optional().nullable(),
  image_alt: z.string().optional().nullable(),
  background_color: z.string().max(50).optional().nullable(),
  cta_text: z.string().max(100).optional().nullable(),
  cta_url: z.string().max(300).optional().nullable(),
  position: z.number().int().default(0),
  published: z.boolean().default(true),
});

const TeamMemberSchema = z.object({
  full_name: z.string().min(1).max(200),
  title: z.string().max(200).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  bio: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  linkedin_url: z.string().max(300).optional().nullable(),
  display_order: z.number().int().default(0),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

const TestimonialSchema = z.object({
  quote: z.string().min(1),
  author_name: z.string().min(1).max(200),
  author_title: z.string().max(200).optional().nullable(),
  author_location: z.string().max(200).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  author_photo_url: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

const ServiceSchema = z.object({
  service_name: z.string().min(1).max(200),
  service_slug: z.string().min(1).max(100),
  short_description: z.string().max(500).optional().nullable(),
  full_description: z.string().optional().nullable(),
  icon_name: z.string().max(100).optional().nullable(),
  image_url: z.string().optional().nullable(),
  features: z.array(z.string()).default([]),
  starting_price: z.number().optional().nullable(),
  price_description: z.string().max(200).optional().nullable(),
  display_order: z.number().int().default(0),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

const OrganizationSettingsSchema = z.object({
  primary_phone: z.string().max(20).optional().nullable(),
  primary_email: z.string().email().optional().nullable(),
  address_line1: z.string().max(300).optional().nullable(),
  address_line2: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zip_code: z.string().max(10).optional().nullable(),
  business_hours: z.record(z.string()).optional().nullable(),
  patient_satisfaction_rate: z.number().int().min(0).max(100).optional().nullable(),
  total_pods: z.number().int().optional().nullable(),
  years_of_experience: z.number().int().optional().nullable(),
  cities_served: z.number().int().optional().nullable(),
  total_caregivers: z.number().int().optional().nullable(),
  total_clients_served: z.number().int().optional().nullable(),
  facebook_url: z.string().max(300).optional().nullable(),
  twitter_url: z.string().max(300).optional().nullable(),
  linkedin_url: z.string().max(300).optional().nullable(),
  instagram_url: z.string().max(300).optional().nullable(),
  privacy_policy_url: z.string().max(300).optional().nullable(),
  terms_of_service_url: z.string().max(300).optional().nullable(),
});

// ============================================================================
// PAGES CRUD
// ============================================================================

/**
 * GET /api/admin/content/pages
 * List all pages for the organization
 */
router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;

    const result = await (req as any).db.query(
      `SELECT p.*,
              u1.email as created_by_email,
              u2.email as updated_by_email,
              (SELECT COUNT(*) FROM page_sections WHERE page_id = p.id) as section_count
       FROM pages p
       LEFT JOIN users u1 ON p.created_by = u1.id
       LEFT JOIN users u2 ON p.updated_by = u2.id
       WHERE p.organization_id = $1
       ORDER BY p.page_slug`,
      [organizationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/content/pages/:pageId
 * Get a specific page with its sections
 */
router.get('/pages/:pageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { pageId } = req.params;

    // Get page
    const pageResult = await (req as any).db.query(
      'SELECT * FROM pages WHERE id = $1 AND organization_id = $2',
      [pageId, organizationId]
    );

    if (pageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    // Get sections
    const sectionsResult = await (req as any).db.query(
      'SELECT * FROM page_sections WHERE page_id = $1 ORDER BY position',
      [pageId]
    );

    res.json({
      success: true,
      data: {
        ...pageResult.rows[0],
        sections: sectionsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/content/pages
 * Create a new page
 */
router.post('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const validated = PageSchema.parse(req.body);

    const result = await (req as any).db.query(
      `INSERT INTO pages (
        organization_id, page_slug, page_title, hero_title, hero_subtitle,
        hero_cta_text, hero_cta_url, hero_image_url, meta_description,
        meta_keywords, published, created_by, updated_by,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        organizationId,
        validated.page_slug,
        validated.page_title,
        validated.hero_title,
        validated.hero_subtitle,
        validated.hero_cta_text,
        validated.hero_cta_url,
        validated.hero_image_url,
        validated.meta_description,
        validated.meta_keywords,
        validated.published,
        userId,
        userId,
        validated.published ? new Date() : null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/content/pages/:pageId
 * Update a page
 */
router.put('/pages/:pageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const { pageId } = req.params;
    const validated = PageSchema.parse(req.body);

    const result = await (req as any).db.query(
      `UPDATE pages SET
        page_slug = $1, page_title = $2, hero_title = $3, hero_subtitle = $4,
        hero_cta_text = $5, hero_cta_url = $6, hero_image_url = $7,
        meta_description = $8, meta_keywords = $9, published = $10,
        updated_by = $11, published_at = $12
      WHERE id = $13 AND organization_id = $14
      RETURNING *`,
      [
        validated.page_slug,
        validated.page_title,
        validated.hero_title,
        validated.hero_subtitle,
        validated.hero_cta_text,
        validated.hero_cta_url,
        validated.hero_image_url,
        validated.meta_description,
        validated.meta_keywords,
        validated.published,
        userId,
        validated.published ? new Date() : null,
        pageId,
        organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /api/admin/content/pages/:pageId
 * Delete a page (and its sections via CASCADE)
 */
router.delete('/pages/:pageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { pageId } = req.params;

    const result = await (req as any).db.query(
      'DELETE FROM pages WHERE id = $1 AND organization_id = $2 RETURNING id',
      [pageId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PAGE SECTIONS CRUD
// ============================================================================

/**
 * POST /api/admin/content/sections
 * Create a new page section
 */
router.post('/sections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const validated = PageSectionSchema.parse(req.body);

    // Verify page belongs to organization
    const pageCheck = await (req as any).db.query(
      'SELECT id FROM pages WHERE id = $1 AND organization_id = $2',
      [validated.page_id, organizationId]
    );

    if (pageCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    const result = await (req as any).db.query(
      `INSERT INTO page_sections (
        page_id, section_type, section_title, section_subtitle, content,
        content_format, image_url, image_alt, background_color, cta_text,
        cta_url, position, published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        validated.page_id,
        validated.section_type,
        validated.section_title,
        validated.section_subtitle,
        validated.content,
        validated.content_format,
        validated.image_url,
        validated.image_alt,
        validated.background_color,
        validated.cta_text,
        validated.cta_url,
        validated.position,
        validated.published,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/content/sections/:sectionId
 * Update a page section
 */
router.put('/sections/:sectionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { sectionId } = req.params;
    const validated = PageSectionSchema.parse(req.body);

    // Verify section belongs to organization (via page)
    const sectionCheck = await (req as any).db.query(
      `SELECT ps.id FROM page_sections ps
       JOIN pages p ON ps.page_id = p.id
       WHERE ps.id = $1 AND p.organization_id = $2`,
      [sectionId, organizationId]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    const result = await (req as any).db.query(
      `UPDATE page_sections SET
        section_type = $1, section_title = $2, section_subtitle = $3,
        content = $4, content_format = $5, image_url = $6, image_alt = $7,
        background_color = $8, cta_text = $9, cta_url = $10, position = $11,
        published = $12
      WHERE id = $13
      RETURNING *`,
      [
        validated.section_type,
        validated.section_title,
        validated.section_subtitle,
        validated.content,
        validated.content_format,
        validated.image_url,
        validated.image_alt,
        validated.background_color,
        validated.cta_text,
        validated.cta_url,
        validated.position,
        validated.published,
        sectionId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /api/admin/content/sections/:sectionId
 * Delete a page section
 */
router.delete('/sections/:sectionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { sectionId } = req.params;

    // Verify and delete
    const result = await (req as any).db.query(
      `DELETE FROM page_sections ps
       USING pages p
       WHERE ps.id = $1 AND ps.page_id = p.id AND p.organization_id = $2
       RETURNING ps.id`,
      [sectionId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TEAM MEMBERS CRUD
// ============================================================================

/**
 * GET /api/admin/content/team-members
 * List all team members
 */
router.get('/team-members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;

    const result = await (req as any).db.query(
      `SELECT * FROM team_members
       WHERE organization_id = $1
       ORDER BY display_order, full_name`,
      [organizationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/content/team-members
 * Create a new team member
 */
router.post('/team-members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const validated = TeamMemberSchema.parse(req.body);

    const result = await (req as any).db.query(
      `INSERT INTO team_members (
        organization_id, full_name, title, department, bio, quote,
        photo_url, email, phone, linkedin_url, display_order, published,
        featured, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        organizationId,
        validated.full_name,
        validated.title,
        validated.department,
        validated.bio,
        validated.quote,
        validated.photo_url,
        validated.email,
        validated.phone,
        validated.linkedin_url,
        validated.display_order,
        validated.published,
        validated.featured,
        userId,
        userId,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/content/team-members/:memberId
 * Update a team member
 */
router.put('/team-members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const { memberId } = req.params;
    const validated = TeamMemberSchema.parse(req.body);

    const result = await (req as any).db.query(
      `UPDATE team_members SET
        full_name = $1, title = $2, department = $3, bio = $4, quote = $5,
        photo_url = $6, email = $7, phone = $8, linkedin_url = $9,
        display_order = $10, published = $11, featured = $12, updated_by = $13
      WHERE id = $14 AND organization_id = $15
      RETURNING *`,
      [
        validated.full_name,
        validated.title,
        validated.department,
        validated.bio,
        validated.quote,
        validated.photo_url,
        validated.email,
        validated.phone,
        validated.linkedin_url,
        validated.display_order,
        validated.published,
        validated.featured,
        userId,
        memberId,
        organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /api/admin/content/team-members/:memberId
 * Delete a team member
 */
router.delete('/team-members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { memberId } = req.params;

    const result = await (req as any).db.query(
      'DELETE FROM team_members WHERE id = $1 AND organization_id = $2 RETURNING id',
      [memberId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    res.json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TESTIMONIALS CRUD
// ============================================================================

/**
 * GET /api/admin/content/testimonials
 * List all testimonials
 */
router.get('/testimonials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;

    const result = await (req as any).db.query(
      `SELECT * FROM testimonials
       WHERE organization_id = $1
       ORDER BY display_order, created_at DESC`,
      [organizationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/content/testimonials
 * Create a new testimonial
 */
router.post('/testimonials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const validated = TestimonialSchema.parse(req.body);

    const result = await (req as any).db.query(
      `INSERT INTO testimonials (
        organization_id, quote, author_name, author_title, author_location,
        rating, author_photo_url, display_order, published, featured,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        organizationId,
        validated.quote,
        validated.author_name,
        validated.author_title,
        validated.author_location,
        validated.rating,
        validated.author_photo_url,
        validated.display_order,
        validated.published,
        validated.featured,
        userId,
        userId,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/content/testimonials/:testimonialId
 * Update a testimonial
 */
router.put('/testimonials/:testimonialId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const { testimonialId } = req.params;
    const validated = TestimonialSchema.parse(req.body);

    const result = await (req as any).db.query(
      `UPDATE testimonials SET
        quote = $1, author_name = $2, author_title = $3, author_location = $4,
        rating = $5, author_photo_url = $6, display_order = $7, published = $8,
        featured = $9, updated_by = $10
      WHERE id = $11 AND organization_id = $12
      RETURNING *`,
      [
        validated.quote,
        validated.author_name,
        validated.author_title,
        validated.author_location,
        validated.rating,
        validated.author_photo_url,
        validated.display_order,
        validated.published,
        validated.featured,
        userId,
        testimonialId,
        organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Testimonial not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /api/admin/content/testimonials/:testimonialId
 * Delete a testimonial
 */
router.delete('/testimonials/:testimonialId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { testimonialId } = req.params;

    const result = await (req as any).db.query(
      'DELETE FROM testimonials WHERE id = $1 AND organization_id = $2 RETURNING id',
      [testimonialId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Testimonial not found' });
    }

    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SERVICES CRUD
// ============================================================================

/**
 * GET /api/admin/content/services
 * List all services
 */
router.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;

    const result = await (req as any).db.query(
      `SELECT * FROM services
       WHERE organization_id = $1
       ORDER BY display_order, service_name`,
      [organizationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/content/services
 * Create a new service
 */
router.post('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const validated = ServiceSchema.parse(req.body);

    const result = await (req as any).db.query(
      `INSERT INTO services (
        organization_id, service_name, service_slug, short_description,
        full_description, icon_name, image_url, features, starting_price,
        price_description, display_order, published, featured,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        organizationId,
        validated.service_name,
        validated.service_slug,
        validated.short_description,
        validated.full_description,
        validated.icon_name,
        validated.image_url,
        JSON.stringify(validated.features),
        validated.starting_price,
        validated.price_description,
        validated.display_order,
        validated.published,
        validated.featured,
        userId,
        userId,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * PUT /api/admin/content/services/:serviceId
 * Update a service
 */
router.put('/services/:serviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const { serviceId } = req.params;
    const validated = ServiceSchema.parse(req.body);

    const result = await (req as any).db.query(
      `UPDATE services SET
        service_name = $1, service_slug = $2, short_description = $3,
        full_description = $4, icon_name = $5, image_url = $6, features = $7,
        starting_price = $8, price_description = $9, display_order = $10,
        published = $11, featured = $12, updated_by = $13
      WHERE id = $14 AND organization_id = $15
      RETURNING *`,
      [
        validated.service_name,
        validated.service_slug,
        validated.short_description,
        validated.full_description,
        validated.icon_name,
        validated.image_url,
        JSON.stringify(validated.features),
        validated.starting_price,
        validated.price_description,
        validated.display_order,
        validated.published,
        validated.featured,
        userId,
        serviceId,
        organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /api/admin/content/services/:serviceId
 * Delete a service
 */
router.delete('/services/:serviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { serviceId } = req.params;

    const result = await (req as any).db.query(
      'DELETE FROM services WHERE id = $1 AND organization_id = $2 RETURNING id',
      [serviceId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

/**
 * GET /api/admin/content/settings
 * Get organization settings
 */
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;

    const result = await (req as any).db.query(
      'SELECT * FROM organization_settings WHERE organization_id = $1',
      [organizationId]
    );

    if (result.rows.length === 0) {
      // Return empty settings if none exist
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/content/settings
 * Update organization settings (creates if doesn't exist)
 */
router.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId } = (req as any).auth;
    const validated = OrganizationSettingsSchema.parse(req.body);

    // Upsert: Insert or update
    const result = await (req as any).db.query(
      `INSERT INTO organization_settings (
        organization_id, primary_phone, primary_email, address_line1,
        address_line2, city, state, zip_code, business_hours,
        patient_satisfaction_rate, total_pods, years_of_experience,
        cities_served, total_caregivers, total_clients_served,
        facebook_url, twitter_url, linkedin_url, instagram_url,
        privacy_policy_url, terms_of_service_url, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (organization_id) DO UPDATE SET
        primary_phone = EXCLUDED.primary_phone,
        primary_email = EXCLUDED.primary_email,
        address_line1 = EXCLUDED.address_line1,
        address_line2 = EXCLUDED.address_line2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        business_hours = EXCLUDED.business_hours,
        patient_satisfaction_rate = EXCLUDED.patient_satisfaction_rate,
        total_pods = EXCLUDED.total_pods,
        years_of_experience = EXCLUDED.years_of_experience,
        cities_served = EXCLUDED.cities_served,
        total_caregivers = EXCLUDED.total_caregivers,
        total_clients_served = EXCLUDED.total_clients_served,
        facebook_url = EXCLUDED.facebook_url,
        twitter_url = EXCLUDED.twitter_url,
        linkedin_url = EXCLUDED.linkedin_url,
        instagram_url = EXCLUDED.instagram_url,
        privacy_policy_url = EXCLUDED.privacy_policy_url,
        terms_of_service_url = EXCLUDED.terms_of_service_url,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      [
        organizationId,
        validated.primary_phone,
        validated.primary_email,
        validated.address_line1,
        validated.address_line2,
        validated.city,
        validated.state,
        validated.zip_code,
        JSON.stringify(validated.business_hours),
        validated.patient_satisfaction_rate,
        validated.total_pods,
        validated.years_of_experience,
        validated.cities_served,
        validated.total_caregivers,
        validated.total_clients_served,
        validated.facebook_url,
        validated.twitter_url,
        validated.linkedin_url,
        validated.instagram_url,
        validated.privacy_policy_url,
        validated.terms_of_service_url,
        userId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
});

// ============================================================================
// MEDIA ASSETS (Basic endpoints - file upload will be separate)
// ============================================================================

/**
 * GET /api/admin/content/media
 * List all media assets
 */
router.get('/media', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;

    const result = await (req as any).db.query(
      `SELECT m.*, u.email as uploaded_by_email
       FROM media_assets m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.organization_id = $1
       ORDER BY m.uploaded_at DESC`,
      [organizationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/content/media/:assetId
 * Delete a media asset
 */
router.delete('/media/:assetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as any).auth;
    const { assetId } = req.params;

    const result = await (req as any).db.query(
      'DELETE FROM media_assets WHERE id = $1 AND organization_id = $2 RETURNING *',
      [assetId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    // TODO: Delete actual file from storage
    // const filePath = result.rows[0].file_path;
    // await fs.unlink(filePath);

    res.json({ success: true, message: 'Media asset deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
