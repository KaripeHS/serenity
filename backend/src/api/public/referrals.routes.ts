import { Router, Request, Response } from 'express';
import { createLogger } from '../../utils/logger';
import { z } from 'zod';
import { getDbClient } from '../../database/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const logger = createLogger('public-referrals-api');
const db = getDbClient();

// Validation schema for patient referral
const createReferralSchema = z.object({
    referralType: z.enum(['patient', 'family', 'provider']),
    patientFirstName: z.string().min(1, 'Patient first name is required'),
    patientLastName: z.string().min(1, 'Patient last name is required'),
    patientPhone: z.string().min(10, 'Patient phone must be at least 10 digits'),
    patientAddress: z.string().min(1, 'Patient address is required'),
    contactFirstName: z.string().optional(),
    contactLastName: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    relationship: z.string().optional(),
    insuranceType: z.enum(['medicaid', 'medicare', 'private', 'private-pay']),
    careNeeds: z.string().min(1, 'Care needs description is required'),
    urgency: z.enum(['routine', 'soon', 'urgent']),
    preferredContact: z.enum(['phone', 'email', 'either'])
});

/**
 * POST /api/public/referrals
 * Submit a new patient referral from the contact page
 * This feeds into the ERP patient intake pipeline
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validation = createReferralSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const data = validation.data;

        // Create the referral in the database as a lead
        const referralId = uuidv4();
        const status = data.urgency === 'urgent' ? 'Hot' : data.urgency === 'soon' ? 'Warm' : 'New';
        const notes = JSON.stringify({
            referralType: data.referralType,
            patientAddress: data.patientAddress,
            insuranceType: data.insuranceType,
            careNeeds: data.careNeeds,
            urgency: data.urgency,
            preferredContact: data.preferredContact,
            contactPerson: data.referralType !== 'patient' ? {
                firstName: data.contactFirstName,
                lastName: data.contactLastName,
                phone: data.contactPhone,
                email: data.contactEmail,
                relationship: data.relationship
            } : null
        });

        await db.query(
            `INSERT INTO leads (id, first_name, last_name, phone, email, source, status, service_interest, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
                referralId,
                data.patientFirstName,
                data.patientLastName,
                data.patientPhone,
                data.contactEmail || null,
                'website-referral-form',
                status,
                'Home Health Care',
                notes
            ]
        );

        logger.info(`New patient referral created: ${referralId}`, {
            referralType: data.referralType,
            urgency: data.urgency,
            insuranceType: data.insuranceType
        });

        // If urgent, we could trigger notifications here
        if (data.urgency === 'urgent') {
            logger.warn(`URGENT referral received - requires immediate attention: ${referralId}`);
            // TODO: Send notification to on-call coordinator
        }

        return res.status(201).json({
            success: true,
            message: 'Referral received successfully',
            referralId: referralId
        });

    } catch (error) {
        logger.error('Failed to create patient referral', { error });
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
