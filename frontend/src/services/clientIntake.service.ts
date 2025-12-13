// Client Intake Service - Manages client intake workflow

export interface ClientIntakeData {
  // Step 1: Basic Information
  basicInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    ssn?: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    preferredLanguage: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  };

  // Step 2: Contact Information
  contact: {
    address: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
      county: string;
    };
    phone: string;
    altPhone?: string;
    email?: string;
    preferredContactMethod: 'phone' | 'email' | 'text' | 'mail';
  };

  // Step 3: Emergency Contact & Responsible Party
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPowerOfAttorney: boolean;
    isResponsibleParty: boolean;
  };

  // Step 4: Insurance & Payer Information
  insurance: {
    primaryPayer: {
      type: 'medicaid' | 'medicare' | 'private_pay' | 'private_insurance' | 'va' | 'other';
      medicaidId?: string;
      medicareId?: string;
      insuranceCarrier?: string;
      policyNumber?: string;
      groupNumber?: string;
      authorizationRequired: boolean;
    };
    secondaryPayer?: {
      type: 'medicaid' | 'medicare' | 'private_pay' | 'private_insurance' | 'va' | 'other';
      policyNumber?: string;
    };
    waiverProgram?: 'passport' | 'mycare' | 'choices' | 'dodd_individual_options' | 'dodd_level_one' | 'none';
    caseManagerName?: string;
    caseManagerPhone?: string;
  };

  // Step 5: Service Needs Assessment
  serviceNeeds: {
    requestedServices: Array<'personal_care' | 'homemaker' | 'respite' | 'companion' | 'errands' | 'transportation'>;
    preferredSchedule: {
      frequency: 'daily' | 'weekly' | 'multiple_per_week' | 'monthly' | 'as_needed';
      preferredDays: string[];
      preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'overnight' | 'flexible';
      estimatedHoursPerWeek: number;
    };
    specialRequirements?: string;
    caregiverPreferences?: {
      genderPreference?: 'male' | 'female' | 'no_preference';
      languagePreference?: string;
      otherRequirements?: string;
    };
  };

  // Step 6: Medical Information
  medical: {
    primaryPhysician?: {
      name: string;
      phone: string;
      fax?: string;
    };
    diagnoses: string[];
    allergies: string[];
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    mobilityStatus: 'independent' | 'uses_assistive_device' | 'wheelchair' | 'bedbound';
    cognitiveStatus: 'oriented' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
    specialMedicalEquipment?: string[];
    dietaryRestrictions?: string[];
  };

  // Step 7: Home Environment
  homeEnvironment: {
    homeType: 'house' | 'apartment' | 'assisted_living' | 'group_home' | 'other';
    livesAlone: boolean;
    otherResidents?: string;
    pets?: string;
    accessibility: {
      hasStairs: boolean;
      hasRamp: boolean;
      hasBedOnFirstFloor: boolean;
      hasWalkInShower: boolean;
      parkingAvailable: boolean;
    };
    safetyHazards?: string;
    smokingInHome: boolean;
  };

  // Step 8: Consent & Documents
  consents: {
    hipaaConsent: boolean;
    hipaaSignedDate?: string;
    serviceAgreement: boolean;
    serviceAgreementDate?: string;
    photoRelease: boolean;
    advanceDirectivesOnFile: boolean;
    backgroundCheckAuthorization: boolean;
    emergencyProtocol: boolean;
  };

  // Metadata
  metadata: {
    referralSource?: 'hospital' | 'physician' | 'case_manager' | 'self' | 'family' | 'marketing' | 'other';
    referralName?: string;
    intakeDate: string;
    intakeCompletedBy: string;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'waitlist';
    notes?: string;
  };
}

export interface IntakeValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

export interface IntakeSummary {
  id: string;
  clientName: string;
  dateOfBirth: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'waitlist';
  intakeDate: string;
  primaryPayer: string;
  requestedServices: string[];
  estimatedHours: number;
  completedSteps: number;
  totalSteps: number;
  assignedCaseManager?: string;
}

const API_BASE = '/api/v1';

