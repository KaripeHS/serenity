import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi, authApi } from '@/services/api';
import type { Caregiver, Client, Pod } from '@/services/api';
import { clientIntakeService } from '@/services/clientIntake.service';
import type { ClientIntakeData } from '@/services/clientIntake.service';
import { carePlanService } from '@/services/carePlan.service';
import type { CarePlan, CareGoal, CarePlanService as CarePlanSvc, CareTeamMember } from '@/services/carePlan.service';
import { credentialService } from '@/services/credential.service';
import type { Credential } from '@/services/credential.service';
import { backgroundCheckService } from '@/services/backgroundCheck.service';
import type { BackgroundCheck } from '@/services/backgroundCheck.service';
import { trainingService } from '@/services/training.service';
import type { CaregiverTraining } from '@/services/training.service';

export interface EmployeeOption {
  value: string;
  label: string;
  role: string;
  podCode: string;
}

export interface ClientOption {
  value: string;
  label: string;
  medicaidNumber?: string;
  podName?: string;
}

export interface PodOption {
  value: string;
  label: string;
}

// ── HIPAA-scoped return types (minimum necessary per form context) ──

/** Form 04 — Initial Assessment: full intake data for review */
export interface IntakeForAssessment {
  clientName: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  medicaidId: string;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  caseManager: string;
  cmPhone: string;
  referralDate: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string;
  mobilityStatus: string;
  cognitiveStatus: string;
  homeType: string;
  livesAlone: boolean;
  otherResidents: string;
  safetyHazards: string;
  hasStairs: boolean;
  hasRamp: boolean;
  hasBedOnFirstFloor: boolean;
  hasWalkInShower: boolean;
  smokingInHome: boolean;
  schedulePreferences: string;
  caregiverGenderPref: string;
  caregiverLanguagePref: string;
  specialRequirements: string;
  allergies: string;
  medications: string;
  intakeDate: string;
  hipaaConsentSigned: boolean;
}

/** Form 03, 05, 15 — Care plan scoped data */
export interface CarePlanForForm {
  goals: CareGoal[];
  careTeam: CareTeamMember[];
  services: CarePlanSvc[];
  authorization: CarePlan['authorization'] | null;
  status: string;
}

/** Form 11 — Case manager info */
export interface CaseManagerInfo {
  caseManagerName: string;
  caseManagerPhone: string;
  waiverProgram: string;
}

/** Form 20 — BCI data for log auto-generation */
export interface BCILogEntry {
  employeeName: string;
  caregiverId: string;
  checkType: string;
  status: string;
  result: string;
  requestedAt: string;
  completedAt: string;
  expiresAt: string;
  fingerprintDate: string;
  recheckDue: string;
  livedOutsideOhio: boolean;
}

/** Form 17 — Employee credential summary */
export interface EmployeeCredentialRow {
  employeeId: string;
  name: string;
  role: string;
  podCode: string;
  credentials: { type: string; status: string; expirationDate: string; daysLeft: number }[];
}

/** Form 18/19 — Training record for pre-fill */
export interface TrainingScoreEntry {
  trainingName: string;
  trainingId: string;
  status: string;
  score: number | null;
  completedDate: string | null;
  expirationDate: string | null;
}

