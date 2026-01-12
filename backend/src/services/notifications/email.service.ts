/**
 * Email Service
 * Handles all email sending via SMTP (Hostinger) or SendGrid
 *
 * Supports two modes:
 * 1. SMTP (Hostinger) - Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * 2. SendGrid - Set SENDGRID_API_KEY
 *
 * @module services/notifications/email
 */

import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import { createLogger } from '../../utils/logger';
import { generateInterviewCalendarEvent } from '../../utils/calendar';

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

const logger = createLogger('email');

type EmailProvider = 'smtp' | 'sendgrid' | 'none';

interface ApplicationConfirmationData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  applicationId: string;
  submittedAt: string;
}

interface NewApplicationAlertData {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  jobTitle: string;
  applicationId: string;
  submittedAt: string;
  experience: string;
  availability: string;
}

interface CredentialExpirationAlertData {
  to: string;
  name: string;
  credentialType: string;
  expirationDate: Date;
  daysLeft: number;
  alertLevel: 'info' | 'warning' | 'urgent' | 'critical';
}

interface InterviewScheduledData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  interviewType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  location: string;
  interviewerName: string;
  notes?: string;
}

interface RejectionNotificationData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  reason?: string;
}

interface InterviewCancelledData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  originalDate: string;
  originalTime: string;
  reason?: string;
}

interface JobOfferData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  startDate?: string;
  salary?: string;
  notes?: string;
}

interface MovedToInterviewData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
}

interface WelcomeNewHireData {
  employeeName: string;
  employeeEmail: string;
  jobTitle: string;
  startDate: string;
  onboardingItemCount: number;
}

interface NewHireAlertData {
  employeeName: string;
  employeeEmail: string;
  jobTitle: string;
  startDate: string;
  onboardingId: string | null;
}

interface CredentialDigestData {
  to: string;
  expiringSoon: Record<number, Array<{
    caregiverName: string;
    caregiverEmail: string;
    type: string;
    expirationDate: Date;
    daysLeft: number;
  }>>;
  expired: Array<{
    caregiverName: string;
    caregiverEmail: string;
    type: string;
    expirationDate: Date;
    daysLeft: number;
  }>;
  date: string;
}

export interface ComplianceAlertData {
  to: string;
  subject: string;
  gaps: Array<{
    id: string;
    type: string;
    severity: string;
    patientName: string;
    caregiverName?: string;
    details: string;
    detectedAt: Date;
  }>;
}

export class EmailService {
  private provider: EmailProvider = 'none';
  private smtpTransporter: Transporter | null = null;
  private fromEmail: string;
  private hrEmail: string;

  constructor() {
    // Priority: SMTP (Hostinger) > SendGrid > None
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    if (smtpHost && smtpUser && smtpPass) {
      // Configure SMTP (Hostinger or other provider)
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.provider = 'smtp';
      logger.info('[EmailService] Configured with SMTP provider', { host: smtpHost });
    } else if (sendgridKey && sendgridKey !== 'your-sendgrid-api-key-here') {
      // Fallback to SendGrid
      sgMail.setApiKey(sendgridKey);
      this.provider = 'sendgrid';
      logger.info('[EmailService] Configured with SendGrid provider');
    } else {
      logger.warn('[EmailService] No email provider configured. Emails will be logged instead of sent.');
      logger.warn('[EmailService] Set SMTP_HOST, SMTP_USER, SMTP_PASS for Hostinger, or SENDGRID_API_KEY for SendGrid');
      this.provider = 'none';
    }

    this.fromEmail = process.env.EMAIL_FROM || 'hello@serenitycarepartners.com';
    this.hrEmail = process.env.HR_EMAIL || 'hello@serenitycarepartners.com';
  }

