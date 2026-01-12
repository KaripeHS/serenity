import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardLayout,
  TabContainer,
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
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Database,
} from 'lucide-react';

function BusinessIntelligenceDashboard() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('reports');

  // Executives (Founder, CEO, COO) get full access to all tabs for oversight
  const isExecutive = roleAccess.isFounder || roleAccess.isExecutive;

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'reports',
      label: 'Custom Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      content: <CustomReportsTab />,
    },
    {
      id: 'analytics',
      label: 'Advanced Analytics',
      icon: <TrendingUp className="w-4 h-4" />,
      content: <AdvancedAnalyticsTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.CREATE_CUSTOM_REPORTS)) && {
      id: 'builder',
      label: 'Report Builder',
      icon: <Database className="w-4 h-4" />,
      content: <ReportBuilderTab />,
    },
  ].filter(Boolean) as Tab[];

  return (
    <DashboardLayout
      title="Business Intelligence Dashboard"
      subtitle="Advanced analytics and custom reporting"
    >
      <TabContainer
        tabs={tabs}
        defaultTab="reports"
        onChange={(tabId) => setSelectedTab(tabId)}
      />
    </DashboardLayout>
  );
}

/**
 * Custom Reports Tab
 */
function CustomReportsTab() {
  const roleAccess = useRoleAccess();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['bi', 'reports'],
    queryFn: async () => {
      const response = await api.get('/bi/reports');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Saved Reports */}
      <WidgetContainer
        title="Saved Reports"
        subtitle="Pre-built and custom reports"
        action={
          roleAccess.canAccessFeature(FeaturePermission.CREATE_CUSTOM_REPORTS)
            ? {
                label: 'Create New Report',
                onClick: () => {},
              }
            : undefined
        }
      >
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              name: 'Monthly Revenue Summary',
              category: 'Financial',
              lastRun: '2 hours ago',
              schedule: 'Daily 8am',
            },
            {
              name: 'Client Acquisition Report',
              category: 'Growth',
              lastRun: '1 day ago',
              schedule: 'Weekly Monday',
            },
            {
              name: 'Caregiver Performance',
              category: 'HR',
              lastRun: '3 hours ago',
              schedule: 'Weekly Friday',
            },
            {
              name: 'Compliance Scorecard',
              category: 'Compliance',
              lastRun: '1 hour ago',
              schedule: 'Daily 6am',
            },
            {
              name: 'Payer Mix Analysis',
              category: 'Financial',
              lastRun: '1 day ago',
              schedule: 'Monthly 1st',
            },
            {
              name: 'Service Line Profitability',
              category: 'Financial',
              lastRun: '4 hours ago',
              schedule: 'Weekly Monday',
            },
          ].map((report, idx) => (
            <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{report.name}</h4>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {report.category}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">Last run: {report.lastRun}</p>
              <p className="text-xs text-gray-500 mb-3">Schedule: {report.schedule}</p>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  Run Now
                </button>
                {roleAccess.canAccessFeature(FeaturePermission.EXPORT_REPORTS) && (
                  <button className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>

      {/* Recent Report Runs */}
      <WidgetContainer title="Recent Report Executions">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Run Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Run By
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(reports?.recent || []).map((run: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{run.reportName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(run.runTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{run.runBy}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'running'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button className="text-blue-600 hover:underline text-sm">View</button>
                      {roleAccess.canAccessFeature(FeaturePermission.EXPORT_REPORTS) && (
                        <button className="text-green-600 hover:underline text-sm">Export</button>
                      )}
                    </div>
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
 * Advanced Analytics Tab
 */
function AdvancedAnalyticsTab() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [groupBy, setGroupBy] = useState('day');

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="day">By Day</option>
            <option value="week">By Week</option>
            <option value="month">By Month</option>
            <option value="quarter">By Quarter</option>
          </select>
        </div>
        <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          Apply Filters
        </button>
      </div>

      {/* Key Metrics */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Total Revenue"
          value="$1.35M"
          change={{ value: 12.4, isPositive: true, label: 'vs previous period' }}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
        <StatWidget
          label="Active Clients"
          value="342"
          change={{ value: 8, isPositive: true, label: 'vs previous period' }}
        />
        <StatWidget label="Avg Visit Duration" value="2.4 hrs" />
        <StatWidget
          label="Client Satisfaction"
          value="4.7/5"
          variant="success"
        />
      </WidgetGrid>

      {/* Revenue Trends */}
      <WidgetContainer
        title="Revenue Trend Analysis"
        subtitle={`Grouped by ${groupBy} for ${dateRange.replace(/_/g, ' ')}`}
        icon={<BarChart3 className="w-5 h-5" />}
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📊 Interactive revenue trend chart would go here
            <p className="text-sm mt-2">(D3.js or Recharts visualization)</p>
          </div>
        </div>
      </WidgetContainer>

      {/* Service Mix */}
      <WidgetGrid columns={2}>
        <WidgetContainer title="Service Mix" icon={<PieChart className="w-5 h-5" />}>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              🥧 Service mix pie chart
            </div>
          </div>
        </WidgetContainer>
        <WidgetContainer title="Payer Distribution" icon={<PieChart className="w-5 h-5" />}>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              🥧 Payer mix pie chart
            </div>
          </div>
        </WidgetContainer>
      </WidgetGrid>

      {/* Cohort Analysis */}
      <WidgetContainer title="Client Cohort Analysis" subtitle="Retention by signup month">
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            📈 Cohort retention heatmap would go here
            <p className="text-sm mt-2">(Shows client retention by cohort month)</p>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}

/**
 * Report Builder Tab
 */
function ReportBuilderTab() {
  const [reportName, setReportName] = useState('');
  const [dataSource, setDataSource] = useState('clients');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <WidgetContainer title="Build Custom Report" subtitle="Create your own reports with drag-and-drop">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Custom Report"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
              >
                <option value="clients">Clients</option>
                <option value="caregivers">Caregivers</option>
                <option value="visits">Visits</option>
                <option value="invoices">Invoices</option>
                <option value="claims">Claims</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Fields</label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {[
                  'Client Name',
                  'Service Type',
                  'Start Date',
                  'End Date',
                  'Total Visits',
                  'Total Revenue',
                  'Payer Type',
                  'Caregiver Assigned',
                ].map((field) => (
                  <label key={field} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedFields.includes(field)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, field]);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== field));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-900">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm">
                + Add Filter
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option>Run Once</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Report
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                Preview
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Report Preview</h4>
            <div className="border rounded-lg p-4 bg-gray-50 h-96 overflow-auto">
              {selectedFields.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b">
                      <tr>
                        {selectedFields.map((field) => (
                          <th
                            key={field}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 text-gray-500 text-center" colSpan={selectedFields.length}>
                          Sample data will appear here
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select fields to preview report
                </div>
              )}
            </div>
          </div>
        </div>
      </WidgetContainer>

      {/* Report Templates */}
      <WidgetContainer title="Report Templates" subtitle="Start with a pre-built template">
        <div className="grid grid-cols-4 gap-4">
          {[
            'Financial Summary',
            'Client Demographics',
            'Caregiver Performance',
            'Service Utilization',
            'Compliance Status',
            'Billing Analysis',
            'Retention Report',
            'Growth Metrics',
          ].map((template, idx) => (
            <button
              key={idx}
              className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-600 text-left"
            >
              <p className="font-medium text-gray-900 text-sm">{template}</p>
              <p className="text-xs text-gray-500 mt-1">Pre-configured template</p>
            </button>
          ))}
        </div>
      </WidgetContainer>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(
  BusinessIntelligenceDashboard,
  DashboardPermission.BUSINESS_INTELLIGENCE
);
