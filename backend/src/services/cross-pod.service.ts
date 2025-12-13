/**
 * Cross-Pod Caregiver Service
 * Manages caregiver sharing between pods, floating caregiver pool,
 * and cross-pod assignment tracking
 *
 * Phase 3, Months 7-8 - Multi-Pod Operations
 */

import { getDbClient } from '../database/client';

interface CrossPodFilters {
  status?: string;
  assignmentType?: string;
  primaryPodId?: string;
  assignedPodId?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateCrossPodAssignmentData {
  caregiverId: string;
  primaryPodId: string;
  assignedPodId: string;
  assignmentType: 'temporary' | 'permanent' | 'floating';
  reason?: string;
  startDate: string;
  endDate?: string;
  maxHoursPerWeek?: number;
  allowedShiftTypes?: string[];
  requestedBy: string;
}

interface FloatingPoolEntry {
  caregiverId: string;
  isAvailable?: boolean;
  availablePods?: string[];
  excludedPods?: string[];
  maxTravelMiles?: number;
  preferredShiftTypes?: string[];
  preferredDays?: string[];
  minPerformanceScore?: number;
  requiresTransportation?: boolean;
}

export class CrossPodService {
  // ============================================
  // CROSS-POD ASSIGNMENTS
  // ============================================

  /**
   * Get all cross-pod assignments with filters
   */
  async getAssignments(
    organizationId: string,
    filters: CrossPodFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        cpa.*,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        cg.phone AS caregiver_phone,
        pp.name AS primary_pod_name,
        ap.name AS assigned_pod_name,
        req.first_name || ' ' || req.last_name AS requested_by_name,
        appr.first_name || ' ' || appr.last_name AS approved_by_name
      FROM cross_pod_assignments cpa
      JOIN caregivers cg ON cg.id = cpa.caregiver_id
      JOIN pods pp ON pp.id = cpa.primary_pod_id
      JOIN pods ap ON ap.id = cpa.assigned_pod_id
      LEFT JOIN users req ON req.id = cpa.requested_by
      LEFT JOIN users appr ON appr.id = cpa.approved_by
      WHERE cpa.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND cpa.status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters.assignmentType) {
      query += ` AND cpa.assignment_type = $${paramIndex++}`;
      params.push(filters.assignmentType);
    }
    if (filters.primaryPodId) {
      query += ` AND cpa.primary_pod_id = $${paramIndex++}`;
      params.push(filters.primaryPodId);
    }
    if (filters.assignedPodId) {
      query += ` AND cpa.assigned_pod_id = $${paramIndex++}`;
      params.push(filters.assignedPodId);
    }
    if (filters.fromDate) {
      query += ` AND cpa.start_date >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      query += ` AND (cpa.end_date IS NULL OR cpa.end_date <= $${paramIndex++})`;
      params.push(filters.toDate);
    }

    query += ` ORDER BY cpa.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      caregiver: {
        id: row.caregiver_id,
        name: row.caregiver_name,
        phone: row.caregiver_phone,
      },
      primaryPod: {
        id: row.primary_pod_id,
        name: row.primary_pod_name,
      },
      assignedPod: {
        id: row.assigned_pod_id,
        name: row.assigned_pod_name,
      },
      assignmentType: row.assignment_type,
      reason: row.reason,
      startDate: row.start_date,
      endDate: row.end_date,
      maxHoursPerWeek: row.max_hours_per_week,
      allowedShiftTypes: row.allowed_shift_types,
      status: row.status,
      requestedBy: row.requested_by
        ? { id: row.requested_by, name: row.requested_by_name }
        : null,
      approvedBy: row.approved_by
        ? { id: row.approved_by, name: row.approved_by_name }
        : null,
      approvedAt: row.approved_at,
      actualHoursWorked: parseFloat(row.actual_hours_worked) || 0,
      shiftsCompleted: row.shifts_completed,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get active assignments for a specific pod (incoming or outgoing)
   */
  async getPodAssignments(
    podId: string,
    organizationId: string,
    direction: 'incoming' | 'outgoing' = 'incoming'
  ): Promise<any[]> {
    const db = await getDbClient();

    const podField =
      direction === 'incoming' ? 'assigned_pod_id' : 'primary_pod_id';
    const otherPodField =
      direction === 'incoming' ? 'primary_pod_id' : 'assigned_pod_id';

    const result = await db.query(
      `
      SELECT
        cpa.*,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        cg.phone AS caregiver_phone,
        op.name AS other_pod_name,
        cpm.performance_score,
        cpm.performance_tier
      FROM cross_pod_assignments cpa
      JOIN caregivers cg ON cg.id = cpa.caregiver_id
      JOIN pods op ON op.id = cpa.${otherPodField}
      LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
      WHERE cpa.${podField} = $1
        AND cpa.organization_id = $2
        AND cpa.status IN ('approved', 'active')
      ORDER BY cpa.start_date
    `,
      [podId, organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      caregiver: {
        id: row.caregiver_id,
        name: row.caregiver_name,
        phone: row.caregiver_phone,
        performanceScore: parseFloat(row.performance_score) || null,
        performanceTier: row.performance_tier,
      },
      otherPod: {
        id: row[otherPodField],
        name: row.other_pod_name,
      },
      direction,
      assignmentType: row.assignment_type,
      reason: row.reason,
      startDate: row.start_date,
      endDate: row.end_date,
      maxHoursPerWeek: row.max_hours_per_week,
      hoursWorked: parseFloat(row.actual_hours_worked) || 0,
      shiftsCompleted: row.shifts_completed,
    }));
  }

