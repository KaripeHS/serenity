
import { getDbClient } from '../src/database/client';

async function inspectConstraint() {
    const db = getDbClient();
    const res = await db.query(`
        SELECT conname, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'valid_status' AND conrelid = 'claims'::regclass
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}

inspectConstraint().catch(console.error);
