/**
 * Billing Dashboard Service
 * Claims processing, denial management, and revenue optimization
 */

export interface Claim {
  id: string;
  patientName: string;
  serviceDate: string;
  provider: string;
  amount: number;
  status: 'submitted' | 'pending' | 'approved' | 'denied' | 'paid';
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

class BillingDashboardService {
  async getClaims(): Promise<Claim[]> {
    await this.delay(500);
    return [
      {
        id: 'CLM-001',
        patientName: 'Eleanor Johnson',
        serviceDate: '2024-01-15',
        provider: 'Maria Rodriguez',
        amount: 145.50,
        status: 'approved',
        payer: 'Medicare',
        submissionDate: '2024-01-16',
        daysInCycle: 12
      },
      {
        id: 'CLM-002',
        patientName: 'Robert Smith',
        serviceDate: '2024-01-14',
        provider: 'David Chen',
        amount: 189.00,
        status: 'pending',
        payer: 'Medicaid',
        submissionDate: '2024-01-15',
        daysInCycle: 8
      },
      {
        id: 'CLM-003',
        patientName: 'Mary Williams',
        serviceDate: '2024-01-13',
        provider: 'Lisa Rodriguez',
        amount: 125.00,
        status: 'denied',
        payer: 'Aetna',
        submissionDate: '2024-01-14',
        daysInCycle: 15
      }
    ];
  }

  async getDenialAnalysis(): Promise<DenialAnalysis[]> {
    await this.delay(600);
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
      }
    ];
  }

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    await this.delay(400);
    return {
      totalRevenue: 2150000,
      collectedRevenue: 1935000,
      pendingAmount: 185000,
      deniedAmount: 30000,
      daysInAR: 28,
      collectionRate: 90.0
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const billingDashboardService = new BillingDashboardService();