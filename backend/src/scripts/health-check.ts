/**
 * Database Health Check Script
 * Tests database connectivity without requiring full environment setup
 */

/* eslint-disable no-console */
import { Pool } from 'pg';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connectivity...');

  // Use environment variables or defaults for testing
  const connectionString = process.env.DATABASE_URL || 'postgresql://serenity:secure_password@localhost:5432/serenity_erp';

  const pool = new Pool({
    connectionString,
    ssl: false, // For local testing
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection established');

    // Test query
    const result = await client.query('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Database query successful:', result.rows[0]);

    // Test database existence
    try {
      const dbCheck = await client.query("SELECT current_database()");
      console.log('✅ Connected to database:', dbCheck.rows[0]?.current_database);
    } catch (dbError) {
      console.log('⚠️  Database query warning (expected in some environments):', (dbError as Error).message);
    }

    client.release();

    // Test pool stats
    console.log('📊 Pool stats:', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });

    await pool.end();
    console.log('✅ Database health check completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', {
      error: (error as Error).message,
      connectionString: connectionString.replace(/password=[^&]+/g, 'password=***')
    });

    try {
      await pool.end();
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return false;
  }
}

if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Health check script failed:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection };