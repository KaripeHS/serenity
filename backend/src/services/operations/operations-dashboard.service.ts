
import { getDbClient } from '../../database/client';

export interface LiveShiftStatus {
    shiftId: string;
    caregiverName: string;
    clientName: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    status: string; // 'scheduled', 'in_progress', etc.
    commuterStatus: string; // 'en_route', 'arrived', etc.
    lastPing?: {
        lat: number;
        lon: number;
        timestamp: Date;
        accuracy: number;
    };
    geofenceStatus: 'green' | 'yellow' | 'red' | 'gray';
    clientLocation: {
        lat: number;
        lon: number;
    };
}

export class OperationsDashboardService {

    /**
     * Get live view of all 'Active' shifts (Today)
     */
    async getLiveStatus(organizationId: string): Promise<LiveShiftStatus[]> {
        const db = getDbClient();

        // 1. Get today's shifts (including future ones for today)
        const today = new Date().toISOString().split('T')[0];

        const shiftsRes = await db.query(`
            SELECT 
                s.id as shift_id, s.scheduled_start_time, s.scheduled_end_time, s.status, s.commuter_status,
                u.first_name as cg_first, u.last_name as cg_last,
                c.first_name as cl_first, c.last_name as cl_last, c.latitude as cl_lat, c.longitude as cl_lon,
                (
                    SELECT json_build_object('lat', latitude, 'lon', longitude, 'timestamp', logged_at, 'accuracy', accuracy_meters)
                    FROM shift_tracking_logs 
                    WHERE shift_id = s.id 
                    ORDER BY logged_at DESC LIMIT 1
                ) as last_ping
            FROM shifts s
            JOIN users u ON s.caregiver_id = u.id
            JOIN clients c ON s.client_id = c.id
            WHERE s.organization_id = $1
            AND DATE(s.scheduled_start_time) = $2
            ORDER BY s.scheduled_start_time ASC
        `, [organizationId, today]);

        // 2. Process and calculate Geofence status
        return shiftsRes.rows.map(row => {
            let geofenceStatus: 'green' | 'yellow' | 'red' | 'gray' = 'gray';
            const lastPing = row.last_ping;

            if (row.status === 'in_progress') {
                if (!lastPing) {
                    geofenceStatus = 'red'; // Clocked in but no GPS? Suspicious or Old App
                } else {
                    const distance = this.calculateDistance(
                        lastPing.lat, lastPing.lon,
                        row.cl_lat, row.cl_lon
                    );

                    if (distance <= 0.2) geofenceStatus = 'green'; // < 0.2 miles (On Site)
                    else if (distance <= 1.0) geofenceStatus = 'yellow'; // < 1 mile (Maybe bad GPS or parking)
                    else geofenceStatus = 'red'; // > 1 mile (Definitely off site)
                }
            } else if (row.status === 'scheduled') {
                if (row.commuter_status === 'en_route') {
                    geofenceStatus = 'yellow';
                }
                // Check if LATE
                const now = new Date();
                const start = new Date(row.scheduled_start_time);
                if (now > start && row.commuter_status !== 'arrived') {
                    geofenceStatus = 'red'; // Late Start
                }
            }

            return {
                shiftId: row.shift_id,
                caregiverName: `${row.cg_first} ${row.cg_last}`,
                clientName: `${row.cl_first} ${row.cl_last}`,
                scheduledStart: row.scheduled_start_time,
                scheduledEnd: row.scheduled_end_time,
                status: row.status,
                commuterStatus: row.commuter_status,
                lastPing: lastPing ? {
                    lat: lastPing.lat,
                    lon: lastPing.lon,
                    timestamp: new Date(lastPing.timestamp),
                    accuracy: lastPing.accuracy
                } : undefined,
                geofenceStatus,
                clientLocation: {
                    lat: row.cl_lat,
                    lon: row.cl_lon
                }
            };
        });
    }

    // Reuse Haversine Helper
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 999;

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

export const operationsDashboardService = new OperationsDashboardService();
