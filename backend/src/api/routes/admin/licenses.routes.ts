/**
 * License Management Routes
 * Admin endpoints for managing organization licenses and viewing opportunities
 * Based on Ohio Non-Medical Licensing & Home-Care Operations Guide (2025)
 *
 * @module api/routes/admin/licenses
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { getDbClient } from '../../../database/client';
import {
  getOrganizationOpportunities,
  recordOpportunityPrompt,
  recordOpportunityResponse,
  clearLicenseCache,
  LicenseType
} from '../../middleware/license.middleware';
import { createLogger } from '../../../utils/logger';

const router = Router();
const db = getDbClient();
const logger = createLogger('license-routes');

// ============================================================================
// ORGANIZATION LICENSES
// ============================================================================

/**
 * GET /api/admin/licenses
 * Get all licenses for the user's organization
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const result = await db.query(`
      SELECT
        id,
        license_type,
        license_number,
        issuing_authority,
        issued_date,
        expiration_date,
        renewal_reminder_days,
        status,
        document_url,
        notes,
        created_at,
        updated_at
      FROM organization_licenses
      WHERE organization_id = $1
      ORDER BY status ASC, expiration_date ASC
    `, [organizationId]);

    // Calculate days until expiration
    const licenses = result.rows.map((license: any) => ({
      ...license,
      daysUntilExpiration: license.expiration_date
        ? Math.ceil((new Date(license.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
      isExpiringSoon: license.expiration_date && license.renewal_reminder_days
        ? Math.ceil((new Date(license.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= license.renewal_reminder_days
        : false
    }));

    res.json({
      licenses,
      count: licenses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/licenses/:licenseId
 * Get details for a specific license
 */
