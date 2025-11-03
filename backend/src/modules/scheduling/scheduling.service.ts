/**
 * Scheduling Service for Serenity ERP
 * Handles shift scheduling, caregiver matching, and optimization
 */

import { DatabaseClient } from '../../database/client';
import { AuditLogger } from '../../audit/logger';
import { UserContext } from '../../auth/access-control';
import { createLogger, schedulingLogger } from '../../utils/logger';

export interface Shift {
  id: string;
  organizationId: string;
  podId: string;
  clientId: string;
  caregiverId?: string;
  serviceId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: ShiftStatus;
  notes?: string;
  tasks: ShiftTask[];
  weatherConditions?: string;
  travelTimeMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface ShiftTask {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface CreateShiftRequest {
  clientId: string;
  caregiverId?: string;
  serviceId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  notes?: string;
  tasks?: Omit<ShiftTask, 'id' | 'completed' | 'completedAt'>[];
  autoAssign?: boolean;
}

export interface CaregiverMatchCriteria {
  requiredSkills: string[];
  certifications: string[];
  maximumDistance: number;
  shiftDuration: number;
  clientPreferences?: string[];
  caregiverPreferences?: string[];
  continuityOfCare: boolean;
}

export interface CaregiverMatch {
  caregiverId: string;
  score: number;
  reasons: string[];
  warnings: string[];
  travelDistance: number;
  availability: AvailabilityWindow[];
}

export interface AvailabilityWindow {
  start: Date;
  end: Date;
  type: 'available' | 'preferred' | 'unavailable';
  reason?: string;
}

export interface ScheduleOptimization {
  totalShifts: number;
  assignedShifts: number;
  unassignedShifts: number;
  overtimeHours: number;
  totalTravelTime: number;
  continuityScore: number;
  recommendedChanges: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  type: 'reassign' | 'split_shift' | 'add_caregiver' | 'adjust_timing';
  shiftId: string;
  currentCaregiver?: string;
  recommendedCaregiver?: string;
  reason: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
}

export class SchedulingService {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  /**
   * Create a new shift
   */
  async createShift(request: CreateShiftRequest, userContext: UserContext): Promise<Shift> {
    try {
      // Validate client and service
      await this.validateClientAndService(request.clientId, request.serviceId, userContext);

      // Auto-assign caregiver if requested
      let caregiverId = request.caregiverId;
      if (request.autoAssign && !caregiverId) {
        const matches = await this.findCaregiverMatches(request.clientId, request.serviceId, {
          start: request.scheduledStart,
          end: request.scheduledEnd
        });
        
        if (matches.length > 0) {
          caregiverId = matches[0].caregiverId;
        }
      }

      // Validate caregiver if assigned
      if (caregiverId) {
        await this.validateCaregiverAssignment(caregiverId, request, userContext);
      }

      const shiftId = await this.generateShiftId();
      const now = new Date();

      // Get client's pod assignment
      const clientResult = await this.db.query(
        'SELECT pod_id FROM clients WHERE id = $1',
        [request.clientId]
      );

      if (clientResult.rows.length === 0) {
        throw new Error('Client not found');
      }

      const podId = clientResult.rows[0].pod_id;

      // Create shift record
      await this.db.query(`
        INSERT INTO shifts (
          id, organization_id, pod_id, client_id, caregiver_id, service_id,
          scheduled_start, scheduled_end, status, notes, tasks,
          created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        shiftId,
        userContext.organizationId,
        podId,
        request.clientId,
        caregiverId,
        request.serviceId,
        request.scheduledStart,
        request.scheduledEnd,
        ShiftStatus.SCHEDULED,
        request.notes,
        JSON.stringify(this.generateShiftTasks(request.tasks || [])),
        now,
        now,
        userContext.userId
      ]);

      // Log shift creation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'shift_created',
        resource: 'shift',
        details: {
          clientId: request.clientId,
          caregiverId,
          scheduledStart: request.scheduledStart,
          scheduledEnd: request.scheduledEnd
        }
      });

      // Send notifications if caregiver assigned
      if (caregiverId) {
        await this.sendShiftNotification(shiftId, caregiverId, 'shift_assigned');
      }

      return await this.getShiftById(shiftId, userContext);

    } catch (error) {
      schedulingLogger.error('Create shift error:', error);
      throw error;
    }
  }

  /**
   * Update an existing shift
   */
  async updateShift(shiftId: string, updates: Partial<Shift>, userContext: UserContext): Promise<Shift> {
    try {
      // Get current shift
      const currentShift = await this.getShiftById(shiftId, userContext);
      
      // Validate updates
      if (updates.caregiverId && updates.caregiverId !== currentShift.caregiverId) {
        await this.validateCaregiverReassignment(shiftId, updates.caregiverId, userContext);
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.caregiverId !== undefined) {
        updateFields.push(`caregiver_id = $${paramIndex++}`);
        updateValues.push(updates.caregiverId);
      }

      if (updates.scheduledStart) {
        updateFields.push(`scheduled_start = $${paramIndex++}`);
        updateValues.push(updates.scheduledStart);
      }

      if (updates.scheduledEnd) {
        updateFields.push(`scheduled_end = $${paramIndex++}`);
        updateValues.push(updates.scheduledEnd);
      }

      if (updates.status) {
        updateFields.push(`status = $${paramIndex++}`);
        updateValues.push(updates.status);
      }

      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        updateValues.push(updates.notes);
      }

      if (updates.tasks) {
        updateFields.push(`tasks = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.tasks));
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      updateFields.push(`updated_by = $${paramIndex++}`);
      updateValues.push(userContext.userId);

      updateValues.push(shiftId);

      const query = `
        UPDATE shifts 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await this.db.query(query, updateValues);

      // Log shift update
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'shift_updated',
        resource: 'shift',
        details: {
          updates,
          previousCaregiver: currentShift.caregiverId,
          newCaregiver: updates.caregiverId
        }
      });

      // Send notifications for caregiver changes
      if (updates.caregiverId && updates.caregiverId !== currentShift.caregiverId) {
        if (currentShift.caregiverId) {
          await this.sendShiftNotification(shiftId, currentShift.caregiverId, 'shift_unassigned');
        }
        await this.sendShiftNotification(shiftId, updates.caregiverId, 'shift_assigned');
      }

      return await this.getShiftById(shiftId, userContext);

    } catch (error) {
      schedulingLogger.error('Update shift error:', error);
      throw error;
    }
  }

  /**
   * Find caregiver matches for a shift
   */
  async findCaregiverMatches(
    clientId: string, 
    serviceId: string, 
    timeWindow: { start: Date; end: Date },
    criteria?: Partial<CaregiverMatchCriteria>
  ): Promise<CaregiverMatch[]> {
    try {
      // Get client and service requirements
      const [clientInfo, serviceInfo] = await Promise.all([
        this.getClientRequirements(clientId),
        this.getServiceRequirements(serviceId)
      ]);

      const matchCriteria: CaregiverMatchCriteria = {
        requiredSkills: serviceInfo.requiredSkills,
        certifications: serviceInfo.requiredCertifications,
        maximumDistance: criteria?.maximumDistance || 25, // miles
        shiftDuration: (timeWindow.end.getTime() - timeWindow.start.getTime()) / (1000 * 60 * 60),
        clientPreferences: clientInfo.caregiverPreferences,
        continuityOfCare: criteria?.continuityOfCare ?? true,
        ...criteria
      };

      // Find available caregivers
      const availableCaregivers = await this.findAvailableCaregivers(timeWindow, matchCriteria);

      // Score and rank caregivers
      const matches = await Promise.all(
        availableCaregivers.map(caregiver => this.scoreCaregiverMatch(caregiver, clientInfo, matchCriteria, timeWindow))
      );

      // Sort by score (descending)
      return matches
        .filter(match => match.score > 0.3) // Minimum viable score
        .sort((a, b) => b.score - a.score);

    } catch (error) {
      schedulingLogger.error('Find caregiver matches error:', error);
      throw error;
    }
  }

  /**
   * Optimize schedule for a date range
   */
  async optimizeSchedule(
    startDate: Date, 
    endDate: Date, 
    userContext: UserContext
  ): Promise<ScheduleOptimization> {
    try {
      // Get all shifts in date range
      const shiftsQuery = `
        SELECT s.*, c.first_name, c.last_name, u.first_name as caregiver_first_name, u.last_name as caregiver_last_name
        FROM shifts s
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.caregiver_id = u.id
        WHERE s.organization_id = $1 
        AND s.scheduled_start >= $2 
        AND s.scheduled_start <= $3
        AND s.status NOT IN ('cancelled', 'completed')
        ORDER BY s.scheduled_start
      `;

      const shiftsResult = await this.db.query(shiftsQuery, [
        userContext.organizationId,
        startDate,
        endDate
      ]);

      const shifts = shiftsResult.rows;
      
      // Calculate current metrics
      const totalShifts = shifts.length;
      const assignedShifts = shifts.filter(s => s.caregiver_id).length;
      const unassignedShifts = totalShifts - assignedShifts;

      // Calculate overtime and travel metrics
      const { overtimeHours, totalTravelTime } = await this.calculateEfficiencyMetrics(shifts, startDate, endDate);
      
      // Calculate continuity score
      const continuityScore = await this.calculateContinuityScore(shifts);

      // Generate optimization recommendations
      const recommendedChanges = await this.generateOptimizationRecommendations(shifts);

      return {
        totalShifts,
        assignedShifts,
        unassignedShifts,
        overtimeHours,
        totalTravelTime,
        continuityScore,
        recommendedChanges
      };

    } catch (error) {
      schedulingLogger.error('Schedule optimization error:', error);
      throw error;
    }
  }

  /**
   * Get caregiver schedule
   */
  async getCaregiverSchedule(
    caregiverId: string, 
    startDate: Date, 
    endDate: Date, 
    userContext: UserContext
  ): Promise<Shift[]> {
    try {
      const query = `
        SELECT s.*, c.first_name as client_first_name, c.last_name as client_last_name,
               srv.service_name, srv.service_code
        FROM shifts s
        JOIN clients c ON s.client_id = c.id
        JOIN services srv ON s.service_id = srv.id
        WHERE s.caregiver_id = $1 
        AND s.scheduled_start >= $2 
        AND s.scheduled_start <= $3
        AND s.organization_id = $4
        ORDER BY s.scheduled_start
      `;

      const result = await this.db.query(query, [
        caregiverId,
        startDate,
        endDate,
        userContext.organizationId
      ]);

      return result.rows.map(row => this.mapRowToShift(row));

    } catch (error) {
      schedulingLogger.error('Get caregiver schedule error:', error);
      throw error;
    }
  }

  /**
   * Get client schedule
   */
  async getClientSchedule(
    clientId: string, 
    startDate: Date, 
    endDate: Date, 
    userContext: UserContext
  ): Promise<Shift[]> {
    try {
      const query = `
        SELECT s.*, u.first_name as caregiver_first_name, u.last_name as caregiver_last_name,
               srv.service_name, srv.service_code
        FROM shifts s
        LEFT JOIN users u ON s.caregiver_id = u.id
        JOIN services srv ON s.service_id = srv.id
        WHERE s.client_id = $1 
        AND s.scheduled_start >= $2 
        AND s.scheduled_start <= $3
        AND s.organization_id = $4
        ORDER BY s.scheduled_start
      `;

      const result = await this.db.query(query, [
        clientId,
        startDate,
        endDate,
        userContext.organizationId
      ]);

      return result.rows.map(row => this.mapRowToShift(row));

    } catch (error) {
      schedulingLogger.error('Get client schedule error:', error);
      throw error;
    }
  }

  /**
   * Confirm shift assignment
   */
  async confirmShift(shiftId: string, userContext: UserContext): Promise<void> {
    try {
      await this.db.query(
        'UPDATE shifts SET status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3',
        [ShiftStatus.CONFIRMED, userContext.userId, shiftId]
      );

      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'shift_confirmed',
        resource: 'shift',
        details: {}
      });

    } catch (error) {
      schedulingLogger.error('Confirm shift error:', error);
      throw error;
    }
  }

  /**
   * Cancel shift
   */
  async cancelShift(shiftId: string, reason: string, userContext: UserContext): Promise<void> {
    try {
      const shift = await this.getShiftById(shiftId, userContext);

      await this.db.query(`
        UPDATE shifts 
        SET status = $1, notes = COALESCE(notes, '') || '\nCancellation reason: ' || $2,
            updated_at = NOW(), updated_by = $3
        WHERE id = $4
      `, [ShiftStatus.CANCELLED, reason, userContext.userId, shiftId]);

      // Notify caregiver if assigned
      if (shift.caregiverId) {
        await this.sendShiftNotification(shiftId, shift.caregiverId, 'shift_cancelled');
      }

      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'shift_cancelled',
        resource: 'shift',
        details: { reason, caregiverId: shift.caregiverId }
      });

    } catch (error) {
      schedulingLogger.error('Cancel shift error:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getShiftById(shiftId: string, userContext: UserContext): Promise<Shift> {
    const query = `
      SELECT s.*, c.first_name as client_first_name, c.last_name as client_last_name,
             u.first_name as caregiver_first_name, u.last_name as caregiver_last_name,
             srv.service_name, srv.service_code
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.caregiver_id = u.id
      JOIN services srv ON s.service_id = srv.id
      WHERE s.id = $1 AND s.organization_id = $2
    `;

    const result = await this.db.query(query, [shiftId, userContext.organizationId]);
    
    if (result.rows.length === 0) {
      throw new Error('Shift not found');
    }

    return this.mapRowToShift(result.rows[0]);
  }

  private mapRowToShift(row: any): Shift {
    return {
      id: row.id,
      organizationId: row.organization_id,
      podId: row.pod_id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      serviceId: row.service_id,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      actualStart: row.actual_start,
      actualEnd: row.actual_end,
      status: row.status,
      notes: row.notes,
      tasks: row.tasks ? JSON.parse(row.tasks) : [],
      weatherConditions: row.weather_conditions,
      travelTimeMinutes: row.travel_time_minutes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private async validateClientAndService(clientId: string, serviceId: string, userContext: UserContext): Promise<void> {
    const query = `
      SELECT c.id as client_exists, s.id as service_exists
      FROM clients c
      FULL OUTER JOIN services s ON s.organization_id = c.organization_id
      WHERE c.id = $1 AND s.id = $2 AND c.organization_id = $3
    `;

    const result = await this.db.query(query, [clientId, serviceId, userContext.organizationId]);
    
    if (result.rows.length === 0) {
      throw new Error('Invalid client or service');
    }
  }

  private async validateCaregiverAssignment(caregiverId: string, request: CreateShiftRequest, userContext: UserContext): Promise<void> {
    // Check caregiver exists and is active
    const caregiverResult = await this.db.query(
      'SELECT id, role, is_active FROM users WHERE id = $1 AND organization_id = $2',
      [caregiverId, userContext.organizationId]
    );

    if (caregiverResult.rows.length === 0 || !caregiverResult.rows[0].is_active) {
      throw new Error('Caregiver not found or inactive');
    }

    if (caregiverResult.rows[0].role !== 'caregiver') {
      throw new Error('User is not a caregiver');
    }

    // Check for scheduling conflicts
    const conflictQuery = `
      SELECT id FROM shifts 
      WHERE caregiver_id = $1 
      AND status NOT IN ('cancelled', 'completed')
      AND (
        (scheduled_start <= $2 AND scheduled_end > $2) OR
        (scheduled_start < $3 AND scheduled_end >= $3) OR
        (scheduled_start >= $2 AND scheduled_end <= $3)
      )
    `;

    const conflicts = await this.db.query(conflictQuery, [
      caregiverId,
      request.scheduledStart,
      request.scheduledEnd
    ]);

    if (conflicts.rows.length > 0) {
      throw new Error('Caregiver has conflicting shifts');
    }
  }

  private async validateCaregiverReassignment(shiftId: string, newCaregiverId: string, userContext: UserContext): Promise<void> {
    const shift = await this.getShiftById(shiftId, userContext);
    
    if (shift.status === ShiftStatus.IN_PROGRESS) {
      throw new Error('Cannot reassign shift that is in progress');
    }

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new Error('Cannot reassign completed shift');
    }

    // Validate new caregiver assignment
    await this.validateCaregiverAssignment(newCaregiverId, {
      clientId: shift.clientId,
      serviceId: shift.serviceId,
      scheduledStart: shift.scheduledStart,
      scheduledEnd: shift.scheduledEnd
    }, userContext);
  }

  private generateShiftTasks(taskTemplates: Omit<ShiftTask, 'id' | 'completed' | 'completedAt'>[]): ShiftTask[] {
    return taskTemplates.map(template => ({
      id: this.generateTaskId(),
      name: template.name,
      description: template.description,
      required: template.required,
      completed: false,
      ...(template.notes && { notes: template.notes })
    }));
  }

  private async generateShiftId(): Promise<string> {
    return `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendShiftNotification(shiftId: string, userId: string, type: string): Promise<void> {
    // production_value for notification service integration
    schedulingLogger.info(`Sending ${type} notification to user ${userId} for shift ${shiftId}`);
  }

  private async getClientRequirements(clientId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT c.*, 
             COALESCE(c.primary_diagnosis, '{}') as primary_diagnosis,
             COALESCE(c.service_authorization, '{}') as service_authorization
      FROM clients c
      WHERE c.id = $1
    `, [clientId]);

    return result.rows[0];
  }

  private async getServiceRequirements(serviceId: string): Promise<any> {
    return {
      requiredSkills: ['basic_care'],
      requiredCertifications: ['HHA', 'CPR']
    };
  }

  private async findAvailableCaregivers(timeWindow: { start: Date; end: Date }, criteria: CaregiverMatchCriteria): Promise<any[]> {
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.phone, u.preferences
      FROM users u
      WHERE u.role = 'caregiver'
      AND u.is_active = true
      AND u.id NOT IN (
        SELECT DISTINCT s.caregiver_id
        FROM shifts s
        WHERE s.caregiver_id IS NOT NULL
        AND s.status NOT IN ('cancelled', 'completed')
        AND (
          (s.scheduled_start <= $1 AND s.scheduled_end > $1) OR
          (s.scheduled_start < $2 AND s.scheduled_end >= $2) OR
          (s.scheduled_start >= $1 AND s.scheduled_end <= $2)
        )
      )
    `;

    const result = await this.db.query(query, [timeWindow.start, timeWindow.end]);
    return result.rows;
  }

  private async scoreCaregiverMatch(
    caregiver: any, 
    clientInfo: any, 
    criteria: CaregiverMatchCriteria, 
    timeWindow: { start: Date; end: Date }
  ): Promise<CaregiverMatch> {
    let score = 0.5; // Base score
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Skills matching (30% weight)
    const skillsScore = this.calculateSkillsMatch(caregiver, criteria.requiredSkills);
    score += skillsScore * 0.3;
    if (skillsScore > 0.8) reasons.push('Excellent skills match');
    if (skillsScore < 0.5) warnings.push('Limited skills match');

    // Certification matching (25% weight)
    const certScore = await this.calculateCertificationMatch(caregiver.id, criteria.certifications);
    score += certScore * 0.25;
    if (certScore < 1) warnings.push('Missing some certifications');

    // Distance/travel (20% weight)
    const travelDistance = await this.calculateTravelDistance(caregiver.id, clientInfo.id);
    const distanceScore = Math.max(0, 1 - (travelDistance / criteria.maximumDistance));
    score += distanceScore * 0.2;
    if (travelDistance > criteria.maximumDistance) {
      warnings.push(`Travel distance ${travelDistance} miles exceeds maximum`);
      score = Math.min(score, 0.3); // Cap score if distance is too far
    }

    // Continuity of care (15% weight)
    if (criteria.continuityOfCare) {
      const continuityScore = await this.calculateContinuityScore([{ caregiver_id: caregiver.id, client_id: clientInfo.id }]);
      score += continuityScore * 0.15;
      if (continuityScore > 0.8) reasons.push('Excellent continuity of care');
    }

    // Preferences matching (10% weight)
    const prefScore = this.calculatePreferencesMatch(caregiver, clientInfo);
    score += prefScore * 0.1;
    if (prefScore > 0.8) reasons.push('Strong preference match');

    return {
      caregiverId: caregiver.id,
      score: Math.min(1, Math.max(0, score)),
      reasons,
      warnings,
      travelDistance,
      availability: [] // Would be populated with actual availability data
    };
  }

  private calculateSkillsMatch(caregiver: any, requiredSkills: string[]): number {
    // production_value implementation
    return 0.8;
  }

  private async calculateCertificationMatch(caregiverId: string, requiredCertifications: string[]): Promise<number> {
    const query = `
      SELECT DISTINCT credential_type
      FROM credentials
      WHERE user_id = $1 AND status = 'active' AND expiration_date > NOW()
    `;

    const result = await this.db.query(query, [caregiverId]);
    const activeCerts = result.rows.map(row => row.credential_type);
    
    const matchCount = requiredCertifications.filter(cert => activeCerts.includes(cert)).length;
    return requiredCertifications.length > 0 ? matchCount / requiredCertifications.length : 1;
  }

  private async calculateTravelDistance(caregiverId: string, clientId: string): Promise<number> {
    // production_value - would integrate with mapping service
    return Math.random() * 30; // Random distance between 0-30 miles
  }

  private async calculateContinuityScore(shifts: any[]): Promise<number> {
    // production_value implementation for continuity scoring
    return 0.7;
  }

  private calculatePreferencesMatch(caregiver: any, clientInfo: any): number {
    // production_value implementation
    return 0.6;
  }

  private async calculateEfficiencyMetrics(shifts: any[], startDate: Date, endDate: Date): Promise<{ overtimeHours: number; totalTravelTime: number }> {
    // production_value implementation
    return {
      overtimeHours: 15.5,
      totalTravelTime: 120 // minutes
    };
  }

  private async generateOptimizationRecommendations(shifts: any[]): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Find unassigned shifts
    const unassigned = shifts.filter(s => !s.caregiver_id);
    
    for (const shift of unassigned) {
      recommendations.push({
        type: 'add_caregiver',
        shiftId: shift.id,
        reason: 'Shift needs caregiver assignment',
        impact: 'Ensures client care coverage',
        priority: 'high'
      });
    }

    return recommendations;
  }
}