class ClientIntakeService {
  // Get all intakes with filtering
  async getIntakes(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ intakes: IntakeSummary[]; stats: { total: number; pending: number; approved: number; draft: number } }> {
    // Mock data for development
    return {
      intakes: [
        {
          id: '1',
          clientName: 'Dorothy Williams',
          dateOfBirth: '1945-03-15',
          status: 'pending_review',
          intakeDate: '2024-03-10',
          primaryPayer: 'Medicaid - PASSPORT',
          requestedServices: ['personal_care', 'homemaker'],
          estimatedHours: 20,
          completedSteps: 8,
          totalSteps: 8,
          assignedCaseManager: 'Sarah Johnson'
        },
        {
          id: '2',
          clientName: 'Robert Thompson',
          dateOfBirth: '1938-07-22',
          status: 'draft',
          intakeDate: '2024-03-12',
          primaryPayer: 'Private Pay',
          requestedServices: ['personal_care'],
          estimatedHours: 15,
          completedSteps: 4,
          totalSteps: 8
        },
        {
          id: '3',
          clientName: 'Helen Martinez',
          dateOfBirth: '1952-11-08',
          status: 'approved',
          intakeDate: '2024-03-05',
          primaryPayer: 'Medicare + Medicaid',
          requestedServices: ['personal_care', 'homemaker', 'respite'],
          estimatedHours: 30,
          completedSteps: 8,
          totalSteps: 8,
          assignedCaseManager: 'Mike Chen'
        },
        {
          id: '4',
          clientName: 'James Brown',
          dateOfBirth: '1960-04-30',
          status: 'waitlist',
          intakeDate: '2024-03-08',
          primaryPayer: 'DODD - Individual Options',
          requestedServices: ['personal_care', 'respite', 'companion'],
          estimatedHours: 40,
          completedSteps: 8,
          totalSteps: 8
        }
      ],
      stats: {
        total: 4,
        pending: 1,
        approved: 1,
        draft: 1
      }
    };
  }

