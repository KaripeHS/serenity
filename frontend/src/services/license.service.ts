/**
 * License Management Service
 * Handles organization licenses and revenue opportunity alerts
 * Implements the license enforcement system from the strategic plan
 */
import { request } from './api';
import { loggerService } from '../shared/services/logger.service';

// ==========================================
// License Types
// ==========================================

export interface OrganizationLicense {
  id: string;
  licenseType: LicenseType;
  licenseNumber: string | null;
  issuingAuthority: string;
  issuedDate: string | null;
  expirationDate: string | null;
  status: 'active' | 'expired' | 'pending' | 'revoked';
  documentUrl: string | null;
  servicesAuthorized: string[];
  createdAt: string;
}

export type LicenseType =
  | 'non_medical_home_health'  // ODH - Current license
  | 'skilled_home_health'       // ODH - Requires RN supervision
  | 'oda_passport'              // ODA - Medicaid waiver services
  | 'oda_cdpc'                  // ODA - Consumer-directed personal care
  | 'oda_choices'               // ODA - Ohio Choices waiver
  | 'dodd_hpc'                  // DODD - DD waiver services
  | 'dodd_nmt';                 // DODD - Non-medical transport

export interface LicenseRequirement {
  licenseType: LicenseType;
  displayName: string;
  issuingAuthority: string;
  applicationFee: number;
  bondRequired: number | null;
  estimatedTimelineDays: number;
  requirements: string[];
  applicationUrl: string;
}

// ==========================================
// Opportunity Types
// ==========================================

export interface RevenueOpportunity {
  id: string;
  type: 'license' | 'service' | 'market' | 'efficiency';
  category: string;
  title: string;
  description: string;
  potentialRevenue: number;
  potentialRevenueRange: string;
  requiredLicenses: LicenseType[];
  currentlyUnlocked: boolean;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeToImplement: string;
  actionSteps: string[];
  cta: {
    text: string;
    link: string;
  };
}

export interface OpportunityDashboard {
  currentLicenses: OrganizationLicense[];
  unlockedServices: ServiceCapability[];
  blockedServices: ServiceCapability[];
  opportunities: RevenueOpportunity[];
  totalPotentialRevenue: number;
  projectedRevenueByLicense: Array<{
    licenseType: LicenseType;
    displayName: string;
    potentialRevenue: number;
    clientsRequired: number;
    unlocked: boolean;
  }>;
}

export interface ServiceCapability {
  serviceCode: string;
  serviceName: string;
  description: string;
  requiredLicense: LicenseType;
  medicaidBillable: boolean;
  ratePerUnit: number | null;
  unitType: string | null;
  status: 'available' | 'blocked' | 'coming_soon';
  blockReason?: string;
}

// ==========================================
// Ohio-Specific Rate Information
// ==========================================

export const OHIO_MEDICAID_RATES = {
  // ODA Rates (per 15-minute unit unless noted)
  'T1019_personal_care': { rate: 7.24, unit: '15min', description: 'Personal Care (ODA)' },
  'S5130_homemaker': { rate: 4.44, unit: '15min', description: 'Homemaker Services' },
  'S5150_respite_home': { rate: 7.05, unit: '15min', description: 'Respite (In-Home)' },
  'T1019_consumer_directed': { rate: 3.44, unit: '15min', description: 'Consumer-Directed PC' },
  'S5125_home_care_attendant': { rate: 4.70, unit: '15min', description: 'Home Care Attendant' },
  // DODD Rates
  'HPC_standard': { rate: 7.15, unit: '15min', description: 'HPC Standard' },
  'HPC_enhanced': { rate: 8.69, unit: '15min', description: 'HPC Enhanced' },
  'HPC_intensive': { rate: 9.95, unit: '15min', description: 'HPC Intensive' },
  // Transport
  'NMT_trip': { rate: 653, unit: 'trip', description: 'Non-Medical Transport' },
} as const;

// ==========================================
// License Service Class
// ==========================================

class LicenseService {
  // License Management
  async getOrganizationLicenses(): Promise<OrganizationLicense[]> {
    try {
      const data = await request<{ licenses: any[]; count: number }>('/api/admin/licenses');
      return data.licenses.map(this.mapApiLicense);
    } catch (error) {
      loggerService.error('Failed to fetch licenses', { error });
      // Return default license info based on known state
      return this.getDefaultLicenses();
    }
  }

