/**
 * Onboarding Routes
 * Employee onboarding checklist management
 *
 * @module api/routes/console/onboarding
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ========================================
// ONBOARDING CHECKLIST MANAGEMENT
// ========================================

/**
 * GET /api/console/hr/onboarding/:employeeId
 * Get onboarding checklist for an employee
 */
router.get('/:employeeId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      throw ApiErrors.badRequest('Employee ID is required');
    }

    // TODO: Query database for employee and checklist
    // const db = DatabaseClient.getInstance();
    // const employeeResult = await db.query(`
    //   SELECT
    //     e.id,
    //     e.first_name,
    //     e.last_name,
    //     e.email,
    //     e.hire_date,
    //     e.position,
    //     p.name as pod_name
    //   FROM employees e
    //   LEFT JOIN pods p ON p.id = e.pod_id
    //   WHERE e.id = $1
    // `, [employeeId]);
    //
    // if (employeeResult.rows.length === 0) {
    //   throw ApiErrors.notFound('Employee not found');
    // }
    //
    // const checklistResult = await db.query(`
    //   SELECT
    //     id,
    //     step,
    //     description,
    //     status,
    //     completed_at,
    //     completed_by,
    //     notes,
    //     required,
    //     "order"
    //   FROM onboarding_checklist_items
    //   WHERE employee_id = $1
    //   ORDER BY "order"
    // `, [employeeId]);

    // Mock data for development
    const mockEmployee = {
      id: employeeId,
      firstName: 'Lisa',
      lastName: 'Martinez',
      email: 'lmartinez@serenitycarepartners.com',
      hireDate: '2024-11-15',
      position: 'Home Health Aide (HHA)',
      pod: 'Pod-1 (Dayton)'
    };

    const mockChecklist = [
      {
        id: 'check-001',
        step: 'I-9 Verification',
        description: 'Complete Form I-9 and verify work authorization documents',
        status: 'completed',
        completedAt: '2024-11-15T10:00:00Z',
        completedBy: 'Gloria Martinez',
        notes: 'Driver license and Social Security card verified',
        required: true,
        order: 1
      },
      {
        id: 'check-002',
        step: 'W-4 Tax Form',
        description: 'Complete federal and state tax withholding forms',
        status: 'completed',
        completedAt: '2024-11-15T10:15:00Z',
        completedBy: 'Gloria Martinez',
        notes: 'Forms submitted to payroll',
        required: true,
        order: 2
      },
      {
        id: 'check-003',
        step: 'Background Check',
        description: 'Complete criminal background check and reference verification',
        status: 'completed',
        completedAt: '2024-11-10T14:00:00Z',
        completedBy: 'System',
        notes: 'Background check cleared - no issues found',
        required: true,
        order: 3
      },
      {
        id: 'check-004',
        step: 'TB Test',
        description: 'Complete tuberculosis skin test or chest X-ray',
        status: 'in_progress',
        completedAt: null,
        completedBy: null,
        notes: 'TB test scheduled for 11/16',
        required: true,
        order: 4
      },
      {
        id: 'check-005',
        step: 'CPR Certification',
        description: 'Upload current CPR certification or schedule training',
        status: 'completed',
        completedAt: '2024-11-15T11:00:00Z',
        completedBy: 'Lisa Martinez',
        notes: 'CPR cert expires 06/2025',
        required: true,
        order: 5
      },
      {
        id: 'check-006',
        step: 'HHA/STNA License',
        description: 'Upload and verify active HHA or STNA certification',
        status: 'completed',
        completedAt: '2024-11-15T11:05:00Z',
        completedBy: 'Lisa Martinez',
        notes: 'HHA license verified - expires 12/2025',
        required: true,
        order: 6
      },
      {
        id: 'check-007',
        step: 'Policy Acknowledgments',
        description: 'Review and sign HIPAA, Code of Conduct, and company policies',
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: 'Policy packet sent via email',
        required: true,
        order: 7
      },
      {
        id: 'check-008',
        step: 'Direct Deposit Setup',
        description: 'Submit bank account information for payroll',
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: '',
        required: true,
        order: 8
      },
      {
        id: 'check-009',
        step: 'Uniform/Badge',
        description: 'Issue company uniform and employee badge',
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: '',
        required: true,
        order: 9
      },
      {
        id: 'check-010',
        step: 'Mobile App Setup',
        description: 'Install and configure EVV mobile app with credentials',
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: '',
        required: true,
        order: 10
      },
      {
        id: 'check-011',
        step: 'Orientation Training',
        description: 'Complete new hire orientation and company overview',
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: 'Scheduled for 11/18 9:00 AM',
        required: true,
        order: 11
      },
      {
        id: 'check-012',
        step: 'Pod Introduction',
        description: 'Meet Pod Lead and shadow experienced caregiver',
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: '',
        required: true,
        order: 12
      }
    ];

    res.json({
      employee: mockEmployee,
      checklist: mockChecklist,
      stats: {
        total: mockChecklist.length,
        completed: mockChecklist.filter(i => i.status === 'completed').length,
        pending: mockChecklist.filter(i => i.status === 'pending' || i.status === 'in_progress').length,
        percentComplete: Math.round((mockChecklist.filter(i => i.status === 'completed').length / mockChecklist.length) * 100)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/hr/onboarding/:employeeId/items/:itemId
 * Update status of a checklist item
 */
router.put('/:employeeId/items/:itemId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId, itemId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.userId;
    const userName = 'Current User';

    if (!employeeId || !itemId) {
      throw ApiErrors.badRequest('Employee ID and Item ID are required');
    }

    if (!status) {
      throw ApiErrors.badRequest('Status is required');
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'not_applicable'];
    if (!validStatuses.includes(status)) {
      throw ApiErrors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // TODO: Update database
    // const db = DatabaseClient.getInstance();
    //
    // // Verify item exists and belongs to employee
    // const itemResult = await db.query(`
    //   SELECT id FROM onboarding_checklist_items
    //   WHERE id = $1 AND employee_id = $2
    // `, [itemId, employeeId]);
    //
    // if (itemResult.rows.length === 0) {
    //   throw ApiErrors.notFound('Checklist item not found for this employee');
    // }
    //
    // // Update item
    // const now = new Date().toISOString();
    // await db.query(`
    //   UPDATE onboarding_checklist_items
    //   SET
    //     status = $1,
    //     completed_at = CASE WHEN $1 = 'completed' THEN $2 ELSE completed_at END,
    //     completed_by = CASE WHEN $1 = 'completed' THEN $3 ELSE completed_by END,
    //     notes = COALESCE($4, notes),
    //     updated_at = NOW()
    //   WHERE id = $5
    // `, [status, now, userName, notes, itemId]);
    //
    // // Log activity
    // await db.query(`
    //   INSERT INTO activity_log (
    //     user_id, action, entity_type, entity_id, details, created_at
    //   ) VALUES ($1, 'onboarding_item_updated', 'onboarding_item', $2, $3, NOW())
    // `, [userId, itemId, JSON.stringify({ status, employeeId })]);

    // Mock response
    console.log(`[ONBOARDING] Updated item ${itemId} for employee ${employeeId}: ${status}`);
    console.log(`  Updated by: ${userName}`);
    if (notes) {
      console.log(`  Notes: ${notes}`);
    }

    res.json({
      success: true,
      itemId,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      completedBy: status === 'completed' ? userName : null,
      notes: notes || null,
      message: 'Checklist item updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/onboarding/:employeeId/create
 * Create initial onboarding checklist for new hire
 */
router.post('/:employeeId/create', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const userId = req.user?.userId;

    if (!employeeId) {
      throw ApiErrors.badRequest('Employee ID is required');
    }

    // TODO: Verify employee exists
    // const db = DatabaseClient.getInstance();
    // const employeeResult = await db.query(`
    //   SELECT id FROM employees WHERE id = $1
    // `, [employeeId]);
    //
    // if (employeeResult.rows.length === 0) {
    //   throw ApiErrors.notFound('Employee not found');
    // }
    //
    // // Check if checklist already exists
    // const existingResult = await db.query(`
    //   SELECT COUNT(*) as count FROM onboarding_checklist_items
    //   WHERE employee_id = $1
    // `, [employeeId]);
    //
    // if (existingResult.rows[0].count > 0) {
    //   throw ApiErrors.badRequest('Onboarding checklist already exists for this employee');
    // }

    // Define standard checklist items
    const standardItems = [
      {
        step: 'I-9 Verification',
        description: 'Complete Form I-9 and verify work authorization documents',
        required: true,
        order: 1
      },
      {
        step: 'W-4 Tax Form',
        description: 'Complete federal and state tax withholding forms',
        required: true,
        order: 2
      },
      {
        step: 'Background Check',
        description: 'Complete criminal background check and reference verification',
        required: true,
        order: 3
      },
      {
        step: 'TB Test',
        description: 'Complete tuberculosis skin test or chest X-ray',
        required: true,
        order: 4
      },
      {
        step: 'CPR Certification',
        description: 'Upload current CPR certification or schedule training',
        required: true,
        order: 5
      },
      {
        step: 'HHA/STNA License',
        description: 'Upload and verify active HHA or STNA certification',
        required: true,
        order: 6
      },
      {
        step: 'Policy Acknowledgments',
        description: 'Review and sign HIPAA, Code of Conduct, and company policies',
        required: true,
        order: 7
      },
      {
        step: 'Direct Deposit Setup',
        description: 'Submit bank account information for payroll',
        required: true,
        order: 8
      },
      {
        step: 'Uniform/Badge',
        description: 'Issue company uniform and employee badge',
        required: true,
        order: 9
      },
      {
        step: 'Mobile App Setup',
        description: 'Install and configure EVV mobile app with credentials',
        required: true,
        order: 10
      },
      {
        step: 'Orientation Training',
        description: 'Complete new hire orientation and company overview',
        required: true,
        order: 11
      },
      {
        step: 'Pod Introduction',
        description: 'Meet Pod Lead and shadow experienced caregiver',
        required: true,
        order: 12
      }
    ];

    // TODO: Insert items into database
    // for (const item of standardItems) {
    //   const itemId = uuidv4();
    //   await db.query(`
    //     INSERT INTO onboarding_checklist_items (
    //       id, employee_id, step, description, status,
    //       required, "order", created_at
    //     ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())
    //   `, [itemId, employeeId, item.step, item.description, item.required, item.order]);
    // }
    //
    // // Log activity
    // await db.query(`
    //   INSERT INTO activity_log (
    //     user_id, action, entity_type, entity_id, details, created_at
    //   ) VALUES ($1, 'onboarding_checklist_created', 'employee', $2, $3, NOW())
    // `, [userId, employeeId, JSON.stringify({ itemCount: standardItems.length })]);

    // Mock response
    console.log(`[ONBOARDING] Created checklist for employee ${employeeId} with ${standardItems.length} items`);

    res.status(201).json({
      success: true,
      employeeId,
      itemsCreated: standardItems.length,
      items: standardItems,
      message: 'Onboarding checklist created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/onboarding/:employeeId/items/:itemId/notes
 * Add or update notes for a checklist item
 */
router.post('/:employeeId/items/:itemId/notes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId, itemId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.userId;

    if (!employeeId || !itemId) {
      throw ApiErrors.badRequest('Employee ID and Item ID are required');
    }

    if (!notes || typeof notes !== 'string') {
      throw ApiErrors.badRequest('Notes must be a non-empty string');
    }

    // TODO: Update database
    // const db = DatabaseClient.getInstance();
    //
    // // Verify item exists
    // const itemResult = await db.query(`
    //   SELECT id FROM onboarding_checklist_items
    //   WHERE id = $1 AND employee_id = $2
    // `, [itemId, employeeId]);
    //
    // if (itemResult.rows.length === 0) {
    //   throw ApiErrors.notFound('Checklist item not found for this employee');
    // }
    //
    // // Update notes
    // await db.query(`
    //   UPDATE onboarding_checklist_items
    //   SET notes = $1, updated_at = NOW()
    //   WHERE id = $2
    // `, [notes, itemId]);
    //
    // // Log activity
    // await db.query(`
    //   INSERT INTO activity_log (
    //     user_id, action, entity_type, entity_id, details, created_at
    //   ) VALUES ($1, 'onboarding_note_added', 'onboarding_item', $2, $3, NOW())
    // `, [userId, itemId, JSON.stringify({ employeeId })]);

    // Mock response
    console.log(`[ONBOARDING] Added note to item ${itemId} for employee ${employeeId}`);
    console.log(`  Note: ${notes}`);

    res.json({
      success: true,
      itemId,
      notes,
      message: 'Note added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/onboarding/pending
 * Get list of employees with incomplete onboarding
 */
router.get('/pending', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Query database for employees with incomplete onboarding
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     e.id,
    //     e.first_name,
    //     e.last_name,
    //     e.hire_date,
    //     e.position,
    //     COUNT(oci.id) as total_items,
    //     SUM(CASE WHEN oci.status = 'completed' THEN 1 ELSE 0 END) as completed_items,
    //     ROUND((SUM(CASE WHEN oci.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(oci.id)) * 100) as percent_complete
    //   FROM employees e
    //   JOIN onboarding_checklist_items oci ON oci.employee_id = e.id
    //   WHERE e.status = 'onboarding'
    //   GROUP BY e.id, e.first_name, e.last_name, e.hire_date, e.position
    //   HAVING SUM(CASE WHEN oci.status = 'completed' THEN 1 ELSE 0 END) < COUNT(oci.id)
    //   ORDER BY e.hire_date DESC
    // `);

    // Mock data
    const mockPending = [
      {
        id: 'emp-001',
        firstName: 'Lisa',
        lastName: 'Martinez',
        hireDate: '2024-11-15',
        position: 'Home Health Aide (HHA)',
        totalItems: 12,
        completedItems: 5,
        percentComplete: 42
      },
      {
        id: 'emp-002',
        firstName: 'James',
        lastName: 'Thompson',
        hireDate: '2024-11-12',
        position: 'Home Health Aide (HHA)',
        totalItems: 12,
        completedItems: 9,
        percentComplete: 75
      }
    ];

    res.json({
      pendingCount: mockPending.length,
      employees: mockPending
    });
  } catch (error) {
    next(error);
  }
});

export default router;
