/**
 * Approval Workflow Engine
 * Manages multi-step approval workflows with routing rules
 *
 * Features:
 * - Configurable approval chains
 * - Conditional routing based on amounts/criteria
 * - Escalation on timeout
 * - Parallel vs sequential approvals
 * - Auto-approval rules
 * - Delegation support
 */

import { pool } from '../../config/database';
import { websocketService } from '../realtime/websocket.service';


import { createLogger } from '../../utils/logger';

const logger = createLogger('approval-workflow');
interface WorkflowDefinition {
  id: string;
  name: string;
  entityType: 'expense' | 'pto' | 'schedule_change' | 'incident' | 'invoice' | 'purchase_order';
  steps: WorkflowStep[];
  autoApprovalRules?: AutoApprovalRule[];
}

interface WorkflowStep {
  stepNumber: number;
  approverRole?: string;
  approverUserId?: string;
  approvalType: 'any' | 'all' | 'majority';
  escalationHours?: number;
  escalateToRole?: string;
  conditions?: Array<{
    field: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains';
    value: any;
  }>;
}

interface AutoApprovalRule {
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  maxAmount?: number;
}

interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
  currentStep: number;
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  data: any;
}

export class ApprovalWorkflowService {
  /**
   * Start approval workflow for entity
   */
  async startWorkflow(
    organizationId: string,
    entityType: WorkflowDefinition['entityType'],
    entityId: string,
    requestedBy: string,
    data: any
  ): Promise<{ workflowId: string; autoApproved: boolean } | null> {
    try {
      // Get workflow definition for entity type
      const definition = await this.getWorkflowDefinition(organizationId, entityType);

      if (!definition) {
        throw new Error(`No workflow defined for ${entityType}`);
      }

      // Check auto-approval rules
      if (definition.autoApprovalRules && definition.autoApprovalRules.length > 0) {
        const autoApproved = this.checkAutoApproval(definition.autoApprovalRules, data);

        if (autoApproved) {
          await this.autoApprove(organizationId, entityType, entityId, requestedBy);
          return { workflowId: '', autoApproved: true };
        }
      }

      // Create workflow instance
      const workflowResult = await pool.query(
        `
        INSERT INTO workflow_instances (
          organization_id,
          workflow_definition_id,
          entity_type,
          entity_id,
          status,
          current_step,
          requested_by,
          requested_at,
          data
        ) VALUES ($1, $2, $3, $4, 'pending', 1, $5, NOW(), $6)
        RETURNING id
        `,
        [
          organizationId,
          definition.id,
          entityType,
          entityId,
          requestedBy,
          JSON.stringify(data)
        ]
      );

      const workflowId = workflowResult.rows[0].id;

      // Route to first step
      await this.routeToStep(workflowId, definition, 1, data);

      return { workflowId, autoApproved: false };
    } catch (error) {
      logger.error('[ApprovalWorkflow] Error starting workflow:', error);
      return null;
    }
  }

  /**
   * Route workflow to specific step
   */
  private async routeToStep(
    workflowId: string,
    definition: WorkflowDefinition,
    stepNumber: number,
    data: any
  ): Promise<void> {
    const step = definition.steps.find(s => s.stepNumber === stepNumber);

    if (!step) {
      throw new Error(`Step ${stepNumber} not found in workflow`);
    }

    // Check step conditions
    if (step.conditions && step.conditions.length > 0) {
      const conditionsMet = this.evaluateConditions(step.conditions, data);

      if (!conditionsMet) {
        // Skip this step, move to next
        const nextStep = stepNumber + 1;
        if (nextStep <= definition.steps.length) {
          await this.routeToStep(workflowId, definition, nextStep, data);
        } else {
          // No more steps, auto-approve
          await this.completeWorkflow(workflowId, 'approved');
        }
        return;
      }
    }

    // Determine approvers
    const approvers = await this.getStepApprovers(workflowId, step);

    // Create approval tasks
    for (const approverId of approvers) {
      await pool.query(
        `
        INSERT INTO approval_tasks (
          workflow_instance_id,
          step_number,
          approver_id,
          status,
          due_date,
          created_at
        ) VALUES ($1, $2, $3, 'pending', $4, NOW())
        `,
        [
          workflowId,
          stepNumber,
          approverId,
          step.escalationHours
            ? new Date(Date.now() + step.escalationHours * 60 * 60 * 1000)
            : null
        ]
      );

      // Send notification
      await this.notifyApprover(workflowId, approverId, definition.entityType);
    }
  }

