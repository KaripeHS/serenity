/**
 * Webhooks Routes
 * External service webhooks (Twilio, Sandata, clearinghouse, etc.)
 *
 * @module api/routes/webhooks
 */

import { Router } from 'express';
import twilioRouter from './twilio';

const router = Router();

// Twilio SMS webhooks
router.use('/twilio', twilioRouter);

// Future: Add other webhook handlers
// router.use('/sandata', sandataWebhookRouter);
// router.use('/clearinghouse', clearinghouseWebhookRouter);
// router.use('/stripe', stripeWebhookRouter);

export default router;
