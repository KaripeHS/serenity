/**
 * Referral CRM Service
 * Manages lead sources, marketing campaigns, referral partner relationships,
 * and lead scoring for the referral tracking system
 *
 * @module services/referral-crm
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('referral-crm-service');

interface LeadSource {
  id?: string;
  organizationId: string;
  sourceName: string;
  sourceType: string;
  channel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isActive?: boolean;
  costPerLead?: number;
  notes?: string;
}

interface LeadActivity {
  leadId: string;
  activityType: string;
  subject?: string;
  notes?: string;
  outcomeStatus?: string;
  nextFollowUpDate?: string;
  performedBy?: string;
  durationMinutes?: number;
}

interface MarketingCampaign {
  id?: string;
  organizationId: string;
  campaignName: string;
  campaignType: string;
  channel?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  targetAudience?: string;
  description?: string;
  status?: string;
}

interface PartnerReferral {
  partnerId: string;
  leadId: string;
  referralDate: string;
  expectedCommission?: number;
  commissionStatus?: string;
  notes?: string;
}

interface LeadScoringRule {
  id?: string;
  organizationId: string;
  ruleName: string;
  field: string;
  operator: string;
  value: string;
  scoreAdjustment: number;
  isActive?: boolean;
}

interface LeadFilters {
  status?: string;
  sourceId?: string;
  partnerId?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
}

class ReferralCrmService {
  private db = getDbClient();

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  /**
   * Get CRM dashboard summary
   */
  async getDashboard(organizationId: string): Promise<any> {
    try {
      // Try to use the view if it exists, otherwise compute manually
      const dashboardQuery = `
        SELECT * FROM crm_dashboard WHERE organization_id = $1
      `;

      try {
        const result = await this.db.query(dashboardQuery, [organizationId]);
        if (result.rows.length > 0) {
          return result.rows[0];
        }
      } catch (e) {
        // View might not exist yet, compute manually
      }

      // Fallback: compute dashboard metrics manually
      const metricsQuery = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'new') as new_leads,
          COUNT(*) FILTER (WHERE status IN ('contacted', 'assessment_scheduled', 'contract_sent')) as active_leads,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
          COUNT(*) FILTER (WHERE status = 'lost') as lost_leads,
          COUNT(*) as total_leads,
          COALESCE(SUM(estimated_value) FILTER (WHERE status = 'converted'), 0) as total_converted_value,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) FILTER (WHERE status = 'converted') as avg_conversion_days
        FROM leads
      `;

      const partnerQuery = `
        SELECT COUNT(*) as active_partners
        FROM referral_partners
        WHERE status = 'active'
      `;

      const [metricsResult, partnerResult] = await Promise.all([
        this.db.query(metricsQuery),
        this.db.query(partnerQuery)
      ]);

      const metrics = metricsResult.rows[0];
      const partners = partnerResult.rows[0];

      const conversionRate = metrics.total_leads > 0
        ? (parseInt(metrics.converted_leads) / parseInt(metrics.total_leads) * 100).toFixed(1)
        : 0;

      return {
        newLeads: parseInt(metrics.new_leads) || 0,
        activeLeads: parseInt(metrics.active_leads) || 0,
        convertedLeads: parseInt(metrics.converted_leads) || 0,
        lostLeads: parseInt(metrics.lost_leads) || 0,
        totalLeads: parseInt(metrics.total_leads) || 0,
        conversionRate: parseFloat(conversionRate as string),
        totalConvertedValue: parseFloat(metrics.total_converted_value) || 0,
        avgConversionDays: parseFloat(metrics.avg_conversion_days) || 0,
        activePartners: parseInt(partners.active_partners) || 0
      };
    } catch (error) {
      logger.error('Error getting CRM dashboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEADS
  // ============================================================================

  /**
   * Get all leads with filters
   */
  async getLeads(organizationId: string, filters: LeadFilters = {}): Promise<{ leads: any[]; count: number }> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`l.status = $${paramIndex++}`);
        params.push(filters.status);
      }

      if (filters.sourceId) {
        conditions.push(`l.source_id = $${paramIndex++}`);
        params.push(filters.sourceId);
      }

      if (filters.partnerId) {
        conditions.push(`l.partner_id = $${paramIndex++}`);
        params.push(filters.partnerId);
      }

      if (filters.assignedTo) {
        conditions.push(`l.assigned_to = $${paramIndex++}`);
        params.push(filters.assignedTo);
      }

      if (filters.dateFrom) {
        conditions.push(`l.created_at >= $${paramIndex++}`);
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        conditions.push(`l.created_at <= $${paramIndex++}`);
        params.push(filters.dateTo);
      }

      if (filters.minScore) {
        conditions.push(`l.lead_score >= $${paramIndex++}`);
        params.push(filters.minScore);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const query = `
        SELECT
          l.*,
          rp.organization_name as partner_name,
          ls.source_name,
          ls.source_type
        FROM leads l
        LEFT JOIN referral_partners rp ON l.partner_id = rp.id
        LEFT JOIN lead_sources ls ON l.source_id = ls.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as count
        FROM leads l
        ${whereClause}
      `;

      const [leadsResult, countResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(countQuery, params)
      ]);

      return {
        leads: leadsResult.rows,
        count: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error getting leads:', error);
      throw error;
    }
  }

  /**
   * Get a single lead by ID with full details
   */
  async getLeadById(leadId: string): Promise<any> {
    try {
      const query = `
        SELECT
          l.*,
          rp.organization_name as partner_name,
          rp.contact_name as partner_contact,
          ls.source_name,
          ls.source_type
        FROM leads l
        LEFT JOIN referral_partners rp ON l.partner_id = rp.id
        LEFT JOIN lead_sources ls ON l.source_id = ls.id
        WHERE l.id = $1
      `;

      const result = await this.db.query(query, [leadId]);

      if (result.rows.length === 0) {
        return null;
      }

      // Get activities
      const activitiesQuery = `
        SELECT * FROM lead_activities
        WHERE lead_id = $1
        ORDER BY activity_date DESC
        LIMIT 20
      `;

      let activities: any[] = [];
      try {
        const activitiesResult = await this.db.query(activitiesQuery, [leadId]);
        activities = activitiesResult.rows;
      } catch (e) {
        // Table might not exist yet
      }

      return {
        ...result.rows[0],
        activities
      };
    } catch (error) {
      logger.error('Error getting lead by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  async createLead(data: any): Promise<any> {
    try {
      const query = `
        INSERT INTO leads (
          first_name, last_name, email, phone, service_interest,
          status, source, estimated_value, notes, partner_id, source_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.serviceInterest,
        data.status || 'new',
        data.source || 'web',
        data.estimatedValue,
        data.notes,
        data.partnerId,
        data.sourceId
      ]);

      // Log activity
      if (result.rows[0]) {
        await this.logActivity({
          leadId: result.rows[0].id,
          activityType: 'lead_created',
          subject: 'Lead Created',
          notes: `Lead created via ${data.source || 'web'}`,
          performedBy: data.createdBy
        });
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update a lead
   */
  async updateLead(leadId: string, updates: any): Promise<any> {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'email', 'phone', 'service_interest',
        'status', 'source', 'estimated_value', 'notes', 'partner_id',
        'source_id', 'assigned_to', 'lead_score'
      ];

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Map camelCase to snake_case
      const fieldMap: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        serviceInterest: 'service_interest',
        estimatedValue: 'estimated_value',
        partnerId: 'partner_id',
        sourceId: 'source_id',
        assignedTo: 'assigned_to',
        leadScore: 'lead_score'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        if (allowedFields.includes(dbField) && value !== undefined) {
          setClauses.push(`${dbField} = $${paramIndex++}`);
          params.push(value);
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(leadId);

      const query = `
        UPDATE leads
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Update lead status with activity logging
   */
  async updateLeadStatus(leadId: string, newStatus: string, notes?: string, userId?: string): Promise<any> {
    try {
      const lead = await this.updateLead(leadId, { status: newStatus });

      // Log activity
      await this.logActivity({
        leadId,
        activityType: 'status_change',
        subject: `Status changed to ${newStatus}`,
        notes,
        performedBy: userId
      });

      return lead;
    } catch (error) {
      logger.error('Error updating lead status:', error);
      throw error;
    }
  }

  /**
   * Convert a lead to a client
   */
  async convertLead(leadId: string, userId?: string): Promise<any> {
    try {
      const lead = await this.updateLead(leadId, { status: 'converted' });

      // Log activity
      await this.logActivity({
        leadId,
        activityType: 'converted',
        subject: 'Lead Converted to Client',
        notes: 'Lead successfully converted to active client',
        outcomeStatus: 'successful',
        performedBy: userId
      });

      // If from partner, update partner referral status
      if (lead.partner_id) {
        await this.db.query(`
          UPDATE partner_referrals
          SET outcome_status = 'converted', conversion_date = NOW()
          WHERE lead_id = $1
        `, [leadId]);
      }

      return lead;
    } catch (error) {
      logger.error('Error converting lead:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEAD ACTIVITIES
  // ============================================================================

  /**
   * Log an activity for a lead
   */
  async logActivity(activity: LeadActivity): Promise<any> {
    try {
      const query = `
        INSERT INTO lead_activities (
          lead_id, activity_type, subject, notes, outcome_status,
          next_follow_up_date, performed_by, duration_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        activity.leadId,
        activity.activityType,
        activity.subject,
        activity.notes,
        activity.outcomeStatus,
        activity.nextFollowUpDate,
        activity.performedBy,
        activity.durationMinutes
      ]);

      // Update lead's last contact date
      await this.db.query(`
        UPDATE leads SET last_contact_date = NOW() WHERE id = $1
      `, [activity.leadId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw - activity logging shouldn't break main operations
      return null;
    }
  }

  /**
   * Get activities for a lead
   */
  async getLeadActivities(leadId: string, limit: number = 50): Promise<any[]> {
    try {
      const query = `
        SELECT
          la.*,
          u.first_name || ' ' || u.last_name as performed_by_name
        FROM lead_activities la
        LEFT JOIN users u ON la.performed_by = u.id
        WHERE la.lead_id = $1
        ORDER BY la.activity_date DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [leadId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting lead activities:', error);
      return [];
    }
  }

  /**
   * Get follow-ups due
   */
  async getFollowUpsDue(organizationId: string, daysAhead: number = 7): Promise<any[]> {
    try {
      const query = `
        SELECT DISTINCT ON (la.lead_id)
          la.*,
          l.first_name, l.last_name, l.email, l.phone, l.status as lead_status
        FROM lead_activities la
        JOIN leads l ON la.lead_id = l.id
        WHERE la.next_follow_up_date IS NOT NULL
          AND la.next_follow_up_date <= NOW() + INTERVAL '${daysAhead} days'
          AND l.status NOT IN ('converted', 'lost')
        ORDER BY la.lead_id, la.next_follow_up_date DESC
      `;

      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting follow-ups due:', error);
      return [];
    }
  }

  // ============================================================================
  // LEAD SOURCES
  // ============================================================================

  /**
   * Get all lead sources
   */
  async getLeadSources(organizationId: string): Promise<any[]> {
    try {
      const query = `
        SELECT ls.*,
          COUNT(l.id) as lead_count,
          COUNT(l.id) FILTER (WHERE l.status = 'converted') as converted_count
        FROM lead_sources ls
        LEFT JOIN leads l ON l.source_id = ls.id
        WHERE ls.organization_id = $1
        GROUP BY ls.id
        ORDER BY ls.source_name
      `;

      const result = await this.db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting lead sources:', error);
      return [];
    }
  }

  /**
   * Create a lead source
   */
  async createLeadSource(source: LeadSource): Promise<any> {
    try {
      const query = `
        INSERT INTO lead_sources (
          organization_id, source_name, source_type, channel,
          utm_source, utm_medium, utm_campaign, is_active, cost_per_lead, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        source.organizationId,
        source.sourceName,
        source.sourceType,
        source.channel,
        source.utmSource,
        source.utmMedium,
        source.utmCampaign,
        source.isActive !== false,
        source.costPerLead,
        source.notes
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating lead source:', error);
      throw error;
    }
  }

  /**
   * Get lead source performance metrics
   */
  async getSourcePerformance(organizationId: string): Promise<any[]> {
    try {
      // Try to use the view if it exists
      const viewQuery = `
        SELECT * FROM lead_source_performance WHERE organization_id = $1
      `;

      try {
        const result = await this.db.query(viewQuery, [organizationId]);
        if (result.rows.length > 0) {
          return result.rows;
        }
      } catch (e) {
        // View might not exist
      }

      // Fallback: compute manually
      const query = `
        SELECT
          ls.id as source_id,
          ls.source_name,
          ls.source_type,
          COUNT(l.id) as total_leads,
          COUNT(l.id) FILTER (WHERE l.status = 'converted') as conversions,
          COALESCE(SUM(l.estimated_value) FILTER (WHERE l.status = 'converted'), 0) as total_revenue,
          CASE
            WHEN COUNT(l.id) > 0
            THEN ROUND(COUNT(l.id) FILTER (WHERE l.status = 'converted')::decimal / COUNT(l.id) * 100, 1)
            ELSE 0
          END as conversion_rate
        FROM lead_sources ls
        LEFT JOIN leads l ON l.source_id = ls.id
        WHERE ls.organization_id = $1
        GROUP BY ls.id, ls.source_name, ls.source_type
        ORDER BY conversions DESC
      `;

      const result = await this.db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting source performance:', error);
      return [];
    }
  }

  // ============================================================================
  // REFERRAL PARTNERS
  // ============================================================================

  /**
   * Get all referral partners
   */
  async getPartners(organizationId: string, filters: { status?: string; type?: string } = {}): Promise<any[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
      }

      if (filters.type) {
        conditions.push(`type = $${paramIndex++}`);
        params.push(filters.type);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT rp.*,
          COUNT(l.id) as total_referrals,
          COUNT(l.id) FILTER (WHERE l.status = 'converted') as successful_referrals,
          COALESCE(SUM(l.estimated_value) FILTER (WHERE l.status = 'converted'), 0) as total_revenue
        FROM referral_partners rp
        LEFT JOIN leads l ON l.partner_id = rp.id
        ${whereClause}
        GROUP BY rp.id
        ORDER BY rp.organization_name
      `;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting partners:', error);
      return [];
    }
  }

  /**
   * Get a single partner by ID
   */
  async getPartnerById(partnerId: string): Promise<any> {
    try {
      const query = `
        SELECT rp.*,
          COUNT(l.id) as total_referrals,
          COUNT(l.id) FILTER (WHERE l.status = 'converted') as successful_referrals,
          COALESCE(SUM(l.estimated_value) FILTER (WHERE l.status = 'converted'), 0) as total_revenue
        FROM referral_partners rp
        LEFT JOIN leads l ON l.partner_id = rp.id
        WHERE rp.id = $1
        GROUP BY rp.id
      `;

      const result = await this.db.query(query, [partnerId]);

      if (result.rows.length === 0) {
        return null;
      }

      // Get recent referrals
      const referralsQuery = `
        SELECT * FROM leads
        WHERE partner_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const referralsResult = await this.db.query(referralsQuery, [partnerId]);

      return {
        ...result.rows[0],
        recentReferrals: referralsResult.rows
      };
    } catch (error) {
      logger.error('Error getting partner by ID:', error);
      throw error;
    }
  }

  /**
   * Create a referral partner
   */
  async createPartner(data: any): Promise<any> {
    try {
      const query = `
        INSERT INTO referral_partners (
          organization_name, contact_name, email, phone, type,
          status, commission_rate, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        data.organizationName,
        data.contactName,
        data.email,
        data.phone,
        data.type,
        data.status || 'active',
        data.commissionRate || 0,
        data.notes
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating partner:', error);
      throw error;
    }
  }

  /**
   * Update a referral partner
   */
  async updatePartner(partnerId: string, updates: any): Promise<any> {
    try {
      const allowedFields = [
        'organization_name', 'contact_name', 'email', 'phone', 'type',
        'status', 'commission_rate', 'agreement_signed_at', 'notes'
      ];

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      const fieldMap: Record<string, string> = {
        organizationName: 'organization_name',
        contactName: 'contact_name',
        commissionRate: 'commission_rate',
        agreementSignedAt: 'agreement_signed_at'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        if (allowedFields.includes(dbField) && value !== undefined) {
          setClauses.push(`${dbField} = $${paramIndex++}`);
          params.push(value);
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(partnerId);

      const query = `
        UPDATE referral_partners
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating partner:', error);
      throw error;
    }
  }

  /**
   * Get partner performance metrics
   */
  async getPartnerPerformance(organizationId: string): Promise<any[]> {
    try {
      const query = `
        SELECT
          rp.id as partner_id,
          rp.organization_name,
          rp.type,
          rp.commission_rate,
          COUNT(l.id) as total_referrals,
          COUNT(l.id) FILTER (WHERE l.status = 'converted') as conversions,
          COALESCE(SUM(l.estimated_value) FILTER (WHERE l.status = 'converted'), 0) as total_revenue,
          CASE
            WHEN COUNT(l.id) > 0
            THEN ROUND(COUNT(l.id) FILTER (WHERE l.status = 'converted')::decimal / COUNT(l.id) * 100, 1)
            ELSE 0
          END as conversion_rate,
          COALESCE(
            SUM(l.estimated_value * rp.commission_rate / 100) FILTER (WHERE l.status = 'converted'),
            0
          ) as commissions_earned
        FROM referral_partners rp
        LEFT JOIN leads l ON l.partner_id = rp.id
        GROUP BY rp.id, rp.organization_name, rp.type, rp.commission_rate
        ORDER BY conversions DESC
      `;

      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting partner performance:', error);
      return [];
    }
  }

  // ============================================================================
  // MARKETING CAMPAIGNS
  // ============================================================================

  /**
   * Get all marketing campaigns
   */
  async getCampaigns(organizationId: string, filters: { status?: string; channel?: string } = {}): Promise<any[]> {
    try {
      const conditions: string[] = ['organization_id = $1'];
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (filters.status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
      }

      if (filters.channel) {
        conditions.push(`channel = $${paramIndex++}`);
        params.push(filters.channel);
      }

      const query = `
        SELECT mc.*,
          COUNT(ls.id) as linked_sources,
          COALESCE(SUM(ls.total_leads), 0) as total_leads,
          COALESCE(SUM(ls.converted_leads), 0) as converted_leads
        FROM marketing_campaigns mc
        LEFT JOIN (
          SELECT
            ls.id,
            ls.utm_campaign,
            COUNT(l.id) as total_leads,
            COUNT(l.id) FILTER (WHERE l.status = 'converted') as converted_leads
          FROM lead_sources ls
          LEFT JOIN leads l ON l.source_id = ls.id
          GROUP BY ls.id, ls.utm_campaign
        ) ls ON ls.utm_campaign = mc.campaign_name
        WHERE ${conditions.join(' AND ')}
        GROUP BY mc.id
        ORDER BY mc.start_date DESC
      `;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting campaigns:', error);
      return [];
    }
  }

  /**
   * Create a marketing campaign
   */
  async createCampaign(campaign: MarketingCampaign): Promise<any> {
    try {
      const query = `
        INSERT INTO marketing_campaigns (
          organization_id, campaign_name, campaign_type, channel,
          start_date, end_date, budget, target_audience, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        campaign.organizationId,
        campaign.campaignName,
        campaign.campaignType,
        campaign.channel,
        campaign.startDate,
        campaign.endDate,
        campaign.budget,
        campaign.targetAudience,
        campaign.description,
        campaign.status || 'planned'
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update a marketing campaign
   */
  async updateCampaign(campaignId: string, updates: any): Promise<any> {
    try {
      const allowedFields = [
        'campaign_name', 'campaign_type', 'channel', 'start_date', 'end_date',
        'budget', 'actual_spend', 'target_audience', 'description', 'status'
      ];

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      const fieldMap: Record<string, string> = {
        campaignName: 'campaign_name',
        campaignType: 'campaign_type',
        startDate: 'start_date',
        endDate: 'end_date',
        actualSpend: 'actual_spend',
        targetAudience: 'target_audience'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        if (allowedFields.includes(dbField) && value !== undefined) {
          setClauses.push(`${dbField} = $${paramIndex++}`);
          params.push(value);
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(campaignId);

      const query = `
        UPDATE marketing_campaigns
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign ROI metrics
   */
  async getCampaignROI(campaignId: string): Promise<any> {
    try {
      const query = `
        SELECT
          mc.*,
          COUNT(l.id) as total_leads,
          COUNT(l.id) FILTER (WHERE l.status = 'converted') as conversions,
          COALESCE(SUM(l.estimated_value) FILTER (WHERE l.status = 'converted'), 0) as revenue,
          CASE
            WHEN mc.actual_spend > 0
            THEN ROUND((SUM(l.estimated_value) FILTER (WHERE l.status = 'converted') - mc.actual_spend) / mc.actual_spend * 100, 1)
            ELSE 0
          END as roi_percent,
          CASE
            WHEN COUNT(l.id) > 0
            THEN ROUND(mc.actual_spend / COUNT(l.id), 2)
            ELSE 0
          END as cost_per_lead
        FROM marketing_campaigns mc
        LEFT JOIN lead_sources ls ON ls.utm_campaign = mc.campaign_name
        LEFT JOIN leads l ON l.source_id = ls.id
        WHERE mc.id = $1
        GROUP BY mc.id
      `;

      const result = await this.db.query(query, [campaignId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting campaign ROI:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEAD SCORING
  // ============================================================================

  /**
   * Calculate lead score
   */
  async calculateLeadScore(leadId: string): Promise<number> {
    try {
      // Try to use the database function if it exists
      const funcQuery = `SELECT calculate_lead_score($1) as score`;

      try {
        const result = await this.db.query(funcQuery, [leadId]);
        if (result.rows[0]?.score !== null) {
          return parseInt(result.rows[0].score);
        }
      } catch (e) {
        // Function might not exist
      }

      // Fallback: simple scoring based on fields
      const leadQuery = `SELECT * FROM leads WHERE id = $1`;
      const leadResult = await this.db.query(leadQuery, [leadId]);

      if (leadResult.rows.length === 0) {
        return 0;
      }

      const lead = leadResult.rows[0];
      let score = 50; // Base score

      // Score adjustments
      if (lead.estimated_value > 5000) score += 20;
      else if (lead.estimated_value > 2000) score += 10;

      if (lead.service_interest === '24/7 Care') score += 15;
      if (lead.partner_id) score += 10; // Partner referrals score higher

      // Update lead with calculated score
      await this.db.query(`UPDATE leads SET lead_score = $1 WHERE id = $2`, [score, leadId]);

      return score;
    } catch (error) {
      logger.error('Error calculating lead score:', error);
      return 50; // Default score
    }
  }

  /**
   * Get lead scoring rules
   */
  async getScoringRules(organizationId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM lead_scoring_rules
        WHERE organization_id = $1 AND is_active = true
        ORDER BY rule_name
      `;

      const result = await this.db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting scoring rules:', error);
      return [];
    }
  }

  /**
   * Create a scoring rule
   */
  async createScoringRule(rule: LeadScoringRule): Promise<any> {
    try {
      const query = `
        INSERT INTO lead_scoring_rules (
          organization_id, rule_name, field, operator, value, score_adjustment, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        rule.organizationId,
        rule.ruleName,
        rule.field,
        rule.operator,
        rule.value,
        rule.scoreAdjustment,
        rule.isActive !== false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating scoring rule:', error);
      throw error;
    }
  }

  // ============================================================================
  // PIPELINE VIEW
  // ============================================================================

  /**
   * Get lead pipeline by status
   */
  async getPipeline(organizationId: string): Promise<any> {
    try {
      const query = `
        SELECT
          status,
          COUNT(*) as count,
          COALESCE(SUM(estimated_value), 0) as total_value,
          COALESCE(AVG(lead_score), 50) as avg_score
        FROM leads
        GROUP BY status
        ORDER BY
          CASE status
            WHEN 'new' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'assessment_scheduled' THEN 3
            WHEN 'contract_sent' THEN 4
            WHEN 'converted' THEN 5
            WHEN 'lost' THEN 6
          END
      `;

      const result = await this.db.query(query);

      // Format as pipeline stages
      const stages = ['new', 'contacted', 'assessment_scheduled', 'contract_sent', 'converted', 'lost'];
      const pipeline: Record<string, any> = {};

      for (const stage of stages) {
        const stageData = result.rows.find(r => r.status === stage);
        pipeline[stage] = {
          count: parseInt(stageData?.count || '0'),
          totalValue: parseFloat(stageData?.total_value || '0'),
          avgScore: parseFloat(stageData?.avg_score || '50')
        };
      }

      return pipeline;
    } catch (error) {
      logger.error('Error getting pipeline:', error);
      throw error;
    }
  }
}

export const referralCrmService = new ReferralCrmService();
