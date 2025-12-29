/**
 * Smart Scheduler Service
 * Integrates ML schedule optimizer with automated scheduling
 *
 * Features:
 * - Automated schedule generation using ML optimizer
 * - Conflict detection and resolution
 * - Automatic caregiver assignment
 * - Schedule optimization triggers
 * - Auto-notification to caregivers
 * - Fallback assignment when optimal match unavailable
 */

import { pool } from '../../config/database';
import { scheduleOptimizerService } from '../ml/schedule-optimizer.service';
import { websocketService } from '../realtime/websocket.service';


import { createLogger } from '../../utils/logger';

const logger = createLogger('smart-scheduler');
interface ScheduleRequest {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  clientId?: string; // Optional: schedule for specific client
  autoAssign: boolean;
  notifyCaregivers: boolean;
}

interface AssignmentResult {
  visitId: string;
  clientId: string;
  clientName: string;
  caregiverId: string | null;
  caregiverName: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'assigned' | 'unassigned' | 'conflict';
  conflictReason?: string;
}

export class SmartSchedulerService {
  /**
   * Auto-generate optimized schedule
   */
  async generateOptimizedSchedule(request: ScheduleRequest): Promise<{
    totalVisits: number;
    assigned: number;
    unassigned: number;
    conflicts: number;
    results: AssignmentResult[];
  }> {
    try {
      // Get unassigned visits for date range
      const visits = await this.getUnassignedVisits(
        request.organizationId,
        request.startDate,
        request.endDate,
        request.clientId
      );

      if (visits.length === 0) {
        return {
          totalVisits: 0,
          assigned: 0,
          unassigned: 0,
          conflicts: 0,
          results: []
        };
      }

      // Run ML optimization
      const optimization = await scheduleOptimizerService.optimizeSchedule(
        request.organizationId,
        request.startDate,
        request.endDate
      );

      if (!optimization) {
        throw new Error('Schedule optimization failed');
      }

      // Create a map of visit details for quick lookup
      const visitMap = new Map(visits.map(v => [v.id, v]));

      // Process optimized assignments
      const results: AssignmentResult[] = [];
      let assigned = 0;
      let unassigned = 0;
      let conflicts = 0;

      for (const assignment of optimization.optimizedAssignments) {
        try {
          const visit = visitMap.get(assignment.visitId);
          if (!visit) continue;

          // Check for conflicts before assigning
          const conflict = await this.checkConflicts(
            assignment.caregiverId,
            assignment.visitId
          );

          if (conflict) {
            results.push({
              visitId: assignment.visitId,
              clientId: visit.clientId,
              clientName: visit.clientName,
              caregiverId: null,
              caregiverName: null,
              scheduledStart: visit.scheduledStart,
              scheduledEnd: visit.scheduledEnd,
              status: 'conflict',
              conflictReason: conflict
            });
            conflicts++;
            continue;
          }

          if (request.autoAssign) {
            // Assign caregiver to visit
            await this.assignCaregiverToVisit(
              assignment.visitId,
              assignment.caregiverId
            );

            // Get caregiver name
            const caregiver = await this.getCaregiverDetails(assignment.caregiverId);

            results.push({
              visitId: assignment.visitId,
              clientId: visit.clientId,
              clientName: visit.clientName,
              caregiverId: assignment.caregiverId,
              caregiverName: caregiver?.name || 'Unknown',
              scheduledStart: visit.scheduledStart,
              scheduledEnd: visit.scheduledEnd,
              status: 'assigned'
            });

            assigned++;

            // Send real-time notification
            if (request.notifyCaregivers) {
              await this.notifyCaregiver(assignment.visitId, assignment.caregiverId);
            }
          }
        } catch (error) {
          logger.error(`[SmartScheduler] Error assigning visit ${assignment.visitId}:`, error);
          unassigned++;
        }
      }

      // Handle unassigned visits with fallback
      const unassignedVisits = visits.filter(
        v => !optimization.optimizedAssignments.find(a => a.visitId === v.id)
      );

      for (const visit of unassignedVisits) {
        const fallbackAssignment = await this.fallbackAssignment(
          request.organizationId,
          visit
        );

        if (fallbackAssignment && request.autoAssign) {
          await this.assignCaregiverToVisit(visit.id, fallbackAssignment.caregiverId);

          results.push({
            visitId: visit.id,
            clientId: visit.client_id,
            clientName: visit.client_name,
            caregiverId: fallbackAssignment.caregiverId,
            caregiverName: fallbackAssignment.caregiverName,
            scheduledStart: visit.scheduled_start,
            scheduledEnd: visit.scheduled_end,
            status: 'assigned'
          });

          assigned++;

          if (request.notifyCaregivers) {
            await this.notifyCaregiver(visit.id, fallbackAssignment.caregiverId);
          }
        } else {
          results.push({
            visitId: visit.id,
            clientId: visit.client_id,
            clientName: visit.client_name,
            caregiverId: null,
            caregiverName: null,
            scheduledStart: visit.scheduled_start,
            scheduledEnd: visit.scheduled_end,
            status: 'unassigned'
          });

          unassigned++;
        }
      }

      return {
        totalVisits: visits.length,
        assigned,
        unassigned,
        conflicts,
        results
      };
    } catch (error) {
      logger.error('[SmartScheduler] Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Get unassigned visits
   */
  private async getUnassignedVisits(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    clientId?: string
  ): Promise<any[]> {
    const queryParts = [
      `
      SELECT
        v.*,
        c.first_name || ' ' || c.last_name as client_name
      FROM shifts v
      JOIN clients c ON v.client_id = c.id
      WHERE v.organization_id = $1
        AND v.scheduled_start >= $2
        AND v.scheduled_start < $3
        AND v.caregiver_id IS NULL
        AND v.status = 'scheduled'
      `
    ];

    const params: any[] = [organizationId, startDate, endDate];

    if (clientId) {
      queryParts.push('AND v.client_id = $4');
      params.push(clientId);
    }

    queryParts.push('ORDER BY v.scheduled_start ASC');

    const result = await pool.query(queryParts.join(' '), params);
    return result.rows;
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkConflicts(
    caregiverId: string,
    visitId: string
  ): Promise<string | null> {
    // Get visit details
    const visitResult = await pool.query(
      'SELECT * FROM shifts WHERE id = $1',
      [visitId]
    );

    if (visitResult.rows.length === 0) {
      return 'Visit not found';
    }

    const visit = visitResult.rows[0];

    // Check for overlapping visits
    const overlapResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM shifts
      WHERE caregiver_id = $1
        AND id != $2
        AND status NOT IN ('cancelled', 'completed')
        AND (
          (scheduled_start >= $3 AND scheduled_start < $4) OR
          (scheduled_end > $3 AND scheduled_end <= $4) OR
          (scheduled_start <= $3 AND scheduled_end >= $4)
        )
      `,
      [caregiverId, visitId, visit.scheduled_start, visit.scheduled_end]
    );

    if (parseInt(overlapResult.rows[0].count) > 0) {
      return 'Caregiver has overlapping visit';
    }

    // Check for PTO
    const ptoResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM caregiver_pto
      WHERE caregiver_id = $1
        AND status = 'approved'
        AND (
          (start_date >= $2 AND start_date < $3) OR
          (end_date > $2 AND end_date <= $3) OR
          (start_date <= $2 AND end_date >= $3)
        )
      `,
      [caregiverId, visit.scheduled_start, visit.scheduled_end]
    );

    if (parseInt(ptoResult.rows[0].count) > 0) {
      return 'Caregiver is on PTO';
    }

    // Check availability
    const availabilityResult = await pool.query(
      `
      SELECT * FROM caregiver_availability
      WHERE caregiver_id = $1
        AND day_of_week = $2
      `,
      [caregiverId, visit.scheduled_start.getDay()]
    );

    if (availabilityResult.rows.length === 0) {
      return 'Caregiver not available on this day';
    }

    const availability = availabilityResult.rows[0];
    const visitStart = visit.scheduled_start.getHours() + visit.scheduled_start.getMinutes() / 60;
    const visitEnd = visit.scheduled_end.getHours() + visit.scheduled_end.getMinutes() / 60;

    const availStart = parseFloat(availability.start_time.split(':')[0]) + parseFloat(availability.start_time.split(':')[1]) / 60;
    const availEnd = parseFloat(availability.end_time.split(':')[0]) + parseFloat(availability.end_time.split(':')[1]) / 60;

    if (visitStart < availStart || visitEnd > availEnd) {
      return 'Visit outside caregiver availability window';
    }

    return null;
  }

  /**
   * Assign caregiver to visit
   */
  private async assignCaregiverToVisit(
    visitId: string,
    caregiverId: string
  ): Promise<void> {
    await pool.query(
      `
      UPDATE shifts
      SET caregiver_id = $1,
          assigned_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      `,
      [caregiverId, visitId]
    );

    // Log assignment
    await pool.query(
      `
      INSERT INTO schedule_audit_log (
        shift_id,
        caregiver_id,
        action,
        automated,
        created_at
      ) VALUES ($1, $2, 'assigned', true, NOW())
      `,
      [visitId, caregiverId]
    );
  }

  /**
   * Fallback assignment when optimization fails
   */
  private async fallbackAssignment(
    organizationId: string,
    visit: any
  ): Promise<{ caregiverId: string; caregiverName: string } | null> {
    // Find any available caregiver
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name
      FROM users u
      JOIN caregivers c ON c.user_id = u.id
      WHERE c.organization_id = $1
        AND u.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM shifts v
          WHERE v.caregiver_id = u.id
            AND v.status NOT IN ('cancelled', 'completed')
            AND (
              (v.scheduled_start >= $2 AND v.scheduled_start < $3) OR
              (v.scheduled_end > $2 AND v.scheduled_end <= $3) OR
              (v.scheduled_start <= $2 AND v.scheduled_end >= $3)
            )
        )
      LIMIT 1
      `,
      [organizationId, visit.scheduled_start, visit.scheduled_end]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      caregiverId: result.rows[0].id,
      caregiverName: result.rows[0].name
    };
  }

  /**
   * Get caregiver details by ID
   */
  private async getCaregiverDetails(caregiverId: string): Promise<{ id: string; name: string } | null> {
    const result = await pool.query(
      'SELECT id, first_name || \' \' || last_name as name FROM users WHERE id = $1',
      [caregiverId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get visit details by ID
   */
  private async getVisitDetails(visitId: string): Promise<any | null> {
    const result = await pool.query(
      `
      SELECT
        v.id,
        v.client_id,
        c.first_name || ' ' || c.last_name as client_name,
        v.scheduled_start,
        v.scheduled_end
      FROM shifts v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1
      `,
      [visitId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Notify caregiver of new assignment
   */
  private async notifyCaregiver(visitId: string, caregiverId: string): Promise<void> {
    // Get visit details
    const visit = await this.getVisitDetails(visitId);
    if (!visit) return;

    // Send WebSocket notification
    websocketService.broadcastScheduleChange(caregiverId, {
      type: 'new_assignment',
      visitId: visit.id,
      clientName: visit.client_name,
      scheduledStart: visit.scheduled_start,
      scheduledEnd: visit.scheduled_end
    });

    // Save notification to database
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
      ) VALUES ($1, 'schedule_assignment', $2, $3, $4, false, NOW())
      `,
      [
        caregiverId,
        'New Visit Assignment',
        `You have been assigned to visit ${visit.client_name} on ${new Date(visit.scheduled_start).toLocaleDateString()}`,
        JSON.stringify({
          visitId: visit.id,
          clientId: visit.client_id
        })
      ]
    );
  }

  /**
   * Auto-schedule recurring visits
   */
  async scheduleRecurringVisits(
    organizationId: string,
    weeksAhead: number = 4
  ): Promise<{
    created: number;
    errors: string[];
  }> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    let created = 0;
    const errors: string[] = [];

    try {
      // Get active recurring visit templates
      const templates = await pool.query(
        `
        SELECT t.*, c.pod_id 
        FROM recurring_visit_templates t
        JOIN clients c ON t.client_id = c.id
        WHERE t.organization_id = $1
          AND t.active = true
          AND (t.end_date IS NULL OR t.end_date >= NOW())
        `,
        [organizationId]
      );

      for (const template of templates.rows) {
        try {
          // Generate visits based on recurrence pattern
          const visits = this.generateRecurringVisits(template, endDate);

          for (const visit of visits) {
            // Check if visit already exists
            const existing = await pool.query(
              `
              SELECT id FROM shifts
              WHERE client_id = $1
                AND scheduled_start = $2
              `,
              [template.client_id, visit.scheduledStart]
            );

            if (existing.rows.length === 0) {
              await pool.query(
                `
                INSERT INTO shifts (
                  organization_id,
                  client_id,
                  pod_id,
                  scheduled_start,
                  scheduled_end,
                  service_type,
                  status,
                  visit_code,
                  created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, NOW())
                `,
                [
                  organizationId,
                  template.client_id,
                  template.pod_id,
                  visit.scheduledStart,
                  visit.scheduledEnd,
                  template.service_type,
                  `VISIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                ]
              );

              created++;
            }
          }
        } catch (error: any) {
          errors.push(`Template ${template.id}: ${error.message}`);
        }
      }

      return { created, errors };
    } catch (error: any) {
      logger.error('[SmartScheduler] Error scheduling recurring visits:', error);
      throw error;
    }
  }

  /**
   * Generate visits from recurring template
   */
  private generateRecurringVisits(
    template: any,
    endDate: Date
  ): Array<{ scheduledStart: Date; scheduledEnd: Date }> {
    const visits: Array<{ scheduledStart: Date; scheduledEnd: Date }> = [];
    // Handle both string (old format) and object (new format) patterns
    const patternRaw = template.recurrence_pattern;
    const pattern = (typeof patternRaw === 'object' && patternRaw !== null && 'frequency' in patternRaw)
      ? patternRaw.frequency
      : patternRaw;

    let currentDate = new Date(template.start_date);
    const duration = template.duration_minutes;

    while (currentDate <= endDate) {
      if (template.end_date && currentDate > new Date(template.end_date)) {
        break;
      }

      const scheduledStart = new Date(currentDate);
      const scheduledEnd = new Date(currentDate);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + duration);

      visits.push({ scheduledStart, scheduledEnd });

      // Increment based on pattern
      switch (pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return visits;
  }

  /**
   * Re-optimize existing schedule
   */
  async reoptimizeSchedule(
    organizationId: string,
    date: Date
  ): Promise<{
    improvements: number;
    travelTimeSaved: number; // minutes
    reassignments: number;
  }> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get current schedule
    const currentVisits = await pool.query(
      `
      SELECT * FROM shifts
      WHERE organization_id = $1
        AND scheduled_start >= $2
        AND scheduled_start <= $3
        AND status = 'scheduled'
        AND caregiver_id IS NOT NULL
      `,
      [organizationId, startDate, endDate]
    );

    // Calculate current total travel time
    const currentTravelTime = await this.calculateTotalTravelTime(currentVisits.rows);

    // Generate optimized schedule
    const optimized = await scheduleOptimizerService.optimizeSchedule(
      organizationId,
      startDate,
      endDate
    );

    if (!optimized) {
      return { improvements: 0, travelTimeSaved: 0, reassignments: 0 };
    }

    // Calculate optimized travel time
    const optimizedTravelTime = optimized.metrics.avgTravelTime * optimized.optimizedAssignments.length || 0;
    const travelTimeSaved = currentTravelTime - optimizedTravelTime;

    // Count reassignments needed
    let reassignments = 0;
    for (const assignment of optimized.optimizedAssignments) {
      const current = currentVisits.rows.find(v => v.id === assignment.visitId);
      if (current && current.caregiver_id !== assignment.caregiverId) {
        reassignments++;
      }
    }

    return {
      improvements: optimized.optimizedAssignments.length,
      travelTimeSaved,
      reassignments
    };
  }

  /**
   * Calculate total travel time for visits
   */
  private async calculateTotalTravelTime(visits: any[]): Promise<number> {
    let totalMinutes = 0;

    // Group by caregiver
    const byCaregiver = new Map<string, any[]>();
    visits.forEach(v => {
      if (!byCaregiver.has(v.caregiver_id)) {
        byCaregiver.set(v.caregiver_id, []);
      }
      byCaregiver.get(v.caregiver_id)!.push(v);
    });

    // Calculate travel time between consecutive visits for each caregiver
    for (const [_, caregiverVisits] of byCaregiver) {
      caregiverVisits.sort((a, b) =>
        new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
      );

      for (let i = 1; i < caregiverVisits.length; i++) {
        const prev = caregiverVisits[i - 1];
        const curr = caregiverVisits[i];

        // Simplified: 15 minutes average travel time
        // In production, use actual GPS coordinates and distance calculation
        totalMinutes += 15;
      }
    }

    return totalMinutes;
  }
}

export const smartSchedulerService = new SmartSchedulerService();