  /**
   * Create a cross-pod assignment request
   */
  async createAssignment(
    organizationId: string,
    data: CreateCrossPodAssignmentData
  ): Promise<any> {
    const db = await getDbClient();

    // Verify caregiver belongs to primary pod
    const caregiverCheck = await db.query(
      `
      SELECT id, primary_pod_id FROM caregivers
      WHERE id = $1 AND organization_id = $2 AND status = 'active'
    `,
      [data.caregiverId, organizationId]
    );

    if (caregiverCheck.rows.length === 0) {
      throw new Error('Caregiver not found or inactive');
    }

    if (caregiverCheck.rows[0].primary_pod_id !== data.primaryPodId) {
      throw new Error('Caregiver does not belong to specified primary pod');
    }

    // Check for overlapping assignments
    const overlapCheck = await db.query(
      `
      SELECT id FROM cross_pod_assignments
      WHERE caregiver_id = $1
        AND assigned_pod_id = $2
        AND status NOT IN ('rejected', 'completed', 'cancelled')
        AND (
          (start_date <= $3 AND (end_date IS NULL OR end_date >= $3))
          OR (start_date <= $4 AND (end_date IS NULL OR end_date >= $4))
          OR (start_date >= $3 AND (end_date IS NULL OR end_date <= $4))
        )
    `,
      [data.caregiverId, data.assignedPodId, data.startDate, data.endDate || '2099-12-31']
    );

    if (overlapCheck.rows.length > 0) {
      throw new Error('Overlapping assignment already exists');
    }

    const result = await db.query(
      `
      INSERT INTO cross_pod_assignments (
        organization_id, caregiver_id, primary_pod_id, assigned_pod_id,
        assignment_type, reason, start_date, end_date,
        max_hours_per_week, allowed_shift_types, requested_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `,
      [
        organizationId,
        data.caregiverId,
        data.primaryPodId,
        data.assignedPodId,
        data.assignmentType,
        data.reason || null,
        data.startDate,
        data.endDate || null,
        data.maxHoursPerWeek || 20,
        JSON.stringify(data.allowedShiftTypes || []),
        data.requestedBy,
      ]
    );

    return result.rows[0];
  }

