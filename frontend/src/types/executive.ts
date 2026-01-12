/**
 * Executive Dashboard Types
 * TypeScript interfaces for CEO/Executive dashboard data
 */

// Overview endpoint response
export interface ExecutiveOverview {
  financial: {
    monthlyRevenue: number;
    monthlyRevenueChange: number;
    ytdRevenue: number;
    arBalance: number;
    collectionRate: number;
  };
  operations: {
    activePatients: number;
    newAdmissions: number;
    recentDischarges: number;
    visitsToday: number;
    visitCompletionRate: number;
    evvComplianceRate: number;
  };
  workforce: {
    activeStaff: number;
    newHires: number;
    turnoverRate: number;
    openPositions: number;
    pipelineCount: number;
  };
  compliance: {
    overallScore: number;
    expiringCredentials: number;
    expiredCredentials: number;
    overdueTraining: number;
  };
}

// Financial endpoint response
export interface ExecutiveFinancial {
  summary: {
    currentMonthRevenue: number;
    ytdRevenue: number;
    totalAR: number;
    ar90Plus: number;
    avgDaysToPay: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    claimsCount: number;
  }>;
  arAging: Array<{
    bucket: string;
    count: number;
    amount: number;
  }>;
  payerMix: Array<{
    payer: string;
    revenue: number;
    claimsCount: number;
  }>;
}

// Operations endpoint response
export interface ExecutiveOperations {
  census: {
    active: number;
    newAdmissions: number;
    discharges: number;
    total: number;
  };
  visits: {
    todayTotal: number;
    todayCompleted: number;
    todayCancelled: number;
    todayNoShow: number;
    todayCompletionRate: number;
    weekTotal: number;
    weekCompleted: number;
  };
  evv: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    errors: number;
    complianceRate: number;
  };
  podPerformance: Array<{
    name: string;
    id: string;
    activeClients: number;
    activeCaregivers: number;
    visitsToday: number;
    completedToday: number;
    completionRate: number;
  }>;
}

// Workforce endpoint response
export interface ExecutiveWorkforce {
  summary: {
    totalActive: number;
    newHires30d: number;
    terminations90d: number;
    annualTurnoverRate: number;
  };
  staffByRole: Array<{
    role: string;
    count: number;
    newHires: number;
  }>;
  turnoverByMonth: Array<{
    month: string;
    terminations: number;
  }>;
  recruitingPipeline: Array<{
    stage: string;
    count: number;
  }>;
  openPositions: Array<{
    title: string;
    department: string;
    daysOpen: number;
  }>;
  recentHires: Array<{
    name: string;
    role: string;
    hireDate: string;
  }>;
}

// Compliance endpoint response
export interface ExecutiveCompliance {
  overallScore: number;
  credentials: {
    current: number;
    expiring7d: number;
    expiring14d: number;
    expiring30d: number;
    expired: number;
  };
  training: {
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  evv: {
    complianceRate: number;
    total: number;
    compliant: number;
  };
  onboarding: {
    activeCount: number;
    avgCompletion: number;
    overdueCount: number;
  };
  expiringCredentials: Array<{
    id: string;
    staffName: string;
    type: string;
    expiresAt: string;
    urgency: 'expired' | 'critical' | 'warning' | 'upcoming';
  }>;
}

// Alerts endpoint response
export interface ExecutiveAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  value: number;
  action: string;
}

export interface ExecutiveAlertsResponse {
  alerts: ExecutiveAlert[];
}

// Trends endpoint response
export interface TrendDataPoint {
  month: string;
  value: number;
  label?: string;
}

export interface ExecutiveTrendsResponse {
  type: string;
  data: TrendDataPoint[];
}

// Tab definitions for the dashboard
export type ExecutiveTab = 'overview' | 'financial' | 'operations' | 'workforce' | 'compliance';

export interface TabDefinition {
  id: ExecutiveTab;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: 'red' | 'yellow' | 'green' | 'blue';
}