  /**
   * Send application confirmation email to applicant
   */
  async sendApplicationConfirmation(data: ApplicationConfirmationData): Promise<void> {
    const subject = `Application Received - ${data.jobTitle}`;
    const html = this.getApplicationConfirmationHTML(data);
    const text = this.getApplicationConfirmationText(data);

    await this.sendEmail({
      to: data.applicantEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Application confirmation sent to ${data.applicantEmail}`);
  }

  /**
   * Send new application alert to HR team
   */
  async sendNewApplicationAlert(data: NewApplicationAlertData): Promise<void> {
    const subject = `🔔 New Application: ${data.jobTitle} - ${data.applicantName}`;
    const html = this.getNewApplicationAlertHTML(data);
    const text = this.getNewApplicationAlertText(data);

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] New application alert sent to ${this.hrEmail}`);
  }

  /**
   * Send credential expiration alert to caregiver
   */
  async sendCredentialExpirationAlert(data: CredentialExpirationAlertData): Promise<void> {
    const emoji = data.alertLevel === 'critical' ? '🔴' :
      data.alertLevel === 'urgent' ? '⚠️' :
        data.alertLevel === 'warning' ? '⏰' : '📋';

    const subject = `${emoji} ${data.credentialType} ${data.daysLeft <= 0 ? 'Expired' : `Expires in ${data.daysLeft} Days`}`;
    const html = this.getCredentialExpirationAlertHTML(data);
    const text = this.getCredentialExpirationAlertText(data);

    await this.sendEmail({
      to: data.to,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Credential expiration alert sent to ${data.to}`);
  }

  /**
   * Send daily credential digest to HR
   */
  async sendCredentialDigest(data: CredentialDigestData): Promise<void> {
    const expiredCount = data.expired.length;
    const expiringSoonCount = Object.values(data.expiringSoon).flat().length;
    const totalCount = expiredCount + expiringSoonCount;

    const subject = `📊 Credential Digest - ${totalCount} Requiring Attention`;
    const html = this.getCredentialDigestHTML(data);
    const text = this.getCredentialDigestText(data);

    await this.sendEmail({
      to: data.to,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Credential digest sent to ${data.to}`);
  }

  /**
   * Send interview scheduled notification to applicant (with calendar invite)
   */
  async sendInterviewScheduled(data: InterviewScheduledData): Promise<void> {
    const subject = `Interview Scheduled - ${data.jobTitle} at Serenity Care Partners`;
    const html = this.getInterviewScheduledHTML(data);
    const text = this.getInterviewScheduledText(data);

    // Generate calendar invite
    const icsContent = generateInterviewCalendarEvent({
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      jobTitle: data.jobTitle,
      interviewType: data.interviewType,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      duration: data.duration,
      location: data.location,
      interviewerName: data.interviewerName,
      notes: data.notes
    });

    await this.sendEmail({
      to: data.applicantEmail,
      subject,
      html,
      text,
      attachments: [{
        filename: 'interview-invite.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }]
    });

    logger.info(`[EmailService] Interview scheduled notification with calendar invite sent to ${data.applicantEmail}`);
  }

  /**
   * Send interview scheduled alert to HR team (with calendar invite)
   */
  async sendInterviewScheduledAlert(data: InterviewScheduledData): Promise<void> {
    const subject = `📅 Interview Scheduled: ${data.applicantName} - ${data.jobTitle}`;
    const html = this.getInterviewScheduledAlertHTML(data);
    const text = this.getInterviewScheduledAlertText(data);

    // Generate calendar invite for HR
    const icsContent = generateInterviewCalendarEvent({
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      jobTitle: data.jobTitle,
      interviewType: data.interviewType,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      duration: data.duration,
      location: data.location,
      interviewerName: data.interviewerName,
      notes: data.notes
    });

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text,
      attachments: [{
        filename: 'interview-invite.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }]
    });

    logger.info(`[EmailService] Interview scheduled alert with calendar invite sent to ${this.hrEmail}`);
  }

  /**
   * Send rejection notification to applicant
   */
  async sendRejectionNotification(data: RejectionNotificationData): Promise<void> {
    const subject = `Application Update - ${data.jobTitle} at Serenity Care Partners`;
    const html = this.getRejectionNotificationHTML(data);
    const text = this.getRejectionNotificationText(data);

    await this.sendEmail({
      to: data.applicantEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Rejection notification sent to ${data.applicantEmail}`);
  }

  /**
   * Send rejection alert to HR team
   */
  async sendRejectionAlert(data: RejectionNotificationData): Promise<void> {
    const subject = `❌ Application Rejected: ${data.applicantName} - ${data.jobTitle}`;
    const html = this.getRejectionAlertHTML(data);
    const text = this.getRejectionAlertText(data);

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Rejection alert sent to ${this.hrEmail}`);
  }

  /**
   * Send notification to candidate when moved to interview stage
   */
  async sendMovedToInterview(data: MovedToInterviewData): Promise<void> {
    const subject = `Great News! Your Application is Progressing - ${data.jobTitle}`;
    const html = this.getMovedToInterviewHTML(data);
    const text = this.getMovedToInterviewText(data);

    await this.sendEmail({
      to: data.applicantEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Moved to interview notification sent to ${data.applicantEmail}`);
  }

  /**
   * Send alert to HR when candidate is moved to interview stage
   */
  async sendMovedToInterviewAlert(data: MovedToInterviewData): Promise<void> {
    const subject = `📋 Candidate Moved to Interview: ${data.applicantName} - ${data.jobTitle}`;
    const html = this.getMovedToInterviewAlertHTML(data);
    const text = this.getMovedToInterviewAlertText(data);

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Moved to interview alert sent to ${this.hrEmail}`);
  }

  /**
   * Send interview cancelled notification to applicant
   */
  async sendInterviewCancelled(data: InterviewCancelledData): Promise<void> {
    const subject = `Interview Cancellation - ${data.jobTitle} at Serenity Care Partners`;
    const html = this.getInterviewCancelledHTML(data);
    const text = this.getInterviewCancelledText(data);

    await this.sendEmail({
      to: data.applicantEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Interview cancelled notification sent to ${data.applicantEmail}`);
  }

  /**
   * Send interview cancelled alert to HR team
   */
  async sendInterviewCancelledAlert(data: InterviewCancelledData): Promise<void> {
    const subject = `❌ Interview Cancelled: ${data.applicantName} - ${data.jobTitle}`;
    const html = this.getInterviewCancelledAlertHTML(data);
    const text = this.getInterviewCancelledAlertText(data);

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Interview cancelled alert sent to ${this.hrEmail}`);
  }

  /**
   * Send job offer notification to applicant
   */
  async sendJobOffer(data: JobOfferData): Promise<void> {
    const subject = `Job Offer - ${data.jobTitle} at Serenity Care Partners`;
    const html = this.getJobOfferHTML(data);
    const text = this.getJobOfferText(data);

    await this.sendEmail({
      to: data.applicantEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Job offer sent to ${data.applicantEmail}`);
  }

  /**
   * Send job offer alert to HR team
   */
  async sendJobOfferAlert(data: JobOfferData): Promise<void> {
    const subject = `🎉 Job Offer Extended: ${data.applicantName} - ${data.jobTitle}`;
    const html = this.getJobOfferAlertHTML(data);
    const text = this.getJobOfferAlertText(data);

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Job offer alert sent to ${this.hrEmail}`);
  }

  /**
   * Send welcome email to new hire after offer acceptance
   */
  async sendWelcomeNewHire(data: WelcomeNewHireData): Promise<void> {
    const subject = `Welcome to Serenity Care Partners! 🎉`;
    const html = this.getWelcomeNewHireHTML(data);
    const text = this.getWelcomeNewHireText(data);

    await this.sendEmail({
      to: data.employeeEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] Welcome email sent to new hire ${data.employeeEmail}`);
  }

  /**
   * Send new hire alert to HR team
   */
  async sendNewHireAlert(data: NewHireAlertData): Promise<void> {
    const subject = `✅ New Hire Confirmed: ${data.employeeName} - ${data.jobTitle}`;
    const html = this.getNewHireAlertHTML(data);
    const text = this.getNewHireAlertText(data);

    await this.sendEmail({
      to: this.hrEmail,
      subject,
      html,
      text
    });

    logger.info(`[EmailService] New hire alert sent to ${this.hrEmail}`);
  }

  /**
   * Send compliance alert to compliance officer
   */
  async sendComplianceAlert(data: ComplianceAlertData): Promise<void> {
    const html = `
      <h2>Compliance Alert</h2>
      <p>The following compliance gaps were detected:</p>
      <ul>
        ${data.gaps.map(g => `
          <li>
            <strong>${g.severity.toUpperCase()}</strong>: ${g.type} - ${g.patientName}
            <br/>${g.details}
          </li>
        `).join('')}
      </ul>
    `;

    await this.sendEmail({
      to: data.to,
      subject: data.subject,
      html,
      text: JSON.stringify(data.gaps, null, 2) // Simplified text version
    });

    logger.info(`[EmailService] Compliance alert sent to ${data.to}`);
  }

  /**
   * Send email via SMTP (Hostinger) or SendGrid, or log if not configured
   */
  public async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: EmailAttachment[];
  }): Promise<void> {
    const fromName = 'Serenity Care Partners';

    if (this.provider === 'smtp' && this.smtpTransporter) {
      // Send via SMTP (Hostinger)
      try {
        const mailOptions: any = {
          from: `"${fromName}" <${this.fromEmail}>`,
          to: params.to,
          subject: params.subject,
          text: params.text,
          html: params.html,
        };

        // Add attachments if provided
        if (params.attachments && params.attachments.length > 0) {
          mailOptions.attachments = params.attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType || 'text/calendar; charset=utf-8; method=REQUEST'
          }));

          // For calendar invites, also set as alternative for better client support
          const icsAttachment = params.attachments.find(a => a.filename.endsWith('.ics'));
          if (icsAttachment) {
            mailOptions.icalEvent = {
              filename: icsAttachment.filename,
              method: 'REQUEST',
              content: icsAttachment.content
            };
          }
        }

        await this.smtpTransporter.sendMail(mailOptions);
        logger.info('[EmailService] Email sent via SMTP', { to: params.to, subject: params.subject, hasAttachments: !!params.attachments?.length });
      } catch (error: any) {
        logger.error('[EmailService] SMTP send failed:', error.message);
        throw error;
      }
    } else if (this.provider === 'sendgrid') {
      // Send via SendGrid
      try {
        const mailOptions: any = {
          to: params.to,
          from: { email: this.fromEmail, name: fromName },
          subject: params.subject,
          text: params.text,
          html: params.html,
        };

        // Add attachments if provided
        if (params.attachments && params.attachments.length > 0) {
          mailOptions.attachments = params.attachments.map(att => ({
            filename: att.filename,
            content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64'),
            type: att.contentType || 'text/calendar',
            disposition: 'attachment'
          }));
        }

        await sgMail.send(mailOptions);
        logger.info('[EmailService] Email sent via SendGrid', { to: params.to, subject: params.subject, hasAttachments: !!params.attachments?.length });
      } catch (error: any) {
        logger.error('[EmailService] SendGrid send failed:', error.message);
        if (error.response) {
          logger.error('[EmailService] SendGrid error details:', error.response.body);
        }
        throw error;
      }
    } else {
      // No provider configured - log email instead of sending
      logger.info('\n========== EMAIL (NOT CONFIGURED - LOGGING ONLY) ==========');
      logger.info(`To: ${params.to}`);
      logger.info(`From: ${this.fromEmail}`);
      logger.info(`Subject: ${params.subject}`);
      logger.info(`Attachments: ${params.attachments?.map(a => a.filename).join(', ') || 'none'}`);
      logger.info('--- TEXT VERSION ---');
      logger.info(params.text.substring(0, 500) + '...');
      logger.info('==========================================================\n');
    }
  }

  // ========================================
  // EMAIL TEMPLATES - HTML
  // ========================================

  private getApplicationConfirmationHTML(data: ApplicationConfirmationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Serenity Care Partners
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Compassionate Home Care Across Ohio
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                Application Received!
              </h2>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName},
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for applying for the <strong>${data.jobTitle}</strong> position at Serenity Care Partners.
                We have successfully received your application and our HR team will review it shortly.
              </p>

              <!-- Application Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      <strong>Application ID:</strong> ${data.applicationId}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      <strong>Position:</strong> ${data.jobTitle}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      <strong>Submitted:</strong> ${data.submittedAt} (EST)
                    </p>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">
                What's Next?
              </h3>

              <ol style="margin: 0 0 25px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Our HR team will review your application within <strong>2-3 business days</strong>
                </li>
                <li style="margin-bottom: 10px;">
                  If your qualifications match our needs, we'll contact you to schedule a phone screening
                </li>
                <li style="margin-bottom: 10px;">
                  Qualified candidates will be invited for an in-person interview
                </li>
                <li>
                  Final candidates will receive a job offer pending background check and credential verification
                </li>
              </ol>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We appreciate your interest in joining our team of compassionate caregivers. If you have any questions,
                please don't hesitate to reach out to our HR department.
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Serving Dayton, Columbus, and Cincinnati
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getNewApplicationAlertHTML(data: NewApplicationAlertData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🔔 New Application Received
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">
                Review and take action
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                ${data.applicantName} Applied for ${data.jobTitle}
              </h2>

              <!-- Applicant Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #059669; font-size: 18px;">
                      Applicant Information
                    </h3>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                      <strong>Name:</strong> ${data.applicantName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                      <strong>Email:</strong> <a href="mailto:${data.applicantEmail}" style="color: #2563eb;">${data.applicantEmail}</a>
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                      <strong>Phone:</strong> <a href="tel:${data.applicantPhone}" style="color: #2563eb;">${data.applicantPhone}</a>
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                      <strong>Position:</strong> ${data.jobTitle}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                      <strong>Experience:</strong> ${data.experience}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                      <strong>Availability:</strong> ${data.availability}
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 14px;">
                      <strong>Submitted:</strong> ${data.submittedAt} (EST)
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Items -->
              <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">
                Next Steps
              </h3>

              <ol style="margin: 0 0 25px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Review full application in <strong>HR Dashboard</strong>
                </li>
                <li style="margin-bottom: 10px;">
                  Check certifications (HHA/STNA license, CPR)
                </li>
                <li style="margin-bottom: 10px;">
                  Schedule phone screening if qualified
                </li>
                <li>
                  Update application status in system
                </li>
              </ol>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://console.serenitycarepartners.com/hr/applications?id=${data.applicationId}"
                       style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      View Application in Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Application ID:</strong> ${data.applicationId}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                This is an automated notification from Serenity ERP
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  // ========================================
  // EMAIL TEMPLATES - PLAIN TEXT
  // ========================================

  private getApplicationConfirmationText(data: ApplicationConfirmationData): string {
    return `
SERENITY CARE PARTNERS
Compassionate Home Care Across Ohio

Application Received!

Dear ${data.applicantName},

Thank you for applying for the ${data.jobTitle} position at Serenity Care Partners.
We have successfully received your application and our HR team will review it shortly.

APPLICATION DETAILS
-------------------
Application ID: ${data.applicationId}
Position: ${data.jobTitle}
Submitted: ${data.submittedAt} (EST)

WHAT'S NEXT?
------------
1. Our HR team will review your application within 2-3 business days
2. If your qualifications match our needs, we'll contact you to schedule a phone screening
3. Qualified candidates will be invited for an in-person interview
4. Final candidates will receive a job offer pending background check and credential verification

We appreciate your interest in joining our team of compassionate caregivers. If you have any
questions, please don't hesitate to reach out to our HR department.

Best regards,
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com
Serving Dayton, Columbus, and Cincinnati

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  private getNewApplicationAlertText(data: NewApplicationAlertData): string {
    return `
🔔 NEW APPLICATION RECEIVED

${data.applicantName} Applied for ${data.jobTitle}

APPLICANT INFORMATION
---------------------
Name: ${data.applicantName}
Email: ${data.applicantEmail}
Phone: ${data.applicantPhone}
Position: ${data.jobTitle}
Experience: ${data.experience}
Availability: ${data.availability}
Submitted: ${data.submittedAt} (EST)

NEXT STEPS
----------
1. Review full application in HR Dashboard
2. Check certifications (HHA/STNA license, CPR)
3. Schedule phone screening if qualified
4. Update application status in system

View Application: https://console.serenitycarepartners.com/hr/applications?id=${data.applicationId}

Application ID: ${data.applicationId}

---
This is an automated notification from Serenity ERP
© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  // ========================================
  // CREDENTIAL EXPIRATION EMAIL TEMPLATES
  // ========================================

  private getCredentialExpirationAlertHTML(data: CredentialExpirationAlertData): string {
    const { name, credentialType, expirationDate, daysLeft, alertLevel } = data;

    const isExpired = daysLeft <= 0;
    const urgency = isExpired ? 'EXPIRED' : `EXPIRES IN ${daysLeft} DAYS`;
    const statusColor = alertLevel === 'critical' ? '#dc2626' :
      alertLevel === 'urgent' ? '#ea580c' :
        alertLevel === 'warning' ? '#d97706' : '#2563eb';
    const actionText = isExpired ?
      'Your credential has expired and you cannot be scheduled for shifts until it is renewed.' :
      `Please renew your ${credentialType} as soon as possible to avoid scheduling issues.`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credential Expiration Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Serenity Care Partners
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Credential Management System
              </p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 20px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold;">
                ${urgency}
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${name},
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${actionText}
              </p>

              <!-- Credential Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #fef2f2; border: 2px solid ${statusColor}; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">
                      <strong>Credential:</strong> ${credentialType}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">
                      <strong>Expiration Date:</strong> ${expirationDate.toLocaleDateString('en-US', { dateStyle: 'long' })}
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 16px;">
                      <strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${isExpired ? 'EXPIRED' : `${daysLeft} days remaining`}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">
                What You Need To Do
              </h3>

              <ol style="margin: 0 0 25px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Contact the appropriate authority to renew your ${credentialType}
                </li>
                <li style="margin-bottom: 10px;">
                  Upload the renewed credential to your Serenity profile
                </li>
                <li style="margin-bottom: 10px;">
                  Notify your Pod Lead once renewed
                </li>
                ${isExpired ? `<li style="color: ${statusColor}; font-weight: bold;">You cannot be scheduled until this credential is renewed</li>` : ''}
              </ol>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you have already renewed this credential, please upload the updated document to your profile or
                contact HR at <a href="mailto:hr@serenitycarepartners.com" style="color: #2563eb;">hr@serenitycarepartners.com</a>.
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your attention to this matter,<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getCredentialExpirationAlertText(data: CredentialExpirationAlertData): string {
    const { name, credentialType, expirationDate, daysLeft } = data;
    const isExpired = daysLeft <= 0;
    const urgency = isExpired ? 'EXPIRED' : `EXPIRES IN ${daysLeft} DAYS`;

    return `
CREDENTIAL ${urgency}

Dear ${name},

Your ${credentialType} ${isExpired ? 'has expired' : `will expire in ${daysLeft} days`}.

CREDENTIAL DETAILS
------------------
Credential: ${credentialType}
Expiration Date: ${expirationDate.toLocaleDateString('en-US', { dateStyle: 'long' })}
Status: ${isExpired ? 'EXPIRED' : `${daysLeft} days remaining`}

WHAT YOU NEED TO DO
-------------------
1. Contact the appropriate authority to renew your ${credentialType}
2. Upload the renewed credential to your Serenity profile
3. Notify your Pod Lead once renewed
${isExpired ? '4. You cannot be scheduled until this credential is renewed' : ''}

If you have already renewed this credential, please upload the updated document to your profile or
contact HR at hr@serenitycarepartners.com.

Thank you for your attention to this matter,
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com

---
This is an automated notification from Serenity ERP
© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  private getCredentialDigestHTML(data: CredentialDigestData): string {
    const { expiringSoon, expired, date } = data;
    const expiredCount = expired.length;
    const expiringSoonCount = Object.values(expiringSoon).flat().length;
    const totalCount = expiredCount + expiringSoonCount;

    // Sort days ascending
    const sortedDays = Object.keys(expiringSoon).map(d => parseInt(d)).sort((a, b) => a - b);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Credential Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 700px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Daily Credential Digest
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                ${date}
              </p>
            </td>
          </tr>

          <!-- Summary Stats -->
          <tr>
            <td style="padding: 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 33%; padding: 20px; text-align: center; background-color: #fef2f2; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #dc2626;">${expiredCount}</div>
                    <div style="font-size: 14px; color: #991b1b; margin-top: 5px;">Expired</div>
                  </td>
                  <td style="width: 10%;"></td>
                  <td style="width: 33%; padding: 20px; text-align: center; background-color: #fef3c7; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #d97706;">${expiringSoonCount}</div>
                    <div style="font-size: 14px; color: #92400e; margin-top: 5px;">Expiring Soon</div>
                  </td>
                  <td style="width: 10%;"></td>
                  <td style="width: 33%; padding: 20px; text-align: center; background-color: #dbeafe; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: bold; color: #2563eb;">${totalCount}</div>
                    <div style="font-size: 14px; color: #1e3a8a; margin-top: 5px;">Total Alerts</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expired Credentials -->
          ${expiredCount > 0 ? `
          <tr>
            <td style="padding: 30px; padding-top: 0;">
              <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 20px; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                🔴 Expired Credentials (${expiredCount})
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
                <thead>
                  <tr style="background-color: #fee2e2;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #991b1b; border-bottom: 1px solid #fecaca;">Caregiver</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #991b1b; border-bottom: 1px solid #fecaca;">Credential</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #991b1b; border-bottom: 1px solid #fecaca;">Expired</th>
                  </tr>
                </thead>
                <tbody>
                  ${expired.map(cred => `
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #fecaca;">${cred.caregiverName}</td>
                    <td style="padding: 12px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #fecaca;">${cred.type}</td>
                    <td style="padding: 12px; font-size: 14px; color: #dc2626; font-weight: bold; border-bottom: 1px solid #fecaca;">${Math.abs(cred.daysLeft)} days ago</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Expiring Soon -->
          ${sortedDays.map(days => {
      const creds = expiringSoon[days];
      const color = days <= 7 ? '#ea580c' : days <= 15 ? '#d97706' : '#2563eb';
      const bgColor = days <= 7 ? '#fff7ed' : days <= 15 ? '#fef3c7' : '#dbeafe';
      const borderColor = days <= 7 ? '#fed7aa' : days <= 15 ? '#fde68a' : '#bfdbfe';

      return `
          <tr>
            <td style="padding: 30px; padding-top: 0;">
              <h2 style="margin: 0 0 20px 0; color: ${color}; font-size: 20px; border-bottom: 2px solid ${color}; padding-bottom: 10px;">
                ${days <= 7 ? '⚠️' : days <= 15 ? '⏰' : '📋'} Expiring in ${days} Days (${creds.length})
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px;">
                <thead>
                  <tr style="background-color: ${bgColor};">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #1f2937; border-bottom: 1px solid ${borderColor};">Caregiver</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #1f2937; border-bottom: 1px solid ${borderColor};">Credential</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #1f2937; border-bottom: 1px solid ${borderColor};">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  ${creds.map(cred => `
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #1f2937; border-bottom: 1px solid ${borderColor};">${cred.caregiverName}</td>
                    <td style="padding: 12px; font-size: 14px; color: #1f2937; border-bottom: 1px solid ${borderColor};">${cred.type}</td>
                    <td style="padding: 12px; font-size: 14px; color: #1f2937; border-bottom: 1px solid ${borderColor};">${cred.expirationDate.toLocaleDateString('en-US')}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
            `;
    }).join('')}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">
                This is your daily automated digest of credential expirations.
              </p>
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getCredentialDigestText(data: CredentialDigestData): string {
    const { expiringSoon, expired, date } = data;
    const expiredCount = expired.length;
    const expiringSoonCount = Object.values(expiringSoon).flat().length;
    const totalCount = expiredCount + expiringSoonCount;

    const sortedDays = Object.keys(expiringSoon).map(d => parseInt(d)).sort((a, b) => a - b);

    let text = `
DAILY CREDENTIAL DIGEST
${date}

SUMMARY
-------
Expired: ${expiredCount}
Expiring Soon: ${expiringSoonCount}
Total Requiring Attention: ${totalCount}

`;

    if (expiredCount > 0) {
      text += `
🔴 EXPIRED CREDENTIALS (${expiredCount})
${'='.repeat(60)}
`;
      expired.forEach(cred => {
        text += `${cred.caregiverName} - ${cred.type} - Expired ${Math.abs(cred.daysLeft)} days ago\n`;
      });
    }

    sortedDays.forEach(days => {
      const creds = expiringSoon[days];
      const emoji = days <= 7 ? '⚠️' : days <= 15 ? '⏰' : '📋';

      text += `
${emoji} EXPIRING IN ${days} DAYS (${creds.length})
${'='.repeat(60)}
`;
      creds.forEach(cred => {
        text += `${cred.caregiverName} - ${cred.type} - Expires ${cred.expirationDate.toLocaleDateString('en-US')}\n`;
      });
    });

    text += `
---
This is your daily automated digest of credential expirations.
Contact: (513) 400-5113 | hr@serenitycarepartners.com

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();

    return text;
  }

  // ========================================
  // INTERVIEW SCHEDULED EMAIL TEMPLATES
  // ========================================

  private getInterviewScheduledHTML(data: InterviewScheduledData): string {
    const interviewTypeLabels: Record<string, string> = {
      'phone': 'Phone Screen',
      'video': 'Video Interview',
      'in_person': 'In-Person Interview',
      'panel': 'Panel Interview',
      'working': 'Working Interview / Job Shadow',
      'final': 'Final Interview'
    };

    const formattedDate = new Date(data.scheduledDate + 'T' + data.scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Serenity Care Partners
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">
                Interview Scheduled
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                Great News, ${data.applicantName}!
              </h2>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that your application for <strong>${data.jobTitle}</strong> has
                progressed to the interview stage! We would like to schedule an interview with you.
              </p>

              <!-- Interview Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #059669; font-size: 18px;">
                      📅 Interview Details
                    </h3>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;">
                      <strong>Type:</strong> ${interviewTypeLabels[data.interviewType] || data.interviewType}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;">
                      <strong>Date & Time:</strong> ${formattedDate}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;">
                      <strong>Duration:</strong> ${data.duration} minutes
                    </p>
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;">
                      <strong>Location:</strong> ${data.location}
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 15px;">
                      <strong>Interviewer:</strong> ${data.interviewerName}
                    </p>
                  </td>
                </tr>
              </table>

              ${data.notes ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">📝 Additional Notes:</h4>
                <p style="margin: 0; color: #78350f; font-size: 14px;">${data.notes}</p>
              </div>
              ` : ''}

              <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">
                How to Prepare
              </h3>

              <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Review the job description and requirements
                </li>
                <li style="margin-bottom: 10px;">
                  Prepare examples of your caregiving experience
                </li>
                <li style="margin-bottom: 10px;">
                  Have your certifications and ID ready to present
                </li>
                <li style="margin-bottom: 10px;">
                  ${data.interviewType === 'video' ? 'Test your video and audio beforehand' :
                    data.interviewType === 'phone' ? 'Ensure you have good phone reception' :
                    'Arrive 10-15 minutes early'}
                </li>
                <li>
                  Prepare questions about the role and our organization
                </li>
              </ul>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you need to reschedule, please contact us at least 24 hours in advance at
                <a href="mailto:hr@serenitycarepartners.com" style="color: #2563eb;">hr@serenitycarepartners.com</a>
                or call <a href="tel:5134005113" style="color: #2563eb;">(513) 400-5113</a>.
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We look forward to meeting you!<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Serving Dayton, Columbus, and Cincinnati
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getInterviewScheduledText(data: InterviewScheduledData): string {
    const interviewTypeLabels: Record<string, string> = {
      'phone': 'Phone Screen',
      'video': 'Video Interview',
      'in_person': 'In-Person Interview',
      'panel': 'Panel Interview',
      'working': 'Working Interview / Job Shadow',
      'final': 'Final Interview'
    };

    const formattedDate = new Date(data.scheduledDate + 'T' + data.scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    return `
SERENITY CARE PARTNERS
Interview Scheduled

Great News, ${data.applicantName}!

We are pleased to inform you that your application for ${data.jobTitle} has progressed to the interview stage!

INTERVIEW DETAILS
-----------------
Type: ${interviewTypeLabels[data.interviewType] || data.interviewType}
Date & Time: ${formattedDate}
Duration: ${data.duration} minutes
Location: ${data.location}
Interviewer: ${data.interviewerName}

${data.notes ? `ADDITIONAL NOTES\n----------------\n${data.notes}\n` : ''}

HOW TO PREPARE
--------------
1. Review the job description and requirements
2. Prepare examples of your caregiving experience
3. Have your certifications and ID ready to present
4. ${data.interviewType === 'video' ? 'Test your video and audio beforehand' :
     data.interviewType === 'phone' ? 'Ensure you have good phone reception' :
     'Arrive 10-15 minutes early'}
5. Prepare questions about the role and our organization

If you need to reschedule, please contact us at least 24 hours in advance at
hr@serenitycarepartners.com or call (513) 400-5113.

We look forward to meeting you!
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com
Serving Dayton, Columbus, and Cincinnati

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  private getInterviewScheduledAlertHTML(data: InterviewScheduledData): string {
    const interviewTypeLabels: Record<string, string> = {
      'phone': 'Phone Screen',
      'video': 'Video Interview',
      'in_person': 'In-Person Interview',
      'panel': 'Panel Interview',
      'working': 'Working Interview / Job Shadow',
      'final': 'Final Interview'
    };

    const formattedDate = new Date(data.scheduledDate + 'T' + data.scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Scheduled Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">📅 Interview Scheduled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937;">${data.applicantName} - ${data.jobTitle}</h2>
              <table style="width: 100%; background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                <tr><td style="padding: 8px;"><strong>Type:</strong> ${interviewTypeLabels[data.interviewType] || data.interviewType}</td></tr>
                <tr><td style="padding: 8px;"><strong>Date/Time:</strong> ${formattedDate}</td></tr>
                <tr><td style="padding: 8px;"><strong>Duration:</strong> ${data.duration} minutes</td></tr>
                <tr><td style="padding: 8px;"><strong>Location:</strong> ${data.location}</td></tr>
                <tr><td style="padding: 8px;"><strong>Interviewer:</strong> ${data.interviewerName}</td></tr>
                <tr><td style="padding: 8px;"><strong>Email:</strong> ${data.applicantEmail}</td></tr>
              </table>
              ${data.notes ? `<p style="margin-top: 15px; color: #6b7280;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getInterviewScheduledAlertText(data: InterviewScheduledData): string {
    const formattedDate = new Date(data.scheduledDate + 'T' + data.scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    return `
INTERVIEW SCHEDULED

Applicant: ${data.applicantName}
Position: ${data.jobTitle}
Type: ${data.interviewType}
Date/Time: ${formattedDate}
Duration: ${data.duration} minutes
Location: ${data.location}
Interviewer: ${data.interviewerName}
Email: ${data.applicantEmail}
${data.notes ? `Notes: ${data.notes}` : ''}
    `.trim();
  }

  // ========================================
  // REJECTION NOTIFICATION EMAIL TEMPLATES
  // ========================================

  private getRejectionNotificationHTML(data: RejectionNotificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Serenity Care Partners
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Compassionate Home Care Across Ohio
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName},
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in the <strong>${data.jobTitle}</strong> position at Serenity Care Partners
                and for taking the time to apply.
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                After careful consideration, we have decided to move forward with other candidates whose qualifications
                more closely align with our current needs. This was a difficult decision as we received many strong applications.
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We genuinely appreciate your interest in joining our team and encourage you to apply for future opportunities
                that match your skills and experience. We will keep your application on file for consideration
                should a suitable position become available.
              </p>

              <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 16px;">Stay Connected</h4>
                <p style="margin: 0; color: #047857; font-size: 14px;">
                  Visit our careers page regularly for new openings:<br>
                  <a href="https://serenitycarepartners.com/careers" style="color: #2563eb;">serenitycarepartners.com/careers</a>
                </p>
              </div>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We wish you the best in your job search and future career endeavors.
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Sincerely,<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getRejectionNotificationText(data: RejectionNotificationData): string {
    return `
SERENITY CARE PARTNERS
Application Update

Dear ${data.applicantName},

Thank you for your interest in the ${data.jobTitle} position at Serenity Care Partners
and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose
qualifications more closely align with our current needs. This was a difficult decision
as we received many strong applications.

We genuinely appreciate your interest in joining our team and encourage you to apply
for future opportunities that match your skills and experience. We will keep your
application on file for consideration should a suitable position become available.

STAY CONNECTED
--------------
Visit our careers page regularly for new openings:
https://serenitycarepartners.com/careers

We wish you the best in your job search and future career endeavors.

Sincerely,
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  // ========================================
  // REJECTION ALERT (HR) EMAIL TEMPLATES
  // ========================================

  private getRejectionAlertHTML(data: RejectionNotificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Rejected</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ❌ Application Rejected
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Candidate:</strong>
                    <span style="color: #111827; float: right;">${data.applicantName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <span style="color: #111827; float: right;">${data.applicantEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Position:</strong>
                    <span style="color: #111827; float: right;">${data.jobTitle}</span>
                  </td>
                </tr>
                ${data.reason ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #6b7280;">Reason:</strong>
                    <p style="color: #111827; margin: 5px 0 0 0;">${data.reason}</p>
                  </td>
                </tr>
                ` : ''}
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                The candidate has been notified of this decision via email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getRejectionAlertText(data: RejectionNotificationData): string {
    return `
❌ APPLICATION REJECTED

Candidate: ${data.applicantName}
Email: ${data.applicantEmail}
Position: ${data.jobTitle}
${data.reason ? `Reason: ${data.reason}` : ''}

The candidate has been notified of this decision via email.
    `.trim();
  }

  // ========================================
  // MOVED TO INTERVIEW EMAIL TEMPLATES
  // ========================================

  private getMovedToInterviewHTML(data: MovedToInterviewData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Great News!
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">
                Your application is progressing
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName},
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that your application for the <strong>${data.jobTitle}</strong> position
                at Serenity Care Partners has moved forward in our hiring process!
              </p>

              <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 16px;">📋 What's Next?</h4>
                <p style="margin: 0; color: #047857; font-size: 14px;">
                  Our team is reviewing your qualifications and will be reaching out soon to schedule an interview.
                  Please ensure your contact information is up to date and watch for our call or email.
                </p>
              </div>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                In the meantime, we encourage you to:
              </p>
              <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li>Review our website to learn more about Serenity Care Partners</li>
                <li>Prepare any questions you may have about the role</li>
                <li>Ensure your certifications and references are readily available</li>
              </ul>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in joining our team. We look forward to speaking with you!
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getMovedToInterviewText(data: MovedToInterviewData): string {
    return `
GREAT NEWS!
Your Application is Progressing

Dear ${data.applicantName},

We are pleased to inform you that your application for the ${data.jobTitle} position
at Serenity Care Partners has moved forward in our hiring process!

WHAT'S NEXT?
------------
Our team is reviewing your qualifications and will be reaching out soon to schedule
an interview. Please ensure your contact information is up to date and watch for
our call or email.

In the meantime, we encourage you to:
- Review our website to learn more about Serenity Care Partners
- Prepare any questions you may have about the role
- Ensure your certifications and references are readily available

Thank you for your interest in joining our team. We look forward to speaking with you!

Best regards,
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  private getMovedToInterviewAlertHTML(data: MovedToInterviewData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Moved to Interview</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                📋 Candidate Moved to Interview
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Candidate:</strong>
                    <span style="color: #111827; float: right;">${data.applicantName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <span style="color: #111827; float: right;">${data.applicantEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #6b7280;">Position:</strong>
                    <span style="color: #111827; float: right;">${data.jobTitle}</span>
                  </td>
                </tr>
              </table>

              <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Action Required:</strong> Please schedule an interview with this candidate.
                </p>
              </div>

              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                The candidate has been notified that their application is progressing.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getMovedToInterviewAlertText(data: MovedToInterviewData): string {
    return `
📋 CANDIDATE MOVED TO INTERVIEW

Candidate: ${data.applicantName}
Email: ${data.applicantEmail}
Position: ${data.jobTitle}

ACTION REQUIRED: Please schedule an interview with this candidate.

The candidate has been notified that their application is progressing.
    `.trim();
  }

  // ========================================
  // INTERVIEW CANCELLED EMAIL TEMPLATES
  // ========================================

  private getInterviewCancelledHTML(data: InterviewCancelledData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Cancellation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Serenity Care Partners
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Compassionate Home Care Across Ohio
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName},
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We regret to inform you that your scheduled interview for the <strong>${data.jobTitle}</strong> position
                has been cancelled.
              </p>

              <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">❌ Cancelled Interview</h4>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                  <strong>Originally Scheduled:</strong> ${data.originalDate} at ${data.originalTime}
                </p>
                ${data.reason ? `<p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 14px;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
              </div>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We sincerely apologize for any inconvenience this may cause. Our HR team will be in touch with you
                shortly to discuss next steps and potentially reschedule if appropriate.
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you have any questions, please don't hesitate to reach out to us.
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Sincerely,<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getInterviewCancelledText(data: InterviewCancelledData): string {
    return `
SERENITY CARE PARTNERS
Interview Cancellation

Dear ${data.applicantName},

We regret to inform you that your scheduled interview for the ${data.jobTitle} position
has been cancelled.

CANCELLED INTERVIEW
-------------------
Originally Scheduled: ${data.originalDate} at ${data.originalTime}
${data.reason ? `Reason: ${data.reason}` : ''}

We sincerely apologize for any inconvenience this may cause. Our HR team will be in
touch with you shortly to discuss next steps and potentially reschedule if appropriate.

If you have any questions, please don't hesitate to reach out to us.

Sincerely,
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  private getInterviewCancelledAlertHTML(data: InterviewCancelledData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ❌ Interview Cancelled
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Candidate:</strong>
                    <span style="color: #111827; float: right;">${data.applicantName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Position:</strong>
                    <span style="color: #111827; float: right;">${data.jobTitle}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Original Date:</strong>
                    <span style="color: #111827; float: right;">${data.originalDate} at ${data.originalTime}</span>
                  </td>
                </tr>
                ${data.reason ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #6b7280;">Reason:</strong>
                    <span style="color: #111827; float: right;">${data.reason}</span>
                  </td>
                </tr>
                ` : ''}
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                The candidate has been notified of this cancellation.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getInterviewCancelledAlertText(data: InterviewCancelledData): string {
    return `
INTERVIEW CANCELLED

Candidate: ${data.applicantName}
Position: ${data.jobTitle}
Original Date: ${data.originalDate} at ${data.originalTime}
${data.reason ? `Reason: ${data.reason}` : ''}

The candidate has been notified of this cancellation.
    `.trim();
  }

  // ========================================
  // JOB OFFER EMAIL TEMPLATES
  // ========================================

  private getJobOfferHTML(data: JobOfferData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 Congratulations!
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">
                You've received a job offer from Serenity Care Partners
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName},
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are thrilled to inform you that after careful consideration, we would like to offer you
                the position of <strong>${data.jobTitle}</strong> at Serenity Care Partners!
              </p>

              <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 15px 0; color: #059669; font-size: 18px;">📋 Offer Details</h4>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #047857;"><strong>Position:</strong></td>
                    <td style="padding: 8px 0; color: #065f46; text-align: right;">${data.jobTitle}</td>
                  </tr>
                  ${data.startDate ? `
                  <tr>
                    <td style="padding: 8px 0; color: #047857;"><strong>Start Date:</strong></td>
                    <td style="padding: 8px 0; color: #065f46; text-align: right;">${data.startDate}</td>
                  </tr>
                  ` : ''}
                  ${data.salary ? `
                  <tr>
                    <td style="padding: 8px 0; color: #047857;"><strong>Compensation:</strong></td>
                    <td style="padding: 8px 0; color: #065f46; text-align: right;">${data.salary}</td>
                  </tr>
                  ` : ''}
                </table>
                ${data.notes ? `<p style="margin: 15px 0 0 0; color: #047857; font-size: 14px;">${data.notes}</p>` : ''}
              </div>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We were impressed by your qualifications and believe you will be a valuable addition to our team.
              </p>

              <!-- Next Steps Section -->
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">📝 Next Steps to Accept This Offer</h4>
                <ol style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 10px;"><strong>Reply to this email</strong> to confirm your acceptance of this offer</li>
                  <li style="margin-bottom: 10px;"><strong>Start date coordination</strong> - Our HR team will reach out to align on a start date based on client assignment availability</li>
                  <li style="margin-bottom: 10px;"><strong>Prepare required documents</strong> for your first day:
                    <ul style="margin-top: 5px;">
                      <li>Valid government-issued photo ID (driver's license or passport)</li>
                      <li>Social Security card or birth certificate</li>
                      <li>Any professional certifications you hold</li>
                    </ul>
                  </li>
                  <li style="margin-bottom: 0;"><strong>Complete pre-employment requirements</strong> - We'll schedule your background check and drug screening</li>
                </ol>
              </div>

              <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">⏰ Please Respond Within 3 Business Days</h4>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                  To secure your position, please reply to this email or call us at <strong>(513) 400-5113</strong> to accept this offer.
                </p>
              </div>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Once you accept, we'll send you a welcome packet with your onboarding checklist, including all the paperwork,
                training, and orientation details you'll need to get started.
              </p>

              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you have any questions about the position, compensation, or anything else, please don't hesitate to reach out.
              </p>

              <p style="margin: 25px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We look forward to welcoming you to the Serenity Care Partners family!<br><br>
                Sincerely,<br>
                <strong>Serenity Care Partners HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                📞 (513) 400-5113 | 📧 hr@serenitycarepartners.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getJobOfferText(data: JobOfferData): string {
    return `
🎉 CONGRATULATIONS!

Dear ${data.applicantName},

We are thrilled to inform you that after careful consideration, we would like to offer you
the position of ${data.jobTitle} at Serenity Care Partners!

OFFER DETAILS
-------------
Position: ${data.jobTitle}
${data.startDate ? `Start Date: ${data.startDate}` : ''}
${data.salary ? `Compensation: ${data.salary}` : ''}
${data.notes ? `\nNotes: ${data.notes}` : ''}

We were impressed by your qualifications and believe you will be a valuable addition
to our team.

📝 NEXT STEPS TO ACCEPT THIS OFFER
-----------------------------------
1. REPLY TO THIS EMAIL to confirm your acceptance of this offer

2. START DATE COORDINATION - Our HR team will reach out to align on a start date based on client assignment availability

3. PREPARE REQUIRED DOCUMENTS for your first day:
   - Valid government-issued photo ID (driver's license or passport)
   - Social Security card or birth certificate
   - Any professional certifications you hold

4. COMPLETE PRE-EMPLOYMENT REQUIREMENTS - We'll schedule your background check and drug screening

⏰ PLEASE RESPOND WITHIN 3 BUSINESS DAYS
To secure your position, please reply to this email or call us at (513) 400-5113 to accept this offer.

Once you accept, we'll send you a welcome packet with your onboarding checklist, including all the
paperwork, training, and orientation details you'll need to get started.

If you have any questions about the position, compensation, or anything else, please don't hesitate to reach out.

Welcome to the Serenity Care Partners family!

Sincerely,
Serenity Care Partners HR Team

Contact: (513) 400-5113 | hr@serenitycarepartners.com

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();
  }

  private getJobOfferAlertHTML(data: JobOfferData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Offer Extended</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🎉 Job Offer Extended
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Candidate:</strong>
                    <span style="color: #111827; float: right;">${data.applicantName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <span style="color: #111827; float: right;">${data.applicantEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Position:</strong>
                    <span style="color: #111827; float: right;">${data.jobTitle}</span>
                  </td>
                </tr>
                ${data.startDate ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Proposed Start Date:</strong>
                    <span style="color: #111827; float: right;">${data.startDate}</span>
                  </td>
                </tr>
                ` : ''}
                ${data.salary ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280;">Compensation:</strong>
                    <span style="color: #111827; float: right;">${data.salary}</span>
                  </td>
                </tr>
                ` : ''}
                ${data.notes ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #6b7280;">Notes:</strong>
                    <p style="color: #111827; margin: 5px 0 0 0;">${data.notes}</p>
                  </td>
                </tr>
                ` : ''}
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                The candidate has been notified of this job offer via email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getJobOfferAlertText(data: JobOfferData): string {
    return `
🎉 JOB OFFER EXTENDED

Candidate: ${data.applicantName}
Email: ${data.applicantEmail}
Position: ${data.jobTitle}
${data.startDate ? `Proposed Start Date: ${data.startDate}` : ''}
${data.salary ? `Compensation: ${data.salary}` : ''}
${data.notes ? `Notes: ${data.notes}` : ''}

The candidate has been notified of this job offer via email.
    `.trim();
  }

  private getWelcomeNewHireHTML(data: WelcomeNewHireData): string {
    // Handle "To be determined" or actual date
    const isValidDate = data.startDate && !data.startDate.toLowerCase().includes('to be determined');
    const formattedDate = isValidDate
      ? new Date(data.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'To be determined (HR will contact you to coordinate)';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Serenity Care Partners</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #10b981; margin-bottom: 20px; text-align: center;">🎉 Welcome to the Team!</h1>

        <p style="font-size: 18px;">Dear <strong>${data.employeeName}</strong>,</p>

        <p>We are thrilled to officially welcome you to <strong>Serenity Care Partners</strong>! Your acceptance of our offer marks the beginning of an exciting journey, and we couldn't be more excited to have you join our team.</p>

        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Your Details</h3>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${data.jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Start Date:</strong> ${formattedDate}</p>
        </div>

        <h3 style="color: #374151;">What Happens Next?</h3>

        <p>We have created an onboarding checklist to help you get started smoothly. You'll receive guidance on:</p>

        <ul style="color: #4b5563;">
          <li>Completing required paperwork (W-4, I-9, direct deposit)</li>
          <li>Background check and compliance requirements</li>
          <li>Required training and certifications</li>
          <li>Setting up your equipment and mobile app</li>
          <li>Orientation and meeting your team</li>
          <li>Your first assignment and shadowing opportunities</li>
        </ul>

        ${data.onboardingItemCount > 0 ? `<p style="color: #6b7280; font-style: italic;">You have ${data.onboardingItemCount} onboarding items to complete over the next 30 days.</p>` : ''}

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #92400e; margin-top: 0;">📋 Before Your First Day</h4>
          <p style="color: #78350f; margin-bottom: 0;">Please bring the following documents:</p>
          <ul style="color: #78350f; margin-top: 10px;">
            <li>Valid government-issued photo ID</li>
            <li>Social Security card or birth certificate</li>
            <li>Any professional certifications you hold</li>
          </ul>
        </div>

        <p>Our HR team will be reaching out shortly with more details about your first day, including where to report and who to ask for.</p>

        <p>If you have any questions before your start date, please don't hesitate to reach out to us.</p>

        <p style="margin-top: 30px;">Welcome aboard!</p>

        <p><strong>The Serenity Care Partners Team</strong></p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Serenity Care Partners<br>
          Making Care Personal
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getWelcomeNewHireText(data: WelcomeNewHireData): string {
    // Handle "To be determined" or actual date
    const isValidDate = data.startDate && !data.startDate.toLowerCase().includes('to be determined');
    const formattedDate = isValidDate
      ? new Date(data.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'To be determined (HR will contact you to coordinate)';

    return `
🎉 WELCOME TO SERENITY CARE PARTNERS!

Dear ${data.employeeName},

We are thrilled to officially welcome you to Serenity Care Partners! Your acceptance of our offer marks the beginning of an exciting journey.

YOUR DETAILS
Position: ${data.jobTitle}
Start Date: ${formattedDate}

WHAT HAPPENS NEXT?

We have created an onboarding checklist to help you get started smoothly:
• Completing required paperwork (W-4, I-9, direct deposit)
• Background check and compliance requirements
• Required training and certifications
• Setting up your equipment and mobile app
• Orientation and meeting your team
• Your first assignment and shadowing opportunities

${data.onboardingItemCount > 0 ? `You have ${data.onboardingItemCount} onboarding items to complete over the next 30 days.` : ''}

BEFORE YOUR FIRST DAY

Please bring the following documents:
• Valid government-issued photo ID
• Social Security card or birth certificate
• Any professional certifications you hold

Our HR team will be reaching out shortly with more details about your first day.

If you have any questions, please don't hesitate to reach out.

Welcome aboard!
The Serenity Care Partners Team
    `.trim();
  }

  private getNewHireAlertHTML(data: NewHireAlertData): string {
    const formattedDate = new Date(data.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Hire Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #10b981; margin-bottom: 20px;">✅ New Hire Confirmed</h1>

        <p>A job offer has been accepted and a new employee has been added to the system.</p>

        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">New Employee Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.employeeName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.employeeEmail}</p>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${data.jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Start Date:</strong> ${formattedDate}</p>
        </div>

        <h3 style="color: #374151;">Actions Required</h3>

        <ul style="color: #4b5563;">
          <li>Review and assign onboarding tasks</li>
          <li>Schedule first-day orientation</li>
          <li>Prepare workstation/equipment</li>
          <li>Assign mentor or buddy</li>
          <li>Set up system access and credentials</li>
        </ul>

        ${data.onboardingId ? `<p>Onboarding ID: <code>${data.onboardingId}</code></p>` : ''}

        <p style="margin-top: 20px;">
          <a href="https://serenity-console.web.app/hr" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View in HR Dashboard</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification from Serenity Care Partners HR System.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getNewHireAlertText(data: NewHireAlertData): string {
    const formattedDate = new Date(data.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
✅ NEW HIRE CONFIRMED

A job offer has been accepted and a new employee has been added to the system.

NEW EMPLOYEE DETAILS
Name: ${data.employeeName}
Email: ${data.employeeEmail}
Position: ${data.jobTitle}
Start Date: ${formattedDate}

ACTIONS REQUIRED
• Review and assign onboarding tasks
• Schedule first-day orientation
• Prepare workstation/equipment
• Assign mentor or buddy
• Set up system access and credentials

${data.onboardingId ? `Onboarding ID: ${data.onboardingId}` : ''}

View in HR Dashboard: https://serenity-console.web.app/hr

This is an automated notification from Serenity Care Partners HR System.
    `.trim();
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
