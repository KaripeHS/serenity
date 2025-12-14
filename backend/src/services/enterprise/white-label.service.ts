/**
 * White-Label Platform Service
 * Enables custom branding and multi-tenant customization
 *
 * Features:
 * - Custom domain mapping
 * - Brand customization (logos, colors, fonts)
 * - Custom email templates
 * - Personalized dashboards
 * - Feature toggles per organization
 * - Custom terminology
 */

import { pool } from '../../config/database';
import axios from 'axios';


import { createLogger } from '../../utils/logger';

const logger = createLogger('white-label');
interface BrandingConfig {
  organizationId: string;
  companyName: string;
  domain?: string; // custom-domain.com
  logoUrl?: string;
  faviconUrl?: string;
  colors: {
    primary: string; // hex color
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  terminology?: Record<string, string>; // e.g., "caregiver" → "care professional"
  emailTemplates?: Record<string, string>;
  customCSS?: string;
}

interface FeatureFlags {
  organizationId: string;
  features: {
    mlForecasting: boolean;
    scheduleOptimization: boolean;
    voiceToText: boolean;
    biDashboard: boolean;
    payrollIntegrations: boolean;
    ehrIntegration: boolean;
    mobileApp: boolean;
    webSocketRealtime: boolean;
    advancedReporting: boolean;
    apiAccess: boolean;
  };
}

export class WhiteLabelService {
  /**
   * Get branding configuration for organization
   */
  async getBrandingConfig(organizationId: string): Promise<BrandingConfig> {
    const result = await pool.query(
      `
      SELECT * FROM branding_configs
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    if (result.rows.length === 0) {
      // Return default branding
      return this.getDefaultBranding(organizationId);
    }

    const row = result.rows[0];

    return {
      organizationId: row.organization_id,
      companyName: row.company_name,
      domain: row.custom_domain,
      logoUrl: row.logo_url,
      faviconUrl: row.favicon_url,
      colors: JSON.parse(row.colors),
      fonts: JSON.parse(row.fonts),
      terminology: row.terminology ? JSON.parse(row.terminology) : undefined,
      emailTemplates: row.email_templates ? JSON.parse(row.email_templates) : undefined,
      customCSS: row.custom_css
    };
  }

  /**
   * Update branding configuration
   */
  async updateBrandingConfig(config: BrandingConfig): Promise<boolean> {
    try {
      await pool.query(
        `
        INSERT INTO branding_configs (
          organization_id,
          company_name,
          custom_domain,
          logo_url,
          favicon_url,
          colors,
          fonts,
          terminology,
          email_templates,
          custom_css,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (organization_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          custom_domain = EXCLUDED.custom_domain,
          logo_url = EXCLUDED.logo_url,
          favicon_url = EXCLUDED.favicon_url,
          colors = EXCLUDED.colors,
          fonts = EXCLUDED.fonts,
          terminology = EXCLUDED.terminology,
          email_templates = EXCLUDED.email_templates,
          custom_css = EXCLUDED.custom_css,
          updated_at = NOW()
        `,
        [
          config.organizationId,
          config.companyName,
          config.domain,
          config.logoUrl,
          config.faviconUrl,
          JSON.stringify(config.colors),
          JSON.stringify(config.fonts),
          config.terminology ? JSON.stringify(config.terminology) : null,
          config.emailTemplates ? JSON.stringify(config.emailTemplates) : null,
          config.customCSS
        ]
      );

      return true;
    } catch (error) {
      logger.error('[WhiteLabel] Error updating branding config:', error);
      return false;
    }
  }

  /**
   * Set up custom domain
   */
  async setupCustomDomain(
    organizationId: string,
    domain: string
  ): Promise<{
    success: boolean;
    dnsRecords?: Array<{
      type: string;
      name: string;
      value: string;
    }>;
    error?: string;
  }> {
    try {
      // Validate domain ownership via DNS verification
      const verified = await this.verifyDomainOwnership(domain);

      if (!verified) {
        return {
          success: false,
          error: 'Domain ownership verification failed'
        };
      }

      // Update organization with custom domain
      await pool.query(
        `
        UPDATE branding_configs
        SET custom_domain = $1,
            domain_verified = true,
            domain_verified_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = $2
        `,
        [domain, organizationId]
      );

      // Return DNS records to configure
      return {
        success: true,
        dnsRecords: [
          {
            type: 'CNAME',
            name: domain,
            value: 'app.serenitycare.com'
          },
          {
            type: 'TXT',
            name: '_verification.' + domain,
            value: `serenity-verify-${organizationId}`
          }
        ]
      };
    } catch (error: any) {
      logger.error('[WhiteLabel] Error setting up custom domain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify domain ownership via DNS TXT record
   */
  private async verifyDomainOwnership(domain: string): Promise<boolean> {
    try {
      // In production, use DNS lookup to verify TXT record
      // For now, simplified check
      const dns = require('dns').promises;
      const txtRecords = await dns.resolveTxt(domain);

      // Look for verification TXT record
      return txtRecords.some(record =>
        record.some(txt => txt.includes('serenity-verify-'))
      );
    } catch (error) {
      logger.error('[WhiteLabel] Error verifying domain:', error);
      return false;
    }
  }

  /**
   * Get feature flags for organization
   */
  async getFeatureFlags(organizationId: string): Promise<FeatureFlags> {
    const result = await pool.query(
      `
      SELECT * FROM feature_flags
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    if (result.rows.length === 0) {
      // Return default features (all enabled)
      return this.getDefaultFeatures(organizationId);
    }

    const row = result.rows[0];

    return {
      organizationId: row.organization_id,
      features: JSON.parse(row.features)
    };
  }

  /**
   * Update feature flags
   */
  async updateFeatureFlags(flags: FeatureFlags): Promise<boolean> {
    try {
      await pool.query(
        `
        INSERT INTO feature_flags (
          organization_id,
          features,
          updated_at
        ) VALUES ($1, $2, NOW())
        ON CONFLICT (organization_id) DO UPDATE SET
          features = EXCLUDED.features,
          updated_at = NOW()
        `,
        [flags.organizationId, JSON.stringify(flags.features)]
      );

      return true;
    } catch (error) {
      logger.error('[WhiteLabel] Error updating feature flags:', error);
      return false;
    }
  }

  /**
   * Check if feature is enabled for organization
   */
  async isFeatureEnabled(
    organizationId: string,
    featureName: keyof FeatureFlags['features']
  ): Promise<boolean> {
    const flags = await this.getFeatureFlags(organizationId);
    return flags.features[featureName] || false;
  }

  /**
   * Generate custom email template
   */
  async generateCustomEmail(
    organizationId: string,
    templateType: 'welcome' | 'password_reset' | 'visit_reminder' | 'invoice',
    data: Record<string, any>
  ): Promise<{ subject: string; html: string; text: string }> {
    const branding = await this.getBrandingConfig(organizationId);

    // Get custom template if exists
    const customTemplate = branding.emailTemplates?.[templateType];

    if (customTemplate) {
      return this.renderCustomTemplate(customTemplate, data, branding);
    }

    // Use default template
    return this.renderDefaultTemplate(templateType, data, branding);
  }

  /**
   * Render custom email template
   */
  private renderCustomTemplate(
    template: string,
    data: Record<string, any>,
    branding: BrandingConfig
  ): { subject: string; html: string; text: string } {
    // Simple template variable replacement
    let rendered = template;

    // Replace branding variables
    rendered = rendered.replace(/{{company_name}}/g, branding.companyName);
    rendered = rendered.replace(/{{logo_url}}/g, branding.logoUrl || '');
    rendered = rendered.replace(/{{primary_color}}/g, branding.colors.primary);

    // Replace data variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key]);
    });

    // Extract subject (first line)
    const lines = rendered.split('\n');
    const subject = lines[0].replace('Subject:', '').trim();
    const html = lines.slice(1).join('\n');

    // Generate plain text version
    const text = html.replace(/<[^>]*>/g, '').trim();

    return { subject, html, text };
  }

  /**
   * Render default email template
   */
  private renderDefaultTemplate(
    templateType: string,
    data: Record<string, any>,
    branding: BrandingConfig
  ): { subject: string; html: string; text: string } {
    const templates: Record<string, any> = {
      welcome: {
        subject: `Welcome to ${branding.companyName}`,
        html: `
          <div style="font-family: ${branding.fonts.body}; color: ${branding.colors.text};">
            <img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-width: 200px; margin-bottom: 20px;">
            <h1 style="color: ${branding.colors.primary};">Welcome ${data.firstName}!</h1>
            <p>We're excited to have you join ${branding.companyName}.</p>
            <p>Your account has been created. You can log in using your email address.</p>
            <a href="${data.loginUrl}" style="background-color: ${branding.colors.primary}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
              Log In Now
            </a>
          </div>
        `
      },
      visit_reminder: {
        subject: `Visit Reminder - ${data.clientName}`,
        html: `
          <div style="font-family: ${branding.fonts.body}; color: ${branding.colors.text};">
            <img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-width: 200px; margin-bottom: 20px;">
            <h2 style="color: ${branding.colors.primary};">Visit Reminder</h2>
            <p><strong>Client:</strong> ${data.clientName}</p>
            <p><strong>Date & Time:</strong> ${data.scheduledStart}</p>
            <p><strong>Address:</strong> ${data.clientAddress}</p>
            <p><strong>Service Type:</strong> ${data.serviceType}</p>
          </div>
        `
      }
    };

    const template = templates[templateType] || templates.welcome;
    const text = template.html.replace(/<[^>]*>/g, '').trim();

    return {
      subject: template.subject,
      html: template.html,
      text
    };
  }

  /**
   * Get organization by custom domain
   */
  async getOrganizationByDomain(domain: string): Promise<string | null> {
    const result = await pool.query(
      `
      SELECT organization_id
      FROM branding_configs
      WHERE custom_domain = $1
        AND domain_verified = true
      `,
      [domain]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].organization_id;
  }

  /**
   * Apply custom terminology to text
   */
  async applyTerminology(
    organizationId: string,
    text: string
  ): Promise<string> {
    const branding = await this.getBrandingConfig(organizationId);

    if (!branding.terminology) {
      return text;
    }

    let result = text;

    // Replace terminology
    Object.keys(branding.terminology).forEach(term => {
      const replacement = branding.terminology![term];
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      result = result.replace(regex, replacement);
    });

    return result;
  }

  /**
   * Get default branding
   */
  private getDefaultBranding(organizationId: string): BrandingConfig {
    return {
      organizationId,
      companyName: 'Serenity Care Partners',
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#F9FAFB',
        text: '#111827'
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
      }
    };
  }

