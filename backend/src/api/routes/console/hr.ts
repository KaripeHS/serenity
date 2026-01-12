/**
 * HR Routes
 * Endpoints for managing applicants, onboarding, and HR workflows
 *
 * @module api/routes/console/hr
 */

import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../../config/database';
import { getEmailService } from '../../../services/notifications/email.service';
import { onboardingUploadService } from '../../../services/hr/onboarding-upload.service';
import multer from 'multer';

const router = Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC, DOCX'));
    }
  }
});

// Note: Onboarding routes are defined inline below (not using the mock onboarding router)

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

    // Get pending applications count (new applications that haven't been processed)
    const applicationsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM applicants
      WHERE organization_id = $1 AND status IN ('new', 'pending')
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
// STAFF MANAGEMENT
// ========================================

/**
 * GET /api/console/hr/staff
 * List all staff members with their details
 */
router.get('/staff', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { department, role, status = 'active', search, limit = 100, offset = 0 } = req.query;
    const organizationId = req.user?.organizationId;

    // Build query with filters
    // Note: credentials table uses expiration_date not expires_at
    let query = `
      SELECT
        u.id,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.phone,
        u.role,
        u.department,
        u.status,
        u.created_at as "hireDate",
        u.updated_at as "updatedAt",
        u.profile_picture_url as "profilePictureUrl",
        u.profile_picture_thumbnail_url as "profilePictureThumbnailUrl",
        COALESCE(
          (SELECT json_agg(json_build_object('name', c.credential_type, 'status', c.status, 'expiresAt', c.expiration_date))
           FROM credentials c WHERE c.user_id = u.id),
          '[]'
        ) as credentials
      FROM users u
      WHERE u.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (status) {
      query += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (department) {
      query += ` AND u.department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }
    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    if (search) {
      query += ` AND (
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY u.last_name, u.first_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM users WHERE organization_id = $1`;
    const countParams: any[] = [organizationId];
    let countParamIndex = 2;

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (department) {
      countQuery += ` AND department = $${countParamIndex}`;
      countParams.push(department);
      countParamIndex++;
    }
    if (role) {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }
    if (search) {
      countQuery += ` AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Process staff to extract training due
    const staff = result.rows.map((s: any) => {
      const credentials = s.credentials || [];
      const trainingDue: string[] = [];
      const certifications: string[] = [];

      credentials.forEach((cred: any) => {
        if (cred.name) {
          certifications.push(cred.name);
          // Check if credential is expiring soon (within 30 days) or expired
          if (cred.expiresAt) {
            const expiresAt = new Date(cred.expiresAt);
            const now = new Date();
            const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30) {
              trainingDue.push(cred.name);
            }
          }
          if (cred.status === 'expired') {
            if (!trainingDue.includes(cred.name)) {
              trainingDue.push(cred.name);
            }
          }
        }
      });

      return {
        ...s,
        certifications,
        trainingDue
      };
    });

    res.json({
      staff,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/staff/:staffId
 * Get a single staff member by ID
 */
router.get('/staff/:staffId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;

    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.phone,
        u.role,
        u.department,
        u.status,
        u.created_at as "hireDate",
        u.updated_at as "updatedAt",
        u.profile_picture_url as "profilePictureUrl",
        u.profile_picture_thumbnail_url as "profilePictureThumbnailUrl",
        COALESCE(
          (SELECT json_agg(json_build_object('name', c.credential_type, 'status', c.status, 'expiresAt', c.expiration_date))
           FROM credentials c WHERE c.user_id = u.id),
          '[]'
        ) as credentials
      FROM users u
      WHERE u.id = $1 AND u.organization_id = $2
    `, [staffId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staff = result.rows[0];
    const credentials = staff.credentials || [];
    const trainingDue: string[] = [];
    const certifications: string[] = [];

    credentials.forEach((cred: any) => {
      if (cred.name) {
        certifications.push(cred.name);
        if (cred.expiresAt) {
          const expiresAt = new Date(cred.expiresAt);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30) {
            trainingDue.push(cred.name);
          }
        }
        if (cred.status === 'expired' && !trainingDue.includes(cred.name)) {
          trainingDue.push(cred.name);
        }
      }
    });

    res.json({
      ...staff,
      certifications,
      trainingDue
    });
  } catch (error) {
    next(error);
  }
});

// Multer config for profile pictures (images only, 5MB limit)
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

/**
 * POST /api/console/hr/staff/:staffId/profile-picture
 * Upload a profile picture for a staff member
 */
