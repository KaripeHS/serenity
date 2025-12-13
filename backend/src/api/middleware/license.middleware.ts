/**
 * License Enforcement Middleware
 * Ensures organizations can only provide services they are licensed for
 * Based on Ohio Non-Medical Licensing & Home-Care Operations Guide (2025)
 *
 * @module api/middleware
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ApiErrors } from './error-handler';
import { createLogger } from '../../utils/logger';
import { getDbClient } from '../../database/client';

const logger = createLogger('license-middleware');
const db = getDbClient();

/**
 * License types supported by the platform
 */
export type LicenseType =
  | 'non_medical_home_health'   // ODH Non-Medical Home Health Services License
  | 'skilled_home_health'       // ODH Skilled Home Health Services License
  | 'oda_passport'              // ODA PASSPORT Waiver Certification
  | 'oda_choices'               // ODA Choices Home Care Attendant
  | 'oda_cdpc'                  // ODA Consumer-Directed Personal Care
  | 'oda_adult_day'             // ODA Adult Day Services
  | 'oda_assisted_living'       // ODA Assisted Living
  | 'dodd_hpc'                  // DODD Homemaker/Personal Care
  | 'dodd_respite'              // DODD Respite Services
  | 'nmt_transportation';       // Non-Medical Transportation

/**
 * License opportunity information for prompting users
 */
export interface LicenseOpportunity {
  licenseType: LicenseType;
  issuingAuthority: string;
  servicesUnlocked: string[];
  estimatedAnnualRevenue: number;
  applicationFee: number;
  applicationUrl: string;
  estimatedProcessingDays: number;
}

/**
 * Response when license is required but missing
 */
export interface LicenseRequiredResponse {
  error: 'LICENSE_REQUIRED';
  message: string;
  requiredLicenses: LicenseType[];
  currentLicenses: string[];
  unlockUrl: string;
  opportunity: LicenseOpportunity | null;
}

/**
 * Cache for organization licenses (5 minute TTL)
 */
