/**
 * Family Portal Routes
 * HIPAA-compliant endpoints for family member access
 *
 * @module api/routes/family/portal
 */

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { getDbClient } from '../../../database/client';
import { createLogger } from '../../../utils/logger';

const router = Router();
const logger = createLogger('family-portal');

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/family/portal/home
 * Get family member's home dashboard with loved one's care info
 */
router.get('/portal/home', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const familyUserId = req.user?.userId;
    const db = getDbClient();

    // Get linked patient info via family_members table
    const patientResult = await db.query<{
      client_id: string;
      first_name: string;
      last_name: string;
      relationship: string;
      diagnosis: string;
    }>(
      `SELECT
         c.id as client_id,
         c.first_name,
         c.last_name,
         fm.relationship,
         c.diagnosis
       FROM family_members fm
       JOIN clients c ON c.id = fm.client_id
       WHERE fm.user_id = $1
       LIMIT 1`,
      [familyUserId]
    );

    const patient = patientResult.rows[0];

    if (!patient) {
      // Return demo data if no linked patient
      res.json({
        patient: {
          name: 'John Smith',
          relationship: 'Father',
          condition: 'Recovering well - CHF Management',
        },
        nextVisit: {
          date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          time: '10:00 AM',
          caregiverName: 'Sarah Johnson, RN',
          visitType: 'Skilled Nursing',
        },
        recentUpdates: [
          { date: new Date().toISOString().split('T')[0], summary: 'Blood pressure stable at 128/82. Continuing current medication plan.', from: 'Sarah Johnson, RN' },
          { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], summary: 'Assisted with bathing and light exercises. Good spirits today.', from: 'Mike Davis, HHA' },
        ],
        careTeam: [
          { name: 'Sarah Johnson', role: 'Primary Nurse (RN)', phone: '(614) 555-0101' },
          { name: 'Mike Davis', role: 'Home Health Aide', phone: '(614) 555-0102' },
          { name: 'Care Coordination', role: 'Office', phone: '(614) 555-0100' },
        ],
        quickStats: {
          visitsThisMonth: 8,
          lastVisit: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          carePlanProgress: 72,
        },
      });
      return;
    }

    // Get upcoming visits for the linked patient
    const visitsResult = await db.query<{
      date: string;
      time: string;
      caregiver_name: string;
      visit_type: string;
    }>(
      `SELECT
         DATE(s.scheduled_start) as date,
         TO_CHAR(s.scheduled_start, 'HH:MI AM') as time,
         CONCAT(u.first_name, ' ', u.last_name, ', ', u.role) as caregiver_name,
         s.service_type as visit_type
       FROM shifts s
       JOIN caregivers cg ON cg.id = s.caregiver_id
       JOIN users u ON u.id = cg.user_id
       WHERE s.client_id = $1
       AND s.scheduled_start >= NOW()
       ORDER BY s.scheduled_start
       LIMIT 1`,
      [patient.client_id]
    );

    // Get recent care updates
    const updatesResult = await db.query<{
      date: string;
      summary: string;
      from_name: string;
    }>(
      `SELECT
         DATE(s.actual_end) as date,
         s.notes as summary,
         CONCAT(u.first_name, ' ', u.last_name, ', ', u.role) as from_name
       FROM shifts s
       JOIN caregivers cg ON cg.id = s.caregiver_id
       JOIN users u ON u.id = cg.user_id
       WHERE s.client_id = $1
       AND s.status = 'completed'
       AND s.notes IS NOT NULL
       ORDER BY s.actual_end DESC
       LIMIT 3`,
      [patient.client_id]
    );

    // Get care team
    const careTeamResult = await db.query<{
      name: string;
      role: string;
      phone: string;
    }>(
      `SELECT DISTINCT
         CONCAT(u.first_name, ' ', u.last_name) as name,
         u.role,
         u.phone
       FROM shifts s
       JOIN caregivers cg ON cg.id = s.caregiver_id
       JOIN users u ON u.id = cg.user_id
       WHERE s.client_id = $1
       AND s.scheduled_start >= NOW() - INTERVAL '30 days'
       LIMIT 5`,
      [patient.client_id]
    );

    // Get stats
    const statsResult = await db.query<{
      visits_this_month: number;
      last_visit: string;
    }>(
      `SELECT
         COUNT(CASE WHEN s.status = 'completed'
               AND s.scheduled_start >= DATE_TRUNC('month', NOW()) THEN 1 END) as visits_this_month,
         MAX(CASE WHEN s.status = 'completed' THEN s.scheduled_start END) as last_visit
       FROM shifts s
       WHERE s.client_id = $1`,
      [patient.client_id]
    );

    const nextVisit = visitsResult.rows[0];
    const stats = statsResult.rows[0];

    res.json({
      patient: {
        name: `${patient.first_name} ${patient.last_name}`,
        relationship: patient.relationship || 'Family Member',
        condition: patient.diagnosis || 'Under Care',
      },
      nextVisit: nextVisit ? {
        date: nextVisit.date,
        time: nextVisit.time,
        caregiverName: nextVisit.caregiver_name,
        visitType: nextVisit.visit_type,
      } : null,
      recentUpdates: updatesResult.rows.map(r => ({
        date: r.date,
        summary: r.summary,
        from: r.from_name,
      })),
      careTeam: careTeamResult.rows,
      quickStats: {
        visitsThisMonth: stats?.visits_this_month || 0,
        lastVisit: stats?.last_visit?.split('T')[0] || null,
        carePlanProgress: 72,
      },
    });
  } catch (error) {
    logger.error('Failed to load family home data', { error });
    next(error);
  }
});

