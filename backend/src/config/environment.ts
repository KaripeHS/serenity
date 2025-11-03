/**
 * SECURE Environment Configuration Service
 * Handles all environment variables with proper validation and security
 */

import { createLogger } from '../utils/logger';

const securityLogger = createLogger('security');

interface EnvironmentConfig {
  // Database
  databaseUrl: string;
  databaseSslMode: string;

  // External Service Keys (validated but not logged)
  openaiToken: string;
  azureOpenaiToken: string;
  azureOpenaiEndpoint: string;
  anthropicToken: string;
  indeedToken: string;

  // Security
  jwtSecret: string;
  encryptionKey: string;
  sessionSecret: string;

  // External Services
  emailToken: string;
  smsToken: string;
  auditServiceUrl: string;

  // Application
  nodeEnv: string;
  port: number;
  corsOrigin: string;
}

class EnvironmentService {
  private config: EnvironmentConfig;
  private isInitialized = false;

  constructor() {
    this.config = this.loadAndValidateConfig();
    this.isInitialized = true;
    securityLogger.info('Environment configuration loaded', {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      configuredServices: this.getConfiguredServices()
    });
  }

  private loadAndValidateConfig(): EnvironmentConfig {
    const config: EnvironmentConfig = {
      // Database
      databaseUrl: this.getRequiredEnv('DATABASE_URL'),
      databaseSslMode: process.env.DATABASE_SSL_MODE || 'require',

      // External Service Keys (validated but not logged)
      openaiToken: this.getRequiredEnv('OPENAI_API_KEY'),
      azureOpenaiToken: this.getRequiredEnv('AZURE_OPENAI_KEY'),
      azureOpenaiEndpoint: this.getRequiredEnv('AZURE_OPENAI_ENDPOINT'),
      anthropicToken: this.getRequiredEnv('ANTHROPIC_API_KEY'),
      indeedToken: this.getRequiredEnv('INDEED_API_KEY'),

      // Security
      jwtSecret: this.getRequiredEnv('JWT_SECRET'),
      encryptionKey: this.getRequiredEnv('ENCRYPTION_KEY'),
      sessionSecret: this.getRequiredEnv('SESSION_SECRET'),

      // External Services
      emailToken: this.getRequiredEnv('EMAIL_SERVICE_KEY'),
      smsToken: this.getRequiredEnv('SMS_SERVICE_KEY'),
      auditServiceUrl: this.getRequiredEnv('AUDIT_SERVICE_URL'),

      // Application
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000'),
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    };

    this.validateSecurityRequirements(config);
    return config;
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      securityLogger.error('Missing required environment variable', { key });
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private validateSecurityRequirements(config: EnvironmentConfig): void {
    // Validate JWT secret strength
    if (config.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters for security');
    }

    // Validate encryption key
    if (config.encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters for security');
    }

    // Validate production requirements
    if (config.nodeEnv === 'production') {
      if (config.corsOrigin === 'http://localhost:3000') {
        throw new Error('CORS_ORIGIN must be configured for production');
      }

      if (!config.databaseUrl.includes('ssl=true')) {
        securityLogger.warn('Database SSL not explicitly enabled in production');
      }
    }
  }

  private getConfiguredServices(): string[] {
    const services: string[] = [];

    if (this.config.openaiToken) services.push('openai');
    if (this.config.azureOpenaiToken) services.push('azure-openai');
    if (this.config.anthropicToken) services.push('anthropic');
    if (this.config.indeedToken) services.push('indeed');
    if (this.config.emailToken) services.push('email');
    if (this.config.smsToken) services.push('sms');

    return services;
  }

  // Secure getters that never log the actual values
  getOpenAIConfig(): { apiKey: string; isConfigured: boolean } {
    return {
      apiKey: this.config.openaiToken,
      isConfigured: !!this.config.openaiToken
    };
  }

  getAzureOpenAIConfig(): { apiKey: string; endpoint: string; isConfigured: boolean } {
    return {
      apiKey: this.config.azureOpenaiToken,
      endpoint: this.config.azureOpenaiEndpoint,
      isConfigured: !!(this.config.azureOpenaiToken && this.config.azureOpenaiEndpoint)
    };
  }

  getAnthropicConfig(): { apiKey: string; isConfigured: boolean } {
    return {
      apiKey: this.config.anthropicToken,
      isConfigured: !!this.config.anthropicToken
    };
  }

  getIndeedConfig(): { apiKey: string; isConfigured: boolean } {
    return {
      apiKey: this.config.indeedToken,
      isConfigured: !!this.config.indeedToken
    };
  }

  getDatabaseConfig(): { url: string; sslMode: string } {
    return {
      url: this.config.databaseUrl,
      sslMode: this.config.databaseSslMode
    };
  }

  getSecurityConfig(): { jwtSecret: string; encryptionKey: string; sessionSecret: string } {
    return {
      jwtSecret: this.config.jwtSecret,
      encryptionKey: this.config.encryptionKey,
      sessionSecret: this.config.sessionSecret
    };
  }

  getApplicationConfig(): { nodeEnv: string; port: number; corsOrigin: string } {
    return {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      corsOrigin: this.config.corsOrigin
    };
  }

  getExternalServicesConfig(): { emailKey: string; smsKey: string; auditUrl: string } {
    return {
      emailKey: this.config.emailToken,
      smsKey: this.config.smsToken,
      auditUrl: this.config.auditServiceUrl
    };
  }

  // Utility methods
  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

// Singleton instance
export const environmentService = new EnvironmentService();
export { EnvironmentService };