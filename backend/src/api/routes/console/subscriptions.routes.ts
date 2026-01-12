/**
 * Subscriptions & Integrations Management API
 * Returns real-time status of all third-party services and integrations
 */

import { Router, Request, Response } from 'express';

const router = Router();

interface ServiceStatus {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'configured' | 'not_configured';
  configured: boolean;
  hasCredentials: boolean;
  endpoint?: string;
  envVars: {
    name: string;
    configured: boolean;
    value?: string; // Only show for non-sensitive or masked
  }[];
  monthlyEstimate?: number;
  lastChecked?: Date;
}

/**
 * GET /api/console/subscriptions
 * Returns status of all integrations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const services: ServiceStatus[] = [];

    // Email Services
    services.push({
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'communication',
      status: process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here' ? 'configured' : 'not_configured',
      configured: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here'),
      hasCredentials: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here'),
      envVars: [
        {
          name: 'SENDGRID_API_KEY',
          configured: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here'),
          value: process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here' ? '***configured***' : 'not set'
        }
      ],
      monthlyEstimate: 0
    });

    services.push({
      id: 'smtp',
      name: 'SMTP (Hostinger)',
      category: 'communication',
      status: process.env.SMTP_HOST ? 'active' : 'not_configured',
      configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      hasCredentials: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      endpoint: process.env.SMTP_HOST,
      envVars: [
        {
          name: 'SMTP_HOST',
          configured: !!process.env.SMTP_HOST,
          value: process.env.SMTP_HOST || 'not set'
        },
        {
          name: 'SMTP_PORT',
          configured: !!process.env.SMTP_PORT,
          value: process.env.SMTP_PORT || 'not set'
        },
        {
          name: 'SMTP_USER',
          configured: !!process.env.SMTP_USER,
          value: process.env.SMTP_USER || 'not set'
        },
        {
          name: 'SMTP_PASS',
          configured: !!process.env.SMTP_PASS,
          value: process.env.SMTP_PASS ? '***configured***' : 'not set'
        },
        {
          name: 'EMAIL_FROM',
          configured: !!process.env.EMAIL_FROM,
          value: process.env.EMAIL_FROM || 'not set'
        }
      ],
      monthlyEstimate: 9.99
    });

    // SMS Services
    services.push({
      id: 'twilio',
      name: 'Twilio',
      category: 'communication',
      status: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid' ? 'configured' : 'not_configured',
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid'),
      hasCredentials: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid'),
      endpoint: 'https://api.twilio.com',
      envVars: [
        {
          name: 'TWILIO_ACCOUNT_SID',
          configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid'),
          value: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid' ? '***configured***' : 'not set'
        },
        {
          name: 'TWILIO_AUTH_TOKEN',
          configured: !!(process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token'),
          value: process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token' ? '***configured***' : 'not set'
        },
        {
          name: 'TWILIO_PHONE_NUMBER',
          configured: !!process.env.TWILIO_PHONE_NUMBER,
          value: process.env.TWILIO_PHONE_NUMBER || 'not set'
        }
      ],
      monthlyEstimate: 50
    });

    // AI Services
    services.push({
      id: 'openai',
      name: 'OpenAI',
      category: 'ai',
      status: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-for-development-mode-only' ? 'configured' : 'not_configured',
      configured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-for-development-mode-only'),
      hasCredentials: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-for-development-mode-only'),
      endpoint: 'https://api.openai.com/v1',
      envVars: [
        {
          name: 'OPENAI_API_KEY',
          configured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-for-development-mode-only'),
          value: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-for-development-mode-only' ? '***configured***' : 'not set'
        }
      ],
      monthlyEstimate: 100
    });

    // Compliance/EVV
    services.push({
      id: 'sandata',
      name: 'Sandata EVV',
      category: 'compliance',
      status: process.env.SANDATA_API_KEY && process.env.SANDATA_API_KEY !== 'your-api-key-here' ? 'configured' : 'not_configured',
      configured: !!(process.env.SANDATA_API_KEY && process.env.SANDATA_PROVIDER_ID && process.env.SANDATA_API_KEY !== 'your-api-key-here'),
      hasCredentials: !!(process.env.SANDATA_API_KEY && process.env.SANDATA_API_KEY !== 'your-api-key-here'),
      endpoint: process.env.SANDATA_ENVIRONMENT === 'production' ? 'https://api.sandata.com/evv/v4' : 'https://api-sandbox.sandata.com/evv/v4',
      envVars: [
        {
          name: 'SANDATA_API_KEY',
          configured: !!(process.env.SANDATA_API_KEY && process.env.SANDATA_API_KEY !== 'your-api-key-here'),
          value: process.env.SANDATA_API_KEY && process.env.SANDATA_API_KEY !== 'your-api-key-here' ? '***configured***' : 'not set'
        },
        {
          name: 'SANDATA_PROVIDER_ID',
          configured: !!(process.env.SANDATA_PROVIDER_ID && process.env.SANDATA_PROVIDER_ID !== 'your-provider-id'),
          value: process.env.SANDATA_PROVIDER_ID && process.env.SANDATA_PROVIDER_ID !== 'your-provider-id' ? process.env.SANDATA_PROVIDER_ID : 'not set'
        },
        {
          name: 'SANDATA_ENVIRONMENT',
          configured: !!process.env.SANDATA_ENVIRONMENT,
          value: process.env.SANDATA_ENVIRONMENT || 'sandbox'
        }
      ],
      monthlyEstimate: 200
    });

    // Payroll
    services.push({
      id: 'gusto',
      name: 'Gusto',
      category: 'payroll',
      status: process.env.GUSTO_API_KEY && process.env.GUSTO_API_KEY !== 'your-gusto-api-key' ? 'configured' : 'not_configured',
      configured: !!(process.env.GUSTO_API_KEY && process.env.GUSTO_COMPANY_ID && process.env.GUSTO_API_KEY !== 'your-gusto-api-key'),
      hasCredentials: !!(process.env.GUSTO_API_KEY && process.env.GUSTO_API_KEY !== 'your-gusto-api-key'),
      endpoint: process.env.GUSTO_ENVIRONMENT === 'production' ? 'https://api.gusto.com' : 'https://api-sandbox.gusto.com',
      envVars: [
        {
          name: 'GUSTO_API_KEY',
          configured: !!(process.env.GUSTO_API_KEY && process.env.GUSTO_API_KEY !== 'your-gusto-api-key'),
          value: process.env.GUSTO_API_KEY && process.env.GUSTO_API_KEY !== 'your-gusto-api-key' ? '***configured***' : 'not set'
        },
        {
          name: 'GUSTO_COMPANY_ID',
          configured: !!(process.env.GUSTO_COMPANY_ID && process.env.GUSTO_COMPANY_ID !== 'your-company-id'),
          value: process.env.GUSTO_COMPANY_ID && process.env.GUSTO_COMPANY_ID !== 'your-company-id' ? process.env.GUSTO_COMPANY_ID : 'not set'
        },
        {
          name: 'GUSTO_ENVIRONMENT',
          configured: !!process.env.GUSTO_ENVIRONMENT,
          value: process.env.GUSTO_ENVIRONMENT || 'sandbox'
        }
      ],
      monthlyEstimate: 149
    });

    // Background Checks
    services.push({
      id: 'checkr',
      name: 'Checkr',
      category: 'hr',
      status: process.env.CHECKR_API_KEY ? 'configured' : 'not_configured',
      configured: !!process.env.CHECKR_API_KEY,
      hasCredentials: !!process.env.CHECKR_API_KEY,
      endpoint: 'https://api.checkr.com/v1',
      envVars: [
        {
          name: 'CHECKR_API_KEY',
          configured: !!process.env.CHECKR_API_KEY,
          value: process.env.CHECKR_API_KEY ? '***configured***' : 'not set'
        }
      ],
      monthlyEstimate: 0
    });

    // Billing
    services.push({
      id: 'clearinghouse',
      name: 'Change Healthcare',
      category: 'billing',
      status: process.env.CLEARINGHOUSE_API_KEY && process.env.CLEARINGHOUSE_API_KEY !== 'your-api-key' ? 'configured' : 'not_configured',
      configured: !!(process.env.CLEARINGHOUSE_API_KEY && process.env.CLEARINGHOUSE_API_KEY !== 'your-api-key'),
      hasCredentials: !!(process.env.CLEARINGHOUSE_API_KEY && process.env.CLEARINGHOUSE_API_KEY !== 'your-api-key'),
      endpoint: process.env.CLEARINGHOUSE_ENVIRONMENT === 'production' ? 'https://api.changehealthcare.com' : 'https://api-sandbox.changehealthcare.com',
      envVars: [
        {
          name: 'CLEARINGHOUSE_API_KEY',
          configured: !!(process.env.CLEARINGHOUSE_API_KEY && process.env.CLEARINGHOUSE_API_KEY !== 'your-api-key'),
          value: process.env.CLEARINGHOUSE_API_KEY && process.env.CLEARINGHOUSE_API_KEY !== 'your-api-key' ? '***configured***' : 'not set'
        },
        {
          name: 'CLEARINGHOUSE_SUBMITTER_ID',
          configured: !!(process.env.CLEARINGHOUSE_SUBMITTER_ID && process.env.CLEARINGHOUSE_SUBMITTER_ID !== 'your-submitter-id'),
          value: process.env.CLEARINGHOUSE_SUBMITTER_ID || 'not set'
        }
      ],
      monthlyEstimate: 75
    });

    // GCP Services
    services.push({
      id: 'cloud-sql',
      name: 'Cloud SQL',
      category: 'infrastructure',
      status: 'active',
      configured: !!process.env.DATABASE_URL,
      hasCredentials: !!process.env.DATABASE_URL,
      endpoint: 'Cloud SQL PostgreSQL',
      envVars: [
        {
          name: 'DATABASE_URL',
          configured: !!process.env.DATABASE_URL,
          value: process.env.DATABASE_URL ? '***configured***' : 'not set'
        }
      ],
      monthlyEstimate: 50
    });

    services.push({
      id: 'cloud-run',
      name: 'Cloud Run',
      category: 'infrastructure',
      status: 'active',
      configured: true,
      hasCredentials: true,
      endpoint: 'https://serenity-backend-774652480816.us-central1.run.app',
      envVars: [],
      monthlyEstimate: 20
    });

    services.push({
      id: 'cloud-storage',
      name: 'Cloud Storage',
      category: 'infrastructure',
      status: process.env.GOOGLE_CLOUD_PROJECT_ID ? 'configured' : 'not_configured',
      configured: !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GCS_BUCKET_NAME),
      hasCredentials: !!(process.env.GOOGLE_CLOUD_PROJECT_ID),
      endpoint: `gs://${process.env.GCS_BUCKET_NAME || 'serenity-care-uploads'}`,
      envVars: [
        {
          name: 'GOOGLE_CLOUD_PROJECT_ID',
          configured: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
          value: process.env.GOOGLE_CLOUD_PROJECT_ID || 'not set'
        },
        {
          name: 'GCS_BUCKET_NAME',
          configured: !!process.env.GCS_BUCKET_NAME,
          value: process.env.GCS_BUCKET_NAME || 'serenity-care-uploads'
        }
      ],
      monthlyEstimate: 10
    });

    services.push({
      id: 'firebase',
      name: 'Firebase Hosting',
      category: 'infrastructure',
      status: 'active',
      configured: true,
      hasCredentials: true,
      endpoint: 'https://serenitycarepartners.com',
      envVars: [],
      monthlyEstimate: 0
    });

    // Calculate totals
    const activeServices = services.filter(s => s.status === 'active' || s.status === 'configured');
    const monthlyTotal = services.reduce((sum, s) => sum + (s.monthlyEstimate || 0), 0);
    const annualTotal = monthlyTotal * 12;

    return res.json({
      success: true,
      services,
      summary: {
        total: services.length,
        active: activeServices.length,
        configured: services.filter(s => s.configured).length,
        notConfigured: services.filter(s => !s.configured).length,
        monthlyTotal,
        annualTotal
      },
      lastUpdated: new Date()
    });
  } catch (error: any) {
    console.error('Failed to fetch subscription status:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/console/subscriptions/:serviceId
 * Get detailed information about a specific service
 */
router.get('/:serviceId', async (req: Request, res: Response) => {
  const { serviceId } = req.params;

  // This would return detailed metrics, usage stats, recent activity, etc.
  return res.json({
    success: true,
    service: {
      id: serviceId,
      // TODO: Implement detailed service metrics
    }
  });
});

export default router;
