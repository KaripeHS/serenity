import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  ohioTrainingRequirements,
  mockCaregiverTrainings,
  mockTrainingSessions,
  mockTrainingStats,
  getStatusColor,
  getCategoryColor,
  getDaysUntilDue,
  TrainingRequirement,
  CaregiverTraining,
  TrainingSession
} from '../../services/training.service';

type TabType = 'overview' | 'assignments' | 'sessions' | 'requirements' | 'compliance';
type StatusFilter = 'all' | 'completed' | 'in_progress' | 'not_started' | 'due_soon' | 'expired';

export function TrainingManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTraining, setSelectedTraining] = useState<CaregiverTraining | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'compliance', label: 'Compliance Report' }
  ];

  const filterTrainings = (trainings: CaregiverTraining[]) => {
    if (statusFilter === 'all') return trainings;
    return trainings.filter(t => t.status === statusFilter);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {mockTrainingStats.complianceRate}%
                </div>
                <div className="text-sm text-gray-500">Overall Compliance</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {mockTrainingStats.fullyCompliant} of {mockTrainingStats.totalCaregivers} caregivers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {mockTrainingStats.overdueTrainings}
                </div>
                <div className="text-sm text-gray-500">Overdue Trainings</div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">!</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600 font-medium">
              Immediate action required
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {mockTrainingStats.trainingsExpiringSoon}
                </div>
                <div className="text-sm text-gray-500">Expiring in 30 Days</div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⏰</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              Schedule renewals soon
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {mockTrainingStats.upcomingSessions}
                </div>
                <div className="text-sm text-gray-500">Upcoming Sessions</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📅</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Next 7 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-lg">Mandatory Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Compliance Rate</span>
              <span className="font-semibold">
                {Math.round((mockTrainingStats.byCategory.mandatory.compliant / mockTrainingStats.byCategory.mandatory.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(mockTrainingStats.byCategory.mandatory.compliant / mockTrainingStats.byCategory.mandatory.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {mockTrainingStats.byCategory.mandatory.compliant} of {mockTrainingStats.byCategory.mandatory.total} completed
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-lg">Role-Specific Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Compliance Rate</span>
              <span className="font-semibold">
                {Math.round((mockTrainingStats.byCategory.roleSpecific.compliant / mockTrainingStats.byCategory.roleSpecific.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${(mockTrainingStats.byCategory.roleSpecific.compliant / mockTrainingStats.byCategory.roleSpecific.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {mockTrainingStats.byCategory.roleSpecific.compliant} of {mockTrainingStats.byCategory.roleSpecific.total} completed
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Optional Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-semibold">
                {Math.round((mockTrainingStats.byCategory.optional.completed / mockTrainingStats.byCategory.optional.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(mockTrainingStats.byCategory.optional.completed / mockTrainingStats.byCategory.optional.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {mockTrainingStats.byCategory.optional.completed} of {mockTrainingStats.byCategory.optional.total} completed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Urgent: Requires Immediate Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockCaregiverTrainings
              .filter(t => t.status === 'expired')
              .map(training => (
                <div
                  key={training.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-red-900">{training.caregiverName}</div>
                    <div className="text-sm text-red-700">{training.trainingName} - Expired</div>
                  </div>
                  <button className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                    Reassign Training
                  </button>
                </div>
              ))}
            {mockCaregiverTrainings.filter(t => t.status === 'expired').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No overdue trainings - great job!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Training Sessions</CardTitle>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTrainingSessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    session.sessionType === 'online' ? 'bg-blue-100' :
                    session.sessionType === 'in_person' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <span className="text-xl">
                      {session.sessionType === 'online' ? '💻' :
                       session.sessionType === 'in_person' ? '🏫' : '🔄'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{session.trainingName}</div>
                    <div className="text-sm text-gray-500">
                      {session.scheduledDate} • {session.scheduledTime}
                    </div>
                    {session.location && (
                      <div className="text-xs text-gray-400">{session.location}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {session.enrolled}/{session.capacity} enrolled
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${(session.enrolled / session.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Training Assignments</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Track caregiver training progress</p>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
              <option value="due_soon">Due Soon</option>
              <option value="expired">Expired</option>
            </select>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              + Assign Training
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Caregiver</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Training</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Due Date</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Expiration</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filterTrainings(mockCaregiverTrainings).map(training => {
                  const daysUntil = training.expirationDate ? getDaysUntilDue(training.expirationDate) : null;
                  return (
                    <tr key={training.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {training.caregiverName}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {training.trainingName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                          {training.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {training.dueDate}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {training.score !== null ? (
                          <span className={`font-semibold ${training.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                            {training.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {training.expirationDate ? (
                          <span className={`text-sm ${
                            daysUntil && daysUntil < 30 ? 'text-yellow-600 font-medium' :
                            daysUntil && daysUntil < 0 ? 'text-red-600 font-medium' : 'text-gray-600'
                          }`}>
                            {training.expirationDate}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {training.status === 'not_started' && (
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            Send Reminder
                          </button>
                        )}
                        {training.status === 'expired' && (
                          <button className="text-sm text-red-600 hover:text-red-800">
                            Reassign
                          </button>
                        )}
                        {training.status === 'completed' && training.certificateUrl && (
                          <button className="text-sm text-green-600 hover:text-green-800">
                            View Cert
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Training Sessions</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockTrainingSessions.map(session => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{session.trainingName}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session.sessionType === 'online' ? 'bg-blue-100 text-blue-800' :
                  session.sessionType === 'in_person' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {session.sessionType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📅</span>
                  <span>{session.scheduledDate} • {session.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">⏱️</span>
                  <span>{session.duration}</span>
                </div>
                {session.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">📍</span>
                    <span>{session.location}</span>
                  </div>
                )}
                {session.instructor && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">👤</span>
                    <span>{session.instructor}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Enrollment</span>
                    <span className="text-sm font-medium">{session.enrolled}/{session.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        session.enrolled >= session.capacity ? 'bg-red-500' :
                        session.enrolled >= session.capacity * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((session.enrolled / session.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Enroll Caregiver
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                    View Details
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ohio Training Requirements</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Required trainings based on ODH, ODA, DODD, and OSHA regulations
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Training</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Required For</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Renewal</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">In-Person</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ohioTrainingRequirements.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{req.name}</div>
                      <div className="text-xs text-gray-500">{req.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(req.category)}`}>
                        {req.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {req.requiredFor.map(role => (
                          <span key={role} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {role.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {req.renewalPeriodMonths ? `${req.renewalPeriodMonths} months` : 'One-time'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {req.inPersonRequired ? (
                        <span className="text-green-600">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">Online OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                        {req.source.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompliance = () => {
    // Group trainings by caregiver
    const caregiverMap = new Map<string, CaregiverTraining[]>();
    mockCaregiverTrainings.forEach(t => {
      if (!caregiverMap.has(t.caregiverId)) {
        caregiverMap.set(t.caregiverId, []);
      }
      caregiverMap.get(t.caregiverId)!.push(t);
    });

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Compliance Report by Caregiver</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Training completion status for each team member</p>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export Report
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from(caregiverMap.entries()).map(([caregiverId, trainings]) => {
                const completed = trainings.filter(t => t.status === 'completed').length;
                const total = trainings.length;
                const complianceRate = Math.round((completed / total) * 100);
                const hasExpired = trainings.some(t => t.status === 'expired');
                const hasDueSoon = trainings.some(t => t.status === 'due_soon');

                return (
                  <div key={caregiverId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          hasExpired ? 'bg-red-100' : complianceRate === 100 ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          <span className={`font-semibold ${
                            hasExpired ? 'text-red-600' : complianceRate === 100 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {trainings[0].caregiverName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{trainings[0].caregiverName}</div>
                          <div className="text-sm text-gray-500">
                            {completed} of {total} trainings complete
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          hasExpired ? 'text-red-600' : complianceRate === 100 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {complianceRate}%
                        </div>
                        {hasExpired && (
                          <span className="text-xs text-red-600 font-medium">Has Expired</span>
                        )}
                        {!hasExpired && hasDueSoon && (
                          <span className="text-xs text-yellow-600 font-medium">Renewal Due Soon</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trainings.map(t => (
                        <span
                          key={t.id}
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(t.status)}`}
                          title={t.trainingName}
                        >
                          {t.trainingName.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
          <p className="text-gray-600 mt-1">
            Track and manage caregiver training compliance
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Send Bulk Reminders
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Schedule Training
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'assignments' && renderAssignments()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'requirements' && renderRequirements()}
      {activeTab === 'compliance' && renderCompliance()}
    </div>
  );
}
