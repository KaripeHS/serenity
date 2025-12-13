
import { getDbClient } from '../src/database/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function inspect() {
    console.log('Inspecting SHIFTS data...');
    const db = getDbClient();
    try {
        const u = await db.query("SELECT id, email FROM users WHERE email = 'smoke.test.caregiver@example.com'");
        const userId = u.rows[0]?.id;
        console.log('User:', u.rows);

        if (userId) {
            const cg = await db.query("SELECT * FROM caregivers WHERE user_id = $1", [userId]);
            console.log('Caregiver:', cg.rows);

            const mem = await db.query("SELECT * FROM user_pod_memberships WHERE user_id = $1", [userId]);
            console.log('Membership:', mem.rows);

            if (cg.rows.length > 0) {
                const shifts = await db.query("SELECT * FROM shifts WHERE caregiver_id = $1", [cg.rows[0].id]);
                console.log('Shifts:', shifts.rows);

                if (shifts.rows.length > 0) {
                    const client = await db.query("SELECT * FROM clients WHERE id = $1", [shifts.rows[0].client_id]);
                    console.log('Client:', client.rows);
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