const licenseCache = new Map<string, { licenses: string[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get organization's active licenses (with caching)
 */
async function getOrganizationLicenses(organizationId: string): Promise<string[]> {
  const cacheKey = organizationId;
  const cached = licenseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.licenses;
  }

  try {
    const result = await db.query(`
      SELECT license_type
      FROM organization_licenses
      WHERE organization_id = $1
        AND status = 'active'
        AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
    `, [organizationId]);

    const licenses = result.rows.map((r: any) => r.license_type);

    // Cache the result
    licenseCache.set(cacheKey, {
      licenses,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return licenses;
  } catch (error) {
    logger.error('Failed to fetch organization licenses', { organizationId, error });
    // On error, allow the request to proceed (fail open for now)
    return [];
  }
}

/**
 * Get license requirements for a service code
 */
async function getServiceLicenseRequirements(serviceCode: string): Promise<{
  requiredLicense: string;
  alternativeLicenses: string[];
  serviceName: string;
} | null> {
  try {
    const result = await db.query(`
      SELECT required_license_type, alternative_licenses, service_name
      FROM service_license_requirements
      WHERE service_code = $1
    `, [serviceCode]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      requiredLicense: result.rows[0].required_license_type,
      alternativeLicenses: result.rows[0].alternative_licenses || [],
      serviceName: result.rows[0].service_name
    };
  } catch (error) {
    logger.error('Failed to fetch service license requirements', { serviceCode, error });
    return null;
  }
}

/**
 * Get opportunity information for a license type
 */
async function getLicenseOpportunityInfo(licenseType: LicenseType): Promise<LicenseOpportunity | null> {
  const opportunityMap: Record<LicenseType, Partial<LicenseOpportunity>> = {
    'non_medical_home_health': {
      issuingAuthority: 'ODH',
      applicationFee: 250,
      applicationUrl: 'https://odhgateway.odh.ohio.gov',
      estimatedProcessingDays: 90
    },
    'skilled_home_health': {
      issuingAuthority: 'ODH',
      applicationFee: 250,
      applicationUrl: 'https://odhgateway.odh.ohio.gov',
      estimatedProcessingDays: 90
    },
    'oda_passport': {
      issuingAuthority: 'ODA',
      applicationFee: 730,
      applicationUrl: 'https://ohpnm.omes.maximus.com',
      estimatedProcessingDays: 60
    },
    'oda_choices': {
      issuingAuthority: 'ODA',
      applicationFee: 0,
      applicationUrl: 'https://aging.ohio.gov/agencies-and-service-providers/certification',
      estimatedProcessingDays: 30
    },
    'oda_cdpc': {
      issuingAuthority: 'ODA',
      applicationFee: 0,
      applicationUrl: 'https://aging.ohio.gov/agencies-and-service-providers/certification',
      estimatedProcessingDays: 30
    },
    'oda_adult_day': {
      issuingAuthority: 'ODA',
      applicationFee: 730,
      applicationUrl: 'https://ohpnm.omes.maximus.com',
      estimatedProcessingDays: 90
    },
    'oda_assisted_living': {
      issuingAuthority: 'ODA',
      applicationFee: 730,
      applicationUrl: 'https://ohpnm.omes.maximus.com',
      estimatedProcessingDays: 120
    },
    'dodd_hpc': {
      issuingAuthority: 'DODD',
      applicationFee: 0,
      applicationUrl: 'https://dodd.ohio.gov/providers/initial-renewal-certification',
      estimatedProcessingDays: 45
    },
    'dodd_respite': {
      issuingAuthority: 'DODD',
      applicationFee: 0,
      applicationUrl: 'https://dodd.ohio.gov/providers/initial-renewal-certification',
      estimatedProcessingDays: 45
    },
    'nmt_transportation': {
      issuingAuthority: 'ODA/DODD',
      applicationFee: 0,
      applicationUrl: 'https://dodd.ohio.gov/waivers-and-services/services/non-medical-transportation',
      estimatedProcessingDays: 30
    }
  };

  const baseInfo = opportunityMap[licenseType];
  if (!baseInfo) return null;

  // Get services unlocked by this license
  try {
    const result = await db.query(`
      SELECT service_name, medicaid_rate_2024
      FROM service_license_requirements
      WHERE required_license_type = $1
    `, [licenseType]);

    const servicesUnlocked = result.rows.map((r: any) => r.service_name);
    const avgRate = result.rows.reduce((sum: number, r: any) => sum + (parseFloat(r.medicaid_rate_2024) || 7.24), 0) / result.rows.length;

    // Estimate: 50 clients * 20 hrs/week * 50 weeks * rate * 4 (units per hour)
    const estimatedAnnualRevenue = 50 * 20 * 50 * avgRate * 4;

    return {
      licenseType,
      issuingAuthority: baseInfo.issuingAuthority!,
      servicesUnlocked,
      estimatedAnnualRevenue: Math.round(estimatedAnnualRevenue),
      applicationFee: baseInfo.applicationFee!,
      applicationUrl: baseInfo.applicationUrl!,
      estimatedProcessingDays: baseInfo.estimatedProcessingDays!
    };
  } catch (error) {
    logger.error('Failed to get license opportunity info', { licenseType, error });
    return null;
  }
}

/**
 * Check if organization has required license
 */
function hasRequiredLicense(
  orgLicenses: string[],
  requiredLicense: string,
  alternativeLicenses: string[]
): boolean {
  if (orgLicenses.includes(requiredLicense)) {
    return true;
  }

  // Check alternative licenses
  for (const alt of alternativeLicenses) {
    if (orgLicenses.includes(alt)) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware: Require specific license type(s)
 *
 * Usage:
 *   router.post('/skilled-visits', requireLicense(['skilled_home_health']), handler);
 *   router.post('/passport-care', requireLicense(['oda_passport']), handler);
 */
export function requireLicense(requiredLicenseTypes: LicenseType[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.organizationId) {
        throw ApiErrors.unauthorized('Organization context required');
      }

      const orgLicenses = await getOrganizationLicenses(req.user.organizationId);

      // Check if organization has any of the required licenses
      const hasRequired = requiredLicenseTypes.some(license => orgLicenses.includes(license));

      if (!hasRequired) {
        logger.warn('License required but not found', {
          organizationId: req.user.organizationId,
          requiredLicenses: requiredLicenseTypes,
          currentLicenses: orgLicenses,
          path: req.path
        });

        // Get opportunity info for the first required license
        const opportunity = await getLicenseOpportunityInfo(requiredLicenseTypes[0]);

        const response: LicenseRequiredResponse = {
          error: 'LICENSE_REQUIRED',
          message: `This action requires one of the following licenses: ${requiredLicenseTypes.join(', ')}`,
          requiredLicenses: requiredLicenseTypes,
          currentLicenses: orgLicenses,
          unlockUrl: '/admin/licenses',
          opportunity
        };

        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Require license for a specific service code
 *
 * Usage:
 *   router.post('/visits', requireServiceLicense('T1001'), handler); // Requires skilled license
 */
export function requireServiceLicense(serviceCode: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.organizationId) {
        throw ApiErrors.unauthorized('Organization context required');
      }

      // Get license requirements for this service
      const requirements = await getServiceLicenseRequirements(serviceCode);

      if (!requirements) {
        // Service not found in requirements - allow (may be custom service)
        logger.debug('Service code not found in license requirements, allowing', { serviceCode });
        next();
        return;
      }

      const orgLicenses = await getOrganizationLicenses(req.user.organizationId);

      if (!hasRequiredLicense(orgLicenses, requirements.requiredLicense, requirements.alternativeLicenses)) {
        logger.warn('Service requires license not held by organization', {
          organizationId: req.user.organizationId,
          serviceCode,
          serviceName: requirements.serviceName,
          requiredLicense: requirements.requiredLicense,
          currentLicenses: orgLicenses
        });

        const opportunity = await getLicenseOpportunityInfo(requirements.requiredLicense as LicenseType);

        const response: LicenseRequiredResponse = {
          error: 'LICENSE_REQUIRED',
          message: `${requirements.serviceName} (${serviceCode}) requires ${requirements.requiredLicense} license`,
          requiredLicenses: [requirements.requiredLicense as LicenseType],
          currentLicenses: orgLicenses,
          unlockUrl: '/admin/licenses',
          opportunity
        };

        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Validate service code from request body
 *
 * Usage:
 *   router.post('/schedule', validateServiceLicense('serviceCode'), handler);
 *   // Checks req.body.serviceCode against license requirements
 */
export function validateServiceLicense(bodyField: string = 'serviceCode') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serviceCode = req.body[bodyField];

      if (!serviceCode) {
        // No service code in body, skip validation
        next();
        return;
      }

      // Use the service license middleware
      return requireServiceLicense(serviceCode)(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get all license opportunities for an organization
 * (Services they could offer with additional licensing)
 */
export async function getOrganizationOpportunities(organizationId: string): Promise<LicenseOpportunity[]> {
  try {
    const currentLicenses = await getOrganizationLicenses(organizationId);

    const result = await db.query(`
      SELECT DISTINCT required_license_type
      FROM service_license_requirements
      WHERE required_license_type NOT IN (
        SELECT license_type FROM organization_licenses
        WHERE organization_id = $1 AND status = 'active'
      )
    `, [organizationId]);

    const opportunities: LicenseOpportunity[] = [];

    for (const row of result.rows) {
      const opportunity = await getLicenseOpportunityInfo(row.required_license_type);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }

    // Sort by estimated revenue (highest first)
    return opportunities.sort((a, b) => b.estimatedAnnualRevenue - a.estimatedAnnualRevenue);
  } catch (error) {
    logger.error('Failed to get organization opportunities', { organizationId, error });
    return [];
  }
}

/**
 * Record when a user is shown an opportunity prompt
 */
export async function recordOpportunityPrompt(
  organizationId: string,
  userId: string,
  triggerAction: string,
  licenseType: LicenseType,
  estimatedRevenue: number
): Promise<void> {
  try {
    await db.query(`
      INSERT INTO license_opportunity_prompts
        (organization_id, user_id, trigger_action, license_type_suggested, estimated_annual_revenue)
      VALUES ($1, $2, $3, $4, $5)
    `, [organizationId, userId, triggerAction, licenseType, estimatedRevenue]);
  } catch (error) {
    logger.error('Failed to record opportunity prompt', { organizationId, userId, error });
  }
}

/**
 * Record user response to an opportunity prompt
 */
export async function recordOpportunityResponse(
  promptId: string,
  response: 'interested' | 'not_now' | 'dismissed' | 'started_application'
): Promise<void> {
  try {
    await db.query(`
      UPDATE license_opportunity_prompts
      SET user_response = $1, responded_at = NOW()
      WHERE id = $2
    `, [response, promptId]);
  } catch (error) {
    logger.error('Failed to record opportunity response', { promptId, error });
  }
}

/**
 * Clear license cache (call when licenses are updated)
 */
export function clearLicenseCache(organizationId?: string): void {
  if (organizationId) {
    licenseCache.delete(organizationId);
  } else {
    licenseCache.clear();
  }
}

export default {
  requireLicense,
  requireServiceLicense,
  validateServiceLicense,
  getOrganizationOpportunities,
  recordOpportunityPrompt,
  recordOpportunityResponse,
  clearLicenseCache
};
