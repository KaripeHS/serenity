import { loggerService } from '../shared/services/logger.service';

/**
 * Scheduler Dashboard Service
 * Daily operations management with real-time scheduling and field coordination
 */

export interface ScheduledVisit {
  id: string;
  patientId: string;
  patientName: string;
  patientAddress: string;
  caregiverId: string;
  caregiverName: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  priority: 'high' | 'medium' | 'low';
  travelTime: number;
  mileage: number;
}

export interface StaffAvailability {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: string;
  nextAvailable?: string;
  skillsMatch: string[];
  utilizationRate: number;
}

export interface SchedulingMetrics {
  totalVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  noShows: number;
  utilizationRate: number;
  averageTravelTime: number;
  costPerVisit: number;
}

export interface RouteOptimization {
  caregiverId: string;
  caregiverName: string;
  totalMiles: number;
  totalTime: number;
  fuelCost: number;
  efficiency: number;
  visits: ScheduledVisit[];
  optimizationSuggestions: string[];
}

class SchedulerDashboardService {
  async getTodaysSchedule(): Promise<ScheduledVisit[]> {
    await this.delay(500);
    return [
      {
        id: '1',
        patientId: '1',
        patientName: 'Eleanor Johnson',
        patientAddress: '123 Oak Street, Columbus, OH',
        caregiverId: '1',
        caregiverName: 'Maria Rodriguez',
        startTime: '09:00',
        endTime: '11:00',
        serviceType: 'Personal Care',
        status: 'scheduled',
        priority: 'high',
        travelTime: 15,
        mileage: 8.5
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Robert Smith',
        patientAddress: '456 Pine Avenue, Dublin, OH',
        caregiverId: '2',
        caregiverName: 'David Chen',
        startTime: '10:30',
        endTime: '12:00',
        serviceType: 'Physical Therapy',
        status: 'in-progress',
        priority: 'medium',
        travelTime: 20,
        mileage: 12.3
      },
      {
        id: '3',
        patientId: '3',
        patientName: 'Mary Williams',
        patientAddress: '789 Elm Drive, Westerville, OH',
        caregiverId: '1',
        caregiverName: 'Maria Rodriguez',
        startTime: '14:00',
        endTime: '15:30',
        serviceType: 'Medication Management',
        status: 'scheduled',
        priority: 'high',
        travelTime: 25,
        mileage: 15.7
      }
    ];
  }

  async getStaffAvailability(): Promise<StaffAvailability[]> {
    await this.delay(400);
    return [
      {
        id: '1',
        name: 'Maria Rodriguez',
        role: 'Senior Caregiver',
        status: 'busy',
        currentLocation: 'Eleanor Johnson residence',
        nextAvailable: '11:15',
        skillsMatch: ['Personal Care', 'Medication Management'],
        utilizationRate: 87
      },
      {
        id: '2',
        name: 'David Chen',
        role: 'Physical Therapist',
        status: 'busy',
        currentLocation: 'Robert Smith residence',
        nextAvailable: '12:15',
        skillsMatch: ['Physical Therapy', 'Mobility Training'],
        utilizationRate: 92
      },
      {
        id: '3',
        name: 'Lisa Rodriguez',
        role: 'Home Health Aide',
        status: 'available',
        skillsMatch: ['Personal Care', 'Companionship'],
        utilizationRate: 75
      }
    ];
  }

  async getSchedulingMetrics(): Promise<SchedulingMetrics> {
    await this.delay(600);
    return {
      totalVisits: 127,
      completedVisits: 94,
      cancelledVisits: 5,
      noShows: 3,
      utilizationRate: 87.3,
      averageTravelTime: 18.5,
      costPerVisit: 85.50
    };
  }

  async getRouteOptimizations(): Promise<RouteOptimization[]> {
    await this.delay(700);
    return [
      {
        caregiverId: '1',
        caregiverName: 'Maria Rodriguez',
        totalMiles: 45.2,
        totalTime: 480,
        fuelCost: 18.50,
        efficiency: 92,
        visits: [
          {
            id: '1',
            patientId: '1',
            patientName: 'Eleanor Johnson',
            patientAddress: '123 Oak Street, Columbus, OH',
            caregiverId: '1',
            caregiverName: 'Maria Rodriguez',
            startTime: '09:00',
            endTime: '11:00',
            serviceType: 'Personal Care',
            status: 'scheduled',
            priority: 'high',
            travelTime: 15,
            mileage: 8.5
          }
        ],
        optimizationSuggestions: [
          'Combine visits in Westerville area',
          'Consider alternate route via I-270'
        ]
      }
    ];
  }

  async scheduleVisit(visit: Partial<ScheduledVisit>): Promise<ScheduledVisit> {
    await this.delay(800);
    return {
      id: Date.now().toString(),
      patientId: visit.patientId!,
      patientName: visit.patientName!,
      patientAddress: visit.patientAddress!,
      caregiverId: visit.caregiverId!,
      caregiverName: visit.caregiverName!,
      startTime: visit.startTime!,
      endTime: visit.endTime!,
      serviceType: visit.serviceType!,
      status: 'scheduled',
      priority: visit.priority || 'medium',
      travelTime: 20,
      mileage: 10
    };
  }

  async updateVisitStatus(visitId: string, status: ScheduledVisit['status']): Promise<void> {
    await this.delay(300);
    loggerService.info(`Visit ${visitId} status updated to ${status}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const schedulerDashboardService = new SchedulerDashboardService();