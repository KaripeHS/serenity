/**
 * Bonus Service
 * Implements the official Serenity Caregiver Bonus Policy.
 * 
 * Components:
 * 1. 90-Day Bonus ($150)
 * 2. Show Up Bonus ($100/quarter)
 * 3. Hours Bonus (1% of annual wages)
 * 4. Loyalty Bonus ($200-$500 on anniversary)
 *
 * @module modules/hr/bonus.service
 */

import { DatabaseClient } from '../../database/client';
import { createLogger } from '../../utils/logger';
import { FinancialSafeguardService } from '../finance/safeguard.service';
import { EmailService } from '../../services/notifications/email.service';

const logger = createLogger('bonus-service');

export interface BonusEligibility {
    caregiverId: string;
    bonusType: '90_day' | 'show_up' | 'hours' | 'loyalty';
    amount: number;
    period: string; // e.g., '2025-Q1', '2025-ANNUAL', 'HIRE-90'
    isEligible: boolean;
    reasons: string[];
}

export class BonusService {
    private db: DatabaseClient;
    private safeguardService: FinancialSafeguardService;

    constructor(db: DatabaseClient, safeguardService: FinancialSafeguardService) {
        this.db = db;
        this.safeguardService = safeguardService;
    }

    /**
     * Check and process all eligible bonuses for a caregiver
     * Should be run daily or weekly via cron
     */
    async processAllBonuses(caregiverId: string, organizationId: string): Promise<void> {
        await this.process90DayBonus(caregiverId, organizationId);
        await this.processShowUpBonus(caregiverId, organizationId);
        await this.processLoyaltyBonus(caregiverId, organizationId);
        // Hours bonus is typically run manually or on specific dates (June/Dec)
    }

