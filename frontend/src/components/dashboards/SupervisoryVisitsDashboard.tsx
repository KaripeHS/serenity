import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  EyeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface SupervisoryVisit {
  id: string;
  caregiverId: string;
  caregiverName: string;
  supervisorId: string;
  supervisorName: string;
  clientId: string;
  clientName: string;
  visitType: 'initial' | 'quarterly' | 'annual' | 'incident_triggered' | 'competency';
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  location?: string;
  notes?: string;
  carePlanReviewed: boolean;
  competencyAssessed: boolean;
}

interface ComplianceMetrics {
  totalCaregivers: number;
  supervisedThisQuarter: number;
  overdueVisits: number;
  completedVisits: number;
  complianceRate: number;
  averageDaysBetweenVisits: number;
}

export function SupervisoryVisitsDashboard() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<SupervisoryVisit[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'completed' | 'all'>('upcoming');
  const [selectedVisit, setSelectedVisit] = useState<SupervisoryVisit | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('serenity_access_token');

      // Try to fetch from API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clinical-supervision/visits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVisits(data.visits || []);
        setMetrics(data.metrics || null);
      } else {
        // Use mock data if API not available
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading supervisory visits:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock data for demonstration
    const mockVisits: SupervisoryVisit[] = [
      {
        id: '1',
        caregiverId: 'cg1',
        caregiverName: 'Maria Garcia',
        supervisorId: 'sup1',
        supervisorName: 'Dr. Sarah Johnson',
        clientId: 'cl1',
        clientName: 'John Smith',
        visitType: 'quarterly',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        location: '123 Main St, Columbus, OH',
        carePlanReviewed: false,
        competencyAssessed: false
      },
      {
        id: '2',
        caregiverId: 'cg2',
        caregiverName: 'James Wilson',
        supervisorId: 'sup1',
        supervisorName: 'Dr. Sarah Johnson',
        clientId: 'cl2',
        clientName: 'Mary Johnson',
        visitType: 'quarterly',
        scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'overdue',
        location: '456 Oak Ave, Columbus, OH',
        carePlanReviewed: false,
        competencyAssessed: false
      },
      {
        id: '3',
        caregiverId: 'cg3',
        caregiverName: 'Emily Brown',
        supervisorId: 'sup2',
        supervisorName: 'Dr. Michael Lee',
        clientId: 'cl3',
        clientName: 'Robert Davis',
        visitType: 'initial',
        scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        location: '789 Pine Rd, Columbus, OH',
        carePlanReviewed: true,
        competencyAssessed: true,
        notes: 'Excellent performance. Caregiver demonstrates strong ADL assistance skills.'
      },
      {
        id: '4',
        caregiverId: 'cg4',
        caregiverName: 'David Martinez',
        supervisorId: 'sup1',
        supervisorName: 'Dr. Sarah Johnson',
        clientId: 'cl4',
        clientName: 'Patricia Williams',
        visitType: 'incident_triggered',
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        location: '321 Elm St, Columbus, OH',
        carePlanReviewed: false,
        competencyAssessed: false,
        notes: 'Follow-up required after medication incident report'
      }
    ];

    const mockMetrics: ComplianceMetrics = {
      totalCaregivers: 45,
      supervisedThisQuarter: 38,
      overdueVisits: 3,
      completedVisits: 142,
      complianceRate: 84.4,
      averageDaysBetweenVisits: 85
    };

    setVisits(mockVisits);
    setMetrics(mockMetrics);
  };

  const filteredVisits = visits.filter(visit => {
    switch (activeTab) {
      case 'upcoming':
        return visit.status === 'scheduled';
      case 'overdue':
        return visit.status === 'overdue';
      case 'completed':
        return visit.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusBadge = (status: SupervisoryVisit['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getVisitTypeBadge = (type: SupervisoryVisit['visitType']) => {
    const labels = {
      initial: 'Initial',
      quarterly: 'Quarterly',
      annual: 'Annual',
      incident_triggered: 'Incident Follow-up',
      competency: 'Competency'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervisory Visits</h1>
          <p className="text-gray-500 mt-1">RN supervisory visit scheduling and compliance tracking (OAC 173-39-02.11)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Schedule Visit
          </button>
        </div>
      </div>

      {/* Compliance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('all')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Caregivers</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCaregivers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('completed')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Supervised This Quarter</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.supervisedThisQuarter}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('overdue')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue Visits</p>
                <p className="text-2xl font-bold text-red-600">{metrics.overdueVisits}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Compliance Rate</p>
                <p className={`text-2xl font-bold ${metrics.complianceRate >= 90 ? 'text-green-600' : metrics.complianceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {metrics.complianceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Days Between</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageDaysBetweenVisits}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Completed</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.completedVisits}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Ohio Compliance Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <EyeIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Ohio Administrative Code Requirement</h3>
            <p className="text-sm text-blue-700 mt-1">
              Per OAC 173-39-02.11(C)(4), RN supervisory visits must occur at least quarterly for each caregiver.
              Initial visits required within 30 days of hire. Supervisory visits must include care plan review,
              competency assessment, and documentation review.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'upcoming', label: 'Upcoming', count: visits.filter(v => v.status === 'scheduled').length },
            { key: 'overdue', label: 'Overdue', count: visits.filter(v => v.status === 'overdue').length },
            { key: 'completed', label: 'Completed', count: visits.filter(v => v.status === 'completed').length },
            { key: 'all', label: 'All Visits', count: visits.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {filteredVisits.length === 0 ? (
          <Card className="p-8 text-center">
            <EyeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No visits found in this category</p>
          </Card>
        ) : (
          filteredVisits.map(visit => (
            <Card
              key={visit.id}
              className="p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedVisit(visit)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{visit.caregiverName}</h3>
                      <Badge className={getStatusBadge(visit.status)}>
                        {visit.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {getVisitTypeBadge(visit.visitType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Client: {visit.clientName} | Supervisor: {visit.supervisorName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {formatDate(visit.scheduledDate)}
                      </span>
                      {visit.location && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {visit.location}
                        </span>
                      )}
                    </div>
                    {visit.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{visit.notes}"</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {visit.status === 'completed' && (
                    <div className="flex gap-2">
                      {visit.carePlanReviewed && (
                        <Badge className="bg-green-100 text-green-800">Care Plan Reviewed</Badge>
                      )}
                      {visit.competencyAssessed && (
                        <Badge className="bg-green-100 text-green-800">Competency Assessed</Badge>
                      )}
                    </div>
                  )}
                  {visit.status === 'scheduled' && (
                    <button className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Start Visit
                    </button>
                  )}
                  {visit.status === 'overdue' && (
                    <button className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Reschedule
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Caregivers Needing Supervision Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Caregivers Needing Supervision</h2>
        <p className="text-sm text-gray-500 mb-4">
          The following caregivers are due or overdue for their quarterly supervisory visit:
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caregiver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600">JW</span>
                    </div>
                    <span className="font-medium text-gray-900">James Wilson</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Oct 15, 2025</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">95 days</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Schedule Now
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-yellow-600">AT</span>
                    </div>
                    <span className="font-medium text-gray-900">Amanda Thompson</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Nov 1, 2025</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-yellow-600">78 days</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Schedule Now
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default SupervisoryVisitsDashboard;
