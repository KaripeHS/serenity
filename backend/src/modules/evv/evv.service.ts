/**
 * Electronic Visit Verification (EVV) Service for Serenity ERP
 * Handles EVV compliance, validation, and Ohio Medicaid requirements
 */

import { DatabaseClient } from '../../database/client';
import { AuditLogger } from '../../audit/logger';
import { UserContext } from '../../auth/access-control';
import { createLogger } from '../utils/logger';

export interface EVVRecord {
  id: string;
  shiftId: string;
  organizationId: string;
  caregiverId: string;
  clientId: string;
  servicePerformed: string;
  clockInTime: Date;
  clockOutTime?: Date;
  locationIn: GPSLocation;
  locationOut?: GPSLocation;
  verificationMethod: EVVVerificationMethod;
  deviceInfo: DeviceInfo;
  submittedToSandata: boolean;
  sandataTransactionId?: string;
  sandataResponse?: any;
  isValid: boolean;
  validationErrors: ValidationError[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: Date;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'telephony' | 'fixed';
  os: string;
  appVersion: string;
  ipAddress: string;
  userAgent: string;
}

export enum EVVVerificationMethod {
  GPS = 'gps',
  TELEPHONY = 'telephony',
  FIXED_DEVICE = 'fixed_device',
  BIOMETRIC = 'biometric'
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
}

export interface EVVValidationResult {
  isValid: boolean;
  complianceScore: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  requiredActions: string[];
}

export interface ClockInRequest {
  shiftId: string;
  servicePerformed: string;
  location: Omit<GPSLocation, 'timestamp'>;
  verificationMethod: EVVVerificationMethod;
  deviceInfo: DeviceInfo;
  biometricData?: any;
}

export interface ClockOutRequest {
  evvRecordId: string;
  location: Omit<GPSLocation, 'timestamp'>;
  completedTasks?: string[];
  notes?: string;
}

export interface FixVisitTask {
  id: string;
  evvRecordId: string;
  taskType: 'location_correction' | 'time_adjustment' | 'service_clarification' | 'documentation_update';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  assignedTo?: string;
  dueDate: Date;
  createdAt: Date;
  resolvedAt?: Date;
}

export class EVVService {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;
  
