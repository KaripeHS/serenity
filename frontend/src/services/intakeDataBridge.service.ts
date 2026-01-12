/**
 * Intake Data Bridge Service
 *
 * Links Client Intake and Patient Intake Workflow to enable:
 * - Auto-population of Patient Intake from completed Client Intake
 * - Data synchronization between forms
 * - Reduction of duplicate data entry
 */

// Client Intake data structure (from ClientIntakeWizard)
export interface ClientIntakeData {
  id?: string;
  status?: string;

  // Step 1: Basic Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  ssn4?: string;
  preferredLanguage: string;
  maritalStatus?: string;

  // Step 2: Contact Information
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  primaryPhone: string;
  alternatePhone?: string;
  email?: string;
  preferredContact: string;

  // Step 3: Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail?: string;
  hasPowerOfAttorney?: boolean;
  isResponsibleParty?: boolean;

  // Step 4: Insurance
  primaryPayerType: string;
  medicaidId?: string;
  medicareId?: string;
  insuranceCarrier?: string;
  policyNumber?: string;
  groupNumber?: string;
  waiverProgram?: string;
  caseManagerName?: string;
  caseManagerPhone?: string;
  authorizationRequired?: boolean;

  // Step 5: Service Needs
  requestedServices: string[];
  scheduleFrequency?: string;
  preferredDays?: string[];
  preferredTimeOfDay?: string;
  estimatedHoursPerWeek?: number;
  specialRequirements?: string;
  caregiverGenderPreference?: string;
  caregiverLanguagePreference?: string;

  // Step 6: Medical Information
  primaryPhysicianName?: string;
  primaryPhysicianPhone?: string;
  primaryPhysicianFax?: string;
  diagnoses: string[];
  allergies: string[];
  medications: Array<{ name: string; dosage: string; frequency: string }>;
  mobilityStatus?: string;
  cognitiveStatus?: string;
  specialEquipment?: string[];
  dietaryRestrictions?: string[];

  // Step 7: Home Environment
  homeType?: string;
  livingSituation?: string;
  hasPets?: boolean;
  petDetails?: string;
  smokingInHome?: boolean;
  accessibilityFeatures?: string[];
  safetyHazards?: string;
  safetyConcerns?: string;

  // Step 8: Consents
  hipaaConsent: boolean;
  serviceAgreement: boolean;
  photoVideoRelease?: boolean;
  advanceDirectivesOnFile?: boolean;
  backgroundCheckAuthorization?: boolean;
  emergencyProtocolAcknowledgment?: boolean;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
}

// Patient Intake Demographics structure
export interface PatientDemographics {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: string;
  ssn?: string;
  maritalStatus?: string;
  language: string;
  race?: string;
  ethnicity?: string;
  religion?: string;

  // Contact
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
  };

  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPowerOfAttorney?: boolean;
    isResponsibleParty?: boolean;
  };
}

// Patient Intake Insurance structure
export interface PatientInsurance {
  primaryInsurance: {
    type: string;
    carrier?: string;
    policyNumber?: string;
    groupNumber?: string;
    medicaidId?: string;
    medicareId?: string;
    eligibilityVerified?: boolean;
    priorAuthRequired?: boolean;
  };
  waiverProgram?: string;
  caseManager?: {
    name?: string;
    phone?: string;
  };
}

// Patient Intake Clinical Assessment structure
export interface PatientAssessment {
  diagnoses: Array<{ code?: string; description: string; primary?: boolean }>;
  allergies: Array<{ allergen: string; reaction?: string; severity?: string }>;
  medications: Array<{ name: string; dosage: string; frequency: string; prescriber?: string }>;
  mobilityStatus?: string;
  cognitiveStatus?: string;
  specialEquipment?: string[];
  dietaryRestrictions?: string[];

  // ADL Assessment (to be completed during clinical intake)
  adlAssessment?: {
    bathing?: string;
    dressing?: string;
    toileting?: string;
    transferring?: string;
    eating?: string;
    continence?: string;
  };
}

// Patient Intake Physician Orders structure
export interface PatientPhysicianOrders {
  physician: {
    name?: string;
    phone?: string;
    fax?: string;
    npi?: string;
  };
  diagnoses: Array<{ code?: string; description: string }>;
  // Orders to be added during clinical intake
}

// Patient Intake Care Plan structure
export interface PatientCarePlan {
  requestedServices: string[];
  schedulePreferences: {
    frequency?: string;
    preferredDays?: string[];
    preferredTimeOfDay?: string;
    estimatedHoursPerWeek?: number;
  };
  specialRequirements?: string;
  caregiverPreferences: {
    gender?: string;
    language?: string;
    other?: string;
  };
  homeEnvironment: {
    homeType?: string;
    livingSituation?: string;
    hasPets?: boolean;
    petDetails?: string;
    smokingInHome?: boolean;
    accessibilityFeatures?: string[];
    safetyHazards?: string;
    safetyConcerns?: string;
  };
}

