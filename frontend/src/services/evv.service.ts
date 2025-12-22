import { shouldUseMockData } from '../config/environment';

/**
 * EVV (Electronic Visit Verification) Service
 * Ohio Medicaid compliance and visit tracking
 */

export interface EVVRecord {
  id: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  caregiverName: string;
  serviceDate: string;
  clockIn: string;
  clockOut?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  services: string[];
  status: 'in-progress' | 'completed' | 'verified' | 'flagged';
  complianceScore: number;
}

export interface EVVValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingElements: string[];
}

class EVVService {
  async clockIn(patientId: string, caregiverId: string, location: any, services: string[]): Promise<EVVRecord> {
    return {
      id: '',
      patientId: '',
      patientName: '',
      caregiverId: '',
      caregiverName: '',
      serviceDate: '',
      clockIn: '',
      location: { latitude: 0, longitude: 0, address: '' },
      services: [],
      status: 'in-progress',
      complianceScore: 0
    };
  }

  async clockOut(recordId: string): Promise<EVVRecord> {
    return {
      id: '',
      patientId: '',
      patientName: '',
      caregiverId: '',
      caregiverName: '',
      serviceDate: '',
      clockIn: '',
      clockOut: '',
      location: { latitude: 0, longitude: 0, address: '' },
      services: [],
      status: 'completed',
      complianceScore: 0
    };
  }

  async validateEVV(record: EVVRecord): Promise<EVVValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingElements: string[] = [];

    // Validate 6 required EVV elements for Ohio Medicaid
    if (!record.patientId) missingElements.push('Patient ID');
    if (!record.caregiverId) missingElements.push('Caregiver ID');
    if (!record.clockIn) missingElements.push('Clock In Time');
    if (!record.location) missingElements.push('Service Location');
    if (!record.services.length) missingElements.push('Services Provided');
    if (record.status === 'completed' && !record.clockOut) missingElements.push('Clock Out Time');

    if (missingElements.length > 0) {
      errors.push(`Missing required EVV elements: ${missingElements.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingElements
    };
  }

  async getTodaysEVVRecords(): Promise<EVVRecord[]> {
    return [];
  }
}

export const evvService = new EVVService();