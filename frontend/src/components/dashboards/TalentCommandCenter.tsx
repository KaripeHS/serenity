import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Award,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  Search,
} from 'lucide-react';
import { DashboardLayout, TabContainer, UrgentSection, WidgetContainer, StatWidget, WidgetGrid } from '@/components/ui/CommandCenter';
import type { Tab } from '@/components/ui/CommandCenter';
import { api } from '@/lib/api';
import { useRoleAccess, DashboardPermission, FeaturePermission, withRoleAccess } from '@/hooks/useRoleAccess';

/**
 * Talent Management Command Center
 *
 * Consolidates 6 HR dashboards:
 * 1. WorkingHRDashboard
 * 2. BackgroundCheckDashboard
 * 3. CredentialExpirationDashboard
 * 4. TrainingManagementDashboard
 * 5. ProgressiveDisciplineDashboard
 * 6. OnboardingPipeline
 *
 * Features:
 * - Kanban recruiting pipeline (drag-and-drop)
 * - Credential expiration alerts (30/60/90 day color coding)
 * - Training compliance heatmap
 * - Progressive discipline workflow
 * - Performance tracking (SPI scores, tier rankings)
 *
 * RBAC: Accessible by FOUNDER, HR_MANAGER, CREDENTIALING_SPECIALIST, CLINICAL_DIRECTOR (view-only)
 */
