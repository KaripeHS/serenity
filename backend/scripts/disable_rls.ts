
import { getDbClient } from '../src/database/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function disable() {
    console.log('🔓 Disabling RLS...');
    const db = getDbClient();
    try {
        await db.query(`ALTER TABLE clients DISABLE ROW LEVEL SECURITY`);
        await db.query(`ALTER TABLE caregivers DISABLE ROW LEVEL SECURITY`);
        await db.query(`ALTER TABLE shifts DISABLE ROW LEVEL SECURITY`); // Just in case
        console.log('✅ RLS Disabled.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

disable();