  /**
   * Get approvers for workflow step
   */
  private async getStepApprovers(
    workflowId: string,
    step: WorkflowStep
  ): Promise<string[]> {
    // Get workflow details
    const workflowResult = await pool.query(
      'SELECT * FROM workflow_instances WHERE id = $1',
      [workflowId]
    );

    if (workflowResult.rows.length === 0) {
      throw new Error('Workflow not found');
    }

    const workflow = workflowResult.rows[0];

    // If specific user specified
    if (step.approverUserId) {
      return [step.approverUserId];
    }

    // If role specified
    if (step.approverRole) {
      const result = await pool.query(
        `
        SELECT id FROM users
        WHERE organization_id = $1
          AND role = $2
          AND active = true
        `,
        [workflow.organization_id, step.approverRole]
      );

      return result.rows.map(r => r.id);
    }

    return [];
  }

  /**
   * Process approval/rejection
   */
  async processApproval(
    taskId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<{ completed: boolean; finalStatus?: string }> {
    try {
      // Get task details
      const taskResult = await pool.query(
        `
        SELECT
          at.*,
          wi.workflow_definition_id,
          wi.current_step,
          wi.data,
          wi.organization_id
        FROM approval_tasks at
        JOIN workflow_instances wi ON at.workflow_instance_id = wi.id
        WHERE at.id = $1
        `,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Approval task not found');
      }

      const task = taskResult.rows[0];

      // Verify approver
      if (task.approver_id !== approverId) {
        throw new Error('Unauthorized approver');
      }

      // Update task
      await pool.query(
        `
        UPDATE approval_tasks
        SET status = $1,
            decision = $2,
            comments = $3,
            decided_at = NOW()
        WHERE id = $4
        `,
        [decision === 'approved' ? 'approved' : 'rejected', decision, comments, taskId]
      );

      // Get workflow definition
      const definition = await this.getWorkflowDefinitionById(task.workflow_definition_id);

      if (!definition) {
        throw new Error('Workflow definition not found');
      }

      const currentStep = definition.steps.find(s => s.stepNumber === task.current_step);

      if (!currentStep) {
        throw new Error('Current step not found');
      }

      // If rejected, reject entire workflow
      if (decision === 'rejected') {
        await this.completeWorkflow(task.workflow_instance_id, 'rejected');
        return { completed: true, finalStatus: 'rejected' };
      }

      // Check if step is complete
      const stepComplete = await this.isStepComplete(
        task.workflow_instance_id,
        task.current_step,
        currentStep.approvalType
      );

      if (stepComplete) {
        // Move to next step or complete
        const nextStepNumber = task.current_step + 1;
        const nextStep = definition.steps.find(s => s.stepNumber === nextStepNumber);

        if (nextStep) {
          // Update workflow current step
          await pool.query(
            `
            UPDATE workflow_instances
            SET current_step = $1
            WHERE id = $2
            `,
            [nextStepNumber, task.workflow_instance_id]
          );

          // Route to next step
          await this.routeToStep(
            task.workflow_instance_id,
            definition,
            nextStepNumber,
            JSON.parse(task.data)
          );

          return { completed: false };
        } else {
          // Workflow complete
          await this.completeWorkflow(task.workflow_instance_id, 'approved');
          return { completed: true, finalStatus: 'approved' };
        }
      }

      return { completed: false };
    } catch (error) {
      logger.error('[ApprovalWorkflow] Error processing approval:', error);
      throw error;
    }
  }

  /**
   * Check if workflow step is complete
   */
  private async isStepComplete(
    workflowId: string,
    stepNumber: number,
    approvalType: 'any' | 'all' | 'majority'
  ): Promise<boolean> {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM approval_tasks
      WHERE workflow_instance_id = $1
        AND step_number = $2
      `,
      [workflowId, stepNumber]
    );

    const stats = result.rows[0];
    const total = parseInt(stats.total);
    const approved = parseInt(stats.approved);
    const pending = parseInt(stats.pending);

    switch (approvalType) {
      case 'any':
        return approved > 0;
      case 'all':
        return pending === 0 && approved === total;
      case 'majority':
        return approved > total / 2;
    }
  }

  /**
   * Complete workflow
   */
  private async completeWorkflow(workflowId: string, finalStatus: string): Promise<void> {
    await pool.query(
      `
      UPDATE workflow_instances
      SET status = $1,
          completed_at = NOW()
      WHERE id = $2
      `,
      [finalStatus, workflowId]
    );

    // Get workflow details
    const workflowResult = await pool.query(
      'SELECT * FROM workflow_instances WHERE id = $1',
      [workflowId]
    );

    const workflow = workflowResult.rows[0];

    // Update entity status
    await this.updateEntityStatus(
      workflow.entity_type,
      workflow.entity_id,
      finalStatus
    );

    // Notify requester
    await this.notifyRequester(
      workflow.requested_by,
      workflow.entity_type,
      workflow.entity_id,
      finalStatus
    );
  }

  /**
   * Update entity status based on workflow result
   */
  private async updateEntityStatus(
    entityType: string,
    entityId: string,
    status: string
  ): Promise<void> {
    let tableName: string;
    let statusColumn = 'status';

    switch (entityType) {
      case 'expense':
        tableName = 'caregiver_expenses';
        statusColumn = 'status';
        break;
      case 'pto':
        tableName = 'caregiver_pto';
        statusColumn = 'status';
        break;
      case 'schedule_change':
        tableName = 'schedule_change_requests';
        statusColumn = 'status';
        break;
      case 'incident':
        tableName = 'incidents';
        statusColumn = 'approval_status';
        break;
      default:
        return;
    }

    await pool.query(
      `
      UPDATE ${tableName}
      SET ${statusColumn} = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [status, entityId]
    );
  }

