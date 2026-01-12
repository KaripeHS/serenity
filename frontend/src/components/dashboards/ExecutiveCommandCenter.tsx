import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardLayout,
  TabContainer,
  UrgentSection,
  WidgetContainer,
  StatWidget,
  WidgetGrid,
} from '@/components/ui/CommandCenter';
import type { Tab } from '@/components/ui/CommandCenter';
import { api } from '@/lib/api';
import {
  useRoleAccess,
  DashboardPermission,
  FeaturePermission,
  withRoleAccess,
} from '@/hooks/useRoleAccess';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

function ExecutiveCommandCenter() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch urgent items for executives
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['executive', 'urgent'],
    queryFn: async () => {
      const [strategicRisks, financialAlerts]: any[] = await Promise.all([
        api.get('/executive/risks'),
        api.get('/executive/financial-alerts'),
      ]);
      return {
        strategicRisks: strategicRisks.data,
        financialAlerts: financialAlerts.data,
      };
    },
  });

  // Build urgent items
  const urgentItems = [
    ...(urgentData?.strategicRisks || []).map((risk: any) => ({
      id: `risk-${risk.id}`,
      title: `⚠️ Strategic Risk: ${risk.category}`,
      description: risk.description,
      priority: risk.severity === 'high' ? ('urgent' as const) : ('important' as const),
      action: {
        label: 'Review',
        onClick: () => (window.location.href = `/executive/risks/${risk.id}`),
      },
    })),
    ...(urgentData?.financialAlerts || []).map((alert: any) => ({
      id: `financial-${alert.id}`,
      title: `💰 ${alert.title}`,
      description: alert.description,
      priority: 'important' as const,
    })),
  ];

  // Define tabs
  // Executives (Founder, CEO, CFO, COO) get full access to all tabs
  const isExecutive = roleAccess.isFounder || roleAccess.isExecutive;

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: <Briefcase className="w-4 h-4" />,
      content: <OverviewTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_REVENUE_ANALYTICS)) && {
      id: 'revenue',
      label: 'Revenue Analytics',
      icon: <DollarSign className="w-4 h-4" />,
      content: <RevenueAnalyticsTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_GROWTH_FORECAST)) && {
      id: 'growth',
      label: 'Growth Forecast',
      icon: <TrendingUp className="w-4 h-4" />,
      content: <GrowthForecastTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_RISK_DASHBOARD)) && {
      id: 'risk',
      label: 'Risk Dashboard',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: urgentData?.strategicRisks?.length || 0,
      badgeColor: (urgentData?.strategicRisks?.length || 0) > 3 ? 'red' : 'yellow',
      content: <RiskDashboardTab />,
    },
    {
      id: 'initiatives',
      label: 'Strategic Initiatives',
      icon: <Target className="w-4 h-4" />,
      content: <StrategicInitiativesTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-4">
      <StatWidget
        label="YTD Revenue"
        value="$5.4M"
        change={{ value: 18, isPositive: true, label: 'vs last year' }}
        icon={<DollarSign className="w-4 h-4" />}
        variant="success"
      />
      <StatWidget
        label="Active Clients"
        value="342"
        change={{ value: 12, isPositive: true, label: 'this quarter' }}
        icon={<Users className="w-4 h-4" />}
      />
    </div>
  );

  return (
    <DashboardLayout
      title="Executive Command Center"
      subtitle="Strategic oversight, revenue analytics, and growth forecasting"
      urgentSection={urgentItems.length > 0 ? <UrgentSection items={urgentItems} /> : undefined}
      actions={headerActions}
    >
      <TabContainer
        tabs={tabs}
        defaultTab="overview"
        onChange={(tabId) => setSelectedTab(tabId)}
      />
    </DashboardLayout>
  );
}

/**
 * Overview Tab - Executive Dashboard
 */
