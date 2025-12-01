/**
 * Email Service
 * Handles all email sending via SendGrid
 *
 * @module services/notifications/email
 */

import sgMail from '@sendgrid/mail';

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
  private isConfigured: boolean = false;
  private fromEmail: string;
  private hrEmail: string;

  constructor() {
    // Configure SendGrid API key
    const apiKey = process.env.SENDGRID_API_KEY;

    if (apiKey && apiKey !== 'your-sendgrid-api-key-here') {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
    } else {
      console.warn('[EmailService] SendGrid API key not configured. Emails will be logged instead of sent.');
      this.isConfigured = false;
    }

    this.fromEmail = process.env.EMAIL_FROM || 'careers@serenitycarepartners.com';
    this.hrEmail = process.env.HR_EMAIL || 'hr@serenitycarepartners.com';
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

    console.log(`[EmailService] Application confirmation sent to ${data.applicantEmail}`);
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

    console.log(`[EmailService] New application alert sent to ${this.hrEmail}`);
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

    console.log(`[EmailService] Credential expiration alert sent to ${data.to}`);
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

    console.log(`[EmailService] Credential digest sent to ${data.to}`);
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

    console.log(`[EmailService] Compliance alert sent to ${data.to}`);
  }

  /**
   * Send email via SendGrid or log if not configured
   */
  /**
   * Send email via SendGrid or log if not configured
   */
  public async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    const msg = {
      to: params.to,
      from: {
        email: this.fromEmail,
        name: 'Serenity Care Partners'
      },
      subject: params.subject,
      text: params.text,
      html: params.html
    };

    if (this.isConfigured) {
      try {
        await sgMail.send(msg);
      } catch (error: any) {
        console.error('[EmailService] Failed to send email:', error.message);
        if (error.response) {
          console.error('[EmailService] SendGrid error:', error.response.body);
        }
        throw error;
      }
    } else {
      // Development mode - log email instead of sending
      console.log('\n========== EMAIL (DEV MODE) ==========');
      console.log('To:', params.to);
      console.log('From:', this.fromEmail);
      console.log('Subject:', params.subject);
      console.log('\n--- TEXT VERSION ---');
      console.log(params.text);
      console.log('\n--- HTML VERSION ---');
      console.log(params.html);
      console.log('======================================\n');
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
                      <strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })}
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
                📞 (937) 555-0100 | 📧 hr@serenitycarepartners.com
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
                      <strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })}
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
                    <a href="http://localhost:3001/dashboard/hr?applicationId=${data.applicationId}"
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
Submitted: ${new Date(data.submittedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}

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

Contact: (937) 555-0100 | hr@serenitycarepartners.com
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
Submitted: ${new Date(data.submittedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}

NEXT STEPS
----------
1. Review full application in HR Dashboard
2. Check certifications (HHA/STNA license, CPR)
3. Schedule phone screening if qualified
4. Update application status in system

View Application: http://localhost:3001/dashboard/hr?applicationId=${data.applicationId}

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
                📞 (937) 555-0100 | 📧 hr@serenitycarepartners.com
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

Contact: (937) 555-0100 | hr@serenitycarepartners.com

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
                📞 (937) 555-0100 | 📧 hr@serenitycarepartners.com
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
Contact: (937) 555-0100 | hr@serenitycarepartners.com

© ${new Date().getFullYear()} Serenity Care Partners. All rights reserved.
    `.trim();

    return text;
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
