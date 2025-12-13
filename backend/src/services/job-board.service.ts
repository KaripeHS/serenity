/**
 * Job Board Service
 * Manages open shifts and caregiver bidding
 * BIC Feature: Staff self-select shifts from job board
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const db = getDbClient();
const logger = createLogger('job-board-service');

// Types
export interface OpenShift {
  id: string;
  organizationId: string;
  clientId: string;
  clientName?: string;
  serviceType: string;
  serviceCode?: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  requiredSkills?: string[];
  requiredCertifications?: string[];
  preferredGender?: string;
  minExperienceMonths?: number;
  requiresVehicle?: boolean;
  specialInstructions?: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  payRate?: number;
  bonusAmount?: number;
  status: 'open' | 'pending' | 'assigned' | 'cancelled' | 'expired';
  assignedCaregiverId?: string;
  assignedCaregiverName?: string;
  assignedAt?: string;
  postedAt: string;
  postedBy?: string;
  expiresAt?: string;
  autoAssignEnabled?: boolean;
  autoAssignMinScore?: number;
  totalBids?: number;
  myBidId?: string;
  myBidStatus?: string;
  myScore?: number;
}

export interface ShiftBid {
  id: string;
  openShiftId: string;
  caregiverId: string;
  caregiverName?: string;
  bidAt: string;
  message?: string;
  qualificationScore?: number;
  qualificationDetails?: any;
  meetsRequirements: boolean;
  disqualificationReasons?: string[];
  distanceMiles?: number;
  estimatedTravelMinutes?: number;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  reviewedAt?: string;
  reviewedBy?: string;
  declineReason?: string;
}

export interface JobBoardDashboard {
  openShifts: number;
  pendingAssignment: number;
  assignedThisWeek: number;
  urgentOpen: number;
  openToday: number;
  openTomorrow: number;
  avgHoursToFill: number;
}

export interface CaregiverJobPreferences {
  caregiverId: string;
  notifyNewShifts: boolean;
  notifyMethods: string[];
  preferredServiceTypes?: string[];
  maxDistanceMiles?: number;
  minShiftHours?: number;
  maxShiftHours?: number;
  availableForExtraShifts: boolean;
  preferredDays?: string[];
  preferredTimeRanges?: { morning?: boolean; afternoon?: boolean; evening?: boolean };
  autoBidEnabled?: boolean;
  autoBidMinRate?: number;
}

class JobBoardService {
  // ==========================================
  // Open Shifts Management
  // ==========================================

  /**
   * Get job board dashboard stats
   */
  async getDashboard(organizationId: string): Promise<JobBoardDashboard> {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open_shifts,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_assignment,
        COUNT(*) FILTER (WHERE status = 'assigned' AND assigned_at >= CURRENT_DATE - INTERVAL '7 days') AS assigned_this_week,
        COUNT(*) FILTER (WHERE urgency = 'urgent' AND status = 'open') AS urgent_open,
        COUNT(*) FILTER (WHERE shift_date = CURRENT_DATE AND status = 'open') AS open_today,
        COUNT(*) FILTER (WHERE shift_date = CURRENT_DATE + 1 AND status = 'open') AS open_tomorrow,
        COALESCE(AVG(
          EXTRACT(EPOCH FROM (assigned_at - posted_at)) / 3600
        ) FILTER (WHERE status = 'assigned'), 0) AS avg_hours_to_fill
      FROM open_shifts
      WHERE organization_id = $1
    `, [organizationId]);

    const row = result.rows[0];
    return {
      openShifts: parseInt(row.open_shifts) || 0,
      pendingAssignment: parseInt(row.pending_assignment) || 0,
      assignedThisWeek: parseInt(row.assigned_this_week) || 0,
      urgentOpen: parseInt(row.urgent_open) || 0,
      openToday: parseInt(row.open_today) || 0,
      openTomorrow: parseInt(row.open_tomorrow) || 0,
      avgHoursToFill: parseFloat(row.avg_hours_to_fill) || 0,
    };
  }

  /**
   * Get open shifts (for coordinators)
   */
  async getOpenShifts(organizationId: string, filters?: {
    status?: string;
    urgency?: string;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ shifts: OpenShift[]; count: number }> {
    let query = `
      SELECT os.*,
        c.first_name || ' ' || c.last_name AS client_name,
        c.address AS client_address,
        cg.first_name || ' ' || cg.last_name AS assigned_caregiver_name,
        (SELECT COUNT(*) FROM shift_bids WHERE open_shift_id = os.id AND status = 'pending') AS total_bids
      FROM open_shifts os
      JOIN clients c ON c.id = os.client_id
      LEFT JOIN caregivers cg ON cg.id = os.assigned_caregiver_id
      WHERE os.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND os.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.urgency) {
      query += ` AND os.urgency = $${paramIndex++}`;
      params.push(filters.urgency);
    }

    if (filters?.clientId) {
      query += ` AND os.client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }

    if (filters?.dateFrom) {
      query += ` AND os.shift_date >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND os.shift_date <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }

    query += ` ORDER BY
      CASE os.urgency WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      os.shift_date, os.start_time`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);

    return {
      shifts: result.rows.map(this.mapOpenShift),
      count: result.rows.length,
    };
  }

  /**
   * Get available shifts for a caregiver (job board view)
   */
  async getAvailableShiftsForCaregiver(
    organizationId: string,
    caregiverId: string,
    filters?: {
      serviceType?: string;
      maxDistanceMiles?: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<OpenShift[]> {
    const result = await db.query(`
      SELECT os.*,
        c.first_name || ' ' || c.last_name AS client_name,
        c.address AS client_address,
        c.city AS client_city,
        sb.id AS my_bid_id,
        sb.status AS my_bid_status,
        sb.qualification_score AS my_score,
        (SELECT COUNT(*) FROM shift_bids WHERE open_shift_id = os.id AND status = 'pending') AS total_bids
      FROM open_shifts os
      JOIN clients c ON c.id = os.client_id
      LEFT JOIN shift_bids sb ON sb.open_shift_id = os.id AND sb.caregiver_id = $2
      WHERE os.organization_id = $1
        AND os.status = 'open'
        AND os.shift_date >= CURRENT_DATE
      ORDER BY
        CASE os.urgency WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
        os.shift_date, os.start_time
    `, [organizationId, caregiverId]);

    return result.rows.map(this.mapOpenShift);
  }

  /**
   * Create a new open shift (post to job board)
   */
  async createOpenShift(organizationId: string, data: {
    clientId: string;
    serviceType: string;
    serviceCode?: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    locationAddress?: string;
    locationLat?: number;
    locationLng?: number;
    requiredSkills?: string[];
    requiredCertifications?: string[];
    preferredGender?: string;
    minExperienceMonths?: number;
    requiresVehicle?: boolean;
    specialInstructions?: string;
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    payRate?: number;
    bonusAmount?: number;
    autoAssignEnabled?: boolean;
    autoAssignMinScore?: number;
    expiresAt?: string;
    postedBy: string;
    originalVisitId?: string;
  }): Promise<OpenShift> {
    const result = await db.query(`
      INSERT INTO open_shifts (
        organization_id, client_id, service_type, service_code,
        shift_date, start_time, end_time, duration_minutes,
        location_address, location_lat, location_lng,
        required_skills, required_certifications, preferred_gender,
        min_experience_months, requires_vehicle, special_instructions,
        urgency, pay_rate, bonus_amount,
        auto_assign_enabled, auto_assign_min_score, expires_at,
        posted_by, original_visit_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'open'
      )
      RETURNING *
    `, [
      organizationId, data.clientId, data.serviceType, data.serviceCode,
      data.shiftDate, data.startTime, data.endTime, data.durationMinutes,
      data.locationAddress, data.locationLat, data.locationLng,
      data.requiredSkills, data.requiredCertifications, data.preferredGender,
      data.minExperienceMonths || 0, data.requiresVehicle || false, data.specialInstructions,
      data.urgency || 'normal', data.payRate, data.bonusAmount || 0,
      data.autoAssignEnabled || false, data.autoAssignMinScore || 80, data.expiresAt,
      data.postedBy, data.originalVisitId
    ]);

    // Log activity
    await this.logActivity(organizationId, 'shift_posted', result.rows[0].id, null, data.postedBy);

    logger.info('Open shift created', { shiftId: result.rows[0].id, clientId: data.clientId });

    return this.mapOpenShift(result.rows[0]);
  }

  /**
   * Update an open shift
   */
  async updateOpenShift(
    shiftId: string,
    organizationId: string,
    updates: Partial<OpenShift>
  ): Promise<OpenShift | null> {
    const result = await db.query(`
      UPDATE open_shifts
      SET
        service_type = COALESCE($3, service_type),
        shift_date = COALESCE($4, shift_date),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time),
        urgency = COALESCE($7, urgency),
        pay_rate = COALESCE($8, pay_rate),
        bonus_amount = COALESCE($9, bonus_amount),
        special_instructions = COALESCE($10, special_instructions),
        updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `, [
      shiftId, organizationId, updates.serviceType, updates.shiftDate,
      updates.startTime, updates.endTime, updates.urgency,
      updates.payRate, updates.bonusAmount, updates.specialInstructions
    ]);

    return result.rows[0] ? this.mapOpenShift(result.rows[0]) : null;
  }

  /**
   * Cancel an open shift
   */
  async cancelOpenShift(shiftId: string, organizationId: string, userId: string): Promise<boolean> {
    const result = await db.query(`
      UPDATE open_shifts
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND status = 'open'
      RETURNING id
    `, [shiftId, organizationId]);

    if (result.rows[0]) {
      await this.logActivity(organizationId, 'shift_cancelled', shiftId, null, userId);
      return true;
    }
    return false;
  }

  // ==========================================
  // Bidding System
  // ==========================================

  /**
   * Submit a bid on an open shift
   */
  async submitBid(
    shiftId: string,
    caregiverId: string,
    message?: string
  ): Promise<ShiftBid> {
    // Calculate qualification score
    const qualResult = await db.query(`
      SELECT * FROM calculate_shift_qualification($1, $2)
    `, [caregiverId, shiftId]);

    const qualification = qualResult.rows[0] || { score: 50, meets_requirements: true, details: {} };

    const result = await db.query(`
      INSERT INTO shift_bids (
        open_shift_id, caregiver_id, message,
        qualification_score, qualification_details, meets_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (open_shift_id, caregiver_id) DO UPDATE
      SET message = EXCLUDED.message,
          bid_at = NOW(),
          status = 'pending'
      RETURNING *
    `, [
      shiftId, caregiverId, message,
      qualification.score, qualification.details, qualification.meets_requirements
    ]);

    // Update shift status to pending if first bid
    await db.query(`
      UPDATE open_shifts
      SET status = CASE WHEN status = 'open' THEN 'pending' ELSE status END
      WHERE id = $1
    `, [shiftId]);

    // Get org for activity logging
    const shiftResult = await db.query(`SELECT organization_id FROM open_shifts WHERE id = $1`, [shiftId]);
    if (shiftResult.rows[0]) {
      await this.logActivity(shiftResult.rows[0].organization_id, 'bid_submitted', shiftId, caregiverId, null);
    }

    logger.info('Bid submitted', { shiftId, caregiverId, score: qualification.score });

    return this.mapBid(result.rows[0]);
  }

  /**
   * Get bids for a shift
   */
  async getBidsForShift(shiftId: string): Promise<ShiftBid[]> {
    const result = await db.query(`
      SELECT sb.*,
        c.first_name || ' ' || c.last_name AS caregiver_name
      FROM shift_bids sb
      JOIN caregivers c ON c.id = sb.caregiver_id
      WHERE sb.open_shift_id = $1
      ORDER BY sb.qualification_score DESC, sb.bid_at ASC
    `, [shiftId]);

    return result.rows.map(this.mapBid);
  }

  /**
   * Accept a bid (assign shift to caregiver)
   */
  async acceptBid(
    bidId: string,
    organizationId: string,
    reviewerId: string
  ): Promise<{ bid: ShiftBid; shift: OpenShift } | null> {
    // Update bid status (trigger will update shift)
    const bidResult = await db.query(`
      UPDATE shift_bids
      SET status = 'accepted', reviewed_at = NOW(), reviewed_by = $2
      WHERE id = $1
      RETURNING *
    `, [bidId, reviewerId]);

    if (!bidResult.rows[0]) return null;

    const bid = this.mapBid(bidResult.rows[0]);

    // Get updated shift
    const shiftResult = await db.query(`
      SELECT os.*, c.first_name || ' ' || c.last_name AS client_name
      FROM open_shifts os
      JOIN clients c ON c.id = os.client_id
      WHERE os.id = $1
    `, [bid.openShiftId]);

    const shift = shiftResult.rows[0] ? this.mapOpenShift(shiftResult.rows[0]) : null;

    await this.logActivity(organizationId, 'bid_accepted', bid.openShiftId, bid.caregiverId, reviewerId);

    logger.info('Bid accepted', { bidId, shiftId: bid.openShiftId, caregiverId: bid.caregiverId });

    return shift ? { bid, shift } : null;
  }

  /**
   * Decline a bid
   */
  async declineBid(
    bidId: string,
    organizationId: string,
    reviewerId: string,
    reason?: string
  ): Promise<ShiftBid | null> {
    const result = await db.query(`
      UPDATE shift_bids
      SET status = 'declined',
          reviewed_at = NOW(),
          reviewed_by = $2,
          decline_reason = $3
      WHERE id = $1
      RETURNING *
    `, [bidId, reviewerId, reason]);

    if (!result.rows[0]) return null;

    const bid = this.mapBid(result.rows[0]);
    await this.logActivity(organizationId, 'bid_declined', bid.openShiftId, bid.caregiverId, reviewerId);

    return bid;
  }

  /**
   * Withdraw a bid (caregiver action)
   */
  async withdrawBid(bidId: string, caregiverId: string): Promise<boolean> {
    const result = await db.query(`
      UPDATE shift_bids
      SET status = 'withdrawn'
      WHERE id = $1 AND caregiver_id = $2 AND status = 'pending'
      RETURNING open_shift_id
    `, [bidId, caregiverId]);

    if (result.rows[0]) {
      const shiftResult = await db.query(`SELECT organization_id FROM open_shifts WHERE id = $1`, [result.rows[0].open_shift_id]);
      if (shiftResult.rows[0]) {
        await this.logActivity(shiftResult.rows[0].organization_id, 'bid_withdrawn', result.rows[0].open_shift_id, caregiverId, null);
      }
      return true;
    }
    return false;
  }

  /**
   * Get caregiver's bids
   */
  async getCaregiverBids(caregiverId: string, status?: string): Promise<(ShiftBid & { shift: OpenShift })[]> {
    let query = `
      SELECT sb.*, os.*, c.first_name || ' ' || c.last_name AS client_name
      FROM shift_bids sb
      JOIN open_shifts os ON os.id = sb.open_shift_id
      JOIN clients c ON c.id = os.client_id
      WHERE sb.caregiver_id = $1
    `;

    const params: any[] = [caregiverId];

    if (status) {
      query += ` AND sb.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY sb.bid_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      ...this.mapBid(row),
      shift: this.mapOpenShift(row),
    }));
  }

  // ==========================================
  // Caregiver Preferences
  // ==========================================

  /**
   * Get caregiver job preferences
   */
  async getCaregiverPreferences(caregiverId: string): Promise<CaregiverJobPreferences | null> {
    const result = await db.query(`
      SELECT * FROM caregiver_job_preferences WHERE caregiver_id = $1
    `, [caregiverId]);

    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      caregiverId: row.caregiver_id,
      notifyNewShifts: row.notify_new_shifts,
      notifyMethods: row.notify_methods || [],
      preferredServiceTypes: row.preferred_service_types,
      maxDistanceMiles: row.max_distance_miles,
      minShiftHours: row.min_shift_hours,
      maxShiftHours: row.max_shift_hours,
      availableForExtraShifts: row.available_for_extra_shifts,
      preferredDays: row.preferred_days,
      preferredTimeRanges: row.preferred_time_ranges,
      autoBidEnabled: row.auto_bid_enabled,
      autoBidMinRate: row.auto_bid_min_rate,
    };
  }

  /**
   * Update caregiver job preferences
   */
  async updateCaregiverPreferences(
    caregiverId: string,
    preferences: Partial<CaregiverJobPreferences>
  ): Promise<CaregiverJobPreferences> {
    const result = await db.query(`
      INSERT INTO caregiver_job_preferences (
        caregiver_id, notify_new_shifts, notify_methods,
        preferred_service_types, max_distance_miles,
        min_shift_hours, max_shift_hours,
        available_for_extra_shifts, preferred_days, preferred_time_ranges,
        auto_bid_enabled, auto_bid_min_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (caregiver_id) DO UPDATE
      SET notify_new_shifts = COALESCE($2, caregiver_job_preferences.notify_new_shifts),
          notify_methods = COALESCE($3, caregiver_job_preferences.notify_methods),
          preferred_service_types = COALESCE($4, caregiver_job_preferences.preferred_service_types),
          max_distance_miles = COALESCE($5, caregiver_job_preferences.max_distance_miles),
          min_shift_hours = COALESCE($6, caregiver_job_preferences.min_shift_hours),
          max_shift_hours = COALESCE($7, caregiver_job_preferences.max_shift_hours),
          available_for_extra_shifts = COALESCE($8, caregiver_job_preferences.available_for_extra_shifts),
          preferred_days = COALESCE($9, caregiver_job_preferences.preferred_days),
          preferred_time_ranges = COALESCE($10, caregiver_job_preferences.preferred_time_ranges),
          auto_bid_enabled = COALESCE($11, caregiver_job_preferences.auto_bid_enabled),
          auto_bid_min_rate = COALESCE($12, caregiver_job_preferences.auto_bid_min_rate),
          updated_at = NOW()
      RETURNING *
    `, [
      caregiverId,
      preferences.notifyNewShifts ?? true,
      preferences.notifyMethods ?? ['push', 'sms'],
      preferences.preferredServiceTypes,
      preferences.maxDistanceMiles ?? 25,
      preferences.minShiftHours,
      preferences.maxShiftHours,
      preferences.availableForExtraShifts ?? true,
      preferences.preferredDays,
      preferences.preferredTimeRanges,
      preferences.autoBidEnabled ?? false,
      preferences.autoBidMinRate
    ]);

    const row = result.rows[0];
    return {
      caregiverId: row.caregiver_id,
      notifyNewShifts: row.notify_new_shifts,
      notifyMethods: row.notify_methods || [],
      preferredServiceTypes: row.preferred_service_types,
      maxDistanceMiles: row.max_distance_miles,
      minShiftHours: row.min_shift_hours,
      maxShiftHours: row.max_shift_hours,
      availableForExtraShifts: row.available_for_extra_shifts,
      preferredDays: row.preferred_days,
      preferredTimeRanges: row.preferred_time_ranges,
      autoBidEnabled: row.auto_bid_enabled,
      autoBidMinRate: row.auto_bid_min_rate,
    };
  }

  // ==========================================
  // Activity Logging
  // ==========================================

  private async logActivity(
    organizationId: string,
    activityType: string,
    shiftId?: string,
    caregiverId?: string,
    userId?: string,
    details?: any
  ): Promise<void> {
    await db.query(`
      INSERT INTO job_board_activity (
        organization_id, activity_type, open_shift_id, caregiver_id, user_id, details
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [organizationId, activityType, shiftId, caregiverId, userId, details]);
  }

  // ==========================================
  // Mappers
  // ==========================================

  private mapOpenShift(row: any): OpenShift {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      clientName: row.client_name,
      serviceType: row.service_type,
      serviceCode: row.service_code,
      shiftDate: row.shift_date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: row.duration_minutes,
      locationAddress: row.location_address || row.client_address,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      requiredSkills: row.required_skills,
      requiredCertifications: row.required_certifications,
      preferredGender: row.preferred_gender,
      minExperienceMonths: row.min_experience_months,
      requiresVehicle: row.requires_vehicle,
      specialInstructions: row.special_instructions,
      urgency: row.urgency,
      payRate: row.pay_rate,
      bonusAmount: row.bonus_amount,
      status: row.status,
      assignedCaregiverId: row.assigned_caregiver_id,
      assignedCaregiverName: row.assigned_caregiver_name,
      assignedAt: row.assigned_at,
      postedAt: row.posted_at,
      postedBy: row.posted_by,
      expiresAt: row.expires_at,
      autoAssignEnabled: row.auto_assign_enabled,
      autoAssignMinScore: row.auto_assign_min_score,
      totalBids: parseInt(row.total_bids) || 0,
      myBidId: row.my_bid_id,
      myBidStatus: row.my_bid_status,
      myScore: row.my_score,
    };
  }

  private mapBid(row: any): ShiftBid {
    return {
      id: row.id,
      openShiftId: row.open_shift_id,
      caregiverId: row.caregiver_id,
      caregiverName: row.caregiver_name,
      bidAt: row.bid_at,
      message: row.message,
      qualificationScore: row.qualification_score,
      qualificationDetails: row.qualification_details,
      meetsRequirements: row.meets_requirements,
      disqualificationReasons: row.disqualification_reasons,
      distanceMiles: row.distance_miles,
      estimatedTravelMinutes: row.estimated_travel_minutes,
      status: row.status,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
      declineReason: row.decline_reason,
    };
  }
}

export const jobBoardService = new JobBoardService();
