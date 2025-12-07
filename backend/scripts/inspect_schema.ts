
import { getDbClient } from '../src/database/client';

async function inspectSchema() {
    const db = getDbClient();
    const res = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'organizations'
    `);
    console.table(res.rows);
    process.exit(0);
}

inspectSchema().catch(console.error);