router.get('/:licenseId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { licenseId } = req.params;
    const organizationId = req.user?.organizationId;

    const result = await db.query(`
      SELECT
        ol.*,
        (SELECT json_agg(json_build_object(
          'service_code', slr.service_code,
          'service_name', slr.service_name,
          'medicaid_rate_2024', slr.medicaid_rate_2024,
          'unit_type', slr.unit_type
        ))
        FROM service_license_requirements slr
        WHERE slr.required_license_type = ol.license_type
        ) as authorized_services
      FROM organization_licenses ol
      WHERE ol.id = $1 AND ol.organization_id = $2
    `, [licenseId, organizationId]);

    if (result.rows.length === 0) {
      throw ApiErrors.notFound('License');
    }

    res.json({
      license: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/licenses
 * Add a new license for the organization
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;

    const {
      licenseType,
      licenseNumber,
      issuingAuthority,
      issuedDate,
      expirationDate,
      renewalReminderDays = 90,
      documentUrl,
      notes
    } = req.body;

    if (!licenseType || !issuingAuthority) {
      throw ApiErrors.badRequest('License type and issuing authority are required');
    }

    // Validate license type
    const validLicenseTypes: LicenseType[] = [
      'non_medical_home_health', 'skilled_home_health', 'oda_passport',
      'oda_choices', 'oda_cdpc', 'oda_adult_day', 'oda_assisted_living',
      'dodd_hpc', 'dodd_respite', 'nmt_transportation'
    ];

    if (!validLicenseTypes.includes(licenseType)) {
      throw ApiErrors.badRequest(`Invalid license type. Valid types: ${validLicenseTypes.join(', ')}`);
    }

    // Check for duplicate
    const existing = await db.query(`
      SELECT id FROM organization_licenses
      WHERE organization_id = $1 AND license_type = $2
    `, [organizationId, licenseType]);

    if (existing.rows.length > 0) {
      throw ApiErrors.conflict(`Organization already has a ${licenseType} license. Use PUT to update.`);
    }

    const result = await db.query(`
      INSERT INTO organization_licenses (
        organization_id, license_type, license_number, issuing_authority,
        issued_date, expiration_date, renewal_reminder_days, status,
        document_url, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10)
      RETURNING *
    `, [
      organizationId, licenseType, licenseNumber, issuingAuthority,
      issuedDate, expirationDate, renewalReminderDays,
      documentUrl, notes, userId
    ]);

    // Clear cache
    clearLicenseCache(organizationId);

    logger.info('License added', {
      organizationId,
      licenseType,
      licenseNumber,
      userId
    });

    res.status(201).json({
      license: result.rows[0],
      message: 'License added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/licenses/:licenseId
 * Update a license
 */
router.put('/:licenseId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { licenseId } = req.params;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;

    const {
      licenseNumber,
      issuedDate,
      expirationDate,
      renewalReminderDays,
      status,
      documentUrl,
      notes
    } = req.body;

    // Verify ownership
    const existing = await db.query(`
      SELECT id FROM organization_licenses
      WHERE id = $1 AND organization_id = $2
    `, [licenseId, organizationId]);

    if (existing.rows.length === 0) {
      throw ApiErrors.notFound('License');
    }

    const result = await db.query(`
      UPDATE organization_licenses SET
        license_number = COALESCE($1, license_number),
        issued_date = COALESCE($2, issued_date),
        expiration_date = COALESCE($3, expiration_date),
        renewal_reminder_days = COALESCE($4, renewal_reminder_days),
        status = COALESCE($5, status),
        document_url = COALESCE($6, document_url),
        notes = COALESCE($7, notes),
        updated_at = NOW(),
        updated_by = $8
      WHERE id = $9
      RETURNING *
    `, [
      licenseNumber, issuedDate, expirationDate, renewalReminderDays,
      status, documentUrl, notes, userId, licenseId
    ]);

    // Clear cache
    clearLicenseCache(organizationId);

    res.json({
      license: result.rows[0],
      message: 'License updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/licenses/:licenseId
 * Remove a license (soft delete by setting status to 'revoked')
 */
router.delete('/:licenseId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { licenseId } = req.params;
    const organizationId = req.user?.organizationId;

    const result = await db.query(`
      UPDATE organization_licenses
      SET status = 'revoked', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING id, license_type
    `, [licenseId, organizationId]);

    if (result.rows.length === 0) {
      throw ApiErrors.notFound('License');
    }

    // Clear cache
    clearLicenseCache(organizationId);

    res.json({
      message: 'License revoked successfully',
      licenseType: result.rows[0].license_type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LICENSE OPPORTUNITIES
// ============================================================================

/**
 * GET /api/admin/licenses/opportunities
 * Get license opportunities (services organization could offer with additional licensing)
 */
router.get('/opportunities', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const opportunities = await getOrganizationOpportunities(organizationId);

    // Calculate total potential revenue
    const totalPotentialRevenue = opportunities.reduce(
      (sum, opp) => sum + opp.estimatedAnnualRevenue, 0
    );

    res.json({
      opportunities,
      totalPotentialRevenue,
      count: opportunities.length,
      message: opportunities.length > 0
        ? `You could unlock $${totalPotentialRevenue.toLocaleString()}/year in additional revenue with ${opportunities.length} new license(s)`
        : 'You have all available licenses!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/licenses/opportunities/:licenseType/interested
 * Record interest in a license opportunity
 */
router.post('/opportunities/:licenseType/interested', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { licenseType } = req.params;
    const { triggerAction = 'manual_inquiry' } = req.body;
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.userId!;

    // Get opportunity info
    const opportunities = await getOrganizationOpportunities(organizationId);
    const opportunity = opportunities.find(o => o.licenseType === licenseType);

    if (!opportunity) {
      throw ApiErrors.badRequest('License opportunity not found or already obtained');
    }

    // Record the prompt
    await recordOpportunityPrompt(
      organizationId,
      userId,
      triggerAction,
      licenseType as LicenseType,
      opportunity.estimatedAnnualRevenue
    );

    res.json({
      message: 'Interest recorded',
      opportunity,
      nextSteps: [
        `Visit ${opportunity.applicationUrl} to start your application`,
        `Application fee: $${opportunity.applicationFee}`,
        `Estimated processing time: ${opportunity.estimatedProcessingDays} days`,
        'Gather required documents (see handbook for full list)'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SERVICE LICENSE REQUIREMENTS (Read-only reference)
// ============================================================================

/**
 * GET /api/admin/licenses/services
 * Get all service types and their license requirements
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    // Get current licenses
    const licenseResult = await db.query(`
      SELECT license_type FROM organization_licenses
      WHERE organization_id = $1 AND status = 'active'
    `, [organizationId]);

    const currentLicenses = licenseResult.rows.map((r: any) => r.license_type);

    // Get all services with authorization status
    const servicesResult = await db.query(`
      SELECT
        service_code,
        service_name,
        service_category,
        required_license_type,
        alternative_licenses,
        unit_type,
        medicaid_rate_2024,
        description,
        regulatory_reference
      FROM service_license_requirements
      ORDER BY service_category, service_name
    `);

    const services = servicesResult.rows.map((service: any) => {
      const isAuthorized = currentLicenses.includes(service.required_license_type) ||
        (service.alternative_licenses || []).some((alt: string) => currentLicenses.includes(alt));

      return {
        ...service,
        isAuthorized,
        status: isAuthorized ? 'authorized' : 'requires_license'
      };
    });

    // Group by category
    const byCategory = services.reduce((acc: any, service: any) => {
      const category = service.service_category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});

    res.json({
      services,
      byCategory,
      currentLicenses,
      authorizedCount: services.filter((s: any) => s.isAuthorized).length,
      totalCount: services.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/licenses/services/:serviceCode/check
 * Check if organization can provide a specific service
 */
router.get('/services/:serviceCode/check', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { serviceCode } = req.params;
    const organizationId = req.user?.organizationId;

    // Get service requirements
    const serviceResult = await db.query(`
      SELECT * FROM service_license_requirements
      WHERE service_code = $1
    `, [serviceCode]);

    if (serviceResult.rows.length === 0) {
      // Service not found in requirements - likely custom/allowed
      res.json({
        serviceCode,
        isAuthorized: true,
        message: 'Service code not found in regulatory requirements - may be custom service',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const service = serviceResult.rows[0];

    // Check licenses
    const licenseResult = await db.query(`
      SELECT license_type FROM organization_licenses
      WHERE organization_id = $1
        AND status = 'active'
        AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
        AND (license_type = $2 OR license_type = ANY($3::text[]))
    `, [organizationId, service.required_license_type, service.alternative_licenses || []]);

    const isAuthorized = licenseResult.rows.length > 0;

    if (isAuthorized) {
      res.json({
        serviceCode,
        serviceName: service.service_name,
        isAuthorized: true,
        authorizedByLicense: licenseResult.rows[0].license_type,
        medicaidRate: service.medicaid_rate_2024,
        unitType: service.unit_type,
        timestamp: new Date().toISOString()
      });
    } else {
      // Get opportunity info
      const opportunities = await getOrganizationOpportunities(organizationId!);
      const opportunity = opportunities.find(o => o.licenseType === service.required_license_type);

      res.json({
        serviceCode,
        serviceName: service.service_name,
        isAuthorized: false,
        requiredLicense: service.required_license_type,
        alternativeLicenses: service.alternative_licenses,
        opportunity,
        message: `${service.service_name} requires ${service.required_license_type} license`,
        unlockUrl: '/admin/licenses',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LICENSE APPLICATIONS (Track application progress)
// ============================================================================

/**
 * GET /api/admin/licenses/applications
 * Get all license applications for the organization
 */
router.get('/applications', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    const result = await db.query(`
      SELECT * FROM license_applications
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    res.json({
      applications: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/licenses/applications
 * Start tracking a new license application
 */
router.post('/applications', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { licenseType, applicationPortal, notes } = req.body;

    if (!licenseType) {
      throw ApiErrors.badRequest('License type is required');
    }

    const result = await db.query(`
      INSERT INTO license_applications (
        organization_id, license_type, application_portal,
        status, started_at, notes
      ) VALUES ($1, $2, $3, 'documents_gathering', NOW(), $4)
      RETURNING *
    `, [organizationId, licenseType, applicationPortal, notes]);

    res.status(201).json({
      application: result.rows[0],
      message: 'Application tracking started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/licenses/applications/:applicationId
 * Update application progress
 */
router.put('/applications/:applicationId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { applicationId } = req.params;
    const organizationId = req.user?.organizationId;
    const { status, checklist, documents, notes, submittedAt, completedAt } = req.body;

    const result = await db.query(`
      UPDATE license_applications SET
        status = COALESCE($1, status),
        checklist = COALESCE($2, checklist),
        documents = COALESCE($3, documents),
        notes = COALESCE($4, notes),
        submitted_at = COALESCE($5, submitted_at),
        completed_at = COALESCE($6, completed_at),
        updated_at = NOW()
      WHERE id = $7 AND organization_id = $8
      RETURNING *
    `, [status, JSON.stringify(checklist), JSON.stringify(documents), notes, submittedAt, completedAt, applicationId, organizationId]);

    if (result.rows.length === 0) {
      throw ApiErrors.notFound('Application');
    }

    res.json({
      application: result.rows[0],
      message: 'Application updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
