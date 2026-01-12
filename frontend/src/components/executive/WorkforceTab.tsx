/**
 * Workforce Tab - Executive Dashboard
 * Staff metrics, turnover, recruiting pipeline
 * All widgets are clickable for drill-down navigation
 */

import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserMinus,
  TrendingDown,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { StatWidget, WidgetGrid } from '@/components/ui/CommandCenter/WidgetContainer';
import { Chart } from '@/components/ui/Chart';
import { useExecutiveWorkforce, useExecutiveTrends } from '@/hooks/useExecutiveData';

export function WorkforceTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useExecutiveWorkforce();
  const { data: turnoverTrendData } = useExecutiveTrends('turnover');

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading workforce data...</p>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Summary Metrics - All clickable */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workforce Summary</h3>
        <WidgetGrid columns={4}>
          <StatWidget
            label="Total Active Staff"
            value={summary?.totalActive || 0}
            icon={<Users className="w-6 h-6" />}
            onClick={() => navigate('/dashboard/hr')}
          />
          <StatWidget
            label="New Hires (30d)"
            value={summary?.newHires30d || 0}
            icon={<UserPlus className="w-6 h-6" />}
            variant="success"
            onClick={() => navigate('/dashboard/hr')}
          />
          <StatWidget
            label="Terminations (90d)"
            value={summary?.terminations90d || 0}
            icon={<UserMinus className="w-6 h-6" />}
            variant={(summary?.terminations90d || 0) > 5 ? 'danger' : 'default'}
            onClick={() => navigate('/dashboard/hr')}
          />
          <StatWidget
            label="Annual Turnover Rate"
            value={`${summary?.annualTurnoverRate || 0}%`}
            icon={<TrendingDown className="w-6 h-6" />}
            variant={
              (summary?.annualTurnoverRate || 0) > 30 ? 'danger' :
              (summary?.annualTurnoverRate || 0) > 20 ? 'warning' : 'success'
            }
            onClick={() => navigate('/dashboard/hr')}
          />
        </WidgetGrid>
      </div>

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff by Role - Clickable */}
        <ClickableWidget
          title="Staff by Role"
          subtitle="Active employees"
          icon={<Users className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/hr')}
        >
          {data?.staffByRole && data.staffByRole.length > 0 ? (
            <div className="space-y-3">
              {data.staffByRole.slice(0, 8).map((role) => (
                <RoleBar
                  key={role.role}
                  role={role.role}
                  count={role.count}
                  newHires={role.newHires}
                  total={summary?.totalActive || 1}
                  onClick={() => navigate('/dashboard/hr')}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No staff data available" />
          )}
        </ClickableWidget>

        {/* Turnover Trend - Clickable */}
        <ClickableWidget
          title="Turnover Trend"
          subtitle="12-month terminations"
          icon={<TrendingDown className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/hr')}
        >
          {turnoverTrendData?.data && turnoverTrendData.data.length > 0 ? (
            <Chart
              type="bar"
              data={turnoverTrendData.data.map(d => ({
                label: d.month,
                value: d.value,
                color: d.value > 3 ? '#ef4444' : d.value > 1 ? '#f59e0b' : '#10b981',
              }))}
              height={220}
              width={480}
              color="#ef4444"
              showAxes={true}
              showGrid={true}
              showValues={true}
            />
          ) : (
            <EmptyState message="No turnover history available" />
          )}
        </ClickableWidget>
      </div>

      {/* Recruiting and Recent Hires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruiting Pipeline - Clickable */}
        <ClickableWidget
          title="Recruiting Pipeline"
          subtitle="Active candidates by stage"
          icon={<Briefcase className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/hr')}
        >
          {data?.recruitingPipeline && data.recruitingPipeline.length > 0 ? (
            <div className="space-y-2">
              {data.recruitingPipeline.map((stage, idx) => (
                <PipelineStage
                  key={stage.stage}
                  stage={stage.stage}
                  count={stage.count}
                  isLast={idx === data.recruitingPipeline.length - 1}
                  total={data.recruitingPipeline.reduce((sum, s) => sum + s.count, 0)}
                  onClick={() => navigate('/dashboard/hr')}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No active candidates" />
          )}

          {/* Open Positions - Clickable */}
          {data?.openPositions && data.openPositions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Open Positions</h4>
              <div className="space-y-2">
                {data.openPositions.slice(0, 5).map((position, idx) => (
                  <OpenPositionRow
                    key={idx}
                    title={position.title}
                    daysOpen={position.daysOpen}
                    onClick={() => navigate('/dashboard/hr')}
                  />
                ))}
              </div>
            </div>
          )}
        </ClickableWidget>

        {/* Recent Hires - Clickable */}
        <ClickableWidget
          title="Recent Hires"
          subtitle="Last 30 days"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/hr')}
        >
          {data?.recentHires && data.recentHires.length > 0 ? (
            <div className="space-y-3">
              {data.recentHires.map((hire, idx) => (
                <HireRow
                  key={idx}
                  name={hire.name}
                  role={hire.role}
                  hireDate={hire.hireDate}
                  onClick={() => navigate(`/hr/staff/${hire.id || idx}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No recent hires" />
          )}
        </ClickableWidget>
      </div>
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

// Role bar component - Clickable
interface RoleBarProps {
  role: string;
  count: number;
  newHires: number;
  total: number;
  onClick: () => void;
}

function RoleBar({ role, count, newHires, total, onClick }: RoleBarProps) {
  const percent = (count / total) * 100;

  const formatRole = (r: string) => {
    const roleNames: Record<string, string> = {
      caregiver: 'Caregiver',
      dsp_basic: 'DSP Basic',
      dsp_med: 'DSP Med Certified',
      hha: 'Home Health Aide',
      cna: 'CNA',
      rn_case_manager: 'RN Case Manager',
      lpn_lvn: 'LPN/LVN',
      therapist: 'Therapist',
      qidp: 'QIDP',
      scheduler: 'Scheduler',
      office_admin: 'Office Admin',
    };
    return roleNames[r] || r.replace(/_/g, ' ');
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{formatRole(role)}</span>
        <div className="flex items-center gap-2">
          {newHires > 0 && (
            <span className="text-xs text-green-600 font-medium">+{newHires} new</span>
          )}
          <span className="text-sm font-bold text-gray-900">{count}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Pipeline stage component - Clickable
interface PipelineStageProps {
  stage: string;
  count: number;
  isLast: boolean;
  total: number;
  onClick: () => void;
}

function PipelineStage({ stage, count, isLast, total, onClick }: PipelineStageProps) {
  const percent = total > 0 ? (count / total) * 100 : 0;

  const formatStage = (s: string) => {
    const stageNames: Record<string, string> = {
      applied: 'Applied',
      screening: 'Screening',
      interviewing: 'Interviewing',
      offer_pending: 'Offer Pending',
      offer_accepted: 'Offer Accepted',
    };
    return stageNames[s] || s.replace(/_/g, ' ');
  };

  const getStageColor = (s: string) => {
    switch (s) {
      case 'applied': return 'bg-gray-400';
      case 'screening': return 'bg-blue-400';
      case 'interviewing': return 'bg-purple-500';
      case 'offer_pending': return 'bg-yellow-500';
      case 'offer_accepted': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
    >
      <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{formatStage(stage)}</span>
          <span className="text-sm font-semibold text-gray-900">{count}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full ${getStageColor(stage)} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      {!isLast && <ChevronRight className="w-4 h-4 text-gray-300" />}
    </div>
  );
}

// Open position row - Clickable
interface OpenPositionRowProps {
  title: string;
  daysOpen: number;
  onClick: () => void;
}

function OpenPositionRow({ title, daysOpen, onClick }: OpenPositionRowProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
    >
      <span className="text-gray-900">{title}</span>
      <span className={`text-xs font-medium ${
        daysOpen > 30 ? 'text-red-600' :
        daysOpen > 14 ? 'text-yellow-600' : 'text-green-600'
      }`}>
        {daysOpen} days open
      </span>
    </div>
  );
}

// Hire row - Clickable
interface HireRowProps {
  name: string;
  role: string;
  hireDate: string;
  onClick: () => void;
}

function HireRow({ name, role, hireDate, onClick }: HireRowProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-green-600 font-semibold text-sm">
          {name.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 capitalize">
          {role.replace(/_/g, ' ')}
        </p>
      </div>
      <div className="text-xs text-gray-500">
        {new Date(hireDate).toLocaleDateString()}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
