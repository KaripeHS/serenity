/**
 * Billing Dashboard Service
 * Claims processing, denial management, AR aging, and revenue optimization
 * Integrates with backend APIs with mock fallback
 */

import { arAgingApi, denialsApi, claimsApi, ARAgingSummary, ARKPIs, Denial, Claim as ApiClaim } from './api';

export interface Claim {
  id: string;
  claimNumber?: string;
  patientName: string;
  serviceDate: string;
  provider: string;
  amount: number;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied' | 'paid' | 'partial';
  payer: string;
  submissionDate: string;
  daysInCycle: number;
}

export interface DenialAnalysis {
  denialCode: string;
  description: string;
  count: number;
  totalAmount: number;
  appealSuccess: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RevenueMetrics {
  totalRevenue: number;
  collectedRevenue: number;
  pendingAmount: number;
  deniedAmount: number;
  daysInAR: number;
  collectionRate: number;
}

export interface ARAgingBucket {
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface BillingDashboardData {
  metrics: RevenueMetrics;
  arAging: {
    summary: ARAgingSummary;
    buckets: ARAgingBucket[];
    kpis: ARKPIs;
    atRisk: any[];
    byPayer: any[];
  };
  denials: {
    total: number;
    open: number;
    totalAmount: number;
    recoveredThisMonth: number;
    recoveryRate: number;
    byCode: DenialAnalysis[];
    urgent: Denial[];
  };
  recentClaims: Claim[];
}

// Map API claim to local format
function mapApiClaim(apiClaim: ApiClaim): Claim {
  const submissionDate = apiClaim.submission_date ? new Date(apiClaim.submission_date) : new Date(apiClaim.created_at);
  const now = new Date();
  const daysInCycle = Math.floor((now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: apiClaim.id,
    claimNumber: apiClaim.claim_number,
    patientName: apiClaim.client_name,
    serviceDate: apiClaim.service_date_from,
    provider: '', // Would come from visit/assignment data
    amount: apiClaim.total_charges,
    status: apiClaim.status === 'validated' ? 'pending' : apiClaim.status as any,
    payer: apiClaim.payer_name,
    submissionDate: apiClaim.submission_date || apiClaim.created_at,
    daysInCycle,
  };
}

class BillingDashboardService {
  /**
   * Get full billing dashboard data
   */
  async getDashboard(): Promise<BillingDashboardData> {
    try {
      const [arDashboard, denialsDashboard, claimsDashboard] = await Promise.all([
        arAgingApi.getDashboard(),
        denialsApi.getDashboard(),
        claimsApi.getDashboard().catch(() => null),
      ]);

      // Transform AR aging to buckets
      const arBuckets: ARAgingBucket[] = [
        { label: 'Current', count: arDashboard.summary.current.count, amount: arDashboard.summary.current.amount, percentage: 0 },
        { label: '1-30 Days', count: arDashboard.summary.days_1_30.count, amount: arDashboard.summary.days_1_30.amount, percentage: 0 },
        { label: '31-60 Days', count: arDashboard.summary.days_31_60.count, amount: arDashboard.summary.days_31_60.amount, percentage: 0 },
        { label: '61-90 Days', count: arDashboard.summary.days_61_90.count, amount: arDashboard.summary.days_61_90.amount, percentage: 0 },
        { label: '90+ Days', count: arDashboard.summary.days_91_plus.count, amount: arDashboard.summary.days_91_plus.amount, percentage: 0 },
      ];

      // Calculate percentages
      const totalAR = arDashboard.summary.total.amount || 1;
      arBuckets.forEach(bucket => {
        bucket.percentage = (bucket.amount / totalAR) * 100;
      });

      // Map denials by code
      const denialsByCode: DenialAnalysis[] = denialsDashboard.byCode?.map((d: any) => ({
        denialCode: d.code,
        description: d.reason || d.code,
        count: d.count,
        totalAmount: d.amount,
        appealSuccess: 65, // Would come from historical data
        trend: 'stable' as const,
      })) || [];

      return {
        metrics: {
          totalRevenue: claimsDashboard?.revenue || 2150000,
          collectedRevenue: claimsDashboard?.paid || 1935000,
          pendingAmount: arDashboard.summary.total.amount,
          deniedAmount: denialsDashboard.totalDeniedAmount,
          daysInAR: arDashboard.kpis.dso,
          collectionRate: arDashboard.kpis.collectionRate,
        },
        arAging: {
          summary: arDashboard.summary,
          buckets: arBuckets,
          kpis: arDashboard.kpis,
          atRisk: arDashboard.atRisk,
          byPayer: arDashboard.byPayer,
        },
        denials: {
          total: denialsDashboard.totalDenials,
          open: denialsDashboard.openDenials,
          totalAmount: denialsDashboard.totalDeniedAmount,
          recoveredThisMonth: denialsDashboard.recoveredThisMonth,
          recoveryRate: denialsDashboard.recoveryRate,
          byCode: denialsByCode,
          urgent: denialsDashboard.urgentItems,
        },
        recentClaims: [],
      };
    } catch (error) {
      console.warn('Backend API not available, using mock data');
      return this.getMockDashboard();
    }
  }

  /**
   * Get claims list
   */
  async getClaims(filters?: { status?: string; payerId?: string }): Promise<Claim[]> {
    try {
      const response = await claimsApi.getClaims(filters);
      return response.claims.map(mapApiClaim);
    } catch (error) {
      console.warn('Backend API not available, using mock data for claims');
      return this.getMockClaims();
    }
  }

  /**
   * Get AR aging summary
   */
  async getARAgingSummary(): Promise<{ summary: ARAgingSummary; buckets: ARAgingBucket[] }> {
    try {
      const response = await arAgingApi.getSummary();
      const totalAmount = response.summary.total.amount || 1;

      const buckets: ARAgingBucket[] = [
        { label: 'Current', ...response.summary.current, percentage: (response.summary.current.amount / totalAmount) * 100 },
        { label: '1-30 Days', ...response.summary.days_1_30, percentage: (response.summary.days_1_30.amount / totalAmount) * 100 },
        { label: '31-60 Days', ...response.summary.days_31_60, percentage: (response.summary.days_31_60.amount / totalAmount) * 100 },
        { label: '61-90 Days', ...response.summary.days_61_90, percentage: (response.summary.days_61_90.amount / totalAmount) * 100 },
        { label: '90+ Days', ...response.summary.days_91_plus, percentage: (response.summary.days_91_plus.amount / totalAmount) * 100 },
      ];

      return { summary: response.summary, buckets };
    } catch (error) {
      console.warn('Backend API not available');
      return this.getMockARSummary();
    }
  }

  /**
   * Get AR KPIs
   */
  async getARKPIs(): Promise<ARKPIs> {
    try {
      const response = await arAgingApi.getKPIs();
      return response.kpis;
    } catch (error) {
      console.warn('Backend API not available');
      return {
        dso: 28,
        collectionRate: 94.2,
        denialRate: 5.8,
        cleanClaimRate: 92.5,
        avgPaymentTime: 21,
      };
    }
  }

  /**
   * Get claims at risk (timely filing approaching)
   */
  async getClaimsAtRisk(): Promise<any[]> {
    try {
      const response = await arAgingApi.getAtRisk();
      return response.atRisk;
    } catch (error) {
      console.warn('Backend API not available');
      return [];
    }
  }

  /**
   * Get denials list
   */
  async getDenials(filters?: { status?: string; priority?: string }): Promise<Denial[]> {
    try {
      const response = await denialsApi.getDenials(filters);
      return response.denials;
    } catch (error) {
      console.warn('Backend API not available');
      return [];
    }
  }

  /**
   * Get denial analytics by code
   */
  async getDenialAnalysis(): Promise<DenialAnalysis[]> {
    try {
      const response = await denialsApi.getAnalyticsByCode();
      return response.analytics.map((a: any) => ({
        denialCode: a.code,
        description: a.reason || a.description || a.code,
        count: a.count,
        totalAmount: a.amount || a.totalAmount,
        appealSuccess: a.appealSuccessRate || 65,
        trend: a.trend || 'stable',
      }));
    } catch (error) {
      console.warn('Backend API not available, using mock data');
      return this.getMockDenialAnalysis();
    }
  }

  /**
   * Start reviewing a denial
   */
  async startDenialReview(denialId: string): Promise<Denial | null> {
    try {
      const response = await denialsApi.startReview(denialId);
      return response.denial;
    } catch (error) {
      console.error('Failed to start denial review:', error);
      throw error;
    }
  }

  /**
   * File an appeal for a denial
   */
  async fileAppeal(denialId: string, appealReason: string, deadline?: string): Promise<Denial | null> {
    try {
      const response = await denialsApi.fileAppeal(denialId, { appealReason, appealDeadline: deadline });
      return response.denial;
    } catch (error) {
      console.error('Failed to file appeal:', error);
      throw error;
    }
  }

  /**
   * Resolve a denial
   */
  async resolveDenial(denialId: string, resolution: 'recovered' | 'written_off' | 'upheld', recoveredAmount?: number): Promise<Denial | null> {
    try {
      const response = await denialsApi.resolveDenial(denialId, { resolution, recoveredAmount });
      return response.denial;
    } catch (error) {
      console.error('Failed to resolve denial:', error);
      throw error;
    }
  }

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const [arKpis, denialsDashboard] = await Promise.all([
        arAgingApi.getKPIs(),
        denialsApi.getDashboard(),
      ]);

      return {
        totalRevenue: 2150000,
        collectedRevenue: 1935000,
        pendingAmount: 185000,
        deniedAmount: denialsDashboard.totalDeniedAmount,
        daysInAR: arKpis.kpis.dso,
        collectionRate: arKpis.kpis.collectionRate,
      };
    } catch (error) {
      return {
        totalRevenue: 2150000,
        collectedRevenue: 1935000,
        pendingAmount: 185000,
        deniedAmount: 30000,
        daysInAR: 28,
        collectionRate: 90.0
      };
    }
  }

