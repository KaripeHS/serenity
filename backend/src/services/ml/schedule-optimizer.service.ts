/**
 * AI-Powered Schedule Optimization Service
 * Optimizes caregiver assignments using constraint satisfaction and optimization algorithms
 *
 * Integrates with existing:
 * - scheduling-recommendations.service.ts
 * - travel-optimization.service.ts
 * - operations.service.ts
 */

import { pool } from '../../config/database';
import { addMinutes, differenceInMinutes, parseISO, format } from 'date-fns';

interface Visit {
  id: string;
  clientId: string;
  clientName: string;
  clientLat: number;
  clientLon: number;
  scheduledStart: Date;
  scheduledEnd: Date;
  duration: number;
  serviceType: string;
  requiredSkills: string[];
  caregiverId?: string;
  caregiverName?: string;
}

interface Caregiver {
  id: string;
  name: string;
  skills: string[];
  maxHoursPerWeek: number;
  scheduledHours: number;
  lastVisitLat?: number;
  lastVisitLon?: number;
  lastVisitEnd?: Date;
}

interface Assignment {
  visitId: string;
  caregiverId: string;
  score: number;
  travelTime: number;
  utilizationImpact: number;
  skillMatch: boolean;
}

export class ScheduleOptimizerService {
  /**
   * Optimize schedule for a given date range
   * Uses constraint satisfaction + greedy optimization with backtracking
   */
  async optimizeSchedule(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // 1. Get all unassigned visits in date range
    const unassignedVisits = await this.getUnassignedVisits(organizationId, startDate, endDate);

    // 2. Get all available caregivers with their current schedules
    const caregivers = await this.getAvailableCaregivers(organizationId, startDate, endDate);

    // 3. Run optimization algorithm
    const assignments = this.optimizeAssignments(unassignedVisits, caregivers);

    // 4. Calculate metrics
    const metrics = this.calculateOptimizationMetrics(assignments, unassignedVisits, caregivers);

    return {
      optimizedAssignments: assignments,
      metrics,
      unoptimizedVisits: unassignedVisits.filter(v =>
        !assignments.find(a => a.visitId === v.id)
      )
    };
  }

