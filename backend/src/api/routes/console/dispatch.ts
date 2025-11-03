/**
 * On-Call Dispatch Routes
 * API endpoints for managing coverage gaps and on-call dispatch
 *
 * @module api/routes/console/dispatch
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { ApiErrors } from '../../middleware/error-handler';
import { detectCoverageGaps, getOnCallCaregivers } from '../../jobs/coverage-monitor.job';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/console/dispatch/gaps
 * Get current coverage gaps
 */
router.get('/gaps', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId, status } = req.query;

    // Get coverage gaps
    const allGaps = await detectCoverageGaps();

    // Filter by pod if specified
    let gaps = allGaps;
    if (podId) {
      gaps = gaps.filter(gap => gap.podId === podId);
    }

    // Filter by status if specified
    if (status) {
      gaps = gaps.filter(gap => gap.status === status);
    }

    // Group by status
    const statusCounts = {
      detected: gaps.filter(g => g.status === 'detected').length,
      dispatched: gaps.filter(g => g.status === 'dispatched').length,
      covered: gaps.filter(g => g.status === 'covered').length,
      escalated: gaps.filter(g => g.status === 'escalated').length
    };

    res.json({
      gaps: gaps.map(gap => ({
        id: gap.id,
        shiftId: gap.shiftId,
        client: {
          id: gap.clientId,
          name: gap.clientName,
          address: gap.clientAddress
        },
        assignedCaregiver: {
          id: gap.caregiverId,
          name: gap.caregiverName,
          phone: gap.caregiverPhone
        },
        scheduledStart: gap.scheduledStart,
        scheduledEnd: gap.scheduledEnd,
        minutesLate: Math.round(gap.minutesLate),
        pod: {
          id: gap.podId,
          name: gap.podName,
          leadId: gap.podLeadId,
          leadName: gap.podLeadName,
          leadPhone: gap.podLeadPhone
        },
        status: gap.status,
        detectedAt: gap.detectedAt,
        dispatchedAt: gap.dispatchedAt,
        coveredAt: gap.coveredAt
      })),
      summary: {
        total: gaps.length,
        ...statusCounts
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/dispatch/gaps/:gapId
 * Get detailed coverage gap information
 */
router.get('/gaps/:gapId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;

    // Get all gaps and find the specific one
    const gaps = await detectCoverageGaps();
    const gap = gaps.find(g => g.id === gapId);

    if (!gap) {
      throw ApiErrors.notFound('Coverage gap not found');
    }

    // Get on-call caregivers for this gap
    const onCallCaregivers = await getOnCallCaregivers(gap);

    res.json({
      gap: {
        id: gap.id,
        shiftId: gap.shiftId,
        client: {
          id: gap.clientId,
          name: gap.clientName,
          address: gap.clientAddress
        },
        assignedCaregiver: {
          id: gap.caregiverId,
          name: gap.caregiverName,
          phone: gap.caregiverPhone
        },
        scheduledStart: gap.scheduledStart,
        scheduledEnd: gap.scheduledEnd,
        minutesLate: Math.round(gap.minutesLate),
        pod: {
          id: gap.podId,
          name: gap.podName,
          leadId: gap.podLeadId,
          leadName: gap.podLeadName,
          leadPhone: gap.podLeadPhone
        },
        status: gap.status,
        detectedAt: gap.detectedAt,
        dispatchedAt: gap.dispatchedAt,
        coveredAt: gap.coveredAt
      },
      onCallOptions: onCallCaregivers.map(cg => ({
        caregiverId: cg.id,
        name: cg.name,
        phone: cg.phone,
        role: cg.role,
        podId: cg.podId,
        distanceMiles: Math.round(cg.distanceMiles * 10) / 10,
        samePod: cg.podId === gap.podId
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/dispatch/gaps/:gapId/dispatch
 * Dispatch on-call caregiver to cover gap
 */
router.post('/gaps/:gapId/dispatch', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;
    const { caregiverId, method = 'sms' } = req.body; // method: 'sms' | 'call' | 'both'

    if (!caregiverId) {
      throw ApiErrors.badRequest('caregiverId is required');
    }

    // Get gap details
    const gaps = await detectCoverageGaps();
    const gap = gaps.find(g => g.id === gapId);

    if (!gap) {
      throw ApiErrors.notFound('Coverage gap not found');
    }

    // TODO: Get caregiver details
    // const db = DatabaseClient.getInstance();
    // const caregiver = await db.query(`
    //   SELECT id, first_name, last_name, phone, email
    //   FROM caregivers
    //   WHERE id = $1
    // `, [caregiverId]);

    // Mock caregiver for development
    const caregiver = {
      id: caregiverId,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(937) 555-0789',
      email: 'sarah@example.com'
    };

    // TODO: Send dispatch notification
    // if (method === 'sms' || method === 'both') {
    //   await smsService.send({
    //     to: caregiver.phone,
    //     message: `Coverage needed: ${gap.clientName}, ${gap.clientAddress}, ${formatTime(gap.scheduledStart)}-${formatTime(gap.scheduledEnd)}. Reply YES to accept.`
    //   });
    // }
    //
    // if (method === 'call' || method === 'both') {
    //   await callService.initiateCall({
    //     to: caregiver.phone,
    //     message: `This is Serenity Care Partners. We have an urgent coverage need...`
    //   });
    // }

    // TODO: Log dispatch attempt
    // await db.query(`
    //   INSERT INTO dispatch_attempts (
    //     id, gap_id, caregiver_id, method, status, dispatched_at, dispatched_by
    //   ) VALUES ($1, $2, $3, $4, 'pending', NOW(), $5)
    // `, [uuidv4(), gapId, caregiverId, method, req.user?.id]);

    // TODO: Update gap status
    // await db.query(`
    //   UPDATE coverage_gaps
    //   SET status = 'dispatched', dispatched_at = NOW(), updated_at = NOW()
    //   WHERE id = $1
    // `, [gapId]);

    console.log(`[DISPATCH] Dispatched ${caregiver.firstName} ${caregiver.lastName} via ${method} for gap ${gapId}`);

    res.json({
      success: true,
      gapId,
      caregiverId,
      caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
      method,
      status: 'dispatched',
      message: `Dispatch notification sent to ${caregiver.firstName} ${caregiver.lastName} via ${method}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/dispatch/gaps/:gapId/accept
 * Accept coverage (caregiver accepts via SMS/web)
 */
router.post('/gaps/:gapId/accept', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;
    const { caregiverId } = req.body;

    if (!caregiverId) {
      throw ApiErrors.badRequest('caregiverId is required');
    }

    // Get gap details
    const gaps = await detectCoverageGaps();
    const gap = gaps.find(g => g.id === gapId);

    if (!gap) {
      throw ApiErrors.notFound('Coverage gap not found');
    }

    // TODO: Reassign shift to new caregiver
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE shifts
    //   SET caregiver_id = $1, updated_at = NOW(), updated_by = $2
    //   WHERE id = $3
    // `, [caregiverId, req.user?.id, gap.shiftId]);

    // TODO: Update gap status
    // await db.query(`
    //   UPDATE coverage_gaps
    //   SET status = 'covered', covered_at = NOW(), covered_by = $1, updated_at = NOW()
    //   WHERE id = $2
    // `, [caregiverId, gapId]);

    // TODO: Notify original caregiver of reassignment
    // await smsService.send({
    //   to: gap.caregiverPhone,
    //   message: `Your shift for ${gap.clientName} at ${formatTime(gap.scheduledStart)} has been reassigned due to no-show.`
    // });

    // TODO: Notify Pod Lead
    // await smsService.send({
    //   to: gap.podLeadPhone,
    //   message: `✅ Coverage gap for ${gap.clientName} has been covered by ${caregiver.firstName} ${caregiver.lastName}.`
    // });

    console.log(`[DISPATCH] Gap ${gapId} accepted by caregiver ${caregiverId}`);

    res.json({
      success: true,
      gapId,
      shiftId: gap.shiftId,
      caregiverId,
      status: 'covered',
      message: 'Coverage accepted and shift reassigned',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/console/dispatch/gaps/:gapId/decline
 * Decline coverage (caregiver declines via SMS/web)
 */
router.post('/gaps/:gapId/decline', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gapId } = req.params;
    const { caregiverId, reason } = req.body;

    if (!caregiverId) {
      throw ApiErrors.badRequest('caregiverId is required');
    }

    // TODO: Log decline
    // const db = DatabaseClient.getInstance();
    // await db.query(`
    //   UPDATE dispatch_attempts
    //   SET status = 'declined', response = $1, responded_at = NOW()
    //   WHERE gap_id = $2 AND caregiver_id = $3
    // `, [reason || 'No reason provided', gapId, caregiverId]);

    console.log(`[DISPATCH] Caregiver ${caregiverId} declined gap ${gapId}: ${reason || 'No reason'}`);

    res.json({
      success: true,
      gapId,
      caregiverId,
      status: 'declined',
      message: 'Decline recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/dispatch/on-call
 * Get list of caregivers currently on-call
 */
router.get('/on-call', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { podId } = req.query;

    // TODO: Query database for on-call caregivers
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     c.id,
    //     c.first_name || ' ' || c.last_name as name,
    //     c.phone,
    //     c.role,
    //     c.pod_id,
    //     p.name as pod_name,
    //     c.on_call_start,
    //     c.on_call_end
    //   FROM caregivers c
    //   JOIN pods p ON p.id = c.pod_id
    //   WHERE c.status = 'active'
    //     AND c.on_call = true
    //     AND (c.pod_id = $1 OR $1 IS NULL)
    //   ORDER BY p.name, c.first_name
    // `, [podId || null]);

    // Mock on-call caregivers
    const mockOnCall = [
      {
        id: 'cg-003',
        name: 'Sarah Johnson',
        phone: '(937) 555-0789',
        role: 'HHA',
        podId: 'pod-001',
        podName: 'Pod-1 (Dayton)',
        onCallStart: new Date().toISOString(),
        onCallEnd: new Date(Date.now() + 12 * 60 * 60000).toISOString() // 12 hours from now
      },
      {
        id: 'cg-004',
        name: 'Emily Rodriguez',
        phone: '(937) 555-0654',
        role: 'HHA',
        podId: 'pod-002',
        podName: 'Pod-2 (Columbus)',
        onCallStart: new Date().toISOString(),
        onCallEnd: new Date(Date.now() + 8 * 60 * 60000).toISOString() // 8 hours from now
      }
    ];

    res.json({
      onCallCaregivers: mockOnCall,
      count: mockOnCall.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/console/dispatch/history
 * Get dispatch history
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status, limit = 50 } = req.query;

    // TODO: Query database for dispatch history
    // const db = DatabaseClient.getInstance();
    // const result = await db.query(`
    //   SELECT
    //     da.id,
    //     da.gap_id,
    //     da.caregiver_id,
    //     c.first_name || ' ' || c.last_name as caregiver_name,
    //     da.method,
    //     da.status,
    //     da.dispatched_at,
    //     da.responded_at,
    //     da.response,
    //     cg.shift_id,
    //     cl.first_name || ' ' || cl.last_name as client_name
    //   FROM dispatch_attempts da
    //   JOIN caregivers c ON c.id = da.caregiver_id
    //   JOIN coverage_gaps cg ON cg.id = da.gap_id
    //   JOIN clients cl ON cl.id = cg.client_id
    //   WHERE (da.dispatched_at >= $1 OR $1 IS NULL)
    //     AND (da.dispatched_at <= $2 OR $2 IS NULL)
    //     AND (da.status = $3 OR $3 IS NULL)
    //   ORDER BY da.dispatched_at DESC
    //   LIMIT $4
    // `, [startDate || null, endDate || null, status || null, limit]);

    // Mock dispatch history
    const mockHistory = [
      {
        id: 'attempt-001',
        gapId: 'gap-001',
        caregiverId: 'cg-003',
        caregiverName: 'Sarah Johnson',
        method: 'sms',
        status: 'accepted',
        dispatchedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        respondedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        response: 'YES',
        shiftId: 'shift-123',
        clientName: 'Margaret Johnson'
      }
    ];

    res.json({
      history: mockHistory,
      count: mockHistory.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
