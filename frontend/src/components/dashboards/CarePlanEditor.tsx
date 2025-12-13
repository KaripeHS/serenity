import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  mockCarePlans,
  serviceCodeOptions,
  goalCategories,
  getStatusColor,
  getGoalStatusColor,
  calculateAuthorizationUsage,
  getAuthorizationStatus,
  CarePlan,
  CarePlanService,
  CareGoal
} from '../../services/carePlan.service';

type TabType = 'overview' | 'services' | 'team' | 'goals' | 'history';

export function CarePlanEditor() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(mockCarePlans[0]?.id || null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  const selectedPlan = mockCarePlans.find(p => p.id === selectedPlanId);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'team', label: 'Care Team' },
    { id: 'goals', label: 'Goals' },
    { id: 'history', label: 'History' }
  ];

  const renderPlanList = () => (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Care Plans</CardTitle>
        <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + New Plan
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mockCarePlans.map(plan => {
            const authUsage = calculateAuthorizationUsage(plan.authorization);
            const authStatus = getAuthorizationStatus(plan.authorization);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedPlanId === plan.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-gray-900">{plan.clientName}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                    {plan.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{plan.payer.name}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        authStatus === 'critical' ? 'bg-red-500' :
                        authStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${authUsage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{authUsage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderOverview = () => {
    if (!selectedPlan) return null;

    const authUsage = calculateAuthorizationUsage(selectedPlan.authorization);
    const authStatus = getAuthorizationStatus(selectedPlan.authorization);

    return (
      <div className="space-y-6">
        {/* Authorization Status */}
        <Card className={`border-l-4 ${
          authStatus === 'critical' ? 'border-l-red-500' :
          authStatus === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
        }`}>
          <CardHeader>
            <CardTitle className="text-lg">Authorization Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Auth Number</div>
                <div className="font-medium">{selectedPlan.authorization.number}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Period</div>
                <div className="font-medium">
                  {selectedPlan.authorization.startDate} - {selectedPlan.authorization.endDate}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Units Used</div>
                <div className="font-medium">
                  {selectedPlan.authorization.unitsUsed} / {selectedPlan.authorization.unitsAuthorized} {selectedPlan.authorization.unitType}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Remaining</div>
                <div className={`font-medium ${authStatus === 'critical' ? 'text-red-600' : ''}`}>
                  {selectedPlan.authorization.unitsAuthorized - selectedPlan.authorization.unitsUsed} {selectedPlan.authorization.unitType}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  authStatus === 'critical' ? 'bg-red-500' :
                  authStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${authUsage}%` }}
              />
            </div>
            {authStatus === 'critical' && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                Warning: Authorization is {authUsage}% used. Request renewal soon.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client & Payer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Client Name</div>
                  <div className="font-medium">{selectedPlan.clientName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Plan Period</div>
                  <div className="font-medium">
                    {selectedPlan.effectiveDate} - {selectedPlan.expirationDate}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPlan.status)}`}>
                    {selectedPlan.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Payer</div>
                  <div className="font-medium">{selectedPlan.payer.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type</div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    {selectedPlan.payer.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{selectedPlan.services.length}</div>
              <div className="text-sm text-gray-500">Active Services</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{selectedPlan.careTeam.length}</div>
              <div className="text-sm text-gray-500">Care Team Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {selectedPlan.goals.filter(g => g.status === 'achieved').length}/{selectedPlan.goals.length}
              </div>
              <div className="text-sm text-gray-500">Goals Achieved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-700">
                {new Date(selectedPlan.updatedAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">Last Updated</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderServices = () => {
    if (!selectedPlan) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Authorized Services</h3>
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Service
          </button>
        </div>

        {selectedPlan.services.map(service => (
          <Card key={service.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                      {service.serviceCode}
                    </span>
                    <span className="font-medium text-gray-900">{service.serviceName}</span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Frequency</div>
                  <div className="font-medium">{service.frequency}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-medium">{service.duration}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Required Credentials</div>
                  <div className="flex flex-wrap gap-1">
                    {service.requiresCredential.length > 0 ? (
                      service.requiresCredential.map(cred => (
                        <span key={cred} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                          {cred}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Instructions</div>
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                  {service.instructions}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {selectedPlan.services.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No services added yet. Click "Add Service" to get started.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderCareTeam = () => {
    if (!selectedPlan) return null;

    const roleLabels: Record<string, string> = {
      primary_caregiver: 'Primary Caregiver',
      backup_caregiver: 'Backup Caregiver',
      care_coordinator: 'Care Coordinator',
      nurse: 'Nurse',
      family_contact: 'Family Contact'
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Care Team</h3>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            + Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPlan.careTeam.map(member => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    member.isPrimary ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <span className={`text-xl ${member.isPrimary ? 'text-blue-600' : 'text-gray-600'}`}>
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      {member.isPrimary && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{roleLabels[member.role]}</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="text-gray-600">{member.phone}</div>
                      <div className="text-gray-600">{member.email}</div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">
                    Edit
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan.careTeam.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No care team members assigned yet.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderGoals = () => {
    if (!selectedPlan) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Care Goals</h3>
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Goal
          </button>
        </div>

        {selectedPlan.goals.map(goal => {
          const category = goalCategories.find(c => c.id === goal.category);

          return (
            <Card key={goal.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      goal.category === 'adl' ? 'bg-blue-100 text-blue-800' :
                      goal.category === 'iadl' ? 'bg-purple-100 text-purple-800' :
                      goal.category === 'safety' ? 'bg-red-100 text-red-800' :
                      goal.category === 'social' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {category?.name || goal.category}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                    {goal.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="font-medium text-gray-900 mb-2">{goal.description}</div>
                  <div className="text-sm text-gray-500">Target: {goal.targetDate}</div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        goal.status === 'achieved' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {goal.notes && (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                    {goal.notes}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Update Progress
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-800">
                    Edit Goal
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {selectedPlan.goals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No care goals defined yet.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    if (!selectedPlan) return null;

    const historyEvents = [
      { date: selectedPlan.updatedAt, action: 'Plan updated', user: 'Jennifer Adams' },
      { date: selectedPlan.approvedAt || '', action: 'Plan approved', user: selectedPlan.approvedBy || '' },
      { date: selectedPlan.createdAt, action: 'Plan created', user: selectedPlan.createdBy }
    ].filter(e => e.date);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historyEvents.map((event, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{event.action}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleString()} by {event.user}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Care Plan Editor</h1>
          <p className="text-gray-600 mt-1">
            Manage client care plans, services, and goals
          </p>
        </div>
        {selectedPlan && (
          <div className="flex gap-2">
            {selectedPlan.status === 'draft' && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Submit for Approval
              </button>
            )}
            {selectedPlan.status === 'pending_approval' && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Approve Plan
              </button>
            )}
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Print Plan
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Plan List Sidebar */}
        <div className="lg:col-span-1">
          {renderPlanList()}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedPlan ? (
            <>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
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
              {activeTab === 'services' && renderServices()}
              {activeTab === 'team' && renderCareTeam()}
              {activeTab === 'goals' && renderGoals()}
              {activeTab === 'history' && renderHistory()}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Select a care plan from the list or create a new one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
