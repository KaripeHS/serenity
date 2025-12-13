/**
 * Referral CRM Service Tests
 * Tests for lead management, partner tracking, and campaign analytics
 */

import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock database client
const mockQuery = jest.fn() as jest.Mock<any>;
jest.mock('../../database/client', () => ({
  getDbClient: () => ({
    query: mockQuery,
  }),
}));

import { referralCrmService } from '../referral-crm.service';

describe('ReferralCrmService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard metrics for an organization', async () => {
      const mockDashboardData = {
        rows: [{
          total_leads: '50',
          new_leads_this_month: '12',
          qualified_leads: '8',
          conversion_rate: '25.5',
          pipeline_value: '125000',
          active_partners: '15',
          monthly_referrals: '25',
          total_revenue_from_referrals: '450000',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockDashboardData);

      const result = await referralCrmService.getDashboard('org-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(referralCrmService.getDashboard('org-123')).rejects.toThrow();
    });
  });

  describe('createLead', () => {
    const mockLeadData = {
      organizationId: 'org-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '614-555-1234',
      email: 'john.doe@email.com',
      source: 'website',
      serviceInterest: 'Personal Care',
      estimatedValue: 5000,
      notes: 'Interested in daily care',
    };

    it('should create a new lead successfully', async () => {
      const mockResult = {
        rows: [{
          id: 'lead-123',
          ...mockLeadData,
          status: 'new',
          created_at: new Date().toISOString(),
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await referralCrmService.createLead(mockLeadData);

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead status', async () => {
      const mockResult = {
        rows: [{
          id: 'lead-123',
          status: 'qualified',
          updated_at: new Date().toISOString(),
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await referralCrmService.updateLeadStatus(
        'lead-123',
        'qualified',
        'Notes about qualification'
      );

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getLeads', () => {
    it('should return paginated leads', async () => {
      const mockLeads = {
        rows: [
          { id: 'lead-1', first_name: 'John', last_name: 'Doe', status: 'new' },
          { id: 'lead-2', first_name: 'Jane', last_name: 'Smith', status: 'qualified' },
        ],
      };
      const mockCount = { rows: [{ count: '10' }] };

      mockQuery
        .mockResolvedValueOnce(mockLeads)
        .mockResolvedValueOnce(mockCount);

      const result = await referralCrmService.getLeads('org-123', {
        limit: 10,
        offset: 0,
      });

      expect(result.leads).toHaveLength(2);
    });

    it('should filter leads by status', async () => {
      const mockLeads = { rows: [{ id: 'lead-1', status: 'qualified' }] };
      const mockCount = { rows: [{ count: '1' }] };

      mockQuery
        .mockResolvedValueOnce(mockLeads)
        .mockResolvedValueOnce(mockCount);

      const result = await referralCrmService.getLeads('org-123', {
        status: 'qualified',
      });

      expect(result.leads).toHaveLength(1);
      expect(result.leads[0].status).toBe('qualified');
    });
  });

  describe('createPartner', () => {
    const mockPartnerData = {
      organizationId: 'org-123',
      partnerName: 'Ohio State Medical Center',
      partnerType: 'hospital',
      contactName: 'Lisa Thompson',
      contactPhone: '614-555-1000',
      contactEmail: 'lisa@osmc.org',
      address: '456 Medical Dr',
      commissionRate: 5,
    };

    it('should create a referral partner', async () => {
      const mockResult = {
        rows: [{
          id: 'partner-123',
          ...mockPartnerData,
          status: 'active',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await referralCrmService.createPartner(mockPartnerData);

      expect(result).toBeDefined();
    });
  });

  describe('getPartners', () => {
    it('should return partners for organization', async () => {
      const mockPartners = {
        rows: [
          { id: 'partner-1', partner_name: 'Hospital A', status: 'active' },
          { id: 'partner-2', partner_name: 'Hospital B', status: 'active' },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockPartners);

      const result = await referralCrmService.getPartners('org-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('getPartnerPerformance', () => {
    it('should return partner performance metrics', async () => {
      const mockPerformance = {
        rows: [{
          partner_id: 'partner-123',
          total_referrals: '45',
          conversions: '32',
          conversion_rate: '71.1',
          total_revenue: '156000',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockPerformance);

      const result = await referralCrmService.getPartnerPerformance('org-123');

      expect(result).toBeDefined();
    });
  });

  describe('createCampaign', () => {
    const mockCampaignData = {
      organizationId: 'org-123',
      campaignName: 'Q4 Hospital Outreach',
      campaignType: 'partner',
      channel: 'direct',
      budget: 15000,
      startDate: '2024-10-01',
      endDate: '2024-12-31',
    };

    it('should create a marketing campaign', async () => {
      const mockResult = {
        rows: [{
          id: 'campaign-123',
          ...mockCampaignData,
          status: 'draft',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await referralCrmService.createCampaign(mockCampaignData);

      expect(result).toBeDefined();
    });
  });

  describe('getCampaigns', () => {
    it('should return campaigns for organization', async () => {
      const mockCampaigns = {
        rows: [
          { id: 'campaign-1', campaign_name: 'Q4 Outreach', status: 'active' },
          { id: 'campaign-2', campaign_name: 'Digital Ads', status: 'active' },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockCampaigns);

      const result = await referralCrmService.getCampaigns('org-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('getCampaignROI', () => {
    it('should calculate campaign ROI', async () => {
      const mockCampaignData = {
        rows: [{
          id: 'campaign-123',
          budget: 5000,
          spent: 4000,
          leads_generated: 20,
          conversions: 8,
          revenue_generated: 12000,
        }],
      };

      mockQuery.mockResolvedValueOnce(mockCampaignData);

      const result = await referralCrmService.getCampaignROI('campaign-123');

      expect(result).toBeDefined();
    });
  });

  describe('getPipeline', () => {
    it('should return lead pipeline', async () => {
      const mockPipeline = {
        rows: [{
          new: '24',
          contacted: '18',
          qualified: '12',
          proposal: '8',
          negotiation: '5',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockPipeline);

      const result = await referralCrmService.getPipeline('org-123');

      expect(result).toBeDefined();
    });
  });

  describe('logActivity', () => {
    it('should log lead activity', async () => {
      const mockResult = {
        rows: [{
          id: 'activity-123',
          lead_id: 'lead-123',
          activity_type: 'call',
          notes: 'Initial contact call',
        }],
      };

      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await referralCrmService.logActivity({
        leadId: 'lead-123',
        activityType: 'call',
        notes: 'Initial contact call',
        performedBy: 'user-123',
      });

      expect(result).toBeDefined();
    });
  });

  describe('getFollowUpsDue', () => {
    it('should return due follow-ups', async () => {
      const mockFollowUps = {
        rows: [
          { id: 'lead-1', next_follow_up: '2024-12-15', first_name: 'John' },
          { id: 'lead-2', next_follow_up: '2024-12-16', first_name: 'Jane' },
        ],
      };

      mockQuery.mockResolvedValueOnce(mockFollowUps);

      const result = await referralCrmService.getFollowUpsDue('org-123', 7);

      expect(result).toHaveLength(2);
    });
  });
});
