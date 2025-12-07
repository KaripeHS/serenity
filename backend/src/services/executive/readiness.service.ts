
import { getDbClient } from '../../database/client';
import { accountingService } from '../finance/accounting.service'; // For Cash
import { authorizationService } from '../clinical/authorization.service';
import { subHours, addDays, format } from 'date-fns';

export interface ReadinessItem {
    category: 'Billing' | 'Clinical' | 'Finance' | 'Compliance';
    severity: 'critical' | 'warning' | 'good' | 'info';
    message: string;
    value?: string | number;
    actionLink?: string;
}

export interface ReadinessBrief {
    generatedAt: Date;
    period: 'Morning' | 'Afternoon';
    items: ReadinessItem[];
    summary: string;
}

export class ReadinessService {

    /**
     * Generate the Daily Brief
     */
    async generateBrief(organizationId: string): Promise<ReadinessBrief> {
        const db = getDbClient();
        const items: ReadinessItem[] = [];
        const now = new Date();
        const period = now.getHours() < 12 ? 'Morning' : 'Afternoon';

        // =================================================================
        // 🚨 IMMEDIATE (Red): Action Required Now
        // =================================================================

        // 1. Finance: Low Cash Alert
        const opRes = await db.query("SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND code = '1010'", [organizationId]);
        const unRes = await db.query("SELECT id FROM chart_of_accounts WHERE organization_id = $1 AND code = '1150'", [organizationId]);

        let cashTotal = 0;
        if (opRes.rows.length > 0) cashTotal += await accountingService.getAccountBalance(organizationId, opRes.rows[0].id);
        if (unRes.rows.length > 0) cashTotal += await accountingService.getAccountBalance(organizationId, unRes.rows[0].id);

        if (cashTotal < 2000) {
            items.push({
                category: 'Finance',
                severity: 'critical',
                message: `Low Cash Position ($${cashTotal.toFixed(2)}) - Fund Operating Account`,
                value: cashTotal.toFixed(2),
                actionLink: '/dashboard/finance/bank-accounts'
            });
        }

        // 2. Billing: Stale Draft Claims (> 48h)
        const staleDate = subHours(now, 48);
        const unbilledRes = await db.query(`
            SELECT COUNT(*) as count, SUM(total_amount) as total 
            FROM claims 
            WHERE status = 'draft' AND created_at < $1 AND organization_id = $2
        `, [staleDate, organizationId]);

        const unbilledCount = parseInt(unbilledRes.rows[0].count || '0');
        if (unbilledCount > 0) {
            items.push({
                category: 'Billing',
                severity: 'critical',
                message: `${unbilledCount} Claims in Draft > 48 Hours`,
                value: `$${unbilledRes.rows[0].total || 0}`,
                actionLink: '/dashboard/finance/billing'
            });
        }

        // =================================================================
        // ⚠️ IMPORTANT (Yellow): Monitor / Expiring Soon
        // =================================================================

        // 3. Compliance: Expiring Credentials (< 30 Days)
        const expiryDate = addDays(now, 30);
        const credRes = await db.query(`
            SELECT COUNT(*) as count 
            FROM credentials c
            JOIN users u ON c.user_id = u.id
            WHERE c.status = 'active' AND c.expiration_date < $1 AND u.organization_id = $2
        `, [expiryDate, organizationId]);

        const expiringCount = parseInt(credRes.rows[0].count || '0');
        if (expiringCount > 0) {
            items.push({
                category: 'Compliance',
                severity: 'warning',
                message: `${expiringCount} Staff Credentials Expiring < 30 Days`,
                actionLink: '/dashboard/admin/users'
            });
        }

        // 4. Clinical: Expiring Authorizations (< 14 Days)
        const expiringAuths = await authorizationService.getExpiringAuthorizations(organizationId, 14);
        if (expiringAuths.length > 0) {
            items.push({
                category: 'Clinical',
                severity: 'warning',
                message: `${expiringAuths.length} Patient Authorizations expiring soon`,
                value: expiringAuths.map(a => `${a.first_name} ${a.last_name} (${a.service_code})`).join(', ')
            });
        }


        // =================================================================
        // ✅ HEALTH (Green): Pulse Check
        // =================================================================

        // 4. Clinical: Census
        const censusRes = await db.query(`SELECT COUNT(*) as count FROM clients WHERE status = 'active' AND organization_id = $1`, [organizationId]);
        items.push({
            category: 'Clinical',
            severity: 'good',
            message: 'Active Census Count',
            value: censusRes.rows[0].count
        });

        // 5. Finance: Cash Collected Today
        // Using 'payments' table from Phase 16
        const collectionsRes = await db.query(`
            SELECT SUM(amount) as total
            FROM payments
            WHERE created_at::date = CURRENT_DATE AND organization_id = $1
        `, [organizationId]);

        const collectedToday = parseFloat(collectionsRes.rows[0].total || '0').toFixed(2);
        items.push({
            category: 'Finance',
            severity: 'good',
            message: 'Cash Collected Today',
            value: `$${collectedToday}`
        });

        return {
            generatedAt: now,
            period,
            items,
            summary: this.buildSummary(items)
        };
    }

    private buildSummary(items: ReadinessItem[]): string {
        const critical = items.filter(i => i.severity === 'critical').length;
        const warning = items.filter(i => i.severity === 'warning').length;

        if (critical > 0) return `🚨 ACTION REQUIRED: ${critical} Critical Items.`;
        if (warning > 0) return `⚠️ Attention: ${warning} Warning Items.`;
        return `✅ All Systems Green.`;
    }
}

export const readinessService = new ReadinessService();