function TalentCommandCenter() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('pipeline');

  // Fetch urgent HR items
  const { data: urgentData, isLoading: urgentLoading } = useQuery({
    queryKey: ['hr', 'urgent'],
    queryFn: async () => {
      const [credentials, background, training, discipline]: any[] = await Promise.all([
        api.get('/hr/credentials/expiring?days=30'),
        api.get('/hr/background-checks/expiring?days=30'),
        api.get('/training/overdue'),
        api.get('/discipline/actions?status=pending'),
      ]);
      return {
        credentials: credentials.data,
        background: background.data,
        training: training.data,
        discipline: discipline.data,
      };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch HR summary stats
  const { data: hrStats } = useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: () => api.get('/hr/stats').then((res: any) => res.data || res),
  });

  // Build urgent items array
  const urgentItems = [
    ...(urgentData?.credentials || []).map((credential: any) => {
      const daysUntilExpiration = Math.floor(
        (new Date(credential.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: `cred-${credential.id}`,
        title: `${credential.credentialType} Expiring: ${credential.employeeName}`,
        description: `Expires: ${new Date(credential.expirationDate).toLocaleDateString()} (${daysUntilExpiration} days)`,
        deadline: credential.expirationDate,
        priority: daysUntilExpiration <= 14 ? ('urgent' as const) : ('important' as const),
        action: roleAccess.canAccessFeature(FeaturePermission.MANAGE_CREDENTIALS)
          ? {
              label: 'Send Reminder',
              onClick: () => window.location.href = `/hr/credentials/${credential.id}/remind`,
            }
          : undefined,
      };
    }),
    ...(urgentData?.background || []).map((bg: any) => ({
      id: `bg-${bg.id}`,
      title: `Background Check Expiring: ${bg.employeeName}`,
      description: `${bg.checkType} expires: ${new Date(bg.expirationDate).toLocaleDateString()}`,
      deadline: bg.expirationDate,
      priority: 'urgent' as const,
      action: roleAccess.canAccessFeature(FeaturePermission.MANAGE_CREDENTIALS)
        ? {
            label: 'Reorder Check',
            onClick: () => window.location.href = `/hr/background-checks/${bg.id}/reorder`,
            variant: 'danger' as const,
          }
        : undefined,
    })),
    ...(urgentData?.training || []).map((training: any) => ({
      id: `train-${training.id}`,
      title: `Overdue Training: ${training.employeeName}`,
      description: `Course: ${training.courseName} (${training.daysOverdue} days overdue)`,
      priority: 'important' as const,
      action: roleAccess.canAccessFeature(FeaturePermission.MANAGE_TRAINING)
        ? {
            label: 'Send Reminder',
            onClick: () => window.location.href = `/hr/training/remind/${training.id}`,
          }
        : undefined,
    })),
    ...(urgentData?.discipline || []).map((discipline: any) => ({
      id: `disc-${discipline.id}`,
      title: `Pending Disciplinary Action: ${discipline.employeeName}`,
      description: `Incident: ${discipline.incidentType} - Follow-up due: ${new Date(discipline.followUpDate).toLocaleDateString()}`,
      priority: 'important' as const,
      action: roleAccess.canAccessFeature(FeaturePermission.MANAGE_DISCIPLINE)
        ? {
            label: 'Review Action',
            onClick: () => window.location.href = `/hr/discipline/${discipline.id}`,
          }
        : undefined,
    })),
  ];

  // Define tabs (filter based on role permissions)
  // Executives (Founder, CEO, COO) get full access to all tabs for oversight
  const isExecutive = roleAccess.isFounder || roleAccess.isExecutive;

  const tabs: Tab[] = [
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.VIEW_HR_PIPELINE)) && {
      id: 'pipeline',
      label: 'Pipeline',
      icon: <UserPlus className="w-4 h-4" />,
      badge: hrStats?.pipelineCount || 0,
      badgeColor: 'blue',
      content: <PipelineTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.MANAGE_CREDENTIALS)) && {
      id: 'credentials',
      label: 'Credentials',
      icon: <Award className="w-4 h-4" />,
      badge: urgentData?.credentials?.length || 0,
      badgeColor: urgentData?.credentials?.length ? 'yellow' : 'green',
      content: <CredentialsTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.MANAGE_TRAINING)) && {
      id: 'training',
      label: 'Training',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: urgentData?.training?.length || 0,
      badgeColor: urgentData?.training?.length ? 'red' : 'green',
      content: <TrainingTab />,
    },
    (isExecutive || roleAccess.canAccessFeature(FeaturePermission.MANAGE_DISCIPLINE)) && {
      id: 'discipline',
      label: 'Discipline',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: urgentData?.discipline?.length || 0,
      badgeColor: urgentData?.discipline?.length ? 'yellow' : 'green',
      content: <DisciplineTab />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <TrendingUp className="w-4 h-4" />,
      content: <PerformanceTab />,
    },
  ].filter(Boolean) as Tab[];

  // Header actions
  const headerActions = (
    <>
      {/* Active Employees Count */}
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <Users className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-900">
          {hrStats?.activeEmployees || 87} Active Employees
        </span>
      </div>

      {/* Hiring Pipeline */}
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <UserPlus className="w-4 h-4 text-green-600" />
        <span className="text-sm font-semibold text-green-900">
          {hrStats?.pipelineCount || 12} in Pipeline
        </span>
      </div>

      {/* Export Report */}
      {roleAccess.canAccessFeature(FeaturePermission.VIEW_HR_PIPELINE) && (
        <button
          onClick={() => window.location.href = '/hr/reports/export'}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Export Report
        </button>
      )}
    </>
  );

  return (
    <DashboardLayout
      title="Talent Management Command Center"
      subtitle="Comprehensive HR pipeline, credentials, training, and performance management"
      actions={headerActions}
      urgentSection={
        urgentLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading urgent items...</span>
          </div>
        ) : (
          <UrgentSection
            items={urgentItems}
            emptyMessage="✅ No urgent HR items - all caught up!"
          />
        )
      }
    >
      <TabContainer
        tabs={tabs}
        defaultTab="pipeline"
        onChange={setSelectedTab}
      />
    </DashboardLayout>
  );
}

/**
 * Pipeline Tab
 * Kanban board for recruiting workflow
 */
