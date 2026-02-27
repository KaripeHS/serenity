import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { HIRING_FORM_REGISTRY, getHiringFormsForRole, type HiringFormStatus } from './hiring-form-registry';

export interface SharedApplicantData {
  firstName: string;
  lastName: string;
  middleName: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  positionAppliedFor: string;
  hireDate: string;
  startDate: string;
  wage: string;
  wageType: 'hourly' | 'salary' | '';
  // References from Employment Application
  references: Array<{
    name: string;
    company: string;
    title: string;
    phone: string;
    email: string;
    relationship: string;
  }>;
  // Employment history from Employment Application
  employmentHistory: Array<{
    employer: string;
    address: string;
    phone: string;
    position: string;
    supervisor: string;
    startDate: string;
    endDate: string;
    reasonForLeaving: string;
  }>;
  // Conditional employment tracking (Policy 11)
  conditionalEmploymentStartDate: string;
  bciClearanceDate: string;
  bciExpirationDate: string; // 5 years from clearance
}

const DEFAULT_SHARED_DATA: SharedApplicantData = {
  firstName: '',
  lastName: '',
  middleName: '',
  ssn: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: 'OH',
  zip: '',
  phone: '',
  email: '',
  positionAppliedFor: '',
  hireDate: '',
  startDate: '',
  wage: '',
  wageType: '',
  references: [
    { name: '', company: '', title: '', phone: '', email: '', relationship: '' },
    { name: '', company: '', title: '', phone: '', email: '', relationship: '' },
    { name: '', company: '', title: '', phone: '', email: '', relationship: '' },
  ],
  employmentHistory: [],
  conditionalEmploymentStartDate: '',
  bciClearanceDate: '',
  bciExpirationDate: '',
};

const SHARED_DATA_PREFIX = 'serenity_hiring_applicant_';
const FORM_STATUS_PREFIX = 'serenity_hiring_status_';

function getSharedDataKey(employeeId: string) {
  return `${SHARED_DATA_PREFIX}${employeeId}`;
}

function getFormStatusKey(employeeId: string) {
  return `${FORM_STATUS_PREFIX}${employeeId}`;
}

interface FormCompletionRecord {
  status: HiringFormStatus;
  completedAt: string | null;
  completedBy: string | null;
  signedAt: string | null;
}

function getCurrentUserFromStorage(): string {
  try {
    const stored = localStorage.getItem('serenity_auth_user');
    if (stored) {
      const u = JSON.parse(stored);
      return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown';
    }
  } catch { /* ignore */ }
  return 'Current User';
}

