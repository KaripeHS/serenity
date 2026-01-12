
import dotenv from 'dotenv';
dotenv.config();

// Override DATABASE_URL to a fake unix socket to simulate Cloud Run environment mismatch
process.env.DATABASE_URL = 'postgresql://user:pass@/dbname?host=/cloudsql/fake:socket:path';

console.log('[REPRO] Starting reproduction script');
console.log('[REPRO] DATABASE_URL set to:', process.env.DATABASE_URL);

async function testImport() {
    console.log('[REPRO] Importing api/index.ts...');
    try {
        // Dynamic import to catch the hang during loading
        const { createApp } = await import('./src/api/index.ts');
        console.log('[REPRO] Import successful.');

        console.log('[REPRO] Calling createApp...');
        const app = createApp({
            port: 3000,
            corsOrigins: [],
            nodeEnv: 'development'
        });
        console.log('[REPRO] createApp finished.');
    } catch (error) {
        console.error('[REPRO] Error:', error);
    }
}

testImport().catch(err => console.error(err));