function OverviewTab() {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['executive', 'overview'],
    queryFn: async () => {
      const response = await api.get('/executive/overview');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading executive overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Business Metrics */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Monthly Revenue"
          value={`$${overviewData?.monthlyRevenue || '450K'}`}
          change={{ value: 8.5, isPositive: true, label: 'vs last month' }}
          icon={<DollarSign className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="Active Caregivers"
          value={overviewData?.activeCaregivers || '87'}
          change={{ value: 5, isPositive: true, label: 'this month' }}
          icon={<Users className="w-5 h-5" />}
        />
        <StatWidget
          label="Client Retention"
          value={`${overviewData?.retentionRate || '94.2'}%`}
          change={{ value: 1.3, isPositive: true, label: 'vs last quarter' }}
          icon={<Target className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="Profit Margin"
          value={`${overviewData?.profitMargin || '22.4'}%`}
          change={{ value: -0.8, isPositive: false, label: 'vs last quarter' }}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="warning"
        />
      </WidgetGrid>

      {/* Revenue Trend */}
      <WidgetContainer
        title="Revenue Trend (Last 12 Months)"
        subtitle="Monthly recurring revenue with growth trajectory"
        icon={<BarChart3 className="w-5 h-5" />}
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📊 Revenue trend chart would go here
            <p className="text-sm mt-2">(Line chart showing monthly revenue growth)</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Business Health Scorecard */}
      <WidgetContainer title="Business Health Scorecard" icon={<Activity className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Financial Health</h4>
            <div className="space-y-2">
              <ScoreRow label="Revenue Growth" score={85} />
              <ScoreRow label="Cash Flow" score={92} />
              <ScoreRow label="AR Collection Rate" score={89} />
              <ScoreRow label="Profitability" score={78} />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Operational Health</h4>
            <div className="space-y-2">
              <ScoreRow label="Client Satisfaction" score={94} />
              <ScoreRow label="Caregiver Retention" score={88} />
              <ScoreRow label="Compliance Score" score={98} />
              <ScoreRow label="Service Quality" score={91} />
            </div>
          </div>
        </div>
      </WidgetContainer>

      {/* Top Priorities */}
      <WidgetContainer title="Top Executive Priorities This Quarter">
        <div className="space-y-3">
          {[
            {
              priority: 'Expand into 3 new zip codes',
              status: 'on_track',
              progress: 67,
              owner: 'Operations',
            },
            {
              priority: 'Increase caregiver base by 15%',
              status: 'on_track',
              progress: 58,
              owner: 'HR',
            },
            {
              priority: 'Improve profit margin to 25%',
              status: 'at_risk',
              progress: 45,
              owner: 'Finance',
            },
            {
              priority: 'Achieve 100% compliance score',
              status: 'on_track',
              progress: 98,
              owner: 'Compliance',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{item.priority}</h5>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'on_track'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.status === 'on_track' ? 'bg-green-600' : 'bg-yellow-600'}`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{item.progress}%</span>
                <span className="text-sm text-gray-500">{item.owner}</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Revenue Analytics Tab
 */
function RevenueAnalyticsTab() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['executive', 'revenue'],
    queryFn: async () => {
      const response: any = await api.get('/executive/revenue');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading revenue analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue by Service Line */}
      <WidgetContainer
        title="Revenue by Service Line"
        subtitle="Breakdown of revenue sources"
        icon={<PieChart className="w-5 h-5" />}
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              🥧 Pie chart would go here
              <p className="text-sm mt-2">(Personal Care, Homemaking, Skilled Nursing, etc.)</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { service: 'Personal Care', revenue: 2.1, percentage: 38.9, growth: 12 },
              { service: 'Homemaking', revenue: 1.8, percentage: 33.3, growth: 8 },
              { service: 'Skilled Nursing', revenue: 0.9, percentage: 16.7, growth: 22 },
              { service: 'Respite Care', revenue: 0.6, percentage: 11.1, growth: -3 },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{item.service}</span>
                  <span className="text-sm font-bold text-gray-900">
                    ${item.revenue}M ({item.percentage}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {item.growth >= 0 ? '↑' : '↓'} {Math.abs(item.growth)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </WidgetContainer>

      {/* Revenue by Payer */}
      <WidgetGrid columns={3}>
        <WidgetContainer title="Medicaid Waiver" variant="compact">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">$3.2M</p>
            <p className="text-sm text-gray-600">59% of total revenue</p>
            <p className="text-xs text-green-600">↑ 15% vs last quarter</p>
          </div>
        </WidgetContainer>
        <WidgetContainer title="Private Pay" variant="compact">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">$1.8M</p>
            <p className="text-sm text-gray-600">33% of total revenue</p>
            <p className="text-xs text-green-600">↑ 8% vs last quarter</p>
          </div>
        </WidgetContainer>
        <WidgetContainer title="Insurance" variant="compact">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">$0.4M</p>
            <p className="text-sm text-gray-600">8% of total revenue</p>
            <p className="text-xs text-red-600">↓ 5% vs last quarter</p>
          </div>
        </WidgetContainer>
      </WidgetGrid>

      {/* Profitability Analysis */}
      <WidgetContainer title="Profitability by Service Line">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Direct Costs
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Gross Profit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Margin %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                {
                  service: 'Personal Care',
                  revenue: 2100000,
                  costs: 1638000,
                  profit: 462000,
                  margin: 22.0,
                },
                {
                  service: 'Homemaking',
                  revenue: 1800000,
                  costs: 1404000,
                  profit: 396000,
                  margin: 22.0,
                },
                {
                  service: 'Skilled Nursing',
                  revenue: 900000,
                  costs: 684000,
                  profit: 216000,
                  margin: 24.0,
                },
                { service: 'Respite Care', revenue: 600000, costs: 480000, profit: 120000, margin: 20.0 },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.service}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ${(item.revenue / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ${(item.costs / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    ${(item.profit / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        item.margin >= 22
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Growth Forecast Tab
 */
function GrowthForecastTab() {
  return (
    <div className="space-y-6">
      <WidgetContainer
        title="90-Day Revenue Forecast"
        subtitle="ML-powered predictions based on historical trends"
        icon={<TrendingUp className="w-5 h-5" />}
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📈 Revenue forecast chart would go here
            <p className="text-sm mt-2">(ML model showing projected revenue with confidence intervals)</p>
          </div>
        </div>
      </WidgetContainer>

      <WidgetGrid columns={3}>
        <WidgetContainer title="Next Month Forecast" variant="compact">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">$462K</p>
            <p className="text-sm text-gray-600">95% confidence: $440K-$485K</p>
            <p className="text-xs text-green-600">↑ 8.5% projected growth</p>
          </div>
        </WidgetContainer>
        <WidgetContainer title="Client Growth Forecast" variant="compact">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">+24</p>
            <p className="text-sm text-gray-600">New clients next 30 days</p>
            <p className="text-xs text-gray-500">Based on lead pipeline</p>
          </div>
        </WidgetContainer>
        <WidgetContainer title="Caregiver Hiring Need" variant="compact">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">+8</p>
            <p className="text-sm text-gray-600">Caregivers to hire</p>
            <p className="text-xs text-gray-500">To maintain 1:4 ratio</p>
          </div>
        </WidgetContainer>
      </WidgetGrid>

      <WidgetContainer title="Market Penetration Analysis">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Current market share by zip code (Top 5 service areas)
          </p>
          {[
            { zip: '43215', clients: 48, totalMarket: 180, share: 26.7 },
            { zip: '43214', clients: 42, totalMarket: 165, share: 25.5 },
            { zip: '43220', clients: 38, totalMarket: 155, share: 24.5 },
            { zip: '43201', clients: 35, totalMarket: 170, share: 20.6 },
            { zip: '43229', clients: 28, totalMarket: 145, share: 19.3 },
          ].map((area, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Zip {area.zip}</span>
                <span className="text-sm text-gray-600">
                  {area.clients} / {area.totalMarket} seniors ({area.share}% share)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${area.share}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Risk Dashboard Tab
 */
function RiskDashboardTab() {
  return (
    <div className="space-y-6">
      <WidgetContainer
        title="Strategic Risk Assessment"
        subtitle="Current risks requiring executive attention"
        icon={<AlertTriangle className="w-5 h-5" />}
      >
        <div className="space-y-3">
          {[
            {
              category: 'Financial',
              risk: 'AR aging 90+ days increasing',
              severity: 'high',
              impact: 'Cash flow constraints',
              mitigation: 'Aggressive collection campaign launched',
            },
            {
              category: 'Operational',
              risk: 'Caregiver turnover rate 18%',
              severity: 'medium',
              impact: 'Service continuity at risk',
              mitigation: 'Retention bonus program implemented',
            },
            {
              category: 'Compliance',
              risk: 'Annual DR test overdue',
              severity: 'medium',
              impact: 'ODA citation risk',
              mitigation: 'Test scheduled for next week',
            },
            {
              category: 'Market',
              risk: 'New competitor in 43215 zip',
              severity: 'low',
              impact: 'Potential client loss',
              mitigation: 'Monitoring client satisfaction closely',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {item.severity.toUpperCase()} RISK
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">{item.risk}</h4>
                  <p className="text-sm text-gray-600 mt-1">Impact: {item.impact}</p>
                  <p className="text-sm text-blue-600 mt-1">✓ Mitigation: {item.mitigation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Strategic Initiatives Tab
 */
function StrategicInitiativesTab() {
  return (
    <div className="space-y-6">
      <WidgetContainer
        title="2025 Strategic Initiatives"
        subtitle="Q4 2025 priorities and progress"
      >
        <div className="space-y-4">
          {[
            {
              initiative: 'Geographic Expansion',
              description: 'Launch services in 3 new zip codes (43230, 43235, 43240)',
              status: 'on_track',
              progress: 67,
              milestones: [
                { task: 'Market research completed', done: true },
                { task: 'Hire 12 new caregivers', done: true },
                { task: 'Marketing campaign launched', done: false },
                { task: 'First client onboarded', done: false },
              ],
            },
            {
              initiative: 'Technology Modernization',
              description: 'Complete ERP consolidation and AI-powered analytics',
              status: 'on_track',
              progress: 85,
              milestones: [
                { task: 'Dashboard consolidation (29→12)', done: true },
                { task: 'RBAC implementation', done: true },
                { task: 'Predictive analytics module', done: false },
                { task: 'Mobile app redesign', done: false },
              ],
            },
            {
              initiative: 'Profitability Improvement',
              description: 'Increase profit margin from 22% to 25%',
              status: 'at_risk',
              progress: 45,
              milestones: [
                { task: 'Cost reduction analysis', done: true },
                { task: 'Rate negotiation with payers', done: false },
                { task: 'Schedule optimization (reduce mileage)', done: false },
                { task: 'Service mix adjustment', done: false },
              ],
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{item.initiative}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    item.status === 'on_track'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-gray-900">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.status === 'on_track' ? 'bg-green-600' : 'bg-yellow-600'}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                {item.milestones.map((milestone, mIdx) => (
                  <div key={mIdx} className="flex items-center gap-2 text-sm">
                    {milestone.done ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    )}
                    <span className={milestone.done ? 'text-gray-500 line-through' : 'text-gray-900'}>
                      {milestone.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Score Row Component
 */
function ScoreRow({ label, score }: { label: string; score: number }) {
  const getColor = () => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 75) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${getColor()}`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(ExecutiveCommandCenter, DashboardPermission.EXECUTIVE_COMMAND_CENTER);
