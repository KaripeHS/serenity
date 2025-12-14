/**
 * Public API Layer Service
 * Provides RESTful API access for third-party integrations
 *
 * Features:
 * - OAuth 2.0 authentication
 * - API key management
 * - Rate limiting
 * - Webhook subscriptions
 * - API versioning
 * - Usage analytics
 * - Developer portal integration
 */

import { pool } from '../../config/database';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';

interface APIKey {
  id: string;
  organizationId: string;
  name: string;
  key: string; // Hashed
  secret: string; // Hashed
  scopes: string[]; // e.g., ['read:clients', 'write:visits', 'read:caregivers']
  rateLimitPerMinute: number;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

interface WebhookSubscription {
  id: string;
  organizationId: string;
  apiKeyId: string;
  url: string;
  events: string[]; // e.g., ['visit.created', 'visit.completed', 'client.updated']
  secret: string; // For signature verification
  active: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

interface APIUsage {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

export class PublicAPIService {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.API_JWT_SECRET || 'default-api-secret-change-in-production';
  }

  /**
   * Generate API key and secret
   */
  async generateAPIKey(
    organizationId: string,
    name: string,
    scopes: string[],
    rateLimitPerMinute: number = 60,
    expiresInDays?: number
  ): Promise<{ apiKey: string; apiSecret: string }> {
    // Generate random key and secret
    const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');

    // Hash for storage
    const hashedKey = this.hashCredential(apiKey);
    const hashedSecret = this.hashCredential(apiSecret);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await pool.query(
      `
      INSERT INTO api_keys (
        organization_id,
        name,
        key_hash,
        secret_hash,
        scopes,
        rate_limit_per_minute,
        active,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW())
      `,
      [
        organizationId,
        name,
        hashedKey,
        hashedSecret,
        JSON.stringify(scopes),
        rateLimitPerMinute,
        expiresAt
      ]
    );

    return { apiKey, apiSecret };
  }

