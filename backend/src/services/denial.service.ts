/**
 * Denial Management Service
 * Handles claim denial tracking, workflow, and resolution
 *
 * @module services/denial
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('denial-service');

interface DenialFilters {
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
  denialCode?: string;
  payerId?: string;
}

interface CreateDenialData {
  claimLineId: string;
  denialDate?: string;
  denialCode: string;
  denialReason?: string;
  denialCategory?: string;
  billedAmount?: number;
  deniedAmount: number;
  priority?: string;
  payerId?: string;
  remittanceId?: string;
}

interface UpdateDenialData {
  status?: string;
  priority?: string;
  assignedTo?: string;
  resolutionType?: string;
  resolutionNotes?: string;
  recoveryAmount?: number;
  appealDeadline?: string;
  appealReference?: string;
}

class DenialService {
  /**
   * Get denials with filters
   */
  async getDenials(
    organizationId: string,
    filters: DenialFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        cd.*,
        cl.claim_number,
        cl.service_date,
        cl.service_code,
        c.first_name || ' ' || c.last_name AS client_name,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_resolved.first_name || ' ' || u_resolved.last_name AS resolved_by_name,
        CASE
          WHEN cd.appeal_deadline IS NOT NULL AND cd.appeal_deadline < CURRENT_DATE AND cd.status NOT IN ('resolved', 'written_off')
            THEN 'appeal_expired'
          WHEN cd.appeal_deadline IS NOT NULL AND cd.appeal_deadline <= CURRENT_DATE + INTERVAL '7 days'
            THEN 'appeal_deadline_soon'
          WHEN cd.created_at < NOW() - INTERVAL '30 days' AND cd.status NOT IN ('resolved', 'written_off')
            THEN 'stale'
          ELSE 'normal'
        END AS urgency_status
      FROM claim_denials cd
      JOIN claim_lines cl ON cl.id = cd.claim_line_id
      JOIN claim_batches cb ON cb.id = cl.batch_id
      JOIN clients c ON c.id = cl.client_id
      LEFT JOIN users u_assigned ON u_assigned.id = cd.assigned_to
      LEFT JOIN users u_resolved ON u_resolved.id = cd.resolved_by
      WHERE cd.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND cd.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.category) {
      query += ` AND cd.denial_category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.priority) {
      query += ` AND cd.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters.assignedTo) {
      query += ` AND cd.assigned_to = $${paramIndex++}`;
      params.push(filters.assignedTo);
    }

    if (filters.fromDate) {
      query += ` AND cd.denial_date >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ` AND cd.denial_date <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    if (filters.denialCode) {
      query += ` AND cd.denial_code = $${paramIndex++}`;
      params.push(filters.denialCode);
    }

    query += ` ORDER BY
      CASE cd.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      cd.created_at DESC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single denial by ID
   */
  async getDenialById(
    denialId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const denialResult = await db.query(
      `
      SELECT
        cd.*,
        cl.claim_number,
        cl.service_date,
        cl.service_code,
        cl.units,
        cl.rate,
        cl.charge_amount,
        c.first_name || ' ' || c.last_name AS client_name,
        c.medicaid_number,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_resolved.first_name || ' ' || u_resolved.last_name AS resolved_by_name
      FROM claim_denials cd
      JOIN claim_lines cl ON cl.id = cd.claim_line_id
      JOIN claim_batches cb ON cb.id = cl.batch_id
      JOIN clients c ON c.id = cl.client_id
      LEFT JOIN users u_assigned ON u_assigned.id = cd.assigned_to
      LEFT JOIN users u_resolved ON u_resolved.id = cd.resolved_by
      WHERE cd.id = $1 AND cd.organization_id = $2
    `,
      [denialId, organizationId]
    );

    if (denialResult.rows.length === 0) {
      return null;
    }

    // Get action log
    const actionsResult = await db.query(
      `
      SELECT dal.*, u.first_name || ' ' || u.last_name AS performed_by_name
      FROM denial_action_log dal
      JOIN users u ON u.id = dal.performed_by
      WHERE dal.denial_id = $1
      ORDER BY dal.performed_at DESC
    `,
      [denialId]
    );

    return {
      ...denialResult.rows[0],
      actions: actionsResult.rows,
    };
  }

  /**
   * Create a new denial record
   */
  async createDenial(
    organizationId: string,
    data: CreateDenialData
  ): Promise<any> {
    const db = await getDbClient();

    // Categorize denial if not provided
    const category = data.denialCategory || this.categorizeDenial(data.denialCode);

    const result = await db.query(
      `
      INSERT INTO claim_denials (
        organization_id,
        claim_line_id,
        denial_date,
        denial_code,
        denial_reason,
        denial_category,
        billed_amount,
        denied_amount,
        priority,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
      RETURNING *
    `,
      [
        organizationId,
        data.claimLineId,
        data.denialDate,
        data.denialCode,
        data.denialReason,
        category,
        data.billedAmount,
        data.deniedAmount,
        data.priority || 'normal',
      ]
    );

    logger.info('Denial created', {
      denialId: result.rows[0].id,
      code: data.denialCode,
      amount: data.deniedAmount,
    });

    return result.rows[0];
  }

  /**
   * Update a denial
   */
  async updateDenial(
    denialId: string,
    organizationId: string,
    data: UpdateDenialData,
    userId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const existing = await this.getDenialById(denialId, organizationId);
    if (!existing) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      priority: 'priority',
      assignedTo: 'assigned_to',
      resolutionType: 'resolution_type',
      resolutionNotes: 'resolution_notes',
      recoveryAmount: 'recovery_amount',
      appealDeadline: 'appeal_deadline',
      appealReference: 'appeal_reference',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof UpdateDenialData] !== undefined) {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(data[key as keyof UpdateDenialData]);
      }
    }

    // Handle special cases
    if (data.status === 'resolved' || data.status === 'written_off') {
      fields.push(`resolved_at = NOW()`);
      fields.push(`resolved_by = $${paramIndex++}`);
      values.push(userId);
    }

    if (data.assignedTo && !existing.assigned_at) {
      fields.push(`assigned_at = NOW()`);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = NOW()');
    values.push(denialId, organizationId);

    const result = await db.query(
      `
      UPDATE claim_denials
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    // Log the action
    await this.logAction(denialId, 'updated', { changes: data }, userId);

    return result.rows[0];
  }

  /**
   * Assign denial to user
   */
  async assignDenial(
    denialId: string,
    organizationId: string,
    assignToUserId: string,
    assignedBy: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE claim_denials
      SET assigned_to = $1,
          assigned_at = NOW(),
          status = CASE WHEN status = 'new' THEN 'under_review' ELSE status END,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [assignToUserId, denialId, organizationId]
    );

    if (result.rows[0]) {
      await this.logAction(denialId, 'assigned', { assignedTo: assignToUserId }, assignedBy);
    }

    return result.rows[0] || null;
  }

  /**
   * File an appeal
   */
  async fileAppeal(
    denialId: string,
    organizationId: string,
    appealData: {
      appealReference?: string;
      appealDeadline?: string;
      notes?: string;
    },
    userId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE claim_denials
      SET status = 'appealing',
          appeal_submitted_at = NOW(),
          appeal_reference = $1,
          appeal_deadline = $2,
          resolution_notes = COALESCE(resolution_notes || E'\n', '') || $3,
          updated_at = NOW()
      WHERE id = $4 AND organization_id = $5
      RETURNING *
    `,
      [
        appealData.appealReference,
        appealData.appealDeadline,
        appealData.notes || 'Appeal filed',
        denialId,
        organizationId,
      ]
    );

    if (result.rows[0]) {
      await this.logAction(denialId, 'appeal_filed', appealData, userId);
      logger.info('Appeal filed', { denialId, reference: appealData.appealReference });
    }

    return result.rows[0] || null;
  }

  /**
   * Resolve a denial
   */
  async resolveDenial(
    denialId: string,
    organizationId: string,
    resolution: {
      resolutionType: string;
      resolutionNotes?: string;
      recoveryAmount?: number;
    },
    userId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE claim_denials
      SET status = 'resolved',
          resolution_type = $1,
          resolution_notes = $2,
          recovery_amount = $3,
          resolved_at = NOW(),
          resolved_by = $4,
          updated_at = NOW()
      WHERE id = $5 AND organization_id = $6
      RETURNING *
    `,
      [
        resolution.resolutionType,
        resolution.resolutionNotes,
        resolution.recoveryAmount || 0,
        userId,
        denialId,
        organizationId,
      ]
    );

    if (result.rows[0]) {
      await this.logAction(denialId, 'resolved', resolution, userId);
      logger.info('Denial resolved', {
        denialId,
        type: resolution.resolutionType,
        recovered: resolution.recoveryAmount,
      });
    }

    return result.rows[0] || null;
  }

  /**
   * Write off a denial
   */
  async writeOffDenial(
    denialId: string,
    organizationId: string,
    reason: string,
    userId: string
  ): Promise<any | null> {
    return this.resolveDenial(
      denialId,
      organizationId,
      {
        resolutionType: 'written_off',
        resolutionNotes: `Written off: ${reason}`,
        recoveryAmount: 0,
      },
      userId
    );
  }

  /**
   * Get denial statistics
   */
  async getDenialStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_denials,
        COUNT(*) FILTER (WHERE status = 'new') AS new_count,
        COUNT(*) FILTER (WHERE status = 'under_review') AS under_review_count,
        COUNT(*) FILTER (WHERE status IN ('correcting', 'resubmitting')) AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'appealing') AS appealing_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'written_off') AS written_off_count,
        SUM(denied_amount) AS total_denied_amount,
        SUM(COALESCE(recovery_amount, 0)) AS total_recovered_amount,
        ROUND(
          (SUM(COALESCE(recovery_amount, 0)) / NULLIF(SUM(denied_amount), 0)) * 100,
          1
        ) AS recovery_rate,
        COUNT(*) FILTER (
          WHERE appeal_deadline IS NOT NULL
            AND appeal_deadline <= CURRENT_DATE + INTERVAL '7 days'
            AND status NOT IN ('resolved', 'written_off')
        ) AS appeals_deadline_soon,
        COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_count,
        COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count
      FROM claim_denials
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    // Get by category
    const categoryResult = await db.query(
      `SELECT * FROM denial_summary WHERE organization_id = $1`,
      [organizationId]
    );

    return {
      ...result.rows[0],
      byCategory: categoryResult.rows,
    };
  }

  /**
   * Get denials needing attention
   */
  async getDenialsNeedingAttention(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cd.*,
        cl.claim_number,
        c.first_name || ' ' || c.last_name AS client_name,
        CASE
          WHEN cd.appeal_deadline IS NOT NULL AND cd.appeal_deadline < CURRENT_DATE THEN 'Appeal deadline passed'
          WHEN cd.appeal_deadline IS NOT NULL AND cd.appeal_deadline <= CURRENT_DATE + INTERVAL '7 days' THEN 'Appeal deadline in 7 days'
          WHEN cd.status = 'new' AND cd.created_at < NOW() - INTERVAL '7 days' THEN 'Unassigned for 7+ days'
          WHEN cd.priority = 'urgent' THEN 'Urgent priority'
          ELSE NULL
        END AS attention_reason
      FROM claim_denials cd
      JOIN claim_lines cl ON cl.id = cd.claim_line_id
      JOIN clients c ON c.id = cl.client_id
      WHERE cd.organization_id = $1
        AND cd.status NOT IN ('resolved', 'written_off')
        AND (
          (cd.appeal_deadline IS NOT NULL AND cd.appeal_deadline <= CURRENT_DATE + INTERVAL '7 days')
          OR (cd.status = 'new' AND cd.created_at < NOW() - INTERVAL '7 days')
          OR cd.priority = 'urgent'
        )
      ORDER BY
        CASE
          WHEN cd.appeal_deadline IS NOT NULL AND cd.appeal_deadline < CURRENT_DATE THEN 1
          WHEN cd.priority = 'urgent' THEN 2
          ELSE 3
        END,
        cd.created_at
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Log an action on a denial
   */
  private async logAction(
    denialId: string,
    actionType: string,
    details: any,
    userId: string
  ): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `
      INSERT INTO denial_action_log (denial_id, action_type, action_details, performed_by)
      VALUES ($1, $2, $3, $4)
    `,
      [denialId, actionType, JSON.stringify(details), userId]
    );
  }

  /**
   * Categorize denial based on code
   */
  private categorizeDenial(code: string): string {
    const codeCategories: Record<string, string[]> = {
      eligibility: ['CO-4', 'CO-27', 'CO-32'],
      authorization: ['CO-15', 'CO-55', 'CO-197'],
      timely_filing: ['CO-29'],
      duplicate: ['CO-18', 'CO-19'],
      coding: ['CO-4', 'CO-16', 'CO-96'],
      documentation: ['CO-16', 'CO-252'],
      evv: ['CO-B5', 'CO-B16'],
      coordination_of_benefits: ['CO-22', 'CO-23', 'CO-24'],
    };

    for (const [category, codes] of Object.entries(codeCategories)) {
      if (codes.some((c) => code.includes(c))) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Get denial dashboard with all key metrics
   */
  async getDenialDashboard(organizationId: string): Promise<any> {
    const [stats, needingAttention, byCategory, byPayer] = await Promise.all([
      this.getDenialStats(organizationId),
      this.getDenialsNeedingAttention(organizationId),
      this.getDenialsByCode(organizationId),
      this.getDenialsByPayer(organizationId),
    ]);

    return {
      stats,
      needingAttention: {
        items: needingAttention,
        count: needingAttention.length,
      },
      byCategory,
      byPayer,
    };
  }

  /**
   * Update denial status with logging
   */
  async updateDenialStatus(
    denialId: string,
    organizationId: string,
    status: string,
    userId: string,
    notes?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE claim_denials
      SET status = $1,
          resolution_notes = CASE WHEN $4 IS NOT NULL THEN COALESCE(resolution_notes || E'\n', '') || $4 ELSE resolution_notes END,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [status, denialId, organizationId, notes]
    );

    if (result.rows[0]) {
      await this.logAction(denialId, 'status_changed', { status, notes }, userId);
    }

    return result.rows[0] || null;
  }

  /**
   * Add a note to a denial
   */
  async addNote(
    denialId: string,
    organizationId: string,
    userId: string,
    note: string
  ): Promise<any | null> {
    const db = await getDbClient();

    // Check denial exists
    const check = await db.query(
      `SELECT id FROM claim_denials WHERE id = $1 AND organization_id = $2`,
      [denialId, organizationId]
    );

    if (check.rows.length === 0) {
      return null;
    }

    // Add action log entry
    const result = await db.query(
      `
      INSERT INTO denial_action_log (denial_id, action_type, action_details, performed_by)
      VALUES ($1, 'note_added', $2, $3)
      RETURNING *
    `,
      [denialId, JSON.stringify({ note }), userId]
    );

    return result.rows[0];
  }

  /**
   * Set priority for a denial
   */
  async setPriority(
    denialId: string,
    organizationId: string,
    userId: string,
    priority: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE claim_denials
      SET priority = $1,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [priority, denialId, organizationId]
    );

    if (result.rows[0]) {
      await this.logAction(denialId, 'priority_changed', { priority }, userId);
    }

    return result.rows[0] || null;
  }

  /**
   * Get denials grouped by code
   */
  async getDenialsByCode(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        denial_code,
        denial_category,
        COUNT(*) AS count,
        SUM(denied_amount) AS total_denied,
        SUM(COALESCE(recovery_amount, 0)) AS total_recovered,
        ROUND(
          (SUM(COALESCE(recovery_amount, 0)) / NULLIF(SUM(denied_amount), 0)) * 100,
          1
        ) AS recovery_rate,
        COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'written_off')) AS open_count
      FROM claim_denials
      WHERE organization_id = $1
      GROUP BY denial_code, denial_category
      ORDER BY count DESC
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get denials grouped by payer
   */
  async getDenialsByPayer(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        cb.payer_id,
        cb.payer_name,
        COUNT(cd.id) AS denial_count,
        SUM(cd.denied_amount) AS total_denied,
        SUM(COALESCE(cd.recovery_amount, 0)) AS total_recovered,
        ROUND(
          (SUM(COALESCE(cd.recovery_amount, 0)) / NULLIF(SUM(cd.denied_amount), 0)) * 100,
          1
        ) AS recovery_rate,
        COUNT(cd.id) FILTER (WHERE cd.status NOT IN ('resolved', 'written_off')) AS open_count,
        COUNT(cl.id) AS total_claims,
        ROUND(
          (COUNT(cd.id)::DECIMAL / NULLIF(COUNT(cl.id), 0)) * 100,
          1
        ) AS denial_rate
      FROM claim_lines cl
      JOIN claim_batches cb ON cb.id = cl.batch_id
      LEFT JOIN claim_denials cd ON cd.claim_line_id = cl.id
      WHERE cb.organization_id = $1
        AND cl.status IN ('submitted', 'accepted', 'rejected', 'denied', 'paid')
      GROUP BY cb.payer_id, cb.payer_name
      HAVING COUNT(cd.id) > 0
      ORDER BY denial_count DESC
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get denial trend over time
   */
  async getDenialTrend(organizationId: string, days: number = 30): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        DATE_TRUNC('day', denial_date) AS date,
        COUNT(*) AS denial_count,
        SUM(denied_amount) AS total_denied,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        SUM(COALESCE(recovery_amount, 0)) AS total_recovered
      FROM claim_denials
      WHERE organization_id = $1
        AND denial_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL
      GROUP BY DATE_TRUNC('day', denial_date)
      ORDER BY date
    `,
      [organizationId, days]
    );

    return result.rows;
  }
}

export const denialService = new DenialService();
