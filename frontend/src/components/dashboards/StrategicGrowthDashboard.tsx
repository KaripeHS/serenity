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
  Users,
  Target,
  Brain,
  AlertTriangle,
  Map,
  Zap,
  Award,
} from 'lucide-react';

function StrategicGrowthDashboard() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch urgent items
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['strategic-growth', 'urgent'],
    queryFn: async () => {
      const [churnRisks, hiringNeeds] = await Promise.all([
        api.get('/analytics/churn-predictions'),
        api.get('/analytics/hiring-forecast'),
      ]);
      return {
        churnRisks: churnRisks.data,
        hiringNeeds: hiringNeeds.data,
      };
    },
  });

  // Build urgent items
  const urgentItems = [
    ...(urgentData?.churnRisks || [])
      .filter((risk: any) => risk.probability > 0.7)
      .slice(0, 3)
      .map((risk: any) => ({
        id: `churn-${risk.caregiverId}`,
        title: `⚠️ Churn Risk: ${risk.caregiverName}`,
        description: `${Math.round(risk.probability * 100)}% probability to leave in 30 days`,
        priority: 'important' as const,
        action: {
          label: 'Intervene',
          onClick: () => (window.location.href = `/hr/retention/${risk.caregiverId}`),
        },
      })),
    ...(urgentData?.hiringNeeds || [])
      .filter((need: any) => need.urgency === 'critical')
      .map((need: any) => ({
        id: `hiring-${need.id}`,
        title: `🚨 Hiring Need: ${need.role}`,
        description: need.reason,
        priority: 'urgent' as const,
      })),
  ];

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Growth Overview',
      icon: <TrendingUp className="w-4 h-4" />,
      content: <OverviewTab />,
    },
    roleAccess.canAccessFeature(FeaturePermission.VIEW_PREDICTIVE_ANALYTICS) && {
      id: 'hiring-forecast',
      label: 'Hiring Forecast',
      icon: <Users className="w-4 h-4" />,
      content: <HiringForecastTab />,
    },
    roleAccess.canAccessFeature(FeaturePermission.VIEW_PREDICTIVE_ANALYTICS) && {
      id: 'churn-prediction',
      label: 'Churn Prediction',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: urgentData?.churnRisks?.filter((r: any) => r.probability > 0.7).length || 0,
      badgeColor: 'red',
      content: <ChurnPredictionTab />,
    },
    roleAccess.canAccessFeature(FeaturePermission.VIEW_PREDICTIVE_ANALYTICS) && {
      id: 'lead-scoring',
      label: 'Lead Scoring',
      icon: <Target className="w-4 h-4" />,
      content: <LeadScoringTab />,
    },
    {
      id: 'market-penetration',
      label: 'Market Penetration',
      icon: <Map className="w-4 h-4" />,
      content: <MarketPenetrationTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-4">
      <StatWidget
        label="Growth Rate"
        value="18.2%"
        change={{ value: 3.4, isPositive: true, label: 'vs last quarter' }}
        icon={<TrendingUp className="w-4 h-4" />}
        variant="success"
      />
      <StatWidget
        label="AI Confidence"
        value="94%"
        icon={<Brain className="w-4 h-4" />}
      />
    </div>
  );

  return (
    <DashboardLayout
      title="Strategic Growth Dashboard"
      subtitle="AI-powered predictive analytics for business growth"
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
 * Overview Tab
 */
function OverviewTab() {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['strategic-growth', 'overview'],
    queryFn: async () => {
      const response = await api.get('/analytics/growth-overview');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading growth analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* AI-Powered Insights */}
      <WidgetContainer
        title="AI-Powered Growth Insights"
        subtitle="Machine learning predictions for the next 90 days"
        icon={<Brain className="w-5 h-5" />}
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Client Acquisition</h4>
            </div>
            <p className="text-3xl font-bold text-blue-600">+32</p>
            <p className="text-sm text-gray-600 mt-1">New clients predicted (90 days)</p>
            <p className="text-xs text-gray-500 mt-1">Based on lead pipeline & conversion rate</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Hiring Recommendation</h4>
            </div>
            <p className="text-3xl font-bold text-green-600">+11</p>
            <p className="text-sm text-gray-600 mt-1">Caregivers to hire</p>
            <p className="text-xs text-gray-500 mt-1">To maintain 1:3.5 caregiver:client ratio</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-gray-900">Retention Risk</h4>
            </div>
            <p className="text-3xl font-bold text-yellow-600">8</p>
            <p className="text-sm text-gray-600 mt-1">Caregivers at risk of leaving</p>
            <p className="text-xs text-gray-500 mt-1">Proactive retention actions recommended</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Growth Metrics */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Client Growth Rate"
          value="+12.4%"
          change={{ value: 2.1, isPositive: true, label: 'vs last quarter' }}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="Caregiver Retention"
          value="82%"
          change={{ value: -3.2, isPositive: false, label: 'vs last quarter' }}
          icon={<Users className="w-5 h-5" />}
          variant="warning"
        />
        <StatWidget
          label="Lead Conversion Rate"
          value="34.6%"
          change={{ value: 5.8, isPositive: true, label: 'vs last quarter' }}
          icon={<Target className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="Market Share"
          value="23.8%"
          change={{ value: 1.9, isPositive: true, label: 'in top 5 zips' }}
          icon={<Award className="w-5 h-5" />}
        />
      </WidgetGrid>

      {/* 90-Day Growth Trajectory */}
      <WidgetContainer
        title="90-Day Growth Trajectory"
        subtitle="ML model projection with confidence intervals"
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📈 Growth trajectory chart would go here
            <p className="text-sm mt-2">
              (Line chart showing predicted client & caregiver growth with 95% confidence bands)
            </p>
          </div>
        </div>
      </WidgetContainer>

      {/* Key Growth Drivers */}
      <WidgetContainer title="Key Growth Drivers (This Quarter)">
        <div className="space-y-3">
          {[
            {
              driver: 'Geographic Expansion',
              impact: '+24 clients',
              progress: 67,
              status: 'on_track',
            },
            {
              driver: 'Referral Program',
              impact: '+18 clients',
              progress: 82,
              status: 'on_track',
            },
            {
              driver: 'Hospital Partnerships',
              impact: '+12 clients',
              progress: 45,
              status: 'at_risk',
            },
            {
              driver: 'Online Marketing',
              impact: '+8 clients',
              progress: 58,
              status: 'on_track',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{item.driver}</span>
                  <span className="ml-2 text-sm text-gray-600">{item.impact}</span>
                </div>
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
              <div className="flex items-center gap-2">
                <div className="flex-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.status === 'on_track' ? 'bg-green-600' : 'bg-yellow-600'}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Hiring Forecast Tab
 */
function HiringForecastTab() {
  const { data: hiringData, isLoading } = useQuery({
    queryKey: ['analytics', 'hiring-forecast'],
    queryFn: async () => {
      const response = await api.get('/analytics/hiring-forecast');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading hiring forecast...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hiring Recommendations */}
      <WidgetContainer
        title="ML-Powered Hiring Recommendations"
        subtitle="Based on client growth forecast, retention predictions, and service capacity"
        icon={<Brain className="w-5 h-5" />}
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Next 30 Days</h4>
            <p className="text-4xl font-bold text-blue-600">+4</p>
            <p className="text-sm text-gray-600 mt-1">Caregivers needed</p>
            <p className="text-xs text-gray-500 mt-1">To cover attrition + growth</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Next 60 Days</h4>
            <p className="text-4xl font-bold text-green-600">+7</p>
            <p className="text-sm text-gray-600 mt-1">Cumulative hiring</p>
            <p className="text-xs text-gray-500 mt-1">Geographic expansion</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Next 90 Days</h4>
            <p className="text-4xl font-bold text-purple-600">+11</p>
            <p className="text-sm text-gray-600 mt-1">Total hiring target</p>
            <p className="text-xs text-gray-500 mt-1">Maintain service quality</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Hiring by Role */}
      <WidgetContainer title="Recommended Hiring Mix (90 Days)">
        <div className="space-y-3">
          {[
            { role: 'Personal Care Aide (PCA)', count: 6, reason: 'Highest demand service' },
            { role: 'Home Health Aide (HHA)', count: 3, reason: 'Growth in skilled services' },
            { role: 'Registered Nurse (RN)', count: 1, reason: 'Clinical supervision capacity' },
            { role: 'DSP (Med)', count: 1, reason: 'Waiver service expansion' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {item.count}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{item.role}</h5>
                <p className="text-sm text-gray-600">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>

      {/* Hiring Timeline */}
      <WidgetContainer title="Recommended Hiring Timeline">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Optimal hire dates to ensure sufficient onboarding time before demand peaks
          </p>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="space-y-6">
              {[
                { week: 'Week 1-2', count: 2, roles: 'PCA (2)', urgency: 'high' },
                { week: 'Week 3-4', count: 2, roles: 'PCA (1), HHA (1)', urgency: 'medium' },
                { week: 'Week 5-6', count: 3, roles: 'PCA (2), RN (1)', urgency: 'medium' },
                { week: 'Week 7-12', count: 4, roles: 'PCA (1), HHA (2), DSP (1)', urgency: 'low' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 pl-8 relative">
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.urgency === 'high'
                        ? 'bg-red-600'
                        : item.urgency === 'medium'
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                    } text-white text-sm font-bold`}
                  >
                    {item.count}
                  </div>
                  <div className="flex-1 pt-1">
                    <h5 className="font-medium text-gray-900">{item.week}</h5>
                    <p className="text-sm text-gray-600">{item.roles}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.urgency === 'high'
                        ? 'bg-red-100 text-red-700'
                        : item.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.urgency.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Churn Prediction Tab
 */
function ChurnPredictionTab() {
  const { data: churnData, isLoading } = useQuery({
    queryKey: ['analytics', 'churn-predictions'],
    queryFn: async () => {
      const response = await api.get('/analytics/churn-predictions');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading churn predictions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* High-Risk Caregivers */}
      <WidgetContainer
        title="Caregivers at Risk of Leaving (Next 30 Days)"
        subtitle="ML model identifies patterns indicating churn risk"
        icon={<AlertTriangle className="w-5 h-5" />}
        action={{
          label: 'Export List',
          onClick: () => {},
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Caregiver
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Churn Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Key Risk Factors
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recommended Action
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(churnData?.highRisk || []).map((caregiver: any) => (
                <tr key={caregiver.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {caregiver.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          caregiver.probability >= 0.8
                            ? 'bg-red-100 text-red-700'
                            : caregiver.probability >= 0.6
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {Math.round(caregiver.probability * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <ul className="list-disc list-inside">
                      {caregiver.riskFactors.map((factor: string, idx: number) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {caregiver.recommendedAction}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">
                      Intervene
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetContainer>

      {/* Churn Trend */}
      <WidgetContainer title="Churn Rate Trend" subtitle="Historical vs predicted">
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📉 Churn trend chart would go here
            <p className="text-sm mt-2">(Historical churn rate + ML prediction for next 90 days)</p>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Lead Scoring Tab
 */
function LeadScoringTab() {
  const { data: leadData, isLoading } = useQuery({
    queryKey: ['analytics', 'lead-scoring'],
    queryFn: async () => {
      const response = await api.get('/analytics/lead-scoring');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading lead scoring...</div>;
  }

  return (
    <div className="space-y-6">
      {/* High-Priority Leads */}
      <WidgetContainer
        title="High-Priority Leads (Top 10)"
        subtitle="ML model scores leads based on conversion probability"
        icon={<Target className="w-5 h-5" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lead
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service Interest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Next Action
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(leadData?.highPriority || []).map((lead: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-sm font-bold rounded-full ${
                        lead.score >= 90
                          ? 'bg-green-100 text-green-700'
                          : lead.score >= 75
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{lead.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{lead.serviceInterest}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{lead.nextAction}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">
                      Contact
                    </button>
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
 * Market Penetration Tab
 */
function MarketPenetrationTab() {
  return (
    <div className="space-y-6">
      {/* Market Share by Zip Code */}
      <WidgetContainer
        title="Market Penetration by Zip Code"
        subtitle="Current share vs growth opportunity"
        icon={<Map className="w-5 h-5" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Zip Code
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Our Clients
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Market
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Market Share
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Growth Potential
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { zip: '43215', clients: 48, market: 180, share: 26.7, potential: 132, priority: 'high' },
                { zip: '43214', clients: 42, market: 165, share: 25.5, potential: 123, priority: 'high' },
                { zip: '43220', clients: 38, market: 155, share: 24.5, potential: 117, priority: 'medium' },
                { zip: '43201', clients: 35, market: 170, share: 20.6, potential: 135, priority: 'high' },
                { zip: '43229', clients: 28, market: 145, share: 19.3, potential: 117, priority: 'medium' },
                { zip: '43230', clients: 0, market: 140, share: 0, potential: 140, priority: 'critical' },
              ].map((area, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{area.zip}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{area.clients}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{area.market}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {area.share}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    +{area.potential} clients
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        area.priority === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : area.priority === 'high'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {area.priority.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetContainer>

      {/* Geographic Heatmap */}
      <WidgetContainer title="Geographic Heatmap" subtitle="Market share visualization">
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            🗺️ Interactive heatmap would go here
            <p className="text-sm mt-2">
              (Geographic visualization showing market penetration by zip code with color intensity)
            </p>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(StrategicGrowthDashboard, DashboardPermission.STRATEGIC_GROWTH);
