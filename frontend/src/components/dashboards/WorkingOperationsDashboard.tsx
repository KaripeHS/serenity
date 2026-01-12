import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { VisitStatusBadge } from '../ui/Badge';
import { Chart } from '../ui/Chart';
import { KPIWidget, KPIGrid } from '../ui/KPIWidget';
import { ProgressRing } from '../ui/ProgressRing';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

type ViewType = 'dashboard' | 'dailyVisits' | 'completedVisits' | 'avgTravelTime' | 'efficiency' | 'caregiverUtilization' | 'weeklyVisits' | 'visitDetail';

interface OperationsMetrics {
  dailyVisits: number;
  completedVisits: number;
  avgTravelTime: number;
  efficiency: number;
  lateVisits: number;
  caregiverUtilization: number;
}

interface Visit {
  id: string;
  patientName: string;
  caregiverName: string;
  scheduledTime: string;
  status: 'scheduled' | 'on_time' | 'late' | 'completed';
  location: string;
}

export function WorkingOperationsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [caregiverBreakdown, setCaregiverBreakdown] = useState({ active: 0, available: 0, offDuty: 0 });
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [viewHistory, setViewHistory] = useState<ViewType[]>(['dashboard']);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const navigateToView = (view: ViewType, visit?: Visit) => {
    if (visit) setSelectedVisit(visit);
    setCurrentView(view);
    setViewHistory([...viewHistory, view]);
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      setViewHistory(newHistory);
      setCurrentView(newHistory[newHistory.length - 1]);
    }
  };

  const [weeklyVisitsData, setWeeklyVisitsData] = useState([
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 0 }
  ]);

  const [travelTimeData, setTravelTimeData] = useState([
    { label: '9 AM', value: 0 },
    { label: '11 AM', value: 0 },
    { label: '1 PM', value: 0 },
    { label: '3 PM', value: 0 },
    { label: '5 PM', value: 0 }
  ]);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/operations/metrics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('serenity_access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            dailyVisits: data.dailyVisits || 0,
            completedVisits: data.completedVisits || 0,
            avgTravelTime: data.avgTravelTime || 0,
            efficiency: data.efficiency || 0,
            lateVisits: data.lateVisits || 0,
            caregiverUtilization: data.caregiverUtilization || 0
          });
          setUpcomingVisits(data.upcomingVisits || []);
          if (data.weeklyVisitsData) setWeeklyVisitsData(data.weeklyVisitsData);
          if (data.travelTimeData) setTravelTimeData(data.travelTimeData);
          if (data.caregiverBreakdown) {
            setCaregiverBreakdown({
              active: data.caregiverBreakdown.active || 0,
              available: data.caregiverBreakdown.available || 0,
              offDuty: data.caregiverBreakdown.offDuty || 0
            });
          }
        } else {
          setMetrics({
            dailyVisits: 0,
            completedVisits: 0,
            avgTravelTime: 0,
            efficiency: 0,
            lateVisits: 0,
            caregiverUtilization: 0
          });
          setUpcomingVisits([]);
        }
      } catch (error) {
        console.error('Failed to load operations metrics:', error);
        setMetrics({
          dailyVisits: 0,
          completedVisits: 0,
          avgTravelTime: 0,
          efficiency: 0,
          lateVisits: 0,
          caregiverUtilization: 0
        });
        setUpcomingVisits([]);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-3" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
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

  const completionRate = Math.round((metrics.completedVisits / metrics.dailyVisits) * 100);

  // Render different views based on currentView
  switch (currentView) {
    case 'dailyVisits':
      return renderDailyVisitsView();
    case 'completedVisits':
      return renderCompletedVisitsView();
    case 'avgTravelTime':
      return renderAvgTravelTimeView();
    case 'efficiency':
      return renderEfficiencyView();
    case 'caregiverUtilization':
      return renderCaregiverUtilizationView();
    case 'weeklyVisits':
      return renderWeeklyVisitsView();
    case 'visitDetail':
      return renderVisitDetailView();
    default:
      return renderDashboard();
  }

  function renderDashboard() {
    return (
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Operations Dashboard
              </h1>
              <p className="text-gray-600">
                Scheduling, routing, and operational efficiency tracking
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <Card
              hoverable
              clickable
              className="transition-all hover:scale-105 cursor-pointer"
              onClick={() => navigateToView('dailyVisits')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Today's Visits</h3>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.dailyVisits}</p>
              <p className="text-sm text-success-600 mt-1">+8% vs yesterday</p>
            </Card>

            <Card
              hoverable
              clickable
              className="transition-all hover:scale-105 cursor-pointer"
              onClick={() => navigateToView('completedVisits')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Completed</h3>
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-success-600">{metrics.completedVisits}</p>
              <p className="text-sm text-success-600 mt-1">{completionRate}% completion rate</p>
            </Card>

            <Card
              hoverable
              clickable
              className="transition-all hover:scale-105 cursor-pointer"
              onClick={() => navigateToView('avgTravelTime')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Avg Travel Time</h3>
                <div className="p-2 bg-info-100 rounded-lg">
                  <TruckIcon className="h-5 w-5 text-info-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-primary-600">{metrics.avgTravelTime}m</p>
              <p className="text-sm text-success-600 mt-1">-2.3m improved</p>
            </Card>

            <Card
              hoverable
              clickable
              className="transition-all hover:scale-105 cursor-pointer"
              onClick={() => navigateToView('efficiency')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Efficiency Score</h3>
                <div className="p-2 bg-success-100 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-success-600">{metrics.efficiency}%</p>
              <Badge variant="success" size="sm" className="mt-2">Excellent</Badge>
            </Card>
          </div>

        {/* Alerts */}
        {metrics.lateVisits > 0 && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="warning"
              title="Late Visits Alert"
              onClose={() => {}}
            >
              {metrics.lateVisits} visit{metrics.lateVisits > 1 ? 's are' : ' is'} running late. Review and reassign if needed.
            </Alert>
          </div>
        )}

        {/* Real-time Visit Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Visits */}
          <Card className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Visits</h3>
              </div>
              <Badge variant="info" size="sm">{upcomingVisits.length} active</Badge>
            </div>

            <div className="space-y-3">
              {upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => navigateToView('visitDetail', visit)}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{visit.patientName}</h4>
                      <p className="text-sm text-gray-600">{visit.caregiverName}</p>
                    </div>
                    <VisitStatusBadge status={visit.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {visit.scheduledTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {visit.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Caregiver Utilization */}
          <Card
            className="animate-fade-in text-center cursor-pointer"
            hoverable
            clickable
            onClick={() => navigateToView('caregiverUtilization')}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-caregiver-600" />
              <h3 className="text-lg font-semibold text-gray-900">Caregiver Utilization</h3>
            </div>

            <ProgressRing
              percentage={metrics.caregiverUtilization}
              size={160}
              strokeWidth={12}
              color="#f97316"
              label="Overall Capacity"
              className="mb-6"
            />

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">{caregiverBreakdown.active}</div>
                <div className="text-xs text-gray-500 mt-1">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">{caregiverBreakdown.available}</div>
                <div className="text-xs text-gray-500 mt-1">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{caregiverBreakdown.offDuty}</div>
                <div className="text-xs text-gray-500 mt-1">Off Duty</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <div onClick={() => navigateToView('weeklyVisits')} className="cursor-pointer">
            <Chart
              type="bar"
              data={weeklyVisitsData}
              title="Weekly Visit Volume"
              height={280}
              width={600}
              showGrid={true}
              showAxes={true}
              showValues={true}
              color="#3b82f6"
            />
          </div>

          <div onClick={() => navigateToView('avgTravelTime')} className="cursor-pointer">
            <Chart
              type="line"
              data={travelTimeData}
              title="Average Travel Time Today"
              height={280}
              width={600}
              showGrid={true}
              showAxes={true}
              color="#10b981"
            />
          </div>
        </div>

        {/* Map Placeholder */}
        <Card className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="h-6 w-6 text-info-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Route Map</h3>
          </div>
          <div className="h-96 bg-gradient-to-br from-info-50 to-info-100 rounded-lg border-2 border-dashed border-info-200 flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="h-16 w-16 text-info-600 mx-auto mb-4" />
              <p className="text-info-700 font-medium">Real-time caregiver location tracking</p>
              <p className="text-sm text-info-600 mt-1">Interactive map visualization coming soon</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
              hoverable
              clickable
              onClick={() => navigateToView('dailyVisits')}
              className="cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">New Visit</h4>
                  <p className="text-sm text-gray-500">Schedule visit</p>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              clickable
              onClick={() => navigateToView('dailyVisits')}
              className="cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">View Gaps</h4>
                  <p className="text-sm text-gray-500">Coverage issues</p>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              clickable
              onClick={() => navigateToView('avgTravelTime')}
              className="cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success-100 rounded-lg">
                  <TruckIcon className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Optimize Routes</h4>
                  <p className="text-sm text-gray-500">AI optimizer</p>
                </div>
              </div>
            </Card>

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-info-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-info-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Reports</h4>
                  <p className="text-sm text-gray-500">Detailed analytics</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
    );
  }

  function renderDailyVisitsView() {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Today's Visits Detail</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Scheduled</h3>
              <p className="text-4xl font-bold text-primary-600">{metrics!.dailyVisits}</p>
              <p className="text-sm text-gray-500 mt-1">Visits for today</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Completed</h3>
              <p className="text-4xl font-bold text-success-600">{metrics!.completedVisits}</p>
              <p className="text-sm text-gray-500 mt-1">{completionRate}% complete</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">In Progress</h3>
              <p className="text-4xl font-bold text-info-600">{metrics!.dailyVisits - metrics!.completedVisits - metrics!.lateVisits}</p>
              <p className="text-sm text-gray-500 mt-1">Currently active</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Running Late</h3>
              <p className="text-4xl font-bold text-warning-600">{metrics!.lateVisits}</p>
              <p className="text-sm text-gray-500 mt-1">Needs attention</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Visits Today</h3>
            <div className="space-y-3">
              {upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => navigateToView('visitDetail', visit)}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{visit.patientName}</h4>
                      <p className="text-sm text-gray-600">{visit.caregiverName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {visit.scheduledTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {visit.location}
                        </span>
                      </div>
                    </div>
                    <VisitStatusBadge status={visit.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function renderVisitDetailView() {
    if (!selectedVisit) return null;

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Visit Details</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Patient</h3>
              <p className="text-2xl font-bold text-gray-900">{selectedVisit.patientName}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Caregiver</h3>
              <p className="text-2xl font-bold text-gray-900">{selectedVisit.caregiverName}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Status</h3>
              <VisitStatusBadge status={selectedVisit.status} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled Time:</span>
                  <span className="font-medium text-gray-900">{selectedVisit.scheduledTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">{selectedVisit.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visit Type:</span>
                  <span className="font-medium text-gray-900">Home Care</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">2 hours</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  View Patient Chart
                </button>
                <button className="w-full px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors">
                  Contact Caregiver
                </button>
                <button className="w-full px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors">
                  Reschedule Visit
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderCompletedVisitsView() {
    const completedList = upcomingVisits.filter(v => v.status === 'completed');

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Completed Visits</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Completed</h3>
              <p className="text-4xl font-bold text-success-600">{metrics!.completedVisits}</p>
              <Badge variant="success" className="mt-2">On track</Badge>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Completion Rate</h3>
              <p className="text-4xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Of scheduled visits</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Duration</h3>
              <p className="text-4xl font-bold text-gray-900">1.8h</p>
              <p className="text-sm text-gray-500 mt-1">Per visit</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Completed</h3>
            <div className="space-y-3">
              {upcomingVisits.map((visit) => (
                <div key={visit.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{visit.patientName}</h4>
                      <p className="text-sm text-gray-600">{visit.caregiverName}</p>
                      <p className="text-sm text-gray-500 mt-1">{visit.scheduledTime} - {visit.location}</p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function renderAvgTravelTimeView() {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Average Travel Time Analysis</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Current Average</h3>
              <p className="text-4xl font-bold text-primary-600">{metrics!.avgTravelTime}m</p>
              <Badge variant="success" className="mt-2">-2.3m improved</Badge>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Target</h3>
              <p className="text-4xl font-bold text-gray-900">25m</p>
              <p className="text-sm text-gray-500 mt-1">Goal metric</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Best Route</h3>
              <p className="text-4xl font-bold text-success-600">18m</p>
              <p className="text-sm text-gray-500 mt-1">Today's shortest</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Longest Route</h3>
              <p className="text-4xl font-bold text-warning-600">42m</p>
              <p className="text-sm text-gray-500 mt-1">Needs optimization</p>
            </Card>
          </div>

          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Time Trend</h3>
            <Chart
              type="line"
              data={travelTimeData}
              title="Average Travel Time Throughout Day"
              height={320}
              width={800}
              showGrid={true}
              showAxes={true}
              color="#10b981"
            />
          </Card>
        </div>
      </div>
    );
  }

  function renderEfficiencyView() {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Operational Efficiency Score</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Overall Score</h3>
              <p className="text-4xl font-bold text-success-600">{metrics!.efficiency}%</p>
              <Badge variant="success" className="mt-2">Excellent</Badge>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">On-Time Performance</h3>
              <p className="text-4xl font-bold text-gray-900">94%</p>
              <p className="text-sm text-success-600 mt-1">Above target</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Route Optimization</h3>
              <p className="text-4xl font-bold text-gray-900">89%</p>
              <p className="text-sm text-gray-500 mt-1">Efficiency rate</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Utilization Rate</h3>
              <p className="text-4xl font-bold text-gray-900">{metrics!.caregiverUtilization}%</p>
              <p className="text-sm text-gray-500 mt-1">Caregiver capacity</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Breakdown</h3>
            <div className="space-y-4">
              {[
                { metric: 'Visit Completion Rate', score: completionRate, target: 95 },
                { metric: 'Travel Time Efficiency', score: 87, target: 85 },
                { metric: 'Schedule Adherence', score: 92, target: 90 },
                { metric: 'Resource Utilization', score: metrics!.caregiverUtilization, target: 85 }
              ].map((item) => (
                <div key={item.metric}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.metric}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.score >= item.target ? 'bg-success-600' : 'bg-warning-600'}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function renderCaregiverUtilizationView() {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Caregiver Utilization</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Overall Utilization</h3>
              <p className="text-4xl font-bold text-caregiver-600">{metrics!.caregiverUtilization}%</p>
              <p className="text-sm text-gray-500 mt-1">Current capacity</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Caregivers</h3>
              <p className="text-4xl font-bold text-success-600">{caregiverBreakdown.active}</p>
              <p className="text-sm text-gray-500 mt-1">On active visits</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Available</h3>
              <p className="text-4xl font-bold text-warning-600">{caregiverBreakdown.available}</p>
              <p className="text-sm text-gray-500 mt-1">Ready for assignment</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Off Duty</h3>
              <p className="text-4xl font-bold text-gray-600">{caregiverBreakdown.offDuty}</p>
              <p className="text-sm text-gray-500 mt-1">Not scheduled</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Overview</h3>
              <ProgressRing
                percentage={metrics!.caregiverUtilization}
                size={200}
                strokeWidth={16}
                color="#f97316"
                label="Overall Capacity"
                className="mb-4"
              />
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilization by Shift</h3>
              <div className="space-y-4">
                {[
                  { shift: 'Morning (6am - 2pm)', utilization: 92 },
                  { shift: 'Afternoon (2pm - 10pm)', utilization: 85 },
                  { shift: 'Evening (10pm - 6am)', utilization: 67 }
                ].map((item) => (
                  <div key={item.shift}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.shift}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-caregiver-600"
                        style={{ width: `${item.utilization}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderWeeklyVisitsView() {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Weekly Visit Volume Analysis</h1>

          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Volume by Day</h3>
            <Chart
              type="bar"
              data={weeklyVisitsData}
              title="Weekly Visit Volume"
              height={360}
              width={900}
              showGrid={true}
              showAxes={true}
              showValues={true}
              color="#3b82f6"
            />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Weekly Total</h3>
              <p className="text-4xl font-bold text-primary-600">
                {weeklyVisitsData.reduce((sum, day) => sum + day.value, 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Visits this week</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Daily Average</h3>
              <p className="text-4xl font-bold text-gray-900">
                {Math.round(weeklyVisitsData.reduce((sum, day) => sum + day.value, 0) / 7)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Per day</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Peak Day</h3>
              <p className="text-4xl font-bold text-success-600">
                {Math.max(...weeklyVisitsData.map(d => d.value))}
              </p>
              <p className="text-sm text-gray-500 mt-1">Highest volume</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }
}
