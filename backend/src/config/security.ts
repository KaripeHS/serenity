/**
 * CRITICAL SECURITY CONFIGURATION
 * Central security configuration for all security-related settings
 */

import { environmentService } from './environment';

export interface SecurityConfig {
  // Session configuration
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };

  // JWT configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
  };

  // Rate limiting
  rateLimit: {
    global: {
      windowMs: number;
      max: number;
    };
    auth: {
      windowMs: number;
      max: number;
    };
    api: {
      windowMs: number;
      max: number;
    };
  };

  // Password policy
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
    preventReuse: number; // number of previous passwords to check
  };

  // Encryption
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };

  // HIPAA compliance
  hipaa: {
    enableAuditLogging: boolean;
    enablePHIRedaction: boolean;
    enableAccessLogging: boolean;
    dataRetentionDays: number;
    requireMinimumNecessary: boolean;
  };

  // Security headers
  headers: {
    enableHSTS: boolean;
    hstsMaxAge: number;
    enableCSP: boolean;
    enableFrameguard: boolean;
    enableXSSProtection: boolean;
  };

  // File upload security
  fileUpload: {
    maxFileSize: number; // bytes
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    scanForMalware: boolean;
  };
}

class SecurityConfigService {
  private config: SecurityConfig;

  constructor() {
    this.config = this.loadSecurityConfig();
  }

  private loadSecurityConfig(): SecurityConfig {
    const isProduction = environmentService.isProduction();
    const securityConfig = environmentService.getSecurityConfig();

    return {
      session: {
        secret: securityConfig.sessionSecret,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: isProduction, // HTTPS only in production
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax'
      },

      jwt: {
        secret: securityConfig.jwtSecret,
        expiresIn: '15m', // Short-lived access tokens
        refreshExpiresIn: '7d', // Longer-lived refresh tokens
        algorithm: 'HS256'
      },

      rateLimit: {
        global: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: isProduction ? 100 : 1000 // Stricter in production
        },
        auth: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5 // Very strict for auth attempts
        },
        api: {
          windowMs: 1 * 60 * 1000, // 1 minute
          max: isProduction ? 60 : 300 // Stricter in production
        }
      },

      password: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90, // 90 days
        preventReuse: 12 // Last 12 passwords
      },

      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16
      },

      hipaa: {
        enableAuditLogging: true,
        enablePHIRedaction: true,
        enableAccessLogging: true,
        dataRetentionDays: 2555, // 7 years as required by HIPAA
        requireMinimumNecessary: true
      },

      headers: {
        enableHSTS: true,
        hstsMaxAge: 31536000, // 1 year
        enableCSP: true,
        enableFrameguard: true,
        enableXSSProtection: true
      },

      fileUpload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.doc', '.docx'],
        scanForMalware: isProduction
      }
    };
  }

  getConfig(): SecurityConfig {
    return this.config;
  }

  getSessionConfig() {
    return this.config.session;
  }

  getJWTConfig() {
    return this.config.jwt;
  }

  getRateLimitConfig() {
    return this.config.rateLimit;
  }

  getPasswordPolicy() {
    return this.config.password;
  }

  getEncryptionConfig() {
    return this.config.encryption;
  }

  getHIPAAConfig() {
    return this.config.hipaa;
  }

  getHeadersConfig() {
    return this.config.headers;
  }

  getFileUploadConfig() {
    return this.config.fileUpload;
  }

  // Security validation methods
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.config.password;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateFileUpload(file: { size: number; mimetype: string; originalname: string }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.config.fileUpload;

    if (file.size > config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${config.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      errors.push('File type not allowed');
    }

    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!config.allowedExtensions.includes(fileExtension)) {
      errors.push('File extension not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Security constants
  static readonly SECURITY_CONSTANTS = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    PASSWORD_SALT_ROUNDS: 12,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    CSRF_TOKEN_LENGTH: 32,
    API_KEY_LENGTH: 64,
    AUDIT_LOG_BATCH_SIZE: 100,
    PHI_REDACTION_CHAR: '*'
  } as const;
}

// Singleton instance
export const securityConfigService = new SecurityConfigService();
export { SecurityConfigService };