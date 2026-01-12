/**
 * Operations Tab - Executive Dashboard
 * Patient census, visits, EVV compliance, pod performance
 * All widgets are clickable for drill-down navigation
 */

import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { StatWidget, WidgetGrid } from '@/components/ui/CommandCenter/WidgetContainer';
import { Chart } from '@/components/ui/Chart';
import { useExecutiveOperations, useExecutiveTrends } from '@/hooks/useExecutiveData';

export function OperationsTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useExecutiveOperations();
  const { data: censusTrendData } = useExecutiveTrends('census');

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading operations data...</p>
      </div>
    );
  }

  const census = data?.census;
  const visits = data?.visits;
  const evv = data?.evv;

  return (
    <div className="space-y-6">
      {/* Census Metrics - All clickable */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Census</h3>
        <WidgetGrid columns={4}>
          <StatWidget
            label="Active Patients"
            value={census?.active || 0}
            icon={<Users className="w-6 h-6" />}
            onClick={() => navigate('/patients')}
          />
          <StatWidget
            label="New Admissions (30d)"
            value={census?.newAdmissions || 0}
            icon={<CheckCircle className="w-6 h-6" />}
            variant="success"
            onClick={() => navigate('/patients')}
          />
          <StatWidget
            label="Discharges (30d)"
            value={census?.discharges || 0}
            icon={<XCircle className="w-6 h-6" />}
            variant={
              (census?.discharges || 0) > (census?.newAdmissions || 0) ? 'danger' : 'default'
            }
            onClick={() => navigate('/patients')}
          />
          <StatWidget
            label="Net Change"
            value={(census?.newAdmissions || 0) - (census?.discharges || 0)}
            icon={<Activity className="w-6 h-6" />}
            variant={
              (census?.newAdmissions || 0) >= (census?.discharges || 0) ? 'success' : 'danger'
            }
            onClick={() => navigate('/patients')}
          />
        </WidgetGrid>
      </div>

      {/* Today's Visits - All clickable */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Visits</h3>
        <WidgetGrid columns={5}>
          <StatWidget
            label="Scheduled"
            value={visits?.todayTotal || 0}
            icon={<Clock className="w-6 h-6" />}
            onClick={() => navigate('/dashboard/scheduling')}
          />
          <StatWidget
            label="Completed"
            value={visits?.todayCompleted || 0}
            icon={<CheckCircle className="w-6 h-6" />}
            variant="success"
            onClick={() => navigate('/dashboard/scheduling')}
          />
          <StatWidget
            label="Cancelled"
            value={visits?.todayCancelled || 0}
            icon={<XCircle className="w-6 h-6" />}
            variant={(visits?.todayCancelled || 0) > 0 ? 'warning' : 'default'}
            onClick={() => navigate('/dashboard/scheduling')}
          />
          <StatWidget
            label="No Shows"
            value={visits?.todayNoShow || 0}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant={(visits?.todayNoShow || 0) > 0 ? 'danger' : 'default'}
            onClick={() => navigate('/dashboard/dispatch')}
          />
          <StatWidget
            label="Completion Rate"
            value={`${visits?.todayCompletionRate || 0}%`}
            icon={<Activity className="w-6 h-6" />}
            variant={
              (visits?.todayCompletionRate || 0) >= 95 ? 'success' :
              (visits?.todayCompletionRate || 0) >= 85 ? 'warning' : 'danger'
            }
            onClick={() => navigate('/dashboard/operations')}
          />
        </WidgetGrid>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Census Trend - Clickable */}
        <ClickableWidget
          title="Patient Census Trend"
          subtitle="12-month rolling"
          icon={<Users className="w-4 h-4" />}
          onClick={() => navigate('/patients')}
        >
          {censusTrendData?.data && censusTrendData.data.length > 0 ? (
            <Chart
              type="line"
              data={censusTrendData.data.map(d => ({
                label: d.month,
                value: d.value,
              }))}
              height={200}
              width={480}
              color="#3b82f6"
              showAxes={true}
              showGrid={true}
            />
          ) : (
            <EmptyChart message="No census history available" />
          )}
        </ClickableWidget>

        {/* EVV Compliance Gauge - Clickable */}
        <ClickableWidget
          title="EVV Compliance"
          subtitle="Current month status"
          icon={<MapPin className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/operations')}
        >
          <div className="flex items-center gap-8">
            {/* Gauge */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    (evv?.complianceRate || 0) >= 95 ? '#10b981' :
                    (evv?.complianceRate || 0) >= 85 ? '#f59e0b' : '#ef4444'
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(evv?.complianceRate || 0) * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${
                  (evv?.complianceRate || 0) >= 95 ? 'text-green-600' :
                  (evv?.complianceRate || 0) >= 85 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {evv?.complianceRate || 0}%
                </span>
                <span className="text-xs text-gray-500">Compliance</span>
              </div>
            </div>

            {/* EVV Stats - Clickable */}
            <div className="flex-1 space-y-3">
              <EVVStatRow label="Total Records" value={evv?.total || 0} onClick={() => navigate('/dashboard/operations')} />
              <EVVStatRow label="Accepted" value={evv?.accepted || 0} color="green" onClick={() => navigate('/dashboard/operations')} />
              <EVVStatRow label="Pending" value={evv?.pending || 0} color="yellow" onClick={() => navigate('/dashboard/operations')} />
              <EVVStatRow label="Rejected" value={evv?.rejected || 0} color="red" onClick={() => navigate('/dashboard/operations')} />
              <EVVStatRow label="Errors" value={evv?.errors || 0} color="red" onClick={() => navigate('/dashboard/operations')} />
            </div>
          </div>
        </ClickableWidget>
      </div>

      {/* Pod Performance Table - Clickable */}
      <ClickableWidget
        title="Pod Performance"
        subtitle="Today's metrics by pod"
        icon={<MapPin className="w-4 h-4" />}
        onClick={() => navigate('/admin/pods')}
      >
        {data?.podPerformance && data.podPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pod</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clients</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Caregivers</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visits Today</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.podPerformance.map((pod) => (
                  <PodRow
                    key={pod.id}
                    pod={pod}
                    onClick={() => navigate(`/admin/pods/${pod.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No pod data available</p>
          </div>
        )}
      </ClickableWidget>
    </div>
  );
}

// Clickable widget container
interface ClickableWidgetProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function ClickableWidget({ title, subtitle, icon, onClick, children }: ClickableWidgetProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 shadow-sm w-full text-left hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
    >
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 text-gray-400">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </button>
  );
}

// Pod table row - Clickable
interface PodRowProps {
  pod: {
    id: string;
    name: string;
    activeClients: number;
    activeCaregivers: number;
    visitsToday: number;
    completedToday: number;
    completionRate: number;
  };
  onClick: () => void;
}

function PodRow({ pod, onClick }: PodRowProps) {
  return (
    <tr
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
    >
      <td className="py-3 px-4 text-sm font-medium text-gray-900">{pod.name}</td>
      <td className="py-3 px-4 text-sm text-gray-600 text-right">{pod.activeClients}</td>
      <td className="py-3 px-4 text-sm text-gray-600 text-right">{pod.activeCaregivers}</td>
      <td className="py-3 px-4 text-sm text-gray-600 text-right">{pod.visitsToday}</td>
      <td className="py-3 px-4 text-sm text-gray-600 text-right">{pod.completedToday}</td>
      <td className="py-3 px-4 text-right">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          pod.completionRate >= 95 ? 'bg-green-100 text-green-700' :
          pod.completionRate >= 85 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {pod.completionRate}%
        </span>
      </td>
    </tr>
  );
}

// EVV stat row component - Clickable
interface EVVStatRowProps {
  label: string;
  value: number;
  color?: 'green' | 'yellow' | 'red';
  onClick: () => void;
}

function EVVStatRow({ label, value, color, onClick }: EVVStatRowProps) {
  const textColor = color === 'green' ? 'text-green-600' :
                    color === 'yellow' ? 'text-yellow-600' :
                    color === 'red' ? 'text-red-600' : 'text-gray-900';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${textColor}`}>{value}</span>
    </div>
  );
}

// Empty chart placeholder
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
