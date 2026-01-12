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
  UserGroupIcon,
  HeartIcon,
  BeakerIcon,
  DocumentCheckIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { clinicalDashboardService, ClinicalMetrics } from '../../services/clinicalDashboard.service';

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
      clickable={!!onClick}
      onClick={onClick}
      className={`transition-all hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
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

export function WorkingClinicalDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ClinicalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'criticalAlerts' | 'vitalSigns' | 'medicationAdherence' | 'carePlans' | 'activePatients' | 'highPriorityPatients' | 'clinicalTasks'>('dashboard');

  // State for charts
  const [chartData, setChartData] = useState<{ vitals: any[]; admissions: any[] }>({
    vitals: [],
    admissions: []
  });

  // View history for navigation
  const [viewHistory, setViewHistory] = useState<typeof activeView[]>(['dashboard']);

  const navigateToView = (view: typeof activeView) => {
    setViewHistory([...viewHistory, view]);
    setActiveView(view);
  };

  const navigateBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      setViewHistory(newHistory);
      setActiveView(newHistory[newHistory.length - 1]);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.organizationId) return;

      try {
        setLoading(true);
        const [metricsData, chartsData] = await Promise.all([
          clinicalDashboardService.getMetrics(user.organizationId),
          clinicalDashboardService.getChartsData(user.organizationId)
        ]);
        setMetrics(metricsData);
        setChartData(chartsData);
      } catch (error) {
        console.error("Failed to load clinical dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.organizationId]);

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

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Clinical Dashboard
              {activeView !== 'dashboard' && (
                <span className="text-xl font-normal text-gray-500 ml-3">
                  / {activeView.replace(/([A-Z])/g, ' $1').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Patient care monitoring, clinical alerts, and care plan management
            </p>
          </div>
          {activeView === 'dashboard' ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          ) : (
            <button
              onClick={navigateBack}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {/* Critical Alerts Banner */}
            {metrics.criticalAlerts > 0 && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="danger"
              title={`🚨 ${metrics.criticalAlerts} Critical Clinical Alerts`}
            >
              <p className="mb-3">Immediate attention required</p>
              <button
                onClick={() => navigateToView('criticalAlerts')}
                className="px-4 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
              >
                View Alerts
              </button>
            </Alert>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Active Patients"
            value={metrics.activePatients}
            subtitle="❤️ All monitored"
            icon={UserGroupIcon}
            iconColor="bg-patient-600"
            onClick={() => navigateToView('activePatients')}
          />
          <MetricCard
            title="Medication Compliance"
            value={`${metrics.medicationCompliance}%`}
            subtitle="Above target (95%)"
            icon={BeakerIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
            onClick={() => navigateToView('medicationAdherence')}
          />
          <MetricCard
            title="Vital Signs Updated"
            value={metrics.vitalSignsUpdated}
            subtitle="Today's recordings"
            icon={HeartIcon}
            iconColor="bg-primary-600"
            valueColor="text-primary-600"
            onClick={() => navigateToView('vitalSigns')}
          />
          <MetricCard
            title="Care Plan Reviews"
            value={metrics.careplanReviews}
            subtitle="Pending this week"
            icon={DocumentCheckIcon}
            iconColor="bg-purple-600"
            valueColor="text-purple-600"
            onClick={() => navigateToView('carePlans')}
          />
          <MetricCard
            title="New Admissions"
            value={metrics.admissionsToday}
            subtitle="Today"
            icon={UserPlusIcon}
            iconColor="bg-success-600"
            onClick={() => window.location.href = '/patients/intake'}
          />
          <MetricCard
            title="Critical Alerts"
            value={metrics.criticalAlerts}
            subtitle="Require attention"
            icon={ExclamationTriangleIcon}
            iconColor={metrics.criticalAlerts > 3 ? 'bg-danger-600' : 'bg-warning-600'}
            valueColor={metrics.criticalAlerts > 3 ? 'text-danger-600' : 'text-warning-600'}
            onClick={() => navigateToView('criticalAlerts')}
          />
        </div>

        {/* Patient Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">High Priority Patients</h3>
              <button
                onClick={() => navigateToView('highPriorityPatients')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>
            {/* ===== MOCK DATA START ===== Remove this section once real patients exist */}
            <div className="space-y-3">
              <div
                onClick={() => window.location.href = '/patients/12345'}
                className="p-4 bg-danger-50 border border-danger-200 rounded-lg cursor-pointer hover:border-danger-400 hover:bg-danger-100 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Eleanor Johnson (89)</p>
                    <p className="text-sm text-gray-600">Post-surgical wound care • Columbus</p>
                  </div>
                  <Badge variant="danger" size="sm">Critical</Badge>
                </div>
                <p className="text-sm text-danger-700 mt-2">
                  ⚠️ Infection risk - Daily monitoring required
                </p>
              </div>

              <div
                onClick={() => window.location.href = '/patients/12346'}
                className="p-4 bg-warning-50 border border-warning-200 rounded-lg cursor-pointer hover:border-warning-400 hover:bg-warning-100 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Robert Smith (76)</p>
                    <p className="text-sm text-gray-600">Diabetes management • Dublin</p>
                  </div>
                  <Badge variant="warning" size="sm">Monitor</Badge>
                </div>
                <p className="text-sm text-warning-700 mt-2">
                  📊 Blood sugar trending high
                </p>
              </div>

              <div
                onClick={() => window.location.href = '/patients/12347'}
                className="p-4 bg-info-50 border border-info-200 rounded-lg cursor-pointer hover:border-info-400 hover:bg-info-100 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Mary Williams (82)</p>
                    <p className="text-sm text-gray-600">Medication management • Westerville</p>
                  </div>
                  <Badge variant="info" size="sm">Review</Badge>
                </div>
                <p className="text-sm text-info-700 mt-2">
                  📅 Care plan review due tomorrow
                </p>
              </div>
            </div>
            {/* ===== MOCK DATA END ===== */}
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Clinical Tasks Today</h3>
              <button
                onClick={() => navigateToView('clinicalTasks')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>
            {/* ===== MOCK DATA START ===== Remove this section once real clinical tasks exist */}
            <div className="space-y-3">
              <div
                onClick={() => window.location.href = '/clinical/wound-assessments'}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">🩺 Wound Assessments</p>
                  <p className="text-sm text-gray-600">23 patients scheduled</p>
                </div>
                <Badge variant="info" size="sm">18/23</Badge>
              </div>

              <div
                onClick={() => window.location.href = '/clinical/medication-reviews'}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">💊 Medication Reviews</p>
                  <p className="text-sm text-gray-600">15 patients scheduled</p>
                </div>
                <Badge variant="success" size="sm">15/15</Badge>
              </div>

              <div
                onClick={() => window.location.href = '/clinical/care-plan-updates'}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">📋 Care Plan Updates</p>
                  <p className="text-sm text-gray-600">8 patients scheduled</p>
                </div>
                <Badge variant="warning" size="sm">3/8</Badge>
              </div>
            </div>
            {/* ===== MOCK DATA END ===== */}
          </Card>
        </div>

        {/* Clinical Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {/* Medication Compliance Ring */}
          <Card className="text-center">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
              Medication Compliance
            </h3>
            <ProgressRing
              percentage={metrics.medicationCompliance}
              size={150}
              strokeWidth={10}
              color="#10b981"
              label="Target: 95%"
            />
            <p className="text-sm text-success-600 font-medium mt-3">
              Above target 🎯
            </p>
          </Card>

          {/* Vital Signs Trend */}
          <Card className="lg:col-span-2">
            <Chart
              type="line"
              data={chartData.vitals}
              title="Vital Signs Recorded (This Week)"
              height={220}
              width={600}
              showGrid={true}
              showAxes={true}
              color="#3b82f6"
            />
          </Card>
        </div>

        {/* Admissions Chart */}
        <div className="mb-8 animate-fade-in">
          <Chart
            type="bar"
            data={chartData.admissions}
            title="Monthly Admissions Trend"
            height={240}
            width={1200}
            showGrid={true}
            showAxes={true}
            showValues={true}
            color="#8b5cf6"
          />
        </div>

        {/* Quick Actions */}
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigateToView('criticalAlerts')}
              className="px-4 py-3 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 transition-all hover:scale-105"
            >
              🚨 View Critical Alerts
            </button>
            <button
              onClick={() => navigateToView('vitalSigns')}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all hover:scale-105"
            >
              📊 Vital Signs Report
            </button>
            <button
              onClick={() => navigateToView('medicationAdherence')}
              className="px-4 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-all hover:scale-105"
            >
              💊 Medication Adherence
            </button>
            <button
              onClick={() => window.location.href = '/clinical/care-plan-builder'}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all hover:scale-105"
            >
              📋 Care Plan Builder
            </button>
          </div>
        </Card>
          </>
        )}

        {/* Critical Alerts View */}
        {activeView === 'criticalAlerts' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Critical Clinical Alerts</h2>
            <div className="space-y-4">
              {[
                { patient: 'Eleanor Johnson', age: 89, alert: 'Infection risk detected', severity: 'Critical', location: 'Columbus' },
                { patient: 'Robert Smith', age: 76, alert: 'Blood sugar levels critically high', severity: 'Critical', location: 'Dublin' },
                { patient: 'Mary Williams', age: 82, alert: 'Missed medication doses', severity: 'High', location: 'Westerville' }
              ].map((alert, idx) => (
                <div key={idx} className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{alert.patient} ({alert.age})</h4>
                      <p className="text-sm text-gray-600">{alert.location}</p>
                    </div>
                    <Badge variant="danger" size="sm">{alert.severity}</Badge>
                  </div>
                  <p className="text-danger-700 mt-2">⚠️ {alert.alert}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1.5 bg-danger-600 text-white rounded text-sm hover:bg-danger-700">
                      Review Patient
                    </button>
                    <button className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                      Assign to RN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Vital Signs View */}
        {activeView === 'vitalSigns' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vital Signs Report - Today</h2>
            <div className="space-y-4">
              {[
                { patient: 'Eleanor Johnson', bp: '145/92', temp: '99.1°F', pulse: '88', o2: '95%', status: 'Monitor' },
                { patient: 'Robert Smith', bp: '138/85', temp: '98.6°F', pulse: '76', o2: '97%', status: 'Normal' },
                { patient: 'Mary Williams', bp: '128/78', temp: '98.4°F', pulse: '72', o2: '98%', status: 'Normal' }
              ].map((vital, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">{vital.patient}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Blood Pressure</p>
                      <p className="font-medium">{vital.bp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temperature</p>
                      <p className="font-medium">{vital.temp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pulse</p>
                      <p className="font-medium">{vital.pulse}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">O2 Saturation</p>
                      <p className="font-medium">{vital.o2}</p>
                    </div>
                    <div>
                      <Badge variant={vital.status === 'Normal' ? 'success' : 'warning'}>{vital.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Medication Adherence View */}
        {activeView === 'medicationAdherence' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Medication Adherence Report</h2>
            <div className="space-y-4">
              {[
                { patient: 'Eleanor Johnson', compliance: 98, missed: 0, medications: 8 },
                { patient: 'Robert Smith', compliance: 95, missed: 2, medications: 12 },
                { patient: 'Mary Williams', compliance: 100, missed: 0, medications: 6 }
              ].map((med, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{med.patient}</h4>
                    <Badge variant={med.compliance >= 95 ? 'success' : 'warning'}>
                      {med.compliance}% Compliance
                    </Badge>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-gray-500">Active Medications</p>
                      <p className="font-medium">{med.medications}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Missed Doses (30 days)</p>
                      <p className="font-medium">{med.missed}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Care Plans View */}
        {activeView === 'carePlans' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Care Plan Reviews</h2>
            <div className="space-y-4">
              {[
                { patient: 'Eleanor Johnson', dueDate: '2026-01-05', type: 'Post-Surgical', priority: 'High' },
                { patient: 'Robert Smith', dueDate: '2026-01-06', type: 'Diabetes Management', priority: 'Medium' },
                { patient: 'Mary Williams', dueDate: '2026-01-05', type: 'Medication Review', priority: 'Medium' }
              ].map((plan, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.patient}</h4>
                      <p className="text-sm text-gray-600">{plan.type}</p>
                    </div>
                    <Badge variant={plan.priority === 'High' ? 'danger' : 'warning'}>{plan.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Due: {new Date(plan.dueDate).toLocaleDateString()}</p>
                  <button className="mt-3 px-3 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                    Review Care Plan
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Patients View */}
        {activeView === 'activePatients' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Patients ({metrics.activePatients})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Eleanor Johnson', age: 89, status: 'Critical', location: 'Columbus' },
                { name: 'Robert Smith', age: 76, status: 'Stable', location: 'Dublin' },
                { name: 'Mary Williams', age: 82, status: 'Stable', location: 'Westerville' },
                { name: 'James Brown', age: 71, status: 'Stable', location: 'Powell' },
                { name: 'Patricia Davis', age: 85, status: 'Monitor', location: 'Worthington' },
                { name: 'Michael Wilson', age: 79, status: 'Stable', location: 'Hilliard' }
              ].map((patient, idx) => (
                <div
                  key={idx}
                  onClick={() => window.location.href = `/patients/${12345 + idx}`}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                >
                  <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                  <p className="text-sm text-gray-600">Age: {patient.age} • {patient.location}</p>
                  <Badge
                    variant={patient.status === 'Critical' ? 'danger' : patient.status === 'Monitor' ? 'warning' : 'success'}
                    size="sm"
                    className="mt-2"
                  >
                    {patient.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* High Priority Patients View */}
        {activeView === 'highPriorityPatients' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">High Priority Patients</h2>
            <div className="space-y-4">
              {[
                { name: 'Eleanor Johnson', age: 89, risk: 'Infection risk - Daily monitoring required', level: 'Critical', location: 'Columbus' },
                { name: 'Robert Smith', age: 76, risk: 'Blood sugar trending high', level: 'Monitor', location: 'Dublin' },
                { name: 'Mary Williams', age: 82, risk: 'Care plan review due tomorrow', level: 'Review', location: 'Westerville' }
              ].map((patient, idx) => (
                <div
                  key={idx}
                  onClick={() => window.location.href = `/patients/${12345 + idx}`}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{patient.name} ({patient.age})</h4>
                      <p className="text-sm text-gray-600">{patient.location}</p>
                    </div>
                    <Badge variant={patient.level === 'Critical' ? 'danger' : patient.level === 'Monitor' ? 'warning' : 'info'}>
                      {patient.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">⚠️ {patient.risk}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Clinical Tasks View */}
        {activeView === 'clinicalTasks' && (
          <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Clinical Tasks - Today</h2>
            <div className="space-y-4">
              {[
                { task: 'Wound Assessments', scheduled: 23, completed: 18, type: 'Assessment' },
                { task: 'Medication Reviews', scheduled: 15, completed: 15, type: 'Review' },
                { task: 'Care Plan Updates', scheduled: 8, completed: 3, type: 'Documentation' }
              ].map((task, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{task.task}</h4>
                      <p className="text-sm text-gray-600">{task.type}</p>
                    </div>
                    <Badge
                      variant={task.completed === task.scheduled ? 'success' : task.completed / task.scheduled > 0.7 ? 'info' : 'warning'}
                    >
                      {task.completed}/{task.scheduled}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        task.completed === task.scheduled ? 'bg-success-600' : 'bg-primary-600'
                      }`}
                      style={{ width: `${(task.completed / task.scheduled) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
