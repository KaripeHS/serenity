/**
 * Onboarding Service
 * Manages onboarding checklists, templates, and progress tracking
 *
 * @module services/onboarding
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('onboarding-service');

interface OnboardingFilters {
  status?: string;
  positionTitle?: string;
  mentorId?: string;
  supervisorId?: string;
  fromStartDate?: string;
  toStartDate?: string;
  healthStatus?: string;
}

interface CreateOnboardingData {
  templateId?: string;
  employeeId?: string;
  caregiverId?: string;
  applicantId?: string;
  newHireName?: string;
  positionTitle: string;
  department?: string;
  startDate: string;
  mentorId?: string;
  supervisorId?: string;
  hrContactId?: string;
  customItems?: Array<{
    category: string;
    taskName: string;
    description?: string;
    isRequired?: boolean;
    dueDate?: string;
    assignedTo?: string;
    assignedRole?: string;
    requiresDocument?: boolean;
  }>;
}

interface UpdateOnboardingItemData {
  status?: string;
  completionNotes?: string;
  documentUrl?: string;
}

class OnboardingService {
  /**
   * Get onboarding templates
   */
  async getTemplates(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        ot.*,
        u.first_name || ' ' || u.last_name AS created_by_name,
        jsonb_array_length(ot.items) AS item_count
      FROM onboarding_templates ot
      LEFT JOIN users u ON u.id = ot.created_by
      WHERE ot.organization_id = $1 AND ot.is_active = TRUE
      ORDER BY ot.template_name
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(
    templateId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        ot.*,
        u.first_name || ' ' || u.last_name AS created_by_name
      FROM onboarding_templates ot
      LEFT JOIN users u ON u.id = ot.created_by
      WHERE ot.id = $1 AND ot.organization_id = $2
    `,
      [templateId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new onboarding template
   */
  async createTemplate(
    organizationId: string,
    data: {
      templateName: string;
      description?: string;
      positionTypes?: string[];
      employmentTypes?: string[];
      items: any[];
      defaultDurationDays?: number;
    },
    createdBy: string
  ): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO onboarding_templates (
        organization_id,
        template_name,
        description,
        position_types,
        employment_types,
        items,
        default_duration_days,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        organizationId,
        data.templateName,
        data.description,
        data.positionTypes || [],
        data.employmentTypes || [],
        JSON.stringify(data.items),
        data.defaultDurationDays || 30,
        createdBy,
      ]
    );

    logger.info('Onboarding template created', {
      templateId: result.rows[0].id,
      name: data.templateName,
    });

    return result.rows[0];
  }

  /**
   * Get onboarding instances with filters
   */
  async getOnboardingInstances(
    organizationId: string,
    filters: OnboardingFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT * FROM onboarding_dashboard
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.positionTitle) {
      query += ` AND position_title ILIKE $${paramIndex++}`;
      params.push(`%${filters.positionTitle}%`);
    }

    if (filters.healthStatus) {
      query += ` AND health_status = $${paramIndex++}`;
      params.push(filters.healthStatus);
    }

    if (filters.fromStartDate) {
      query += ` AND start_date >= $${paramIndex++}`;
      params.push(filters.fromStartDate);
    }

    if (filters.toStartDate) {
      query += ` AND start_date <= $${paramIndex++}`;
      params.push(filters.toStartDate);
    }

    query += ` ORDER BY start_date DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get a single onboarding instance by ID
   */
  async getOnboardingById(
    onboardingId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const instanceResult = await db.query(
      `
      SELECT
        oi.*,
        ot.template_name,
        u_mentor.first_name || ' ' || u_mentor.last_name AS mentor_name,
        u_super.first_name || ' ' || u_super.last_name AS supervisor_name,
        u_hr.first_name || ' ' || u_hr.last_name AS hr_contact_name
      FROM onboarding_instances oi
      LEFT JOIN onboarding_templates ot ON ot.id = oi.template_id
      LEFT JOIN users u_mentor ON u_mentor.id = oi.mentor_id
      LEFT JOIN users u_super ON u_super.id = oi.supervisor_id
      LEFT JOIN users u_hr ON u_hr.id = oi.hr_contact_id
      WHERE oi.id = $1 AND oi.organization_id = $2
    `,
      [onboardingId, organizationId]
    );

    if (instanceResult.rows.length === 0) {
      return null;
    }

    const instance = instanceResult.rows[0];

    // Get items
    const itemsResult = await db.query(
      `
      SELECT
        item.*,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_completed.first_name || ' ' || u_completed.last_name AS completed_by_name,
        u_verified.first_name || ' ' || u_verified.last_name AS verified_by_name
      FROM onboarding_items item
      LEFT JOIN users u_assigned ON u_assigned.id = item.assigned_to
      LEFT JOIN users u_completed ON u_completed.id = item.completed_by
      LEFT JOIN users u_verified ON u_verified.id = item.verified_by
      WHERE item.onboarding_instance_id = $1
      ORDER BY item.item_order
    `,
      [onboardingId]
    );

    return {
      ...instance,
      items: itemsResult.rows,
    };
  }

  /**
   * Create a new onboarding instance
   */
  async createOnboarding(
    organizationId: string,
    data: CreateOnboardingData,
    createdBy: string
  ): Promise<any> {
    const db = await getDbClient();

    // Validate that exactly one subject is provided
    const subjectCount =
      (data.employeeId ? 1 : 0) +
      (data.caregiverId ? 1 : 0) +
      (data.applicantId ? 1 : 0);

    if (subjectCount !== 1) {
      throw new Error('Exactly one of employeeId, caregiverId, or applicantId must be provided');
    }

    // Get new hire name if not provided
    let newHireName = data.newHireName;
    if (!newHireName) {
      if (data.employeeId) {
        const emp = await db.query(
          `SELECT first_name || ' ' || last_name AS name FROM employees WHERE id = $1`,
          [data.employeeId]
        );
        newHireName = emp.rows[0]?.name;
      } else if (data.caregiverId) {
        const cg = await db.query(
          `SELECT first_name || ' ' || last_name AS name FROM caregivers WHERE id = $1`,
          [data.caregiverId]
        );
        newHireName = cg.rows[0]?.name;
      } else if (data.applicantId) {
        const app = await db.query(
          `SELECT first_name || ' ' || last_name AS name FROM applicants WHERE id = $1`,
          [data.applicantId]
        );
        newHireName = app.rows[0]?.name;
      }
    }

    if (!newHireName) {
      throw new Error('Could not determine new hire name');
    }

    // If template provided, use the function
    if (data.templateId) {
      const result = await db.query(
        `
        SELECT create_onboarding_from_template(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) AS onboarding_id
      `,
        [
          organizationId,
          data.templateId,
          data.employeeId,
          data.caregiverId,
          data.applicantId,
          newHireName,
          data.positionTitle,
          data.startDate,
          data.mentorId,
          data.supervisorId,
          createdBy,
        ]
      );

      const onboardingId = result.rows[0].onboarding_id;

      // Update HR contact if provided
      if (data.hrContactId) {
        await db.query(
          `UPDATE onboarding_instances SET hr_contact_id = $1 WHERE id = $2`,
          [data.hrContactId, onboardingId]
        );
      }

      logger.info('Onboarding created from template', {
        onboardingId,
        templateId: data.templateId,
        newHireName,
      });

      return this.getOnboardingById(onboardingId, organizationId);
    }

    // Otherwise create without template
    const targetDate = new Date(data.startDate);
    targetDate.setDate(targetDate.getDate() + 30);

    const instanceResult = await db.query(
      `
      INSERT INTO onboarding_instances (
        organization_id,
        employee_id,
        caregiver_id,
        applicant_id,
        new_hire_name,
        position_title,
        department,
        start_date,
        target_completion_date,
        mentor_id,
        supervisor_id,
        hr_contact_id,
        status,
        total_items,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'not_started', $13, $14)
      RETURNING *
    `,
      [
        organizationId,
        data.employeeId,
        data.caregiverId,
        data.applicantId,
        newHireName,
        data.positionTitle,
        data.department,
        data.startDate,
        targetDate.toISOString().split('T')[0],
        data.mentorId,
        data.supervisorId,
        data.hrContactId,
        data.customItems?.length || 0,
        createdBy,
      ]
    );

    const onboardingId = instanceResult.rows[0].id;

    // Add custom items if provided
    if (data.customItems && data.customItems.length > 0) {
      for (let i = 0; i < data.customItems.length; i++) {
        const item = data.customItems[i];
        await db.query(
          `
          INSERT INTO onboarding_items (
            onboarding_instance_id,
            item_order,
            category,
            task_name,
            description,
            is_required,
            due_date,
            assigned_to,
            assigned_role,
            requires_document,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        `,
          [
            onboardingId,
            i + 1,
            item.category,
            item.taskName,
            item.description,
            item.isRequired !== false,
            item.dueDate,
            item.assignedTo,
            item.assignedRole,
            item.requiresDocument || false,
          ]
        );
      }
    }

    logger.info('Onboarding created', {
      onboardingId,
      newHireName,
      itemCount: data.customItems?.length || 0,
    });

    return this.getOnboardingById(onboardingId, organizationId);
  }

  /**
   * Update an onboarding item
   */
  async updateItem(
    itemId: string,
    organizationId: string,
    data: UpdateOnboardingItemData,
    userId?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    // Verify item belongs to organization
    const itemCheck = await db.query(
      `
      SELECT item.*, oi.organization_id
      FROM onboarding_items item
      JOIN onboarding_instances oi ON oi.id = item.onboarding_instance_id
      WHERE item.id = $1 AND oi.organization_id = $2
    `,
      [itemId, organizationId]
    );

    if (itemCheck.rows.length === 0) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);

      if (data.status === 'completed') {
        fields.push(`completed_at = NOW()`);
        if (userId) {
          fields.push(`completed_by = $${paramIndex++}`);
          values.push(userId);
        }
      }
    }

    if (data.completionNotes) {
      fields.push(`completion_notes = $${paramIndex++}`);
      values.push(data.completionNotes);
    }

    if (data.documentUrl) {
      fields.push(`document_url = $${paramIndex++}`);
      values.push(data.documentUrl);
    }

    if (fields.length === 0) {
      return itemCheck.rows[0];
    }

    fields.push('updated_at = NOW()');
    values.push(itemId);

    const result = await db.query(
      `
      UPDATE onboarding_items
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0];
  }

  /**
   * Complete an onboarding item
   */
  async completeItem(
    itemId: string,
    organizationId: string,
    completedBy: string,
    notes?: string,
    documentUrl?: string
  ): Promise<any | null> {
    return this.updateItem(
      itemId,
      organizationId,
      {
        status: 'completed',
        completionNotes: notes,
        documentUrl,
      },
      completedBy
    );
  }

  /**
   * Skip an onboarding item
   */
  async skipItem(
    itemId: string,
    organizationId: string,
    reason: string,
    skippedBy: string
  ): Promise<any | null> {
    const db = await getDbClient();

    // Verify and check if required
    const itemCheck = await db.query(
      `
      SELECT item.*, oi.organization_id
      FROM onboarding_items item
      JOIN onboarding_instances oi ON oi.id = item.onboarding_instance_id
      WHERE item.id = $1 AND oi.organization_id = $2
    `,
      [itemId, organizationId]
    );

    if (itemCheck.rows.length === 0) {
      return null;
    }

    if (itemCheck.rows[0].is_required) {
      throw new Error('Cannot skip a required item');
    }

    const result = await db.query(
      `
      UPDATE onboarding_items
      SET status = 'skipped',
          completion_notes = $1,
          completed_by = $2,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `,
      [`Skipped: ${reason}`, skippedBy, itemId]
    );

    return result.rows[0];
  }

  /**
   * Verify a document for an onboarding item
   */
  async verifyDocument(
    itemId: string,
    organizationId: string,
    verifiedBy: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE onboarding_items
      SET document_verified = TRUE,
          verified_by = $1,
          verified_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
        AND EXISTS (
          SELECT 1 FROM onboarding_instances oi
          WHERE oi.id = onboarding_items.onboarding_instance_id
            AND oi.organization_id = $3
        )
      RETURNING *
    `,
      [verifiedBy, itemId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update onboarding status
   */
  async updateOnboardingStatus(
    onboardingId: string,
    organizationId: string,
    status: string,
    completedBy?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE onboarding_instances
      SET status = $1,
          completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
          completed_by = CASE WHEN $1 = 'completed' THEN $2 ELSE completed_by END,
          updated_at = NOW()
      WHERE id = $3 AND organization_id = $4
      RETURNING *
    `,
      [status, completedBy, onboardingId, organizationId]
    );

    if (result.rows[0]) {
      logger.info('Onboarding status updated', {
        onboardingId,
        status,
        completedBy,
      });
    }

    return result.rows[0] || null;
  }

  /**
   * Get onboarding statistics
   */
  async getOnboardingStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_onboardings,
        COUNT(*) FILTER (WHERE status = 'not_started') AS not_started,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'on_hold') AS on_hold,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        ROUND(AVG(completion_percentage), 1) FILTER (WHERE status = 'in_progress') AS avg_progress,
        COUNT(*) FILTER (WHERE target_completion_date < CURRENT_DATE AND status != 'completed') AS overdue,
        COUNT(*) FILTER (
          WHERE target_completion_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            AND status != 'completed'
        ) AS ending_soon,
        COUNT(*) FILTER (WHERE start_date = CURRENT_DATE) AS starting_today,
        COUNT(*) FILTER (
          WHERE start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ) AS starting_this_week
      FROM onboarding_instances
      WHERE organization_id = $1
    `,
      [organizationId]
    );

    return result.rows[0];
  }

  /**
   * Get items by category for an onboarding instance
   */
  async getItemsByCategory(
    onboardingId: string,
    organizationId: string
  ): Promise<Record<string, any[]>> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        item.*,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name
      FROM onboarding_items item
      JOIN onboarding_instances oi ON oi.id = item.onboarding_instance_id
      LEFT JOIN users u_assigned ON u_assigned.id = item.assigned_to
      WHERE item.onboarding_instance_id = $1 AND oi.organization_id = $2
      ORDER BY item.category, item.item_order
    `,
      [onboardingId, organizationId]
    );

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const item of result.rows) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push(item);
    }

    return byCategory;
  }

  /**
   * Get pending items for a user
   */
  async getPendingItemsForUser(
    userId: string,
    organizationId: string
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        item.*,
        oi.new_hire_name,
        oi.position_title,
        oi.start_date
      FROM onboarding_items item
      JOIN onboarding_instances oi ON oi.id = item.onboarding_instance_id
      WHERE item.assigned_to = $1
        AND oi.organization_id = $2
        AND item.status IN ('pending', 'in_progress')
        AND oi.status NOT IN ('completed', 'cancelled')
      ORDER BY item.due_date ASC NULLS LAST, oi.start_date DESC
    `,
      [userId, organizationId]
    );

    return result.rows;
  }

  /**
   * Add a note to onboarding
   */
  async addNote(
    onboardingId: string,
    organizationId: string,
    note: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE onboarding_instances
      SET notes = CASE
        WHEN notes IS NULL THEN $1
        ELSE notes || E'\n---\n' || $1
      END,
      updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [note, onboardingId, organizationId]
    );

    return result.rows[0] || null;
  }
}

export const onboardingService = new OnboardingService();