// Full Patient Intake data structure
export interface PatientIntakeData {
  patientId: string;
  clientIntakeId?: string; // Link back to Client Intake
  patientName: string;
  clientCode?: string;
  admissionDate: string;
  referralSource?: string;
  status: string;
  overallProgress: number;

  // Pre-populated from Client Intake
  demographics?: PatientDemographics;
  insurance?: PatientInsurance;
  assessment?: PatientAssessment;
  physicianOrders?: PatientPhysicianOrders;
  carePlan?: PatientCarePlan;

  // To be completed during Patient Intake
  caregiverAssignment?: any;
  serviceAuthorization?: any;
  firstVisit?: any;

  // Metadata
  prePopulatedFrom?: 'client_intake';
  prePopulatedAt?: string;
  steps?: any[];
}

/**
 * Maps Client Intake data to Patient Intake structure
 * This enables auto-population of Patient Intake forms
 */
export function mapClientIntakeToPatientIntake(
  clientIntake: Partial<ClientIntakeData>,
  patientId?: string
): PatientIntakeData {
  const now = new Date().toISOString();
  const id = patientId || `patient_${Date.now()}`;

  return {
    patientId: id,
    clientIntakeId: clientIntake.id,
    patientName: `${clientIntake.firstName || ''} ${clientIntake.lastName || ''}`.trim() || 'New Patient',
    clientCode: 'Pending',
    admissionDate: now.split('T')[0],
    referralSource: clientIntake.waiverProgram || 'Client Intake',
    status: 'in_progress',
    overallProgress: 0,

    demographics: {
      firstName: clientIntake.firstName || '',
      lastName: clientIntake.lastName || '',
      dateOfBirth: clientIntake.dateOfBirth || '',
      gender: clientIntake.gender || '',
      ssn: clientIntake.ssn4 ? `***-**-${clientIntake.ssn4}` : undefined,
      maritalStatus: clientIntake.maritalStatus,
      language: clientIntake.preferredLanguage || 'English',

      phone: clientIntake.primaryPhone || '',
      alternatePhone: clientIntake.alternatePhone,
      email: clientIntake.email,
      address: {
        street1: clientIntake.street1 || '',
        street2: clientIntake.street2,
        city: clientIntake.city || '',
        state: clientIntake.state || '',
        zipCode: clientIntake.zipCode || '',
        county: clientIntake.county,
      },

      emergencyContact: {
        name: clientIntake.emergencyContactName || '',
        relationship: clientIntake.emergencyContactRelationship || '',
        phone: clientIntake.emergencyContactPhone || '',
        email: clientIntake.emergencyContactEmail,
        isPowerOfAttorney: clientIntake.hasPowerOfAttorney,
        isResponsibleParty: clientIntake.isResponsibleParty,
      },
    },

    insurance: {
      primaryInsurance: {
        type: clientIntake.primaryPayerType || '',
        carrier: clientIntake.insuranceCarrier,
        policyNumber: clientIntake.policyNumber,
        groupNumber: clientIntake.groupNumber,
        medicaidId: clientIntake.medicaidId,
        medicareId: clientIntake.medicareId,
        eligibilityVerified: false,
        priorAuthRequired: clientIntake.authorizationRequired,
      },
      waiverProgram: clientIntake.waiverProgram,
      caseManager: {
        name: clientIntake.caseManagerName,
        phone: clientIntake.caseManagerPhone,
      },
    },

    assessment: {
      diagnoses: (clientIntake.diagnoses || []).map((d, i) => ({
        description: d,
        primary: i === 0,
      })),
      allergies: (clientIntake.allergies || []).map(a => ({
        allergen: a,
      })),
      medications: clientIntake.medications || [],
      mobilityStatus: clientIntake.mobilityStatus,
      cognitiveStatus: clientIntake.cognitiveStatus,
      specialEquipment: clientIntake.specialEquipment,
      dietaryRestrictions: clientIntake.dietaryRestrictions,
    },

    physicianOrders: {
      physician: {
        name: clientIntake.primaryPhysicianName,
        phone: clientIntake.primaryPhysicianPhone,
        fax: clientIntake.primaryPhysicianFax,
      },
      diagnoses: (clientIntake.diagnoses || []).map(d => ({
        description: d,
      })),
    },

    carePlan: {
      requestedServices: clientIntake.requestedServices || [],
      schedulePreferences: {
        frequency: clientIntake.scheduleFrequency,
        preferredDays: clientIntake.preferredDays,
        preferredTimeOfDay: clientIntake.preferredTimeOfDay,
        estimatedHoursPerWeek: clientIntake.estimatedHoursPerWeek,
      },
      specialRequirements: clientIntake.specialRequirements,
      caregiverPreferences: {
        gender: clientIntake.caregiverGenderPreference,
        language: clientIntake.caregiverLanguagePreference,
      },
      homeEnvironment: {
        homeType: clientIntake.homeType,
        livingSituation: clientIntake.livingSituation,
        hasPets: clientIntake.hasPets,
        petDetails: clientIntake.petDetails,
        smokingInHome: clientIntake.smokingInHome,
        accessibilityFeatures: clientIntake.accessibilityFeatures,
        safetyHazards: clientIntake.safetyHazards,
        safetyConcerns: clientIntake.safetyConcerns,
      },
    },

    prePopulatedFrom: 'client_intake',
    prePopulatedAt: now,

    steps: generateIntakeSteps(),
  };
}

