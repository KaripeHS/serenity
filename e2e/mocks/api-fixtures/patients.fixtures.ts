import { randomUUID } from 'crypto';
import { authFixtures } from './auth.fixtures';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    primary: string;
    policyNumber: string;
    groupNumber?: string;
  };
  diagnoses: string[];
  medications: string[];
  allergies: string[];
  status: 'active' | 'inactive' | 'discharged';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarePlan {
  id: string;
  patientId: string;
  serviceType: string;
  adlTasks: string[];
  nurseInstructions?: string;
  safetyPrecautions?: string;
  createdAt: string;
  updatedAt: string;
}

const firstNames = ['Mary', 'Elizabeth', 'Dorothy', 'Helen', 'Margaret', 'Ruth', 'Virginia', 'Doris', 'Mildred', 'Frances'];
const lastNames = ['Client', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const adlTasks = ['Bathing', 'Dressing', 'Medication Reminders', 'Meal Preparation', 'Light Housekeeping', 'Toileting', 'Transfer Assistance'];

export const patientFixtures = {
  // Generate single patient
  generatePatient: (overrides?: Partial<Patient>): Patient => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const birthYear = 1930 + Math.floor(Math.random() * 50);

    return {
      id: randomUUID(),
      firstName,
      lastName,
      dateOfBirth: `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      address: `${Math.floor(Math.random() * 9999)} Oak Street`,
      city: 'Columbus',
      state: 'OH',
      zipCode: '43215',
      phone: `614-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      emergencyContact: {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        relationship: ['Daughter', 'Son', 'Spouse', 'Sibling'][Math.floor(Math.random() * 4)],
        phone: `614-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      },
      insurance: {
        primary: ['Medicare', 'Medicaid', 'Private Insurance'][Math.floor(Math.random() * 3)],
        policyNumber: `MED${Math.random().toString().slice(2, 11)}`,
        groupNumber: `GRP${Math.random().toString().slice(2, 6)}`
      },
      diagnoses: ['Diabetes', 'Hypertension'].slice(0, Math.floor(Math.random() * 2) + 1),
      medications: ['Metformin 500mg', 'Lisinopril 10mg'].slice(0, Math.floor(Math.random() * 2) + 1),
      allergies: Math.random() > 0.5 ? ['Penicillin'] : [],
      status: 'active',
      organizationId: authFixtures.defaultOrgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  // Predefined patients
  maryClient: (): Patient => patientFixtures.generatePatient({
    id: 'patient-mary-001',
    firstName: 'Mary',
    lastName: 'Client',
    dateOfBirth: '1950-05-15',
    address: '456 Oak St',
    phone: '614-555-9876',
    diagnoses: ['Diabetes', 'Hypertension'],
    medications: ['Metformin 500mg', 'Lisinopril 10mg'],
    allergies: ['Penicillin']
  }),

  // Generate list of patients
  activePatients: (count: number = 20): Patient[] => {
    return Array.from({ length: count }, () =>
      patientFixtures.generatePatient({ status: 'active' })
    );
  },

  dischargedPatients: (count: number = 5): Patient[] => {
    return Array.from({ length: count }, () =>
      patientFixtures.generatePatient({ status: 'discharged' })
    );
  },

  // Care plan generators
  generateCarePlan: (patientId: string, overrides?: Partial<CarePlan>): CarePlan => ({
    id: randomUUID(),
    patientId,
    serviceType: 'Personal Care',
    adlTasks: adlTasks.slice(0, Math.floor(Math.random() * 4) + 2),
    nurseInstructions: 'Monitor blood sugar before meals',
    safetyPrecautions: 'Fall risk - use gait belt for transfers',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  // API Response generators
  getPatientsResponse: (params?: { status?: string; search?: string }) => {
    let patients = patientFixtures.activePatients(50);

    if (params?.status) {
      patients = patients.filter(p => p.status === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      patients = patients.filter(p =>
        p.firstName.toLowerCase().includes(search) ||
        p.lastName.toLowerCase().includes(search) ||
        p.phone.includes(search)
      );
    }

    return {
      patients: patients.slice(0, 20),
      total: patients.length,
      limit: 20,
      offset: 0
    };
  },

  getPatientByIdResponse: (patientId: string): { success: boolean; patient: Patient } => ({
    success: true,
    patient: patientFixtures.generatePatient({ id: patientId })
  }),

  createPatientResponse: (patientData: Partial<Patient>): { success: boolean; patient: Patient } => ({
    success: true,
    patient: patientFixtures.generatePatient(patientData)
  }),

  updatePatientResponse: (patientId: string, updates: Partial<Patient>): { success: boolean; patient: Patient } => ({
    success: true,
    patient: patientFixtures.generatePatient({ id: patientId, ...updates })
  }),

  deletePatientResponse: { success: true, message: 'Patient discharged successfully' },

  // Care plan responses
  getCarePlanResponse: (patientId: string): { success: boolean; carePlan: CarePlan } => ({
    success: true,
    carePlan: patientFixtures.generateCarePlan(patientId)
  }),

  createCarePlanResponse: (patientId: string, data: Partial<CarePlan>): { success: boolean; carePlan: CarePlan } => ({
    success: true,
    carePlan: patientFixtures.generateCarePlan(patientId, data)
  }),

  updateCarePlanResponse: (carePlanId: string, patientId: string, updates: Partial<CarePlan>): { success: boolean; carePlan: CarePlan } => ({
    success: true,
    carePlan: patientFixtures.generateCarePlan(patientId, { id: carePlanId, ...updates })
  }),

  // Error responses
  validationError: (field: string) => ({
    error: 'Validation failed',
    message: `${field} is required`,
    details: { [field]: `${field} is required` }
  }),

  patientNotFoundError: {
    error: 'Not found',
    message: 'Patient not found'
  },

  unauthorizedError: {
    error: 'Unauthorized',
    message: 'You do not have permission to access this patient'
  }
};
