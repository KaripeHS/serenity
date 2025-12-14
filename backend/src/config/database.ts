/**
 * Database Pool Export
 * Provides backward compatibility for services that import pool directly
 */

import { Pool } from 'pg';
import { environmentService } from './environment';

// Create pool instance
const dbConfig = environmentService.getDatabaseConfig();

export const pool = new Pool({
  connectionString: dbConfig.url,
  ssl: dbConfig.sslMode === 'require' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});
