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
    await this.delay(800);
    return {
      id: Date.now().toString(),
      patientId,
      patientName: 'Eleanor Johnson',
      caregiverId,
      caregiverName: 'Maria Rodriguez',
      serviceDate: new Date().toISOString().split('T')[0],
      clockIn: new Date().toISOString(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: '123 Oak Street, Columbus, OH'
      },
      services,
      status: 'in-progress',
      complianceScore: 100
    };
  }

  async clockOut(recordId: string): Promise<EVVRecord> {
    await this.delay(600);
    return {
      id: recordId,
      patientId: '1',
      patientName: 'Eleanor Johnson',
      caregiverId: '1',
      caregiverName: 'Maria Rodriguez',
      serviceDate: new Date().toISOString().split('T')[0],
      clockIn: new Date(Date.now() - 7200000).toISOString(),
      clockOut: new Date().toISOString(),
      location: {
        latitude: 39.9612,
        longitude: -82.9988,
        address: '123 Oak Street, Columbus, OH'
      },
      services: ['Personal Care', 'Medication Management'],
      status: 'completed',
      complianceScore: 100
    };
  }

  async validateEVV(record: EVVRecord): Promise<EVVValidation> {
    await this.delay(400);

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
    await this.delay(500);
    return [
      {
        id: '1',
        patientId: '1',
        patientName: 'Eleanor Johnson',
        caregiverId: '1',
        caregiverName: 'Maria Rodriguez',
        serviceDate: new Date().toISOString().split('T')[0],
        clockIn: '2024-01-15T09:00:00Z',
        clockOut: '2024-01-15T11:00:00Z',
        location: {
          latitude: 39.9612,
          longitude: -82.9988,
          address: '123 Oak Street, Columbus, OH'
        },
        services: ['Personal Care', 'Medication Management'],
        status: 'verified',
        complianceScore: 100
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const evvService = new EVVService();