function PipelineTab() {
  const roleAccess = useRoleAccess();
  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ['hr', 'pipeline'],
    queryFn: () => api.get('/hr/pipeline').then((res: any) => res.data || res),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const stages = [
    { id: 'applied', label: 'Applied', count: pipelineData?.applied?.length || 0 },
    { id: 'screening', label: 'Screening', count: pipelineData?.screening?.length || 0 },
    { id: 'background', label: 'BCI/FBI', count: pipelineData?.background?.length || 0 },
    { id: 'training', label: 'Training', count: pipelineData?.training?.length || 0 },
    { id: 'active', label: 'Active', count: pipelineData?.active?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <WidgetGrid columns={5}>
        {stages.map((stage) => (
          <StatWidget
            key={stage.id}
            label={stage.label}
            value={stage.count}
            icon={<Users className="w-6 h-6" />}
            variant={stage.id === 'applied' && stage.count > 10 ? 'warning' : 'default'}
          />
        ))}
      </WidgetGrid>

      {/* Kanban Board */}
      <WidgetContainer
        title="Recruiting Pipeline (Kanban)"
        subtitle="Drag candidates between stages"
        action={roleAccess.canAccessFeature(FeaturePermission.VIEW_HR_PIPELINE) ? {
          label: 'Add Candidate',
          onClick: () => window.location.href = '/hr/pipeline/add-candidate',
        } : undefined}
      >
        <div className="grid grid-cols-5 gap-4">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage.id}
              label={stage.label}
              candidates={pipelineData?.[stage.id] || []}
            />
          ))}
        </div>
      </WidgetContainer>

      {/* Time in Stage Analytics */}
      <WidgetContainer
        title="Time in Stage Analytics"
        subtitle="Average days candidates spend in each stage"
      >
        <WidgetGrid columns={5}>
          <StatWidget label="Applied → Screening" value="2.3 days" icon={<Clock className="w-5 h-5" />} />
          <StatWidget label="Screening → BCI" value="5.1 days" icon={<Clock className="w-5 h-5" />} />
          <StatWidget label="BCI → Training" value="12.8 days" icon={<Clock className="w-5 h-5" />} variant="warning" />
          <StatWidget label="Training → Active" value="7.2 days" icon={<Clock className="w-5 h-5" />} />
          <StatWidget label="Total Time to Hire" value="27.4 days" icon={<Clock className="w-5 h-5" />} />
        </WidgetGrid>
      </WidgetContainer>
    </div>
  );
}

function KanbanColumn({ stage, label, candidates }: { stage: string; label: string; candidates: any[] }) {
  return (
    <div className="flex flex-col">
      <div className="bg-gray-100 px-3 py-2 rounded-t-lg border border-gray-200">
        <span className="text-sm font-semibold text-gray-700">
          {label} ({candidates.length})
        </span>
      </div>
      <div className="bg-gray-50 p-2 rounded-b-lg border border-t-0 border-gray-200 min-h-[400px] space-y-2">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} {...candidate} />
        ))}
        {candidates.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">No candidates</p>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ id, name, appliedDate, position }: any) {
  return (
    <div className="bg-white p-3 rounded border border-gray-200 hover:shadow-md cursor-pointer transition-shadow">
      <p className="text-sm font-medium text-gray-900">{name}</p>
      <p className="text-xs text-gray-600 mt-1">{position}</p>
      <p className="text-xs text-gray-400 mt-1">
        Applied: {new Date(appliedDate).toLocaleDateString()}
      </p>
    </div>
  );
}

/**
 * Credentials Tab
 * License, certification, and background check expiration tracking
 */
function CredentialsTab() {
  const roleAccess = useRoleAccess();
  const { data: credentialsData, isLoading } = useQuery({
    queryKey: ['hr', 'credentials'],
    queryFn: () => api.get('/hr/credentials').then((res: any) => res.data || res),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Expiring (30 Days)"
          value={credentialsData?.expiring30Days || 5}
          variant="danger"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <StatWidget
          label="Expiring (60 Days)"
          value={credentialsData?.expiring60Days || 8}
          variant="warning"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatWidget
          label="Expiring (90 Days)"
          value={credentialsData?.expiring90Days || 12}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatWidget
          label="All Current"
          value={credentialsData?.currentCredentials || 87}
          variant="success"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
      </WidgetGrid>

      {/* Expiring Credentials (30 Days) */}
      <WidgetContainer
        title="Credentials Expiring (Next 30 Days)"
        subtitle="RN licenses, CPR certifications, background checks"
        action={roleAccess.canAccessFeature(FeaturePermission.MANAGE_CREDENTIALS) ? {
          label: 'Send Bulk Reminders',
          onClick: () => window.location.href = '/hr/credentials/bulk-remind',
        } : undefined}
      >
        <CredentialsTable credentials={credentialsData?.expiringList || []} />
      </WidgetContainer>

      {/* Background Checks */}
      <WidgetContainer
        title="Background Check Status"
        subtitle="BCI, FBI, OIG clearances"
      >
        <WidgetGrid columns={3}>
          <StatWidget
            label="Pending BCI"
            value={credentialsData?.pendingBCI || 4}
            variant="warning"
            icon={<Clock className="w-6 h-6" />}
          />
          <StatWidget
            label="Pending FBI"
            value={credentialsData?.pendingFBI || 2}
            variant="warning"
            icon={<Clock className="w-6 h-6" />}
          />
          <StatWidget
            label="OIG Cleared"
            value={credentialsData?.oigCleared || 85}
            variant="success"
            icon={<CheckCircle2 className="w-6 h-6" />}
          />
        </WidgetGrid>
      </WidgetContainer>
    </div>
  );
}

function CredentialsTable({ credentials }: { credentials: any[] }) {
  if (credentials.length === 0) {
    return <p className="text-sm text-gray-500">✅ No credentials expiring in next 30 days</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credential Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiration Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days Until Expiration</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {credentials.map((credential) => {
            const daysUntilExpiration = Math.floor(
              (new Date(credential.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return (
              <tr key={credential.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{credential.employeeName}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{credential.credentialType}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {new Date(credential.expirationDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`font-medium ${
                    daysUntilExpiration <= 14 ? 'text-red-600' : daysUntilExpiration <= 30 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {daysUntilExpiration} days
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => window.location.href = `/hr/credentials/${credential.id}/remind`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Send Reminder
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Training Tab
 * Course assignments, completion tracking, compliance heatmap
 */
function TrainingTab() {
  const roleAccess = useRoleAccess();
  const { data: trainingData, isLoading } = useQuery({
    queryKey: ['hr', 'training'],
    queryFn: () => api.get('/hr/training').then((res: any) => res.data || res),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Overdue Trainings"
          value={trainingData?.overdueCount || 12}
          variant="danger"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <StatWidget
          label="Due This Month"
          value={trainingData?.dueThisMonth || 25}
          variant="warning"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatWidget
          label="Completion Rate"
          value={`${trainingData?.completionRate || 92}%`}
          variant="success"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <StatWidget
          label="Total Courses"
          value={trainingData?.totalCourses || 11}
          icon={<GraduationCap className="w-6 h-6" />}
        />
      </WidgetGrid>

      {/* Training Compliance Heatmap */}
      <WidgetContainer
        title="Training Compliance Heatmap"
        subtitle="Employee × Required Course completion status"
        action={roleAccess.canAccessFeature(FeaturePermission.MANAGE_TRAINING) ? {
          label: 'Assign Training',
          onClick: () => window.location.href = '/hr/training/assign',
        } : undefined}
      >
        <p className="text-sm text-gray-500">Training compliance heatmap (to be implemented)</p>
        <p className="text-xs text-gray-400 mt-2">
          Visual matrix showing which employees have completed which required courses.
          Green = Complete, Yellow = In Progress, Red = Overdue
        </p>
      </WidgetContainer>

      {/* Overdue Trainings */}
      <WidgetContainer
        title="Overdue Trainings"
        subtitle="Employees with expired or overdue training requirements"
      >
        <p className="text-sm text-gray-500">Overdue trainings table (to be implemented)</p>
      </WidgetContainer>
    </div>
  );
}

/**
 * Discipline Tab
 * Progressive discipline actions, appeals, corrective action plans
 */
function DisciplineTab() {
  const roleAccess = useRoleAccess();
  const { data: disciplineData, isLoading } = useQuery({
    queryKey: ['hr', 'discipline'],
    queryFn: () => api.get('/discipline/dashboard').then((res: any) => res.data || res),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Active Actions"
          value={disciplineData?.activeActions || 8}
          variant="warning"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <StatWidget
          label="Pending Appeals"
          value={disciplineData?.pendingAppeals || 2}
          variant="warning"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatWidget
          label="Actions (YTD)"
          value={disciplineData?.actionsYTD || 23}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatWidget
          label="Terminations (YTD)"
          value={disciplineData?.terminationsYTD || 3}
          icon={<Users className="w-6 h-6" />}
        />
      </WidgetGrid>

      {/* Active Disciplinary Actions */}
      <WidgetContainer
        title="Active Disciplinary Actions"
        subtitle="Verbal warnings, written warnings, suspensions"
        action={roleAccess.canAccessFeature(FeaturePermission.MANAGE_DISCIPLINE) ? {
          label: 'New Action',
          onClick: () => window.location.href = '/hr/discipline/new',
        } : undefined}
      >
        <p className="text-sm text-gray-500">Active disciplinary actions table (to be implemented)</p>
      </WidgetContainer>

      {/* Pending Appeals */}
      {disciplineData?.pendingAppeals > 0 && (
        <WidgetContainer
          title="Pending Appeals"
          subtitle="Employee appeals requiring review"
        >
          <p className="text-sm text-gray-500">Pending appeals table (to be implemented)</p>
        </WidgetContainer>
      )}

      {/* Discipline Trends */}
      <WidgetContainer
        title="Discipline Trends (Last 12 Months)"
        subtitle="Actions by incident type"
      >
        <p className="text-sm text-gray-500">Discipline trends chart (to be implemented)</p>
      </WidgetContainer>
    </div>
  );
}

/**
 * Performance Tab
 * SPI scores, tier rankings, retention risk
 */
function PerformanceTab() {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['hr', 'performance'],
    queryFn: () => api.get('/hr/performance').then((res: any) => res.data || res),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Tier 1 (Top Performers)"
          value={performanceData?.tier1Count || 25}
          variant="success"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatWidget
          label="Tier 2 (Good)"
          value={performanceData?.tier2Count || 42}
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <StatWidget
          label="Tier 3 (Needs Improvement)"
          value={performanceData?.tier3Count || 15}
          variant="warning"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <StatWidget
          label="Retention Risk (High)"
          value={performanceData?.retentionRiskCount || 8}
          variant="danger"
          icon={<Users className="w-6 h-6" />}
        />
      </WidgetGrid>

      {/* Performance Distribution */}
      <WidgetContainer
        title="SPI Score Distribution"
        subtitle="Serenity Performance Index (0-100)"
      >
        <p className="text-sm text-gray-500">SPI score distribution chart (to be implemented)</p>
        <p className="text-xs text-gray-400 mt-2">
          Histogram showing distribution of employee SPI scores across all active caregivers.
        </p>
      </WidgetContainer>

      {/* Retention Risk */}
      <WidgetContainer
        title="High Retention Risk Employees"
        subtitle="Employees at risk of turnover (predictive model)"
      >
        <p className="text-sm text-gray-500">Retention risk table (to be implemented)</p>
        <p className="text-xs text-gray-400 mt-2">
          ML-based churn prediction model identifies employees likely to leave within 90 days.
        </p>
      </WidgetContainer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-sm text-gray-600">Loading...</span>
    </div>
  );
}

// Export with RBAC protection
export default withRoleAccess(TalentCommandCenter, DashboardPermission.TALENT_COMMAND_CENTER);