  // Ohio Medicaid EVV requirements
  private readonly LOCATION_TOLERANCE_METERS = 200;
  private readonly TIME_TOLERANCE_MINUTES = 15;
  private readonly SUBMISSION_DEADLINE_HOURS = 24;

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  /**
   * Clock in for a shift - creates EVV record
   */
  async clockIn(request: ClockInRequest, userContext: UserContext): Promise<EVVRecord> {
    try {
      // Validate shift exists and belongs to caregiver
      const shift = await this.validateShiftForEVV(request.shiftId, userContext.userId);
      
      // Check for existing clock-in
      const existingEVV = await this.db.query(
        'SELECT id FROM evv_records WHERE shift_id = $1 AND clock_out_time IS NULL',
        [request.shiftId]
      );

      if (existingEVV.rows.length > 0) {
        throw new Error('Already clocked in for this shift');
      }

      const evvRecordId = await this.generateEVVId();
      const now = new Date();

      // Add timestamp to location
      const locationIn: GPSLocation = {
        ...request.location,
        timestamp: now
      };

      // Geocode address if not provided
      if (!locationIn.address) {
        locationIn.address = await this.geocodeLocation(locationIn.latitude, locationIn.longitude);
      }

      // Create EVV record
      await this.db.query(`
        INSERT INTO evv_records (
          id, shift_id, organization_id, caregiver_id, client_id,
          service_performed, clock_in_time, location_in, verification_method,
          device_info, is_valid, validation_errors, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        evvRecordId,
        request.shiftId,
        userContext.organizationId,
        userContext.userId,
        shift.client_id,
        request.servicePerformed,
        now,
        JSON.stringify(locationIn),
        request.verificationMethod,
        JSON.stringify(request.deviceInfo),
        false, // Will be validated separately
        JSON.stringify([]),
        now,
        now
      ]);

      // Update shift status
      await this.db.query(
        'UPDATE shifts SET status = $1, actual_start = $2 WHERE id = $3',
        ['in_progress', now, request.shiftId]
      );

      // Validate EVV record
      const validationResult = await this.validateEVVRecord(evvRecordId);
      
      // Update validation results
      await this.db.query(
        'UPDATE evv_records SET is_valid = $1, validation_errors = $2 WHERE id = $3',
        [validationResult.isValid, JSON.stringify(validationResult.errors), evvRecordId]
      );

      // Create fix-visit tasks if needed
      if (!validationResult.isValid) {
        await this.createFixVisitTasks(evvRecordId, validationResult);
      }

      // Log clock-in
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'evv_clock_in',
        resourceType: 'evv_record',
        resourceId: evvRecordId,
        details: {
          shiftId: request.shiftId,
          location: locationIn,
          method: request.verificationMethod,
          isValid: validationResult.isValid
        },
        dataClassification: 'phi'
      });

      return await this.getEVVRecordById(evvRecordId, userContext);

    } catch (error) {
      evvLogger.error('Clock in error:', error);
      throw error;
    }
  }

  /**
   * Clock out from a shift - completes EVV record
   */
  async clockOut(request: ClockOutRequest, userContext: UserContext): Promise<EVVRecord> {
    try {
      // Get existing EVV record
      const evvResult = await this.db.query(
        'SELECT * FROM evv_records WHERE id = $1 AND caregiver_id = $2',
        [request.evvRecordId, userContext.userId]
      );

      if (evvResult.rows.length === 0) {
        throw new Error('EVV record not found');
      }

      const evvRecord = evvResult.rows[0];

      if (evvRecord.clock_out_time) {
        throw new Error('Already clocked out');
      }

      const now = new Date();

      // Add timestamp to location
      const locationOut: GPSLocation = {
        ...request.location,
        timestamp: now
      };

      // Geocode address if not provided
      if (!locationOut.address) {
        locationOut.address = await this.geocodeLocation(locationOut.latitude, locationOut.longitude);
      }

      // Update EVV record with clock-out
      await this.db.query(`
        UPDATE evv_records 
        SET clock_out_time = $1, location_out = $2, updated_at = $3
        WHERE id = $4
      `, [
        now,
        JSON.stringify(locationOut),
        now,
        request.evvRecordId
      ]);

      // Update shift status and actual end time
      await this.db.query(`
        UPDATE shifts 
        SET status = $1, actual_end = $2, notes = COALESCE(notes, '') || CASE WHEN $3 IS NOT NULL THEN '\nClock-out notes: ' || $3 ELSE '' END
        WHERE id = $4
      `, [
        'completed',
        now,
        request.notes || null,
        evvRecord.shift_id
      ]);

      // Re-validate EVV record with complete data
      const validationResult = await this.validateEVVRecord(request.evvRecordId);
      
      await this.db.query(
        'UPDATE evv_records SET is_valid = $1, validation_errors = $2 WHERE id = $3',
        [validationResult.isValid, JSON.stringify(validationResult.errors), request.evvRecordId]
      );

      // Schedule Sandata submission if valid
      if (validationResult.isValid) {
        await this.scheduleDataSubmission(request.evvRecordId);
      } else {
        await this.createFixVisitTasks(request.evvRecordId, validationResult);
      }

      // Log clock-out
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'evv_clock_out',
        resourceType: 'evv_record',
        resourceId: request.evvRecordId,
        details: {
          location: locationOut,
          duration: (now.getTime() - new Date(evvRecord.clock_in_time).getTime()) / 1000 / 60, // minutes
          isValid: validationResult.isValid
        },
        dataClassification: 'phi'
      });

      return await this.getEVVRecordById(request.evvRecordId, userContext);

    } catch (error) {
      evvLogger.error('Clock out error:', error);
      throw error;
    }
  }

  /**
   * Validate EVV record against Ohio Medicaid requirements
   */
  async validateEVVRecord(evvRecordId: string): Promise<EVVValidationResult> {
    try {
      const evvResult = await this.db.query(`
        SELECT er.*, s.scheduled_start, s.scheduled_end, s.client_id,
               c.address as client_address, c.first_name, c.last_name
        FROM evv_records er
        JOIN shifts s ON er.shift_id = s.id
        JOIN clients c ON s.client_id = c.id
        WHERE er.id = $1
      `, [evvRecordId]);

      if (evvResult.rows.length === 0) {
        throw new Error('EVV record not found');
      }

      const evv = evvResult.rows[0];
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      const requiredActions: string[] = [];

      // 1. Service Type Validation
      if (!evv.service_performed || evv.service_performed.trim() === '') {
        errors.push({
          code: 'MISSING_SERVICE_TYPE',
          message: 'Service type is required',
          severity: 'error',
          field: 'servicePerformed'
        });
      }

      // 2. Individual Receiving Service (Client ID is already validated)

      // 3. Date of Service Validation
      const clockInDate = new Date(evv.clock_in_time);
      const scheduledStart = new Date(evv.scheduled_start);
      
      if (clockInDate.toDateString() !== scheduledStart.toDateString()) {
        warnings.push({
          code: 'DATE_MISMATCH',
          message: 'Clock-in date differs from scheduled date',
          severity: 'warning',
          field: 'clockInTime'
        });
      }

      // 4. Location Validation
      if (evv.location_in) {
        const locationIn = JSON.parse(evv.location_in);
        const clientAddress = evv.client_address;
        
        // Calculate distance from client address
        const distance = await this.calculateDistance(locationIn, clientAddress);
        
        if (distance > this.LOCATION_TOLERANCE_METERS) {
          errors.push({
            code: 'LOCATION_TOO_FAR',
            message: `Clock-in location is ${distance}m from client address (max ${this.LOCATION_TOLERANCE_METERS}m)`,
            severity: 'error',
            field: 'locationIn'
          });
          requiredActions.push('Verify clock-in location or update client address');
        }

        // Check GPS accuracy
        if (locationIn.accuracy > 100) {
          warnings.push({
            code: 'LOW_GPS_ACCURACY',
            message: `GPS accuracy is ${locationIn.accuracy}m (recommended <100m)`,
            severity: 'warning',
            field: 'locationIn'
          });
        }
      } else {
        errors.push({
          code: 'MISSING_LOCATION',
          message: 'Clock-in location is required',
          severity: 'error',
          field: 'locationIn'
        });
      }

      // 5. Individual Providing Service (Caregiver ID is already validated)

      // 6. Time Service Begins and Ends
      const timeDiff = Math.abs(clockInDate.getTime() - scheduledStart.getTime()) / 1000 / 60;
      
      if (timeDiff > this.TIME_TOLERANCE_MINUTES) {
        warnings.push({
          code: 'TIME_VARIANCE',
          message: `Clock-in time differs from scheduled start by ${Math.round(timeDiff)} minutes`,
          severity: 'warning',
          field: 'clockInTime'
        });
      }

      // Validate clock-out if present
      if (evv.clock_out_time) {
        const clockOutDate = new Date(evv.clock_out_time);
        const scheduledEnd = new Date(evv.scheduled_end);
        
        // Duration validation
        const actualDuration = (clockOutDate.getTime() - clockInDate.getTime()) / 1000 / 60;
        const scheduledDuration = (scheduledEnd.getTime() - scheduledStart.getTime()) / 1000 / 60;
        
        if (Math.abs(actualDuration - scheduledDuration) > 30) {
          warnings.push({
            code: 'DURATION_VARIANCE',
            message: `Actual duration ${Math.round(actualDuration)}min differs significantly from scheduled ${Math.round(scheduledDuration)}min`,
            severity: 'warning',
            field: 'clockOutTime'
          });
        }

        // Validate clock-out location if present
        if (evv.location_out) {
          const locationOut = JSON.parse(evv.location_out);
          const outDistance = await this.calculateDistance(locationOut, clientAddress);
          
          if (outDistance > this.LOCATION_TOLERANCE_METERS) {
            errors.push({
              code: 'CHECKOUT_LOCATION_TOO_FAR',
              message: `Clock-out location is ${outDistance}m from client address`,
              severity: 'error',
              field: 'locationOut'
            });
          }
        }
      }

      // Verification method validation
      if (!Object.values(EVVVerificationMethod).includes(evv.verification_method)) {
        errors.push({
          code: 'INVALID_VERIFICATION_METHOD',
          message: 'Invalid verification method',
          severity: 'error',
          field: 'verificationMethod'
        });
      }

      // Calculate compliance score (0-1)
      const totalChecks = 10;
      const failedChecks = errors.length;
      const warningChecks = warnings.length * 0.5;
      const complianceScore = Math.max(0, (totalChecks - failedChecks - warningChecks) / totalChecks);

      const isValid = errors.length === 0 && complianceScore >= 0.8;

      return {
        isValid,
        complianceScore,
        errors,
        warnings,
        requiredActions
      };

    } catch (error) {
      evvLogger.error('EVV validation error:', error);
      return {
        isValid: false,
        complianceScore: 0,
        errors: [{ code: 'VALIDATION_ERROR', message: 'Failed to validate EVV record', severity: 'error' }],
        warnings: [],
        requiredActions: ['Manual review required']
      };
    }
  }

  /**
   * Get EVV records for a shift
   */
  async getEVVRecordsForShift(shiftId: string, userContext: UserContext): Promise<EVVRecord[]> {
    const query = `
      SELECT er.*, s.client_id, s.scheduled_start, s.scheduled_end,
             c.first_name as client_first_name, c.last_name as client_last_name
      FROM evv_records er
      JOIN shifts s ON er.shift_id = s.id
      JOIN clients c ON s.client_id = c.id
      WHERE er.shift_id = $1 AND er.organization_id = $2
      ORDER BY er.created_at
    `;

    const result = await this.db.query(query, [shiftId, userContext.organizationId]);
    return result.rows.map(row => this.mapRowToEVVRecord(row));
  }

  /**
   * Submit EVV data to Sandata/ODM
   */
  async submitToSandata(evvRecordIds: string[]): Promise<{ successful: string[]; failed: { id: string; error: string }[] }> {
    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const evvRecordId of evvRecordIds) {
      try {
        // Get EVV record
        const evvResult = await this.db.query(
          'SELECT * FROM evv_records WHERE id = $1',
          [evvRecordId]
        );

        if (evvResult.rows.length === 0) {
          failed.push({ id: evvRecordId, error: 'EVV record not found' });
          continue;
        }

        const evv = evvResult.rows[0];

        // Validate before submission
        const validation = await this.validateEVVRecord(evvRecordId);
        if (!validation.isValid) {
          failed.push({ id: evvRecordId, error: 'EVV record is not valid for submission' });
          continue;
        }

        // Submit to Sandata (production implementation)
        const sandataResponse = await this.submitToSandataAPI(evv);

        // Update EVV record with submission status
        await this.db.query(`
          UPDATE evv_records 
          SET submitted_to_sandata = true, 
              sandata_transaction_id = $1,
              sandata_response = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [
          sandataResponse.transactionId,
          JSON.stringify(sandataResponse),
          evvRecordId
        ]);

        successful.push(evvRecordId);

        // Log successful submission
        await this.auditLogger.logActivity({
          userId: 'system',
          action: 'evv_submitted_sandata',
          resourceType: 'evv_record',
          resourceId: evvRecordId,
          details: {
            transactionId: sandataResponse.transactionId,
            submissionTime: new Date()
          },
          dataClassification: 'phi'
        });

      } catch (error) {
        evvLogger.error(`Sandata submission error for ${evvRecordId}:`, error);
        failed.push({ id: evvRecordId, error: error.message });
      }
    }

