/**
 * Scheduling Calendar Component
 * Visual scheduling calendar with week/month views, drag-drop support, and caregiver availability
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarDaysIcon,
  ViewColumnsIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { schedulingService, CaregiverMatch } from '../../services/scheduling.service';
import { loggerService } from '../../shared/services/logger.service';

// Types
interface ScheduledVisit {
  id: string;
  clientId: string;
  clientName: string;
  caregiverId: string | null;
  caregiverName: string | null;
  serviceType: string;
  serviceCode: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  location: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'unassigned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

interface CaregiverAvailability {
  caregiverId: string;
  caregiverName: string;
  date: Date;
  slots: Array<{
    start: Date;
    end: Date;
    isAvailable: boolean;
    visitId?: string;
  }>;
}

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SchedulingCalendar() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [caregiverAvailability, setCaregiverAvailability] = useState<CaregiverAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<ScheduledVisit | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [caregiverMatches, setCaregiverMatches] = useState<CaregiverMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Calculate week dates
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // Calculate month grid
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates: Date[] = [];
    let current = new Date(startDate);
    while (dates.length < 42) { // 6 weeks
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [currentDate]);

  useEffect(() => {
    loadScheduleData();
  }, [currentDate, viewMode]);

  async function loadScheduleData() {
    setLoading(true);
    try {
      // Mock data for demonstration - in production, fetch from API
      const mockVisits: ScheduledVisit[] = generateMockVisits(weekDates);
      setVisits(mockVisits);
    } catch (error) {
      loggerService.error('Failed to load schedule', { error });
    } finally {
      setLoading(false);
    }
  }

  function generateMockVisits(dates: Date[]): ScheduledVisit[] {
    const clients = [
      { id: 'c1', name: 'Eleanor Johnson' },
      { id: 'c2', name: 'Robert Smith' },
      { id: 'c3', name: 'Mary Williams' },
      { id: 'c4', name: 'James Brown' },
      { id: 'c5', name: 'Patricia Davis' },
    ];

    const caregivers = [
      { id: 'cg1', name: 'Sarah Miller' },
      { id: 'cg2', name: 'David Chen' },
      { id: 'cg3', name: 'Maria Garcia' },
      { id: 'cg4', name: 'Michael Johnson' },
    ];

    const services = [
      { type: 'Personal Care', code: 'T1019' },
      { type: 'Homemaker', code: 'S5130' },
      { type: 'Respite', code: 'S5150' },
    ];

    const visits: ScheduledVisit[] = [];
    let visitId = 1;

    dates.forEach((date, dayIndex) => {
      // Generate 3-6 visits per day
      const numVisits = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numVisits; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)];
        const hasCaregiver = Math.random() > 0.2;
        const caregiver = hasCaregiver
          ? caregivers[Math.floor(Math.random() * caregivers.length)]
          : null;
        const service = services[Math.floor(Math.random() * services.length)];
        const hour = 7 + Math.floor(Math.random() * 10);
        const duration = [60, 90, 120][Math.floor(Math.random() * 3)];

        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);

        const statuses: ScheduledVisit['status'][] = hasCaregiver
          ? ['scheduled', 'confirmed', 'completed']
          : ['unassigned'];
        const priorities: ScheduledVisit['priority'][] = ['low', 'medium', 'high', 'urgent'];

        visits.push({
          id: `V${String(visitId++).padStart(4, '0')}`,
          clientId: client.id,
          clientName: client.name,
          caregiverId: caregiver?.id || null,
          caregiverName: caregiver?.name || null,
          serviceType: service.type,
          serviceCode: service.code,
          startTime,
          endTime,
          duration,
          location: ['Columbus, OH', 'Dublin, OH', 'Westerville, OH', 'Grove City, OH'][
            Math.floor(Math.random() * 4)
          ],
          status: hasCaregiver
            ? statuses[Math.floor(Math.random() * statuses.length)]
            : 'unassigned',
          priority: priorities[Math.floor(Math.random() * priorities.length)],
        });
      }
    });

    return visits;
  }

  async function loadCaregiverMatches(visit: ScheduledVisit) {
    setMatchesLoading(true);
    try {
      const matches = await schedulingService.getCaregiverMatches(
        visit.clientId,
        visit.serviceCode,
        visit.startTime,
        visit.endTime
      );
      setCaregiverMatches(matches);
    } catch (error) {
      loggerService.error('Failed to load caregiver matches', { error });
      // Mock matches for demo
      setCaregiverMatches([
        {
          caregiver: {
            id: 'cg1',
            name: 'Sarah Miller',
            role: 'Caregiver',
            email: 'sarah@example.com',
            skills: ['Personal Care', 'Medication Management'],
            location: { lat: 39.96, lng: -83.0 },
          },
          score: 95,
          reasons: ['Has required skills', 'Close to client', 'Available'],
          warnings: [],
          travelDistance: 3.2,
          availability: [],
        },
        {
          caregiver: {
            id: 'cg2',
            name: 'David Chen',
            role: 'Caregiver',
            email: 'david@example.com',
            skills: ['Personal Care', 'Physical Therapy'],
            location: { lat: 40.0, lng: -83.02 },
          },
          score: 82,
          reasons: ['Has required skills', 'Available'],
          warnings: ['Further from client (5.1 miles)'],
          travelDistance: 5.1,
          availability: [],
        },
      ]);
    } finally {
      setMatchesLoading(false);
    }
  }

  function handleAssignCaregiver(visit: ScheduledVisit) {
    setSelectedVisit(visit);
    setShowAssignModal(true);
    loadCaregiverMatches(visit);
  }

  function handleSelectCaregiver(caregiverId: string, caregiverName: string) {
    if (!selectedVisit) return;

    setVisits((prev) =>
      prev.map((v) =>
        v.id === selectedVisit.id
          ? { ...v, caregiverId, caregiverName, status: 'scheduled' as const }
          : v
      )
    );
    setShowAssignModal(false);
    setSelectedVisit(null);
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const getVisitsForDate = (date: Date) =>
    visits.filter(
      (v) =>
        v.startTime.getFullYear() === date.getFullYear() &&
        v.startTime.getMonth() === date.getMonth() &&
        v.startTime.getDate() === date.getDate()
    );

  const getVisitColor = (visit: ScheduledVisit) => {
    if (visit.status === 'unassigned') return 'bg-red-100 border-red-300 text-red-800';
    if (visit.status === 'completed') return 'bg-green-100 border-green-300 text-green-800';
    if (visit.status === 'cancelled') return 'bg-gray-100 border-gray-300 text-gray-500';
    if (visit.priority === 'urgent') return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const formatDateHeader = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (viewMode === 'week') {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const unassignedCount = visits.filter((v) => v.status === 'unassigned').length;

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scheduling Calendar</h1>
            <p className="text-gray-600">Manage visits, assignments, and caregiver schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Visit
            </Button>
          </div>
        </div>

        {/* Unassigned Alert */}
        {unassignedCount > 0 && (
          <Alert variant="warning" title={`${unassignedCount} Unassigned Visits`} className="mb-6">
            <span>
              You have visits that need caregiver assignment.{' '}
              <button
                className="text-warning-700 underline font-medium"
                onClick={() => setViewMode('week')}
              >
                View in calendar
              </button>
            </span>
          </Alert>
        )}

        {/* Calendar Controls */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold text-gray-900 ml-4">{formatDateHeader()}</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'day' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-300"></div>
                <span>Unassigned</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-300"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-300"></div>
                <span>Completed</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Week View */}
        {viewMode === 'week' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-gray-200">
                  <div className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
                    Time
                  </div>
                  {weekDates.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={i}
                        className={`p-3 text-center border-l border-gray-200 ${
                          isToday ? 'bg-primary-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-500">{DAYS_OF_WEEK[date.getDay()]}</div>
                        <div
                          className={`text-lg font-bold ${
                            isToday ? 'text-primary-600' : 'text-gray-900'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                {HOURS.filter((h) => h >= 6 && h <= 20).map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-2 text-right text-xs text-gray-500 bg-gray-50 border-r">
                      {hour === 0
                        ? '12 AM'
                        : hour < 12
                          ? `${hour} AM`
                          : hour === 12
                            ? '12 PM'
                            : `${hour - 12} PM`}
                    </div>
                    {weekDates.map((date, dayIndex) => {
                      const dayVisits = getVisitsForDate(date).filter(
                        (v) => v.startTime.getHours() === hour
                      );
                      return (
                        <div
                          key={dayIndex}
                          className="min-h-[60px] p-1 border-l border-gray-100 relative"
                        >
                          {dayVisits.map((visit) => (
                            <div
                              key={visit.id}
                              className={`p-1.5 rounded text-xs mb-1 cursor-pointer border ${getVisitColor(
                                visit
                              )} hover:opacity-80 transition-opacity`}
                              onClick={() =>
                                visit.status === 'unassigned'
                                  ? handleAssignCaregiver(visit)
                                  : setSelectedVisit(visit)
                              }
                            >
                              <div className="font-medium truncate">{visit.clientName}</div>
                              <div className="text-[10px] opacity-80">
                                {formatTime(visit.startTime)} - {visit.duration}min
                              </div>
                              {visit.caregiverName && (
                                <div className="text-[10px] opacity-70 truncate">
                                  {visit.caregiverName}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {HOURS.filter((h) => h >= 6 && h <= 20).map((hour) => {
                const hourVisits = getVisitsForDate(currentDate).filter(
                  (v) => v.startTime.getHours() === hour
                );
                return (
                  <div key={hour} className="flex">
                    <div className="w-20 p-3 text-right text-sm text-gray-500 bg-gray-50 flex-shrink-0">
                      {hour === 0
                        ? '12 AM'
                        : hour < 12
                          ? `${hour} AM`
                          : hour === 12
                            ? '12 PM'
                            : `${hour - 12} PM`}
                    </div>
                    <div className="flex-1 p-2 min-h-[80px]">
                      {hourVisits.map((visit) => (
                        <div
                          key={visit.id}
                          className={`p-3 rounded-lg border mb-2 cursor-pointer ${getVisitColor(
                            visit
                          )} hover:shadow-md transition-shadow`}
                          onClick={() =>
                            visit.status === 'unassigned'
                              ? handleAssignCaregiver(visit)
                              : setSelectedVisit(visit)
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{visit.clientName}</div>
                              <div className="text-sm opacity-80">{visit.serviceType}</div>
                            </div>
                            <Badge
                              variant={visit.status === 'unassigned' ? 'danger' : 'success'}
                              size="sm"
                            >
                              {visit.status}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm opacity-70">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {formatTime(visit.startTime)} - {formatTime(visit.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {visit.location}
                            </span>
                            {visit.caregiverName && (
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4" />
                                {visit.caregiverName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <Card className="overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {FULL_DAYS.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7">
              {monthDates.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const dayVisits = getVisitsForDate(date);
                const unassigned = dayVisits.filter((v) => v.status === 'unassigned').length;

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm font-medium ${
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${isToday ? 'text-primary-600' : ''}`}
                      >
                        {date.getDate()}
                      </span>
                      {unassigned > 0 && (
                        <Badge variant="danger" size="sm">
                          {unassigned}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayVisits.slice(0, 3).map((visit) => (
                        <div
                          key={visit.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer ${getVisitColor(
                            visit
                          )}`}
                          onClick={() =>
                            visit.status === 'unassigned'
                              ? handleAssignCaregiver(visit)
                              : setSelectedVisit(visit)
                          }
                        >
                          {visit.clientName}
                        </div>
                      ))}
                      {dayVisits.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayVisits.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Assign Caregiver Modal */}
        {showAssignModal && selectedVisit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Caregiver</h2>
                  <p className="text-gray-600">
                    {selectedVisit.clientName} - {selectedVisit.serviceType}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedVisit.startTime.toLocaleDateString()} at {formatTime(selectedVisit.startTime)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                  <XCircleIcon className="h-5 w-5" />
                </Button>
              </div>

              {matchesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Best Matches</h3>
                  {caregiverMatches.map((match) => (
                    <div
                      key={match.caregiver.id}
                      className="p-4 border rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                      onClick={() => handleSelectCaregiver(match.caregiver.id, match.caregiver.name)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{match.caregiver.name}</p>
                            <p className="text-sm text-gray-500">{match.caregiver.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary-600">{match.score}</span>
                            <span className="text-sm text-gray-500">/ 100</span>
                          </div>
                          <p className="text-sm text-gray-500">{match.travelDistance} miles</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {match.reasons.map((reason, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                          >
                            <CheckCircleIcon className="h-3 w-3" />
                            {reason}
                          </span>
                        ))}
                        {match.warnings.map((warning, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded"
                          >
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            {warning}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button variant="ghost">
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Refresh Matches
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
