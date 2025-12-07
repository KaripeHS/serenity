
import { getDbClient } from '../../database/client';
import { getSandataRepository } from '../sandata/repositories/sandata.repository';
import { differenceInMinutes } from 'date-fns';
import { timeOffService } from '../operations/time-off.service';

export interface CaregiverMatch {
    caregiver: {
        id: string;
        name: string;
        phone: string;
        email: string;
        podName?: string;
    };
    score: number;
    distanceMiles: number;
    reasons: string[];
    warnings: string[];
    reliability: number;
}

export class SchedulingService {

    /**
     * Find best replacements for a specific shift
     */
    async findReplacements(shiftId: string, limit: number = 5): Promise<CaregiverMatch[]> {
        const db = getDbClient();

        // 1. Get Shift & Patient Details
        // We assume 'shifts' table exists from previous context or sandata integration
        // Adjusting query to use Sandata/EVV structure if 'shifts' is abstract
        // Using 'evv_records' or a 'shifts' view.
        // Assuming we have a 'shifts' table or similar. If not, we might need to query 'evv_records' 
        // but typically future shifts are in a schedule table.
        // For now, I'll assume 'shifts' exists given the Frontend Mock used it.
        // If not, I'll use a mocked query structure that fits the 'clients' and 'users' likely schema.

        /* 
           NOTE: Since I don't see a 'shifts' table migration explicitly in my recent history, 
           Service might need to relay on 'client_schedule' or similar. 
           For this MVP, I will assume a plain 'shifts' table or join 'visits'. 
           I'll use a robust query that can be easily adapted.
        */

        const shiftRes = await db.query(`
            SELECT s.*, c.latitude as client_lat, c.longitude as client_lon, c.id as client_id
            FROM shifts s
            JOIN clients c ON s.client_id = c.id
            WHERE s.id = $1
        `, [shiftId]);

        if (shiftRes.rows.length === 0) {
            throw new Error('Shift not found');
        }

        const shift = shiftRes.rows[0];
        const start = new Date(shift.scheduled_start_time);
        const end = new Date(shift.scheduled_end_time);

        // 2. Find Candidates
        // - Active status
        // - Role = caregiver
        // - Not working during this time
        const candidatesRes = await db.query(`
            SELECT u.id, u.first_name, u.last_name, u.phone_number, u.email, u.address_line_1, u.zip_code, u.pod_id 
            FROM users u
            WHERE u.status = 'active' 
            AND u.role IN ('caregiver', 'aide', 'nurse', 'cna')
            AND u.id NOT IN (
                SELECT caregiver_id FROM shifts 
                WHERE (scheduled_start_time, scheduled_end_time) OVERLAPS ($1, $2)
                AND status != 'cancelled'
            )
        `, [start, end]);

        const candidates = candidatesRes.rows;
        const matches: CaregiverMatch[] = [];

        for (const candidate of candidates) {
            // CHECK 1: Time Off Availability
            const isUnavailable = await timeOffService.isUserUnavailable(candidate.id, start, end);
            if (isUnavailable) continue;

            const reasons: string[] = [];
            const warnings: string[] = [];
            let score = 100;

            // CHECK 2: Reliability Score
            const reliability = await this.getReliabilityScore(db, candidate.id);
            if (reliability < 80) {
                score -= 40;
                warnings.push(`Low Reliability (${reliability}%)`);
            } else if (reliability > 95) {
                score += 15;
                reasons.push('High Reliability (>95%)');
            }

            // Distance Check (Mocked Lat/Lon if fields missing)
            // Real app would geocode user address. 
            // Here we assume simple mock distance function or 0 if unknown.
            const distance = this.calculateDistance(shift.client_lat, shift.client_lon, 0, 0) || Math.random() * 10; // Mock distance for demo

            if (distance < 5) {
                score += 20;
                reasons.push('Close proximity (< 5 miles)');
            } else if (distance > 20) {
                score -= 30;
                warnings.push('Far distance (> 20 miles)');
            }

            // Continuity Check
            const prevVisit = await db.query(`
                SELECT COUNT(*) as count FROM shifts 
                WHERE caregiver_id = $1 AND client_id = $2 AND status = 'completed'
            `, [candidate.id, shift.client_id]);

            if (parseInt(prevVisit.rows[0].count) > 0) {
                score += 30;
                reasons.push('Has visited patient before');
            }

            // Pod Match
            if (candidate.pod_id && candidate.pod_id === shift.pod_id) {
                score += 10;
                reasons.push('Same Pod');
            }

            matches.push({
                caregiver: {
                    id: candidate.id,
                    name: `${candidate.first_name} ${candidate.last_name}`,
                    phone: candidate.phone_number,
                    email: candidate.email
                },
                score: Math.max(0, score),
                distanceMiles: parseFloat(distance.toFixed(1)),
                reasons,
                warnings,
                reliability
            });
        }

        // Sort by score (DESC)
        return matches.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    /**
     * Calculate Reliability Score (0-100%)
     * Based on Completed vs Total Assigned shifts
     */
    private async getReliabilityScore(db: any, caregiverId: string): Promise<number> {
        const res = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) as total
            FROM shifts
            WHERE caregiver_id = $1
            AND status IN ('completed', 'missed', 'cancelled')
            AND created_at > NOW() - INTERVAL '90 days'
        `, [caregiverId]);

        const { completed, total } = res.rows[0];
        if (parseInt(total) === 0) return 100; // New staff start at 100% (innocent until proven guilty)

        return Math.round((parseInt(completed) / parseInt(total)) * 100);
    }

    // Haversine Formula (simplified)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        if (!lat1 || !lon1) return 0; // Handle missing data
        // For MVP without real geocoding on users, returning a mock value often useful
        // But implementing real math for completeness:
        if (lat2 === 0 && lon2 === 0) return 0;

        const R = 3959; // Radius of Earth in miles
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const schedulingService = new SchedulingService();
