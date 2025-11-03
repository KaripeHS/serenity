import { loggerService } from '../shared/services/logger.service';

/**
 * Family Portal Service
 * Handles family engagement, visit updates, and communication
 */

export interface Visit {
  id: string;
  patientName: string;
  caregiverName: string;
  date: string;
  time: string;
  duration: number;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  services: string[];
  notes?: string;
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
}

export interface BillingInfo {
  id: string;
  patientName: string;
  serviceDate: string;
  description: string;
  amount: number;
  insurance: string;
  status: 'paid' | 'pending' | 'denied';
}

class FamilyPortalService {
  // production data for demonstration
  private visits: Visit[] = [
    {
      id: '1',
      patientName: 'Eleanor Johnson',
      caregiverName: 'Maria Rodriguez',
      date: '2024-01-15',
      time: '09:00',
      duration: 120,
      status: 'completed',
      services: ['Personal Care', 'Medication Management'],
      notes: 'Patient was in good spirits. Medication taken on schedule.'
    },
    {
      id: '2',
      patientName: 'Eleanor Johnson',
      caregiverName: 'David Chen',
      date: '2024-01-16',
      time: '14:00',
      duration: 90,
      status: 'scheduled',
      services: ['Physical Therapy', 'Mobility Assistance']
    }
  ];

  private careTeam: CareTeamMember[] = [
    {
      id: '1',
      name: 'Dr. Sarah Williams',
      role: 'Primary Physician',
      phone: '(555) 123-4567',
      email: 'sarah.williams@serenitycare.com'
    },
    {
      id: '2',
      name: 'Maria Rodriguez',
      role: 'Primary Caregiver',
      phone: '(555) 234-5678',
      email: 'maria.rodriguez@serenitycare.com'
    },
    {
      id: '3',
      name: 'David Chen',
      role: 'Physical Therapist',
      phone: '(555) 345-6789',
      email: 'david.chen@serenitycare.com'
    }
  ];

  private messages: Message[] = [
    {
      id: '1',
      from: 'Maria Rodriguez',
      to: 'Family',
      subject: 'Weekly Care Update',
      content: 'Eleanor had a great week. She\'s been very responsive to therapy and her medication schedule is stable.',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      urgent: false
    }
  ];

  private billingInfo: BillingInfo[] = [
    {
      id: '1',
      patientName: 'Eleanor Johnson',
      serviceDate: '2024-01-15',
      description: 'Personal Care Services',
      amount: 145.00,
      insurance: 'Medicare',
      status: 'paid'
    }
  ];

  async getRecentVisits(_patientId: string): Promise<Visit[]> {
    // Simulate API call
    await this.delay(500);
    return this.visits;
  }

  async getUpcomingVisits(_patientId: string): Promise<Visit[]> {
    // Simulate API call
    await this.delay(500);
    return this.visits.filter(v => v.status === 'scheduled');
  }

  async getCareTeam(_patientId: string): Promise<CareTeamMember[]> {
    // Simulate API call
    await this.delay(300);
    return this.careTeam;
  }

  async getMessages(_familyId: string): Promise<Message[]> {
    // Simulate API call
    await this.delay(400);
    return this.messages;
  }

  async sendMessage(to: string, subject: string, content: string): Promise<void> {
    // Simulate API call
    await this.delay(600);
    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'Family',
      to,
      subject,
      content,
      timestamp: new Date().toISOString(),
      read: true,
      urgent: false
    };
    this.messages.push(newMessage);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    // Simulate API call
    await this.delay(200);
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
    }
  }

  async getBillingInformation(_patientId: string): Promise<BillingInfo[]> {
    // Simulate API call
    await this.delay(500);
    return this.billingInfo;
  }

  async requestVisitUpdate(visitId: string, message: string): Promise<void> {
    // Simulate API call
    await this.delay(800);
    loggerService.info(`Visit update requested for ${visitId}: ${message}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const familyPortalService = new FamilyPortalService();