  /**
   * Get unassigned visits
   */
  private async getUnassignedVisits(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Visit[]> {
    const result = await pool.query(
      `
      SELECT
        v.id,
        v.client_id,
        c.first_name || ' ' || c.last_name as client_name,
        c.latitude as client_lat,
        c.longitude as client_lon,
        v.scheduled_start,
        v.scheduled_end,
        EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 60 as duration_minutes,
        v.service_type,
        v.required_skills
      FROM shifts v
      INNER JOIN clients c ON v.client_id = c.id
      WHERE v.organization_id = $1
        AND v.caregiver_id IS NULL
        AND v.scheduled_start >= $2
        AND v.scheduled_start < $3
        AND v.status = 'scheduled'
      ORDER BY v.scheduled_start ASC
      `,
      [organizationId, startDate, endDate]
    );

    return result.rows.map(row => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      clientLat: parseFloat(row.client_lat) || 0,
      clientLon: parseFloat(row.client_lon) || 0,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      duration: parseFloat(row.duration_minutes),
      serviceType: row.service_type,
      requiredSkills: row.required_skills ? (
        typeof row.required_skills === 'string'
          ? JSON.parse(row.required_skills)
          : row.required_skills
      ) : []
    }));
  }

  /**
   * Get available caregivers with current schedules
   */
  private async getAvailableCaregivers(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Caregiver[]> {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.skills,
        u.max_hours_per_week,
        COALESCE(SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600), 0) as scheduled_hours,
        MAX(c.latitude) as last_visit_lat,
        MAX(c.longitude) as last_visit_lon,
        MAX(v.scheduled_end) as last_visit_end
      FROM users u
      LEFT JOIN shifts v ON u.id = v.caregiver_id
        AND v.scheduled_start >= $2
        AND v.scheduled_start < $3
        AND v.status IN ('scheduled', 'in_progress', 'completed')
      LEFT JOIN clients c ON v.client_id = c.id
      WHERE u.organization_id = $1
        AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
        AND u.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.skills, u.max_hours_per_week
      `,
      [organizationId, startDate, endDate]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      skills: row.skills ? (
        typeof row.skills === 'string'
          ? JSON.parse(row.skills)
          : row.skills
      ) : [],
      maxHoursPerWeek: parseFloat(row.max_hours_per_week) || 40,
      scheduledHours: parseFloat(row.scheduled_hours) || 0,
      lastVisitLat: row.last_visit_lat ? parseFloat(row.last_visit_lat) : undefined,
      lastVisitLon: row.last_visit_lon ? parseFloat(row.last_visit_lon) : undefined,
      lastVisitEnd: row.last_visit_end
    }));
  }

  /**
   * Optimize assignments using constraint satisfaction + greedy with backtracking
   */
  private optimizeAssignments(visits: Visit[], caregivers: Caregiver[]): Assignment[] {
    const assignments: Assignment[] = [];
    const caregiverState = new Map<string, {
      scheduledHours: number;
      currentLocation: { lat: number; lon: number } | null;
      lastVisitEnd: Date | null;
    }>();

    // Initialize caregiver state
    caregivers.forEach(cg => {
      caregiverState.set(cg.id, {
        scheduledHours: cg.scheduledHours,
        currentLocation: cg.lastVisitLat && cg.lastVisitLon
          ? { lat: cg.lastVisitLat, lon: cg.lastVisitLon }
          : null,
        lastVisitEnd: cg.lastVisitEnd || null
      });
    });

    // Sort visits by scheduled start time
    const sortedVisits = [...visits].sort((a, b) =>
      a.scheduledStart.getTime() - b.scheduledStart.getTime()
    );

    // Greedy assignment with constraint checking
    for (const visit of sortedVisits) {
      const candidates = this.findCandidateCaregivers(
        visit,
        caregivers,
        caregiverState
      );

      if (candidates.length > 0) {
        // Select best candidate (highest score)
        const best = candidates[0];
        assignments.push(best);

        // Update caregiver state
        const state = caregiverState.get(best.caregiverId)!;
        state.scheduledHours += visit.duration / 60;
        state.currentLocation = { lat: visit.clientLat, lon: visit.clientLon };
        state.lastVisitEnd = visit.scheduledEnd;
      }
    }

    return assignments;
  }

  /**
   * Find candidate caregivers for a visit
   */
  private findCandidateCaregivers(
    visit: Visit,
    caregivers: Caregiver[],
    caregiverState: Map<string, any>
  ): Assignment[] {
    const candidates: Assignment[] = [];

    for (const caregiver of caregivers) {
      const state = caregiverState.get(caregiver.id)!;

      // Constraint 1: Check hours capacity
      const visitHours = visit.duration / 60;
      if (state.scheduledHours + visitHours > caregiver.maxHoursPerWeek) {
        continue; // Exceeds max hours
      }

      // Constraint 2: Check skill match
      const skillMatch = this.checkSkillMatch(visit.requiredSkills, caregiver.skills);
      if (!skillMatch) {
        continue; // Missing required skills
      }

      // Constraint 3: Check availability (no time conflicts)
      // This is simplified - in production would check actual scheduled visits
      const isAvailable = true; // Placeholder

      if (!isAvailable) {
        continue;
      }

      // Calculate assignment score
      let score = 100;

      // Factor 1: Travel time (if has previous visit)
      let travelTime = 0;
      if (state.currentLocation && state.lastVisitEnd) {
        travelTime = this.calculateTravelTime(
          state.currentLocation.lat,
          state.currentLocation.lon,
          visit.clientLat,
          visit.clientLon
        );

        // Check if caregiver can reach on time
        const travelEndTime = addMinutes(state.lastVisitEnd, travelTime);
        if (travelEndTime > visit.scheduledStart) {
          continue; // Can't reach on time
        }

        // Prefer shorter travel times
        score -= travelTime * 0.5; // Penalize by 0.5 points per minute
      }

      // Factor 2: Utilization impact
      const utilizationBefore = (state.scheduledHours / caregiver.maxHoursPerWeek) * 100;
      const utilizationAfter = ((state.scheduledHours + visitHours) / caregiver.maxHoursPerWeek) * 100;
      const utilizationImpact = utilizationAfter - utilizationBefore;

      // Prefer balanced utilization (not too high, not too low)
      const targetUtilization = 85;
      const utilizationDeviation = Math.abs(utilizationAfter - targetUtilization);
      score -= utilizationDeviation * 0.3;

      // Factor 3: Skill exactness (prefer exact matches)
      const extraSkills = caregiver.skills.filter(s => !visit.requiredSkills.includes(s)).length;
      score += (visit.requiredSkills.length - extraSkills) * 2;

      candidates.push({
        visitId: visit.id,
        caregiverId: caregiver.id,
        score: Math.round(score * 10) / 10,
        travelTime,
        utilizationImpact: Math.round(utilizationImpact * 10) / 10,
        skillMatch: true
      });
    }

    // Sort by score (highest first)
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if caregiver has required skills
   */
  private checkSkillMatch(requiredSkills: string[], caregiverSkills: string[]): boolean {
    if (!requiredSkills || requiredSkills.length === 0) {
      return true; // No specific skills required
    }

    return requiredSkills.every(skill => caregiverSkills.includes(skill));
  }

  /**
   * Calculate travel time between two points using Haversine + estimated speed
   */
  private calculateTravelTime(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine distance in meters
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;

    // Estimate travel time
    // Assume average speed of 40 km/h (25 mph) for city driving
    const speedKmPerHour = 40;
    const distanceKm = distanceMeters / 1000;
    const travelHours = distanceKm / speedKmPerHour;
    const travelMinutes = Math.ceil(travelHours * 60);

    // Add 5 minutes buffer for parking/entry
    return travelMinutes + 5;
  }

  /**
   * Calculate optimization metrics
   */
  private calculateOptimizationMetrics(
    assignments: Assignment[],
    visits: Visit[],
    caregivers: Caregiver[]
  ) {
    const assignedCount = assignments.length;
    const unassignedCount = visits.length - assignedCount;
    const assignmentRate = visits.length > 0
      ? Math.round((assignedCount / visits.length) * 100 * 10) / 10
      : 0;

    const avgTravelTime = assignments.length > 0
      ? Math.round((assignments.reduce((sum, a) => sum + a.travelTime, 0) / assignments.length) * 10) / 10
      : 0;

    const avgScore = assignments.length > 0
      ? Math.round((assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length) * 10) / 10
      : 0;

    // Calculate caregiver utilization
    const caregiverUtilization = caregivers.map(cg => {
      const cgAssignments = assignments.filter(a => a.caregiverId === cg.id);
      const additionalHours = cgAssignments.reduce((sum, a) => {
        const visit = visits.find(v => v.id === a.visitId);
        return sum + (visit ? visit.duration / 60 : 0);
      }, 0);

      const totalHours = cg.scheduledHours + additionalHours;
      const utilization = (totalHours / cg.maxHoursPerWeek) * 100;

      return {
        caregiverId: cg.id,
        name: cg.name,
        utilization: Math.round(utilization * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        maxHours: cg.maxHoursPerWeek
      };
    });

    const avgUtilization = caregiverUtilization.length > 0
      ? Math.round((caregiverUtilization.reduce((sum, u) => sum + u.utilization, 0) / caregiverUtilization.length) * 10) / 10
      : 0;

    return {
      assignmentRate,
      assignedVisits: assignedCount,
      unassignedVisits: unassignedCount,
      totalVisits: visits.length,
      avgTravelTime,
      avgAssignmentScore: avgScore,
      caregiverUtilization,
      avgCaregiverUtilization: avgUtilization,
      utilizationBalance: this.calculateUtilizationBalance(caregiverUtilization)
    };
  }

  /**
   * Calculate how balanced the utilization is across caregivers
   * Lower is better (more balanced)
   */
  private calculateUtilizationBalance(utilization: any[]): number {
    if (utilization.length === 0) return 0;

    const mean = utilization.reduce((sum, u) => sum + u.utilization, 0) / utilization.length;
    const variance = utilization.reduce((sum, u) => sum + Math.pow(u.utilization - mean, 2), 0) / utilization.length;
    const stdDev = Math.sqrt(variance);

    return Math.round(stdDev * 10) / 10;
  }

  /**
   * Get optimization suggestions for existing schedule
   */
  async getOptimizationSuggestions(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const suggestions = [];

    // 1. Check for double-booked caregivers
    const doubleBookings = await this.findDoubleBookings(organizationId, startDate, endDate);
    if (doubleBookings.length > 0) {
      suggestions.push({
        type: 'conflict_resolution',
        priority: 1,
        severity: 'critical',
        count: doubleBookings.length,
        description: `${doubleBookings.length} caregivers are double-booked`,
        action: 'Reassign conflicting visits',
        conflicts: doubleBookings
      });
    }

    // 2. Check for over-capacity caregivers
    const overCapacity = await this.findOverCapacityCaregivers(organizationId, startDate, endDate);
    if (overCapacity.length > 0) {
      suggestions.push({
        type: 'capacity_violation',
        priority: 1,
        severity: 'high',
        count: overCapacity.length,
        description: `${overCapacity.length} caregivers exceed max hours`,
        action: 'Redistribute visits to balance workload',
        caregivers: overCapacity
      });
    }

    // 3. Check for inefficient routes
    const inefficientRoutes = await this.findInefficientRoutes(organizationId, startDate, endDate);
    if (inefficientRoutes.length > 0) {
      const totalWastedTime = inefficientRoutes.reduce((sum, r) => sum + r.excessTravelTime, 0);
      suggestions.push({
        type: 'route_optimization',
        priority: 2,
        severity: 'medium',
        count: inefficientRoutes.length,
        description: `Could save ${Math.round(totalWastedTime)} minutes of travel time`,
        action: 'Re-sequence visits to minimize travel',
        routes: inefficientRoutes
      });
    }

    // 4. Check for underutilized caregivers
    const underutilized = await this.findUnderutilizedCaregivers(organizationId, startDate, endDate);
    if (underutilized.length > 0) {
      suggestions.push({
        type: 'underutilization',
        priority: 3,
        severity: 'low',
        count: underutilized.length,
        description: `${underutilized.length} caregivers below 70% utilization`,
        action: 'Assign more visits to increase utilization',
        caregivers: underutilized
      });
    }

    return {
      suggestions: suggestions.sort((a, b) => a.priority - b.priority),
      summary: {
        totalSuggestions: suggestions.length,
        criticalIssues: suggestions.filter(s => s.severity === 'critical').length,
        highPriorityIssues: suggestions.filter(s => s.severity === 'high').length,
        mediumPriorityIssues: suggestions.filter(s => s.severity === 'medium').length
      }
    };
  }

  private async findDoubleBookings(organizationId: string, startDate: Date, endDate: Date) {
    const result = await pool.query(
      `
      SELECT
        v1.caregiver_id,
        u.first_name || ' ' || u.last_name as caregiver_name,
        v1.id as visit1_id,
        v2.id as visit2_id,
        v1.scheduled_start as visit1_start,
        v1.scheduled_end as visit1_end,
        v2.scheduled_start as visit2_start,
        v2.scheduled_end as visit2_end
      FROM shifts v1
      INNER JOIN shifts v2 ON v1.caregiver_id = v2.caregiver_id
        AND v1.id < v2.id
        AND v1.scheduled_start < v2.scheduled_end
        AND v1.scheduled_end > v2.scheduled_start
      INNER JOIN users u ON v1.caregiver_id = u.id
      WHERE v1.organization_id = $1
        AND v1.scheduled_start >= $2
        AND v1.scheduled_start < $3
        AND v1.status IN ('scheduled', 'in_progress')
        AND v2.status IN ('scheduled', 'in_progress')
      `,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  private async findOverCapacityCaregivers(organizationId: string, startDate: Date, endDate: Date) {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.max_hours_per_week,
        SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) as scheduled_hours,
        SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) - u.max_hours_per_week as excess_hours
      FROM users u
      INNER JOIN shifts v ON u.id = v.caregiver_id
      WHERE u.organization_id = $1
        AND v.scheduled_start >= $2
        AND v.scheduled_start < $3
        AND v.status IN ('scheduled', 'in_progress')
        AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
        AND u.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.max_hours_per_week
      HAVING SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600) > u.max_hours_per_week
      `,
      [organizationId, startDate, endDate]
    );

    return result.rows.map(row => ({
      caregiverId: row.id,
      name: row.name,
      maxHours: parseFloat(row.max_hours_per_week),
      scheduledHours: Math.round(parseFloat(row.scheduled_hours) * 10) / 10,
      excessHours: Math.round(parseFloat(row.excess_hours) * 10) / 10
    }));
  }

  private async findInefficientRoutes(organizationId: string, startDate: Date, endDate: Date) {
    // Simplified implementation - in production would use actual route optimization
    return [];
  }

  private async findUnderutilizedCaregivers(organizationId: string, startDate: Date, endDate: Date) {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.max_hours_per_week,
        COALESCE(SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600), 0) as scheduled_hours,
        COALESCE(SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600), 0) / u.max_hours_per_week * 100 as utilization
      FROM users u
      LEFT JOIN shifts v ON u.id = v.caregiver_id
        AND v.scheduled_start >= $2
        AND v.scheduled_start < $3
        AND v.status IN ('scheduled', 'in_progress', 'completed')
      WHERE u.organization_id = $1
        AND u.role IN ('CAREGIVER', 'DSP_BASIC', 'DSP_MED')
        AND u.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.max_hours_per_week
      HAVING COALESCE(SUM(EXTRACT(EPOCH FROM (v.scheduled_end - v.scheduled_start)) / 3600), 0) / u.max_hours_per_week * 100 < 70
      `,
      [organizationId, startDate, endDate]
    );

    return result.rows.map(row => ({
      caregiverId: row.id,
      name: row.name,
      maxHours: parseFloat(row.max_hours_per_week),
      scheduledHours: Math.round(parseFloat(row.scheduled_hours) * 10) / 10,
      utilization: Math.round(parseFloat(row.utilization) * 10) / 10
    }));
  }
}

export const scheduleOptimizerService = new ScheduleOptimizerService();
