// Caregiver Bonus Service - Aligned with Serenity's Bonus Policy
// 90-Day Quality Bonus, Show Up Bonus (Quarterly), Hours Bonus (Annual)

import { bonusApi, BonusConfig, BonusDashboardResponse, BonusPayout } from './api';
import { shouldUseMockData } from '../config/environment';

export interface CaregiverBonusEligibility {
  caregiverId: string;
  caregiverName: string;
  hireDate: string;
  daysEmployed: number;

  // 90-Day Quality Bonus Requirements
  qualityBonus: {
    eligible: boolean;
    amount: number; // $250 if all criteria met
    evvCompliance: number; // Target: 95%+
    scheduledShiftsCompleted: number; // Target: 95%+
    noCallNoShows: number; // Target: 0
    substantiatedComplaints: number; // Target: 0
    nextEligibleDate: string;
    status: 'eligible' | 'pending' | 'ineligible' | 'paid';
  };

  // Show Up Bonus (Quarterly)
  showUpBonus: {
    eligible: boolean;
    amount: number; // $500 per quarter
    quarterStartDate: string;
    quarterEndDate: string;
    shiftsWorked: number;
    shiftsRequired: number; // All assigned shifts
    missedShifts: number;
    status: 'eligible' | 'pending' | 'ineligible' | 'paid';
  };

  // Hours Bonus (Annual)
  hoursBonus: {
    eligible: boolean;
    tier: 'none' | 'bronze' | 'silver' | 'gold';
    amount: number;
    hoursWorked: number;
    yearStartDate: string;
    yearEndDate: string;
    // Bronze: 1,500 hours = $500
    // Silver: 1,750 hours = $750
    // Gold: 2,000+ hours = $1,000
    status: 'eligible' | 'pending' | 'ineligible' | 'paid';
  };

  totalEarned: number;
  totalPending: number;
}

export interface BonusPaymentHistory {
  id: string;
  caregiverId: string;
  caregiverName: string;
  bonusType: '90_day_quality' | 'show_up_quarterly' | 'hours_annual';
  amount: number;
  periodStart: string;
  periodEnd: string;
  paidDate: string;
  payrollRunId?: string;
}

export interface BonusDashboardSummary {
  totalCaregivers: number;
  eligibleForQualityBonus: number;
  eligibleForShowUpBonus: number;
  eligibleForHoursBonus: number;
  totalBonusesPaidYTD: number;
  totalBonusesPending: number;
  averageEVVCompliance: number;
  averageShiftCompletion: number;
}

// Mock data for caregiver bonus eligibility
export const mockCaregiverBonusData: CaregiverBonusEligibility[] = [];

export const mockPaymentHistory: BonusPaymentHistory[] = [];

export const mockDashboardSummary: BonusDashboardSummary = {
  totalCaregivers: 0,
  eligibleForQualityBonus: 0,
  eligibleForShowUpBonus: 0,
  eligibleForHoursBonus: 0,
  totalBonusesPaidYTD: 0,
  totalBonusesPending: 0,
  averageEVVCompliance: 0,
  averageShiftCompletion: 0
};

// Bonus calculation utilities
export function calculateQualityBonusEligibility(
  evvCompliance: number,
  shiftCompletion: number,
  noCallNoShows: number,
  complaints: number
): boolean {
  return evvCompliance >= 95 &&
         shiftCompletion >= 95 &&
         noCallNoShows === 0 &&
         complaints === 0;
}

export function calculateHoursBonusTier(hours: number): { tier: 'none' | 'bronze' | 'silver' | 'gold'; amount: number } {
  if (hours >= 2000) return { tier: 'gold', amount: 1000 };
  if (hours >= 1750) return { tier: 'silver', amount: 750 };
  if (hours >= 1500) return { tier: 'bronze', amount: 500 };
  return { tier: 'none', amount: 0 };
}

export function formatBonusType(type: string): string {
  switch (type) {
    case '90_day_quality': return '90-Day Quality Bonus';
    case 'show_up_quarterly': return 'Show Up Bonus (Quarterly)';
    case 'hours_annual': return 'Hours Bonus (Annual)';
    default: return type;
  }
}

// ============================================================================
// API Service Functions (with mock data fallback)
// ============================================================================

