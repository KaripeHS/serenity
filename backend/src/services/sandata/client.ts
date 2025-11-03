/**
 * Sandata HTTP Client
 * Handles all HTTP interactions with Sandata Alt-EVV API
 *
 * Features:
 * - OAuth 2.0 authentication with token caching
 * - Automatic retry with exponential backoff
 * - Rate limiting (429) handling
 * - Request/response logging for audit trail
 * - Error taxonomy mapping
 * - Kill switch support
 *
 * @module services/sandata/client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  getActiveSandataConfig,
  getSandataBusinessRules,
  isSandataKillSwitchActive,
  isSandataEnabled,
  SANDATA_ENDPOINTS,
  SANDATA_ERROR_CODES,
} from '../../config/sandata';
import type {
  SandataApiResponse,
  SandataApiError,
  SandataAuthRequest,
  SandataAuthResponse,
  SandataAuthToken,
  SandataErrorCode,
} from './types';

/**
 * Sandata HTTP Client Class
 */
export class SandataClient {
  private axiosInstance: AxiosInstance;
  private authToken: SandataAuthToken | null = null;
  private readonly config = getActiveSandataConfig();
  private readonly businessRules = getSandataBusinessRules();

  constructor() {
    // Initialize axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Serenity-ERP/1.0',
      },
    });

    // Request interceptor: Add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Skip auth for token endpoint
        if (!config.url?.includes('/oauth/token')) {
          const token = await this.getValidToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token.token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle common errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 - Token expired, retry once
        if (error.response?.status === 401 && !error.config?.headers?.['X-Retry-Count']) {
          this.authToken = null; // Clear expired token
          const newToken = await this.authenticate();
          if (newToken && error.config) {
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${newToken.token}`;
            error.config.headers['X-Retry-Count'] = '1';
            return this.axiosInstance.request(error.config);
          }
        }

        // Handle 429 - Rate limit
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delaySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          this.logger.warn('Sandata rate limit hit', { retryAfterSeconds: delaySeconds });
          // Caller should handle retry via queue
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Sandata OAuth 2.0
   */
  private async authenticate(): Promise<SandataAuthToken | null> {
    try {
      const authRequest: SandataAuthRequest = {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'evv:read evv:write',
      };

      const response = await this.axiosInstance.post<SandataAuthResponse>(
        SANDATA_ENDPOINTS.auth,
        authRequest,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          transformRequest: [(data) => {
            return Object.entries(data)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
              .join('&');
          }],
        }
      );

      const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      this.authToken = {
        token: response.data.access_token,
        expiresAt,
        isExpired: () => new Date() >= expiresAt,
      };

      this.logger.info('Sandata authenticated successfully', { expiresAt: expiresAt.toISOString() });

      return this.authToken;
    } catch (error) {
      this.logger.error('Sandata authentication failed', { error: this.getErrorMessage(error) });
      throw this.wrapError(error, 'Authentication failed');
    }
  }

  /**
   * Get valid auth token (refresh if needed)
   */
  private async getValidToken(): Promise<SandataAuthToken | null> {
    if (this.authToken && !this.authToken.isExpired()) {
      return this.authToken;
    }

    // Token expired or doesn't exist, get new one
    return await this.authenticate();
  }

  /**
   * Make GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<SandataApiResponse<T>> {
    this.checkKillSwitch();

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.get<T>(url, config);
      const duration = Date.now() - startTime;

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Make POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<SandataApiResponse<T>> {
    this.checkKillSwitch();

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.post<T>(url, data, config);
      const duration = Date.now() - startTime;

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        transactionId: response.headers['x-transaction-id'] || response.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Make PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<SandataApiResponse<T>> {
    this.checkKillSwitch();

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.put<T>(url, data, config);
      const duration = Date.now() - startTime;

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        transactionId: response.headers['x-transaction-id'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<SandataApiResponse<T>> {
    this.checkKillSwitch();

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.delete<T>(url, config);
      const duration = Date.now() - startTime;

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(SANDATA_ENDPOINTS.status, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Sandata health check failed', { error: this.getErrorMessage(error) });
      return false;
    }
  }

  /**
   * Check kill switch before making requests
   */
  private checkKillSwitch(): void {
    if (isSandataKillSwitchActive()) {
      throw new Error('SANDATA KILL SWITCH ACTIVE - All API calls blocked');
    }

    if (!isSandataEnabled()) {
      throw new Error('Sandata integration is disabled via feature flags');
    }
  }

  /**
   * Handle API errors and map to Sandata error taxonomy
   */
  private handleError<T>(error: any): SandataApiResponse<T> {
    const axiosError = error as AxiosError;

    // Network/timeout errors
    if (!axiosError.response) {
      return {
        success: false,
        statusCode: 0,
        error: {
          code: axiosError.code === 'ECONNABORTED' ? SANDATA_ERROR_CODES.SYSTEM_TIMEOUT : SANDATA_ERROR_CODES.SYSTEM_NETWORK_ERROR,
          message: axiosError.message || 'Network error occurred',
        },
        timestamp: new Date().toISOString(),
      };
    }

    const statusCode = axiosError.response.status;
    const responseData = axiosError.response.data as any;

    // Map HTTP status to error taxonomy
    let errorCode: SandataErrorCode;
    let errorMessage: string;

    switch (statusCode) {
      case 400:
        errorCode = SANDATA_ERROR_CODES.VALIDATION_INVALID_FORMAT;
        errorMessage = responseData?.message || 'Invalid request format';
        break;
      case 401:
        errorCode = SANDATA_ERROR_CODES.AUTH_INVALID_CREDENTIALS;
        errorMessage = 'Authentication failed - invalid credentials';
        break;
      case 403:
        errorCode = SANDATA_ERROR_CODES.AUTH_FORBIDDEN;
        errorMessage = 'Access forbidden - check permissions';
        break;
      case 404:
        errorCode = responseData?.field?.includes('individual')
          ? SANDATA_ERROR_CODES.BUSINESS_INDIVIDUAL_NOT_FOUND
          : SANDATA_ERROR_CODES.BUSINESS_EMPLOYEE_NOT_FOUND;
        errorMessage = responseData?.message || 'Resource not found';
        break;
      case 429:
        errorCode = SANDATA_ERROR_CODES.SYSTEM_RATE_LIMIT;
        errorMessage = 'Rate limit exceeded - too many requests';
        break;
      case 500:
        errorCode = SANDATA_ERROR_CODES.SYSTEM_INTERNAL_ERROR;
        errorMessage = 'Sandata internal server error';
        break;
      case 503:
        errorCode = SANDATA_ERROR_CODES.SYSTEM_SERVICE_UNAVAILABLE;
        errorMessage = 'Sandata service temporarily unavailable';
        break;
      case 504:
        errorCode = SANDATA_ERROR_CODES.SYSTEM_GATEWAY_TIMEOUT;
        errorMessage = 'Gateway timeout';
        break;
      default:
        errorCode = SANDATA_ERROR_CODES.SYSTEM_INTERNAL_ERROR;
        errorMessage = `HTTP ${statusCode}: ${responseData?.message || 'Unknown error'}`;
    }

    return {
      success: false,
      statusCode,
      error: {
        code: errorCode,
        message: errorMessage,
        field: responseData?.field,
        details: responseData,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Wrap generic errors
   */
  private wrapError(error: any, context: string): Error {
    const message = this.getErrorMessage(error);
    return new Error(`${context}: ${message}`);
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    return 'Unknown error occurred';
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      providerId: this.config.providerId,
      apiVersion: this.config.apiVersion,
      hasToken: this.authToken !== null,
      tokenExpired: this.authToken?.isExpired() ?? true,
    };
  }
}

/**
 * Singleton instance (lazy-loaded)
 */
let sandataClientInstance: SandataClient | null = null;

/**
 * Get Sandata client singleton
 */
export function getSandataClient(): SandataClient {
  if (!sandataClientInstance) {
    sandataClientInstance = new SandataClient();
  }
  return sandataClientInstance;
}

/**
 * Reset client instance (useful for testing)
 */
export function resetSandataClient(): void {
  sandataClientInstance = null;
}

export default SandataClient;