  /**
   * Approve or reject an assignment
   */
  async reviewAssignment(
    assignmentId: string,
    organizationId: string,
    approved: boolean,
    reviewerId: string,
    notes?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const status = approved ? 'approved' : 'rejected';

    const result = await db.query(
      `
      UPDATE cross_pod_assignments
      SET status = $1,
          approved_by = $2,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $3 AND organization_id = $4 AND status = 'pending'
      RETURNING *
    `,
      [status, reviewerId, assignmentId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Activate an approved assignment
   */
  async activateAssignment(
    assignmentId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE cross_pod_assignments
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
        AND organization_id = $2
        AND status = 'approved'
        AND start_date <= CURRENT_DATE
      RETURNING *
    `,
      [assignmentId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Complete an assignment
   */
  async completeAssignment(
    assignmentId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE cross_pod_assignments
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND status = 'active'
      RETURNING *
    `,
      [assignmentId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Record hours worked on a cross-pod assignment
   */
  async recordHours(
    assignmentId: string,
    organizationId: string,
    hours: number,
    incrementShifts: boolean = true
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE cross_pod_assignments
      SET actual_hours_worked = actual_hours_worked + $1,
          shifts_completed = shifts_completed + CASE WHEN $4 THEN 1 ELSE 0 END,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3 AND status = 'active'
      RETURNING *
    `,
      [hours, assignmentId, organizationId, incrementShifts]
    );

    return result.rows[0] || null;
  }

  // ============================================
  // FLOATING CAREGIVER POOL
  // ============================================

  /**
   * Get floating caregiver pool
   */
  async getFloatingPool(
    organizationId: string,
    availableOnly: boolean = false
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        fcp.*,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        cg.phone AS caregiver_phone,
        cg.email AS caregiver_email,
        p.id AS primary_pod_id,
        p.name AS primary_pod_name,
        cpm.performance_score,
        cpm.performance_tier
      FROM floating_caregiver_pool fcp
      JOIN caregivers cg ON cg.id = fcp.caregiver_id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
      WHERE fcp.organization_id = $1
        AND cg.status = 'active'
    `;

    if (availableOnly) {
      query += ` AND fcp.is_available = TRUE`;
    }

    query += ` ORDER BY cpm.performance_score DESC NULLS LAST`;

    const result = await db.query(query, [organizationId]);

    return result.rows.map((row) => ({
      id: row.id,
      caregiver: {
        id: row.caregiver_id,
        name: row.caregiver_name,
        phone: row.caregiver_phone,
        email: row.caregiver_email,
        primaryPod: row.primary_pod_id
          ? { id: row.primary_pod_id, name: row.primary_pod_name }
          : null,
        performanceScore: parseFloat(row.performance_score) || null,
        performanceTier: row.performance_tier,
      },
      isAvailable: row.is_available,
      availablePods: row.available_pods || [],
      excludedPods: row.excluded_pods || [],
      preferences: {
        maxTravelMiles: row.max_travel_miles,
        preferredShiftTypes: row.preferred_shift_types || [],
        preferredDays: row.preferred_days || [],
        minPerformanceScore: parseFloat(row.min_performance_score),
        requiresTransportation: row.requires_transportation,
      },
      stats: {
        totalFloatHours: parseFloat(row.total_float_hours) || 0,
        totalFloatShifts: row.total_float_shifts,
        podsWorked: row.pods_worked || [],
      },
      addedAt: row.added_at,
    }));
  }

  /**
   * Add caregiver to floating pool
   */
  async addToFloatingPool(
    organizationId: string,
    data: FloatingPoolEntry
  ): Promise<any> {
    const db = await getDbClient();

    // Verify caregiver exists and meets requirements
    const caregiverCheck = await db.query(
      `
      SELECT cg.id, cpm.performance_score
      FROM caregivers cg
      LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
      WHERE cg.id = $1 AND cg.organization_id = $2 AND cg.status = 'active'
    `,
      [data.caregiverId, organizationId]
    );

    if (caregiverCheck.rows.length === 0) {
      throw new Error('Caregiver not found or inactive');
    }

    const minScore = data.minPerformanceScore || 75;
    if (
      caregiverCheck.rows[0].performance_score &&
      caregiverCheck.rows[0].performance_score < minScore
    ) {
      throw new Error(
        `Caregiver performance score (${caregiverCheck.rows[0].performance_score}) below minimum requirement (${minScore})`
      );
    }

    const result = await db.query(
      `
      INSERT INTO floating_caregiver_pool (
        organization_id, caregiver_id, is_available,
        available_pods, excluded_pods, max_travel_miles,
        preferred_shift_types, preferred_days,
        min_performance_score, requires_transportation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (caregiver_id) DO UPDATE SET
        is_available = EXCLUDED.is_available,
        available_pods = EXCLUDED.available_pods,
        excluded_pods = EXCLUDED.excluded_pods,
        max_travel_miles = EXCLUDED.max_travel_miles,
        preferred_shift_types = EXCLUDED.preferred_shift_types,
        preferred_days = EXCLUDED.preferred_days,
        min_performance_score = EXCLUDED.min_performance_score,
        requires_transportation = EXCLUDED.requires_transportation,
        updated_at = NOW()
      RETURNING *
    `,
      [
        organizationId,
        data.caregiverId,
        data.isAvailable !== false,
        JSON.stringify(data.availablePods || []),
        JSON.stringify(data.excludedPods || []),
        data.maxTravelMiles || 30,
        JSON.stringify(data.preferredShiftTypes || []),
        JSON.stringify(data.preferredDays || []),
        data.minPerformanceScore || 75,
        data.requiresTransportation !== false,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update floating pool entry
   */
  async updateFloatingPoolEntry(
    caregiverId: string,
    organizationId: string,
    updates: Partial<FloatingPoolEntry>
  ): Promise<any | null> {
    const db = await getDbClient();

    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.isAvailable !== undefined) {
      setClause.push(`is_available = $${paramIndex++}`);
      values.push(updates.isAvailable);
    }
    if (updates.availablePods !== undefined) {
      setClause.push(`available_pods = $${paramIndex++}`);
      values.push(JSON.stringify(updates.availablePods));
    }
    if (updates.excludedPods !== undefined) {
      setClause.push(`excluded_pods = $${paramIndex++}`);
      values.push(JSON.stringify(updates.excludedPods));
    }
    if (updates.maxTravelMiles !== undefined) {
      setClause.push(`max_travel_miles = $${paramIndex++}`);
      values.push(updates.maxTravelMiles);
    }
    if (updates.preferredShiftTypes !== undefined) {
      setClause.push(`preferred_shift_types = $${paramIndex++}`);
      values.push(JSON.stringify(updates.preferredShiftTypes));
    }
    if (updates.preferredDays !== undefined) {
      setClause.push(`preferred_days = $${paramIndex++}`);
      values.push(JSON.stringify(updates.preferredDays));
    }
    if (updates.minPerformanceScore !== undefined) {
      setClause.push(`min_performance_score = $${paramIndex++}`);
      values.push(updates.minPerformanceScore);
    }
    if (updates.requiresTransportation !== undefined) {
      setClause.push(`requires_transportation = $${paramIndex++}`);
      values.push(updates.requiresTransportation);
    }

    if (setClause.length === 0) {
      return null;
    }

    setClause.push(`updated_at = NOW()`);
    values.push(caregiverId, organizationId);

    const result = await db.query(
      `
      UPDATE floating_caregiver_pool
      SET ${setClause.join(', ')}
      WHERE caregiver_id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Remove caregiver from floating pool
   */
  async removeFromFloatingPool(
    caregiverId: string,
    organizationId: string
  ): Promise<boolean> {
    const db = await getDbClient();

    const result = await db.query(
      `
      DELETE FROM floating_caregiver_pool
      WHERE caregiver_id = $1 AND organization_id = $2
    `,
      [caregiverId, organizationId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Record float work stats
   */
  async recordFloatWork(
    caregiverId: string,
    organizationId: string,
    hours: number,
    podId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE floating_caregiver_pool
      SET total_float_hours = total_float_hours + $1,
          total_float_shifts = total_float_shifts + 1,
          pods_worked = CASE
            WHEN NOT pods_worked ? $4
            THEN pods_worked || jsonb_build_array($4)
            ELSE pods_worked
          END,
          updated_at = NOW()
      WHERE caregiver_id = $2 AND organization_id = $3
      RETURNING *
    `,
      [hours, caregiverId, organizationId, podId]
    );

    return result.rows[0] || null;
  }

  // ============================================
  // COVERAGE GAP MATCHING
  // ============================================

  /**
   * Find available floaters for a coverage gap
   */
  async findAvailableFloaters(
    organizationId: string,
    targetPodId: string,
    shiftDate: string,
    shiftType?: string
  ): Promise<any[]> {
    const db = await getDbClient();

    const dayOfWeek = new Date(shiftDate).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    const result = await db.query(
      `
      SELECT
        fcp.id AS pool_id,
        cg.id AS caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        cg.phone,
        p.id AS home_pod_id,
        p.name AS home_pod_name,
        cpm.performance_score,
        cpm.performance_tier,
        fcp.max_travel_miles,
        fcp.preferred_shift_types,
        fcp.preferred_days,
        -- Check if already has shifts on this date
        (SELECT COUNT(*) FROM shifts s
         WHERE s.caregiver_id = cg.id
           AND DATE(s.start_time) = $4) AS existing_shifts
      FROM floating_caregiver_pool fcp
      JOIN caregivers cg ON cg.id = fcp.caregiver_id
      LEFT JOIN pods p ON p.id = cg.primary_pod_id
      LEFT JOIN caregiver_performance_monthly cpm ON cpm.caregiver_id = cg.id
        AND cpm.performance_month = DATE_TRUNC('month', CURRENT_DATE)
      WHERE fcp.organization_id = $1
        AND fcp.is_available = TRUE
        AND cg.status = 'active'
        -- Not excluded from target pod
        AND NOT (fcp.excluded_pods @> jsonb_build_array($2))
        -- Either available for all pods or specifically this one
        AND (jsonb_array_length(fcp.available_pods) = 0
             OR fcp.available_pods @> jsonb_build_array($2))
        -- Meets performance requirement
        AND (cpm.performance_score IS NULL OR cpm.performance_score >= fcp.min_performance_score)
      ORDER BY
        -- Prefer floaters who have this as a preferred day
        (fcp.preferred_days @> jsonb_build_array($3)) DESC,
        -- Then by performance score
        cpm.performance_score DESC NULLS LAST,
        -- Then by fewer existing shifts
        (SELECT COUNT(*) FROM shifts s
         WHERE s.caregiver_id = cg.id
           AND DATE(s.start_time) = $4)
    `,
      [organizationId, targetPodId, dayOfWeek, shiftDate]
    );

    return result.rows
      .filter((row) => {
        // Filter by shift type if specified
        if (
          shiftType &&
          row.preferred_shift_types.length > 0 &&
          !row.preferred_shift_types.includes(shiftType)
        ) {
          return false;
        }
        return true;
      })
      .map((row) => ({
        poolId: row.pool_id,
        caregiver: {
          id: row.caregiver_id,
          name: row.caregiver_name,
          phone: row.phone,
          homePod: row.home_pod_id
            ? { id: row.home_pod_id, name: row.home_pod_name }
            : null,
          performanceScore: parseFloat(row.performance_score) || null,
          performanceTier: row.performance_tier,
        },
        availability: {
          maxTravelMiles: row.max_travel_miles,
          preferredShiftTypes: row.preferred_shift_types,
          preferredDays: row.preferred_days,
          existingShiftsOnDate: row.existing_shifts,
          isPreferredDay: (row.preferred_days || []).includes(dayOfWeek),
        },
      }));
  }

  /**
   * Get cross-pod activity summary for organization
   */
  async getActivitySummary(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM cross_pod_assignments
         WHERE organization_id = $1 AND status = 'active') AS active_assignments,
        (SELECT COUNT(*) FROM cross_pod_assignments
         WHERE organization_id = $1 AND status = 'pending') AS pending_assignments,
        (SELECT SUM(actual_hours_worked) FROM cross_pod_assignments
         WHERE organization_id = $1
           AND status IN ('active', 'completed')
           AND start_date >= DATE_TRUNC('month', CURRENT_DATE)) AS mtd_hours,
        (SELECT COUNT(*) FROM floating_caregiver_pool
         WHERE organization_id = $1 AND is_available = TRUE) AS available_floaters,
        (SELECT COUNT(DISTINCT caregiver_id) FROM cross_pod_assignments
         WHERE organization_id = $1
           AND status IN ('active', 'completed')
           AND start_date >= DATE_TRUNC('month', CURRENT_DATE)) AS caregivers_floated_mtd
    `,
      [organizationId]
    );

    const row = result.rows[0];

    // Get top floating caregivers
    const topFloaters = await db.query(
      `
      SELECT
        cg.id,
        cg.first_name || ' ' || cg.last_name AS name,
        fcp.total_float_hours,
        fcp.total_float_shifts,
        jsonb_array_length(fcp.pods_worked) AS pods_count
      FROM floating_caregiver_pool fcp
      JOIN caregivers cg ON cg.id = fcp.caregiver_id
      WHERE fcp.organization_id = $1
        AND fcp.total_float_shifts > 0
      ORDER BY fcp.total_float_hours DESC
      LIMIT 5
    `,
      [organizationId]
    );

    return {
      activeAssignments: parseInt(row.active_assignments) || 0,
      pendingAssignments: parseInt(row.pending_assignments) || 0,
      mtdHours: parseFloat(row.mtd_hours) || 0,
      availableFloaters: parseInt(row.available_floaters) || 0,
      caregiversFloatedMtd: parseInt(row.caregivers_floated_mtd) || 0,
      topFloaters: topFloaters.rows.map((r) => ({
        id: r.id,
        name: r.name,
        totalHours: parseFloat(r.total_float_hours) || 0,
        totalShifts: r.total_float_shifts,
        podsWorked: r.pods_count,
      })),
    };
  }
}

export const crossPodService = new CrossPodService();