export function useFormData() {
  const employeesQuery = useQuery({
    queryKey: ['form-data', 'employees'],
    queryFn: () => consoleApi.getCaregivers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const clientsQuery = useQuery({
    queryKey: ['form-data', 'clients'],
    queryFn: async () => {
      const user = await authApi.getCurrentUser();
      return consoleApi.getClients(user.user.organizationId);
    },
    staleTime: 5 * 60 * 1000,
  });

  const podsQuery = useQuery({
    queryKey: ['form-data', 'pods'],
    queryFn: () => consoleApi.getPods(),
    staleTime: 10 * 60 * 1000,
  });

  const currentUserQuery = useQuery({
    queryKey: ['form-data', 'current-user'],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 10 * 60 * 1000,
  });

  const employees: Caregiver[] = employeesQuery.data?.caregivers ?? [];
  const clients: Client[] = clientsQuery.data?.clients ?? [];
  const pods: Pod[] = podsQuery.data?.pods ?? [];
  const currentUser = currentUserQuery.data?.user;

  // ── On-demand caches (fetched per selection, not on form load) ──
  const [intakeCache, setIntakeCache] = useState<Record<string, ClientIntakeData>>({});
  const [carePlanCache, setCarePlanCache] = useState<Record<string, CarePlan | null>>({});
  const [credentialCache, setCredentialCache] = useState<Credential[]>([]);
  const [credentialsFetched, setCredentialsFetched] = useState(false);
  const [bgCheckCache, setBgCheckCache] = useState<BackgroundCheck[]>([]);
  const [bgChecksFetched, setBgChecksFetched] = useState(false);
  const [trainingCache, setTrainingCache] = useState<CaregiverTraining[]>([]);
  const [trainingFetched, setTrainingFetched] = useState(false);

  // ── Basic option getters (existing) ──

  const getEmployeeOptions = (): EmployeeOption[] =>
    employees.map(e => ({
      value: e.id,
      label: `${e.lastName}, ${e.firstName}`,
      role: e.status === 'active' ? (e.certifications?.[0] || 'Staff') : 'Inactive',
      podCode: e.podCode || '',
    }));

  const getClientOptions = (): ClientOption[] =>
    clients.map(c => ({
      value: c.id,
      label: `${c.lastName}, ${c.firstName}`,
      medicaidNumber: c.medicaidNumber,
      podName: c.podName,
    }));

  const getPodOptions = (): PodOption[] =>
    pods.map(p => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }));

  const getEmployeeById = (id: string): Caregiver | undefined =>
    employees.find(e => e.id === id);

  const getClientById = (id: string): Client | undefined =>
    clients.find(c => c.id === id);

  const getCurrentUserName = (): string => {
    if (!currentUser) return '';
    return `${currentUser.firstName} ${currentUser.lastName}`;
  };

  // ── On-demand data fetchers ──

  /** Fetch client intake data (cached per client) */
  const fetchClientIntake = useCallback(async (clientId: string): Promise<ClientIntakeData | null> => {
    if (intakeCache[clientId]) return intakeCache[clientId];
    try {
      const data = await clientIntakeService.getIntake(clientId);
      if (data) {
        setIntakeCache(prev => ({ ...prev, [clientId]: data }));
      }
      return data;
    } catch {
      return null;
    }
  }, [intakeCache]);

  /** Fetch care plan for a client (cached per client) */
  const fetchClientCarePlan = useCallback(async (clientId: string): Promise<CarePlan | null> => {
    if (clientId in carePlanCache) return carePlanCache[clientId];
    try {
      const plan = await carePlanService.getCarePlan(clientId);
      setCarePlanCache(prev => ({ ...prev, [clientId]: plan }));
      return plan;
    } catch {
      return null;
    }
  }, [carePlanCache]);

  /** Fetch all credentials (bulk, cached) */
  const fetchCredentials = useCallback(async (): Promise<Credential[]> => {
    if (credentialsFetched) return credentialCache;
    try {
      const dashboard = await credentialService.getDashboard();
      const all = [
        ...dashboard.alerts.EXPIRED.credentials,
        ...dashboard.alerts.CRITICAL.credentials,
        ...dashboard.alerts.WARNING.credentials,
        ...dashboard.alerts.NOTICE.credentials,
        ...dashboard.alerts.INFO.credentials,
      ];
      setCredentialCache(all);
      setCredentialsFetched(true);
      return all;
    } catch {
      setCredentialsFetched(true);
      return [];
    }
  }, [credentialCache, credentialsFetched]);

  /** Fetch all background checks (bulk, cached) */
  const fetchBackgroundChecks = useCallback(async (): Promise<BackgroundCheck[]> => {
    if (bgChecksFetched) return bgCheckCache;
    try {
      const checks = await backgroundCheckService.getBackgroundChecks();
      setBgCheckCache(checks);
      setBgChecksFetched(true);
      return checks;
    } catch {
      setBgChecksFetched(true);
      return [];
    }
  }, [bgCheckCache, bgChecksFetched]);

  /** Fetch all training assignments (bulk, cached) */
  const fetchTrainingAssignments = useCallback(async (): Promise<CaregiverTraining[]> => {
    if (trainingFetched) return trainingCache;
    try {
      const result = await trainingService.getAssignments();
      setTrainingCache(result.assignments);
      setTrainingFetched(true);
      return result.assignments;
    } catch {
      setTrainingFetched(true);
      return [];
    }
  }, [trainingCache, trainingFetched]);

  // ── HIPAA-scoped getters (minimum necessary per form) ──

  /** Form 04: Map full intake → assessment fields */
  const getIntakeForAssessment = useCallback(async (clientId: string): Promise<IntakeForAssessment | null> => {
    const intake = await fetchClientIntake(clientId);
    if (!intake) return null;

    // HIPAA consent check — if not signed, don't expose medical data
    const hipaaOk = intake.consents?.hipaaConsent ?? false;

    const addr = intake.contact?.address;
    const addressStr = addr
      ? [addr.street1, addr.street2, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')
      : '';

    return {
      clientName: `${intake.basicInfo.firstName} ${intake.basicInfo.lastName}`,
      dateOfBirth: intake.basicInfo.dateOfBirth || '',
      address: addressStr,
      phone: intake.contact?.phone || '',
      medicaidId: intake.insurance?.primaryPayer?.medicaidId || '',
      emergencyContact: intake.emergencyContact?.name || '',
      emergencyPhone: intake.emergencyContact?.phone || '',
      emergencyRelationship: intake.emergencyContact?.relationship || '',
      caseManager: intake.insurance?.caseManagerName || '',
      cmPhone: intake.insurance?.caseManagerPhone || '',
      referralDate: intake.metadata?.intakeDate || '',
      primaryDiagnosis: hipaaOk ? (intake.medical?.diagnoses?.[0] || '') : '',
      secondaryDiagnoses: hipaaOk ? (intake.medical?.diagnoses?.slice(1).join('; ') || '') : '',
      mobilityStatus: hipaaOk ? (intake.medical?.mobilityStatus || '') : '',
      cognitiveStatus: hipaaOk ? (intake.medical?.cognitiveStatus || '') : '',
      homeType: intake.homeEnvironment?.homeType || '',
      livesAlone: intake.homeEnvironment?.livesAlone ?? false,
      otherResidents: intake.homeEnvironment?.otherResidents || '',
      safetyHazards: intake.homeEnvironment?.safetyHazards || '',
      hasStairs: intake.homeEnvironment?.accessibility?.hasStairs ?? false,
      hasRamp: intake.homeEnvironment?.accessibility?.hasRamp ?? false,
      hasBedOnFirstFloor: intake.homeEnvironment?.accessibility?.hasBedOnFirstFloor ?? false,
      hasWalkInShower: intake.homeEnvironment?.accessibility?.hasWalkInShower ?? false,
      smokingInHome: intake.homeEnvironment?.smokingInHome ?? false,
      schedulePreferences: intake.serviceNeeds?.preferredSchedule
        ? `${intake.serviceNeeds.preferredSchedule.preferredDays?.join(', ')} — ${intake.serviceNeeds.preferredSchedule.preferredTimeOfDay}`
        : '',
      caregiverGenderPref: intake.serviceNeeds?.caregiverPreferences?.genderPreference || '',
      caregiverLanguagePref: intake.serviceNeeds?.caregiverPreferences?.languagePreference || '',
      specialRequirements: intake.serviceNeeds?.specialRequirements || '',
      allergies: hipaaOk ? (intake.medical?.allergies?.join(', ') || '') : '',
      medications: hipaaOk
        ? (intake.medical?.medications?.map(m => `${m.name} ${m.dosage} ${m.frequency}`).join('; ') || '')
        : '',
      intakeDate: intake.metadata?.intakeDate || '',
      hipaaConsentSigned: hipaaOk,
    };
  }, [fetchClientIntake]);

  /** Form 03, 05, 15: Care plan goals, services, care team */
  const getCarePlanForForm = useCallback(async (clientId: string): Promise<CarePlanForForm | null> => {
    const plan = await fetchClientCarePlan(clientId);
    if (!plan) return null;
    return {
      goals: plan.goals || [],
      careTeam: plan.careTeam || [],
      services: plan.services || [],
      authorization: plan.authorization || null,
      status: plan.status,
    };
  }, [fetchClientCarePlan]);

  /** Form 11: Case manager info from intake */
  const getCaseManagerInfo = useCallback(async (clientId: string): Promise<CaseManagerInfo | null> => {
    const intake = await fetchClientIntake(clientId);
    if (!intake) return null;
    return {
      caseManagerName: intake.insurance?.caseManagerName || '',
      caseManagerPhone: intake.insurance?.caseManagerPhone || '',
      waiverProgram: intake.insurance?.waiverProgram || '',
    };
  }, [fetchClientIntake]);

  /** Form 06, 01, 14: Client identity from intake (minimal fields) */
  const getClientIdentityFromIntake = useCallback(async (clientId: string): Promise<{
    name: string; dob: string; address: string; medicaidId: string; phone: string;
  } | null> => {
    const intake = await fetchClientIntake(clientId);
    if (!intake) return null;
    const addr = intake.contact?.address;
    return {
      name: `${intake.basicInfo.firstName} ${intake.basicInfo.lastName}`,
      dob: intake.basicInfo.dateOfBirth || '',
      address: addr ? [addr.street1, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ') : '',
      medicaidId: intake.insurance?.primaryPayer?.medicaidId || '',
      phone: intake.contact?.phone || '',
    };
  }, [fetchClientIntake]);

  /** Form 20: Generate BCI log entries from background checks */
  const getBCILogEntries = useCallback(async (): Promise<BCILogEntry[]> => {
    const checks = await fetchBackgroundChecks();
    return checks
      .filter(c => c.checkType === 'bci' || c.checkType === 'bci_fbi' || c.checkType === 'fbi_only')
      .map(c => {
        const completedDate = c.completedAt ? new Date(c.completedAt) : null;
        const recheckDue = completedDate
          ? new Date(completedDate.getTime() + 5 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : '';
        return {
          employeeName: c.caregiverName || c.applicantName || '',
          caregiverId: c.caregiverId || c.employeeId || '',
          checkType: c.checkType,
          status: c.status,
          result: c.result || 'pending_review',
          requestedAt: c.requestedAt?.split('T')[0] || '',
          completedAt: c.completedAt?.split('T')[0] || '',
          expiresAt: c.expiresAt?.split('T')[0] || '',
          fingerprintDate: c.fingerprintDate || '',
          recheckDue,
          livedOutsideOhio: c.livedOutsideOhio5yr ?? false,
        };
      });
  }, [fetchBackgroundChecks]);

  /** Form 17: Generate employee credential rows */
  const getEmployeeCredentialRows = useCallback(async (): Promise<EmployeeCredentialRow[]> => {
    const creds = await fetchCredentials();
    // Group credentials by caregiver
    const byEmployee: Record<string, { name: string; creds: Credential[] }> = {};
    for (const c of creds) {
      if (!c.caregiverId) continue;
      if (!byEmployee[c.caregiverId]) {
        byEmployee[c.caregiverId] = {
          name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.caregiverId,
          creds: [],
        };
      }
      byEmployee[c.caregiverId].creds.push(c);
    }

    // Merge with employee list for role/pod info
    return employees.map(emp => {
      const empCreds = byEmployee[emp.id]?.creds || [];
      return {
        employeeId: emp.id,
        name: `${emp.lastName}, ${emp.firstName}`,
        role: emp.certifications?.[0] || 'Staff',
        podCode: emp.podCode || '',
        credentials: empCreds.map(c => ({
          type: c.credentialType,
          status: c.status,
          expirationDate: c.expirationDate?.split('T')[0] || '',
          daysLeft: c.daysLeft,
        })),
      };
    });
  }, [fetchCredentials, employees]);

  /** Forms 18/19: Get training scores for an employee */
  const getEmployeeTrainingScores = useCallback(async (employeeId: string): Promise<TrainingScoreEntry[]> => {
    const assignments = await fetchTrainingAssignments();
    return assignments
      .filter(a => a.caregiverId === employeeId)
      .map(a => ({
        trainingName: a.trainingName,
        trainingId: a.trainingId,
        status: a.status,
        score: a.score,
        completedDate: a.completedDate,
        expirationDate: a.expirationDate,
      }));
  }, [fetchTrainingAssignments]);

  return {
    // Existing basic data
    employees,
    clients,
    pods,
    currentUser,
    isLoading: employeesQuery.isLoading || clientsQuery.isLoading,
    getEmployeeOptions,
    getClientOptions,
    getPodOptions,
    getEmployeeById,
    getClientById,
    getCurrentUserName,
    // Scoped data getters (HIPAA minimum necessary)
    getIntakeForAssessment,
    getCarePlanForForm,
    getCaseManagerInfo,
    getClientIdentityFromIntake,
    getBCILogEntries,
    getEmployeeCredentialRows,
    getEmployeeTrainingScores,
    // Raw fetchers for custom usage
    fetchClientIntake,
    fetchClientCarePlan,
  };
}
