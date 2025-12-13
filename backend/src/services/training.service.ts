/**
 * Training Service
 * Handles training assignments, progress tracking, and compliance reporting
 * Supports Ohio-required training (CPR, HIPAA, EVV, etc.)
 *
 * @module services/training
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('training-service');

export interface TrainingType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  isRequired: boolean;
  requiredForRoles: string[];
  validityMonths?: number;
  deliveryMethod: string;
  requiresInPersonAssessment: boolean;
  durationMinutes?: number;
  passingScore?: number;
  externalProvider?: string;
  externalUrl?: string;
}

export interface TrainingAssignment {
  id: string;
  userId: string;
  userName: string;
  trainingTypeId: string;
  trainingCode: string;
  trainingName: string;
  category: string;
  status: string;
  dueDate: string;
  priority: string;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  expiresAt?: string;
  complianceStatus: string;
}

export interface TrainingComplianceReport {
  totalEmployees: number;
  compliantCount: number;
  nonCompliantCount: number;
  overdueCount: number;
  dueSoonCount: number;
  complianceRate: number;
  byCategory: Record<string, { compliant: number; total: number }>;
  byTraining: {
    code: string;
    name: string;
    compliant: number;
    overdue: number;
    pending: number;
    total: number;
  }[];
  overdueAssignments: TrainingAssignment[];
}

export class TrainingService {
  /**
   * Get all training types
   */
  async getTrainingTypes(organizationId: string): Promise<TrainingType[]> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT *
       FROM training_types
       WHERE (organization_id IS NULL OR organization_id = $1)
         AND is_active = true
       ORDER BY category, name`,
      [organizationId]
    );

    return result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      isRequired: row.is_required,
      requiredForRoles: row.required_for_roles || [],
      validityMonths: row.validity_months,
      deliveryMethod: row.delivery_method,
      requiresInPersonAssessment: row.requires_in_person_assessment,
      durationMinutes: row.duration_minutes,
      passingScore: row.passing_score,
      externalProvider: row.external_provider,
      externalUrl: row.external_url,
    }));
  }

  /**
   * Get training assignments for a user
   */
  async getUserAssignments(organizationId: string, userId: string): Promise<TrainingAssignment[]> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT
        ta.*,
        tt.code as training_code,
        tt.name as training_name,
        tt.category,
        u.first_name || ' ' || u.last_name as user_name,
        CASE
          WHEN ta.status = 'completed' AND (ta.expires_at IS NULL OR ta.expires_at > CURRENT_DATE) THEN 'compliant'
          WHEN ta.status = 'completed' AND ta.expires_at <= CURRENT_DATE THEN 'expired'
          WHEN ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived') THEN 'overdue'
          WHEN ta.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
          ELSE 'pending'
        END as compliance_status
       FROM training_assignments ta
       JOIN training_types tt ON tt.id = ta.training_type_id
       JOIN users u ON u.id = ta.user_id
       WHERE ta.organization_id = $1
         AND ta.user_id = $2
       ORDER BY
         CASE ta.status
           WHEN 'assigned' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'completed' THEN 3
           ELSE 4
         END,
         ta.due_date`,
      [organizationId, userId]
    );

    return result.rows.map(this.mapAssignment);
  }

  /**
   * Get all assignments for organization (admin view)
   */
  async getAllAssignments(
    organizationId: string,
    filters?: {
      status?: string;
      category?: string;
      overdue?: boolean;
      userId?: string;
    }
  ): Promise<TrainingAssignment[]> {
    const db = await getDbClient();
    let query = `
      SELECT
        ta.*,
        tt.code as training_code,
        tt.name as training_name,
        tt.category,
        u.first_name || ' ' || u.last_name as user_name,
        CASE
          WHEN ta.status = 'completed' AND (ta.expires_at IS NULL OR ta.expires_at > CURRENT_DATE) THEN 'compliant'
          WHEN ta.status = 'completed' AND ta.expires_at <= CURRENT_DATE THEN 'expired'
          WHEN ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived') THEN 'overdue'
          WHEN ta.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
          ELSE 'pending'
        END as compliance_status
       FROM training_assignments ta
       JOIN training_types tt ON tt.id = ta.training_type_id
       JOIN users u ON u.id = ta.user_id
       WHERE ta.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (filters?.status) {
      params.push(filters.status);
      query += ` AND ta.status = $${params.length}`;
    }

    if (filters?.category) {
      params.push(filters.category);
      query += ` AND tt.category = $${params.length}`;
    }

    if (filters?.overdue) {
      query += ` AND ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived')`;
    }

    if (filters?.userId) {
      params.push(filters.userId);
      query += ` AND ta.user_id = $${params.length}`;
    }

    query += ` ORDER BY ta.due_date, u.last_name`;

    const result = await db.query(query, params);
    return result.rows.map(this.mapAssignment);
  }

  /**
   * Assign training to a user
   */
  async assignTraining(
    organizationId: string,
    data: {
      userId: string;
      trainingTypeId: string;
      dueDate: string;
      priority?: string;
      notes?: string;
    },
    assignedBy: string
  ): Promise<TrainingAssignment> {
    const db = await getDbClient();

    // Check if already assigned and not expired
    const existing = await db.query(
      `SELECT id FROM training_assignments
       WHERE user_id = $1 AND training_type_id = $2
         AND status NOT IN ('expired', 'failed')`,
      [data.userId, data.trainingTypeId]
    );

    if (existing.rows.length > 0) {
      throw new Error('Training already assigned to this user');
    }

    const result = await db.query(
      `INSERT INTO training_assignments (
        organization_id, user_id, training_type_id, due_date,
        priority, notes, assigned_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        organizationId,
        data.userId,
        data.trainingTypeId,
        data.dueDate,
        data.priority || 'normal',
        data.notes,
        assignedBy,
      ]
    );

    logger.info('Training assigned', {
      assignmentId: result.rows[0].id,
      userId: data.userId,
      trainingTypeId: data.trainingTypeId,
      assignedBy,
    });

    return this.getAssignmentById(organizationId, result.rows[0].id);
  }

  /**
   * Bulk assign training to multiple users
   */
  async bulkAssignTraining(
    organizationId: string,
    data: {
      userIds: string[];
      trainingTypeId: string;
      dueDate: string;
      priority?: string;
    },
    assignedBy: string
  ): Promise<{ assigned: number; skipped: number }> {
    const db = await getDbClient();
    let assigned = 0;
    let skipped = 0;

    for (const userId of data.userIds) {
      try {
        // Check existing
        const existing = await db.query(
          `SELECT id FROM training_assignments
           WHERE user_id = $1 AND training_type_id = $2
             AND status NOT IN ('expired', 'failed')`,
          [userId, data.trainingTypeId]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        await db.query(
          `INSERT INTO training_assignments (
            organization_id, user_id, training_type_id, due_date,
            priority, assigned_by
           )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            organizationId,
            userId,
            data.trainingTypeId,
            data.dueDate,
            data.priority || 'normal',
            assignedBy,
          ]
        );
        assigned++;
      } catch (error) {
        logger.error('Failed to assign training to user', { userId, error });
        skipped++;
      }
    }

    logger.info('Bulk training assignment completed', {
      trainingTypeId: data.trainingTypeId,
      assigned,
      skipped,
      assignedBy,
    });

    return { assigned, skipped };
  }

  /**
   * Update assignment status (start, complete, etc.)
   */
  async updateAssignmentStatus(
    organizationId: string,
    assignmentId: string,
    data: {
      status: string;
      score?: number;
      notes?: string;
      verifiedBy?: string;
    }
  ): Promise<TrainingAssignment> {
    const db = await getDbClient();

    // Get training type for expiration calculation
    const assignmentResult = await db.query(
      `SELECT ta.*, tt.validity_months
       FROM training_assignments ta
       JOIN training_types tt ON tt.id = ta.training_type_id
       WHERE ta.id = $1 AND ta.organization_id = $2`,
      [assignmentId, organizationId]
    );

    if (assignmentResult.rows.length === 0) {
      throw new Error('Assignment not found');
    }

    const assignment = assignmentResult.rows[0];
    const updates: any = {
      status: data.status,
      updated_at: new Date(),
    };

    if (data.status === 'in_progress' && !assignment.started_at) {
      updates.started_at = new Date();
      updates.attempts = (assignment.attempts || 0) + 1;
    }

    if (data.status === 'completed') {
      updates.completed_at = new Date();
      if (data.score !== undefined) {
        updates.score = data.score;
      }
      // Calculate expiration if training has validity period
      if (assignment.validity_months) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + assignment.validity_months);
        updates.expires_at = expiresAt;
      }
      if (data.verifiedBy) {
        updates.verified_by = data.verifiedBy;
        updates.verified_at = new Date();
      }
    }

    if (data.notes) {
      updates.verification_notes = data.notes;
    }

    const setClause = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 3}`)
      .join(', ');
    const values = Object.values(updates);

    await db.query(
      `UPDATE training_assignments
       SET ${setClause}
       WHERE id = $1 AND organization_id = $2`,
      [assignmentId, organizationId, ...values]
    );

    logger.info('Training assignment updated', {
      assignmentId,
      newStatus: data.status,
    });

    return this.getAssignmentById(organizationId, assignmentId);
  }

  /**
   * Get training compliance report
   */
  async getComplianceReport(organizationId: string): Promise<TrainingComplianceReport> {
    const db = await getDbClient();

    // Get compliance status summary
    const statusResult = await db.query(
      `SELECT
        compliance_status,
        COUNT(DISTINCT user_id) as user_count
       FROM training_compliance_status
       WHERE organization_id = $1
         AND is_required = true
       GROUP BY compliance_status`,
      [organizationId]
    );

    const statusCounts: Record<string, number> = {};
    statusResult.rows.forEach(row => {
      statusCounts[row.compliance_status] = parseInt(row.user_count);
    });

    // Get total employees
    const employeeResult = await db.query(
      `SELECT COUNT(*) as count
       FROM users
       WHERE organization_id = $1 AND is_active = true AND role IN ('caregiver', 'nurse')`,
      [organizationId]
    );
    const totalEmployees = parseInt(employeeResult.rows[0].count);

    // Get by category
    const categoryResult = await db.query(
      `SELECT
        tt.category,
        COUNT(*) FILTER (WHERE tcs.compliance_status = 'compliant') as compliant,
        COUNT(*) as total
       FROM training_compliance_status tcs
       JOIN training_types tt ON tt.code = tcs.training_code
       WHERE tcs.organization_id = $1
         AND tt.is_required = true
       GROUP BY tt.category`,
      [organizationId]
    );

    const byCategory: Record<string, { compliant: number; total: number }> = {};
    categoryResult.rows.forEach(row => {
      byCategory[row.category] = {
        compliant: parseInt(row.compliant),
        total: parseInt(row.total),
      };
    });

    // Get by training
    const trainingResult = await db.query(
      `SELECT
        tcs.training_code as code,
        tcs.training_name as name,
        COUNT(*) FILTER (WHERE tcs.compliance_status = 'compliant') as compliant,
        COUNT(*) FILTER (WHERE tcs.compliance_status = 'overdue') as overdue,
        COUNT(*) FILTER (WHERE tcs.compliance_status IN ('pending', 'due_soon')) as pending,
        COUNT(*) as total
       FROM training_compliance_status tcs
       WHERE tcs.organization_id = $1
       GROUP BY tcs.training_code, tcs.training_name
       ORDER BY overdue DESC, tcs.training_name`,
      [organizationId]
    );

    const byTraining = trainingResult.rows.map(row => ({
      code: row.code,
      name: row.name,
      compliant: parseInt(row.compliant),
      overdue: parseInt(row.overdue),
      pending: parseInt(row.pending),
      total: parseInt(row.total),
    }));

    // Get overdue assignments
    const overdueAssignments = await this.getAllAssignments(organizationId, { overdue: true });

    const compliantCount = statusCounts['compliant'] || 0;
    const overdueCount = statusCounts['overdue'] || 0;
    const complianceRate = totalEmployees > 0
      ? Math.round((compliantCount / totalEmployees) * 100)
      : 0;

    return {
      totalEmployees,
      compliantCount,
      nonCompliantCount: totalEmployees - compliantCount,
      overdueCount,
      dueSoonCount: statusCounts['due_soon'] || 0,
      complianceRate,
      byCategory,
      byTraining,
      overdueAssignments: overdueAssignments.slice(0, 20), // Top 20
    };
  }

  /**
   * Get expiring training (needs renewal)
   */
  async getExpiringTraining(
    organizationId: string,
    daysAhead: number = 60
  ): Promise<TrainingAssignment[]> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT
        ta.*,
        tt.code as training_code,
        tt.name as training_name,
        tt.category,
        u.first_name || ' ' || u.last_name as user_name,
        'expiring' as compliance_status
       FROM training_assignments ta
       JOIN training_types tt ON tt.id = ta.training_type_id
       JOIN users u ON u.id = ta.user_id
       WHERE ta.organization_id = $1
         AND ta.status = 'completed'
         AND ta.expires_at IS NOT NULL
         AND ta.expires_at <= CURRENT_DATE + $2 * INTERVAL '1 day'
         AND ta.expires_at >= CURRENT_DATE
       ORDER BY ta.expires_at`,
      [organizationId, daysAhead]
    );

    return result.rows.map(this.mapAssignment);
  }

  /**
   * Get assignment by ID
   */
  private async getAssignmentById(organizationId: string, assignmentId: string): Promise<TrainingAssignment> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT
        ta.*,
        tt.code as training_code,
        tt.name as training_name,
        tt.category,
        u.first_name || ' ' || u.last_name as user_name,
        CASE
          WHEN ta.status = 'completed' AND (ta.expires_at IS NULL OR ta.expires_at > CURRENT_DATE) THEN 'compliant'
          WHEN ta.status = 'completed' AND ta.expires_at <= CURRENT_DATE THEN 'expired'
          WHEN ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived') THEN 'overdue'
          WHEN ta.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
          ELSE 'pending'
        END as compliance_status
       FROM training_assignments ta
       JOIN training_types tt ON tt.id = ta.training_type_id
       JOIN users u ON u.id = ta.user_id
       WHERE ta.id = $1 AND ta.organization_id = $2`,
      [assignmentId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Assignment not found');
    }

    return this.mapAssignment(result.rows[0]);
  }

  private mapAssignment(row: any): TrainingAssignment {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      trainingTypeId: row.training_type_id,
      trainingCode: row.training_code,
      trainingName: row.training_name,
      category: row.category,
      status: row.status,
      dueDate: row.due_date,
      priority: row.priority,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      score: row.score,
      expiresAt: row.expires_at,
      complianceStatus: row.compliance_status,
    };
  }
}

export const trainingService = new TrainingService();