    /**
     * 1. 90-Day Bonus ($150)
     * Eligibility: Employed 90 days, good standing.
     */
    async process90DayBonus(caregiverId: string, organizationId: string): Promise<void> {
        const caregiver = await this.getCaregiver(caregiverId);
        if (!caregiver.hire_date) return;

        const hireDate = new Date(caregiver.hire_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if exactly 90 days (or within window) and not already paid
        if (diffDays >= 90 && diffDays < 97) { // Weekly window
            const alreadyPaid = await this.checkBonusHistory(caregiverId, '90_day', 'HIRE-90');
            if (alreadyPaid) return;

            // Check standing
            if (caregiver.status !== 'active') return;

            // Check performance metrics for the first 90 days
            const ninetyDayDate = new Date(hireDate);
            ninetyDayDate.setDate(ninetyDayDate.getDate() + 90);

            const metrics = await this.getPerformanceMetrics(caregiverId, hireDate, ninetyDayDate);

            const isEligible =
                metrics.attendanceRate >= 95.00 &&
                metrics.evvRate >= 95.00 &&
                metrics.noCallNoShows === 0 &&
                metrics.complaints === 0;

            if (isEligible) {
                await this.payoutBonus(caregiverId, 150, '90_day', 'HIRE-90', organizationId);
            } else {
                logger.info(`Caregiver ${caregiverId} ineligible for 90-day bonus due to metrics`, metrics);
            }
        }
    }

    /**
     * 2. Show Up Bonus ($100/quarter)
     * Eligibility: 95% Attendance, 95% EVV, 0 NCNS, 0 Complaints
     */
    async processShowUpBonus(caregiverId: string, organizationId: string): Promise<void> {
        const today = new Date();
        // Only run on first few days of new quarter (Jan, Apr, Jul, Oct)
        const currentMonth = today.getMonth(); // 0-11
        if (![0, 3, 6, 9].includes(currentMonth) || today.getDate() > 7) return;

        // Determine previous quarter
        const quarterMap = { 0: 'Q4', 3: 'Q1', 6: 'Q2', 9: 'Q3' };
        const year = currentMonth === 0 ? today.getFullYear() - 1 : today.getFullYear();
        const quarter = quarterMap[currentMonth as keyof typeof quarterMap];
        const periodId = `${year}-${quarter}`;

        const alreadyPaid = await this.checkBonusHistory(caregiverId, 'show_up', periodId);
        if (alreadyPaid) return;

        // Calculate metrics for previous quarter
        const startDate = new Date(year, (parseInt(quarter.replace('Q', '')) - 1) * 3, 1);
        const endDate = new Date(year, (parseInt(quarter.replace('Q', '')) * 3), 0);

        const metrics = await this.getPerformanceMetrics(caregiverId, startDate, endDate);

        const isEligible =
            metrics.attendanceRate >= 95.00 &&
            metrics.evvRate >= 95.00 &&
            metrics.noCallNoShows === 0 &&
            metrics.complaints === 0;

        if (isEligible) {
            await this.payoutBonus(caregiverId, 100, 'show_up', periodId, organizationId);
        }
    }

    /**
     * 3. Hours Bonus (1% of Gross Wages)
     * Paid in June (50%) and December (50%)
     */
    async calculateHoursBonus(caregiverId: string, year: number): Promise<number> {
        // Get total hours worked in previous calendar year
        const result = await this.db.query(`
      SELECT SUM(units_provided) as total_hours
      FROM claims
      WHERE caregiver_id = $1
      AND EXTRACT(YEAR FROM service_date) = $2
      AND status = 'paid'
    `, [caregiverId, year]);

        const totalHours = parseFloat(result.rows[0].total_hours || '0');
        const caregiver = await this.getCaregiver(caregiverId);
        const hourlyRate = parseFloat(caregiver.pay_rate || '0');

        // Formula: Hours * Rate * 1%
        return totalHours * hourlyRate * 0.01;
    }

    /**
     * 4. Loyalty Bonus ($200-$500)
     * Paid on anniversary
     */
    async processLoyaltyBonus(caregiverId: string, organizationId: string): Promise<void> {
        const caregiver = await this.getCaregiver(caregiverId);
        if (!caregiver.hire_date) return;

        const hireDate = new Date(caregiver.hire_date);
        const today = new Date();

        // Check if today is anniversary (ignoring year)
        if (hireDate.getMonth() === today.getMonth() && hireDate.getDate() === today.getDate()) {
            const yearsOfService = today.getFullYear() - hireDate.getFullYear();
            if (yearsOfService < 1) return;

            const periodId = `ANNIVERSARY-${yearsOfService}`;
            const alreadyPaid = await this.checkBonusHistory(caregiverId, 'loyalty', periodId);
            if (alreadyPaid) return;

            // Determine amount
            let amount = 0;
            if (yearsOfService === 1) amount = 200;
            else if (yearsOfService === 2) amount = 300;
            else if (yearsOfService >= 3 && yearsOfService <= 4) amount = 400;
            else if (yearsOfService >= 5) amount = 500;

            if (amount > 0) {
                await this.payoutBonus(caregiverId, amount, 'loyalty', periodId, organizationId);
            }
        }
    }

    // --- Helpers ---

    private async payoutBonus(caregiverId: string, amount: number, type: string, period: string, organizationId: string): Promise<void> {
        // 1. Financial Safeguard Check
        const safetyCheck = await this.safeguardService.validateBonusPayout(amount, caregiverId, organizationId);
        if (!safetyCheck.approved) {
            logger.warn(`Bonus blocked by safeguard: ${safetyCheck.reason}`, { caregiverId, type, amount });
            return;
        }

        // 2. Record Transaction
        await this.safeguardService.recordPayout(amount, caregiverId, 'bonus', organizationId);

        // 3. Log History
        await this.db.query(`
      INSERT INTO bonus_history (caregiver_id, bonus_type, amount, period, paid_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [caregiverId, type, amount, period]);

        logger.info(`Paid ${type} bonus of $${amount} to ${caregiverId}`);
    }

    private async checkBonusHistory(caregiverId: string, type: string, period: string): Promise<boolean> {
        const result = await this.db.query(`
      SELECT id FROM bonus_history 
      WHERE caregiver_id = $1 AND bonus_type = $2 AND period = $3
    `, [caregiverId, type, period]);
        return result.rows.length > 0;
    }

    private async getCaregiver(caregiverId: string): Promise<any> {
        const result = await this.db.query('SELECT * FROM users WHERE id = $1', [caregiverId]);
        return result.rows[0];
    }

    private async getPerformanceMetrics(caregiverId: string, startDate: Date, endDate: Date): Promise<any> {
        // Query real performance data
        // Note: This assumes tables 'shifts', 'evv_records', and 'complaints' exist and are populated
        // If not, this will need to be adjusted to match the actual schema

        const result = await this.db.query(`
            SELECT
                COUNT(*) as total_shifts,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_shifts,
                COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_shows,
                COUNT(CASE WHEN status = 'cancelled' AND cancelled_by = 'caregiver' AND notice_hours < 24 THEN 1 END) as late_cancellations
            FROM shifts
            WHERE caregiver_id = $1
            AND scheduled_start BETWEEN $2 AND $3
        `, [caregiverId, startDate, endDate]);

        const shiftData = result.rows[0] || { total_shifts: 0, completed_shifts: 0, no_shows: 0, late_cancellations: 0 };
        const totalShifts = parseInt(shiftData.total_shifts);
        const completedShifts = parseInt(shiftData.completed_shifts);
        const noShows = parseInt(shiftData.no_shows);
        const lateCancellations = parseInt(shiftData.late_cancellations);

        // Attendance Rate: (Completed) / (Total - Client Cancellations)
        // Simplified here: (Total - NoShows - LateCancels) / Total
        const attendanceRate = totalShifts > 0
            ? ((totalShifts - noShows - lateCancellations) / totalShifts) * 100
            : 100;

        // EVV Rate
        const evvResult = await this.db.query(`
            SELECT
                COUNT(*) as total_visits,
                COUNT(CASE WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL THEN 1 END) as valid_evv
            FROM evv_records
            WHERE caregiver_id = $1
            AND created_at BETWEEN $2 AND $3
        `, [caregiverId, startDate, endDate]);

        const evvData = evvResult.rows[0] || { total_visits: 0, valid_evv: 0 };
        const evvRate = parseInt(evvData.total_visits) > 0
            ? (parseInt(evvData.valid_evv) / parseInt(evvData.total_visits)) * 100
            : 100;

        // Complaints
        const complaintResult = await this.db.query(`
            SELECT COUNT(*) as count
            FROM family_feedback
            WHERE caregiver_id = $1
            AND created_at BETWEEN $2 AND $3
            AND feedback_type = 'complaint'
        `, [caregiverId, startDate, endDate]);

        const complaints = parseInt(complaintResult.rows[0]?.count || '0');

        return {
            attendanceRate,
            evvRate,
            noCallNoShows: noShows,
            complaints
        };
    }
}
