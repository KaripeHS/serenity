// Caregiver Bonus Service - Aligned with Serenity's Bonus Policy
// 90-Day Quality Bonus, Show Up Bonus (Quarterly), Hours Bonus (Annual)

import { bonusApi, BonusConfig, BonusDashboardResponse, BonusPayout } from './api';

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
export const mockCaregiverBonusData: CaregiverBonusEligibility[] = [
  {
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    hireDate: '2024-09-15',
    daysEmployed: 455,
    qualityBonus: {
      eligible: true,
      amount: 250,
      evvCompliance: 98.5,
      scheduledShiftsCompleted: 97.2,
      noCallNoShows: 0,
      substantiatedComplaints: 0,
      nextEligibleDate: '2025-01-15',
      status: 'eligible'
    },
    showUpBonus: {
      eligible: true,
      amount: 500,
      quarterStartDate: '2024-10-01',
      quarterEndDate: '2024-12-31',
      shiftsWorked: 65,
      shiftsRequired: 65,
      missedShifts: 0,
      status: 'eligible'
    },
    hoursBonus: {
      eligible: true,
      tier: 'gold',
      amount: 1000,
      hoursWorked: 2150,
      yearStartDate: '2024-01-01',
      yearEndDate: '2024-12-31',
      status: 'eligible'
    },
    totalEarned: 2500,
    totalPending: 1750
  },
  {
    caregiverId: 'cg-002',
    caregiverName: 'James Wilson',
    hireDate: '2024-11-01',
    daysEmployed: 43,
    qualityBonus: {
      eligible: false,
      amount: 250,
      evvCompliance: 96.1,
      scheduledShiftsCompleted: 98.0,
      noCallNoShows: 0,
      substantiatedComplaints: 0,
      nextEligibleDate: '2025-01-30',
      status: 'pending'
    },
    showUpBonus: {
      eligible: false,
      amount: 500,
      quarterStartDate: '2024-10-01',
      quarterEndDate: '2024-12-31',
      shiftsWorked: 18,
      shiftsRequired: 20,
      missedShifts: 2,
      status: 'ineligible'
    },
    hoursBonus: {
      eligible: false,
      tier: 'none',
      amount: 0,
      hoursWorked: 180,
      yearStartDate: '2024-01-01',
      yearEndDate: '2024-12-31',
      status: 'pending'
    },
    totalEarned: 0,
    totalPending: 250
  },
  {
    caregiverId: 'cg-003',
    caregiverName: 'Sarah Johnson',
    hireDate: '2024-06-01',
    daysEmployed: 195,
    qualityBonus: {
      eligible: true,
      amount: 250,
      evvCompliance: 99.2,
      scheduledShiftsCompleted: 100,
      noCallNoShows: 0,
      substantiatedComplaints: 0,
      nextEligibleDate: '2025-03-01',
      status: 'paid'
    },
    showUpBonus: {
      eligible: true,
      amount: 500,
      quarterStartDate: '2024-10-01',
      quarterEndDate: '2024-12-31',
      shiftsWorked: 72,
      shiftsRequired: 72,
      missedShifts: 0,
      status: 'eligible'
    },
    hoursBonus: {
      eligible: true,
      tier: 'silver',
      amount: 750,
      hoursWorked: 1820,
      yearStartDate: '2024-01-01',
      yearEndDate: '2024-12-31',
      status: 'eligible'
    },
    totalEarned: 1750,
    totalPending: 1250
  },
  {
    caregiverId: 'cg-004',
    caregiverName: 'Michael Brown',
    hireDate: '2024-03-15',
    daysEmployed: 273,
    qualityBonus: {
      eligible: false,
      amount: 250,
      evvCompliance: 91.3,
      scheduledShiftsCompleted: 88.5,
      noCallNoShows: 2,
      substantiatedComplaints: 0,
      nextEligibleDate: '2025-06-15',
      status: 'ineligible'
    },
    showUpBonus: {
      eligible: false,
      amount: 500,
      quarterStartDate: '2024-10-01',
      quarterEndDate: '2024-12-31',
      shiftsWorked: 55,
      shiftsRequired: 68,
      missedShifts: 13,
      status: 'ineligible'
    },
    hoursBonus: {
      eligible: true,
      tier: 'bronze',
      amount: 500,
      hoursWorked: 1550,
      yearStartDate: '2024-01-01',
      yearEndDate: '2024-12-31',
      status: 'eligible'
    },
    totalEarned: 250,
    totalPending: 500
  },
  {
    caregiverId: 'cg-005',
    caregiverName: 'Emily Davis',
    hireDate: '2024-08-20',
    daysEmployed: 115,
    qualityBonus: {
      eligible: true,
      amount: 250,
      evvCompliance: 97.8,
      scheduledShiftsCompleted: 96.5,
      noCallNoShows: 0,
      substantiatedComplaints: 0,
      nextEligibleDate: '2025-02-17',
      status: 'paid'
    },
    showUpBonus: {
      eligible: true,
      amount: 500,
      quarterStartDate: '2024-10-01',
      quarterEndDate: '2024-12-31',
      shiftsWorked: 45,
      shiftsRequired: 45,
      missedShifts: 0,
      status: 'eligible'
    },
    hoursBonus: {
      eligible: false,
      tier: 'none',
      amount: 0,
      hoursWorked: 720,
      yearStartDate: '2024-01-01',
      yearEndDate: '2024-12-31',
      status: 'pending'
    },
    totalEarned: 500,
    totalPending: 500
  },
  {
    caregiverId: 'cg-006',
    caregiverName: 'David Martinez',
    hireDate: '2024-02-01',
    daysEmployed: 316,
    qualityBonus: {
      eligible: true,
      amount: 250,
      evvCompliance: 98.9,
      scheduledShiftsCompleted: 99.1,
      noCallNoShows: 0,
      substantiatedComplaints: 0,
      nextEligibleDate: '2025-05-01',
      status: 'paid'
    },
    showUpBonus: {
      eligible: true,
      amount: 500,
      quarterStartDate: '2024-10-01',
      quarterEndDate: '2024-12-31',
      shiftsWorked: 78,
      shiftsRequired: 78,
      missedShifts: 0,
      status: 'paid'
    },
    hoursBonus: {
      eligible: true,
      tier: 'gold',
      amount: 1000,
      hoursWorked: 2280,
      yearStartDate: '2024-01-01',
      yearEndDate: '2024-12-31',
      status: 'eligible'
    },
    totalEarned: 3250,
    totalPending: 1000
  }
];

