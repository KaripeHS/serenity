/**
 * Operations Service
 * Handles business logic for Operations Command Center endpoints
 *
 * Endpoints:
 * - GET /api/operations/overview
 * - GET /api/operations/schedule
 * - GET /api/operations/gps
 * - GET /api/operations/mileage
 */

import { getDbClient } from '../database/client';
import { format, startOfDay, endOfDay } from 'date-fns';

const db = getDbClient();

export class OperationsService {
  /**
   * Get operations overview for a specific date
   * Endpoint: GET /api/operations/overview
   */
  async getOverview(organizationId: string, date: Date = new Date()) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const [
      todayStats,
      scheduleIssues,
      caregiverStatus,
      performanceMetrics
    ] = await Promise.all([
      this.getTodayStats(organizationId, startDate, endDate),
      this.getScheduleIssues(organizationId, startDate, endDate),
      this.getCaregiverStatus(organizationId, startDate, endDate),
      this.getPerformanceMetrics(organizationId)
    ]);

    return {
      todayStats,
      scheduleIssues,
      caregiverStatus,
      performanceMetrics
    };
  }

  /**
   * Get today's visit statistics
   */
  private async getTodayStats(organizationId: string, startDate: Date, endDate: Date) {
    const query = `
      WITH visit_stats AS (
        SELECT
          COUNT(*) as total_visits,
          COUNT(*) FILTER (WHERE v.status = 'completed') as completed_visits,
          COUNT(*) FILTER (WHERE v.status = 'in_progress') as in_progress_visits,
          COUNT(*) FILTER (WHERE v.status = 'missed') as missed_visits,
          COUNT(*) FILTER (
            WHERE vci.actual_check_in IS NOT NULL
              AND vci.actual_check_in <= v.scheduled_start + INTERVAL '15 minutes'
          ) as on_time_visits,
          COUNT(*) FILTER (
            WHERE vci.actual_check_in IS NOT NULL
              AND vci.actual_check_in > v.scheduled_start + INTERVAL '15 minutes'
          ) as late_checkins
        FROM visits v
        LEFT JOIN visit_check_ins vci ON v.id = vci.visit_id
        WHERE v.organization_id = $1
          AND v.scheduled_start >= $2
          AND v.scheduled_start <= $3
      ),
      geofence_stats AS (
        SELECT COUNT(*) as geofence_violations
        FROM geofence_violations
        WHERE organization_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
          AND status = 'pending_review'
      )
      SELECT
        vs.total_visits,
        vs.completed_visits,
        vs.in_progress_visits,
        vs.missed_visits,
        vs.on_time_visits,
        vs.late_checkins,
        CASE
          WHEN vs.total_visits > 0 THEN ROUND((vs.on_time_visits::DECIMAL / vs.total_visits) * 100, 1)
          ELSE 100
        END as on_time_rate,
        gs.geofence_violations
      FROM visit_stats vs, geofence_stats gs
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const row = result.rows[0];

    return {
      totalVisits: parseInt(row.total_visits),
      completedVisits: parseInt(row.completed_visits),
      inProgressVisits: parseInt(row.in_progress_visits),
      missedVisits: parseInt(row.missed_visits),
      onTimeRate: parseFloat(row.on_time_rate),
      lateCheckIns: parseInt(row.late_checkins),
      geofenceViolations: parseInt(row.geofence_violations)
    };
  }

  /**
   * Get schedule issues requiring attention
   */
  private async getScheduleIssues(organizationId: string, startDate: Date, endDate: Date) {
    const issues = [];

    // Unassigned visits
    const unassignedQuery = `
      SELECT
        v.id as visit_id,
        c.name as client_name,
        v.scheduled_start,
        'No caregiver assigned' as issue
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      WHERE v.organization_id = $1
        AND v.scheduled_start >= $2
        AND v.scheduled_start <= $3
        AND v.caregiver_id IS NULL
        AND v.status NOT IN ('cancelled', 'completed')
      ORDER BY v.scheduled_start
      LIMIT 20
    `;

    const unassignedResult = await db.query(unassignedQuery, [organizationId, startDate, endDate]);

    if (unassignedResult.rows.length > 0) {
      issues.push({
        type: 'unassigned',
        count: unassignedResult.rows.length,
        visits: unassignedResult.rows.map(row => ({
          visitId: row.visit_id,
          clientName: row.client_name,
          scheduledTime: row.scheduled_start,
          issue: row.issue,
          action: {
            label: 'Assign Caregiver',
            route: `/operations/schedule/${row.visit_id}`
          }
        }))
      });
    }

    // Double-booked caregivers
    const doubleBookedQuery = `
      WITH overlapping_visits AS (
        SELECT
          v1.caregiver_id,
          u.name as caregiver_name,
          v1.id as visit1_id,
          v2.id as visit2_id,
          v1.scheduled_start as visit1_start,
          v2.scheduled_start as visit2_start,
          c1.name as client1_name,
          c2.name as client2_name
        FROM visits v1
        JOIN visits v2 ON v1.caregiver_id = v2.caregiver_id
          AND v1.id < v2.id
          AND v1.scheduled_start < v2.scheduled_end
          AND v1.scheduled_end > v2.scheduled_start
        JOIN users u ON v1.caregiver_id = u.id
        JOIN clients c1 ON v1.client_id = c1.id
        JOIN clients c2 ON v2.client_id = c2.id
        WHERE v1.organization_id = $1
          AND v1.scheduled_start >= $2
          AND v1.scheduled_start <= $3
          AND v1.status NOT IN ('cancelled', 'completed')
          AND v2.status NOT IN ('cancelled', 'completed')
        LIMIT 10
      )
      SELECT * FROM overlapping_visits
    `;

    const doubleBookedResult = await db.query(doubleBookedQuery, [organizationId, startDate, endDate]);

    if (doubleBookedResult.rows.length > 0) {
      issues.push({
        type: 'double_booked',
        count: doubleBookedResult.rows.length,
        visits: doubleBookedResult.rows.map(row => ({
          visitId: row.visit1_id,
          clientName: `${row.client1_name} & ${row.client2_name}`,
          scheduledTime: row.visit1_start,
          issue: `${row.caregiver_name} double-booked`,
          action: {
            label: 'Resolve Conflict',
            route: `/operations/schedule/${row.visit1_id}`
          }
        }))
      });
    }

    // Visits exceeding max hours
    const maxHoursQuery = `
      WITH caregiver_hours AS (
        SELECT
          u.id as caregiver_id,
          u.name as caregiver_name,
          COALESCE(u.max_hours_per_week, 40) as max_hours,
          SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) as scheduled_hours
        FROM users u
        JOIN visits v ON v.caregiver_id = u.id
        WHERE u.organization_id = $1
          AND v.scheduled_start >= DATE_TRUNC('week', $2::DATE)
          AND v.scheduled_start < DATE_TRUNC('week', $2::DATE) + INTERVAL '1 week'
          AND v.status NOT IN ('cancelled')
        GROUP BY u.id, u.name, u.max_hours_per_week
        HAVING SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) > COALESCE(u.max_hours_per_week, 40)
      )
      SELECT * FROM caregiver_hours
      LIMIT 10
    `;

    const maxHoursResult = await db.query(maxHoursQuery, [organizationId, startDate]);

    if (maxHoursResult.rows.length > 0) {
      issues.push({
        type: 'exceeds_max_hours',
        count: maxHoursResult.rows.length,
        visits: maxHoursResult.rows.map(row => ({
          visitId: null,
          clientName: row.caregiver_name,
          scheduledTime: null,
          issue: `Scheduled ${parseFloat(row.scheduled_hours).toFixed(1)}h (max: ${row.max_hours}h)`,
          action: {
            label: 'Adjust Schedule',
            route: `/operations/schedule?caregiver=${row.caregiver_id}`
          }
        }))
      });
    }

    return issues;
  }

  /**
   * Get caregiver status for today
   */
  private async getCaregiverStatus(organizationId: string, startDate: Date, endDate: Date) {
    const query = `
      WITH caregiver_visits AS (
        SELECT
          u.id,
          COUNT(*) as visit_count,
          COUNT(*) FILTER (WHERE vci.actual_check_in IS NOT NULL) as checked_in,
          COUNT(*) FILTER (
            WHERE vci.actual_check_in IS NOT NULL
              AND vci.actual_check_in <= v.scheduled_start + INTERVAL '15 minutes'
          ) as on_time,
          COUNT(*) FILTER (
            WHERE vci.actual_check_in IS NOT NULL
              AND vci.actual_check_in > v.scheduled_start + INTERVAL '15 minutes'
          ) as late,
          COUNT(*) FILTER (
            WHERE v.status = 'missed'
              OR (vci.actual_check_in IS NULL AND v.scheduled_start < NOW() - INTERVAL '30 minutes')
          ) as missed_checkin
        FROM users u
        JOIN visits v ON v.caregiver_id = u.id
        LEFT JOIN visit_check_ins vci ON v.id = vci.visit_id
        WHERE u.organization_id = $1
          AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
          AND u.status = 'active'
          AND v.scheduled_start >= $2
          AND v.scheduled_start <= $3
        GROUP BY u.id
      )
      SELECT
        COUNT(DISTINCT id) as total_on_duty,
        SUM(on_time) as total_on_time,
        SUM(late) as total_late,
        SUM(missed_checkin) as total_missed_checkin
      FROM caregiver_visits
      WHERE visit_count > 0
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);
    const row = result.rows[0];

    return {
      totalOnDuty: parseInt(row.total_on_duty) || 0,
      onTime: parseInt(row.total_on_time) || 0,
      late: parseInt(row.total_late) || 0,
      missedCheckIn: parseInt(row.total_missed_checkin) || 0
    };
  }

  /**
   * Get weekly performance metrics
   */
  private async getPerformanceMetrics(organizationId: string) {
    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - 7);

    const query = `
      WITH weekly_stats AS (
        SELECT
          COUNT(*) as total_visits,
          COUNT(*) FILTER (WHERE v.status = 'completed') as completed,
          COUNT(*) FILTER (
            WHERE vci.actual_check_in IS NOT NULL
              AND vci.actual_check_in <= v.scheduled_start + INTERVAL '15 minutes'
          ) as on_time,
          AVG(EXTRACT(EPOCH FROM (vci.actual_check_in - v.scheduled_start)) / 60)
            FILTER (WHERE vci.actual_check_in > v.scheduled_start) as avg_checkin_delay,
          AVG(EXTRACT(EPOCH FROM (vci.actual_check_out - v.scheduled_end)) / 60)
            FILTER (WHERE vci.actual_check_out > v.scheduled_end) as avg_checkout_delay
        FROM visits v
        LEFT JOIN visit_check_ins vci ON v.id = vci.visit_id
        WHERE v.organization_id = $1
          AND v.scheduled_start >= $2
      )
      SELECT
        CASE
          WHEN total_visits > 0 THEN ROUND((on_time::DECIMAL / total_visits) * 100, 1)
          ELSE 100
        END as weekly_on_time_rate,
        CASE
          WHEN total_visits > 0 THEN ROUND((completed::DECIMAL / total_visits) * 100, 1)
          ELSE 100
        END as weekly_completion_rate,
        ROUND(COALESCE(avg_checkin_delay, 0), 1) as avg_checkin_delay_minutes,
        ROUND(COALESCE(avg_checkout_delay, 0), 1) as avg_checkout_delay_minutes
      FROM weekly_stats
    `;

    const result = await db.query(query, [organizationId, weekStart]);
    const row = result.rows[0];

    return {
      weeklyOnTimeRate: parseFloat(row.weekly_on_time_rate),
      weeklyCompletionRate: parseFloat(row.weekly_completion_rate),
      avgCheckInDelay: parseFloat(row.avg_checkin_delay_minutes),
      avgCheckOutDelay: parseFloat(row.avg_checkout_delay_minutes)
    };
  }

  /**
   * Get schedule data with optimization suggestions
   * Endpoint: GET /api/operations/schedule
   */
  async getSchedule(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    caregiverId?: string,
    clientId?: string
  ) {
    const [visits, optimizationSuggestions, utilizationByCaregiver] = await Promise.all([
      this.getScheduleVisits(organizationId, startDate, endDate, caregiverId, clientId),
      this.getOptimizationSuggestions(organizationId, startDate, endDate),
      this.getUtilizationByCaregiver(organizationId, startDate, endDate)
    ]);

    return {
      visits,
      optimizationSuggestions,
      utilizationByCaregiver
    };
  }

  /**
   * Get visits for schedule view
   */
  private async getScheduleVisits(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    caregiverId?: string,
    clientId?: string
  ) {
    const caregiverFilter = caregiverId ? 'AND v.caregiver_id = $4' : '';
    const clientFilter = clientId ? 'AND v.client_id = $5' : '';
    const params = [organizationId, startDate, endDate];
    if (caregiverId) params.push(caregiverId);
    if (clientId) params.push(clientId);

    const query = `
      SELECT
        v.id as visit_id,
        v.client_id,
        c.name as client_name,
        v.caregiver_id,
        u.name as caregiver_name,
        v.scheduled_start,
        v.scheduled_end,
        v.service_type,
        v.status
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN users u ON v.caregiver_id = u.id
      WHERE v.organization_id = $1
        AND v.scheduled_start >= $2
        AND v.scheduled_start <= $3
        ${caregiverFilter}
        ${clientFilter}
      ORDER BY v.scheduled_start, c.name
      LIMIT 500
    `;

    const result = await db.query(query, params);

    return result.rows.map(row => {
      const issues = [];

      if (!row.caregiver_id) {
        issues.push({
          type: 'unassigned',
          severity: 'error' as const,
          message: 'No caregiver assigned'
        });
      }

      return {
        visitId: row.visit_id,
        clientId: row.client_id,
        clientName: row.client_name,
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        serviceType: row.service_type,
        status: row.status,
        issues
      };
    });
  }

  /**
   * Get optimization suggestions
   */
  private async getOptimizationSuggestions(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Placeholder for route optimization logic (Phase 2)
    return [
      {
        type: 'reduce_travel',
        description: 'Route optimization available - could reduce travel time by 2.5 hours',
        estimatedSavings: '2.5 hours',
        affectedVisits: []
      }
    ];
  }

  /**
   * Get utilization by caregiver
   */
  private async getUtilizationByCaregiver(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const query = `
      SELECT
        u.id as caregiver_id,
        u.name as caregiver_name,
        SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) as scheduled_hours,
        COALESCE(u.max_hours_per_week, 40) as max_hours,
        CASE
          WHEN COALESCE(u.max_hours_per_week, 40) > 0 THEN
            ROUND((SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) / COALESCE(u.max_hours_per_week, 40)) * 100, 1)
          ELSE 0
        END as utilization_rate
      FROM users u
      LEFT JOIN visits v ON v.caregiver_id = u.id
        AND v.scheduled_start >= $2
        AND v.scheduled_start <= $3
        AND v.status NOT IN ('cancelled')
      WHERE u.organization_id = $1
        AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
        AND u.status = 'active'
      GROUP BY u.id, u.name, u.max_hours_per_week
      ORDER BY utilization_rate DESC
    `;

    const result = await db.query(query, [organizationId, startDate, endDate]);

    return result.rows.map(row => {
      const utilizationRate = parseFloat(row.utilization_rate);
      const status = utilizationRate < 70 ? 'underutilized' :
                    utilizationRate > 100 ? 'overutilized' : 'optimal';

      return {
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        scheduledHours: parseFloat(row.scheduled_hours) || 0,
        maxHours: parseFloat(row.max_hours),
        utilizationRate,
        status
      };
    });
  }

  /**
   * Get GPS tracking data
   * Endpoint: GET /api/operations/gps
   */
  async getGPSTracking(
    organizationId: string,
    caregiverId?: string,
    activeOnly: boolean = true
  ) {
    const [activeVisits, geofenceViolations, locationHistory] = await Promise.all([
      this.getActiveVisits(organizationId, caregiverId, activeOnly),
      this.getGeofenceViolations(organizationId),
      caregiverId ? this.getLocationHistory(caregiverId) : Promise.resolve([])
    ]);

    return {
      activeVisits,
      geofenceViolations,
      locationHistory
    };
  }

  /**
   * Get active visits with GPS data
   */
  private async getActiveVisits(
    organizationId: string,
    caregiverId?: string,
    activeOnly: boolean
  ) {
    const caregiverFilter = caregiverId ? 'AND v.caregiver_id = $2' : '';
    const statusFilter = activeOnly ? "AND v.status IN ('scheduled', 'in_progress')" : '';
    const params = caregiverId ? [organizationId, caregiverId] : [organizationId];

    const query = `
      SELECT
        v.id as visit_id,
        v.caregiver_id,
        u.name as caregiver_name,
        c.name as client_name,
        c.address as client_address,
        c.latitude as client_latitude,
        c.longitude as client_longitude,
        c.geofence_radius_meters,
        v.scheduled_start,
        vci.actual_check_in,
        v.status,
        gl.latitude as current_latitude,
        gl.longitude as current_longitude,
        gl.accuracy as current_accuracy,
        gl.timestamp as current_timestamp
      FROM visits v
      JOIN users u ON v.caregiver_id = u.id
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN visit_check_ins vci ON v.id = vci.visit_id
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, accuracy, timestamp
        FROM gps_logs
        WHERE caregiver_id = v.caregiver_id
        ORDER BY timestamp DESC
        LIMIT 1
      ) gl ON true
      WHERE v.organization_id = $1
        ${caregiverFilter}
        ${statusFilter}
        AND v.scheduled_start >= NOW() - INTERVAL '12 hours'
        AND v.scheduled_start <= NOW() + INTERVAL '12 hours'
      ORDER BY v.scheduled_start
      LIMIT 100
    `;

    const result = await db.query(query, params);

    return result.rows.map(row => {
      const hasLocation = row.current_latitude && row.current_longitude;
      let isWithinGeofence = null;
      let distanceFromClient = null;

      if (hasLocation && row.client_latitude && row.client_longitude) {
        // Calculate distance using Haversine formula (approximate)
        const lat1 = row.current_latitude * Math.PI / 180;
        const lat2 = row.client_latitude * Math.PI / 180;
        const dLat = (row.client_latitude - row.current_latitude) * Math.PI / 180;
        const dLon = (row.client_longitude - row.current_longitude) * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceFromClient = 6371000 * c; // Distance in meters

        isWithinGeofence = distanceFromClient <= (row.geofence_radius_meters || 100);
      }

      return {
        visitId: row.visit_id,
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        clientName: row.client_name,
        clientAddress: row.client_address,
        scheduledStart: row.scheduled_start,
        actualCheckIn: row.actual_check_in,
        status: row.status,
        currentLocation: hasLocation ? {
          latitude: parseFloat(row.current_latitude),
          longitude: parseFloat(row.current_longitude),
          accuracy: parseFloat(row.current_accuracy),
          timestamp: row.current_timestamp
        } : null,
        geofence: {
          latitude: parseFloat(row.client_latitude),
          longitude: parseFloat(row.client_longitude),
          radiusMeters: parseInt(row.geofence_radius_meters) || 100
        },
        isWithinGeofence,
        distanceFromClient
      };
    });
  }

  /**
   * Get geofence violations
   */
  private async getGeofenceViolations(organizationId: string) {
    const query = `
      SELECT
        gv.id,
        gv.visit_id,
        u.name as caregiver_name,
        c.name as client_name,
        gv.check_in_latitude,
        gv.check_in_longitude,
        gv.client_latitude,
        gv.client_longitude,
        gv.distance_meters,
        gv.timestamp,
        gv.status,
        gv.reason
      FROM geofence_violations gv
      JOIN visits v ON gv.visit_id = v.id
      JOIN users u ON gv.caregiver_id = u.id
      JOIN clients c ON gv.client_id = c.id
      WHERE gv.organization_id = $1
        AND gv.timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY gv.timestamp DESC
      LIMIT 50
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      visitId: row.visit_id,
      caregiverName: row.caregiver_name,
      clientName: row.client_name,
      checkInLocation: {
        latitude: parseFloat(row.check_in_latitude),
        longitude: parseFloat(row.check_in_longitude)
      },
      clientLocation: {
        latitude: parseFloat(row.client_latitude),
        longitude: parseFloat(row.client_longitude)
      },
      distance: parseFloat(row.distance_meters),
      timestamp: row.timestamp,
      status: row.status,
      reason: row.reason
    }));
  }

  /**
   * Get location history for a caregiver
   */
  private async getLocationHistory(caregiverId: string) {
    const query = `
      SELECT latitude, longitude, timestamp
      FROM gps_logs
      WHERE caregiver_id = $1
        AND timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const result = await db.query(query, [caregiverId]);

    return [{
      caregiverId,
      locations: result.rows.map(row => ({
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        timestamp: row.timestamp
      }))
    }];
  }

  /**
   * Get mileage reimbursements
   * Endpoint: GET /api/operations/mileage
   */
  async getMileageReimbursements(
    organizationId: string,
    status?: string,
    caregiverId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    let filters = [];
    let params = [organizationId];
    let paramIndex = 2;

    if (status) {
      filters.push(`mr.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (caregiverId) {
      filters.push(`mr.caregiver_id = $${paramIndex}`);
      params.push(caregiverId);
      paramIndex++;
    }

    if (startDate) {
      filters.push(`mr.submit_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      filters.push(`mr.submit_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

    const query = `
      SELECT
        mr.id,
        mr.caregiver_id,
        u.name as caregiver_name,
        mr.submit_date,
        mr.pay_period,
        mr.total_miles,
        mr.reimbursement_rate,
        mr.total_amount,
        mr.status,
        mr.reviewed_by,
        ur.name as reviewed_by_name,
        mr.reviewed_at,
        mr.notes
      FROM mileage_reimbursements mr
      JOIN users u ON mr.caregiver_id = u.id
      LEFT JOIN users ur ON mr.reviewed_by = ur.id
      WHERE mr.organization_id = $1
        ${whereClause}
      ORDER BY mr.submit_date DESC
      LIMIT 200
    `;

    const result = await db.query(query, params);

    const reimbursements = await Promise.all(result.rows.map(async row => {
      // Get mileage entries
      const entriesQuery = `
        SELECT date, from_address, to_address, miles, purpose, verified
        FROM mileage_entries
        WHERE reimbursement_id = $1
        ORDER BY date
      `;

      const entriesResult = await db.query(entriesQuery, [row.id]);

      return {
        id: row.id,
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        submitDate: row.submit_date,
        payPeriod: row.pay_period,
        totalMiles: parseFloat(row.total_miles),
        reimbursementRate: parseFloat(row.reimbursement_rate),
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        reviewedBy: row.reviewed_by_name,
        reviewedAt: row.reviewed_at,
        notes: row.notes,
        entries: entriesResult.rows.map(e => ({
          date: e.date,
          fromAddress: e.from_address,
          toAddress: e.to_address,
          miles: parseFloat(e.miles),
          purpose: e.purpose,
          verified: e.verified
        }))
      };
    }));

    // Calculate summary
    const summaryQuery = `
      SELECT
        SUM(total_amount) FILTER (WHERE status = 'pending') as total_pending_amount,
        COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
        SUM(total_amount) FILTER (WHERE status = 'approved' AND DATE_TRUNC('month', submit_date) = DATE_TRUNC('month', NOW())) as total_approved_this_month,
        SUM(total_amount) FILTER (WHERE status = 'paid' AND DATE_TRUNC('month', submit_date) = DATE_TRUNC('month', NOW())) as total_paid_this_month,
        AVG(total_amount) FILTER (WHERE status = 'paid') as avg_reimbursement_per_caregiver
      FROM mileage_reimbursements
      WHERE organization_id = $1
    `;

    const summaryResult = await db.query(summaryQuery, [organizationId]);
    const summary = summaryResult.rows[0];

    return {
      mileageReimbursements: reimbursements,
      summary: {
        totalPending: parseInt(summary.total_pending) || 0,
        totalPendingAmount: parseFloat(summary.total_pending_amount) || 0,
        totalApprovedThisMonth: parseFloat(summary.total_approved_this_month) || 0,
        totalPaidThisMonth: parseFloat(summary.total_paid_this_month) || 0,
        averageReimbursementPerCaregiver: parseFloat(summary.avg_reimbursement_per_caregiver) || 0
      }
    };
  }
}

export const operationsService = new OperationsService();
