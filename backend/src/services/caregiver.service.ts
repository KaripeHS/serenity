/**
 * Caregiver Service
 * Handles business logic for Caregiver Portal endpoints
 *
 * Endpoints:
 * - GET /api/caregiver-portal/visits/today
 * - GET /api/caregiver-portal/expenses
 * - POST /api/caregiver-portal/expenses
 */

import { getDbClient } from '../database/client';
import { startOfDay, endOfDay } from 'date-fns';

const db = getDbClient();

export class CaregiverService {
  /**
   * Get today's schedule for a caregiver
   * Endpoint: GET /api/caregiver-portal/visits/today
   */
  async getTodayVisits(caregiverId: string, date: Date = new Date()) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const visitsQuery = `
      SELECT
        v.id as visit_id,
        c.name as client_name,
        c.address as client_address,
        c.latitude as client_latitude,
        c.longitude as client_longitude,
        c.geofence_radius_meters,
        v.scheduled_start,
        v.scheduled_end,
        v.service_type,
        v.status,
        vci.actual_check_in as check_in_time,
        vci.check_in_latitude,
        vci.check_in_longitude,
        vci.actual_check_out as check_out_time,
        vci.check_out_latitude,
        vci.check_out_longitude,
        v.notes,
        v.tasks
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN visit_check_ins vci ON v.id = vci.visit_id
      WHERE v.caregiver_id = $1
        AND v.scheduled_start >= $2
        AND v.scheduled_start <= $3
        AND v.status NOT IN ('cancelled')
      ORDER BY v.scheduled_start
    `;

    const visitsResult = await db.query(visitsQuery, [caregiverId, startDate, endDate]);

    const visits = await Promise.all(visitsResult.rows.map(async row => {
      // Get emergency contacts for client
      const contactsQuery = `
        SELECT name, relationship, phone
        FROM client_emergency_contacts
        WHERE client_id = (SELECT client_id FROM visits WHERE id = $1)
        ORDER BY priority
        LIMIT 3
      `;

      const contactsResult = await db.query(contactsQuery, [row.visit_id]);

      // Parse tasks if stored as JSON
      let tasks = [];
      if (row.tasks) {
        try {
          tasks = typeof row.tasks === 'string' ? JSON.parse(row.tasks) : row.tasks;
        } catch (e) {
          tasks = [];
        }
      }

      return {
        visitId: row.visit_id,
        clientName: row.client_name,
        clientAddress: row.client_address,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        serviceType: row.service_type,
        tasks: Array.isArray(tasks) ? tasks.map((t: any) => ({
          task: typeof t === 'string' ? t : t.task || t.description,
          completed: typeof t === 'string' ? false : t.completed || false
        })) : [],
        status: row.status,
        checkIn: row.check_in_time ? {
          time: row.check_in_time,
          location: {
            latitude: parseFloat(row.check_in_latitude),
            longitude: parseFloat(row.check_in_longitude)
          }
        } : null,
        checkOut: row.check_out_time ? {
          time: row.check_out_time,
          location: {
            latitude: parseFloat(row.check_out_latitude),
            longitude: parseFloat(row.check_out_longitude)
          }
        } : null,
        geofence: {
          latitude: parseFloat(row.client_latitude),
          longitude: parseFloat(row.client_longitude),
          radiusMeters: parseInt(row.geofence_radius_meters) || 100
        },
        notes: row.notes,
        emergencyContacts: contactsResult.rows.map(c => ({
          name: c.name,
          relationship: c.relationship,
          phone: c.phone
        }))
      };
    }));

    // Calculate summary
    const summary = {
      totalVisits: visits.length,
      completed: visits.filter(v => v.status === 'completed').length,
      remaining: visits.filter(v => v.status !== 'completed').length,
      totalHours: visits.reduce((sum, v) => {
        const start = new Date(v.scheduledStart);
        const end = new Date(v.scheduledEnd);
        return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      }, 0)
    };