  /**
   * Validate API credentials and generate JWT token
   */
  async authenticateAPI(
    apiKey: string,
    apiSecret: string
  ): Promise<{ token: string; organizationId: string; scopes: string[] } | null> {
    try {
      const hashedKey = this.hashCredential(apiKey);
      const hashedSecret = this.hashCredential(apiSecret);

      const result = await pool.query(
        `
        SELECT
          id,
          organization_id,
          scopes,
          rate_limit_per_minute,
          expires_at
        FROM api_keys
        WHERE key_hash = $1
          AND secret_hash = $2
          AND active = true
          AND (expires_at IS NULL OR expires_at > NOW())
        `,
        [hashedKey, hashedSecret]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const apiKeyRecord = result.rows[0];
      const scopes = JSON.parse(apiKeyRecord.scopes);

      // Generate JWT token
      const token = jwt.sign(
        {
          apiKeyId: apiKeyRecord.id,
          organizationId: apiKeyRecord.organization_id,
          scopes,
          type: 'api_access'
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );

      return {
        token,
        organizationId: apiKeyRecord.organization_id,
        scopes
      };
    } catch (error) {
      console.error('[PublicAPI] Authentication error:', error);
      return null;
    }
  }

  /**
   * Verify JWT token
   */
  async verifyAPIToken(token: string): Promise<{
    apiKeyId: string;
    organizationId: string;
    scopes: string[];
  } | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (decoded.type !== 'api_access') {
        return null;
      }

      return {
        apiKeyId: decoded.apiKeyId,
        organizationId: decoded.organizationId,
        scopes: decoded.scopes
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if API key has required scope
   */
  hasScope(userScopes: string[], requiredScope: string): boolean {
    // Support wildcard scopes (e.g., 'write:*' includes 'write:visits')
    return userScopes.some(scope => {
      if (scope === requiredScope) return true;
      if (scope.endsWith(':*')) {
        const prefix = scope.split(':')[0];
        return requiredScope.startsWith(prefix + ':');
      }
      return false;
    });
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(apiKeyId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60000); // 1 minute window

    // Get API key rate limit
    const keyResult = await pool.query(
      'SELECT rate_limit_per_minute FROM api_keys WHERE id = $1',
      [apiKeyId]
    );

    if (keyResult.rows.length === 0) {
      return { allowed: false, remaining: 0, resetAt: now };
    }

    const rateLimit = keyResult.rows[0].rate_limit_per_minute;

    // Count requests in current window
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM api_usage
      WHERE api_key_id = $1
        AND timestamp >= $2
      `,
      [apiKeyId, windowStart]
    );

    const currentCount = parseInt(countResult.rows[0].count);
    const remaining = Math.max(0, rateLimit - currentCount);
    const allowed = currentCount < rateLimit;

    const resetAt = new Date(windowStart.getTime() + 60000);

    return { allowed, remaining, resetAt };
  }

  /**
   * Log API usage
   */
  async logAPIUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    await pool.query(
      `
      INSERT INTO api_usage (
        api_key_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      `,
      [apiKeyId, endpoint, method, statusCode, responseTime]
    );
  }

  /**
   * Create webhook subscription
   */
  async createWebhook(
    organizationId: string,
    apiKeyId: string,
    url: string,
    events: string[]
  ): Promise<{ webhookId: string; secret: string }> {
    // Generate webhook secret for signature verification
    const secret = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `
      INSERT INTO webhook_subscriptions (
        organization_id,
        api_key_id,
        url,
        events,
        secret,
        active,
        retry_policy,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, true, $6, NOW())
      RETURNING id
      `,
      [
        organizationId,
        apiKeyId,
        url,
        JSON.stringify(events),
        secret,
        JSON.stringify({
          maxRetries: 3,
          backoffMultiplier: 2
        })
      ]
    );

    return {
      webhookId: result.rows[0].id,
      secret
    };
  }

  /**
   * Trigger webhook event
   */
  async triggerWebhook(
    organizationId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    // Get all active webhook subscriptions for this event
    const result = await pool.query(
      `
      SELECT * FROM webhook_subscriptions
      WHERE organization_id = $1
        AND active = true
        AND events @> $2::jsonb
      `,
      [organizationId, JSON.stringify([eventType])]
    );

    const webhooks = result.rows;

    // Trigger each webhook
    for (const webhook of webhooks) {
      await this.sendWebhookNotification(
        webhook.id,
        webhook.url,
        webhook.secret,
        eventType,
        payload,
        JSON.parse(webhook.retry_policy)
      );
    }
  }

  /**
   * Send webhook notification with retries
   */
  private async sendWebhookNotification(
    webhookId: string,
    url: string,
    secret: string,
    eventType: string,
    payload: any,
    retryPolicy: { maxRetries: number; backoffMultiplier: number },
    attempt: number = 1
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const body = JSON.stringify({
        event: eventType,
        timestamp,
        data: payload
      });

      // Generate signature
      const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-Timestamp': timestamp.toString()
        },
        timeout: 10000
      });

      // Log successful delivery
      await pool.query(
        `
        INSERT INTO webhook_delivery_log (
          webhook_subscription_id,
          event_type,
          status_code,
          attempt,
          delivered_at
        ) VALUES ($1, $2, $3, $4, NOW())
        `,
        [webhookId, eventType, response.status, attempt]
      );
    } catch (error: any) {
      console.error('[PublicAPI] Webhook delivery failed:', error.message);

      // Log failed delivery
      await pool.query(
        `
        INSERT INTO webhook_delivery_log (
          webhook_subscription_id,
          event_type,
          status_code,
          attempt,
          error_message,
          delivered_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [webhookId, eventType, error.response?.status || 0, attempt, error.message]
      );

      // Retry if not exceeded max retries
      if (attempt < retryPolicy.maxRetries) {
        const delay = Math.pow(retryPolicy.backoffMultiplier, attempt) * 1000;

        setTimeout(() => {
          this.sendWebhookNotification(
            webhookId,
            url,
            secret,
            eventType,
            payload,
            retryPolicy,
            attempt + 1
          );
        }, delay);
      } else {
        // Disable webhook after max retries
        await pool.query(
          `
          UPDATE webhook_subscriptions
          SET active = false,
              disabled_reason = 'Max delivery failures reached',
              updated_at = NOW()
          WHERE id = $1
          `,
          [webhookId]
        );
      }
    }
  }

  /**
   * Get API usage analytics
   */
  async getAPIAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    requestsByEndpoint: Record<string, number>;
    requestsByStatusCode: Record<number, number>;
    requestsOverTime: Array<{ date: string; count: number }>;
  }> {
    // Get API keys for organization
    const keysResult = await pool.query(
      'SELECT id FROM api_keys WHERE organization_id = $1',
      [organizationId]
    );

    const apiKeyIds = keysResult.rows.map(r => r.id);

    if (apiKeyIds.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        requestsOverTime: []
      };
    }

    // Total requests and avg response time
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_requests,
        AVG(response_time_ms) as avg_response_time
      FROM api_usage
      WHERE api_key_id = ANY($1)
        AND timestamp >= $2
        AND timestamp < $3
      `,
      [apiKeyIds, startDate, endDate]
    );

    // Requests by endpoint
    const endpointResult = await pool.query(
      `
      SELECT
        endpoint,
        COUNT(*) as count
      FROM api_usage
      WHERE api_key_id = ANY($1)
        AND timestamp >= $2
        AND timestamp < $3
      GROUP BY endpoint
      ORDER BY count DESC
      `,
      [apiKeyIds, startDate, endDate]
    );

    const requestsByEndpoint: Record<string, number> = {};
    endpointResult.rows.forEach(row => {
      requestsByEndpoint[row.endpoint] = parseInt(row.count);
    });

    // Requests by status code
    const statusResult = await pool.query(
      `
      SELECT
        status_code,
        COUNT(*) as count
      FROM api_usage
      WHERE api_key_id = ANY($1)
        AND timestamp >= $2
        AND timestamp < $3
      GROUP BY status_code
      ORDER BY status_code
      `,
      [apiKeyIds, startDate, endDate]
    );

    const requestsByStatusCode: Record<number, number> = {};
    statusResult.rows.forEach(row => {
      requestsByStatusCode[row.status_code] = parseInt(row.count);
    });

    // Requests over time (daily)
    const timeSeriesResult = await pool.query(
      `
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM api_usage
      WHERE api_key_id = ANY($1)
        AND timestamp >= $2
        AND timestamp < $3
      GROUP BY DATE(timestamp)
      ORDER BY date
      `,
      [apiKeyIds, startDate, endDate]
    );

    const requestsOverTime = timeSeriesResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count)
    }));

    return {
      totalRequests: parseInt(statsResult.rows[0].total_requests || 0),
      avgResponseTime: parseFloat(statsResult.rows[0].avg_response_time || 0),
      requestsByEndpoint,
      requestsByStatusCode,
      requestsOverTime
    };
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(apiKeyId: string): Promise<boolean> {
    try {
      await pool.query(
        `
        UPDATE api_keys
        SET active = false,
            revoked_at = NOW()
        WHERE id = $1
        `,
        [apiKeyId]
      );

      // Also deactivate associated webhooks
      await pool.query(
        `
        UPDATE webhook_subscriptions
        SET active = false,
            updated_at = NOW()
        WHERE api_key_id = $1
        `,
        [apiKeyId]
      );

      return true;
    } catch (error) {
      console.error('[PublicAPI] Error revoking API key:', error);
      return false;
    }
  }

  /**
   * List API keys for organization
   */
  async listAPIKeys(organizationId: string): Promise<
    Array<{
      id: string;
      name: string;
      scopes: string[];
      rateLimitPerMinute: number;
      active: boolean;
      createdAt: Date;
      expiresAt?: Date;
    }>
  > {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        scopes,
        rate_limit_per_minute,
        active,
        created_at,
        expires_at
      FROM api_keys
      WHERE organization_id = $1
      ORDER BY created_at DESC
      `,
      [organizationId]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      scopes: JSON.parse(row.scopes),
      rateLimitPerMinute: row.rate_limit_per_minute,
      active: row.active,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    }));
  }

  /**
   * Hash credential for secure storage
   */
  private hashCredential(credential: string): string {
    return crypto.createHash('sha256').update(credential).digest('hex');
  }

  /**
   * Get available API scopes
   */
  getAvailableScopes(): Array<{ scope: string; description: string }> {
    return [
      { scope: 'read:clients', description: 'Read client information' },
      { scope: 'write:clients', description: 'Create and update clients' },
      { scope: 'read:caregivers', description: 'Read caregiver information' },
      { scope: 'write:caregivers', description: 'Create and update caregivers' },
      { scope: 'read:visits', description: 'Read visit information' },
      { scope: 'write:visits', description: 'Create and update visits' },
      { scope: 'read:schedule', description: 'Read schedule information' },
      { scope: 'write:schedule', description: 'Create and update schedules' },
      { scope: 'read:billing', description: 'Read billing information' },
      { scope: 'write:billing', description: 'Create invoices and payments' },
      { scope: 'read:reports', description: 'Access reports and analytics' },
      { scope: 'webhooks:manage', description: 'Manage webhook subscriptions' }
    ];
  }
}

export const publicAPIService = new PublicAPIService();
