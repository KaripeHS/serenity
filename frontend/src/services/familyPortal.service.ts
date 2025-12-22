import { loggerService } from '../shared/services/logger.service';
import { shouldUseMockData } from '../config/environment';

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
  private visits: Visit[] = [];
  private careTeam: CareTeamMember[] = [];
  private messages: Message[] = [];
  private billingInfo: BillingInfo[] = [];

  async getRecentVisits(_patientId: string): Promise<Visit[]> {
    return [];
  }

  async getUpcomingVisits(_patientId: string): Promise<Visit[]> {
    return [];
  }

  async getCareTeam(_patientId: string): Promise<CareTeamMember[]> {
    return [];
  }

  async getMessages(_familyId: string): Promise<Message[]> {
    return [];
  }

  async sendMessage(to: string, subject: string, content: string): Promise<void> {
    // No-op for production
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    // No-op for production
  }

  async getBillingInformation(_patientId: string): Promise<BillingInfo[]> {
    return [];
  }

  async requestVisitUpdate(visitId: string, message: string): Promise<void> {
    loggerService.info(`Visit update requested for ${visitId}: ${message}`);
  }
}

export const familyPortalService = new FamilyPortalService();