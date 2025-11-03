import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import { VisitStatusBadge } from '../ui/Badge';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        dailyVisits: 127,
        completedVisits: 119,
        avgTravelTime: 18.5,
        efficiency: 87.3,
        lateVisits: 3,
        caregiverUtilization: 82.1
      });

      setUpcomingVisits([
        {
          id: '1',
          patientName: 'Mary Johnson',
          caregiverName: 'Sarah Williams',
          scheduledTime: '2:00 PM',
          status: 'on_time',
          location: 'Columbus, OH'
        },
        {
          id: '2',
          patientName: 'Robert Smith',
          caregiverName: 'Jennifer Davis',
          scheduledTime: '2:30 PM',
          status: 'late',
          location: 'Cleveland, OH'
        },
        {
          id: '3',
          patientName: 'Patricia Brown',
          caregiverName: 'Michael Wilson',
          scheduledTime: '3:00 PM',
          status: 'scheduled',
          location: 'Cincinnati, OH'
        }
      ]);

      setLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
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

  return (
    <div className="min-h-screen bg-gray-50">
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
          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Today's Visits</h3>
              <div className="p-2 bg-primary-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.dailyVisits}</p>
            <p className="text-sm text-success-600 mt-1">+8% vs yesterday</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success-600">{metrics.completedVisits}</p>
            <p className="text-sm text-success-600 mt-1">{completionRate}% completion rate</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Avg Travel Time</h3>
              <div className="p-2 bg-info-100 rounded-lg">
                <TruckIcon className="h-5 w-5 text-info-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">{metrics.avgTravelTime}m</p>
            <p className="text-sm text-success-600 mt-1">-2.3m improved</p>
          </Card>

          <Card hoverable className="transition-all hover:scale-105">
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
          <Card className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-caregiver-600" />
              <h3 className="text-lg font-semibold text-gray-900">Caregiver Utilization</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Utilization</span>
                  <span className="text-sm font-bold text-gray-900">{metrics.caregiverUtilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-caregiver-500 to-caregiver-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.caregiverUtilization}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">92</div>
                  <div className="text-xs text-gray-500 mt-1">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">12</div>
                  <div className="text-xs text-gray-500 mt-1">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">8</div>
                  <div className="text-xs text-gray-500 mt-1">Off Duty</div>
                </div>
              </div>
            </div>
          </Card>
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
            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
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

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
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

            <Card hoverable clickable className="cursor-pointer hover:shadow-lg transition-all">
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
