import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
});

async function reset() {
    console.log('🗑️  Resetting database schema...');
    try {
        await pool.query('DROP SCHEMA public CASCADE');
        await pool.query('CREATE SCHEMA public');
        await pool.query('GRANT ALL ON SCHEMA public TO postgres');
        await pool.query('GRANT ALL ON SCHEMA public TO public');
        console.log('✅ Schema public dropped and recreated.');

        // Enable extensions
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('✅ Extensions enabled.');
    } catch (err) {
        console.error('❌ Error resetting database:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

reset();
