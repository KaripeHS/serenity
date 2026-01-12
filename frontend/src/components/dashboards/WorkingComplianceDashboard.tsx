import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { Chart } from '../ui/Chart';
import { ProgressRing } from '../ui/ProgressRing';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  LockClosedIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { complianceDashboardService, ComplianceMetric, AuditItem } from '../../services/complianceDashboard.service';

// View types for drill-down
type ViewType = 'dashboard' | 'hipaaCompliance' | 'activeAudits' | 'expiredCertifications' | 'pendingTrainings' | 'securityIncidents' | 'dataBreaches' | 'trainingCompletion' | 'complianceTrend' | 'complianceItemDetail';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  valueColor?: string;
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon: Icon, iconColor, valueColor = 'text-gray-900', onClick }: MetricCardProps) {
  return (
    <Card
      hoverable
      className={`transition-all hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconColor} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    'completed': 'success',
    'resolved': 'success',
    'in-progress': 'info',
    'open': 'warning',
    'pending': 'warning',
    'overdue': 'danger',
    'expired': 'danger'
  };

  return <Badge variant={variants[status] || 'gray'} size="sm">{status ? status.replace('_', ' ') : 'Unknown'}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, any> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'gray'
  };

  return <Badge variant={variants[priority] || 'gray'} size="sm">{priority}</Badge>;
}

// Mock data for drill-down views
interface CertificationRecord {
  id: string;
  staffName: string;
  certification: string;
  expiryDate: string;
  status: 'current' | 'expiring_soon' | 'expired';
  daysUntilExpiry: number;
}

interface TrainingRecord {
  id: string;
  staffName: string;
  trainingName: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'overdue';
  progress: number;
}

interface AuditRecord {
  id: string;
  auditName: string;
  auditor: string;
  startDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'findings_pending';
  findings: number;
  area: string;
}

interface SecurityIncident {
  id: string;
  type: string;
  description: string;
  reportedDate: string;
  status: 'investigating' | 'resolved' | 'escalated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
}

interface HIPAAChecklistItem {
  id: string;
  category: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  lastReviewed: string;
  notes: string;
}

export function WorkingComplianceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [complianceItems, setComplianceItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [viewHistory, setViewHistory] = useState<ViewType[]>(['dashboard']);
  const [selectedComplianceItem, setSelectedComplianceItem] = useState<AuditItem | null>(null);

  // Mock data for drill-down views
  const [certificationRecords] = useState<CertificationRecord[]>([
    { id: 'CERT001', staffName: 'Maria Garcia', certification: 'CPR/BLS', expiryDate: '2026-02-15', status: 'expired', daysUntilExpiry: -30 },
    { id: 'CERT002', staffName: 'James Wilson', certification: 'CNA License', expiryDate: '2026-03-01', status: 'expiring_soon', daysUntilExpiry: 14 },
    { id: 'CERT003', staffName: 'Sarah Johnson', certification: 'HIPAA Training', expiryDate: '2026-04-15', status: 'expiring_soon', daysUntilExpiry: 60 },
    { id: 'CERT004', staffName: 'Michael Brown', certification: 'First Aid', expiryDate: '2026-12-31', status: 'current', daysUntilExpiry: 320 },
    { id: 'CERT005', staffName: 'Emily Davis', certification: 'TB Test', expiryDate: '2026-01-20', status: 'expired', daysUntilExpiry: -55 },
    { id: 'CERT006', staffName: 'Robert Martinez', certification: 'Background Check', expiryDate: '2027-06-15', status: 'current', daysUntilExpiry: 530 },
  ]);

  const [trainingRecords] = useState<TrainingRecord[]>([
    { id: 'TRN001', staffName: 'Maria Garcia', trainingName: 'HIPAA Privacy Refresher', dueDate: '2026-02-28', status: 'overdue', progress: 45 },
    { id: 'TRN002', staffName: 'James Wilson', trainingName: 'Infection Control', dueDate: '2026-03-15', status: 'in_progress', progress: 75 },
    { id: 'TRN003', staffName: 'Sarah Johnson', trainingName: 'Fall Prevention', dueDate: '2026-03-20', status: 'not_started', progress: 0 },
    { id: 'TRN004', staffName: 'Michael Brown', trainingName: 'Medication Administration', dueDate: '2026-02-10', status: 'completed', progress: 100 },
    { id: 'TRN005', staffName: 'Emily Davis', trainingName: 'Patient Rights', dueDate: '2026-03-01', status: 'in_progress', progress: 30 },
  ]);

  const [auditRecords] = useState<AuditRecord[]>([
    { id: 'AUD001', auditName: 'Annual HIPAA Compliance Audit', auditor: 'Internal Compliance Team', startDate: '2026-01-15', status: 'in_progress', findings: 3, area: 'Privacy & Security' },
    { id: 'AUD002', auditName: 'EVV System Audit', auditor: 'State Medicaid Agency', startDate: '2026-02-01', status: 'scheduled', findings: 0, area: 'Billing Compliance' },
    { id: 'AUD003', auditName: 'Clinical Documentation Review', auditor: 'Quality Assurance', startDate: '2026-01-10', status: 'findings_pending', findings: 5, area: 'Clinical' },
  ]);

  const [securityIncidents] = useState<SecurityIncident[]>([
    { id: 'SEC001', type: 'Phishing Attempt', description: 'Suspicious email reported by staff', reportedDate: '2026-01-20', status: 'resolved', severity: 'low', affectedSystems: ['Email'] },
    { id: 'SEC002', type: 'Failed Login Attempts', description: 'Multiple failed login attempts detected', reportedDate: '2026-01-25', status: 'investigating', severity: 'medium', affectedSystems: ['EHR Portal'] },
  ]);

  const [hipaaChecklist] = useState<HIPAAChecklistItem[]>([
    { id: 'HIPAA001', category: 'Administrative Safeguards', requirement: 'Security Management Process', status: 'compliant', lastReviewed: '2026-01-15', notes: 'Risk analysis completed' },
    { id: 'HIPAA002', category: 'Administrative Safeguards', requirement: 'Workforce Security', status: 'compliant', lastReviewed: '2026-01-15', notes: 'Access controls in place' },
    { id: 'HIPAA003', category: 'Administrative Safeguards', requirement: 'Security Awareness Training', status: 'partial', lastReviewed: '2026-01-15', notes: '85% staff trained' },
    { id: 'HIPAA004', category: 'Physical Safeguards', requirement: 'Facility Access Controls', status: 'compliant', lastReviewed: '2026-01-10', notes: 'Badge access implemented' },
    { id: 'HIPAA005', category: 'Physical Safeguards', requirement: 'Workstation Security', status: 'non_compliant', lastReviewed: '2026-01-10', notes: 'Screen locks need enforcement' },
    { id: 'HIPAA006', category: 'Technical Safeguards', requirement: 'Access Control', status: 'compliant', lastReviewed: '2026-01-12', notes: 'Role-based access in place' },
    { id: 'HIPAA007', category: 'Technical Safeguards', requirement: 'Audit Controls', status: 'compliant', lastReviewed: '2026-01-12', notes: 'All access logged' },
    { id: 'HIPAA008', category: 'Technical Safeguards', requirement: 'Encryption', status: 'partial', lastReviewed: '2026-01-12', notes: 'Data at rest needs encryption' },
  ]);

  // Filter states
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<string[]>([]);
  const [certTypeFilter, setCertTypeFilter] = useState<string[]>([]);
  const [certSortBy, setCertSortBy] = useState<'name' | 'expiry' | 'status'>('expiry');
  const [certSortOrder, setCertSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCertFilters, setShowCertFilters] = useState(false);

  const [trainingSearchTerm, setTrainingSearchTerm] = useState('');
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<string[]>([]);
  const [trainingSortBy, setTrainingSortBy] = useState<'name' | 'dueDate' | 'progress'>('dueDate');
  const [trainingSortOrder, setTrainingSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showTrainingFilters, setShowTrainingFilters] = useState(false);

  // Navigation helpers
  const navigateToView = (view: ViewType) => {
    setViewHistory(prev => [...prev, view]);
    setCurrentView(view);
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      const previousView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentView(previousView);
    } else {
      setCurrentView('dashboard');
    }
  };

  // Mock chart data
  const complianceTrendData = [
    { label: 'Jan', value: 82.5 },
    { label: 'Feb', value: 84.2 },
    { label: 'Mar', value: 85.8 },
    { label: 'Apr', value: 86.5 },
    { label: 'May', value: 87.0 },
    { label: 'Jun', value: 87.5 }
  ];

  const trainingCompletionData = [
    { label: 'Week 1', value: 45 },
    { label: 'Week 2', value: 67 },
    { label: 'Week 3', value: 82 },
    { label: 'Week 4', value: 94 }
  ];

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.organizationId) return;

      try {
        setLoading(true);
        const data = await complianceDashboardService.getComplianceData(user.organizationId);

        const metricsObj = {
          hipaaComplianceScore: data.metrics.find(m => m.area.includes('HIPAA'))?.score || 0,
          activeAudits: data.metrics.find(m => m.area.includes('EVV'))?.status === 'non-compliant' ? 1 : 0,
          expiredCertifications: data.items.filter(i => i.category === 'Certification').length,
          pendingTrainings: 0,
          securityIncidents: 0,
          dataBreaches: 0
        };

        setMetrics(metricsObj);
        setComplianceItems(data.items);
      } catch (error) {
        console.error("Failed to load compliance data", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user?.organizationId]);

  // Get unique certification types
  const certificationTypes = Array.from(new Set(certificationRecords.map(c => c.certification)));

  // Filtered and sorted certifications
  const filteredCertifications = certificationRecords
    .filter(cert => {
      if (certSearchTerm && !cert.staffName.toLowerCase().includes(certSearchTerm.toLowerCase()) &&
          !cert.certification.toLowerCase().includes(certSearchTerm.toLowerCase())) {
        return false;
      }
      if (certStatusFilter.length > 0 && !certStatusFilter.includes(cert.status)) {
        return false;
      }
      if (certTypeFilter.length > 0 && !certTypeFilter.includes(cert.certification)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (certSortBy) {
        case 'name':
          comparison = a.staffName.localeCompare(b.staffName);
          break;
        case 'expiry':
          comparison = a.daysUntilExpiry - b.daysUntilExpiry;
          break;
        case 'status':
          const statusOrder = { expired: 0, expiring_soon: 1, current: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return certSortOrder === 'asc' ? comparison : -comparison;
    });

  // Active certification filter count
  const activeCertFilterCount = (certSearchTerm ? 1 : 0) + certStatusFilter.length + certTypeFilter.length;

  // Filtered and sorted trainings
  const filteredTrainings = trainingRecords
    .filter(training => {
      if (trainingSearchTerm && !training.staffName.toLowerCase().includes(trainingSearchTerm.toLowerCase()) &&
          !training.trainingName.toLowerCase().includes(trainingSearchTerm.toLowerCase())) {
        return false;
      }
      if (trainingStatusFilter.length > 0 && !trainingStatusFilter.includes(training.status)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (trainingSortBy) {
        case 'name':
          comparison = a.staffName.localeCompare(b.staffName);
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
      }
      return trainingSortOrder === 'asc' ? comparison : -comparison;
    });

  // Active training filter count
  const activeTrainingFilterCount = (trainingSearchTerm ? 1 : 0) + trainingStatusFilter.length;

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-3" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const getComplianceColor = () => {
    if (metrics.hipaaComplianceScore >= 85) return 'text-success-600';
    if (metrics.hipaaComplianceScore >= 70) return 'text-warning-600';
    return 'text-danger-600';
  };

  // ===== DASHBOARD VIEW =====
  const renderDashboardView = () => (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Compliance & Security Management
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. HIPAA compliance, audit management, and regulatory oversight
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Critical Alerts */}
        {(metrics.expiredCertifications > 0 || metrics.securityIncidents > 0) && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="danger"
              title="🚨 Critical Compliance Issues Detected"
            >
              {metrics.expiredCertifications} expired certifications, {metrics.securityIncidents} security incidents
            </Alert>
          </div>
        )}

        {/* HIPAA Compliance Score & Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {/* HIPAA Score Ring - Clickable */}
          <Card
            className="text-center cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigateToView('hipaaCompliance')}
          >
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              <ShieldCheckIcon className="h-5 w-5 inline mr-2 text-primary-600" />
              HIPAA Compliance
            </h3>
            <ProgressRing
              percentage={metrics.hipaaComplianceScore}
              size={160}
              strokeWidth={12}
              color={metrics.hipaaComplianceScore >= 85 ? '#10b981' : metrics.hipaaComplianceScore >= 70 ? '#f59e0b' : '#ef4444'}
              label="Target: 85%"
            />
            <p className={`text-sm font-medium mt-3 ${getComplianceColor()}`}>
              {metrics.hipaaComplianceScore >= 85 ? 'Fully Compliant ✓' : 'Below Target'}
            </p>
            <p className="text-xs text-primary-600 mt-2">Click to view details →</p>
          </Card>

          {/* Compliance Trend - Clickable */}
          <Card
            className="lg:col-span-2 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigateToView('complianceTrend')}
          >
            <Chart
              type="area"
              data={complianceTrendData}
              title="HIPAA Compliance Trend (6 Months)"
              height={220}
              width={600}
              showGrid={true}
              showAxes={true}
              color="#10b981"
              gradientFrom="#10b981"
              gradientTo="#34d399"
            />
            <p className="text-xs text-primary-600 mt-2 text-center">Click to view detailed trend analysis →</p>
          </Card>
        </div>

        {/* Training Completion Chart - Clickable */}
        <div className="mb-8 animate-fade-in">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigateToView('trainingCompletion')}
          >
            <Chart
              type="bar"
              data={trainingCompletionData}
              title="Training Completion Rate (This Month)"
              height={240}
              width={1200}
              showGrid={true}
              showAxes={true}
              showValues={true}
              color="#3b82f6"
            />
            <p className="text-xs text-primary-600 mt-2 text-center">Click to view training details →</p>
          </Card>
        </div>

        {/* Key Metrics - All Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Active Audits"
            value={metrics.activeAudits}
            subtitle="In progress"
            icon={DocumentTextIcon}
            iconColor="bg-primary-600"
            valueColor="text-primary-600"
            onClick={() => navigateToView('activeAudits')}
          />
          <MetricCard
            title="Expired Certifications"
            value={metrics.expiredCertifications}
            subtitle="Need renewal"
            icon={ExclamationTriangleIcon}
            iconColor="bg-danger-600"
            valueColor="text-danger-600"
            onClick={() => navigateToView('expiredCertifications')}
          />
          <MetricCard
            title="Pending Trainings"
            value={metrics.pendingTrainings}
            subtitle="Staff members"
            icon={AcademicCapIcon}
            iconColor="bg-warning-600"
            valueColor="text-warning-600"
            onClick={() => navigateToView('pendingTrainings')}
          />
          <MetricCard
            title="Security Incidents"
            value={metrics.securityIncidents}
            subtitle="This month"
            icon={ExclamationTriangleIcon}
            iconColor={metrics.securityIncidents === 0 ? 'bg-success-600' : 'bg-danger-600'}
            valueColor={metrics.securityIncidents === 0 ? 'text-success-600' : 'text-danger-600'}
            onClick={() => navigateToView('securityIncidents')}
          />
          <MetricCard
            title="Data Breaches"
            value={metrics.dataBreaches}
            subtitle={metrics.dataBreaches === 0 ? 'Secure' : 'Critical'}
            icon={ShieldCheckIcon}
            iconColor={metrics.dataBreaches === 0 ? 'bg-success-600' : 'bg-danger-600'}
            valueColor={metrics.dataBreaches === 0 ? 'text-success-600' : 'text-danger-600'}
            onClick={() => navigateToView('dataBreaches')}
          />
        </div>

        {/* Compliance Items */}
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Items Requiring Attention
          </h3>
          <div className="space-y-4">
            {complianceItems.filter(item => item.status !== 'resolved').map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg transition-all hover:border-primary-300 hover:bg-primary-50 ${item.status === 'open' || item.status === 'overdue'
                    ? 'border-danger-300 bg-danger-50'
                    : 'border-gray-200 bg-gray-50'
                  }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">{item.finding}</h4>
                      <PriorityBadge priority={item.severity} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {item.category} • Due: {item.dueDate}
                    </p>
                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => {
                      setSelectedComplianceItem(item);
                      navigateToView('complianceItemDetail');
                    }}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    👁️ View Details
                  </button>
                  {item.status === 'open' && (
                    <button
                      onClick={() => {
                        setSelectedComplianceItem(item);
                        navigateToView('complianceItemDetail');
                      }}
                      className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
                    >
                      ✓ Take Action
                    </button>
                  )}
                </div>
              </div>
            ))}
            {complianceItems.filter(item => item.status !== 'resolved').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-success-400" />
                <p className="font-medium text-success-600">All compliance items resolved!</p>
                <p className="text-sm">No outstanding issues at this time.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== HIPAA COMPLIANCE DRILL-DOWN =====
  const renderHIPAAComplianceView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-600 rounded-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">HIPAA Compliance Details</h1>
                <p className="text-gray-600">Security Rule requirements and compliance status</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Export Report
          </button>
        </div>

        {/* Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-primary-50">
            <p className="text-4xl font-bold text-primary-600">{metrics.hipaaComplianceScore}%</p>
            <p className="text-sm text-gray-600">Overall Score</p>
          </Card>
          <Card className="text-center bg-success-50">
            <p className="text-4xl font-bold text-success-600">
              {hipaaChecklist.filter(i => i.status === 'compliant').length}
            </p>
            <p className="text-sm text-gray-600">Compliant</p>
          </Card>
          <Card className="text-center bg-warning-50">
            <p className="text-4xl font-bold text-warning-600">
              {hipaaChecklist.filter(i => i.status === 'partial').length}
            </p>
            <p className="text-sm text-gray-600">Partial</p>
          </Card>
          <Card className="text-center bg-danger-50">
            <p className="text-4xl font-bold text-danger-600">
              {hipaaChecklist.filter(i => i.status === 'non_compliant').length}
            </p>
            <p className="text-sm text-gray-600">Non-Compliant</p>
          </Card>
        </div>

        {/* HIPAA Checklist */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">HIPAA Security Rule Checklist</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Requirement</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Last Reviewed</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hipaaChecklist.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{item.category}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.requirement}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'compliant' ? 'bg-success-100 text-success-700' :
                        item.status === 'partial' ? 'bg-warning-100 text-warning-700' :
                        item.status === 'non_compliant' ? 'bg-danger-100 text-danger-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.lastReviewed}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.notes}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => alert(`Update compliance status for:\n\n${item.requirement}\n\nCurrent Status: ${item.status}\nCategory: ${item.category}\n\nCompliance status update workflow coming soon.`)}
                        className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== ACTIVE AUDITS DRILL-DOWN =====
  const renderActiveAuditsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-600 rounded-lg">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Active Audits</h1>
                <p className="text-gray-600">Track and manage ongoing compliance audits</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Schedule New Audit
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-info-50">
            <p className="text-3xl font-bold text-info-600">{auditRecords.filter(a => a.status === 'scheduled').length}</p>
            <p className="text-sm text-gray-600">Scheduled</p>
          </Card>
          <Card className="text-center bg-primary-50">
            <p className="text-3xl font-bold text-primary-600">{auditRecords.filter(a => a.status === 'in_progress').length}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </Card>
          <Card className="text-center bg-warning-50">
            <p className="text-3xl font-bold text-warning-600">{auditRecords.filter(a => a.status === 'findings_pending').length}</p>
            <p className="text-sm text-gray-600">Findings Pending</p>
          </Card>
          <Card className="text-center bg-success-50">
            <p className="text-3xl font-bold text-success-600">{auditRecords.filter(a => a.status === 'completed').length}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
        </div>

        {/* Audits List */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Audits</h2>
          <div className="space-y-4">
            {auditRecords.map((audit) => (
              <div key={audit.id} className="p-4 border rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{audit.auditName}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        audit.status === 'completed' ? 'bg-success-100 text-success-700' :
                        audit.status === 'in_progress' ? 'bg-primary-100 text-primary-700' :
                        audit.status === 'findings_pending' ? 'bg-warning-100 text-warning-700' :
                        'bg-info-100 text-info-700'
                      }`}>
                        {audit.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Auditor: {audit.auditor}</p>
                    <p className="text-sm text-gray-600">Area: {audit.area} • Started: {audit.startDate}</p>
                    {audit.findings > 0 && (
                      <p className="text-sm text-warning-600 font-medium mt-1">{audit.findings} findings reported</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Viewing audit: ${audit.auditName}\n\nAuditor: ${audit.auditor}\nArea: ${audit.area}\nStatus: ${audit.status}\nFindings: ${audit.findings}\n\nFull audit management coming soon.`)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                    >
                      View Details
                    </button>
                    {audit.status === 'findings_pending' && (
                      <button
                        onClick={() => alert(`Review findings for: ${audit.auditName}\n\n${audit.findings} findings need review.\n\nFindings review workflow coming soon.`)}
                        className="px-4 py-2 bg-warning-600 text-white rounded-lg text-sm font-medium hover:bg-warning-700"
                      >
                        Review Findings
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== EXPIRED CERTIFICATIONS DRILL-DOWN =====
  const renderExpiredCertificationsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-600 rounded-lg">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Staff Certifications</h1>
                <p className="text-gray-600">Track certification status and renewal dates</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Send Renewal Reminders
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-danger-50 cursor-pointer" onClick={() => setCertStatusFilter(['expired'])}>
            <p className="text-3xl font-bold text-danger-600">{certificationRecords.filter(c => c.status === 'expired').length}</p>
            <p className="text-sm text-gray-600">Expired</p>
          </Card>
          <Card className="text-center bg-warning-50 cursor-pointer" onClick={() => setCertStatusFilter(['expiring_soon'])}>
            <p className="text-3xl font-bold text-warning-600">{certificationRecords.filter(c => c.status === 'expiring_soon').length}</p>
            <p className="text-sm text-gray-600">Expiring Soon</p>
          </Card>
          <Card className="text-center bg-success-50 cursor-pointer" onClick={() => setCertStatusFilter(['current'])}>
            <p className="text-3xl font-bold text-success-600">{certificationRecords.filter(c => c.status === 'current').length}</p>
            <p className="text-sm text-gray-600">Current</p>
          </Card>
          <Card className="text-center" onClick={() => setCertStatusFilter([])}>
            <p className="text-3xl font-bold text-gray-600">{certificationRecords.length}</p>
            <p className="text-sm text-gray-600">Total</p>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by staff name or certification..."
                value={certSearchTerm}
                onChange={(e) => setCertSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
              {certSearchTerm && (
                <button
                  onClick={() => setCertSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowCertFilters(!showCertFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showCertFilters || activeCertFilterCount > 0
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
              {activeCertFilterCount > 0 && (
                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeCertFilterCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={`${certSortBy}-${certSortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [typeof certSortBy, typeof certSortOrder];
                  setCertSortBy(sortBy);
                  setCertSortOrder(sortOrder);
                }}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="expiry-asc">Expiring Soonest</option>
                <option value="expiry-desc">Expiring Latest</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="status-asc">Status (Expired First)</option>
                <option value="status-desc">Status (Current First)</option>
              </select>
              <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showCertFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(['expired', 'expiring_soon', 'current'] as const).map((status) => {
                      const isSelected = certStatusFilter.includes(status);
                      const labels = { expired: 'Expired', expiring_soon: 'Expiring Soon', current: 'Current' };
                      return (
                        <button
                          key={status}
                          onClick={() => setCertStatusFilter(prev => isSelected ? prev.filter(s => s !== status) : [...prev, status])}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? status === 'expired' ? 'bg-danger-600 text-white' :
                                status === 'expiring_soon' ? 'bg-warning-600 text-white' :
                                'bg-success-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {labels[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Certification Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certification Type</label>
                  <div className="flex flex-wrap gap-2">
                    {certificationTypes.slice(0, 5).map((type) => {
                      const isSelected = certTypeFilter.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setCertTypeFilter(prev => isSelected ? prev.filter(t => t !== type) : [...prev, type])}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {activeCertFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {activeCertFilterCount} filter{activeCertFilterCount > 1 ? 's' : ''} active •
                    Showing {filteredCertifications.length} of {certificationRecords.length} certifications
                  </p>
                  <button
                    onClick={() => {
                      setCertSearchTerm('');
                      setCertStatusFilter([]);
                      setCertTypeFilter([]);
                      setCertSortBy('expiry');
                      setCertSortOrder('asc');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Certifications Table */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Certifications ({filteredCertifications.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Staff Member</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Certification</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCertifications.map((cert) => (
                  <tr key={cert.id} className={`hover:bg-gray-50 ${cert.status === 'expired' ? 'bg-danger-50' : ''}`}>
                    <td className="px-4 py-4 font-medium text-gray-900">{cert.staffName}</td>
                    <td className="px-4 py-4 text-gray-900">{cert.certification}</td>
                    <td className="px-4 py-4 text-gray-600">{cert.expiryDate}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cert.status === 'expired' ? 'bg-danger-100 text-danger-700' :
                        cert.status === 'expiring_soon' ? 'bg-warning-100 text-warning-700' :
                        'bg-success-100 text-success-700'
                      }`}>
                        {cert.status === 'expired' ? `Expired ${Math.abs(cert.daysUntilExpiry)}d ago` :
                         cert.status === 'expiring_soon' ? `${cert.daysUntilExpiry}d left` :
                         'Current'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`Send reminder to ${cert.staffName} about ${cert.certification} renewal.\n\nReminder sent successfully! (Demo)`)}
                          className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          Send Reminder
                        </button>
                        <button
                          onClick={() => alert(`Update certification for ${cert.staffName}:\n\n${cert.certification}\n\nUpload new certification document to mark as renewed.\n\nDocument upload coming soon.`)}
                          className="px-3 py-1 text-sm bg-success-100 text-success-700 rounded hover:bg-success-200"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== PENDING TRAININGS DRILL-DOWN =====
  const renderPendingTrainingsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning-600 rounded-lg">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Training Management</h1>
                <p className="text-gray-600">Track staff training progress and compliance</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Assign New Training
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-danger-50 cursor-pointer" onClick={() => setTrainingStatusFilter(['overdue'])}>
            <p className="text-3xl font-bold text-danger-600">{trainingRecords.filter(t => t.status === 'overdue').length}</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </Card>
          <Card className="text-center bg-primary-50 cursor-pointer" onClick={() => setTrainingStatusFilter(['in_progress'])}>
            <p className="text-3xl font-bold text-primary-600">{trainingRecords.filter(t => t.status === 'in_progress').length}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </Card>
          <Card className="text-center bg-gray-100 cursor-pointer" onClick={() => setTrainingStatusFilter(['not_started'])}>
            <p className="text-3xl font-bold text-gray-600">{trainingRecords.filter(t => t.status === 'not_started').length}</p>
            <p className="text-sm text-gray-600">Not Started</p>
          </Card>
          <Card className="text-center bg-success-50 cursor-pointer" onClick={() => setTrainingStatusFilter(['completed'])}>
            <p className="text-3xl font-bold text-success-600">{trainingRecords.filter(t => t.status === 'completed').length}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by staff name or training..."
                value={trainingSearchTerm}
                onChange={(e) => setTrainingSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
              {trainingSearchTerm && (
                <button
                  onClick={() => setTrainingSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowTrainingFilters(!showTrainingFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showTrainingFilters || activeTrainingFilterCount > 0
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
              {activeTrainingFilterCount > 0 && (
                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeTrainingFilterCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={`${trainingSortBy}-${trainingSortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [typeof trainingSortBy, typeof trainingSortOrder];
                  setTrainingSortBy(sortBy);
                  setTrainingSortOrder(sortOrder);
                }}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="dueDate-asc">Due Date (Earliest)</option>
                <option value="dueDate-desc">Due Date (Latest)</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="progress-asc">Progress (Low-High)</option>
                <option value="progress-desc">Progress (High-Low)</option>
              </select>
              <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showTrainingFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(['overdue', 'in_progress', 'not_started', 'completed'] as const).map((status) => {
                      const isSelected = trainingStatusFilter.includes(status);
                      const labels = { overdue: 'Overdue', in_progress: 'In Progress', not_started: 'Not Started', completed: 'Completed' };
                      return (
                        <button
                          key={status}
                          onClick={() => setTrainingStatusFilter(prev => isSelected ? prev.filter(s => s !== status) : [...prev, status])}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? status === 'overdue' ? 'bg-danger-600 text-white' :
                                status === 'in_progress' ? 'bg-primary-600 text-white' :
                                status === 'completed' ? 'bg-success-600 text-white' :
                                'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {labels[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {activeTrainingFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {activeTrainingFilterCount} filter{activeTrainingFilterCount > 1 ? 's' : ''} active •
                    Showing {filteredTrainings.length} of {trainingRecords.length} trainings
                  </p>
                  <button
                    onClick={() => {
                      setTrainingSearchTerm('');
                      setTrainingStatusFilter([]);
                      setTrainingSortBy('dueDate');
                      setTrainingSortOrder('asc');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Trainings Table */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Training Records ({filteredTrainings.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Staff Member</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Training</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTrainings.map((training) => (
                  <tr key={training.id} className={`hover:bg-gray-50 ${training.status === 'overdue' ? 'bg-danger-50' : ''}`}>
                    <td className="px-4 py-4 font-medium text-gray-900">{training.staffName}</td>
                    <td className="px-4 py-4 text-gray-900">{training.trainingName}</td>
                    <td className="px-4 py-4 text-gray-600">{training.dueDate}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden" style={{ minWidth: '80px' }}>
                          <div
                            className={`h-full ${
                              training.progress === 100 ? 'bg-success-500' :
                              training.progress >= 50 ? 'bg-primary-500' :
                              training.progress > 0 ? 'bg-warning-500' :
                              'bg-gray-300'
                            }`}
                            style={{ width: `${training.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{training.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        training.status === 'completed' ? 'bg-success-100 text-success-700' :
                        training.status === 'in_progress' ? 'bg-primary-100 text-primary-700' :
                        training.status === 'overdue' ? 'bg-danger-100 text-danger-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {training.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`Send reminder to ${training.staffName} about ${training.trainingName}.\n\nReminder sent successfully! (Demo)`)}
                          className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          Remind
                        </button>
                        {training.status !== 'completed' && (
                          <button
                            onClick={() => alert(`Launch training for ${training.staffName}:\n\n${training.trainingName}\n\nProgress: ${training.progress}%\n\nTraining launch coming soon.`)}
                            className="px-3 py-1 text-sm bg-success-100 text-success-700 rounded hover:bg-success-200"
                          >
                            Launch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== SECURITY INCIDENTS DRILL-DOWN =====
  const renderSecurityIncidentsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-600 rounded-lg">
                <LockClosedIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Security Incidents</h1>
                <p className="text-gray-600">Track and manage security events</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors">
            Report New Incident
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-danger-50">
            <p className="text-3xl font-bold text-danger-600">{securityIncidents.filter(s => s.severity === 'critical' || s.severity === 'high').length}</p>
            <p className="text-sm text-gray-600">High/Critical</p>
          </Card>
          <Card className="text-center bg-warning-50">
            <p className="text-3xl font-bold text-warning-600">{securityIncidents.filter(s => s.status === 'investigating').length}</p>
            <p className="text-sm text-gray-600">Investigating</p>
          </Card>
          <Card className="text-center bg-success-50">
            <p className="text-3xl font-bold text-success-600">{securityIncidents.filter(s => s.status === 'resolved').length}</p>
            <p className="text-sm text-gray-600">Resolved</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-gray-600">{securityIncidents.length}</p>
            <p className="text-sm text-gray-600">Total This Month</p>
          </Card>
        </div>

        {/* Incidents List */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Incidents</h2>
          {securityIncidents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-success-400" />
              <p className="text-lg font-medium text-success-600">No security incidents this month!</p>
              <p className="text-sm">Your systems are secure.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityIncidents.map((incident) => (
                <div key={incident.id} className={`p-4 border rounded-lg transition-all ${
                  incident.status === 'investigating' ? 'border-warning-300 bg-warning-50' : 'border-gray-200'
                }`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{incident.type}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          incident.severity === 'critical' ? 'bg-danger-100 text-danger-700' :
                          incident.severity === 'high' ? 'bg-warning-100 text-warning-700' :
                          incident.severity === 'medium' ? 'bg-info-100 text-info-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {incident.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          incident.status === 'resolved' ? 'bg-success-100 text-success-700' :
                          incident.status === 'investigating' ? 'bg-warning-100 text-warning-700' :
                          'bg-danger-100 text-danger-700'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                      <p className="text-xs text-gray-500">
                        Reported: {incident.reportedDate} • Affected: {incident.affectedSystems.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert(`Incident Details:\n\n${incident.type}\n\nSeverity: ${incident.severity}\nStatus: ${incident.status}\nDescription: ${incident.description}\nAffected Systems: ${incident.affectedSystems.join(', ')}\n\nIncident management coming soon.`)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                      >
                        View Details
                      </button>
                      {incident.status === 'investigating' && (
                        <button
                          onClick={() => alert(`Escalating incident: ${incident.type}\n\nThis will notify the security team and management.\n\nEscalation workflow coming soon.`)}
                          className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // ===== DATA BREACHES DRILL-DOWN =====
  const renderDataBreachesView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-600 rounded-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Data Breach Monitoring</h1>
                <p className="text-gray-600">PHI protection and breach notification status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card className="text-center py-12 mb-8">
          <ShieldCheckIcon className="h-24 w-24 mx-auto mb-6 text-success-400" />
          <h2 className="text-3xl font-bold text-success-600 mb-2">All Systems Secure</h2>
          <p className="text-gray-600 mb-4">No data breaches detected</p>
          <p className="text-sm text-gray-500">Last security scan: Today at 3:00 AM</p>
        </Card>

        {/* Security Measures */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Security Measures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Data Encryption', status: 'Active', icon: LockClosedIcon },
              { name: 'Access Logging', status: 'Active', icon: DocumentCheckIcon },
              { name: 'Intrusion Detection', status: 'Active', icon: ShieldCheckIcon },
              { name: 'Backup Systems', status: 'Active', icon: DocumentTextIcon },
            ].map((measure, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg bg-success-50 border-success-200">
                <div className="p-2 bg-success-100 rounded-lg">
                  <measure.icon className="h-6 w-6 text-success-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{measure.name}</h4>
                  <p className="text-sm text-success-600">{measure.status}</p>
                </div>
                <CheckCircleIcon className="h-6 w-6 text-success-500" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== COMPLIANCE ITEM DETAIL VIEW =====
  const renderComplianceItemDetailView = () => {
    if (!selectedComplianceItem) return null;

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedComplianceItem(null);
                  goBack();
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  selectedComplianceItem.severity === 'critical' ? 'bg-danger-600' :
                  selectedComplianceItem.severity === 'high' ? 'bg-warning-600' :
                  selectedComplianceItem.severity === 'medium' ? 'bg-info-600' :
                  'bg-gray-600'
                }`}>
                  <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Compliance Item Details</h1>
                  <p className="text-gray-600">Review and take action on compliance issue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Item Overview */}
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedComplianceItem.finding}</h2>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={selectedComplianceItem.severity} />
                    <StatusBadge status={selectedComplianceItem.status} />
                    <span className="text-sm text-gray-500">ID: {selectedComplianceItem.id}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{selectedComplianceItem.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <p className="font-medium text-gray-900">{selectedComplianceItem.dueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Severity</p>
                  <p className={`font-medium ${
                    selectedComplianceItem.severity === 'critical' ? 'text-danger-600' :
                    selectedComplianceItem.severity === 'high' ? 'text-warning-600' :
                    'text-info-600'
                  }`}>{selectedComplianceItem.severity.toUpperCase()}</p>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Finding Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedComplianceItem.finding}
                </p>
              </div>
            </Card>

            {/* Action Plan */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Review Documentation</p>
                    <p className="text-sm text-gray-600">Ensure all required documentation is current and accessible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Staff Training</p>
                    <p className="text-sm text-gray-600">Schedule training sessions for affected staff members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Policy Update</p>
                    <p className="text-sm text-gray-600">Update internal policies to prevent future occurrences</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 bg-info-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="h-4 w-4 text-info-600" />
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-medium text-gray-900">Item Created</p>
                    <p className="text-sm text-gray-500">Identified during compliance audit</p>
                    <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 bg-warning-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="h-4 w-4 text-warning-600" />
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-medium text-gray-900">Assigned for Review</p>
                    <p className="text-sm text-gray-500">Compliance team notified</p>
                    <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Pending Resolution</p>
                    <p className="text-sm text-gray-500">Awaiting action</p>
                    <p className="text-xs text-gray-400 mt-1">Current status</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => alert('Upload documentation feature coming soon.\n\nThis will allow you to attach evidence of resolution.')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  Upload Documentation
                </button>
                <button
                  onClick={() => alert('Schedule training feature coming soon.\n\nThis will create training assignments for affected staff.')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                  Schedule Training
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Mark this compliance item as resolved?\n\nItem: ${selectedComplianceItem.finding}\n\nThis action will update the compliance score.`)) {
                      alert('Compliance item resolved! (Demo)\n\nIn production, this would:\n• Update the compliance score\n• Send notifications to stakeholders\n• Archive the item with resolution notes');
                      setSelectedComplianceItem(null);
                      goBack();
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Mark as Resolved
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // ===== TRAINING COMPLETION DRILL-DOWN =====
  const renderTrainingCompletionView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-600 rounded-lg">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Training Completion Analysis</h1>
                <p className="text-gray-600">Weekly training completion trends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <Chart
            type="bar"
            data={trainingCompletionData}
            title="Training Completion Rate by Week"
            height={300}
            width={1200}
            showGrid={true}
            showAxes={true}
            showValues={true}
            color="#3b82f6"
          />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigateToView('pendingTrainings')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning-100 rounded-lg">
                <ClockIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Pending Trainings</h3>
                <p className="text-sm text-gray-600">See all incomplete trainings</p>
              </div>
            </div>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigateToView('expiredCertifications')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-danger-100 rounded-lg">
                <ExclamationTriangleIcon className="h-8 w-8 text-danger-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Certification Status</h3>
                <p className="text-sm text-gray-600">Check certification renewals</p>
              </div>
            </div>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Assign Training</h3>
                <p className="text-sm text-gray-600">Assign new training to staff</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // ===== COMPLIANCE TREND DRILL-DOWN =====
  const renderComplianceTrendView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-600 rounded-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Compliance Trend Analysis</h1>
                <p className="text-gray-600">6-month HIPAA compliance progression</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Export Report
          </button>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <Chart
            type="area"
            data={complianceTrendData}
            title="HIPAA Compliance Score Over Time"
            height={350}
            width={1200}
            showGrid={true}
            showAxes={true}
            color="#10b981"
            gradientFrom="#10b981"
            gradientTo="#34d399"
          />
        </Card>

        {/* Monthly Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Change</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complianceTrendData.map((month, idx) => {
                  const prevValue = idx > 0 ? complianceTrendData[idx - 1].value : month.value;
                  const change = month.value - prevValue;
                  return (
                    <tr key={month.label} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">{month.label} 2024</td>
                      <td className="px-4 py-4 text-gray-900">{month.value}%</td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          month.value >= 85 ? 'bg-success-100 text-success-700' :
                          month.value >= 70 ? 'bg-warning-100 text-warning-700' :
                          'bg-danger-100 text-danger-700'
                        }`}>
                          {month.value >= 85 ? 'Compliant' : month.value >= 70 ? 'Needs Improvement' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  // Render based on current view
  switch (currentView) {
    case 'hipaaCompliance':
      return renderHIPAAComplianceView();
    case 'activeAudits':
      return renderActiveAuditsView();
    case 'expiredCertifications':
      return renderExpiredCertificationsView();
    case 'pendingTrainings':
      return renderPendingTrainingsView();
    case 'securityIncidents':
      return renderSecurityIncidentsView();
    case 'dataBreaches':
      return renderDataBreachesView();
    case 'trainingCompletion':
      return renderTrainingCompletionView();
    case 'complianceTrend':
      return renderComplianceTrendView();
    case 'complianceItemDetail':
      return renderComplianceItemDetailView();
    default:
      return renderDashboardView();
  }
}
