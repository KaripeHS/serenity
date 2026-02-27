import { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DocumentTextIcon,
  PrinterIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useHiringFormData, useEmployeeList } from './useHiringFormData';
import { GatePipelineTracker } from './GatePipelineTracker';
import {
  getHiringFormsForRole,
  getHiringFormBySlug,
  GATE_DEFINITIONS,
  type HiringFormDefinition,
  type HiringFormStatus,
} from './hiring-form-registry';

const STATUS_BADGES: Record<HiringFormStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  signed: { label: 'Signed', className: 'bg-emerald-100 text-emerald-800' },
};

export default function ApplicationPackageHub() {
  const navigate = useNavigate();
  const { employees, loading: employeesLoading } = useEmployeeList();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'nurse' | 'caregiver'>('caregiver');
  const [activeFormSlug, setActiveFormSlug] = useState<string | null>(null);

  const {
    applicantData,
    getFormStatus,
    getGateStatus,
    getConditionalEmploymentInfo,
    getOverallCompletion,
  } = useHiringFormData(selectedEmployeeId);

  const forms = getHiringFormsForRole(selectedRole);
  const completion = getOverallCompletion(selectedRole);
  const conditionalEmployment = getConditionalEmploymentInfo();

  // Group forms by gate
  const formsByGate = GATE_DEFINITIONS.map(gateDef => ({
    ...gateDef,
    forms: forms.filter(f => f.gate === gateDef.gate),
  })).filter(g => g.forms.length > 0);

  const selectedEmployee = employees.find(e => e.value === selectedEmployeeId);

  // Store selected employee in localStorage so form components can read it (they receive no props)
  if (selectedEmployeeId) {
    localStorage.setItem('serenity_hiring_current_employee', selectedEmployeeId);
  }

  // If a form is active, render it
  if (activeFormSlug && selectedEmployeeId) {
    const formDef = getHiringFormBySlug(activeFormSlug);
    if (formDef) {
      const FormComponent = formDef.component;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveFormSlug(null)}>
              <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Package
            </Button>
          </div>
          <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
            <FormComponent />
          </Suspense>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Application Package</h1>
        <p className="text-sm text-gray-500 mt-1">
          Digitized hiring forms with auto-population, 7-gate pipeline tracking, and audit trail
        </p>
      </div>

      {/* ── Employee Selector + Role Toggle ── */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Employee
              </label>
              <select
                id="employee-select"
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose an employee...</option>
                {employees.map(emp => (
                  <option key={emp.value} value={emp.value}>
                    {emp.label} — {emp.role}
                    {emp.hireDate ? ` (Hired: ${emp.hireDate})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRole('caregiver')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedRole === 'caregiver'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Caregiver ({getHiringFormsForRole('caregiver').length})
                </button>
                <button
                  onClick={() => setSelectedRole('nurse')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedRole === 'nurse'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Nurse ({getHiringFormsForRole('nurse').length})
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedEmployeeId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Select an employee to view their application package</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Gate Pipeline Tracker ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Hiring Pipeline — 7 Gates</CardTitle>
                <Badge className={completion.percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                  {completion.completed}/{completion.total} forms ({completion.percentage}%)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <GatePipelineTracker
                role={selectedRole}
                getGateStatus={getGateStatus}
                conditionalEmployment={conditionalEmployment}
              />
            </CardContent>
          </Card>

          {/* ── Overall Progress Bar ── */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${completion.percentage === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          {/* ── Forms by Gate ── */}
          {formsByGate.map(gateGroup => {
            const gateStatus = getGateStatus(gateGroup.gate, selectedRole);
            return (
              <Card key={gateGroup.gate}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        gateStatus.complete
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-500 border border-gray-300'
                      }`}>
                        {gateStatus.complete ? <CheckCircleIcon className="w-4 h-4" /> : gateGroup.gate}
                      </div>
                      <CardTitle className="text-sm">
                        Gate {gateGroup.gate}: {gateGroup.name}
                      </CardTitle>
                    </div>
                    <span className="text-xs text-gray-400">
                      {gateStatus.completed}/{gateStatus.total} complete
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 ml-9">{gateGroup.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gateGroup.forms.map(form => {
                      const status = getFormStatus(form.slug);
                      const badgeInfo = STATUS_BADGES[status.status];
                      return (
                        <button
                          key={form.slug}
                          onClick={() => setActiveFormSlug(form.slug)}
                          className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
                        >
                          <div className="flex items-start gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400 font-mono">{form.id}</span>
                                <Badge className={`text-[9px] px-1.5 py-0 ${badgeInfo.className}`}>
                                  {badgeInfo.label}
                                </Badge>
                              </div>
                              <div className="text-sm font-medium text-gray-800 mt-0.5 truncate">
                                {form.title}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                                {form.description}
                              </div>
                              {status.completedAt && (
                                <div className="text-[10px] text-gray-400 mt-1">
                                  {status.completedBy} — {new Date(status.completedAt).toLocaleDateString()}
                                </div>
                              )}
                              {form.isHROnly && (
                                <Badge variant="default" className="mt-1 text-[8px] bg-purple-50 text-purple-600 px-1 py-0">
                                  HR Only
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* ── Print Package Button ── */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print Full Package
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
