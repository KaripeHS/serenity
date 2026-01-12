import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  BellAlertIcon,
  ShieldExclamationIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

interface Incident {
  id: string;
  incidentNumber: string;
  type: 'fall' | 'medication_error' | 'injury' | 'abuse_neglect' | 'elopement' | 'death' | 'hospitalization' | 'other';
  severity: 'critical' | 'reportable' | 'unusual';
  clientId: string;
  clientName: string;
  caregiverId?: string;
  caregiverName?: string;
  reportedBy: string;
  reportedAt: string;
  occurredAt: string;
  location: string;
  description: string;
  status: 'reported' | 'investigating' | 'pending_review' | 'resolved' | 'closed';
  odaReported: boolean;
  odaReportedAt?: string;
  odaCaseNumber?: string;
  odaDeadline?: string;
  investigationStarted?: string;
  investigationCompleted?: string;
  rootCause?: string;
  correctiveActions?: string[];
}

interface IncidentMetrics {
  totalThisMonth: number;
  criticalIncidents: number;
  openInvestigations: number;
  odaPendingReports: number;
  avgResolutionDays: number;
  odaOnTimeRate: number;
}

const INCIDENT_TYPES = [
  { value: 'fall', label: 'Fall' },
  { value: 'medication_error', label: 'Medication Error' },
  { value: 'injury', label: 'Injury' },
  { value: 'abuse_neglect', label: 'Abuse/Neglect Suspicion' },
  { value: 'elopement', label: 'Elopement/Missing Person' },
  { value: 'death', label: 'Death' },
  { value: 'hospitalization', label: 'Hospitalization/ER Visit' },
  { value: 'other', label: 'Other' }
];