export function useHiringFormData(employeeId: string) {
  const [applicantData, setApplicantData] = useState<SharedApplicantData>(() => {
    if (!employeeId) return DEFAULT_SHARED_DATA;
    try {
      const saved = localStorage.getItem(getSharedDataKey(employeeId));
      if (saved) return { ...DEFAULT_SHARED_DATA, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_SHARED_DATA;
  });

  const [formStatuses, setFormStatuses] = useState<Record<string, FormCompletionRecord>>(() => {
    if (!employeeId) return {};
    try {
      const saved = localStorage.getItem(getFormStatusKey(employeeId));
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {};
  });

  // Reload when employeeId changes
  useEffect(() => {
    if (!employeeId) {
      setApplicantData(DEFAULT_SHARED_DATA);
      setFormStatuses({});
      return;
    }
    try {
      const saved = localStorage.getItem(getSharedDataKey(employeeId));
      if (saved) setApplicantData({ ...DEFAULT_SHARED_DATA, ...JSON.parse(saved) });
      else setApplicantData(DEFAULT_SHARED_DATA);

      const statusSaved = localStorage.getItem(getFormStatusKey(employeeId));
      if (statusSaved) setFormStatuses(JSON.parse(statusSaved));
      else setFormStatuses({});
    } catch {
      setApplicantData(DEFAULT_SHARED_DATA);
      setFormStatuses({});
    }
  }, [employeeId]);

  // Persist shared data changes
  useEffect(() => {
    if (!employeeId) return;
    localStorage.setItem(getSharedDataKey(employeeId), JSON.stringify(applicantData));
  }, [applicantData, employeeId]);

  // Persist form status changes
  useEffect(() => {
    if (!employeeId) return;
    localStorage.setItem(getFormStatusKey(employeeId), JSON.stringify(formStatuses));
  }, [formStatuses, employeeId]);

  const updateSharedField = useCallback(<K extends keyof SharedApplicantData>(
    field: K,
    value: SharedApplicantData[K]
  ) => {
    setApplicantData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMultipleSharedFields = useCallback((updates: Partial<SharedApplicantData>) => {
    setApplicantData(prev => ({ ...prev, ...updates }));
  }, []);

  const markFormStatus = useCallback((formSlug: string, status: HiringFormStatus) => {
    const now = new Date().toISOString();
    const user = getCurrentUserFromStorage();
    setFormStatuses(prev => ({
      ...prev,
      [formSlug]: {
        status,
        completedAt: status === 'completed' || status === 'signed' ? now : prev[formSlug]?.completedAt || null,
        completedBy: status === 'completed' || status === 'signed' ? user : prev[formSlug]?.completedBy || null,
        signedAt: status === 'signed' ? now : prev[formSlug]?.signedAt || null,
      },
    }));
  }, []);

  const getFormStatus = useCallback((formSlug: string): FormCompletionRecord => {
    return formStatuses[formSlug] || { status: 'not_started', completedAt: null, completedBy: null, signedAt: null };
  }, [formStatuses]);

  // Sync completed/signed form to server for audit durability
  const syncFormToServer = useCallback(async (formSlug: string, formData: Record<string, unknown>, signatureData?: unknown) => {
    if (!employeeId) return;
    try {
      await api.post(`/console/hr/hiring-forms/${employeeId}/${formSlug}`, {
        formData,
        signatureData,
        completedAt: new Date().toISOString(),
        completedBy: getCurrentUserFromStorage(),
      });
    } catch {
      // Server sync is best-effort — form is already saved locally
      console.warn(`[HiringForms] Server sync failed for ${formSlug} — data persisted locally`);
    }
  }, [employeeId]);

  // Gate completion calculation
  const getGateStatus = useCallback((gate: number, role: 'nurse' | 'caregiver') => {
    const formsForRole = getHiringFormsForRole(role);
    const gateFormsAll = formsForRole.filter(f => f.gate === gate);

    // Special case: Gate 7 is orientation + probation, not form-based
    if (gate === 7) {
      return { complete: false, total: 1, completed: 0, label: 'Manual verification required' };
    }

    const completed = gateFormsAll.filter(f => {
      const status = formStatuses[f.slug];
      return status?.status === 'completed' || status?.status === 'signed';
    });

    return {
      complete: completed.length >= gateFormsAll.length && gateFormsAll.length > 0,
      total: gateFormsAll.length,
      completed: completed.length,
    };
  }, [formStatuses]);

  // Conditional employment countdown (Policy 11)
  const getConditionalEmploymentInfo = useCallback(() => {
    if (!applicantData.conditionalEmploymentStartDate) return null;
    if (applicantData.bciClearanceDate) return { cleared: true, clearanceDate: applicantData.bciClearanceDate };

    const start = new Date(applicantData.conditionalEmploymentStartDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 60 - daysPassed;
    const alertLevel: 'critical' | 'warning' | 'normal' = daysRemaining <= 5 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'normal';

    return { cleared: false, daysPassed, daysRemaining, alertLevel, startDate: applicantData.conditionalEmploymentStartDate };
  }, [applicantData.conditionalEmploymentStartDate, applicantData.bciClearanceDate]);

  // Overall completion percentage
  const getOverallCompletion = useCallback((role: 'nurse' | 'caregiver') => {
    const formsForRole = getHiringFormsForRole(role);
    const completedCount = formsForRole.filter(f => {
      const status = formStatuses[f.slug];
      return status?.status === 'completed' || status?.status === 'signed';
    }).length;
    return {
      total: formsForRole.length,
      completed: completedCount,
      percentage: formsForRole.length > 0 ? Math.round((completedCount / formsForRole.length) * 100) : 0,
    };
  }, [formStatuses]);

  return {
    applicantData,
    updateSharedField,
    updateMultipleSharedFields,
    markFormStatus,
    getFormStatus,
    syncFormToServer,
    getGateStatus,
    getConditionalEmploymentInfo,
    getOverallCompletion,
    formStatuses,
  };
}

// ── Employee list for the hub page ──
export interface EmployeeOption {
  value: string;
  label: string;
  role: string;
  hireDate?: string;
}

export function useEmployeeList() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<any>('/console/caregivers');
        const list = Array.isArray(data) ? data : data?.caregivers || [];
        setEmployees(list.map((e: any) => ({
          value: e.id,
          label: `${e.firstName} ${e.lastName}`,
          role: e.certifications?.[0] || e.role || 'Staff',
          hireDate: e.hireDate,
        })));
      } catch {
        // Mock data for development
        setEmployees([
          { value: 'emp-001', label: 'Sarah Johnson', role: 'HHA', hireDate: '2024-12-15' },
          { value: 'emp-002', label: 'Michael Chen', role: 'STNA', hireDate: '2025-01-03' },
          { value: 'emp-003', label: 'Lisa Rodriguez', role: 'RN', hireDate: '2025-01-20' },
          { value: 'emp-004', label: 'James Williams', role: 'CNA', hireDate: '2025-02-01' },
          { value: 'emp-005', label: 'Patricia Davis', role: 'LPN', hireDate: '2025-02-10' },
        ]);
      }
      setLoading(false);
    })();
  }, []);

  return { employees, loading };
}
