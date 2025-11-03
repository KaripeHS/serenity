/**
 * Twilio Webhook Handler
 * Receives incoming SMS responses for two-way dispatch messaging
 *
 * @module api/routes/webhooks/twilio
 */

import { Router, Request, Response } from 'express';
import { getSMSService } from '../../../services/notifications/sms.service';
import { getGapDetectionService } from '../../../services/operations/gap-detection.service';

const router = Router();

/**
 * POST /api/webhooks/twilio/sms
 * Handle incoming SMS from caregivers (Twilio webhook)
 *
 * Twilio sends POST requests with these parameters:
 * - From: Sender phone number
 * - To: Your Twilio number
 * - Body: Message text
 * - MessageSid: Unique message ID
 */
router.post('/sms', async (req: Request, res: Response) => {
  try {
    const { From, Body, MessageSid } = req.body;

    console.log('[TWILIO WEBHOOK] Received SMS:');
    console.log(`  From: ${From}`);
    console.log(`  Body: ${Body}`);
    console.log(`  MessageSid: ${MessageSid}`);

    const smsService = getSMSService();
    const parsed = smsService.parseIncomingResponse(Body);

    console.log(`  Parsed Type: ${parsed.type}`);
    console.log(`  Gap ID: ${parsed.gapId || 'Not found'}`);

    if (parsed.type === 'accept') {
      // Caregiver accepted the dispatch
      if (parsed.gapId) {
        const gapService = getGapDetectionService();

        // TODO: Get caregiver ID from phone number
        // const caregiver = await db.query(`
        //   SELECT id FROM caregivers WHERE phone = $1
        // `, [From]);

        const caregiverId = 'caregiver-placeholder';

        await gapService.markAsDispatched(parsed.gapId, caregiverId);

        console.log(`[TWILIO WEBHOOK] Gap ${parsed.gapId} marked as dispatched to ${From}`);

        // TODO: Send confirmation SMS to Pod Lead
        // await smsService.sendDispatchConfirmation({
        //   podLeadPhone: gap.podLeadPhone,
        //   replacementCaregiverName: caregiver.name,
        //   patientName: gap.patientName,
        //   status: 'accepted',
        // });

        // Send confirmation to caregiver
        await smsService.sendSMS({
          to: From,
          message: '✅ Dispatch accepted! Please head to the patient location and clock in when you arrive. Thank you!',
        });
      } else {
        console.warn('[TWILIO WEBHOOK] Gap ID not found in message');
        await smsService.sendSMS({
          to: From,
          message: '⚠️ Could not process your response. Please check the dashboard or contact your Pod Lead.',
        });
      }
    } else if (parsed.type === 'decline') {
      // Caregiver declined the dispatch
      if (parsed.gapId) {
        console.log(`[TWILIO WEBHOOK] Gap ${parsed.gapId} declined by ${From}`);

        // TODO: Send notification to Pod Lead
        // await smsService.sendDispatchConfirmation({
        //   podLeadPhone: gap.podLeadPhone,
        //   replacementCaregiverName: caregiver.name,
        //   patientName: gap.patientName,
        //   status: 'declined',
        // });

        // Send confirmation to caregiver
        await smsService.sendSMS({
          to: From,
          message: '✅ Dispatch declined. Your Pod Lead has been notified. Thank you for responding.',
        });
      } else {
        console.warn('[TWILIO WEBHOOK] Gap ID not found in message');
      }
    } else {
      // Unknown response type
      console.warn(`[TWILIO WEBHOOK] Unknown response type from ${From}`);
      await smsService.sendSMS({
        to: From,
        message: '⚠️ Please reply with YES to accept or NO to decline the dispatch request.',
      });
    }

    // Twilio expects TwiML response (XML)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error: any) {
    console.error('[TWILIO WEBHOOK] Error processing SMS:', error);

    // Still return 200 OK to Twilio (prevents retries)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

/**
 * POST /api/webhooks/twilio/status
 * Handle SMS delivery status updates (optional)
 *
 * Twilio sends updates about message delivery:
 * - queued
 * - sent
 * - delivered
 * - failed
 */
router.post('/status', async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, To, ErrorCode } = req.body;

    console.log('[TWILIO WEBHOOK] SMS Status Update:');
    console.log(`  MessageSid: ${MessageSid}`);
    console.log(`  Status: ${MessageStatus}`);
    console.log(`  To: ${To}`);
    if (ErrorCode) {
      console.log(`  Error: ${ErrorCode}`);
    }

    // TODO: Update database with delivery status
    // await db.query(`
    //   UPDATE sms_log
    //   SET status = $1, error_code = $2, updated_at = NOW()
    //   WHERE twilio_sid = $3
    // `, [MessageStatus, ErrorCode || null, MessageSid]);

    // Twilio expects 200 OK
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error: any) {
    console.error('[TWILIO WEBHOOK] Error processing status:', error);

    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

export default router;