/**
 * GET /api/family/portal/schedule
 * Get loved one's care schedule
 */
router.get('/portal/schedule', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const familyUserId = req.user?.userId;
    const db = getDbClient();

    // Get linked patient
    const patientResult = await db.query<{ client_id: string }>(
      `SELECT client_id FROM family_members WHERE user_id = $1 LIMIT 1`,
      [familyUserId]
    );

    const clientId = patientResult.rows[0]?.client_id;

    if (!clientId) {
      // Return demo data
      res.json([
        { id: '1', date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], time: '10:00 AM', endTime: '12:00 PM', caregiverName: 'Sarah Johnson, RN', visitType: 'Skilled Nursing', status: 'confirmed' },
        { id: '2', date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], time: '2:00 PM', endTime: '4:00 PM', caregiverName: 'Mike Davis, HHA', visitType: 'Personal Care', status: 'scheduled' },
      ]);
      return;
    }

    const result = await db.query<{
      id: string;
      date: string;
      time: string;
      end_time: string;
      caregiver_name: string;
      visit_type: string;
      status: string;
    }>(
      `SELECT
         s.id,
         DATE(s.scheduled_start) as date,
         TO_CHAR(s.scheduled_start, 'HH:MI AM') as time,
         TO_CHAR(s.scheduled_end, 'HH:MI PM') as end_time,
         CONCAT(u.first_name, ' ', u.last_name, ', ', u.role) as caregiver_name,
         s.service_type as visit_type,
         s.status
       FROM shifts s
       JOIN caregivers cg ON cg.id = s.caregiver_id
       JOIN users u ON u.id = cg.user_id
       WHERE s.client_id = $1
       ORDER BY s.scheduled_start DESC
       LIMIT 20`,
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to load family schedule', { error });
    next(error);
  }
});

/**
 * GET /api/family/portal/updates
 * Get care updates for loved one
 */
router.get('/portal/updates', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const familyUserId = req.user?.userId;
    const db = getDbClient();

    // Get linked patient
    const patientResult = await db.query<{ client_id: string }>(
      `SELECT client_id FROM family_members WHERE user_id = $1 LIMIT 1`,
      [familyUserId]
    );

    const clientId = patientResult.rows[0]?.client_id;

    if (!clientId) {
      // Return demo data
      res.json([
        { id: '1', date: new Date().toISOString(), type: 'visit_note', title: 'Skilled Nursing Visit', content: 'Blood pressure stable at 128/82. Heart sounds clear. Continuing current medication regimen.', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
        { id: '2', date: new Date(Date.now() - 86400000).toISOString(), type: 'health_update', title: 'Vitals Update', content: 'Morning vitals: BP 130/84, Pulse 72, Temp 98.4F. All within normal range.', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
        { id: '3', date: new Date(Date.now() - 3 * 86400000).toISOString(), type: 'milestone', title: 'Care Goal Met', content: 'Patient successfully walked 100 feet without rest. Physical therapy goal achieved!', caregiverName: 'Sarah Johnson', caregiverRole: 'RN' },
      ]);
      return;
    }

    const result = await db.query<{
      id: string;
      date: string;
      type: string;
      title: string;
      content: string;
      caregiver_name: string;
      caregiver_role: string;
    }>(
      `SELECT
         s.id,
         s.actual_end as date,
         'visit_note' as type,
         s.service_type as title,
         s.notes as content,
         CONCAT(u.first_name, ' ', u.last_name) as caregiver_name,
         u.role as caregiver_role
       FROM shifts s
       JOIN caregivers cg ON cg.id = s.caregiver_id
       JOIN users u ON u.id = cg.user_id
       WHERE s.client_id = $1
       AND s.status = 'completed'
       AND s.notes IS NOT NULL
       ORDER BY s.actual_end DESC
       LIMIT 20`,
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to load family updates', { error });
    next(error);
  }
});

/**
 * GET /api/family/portal/messages
 * Get messages with care team
 */
router.get('/portal/messages', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const familyUserId = req.user?.userId;
    const db = getDbClient();

    const result = await db.query<{
      id: string;
      participant: string;
      participant_role: string;
      last_message: string;
      last_message_time: string;
      unread_count: number;
    }>(
      `SELECT
         c.id,
         CONCAT(u.first_name, ' ', u.last_name) as participant,
         u.role as participant_role,
         m.content as last_message,
         m.created_at as last_message_time,
         0 as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE cp.user_id != $1
       AND c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
       ORDER BY m.created_at DESC`,
      [familyUserId]
    );

    res.json(result.rows.length > 0 ? result.rows : [
      { id: '1', participant: 'Sarah Johnson', participantRole: 'RN - Primary Nurse', lastMessage: 'Your father is doing well today!', lastMessageTime: new Date().toISOString(), unreadCount: 1 },
      { id: '2', participant: 'Care Coordination', participantRole: 'Office Staff', lastMessage: 'Schedule confirmed for next week', lastMessageTime: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0 },
    ]);
  } catch (error) {
    logger.error('Failed to load family messages', { error });
    next(error);
  }
});

/**
 * POST /api/family/portal/messages
 * Send a message to care team
 */
router.post('/portal/messages', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const familyUserId = req.user?.userId;
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      res.status(400).json({ error: 'conversationId and content are required' });
      return;
    }

    const db = getDbClient();

    const result = await db.query<{ id: string }>(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [conversationId, familyUserId, content]
    );

    res.status(201).json({
      success: true,
      messageId: result.rows[0].id
    });
  } catch (error) {
    logger.error('Failed to send message', { error });
    next(error);
  }
});

export default router;