  async createLicense(license: Partial<OrganizationLicense>): Promise<OrganizationLicense> {
    const data = await request<{ license: any }>('/api/admin/licenses', {
      method: 'POST',
      body: JSON.stringify({
        licenseType: license.licenseType,
        licenseNumber: license.licenseNumber,
        issuingAuthority: license.issuingAuthority,
        issuedDate: license.issuedDate,
        expirationDate: license.expirationDate,
        documentUrl: license.documentUrl,
      })
    });
    return this.mapApiLicense(data.license);
  }

  async updateLicense(id: string, updates: Partial<OrganizationLicense>): Promise<OrganizationLicense> {
    const data = await request<{ license: any }>(`/api/admin/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        licenseNumber: updates.licenseNumber,
        issuedDate: updates.issuedDate,
        expirationDate: updates.expirationDate,
        status: updates.status,
        documentUrl: updates.documentUrl,
      })
    });
    return this.mapApiLicense(data.license);
  }

  // Map API response to local interface
  private mapApiLicense(apiLicense: any): OrganizationLicense {
    return {
      id: apiLicense.id,
      licenseType: apiLicense.license_type,
      licenseNumber: apiLicense.license_number,
      issuingAuthority: apiLicense.issuing_authority,
      issuedDate: apiLicense.issued_date,
      expirationDate: apiLicense.expiration_date,
      status: apiLicense.status,
      documentUrl: apiLicense.document_url,
      servicesAuthorized: [],
      createdAt: apiLicense.created_at,
    };
  }

  // Opportunity Dashboard
  async getOpportunityDashboard(): Promise<OpportunityDashboard> {
    try {
      // Try to get opportunities from API
      const [licensesData, opportunitiesData] = await Promise.all([
        request<{ licenses: any[] }>('/api/admin/licenses').catch(() => ({ licenses: [] })),
        request<{ opportunities: any[]; totalPotentialRevenue: number }>('/api/admin/licenses/opportunities').catch(() => null),
      ]);

      const licenses = licensesData.licenses.map(this.mapApiLicense);

      if (opportunitiesData) {
        // Map API opportunities to local format
        return this.calculateOpportunities(licenses);
      }

      return this.calculateOpportunities(licenses);
    } catch (error) {
      loggerService.error('Failed to fetch opportunity dashboard', { error });
      // Return calculated opportunities based on known license state
      return this.calculateOpportunities(await this.getOrganizationLicenses());
    }
  }

  async getOpportunities(filters?: {
    type?: string;
    priority?: string;
    minRevenue?: number;
  }): Promise<RevenueOpportunity[]> {
    try {
      const data = await request<{ opportunities: any[]; totalPotentialRevenue: number }>('/api/admin/licenses/opportunities');

      // Transform API opportunities to local format and filter
      const dashboard = await this.getOpportunityDashboard();
      let opportunities = dashboard.opportunities;

      if (filters?.type) {
        opportunities = opportunities.filter(o => o.type === filters.type);
      }
      if (filters?.priority) {
        opportunities = opportunities.filter(o => o.priority === filters.priority);
      }
      if (filters?.minRevenue) {
        opportunities = opportunities.filter(o => o.potentialRevenue >= filters.minRevenue!);
      }

      return opportunities;
    } catch {
      const dashboard = await this.getOpportunityDashboard();
      return dashboard.opportunities;
    }
  }

  // Service Capabilities
  async getServiceCapabilities(): Promise<ServiceCapability[]> {
    try {
      const data = await request<{ services: any[]; authorizedCount: number; totalCount: number }>('/api/admin/licenses/services');
      return data.services.map((s: any) => ({
        serviceCode: s.service_code,
        serviceName: s.service_name,
        description: s.description || '',
        requiredLicense: s.required_license_type,
        medicaidBillable: s.medicaid_rate_2024 != null,
        ratePerUnit: s.medicaid_rate_2024,
        unitType: s.unit_type,
        status: s.isAuthorized ? 'available' : 'blocked',
        blockReason: s.isAuthorized ? undefined : `Requires ${s.required_license_type} license`,
      }));
    } catch {
      return this.getAllServiceCapabilities(await this.getOrganizationLicenses());
    }
  }

  async checkServiceAuthorization(serviceCode: string): Promise<{
    authorized: boolean;
    reason?: string;
    requiredLicense?: LicenseType;
    unlockUrl?: string;
  }> {
    try {
      const data = await request<{
        isAuthorized: boolean;
        serviceName?: string;
        requiredLicense?: string;
        message?: string;
      }>(`/api/admin/licenses/services/${serviceCode}/check`);

      return {
        authorized: data.isAuthorized,
        reason: data.message,
        requiredLicense: data.requiredLicense as LicenseType,
        unlockUrl: data.isAuthorized ? undefined : '/admin/licenses',
      };
    } catch {
      // Fallback to local check
      const licenses = await this.getOrganizationLicenses();
      return this.checkServiceAuthorizationLocal(serviceCode, licenses);
    }
  }

  // License Requirements
  getLicenseRequirements(licenseType: LicenseType): LicenseRequirement {
    return LICENSE_REQUIREMENTS[licenseType];
  }

  getAllLicenseRequirements(): LicenseRequirement[] {
    return Object.values(LICENSE_REQUIREMENTS);
  }

  // Helper Methods
  private getDefaultLicenses(): OrganizationLicense[] {
    return [{
      id: 'default-1',
      licenseType: 'non_medical_home_health',
      licenseNumber: null,
      issuingAuthority: 'ODH',
      issuedDate: null,
      expirationDate: null,
      status: 'active',
      documentUrl: null,
      servicesAuthorized: ['personal_care', 'homemaker', 'respite', 'errands'],
      createdAt: new Date().toISOString()
    }];
  }

  private calculateOpportunities(licenses: OrganizationLicense[]): OpportunityDashboard {
    const activeLicenseTypes = new Set(
      licenses
        .filter(l => l.status === 'active')
        .map(l => l.licenseType)
    );

    const opportunities: RevenueOpportunity[] = [];
    let totalPotentialRevenue = 0;

    // Check ODA PASSPORT opportunity
    if (!activeLicenseTypes.has('oda_passport')) {
      const passportRevenue = 750000; // $750K/year at 50 clients
      totalPotentialRevenue += passportRevenue;
      opportunities.push({
        id: 'opp-passport',
        type: 'license',
        category: 'Medicaid Waiver',
        title: 'Unlock PASSPORT Medicaid Revenue',
        description: 'ODA PASSPORT certification unlocks billing for Medicaid waiver personal care services at $7.24/15min.',
        potentialRevenue: passportRevenue,
        potentialRevenueRange: '$500K - $1.5M/year',
        requiredLicenses: ['oda_passport'],
        currentlyUnlocked: false,
        priority: 'high',
        effort: 'medium',
        timeToImplement: '60-90 days',
        actionSteps: [
          'Complete ODA Provider Application via PNM',
          'Pay $730 application fee',
          'Complete provider orientation',
          'Pass background check requirements',
          'Receive certification number'
        ],
        cta: {
          text: 'Start ODA Application',
          link: '/admin/licenses/apply?type=oda_passport'
        }
      });
    }

    // Check Consumer-Directed opportunity
    if (!activeLicenseTypes.has('oda_cdpc')) {
      const cdpcRevenue = 350000;
      totalPotentialRevenue += cdpcRevenue;
      opportunities.push({
        id: 'opp-cdpc',
        type: 'license',
        category: 'Consumer-Directed',
        title: 'Add Consumer-Directed Personal Care',
        description: 'CDPC certification allows serving clients who want to direct their own care at $3.44/15min.',
        potentialRevenue: cdpcRevenue,
        potentialRevenueRange: '$200K - $500K/year',
        requiredLicenses: ['oda_cdpc'],
        currentlyUnlocked: false,
        priority: 'medium',
        effort: 'medium',
        timeToImplement: '45-60 days',
        actionSteps: [
          'Complete separate CDPC application',
          'Establish FMS relationship',
          'Train staff on CDPC model',
          'Set up timesheet workflows'
        ],
        cta: {
          text: 'Learn About CDPC',
          link: '/admin/licenses/apply?type=oda_cdpc'
        }
      });
    }

    // Check DODD HPC opportunity
    if (!activeLicenseTypes.has('dodd_hpc')) {
      const doddRevenue = 600000;
      totalPotentialRevenue += doddRevenue;
      opportunities.push({
        id: 'opp-dodd-hpc',
        type: 'license',
        category: 'DODD Waiver',
        title: 'Enter DODD DD Waiver Market',
        description: 'DODD HPC certification pays up to 37% more than ODA personal care at $7.15-$9.95/15min.',
        potentialRevenue: doddRevenue,
        potentialRevenueRange: '$400K - $900K/year',
        requiredLicenses: ['dodd_hpc'],
        currentlyUnlocked: false,
        priority: 'high',
        effort: 'high',
        timeToImplement: '90-120 days',
        actionSteps: [
          'Complete DODD Independent Provider Application',
          'Pass background check (BCI + FBI)',
          'Complete EVV certification training',
          'Complete DD-specific orientation',
          'Establish ISP documentation processes'
        ],
        cta: {
          text: 'Explore DODD Certification',
          link: '/admin/licenses/apply?type=dodd_hpc'
        }
      });
    }

    // Service expansion opportunity (with current license)
    opportunities.push({
      id: 'opp-service-expansion',
      type: 'service',
      category: 'Current License',
      title: 'Maximize Private Pay Revenue',
      description: 'You can serve private-pay clients now at market rates ($25-40/hr). Focus on marketing to grow this segment.',
      potentialRevenue: 200000,
      potentialRevenueRange: '$100K - $300K/year',
      requiredLicenses: ['non_medical_home_health'],
      currentlyUnlocked: true,
      priority: 'medium',
      effort: 'low',
      timeToImplement: 'Immediate',
      actionSteps: [
        'Update website with service offerings',
        'Create referral partnerships with hospitals',
        'Implement client intake workflow',
        'Set competitive private-pay rates'
      ],
      cta: {
        text: 'View Marketing Resources',
        link: '/marketing/private-pay'
      }
    });

    // Calculate projected revenue by license
    const projectedRevenueByLicense = [
      {
        licenseType: 'non_medical_home_health' as LicenseType,
        displayName: 'Non-Medical Home Health (ODH)',
        potentialRevenue: 500000,
        clientsRequired: 25,
        unlocked: activeLicenseTypes.has('non_medical_home_health')
      },
      {
        licenseType: 'oda_passport' as LicenseType,
        displayName: 'PASSPORT (ODA)',
        potentialRevenue: 750000,
        clientsRequired: 50,
        unlocked: activeLicenseTypes.has('oda_passport')
      },
      {
        licenseType: 'oda_cdpc' as LicenseType,
        displayName: 'Consumer-Directed PC (ODA)',
        potentialRevenue: 350000,
        clientsRequired: 40,
        unlocked: activeLicenseTypes.has('oda_cdpc')
      },
      {
        licenseType: 'dodd_hpc' as LicenseType,
        displayName: 'HPC (DODD)',
        potentialRevenue: 600000,
        clientsRequired: 30,
        unlocked: activeLicenseTypes.has('dodd_hpc')
      }
    ];

    return {
      currentLicenses: licenses,
      unlockedServices: this.getUnlockedServices(activeLicenseTypes),
      blockedServices: this.getBlockedServices(activeLicenseTypes),
      opportunities: opportunities.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      totalPotentialRevenue,
      projectedRevenueByLicense
    };
  }

  private getUnlockedServices(activeLicenses: Set<LicenseType>): ServiceCapability[] {
    const services: ServiceCapability[] = [];

    if (activeLicenses.has('non_medical_home_health')) {
      services.push(
        {
          serviceCode: 'T1019',
          serviceName: 'Personal Care',
          description: 'Bathing, dressing, toileting, ambulation assistance',
          requiredLicense: 'non_medical_home_health',
          medicaidBillable: false,
          ratePerUnit: null,
          unitType: null,
          status: 'available'
        },
        {
          serviceCode: 'S5130',
          serviceName: 'Homemaker Services',
          description: 'Cleaning, laundry, meal preparation',
          requiredLicense: 'non_medical_home_health',
          medicaidBillable: false,
          ratePerUnit: null,
          unitType: null,
          status: 'available'
        },
        {
          serviceCode: 'S5150',
          serviceName: 'Respite Care',
          description: 'Caregiver relief services',
          requiredLicense: 'non_medical_home_health',
          medicaidBillable: false,
          ratePerUnit: null,
          unitType: null,
          status: 'available'
        }
      );
    }

    if (activeLicenses.has('oda_passport')) {
      services.push({
        serviceCode: 'T1019_PASSPORT',
        serviceName: 'PASSPORT Personal Care',
        description: 'Medicaid waiver personal care services',
        requiredLicense: 'oda_passport',
        medicaidBillable: true,
        ratePerUnit: 7.24,
        unitType: '15min',
        status: 'available'
      });
    }

    return services;
  }

  private getBlockedServices(activeLicenses: Set<LicenseType>): ServiceCapability[] {
    const blocked: ServiceCapability[] = [];

    if (!activeLicenses.has('oda_passport')) {
      blocked.push({
        serviceCode: 'T1019_PASSPORT',
        serviceName: 'PASSPORT Personal Care',
        description: 'Medicaid waiver personal care services',
        requiredLicense: 'oda_passport',
        medicaidBillable: true,
        ratePerUnit: 7.24,
        unitType: '15min',
        status: 'blocked',
        blockReason: 'Requires ODA PASSPORT certification'
      });
    }

    if (!activeLicenses.has('oda_cdpc')) {
      blocked.push({
        serviceCode: 'T1019_CDPC',
        serviceName: 'Consumer-Directed Personal Care',
        description: 'Self-directed care model',
        requiredLicense: 'oda_cdpc',
        medicaidBillable: true,
        ratePerUnit: 3.44,
        unitType: '15min',
        status: 'blocked',
        blockReason: 'Requires ODA CDPC certification'
      });
    }

    if (!activeLicenses.has('dodd_hpc')) {
      blocked.push({
        serviceCode: 'HPC',
        serviceName: 'Homemaker/Personal Care (DD)',
        description: 'DD waiver services',
        requiredLicense: 'dodd_hpc',
        medicaidBillable: true,
        ratePerUnit: 7.15,
        unitType: '15min',
        status: 'blocked',
        blockReason: 'Requires DODD HPC certification'
      });
    }

    if (!activeLicenses.has('skilled_home_health')) {
      blocked.push({
        serviceCode: 'T1001',
        serviceName: 'Skilled Nursing (RN)',
        description: 'Nursing assessment and skilled care',
        requiredLicense: 'skilled_home_health',
        medicaidBillable: true,
        ratePerUnit: null,
        unitType: 'visit',
        status: 'blocked',
        blockReason: 'Requires Skilled Home Health License from ODH'
      });
    }

    return blocked;
  }

  private getAllServiceCapabilities(licenses: OrganizationLicense[]): ServiceCapability[] {
    const activeLicenses = new Set(
      licenses.filter(l => l.status === 'active').map(l => l.licenseType)
    );
    return [
      ...this.getUnlockedServices(activeLicenses),
      ...this.getBlockedServices(activeLicenses)
    ];
  }

  private checkServiceAuthorizationLocal(
    serviceCode: string,
    licenses: OrganizationLicense[]
  ): { authorized: boolean; reason?: string; requiredLicense?: LicenseType; unlockUrl?: string } {
    const serviceMap: Record<string, LicenseType> = {
      'T1019': 'non_medical_home_health',
      'S5130': 'non_medical_home_health',
      'S5150': 'non_medical_home_health',
      'T1019_PASSPORT': 'oda_passport',
      'T1019_CDPC': 'oda_cdpc',
      'HPC': 'dodd_hpc',
      'T1001': 'skilled_home_health',
      'T1002': 'skilled_home_health'
    };

    const requiredLicense = serviceMap[serviceCode];
    if (!requiredLicense) {
      return { authorized: false, reason: 'Unknown service code' };
    }

    const hasLicense = licenses.some(
      l => l.licenseType === requiredLicense && l.status === 'active'
    );

    if (hasLicense) {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: `This service requires ${LICENSE_REQUIREMENTS[requiredLicense].displayName}`,
      requiredLicense,
      unlockUrl: `/admin/licenses/apply?type=${requiredLicense}`
    };
  }
}

// License requirement definitions
const LICENSE_REQUIREMENTS: Record<LicenseType, LicenseRequirement> = {
  non_medical_home_health: {
    licenseType: 'non_medical_home_health',
    displayName: 'Non-Medical Home Health License',
    issuingAuthority: 'Ohio Department of Health (ODH)',
    applicationFee: 250,
    bondRequired: null,
    estimatedTimelineDays: 30,
    requirements: [
      'Complete ODH application form',
      'Pay $250 application fee',
      'Pass administrator qualification review',
      'Establish policies and procedures',
      'Complete on-site survey'
    ],
    applicationUrl: 'https://odh.ohio.gov/know-our-programs/non-medical-home-health'
  },
  skilled_home_health: {
    licenseType: 'skilled_home_health',
    displayName: 'Skilled Home Health License',
    issuingAuthority: 'Ohio Department of Health (ODH)',
    applicationFee: 250,
    bondRequired: 50000,
    estimatedTimelineDays: 90,
    requirements: [
      'Complete ODH skilled home health application',
      'Pay $250 application fee',
      'Post $50,000 surety bond',
      'Employ qualified RN as Director of Nursing',
      'Establish clinical policies and procedures',
      'Pass on-site survey'
    ],
    applicationUrl: 'https://odh.ohio.gov/know-our-programs/home-health-agency'
  },
  oda_passport: {
    licenseType: 'oda_passport',
    displayName: 'ODA PASSPORT Provider Certification',
    issuingAuthority: 'Ohio Department of Aging (ODA)',
    applicationFee: 730,
    bondRequired: null,
    estimatedTimelineDays: 75,
    requirements: [
      'Complete Provider Network Module (PNM) application',
      'Pay $730 application fee',
      'Complete provider orientation training',
      'Pass background check requirements',
      'Establish EVV system',
      'Complete Medicaid enrollment'
    ],
    applicationUrl: 'https://aging.ohio.gov/providers'
  },
  oda_cdpc: {
    licenseType: 'oda_cdpc',
    displayName: 'ODA Consumer-Directed PC Certification',
    issuingAuthority: 'Ohio Department of Aging (ODA)',
    applicationFee: 730,
    bondRequired: null,
    estimatedTimelineDays: 60,
    requirements: [
      'Have active ODA provider certification',
      'Complete separate CDPC application',
      'Establish FMS provider relationship',
      'Train staff on consumer-directed model',
      'Set up timesheet approval workflows'
    ],
    applicationUrl: 'https://aging.ohio.gov/providers/consumer-directed'
  },
  oda_choices: {
    licenseType: 'oda_choices',
    displayName: 'ODA Ohio Choices Provider Certification',
    issuingAuthority: 'Ohio Department of Aging (ODA)',
    applicationFee: 730,
    bondRequired: null,
    estimatedTimelineDays: 60,
    requirements: [
      'Have active ODA provider certification',
      'Complete Ohio Choices waiver application',
      'Complete additional training modules',
      'Establish quality assurance processes'
    ],
    applicationUrl: 'https://aging.ohio.gov/providers/choices'
  },
  dodd_hpc: {
    licenseType: 'dodd_hpc',
    displayName: 'DODD HPC Provider Certification',
    issuingAuthority: 'Ohio Department of DD (DODD)',
    applicationFee: 0,
    bondRequired: null,
    estimatedTimelineDays: 105,
    requirements: [
      'Complete DODD Independent Provider Application',
      'Pass background check (BCI + FBI)',
      'Complete EVV certification training',
      'Complete DD-specific orientation',
      'Establish ISP documentation processes',
      'Complete First Aid/CPR with in-person assessment'
    ],
    applicationUrl: 'https://dodd.ohio.gov/providers'
  },
  dodd_nmt: {
    licenseType: 'dodd_nmt',
    displayName: 'DODD Non-Medical Transport Certification',
    issuingAuthority: 'Ohio Department of DD (DODD)',
    applicationFee: 0,
    bondRequired: null,
    estimatedTimelineDays: 60,
    requirements: [
      'Have active DODD provider certification',
      'Complete NMT provider application',
      'Pass vehicle inspection',
      'Maintain adequate insurance coverage',
      'Complete driver training requirements'
    ],
    applicationUrl: 'https://dodd.ohio.gov/providers/nmt'
  }
};

export const licenseService = new LicenseService();