/**
 * Generate the 8 intake steps with pre-population tracking
 */
function generateIntakeSteps() {
  return [
    {
      id: 1,
      title: 'Patient Demographics',
      description: 'Basic patient information, contact details, and emergency contacts',
      status: 'not_started',
      prePopulated: true,
      prePopulatedFields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'address', 'emergencyContact'],
      estimatedTime: '10-15 min',
      requiredFields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'address', 'emergencyContact'],
      completedFields: 0,
      totalFields: 7,
    },
    {
      id: 2,
      title: 'Insurance Verification',
      description: 'Insurance coverage, Medicaid/Medicare eligibility, and authorizations',
      status: 'not_started',
      prePopulated: true,
      prePopulatedFields: ['insuranceType', 'policyNumber', 'medicaidId', 'medicareId'],
      estimatedTime: '15-20 min',
      assignedTo: 'Billing Team',
      requiredFields: ['insuranceType', 'policyNumber', 'groupNumber', 'eligibilityVerified', 'priorAuth'],
      completedFields: 0,
      totalFields: 5,
    },
    {
      id: 3,
      title: 'Clinical Assessment',
      description: 'Comprehensive assessment including ADLs, IADLs, functional status',
      status: 'not_started',
      prePopulated: true,
      prePopulatedFields: ['diagnoses', 'allergies', 'medications', 'mobilityStatus', 'cognitiveStatus'],
      estimatedTime: '45-60 min',
      assignedTo: 'Clinical Team',
      requiredFields: ['adlAssessment', 'iadlAssessment', 'cognitiveStatus', 'physicalStatus', 'riskAssessment'],
      completedFields: 0,
      totalFields: 5,
    },
    {
      id: 4,
      title: 'Physician Orders',
      description: 'Physician orders, diagnoses, and treatment plan',
      status: 'not_started',
      prePopulated: true,
      prePopulatedFields: ['physicianName', 'physicianPhone', 'diagnoses'],
      estimatedTime: '1-2 days',
      requiredFields: ['physicianName', 'npi', 'diagnoses', 'orders', 'faceToFaceDate'],
      completedFields: 0,
      totalFields: 5,
    },
    {
      id: 5,
      title: 'Care Plan Development',
      description: 'Individualized care plan based on assessment and physician orders',
      status: 'not_started',
      prePopulated: true,
      prePopulatedFields: ['requestedServices', 'schedulePreferences', 'caregiverPreferences', 'homeEnvironment'],
      estimatedTime: '30-45 min',
      requiredFields: ['goals', 'interventions', 'serviceSchedule', 'emergencyPlan'],
      completedFields: 0,
      totalFields: 4,
    },
    {
      id: 6,
      title: 'Caregiver Assignment',
      description: 'Match and assign qualified caregivers based on patient needs',
      status: 'not_started',
      prePopulated: false,
      estimatedTime: '15-30 min',
      requiredFields: ['primaryCaregiver', 'backupCaregiver', 'introductionDate'],
      completedFields: 0,
      totalFields: 3,
    },
    {
      id: 7,
      title: 'Service Authorization',
      description: 'Service authorization from payer and approved hours/services',
      status: 'not_started',
      prePopulated: false,
      estimatedTime: '3-5 days',
      assignedTo: 'Authorization Team',
      requiredFields: ['authNumber', 'approvedServices', 'approvedHours', 'authPeriod'],
      completedFields: 0,
      totalFields: 4,
    },
    {
      id: 8,
      title: 'First Visit Scheduling',
      description: 'Schedule and confirm first home visit with assigned caregiver',
      status: 'not_started',
      prePopulated: false,
      estimatedTime: '10 min',
      requiredFields: ['visitDate', 'visitTime', 'caregiverConfirmed', 'patientNotified'],
      completedFields: 0,
      totalFields: 4,
    },
  ];
}

/**
 * Calculate field completion for pre-populated data
 */