    return {
      visits,
      summary
    };
  }

  /**
   * Get caregiver expenses
   * Endpoint: GET /api/caregiver-portal/expenses
   */
  async getExpenses(
    caregiverId: string,
    status?: string
  ) {
    let filters = ['caregiver_id = $1'];
    let params: any[] = [caregiverId];
    let paramIndex = 2;

    if (status) {
      filters.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = filters.join(' AND ');

    const query = `
      SELECT
        id,
        expense_type,
        date,
        description,
        amount,
        receipt_url,
        status,
        submitted_at,
        approved_at,
        approved_by,
        rejection_reason
      FROM caregiver_expenses
      WHERE ${whereClause}
      ORDER BY
        CASE status
          WHEN 'draft' THEN 1
          WHEN 'submitted' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'paid' THEN 4
          WHEN 'rejected' THEN 5
        END,
        date DESC
      LIMIT 100
    `;

    const result = await db.query(query, params);

    const expenses = result.rows.map(row => ({
      id: row.id,
      expenseType: row.expense_type,
      date: row.date,
      description: row.description,
      amount: parseFloat(row.amount),
      receiptUrl: row.receipt_url,
      status: row.status,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      rejectionReason: row.rejection_reason
    }));

    // Calculate summary
    const summaryQuery = `
      SELECT
        SUM(amount) FILTER (WHERE status = 'draft') as total_draft,
        SUM(amount) FILTER (WHERE status = 'submitted') as total_submitted,
        SUM(amount) FILTER (WHERE status = 'approved') as total_approved,
        SUM(amount) FILTER (WHERE status = 'paid' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())) as total_paid_this_month
      FROM caregiver_expenses
      WHERE caregiver_id = $1
    `;

    const summaryResult = await db.query(summaryQuery, [caregiverId]);
    const summary = summaryResult.rows[0];

    return {
      expenses,
      summary: {
        totalDraft: parseFloat(summary.total_draft) || 0,
        totalSubmitted: parseFloat(summary.total_submitted) || 0,
        totalApproved: parseFloat(summary.total_approved) || 0,
        totalPaidThisMonth: parseFloat(summary.total_paid_this_month) || 0
      }
    };
  }

  /**
   * Submit a new expense
   * Endpoint: POST /api/caregiver-portal/expenses
   */
  async submitExpense(
    organizationId: string,
    caregiverId: string,
    expenseData: {
      expenseType: string;
      date: string;
      description: string;
      amount: number;
      receiptBase64?: string;
    }
  ) {
    let receiptUrl = null;

    // If receipt provided, upload to storage (placeholder - would use S3/Azure Blob)
    if (expenseData.receiptBase64) {
      // In production, upload to cloud storage
      // receiptUrl = await uploadToS3(expenseData.receiptBase64);
      receiptUrl = `/receipts/${caregiverId}/${Date.now()}.jpg`; // Placeholder
    }

    const query = `
      INSERT INTO caregiver_expenses (
        organization_id,
        caregiver_id,
        expense_type,
        date,
        description,
        amount,
        receipt_url,
        status,
        submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted', NOW())
      RETURNING id, submitted_at
    `;

    const result = await db.query(query, [
      organizationId,
      caregiverId,
      expenseData.expenseType,
      expenseData.date,
      expenseData.description,
      expenseData.amount,
      receiptUrl
    ]);

    return {
      expenseId: result.rows[0].id,
      status: 'submitted',
      submittedAt: result.rows[0].submitted_at
    };
  }

  /**
   * Get caregiver training status
   * Used for Caregiver Portal - Training tab
   */
  async getTrainingStatus(caregiverId: string) {
    // Placeholder - would integrate with LMS system
    return {
      requiredCourses: [],
      completedCourses: [],
      inProgressCourses: [],
      complianceRate: 100
    };
  }

  /**
   * Get caregiver performance metrics
   * Used for Caregiver Portal - Performance tab
   */
  async getPerformanceMetrics(caregiverId: string) {
    const query = `
      WITH spi_data AS (
        SELECT
          AVG(daily_score) as avg_spi_score,
          AVG(punctuality_score) as avg_punctuality,
          AVG(quality_score) as avg_quality,
          AVG(client_satisfaction_score) as avg_satisfaction
        FROM spi_daily_scores
        WHERE caregiver_id = $1
          AND score_date >= NOW() - INTERVAL '30 days'
      ),
      visit_data AS (
        SELECT
          COUNT(*) as total_visits,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_visits,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM visit_check_ins vci
              WHERE vci.visit_id = v.id
                AND vci.actual_check_in <= v.scheduled_start + INTERVAL '15 minutes'
            )
          ) as on_time_visits
        FROM visits v
        WHERE caregiver_id = $1
          AND scheduled_start >= NOW() - INTERVAL '30 days'
      )
      SELECT
        s.avg_spi_score,
        s.avg_punctuality,
        s.avg_quality,
        s.avg_satisfaction,
        v.total_visits,
        v.completed_visits,
        v.on_time_visits,
        CASE
          WHEN v.total_visits > 0 THEN ROUND((v.on_time_visits::DECIMAL / v.total_visits) * 100, 1)
          ELSE 100
        END as on_time_percentage
      FROM spi_data s, visit_data v
    `;

    const result = await db.query(query, [caregiverId]);
    const row = result.rows[0];

    return {
      spiScore: Math.round((parseFloat(row.avg_spi_score) || 0) * 10) / 10,
      punctuality: Math.round((parseFloat(row.avg_punctuality) || 0) * 10) / 10,
      quality: Math.round((parseFloat(row.avg_quality) || 0) * 10) / 10,
      clientSatisfaction: Math.round((parseFloat(row.avg_satisfaction) || 0) * 10) / 10,
      totalVisits: parseInt(row.total_visits) || 0,
      completedVisits: parseInt(row.completed_visits) || 0,
      onTimePercentage: parseFloat(row.on_time_percentage) || 100
    };
  }
}

export const caregiverService = new CaregiverService();
