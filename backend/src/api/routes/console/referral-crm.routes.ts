/**
 * Referral CRM Routes
 * API endpoints for lead tracking, referral partners, marketing campaigns, and CRM analytics
 *
 * Best-in-Class Feature: Track referral sources and marketing ROI
 * with lead scoring and conversion analytics
 *
 * @module api/routes/console/referral-crm
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { referralCrmService as ReferralCrmService } from '../../../services/referral-crm.service';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('referral-crm-routes');

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * GET /api/console/referral-crm/dashboard
 * Get CRM dashboard summary
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const dashboard = await ReferralCrmService.getDashboard(organizationId);

    res.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/pipeline
 * Get lead pipeline by status
 */
router.get('/pipeline', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const pipeline = await ReferralCrmService.getPipeline(organizationId);

    res.json({
      pipeline,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEADS
// ============================================================================

/**
 * GET /api/console/referral-crm/leads
 * Get all leads with optional filters
 */
router.get('/leads', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { status, sourceId, partnerId, assignedTo, startDate, endDate, minScore, limit, offset } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const { leads, count } = await ReferralCrmService.getLeads(organizationId, {
      status: status as string,
      sourceId: sourceId as string,
      partnerId: partnerId as string,
      assignedTo: assignedTo as string,
      dateFrom: startDate as string,
      dateTo: endDate as string,
      minScore: minScore ? parseInt(minScore as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json({
      leads,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/leads/:leadId
 * Get a specific lead with details
 */
router.get('/leads/:leadId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;

    const lead = await ReferralCrmService.getLeadById(leadId);

    if (!lead) {
      throw ApiErrors.notFound('Lead not found');
    }

    res.json({
      lead,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/leads
 * Create a new lead
 */
router.post('/leads', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user?.userId;

    const {
      firstName,
      lastName,
      email,
      phone,
      serviceInterest,
      status,
      source,
      estimatedValue,
      notes,
      partnerId,
      sourceId
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !serviceInterest) {
      throw ApiErrors.badRequest('Missing required fields: firstName, lastName, email, phone, serviceInterest');
    }

    const lead = await ReferralCrmService.createLead({
      firstName,
      lastName,
      email,
      phone,
      serviceInterest,
      status,
      source,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      notes,
      partnerId,
      sourceId,
      createdBy: userId
    });

    logger.info(`Lead created: ${lead.id} - ${firstName} ${lastName}`);

    res.status(201).json({
      lead,
      message: 'Lead created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/referral-crm/leads/:leadId
 * Update a lead
 */
router.put('/leads/:leadId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;
    const updates = req.body;

    const lead = await ReferralCrmService.updateLead(leadId, updates);

    logger.info(`Lead updated: ${leadId}`);

    res.json({
      lead,
      message: 'Lead updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/referral-crm/leads/:leadId/status
 * Update lead status
 */
router.put('/leads/:leadId/status', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;
    const userId = req.user?.userId;
    const { status, notes } = req.body;

    if (!status) {
      throw ApiErrors.badRequest('Status is required');
    }

    const lead = await ReferralCrmService.updateLeadStatus(leadId, status, notes, userId);

    logger.info(`Lead ${leadId} status changed to ${status}`);

    res.json({
      lead,
      message: `Lead status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/referral-crm/leads/:leadId/convert
 * Convert a lead to a client
 */
router.put('/leads/:leadId/convert', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;
    const userId = req.user?.userId;

    const lead = await ReferralCrmService.convertLead(leadId, userId);

    logger.info(`Lead ${leadId} converted to client`);

    res.json({
      lead,
      message: 'Lead converted to client successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/leads/:leadId/score
 * Calculate and update lead score
 */
router.post('/leads/:leadId/score', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;

    const score = await ReferralCrmService.calculateLeadScore(leadId);

    res.json({
      leadId,
      score,
      message: 'Lead score calculated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEAD ACTIVITIES
// ============================================================================

/**
 * GET /api/console/referral-crm/leads/:leadId/activities
 * Get activities for a lead
 */
router.get('/leads/:leadId/activities', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;
    const { limit } = req.query;

    const activities = await ReferralCrmService.getLeadActivities(
      leadId,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/leads/:leadId/activities
 * Log an activity for a lead
 */
router.post('/leads/:leadId/activities', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { leadId } = req.params;
    const userId = req.user?.userId;

    const {
      activityType,
      subject,
      notes,
      outcomeStatus,
      nextFollowUpDate,
      durationMinutes
    } = req.body;

    if (!activityType) {
      throw ApiErrors.badRequest('Activity type is required');
    }

    const activity = await ReferralCrmService.logActivity({
      leadId,
      activityType,
      subject,
      notes,
      outcomeStatus,
      nextFollowUpDate,
      performedBy: userId,
      durationMinutes
    });

    logger.info(`Activity logged for lead ${leadId}: ${activityType}`);

    res.status(201).json({
      activity,
      message: 'Activity logged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/follow-ups
 * Get follow-ups due
 */
router.get('/follow-ups', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { daysAhead } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const followUps = await ReferralCrmService.getFollowUpsDue(
      organizationId,
      daysAhead ? parseInt(daysAhead as string) : 7
    );

    res.json({
      followUps,
      count: followUps.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEAD SOURCES
// ============================================================================

/**
 * GET /api/console/referral-crm/sources
 * Get all lead sources
 */
router.get('/sources', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const sources = await ReferralCrmService.getLeadSources(organizationId);

    res.json({
      sources,
      count: sources.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/sources
 * Create a lead source
 */
router.post('/sources', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      sourceName,
      sourceType,
      channel,
      utmSource,
      utmMedium,
      utmCampaign,
      isActive,
      costPerLead,
      notes
    } = req.body;

    if (!sourceName || !sourceType) {
      throw ApiErrors.badRequest('Missing required fields: sourceName, sourceType');
    }

    const source = await ReferralCrmService.createLeadSource({
      organizationId,
      sourceName,
      sourceType,
      channel,
      utmSource,
      utmMedium,
      utmCampaign,
      isActive,
      costPerLead: costPerLead ? parseFloat(costPerLead) : undefined,
      notes
    });

    logger.info(`Lead source created: ${source.id} - ${sourceName}`);

    res.status(201).json({
      source,
      message: 'Lead source created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/sources/performance
 * Get lead source performance metrics
 */
router.get('/sources/performance', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const performance = await ReferralCrmService.getSourcePerformance(organizationId);

    res.json({
      performance,
      count: performance.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// REFERRAL PARTNERS
// ============================================================================

/**
 * GET /api/console/referral-crm/partners
 * Get all referral partners
 */
router.get('/partners', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { status, type } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const partners = await ReferralCrmService.getPartners(organizationId, {
      status: status as string,
      type: type as string
    });

    res.json({
      partners,
      count: partners.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/partners/:partnerId
 * Get a specific partner with details
 */
router.get('/partners/:partnerId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { partnerId } = req.params;

    const partner = await ReferralCrmService.getPartnerById(partnerId);

    if (!partner) {
      throw ApiErrors.notFound('Partner not found');
    }

    res.json({
      partner,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/partners
 * Create a referral partner
 */
router.post('/partners', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      organizationName,
      contactName,
      email,
      phone,
      type,
      status,
      commissionRate,
      notes
    } = req.body;

    if (!organizationName || !contactName || !email || !type) {
      throw ApiErrors.badRequest('Missing required fields: organizationName, contactName, email, type');
    }

    const partner = await ReferralCrmService.createPartner({
      organizationName,
      contactName,
      email,
      phone,
      type,
      status,
      commissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
      notes
    });

    logger.info(`Partner created: ${partner.id} - ${organizationName}`);

    res.status(201).json({
      partner,
      message: 'Referral partner created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/referral-crm/partners/:partnerId
 * Update a referral partner
 */
router.put('/partners/:partnerId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { partnerId } = req.params;
    const updates = req.body;

    const partner = await ReferralCrmService.updatePartner(partnerId, updates);

    logger.info(`Partner updated: ${partnerId}`);

    res.json({
      partner,
      message: 'Partner updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/partners/performance
 * Get partner performance metrics
 */
router.get('/partners/performance', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const performance = await ReferralCrmService.getPartnerPerformance(organizationId);

    res.json({
      performance,
      count: performance.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MARKETING CAMPAIGNS
// ============================================================================

/**
 * GET /api/console/referral-crm/campaigns
 * Get all marketing campaigns
 */
router.get('/campaigns', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { status, channel } = req.query;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const campaigns = await ReferralCrmService.getCampaigns(organizationId, {
      status: status as string,
      channel: channel as string
    });

    res.json({
      campaigns,
      count: campaigns.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/campaigns
 * Create a marketing campaign
 */
router.post('/campaigns', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      campaignName,
      campaignType,
      channel,
      startDate,
      endDate,
      budget,
      targetAudience,
      description,
      status
    } = req.body;

    if (!campaignName || !campaignType || !startDate) {
      throw ApiErrors.badRequest('Missing required fields: campaignName, campaignType, startDate');
    }

    const campaign = await ReferralCrmService.createCampaign({
      organizationId,
      campaignName,
      campaignType,
      channel,
      startDate,
      endDate,
      budget: budget ? parseFloat(budget) : undefined,
      targetAudience,
      description,
      status
    });

    logger.info(`Campaign created: ${campaign.id} - ${campaignName}`);

    res.status(201).json({
      campaign,
      message: 'Marketing campaign created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/referral-crm/campaigns/:campaignId
 * Update a marketing campaign
 */
router.put('/campaigns/:campaignId', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;

    const campaign = await ReferralCrmService.updateCampaign(campaignId, updates);

    logger.info(`Campaign updated: ${campaignId}`);

    res.json({
      campaign,
      message: 'Campaign updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/referral-crm/campaigns/:campaignId/roi
 * Get campaign ROI metrics
 */
router.get('/campaigns/:campaignId/roi', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { campaignId } = req.params;

    const roi = await ReferralCrmService.getCampaignROI(campaignId);

    if (!roi) {
      throw ApiErrors.notFound('Campaign not found');
    }

    res.json({
      roi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEAD SCORING RULES
// ============================================================================

/**
 * GET /api/console/referral-crm/scoring-rules
 * Get lead scoring rules
 */
router.get('/scoring-rules', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const rules = await ReferralCrmService.getScoringRules(organizationId);

    res.json({
      rules,
      count: rules.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/referral-crm/scoring-rules
 * Create a lead scoring rule
 */
router.post('/scoring-rules', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw ApiErrors.badRequest('Organization context required');
    }

    const {
      ruleName,
      field,
      operator,
      value,
      scoreAdjustment,
      isActive
    } = req.body;

    if (!ruleName || !field || !operator || !value || scoreAdjustment === undefined) {
      throw ApiErrors.badRequest('Missing required fields: ruleName, field, operator, value, scoreAdjustment');
    }

    const rule = await ReferralCrmService.createScoringRule({
      organizationId,
      ruleName,
      field,
      operator,
      value,
      scoreAdjustment: parseInt(scoreAdjustment),
      isActive
    });

    logger.info(`Scoring rule created: ${rule.id} - ${ruleName}`);

    res.status(201).json({
      rule,
      message: 'Scoring rule created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