  /**
   * Get default features (all enabled for enterprise tier)
   */
  private getDefaultFeatures(organizationId: string): FeatureFlags {
    return {
      organizationId,
      features: {
        mlForecasting: true,
        scheduleOptimization: true,
        voiceToText: true,
        biDashboard: true,
        payrollIntegrations: true,
        ehrIntegration: true,
        mobileApp: true,
        webSocketRealtime: true,
        advancedReporting: true,
        apiAccess: true
      }
    };
  }

  /**
   * Clone organization configuration for franchise
   */
  async cloneOrganizationConfig(
    sourceOrgId: string,
    targetOrgId: string,
    options: {
      includeBranding: boolean;
      includeFeatureFlags: boolean;
      includeWorkflows: boolean;
    }
  ): Promise<boolean> {
    try {
      // Clone branding if requested
      if (options.includeBranding) {
        const branding = await this.getBrandingConfig(sourceOrgId);
        branding.organizationId = targetOrgId;
        branding.domain = undefined; // Don't clone custom domain
        await this.updateBrandingConfig(branding);
      }

      // Clone feature flags if requested
      if (options.includeFeatureFlags) {
        const features = await this.getFeatureFlags(sourceOrgId);
        features.organizationId = targetOrgId;
        await this.updateFeatureFlags(features);
      }

      // Clone workflow definitions if requested
      if (options.includeWorkflows) {
        await pool.query(
          `
          INSERT INTO workflow_definitions (
            organization_id,
            name,
            entity_type,
            steps,
            auto_approval_rules,
            active
          )
          SELECT
            $1,
            name,
            entity_type,
            steps,
            auto_approval_rules,
            active
          FROM workflow_definitions
          WHERE organization_id = $2
          `,
          [targetOrgId, sourceOrgId]
        );
      }

      return true;
    } catch (error) {
      logger.error('[WhiteLabel] Error cloning organization config:', error);
      return false;
    }
  }
}

export const whiteLabelService = new WhiteLabelService();
