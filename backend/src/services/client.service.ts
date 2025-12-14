/**
 * Client Portal Service
 * Business logic for Client & Family Portal endpoints
 *
 * Endpoints:
 * - GET /api/client-portal/overview
 * - GET /api/client-portal/care-plan
 * - GET /api/client-portal/visits
 * - GET /api/client-portal/invoices
 */

import { pool } from '../config/database';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export class ClientService {
  /**
   * GET /api/client-portal/overview
   * Get overview for client portal with upcoming visits, recent activity, care team
   *
   * @param clientId - Client ID (from authenticated user)
   * @returns Overview data with upcoming visits, recent activity, care team
   */
  async getOverview(clientId: string) {
    // Parallel query execution for performance
    const [upcomingVisits, recentActivity, careTeam, currentCarePlan] = await Promise.all([
      this.getUpcomingVisits(clientId, 7), // Next 7 days
      this.getRecentActivity(clientId, 30), // Last 30 days
      this.getCareTeam(clientId),
      this.getCurrentCarePlan(clientId)
    ]);

    return {
      upcomingVisits,
      recentActivity,
      careTeam,
      currentCarePlan
    };
  }

  /**
   * Get upcoming visits for client (next N days)
   */
  private async getUpcomingVisits(clientId: string, days: number) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const result = await pool.query(
      `
      SELECT
        v.id as visit_id,
        v.scheduled_start,
        v.scheduled_end,
        v.service_type,
        v.status,
        u.id as caregiver_id,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name,
        u.phone as caregiver_phone,
        vc.check_in_time,
        vc.check_out_time
      FROM visits v
      LEFT JOIN users u ON v.caregiver_id = u.id
      LEFT JOIN visit_check_ins vc ON v.id = vc.visit_id
      WHERE v.client_id = $1
        AND v.scheduled_start >= NOW()
        AND v.scheduled_start <= $2
        AND v.status != 'cancelled'
      ORDER BY v.scheduled_start ASC
      `,
      [clientId, endDate]
    );

    return result.rows.map(row => ({
      visitId: row.visit_id,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      serviceType: row.service_type,
      status: row.status,
      caregiver: row.caregiver_id ? {
        id: row.caregiver_id,
        name: `${row.caregiver_first_name} ${row.caregiver_last_name}`,
        phone: row.caregiver_phone
      } : null,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time
    }));
  }

  /**
   * Get recent activity (completed visits, incident reports, etc.)
   */
  private async getRecentActivity(clientId: string, days: number) {
    const startDate = subDays(new Date(), days);

    const result = await pool.query(
      `
      SELECT
        v.id as visit_id,
        v.scheduled_start,
        v.scheduled_end,
        v.service_type,
        v.status,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name,
        vc.check_in_time,
        vc.check_out_time,
        vc.notes as visit_notes
      FROM visits v
      LEFT JOIN users u ON v.caregiver_id = u.id
      LEFT JOIN visit_check_ins vc ON v.id = vc.visit_id
      WHERE v.client_id = $1
        AND v.scheduled_start >= $2
        AND v.status IN ('completed', 'missed')
      ORDER BY v.scheduled_start DESC
      LIMIT 20
      `,
      [clientId, startDate]
    );

    return result.rows.map(row => ({
      visitId: row.visit_id,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      serviceType: row.service_type,
      status: row.status,
      caregiverName: `${row.caregiver_first_name} ${row.caregiver_last_name}`,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      notes: row.visit_notes
    }));
  }

  /**
   * Get care team for client (assigned caregivers, RN supervisor, etc.)
   */
  private async getCareTeam(clientId: string) {
    const result = await pool.query(
      `
      SELECT DISTINCT
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.role,
        u.phone,
        u.email,
        COUNT(v.id) as total_visits
      FROM users u
      INNER JOIN visits v ON u.id = v.caregiver_id
      WHERE v.client_id = $1
        AND v.scheduled_start >= NOW() - INTERVAL '90 days'
      GROUP BY u.id, u.first_name, u.last_name, u.role, u.phone, u.email
      ORDER BY total_visits DESC
      LIMIT 10
      `,
      [clientId]
    );

    return result.rows.map(row => ({
      userId: row.user_id,
      name: `${row.first_name} ${row.last_name}`,
      role: row.role,
      phone: row.phone,
      email: row.email,
      totalVisits: parseInt(row.total_visits)
    }));
  }

  /**
   * Get current care plan summary
   */
  private async getCurrentCarePlan(clientId: string) {
    const result = await pool.query(
      `
      SELECT
        id,
        plan_name,
        start_date,
        end_date,
        status,
        weekly_hours,
        services
      FROM care_plans
      WHERE client_id = $1
        AND status = 'active'
      ORDER BY start_date DESC
      LIMIT 1
      `,
      [clientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      planId: row.id,
      planName: row.plan_name,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      weeklyHours: parseFloat(row.weekly_hours),
      services: row.services
    };
  }

  /**
   * GET /api/client-portal/care-plan
   * Get detailed care plan with goals, interventions, and progress
   *
   * @param clientId - Client ID (from authenticated user)
   * @returns Complete care plan details
   */
  async getCarePlan(clientId: string) {
    // Get active care plan
    const planResult = await pool.query(
      `
      SELECT
        cp.id,
        cp.plan_name,
        cp.start_date,
        cp.end_date,
        cp.status,
        cp.weekly_hours,
        cp.services,
        cp.goals,
        cp.interventions,
        cp.physician_orders,
        cp.created_at,
        cp.updated_at,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        u.role as created_by_role
      FROM care_plans cp
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.client_id = $1
        AND cp.status = 'active'
      ORDER BY cp.start_date DESC
      LIMIT 1
      `,
      [clientId]
    );

    if (planResult.rows.length === 0) {
      return null;
    }

    const plan = planResult.rows[0];

    // Parse JSON fields
    let services = [];
    let goals = [];
    let interventions = [];
    let physicianOrders = [];

    try {
      services = typeof plan.services === 'string' ? JSON.parse(plan.services) : plan.services || [];
      goals = typeof plan.goals === 'string' ? JSON.parse(plan.goals) : plan.goals || [];
      interventions = typeof plan.interventions === 'string' ? JSON.parse(plan.interventions) : plan.interventions || [];
      physicianOrders = typeof plan.physician_orders === 'string' ? JSON.parse(plan.physician_orders) : plan.physician_orders || [];
    } catch (e) {
      // Graceful degradation for malformed JSON
    }

    // Get progress notes for this care plan
    const notesResult = await pool.query(
      `
      SELECT
        id,
        note_date,
        note_type,
        content,
        created_by,
        created_at
      FROM care_plan_notes
      WHERE care_plan_id = $1
      ORDER BY note_date DESC
      LIMIT 10
      `,
      [plan.id]
    );

    return {
      planId: plan.id,
      planName: plan.plan_name,
      startDate: plan.start_date,
      endDate: plan.end_date,
      status: plan.status,
      weeklyHours: parseFloat(plan.weekly_hours),
      services,
      goals,
      interventions,
      physicianOrders,
      createdBy: {
        name: `${plan.created_by_first_name} ${plan.created_by_last_name}`,
        role: plan.created_by_role
      },
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      progressNotes: notesResult.rows.map(note => ({
        noteId: note.id,
        noteDate: note.note_date,
        noteType: note.note_type,
        content: note.content,
        createdBy: note.created_by,
        createdAt: note.created_at
      }))
    };
  }

  /**
   * GET /api/client-portal/visits
   * Get visit history with filters
   *
   * @param clientId - Client ID (from authenticated user)
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @param status - Optional status filter
   * @returns Visit history
   */
  async getVisits(
    clientId: string,
    startDate: Date,
    endDate: Date,
    status?: string
  ) {
    let query = `
      SELECT
        v.id as visit_id,
        v.scheduled_start,
        v.scheduled_end,
        v.service_type,
        v.status,
        u.id as caregiver_id,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name,
        u.phone as caregiver_phone,
        vc.check_in_time,
        vc.check_out_time,
        vc.check_in_latitude,
        vc.check_in_longitude,
        vc.check_out_latitude,
        vc.check_out_longitude,
        vc.notes as visit_notes,
        vc.tasks_completed
      FROM visits v
      LEFT JOIN users u ON v.caregiver_id = u.id
      LEFT JOIN visit_check_ins vc ON v.id = vc.visit_id
      WHERE v.client_id = $1
        AND v.scheduled_start >= $2
        AND v.scheduled_start <= $3
    `;

    const params: any[] = [clientId, startDate, endDate];

    if (status) {
      query += ` AND v.status = $4`;
      params.push(status);
    }

    query += ` ORDER BY v.scheduled_start DESC LIMIT 100`;

    const result = await pool.query(query, params);

    return result.rows.map(row => {
      let tasksCompleted = [];
      try {
        tasksCompleted = typeof row.tasks_completed === 'string'
          ? JSON.parse(row.tasks_completed)
          : row.tasks_completed || [];
      } catch (e) {
        tasksCompleted = [];
      }

      return {
        visitId: row.visit_id,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        serviceType: row.service_type,
        status: row.status,
        caregiver: row.caregiver_id ? {
          id: row.caregiver_id,
          name: `${row.caregiver_first_name} ${row.caregiver_last_name}`,
          phone: row.caregiver_phone
        } : null,
        checkIn: row.check_in_time ? {
          time: row.check_in_time,
          latitude: row.check_in_latitude,
          longitude: row.check_in_longitude
        } : null,
        checkOut: row.check_out_time ? {
          time: row.check_out_time,
          latitude: row.check_out_latitude,
          longitude: row.check_out_longitude
        } : null,
        notes: row.visit_notes,
        tasksCompleted
      };
    });
  }

  /**
   * GET /api/client-portal/invoices
   * Get billing invoices for client
   *
   * @param clientId - Client ID (from authenticated user)
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @param status - Optional status filter
   * @returns Invoice history
   */
  async getInvoices(
    clientId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string
  ) {
    let query = `
      SELECT
        bi.id as invoice_id,
        bi.invoice_number,
        bi.invoice_date,
        bi.due_date,
        bi.total_amount,
        bi.amount_paid,
        bi.balance,
        bi.status,
        bi.billing_period_start,
        bi.billing_period_end,
        bi.created_at
      FROM billing_invoices bi
      WHERE bi.client_id = $1
    `;

    const params: any[] = [clientId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND bi.invoice_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND bi.invoice_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (status) {
      query += ` AND bi.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY bi.invoice_date DESC LIMIT 50`;

    const result = await pool.query(query, params);

    // Get summary statistics
    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'pending' THEN balance ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'overdue' THEN balance ELSE 0 END) as total_overdue
      FROM billing_invoices
      WHERE client_id = $1
      `,
      [clientId]
    );

    const summary = summaryResult.rows[0];

    return {
      invoices: result.rows.map(row => ({
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        dueDate: row.due_date,
        totalAmount: parseFloat(row.total_amount),
        amountPaid: parseFloat(row.amount_paid),
        balance: parseFloat(row.balance),
        status: row.status,
        billingPeriod: {
          start: row.billing_period_start,
          end: row.billing_period_end
        },
        createdAt: row.created_at
      })),
      summary: {
        totalInvoices: parseInt(summary.total_invoices),
        totalPending: parseFloat(summary.total_pending) || 0,
        totalPaid: parseFloat(summary.total_paid) || 0,
        totalOverdue: parseFloat(summary.total_overdue) || 0
      }
    };
  }
}

export const clientService = new ClientService();
