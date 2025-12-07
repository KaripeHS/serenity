import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { consoleApi, Client } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  FunnelIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Extended Patient interface for UI, mapped from API Client
interface Patient extends Client {
  age: number;
  insuranceType: 'medicaid' | 'medicare' | 'private';
  nextVisit: string;
}

export function PatientList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadPatients() {
      if (!user?.organizationId) return;

      try {
        setLoading(true);
        const response = await consoleApi.getClients(user.organizationId);

        // Map API response to UI model
        const mappedPatients = response.clients.map(client => ({
          ...client,
          age: calculateAge(client.dateOfBirth || '1900-01-01'), // Assuming DOB comes from API, need to check Client interface
          insuranceType: client.medicaidNumber ? 'medicaid' : 'private',
          nextVisit: '-' // Placeholder until we fetch schedule
        } as Patient));

        setPatients(mappedPatients);
      } catch (error) {
        console.error("Failed to load patients", error);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, [user?.organizationId]);

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchTerm) ||
      patient.city?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'gray'> = {
      active: 'success',
      pending: 'warning',
      inactive: 'gray',
      discharged: 'info'
    };
    return <Badge variant={variants[status] || 'gray'} size="sm">{(status || 'Unknown').charAt(0).toUpperCase() + (status || 'unknown').slice(1)}</Badge>;
  };

  const getInsuranceBadge = (type: string) => {
    return <Badge variant={type === 'medicaid' ? 'info' : 'gray'} size="sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/dashboard/clinical"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Patient Management
            </h1>
          </div>
          <p className="text-gray-600">
            {filteredPatients.length} patients • Centralized Record System
          </p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add New Patient</span>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Patient List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <UserPlusIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
              <p className="text-gray-500">Try adjusting your search or add a new patient.</p>
            </div>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              hoverable
              clickable
              onClick={() => navigate(`/patients/${patient.id}`)}
              className="cursor-pointer transition-all hover:border-primary-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Patient Info */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-patient-100 rounded-full flex items-center justify-center flex-shrink-0 text-patient-700 font-bold text-xl">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      {getStatusBadge(patient.status)}
                      {getInsuranceBadge(patient.insuranceType)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {patient.address} • {patient.city}, {patient.state}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        {patient.phone || 'No phone'}
                      </span>
                      {patient.podCode && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          Pod: {patient.podCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-end">
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