export function calculatePrePopulatedCompletion(
  patientIntake: PatientIntakeData
): { stepId: number; completedFields: number; totalFields: number }[] {
  const results: { stepId: number; completedFields: number; totalFields: number }[] = [];

  // Step 1: Demographics
  const demo = patientIntake.demographics;
  let demoComplete = 0;
  if (demo?.firstName) demoComplete++;
  if (demo?.lastName) demoComplete++;
  if (demo?.dateOfBirth) demoComplete++;
  if (demo?.gender) demoComplete++;
  if (demo?.phone) demoComplete++;
  if (demo?.address?.street1 && demo?.address?.city && demo?.address?.state && demo?.address?.zipCode) demoComplete++;
  if (demo?.emergencyContact?.name && demo?.emergencyContact?.phone) demoComplete++;
  results.push({ stepId: 1, completedFields: demoComplete, totalFields: 7 });

  // Step 2: Insurance
  const ins = patientIntake.insurance;
  let insComplete = 0;
  if (ins?.primaryInsurance?.type) insComplete++;
  if (ins?.primaryInsurance?.policyNumber || ins?.primaryInsurance?.medicaidId || ins?.primaryInsurance?.medicareId) insComplete++;
  results.push({ stepId: 2, completedFields: insComplete, totalFields: 5 });

  // Step 3: Assessment (partial pre-population)
  const assess = patientIntake.assessment;
  let assessComplete = 0;
  if (assess?.diagnoses && assess.diagnoses.length > 0) assessComplete++;
  if (assess?.medications && assess.medications.length > 0) assessComplete++;
  results.push({ stepId: 3, completedFields: assessComplete, totalFields: 5 });

  // Step 4: Physician Orders (partial)
  const orders = patientIntake.physicianOrders;
  let ordersComplete = 0;
  if (orders?.physician?.name) ordersComplete++;
  if (orders?.diagnoses && orders.diagnoses.length > 0) ordersComplete++;
  results.push({ stepId: 4, completedFields: ordersComplete, totalFields: 5 });

  // Step 5: Care Plan (partial)
  const care = patientIntake.carePlan;
  let careComplete = 0;
  if (care?.requestedServices && care.requestedServices.length > 0) careComplete++;
  results.push({ stepId: 5, completedFields: careComplete, totalFields: 4 });

  // Steps 6-8 have no pre-population
  results.push({ stepId: 6, completedFields: 0, totalFields: 3 });
  results.push({ stepId: 7, completedFields: 0, totalFields: 4 });
  results.push({ stepId: 8, completedFields: 0, totalFields: 4 });

  return results;
}

/**
 * Store pre-populated Patient Intake data in localStorage
 */
export function storePatientIntakeFromClientIntake(
  clientIntake: Partial<ClientIntakeData>,
  patientId?: string
): PatientIntakeData {
  const patientIntake = mapClientIntakeToPatientIntake(clientIntake, patientId);

  // Calculate initial completion
  const completionData = calculatePrePopulatedCompletion(patientIntake);

  // Update steps with completion data
  patientIntake.steps = patientIntake.steps?.map(step => {
    const completion = completionData.find(c => c.stepId === step.id);
    return {
      ...step,
      completedFields: completion?.completedFields || 0,
      status: (completion?.completedFields || 0) > 0 ? 'in_progress' : 'not_started',
    };
  });

  // Calculate overall progress
  const totalCompleted = completionData.reduce((sum, c) => sum + c.completedFields, 0);
  const totalFields = completionData.reduce((sum, c) => sum + c.totalFields, 0);
  patientIntake.overallProgress = Math.round((totalCompleted / totalFields) * 100);

  // Store in localStorage
  const storageKey = `intake_${patientIntake.patientId}`;
  localStorage.setItem(storageKey, JSON.stringify(patientIntake));

  // Also store the mapping for reference
  if (clientIntake.id) {
    const mappingKey = `client_to_patient_${clientIntake.id}`;
    localStorage.setItem(mappingKey, patientIntake.patientId);
  }

  return patientIntake;
}

/**
 * Get Patient Intake ID from Client Intake ID
 */
export function getPatientIdFromClientIntake(clientIntakeId: string): string | null {
  return localStorage.getItem(`client_to_patient_${clientIntakeId}`);
}

/**
 * Check if a Client Intake has been converted to Patient Intake
 */
export function hasPatientIntake(clientIntakeId: string): boolean {
  return !!getPatientIdFromClientIntake(clientIntakeId);
}

/**
 * Get the full Patient Intake data from localStorage
 */
export function getPatientIntakeData(patientId: string): PatientIntakeData | null {
  const data = localStorage.getItem(`intake_${patientId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Export for use in components
 */
export const intakeDataBridge = {
  mapClientIntakeToPatientIntake,
  calculatePrePopulatedCompletion,
  storePatientIntakeFromClientIntake,
  getPatientIdFromClientIntake,
  hasPatientIntake,
  getPatientIntakeData,
};

export default intakeDataBridge;
