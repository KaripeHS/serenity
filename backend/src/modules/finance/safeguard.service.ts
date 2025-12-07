/**
 * Financial Safeguard Service
 * Protects the agency from automated overspending and suspicious payouts.
 * Implements "Circuit Breakers" and "Budget Caps".
 *
 * @module modules/finance/safeguard.service
 */

import { DatabaseClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { EmailService } from '../../services/notifications/email.service';

const logger = createLogger('financial-safeguard');

export interface BudgetConfig {
    monthlyBonusCap: number; // Max total bonuses per month (e.g., $5000)
    maxSingleBonus: number;  // Max single bonus amount (e.g., $200)
    maxOvertimeHours: number; // Max overtime hours per week per caregiver
}

export interface SafetyCheckResult {
    approved: boolean;
    reason?: string;
    requiresAdminApproval?: boolean;
}

export class FinancialSafeguardService {
    private db: DatabaseClient;
    private emailService: EmailService;

    // Default configuration (should be loaded from DB/Env in production)
    private config: BudgetConfig = {
        monthlyBonusCap: 5000,
        maxSingleBonus: 200,
        maxOvertimeHours: 10 // Alert if > 10 hours OT
    };

    constructor(db: DatabaseClient, emailService: EmailService) {
        this.db = db;
        this.emailService = emailService;
    }

    /**
     * Check if a proposed bonus payout is safe to process
     */
    async validateBonusPayout(amount: number, caregiverId: string, organizationId: string): Promise<SafetyCheckResult> {
        try {
            // 1. Circuit Breaker: Single Transaction Limit
            if (amount > this.config.maxSingleBonus) {
                await this.triggerAlert('CIRCUIT_BREAKER', `Bonus of $${amount} exceeds single limit of $${this.config.maxSingleBonus}`, organizationId);
                return {
                    approved: false,
                    reason: `Amount $${amount} exceeds maximum single bonus limit`,
                    requiresAdminApproval: true
                };
            }

            // 2. Budget Cap: Monthly Total Limit
            const currentMonthTotal = await this.getCurrentMonthBonusTotal(organizationId);
            if (currentMonthTotal + amount > this.config.monthlyBonusCap) {
                await this.triggerAlert('BUDGET_CAP', `Monthly bonus cap hit. Current: $${currentMonthTotal}, Proposed: $${amount}`, organizationId);
                return {
                    approved: false,
                    reason: 'Monthly bonus budget exceeded',
                    requiresAdminApproval: true
                };
            }

            // 3. Frequency Check: Duplicate Payout Prevention
            const hasRecentPayout = await this.checkRecentPayout(caregiverId);
            if (hasRecentPayout) {
                return {
                    approved: false,
                    reason: 'Duplicate payout detected for this caregiver today',
                    requiresAdminApproval: true
                };
            }

            return { approved: true };

        } catch (error) {
            logger.error('Error validating bonus payout', { error, caregiverId, amount });
            // Fail safe: Block payment if check fails
            return { approved: false, reason: 'System error during safety check' };
        }
    }

    /**
     * Record a successful payout to update tracking
     */
    async recordPayout(amount: number, caregiverId: string, type: 'bonus' | 'overtime', organizationId: string): Promise<void> {
        await this.db.query(`
      INSERT INTO financial_transactions (
        organization_id, caregiver_id, amount, type, status, created_at
      ) VALUES ($1, $2, $3, $4, 'processed', NOW())
    `, [organizationId, caregiverId, amount, type]);
    }

    private async getCurrentMonthBonusTotal(organizationId: string): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const result = await this.db.query(`
      SELECT SUM(amount) as total
      FROM financial_transactions
      WHERE organization_id = $1 
      AND type = 'bonus'
      AND created_at >= $2
    `, [organizationId, startOfMonth]);

        return parseFloat(result.rows[0].total || '0');
    }

    private async checkRecentPayout(caregiverId: string): Promise<boolean> {
        // Check for any payout in the last 24 hours
        const result = await this.db.query(`
      SELECT id FROM financial_transactions
      WHERE caregiver_id = $1
      AND created_at > NOW() - INTERVAL '24 hours'
    `, [caregiverId]);

        return result.rows.length > 0;
    }

    private async triggerAlert(type: string, message: string, organizationId: string): Promise<void> {
        logger.warn(`FINANCIAL ALERT: ${type} - ${message}`);

        // Send email to admin
        await this.emailService.sendEmail({
            to: 'admin@serenitycare.com', // In prod, fetch org admin email
            subject: `URGENT: Financial Safeguard Triggered - ${type}`,
            html: `
        <h1>Financial Safeguard Alert</h1>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Action Required:</strong> Please review pending payments in the console.</p>
      `,
            text: `Financial Safeguard Alert\nType: ${type}\nMessage: ${message}\nAction Required: Please review pending payments in the console.`
        });
    }
}