  /**
   * Check auto-approval rules
   */
  private checkAutoApproval(rules: AutoApprovalRule[], data: any): boolean {
    return rules.some(rule => {
      // Check amount threshold
      if (rule.maxAmount && data.amount > rule.maxAmount) {
        return false;
      }

      // Check conditions
      if (rule.conditions && rule.conditions.length > 0) {
        return this.evaluateConditions(rule.conditions, data);
      }

      return true;
    });
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>,
    data: any
  ): boolean {
    return conditions.every(condition => {
      const fieldValue = data[condition.field];

      switch (condition.operator) {
        case 'gt':
          return fieldValue > condition.value;
        case 'gte':
          return fieldValue >= condition.value;
        case 'lt':
          return fieldValue < condition.value;
        case 'lte':
          return fieldValue <= condition.value;
        case 'eq':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Auto-approve entity
   */
  private async autoApprove(
    organizationId: string,
    entityType: string,
    entityId: string,
    requestedBy: string
  ): Promise<void> {
    await this.updateEntityStatus(entityType, entityId, 'approved');

    await pool.query(
      `
      INSERT INTO workflow_audit_log (
        organization_id,
        entity_type,
        entity_id,
        action,
        performed_by,
        auto_approved,
        created_at
      ) VALUES ($1, $2, $3, 'auto_approved', $4, true, NOW())
      `,
      [organizationId, entityType, entityId, requestedBy]
    );
  }

  /**
   * Notify approver
   */
  private async notifyApprover(
    workflowId: string,
    approverId: string,
    entityType: string
  ): Promise<void> {
    await pool.query(
      `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        read,
        created_at
      ) VALUES ($1, 'approval_request', $2, $3, $4, false, NOW())
      `,
      [
        approverId,
        'Approval Request',
        `You have a new ${entityType} approval request`,
        JSON.stringify({ workflowId })
      ]
    );

    // Send real-time notification
    websocketService.sendNotification(approverId, {
      type: 'approval_request',
      workflowId,
      entityType
    });
  }

  /**
   * Notify requester
   */
  private async notifyRequester(
    userId: string,
    entityType: string,
    entityId: string,
    status: string
  ): Promise<void> {
    await pool.query(
      `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        read,
        created_at
      ) VALUES ($1, 'approval_result', $2, $3, $4, false, NOW())
      `,
      [
        userId,
        'Approval Result',
        `Your ${entityType} request has been ${status}`,
        JSON.stringify({ entityId, status })
      ]
    );
  }

  /**
   * Get workflow definition
   */
  private async getWorkflowDefinition(
    organizationId: string,
    entityType: string
  ): Promise<WorkflowDefinition | null> {
    const result = await pool.query(
      `
      SELECT * FROM workflow_definitions
      WHERE organization_id = $1
        AND entity_type = $2
        AND active = true
      `,
      [organizationId, entityType]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      entityType: row.entity_type,
      steps: JSON.parse(row.steps),
      autoApprovalRules: row.auto_approval_rules ? JSON.parse(row.auto_approval_rules) : undefined
    };
  }

  /**
   * Get workflow definition by ID
   */
  private async getWorkflowDefinitionById(id: string): Promise<WorkflowDefinition | null> {
    const result = await pool.query(
      'SELECT * FROM workflow_definitions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      entityType: row.entity_type,
      steps: JSON.parse(row.steps),
      autoApprovalRules: row.auto_approval_rules ? JSON.parse(row.auto_approval_rules) : undefined
    };
  }

  /**
   * Get pending approvals for user
   */
  async getPendingApprovals(userId: string): Promise<
    Array<{
      taskId: string;
      workflowId: string;
      entityType: string;
      entityId: string;
      requestedBy: string;
      requestedAt: Date;
      dueDate?: Date;
    }>
  > {
    const result = await pool.query(
      `
      SELECT
        at.id as task_id,
        wi.id as workflow_id,
        wi.entity_type,
        wi.entity_id,
        wi.requested_by,
        wi.requested_at,
        at.due_date
      FROM approval_tasks at
      JOIN workflow_instances wi ON at.workflow_instance_id = wi.id
      WHERE at.approver_id = $1
        AND at.status = 'pending'
      ORDER BY at.created_at ASC
      `,
      [userId]
    );

    return result.rows.map(row => ({
      taskId: row.task_id,
      workflowId: row.workflow_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      requestedBy: row.requested_by,
      requestedAt: row.requested_at,
      dueDate: row.due_date
    }));
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
