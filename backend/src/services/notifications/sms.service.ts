/**
 * SMS Service
 * Handles SMS sending via Twilio with two-way messaging support
 *
 * @module services/notifications/sms
 */

import twilio from 'twilio';

interface SMSData {
  to: string; // Phone number in E.164 format (e.g., +19375550100)
  message: string;
  from?: string; // Optional sender number (defaults to TWILIO_PHONE_NUMBER)
}

interface SMSResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
  dateSent?: Date;
}

export class SMSService {
  private client: twilio.Twilio | null = null;
  private isConfigured: boolean = false;
  private fromNumber: string;

  constructor() {
    // Configure Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+19375550100';

    if (accountSid && authToken && accountSid !== 'your-twilio-account-sid') {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
    } else {
      console.warn('[SMSService] Twilio not configured. SMS will be logged instead of sent.');
      this.isConfigured = false;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(data: SMSData): Promise<SMSResponse> {
    const from = data.from || this.fromNumber;

    if (this.isConfigured && this.client) {
      try {
        const message = await this.client.messages.create({
          body: data.message,
          from,
          to: data.to,
        });

        console.log(`[SMSService] SMS sent to ${data.to}: ${message.sid}`);

        return {
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          body: message.body,
          dateCreated: message.dateCreated,
          dateSent: message.dateSent || undefined,
        };
      } catch (error: any) {
        console.error('[SMSService] Failed to send SMS:', error.message);
        throw new Error(`SMS delivery failed: ${error.message}`);
      }
    } else {
      // Development mode - log SMS instead of sending
      console.log('\n========== SMS (DEV MODE) ==========');
      console.log('To:', data.to);
      console.log('From:', from);
      console.log('Message:');
      console.log(data.message);
      console.log('=====================================\n');

      return {
        sid: `DEV-${Date.now()}`,
        status: 'delivered',
        to: data.to,
        from,
        body: data.message,
        dateCreated: new Date(),
        dateSent: new Date(),
      };
    }
  }

  /**
   * Send dispatch request to on-call caregiver
   */
  async sendDispatchRequest(data: {
    caregiverName: string;
    caregiverPhone: string;
    patientName: string;
    patientAddress: string;
    scheduledStart: Date;
    gapId: string;
  }): Promise<SMSResponse> {
    const timeStr = data.scheduledStart.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = `
🔔 DISPATCH REQUEST

${data.caregiverName}, you have been requested for an urgent shift:

Patient: ${data.patientName}
Address: ${data.patientAddress}
Time: ${timeStr}

Reply:
  YES to accept
  NO to decline

Gap ID: ${data.gapId}
    `.trim();

    return await this.sendSMS({
      to: data.caregiverPhone,
      message,
    });
  }

  /**
   * Send gap alert to Pod Lead
   */
  async sendGapAlert(data: {
    podLeadName: string;
    podLeadPhone: string;
    patientName: string;
    patientAddress: string;
    caregiverName: string;
    minutesLate: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    gapId: string;
  }): Promise<SMSResponse> {
    const emoji = data.severity === 'critical' ? '🔴' :
                  data.severity === 'high' ? '🟠' :
                  data.severity === 'medium' ? '🟡' : '🔵';

    const urgencyText = data.severity === 'critical' ? 'CRITICAL' :
                        data.severity === 'high' ? 'HIGH' :
                        data.severity === 'medium' ? 'MEDIUM' : 'LOW';

    const message = `
${emoji} ${urgencyText} COVERAGE GAP

${data.caregiverName} is ${data.minutesLate} min late for:

Patient: ${data.patientName}
Address: ${data.patientAddress}

Check dashboard to dispatch.
Gap ID: ${data.gapId}
    `.trim();

    return await this.sendSMS({
      to: data.podLeadPhone,
      message,
    });
  }

  /**
   * Send dispatch confirmation to Pod Lead
   */
  async sendDispatchConfirmation(data: {
    podLeadPhone: string;
    replacementCaregiverName: string;
    patientName: string;
    status: 'accepted' | 'declined' | 'dispatched';
  }): Promise<SMSResponse> {
    let message: string;

    if (data.status === 'accepted') {
      message = `✅ ${data.replacementCaregiverName} ACCEPTED the dispatch request for ${data.patientName}. They are on the way.`;
    } else if (data.status === 'declined') {
      message = `❌ ${data.replacementCaregiverName} DECLINED the dispatch request for ${data.patientName}. Please dispatch another caregiver.`;
    } else {
      message = `📤 Dispatch request sent to ${data.replacementCaregiverName} for ${data.patientName}. Waiting for response...`;
    }

    return await this.sendSMS({
      to: data.podLeadPhone,
      message,
    });
  }

  /**
   * Send credential expiration alert via SMS
   */
  async sendCredentialExpirationSMS(data: {
    caregiverName: string;
    caregiverPhone: string;
    credentialType: string;
    daysLeft: number;
  }): Promise<SMSResponse> {
    const emoji = data.daysLeft <= 0 ? '🔴' :
                  data.daysLeft <= 7 ? '⚠️' : '⏰';

    const urgency = data.daysLeft <= 0 ? 'EXPIRED' :
                    data.daysLeft <= 7 ? 'URGENT' : 'REMINDER';

    const message = `
${emoji} ${urgency}: ${data.credentialType}

${data.caregiverName}, your ${data.credentialType} ${data.daysLeft <= 0 ? 'has expired' : `expires in ${data.daysLeft} days`}.

${data.daysLeft <= 0 ? '⚠️ You cannot be scheduled until renewed.' : 'Please renew ASAP to avoid scheduling issues.'}

Contact HR: hr@serenitycarepartners.com
    `.trim();

    return await this.sendSMS({
      to: data.caregiverPhone,
      message,
    });
  }

  /**
   * Send shift reminder to caregiver
   */
  async sendShiftReminder(data: {
    caregiverName: string;
    caregiverPhone: string;
    patientName: string;
    patientAddress: string;
    scheduledStart: Date;
    minutesUntil: number;
  }): Promise<SMSResponse> {
    const timeStr = data.scheduledStart.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = `
⏰ SHIFT REMINDER

${data.caregiverName}, your shift starts in ${data.minutesUntil} minutes:

Patient: ${data.patientName}
Address: ${data.patientAddress}
Time: ${timeStr}

Don't forget to clock in when you arrive!
    `.trim();

    return await this.sendSMS({
      to: data.caregiverPhone,
      message,
    });
  }

  /**
   * Parse incoming SMS response (for two-way messaging)
   */
  parseIncomingResponse(message: string): {
    type: 'accept' | 'decline' | 'unknown';
    gapId?: string;
  } {
    const messageLower = message.toLowerCase().trim();

    // Extract gap ID if present
    const gapIdMatch = message.match(/gap\s+id:\s*([a-z0-9-]+)/i);
    const gapId = gapIdMatch ? gapIdMatch[1] : undefined;

    // Detect response type
    if (messageLower.includes('yes') || messageLower.includes('accept') || messageLower.includes('y')) {
      return { type: 'accept', gapId };
    } else if (messageLower.includes('no') || messageLower.includes('decline') || messageLower.includes('n')) {
      return { type: 'decline', gapId };
    } else {
      return { type: 'unknown', gapId };
    }
  }

  /**
   * Validate phone number format (E.164)
   */
  isValidPhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number]
    // Example: +19375550100
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Format phone number to E.164 (basic US formatting)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, '');

    // If starts with 1, assume it's US with country code
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // If 10 digits, assume US without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    // Otherwise, return as-is with + prefix if missing
    return digits.startsWith('+') ? digits : `+${digits}`;
  }

  /**
   * Check if SMS service is configured
   */
  isConfiguredAndReady(): boolean {
    return this.isConfigured;
  }
}

// Singleton instance
let smsServiceInstance: SMSService | null = null;

export function getSMSService(): SMSService {
  if (!smsServiceInstance) {
    smsServiceInstance = new SMSService();
  }
  return smsServiceInstance;
}