export const mockPaymentHistory: BonusPaymentHistory[] = [
  {
    id: 'pay-001',
    caregiverId: 'cg-001',
    caregiverName: 'Maria Garcia',
    bonusType: '90_day_quality',
    amount: 250,
    periodStart: '2024-09-15',
    periodEnd: '2024-12-14',
    paidDate: '2024-12-20',
    payrollRunId: 'pr-2024-51'
  },
  {
    id: 'pay-002',
    caregiverId: 'cg-003',
    caregiverName: 'Sarah Johnson',
    bonusType: '90_day_quality',
    amount: 250,
    periodStart: '2024-06-01',
    periodEnd: '2024-08-30',
    paidDate: '2024-09-15',
    payrollRunId: 'pr-2024-37'
  },
  {
    id: 'pay-003',
    caregiverId: 'cg-006',
    caregiverName: 'David Martinez',
    bonusType: 'show_up_quarterly',
    amount: 500,
    periodStart: '2024-07-01',
    periodEnd: '2024-09-30',
    paidDate: '2024-10-15',
    payrollRunId: 'pr-2024-42'
  },
  {
    id: 'pay-004',
    caregiverId: 'cg-005',
    caregiverName: 'Emily Davis',
    bonusType: '90_day_quality',
    amount: 250,
    periodStart: '2024-08-20',
    periodEnd: '2024-11-18',
    paidDate: '2024-11-30',
    payrollRunId: 'pr-2024-48'
  },
  {
    id: 'pay-005',
    caregiverId: 'cg-006',
    caregiverName: 'David Martinez',
    bonusType: '90_day_quality',
    amount: 250,
    periodStart: '2024-02-01',
    periodEnd: '2024-05-01',
    paidDate: '2024-05-15',
    payrollRunId: 'pr-2024-20'
  }
];

