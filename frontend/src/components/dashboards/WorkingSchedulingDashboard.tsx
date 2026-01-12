import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

interface SchedulingMetrics {
  totalVisits: number;
  unassignedVisits: number;
  caregiverUtilization: number;
  avgTravelTime: number;
  scheduleCompliance: number;
  emergencyRequests: number;
}

interface Visit {
  id: string;
  patientName: string;
  serviceType: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  requiredSkills: string[];
  status: 'unassigned' | 'assigned' | 'confirmed' | 'completed';
  assignedCaregiver?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

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

// View types for drill-down (full page views)
type ViewType = 'dashboard' | 'totalVisits' | 'unassignedVisits' | 'caregiverUtilization' | 'avgTravelTime' | 'scheduleCompliance' | 'assignCaregiver' | 'aiMatchResults' | 'caregiverScheduleView';

// Available caregiver for assignment
interface AvailableCaregiver {
  id: string;
  name: string;
  distance: number; // minutes away
  matchScore: number; // percentage
  skills: string[];
  currentLoad: number; // visits today
  availability: string;
}

// Caregiver data interface for utilization
interface CaregiverUtilization {
  id: string;
  name: string;
  scheduledHours: number;
  availableHours: number;
  utilization: number;
  visitsToday: number;
  status: 'available' | 'on_visit' | 'traveling' | 'off_duty';
}

// Travel time data interface
interface TravelTimeData {
  caregiverId: string;
  caregiverName: string;
  fromLocation: string;
  toLocation: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  patientName: string;
  visitTime: string;
}

// Compliance data interface
interface ComplianceRecord {
  visitId: string;
  patientName: string;
  caregiver: string;
  scheduledTime: string;
  actualTime: string;
  variance: number; // minutes early/late
  status: 'on_time' | 'early' | 'late' | 'missed';
}

function StatusBadge({ status }: { status: Visit['status'] }) {
  const variants: Record<Visit['status'], any> = {
    unassigned: 'danger',
    assigned: 'warning',
    confirmed: 'info',
    completed: 'success'
  };

  return <Badge variant={variants[status]} size="sm">{status}</Badge>;
}

function PriorityBadge({ priority }: { priority: Visit['priority'] }) {
  const variants: Record<Visit['priority'], any> = {
    urgent: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'gray'
  };

  return <Badge variant={variants[priority]} size="sm">{priority}</Badge>;
}

export function WorkingSchedulingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SchedulingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [viewHistory, setViewHistory] = useState<ViewType[]>(['dashboard']);

  // Mock data for drill-down views
  const [caregiverUtilizationData] = useState<CaregiverUtilization[]>([
    { id: '1', name: 'Maria Garcia', scheduledHours: 7, availableHours: 8, utilization: 87.5, visitsToday: 5, status: 'on_visit' },
    { id: '2', name: 'James Wilson', scheduledHours: 6.5, availableHours: 8, utilization: 81.3, visitsToday: 4, status: 'traveling' },
    { id: '3', name: 'Sarah Johnson', scheduledHours: 8, availableHours: 8, utilization: 100, visitsToday: 6, status: 'on_visit' },
    { id: '4', name: 'Michael Brown', scheduledHours: 5, availableHours: 8, utilization: 62.5, visitsToday: 3, status: 'available' },
    { id: '5', name: 'Emily Davis', scheduledHours: 0, availableHours: 8, utilization: 0, visitsToday: 0, status: 'off_duty' },
    { id: '6', name: 'Robert Martinez', scheduledHours: 7.5, availableHours: 8, utilization: 93.8, visitsToday: 5, status: 'on_visit' },
  ]);

  const [travelTimeData] = useState<TravelTimeData[]>([
    { caregiverId: '1', caregiverName: 'Maria Garcia', fromLocation: 'Office', toLocation: '123 Oak St, Columbus', estimatedMinutes: 15, actualMinutes: 12, patientName: 'John Smith', visitTime: '9:00 AM' },
    { caregiverId: '1', caregiverName: 'Maria Garcia', fromLocation: '123 Oak St', toLocation: '456 Maple Ave, Columbus', estimatedMinutes: 8, actualMinutes: 10, patientName: 'Mary Johnson', visitTime: '10:30 AM' },
    { caregiverId: '2', caregiverName: 'James Wilson', fromLocation: 'Office', toLocation: '789 Pine Rd, Dublin', estimatedMinutes: 22, actualMinutes: 25, patientName: 'Robert Davis', visitTime: '8:30 AM' },
    { caregiverId: '2', caregiverName: 'James Wilson', fromLocation: '789 Pine Rd', toLocation: '321 Elm St, Dublin', estimatedMinutes: 12, patientName: 'Susan Williams', visitTime: '11:00 AM' },
    { caregiverId: '3', caregiverName: 'Sarah Johnson', fromLocation: 'Office', toLocation: '555 Cedar Ln, Westerville', estimatedMinutes: 18, actualMinutes: 16, patientName: 'James Brown', visitTime: '9:30 AM' },
  ]);

