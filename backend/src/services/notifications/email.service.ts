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
   * Send email via SendGrid or log if not configured
   */
  private async sendEmail(params: {
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
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
