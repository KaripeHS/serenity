
import dotenv from 'dotenv';
dotenv.config();

import { getDbClient } from '../src/database/client';

async function fixSchema() {
    console.log('🔧 Starting Database Schema Fix (Public Schema)...');
    const db = getDbClient();

    try {
        // 1. Check for password_hash in PUBLIC schema
        console.log('Checking for password_hash...');
        const resPwd = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password_hash' AND table_schema = 'public'
        `);
        if (resPwd.rows.length === 0) {
            console.log('  ⚠️ password_hash missing in public.users. Adding column...');
            await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
            console.log('  ✅ Added password_hash.');
        } else {
            console.log('  ✅ password_hash exists.');
        }

        // 2. Check for role in PUBLIC schema
        console.log('Checking for role...');
        const resRole = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role' AND table_schema = 'public'
        `);
        if (resRole.rows.length === 0) {
            console.log('  ⚠️ role missing in public.users. Adding column...');
            await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'caregiver'`);
            console.log('  ✅ Added role.');
        } else {
            console.log('  ✅ role exists.');
        }

        // 3. Check for status in PUBLIC schema
        console.log('Checking for status...');
        const resStatus = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'status' AND table_schema = 'public'
        `);
        if (resStatus.rows.length === 0) {
            console.log('  ⚠️ status missing in public.users. Adding column...');
            await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
            console.log('  ✅ Added status.');
        } else {
            console.log('  ✅ status exists.');
        }

        // 4. Check for organization_id in PUBLIC schema
        console.log('Checking for organization_id...');
        const resOrg = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'organization_id' AND table_schema = 'public'
        `);
        if (resOrg.rows.length === 0) {
            console.log('  ⚠️ organization_id missing in public.users. Adding column...');
            // Assuming organizations table exists and id is UUID
            await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`);
            console.log('  ✅ Added organization_id.');
        } else {
            console.log('  ✅ organization_id exists.');
        }

    } catch (err) {
        console.error('💥 Fix Failed:', err);
    } finally {
        console.log('🏁 Schema Fix Complete.');
        process.exit(0);
    }
}

fixSchema();