  const [complianceData] = useState<ComplianceRecord[]>([
    { visitId: 'V001', patientName: 'John Smith', caregiver: 'Maria Garcia', scheduledTime: '9:00 AM', actualTime: '8:58 AM', variance: -2, status: 'on_time' },
    { visitId: 'V002', patientName: 'Mary Johnson', caregiver: 'Maria Garcia', scheduledTime: '10:30 AM', actualTime: '10:35 AM', variance: 5, status: 'on_time' },
    { visitId: 'V003', patientName: 'Robert Davis', caregiver: 'James Wilson', scheduledTime: '8:30 AM', actualTime: '8:45 AM', variance: 15, status: 'late' },
    { visitId: 'V004', patientName: 'Susan Williams', caregiver: 'James Wilson', scheduledTime: '11:00 AM', actualTime: '10:50 AM', variance: -10, status: 'early' },
    { visitId: 'V005', patientName: 'James Brown', caregiver: 'Sarah Johnson', scheduledTime: '9:30 AM', actualTime: '9:30 AM', variance: 0, status: 'on_time' },
    { visitId: 'V006', patientName: 'Patricia Miller', caregiver: 'Michael Brown', scheduledTime: '2:00 PM', actualTime: '', variance: 0, status: 'missed' },
  ]);

  // State for selected items in drill-down views
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverUtilization | null>(null);
  const [optimizingRoutes, setOptimizingRoutes] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [assigningCaregiver, setAssigningCaregiver] = useState(false);

  // Caregiver filter and sort state
  const [caregiverSearch, setCaregiverSearch] = useState('');
  const [caregiverStatusFilter, setCaregiverStatusFilter] = useState<string[]>([]);
  const [caregiverSortBy, setCaregiverSortBy] = useState<'name' | 'utilization' | 'visits' | 'status'>('name');
  const [caregiverSortOrder, setCaregiverSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCaregiverFilters, setShowCaregiverFilters] = useState(false);

