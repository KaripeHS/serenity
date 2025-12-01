import { Router, Request, Response } from 'express';
import { ReferralPartnersService } from '../../modules/partners/partners.service';
import { LeadsService } from '../../modules/crm/leads.service';
import { createLogger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();
const partnersService = new ReferralPartnersService();
const leadsService = new LeadsService();
const logger = createLogger('partners-api');

// Validation schemas
const createPartnerSchema = z.object({
    organizationName: z.string().min(1),
    contactName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    type: z.enum(['wealth_manager', 'estate_attorney', 'physician', 'hospital_case_manager', 'other']),
    notes: z.string().optional()
});

const submitReferralSchema = z.object({
    partnerId: z.string().uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    serviceInterest: z.string().min(1),
    notes: z.string().optional()
});

/**
 * POST /api/partners/register
 * Register a new referral partner
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validation = createPartnerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error.errors });
        }

        const { phone, notes, ...requiredData } = validation.data;
        const partnerData: any = { ...requiredData };

        if (phone) partnerData.phone = phone;
        if (notes) partnerData.notes = notes;

        const partner = await partnersService.createPartner(partnerData);
        return res.status(201).json({ success: true, data: partner });
    } catch (error) {
        logger.error('Failed to register partner', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/partners/referral
 * Submit a new referral from a partner
 */
router.post('/referral', async (req: Request, res: Response) => {
    try {
        const validation = submitReferralSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, error: validation.error.errors });
        }

        const { partnerId, ...leadData } = validation.data;

        // Verify partner exists (skipped for speed)

        const createLeadData: any = {
            firstName: leadData.firstName,
            lastName: leadData.lastName,
            email: leadData.email,
            phone: leadData.phone,
            serviceInterest: leadData.serviceInterest,
            source: 'partner_referral',
            partnerId: partnerId
        };

        if (leadData.notes) {
            createLeadData.notes = leadData.notes;
        }

        const lead = await leadsService.createLead(createLeadData);

        return res.status(201).json({ success: true, data: lead });
    } catch (error) {
        logger.error('Failed to submit referral', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/partners/:id/referrals
 * Get referrals for a specific partner
 */
router.get('/:id/referrals', async (req: Request, res: Response) => {
    try {
        const referrals = await partnersService.getPartnerReferrals(req.params.id);
        return res.json({ success: true, data: referrals });
    } catch (error) {
        logger.error('Failed to fetch referrals', { error });
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
