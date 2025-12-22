import { loggerService } from '../shared/services/logger.service';
import { shouldUseMockData } from '../config/environment';

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
    return [];
  }

  async getCareTasksForPatient(patientId: string): Promise<CareTask[]> {
    return [];
  }

  async getClinicalAlerts(): Promise<ClinicalAlert[]> {
    return [];
  }

  async completeCareTask(taskId: string, notes?: string): Promise<void> {
    loggerService.info(`Task ${taskId} completed with notes: ${notes}`);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    loggerService.info(`Alert ${alertId} acknowledged`);
  }

  async submitVisitNotes(patientId: string, notes: string): Promise<void> {
    loggerService.info(`Visit notes submitted for patient ${patientId}: ${notes}`);
  }
}

export const caregiverDashboardService = new CaregiverDashboardService();