  // Mock data fallbacks
  private getMockDashboard(): BillingDashboardData {
    return {
      metrics: {
        totalRevenue: 2150000,
        collectedRevenue: 1935000,
        pendingAmount: 185000,
        deniedAmount: 30000,
        daysInAR: 28,
        collectionRate: 90.0,
      },
      arAging: {
        summary: {
          current: { count: 45, amount: 45000 },
          days_1_30: { count: 62, amount: 78000 },
          days_31_60: { count: 28, amount: 35000 },
          days_61_90: { count: 12, amount: 18000 },
          days_91_plus: { count: 8, amount: 9000 },
          total: { count: 155, amount: 185000 },
        },
        buckets: [
          { label: 'Current', count: 45, amount: 45000, percentage: 24.3 },
          { label: '1-30 Days', count: 62, amount: 78000, percentage: 42.2 },
          { label: '31-60 Days', count: 28, amount: 35000, percentage: 18.9 },
          { label: '61-90 Days', count: 12, amount: 18000, percentage: 9.7 },
          { label: '90+ Days', count: 8, amount: 9000, percentage: 4.9 },
        ],
        kpis: {
          dso: 28,
          collectionRate: 94.2,
          denialRate: 5.8,
          cleanClaimRate: 92.5,
          avgPaymentTime: 21,
        },
        atRisk: [],
        byPayer: [],
      },
      denials: {
        total: 47,
        open: 23,
        totalAmount: 30000,
        recoveredThisMonth: 12500,
        recoveryRate: 65,
        byCode: this.getMockDenialAnalysis(),
        urgent: [],
      },
      recentClaims: this.getMockClaims(),
    };
  }

