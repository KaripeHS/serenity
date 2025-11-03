/**
 * Database Client for Serenity ERP
 * HIPAA-compliant PostgreSQL client with connection pooling and audit logging
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { createLogger } from '../utils/logger';
import { environmentService } from '../config/environment';

const dbLogger = createLogger('database');

export interface QueryContext {
  userId?: string;
  organizationId?: string;
  podId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface DatabaseConfig {
  connectionString: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export class DatabaseClient {
  private pool: Pool;
  private isConnected = false;

  constructor() {
    const dbConfig = environmentService.getDatabaseConfig();

    this.pool = new Pool({
      connectionString: dbConfig.url,
      ssl: dbConfig.sslMode === 'require' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
    });

    this.pool.on('error', (err) => {
      dbLogger.error('Unexpected error on idle client', { error: err.message });
    });

    this.pool.on('connect', () => {
      this.isConnected = true;
      dbLogger.info('Database client connected');
    });

    this.pool.on('remove', () => {
      dbLogger.debug('Database client removed from pool');
    });
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    context?: QueryContext
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    const requestId = context?.requestId || `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      dbLogger.debug('Executing query', {
        requestId,
        queryLength: text.length,
        paramCount: params?.length || 0,
        userId: context?.userId,
        organizationId: context?.organizationId
      });

      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      dbLogger.info('Query executed successfully', {
        requestId,
        duration,
        rowCount: result.rowCount,
        userId: context?.userId,
        organizationId: context?.organizationId
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      dbLogger.error('Query execution failed', {
        requestId,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context?.userId,
        organizationId: context?.organizationId
      });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      dbLogger.debug('Database client acquired from pool');
      return client;
    } catch (error) {
      dbLogger.error('Failed to acquire database client', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    context?: QueryContext
  ): Promise<T> {
    const client = await this.getClient();
    const requestId = context?.requestId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      await client.query('BEGIN');
      dbLogger.debug('Transaction started', {
        requestId,
        userId: context?.userId,
        organizationId: context?.organizationId
      });

      const result = await callback(client);

      await client.query('COMMIT');
      dbLogger.info('Transaction committed', {
        requestId,
        userId: context?.userId,
        organizationId: context?.organizationId
      });

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      dbLogger.error('Transaction rolled back', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context?.userId,
        organizationId: context?.organizationId
      });
      throw error;
    } finally {
      client.release();
      dbLogger.debug('Database client released', { requestId });
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows.length === 1 && result.rows[0]?.health === 1;
    } catch (error) {
      dbLogger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      dbLogger.info('Database pool closed');
    } catch (error) {
      dbLogger.error('Error closing database pool', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async insert<T extends QueryResultRow = any>(
    tableName: string,
    data: Record<string, any>,
    context?: QueryContext
  ): Promise<QueryResult<T>> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    return this.query<T>(query, values, context);
  }

  async update<T extends QueryResultRow = any>(
    tableName: string,
    data: Record<string, any>,
    whereClause: string,
    whereParams: any[],
    context?: QueryContext
  ): Promise<QueryResult<T>> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

    const query = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    const allParams = [...values, ...whereParams];
    return this.query<T>(query, allParams, context);
  }

  async delete<T extends QueryResultRow = any>(
    tableName: string,
    whereClause: string,
    whereParams: any[],
    context?: QueryContext
  ): Promise<QueryResult<T>> {
    const query = `
      DELETE FROM ${tableName}
      WHERE ${whereClause}
      RETURNING *
    `;

    return this.query<T>(query, whereParams, context);
  }

  async select<T extends QueryResultRow = any>(
    tableName: string,
    columns: string[] = ['*'],
    whereClause?: string,
    whereParams?: any[],
    context?: QueryContext
  ): Promise<QueryResult<T>> {
    const columnsStr = columns.join(', ');
    let query = `SELECT ${columnsStr} FROM ${tableName}`;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    return this.query<T>(query, whereParams, context);
  }

  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };

  }
  async findOne<T extends QueryResultRow = any>(
    tableName: string,
    whereConditions: Record<string, any>,
    context?: QueryContext
  ): Promise<T | null> {
    const whereKeys = Object.keys(whereConditions);
    const whereValues = Object.values(whereConditions);
    const whereClause = whereKeys.map((key, index) => `${key} = $${index + 1}`).join(" AND ");

    const query = `SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT 1`;
    const result = await this.query<T>(query, whereValues, context);

    return result.rows.length > 0 ? (result.rows[0] || null) : null;
  }
}

/**
 * Singleton database client instance
 */
let dbClientInstance: DatabaseClient | null = null;

/**
 * Get database client singleton
 */
export function getDbClient(): DatabaseClient {
  if (!dbClientInstance) {
    dbClientInstance = new DatabaseClient();
  }
  return dbClientInstance;
}

/**
 * Reset database client instance (for testing)
 */
export function resetDbClient(): void {
  dbClientInstance = null;
}