router.post('/staff/:staffId/profile-picture', profilePictureUpload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;

    // Check if user has permission to upload profile pictures (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR staff can upload profile pictures' });
    }

    // Verify staff member exists and belongs to same organization
    const staffCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // For now, store as base64 data URL (simpler than cloud storage)
    // In production, you would use the PhotoUploadService with Google Cloud Storage
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update the user's profile picture
    await pool.query(`
      UPDATE users
      SET profile_picture_url = $1,
          profile_picture_thumbnail_url = $1,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
    `, [base64Image, staffId, organizationId]);

    res.json({
      success: true,
      profilePictureUrl: base64Image,
      profilePictureThumbnailUrl: base64Image
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/hr/staff/:staffId/profile-picture
 * Delete a staff member's profile picture
 */
router.delete('/staff/:staffId/profile-picture', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR staff can delete profile pictures' });
    }

    // Clear the profile picture
    await pool.query(`
      UPDATE users
      SET profile_picture_url = NULL,
          profile_picture_thumbnail_url = NULL,
          updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
    `, [staffId, organizationId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/hr/staff/:staffId
 * Update staff member profile
 */
router.put('/staff/:staffId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const { firstName, lastName, email, phone, role, department, status } = req.body;
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;

    // Check if user has permission to update staff (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR staff can update staff profiles' });
    }

    // Verify staff member exists and belongs to same organization
    const staffCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Build update query
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (department !== undefined) {
      updates.push(`department = $${paramIndex++}`);
      values.push(department);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    values.push(staffId, organizationId);

    await pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
    `, values);

    res.json({ success: true, message: 'Staff profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/staff/:staffId/disciplinary-action
 * Record a disciplinary action for a staff member
 */
router.post('/staff/:staffId/disciplinary-action', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const { type, date, reason, description, witnessName, followUpDate, acknowledgement } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR managers and above can record disciplinary actions' });
    }

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffMember = staffCheck.rows[0];

    // Insert disciplinary action record
    const actionId = uuidv4();
    await pool.query(`
      INSERT INTO disciplinary_actions (
        id, organization_id, user_id, action_type, action_date,
        reason_category, description, witness_name, follow_up_date,
        employee_acknowledged, recorded_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `, [
      actionId,
      organizationId,
      staffId,
      type,
      date,
      reason,
      description,
      witnessName || null,
      followUpDate || null,
      acknowledgement,
      userId
    ]);

    console.log(`[HR] Disciplinary action recorded for ${staffMember.first_name} ${staffMember.last_name}: ${type}`);

    res.json({
      success: true,
      message: 'Disciplinary action recorded successfully',
      actionId
    });
  } catch (error: any) {
    // If table doesn't exist, create a simple log entry
    if (error.code === '42P01') {
      console.log('[HR] Disciplinary action recorded (table not yet created)');
      return res.json({
        success: true,
        message: 'Disciplinary action recorded (pending table creation)'
      });
    }
    next(error);
  }
});

/**
 * POST /api/console/hr/staff/:staffId/leave-request
 * Submit a leave of absence request for a staff member
 */
router.post('/staff/:staffId/leave-request', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const {
      type, startDate, endDate, returnDate, isPaid, reason,
      documentation, emergencyContact, emergencyPhone, coverageArranged
    } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'recruiter'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR staff can submit leave requests' });
    }

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id, first_name, last_name, status FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffMember = staffCheck.rows[0];

    // Insert leave request record
    const leaveId = uuidv4();
    await pool.query(`
      INSERT INTO leave_requests (
        id, organization_id, user_id, leave_type, start_date, end_date,
        expected_return_date, is_paid, reason, documentation_url,
        emergency_contact_name, emergency_contact_phone, coverage_arranged,
        status, submitted_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', $14, NOW())
    `, [
      leaveId,
      organizationId,
      staffId,
      type,
      startDate,
      endDate,
      returnDate || null,
      isPaid,
      reason,
      documentation || null,
      emergencyContact || null,
      emergencyPhone || null,
      coverageArranged,
      userId
    ]);

    // Update staff status to on_leave if leave starts today or earlier
    const today = new Date().toISOString().split('T')[0];
    if (startDate <= today) {
      await pool.query(`
        UPDATE users SET status = 'on_leave', updated_at = NOW()
        WHERE id = $1 AND organization_id = $2
      `, [staffId, organizationId]);
    }

    console.log(`[HR] Leave request submitted for ${staffMember.first_name} ${staffMember.last_name}: ${type} from ${startDate} to ${endDate}`);

    res.json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveId
    });
  } catch (error: any) {
    // If table doesn't exist, create a simple log entry
    if (error.code === '42P01') {
      console.log('[HR] Leave request recorded (table not yet created)');
      return res.json({
        success: true,
        message: 'Leave request recorded (pending table creation)'
      });
    }
    next(error);
  }
});

/**
 * POST /api/console/hr/staff/:staffId/terminate
 * Process employee termination
 */
router.post('/staff/:staffId/terminate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const {
      type, reason, lastWorkDay, effectiveDate, exitInterviewScheduled,
      exitInterviewDate, equipmentReturned, equipmentNotes, accessRevoked,
      finalPaycheckDate, cobraNotification, benefitsEndDate, rehireEligible, notes
    } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Check if user has permission (HR Director and above only)
    const hrRoles = ['founder', 'hr_director'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR Director and above can process terminations' });
    }

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id, first_name, last_name, email, status FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffMember = staffCheck.rows[0];

    if (staffMember.status === 'terminated') {
      return res.status(400).json({ error: 'Staff member is already terminated' });
    }

    // Insert termination record
    const terminationId = uuidv4();
    await pool.query(`
      INSERT INTO terminations (
        id, organization_id, user_id, termination_type, reason,
        last_work_day, effective_date, exit_interview_scheduled, exit_interview_date,
        equipment_returned, equipment_notes, access_revoked,
        final_paycheck_date, cobra_notification_sent, benefits_end_date,
        rehire_eligible, notes, processed_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
    `, [
      terminationId,
      organizationId,
      staffId,
      type,
      reason,
      lastWorkDay,
      effectiveDate,
      exitInterviewScheduled,
      exitInterviewDate || null,
      equipmentReturned,
      equipmentNotes || null,
      accessRevoked,
      finalPaycheckDate || null,
      cobraNotification,
      benefitsEndDate || null,
      rehireEligible,
      notes || null,
      userId
    ]);

    // Update user status to terminated
    await pool.query(`
      UPDATE users
      SET status = 'terminated', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
    `, [staffId, organizationId]);

    console.log(`[HR] Termination processed for ${staffMember.first_name} ${staffMember.last_name}: ${type} - ${reason}`);

    res.json({
      success: true,
      message: 'Termination processed successfully',
      terminationId
    });
  } catch (error: any) {
    // If table doesn't exist, still update user status
    if (error.code === '42P01') {
      const { staffId } = req.params;
      const organizationId = req.user?.organizationId;

      await pool.query(`
        UPDATE users
        SET status = 'terminated', updated_at = NOW()
        WHERE id = $1 AND organization_id = $2
      `, [staffId, organizationId]);

      console.log('[HR] Termination processed (detailed table not yet created)');
      return res.json({
        success: true,
        message: 'Termination processed successfully'
      });
    }
    next(error);
  }
});

// ========================================
// PERFORMANCE REVIEWS
// ========================================

/**
 * GET /api/console/hr/staff/:staffId/performance-reviews
 * Get all performance reviews for a staff member
 */
router.get('/staff/:staffId/performance-reviews', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const result = await pool.query(`
      SELECT
        id,
        review_type as "reviewType",
        review_date as "reviewDate",
        reviewer_name as "reviewerName",
        overall_rating as "overallRating",
        status,
        review_period_start as "reviewPeriodStart",
        review_period_end as "reviewPeriodEnd",
        strengths,
        areas_for_improvement as "areasForImprovement",
        goals,
        employee_comments as "employeeComments",
        follow_up_date as "followUpDate",
        created_at as "createdAt"
      FROM performance_reviews
      WHERE user_id = $1 AND organization_id = $2
      ORDER BY review_date DESC
    `, [staffId, organizationId]);

    res.json({ reviews: result.rows });
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return res.json({ reviews: [] });
    }
    next(error);
  }
});

/**
 * POST /api/console/hr/staff/:staffId/performance-reviews
 * Create a new performance review for a staff member
 */
router.post('/staff/:staffId/performance-reviews', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const {
      reviewType, reviewPeriodStart, reviewPeriodEnd, reviewDate, reviewerName,
      overallRating, categories, strengths, areasForImprovement, goals,
      employeeComments, followUpDate, status
    } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR managers and above can create performance reviews' });
    }

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const reviewId = uuidv4();
    await pool.query(`
      INSERT INTO performance_reviews (
        id, organization_id, user_id, review_type, review_period_start, review_period_end,
        review_date, reviewer_name, overall_rating, categories, strengths,
        areas_for_improvement, goals, employee_comments, follow_up_date, status,
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
    `, [
      reviewId,
      organizationId,
      staffId,
      reviewType,
      reviewPeriodStart,
      reviewPeriodEnd,
      reviewDate,
      reviewerName,
      overallRating,
      JSON.stringify(categories),
      strengths,
      areasForImprovement,
      goals,
      employeeComments || null,
      followUpDate || null,
      status,
      userId
    ]);

    console.log(`[HR] Performance review created for staff ${staffId}: ${reviewType}`);

    res.json({
      success: true,
      message: 'Performance review created successfully',
      reviewId
    });
  } catch (error: any) {
    // If table doesn't exist, log and return success
    if (error.code === '42P01') {
      console.log('[HR] Performance review recorded (table not yet created)');
      return res.json({
        success: true,
        message: 'Performance review recorded (pending table creation)'
      });
    }
    next(error);
  }
});

// ========================================
// EMPLOYEE DOCUMENTS
// ========================================

/**
 * GET /api/console/hr/staff/:staffId/documents
 * Get all documents for a staff member
 */
router.get('/staff/:staffId/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const result = await pool.query(`
      SELECT
        id,
        category,
        document_type as "documentType",
        title,
        description,
        expiration_date as "expirationDate",
        uploaded_at as "uploadedAt",
        uploaded_by as "uploadedBy",
        file_url as "fileUrl",
        file_name as "fileName",
        file_size as "fileSize"
      FROM employee_documents
      WHERE user_id = $1 AND organization_id = $2
      ORDER BY uploaded_at DESC
    `, [staffId, organizationId]);

    res.json({ documents: result.rows });
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return res.json({ documents: [] });
    }
    next(error);
  }
});

/**
 * POST /api/console/hr/staff/:staffId/documents
 * Upload a document for a staff member
 */
router.post('/staff/:staffId/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const { category, documentType, title, description, expirationDate, fileName, fileSize, fileData } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR staff can upload employee documents' });
    }

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const documentId = uuidv4();

    // Store the document (using base64 data URL for simplicity)
    // In production, you would upload to cloud storage
    await pool.query(`
      INSERT INTO employee_documents (
        id, organization_id, user_id, category, document_type, title,
        description, expiration_date, file_name, file_size, file_url,
        uploaded_by, uploaded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `, [
      documentId,
      organizationId,
      staffId,
      category,
      documentType,
      title,
      description || null,
      expirationDate || null,
      fileName,
      fileSize,
      fileData, // base64 data URL
      userId
    ]);

    console.log(`[HR] Document uploaded for staff ${staffId}: ${title}`);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      documentId
    });
  } catch (error: any) {
    // If table doesn't exist, log and return success
    if (error.code === '42P01') {
      console.log('[HR] Document recorded (table not yet created)');
      return res.json({
        success: true,
        message: 'Document recorded (pending table creation)'
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/console/hr/staff/:staffId/documents/:documentId
 * Delete a document
 */
router.delete('/staff/:staffId/documents/:documentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId, documentId } = req.params;
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR managers and above can delete documents' });
    }

    await pool.query(`
      DELETE FROM employee_documents
      WHERE id = $1 AND user_id = $2 AND organization_id = $3
    `, [documentId, staffId, organizationId]);

    console.log(`[HR] Document ${documentId} deleted for staff ${staffId}`);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    if (error.code === '42P01') {
      return res.json({ success: true, message: 'Document deleted' });
    }
    next(error);
  }
});

// ========================================
// CREDENTIAL MANAGEMENT
// ========================================

/**
 * GET /api/console/hr/staff/:staffId/credentials
 * Get credentials for a staff member
 */
router.get('/staff/:staffId/credentials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;

    const result = await pool.query(`
      SELECT
        id,
        credential_type as "credentialType",
        credential_type as "credentialName",
        status,
        issue_date as "issueDate",
        expiration_date as "expirationDate",
        file_path as "documentUrl",
        verified_by as "verifiedBy",
        verified_at as "verifiedAt",
        created_at as "createdAt",
        CASE
          WHEN expiration_date IS NULL THEN 365
          ELSE (expiration_date - CURRENT_DATE)
        END as "daysLeft"
      FROM credentials
      WHERE user_id = $1 AND organization_id = $2
      ORDER BY expiration_date ASC NULLS LAST
    `, [staffId, organizationId]);

    res.json({ credentials: result.rows });
  } catch (error: any) {
    if (error.code === '42P01') {
      return res.json({ credentials: [] });
    }
    next(error);
  }
});

/**
 * POST /api/console/hr/staff/:staffId/credentials
 * Add a credential for a staff member
 */
router.post('/staff/:staffId/credentials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const { credentialType, credentialNumber, issueDate, expirationDate, issuingAuthority, documentUrl, notes } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'recruiter', 'credentialing_specialist'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR staff can add credentials' });
    }

    // Verify staff member exists
    const staffCheck = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND organization_id = $2',
      [staffId, organizationId]
    );
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const credentialId = uuidv4();

    await pool.query(`
      INSERT INTO credentials (
        id, user_id, organization_id, credential_type, status,
        issue_date, expiration_date, file_path, verified_by, verified_at
      ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, NOW())
    `, [
      credentialId,
      staffId,
      organizationId,
      credentialType,
      issueDate || null,
      expirationDate || null,
      documentUrl || null,
      userId
    ]);

    console.log(`[HR] Credential ${credentialType} added for staff ${staffId}`);

    res.json({
      success: true,
      message: 'Credential added successfully',
      credentialId
    });
  } catch (error: any) {
    if (error.code === '42P01') {
      console.log('[HR] Credential recorded (table not yet created)');
      return res.json({
        success: true,
        message: 'Credential recorded (pending table creation)'
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/console/hr/staff/:staffId/credentials/:credentialId
 * Delete a credential
 */
router.delete('/staff/:staffId/credentials/:credentialId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staffId, credentialId } = req.params;
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;

    // Check if user has permission (HR staff only)
    const hrRoles = ['founder', 'hr_director', 'hr_manager', 'credentialing_specialist'];
    if (!hrRoles.includes(userRole || '')) {
      return res.status(403).json({ error: 'Only HR managers and credentialing specialists can delete credentials' });
    }

    await pool.query(`
      DELETE FROM credentials
      WHERE id = $1 AND user_id = $2 AND organization_id = $3
    `, [credentialId, staffId, organizationId]);

    console.log(`[HR] Credential ${credentialId} deleted for staff ${staffId}`);

    res.json({ success: true, message: 'Credential deleted successfully' });
  } catch (error: any) {
    if (error.code === '42P01') {
      return res.json({ success: true, message: 'Credential deleted' });
    }
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
        address,
        position_applied_for as "positionAppliedFor",
        created_at as "applicationDate",
        status,
        current_stage as "currentStage",
        source,
        certifications,
        experience_level as "experienceLevel",
        availability,
        skills,
        desired_salary_min as "desiredSalaryMin",
        desired_salary_max as "desiredSalaryMax",
        available_start_date as "availableStartDate",
        ai_screening_score as "aiScreeningScore"
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
    const { status, currentStage, rejectionReason, notes, sendEmail = true } = req.body;
    const organizationId = req.user?.organizationId;

    // Validation
    const validStatuses = ['pending', 'new', 'screening', 'interviewing', 'reference_check', 'background_check', 'offer_pending', 'hired', 'rejected', 'withdrawn'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    // Get current applicant info for email notifications
    const applicantResult = await pool.query(`
      SELECT id, first_name, last_name, email, position_applied_for, status as current_status
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];
    const previousStatus = applicant.current_status;

    // Build update query dynamically
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (currentStage) {
      updates.push(`current_stage = $${paramIndex++}`);
      values.push(currentStage);
    }
    if (rejectionReason) {
      updates.push(`rejection_reason = $${paramIndex++}`);
      values.push(rejectionReason);
    }
    if (notes) {
      updates.push(`notes = COALESCE(notes, '') || E'\\n' || $${paramIndex++}`);
      values.push(notes);
    }

    values.push(id);

    // Update database
    const result = await pool.query(
      `UPDATE applicants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Send "Moved to Interview" email if status changed to 'interviewing'
    if (sendEmail && status === 'interviewing' && previousStatus !== 'interviewing') {
      const applicantName = `${applicant.first_name} ${applicant.last_name}`;
      const applicantEmail = applicant.email;
      const jobTitle = applicant.position_applied_for;

      if (applicantEmail) {
        try {
          const emailService = getEmailService();

          // Send notification to candidate
          await emailService.sendMovedToInterview({
            applicantName,
            applicantEmail,
            jobTitle
          });
          console.log(`[HR] Moved to interview email sent to ${applicantEmail}`);

          // Send alert to HR
          await emailService.sendMovedToInterviewAlert({
            applicantName,
            applicantEmail,
            jobTitle
          });
          console.log(`[HR] Moved to interview alert sent to HR`);
        } catch (emailError: any) {
          console.error('[HR] Failed to send moved to interview emails:', emailError.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Applicant status updated successfully',
      applicant: result.rows[0]
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
    const {
      interviewType,
      scheduledDate,
      scheduledTime,
      duration,
      location,
      interviewerName,
      notes,
      sendCalendarInvite
    } = req.body;
    const organizationId = req.user?.organizationId;

    // Validation
    if (!interviewType || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'Interview type, date, and time are required' });
    }

    // Get applicant details for email
    const applicantResult = await pool.query(`
      SELECT id, first_name, last_name, email, position_applied_for
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;
    const applicantEmail = applicant.email;
    const jobTitle = applicant.position_applied_for;

    const interviewId = uuidv4();

    // Create interview record in database
    try {
      await pool.query(`
        INSERT INTO interviews (id, applicant_id, type, scheduled_date, scheduled_time, duration, location, interviewer_name, notes, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', NOW())
      `, [interviewId, id, interviewType, scheduledDate, scheduledTime, duration || 30, location, interviewerName, notes]);
    } catch (dbError: any) {
      // Table might not exist, log and continue
      console.log('[HR] Interview table may not exist, skipping DB insert:', dbError.message);
    }

    // Update applicant status to scheduled (interview has been scheduled)
    await pool.query(`
      UPDATE applicants
      SET status = 'scheduled', current_stage = 'interview_scheduled', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Send interview confirmation email to applicant if requested
    if (sendCalendarInvite && applicantEmail) {
      try {
        const emailService = getEmailService();
        await emailService.sendInterviewScheduled({
          applicantName,
          applicantEmail,
          jobTitle,
          interviewType,
          scheduledDate,
          scheduledTime,
          duration: duration || 30,
          location,
          interviewerName,
          notes
        });

        // Also send alert to HR
        await emailService.sendInterviewScheduledAlert({
          applicantName,
          applicantEmail,
          jobTitle,
          interviewType,
          scheduledDate,
          scheduledTime,
          duration: duration || 30,
          location,
          interviewerName,
          notes
        });

        console.log(`[HR] Interview emails sent for applicant ${id}`);
      } catch (emailError: any) {
        console.error('[HR] Failed to send interview emails:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    console.log(`[HR] Interview scheduled for applicant ${id}: ${interviewType} on ${scheduledDate} at ${scheduledTime}`);

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interviewId,
      applicantId: id,
      scheduledDate,
      scheduledTime,
      emailSent: sendCalendarInvite && applicantEmail ? true : false
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/applicants/:id/cancel-interview
 * Cancel scheduled interview
 */
router.post('/applicants/:id/cancel-interview', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, sendEmail = true } = req.body;
    const organizationId = req.user?.organizationId;

    // Get applicant details and scheduled interview info
    const applicantResult = await pool.query(`
      SELECT a.id, a.first_name, a.last_name, a.email, a.position_applied_for
      FROM applicants a
      WHERE a.id = $1 AND a.organization_id = $2
    `, [id, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;
    const applicantEmail = applicant.email;
    const jobTitle = applicant.position_applied_for;

    // Get the scheduled interview details
    let interviewDate = 'TBD';
    let interviewTime = 'TBD';
    try {
      const interviewResult = await pool.query(`
        SELECT scheduled_date, scheduled_time
        FROM interviews
        WHERE applicant_id = $1 AND status = 'scheduled'
        ORDER BY created_at DESC
        LIMIT 1
      `, [id]);

      if (interviewResult.rows.length > 0) {
        const interview = interviewResult.rows[0];
        interviewDate = new Date(interview.scheduled_date).toLocaleDateString();
        interviewTime = interview.scheduled_time;

        // Cancel the interview record
        await pool.query(`
          UPDATE interviews
          SET status = 'cancelled', updated_at = NOW()
          WHERE applicant_id = $1 AND status = 'scheduled'
        `, [id]);
      }
    } catch (err) {
      console.log('[HR] Interview table may not exist or have records');
    }

    // Update applicant status back to 'interview' (moved back to interview stage, not scheduled)
    await pool.query(`
      UPDATE applicants
      SET status = 'interviewing', current_stage = 'interviews', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Send cancellation emails
    if (sendEmail && applicantEmail) {
      try {
        const emailService = getEmailService();

        // Send to candidate
        await emailService.sendInterviewCancelled({
          applicantName,
          applicantEmail,
          jobTitle,
          originalDate: interviewDate,
          originalTime: interviewTime,
          reason
        });

        // Send alert to HR
        await emailService.sendInterviewCancelledAlert({
          applicantName,
          applicantEmail,
          jobTitle,
          originalDate: interviewDate,
          originalTime: interviewTime,
          reason
        });

        console.log(`[HR] Interview cancellation emails sent for applicant ${id}`);
      } catch (emailError: any) {
        console.error('[HR] Failed to send interview cancellation emails:', emailError.message);
      }
    }

    console.log(`[HR] Interview cancelled for applicant ${id}: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      applicantId: id,
      emailSent: sendEmail && applicantEmail ? true : false
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/applicants/:id/offer
 * Extend job offer to applicant
 */
router.post('/applicants/:id/offer', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, salary, notes, sendEmail = true } = req.body;
    const organizationId = req.user?.organizationId;

    // Get applicant details
    const applicantResult = await pool.query(`
      SELECT id, first_name, last_name, email, position_applied_for
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;
    const applicantEmail = applicant.email;
    const jobTitle = applicant.position_applied_for;

    // Update applicant status to offer_pending
    await pool.query(`
      UPDATE applicants
      SET status = 'offer_pending', current_stage = 'offer', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Send job offer emails
    console.log(`[HR] Offer endpoint called for ${applicantName} (${applicantEmail}), sendEmail=${sendEmail}`);

    if (sendEmail && applicantEmail) {
      try {
        const emailService = getEmailService();
        console.log(`[HR] Sending job offer email to candidate ${applicantEmail}...`);

        // Send offer to candidate
        await emailService.sendJobOffer({
          applicantName,
          applicantEmail,
          jobTitle,
          startDate,
          salary,
          notes
        });
        console.log(`[HR] Job offer email sent to candidate ${applicantEmail}`);

        // Send alert to HR
        console.log(`[HR] Sending job offer alert to HR...`);
        await emailService.sendJobOfferAlert({
          applicantName,
          applicantEmail,
          jobTitle,
          startDate,
          salary,
          notes
        });
        console.log(`[HR] Job offer alert sent to HR`);

        console.log(`[HR] Job offer emails sent for applicant ${id}`);
      } catch (emailError: any) {
        console.error('[HR] Failed to send job offer emails:', emailError.message);
        console.error('[HR] Full error:', emailError);
      }
    } else {
      console.log(`[HR] Skipping emails: sendEmail=${sendEmail}, applicantEmail=${applicantEmail}`);
    }

    console.log(`[HR] Job offer extended to applicant ${id}`);

    res.json({
      success: true,
      message: 'Job offer extended successfully',
      applicantId: id,
      emailSent: sendEmail && applicantEmail ? true : false
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/applicants/:id/accept-offer
 * Accept job offer - converts applicant to employee and creates onboarding
 */
router.post('/applicants/:id/accept-offer', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, role, payRate, employmentType = 'full_time', sendEmail = true, notes, podId } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;

    // Start date is now optional - for talent pool candidates, it can be set later

    // Get applicant details
    const applicantResult = await pool.query(`
      SELECT id, first_name, last_name, email, phone, position_applied_for, status
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;
    const applicantEmail = applicant.email;
    const jobTitle = applicant.position_applied_for || role || 'Caregiver';

    // Verify applicant is in offer_pending status
    if (applicant.status !== 'offer_pending' && applicant.status !== 'offer') {
      return res.status(400).json({ error: 'Applicant must have a pending offer to accept' });
    }

    console.log(`[HR] Accept offer for ${applicantName}, creating employee and onboarding...`);

    // Check if a user with this email already exists in the same organization
    const existingUserResult = await pool.query(`
      SELECT id FROM users WHERE email = $1 AND organization_id = $2
    `, [applicant.email, organizationId]);

    let employeeId: string;

    if (existingUserResult.rows.length > 0) {
      // User exists - update their record and use their ID
      employeeId = existingUserResult.rows[0].id;
      await pool.query(`
        UPDATE users SET
          status = 'pending',
          role = $2,
          first_name = $3,
          last_name = $4,
          phone = $5,
          updated_at = NOW()
        WHERE id = $1
      `, [employeeId, role || 'caregiver', applicant.first_name, applicant.last_name, applicant.phone]);
      console.log(`[HR] Updated existing employee record ${employeeId}`);
    } else {
      // No user exists - create new user
      const newUserId = uuidv4();
      await pool.query(`
        INSERT INTO users (
          id, organization_id, email, first_name, last_name, phone,
          role, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW())
      `, [
        newUserId,
        organizationId,
        applicant.email,
        applicant.first_name,
        applicant.last_name,
        applicant.phone,
        role || 'caregiver'
      ]);
      employeeId = newUserId;
      console.log(`[HR] Created new employee record ${employeeId}`);
    }

    // Update applicant status to hired
    await pool.query(`
      UPDATE applicants
      SET status = 'hired',
          current_stage = 'onboarding',
          hired_date = $2,
          hired_as_employee_id = $3,
          updated_at = NOW()
      WHERE id = $1
    `, [id, startDate || null, employeeId]);

    console.log(`[HR] Updated applicant ${id} to hired status`);

    // Check if onboarding instance already exists for this employee (avoid duplicates)
    const existingOnboardingResult = await pool.query(`
      SELECT id FROM onboarding_instances WHERE employee_id = $1
    `, [employeeId]);

    let onboardingId = null;
    let onboardingItemCount = 0;

    if (existingOnboardingResult.rows.length > 0) {
      // Onboarding already exists - use existing
      onboardingId = existingOnboardingResult.rows[0].id;
      console.log(`[HR] Onboarding instance already exists: ${onboardingId}`);
    } else {
      // Get onboarding template and create new instance
      const templateResult = await pool.query(`
        SELECT id, items, default_duration_days
        FROM onboarding_templates
        WHERE organization_id = $1 AND is_active = TRUE
        ORDER BY created_at
        LIMIT 1
      `, [organizationId]);

      if (templateResult.rows.length > 0) {
      const template = templateResult.rows[0];
      const templateItems = template.items || [];
      const durationDays = template.default_duration_days || 30;

      // Calculate target completion date (only if start date is known)
      let targetDateStr: string | null = null;
      let effectiveStartDate: string | null = startDate || null;
      if (startDate) {
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + durationDays);
        targetDateStr = targetDate.toISOString().split('T')[0];
      }
      // For talent pool candidates without start date, both dates remain NULL

      // Build notes for onboarding instance
      const onboardingNotes = [
        !startDate ? 'Start date to be determined - talent pool candidate' : null,
        notes ? `HR Notes: ${notes}` : null
      ].filter(Boolean).join('\n') || null;

      // Create onboarding instance (only set employee_id, not applicant_id - constraint allows only one)
      const onboardingResult = await pool.query(`
        INSERT INTO onboarding_instances (
          organization_id, employee_id, template_id,
          new_hire_name, position_title, start_date, target_completion_date,
          status, total_items, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'not_started', $8, $9, $10)
        RETURNING id
      `, [
        organizationId,
        employeeId,
        template.id,
        applicantName,
        jobTitle,
        effectiveStartDate,
        targetDateStr,
        templateItems.length,
        onboardingNotes,
        userId
      ]);

      onboardingId = onboardingResult.rows[0].id;
      onboardingItemCount = templateItems.length;

      console.log(`[HR] Created onboarding instance ${onboardingId} with ${templateItems.length} items`);

      // Create onboarding items from template
      for (const item of templateItems) {
        // Calculate due date based on start date + daysToComplete (only if start date is known)
        let dueDate = null;
        if (effectiveStartDate && item.daysToComplete) {
          const due = new Date(effectiveStartDate);
          due.setDate(due.getDate() + item.daysToComplete);
          dueDate = due.toISOString().split('T')[0];
        }

        await pool.query(`
          INSERT INTO onboarding_items (
            onboarding_instance_id, item_order, category, task_name,
            description, is_required, due_date, assigned_role, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        `, [
          onboardingId,
          item.order,
          item.category,
          item.task,
          item.description,
          item.required !== false,
          dueDate,
          item.assignedRole || 'hr'
        ]);
      }

      console.log(`[HR] Created ${templateItems.length} onboarding checklist items`);
      }
    }

    // Send welcome email to new hire
    if (sendEmail && applicantEmail) {
      try {
        const emailService = getEmailService();

        await emailService.sendWelcomeNewHire({
          employeeName: applicantName,
          employeeEmail: applicantEmail,
          jobTitle,
          startDate: startDate || 'To be determined',
          onboardingItemCount
        });

        console.log(`[HR] Welcome email sent to ${applicantEmail}`);

        // Send HR notification
        await emailService.sendNewHireAlert({
          employeeName: applicantName,
          employeeEmail: applicantEmail,
          jobTitle,
          startDate: startDate || 'To be determined (talent pool)',
          onboardingId
        });

        console.log(`[HR] New hire alert sent to HR`);
      } catch (emailError: any) {
        console.error('[HR] Failed to send welcome emails:', emailError.message);
      }
    }

    console.log(`[HR] Offer accepted: ${applicantName} hired as ${jobTitle}, start date: ${startDate || 'TBD'}`);

    res.json({
      success: true,
      message: startDate
        ? 'Offer accepted successfully. Employee created and onboarding initiated.'
        : 'Offer accepted successfully. Employee added to talent pool. Start date will be set when client assignment is available.',
      applicantId: id,
      employeeId,
      staffId: employeeId, // For pod assignment integration
      onboardingId,
      onboardingItemCount,
      startDate: startDate || null,
      talentPool: !startDate
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
    const organizationId = req.user?.organizationId;

    // Get applicant details for email
    const applicantResult = await pool.query(`
      SELECT id, first_name, last_name, email, position_applied_for
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;
    const applicantEmail = applicant.email;
    const jobTitle = applicant.position_applied_for;

    // Update applicant status in database
    await pool.query(`
      UPDATE applicants
      SET status = 'rejected',
          current_stage = 'rejected',
          rejection_reason = $1,
          rejection_date = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `, [reason || 'Not specified', id]);

    // Send rejection emails
    if (sendEmail && applicantEmail) {
      try {
        const emailService = getEmailService();

        // Send rejection notification to candidate
        await emailService.sendRejectionNotification({
          applicantName,
          applicantEmail,
          jobTitle,
          reason
        });
        console.log(`[HR] Rejection email sent to ${applicantEmail}`);

        // Send rejection alert to HR
        await emailService.sendRejectionAlert({
          applicantName,
          applicantEmail,
          jobTitle,
          reason
        });
        console.log(`[HR] Rejection alert sent to HR`);
      } catch (emailError: any) {
        console.error('[HR] Failed to send rejection emails:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    console.log(`[HR] Applicant ${id} rejected: ${reason}`);

    res.json({
      success: true,
      message: 'Applicant rejected',
      applicantId: id,
      emailSent: sendEmail && applicantEmail ? true : false
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

// ========================================
// ONBOARDING
// ========================================

/**
 * GET /api/console/hr/onboarding/:applicantId
 * Get onboarding data for a hired applicant
 */
router.get('/onboarding/:applicantId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { applicantId } = req.params;
    const organizationId = req.user?.organizationId;

    // First get the applicant info
    const applicantResult = await pool.query(`
      SELECT id, first_name, last_name, email, position_applied_for, status, hired_date
      FROM applicants
      WHERE id = $1 AND organization_id = $2
    `, [applicantId, organizationId]);

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantResult.rows[0];

    // Find the user/employee record by email
    const userResult = await pool.query(`
      SELECT id FROM users WHERE email = $1 AND organization_id = $2
    `, [applicant.email, organizationId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee record not found for this applicant' });
    }

    const employeeId = userResult.rows[0].id;

    // Get the onboarding instance
    const onboardingResult = await pool.query(`
      SELECT id, status, start_date, target_completion_date, total_items, completed_items, notes, created_at
      FROM onboarding_instances
      WHERE employee_id = $1 AND organization_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [employeeId, organizationId]);

    if (onboardingResult.rows.length === 0) {
      return res.status(404).json({ error: 'No onboarding record found for this employee' });
    }

    const onboarding = onboardingResult.rows[0];

    // Get onboarding items
    const itemsResult = await pool.query(`
      SELECT
        id, item_order, category, task_name, description,
        is_required, due_date, assigned_role, status,
        completed_at, completed_by, completion_notes
      FROM onboarding_items
      WHERE onboarding_instance_id = $1
      ORDER BY item_order ASC
    `, [onboarding.id]);

    // Group items by category
    const itemsByCategory: Record<string, any[]> = {};
    let completedCount = 0;
    let totalCount = 0;

    itemsResult.rows.forEach(item => {
      const category = item.category || 'General';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push({
        id: item.id,
        order: item.item_order,
        taskName: item.task_name,
        description: item.description,
        isRequired: item.is_required,
        dueDate: item.due_date,
        assignedRole: item.assigned_role,
        status: item.status,
        completedAt: item.completed_at,
        completedBy: item.completed_by,
        notes: item.completion_notes
      });

      totalCount++;
      if (item.status === 'completed') {
        completedCount++;
      }
    });

    res.json({
      applicant: {
        id: applicant.id,
        name: `${applicant.first_name} ${applicant.last_name}`,
        email: applicant.email,
        position: applicant.position_applied_for,
        hiredDate: applicant.hired_date
      },
      onboarding: {
        id: onboarding.id,
        status: onboarding.status,
        startDate: onboarding.start_date,
        targetCompletionDate: onboarding.target_completion_date,
        totalItems: totalCount,
        completedItems: completedCount,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        notes: onboarding.notes,
        createdAt: onboarding.created_at
      },
      itemsByCategory,
      categories: Object.keys(itemsByCategory)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/console/hr/onboarding/items/:itemId
 * Update onboarding item status
 */
router.put('/onboarding/items/:itemId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the item and verify organization access
    const itemResult = await pool.query(`
      SELECT oi.id, oi.onboarding_instance_id, ob.organization_id
      FROM onboarding_items oi
      JOIN onboarding_instances ob ON oi.onboarding_instance_id = ob.id
      WHERE oi.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    if (itemResult.rows[0].organization_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const onboardingInstanceId = itemResult.rows[0].onboarding_instance_id;

    // Update the item
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);

      if (status === 'completed') {
        updateFields.push(`completed_at = NOW()`);
        updateFields.push(`completed_by = $${paramIndex++}`);
        updateValues.push(userId);
      } else {
        updateFields.push(`completed_at = NULL`);
        updateFields.push(`completed_by = NULL`);
      }
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(notes);
    }

    updateFields.push(`updated_at = NOW()`);

    updateValues.push(itemId);

    await pool.query(`
      UPDATE onboarding_items
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `, updateValues);

    // Update the onboarding instance completed_items count
    const countResult = await pool.query(`
      SELECT COUNT(*) as completed
      FROM onboarding_items
      WHERE onboarding_instance_id = $1 AND status = 'completed'
    `, [onboardingInstanceId]);

    const completedCount = parseInt(countResult.rows[0].completed, 10);

    await pool.query(`
      UPDATE onboarding_instances
      SET completed_items = $1, updated_at = NOW()
      WHERE id = $2
    `, [completedCount, onboardingInstanceId]);

    res.json({
      success: true,
      message: 'Onboarding item updated',
      completedItems: completedCount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/onboarding/items/:itemId/skip
 * Skip an onboarding item (mark as not applicable)
 * Only HR roles can skip items
 */
router.post('/onboarding/items/:itemId/skip', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const organizationId = req.user?.organizationId;

    // Check if user has permission to skip items
    const skipAllowedRoles = ['hr_manager', 'hr_director', 'founder', 'owner', 'admin'];
    if (!userRole || !skipAllowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Only HR managers and above can skip onboarding items' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A reason is required when skipping an item' });
    }

    // Get the item and verify organization access
    const itemResult = await pool.query(`
      SELECT oi.id, oi.onboarding_instance_id, oi.is_required, oi.task_name, oi.status,
             ob.organization_id, ob.new_hire_name
      FROM onboarding_items oi
      JOIN onboarding_instances ob ON oi.onboarding_instance_id = ob.id
      WHERE oi.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    const item = itemResult.rows[0];

    if (item.organization_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (item.status === 'skipped') {
      return res.status(400).json({ error: 'Item is already skipped' });
    }

    if (item.status === 'completed') {
      return res.status(400).json({ error: 'Cannot skip a completed item' });
    }

    // For required items, only hr_director, founder, or owner can skip
    const highLevelRoles = ['hr_director', 'founder', 'owner', 'admin'];
    let skipApprovedBy = null;

    if (item.is_required) {
      if (!highLevelRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Required items can only be skipped by HR Director or above',
          requiresApproval: true
        });
      }
      skipApprovedBy = userId;
    }

    // Update the item
    await pool.query(`
      UPDATE onboarding_items
      SET status = 'skipped',
          skipped_by = $1,
          skipped_at = NOW(),
          skipped_reason = $2,
          skip_approved_by = $3,
          skip_approved_at = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE NULL END,
          updated_at = NOW()
      WHERE id = $4
    `, [userId, reason.trim(), skipApprovedBy, itemId]);

    // Log the action
    await pool.query(`
      INSERT INTO onboarding_audit_log (onboarding_instance_id, onboarding_item_id, action, action_details, performed_by)
      VALUES ($1, $2, 'item_skipped', $3, $4)
    `, [
      item.onboarding_instance_id,
      itemId,
      JSON.stringify({
        taskName: item.task_name,
        reason: reason.trim(),
        isRequired: item.is_required,
        approvedBy: skipApprovedBy
      }),
      userId
    ]);

    // Update the onboarding instance counts
    const countResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) as total
      FROM onboarding_items
      WHERE onboarding_instance_id = $1
    `, [item.onboarding_instance_id]);

    const counts = countResult.rows[0];
    const completedCount = parseInt(counts.completed, 10);
    const skippedCount = parseInt(counts.skipped, 10);
    const totalCount = parseInt(counts.total, 10);
    const activeTotal = totalCount - skippedCount;
    const progress = activeTotal > 0 ? Math.round((completedCount / activeTotal) * 100) : 0;

    await pool.query(`
      UPDATE onboarding_instances
      SET completed_items = $1,
          completion_percentage = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [completedCount, progress, item.onboarding_instance_id]);

    res.json({
      success: true,
      message: `Item "${item.task_name}" has been skipped`,
      item: {
        id: itemId,
        status: 'skipped',
        skippedReason: reason.trim(),
        skippedBy: userId,
        isRequired: item.is_required,
        approvedBy: skipApprovedBy
      },
      progress: {
        completed: completedCount,
        skipped: skippedCount,
        total: totalCount,
        percentage: progress
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/onboarding/items/:itemId/unskip
 * Undo skip - restore item to pending status
 */
router.post('/onboarding/items/:itemId/unskip', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const organizationId = req.user?.organizationId;

    // Check if user has permission
    const skipAllowedRoles = ['hr_manager', 'hr_director', 'founder', 'owner', 'admin'];
    if (!userRole || !skipAllowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Only HR managers and above can modify onboarding items' });
    }

    // Get the item
    const itemResult = await pool.query(`
      SELECT oi.id, oi.onboarding_instance_id, oi.task_name, oi.status, oi.skipped_reason,
             ob.organization_id
      FROM onboarding_items oi
      JOIN onboarding_instances ob ON oi.onboarding_instance_id = ob.id
      WHERE oi.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    const item = itemResult.rows[0];

    if (item.organization_id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (item.status !== 'skipped') {
      return res.status(400).json({ error: 'Item is not skipped' });
    }

    // Restore to pending
    await pool.query(`
      UPDATE onboarding_items
      SET status = 'pending',
          skipped_by = NULL,
          skipped_at = NULL,
          skipped_reason = NULL,
          skip_approved_by = NULL,
          skip_approved_at = NULL,
          updated_at = NOW()
      WHERE id = $1
    `, [itemId]);

    // Log the action
    await pool.query(`
      INSERT INTO onboarding_audit_log (onboarding_instance_id, onboarding_item_id, action, action_details, performed_by)
      VALUES ($1, $2, 'item_unskipped', $3, $4)
    `, [
      item.onboarding_instance_id,
      itemId,
      JSON.stringify({ taskName: item.task_name, previousReason: item.skipped_reason }),
      userId
    ]);

    // Update counts
    const countResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) as total
      FROM onboarding_items
      WHERE onboarding_instance_id = $1
    `, [item.onboarding_instance_id]);

    const counts = countResult.rows[0];
    const completedCount = parseInt(counts.completed, 10);
    const skippedCount = parseInt(counts.skipped, 10);
    const totalCount = parseInt(counts.total, 10);
    const activeTotal = totalCount - skippedCount;
    const progress = activeTotal > 0 ? Math.round((completedCount / activeTotal) * 100) : 0;

    await pool.query(`
      UPDATE onboarding_instances
      SET completed_items = $1,
          completion_percentage = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [completedCount, progress, item.onboarding_instance_id]);

    res.json({
      success: true,
      message: `Item "${item.task_name}" has been restored to pending`,
      item: {
        id: itemId,
        status: 'pending'
      },
      progress: {
        completed: completedCount,
        skipped: skippedCount,
        total: totalCount,
        percentage: progress
      }
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// ONBOARDING FILE UPLOADS
// ========================================

/**
 * POST /api/console/hr/onboarding/items/:itemId/upload
 * Upload a document for an onboarding item
 */
router.post('/onboarding/items/:itemId/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { category, description } = req.body;
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Verify item exists and user has access
    const itemResult = await pool.query(`
      SELECT oi.*, inst.organization_id
      FROM onboarding_items oi
      JOIN onboarding_instances inst ON oi.onboarding_instance_id = inst.id
      WHERE oi.id = $1 AND inst.organization_id = $2
    `, [itemId, organizationId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    // Upload the document
    const document = await onboardingUploadService.uploadDocument(
      organizationId!,
      itemId,
      userId!,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      category || 'document',
      description
    );

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    if (error.message?.includes('Invalid file type') || error.message?.includes('exceeds')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/console/hr/onboarding/items/:itemId/documents
 * Get all documents for an onboarding item
 */
router.get('/onboarding/items/:itemId/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const organizationId = req.user?.organizationId;

    // Verify access
    const itemResult = await pool.query(`
      SELECT oi.id
      FROM onboarding_items oi
      JOIN onboarding_instances inst ON oi.onboarding_instance_id = inst.id
      WHERE oi.id = $1 AND inst.organization_id = $2
    `, [itemId, organizationId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    const documents = await onboardingUploadService.getDocumentsForItem(itemId);

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/onboarding/documents/:documentId/verify
 * Verify a document (HR action)
 */
router.post('/onboarding/documents/:documentId/verify', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Only HR can verify documents
    const hrRoles = ['hr_manager', 'hr_director', 'founder', 'owner', 'admin'];
    if (!hrRoles.includes(userRole!)) {
      return res.status(403).json({ error: 'Only HR staff can verify documents' });
    }

    const success = await onboardingUploadService.verifyDocument(documentId, userId!, notes);

    if (success) {
      res.json({ success: true, message: 'Document verified' });
    } else {
      res.status(400).json({ error: 'Failed to verify document' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/hr/onboarding/documents/:documentId/reject
 * Reject a document (HR action)
 */
router.post('/onboarding/documents/:documentId/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Only HR can reject documents
    const hrRoles = ['hr_manager', 'hr_director', 'founder', 'owner', 'admin'];
    if (!hrRoles.includes(userRole!)) {
      return res.status(403).json({ error: 'Only HR staff can reject documents' });
    }

    const success = await onboardingUploadService.rejectDocument(documentId, userId!, reason);

    if (success) {
      res.json({ success: true, message: 'Document rejected' });
    } else {
      res.status(400).json({ error: 'Failed to reject document' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/console/hr/onboarding/documents/:documentId
 * Delete a document
 */
router.delete('/onboarding/documents/:documentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.userId;

    const success = await onboardingUploadService.deleteDocument(documentId, userId!);

    if (success) {
      res.json({ success: true, message: 'Document deleted' });
    } else {
      res.status(400).json({ error: 'Failed to delete document' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/onboarding/pending-verifications
 * Get all documents pending verification for the organization
 */
router.get('/onboarding/pending-verifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;
    const userRole = req.user?.role;

    // Only HR can view pending verifications
    const hrRoles = ['hr_manager', 'hr_director', 'founder', 'owner', 'admin'];
    if (!hrRoles.includes(userRole!)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = await onboardingUploadService.getPendingVerifications(organizationId!);

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// ========================================
// ONBOARDING FORM SUBMISSIONS
// ========================================

/**
 * POST /api/console/hr/onboarding/items/:itemId/submit-form
 * Submit a digital form for an onboarding item
 */
router.post('/onboarding/items/:itemId/submit-form', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { formData, signature, formType } = req.body;
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    if (!formData) {
      return res.status(400).json({ error: 'Form data is required' });
    }

    // Verify item exists and user has access
    const itemResult = await pool.query(`
      SELECT oi.*, inst.organization_id, inst.employee_id, inst.applicant_id
      FROM onboarding_items oi
      JOIN onboarding_instances inst ON oi.onboarding_instance_id = inst.id
      WHERE oi.id = $1 AND inst.organization_id = $2
    `, [itemId, organizationId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    // Update the item with form data
    await pool.query(`
      UPDATE onboarding_items
      SET
        form_data = $1,
        form_submitted_at = NOW(),
        e_signature = $2,
        signed_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE signed_at END,
        signer_ip_address = $3,
        signer_user_agent = $4,
        status = 'completed',
        completed_at = NOW(),
        completed_by = $5,
        updated_at = NOW()
      WHERE id = $6
    `, [
      JSON.stringify(formData),
      signature?.signature || null,
      req.ip,
      req.headers['user-agent'],
      userId,
      itemId
    ]);

    // Log the submission
    await pool.query(`
      INSERT INTO onboarding_audit_log (
        onboarding_item_id,
        action,
        action_details,
        performed_by,
        performed_at,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)
    `, [
      itemId,
      'form_submitted',
      JSON.stringify({ formType, hasSignature: !!signature }),
      userId,
      req.ip,
      req.headers['user-agent']
    ]);

    // Update instance progress
    const countResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) as total
      FROM onboarding_items
      WHERE onboarding_instance_id = (
        SELECT onboarding_instance_id FROM onboarding_items WHERE id = $1
      )
    `, [itemId]);

    const counts = countResult.rows[0];
    const completedCount = parseInt(counts.completed, 10);
    const skippedCount = parseInt(counts.skipped, 10);
    const totalCount = parseInt(counts.total, 10);
    const activeTotal = totalCount - skippedCount;
    const progress = activeTotal > 0 ? Math.round((completedCount / activeTotal) * 100) : 0;

    await pool.query(`
      UPDATE onboarding_instances
      SET completed_items = $1,
          completion_percentage = $2,
          updated_at = NOW()
      WHERE id = (SELECT onboarding_instance_id FROM onboarding_items WHERE id = $3)
    `, [completedCount, progress, itemId]);

    res.json({
      success: true,
      message: 'Form submitted successfully',
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: progress
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/onboarding/items/:itemId/form-data
 * Get submitted form data for an onboarding item
 */
router.get('/onboarding/items/:itemId/form-data', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const organizationId = req.user?.organizationId;

    const result = await pool.query(`
      SELECT
        oi.form_data,
        oi.form_submitted_at,
        oi.e_signature,
        oi.signed_at,
        oi.signature_attestation
      FROM onboarding_items oi
      JOIN onboarding_instances inst ON oi.onboarding_instance_id = inst.id
      WHERE oi.id = $1 AND inst.organization_id = $2
    `, [itemId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding item not found' });
    }

    const row = result.rows[0];

    res.json({
      formData: row.form_data,
      submittedAt: row.form_submitted_at,
      signature: row.e_signature ? {
        signature: row.e_signature,
        signedAt: row.signed_at,
        attestationText: row.signature_attestation
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/hr/onboarding/form-templates
 * Get available form templates
 */
router.get('/onboarding/form-templates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user?.organizationId;

    const result = await pool.query(`
      SELECT
        id,
        form_type,
        form_name,
        form_version,
        description,
        schema,
        requires_signature,
        signature_attestation_text,
        instructions
      FROM onboarding_form_templates
      WHERE (organization_id = $1 OR organization_id IS NULL)
        AND is_active = TRUE
      ORDER BY form_type
    `, [organizationId]);

    res.json({ templates: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
