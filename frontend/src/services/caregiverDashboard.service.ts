import { loggerService } from '../shared/services/logger.service';

/**
 * Caregiver Dashboard Service
 * Field operations, patient care, and clinical management
 */

export interface PatientAssignment {
  id: string;
  patientName: string;
  address: string;
  nextVisit: string;
  serviceType: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface CareTask {
  id: string;
  patientId: string;
  patientName: string;
  task: string;
  category: 'medication' | 'vitals' | 'mobility' | 'personal-care' | 'documentation';
  status: 'pending' | 'completed' | 'skipped';
  dueTime: string;
  notes?: string;
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: 'vital-signs' | 'medication' | 'behavior' | 'safety';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

class CaregiverDashboardService {
  async getTodaysAssignments(): Promise<PatientAssignment[]> {
    await this.delay(500);
    return [
      {
        id: '1',
        patientName: 'Eleanor Johnson',
        address: '123 Oak Street, Columbus, OH',
        nextVisit: '09:00 AM',
        serviceType: 'Personal Care',
        duration: 120,
        status: 'scheduled',
        priority: 'high',
        notes: 'Patient prefers morning medication with breakfast'
      },
      {
        id: '2',
        patientName: 'Robert Smith',
        address: '456 Pine Avenue, Dublin, OH',
        nextVisit: '11:30 AM',
        serviceType: 'Physical Therapy',
        duration: 90,
        status: 'scheduled',
        priority: 'medium'
      },
      {
        id: '3',
        patientName: 'Mary Williams',
        address: '789 Elm Drive, Westerville, OH',
        nextVisit: '02:00 PM',
        serviceType: 'Medication Management',
        duration: 60,
        status: 'scheduled',
        priority: 'high',
        notes: 'Check blood pressure before medication'
      }
    ];
  }

  async getCareTasksForPatient(patientId: string): Promise<CareTask[]> {
    await this.delay(400);
    return [
      {
        id: '1',
        patientId,
        patientName: 'Eleanor Johnson',
        task: 'Check blood pressure',
        category: 'vitals',
        status: 'pending',
        dueTime: '09:15 AM'
      },
      {
        id: '2',
        patientId,
        patientName: 'Eleanor Johnson',
        task: 'Administer morning medications',
        category: 'medication',
        status: 'pending',
        dueTime: '09:30 AM'
      },
      {
        id: '3',
        patientId,
        patientName: 'Eleanor Johnson',
        task: 'Assist with personal hygiene',
        category: 'personal-care',
        status: 'pending',
        dueTime: '10:00 AM'
      }
    ];
  }

  async getClinicalAlerts(): Promise<ClinicalAlert[]> {
    await this.delay(300);
    return [
      {
        id: '1',
        patientId: '1',
        patientName: 'Eleanor Johnson',
        type: 'vital-signs',
        severity: 'high',
        message: 'Blood pressure reading 180/95 - above normal range',
        timestamp: '2024-01-15T08:30:00Z',
        acknowledged: false
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Robert Smith',
        type: 'medication',
        severity: 'medium',
        message: 'Medication refill needed within 3 days',
        timestamp: '2024-01-15T07:45:00Z',
        acknowledged: true
      }
    ];
  }

  async completeCareTask(taskId: string, notes?: string): Promise<void> {
    await this.delay(600);
    loggerService.info(`Task ${taskId} completed with notes: ${notes}`);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.delay(300);
    loggerService.info(`Alert ${alertId} acknowledged`);
  }

  async submitVisitNotes(patientId: string, notes: string): Promise<void> {
    await this.delay(800);
    loggerService.info(`Visit notes submitted for patient ${patientId}: ${notes}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const caregiverDashboardService = new CaregiverDashboardService();