/**
 * Redis Caching Service
 * Provides caching layer for frequently accessed data
 *
 * Use cases:
 * - GPS tracking data (high-frequency updates)
 * - Dashboard metrics (reduce database load)
 * - User sessions
 * - Rate limiting
 */

import Redis from 'ioredis';


import { createLogger } from '../../utils/logger';

const logger = createLogger('redis');
export class RedisCacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        logger.info('[Redis] Connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('[Redis] Connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.info('[Redis] Connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();

    } catch (error) {
      logger.error('[Redis] Failed to connect:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null; // Fail gracefully
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`[Redis] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with expiration
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false; // Fail gracefully
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error(`[Redis] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`[Redis] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`[Redis] Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`[Redis] Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const value = await this.client.incr(key);
      if (ttlSeconds && value === 1) {
        // Set expiration only on first increment
        await this.client.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error(`[Redis] Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Store GPS location (geospatial data)
   */
  async setGPSLocation(caregiverId: string, latitude: number, longitude: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const key = 'gps:locations';
      await this.client.geoadd(key, longitude, latitude, caregiverId);

      // Also store timestamp
      const timestampKey = `gps:timestamp:${caregiverId}`;
      await this.client.setex(timestampKey, 3600, Date.now().toString());

      return true;
    } catch (error) {
      logger.error(`[Redis] Error setting GPS location for ${caregiverId}:`, error);
      return false;
    }
  }

  /**
   * Get nearby caregivers (geospatial query)
   */
  async getNearbyCaregivers(latitude: number, longitude: number, radiusMeters: number): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const key = 'gps:locations';
      const results = await this.client.georadius(
        key,
        longitude,
        latitude,
        radiusMeters,
        'm',
        'ASC'
      );

      return results as string[];
    } catch (error) {
      logger.error('[Redis] Error getting nearby caregivers:', error);
      return [];
    }
  }

  /**
   * Get latest GPS location for caregiver
   */
  async getGPSLocation(caregiverId: string): Promise<{ latitude: number; longitude: number; timestamp: number } | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const key = 'gps:locations';
      const position = await this.client.geopos(key, caregiverId);

      if (!position || !position[0]) {
        return null;
      }

      const [lon, lat] = position[0];

      // Get timestamp
      const timestampKey = `gps:timestamp:${caregiverId}`;
      const timestamp = await this.client.get(timestampKey);

      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        timestamp: timestamp ? parseInt(timestamp) : Date.now()
      };
    } catch (error) {
      logger.error(`[Redis] Error getting GPS location for ${caregiverId}:`, error);
      return null;
    }
  }

  /**
   * Cache dashboard metrics
   */
  async cacheDashboardMetrics(organizationId: string, dashboardName: string, metrics: any, ttlSeconds: number = 60): Promise<boolean> {
    const key = `dashboard:${organizationId}:${dashboardName}`;
    return await this.set(key, metrics, ttlSeconds);
  }

  /**
   * Get cached dashboard metrics
   */
  async getCachedDashboardMetrics(organizationId: string, dashboardName: string): Promise<any | null> {
    const key = `dashboard:${organizationId}:${dashboardName}`;
    return await this.get(key);
  }

  /**
   * Invalidate dashboard cache
   */
  async invalidateDashboardCache(organizationId: string, dashboardName?: string): Promise<number> {
    const pattern = dashboardName
      ? `dashboard:${organizationId}:${dashboardName}`
      : `dashboard:${organizationId}:*`;
    return await this.deletePattern(pattern);
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const count = await this.increment(key, windowSeconds);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count)
    };
  }

  /**
   * Store user session
   */
  async storeSession(sessionId: string, sessionData: any, ttlSeconds: number = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, ttlSeconds);
  }

  /**
   * Get user session
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  /**
   * Delete user session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.delete(key);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const info = await this.client.info();
      const dbSize = await this.client.dbsize();

      return {
        connected: this.isConnected,
        dbSize,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      logger.error('[Redis] Error getting stats:', error);
      return null;
    }
  }

  /**
   * Parse Redis INFO output
   */
  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const stats: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    }

    return {
      version: stats.redis_version,
      uptime: stats.uptime_in_seconds,
      connectedClients: stats.connected_clients,
      usedMemory: stats.used_memory_human,
      totalCommands: stats.total_commands_processed,
      opsPerSec: stats.instantaneous_ops_per_sec
    };
  }

  /**
   * Disconnect Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('[Redis] Disconnected');
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushdb();
      logger.info('[Redis] Cache flushed');
      return true;
    } catch (error) {
      logger.error('[Redis] Error flushing cache:', error);
      return false;
    }
  }
}

export const redisCacheService = new RedisCacheService();
