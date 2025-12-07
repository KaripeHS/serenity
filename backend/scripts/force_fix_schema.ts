
import dotenv from 'dotenv';
dotenv.config();

import { getDbClient } from '../src/database/client';

async function forceFix() {
    console.log('🔨 Force Fixing Schema (Public)...');
    const db = getDbClient();

    try {
        console.log('Attempting to add columns if not exists...');

        // Users
        await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
        console.log('  ✅ users.password_hash (ensured)');

        await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'caregiver'`);
        console.log('  ✅ users.role (ensured)');

        await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
        console.log('  ✅ users.status (ensured)');

        await db.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`);
        console.log('  ✅ users.organization_id (ensured)');

        // Clients
        await db.query(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
        console.log('  ✅ clients.status (ensured)');

    } catch (err) {
        console.error('💥 Force Fix Failed:', err);
    } finally {
        process.exit(0);
    }
}

forceFix();