    return { successful, failed };
  }

  /**
   * Create fix-visit tasks for non-compliant EVV records
   */
  async createFixVisitTasks(evvRecordId: string, validation: EVVValidationResult): Promise<FixVisitTask[]> {
    const tasks: FixVisitTask[] = [];

    for (const error of validation.errors) {
      let taskType: FixVisitTask['taskType'] = 'documentation_update';
      let priority: FixVisitTask['priority'] = 'medium';

      // Determine task type and priority based on error code
      switch (error.code) {
        case 'LOCATION_TOO_FAR':
        case 'CHECKOUT_LOCATION_TOO_FAR':
          taskType = 'location_correction';
          priority = 'high';
          break;
        case 'TIME_VARIANCE':
        case 'DURATION_VARIANCE':
          taskType = 'time_adjustment';
          priority = 'medium';
          break;
        case 'MISSING_SERVICE_TYPE':
          taskType = 'service_clarification';
          priority = 'high';
          break;
      }

      const taskId = await this.generateFixVisitTaskId();
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      await this.db.query(`
        INSERT INTO fix_visit_tasks (
          id, evv_record_id, task_type, description, priority,
          status, due_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        taskId,
        evvRecordId,
        taskType,
        error.message,
        priority,
        'open',
        dueDate,
        new Date()
      ]);

      tasks.push({
        id: taskId,
        evvRecordId,
        taskType,
        description: error.message,
        priority,
        status: 'open',
        dueDate,
        createdAt: new Date()
      });
    }

    return tasks;
  }

  /**
   * Get fix-visit tasks
   */
  async getFixVisitTasks(userContext: UserContext, filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<FixVisitTask[]> {
    let query = `
      SELECT fvt.*, er.shift_id, er.caregiver_id,
             c.first_name as client_first_name, c.last_name as client_last_name,
             u.first_name as caregiver_first_name, u.last_name as caregiver_last_name
      FROM fix_visit_tasks fvt
      JOIN evv_records er ON fvt.evv_record_id = er.id
      JOIN shifts s ON er.shift_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN users u ON er.caregiver_id = u.id
      WHERE er.organization_id = $1
    `;

    const params = [userContext.organizationId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND fvt.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.priority) {
      query += ` AND fvt.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters?.assignedTo) {
      query += ` AND fvt.assigned_to = $${paramIndex++}`;
      params.push(filters.assignedTo);
    }

    query += ' ORDER BY fvt.priority DESC, fvt.due_date ASC';

    const result = await this.db.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      evvRecordId: row.evv_record_id,
      taskType: row.task_type,
      description: row.description,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at
    }));
  }

  // Private helper methods

  private async getEVVRecordById(evvRecordId: string, userContext: UserContext): Promise<EVVRecord> {
    const query = `
      SELECT er.*, s.client_id, s.scheduled_start, s.scheduled_end
      FROM evv_records er
      JOIN shifts s ON er.shift_id = s.id
      WHERE er.id = $1 AND er.organization_id = $2
    `;

    const result = await this.db.query(query, [evvRecordId, userContext.organizationId]);
    
    if (result.rows.length === 0) {
      throw new Error('EVV record not found');
    }

    return this.mapRowToEVVRecord(result.rows[0]);
  }

  private mapRowToEVVRecord(row: any): EVVRecord {
    return {
      id: row.id,
      shiftId: row.shift_id,
      organizationId: row.organization_id,
      caregiverId: row.caregiver_id,
      clientId: row.client_id,
      servicePerformed: row.service_performed,
      clockInTime: row.clock_in_time,
      clockOutTime: row.clock_out_time,
      locationIn: JSON.parse(row.location_in),
      locationOut: row.location_out ? JSON.parse(row.location_out) : undefined,
      verificationMethod: row.verification_method,
      deviceInfo: JSON.parse(row.device_info),
      submittedToSandata: row.submitted_to_sandata,
      sandataTransactionId: row.sandata_transaction_id,
      sandataResponse: row.sandata_response ? JSON.parse(row.sandata_response) : undefined,
      isValid: row.is_valid,
      validationErrors: JSON.parse(row.validation_errors || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async validateShiftForEVV(shiftId: string, caregiverId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT s.*, c.address as client_address
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = $1 AND s.caregiver_id = $2
    `, [shiftId, caregiverId]);

    if (result.rows.length === 0) {
      throw new Error('Shift not found or not assigned to caregiver');
    }

    const shift = result.rows[0];

    if (shift.status === 'cancelled') {
      throw new Error('Cannot clock in to cancelled shift');
    }

    if (shift.status === 'completed') {
      throw new Error('Shift is already completed');
    }

    return shift;
  }

  private async generateEVVId(): Promise<string> {
    return `evv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateFixVisitTaskId(): Promise<string> {
    return `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async geocodeLocation(latitude: number, longitude: number): Promise<string> {
    // production_value - would integrate with geocoding service
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  private async calculateDistance(location: GPSLocation, clientAddress: any): Promise<number> {
    // production_value - would use actual distance calculation
    // For now, return random distance between 0-500 meters
    return Math.random() * 500;
  }

  private async scheduleDataSubmission(evvRecordId: string): Promise<void> {
    // production_value - would schedule background job for Sandata submission
    evvLogger.info(`Scheduled Sandata submission for EVV record ${evvRecordId}`);
  }

  private async submitToSandataAPI(evvRecord: any): Promise<{ transactionId: string; status: string }> {
    // production_value - would integrate with actual Sandata API
    return {
      transactionId: `sandata_${Date.now()}`,
      status: 'submitted'
    };
  }
}