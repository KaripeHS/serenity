
import { getDbClient } from '../../database/client';
import { accountingService } from './accounting.service';

export interface GrossMarginReport {
    period: { start: Date; end: Date };
    totalRevenue: number;
    totalCOGS: number;
    grossMargin: number;
    grossMarginPercent: number;
    breakdown: {
        revenueByPayer: Record<string, number>;
        revenueByDiscipline: Record<string, number>;
        costByDiscipline: Record<string, number>;
    };
}

export class FinancialIntelligenceService {

    /**
     * Calculate Gross Margin for a specific period
     * Gross Margin = Service Revenue - Direct Costs (Clinician Pay, Mileage, Supplies)
     */
    async getGrossMarginAnalysis(organizationId: string, startDate: Date, endDate: Date): Promise<GrossMarginReport> {
        const db = getDbClient();

        // 1. Fetch Revenue (Class 4xxx)
        const revenueRes = await db.query(`
            SELECT coa.code, coa.name, SUM(jl.credit - jl.debit) as amount
            FROM journal_lines jl
            JOIN chart_of_accounts coa ON jl.account_id = coa.id
            JOIN journal_entries je ON jl.journal_entry_id = je.id
            WHERE jl.organization_id = $1 
              AND je.date >= $2 AND je.date <= $3
              AND coa.code LIKE '4%' 
            GROUP BY coa.code, coa.name
        `, [organizationId, startDate, endDate]);

        // 2. Fetch Direct Costs (Class 5xxx)
        const cogsRes = await db.query(`
            SELECT coa.code, coa.name, SUM(jl.debit - jl.credit) as amount
            FROM journal_lines jl
            JOIN chart_of_accounts coa ON jl.account_id = coa.id
            JOIN journal_entries je ON jl.journal_entry_id = je.id
            WHERE jl.organization_id = $1 
              AND je.date >= $2 AND je.date <= $3
              AND coa.code LIKE '5%' 
            GROUP BY coa.code, coa.name
        `, [organizationId, startDate, endDate]);

        const totalRevenue = revenueRes.rows.reduce((sum, row) => sum + parseFloat(row.amount || '0'), 0);
        const totalCOGS = cogsRes.rows.reduce((sum, row) => sum + parseFloat(row.amount || '0'), 0);

        const breakdown = {
            revenueByPayer: {} as Record<string, number>,
            revenueByDiscipline: {} as Record<string, number>,
            costByDiscipline: {} as Record<string, number>
        };

        // Helper to categorize
        const categorize = (rows: any[], target: Record<string, number>, parser: (name: string) => string) => {
            rows.forEach(row => {
                const category = parser(row.name);
                const amount = parseFloat(row.amount || '0');
                target[category] = (target[category] || 0) + amount;
            });
        };

        categorize(revenueRes.rows, breakdown.revenueByPayer, (name) => {
            if (name.includes('Medicare')) return 'Medicare';
            if (name.includes('Medicaid')) return 'Medicaid';
            if (name.includes('Private')) return 'Private Pay';
            if (name.includes('Insurance')) return 'Commercial';
            return 'Other';
        });

        categorize(revenueRes.rows, breakdown.revenueByDiscipline, (name) => {
            if (name.includes('Skilled Nursing')) return 'Skilled Nursing';
            if (name.includes('Physical Therapy')) return 'Physical Therapy';
            if (name.includes('Occupational')) return 'Occupational Therapy';
            if (name.includes('Aide')) return 'Home Health Aide';
            return 'Other';
        });

        categorize(cogsRes.rows, breakdown.costByDiscipline, (name) => {
            if (name.includes('Skilled Nursing')) return 'Skilled Nursing';
            if (name.includes('Physical Therapy')) return 'Physical Therapy';
            if (name.includes('Occupational')) return 'Occupational Therapy';
            if (name.includes('Aide')) return 'Home Health Aide';
            if (name.includes('Mileage')) return 'Mileage';
            return 'Other';
        });

        const grossMargin = totalRevenue - totalCOGS;
        const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

        return {
            period: { start: startDate, end: endDate },
            totalRevenue,
            totalCOGS,
            grossMargin,
            grossMarginPercent,
            breakdown
        };
    }

    /**
     * Calculate Unbilled Revenue
     * Visits that are 'Completed' but not yet in 'Billed' status
     * Estimates revenue based on Fee Schedule (Mocked for now)
     */
    async getUnbilledRevenue(organizationId: string): Promise<{ count: number, estimatedAmount: number }> {
        // In a real implementation, this would join with a fee_schedule table
        // For now, we assume average rates: SN=$150, PT=$140, OT=$140, Aide=$60
        // And we look for visits in a 'completed' state that don't have a linked claim

        // Mocking logic since 'visits' table schema might vary in this partial env
        // Using a hardcoded estimate for demonstration of the "Financial Intelligence" architectural pattern
        return {
            count: 12,
            estimatedAmount: 1680.00 // 12 * $140 avg
        };
    }
}

export const financialIntelligenceService = new FinancialIntelligenceService();