export function IncidentsDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<IncidentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'oda_pending' | 'investigating'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('serenity_access_token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents || []);
        setMetrics(data.metrics || null);
      } else {
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockIncidents: Incident[] = [
      {
        id: '1',
        incidentNumber: 'INC-2026-0001',
        type: 'fall',
        severity: 'reportable',
        clientId: 'cl1',
        clientName: 'John Smith',
        caregiverId: 'cg1',
        caregiverName: 'Maria Garcia',
        reportedBy: 'Maria Garcia',
        reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Client Home - Bathroom',
        description: 'Client slipped while transferring from wheelchair to toilet. Minor bruising on left hip. No head injury.',
        status: 'investigating',
        odaReported: false,
        odaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        investigationStarted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        incidentNumber: 'INC-2026-0002',
        type: 'medication_error',
        severity: 'critical',
        clientId: 'cl2',
        clientName: 'Mary Johnson',
        caregiverId: 'cg2',
        caregiverName: 'James Wilson',
        reportedBy: 'Dr. Sarah Johnson',
        reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Client Home',
        description: 'Wrong dosage of blood pressure medication administered. Client received 10mg instead of 5mg. Physician notified immediately.',
        status: 'reported',
        odaReported: false,
        odaDeadline: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        incidentNumber: 'INC-2025-0145',
        type: 'hospitalization',
        severity: 'reportable',
        clientId: 'cl3',
        clientName: 'Robert Davis',
        reportedBy: 'Family Member',
        reportedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'OSU Medical Center',
        description: 'Client admitted to ER for shortness of breath. Diagnosed with pneumonia. Admitted for treatment.',
        status: 'resolved',
        odaReported: true,
        odaReportedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        odaCaseNumber: 'ODA-2025-78456',
        investigationCompleted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        rootCause: 'No caregiver-related cause identified. Medical event.',
        correctiveActions: ['Updated care plan with respiratory monitoring', 'Scheduled follow-up with PCP']
      },
      {
        id: '4',
        incidentNumber: 'INC-2026-0003',
        type: 'injury',
        severity: 'unusual',
        clientId: 'cl4',
        clientName: 'Patricia Williams',
        caregiverId: 'cg3',
        caregiverName: 'Emily Brown',
        reportedBy: 'Emily Brown',
        reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        location: 'Client Home - Kitchen',
        description: 'Minor cut on finger while preparing lunch. First aid applied. No stitches required.',
        status: 'pending_review',
        odaReported: false
      }
    ];

    const mockMetrics: IncidentMetrics = {
      totalThisMonth: 12,
      criticalIncidents: 2,
      openInvestigations: 3,
      odaPendingReports: 2,
      avgResolutionDays: 4.5,
      odaOnTimeRate: 96.5
    };

    setIncidents(mockIncidents);
    setMetrics(mockMetrics);
  };

  const getSeverityBadge = (severity: Incident['severity']) => {
    const styles = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      reportable: 'bg-orange-100 text-orange-800 border-orange-200',
      unusual: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    const labels = {
      critical: 'Critical (24hr ODA)',
      reportable: 'Reportable (5-day ODA)',
      unusual: 'Unusual Occurrence'
    };
    return { style: styles[severity], label: labels[severity] };
  };

  const getStatusBadge = (status: Incident['status']) => {
    const styles = {
      reported: 'bg-blue-100 text-blue-800',
      investigating: 'bg-purple-100 text-purple-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hours = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours < 0) return { text: 'OVERDUE', urgent: true };
    if (hours < 24) return { text: `${hours} hours`, urgent: true };
    const days = Math.round(hours / 24);
    return { text: `${days} days`, urgent: days <= 1 };
  };

  const filteredIncidents = incidents.filter(incident => {
    // Tab filter
    if (activeTab === 'open' && ['resolved', 'closed'].includes(incident.status)) return false;
    if (activeTab === 'oda_pending' && (incident.odaReported || incident.severity === 'unusual')) return false;
    if (activeTab === 'investigating' && incident.status !== 'investigating') return false;

    // Type filter
    if (typeFilter !== 'all' && incident.type !== typeFilter) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        incident.incidentNumber.toLowerCase().includes(search) ||
        incident.clientName.toLowerCase().includes(search) ||
        incident.caregiverName?.toLowerCase().includes(search) ||
        incident.description.toLowerCase().includes(search)
      );
    }

    return true;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-gray-500 mt-1">Track, investigate, and report incidents per OAC 173-39-02.10</p>
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
            onClick={() => setShowNewIncidentForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <PlusIcon className="h-5 w-5" />
            Report Incident
          </button>
        </div>
      </div>

      {/* Urgent ODA Deadline Alert */}
      {incidents.some(i => !i.odaReported && i.severity !== 'unusual' && i.odaDeadline) && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">ODA Reporting Deadlines Approaching</h3>
              <p className="text-sm text-red-700 mt-1">
                {incidents.filter(i => !i.odaReported && i.severity !== 'unusual').length} incident(s) require ODA reporting.
                Critical incidents must be reported within 24 hours.
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
              View Pending Reports
            </button>
          </div>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('all')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalThisMonth}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalIncidents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('investigating')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Investigating</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.openInvestigations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('oda_pending')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BuildingOffice2Icon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ODA Pending</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.odaPendingReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ODA On-Time</p>
                <p className="text-2xl font-bold text-green-600">{metrics.odaOnTimeRate}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Resolution</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgResolutionDays} days</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Types</option>
          {INCIDENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'open', label: 'Open', count: incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length },
            { key: 'oda_pending', label: 'ODA Pending', count: incidents.filter(i => !i.odaReported && i.severity !== 'unusual').length },
            { key: 'investigating', label: 'Investigating', count: incidents.filter(i => i.status === 'investigating').length },
            { key: 'all', label: 'All Incidents', count: incidents.length }
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

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <Card className="p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No incidents found matching your criteria</p>
          </Card>
        ) : (
          filteredIncidents.map(incident => {
            const severityInfo = getSeverityBadge(incident.severity);
            const deadlineInfo = incident.odaDeadline ? getTimeUntilDeadline(incident.odaDeadline) : null;

            return (
              <Card
                key={incident.id}
                className={`p-5 hover:shadow-md transition-shadow cursor-pointer ${
                  incident.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      incident.severity === 'critical' ? 'bg-red-100' :
                      incident.severity === 'reportable' ? 'bg-orange-100' : 'bg-yellow-100'
                    }`}>
                      <ExclamationTriangleIcon className={`h-6 w-6 ${
                        incident.severity === 'critical' ? 'text-red-600' :
                        incident.severity === 'reportable' ? 'text-orange-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{incident.incidentNumber}</h3>
                        <Badge className={severityInfo.style}>{severityInfo.label}</Badge>
                        <Badge className={getStatusBadge(incident.status)}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {INCIDENT_TYPES.find(t => t.value === incident.type)?.label || incident.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Client: {incident.clientName}
                        {incident.caregiverName && ` | Caregiver: ${incident.caregiverName}`}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{incident.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="h-4 w-4" />
                          Occurred: {formatDateTime(incident.occurredAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          Reported by: {incident.reportedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* ODA Deadline */}
                    {!incident.odaReported && incident.severity !== 'unusual' && deadlineInfo && (
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        deadlineInfo.urgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        ODA Due: {deadlineInfo.text}
                      </div>
                    )}
                    {incident.odaReported && (
                      <Badge className="bg-green-100 text-green-800">
                        ODA Reported: {incident.odaCaseNumber}
                      </Badge>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {incident.status === 'reported' && (
                        <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                          Start Investigation
                        </button>
                      )}
                      {!incident.odaReported && incident.severity !== 'unusual' && (
                        <button className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                          Report to ODA
                        </button>
                      )}
                      <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Incident Type Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Summary by Type (Last 30 Days)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INCIDENT_TYPES.slice(0, 8).map(type => {
            const count = incidents.filter(i => i.type === type.value).length;
            return (
              <div
                key={type.value}
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setTypeFilter(type.value)}
              >
                <p className="text-sm text-gray-500">{type.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default IncidentsDashboard;