  // Get single intake by ID
  async getIntake(id: string): Promise<ClientIntakeData | null> {
    // Mock complete intake data
    return {
      basicInfo: {
        firstName: 'Dorothy',
        lastName: 'Williams',
        dateOfBirth: '1945-03-15',
        gender: 'female',
        preferredLanguage: 'English',
        maritalStatus: 'widowed'
      },
      contact: {
        address: {
          street1: '123 Oak Street',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43215',
          county: 'Franklin'
        },
        phone: '614-555-1234',
        preferredContactMethod: 'phone'
      },
      emergencyContact: {
        name: 'Mary Williams-Smith',
        relationship: 'Daughter',
        phone: '614-555-5678',
        isPowerOfAttorney: true,
        isResponsibleParty: true
      },
      insurance: {
        primaryPayer: {
          type: 'medicaid',
          medicaidId: 'OH123456789',
          authorizationRequired: true
        },
        waiverProgram: 'passport',
        caseManagerName: 'Lisa Thompson',
        caseManagerPhone: '614-555-9999'
      },
      serviceNeeds: {
        requestedServices: ['personal_care', 'homemaker'],
        preferredSchedule: {
          frequency: 'multiple_per_week',
          preferredDays: ['Monday', 'Wednesday', 'Friday'],
          preferredTimeOfDay: 'morning',
          estimatedHoursPerWeek: 20
        },
        caregiverPreferences: {
          genderPreference: 'female',
          languagePreference: 'English'
        }
      },
      medical: {
        primaryPhysician: {
          name: 'Dr. Robert Chen',
          phone: '614-555-7777'
        },
        diagnoses: ['Type 2 Diabetes', 'Hypertension', 'Mild Cognitive Impairment'],
        allergies: ['Penicillin', 'Shellfish'],
        medications: [
          { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
          { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' }
        ],
        mobilityStatus: 'uses_assistive_device',
        cognitiveStatus: 'mild_impairment'
      },
      homeEnvironment: {
        homeType: 'house',
        livesAlone: true,
        pets: 'Small dog - Bella',
        accessibility: {
          hasStairs: false,
          hasRamp: true,
          hasBedOnFirstFloor: true,
          hasWalkInShower: true,
          parkingAvailable: true
        },
        smokingInHome: false
      },
      consents: {
        hipaaConsent: true,
        hipaaSignedDate: '2024-03-10',
        serviceAgreement: true,
        serviceAgreementDate: '2024-03-10',
        photoRelease: false,
        advanceDirectivesOnFile: true,
        backgroundCheckAuthorization: true,
        emergencyProtocol: true
      },
      metadata: {
        referralSource: 'case_manager',
        referralName: 'Lisa Thompson - ODA',
        intakeDate: '2024-03-10',
        intakeCompletedBy: 'Sarah Johnson',
        status: 'pending_review',
        notes: 'Client prefers female caregiver. Has morning routine needs.'
      }
    };
  }

  // Create new intake
  async createIntake(data: Partial<ClientIntakeData>): Promise<{ id: string; success: boolean }> {
    console.log('Creating intake:', data);
    return { id: 'new-intake-id', success: true };
  }

  // Update existing intake
  async updateIntake(id: string, data: Partial<ClientIntakeData>): Promise<{ success: boolean }> {
    console.log('Updating intake:', id, data);
    return { success: true };
  }

  // Update intake status
  async updateIntakeStatus(id: string, status: ClientIntakeData['metadata']['status'], notes?: string): Promise<{ success: boolean }> {
    console.log('Updating status:', id, status, notes);
    return { success: true };
  }

  // Validate intake data
  validateIntake(data: Partial<ClientIntakeData>): IntakeValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Required field validation
    if (!data.basicInfo?.firstName) {
      errors.push({ field: 'basicInfo.firstName', message: 'First name is required' });
    }
    if (!data.basicInfo?.lastName) {
      errors.push({ field: 'basicInfo.lastName', message: 'Last name is required' });
    }
    if (!data.basicInfo?.dateOfBirth) {
      errors.push({ field: 'basicInfo.dateOfBirth', message: 'Date of birth is required' });
    }
    if (!data.contact?.address?.street1) {
      errors.push({ field: 'contact.address.street1', message: 'Address is required' });
    }
    if (!data.contact?.phone) {
      errors.push({ field: 'contact.phone', message: 'Phone number is required' });
    }
    if (!data.emergencyContact?.name) {
      errors.push({ field: 'emergencyContact.name', message: 'Emergency contact is required' });
    }
    if (!data.insurance?.primaryPayer?.type) {
      errors.push({ field: 'insurance.primaryPayer.type', message: 'Primary payer is required' });
    }

    // Medicaid-specific validation
    if (data.insurance?.primaryPayer?.type === 'medicaid' && !data.insurance.primaryPayer.medicaidId) {
      errors.push({ field: 'insurance.primaryPayer.medicaidId', message: 'Medicaid ID is required for Medicaid payers' });
    }

    // Consent validation
    if (!data.consents?.hipaaConsent) {
      errors.push({ field: 'consents.hipaaConsent', message: 'HIPAA consent is required' });
    }
    if (!data.consents?.serviceAgreement) {
      errors.push({ field: 'consents.serviceAgreement', message: 'Service agreement is required' });
    }

    // Warnings
    if (!data.medical?.primaryPhysician) {
      warnings.push({ field: 'medical.primaryPhysician', message: 'Primary physician information is recommended' });
    }
    if (!data.medical?.diagnoses || data.medical.diagnoses.length === 0) {
      warnings.push({ field: 'medical.diagnoses', message: 'Medical diagnoses should be documented' });
    }
    if (!data.emergencyContact?.phone) {
      warnings.push({ field: 'emergencyContact.phone', message: 'Emergency contact phone is recommended' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get step completion status
  getStepCompletion(data: Partial<ClientIntakeData>): { step: number; name: string; complete: boolean }[] {
    return [
      { step: 1, name: 'Basic Information', complete: !!(data.basicInfo?.firstName && data.basicInfo?.lastName && data.basicInfo?.dateOfBirth) },
      { step: 2, name: 'Contact Information', complete: !!(data.contact?.address?.street1 && data.contact?.phone) },
      { step: 3, name: 'Emergency Contact', complete: !!(data.emergencyContact?.name && data.emergencyContact?.phone) },
      { step: 4, name: 'Insurance & Payer', complete: !!(data.insurance?.primaryPayer?.type) },
      { step: 5, name: 'Service Needs', complete: !!(data.serviceNeeds?.requestedServices?.length && data.serviceNeeds?.preferredSchedule) },
      { step: 6, name: 'Medical Information', complete: !!(data.medical?.mobilityStatus && data.medical?.cognitiveStatus) },
      { step: 7, name: 'Home Environment', complete: !!(data.homeEnvironment?.homeType && data.homeEnvironment?.accessibility) },
      { step: 8, name: 'Consents', complete: !!(data.consents?.hipaaConsent && data.consents?.serviceAgreement) }
    ];
  }

  // Ohio county list for dropdown
  getOhioCounties(): string[] {
    return [
      'Adams', 'Allen', 'Ashland', 'Ashtabula', 'Athens', 'Auglaize', 'Belmont', 'Brown',
      'Butler', 'Carroll', 'Champaign', 'Clark', 'Clermont', 'Clinton', 'Columbiana',
      'Coshocton', 'Crawford', 'Cuyahoga', 'Darke', 'Defiance', 'Delaware', 'Erie',
      'Fairfield', 'Fayette', 'Franklin', 'Fulton', 'Gallia', 'Geauga', 'Greene',
      'Guernsey', 'Hamilton', 'Hancock', 'Hardin', 'Harrison', 'Henry', 'Highland',
      'Hocking', 'Holmes', 'Huron', 'Jackson', 'Jefferson', 'Knox', 'Lake', 'Lawrence',
      'Licking', 'Logan', 'Lorain', 'Lucas', 'Madison', 'Mahoning', 'Marion', 'Medina',
      'Meigs', 'Mercer', 'Miami', 'Monroe', 'Montgomery', 'Morgan', 'Morrow', 'Muskingum',
      'Noble', 'Ottawa', 'Paulding', 'Perry', 'Pickaway', 'Pike', 'Portage', 'Preble',
      'Putnam', 'Richland', 'Ross', 'Sandusky', 'Scioto', 'Seneca', 'Shelby', 'Stark',
      'Summit', 'Trumbull', 'Tuscarawas', 'Union', 'Van Wert', 'Vinton', 'Warren',
      'Washington', 'Wayne', 'Williams', 'Wood', 'Wyandot'
    ];
  }

  // Waiver programs available in Ohio
  getWaiverPrograms(): { code: string; name: string; description: string; administeredBy: string }[] {
    return [
      { code: 'passport', name: 'PASSPORT', description: 'Home and community-based services for adults 60+', administeredBy: 'ODA' },
      { code: 'mycare', name: 'MyCare Ohio', description: 'Integrated Medicare-Medicaid plan', administeredBy: 'ODA/ODM' },
      { code: 'choices', name: 'Choices', description: 'Consumer-directed home care option', administeredBy: 'ODA' },
      { code: 'dodd_individual_options', name: 'Individual Options (IO)', description: 'DD waiver for individuals with disabilities', administeredBy: 'DODD' },
      { code: 'dodd_level_one', name: 'Level One', description: 'DD waiver for lower support needs', administeredBy: 'DODD' },
      { code: 'none', name: 'No Waiver', description: 'Private pay or other funding', administeredBy: 'N/A' }
    ];
  }

  // Service types with descriptions
  getServiceTypes(): { code: string; name: string; description: string; requiresRN: boolean }[] {
    return [
      { code: 'personal_care', name: 'Personal Care', description: 'Bathing, dressing, grooming, toileting assistance', requiresRN: false },
      { code: 'homemaker', name: 'Homemaker', description: 'Light housekeeping, laundry, meal preparation', requiresRN: false },
      { code: 'respite', name: 'Respite Care', description: 'Temporary relief for family caregivers', requiresRN: false },
      { code: 'companion', name: 'Companion', description: 'Supervision, socialization, safety monitoring', requiresRN: false },
      { code: 'errands', name: 'Errands', description: 'Shopping, pharmacy pickup, appointments', requiresRN: false },
      { code: 'transportation', name: 'Transportation', description: 'Medical and non-medical transportation', requiresRN: false }
    ];
  }
}

export const clientIntakeService = new ClientIntakeService();
export default clientIntakeService;
