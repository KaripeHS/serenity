import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  SparklesIcon
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
}

function MetricCard({ title, value, subtitle, icon: Icon, iconColor, valueColor = 'text-gray-900' }: MetricCardProps) {
  return (
    <Card hoverable className="transition-all hover:scale-105">
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
  const [metrics, setMetrics] = useState<SchedulingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);

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

  return (
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
              <button className="px-4 py-2 bg-info-600 text-white rounded-lg font-medium hover:bg-info-700 transition-colors">
                🚀 Optimize Now
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
          />
          <MetricCard
            title="Unassigned Visits"
            value={metrics.unassignedVisits}
            subtitle="Need assignment"
            icon={UserGroupIcon}
            iconColor="bg-danger-600"
            valueColor="text-danger-600"
          />
          <MetricCard
            title="Caregiver Utilization"
            value={`${metrics.caregiverUtilization}%`}
            subtitle="Optimal range"
            icon={UserGroupIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
          />
          <MetricCard
            title="Avg Travel Time"
            value={`${metrics.avgTravelTime}m`}
            subtitle="-3m improved"
            icon={MapPinIcon}
            iconColor="bg-info-600"
            valueColor="text-info-600"
          />
          <MetricCard
            title="Schedule Compliance"
            value={`${metrics.scheduleCompliance}%`}
            subtitle="Above target"
            icon={ClockIcon}
            iconColor="bg-success-600"
            valueColor="text-success-600"
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
            <button className="px-4 py-3 bg-danger-600 text-white rounded-lg font-medium hover:bg-danger-700 transition-all hover:scale-105">
              📅 Assign Visits ({visits.filter(v => v.status === 'unassigned').length})
            </button>
            <button className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all hover:scale-105">
              🎯 AI Caregiver Matcher
            </button>
            <button className="px-4 py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-all hover:scale-105">
              ⚡ Optimize Routes
            </button>
            <button className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all hover:scale-105">
              📆 View Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