  // Navigation helper - tracks view history and allows going back
  const navigateToView = (view: ViewType) => {
    setViewHistory(prev => [...prev, view]);
    setCurrentView(view);
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      // Remove current view and go to previous
      const newHistory = viewHistory.slice(0, -1);
      const previousView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentView(previousView);
    } else {
      // If no history, go to dashboard
      setCurrentView('dashboard');
    }
  };

  // Mock available caregivers for assignment
  const [availableCaregivers] = useState<AvailableCaregiver[]>([
    { id: '1', name: 'Maria Garcia', distance: 12, matchScore: 95, skills: ['Wound Care', 'Medication Management', 'Diabetes Care'], currentLoad: 5, availability: '9:00 AM - 5:00 PM' },
    { id: '2', name: 'Sarah Johnson', distance: 18, matchScore: 88, skills: ['Physical Therapy', 'Wound Care', 'Post-Op Care'], currentLoad: 6, availability: '8:00 AM - 4:00 PM' },
    { id: '3', name: 'James Wilson', distance: 22, matchScore: 82, skills: ['Medication Management', 'Vital Signs', 'Alzheimer Care'], currentLoad: 4, availability: '10:00 AM - 6:00 PM' },
    { id: '4', name: 'Michael Brown', distance: 15, matchScore: 78, skills: ['Home Safety', 'Medication Management'], currentLoad: 3, availability: '9:00 AM - 5:00 PM' },
    { id: '5', name: 'Robert Martinez', distance: 25, matchScore: 75, skills: ['Wound Care', 'Diabetes Care', 'Vital Signs'], currentLoad: 5, availability: '7:00 AM - 3:00 PM' },
  ]);

  // Handler functions for drill-down actions
  const handleViewCaregiverSchedule = (caregiver: CaregiverUtilization) => {
    setSelectedCaregiver(caregiver);
    navigateToView('caregiverScheduleView');
  };

  const handleOptimizeAssignments = async () => {
    setOptimizingRoutes(true);
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOptimizingRoutes(false);
    // After optimization, show the AI match results view
    navigateToView('aiMatchResults');
  };

  const handleOptimizeRoutes = async () => {
    setOptimizingRoutes(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOptimizingRoutes(false);
    // After optimization, show travel time view with results
    navigateToView('avgTravelTime');
  };

  const handleAssignCaregiver = (visit: Visit) => {
    setSelectedVisit(visit);
    navigateToView('assignCaregiver');
  };

  const handleAIMatch = (visit: Visit) => {
    setSelectedVisit(visit);
    navigateToView('aiMatchResults');
  };

  const handleExportSchedule = () => {
    // Create and download a CSV/PDF of the schedule
    const scheduleData = visits.map(v =>
      `${v.patientName},${v.serviceType},${v.date},${v.time},${v.duration}min,${v.location},${v.assignedCaregiver || 'Unassigned'},${v.status}`
    ).join('\n');

    const csvContent = `Patient,Service,Date,Time,Duration,Location,Caregiver,Status\n${scheduleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    // Create and download compliance report as CSV
    const reportData = complianceData.map(c =>
      `${c.visitId},${c.patientName},${c.caregiver},${c.scheduledTime},${c.actualTime || 'Not Arrived'},${c.variance}min,${c.status}`
    ).join('\n');

    const csvContent = `Visit ID,Patient,Caregiver,Scheduled,Actual,Variance,Status\n${reportData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmAssignment = async (caregiverId: string) => {
    setAssigningCaregiver(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the visit with the assigned caregiver
    if (selectedVisit) {
      const caregiver = availableCaregivers.find(c => c.id === caregiverId);
      if (caregiver) {
        setVisits(prev => prev.map(v =>
          v.id === selectedVisit.id
            ? { ...v, status: 'assigned' as const, assignedCaregiver: caregiver.name }
            : v
        ));
      }
    }

    setAssigningCaregiver(false);
    setSelectedVisit(null);
    goBack(); // Go back to previous view after assignment
  };

  // Filtered and sorted caregiver data
  const filteredCaregivers = caregiverUtilizationData
    .filter(caregiver => {
      // Search filter
      if (caregiverSearch && !caregiver.name.toLowerCase().includes(caregiverSearch.toLowerCase())) {
        return false;
      }
      // Status filter
      if (caregiverStatusFilter.length > 0 && !caregiverStatusFilter.includes(caregiver.status)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (caregiverSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'utilization':
          comparison = a.utilization - b.utilization;
          break;
        case 'visits':
          comparison = a.visitsToday - b.visitsToday;
          break;
        case 'status':
          const statusOrder = { on_visit: 0, traveling: 1, available: 2, off_duty: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return caregiverSortOrder === 'asc' ? comparison : -comparison;
    });

  // Count active caregiver filters
  const activeCaregiverFilterCount =
    (caregiverSearch ? 1 : 0) +
    caregiverStatusFilter.length;

  // Reset caregiver filters
  const resetCaregiverFilters = () => {
    setCaregiverSearch('');
    setCaregiverStatusFilter([]);
    setCaregiverSortBy('name');
    setCaregiverSortOrder('asc');
  };

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/console/scheduling/metrics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('serenity_access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalVisits: data.totalVisits || 0,
            unassignedVisits: data.unassignedVisits || 0,
            caregiverUtilization: data.caregiverUtilization || 0,
            avgTravelTime: data.avgTravelTime || 0,
            scheduleCompliance: data.scheduleCompliance || 0,
            emergencyRequests: data.emergencyRequests || 0
          });
          setVisits(data.visits || []);
        } else {
          setMetrics({
            totalVisits: 0,
            unassignedVisits: 0,
            caregiverUtilization: 0,
            avgTravelTime: 0,
            scheduleCompliance: 0,
            emergencyRequests: 0
          });
          setVisits([]);
        }
      } catch (error) {
        console.error('Failed to load scheduling metrics:', error);
        setMetrics({
          totalVisits: 0,
          unassignedVisits: 0,
          caregiverUtilization: 0,
          avgTravelTime: 0,
          scheduleCompliance: 0,
          emergencyRequests: 0
        });
        setVisits([]);
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

  // ===== DASHBOARD VIEW (main view) =====
  const renderDashboardView = () => (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              AI-Powered Scheduling System
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}. Intelligent caregiver matching, route optimization, and schedule management
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

        {/* Emergency Alerts */}
        {metrics.emergencyRequests > 0 && (
          <div className="mb-8 animate-fade-in">
            <Alert
              variant="danger"
              title={`🚨 ${metrics.emergencyRequests} Emergency Schedule Requests`}
            >
              Urgent coverage needed for today's visits
            </Alert>
          </div>
        )}

        {/* AI Optimization Banner */}
        <div className="mb-8 animate-fade-in">
          <Card className="bg-info-50 border-info-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-8 w-8 text-info-600" />
                <div>
                  <h3 className="text-lg font-semibold text-info-900">AI Schedule Optimization Available</h3>
                  <p className="text-sm text-info-700">Save 25+ minutes travel time with intelligent route optimization</p>
                </div>
              </div>
              <button
                onClick={handleOptimizeAssignments}
                disabled={optimizingRoutes}
                className="px-4 py-2 bg-info-600 text-white rounded-lg font-medium hover:bg-info-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {optimizingRoutes ? '⏳ Optimizing...' : '🚀 Optimize Now'}
              </button>
            </div>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <MetricCard
            title="Total Visits Today"
            value={metrics.totalVisits}
            subtitle="+12% vs yesterday"
            icon={CalendarIcon}
            iconColor="bg-primary-600"
            onClick={() => navigateToView('totalVisits')}
          />
          <MetricCard
            title="Unassigned Visits"
            value={metrics.unassignedVisits}
            subtitle="Need assignment"
            icon={UserGroupIcon}
            iconColor="bg-danger-600"
            valueColor="text-danger-600"
            onClick={() => navigateToView('unassignedVisits')}
          />
          <MetricCard
            title="Caregiver Utilization"
            value={`${metrics.caregiverUtilization}%`}
            subtitle="Optimal range"
            icon={UserGroupIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
            onClick={() => navigateToView('caregiverUtilization')}
          />
          <MetricCard
            title="Avg Travel Time"
            value={`${metrics.avgTravelTime}m`}
            subtitle="-3m improved"
            icon={MapPinIcon}
            iconColor="bg-info-600"
            valueColor="text-info-600"
            onClick={() => navigateToView('avgTravelTime')}
          />
          <MetricCard
            title="Schedule Compliance"
            value={`${metrics.scheduleCompliance}%`}
            subtitle="Above target"
            icon={ClockIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
            onClick={() => navigateToView('scheduleCompliance')}
          />
        </div>

        {/* Visit Management */}
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Visits & Assignments
          </h3>
          <div className="space-y-4">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className={`p-4 border rounded-lg transition-all hover:border-primary-300 hover:bg-primary-50 ${
                  visit.priority === 'urgent'
                    ? 'border-danger-300 bg-danger-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">
                        {visit.patientName} - {visit.serviceType}
                      </h4>
                      <PriorityBadge priority={visit.priority} />
                      <StatusBadge status={visit.status} />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {visit.date} at {visit.time} • ⏱️ {visit.duration}min</p>
                      <p>📍 {visit.location}</p>
                      <p>🎯 Skills: {visit.requiredSkills.join(', ')}</p>
                      {visit.assignedCaregiver && (
                        <p className="text-success-600 font-medium">
                          👤 Assigned to: {visit.assignedCaregiver}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visit.status === 'unassigned' && (
                      <button className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors">
                        🎯 Assign Caregiver
                      </button>
                    )}
                    {visit.status === 'assigned' && (
                      <button className="px-3 py-1.5 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors">
                        ✉️ Send Confirmation
                      </button>
                    )}
                    <button className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                      👁️ Details
                    </button>
                    <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigateToView('unassignedVisits')}
              className="px-4 py-3 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 transition-all hover:scale-105"
            >
              📅 Assign Visits ({visits.filter(v => v.status === 'unassigned').length})
            </button>
            <button
              onClick={() => {
                if (visits.filter(v => v.status === 'unassigned').length > 0) {
                  navigateToView('aiMatchResults');
                } else {
                  alert('No unassigned visits to match.');
                }
              }}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all hover:scale-105"
            >
              🎯 AI Caregiver Matcher
            </button>
            <button
              onClick={() => navigateToView('avgTravelTime')}
              className="px-4 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-all hover:scale-105"
            >
              ⚡ Optimize Routes
            </button>
            <button
              onClick={() => navigateToView('totalVisits')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all hover:scale-105"
            >
              📆 View Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== FULL PAGE DRILL-DOWN VIEWS =====

  // Total Visits Today - Full Page View
  const renderTotalVisitsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-600 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Today's Visits</h1>
                <p className="text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportSchedule}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Export Schedule
          </button>
        </div>

        {/* Summary Stats - Clickable cards to filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
            <p className="text-3xl font-bold text-gray-900">{visits.length || metrics?.totalVisits || 0}</p>
            <p className="text-sm text-gray-600">Total Visits</p>
          </Card>
          <Card
            className="text-center bg-success-50 cursor-pointer hover:ring-2 hover:ring-success-300 transition-all"
            onClick={() => {/* Could filter to show only completed */}}
          >
            <p className="text-3xl font-bold text-success-600">{visits.filter(v => v.status === 'completed').length}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
          <Card
            className="text-center bg-info-50 cursor-pointer hover:ring-2 hover:ring-info-300 transition-all"
            onClick={() => {/* Could filter to show only in-progress */}}
          >
            <p className="text-3xl font-bold text-info-600">{visits.filter(v => v.status === 'confirmed' || v.status === 'assigned').length}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </Card>
          <Card
            className="text-center bg-danger-50 cursor-pointer hover:ring-2 hover:ring-danger-300 transition-all"
            onClick={() => navigateToView('unassignedVisits')}
          >
            <p className="text-3xl font-bold text-danger-600">{visits.filter(v => v.status === 'unassigned').length}</p>
            <p className="text-sm text-gray-600">Unassigned</p>
          </Card>
        </div>

        {/* Visit List */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Scheduled Visits</h2>
          <div className="space-y-3">
            {visits.length > 0 ? visits.map((visit) => (
              <div
                key={visit.id}
                className={`p-4 border rounded-lg ${
                  visit.status === 'completed' ? 'bg-success-50 border-success-200' :
                  visit.status === 'unassigned' ? 'bg-danger-50 border-danger-200' :
                  'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{visit.patientName}</h4>
                      <StatusBadge status={visit.status} />
                      <PriorityBadge priority={visit.priority} />
                    </div>
                    <p className="text-sm text-gray-600">{visit.serviceType} • {visit.time} • {visit.duration}min</p>
                    <p className="text-sm text-gray-500">{visit.location}</p>
                  </div>
                  <div className="text-right flex flex-col gap-2">
                    {visit.assignedCaregiver && (
                      <p className="text-sm font-medium text-success-600">{visit.assignedCaregiver}</p>
                    )}
                    {visit.status === 'unassigned' ? (
                      <button
                        onClick={() => handleAssignCaregiver(visit)}
                        className="px-3 py-1 text-sm bg-danger-100 text-danger-700 rounded hover:bg-danger-200"
                      >
                        Assign Now
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedVisit(visit)}
                        className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No visits scheduled for today</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // Unassigned Visits - Full Page View
  const renderUnassignedVisitsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-600 rounded-lg">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Unassigned Visits</h1>
                <p className="text-danger-600 font-medium">{visits.filter(v => v.status === 'unassigned').length || metrics?.unassignedVisits || 0} visits need immediate assignment</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleOptimizeAssignments}
            disabled={optimizingRoutes}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {optimizingRoutes ? 'Processing...' : '🤖 Auto-Assign All with AI'}
          </button>
        </div>

        {/* Unassigned Visits List */}
        <div className="space-y-4">
          {visits.filter(v => v.status === 'unassigned').length > 0 ?
            visits.filter(v => v.status === 'unassigned').map((visit) => (
              <Card key={visit.id} className="border-2 border-danger-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{visit.patientName}</h4>
                      <PriorityBadge priority={visit.priority} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Service Type</p>
                        <p className="font-medium text-gray-900">{visit.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">{visit.date} at {visit.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">{visit.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{visit.location}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm">Required Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {visit.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleAssignCaregiver(visit)}
                      className="px-4 py-2 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
                    >
                      🎯 Assign Caregiver
                    </button>
                    <button
                      onClick={() => handleAIMatch(visit)}
                      className="px-4 py-2 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors"
                    >
                      🤖 AI Match
                    </button>
                  </div>
                </div>
              </Card>
            )) : (
              <Card className="text-center py-12">
                <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-success-400" />
                <p className="text-lg text-success-600 font-medium">All visits are assigned!</p>
                <p className="text-gray-500">No unassigned visits at this time</p>
              </Card>
            )}
        </div>
      </div>
    </div>
  );

  // Caregiver Utilization - Full Page View
  const renderCaregiverUtilizationView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-600 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Caregiver Utilization</h1>
                <p className="text-gray-600">Real-time caregiver availability and workload</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleOptimizeAssignments}
            disabled={optimizingRoutes}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {optimizingRoutes ? 'Optimizing...' : 'Optimize Assignments'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-success-50">
            <p className="text-3xl font-bold text-success-600">{caregiverUtilizationData.filter(c => c.status === 'on_visit').length}</p>
            <p className="text-sm text-gray-600">On Visit</p>
          </Card>
          <Card className="text-center bg-info-50">
            <p className="text-3xl font-bold text-info-600">{caregiverUtilizationData.filter(c => c.status === 'traveling').length}</p>
            <p className="text-sm text-gray-600">Traveling</p>
          </Card>
          <Card className="text-center bg-primary-50">
            <p className="text-3xl font-bold text-primary-600">{caregiverUtilizationData.filter(c => c.status === 'available').length}</p>
            <p className="text-sm text-gray-600">Available</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-gray-600">{caregiverUtilizationData.filter(c => c.status === 'off_duty').length}</p>
            <p className="text-sm text-gray-600">Off Duty</p>
          </Card>
        </div>

        {/* Caregiver Table */}
        <Card>
          {/* Header with filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">All Caregivers</h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredCaregivers.length} of {caregiverUtilizationData.length} caregivers
                {activeCaregiverFilterCount > 0 && ` (${activeCaregiverFilterCount} filter${activeCaregiverFilterCount > 1 ? 's' : ''} active)`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search box */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search caregiver..."
                  value={caregiverSearch}
                  onChange={(e) => setCaregiverSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {caregiverSearch && (
                  <button
                    onClick={() => setCaregiverSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter toggle button */}
              <button
                onClick={() => setShowCaregiverFilters(!showCaregiverFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showCaregiverFilters || activeCaregiverFilterCount > 0
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
                {activeCaregiverFilterCount > 0 && (
                  <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeCaregiverFilterCount}
                  </span>
                )}
              </button>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={`${caregiverSortBy}-${caregiverSortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-') as [typeof caregiverSortBy, typeof caregiverSortOrder];
                    setCaregiverSortBy(sortBy);
                    setCaregiverSortOrder(sortOrder);
                  }}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="utilization-desc">Utilization High-Low</option>
                  <option value="utilization-asc">Utilization Low-High</option>
                  <option value="visits-desc">Most Visits</option>
                  <option value="visits-asc">Least Visits</option>
                  <option value="status-asc">Status (Active First)</option>
                  <option value="status-desc">Status (Off Duty First)</option>
                </select>
                <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Expandable filter panel */}
          {showCaregiverFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(['on_visit', 'traveling', 'available', 'off_duty'] as const).map((status) => {
                      const statusLabels = {
                        on_visit: 'On Visit',
                        traveling: 'Traveling',
                        available: 'Available',
                        off_duty: 'Off Duty'
                      };
                      const isSelected = caregiverStatusFilter.includes(status);
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            setCaregiverStatusFilter(prev =>
                              isSelected
                                ? prev.filter(s => s !== status)
                                : [...prev, status]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? status === 'on_visit' ? 'bg-success-600 text-white' :
                                status === 'traveling' ? 'bg-info-600 text-white' :
                                status === 'available' ? 'bg-primary-600 text-white' :
                                'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Clear filters button */}
              {activeCaregiverFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={resetCaregiverFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Caregiver</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Visits Today</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Utilization</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCaregivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No caregivers found</p>
                      <p className="text-sm mt-1">
                        {activeCaregiverFilterCount > 0 ? 'Try adjusting your filters' : 'No caregivers match your search'}
                      </p>
                      {activeCaregiverFilterCount > 0 && (
                        <button
                          onClick={resetCaregiverFilters}
                          className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Clear all filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCaregivers.map((caregiver) => (
                  <tr key={caregiver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {caregiver.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{caregiver.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        caregiver.status === 'on_visit' ? 'bg-success-100 text-success-700' :
                        caregiver.status === 'traveling' ? 'bg-info-100 text-info-700' :
                        caregiver.status === 'available' ? 'bg-primary-100 text-primary-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {caregiver.status === 'on_visit' ? 'On Visit' :
                         caregiver.status === 'traveling' ? 'Traveling' :
                         caregiver.status === 'available' ? 'Available' : 'Off Duty'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-900">{caregiver.visitsToday}</td>
                    <td className="px-4 py-4 text-gray-900">{caregiver.scheduledHours} / {caregiver.availableHours}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden" style={{ minWidth: '100px' }}>
                          <div
                            className={`h-full ${
                              caregiver.utilization >= 90 ? 'bg-success-500' :
                              caregiver.utilization >= 70 ? 'bg-primary-500' :
                              caregiver.utilization >= 50 ? 'bg-warning-500' :
                              'bg-danger-500'
                            }`}
                            style={{ width: `${caregiver.utilization}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${
                          caregiver.utilization >= 90 ? 'text-success-600' :
                          caregiver.utilization >= 70 ? 'text-primary-600' :
                          caregiver.utilization >= 50 ? 'text-warning-600' :
                          'text-danger-600'
                        }`}>
                          {caregiver.utilization}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleViewCaregiverSchedule(caregiver)}
                        className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                      >
                        View Schedule
                      </button>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  // Average Travel Time - Full Page View
  const renderAvgTravelTimeView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-info-600 rounded-lg">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Travel Time Analysis</h1>
                <p className="text-gray-600">Route optimization and travel time tracking</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleOptimizeRoutes}
            disabled={optimizingRoutes}
            className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
          >
            {optimizingRoutes ? 'Optimizing...' : '⚡ Optimize All Routes'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-info-50">
            <p className="text-3xl font-bold text-info-600">{metrics?.avgTravelTime || 0}m</p>
            <p className="text-sm text-gray-600">Avg Travel Time</p>
          </Card>
          <Card className="text-center bg-success-50">
            <p className="text-3xl font-bold text-success-600">-3m</p>
            <p className="text-sm text-gray-600">vs Last Week</p>
          </Card>
          <Card className="text-center bg-primary-50">
            <p className="text-3xl font-bold text-primary-600">{travelTimeData.length}</p>
            <p className="text-sm text-gray-600">Trips Today</p>
          </Card>
          <Card className="text-center bg-warning-50">
            <p className="text-3xl font-bold text-warning-600">
              {travelTimeData.filter(t => t.actualMinutes && t.actualMinutes > t.estimatedMinutes).length}
            </p>
            <p className="text-sm text-gray-600">Over Estimate</p>
          </Card>
        </div>

        {/* Travel Table */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Travel Routes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Caregiver</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Route</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Visit Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Est.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actual</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {travelTimeData.map((trip, idx) => {
                  const variance = trip.actualMinutes ? trip.actualMinutes - trip.estimatedMinutes : null;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">{trip.caregiverName}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div>{trip.fromLocation}</div>
                        <div className="text-gray-400">→ {trip.toLocation}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-900">{trip.patientName}</td>
                      <td className="px-4 py-4 text-gray-900">{trip.visitTime}</td>
                      <td className="px-4 py-4 text-gray-900">{trip.estimatedMinutes}m</td>
                      <td className="px-4 py-4 text-gray-900">
                        {trip.actualMinutes ? `${trip.actualMinutes}m` : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        {variance !== null ? (
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
                            variance > 5 ? 'bg-danger-100 text-danger-700' :
                            variance < -3 ? 'bg-success-100 text-success-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {variance > 0 ? `+${variance}m` : `${variance}m`}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
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

  // Schedule Compliance - Full Page View
  const renderScheduleComplianceView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-600 rounded-lg">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Schedule Compliance</h1>
                <p className="text-gray-600">On-time arrival tracking and analysis</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Export Report
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-success-50">
            <p className="text-3xl font-bold text-success-600">
              {complianceData.filter(c => c.status === 'on_time').length}
            </p>
            <p className="text-sm text-gray-600">On Time</p>
          </Card>
          <Card className="text-center bg-info-50">
            <p className="text-3xl font-bold text-info-600">
              {complianceData.filter(c => c.status === 'early').length}
            </p>
            <p className="text-sm text-gray-600">Early</p>
          </Card>
          <Card className="text-center bg-warning-50">
            <p className="text-3xl font-bold text-warning-600">
              {complianceData.filter(c => c.status === 'late').length}
            </p>
            <p className="text-sm text-gray-600">Late</p>
          </Card>
          <Card className="text-center bg-danger-50">
            <p className="text-3xl font-bold text-danger-600">
              {complianceData.filter(c => c.status === 'missed').length}
            </p>
            <p className="text-sm text-gray-600">Missed</p>
          </Card>
        </div>

        {/* Compliance Rate Visual */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-medium text-gray-700">Overall Compliance Rate</span>
            <span className="text-2xl font-bold text-success-600">{metrics?.scheduleCompliance || 0}%</span>
          </div>
          <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics?.scheduleCompliance || 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Target: 95% on-time arrivals (within ±5 minutes)</p>
        </Card>

        {/* Compliance Table */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit Compliance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Visit ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Caregiver</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Scheduled</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actual</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complianceData.map((record) => (
                  <tr key={record.visitId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-900">{record.visitId}</td>
                    <td className="px-4 py-4 text-gray-900">{record.patientName}</td>
                    <td className="px-4 py-4 text-gray-900">{record.caregiver}</td>
                    <td className="px-4 py-4 text-gray-900">{record.scheduledTime}</td>
                    <td className="px-4 py-4 text-gray-900">
                      {record.actualTime || <span className="text-danger-500">Not clocked in</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'on_time' ? 'bg-success-100 text-success-700' :
                        record.status === 'early' ? 'bg-info-100 text-info-700' :
                        record.status === 'late' ? 'bg-warning-100 text-warning-700' :
                        'bg-danger-100 text-danger-700'
                      }`}>
                        {record.status === 'on_time' ? 'On Time' :
                         record.status === 'early' ? `${Math.abs(record.variance)}m Early` :
                         record.status === 'late' ? `${record.variance}m Late` : 'Missed'}
                      </span>
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

  // ===== ASSIGN CAREGIVER FULL PAGE VIEW =====
  const renderAssignCaregiverView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedVisit(null);
                goBack();
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-600 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assign Caregiver</h1>
                <p className="text-gray-600">Select the best caregiver for this visit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visit Details Card */}
        {selectedVisit && (
          <Card className="mb-8 border-2 border-primary-200 bg-primary-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-semibold text-gray-900">{selectedVisit.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-semibold text-gray-900">{selectedVisit.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-semibold text-gray-900">{selectedVisit.date} at {selectedVisit.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">{selectedVisit.duration} minutes</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold text-gray-900">{selectedVisit.location}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Required Skills</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVisit.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Available Caregivers */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Available Caregivers</h2>
            <button
              onClick={() => selectedVisit && handleAIMatch(selectedVisit)}
              className="px-4 py-2 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 transition-colors"
            >
              <SparklesIcon className="h-4 w-4 inline mr-2" />
              AI Recommend Best Match
            </button>
          </div>

          <div className="space-y-4">
            {availableCaregivers.map((caregiver) => (
              <div
                key={caregiver.id}
                className="p-4 border-2 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700">
                        {caregiver.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{caregiver.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          caregiver.matchScore >= 90 ? 'bg-success-100 text-success-700' :
                          caregiver.matchScore >= 80 ? 'bg-primary-100 text-primary-700' :
                          'bg-warning-100 text-warning-700'
                        }`}>
                          {caregiver.matchScore}% Match
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span><MapPinIcon className="h-4 w-4 inline mr-1" />{caregiver.distance} min away</span>
                        <span><CalendarIcon className="h-4 w-4 inline mr-1" />{caregiver.currentLoad} visits today</span>
                        <span><ClockIcon className="h-4 w-4 inline mr-1" />{caregiver.availability}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {caregiver.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfirmAssignment(caregiver.id)}
                    disabled={assigningCaregiver}
                    className="px-6 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-colors disabled:opacity-50"
                  >
                    {assigningCaregiver ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== AI MATCH RESULTS FULL PAGE VIEW =====
  const renderAIMatchResultsView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedVisit(null);
                goBack();
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-info-600 rounded-lg">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI Caregiver Recommendations</h1>
                <p className="text-gray-600">
                  {selectedVisit
                    ? `Best matches for ${selectedVisit.patientName}'s visit`
                    : 'Optimized caregiver assignments based on AI analysis'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Summary */}
        <Card className="mb-8 bg-gradient-to-r from-info-50 to-primary-50 border-info-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-info-100 rounded-lg">
              <SparklesIcon className="h-8 w-8 text-info-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis Complete</h2>
              <p className="text-gray-700 mb-3">
                The AI has analyzed {availableCaregivers.length} available caregivers based on:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-info-600">Skills</p>
                  <p className="text-xs text-gray-500">Patient needs match</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-info-600">Distance</p>
                  <p className="text-xs text-gray-500">Travel time optimization</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-info-600">Workload</p>
                  <p className="text-xs text-gray-500">Fair distribution</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-info-600">History</p>
                  <p className="text-xs text-gray-500">Past visit success</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Visit Details (if specific visit selected) */}
        {selectedVisit && (
          <Card className="mb-8 border-2 border-primary-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit to Assign</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Patient</p>
                <p className="font-semibold text-gray-900">{selectedVisit.patientName}</p>
              </div>
              <div>
                <p className="text-gray-500">Service</p>
                <p className="font-semibold text-gray-900">{selectedVisit.serviceType}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-semibold text-gray-900">{selectedVisit.date} at {selectedVisit.time}</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">{selectedVisit.duration} min</p>
              </div>
            </div>
          </Card>
        )}

        {/* Top Recommendations */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Caregiver Recommendations</h2>
          <div className="space-y-4">
            {availableCaregivers
              .sort((a, b) => b.matchScore - a.matchScore)
              .slice(0, 5)
              .map((caregiver, index) => (
                <div
                  key={caregiver.id}
                  className={`p-4 border-2 rounded-lg ${
                    index === 0 ? 'border-success-400 bg-success-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-success-200 text-success-700' :
                        index === 1 ? 'bg-primary-100 text-primary-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <span className="text-lg font-bold">#{index + 1}</span>
                      </div>
                      <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-700">
                          {caregiver.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{caregiver.name}</h3>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-success-200 text-success-800 rounded text-xs font-bold">
                              BEST MATCH
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="font-semibold text-success-600">{caregiver.matchScore}% match</span>
                          <span>{caregiver.distance} min away</span>
                          <span>{caregiver.currentLoad} visits today</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {caregiver.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedVisit ? (
                      <button
                        onClick={() => handleConfirmAssignment(caregiver.id)}
                        disabled={assigningCaregiver}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          index === 0
                            ? 'bg-success-600 text-white hover:bg-success-700'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {assigningCaregiver ? 'Assigning...' : index === 0 ? 'Assign Best Match' : 'Assign'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewCaregiverSchedule(
                          caregiverUtilizationData.find(c => c.name === caregiver.name) || caregiverUtilizationData[0]
                        )}
                        className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors"
                      >
                        View Schedule
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ===== CAREGIVER SCHEDULE FULL PAGE VIEW =====
  const renderCaregiverScheduleView = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedCaregiver(null);
                goBack();
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            {selectedCaregiver && (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary-700">
                    {selectedCaregiver.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{selectedCaregiver.name}</h1>
                  <p className="text-gray-600">Caregiver Schedule & Details</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open('/dashboard/scheduling-calendar', '_blank')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Edit Schedule
            </button>
            <button
              onClick={() => {
                if (selectedCaregiver) {
                  // In a real app, this would open a messaging modal or navigate to messages
                  alert(`Message functionality coming soon.\n\nCaregiver: ${selectedCaregiver.name}\n\nThis will allow you to send direct messages or notifications to the caregiver.`);
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>

        {selectedCaregiver && (
          <>
            {/* Caregiver Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="text-center">
                <p className="text-3xl font-bold text-primary-600">{selectedCaregiver.visitsToday}</p>
                <p className="text-sm text-gray-600">Visits Today</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-success-600">{selectedCaregiver.scheduledHours}h</p>
                <p className="text-sm text-gray-600">Scheduled Hours</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-info-600">{selectedCaregiver.utilization}%</p>
                <p className="text-sm text-gray-600">Utilization</p>
              </Card>
              <Card className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedCaregiver.status === 'on_visit' ? 'bg-success-100 text-success-700' :
                  selectedCaregiver.status === 'traveling' ? 'bg-info-100 text-info-700' :
                  selectedCaregiver.status === 'available' ? 'bg-primary-100 text-primary-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedCaregiver.status === 'on_visit' ? 'On Visit' :
                   selectedCaregiver.status === 'traveling' ? 'Traveling' :
                   selectedCaregiver.status === 'available' ? 'Available' : 'Off Duty'}
                </span>
                <p className="text-sm text-gray-600 mt-1">Current Status</p>
              </Card>
            </div>

            {/* Today's Schedule Timeline */}
            <Card className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
              <div className="space-y-4">
                {travelTimeData
                  .filter(t => t.caregiverId === selectedCaregiver.id)
                  .map((trip, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <ClockIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        {idx < travelTimeData.filter(t => t.caregiverId === selectedCaregiver.id).length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-semibold text-gray-900">{trip.visitTime}</span>
                          <span className="px-3 py-1 bg-info-100 text-info-700 rounded text-sm">
                            {trip.estimatedMinutes}m travel
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{trip.patientName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPinIcon className="h-4 w-4" />
                          {trip.toLocation}
                        </p>
                        {trip.actualMinutes && (
                          <p className="text-xs text-gray-400 mt-1">
                            Actual travel: {trip.actualMinutes}m
                            {trip.actualMinutes > trip.estimatedMinutes && (
                              <span className="text-warning-600 ml-2">
                                (+{trip.actualMinutes - trip.estimatedMinutes}m)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            alert(`Visit Details\n\n` +
                              `Patient: ${trip.patientName}\n` +
                              `Time: ${trip.visitTime}\n` +
                              `Location: ${trip.toLocation}\n` +
                              `Travel Time: ${trip.estimatedMinutes}m estimated` +
                              (trip.actualMinutes ? `, ${trip.actualMinutes}m actual` : '') +
                              `\n\nFull visit details page coming soon.`);
                          }}
                          className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            alert(`Reschedule Visit\n\n` +
                              `Patient: ${trip.patientName}\n` +
                              `Current Time: ${trip.visitTime}\n\n` +
                              `Rescheduling functionality coming soon.\n` +
                              `This will allow you to change the visit time or reassign to another caregiver.`);
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                {travelTimeData.filter(t => t.caregiverId === selectedCaregiver.id).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No visits scheduled for this caregiver today</p>
                    <button
                      onClick={() => navigateToView('unassignedVisits')}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Assign Visits
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => navigateToView('unassignedVisits')}
                  className="p-4 border-2 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all text-center"
                >
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                  <p className="font-medium text-gray-900">Add Visit</p>
                </button>
                <button
                  onClick={() => {
                    if (selectedCaregiver) {
                      alert(`Adjust Hours for ${selectedCaregiver.name}\n\n` +
                        `Current Schedule:\n` +
                        `• Scheduled: ${selectedCaregiver.scheduledHours}h\n` +
                        `• Available: ${selectedCaregiver.availableHours}h\n` +
                        `• Utilization: ${selectedCaregiver.utilization}%\n\n` +
                        `Hours adjustment functionality coming soon.\n` +
                        `This will allow you to modify the caregiver's available hours for the day.`);
                    }
                  }}
                  className="p-4 border-2 rounded-lg hover:bg-info-50 hover:border-info-300 transition-all text-center"
                >
                  <ClockIcon className="h-8 w-8 mx-auto mb-2 text-info-600" />
                  <p className="font-medium text-gray-900">Adjust Hours</p>
                </button>
                <button
                  onClick={() => navigateToView('avgTravelTime')}
                  className="p-4 border-2 rounded-lg hover:bg-success-50 hover:border-success-300 transition-all text-center"
                >
                  <TruckIcon className="h-8 w-8 mx-auto mb-2 text-success-600" />
                  <p className="font-medium text-gray-900">View Routes</p>
                </button>
                <button
                  onClick={() => {
                    if (selectedCaregiver) {
                      alert(`Performance Metrics for ${selectedCaregiver.name}\n\n` +
                        `Today's Stats:\n` +
                        `• Visits Completed: ${selectedCaregiver.visitsToday}\n` +
                        `• Hours Worked: ${selectedCaregiver.scheduledHours}h\n` +
                        `• Utilization: ${selectedCaregiver.utilization}%\n` +
                        `• Status: ${selectedCaregiver.status === 'on_visit' ? 'On Visit' :
                          selectedCaregiver.status === 'traveling' ? 'Traveling' :
                          selectedCaregiver.status === 'available' ? 'Available' : 'Off Duty'}\n\n` +
                        `Full performance dashboard coming soon.\n` +
                        `This will show detailed metrics including:\n` +
                        `• On-time arrival rate\n` +
                        `• Patient satisfaction scores\n` +
                        `• Documentation compliance\n` +
                        `• Monthly/quarterly trends`);
                    }
                  }}
                  className="p-4 border-2 rounded-lg hover:bg-warning-50 hover:border-warning-300 transition-all text-center"
                >
                  <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-warning-600" />
                  <p className="font-medium text-gray-900">Performance</p>
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  // Render current view based on state
  switch (currentView) {
    case 'totalVisits':
      return renderTotalVisitsView();
    case 'unassignedVisits':
      return renderUnassignedVisitsView();
    case 'caregiverUtilization':
      return renderCaregiverUtilizationView();
    case 'avgTravelTime':
      return renderAvgTravelTimeView();
    case 'scheduleCompliance':
      return renderScheduleComplianceView();
    case 'assignCaregiver':
      return renderAssignCaregiverView();
    case 'aiMatchResults':
      return renderAIMatchResultsView();
    case 'caregiverScheduleView':
      return renderCaregiverScheduleView();
    default:
      return renderDashboardView();
  }
}
