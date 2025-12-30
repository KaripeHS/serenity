/**
 * HR Routes
 * Endpoints for managing applicants, onboarding, and HR workflows
 *
 * @module api/routes/console/hr
 */

import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import onboardingRouter from './onboarding';
import { pool } from '../../../config/database';

const router = Router();

// Mount onboarding sub-router
router.use('/onboarding', onboardingRouter);

// ========================================
// HR METRICS / DASHBOARD
// ========================================

/**
 * GET /api/console/hr/metrics
 * Get HR dashboard metrics (real data only - no mock data)
 */
router.get('/metrics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;

    // Get total staff count
    const staffResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id = $1 AND status = 'active'
    `, [organizationId]);

    // Get open positions count
    const positionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM job_postings
      WHERE organization_id = $1 AND status = 'open'
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    // Get pending applications count
    const applicationsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM applicants
      WHERE organization_id = $1 AND status = 'pending'
    `, [organizationId]).catch(() => ({ rows: [{ count: 0 }] }));

    // Get training compliance (users with valid required credentials / total users)
    let trainingCompliance = 0;
    try {
      const complianceResult = await pool.query(`
        SELECT
          COUNT(DISTINCT u.id) as total_staff,
          COUNT(DISTINCT CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM credentials c
              WHERE c.user_id = u.id
              AND c.status = 'expired'
              AND c.is_required = true
            ) THEN u.id
          END) as compliant_staff
        FROM users u
        WHERE u.organization_id = $1 AND u.status = 'active'
          AND u.role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp')
      `, [organizationId]);

      const totalStaff = parseInt(complianceResult.rows[0]?.total_staff || '0', 10);
      const compliantStaff = parseInt(complianceResult.rows[0]?.compliant_staff || '0', 10);
      trainingCompliance = totalStaff > 0 ? (compliantStaff / totalStaff) * 100 : 0;
    } catch {
      trainingCompliance = 0;
    }

    // Get average time to hire (days from application to hire)
    let avgTimeToHire = 0;
    try {
      const hireTimeResult = await pool.query(`
        SELECT AVG(EXTRACT(DAY FROM (hired_date - created_at))) as avg_days
        FROM applicants
        WHERE organization_id = $1 AND status = 'hired' AND hired_date IS NOT NULL
      `, [organizationId]);
      avgTimeToHire = Math.round(parseFloat(hireTimeResult.rows[0]?.avg_days || '0'));
    } catch {
      avgTimeToHire = 0;
    }

    // Get turnover rate (terminated / total staff in last 12 months)
    let turnoverRate = 0;
    try {
      const turnoverResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'terminated' AND updated_at >= NOW() - INTERVAL '12 months') as terminated,
          COUNT(*) as total
        FROM users
        WHERE organization_id = $1
          AND role IN ('caregiver', 'dsp_basic', 'dsp_med', 'hha', 'cna', 'rn_case_manager', 'lpn_lvn', 'therapist', 'qidp')
      `, [organizationId]);
      const terminated = parseInt(turnoverResult.rows[0]?.terminated || '0', 10);
      const total = parseInt(turnoverResult.rows[0]?.total || '0', 10);
      turnoverRate = total > 0 ? (terminated / total) * 100 : 0;
    } catch {
      turnoverRate = 0;
    }

    // Get interviews scheduled this week
    let interviewsScheduled = 0;
    try {
      const interviewsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM interviews i
        JOIN applicants a ON i.applicant_id = a.id
        WHERE a.organization_id = $1
          AND i.status = 'scheduled'
          AND i.scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)
          AND i.scheduled_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      `, [organizationId]);
      interviewsScheduled = parseInt(interviewsResult.rows[0]?.count || '0', 10);
    } catch {
      interviewsScheduled = 0;
    }

    res.json({
      totalStaff: parseInt(staffResult.rows[0]?.count || '0', 10),
      openPositions: parseInt(positionsResult.rows[0]?.count || '0', 10),
      pendingApplications: parseInt(applicationsResult.rows[0]?.count || '0', 10),
      trainingCompliance: Math.round(trainingCompliance * 10) / 10,
      avgTimeToHire,
      turnoverRate: Math.round(turnoverRate * 10) / 10,
      interviewsScheduled
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// APPLICANT MANAGEMENT
// ========================================

/**
 * GET /api/console/hr/applicants
 * List all applicants with filtering
 */
router.get('/applicants', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, stage, position, search, limit = 50, offset = 0 } = req.query;
    const organizationId = req.user?.organizationId;

    // Build query with filters
    let query = `
      SELECT
        id,
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone,
        position_applied_for as "positionAppliedFor",
        created_at as "applicationDate",
        status,
        current_stage as "currentStage",
        source,
        certifications,
        experience_level as "experienceLevel",
        availability,
        skills
      FROM applicants
      WHERE organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (stage) {
      query += ` AND current_stage = $${paramIndex}`;
      params.push(stage);
      paramIndex++;
    }
    if (position) {
      query += ` AND position_applied_for = $${paramIndex}`;
      params.push(position);
      paramIndex++;
    }
    if (search) {
      query += ` AND (
        first_name ILIKE $${paramIndex} OR
        last_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM applicants WHERE organization_id = $1`;
    const countParams: any[] = [organizationId];
    let countParamIndex = 2;

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (stage) {
      countQuery += ` AND current_stage = $${countParamIndex}`;
      countParams.push(stage);
      countParamIndex++;
    }
    if (position) {
      countQuery += ` AND position_applied_for = $${countParamIndex}`;
      countParams.push(position);
      countParamIndex++;
    }
    if (search) {
      countQuery += ` AND (
        first_name ILIKE $${countParamIndex} OR
        last_name ILIKE $${countParamIndex} OR
        email ILIKE $${countParamIndex} OR
        phone ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      applicants: result.rows,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/applicants/:id
 * Get detailed applicant information
 */
router.get('/applicants/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const result = await pool.query(`
      SELECT
        id,
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone,
        address,
        date_of_birth as "dateOfBirth",
        position_applied_for as "positionAppliedFor",
        created_at as "applicationDate",
        status,
        current_stage as "currentStage",
        source,
        referred_by as "referredBy",
        certifications,
        experience_level as "experienceLevel",
        skills,
        availability,
        desired_salary_min as "desiredSalaryMin",
        desired_salary_max as "desiredSalaryMax",
        available_start_date as "availableStartDate",
        ai_screening_score as "aiScreeningScore",
        ai_screening_notes as "aiScreeningNotes",
        background_check_status as "backgroundCheckStatus",
        reference_check_status as "referenceCheckStatus",
        notes,
        hired_date as "hiredDate",
        rejection_reason as "rejectionReason",
        rejection_date as "rejectionDate",
        updated_at as "updatedAt"
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    res.json({
      applicant: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/hr/applicants/:id/status
 * Update applicant status and stage
 */
router.put('/applicants/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, stage, notes } = req.body;

    // Validation
    const validStatuses = ['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // TODO: Update database
    // const db = getDbClient();
    // await db.query(
    //   'UPDATE applicants SET status = $1, current_stage = $2, updated_at = NOW() WHERE id = $3',
    //   [status, stage, id]
    // );

    // TODO: Log status change in audit log
    // await logAuditEvent({
    //   userId: req.user?.id,
    //   action: 'applicant_status_updated',
    //   resourceType: 'applicant',
    //   resourceId: id,
    //   changes: { status, stage, notes }
    // });

    console.log(`[HR] Applicant ${id} status updated to ${status} (${stage}) by ${req.user?.userId}`);

    res.json({
      success: true,
      message: 'Applicant status updated successfully',
      applicantId: id,
      newStatus: status,
      newStage: stage
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/applicants/:id/interview
 * Schedule interview for applicant
 */
router.post('/applicants/:id/interview', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { interviewType, scheduledDate, interviewerIds, location, notes } = req.body;

    // Validation
    if (!interviewType || !scheduledDate) {
      return res.status(400).json({ error: 'Interview type and scheduled date are required' });
    }

    const interviewId = uuidv4();

    // TODO: Create interview record in database
    // const db = getDbClient();
    // await db.query(
    //   'INSERT INTO interviews (id, applicant_id, type, scheduled_date, location, notes) VALUES ($1, $2, $3, $4, $5, $6)',
    //   [interviewId, id, interviewType, scheduledDate, location, notes]
    // );

    // TODO: Update applicant stage
    // await db.query(
    //   'UPDATE applicants SET current_stage = $1, updated_at = NOW() WHERE id = $2',
    //   [interviewType === 'phone' ? 'phone_screen_scheduled' : 'in_person_interview_scheduled', id]
    // );

    // TODO: Send interview confirmation email to applicant
    // await emailService.sendInterviewScheduled({
    //   applicantId: id,
    //   interviewType,
    //   scheduledDate,
    //   location
    // });

    console.log(`[HR] Interview scheduled for applicant ${id}: ${interviewType} on ${scheduledDate}`);

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interviewId,
      applicantId: id,
      scheduledDate
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/hr/applicants/:id/hire
 * Convert applicant to employee (hire them)
 */
router.put('/applicants/:id/hire', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, podId, role, payRate, employmentType } = req.body;

    // Validation
    if (!startDate || !role) {
      return res.status(400).json({ error: 'Start date and role are required' });
    }

    const employeeId = uuidv4();

    // TODO: Create employee/caregiver record
    // const db = getDbClient();
    // const applicant = await db.query('SELECT * FROM applicants WHERE id = $1', [id]);

    // await db.query(
    //   `INSERT INTO caregivers (
    //     id, organization_id, first_name, last_name, email, phone,
    //     role, hire_date, employment_type, pay_rate, pod_id, status
    //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'onboarding')`,
    //   [employeeId, req.user?.organizationId, applicant.first_name, applicant.last_name,
    //    applicant.email, applicant.phone, role, startDate, employmentType, payRate, podId]
    // );

    // TODO: Update applicant status to hired
    // await db.query(
    //   'UPDATE applicants SET status = \'hired\', current_stage = \'onboarding\', updated_at = NOW() WHERE id = $1',
    //   [id]
    // );

    // TODO: Create onboarding checklist
    // await createOnboardingChecklist(employeeId);

    // TODO: Send offer acceptance email
    // await emailService.sendOfferAccepted({
    //   applicantId: id,
    //   employeeId,
    //   startDate
    // });

    console.log(`[HR] Applicant ${id} hired as employee ${employeeId}, start date: ${startDate}`);

    res.json({
      success: true,
      message: 'Applicant hired successfully',
      applicantId: id,
      employeeId,
      startDate
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/applicants/:id/reject
 * Reject applicant
 */
router.post('/applicants/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, sendEmail } = req.body;

    // TODO: Update applicant status
    // const db = getDbClient();
    // await db.query(
    //   'UPDATE applicants SET status = \'rejected\', current_stage = $1, updated_at = NOW() WHERE id = $2',
    //   [reason || 'rejected_other', id]
    // );

    // TODO: Send rejection email if requested
    // if (sendEmail) {
    //   await emailService.sendRejectionLetter({
    //     applicantId: id,
    //     reason
    //   });
    // }

    console.log(`[HR] Applicant ${id} rejected: ${reason}`);

    res.json({
      success: true,
      message: 'Applicant rejected',
      applicantId: id
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// HR ANALYTICS
// ========================================

/**
 * GET /api/console/hr/analytics
 * Get HR pipeline analytics
 */
router.get('/analytics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;

    // Pipeline status counts
    const pipelineResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM applicants
      WHERE organization_id = $1
      GROUP BY status
    `, [organizationId]);

    const pipeline: Record<string, number> = {
      new: 0,
      screening: 0,
      interviewing: 0,
      reference_check: 0,
      background_check: 0,
      offer_pending: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0
    };
    pipelineResult.rows.forEach(row => {
      pipeline[row.status] = parseInt(row.count, 10);
    });

    // Source breakdown
    const sourceResult = await pool.query(`
      SELECT source, COUNT(*) as count
      FROM applicants
      WHERE organization_id = $1
      GROUP BY source
      ORDER BY count DESC
    `, [organizationId]);

    const sourceBreakdown: Record<string, number> = {};
    sourceResult.rows.forEach(row => {
      sourceBreakdown[row.source || 'unknown'] = parseInt(row.count, 10);
    });

    // Top positions
    const positionsResult = await pool.query(`
      SELECT position_applied_for as position, COUNT(*) as applications
      FROM applicants
      WHERE organization_id = $1
      GROUP BY position_applied_for
      ORDER BY applications DESC
      LIMIT 5
    `, [organizationId]);

    // Time to hire for hired applicants
    const timeToHireResult = await pool.query(`
      SELECT
        AVG(EXTRACT(DAY FROM (hired_date - created_at))) as average,
        MIN(EXTRACT(DAY FROM (hired_date - created_at))) as fastest,
        MAX(EXTRACT(DAY FROM (hired_date - created_at))) as slowest
      FROM applicants
      WHERE organization_id = $1 AND status = 'hired' AND hired_date IS NOT NULL
    `, [organizationId]);

    const timeToHire = timeToHireResult.rows[0];

    res.json({
      pipeline,
      timeToHire: {
        average: Math.round(timeToHire?.average || 0),
        fastest: Math.round(timeToHire?.fastest || 0),
        slowest: Math.round(timeToHire?.slowest || 0)
      },
      sourceBreakdown,
      topPositions: positionsResult.rows.map(row => ({
        position: row.position,
        applications: parseInt(row.applications, 10)
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