  private getMockClaims(): Claim[] {
    return [
      {
        id: 'CLM-001',
        claimNumber: 'CLM-2024-001',
        patientName: 'Eleanor Johnson',
        serviceDate: '2024-12-10',
        provider: 'Maria Rodriguez',
        amount: 145.50,
        status: 'approved',
        payer: 'Medicare',
        submissionDate: '2024-12-11',
        daysInCycle: 3
      },
      {
        id: 'CLM-002',
        claimNumber: 'CLM-2024-002',
        patientName: 'Robert Smith',
        serviceDate: '2024-12-09',
        provider: 'David Chen',
        amount: 189.00,
        status: 'pending',
        payer: 'Medicaid',
        submissionDate: '2024-12-10',
        daysInCycle: 4
      },
      {
        id: 'CLM-003',
        claimNumber: 'CLM-2024-003',
        patientName: 'Mary Williams',
        serviceDate: '2024-12-08',
        provider: 'Lisa Rodriguez',
        amount: 125.00,
        status: 'denied',
        payer: 'Aetna',
        submissionDate: '2024-12-09',
        daysInCycle: 5
      }
    ];
  }

  private getMockDenialAnalysis(): DenialAnalysis[] {
    return [
      {
        denialCode: 'CO-16',
        description: 'Claim lacks information',
        count: 15,
        totalAmount: 2250.00,
        appealSuccess: 85,
        trend: 'down'
      },
      {
        denialCode: 'CO-97',
        description: 'Payment adjusted due to previous payment',
        count: 8,
        totalAmount: 1120.00,
        appealSuccess: 45,
        trend: 'stable'
      },
      {
        denialCode: 'CO-4',
        description: 'Service not covered by plan',
        count: 6,
        totalAmount: 980.00,
        appealSuccess: 25,
        trend: 'up'
      },
      {
        denialCode: 'PR-1',
        description: 'Deductible amount',
        count: 12,
        totalAmount: 1800.00,
        appealSuccess: 0,
        trend: 'stable'
      }
    ];
  }

  private getMockARSummary(): { summary: ARAgingSummary; buckets: ARAgingBucket[] } {
    const summary: ARAgingSummary = {
      current: { count: 45, amount: 45000 },
      days_1_30: { count: 62, amount: 78000 },
      days_31_60: { count: 28, amount: 35000 },
      days_61_90: { count: 12, amount: 18000 },
      days_91_plus: { count: 8, amount: 9000 },
      total: { count: 155, amount: 185000 },
    };

    const buckets: ARAgingBucket[] = [
      { label: 'Current', count: 45, amount: 45000, percentage: 24.3 },
      { label: '1-30 Days', count: 62, amount: 78000, percentage: 42.2 },
      { label: '31-60 Days', count: 28, amount: 35000, percentage: 18.9 },
      { label: '61-90 Days', count: 12, amount: 18000, percentage: 9.7 },
      { label: '90+ Days', count: 8, amount: 9000, percentage: 4.9 },
    ];

    return { summary, buckets };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const billingDashboardService = new BillingDashboardService();
