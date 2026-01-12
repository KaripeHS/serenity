
import dotenv from 'dotenv';
dotenv.config();

// Override DATABASE_URL to a fake unix socket
process.env.DATABASE_URL = 'postgresql://user:pass@/dbname?host=/cloudsql/fake:socket:path';

console.log('[REPRO SIMPLE] Starting...');

async function testImport() {
    console.log('[REPRO SIMPLE] Importing config/database.ts...');
    try {
        await import('./src/config/database.ts');
        console.log('[REPRO SIMPLE] Import successful.');
    } catch (error) {
        console.error('[REPRO SIMPLE] Error:', error);
    }
}

testImport();
