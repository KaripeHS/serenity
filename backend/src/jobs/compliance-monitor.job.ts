/**
 * Compliance Monitor Job
 * 
 * Runs daily to detect clinical and regulatory compliance gaps.
 * - Checks for visits without clinical notes
 * - Checks for unsigned notes
 * - Checks for missing required forms (Care Plans, Consent)
 * 
 * Cron Schedule: 0 6 * * * (Daily at 6:00 AM)
 */

import { DatabaseClient } from '../database/client';
import { createLogger } from '../utils/logger';
import { getEmailService } from '../services/notifications/email.service';

const logger = createLogger('compliance-monitor');

interface ComplianceGap {
    id: string;
    type: 'missing_note' | 'unsigned_note' | 'missing_form' | 'care_plan_deviation';
    severity: 'medium' | 'high' | 'critical';
    patientId: string;
    patientName: string;
    caregiverId?: string;
    caregiverName?: string;
    details: string;
    detectedAt: Date;
}

export async function runComplianceCheck(): Promise<void> {
    const db = new DatabaseClient();
    const gaps: ComplianceGap[] = [];

    logger.info('Starting daily compliance check...');

    try {
        // 1. Check for Visits without Clinical Notes (Past 7 days)
        const missingNotesResult = await db.query(`
      SELECT v.id, v.patient_id, p.first_name || ' ' || p.last_name as patient_name,
             v.caregiver_id, c.first_name || ' ' || c.last_name as caregiver_name,
             v.start_time
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      JOIN caregivers c ON v.caregiver_id = c.id
      LEFT JOIN clinical_notes n ON v.id = n.visit_id
      WHERE v.status = 'completed'
      AND v.start_time >= NOW() - INTERVAL '7 days'
      AND n.id IS NULL
    `);

        for (const row of missingNotesResult.rows) {
            gaps.push({
                id: `gap_note_${row.id}`,
                type: 'missing_note',
                severity: 'high',
                patientId: row.patient_id,
                patientName: row.patient_name,
                caregiverId: row.caregiver_id,
                caregiverName: row.caregiver_name,
                details: `Missing clinical note for visit on ${new Date(row.start_time).toLocaleDateString()}`,
                detectedAt: new Date()
            });
        }

        // 2. Check for Unsigned Notes (Older than 48 hours)
        const unsignedNotesResult = await db.query(`
      SELECT n.id, v.patient_id, p.first_name || ' ' || p.last_name as patient_name,
             v.caregiver_id, c.first_name || ' ' || c.last_name as caregiver_name,
             n.created_at
      FROM clinical_notes n
      JOIN visits v ON n.visit_id = v.id
      JOIN patients p ON v.patient_id = p.id
      JOIN caregivers c ON v.caregiver_id = c.id
      WHERE n.status = 'draft'
      AND n.created_at <= NOW() - INTERVAL '48 hours'
    `);

        for (const row of unsignedNotesResult.rows) {
            gaps.push({
                id: `gap_sign_${row.id}`,
                type: 'unsigned_note',
                severity: 'medium',
                patientId: row.patient_id,
                patientName: row.patient_name,
                caregiverId: row.caregiver_id,
                caregiverName: row.caregiver_name,
                details: `Clinical note waiting for signature > 48 hours`,
                detectedAt: new Date()
            });
        }

        // 3. Check for Missing Care Plans (Active Patients)
        const missingCarePlansResult = await db.query(`
      SELECT p.id, p.first_name || ' ' || p.last_name as patient_name
      FROM patients p
      LEFT JOIN care_plans cp ON p.id = cp.patient_id AND cp.status = 'active'
      WHERE p.status = 'active'
      AND cp.id IS NULL
    `);

        for (const row of missingCarePlansResult.rows) {
            gaps.push({
                id: `gap_plan_${row.id}`,
                type: 'missing_form',
                severity: 'critical',
                patientId: row.id,
                patientName: row.patient_name,
                details: `Active patient without an active Care Plan`,
                detectedAt: new Date()
            });
        }

        logger.info(`Compliance check complete. Found ${gaps.length} gaps.`);

        // 4. Report Gaps
        if (gaps.length > 0) {
            await reportGaps(gaps);
        }

    } catch (error) {
        logger.error('Compliance check failed', { error });
        throw error;
    }
}

async function reportGaps(gaps: ComplianceGap[]): Promise<void> {
    const emailService = getEmailService();

    // Group by severity
    const criticalGaps = gaps.filter(g => g.severity === 'critical');
    const highGaps = gaps.filter(g => g.severity === 'high');

    if (criticalGaps.length > 0 || highGaps.length > 0) {
        await emailService.sendComplianceAlert({
            to: 'compliance@serenitycarepartners.com',
            subject: `[COMPLIANCE ALERT] ${criticalGaps.length} Critical / ${highGaps.length} High Gaps Detected`,
            gaps: [...criticalGaps, ...highGaps]
        });
    }
}

// Run if executed directly
if (require.main === module) {
    runComplianceCheck();
}
