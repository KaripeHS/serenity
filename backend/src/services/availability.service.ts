/**
 * Availability Service
 * Handles caregiver availability patterns, time-off requests, and scheduling preferences
 *
 * @module services/availability
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('availability-service');

export interface AvailabilityPattern {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  availabilityType: 'available' | 'preferred' | 'limited' | 'unavailable';
  effectiveFrom: string;
  effectiveUntil?: string;
  maxHoursPerDay?: number;
  maxClientsPerDay?: number;
}

export interface TimeOffRequest {
  id: string;
  userId: string;
  userName: string;
  requestType: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  status: string;
  affectedShifts: number;
  coverageStatus: string;
  hoursRequested?: number;
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface WorkPreferences {
  userId: string;
  minHoursPerWeek: number;
  maxHoursPerWeek: number;
  preferredHoursPerWeek?: number;
  preferredShiftLengthHours: number;
  minShiftLengthHours: number;
  maxShiftLengthHours: number;
  maxTravelDistanceMiles: number;
  hasReliableTransportation: boolean;
  languagesSpoken: string[];
  prefersConsistentClients: boolean;
  okWithLastMinute: boolean;
  okWithOvertime: boolean;
  okWithWeekends: boolean;
  okWithHolidays: boolean;
}

export interface AvailabilityCheck {
  isAvailable: boolean;
  availabilityType: string;
  conflictReason?: string;
}

export class AvailabilityService {
  /**
   * Get availability patterns for a caregiver
   */
  async getAvailabilityPatterns(organizationId: string, userId: string): Promise<AvailabilityPattern[]> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT *
       FROM caregiver_availability_patterns
       WHERE organization_id = $1
         AND user_id = $2
         AND effective_from <= CURRENT_DATE
         AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
       ORDER BY day_of_week, start_time`,
      [organizationId, userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      availabilityType: row.availability_type,
      effectiveFrom: row.effective_from,
      effectiveUntil: row.effective_until,
      maxHoursPerDay: row.max_hours_per_day,
      maxClientsPerDay: row.max_clients_per_day,
    }));
  }

  /**
   * Set availability patterns for a caregiver (replaces existing)
   */
  async setAvailabilityPatterns(
    organizationId: string,
    userId: string,
    patterns: Omit<AvailabilityPattern, 'id' | 'userId'>[]
  ): Promise<AvailabilityPattern[]> {
    const db = await getDbClient();

    // End existing patterns
    await db.query(
      `UPDATE caregiver_availability_patterns
       SET effective_until = CURRENT_DATE - 1
       WHERE user_id = $1
         AND organization_id = $2
         AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)`,
      [userId, organizationId]
    );

    // Insert new patterns
    for (const pattern of patterns) {
      await db.query(
        `INSERT INTO caregiver_availability_patterns (
          organization_id, user_id, day_of_week, start_time, end_time,
          availability_type, effective_from, effective_until,
          max_hours_per_day, max_clients_per_day
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          organizationId,
          userId,
          pattern.dayOfWeek,
          pattern.startTime,
          pattern.endTime,
          pattern.availabilityType,
          pattern.effectiveFrom || new Date().toISOString().split('T')[0],
          pattern.effectiveUntil,
          pattern.maxHoursPerDay,
          pattern.maxClientsPerDay,
        ]
      );
    }

    logger.info('Availability patterns updated', {
      userId,
      patternCount: patterns.length,
    });

    return this.getAvailabilityPatterns(organizationId, userId);
  }

  /**
   * Check if a caregiver is available for a specific date/time
   */
  async checkAvailability(
    userId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilityCheck> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT * FROM check_caregiver_availability($1, $2::date, $3::time, $4::time)`,
      [userId, date, startTime, endTime]
    );

    if (result.rows.length === 0) {
      return {
        isAvailable: false,
        availabilityType: 'unknown',
        conflictReason: 'Unable to determine availability',
      };
    }

    const row = result.rows[0];
    return {
      isAvailable: row.is_available,
      availabilityType: row.availability_type,
      conflictReason: row.conflict_reason,
    };
  }

  /**
   * Get time-off requests
   */
  async getTimeOffRequests(
    organizationId: string,
    filters?: {
      userId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<TimeOffRequest[]> {
    const db = await getDbClient();
    let query = `
      SELECT
        tor.*,
        u.first_name || ' ' || u.last_name as user_name,
        r.first_name || ' ' || r.last_name as reviewed_by_name
       FROM time_off_requests tor
       JOIN users u ON u.id = tor.user_id
       LEFT JOIN users r ON r.id = tor.reviewed_by
       WHERE tor.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (filters?.userId) {
      params.push(filters.userId);
      query += ` AND tor.user_id = $${params.length}`;
    }

    if (filters?.status) {
      params.push(filters.status);
      query += ` AND tor.status = $${params.length}`;
    }

    if (filters?.startDate) {
      params.push(filters.startDate);
      query += ` AND tor.end_date >= $${params.length}`;
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      query += ` AND tor.start_date <= $${params.length}`;
    }

    query += ' ORDER BY tor.start_date DESC';

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      requestType: row.request_type,
      startDate: row.start_date,
      endDate: row.end_date,
      isFullDay: row.is_full_day,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      affectedShifts: row.affected_shifts,
      coverageStatus: row.coverage_status,
      hoursRequested: row.hours_requested,
      reason: row.reason,
      reviewedBy: row.reviewed_by_name,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
    }));
  }

  /**
   * Create time-off request
   */
  async createTimeOffRequest(
    organizationId: string,
    userId: string,
    data: {
      requestType: string;
      startDate: string;
      endDate: string;
      isFullDay?: boolean;
      startTime?: string;
      endTime?: string;
      hoursType?: string;
      reason?: string;
    }
  ): Promise<TimeOffRequest> {
    const db = await getDbClient();

    // Calculate hours requested
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const hoursRequested = data.isFullDay !== false ? days * 8 : null;

    // Check for affected shifts
    const affectedResult = await db.query(
      `SELECT COUNT(*) as count
       FROM shifts
       WHERE caregiver_id = $1
         AND scheduled_start::date >= $2
         AND scheduled_start::date <= $3
         AND status NOT IN ('cancelled', 'completed')`,
      [userId, data.startDate, data.endDate]
    );
    const affectedShifts = parseInt(affectedResult.rows[0].count);

    const result = await db.query(
      `INSERT INTO time_off_requests (
        organization_id, user_id, request_type, start_date, end_date,
        is_full_day, start_time, end_time, hours_requested, hours_type,
        reason, affected_shifts, coverage_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        organizationId,
        userId,
        data.requestType,
        data.startDate,
        data.endDate,
        data.isFullDay !== false,
        data.startTime,
        data.endTime,
        hoursRequested,
        data.hoursType || 'pto',
        data.reason,
        affectedShifts,
        affectedShifts > 0 ? 'uncovered' : 'not_analyzed',
      ]
    );

    logger.info('Time-off request created', {
      requestId: result.rows[0].id,
      userId,
      dates: `${data.startDate} to ${data.endDate}`,
      affectedShifts,
    });

    const requests = await this.getTimeOffRequests(organizationId, { userId });
    return requests.find(r => r.id === result.rows[0].id)!;
  }

  /**
   * Review time-off request (approve/deny)
   */
  async reviewTimeOffRequest(
    organizationId: string,
    requestId: string,
    reviewedBy: string,
    data: {
      status: 'approved' | 'denied';
      notes?: string;
    }
  ): Promise<TimeOffRequest> {
    const db = await getDbClient();

    await db.query(
      `UPDATE time_off_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
       WHERE id = $4 AND organization_id = $5`,
      [data.status, reviewedBy, data.notes, requestId, organizationId]
    );

    // If approved, create availability overrides
    if (data.status === 'approved') {
      const request = await db.query(
        `SELECT * FROM time_off_requests WHERE id = $1`,
        [requestId]
      );

      if (request.rows.length > 0) {
        const req = request.rows[0];
        const startDate = new Date(req.start_date);
        const endDate = new Date(req.end_date);

        // Create override for each day
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          await db.query(
            `INSERT INTO availability_overrides (
              organization_id, user_id, override_date, override_type,
              is_full_day, start_time, end_time, reason, time_off_request_id, created_by
             )
             VALUES ($1, $2, $3, 'unavailable', $4, $5, $6, $7, $8, $9)
             ON CONFLICT DO NOTHING`,
            [
              organizationId,
              req.user_id,
              d.toISOString().split('T')[0],
              req.is_full_day,
              req.start_time,
              req.end_time,
              `Time off: ${req.request_type}`,
              requestId,
              reviewedBy,
            ]
          );
        }
      }
    }

    logger.info('Time-off request reviewed', {
      requestId,
      status: data.status,
      reviewedBy,
    });

    const requests = await this.getTimeOffRequests(organizationId);
    return requests.find(r => r.id === requestId)!;
  }

  /**
   * Get work preferences for a caregiver
   */
  async getWorkPreferences(organizationId: string, userId: string): Promise<WorkPreferences | null> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT * FROM caregiver_work_preferences WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      minHoursPerWeek: parseFloat(row.min_hours_per_week),
      maxHoursPerWeek: parseFloat(row.max_hours_per_week),
      preferredHoursPerWeek: row.preferred_hours_per_week ? parseFloat(row.preferred_hours_per_week) : undefined,
      preferredShiftLengthHours: parseFloat(row.preferred_shift_length_hours),
      minShiftLengthHours: parseFloat(row.min_shift_length_hours),
      maxShiftLengthHours: parseFloat(row.max_shift_length_hours),
      maxTravelDistanceMiles: parseFloat(row.max_travel_distance_miles),
      hasReliableTransportation: row.has_reliable_transportation,
      languagesSpoken: row.languages_spoken || ['en'],
      prefersConsistentClients: row.prefers_consistent_clients,
      okWithLastMinute: row.ok_with_last_minute,
      okWithOvertime: row.ok_with_overtime,
      okWithWeekends: row.ok_with_weekends,
      okWithHolidays: row.ok_with_holidays,
    };
  }

  /**
   * Update work preferences
   */
  async updateWorkPreferences(
    organizationId: string,
    userId: string,
    preferences: Partial<WorkPreferences>
  ): Promise<WorkPreferences> {
    const db = await getDbClient();

    const existing = await this.getWorkPreferences(organizationId, userId);

    if (existing) {
      // Update
      const updates = [];
      const values: any[] = [];
      let idx = 3;

      const fieldMap: Record<string, string> = {
        minHoursPerWeek: 'min_hours_per_week',
        maxHoursPerWeek: 'max_hours_per_week',
        preferredHoursPerWeek: 'preferred_hours_per_week',
        preferredShiftLengthHours: 'preferred_shift_length_hours',
        minShiftLengthHours: 'min_shift_length_hours',
        maxShiftLengthHours: 'max_shift_length_hours',
        maxTravelDistanceMiles: 'max_travel_distance_miles',
        hasReliableTransportation: 'has_reliable_transportation',
        languagesSpoken: 'languages_spoken',
        prefersConsistentClients: 'prefers_consistent_clients',
        okWithLastMinute: 'ok_with_last_minute',
        okWithOvertime: 'ok_with_overtime',
        okWithWeekends: 'ok_with_weekends',
        okWithHolidays: 'ok_with_holidays',
      };

      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (preferences[key as keyof WorkPreferences] !== undefined) {
          updates.push(`${dbField} = $${idx++}`);
          values.push(preferences[key as keyof WorkPreferences]);
        }
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        await db.query(
          `UPDATE caregiver_work_preferences
           SET ${updates.join(', ')}
           WHERE organization_id = $1 AND user_id = $2`,
          [organizationId, userId, ...values]
        );
      }
    } else {
      // Insert
      await db.query(
        `INSERT INTO caregiver_work_preferences (
          organization_id, user_id,
          min_hours_per_week, max_hours_per_week, preferred_hours_per_week,
          preferred_shift_length_hours, min_shift_length_hours, max_shift_length_hours,
          max_travel_distance_miles, has_reliable_transportation, languages_spoken,
          prefers_consistent_clients, ok_with_last_minute, ok_with_overtime,
          ok_with_weekends, ok_with_holidays
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          organizationId,
          userId,
          preferences.minHoursPerWeek ?? 0,
          preferences.maxHoursPerWeek ?? 40,
          preferences.preferredHoursPerWeek,
          preferences.preferredShiftLengthHours ?? 4,
          preferences.minShiftLengthHours ?? 2,
          preferences.maxShiftLengthHours ?? 8,
          preferences.maxTravelDistanceMiles ?? 25,
          preferences.hasReliableTransportation ?? true,
          preferences.languagesSpoken ?? ['en'],
          preferences.prefersConsistentClients ?? true,
          preferences.okWithLastMinute ?? false,
          preferences.okWithOvertime ?? true,
          preferences.okWithWeekends ?? true,
          preferences.okWithHolidays ?? false,
        ]
      );
    }

    logger.info('Work preferences updated', { userId });

    return (await this.getWorkPreferences(organizationId, userId))!;
  }

  /**
   * Get available caregivers for a date/time slot
   */
  async getAvailableCaregivers(
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<{ userId: string; userName: string; availabilityType: string }[]> {
    const db = await getDbClient();

    const dayOfWeek = new Date(date).getDay();

    const result = await db.query(
      `SELECT
        u.id as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        cap.availability_type
       FROM users u
       JOIN caregiver_availability_patterns cap ON cap.user_id = u.id
       WHERE u.organization_id = $1
         AND u.role = 'caregiver'
         AND u.is_active = true
         AND cap.day_of_week = $2
         AND cap.effective_from <= $3
         AND (cap.effective_until IS NULL OR cap.effective_until >= $3)
         AND cap.availability_type IN ('available', 'preferred')
         AND cap.start_time <= $4
         AND cap.end_time >= $5
         AND u.id NOT IN (
           SELECT ao.user_id
           FROM availability_overrides ao
           WHERE ao.override_date = $3
             AND ao.override_type = 'unavailable'
         )
         AND u.id NOT IN (
           SELECT tor.user_id
           FROM time_off_requests tor
           WHERE tor.status = 'approved'
             AND $3 BETWEEN tor.start_date AND tor.end_date
         )
       ORDER BY
         CASE cap.availability_type WHEN 'preferred' THEN 1 ELSE 2 END,
         u.last_name`,
      [organizationId, dayOfWeek, date, startTime, endTime]
    );

    return result.rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name,
      availabilityType: row.availability_type,
    }));
  }
}

export const availabilityService = new AvailabilityService();