export const bonusService = {
  async getConfig(): Promise<BonusConfig> {
    if (shouldUseMockData()) {
      return {
        ninetyDayBonusAmount: 250,
        ninetyDayBonusEnabled: true,
        showUpBonusAmount: 500,
        showUpBonusEnabled: true,
        showUpShiftThreshold: 95,
        showUpEvvThreshold: 95,
        hoursBonusPercentage: 0.01,
        hoursBonusEnabled: true,
        loyaltyBonusEnabled: true,
        loyaltyBonusYear1: 200,
        loyaltyBonusYear2: 300,
        loyaltyBonusYear3: 400,
        loyaltyBonusYear4: 400,
        loyaltyBonusYear5Plus: 500,
      };
    }
    try {
      const result = await bonusApi.getConfig();
      return result.config;
    } catch (error) {
      console.error('Failed to fetch bonus config', error);
      throw error;
    }
  },

  async getDashboard(quarter?: number, year?: number): Promise<BonusDashboardResponse> {
    if (shouldUseMockData()) {
      return {
        period: {
          quarter: quarter || 4,
          year: year || 2024,
          label: `Q${quarter || 4} ${year || 2024}`,
          startDate: '2024-10-01',
          endDate: '2024-12-31',
        },
        summary: {
          totalCaregivers: 0,
          eligibleForShowUp: 0,
          ineligible: 0,
          eligibilityRate: 0,
          totalPotentialPayout: 0,
          newHires: 0,
        },
        disqualificationBreakdown: {},
        caregivers: [],
        timestamp: new Date().toISOString(),
      };
    }
    try {
      return await bonusApi.getDashboard(quarter, year);
    } catch (error) {
      console.error('Failed to fetch bonus dashboard', error);
      throw error;
    }
  },

  async getPayouts(filters?: { caregiverId?: string; bonusType?: string; status?: string; year?: number }): Promise<{ payouts: BonusPayout[]; totals: Record<string, number> }> {
    if (shouldUseMockData()) {
      return {
        payouts: [],
        totals: { total: 0, paid: 0 },
      };
    }
    try {
      return await bonusApi.getPayouts(filters);
    } catch (error) {
      console.error('Failed to fetch payouts', error);
      throw error;
    }
  },

  async getCaregiverBonus(caregiverId: string): Promise<CaregiverBonusEligibility | null> {
    if (shouldUseMockData()) {
      return null;
    }
    try {
      const result = await bonusApi.getCaregiverBonus(caregiverId);
      return result.summary;
    } catch (error) {
      console.error('Failed to fetch caregiver bonus', error);
      throw error;
    }
  },

  async approvePayout(payoutId: string): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      await bonusApi.approvePayout(payoutId);
      return { success: true };
    } catch (error) {
      console.error('Failed to approve payout', error);
      return { success: false };
    }
  },

  async markPaid(payoutId: string, payrollReference: string): Promise<{ success: boolean }> {
    if (shouldUseMockData()) {
      return { success: true };
    }
    try {
      await bonusApi.markPaid(payoutId, payrollReference);
      return { success: true };
    } catch (error) {
      console.error('Failed to mark payout as paid', error);
      return { success: false };
    }
  },

  async getCalendar(year?: number): Promise<any> {
    if (shouldUseMockData()) {
      return {
        year: year || new Date().getFullYear(),
        scheduledPayouts: [],
        rollingBonuses: [],
      };
    }
    try {
      return await bonusApi.getCalendar(year);
    } catch (error) {
      console.error('Failed to fetch calendar', error);
      throw error;
    }
  },

  // Get summary for dashboard
  getSummary(): BonusDashboardSummary {
    if (!shouldUseMockData()) {
      return {
        totalCaregivers: 0,
        eligibleForQualityBonus: 0,
        eligibleForShowUpBonus: 0,
        eligibleForHoursBonus: 0,
        totalBonusesPaidYTD: 0,
        totalBonusesPending: 0,
        averageEVVCompliance: 0,
        averageShiftCompletion: 0
      };
    }
    return mockDashboardSummary;
  },

  // Get all caregivers' bonus data
  getAllCaregivers(): CaregiverBonusEligibility[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockCaregiverBonusData;
  },

  // Get payment history
  getPaymentHistory(): BonusPaymentHistory[] {
    if (!shouldUseMockData()) {
      return [];
    }
    return mockPaymentHistory;
  },
};
