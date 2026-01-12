/**
 * Compliance Tab - Executive Dashboard
 * Credentials, training, EVV compliance, onboarding status
 * All widgets are clickable for drill-down navigation
 */

import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  GraduationCap,
  FileCheck,
} from 'lucide-react';
import { StatWidget, WidgetGrid } from '@/components/ui/CommandCenter/WidgetContainer';
import { useExecutiveCompliance, useExecutiveTrends } from '@/hooks/useExecutiveData';
import { Chart } from '@/components/ui/Chart';

export function ComplianceTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useExecutiveCompliance();
  const { data: evvTrendData } = useExecutiveTrends('evv');

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading compliance data...</p>
      </div>
    );
  }

  const credentials = data?.credentials;
  const training = data?.training;
  const evv = data?.evv;
  const onboarding = data?.onboarding;

  const totalExpiring = (credentials?.expiring7d || 0) +
                        (credentials?.expiring14d || 0) +
                        (credentials?.expiring30d || 0);

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score - All clickable */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
        <WidgetGrid columns={5}>
          <StatWidget
            label="Overall Score"
            value={`${data?.overallScore || 0}%`}
            icon={<ShieldCheck className="w-6 h-6" />}
            variant={
              (data?.overallScore || 0) >= 90 ? 'success' :
              (data?.overallScore || 0) >= 70 ? 'warning' : 'danger'
            }
            onClick={() => navigate('/dashboard/compliance')}
          />
          <StatWidget
            label="Expiring Credentials"
            value={totalExpiring}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant={totalExpiring > 10 ? 'danger' : totalExpiring > 0 ? 'warning' : 'success'}
            onClick={() => navigate('/dashboard/credentials')}
          />
          <StatWidget
            label="Expired"
            value={credentials?.expired || 0}
            icon={<XCircle className="w-6 h-6" />}
            variant={(credentials?.expired || 0) > 0 ? 'danger' : 'success'}
            onClick={() => navigate('/dashboard/credentials')}
          />
          <StatWidget
            label="Overdue Training"
            value={training?.overdue || 0}
            icon={<Clock className="w-6 h-6" />}
            variant={(training?.overdue || 0) > 0 ? 'danger' : 'success'}
            onClick={() => navigate('/dashboard/training')}
          />
          <StatWidget
            label="EVV Compliance"
            value={`${evv?.complianceRate || 0}%`}
            icon={<FileCheck className="w-6 h-6" />}
            variant={
              (evv?.complianceRate || 0) >= 95 ? 'success' :
              (evv?.complianceRate || 0) >= 85 ? 'warning' : 'danger'
            }
            onClick={() => navigate('/dashboard/operations')}
          />
        </WidgetGrid>
      </div>

      {/* Credentials and Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credentials Status - Clickable */}
        <ClickableWidget
          title="Credential Status"
          subtitle="Staff certifications and licenses"
          icon={<Award className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/credentials')}
        >
          <div className="space-y-4">
            <CredentialBar
              label="Current (Valid)"
              count={credentials?.current || 0}
              color="green"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/credentials')}
            />
            <CredentialBar
              label="Expiring in 7 days"
              count={credentials?.expiring7d || 0}
              color="red"
              icon={<AlertTriangle className="w-4 h-4" />}
              urgent
              onClick={() => navigate('/dashboard/credentials')}
            />
            <CredentialBar
              label="Expiring in 14 days"
              count={credentials?.expiring14d || 0}
              color="orange"
              icon={<Clock className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/credentials')}
            />
            <CredentialBar
              label="Expiring in 30 days"
              count={credentials?.expiring30d || 0}
              color="yellow"
              icon={<Clock className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/credentials')}
            />
            <CredentialBar
              label="Expired"
              count={credentials?.expired || 0}
              color="red"
              icon={<XCircle className="w-4 h-4" />}
              urgent
              onClick={() => navigate('/dashboard/credentials')}
            />
          </div>
        </ClickableWidget>

        {/* Training Status - Clickable */}
        <ClickableWidget
          title="Training Compliance"
          subtitle="Required training status"
          icon={<GraduationCap className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/training')}
        >
          <div className="flex items-center gap-6 mb-6">
            {/* Completion Rate Gauge */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    (training?.completionRate || 0) >= 90 ? '#10b981' :
                    (training?.completionRate || 0) >= 70 ? '#f59e0b' : '#ef4444'
                  }
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(training?.completionRate || 0) * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">
                  {training?.completionRate || 0}%
                </span>
                <span className="text-xs text-gray-500">Complete</span>
              </div>
            </div>

            {/* Training Stats */}
            <div className="flex-1 space-y-3">
              <TrainingStatRow label="Completed" value={training?.completed || 0} color="green" onClick={() => navigate('/dashboard/training')} />
              <TrainingStatRow label="In Progress" value={training?.inProgress || 0} color="blue" onClick={() => navigate('/dashboard/training')} />
              <TrainingStatRow label="Overdue" value={training?.overdue || 0} color="red" onClick={() => navigate('/dashboard/training')} />
            </div>
          </div>
        </ClickableWidget>
      </div>

      {/* EVV Trend and Expiring List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EVV Compliance Trend - Clickable */}
        <ClickableWidget
          title="EVV Compliance Trend"
          subtitle="12-month rolling"
          icon={<FileCheck className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/operations')}
        >
          {evvTrendData?.data && evvTrendData.data.length > 0 ? (
            <Chart
              type="line"
              data={evvTrendData.data.map(d => ({
                label: d.month,
                value: d.value,
              }))}
              height={200}
              width={480}
              color="#8b5cf6"
              showAxes={true}
              showGrid={true}
            />
          ) : (
            <EmptyState message="No EVV history available" />
          )}
        </ClickableWidget>

        {/* Expiring Credentials List - Clickable */}
        <ClickableWidget
          title="Expiring Credentials"
          subtitle="Requires immediate attention"
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/credentials')}
        >
          {data?.expiringCredentials && data.expiringCredentials.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {data.expiringCredentials.map((cred) => (
                <ExpiringCredentialItem
                  key={cred.id}
                  staffName={cred.staffName}
                  type={cred.type}
                  expiresAt={cred.expiresAt}
                  urgency={cred.urgency}
                  onClick={() => navigate('/dashboard/credentials')}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No expiring credentials" />
          )}
        </ClickableWidget>
      </div>

      {/* Onboarding Status - Clickable */}
      <ClickableWidget
        title="Active Onboardings"
        subtitle="New hire progress"
        icon={<GraduationCap className="w-4 h-4" />}
        onClick={() => navigate('/dashboard/hr')}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OnboardingCard
            value={onboarding?.activeCount || 0}
            label="Active Onboardings"
            color="blue"
            onClick={() => navigate('/dashboard/hr')}
          />
          <OnboardingCard
            value={`${onboarding?.avgCompletion || 0}%`}
            label="Avg Completion"
            color="green"
            onClick={() => navigate('/dashboard/hr')}
          />
          <OnboardingCard
            value={onboarding?.overdueCount || 0}
            label="Overdue Steps"
            color="red"
            onClick={() => navigate('/dashboard/hr')}
          />
        </div>
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

// Credential bar component - Clickable
interface CredentialBarProps {
  label: string;
  count: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
  icon: React.ReactNode;
  urgent?: boolean;
  onClick: () => void;
}

function CredentialBar({ label, count, color, icon, urgent, onClick }: CredentialBarProps) {
  const colors = {
    green: 'bg-green-100 text-green-600 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200',
  };

  const iconColors = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${colors[color]} ${urgent && count > 0 ? 'animate-pulse' : ''}`}
    >
      <span className={iconColors[color]}>{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
      <span className={`text-lg font-bold ${count > 0 && urgent ? 'text-red-600' : 'text-gray-900'}`}>
        {count}
      </span>
    </div>
  );
}

// Training stat row component - Clickable
interface TrainingStatRowProps {
  label: string;
  value: number;
  color: 'green' | 'blue' | 'red';
  onClick: () => void;
}

function TrainingStatRow({ label, value, color, onClick }: TrainingStatRowProps) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`px-2 py-1 text-sm font-semibold rounded ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
}

// Expiring credential item component - Clickable
interface ExpiringCredentialItemProps {
  staffName: string;
  type: string;
  expiresAt: string;
  urgency: 'expired' | 'critical' | 'warning' | 'upcoming';
  onClick: () => void;
}

function ExpiringCredentialItem({ staffName, type, expiresAt, urgency, onClick }: ExpiringCredentialItemProps) {
  const urgencyStyles = {
    expired: 'bg-red-50 border-red-200 text-red-700',
    critical: 'bg-red-50 border-red-200 text-red-600',
    warning: 'bg-orange-50 border-orange-200 text-orange-600',
    upcoming: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  };

  const urgencyLabels = {
    expired: 'EXPIRED',
    critical: 'Expires Soon',
    warning: 'Expiring',
    upcoming: 'Upcoming',
  };

  const daysUntil = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${urgencyStyles[urgency]}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{staffName}</p>
        <p className="text-xs text-gray-500 truncate capitalize">{type.replace(/_/g, ' ')}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{urgencyLabels[urgency]}</p>
        <p className="text-xs text-gray-500">
          {urgency === 'expired' ? 'Expired' : `${daysUntil} days`}
        </p>
      </div>
    </div>
  );
}

// Onboarding card - Clickable
interface OnboardingCardProps {
  value: number | string;
  label: string;
  color: 'blue' | 'green' | 'red';
  onClick: () => void;
}

function OnboardingCard({ value, label, color, onClick }: OnboardingCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700',
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-4 rounded-lg text-center cursor-pointer hover:shadow-md transition-all ${colors[color]}`}
    >
      <div className={`text-3xl font-bold ${textColors[color]}`}>{value}</div>
      <div className={`text-sm mt-1 ${textColors[color]}`}>{label}</div>
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
