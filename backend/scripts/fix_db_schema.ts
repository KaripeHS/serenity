
import { getDbClient } from '../src/database/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixSchema() {
    console.log('🔧 Fixing DB Schema...');
    const db = getDbClient();
    try {
        // Add service_type if missing
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'service_type') THEN 
                    ALTER TABLE shifts ADD COLUMN service_type VARCHAR(50); 
                    RAISE NOTICE 'Added service_type column';
                END IF;
            END $$;
        `);

        // Add evv_record_id if missing
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'evv_record_id') THEN 
                    ALTER TABLE shifts ADD COLUMN evv_record_id UUID; 
                    RAISE NOTICE 'Added evv_record_id column';
                END IF;
            END $$;
        `);

        console.log('✅ Schema Fixed.');
    } catch (e) {
        console.error('❌ Schema Fix Failed:', e);
    } finally {
        process.exit();
    }
}

fixSchema();