export const mockDashboardSummary: BonusDashboardSummary = {
  totalCaregivers: 6,
  eligibleForQualityBonus: 3,
  eligibleForShowUpBonus: 4,
  eligibleForHoursBonus: 4,
  totalBonusesPaidYTD: 8250,
  totalBonusesPending: 5250,
  averageEVVCompliance: 96.8,
  averageShiftCompletion: 96.5
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

let USE_MOCK_DATA = false; // Set to true to use mock data

export const bonusService = {
  async getConfig(): Promise<BonusConfig> {
    if (USE_MOCK_DATA) {
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
      console.error('Failed to fetch bonus config, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getConfig();
    }
  },

  async getDashboard(quarter?: number, year?: number): Promise<BonusDashboardResponse> {
    if (USE_MOCK_DATA) {
      return {
        period: {
          quarter: quarter || 4,
          year: year || 2024,
          label: `Q${quarter || 4} ${year || 2024}`,
          startDate: '2024-10-01',
          endDate: '2024-12-31',
        },
        summary: {
          totalCaregivers: mockDashboardSummary.totalCaregivers,
          eligibleForShowUp: mockDashboardSummary.eligibleForShowUpBonus,
          ineligible: mockDashboardSummary.totalCaregivers - mockDashboardSummary.eligibleForShowUpBonus,
          eligibilityRate: Math.round((mockDashboardSummary.eligibleForShowUpBonus / mockDashboardSummary.totalCaregivers) * 100),
          totalPotentialPayout: mockDashboardSummary.eligibleForShowUpBonus * 500,
          newHires: 2,
        },
        disqualificationBreakdown: {
          'Low EVV Compliance': 1,
          'NCNS Incidents': 1,
        },
        caregivers: mockCaregiverBonusData.map(cg => ({
          id: cg.caregiverId,
          name: cg.caregiverName,
          hireDate: cg.hireDate,
          daysEmployed: cg.daysEmployed,
          showUpEligibility: {
            isEligible: cg.showUpBonus.eligible,
            metrics: {
              evvCompliance: cg.qualityBonus.evvCompliance,
              shiftAttendance: (cg.showUpBonus.shiftsWorked / cg.showUpBonus.shiftsRequired) * 100,
              ncnsCount: cg.qualityBonus.noCallNoShows,
              complaintsCount: cg.qualityBonus.substantiatedComplaints,
            },
            disqualificationReasons: !cg.showUpBonus.eligible ? ['Did not meet criteria'] : [],
          },
          isNewHire: cg.daysEmployed <= 90,
        })),
        timestamp: new Date().toISOString(),
      };
    }
    try {
      return await bonusApi.getDashboard(quarter, year);
    } catch (error) {
      console.error('Failed to fetch bonus dashboard, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getDashboard(quarter, year);
    }
  },

  async getPayouts(filters?: { caregiverId?: string; bonusType?: string; status?: string; year?: number }): Promise<{ payouts: BonusPayout[]; totals: Record<string, number> }> {
    if (USE_MOCK_DATA) {
      const payouts = mockPaymentHistory.map(p => ({
        id: p.id,
        caregiver_id: p.caregiverId,
        caregiver_name: p.caregiverName,
        bonus_type: p.bonusType,
        period_label: `${p.periodStart} - ${p.periodEnd}`,
        amount: p.amount,
        status: 'paid',
        scheduled_payout_date: p.paidDate,
        payroll_reference: p.payrollRunId,
      }));
      return {
        payouts,
        totals: { total: payouts.reduce((sum, p) => sum + p.amount, 0), paid: payouts.length * 250 },
      };
    }
    try {
      return await bonusApi.getPayouts(filters);
    } catch (error) {
      console.error('Failed to fetch payouts, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getPayouts(filters);
    }
  },

  async getCaregiverBonus(caregiverId: string): Promise<CaregiverBonusEligibility | null> {
    if (USE_MOCK_DATA) {
      return mockCaregiverBonusData.find(cg => cg.caregiverId === caregiverId) || null;
    }
    try {
      const result = await bonusApi.getCaregiverBonus(caregiverId);
      return result.summary;
    } catch (error) {
      console.error('Failed to fetch caregiver bonus, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getCaregiverBonus(caregiverId);
    }
  },

  async approvePayout(payoutId: string): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
      const targetYear = year || new Date().getFullYear();
      return {
        year: targetYear,
        scheduledPayouts: [
          { month: 'January', bonusType: 'show_up', description: 'Show Up Bonus for Q4', periodLabel: `Q4 ${targetYear - 1}` },
          { month: 'April', bonusType: 'show_up', description: 'Show Up Bonus for Q1', periodLabel: `Q1 ${targetYear}` },
          { month: 'June', bonusType: 'hours', description: 'Hours Bonus (50%)', periodLabel: `Year ${targetYear - 1}` },
          { month: 'July', bonusType: 'show_up', description: 'Show Up Bonus for Q2', periodLabel: `Q2 ${targetYear}` },
          { month: 'October', bonusType: 'show_up', description: 'Show Up Bonus for Q3', periodLabel: `Q3 ${targetYear}` },
          { month: 'December', bonusType: 'hours', description: 'Hours Bonus (50%)', periodLabel: `Year ${targetYear - 1}` },
        ],
        rollingBonuses: [
          { bonusType: '90-day', description: '90-Day Bonus', timing: 'After 90 days employment' },
          { bonusType: 'loyalty', description: 'Loyalty Bonus', timing: 'On anniversary date' },
        ],
      };
    }
    try {
      return await bonusApi.getCalendar(year);
    } catch (error) {
      console.error('Failed to fetch calendar, using mock data', error);
      USE_MOCK_DATA = true;
      return this.getCalendar(year);
    }
  },

  // Get summary for dashboard
  getSummary(): BonusDashboardSummary {
    return mockDashboardSummary;
  },

  // Get all caregivers' bonus data
  getAllCaregivers(): CaregiverBonusEligibility[] {
    return mockCaregiverBonusData;
  },

  // Get payment history
  getPaymentHistory(): BonusPaymentHistory[] {
    return mockPaymentHistory;
  },
};
