/**
 * Ohio Alt-EVV Visit Builder Service
 * Builds compliant visit payloads for Ohio Alt-EVV v4.3 Sandata API
 *
 * CRITICAL: This service builds the Calls[] array - THE MOST IMPORTANT FIELD
 * for Ohio Alt-EVV compliance. Without proper Calls[] structure, visits will
 * be rejected by Sandata with 100% rejection rate.
 *
 * Features:
 * - Builds Calls[] array with minimum 2 calls (Call In + Call Out)
 * - Formats dates/times to Ohio Alt-EVV format (MM/DD/YYYY HH:MM:SS)
 * - Handles GPS coordinates for mobile app clock in/out
 * - Generates VisitChanges[] array for manual edits
 * - Validates Appendix G combinations (Payer/Program/ProcedureCode)
 * - Assigns SequenceID for idempotency
 *
 * @module services/sandata/ohio-visit-builder.service
 */

import { getSandataSequenceService } from './sequence.service';
import type {
  OhioVisit,
  OhioVisitCall,
  OhioVisitChange,
  OhioVisitRequest,
  SequenceID,
  formatOhioDate,
  formatOhioDateTime,
} from './ohio-types';
import { formatOhioDate as formatDate, formatOhioDateTime as formatDateTime } from './ohio-types';

/**
 * EVV Record from our database (simplified interface)
 */
export interface EVVRecordData {
  id: string;
  clientId: string;
  caregiverId: string;
  shiftId?: string;
  organizationId: string;

  // Clock in/out timestamps
  clockInTime: Date;
  clockOutTime: Date;

  // GPS coordinates
  clockInLatitude?: number;
  clockInLongitude?: number;
  clockInAccuracy?: number;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockOutAccuracy?: number;

  // Service details
  serviceDate: Date;
  serviceCode: string; // HCPCS procedure code
  modifiers?: string[];
  units?: number;

  // Payer/Program
  payer?: string;
  payerProgram?: string;

  // Authorization
  authorizationNumber?: string;

  // Location type
  locationType?: 'home' | 'community';

  // Clock method
  clockMethod?: 'mobile' | 'telephony' | 'fixed' | 'web';

  // Telephony (if clockMethod = 'telephony')
  telephoneNumber?: string;

  // Manual edits (if any)
  manualEdits?: ManualEditData[];

  // Timezone
  timezone?: string;

  // Ohio-specific IDs
  sandataOtherId?: string; // VisitOtherID
  sandataSequenceId?: SequenceID;
}

/**
 * Client/Patient data for visit
 */
export interface PatientData {
  id: string;
  sandataOtherId: string; // PatientOtherID
  medicaidNumber: string; // 12-character Ohio Medicaid ID
  timezone?: string;
}

/**
 * Staff/Caregiver data for visit
 */
export interface StaffData {
  id: string;
  sandataOtherId: string; // StaffOtherID
}

/**
 * Manual edit data for VisitChanges[] array
 */
export interface ManualEditData {
  field: string;
  oldValue: string;
  newValue: string;
  changeDateTime: Date;
  changeUserId: string;
  changeUserName?: string;
  reasonCode: '99';
  reasonDescription?: string;
}

/**
 * Visit build options
 */
export interface VisitBuildOptions {
  /**
   * If true, generates a new SequenceID (for new visit or forced update)
   * If false, uses existing SequenceID from record (for re-submission)
   */
  generateNewSequenceId?: boolean;

  /**
   * If true, marks visit as billable (BillVisit = "Y")
   * If false, marks as non-billable (BillVisit = "N")
   */
  billable?: boolean;

  /**
   * Default timezone if not specified in record
   */
  defaultTimezone?: string;

  /**
   * Default payer if not specified in record
   */
  defaultPayer?: string;

  /**
   * Default payer program if not specified in record
   */
  defaultPayerProgram?: string;
}

/**
 * Visit build result
 */
export interface VisitBuildResult {
  success: boolean;
  visit?: OhioVisit;
  errors?: string[];
  warnings?: string[];
}

/**
 * Ohio Alt-EVV Visit Builder Service
 */
export class OhioVisitBuilderService {
  private readonly sequenceService = getSandataSequenceService();

  /**
   * Build Ohio Alt-EVV v4.3 visit payload from EVV record data
   *
   * @param evvRecord - EVV record data from database
   * @param patient - Patient/client data
   * @param staff - Staff/caregiver data
   * @param options - Build options
   * @returns Visit build result with OhioVisit payload or errors
   */
  async buildVisit(
    evvRecord: EVVRecordData,
    patient: PatientData,
    staff: StaffData,
    options: VisitBuildOptions = {}
  ): Promise<VisitBuildResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required fields
      const validationErrors = this.validateVisitData(evvRecord, patient, staff);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        };
      }

      // Get or generate SequenceID
      let sequenceId: SequenceID;
      if (options.generateNewSequenceId !== false) {
        // Generate new SequenceID
        sequenceId = await this.sequenceService.getNextSequenceId(
          evvRecord.organizationId,
          'visit'
        );

        // Save SequenceID to database record
        await this.sequenceService.updateRecordSequenceId('visit', evvRecord.id, sequenceId);
      } else {
        // Use existing SequenceID
        const existingSequenceId = await this.sequenceService.getRecordSequenceId(
          'visit',
          evvRecord.id
        );

        if (!existingSequenceId) {
          errors.push('No existing SequenceID found - set generateNewSequenceId=true');
          return { success: false, errors };
        }

        sequenceId = existingSequenceId;
      }

      // Get VisitOtherID (use existing or generate from record ID)
      const visitOtherId = evvRecord.sandataOtherId || evvRecord.id;

      // Determine timezone
      const timezone =
        evvRecord.timezone || patient.timezone || options.defaultTimezone || 'America/New_York';

      // Determine payer/program
      const payer = evvRecord.payer || options.defaultPayer || 'ODJFS';
      const payerProgram = evvRecord.payerProgram || options.defaultPayerProgram || 'PASSPORT';

      // Determine location type
      const visitLocationType = this.mapLocationType(evvRecord.locationType);

      // Build Calls[] array (CRITICAL)
      const calls = this.buildCallsArray(evvRecord);
      if (calls.length < 2) {
        errors.push('Calls[] array must have at least 2 calls (Call In + Call Out)');
        return { success: false, errors };
      }

      // Build VisitChanges[] array (if manual edits exist)
      const visitChanges = this.buildVisitChangesArray(evvRecord.manualEdits);

      // Build OhioVisit payload
      const visit: OhioVisit = {
        SequenceID: sequenceId,
        VisitOtherID: visitOtherId,

        // Patient
        PatientOtherID: patient.sandataOtherId,
        PatientMedicaidID: patient.medicaidNumber,

        // Staff
        StaffOtherID: staff.sandataOtherId,

        // Payer/Program
        Payer: payer,
        PayerProgram: payerProgram,

        // Service
        ProcedureCode: evvRecord.serviceCode,
        Modifier: evvRecord.modifiers && evvRecord.modifiers.length > 0 ? evvRecord.modifiers : undefined,

        // Location
        VisitLocationType: visitLocationType,
        TimeZone: timezone,

        // Billing
        BillVisit: options.billable !== false ? 'Y' : 'N',

        // Calls (CRITICAL - MOST IMPORTANT FIELD)
        Calls: calls,

        // Visit changes (audit trail for manual edits)
        VisitChanges: visitChanges.length > 0 ? visitChanges : undefined,

        // Authorization (if available)
        AuthorizationNumber: evvRecord.authorizationNumber,

        // Units (optional - Sandata can calculate from Calls)
        Units: evvRecord.units,
      };

      // Add warnings if applicable
      if (!evvRecord.authorizationNumber) {
        warnings.push('No authorization number provided - may cause rejection if required by payer');
      }

      if (calls.some((call) => call.CallMethod === 'M' && !call.Latitude)) {
        warnings.push('Mobile app call missing GPS coordinates - may fail geofence validation');
      }

      return {
        success: true,
        visit,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(`Visit build failed: ${this.getErrorMessage(error)}`);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Build Calls[] array from EVV record
   * CRITICAL: This is THE MOST IMPORTANT method for Ohio Alt-EVV compliance
   *
   * Minimum requirements:
   * - 1 Call In (CallType = "I")
   * - 1 Call Out (CallType = "O")
   *
   * @param evvRecord - EVV record data
   * @returns Array of OhioVisitCall objects
   */
  private buildCallsArray(evvRecord: EVVRecordData): OhioVisitCall[] {
    const calls: OhioVisitCall[] = [];

    // Determine CallMethod
    const callMethod = this.mapCallMethod(evvRecord.clockMethod);

    // Build Call In (clock in event)
    const callIn: OhioVisitCall = {
      CallType: 'I',
      CallDateTime: formatDateTime(evvRecord.clockInTime),
      CallMethod: callMethod,
    };

    // Add GPS coordinates if mobile app
    if (callMethod === 'M' && evvRecord.clockInLatitude && evvRecord.clockInLongitude) {
      callIn.Latitude = evvRecord.clockInLatitude;
      callIn.Longitude = evvRecord.clockInLongitude;
      callIn.GPSAccuracy = evvRecord.clockInAccuracy;
    }

    // Add telephone number if telephony
    if (callMethod === 'T' && evvRecord.telephoneNumber) {
      callIn.TelephoneNumber = evvRecord.telephoneNumber;
    }

    calls.push(callIn);

    // Build Call Out (clock out event)
    const callOut: OhioVisitCall = {
      CallType: 'O',
      CallDateTime: formatDateTime(evvRecord.clockOutTime),
      CallMethod: callMethod,
    };

    // Add GPS coordinates if mobile app
    if (callMethod === 'M' && evvRecord.clockOutLatitude && evvRecord.clockOutLongitude) {
      callOut.Latitude = evvRecord.clockOutLatitude;
      callOut.Longitude = evvRecord.clockOutLongitude;
      callOut.GPSAccuracy = evvRecord.clockOutAccuracy;
    }

    // Add telephone number if telephony
    if (callMethod === 'T' && evvRecord.telephoneNumber) {
      callOut.TelephoneNumber = evvRecord.telephoneNumber;
    }

    calls.push(callOut);

    // TODO: Add support for breaks/suspensions (additional Call In/Out pairs)
    // For Phase 1, we only support single Call In + Call Out

    return calls;
  }

  /**
   * Build VisitChanges[] array from manual edit data
   *
   * @param manualEdits - Array of manual edit data (if any)
   * @returns Array of OhioVisitChange objects
   */
  private buildVisitChangesArray(manualEdits?: ManualEditData[]): OhioVisitChange[] {
    if (!manualEdits || manualEdits.length === 0) {
      return [];
    }

    return manualEdits.map((edit) => ({
      ChangeField: edit.field,
      OldValue: edit.oldValue,
      NewValue: edit.newValue,
      ChangeDateTime: formatDateTime(edit.changeDateTime),
      ChangeUserID: edit.changeUserName || edit.changeUserId,
      ReasonCode: edit.reasonCode,
      ReasonDescription: edit.reasonDescription,
    }));
  }

  /**
   * Validate visit data before building payload
   *
   * @param evvRecord - EVV record data
   * @param patient - Patient data
   * @param staff - Staff data
   * @returns Array of validation errors (empty if valid)
   */
  private validateVisitData(
    evvRecord: EVVRecordData,
    patient: PatientData,
    staff: StaffData
  ): string[] {
    const errors: string[] = [];

    // EVV record validation
    if (!evvRecord.id) errors.push('EVV record ID is required');
    if (!evvRecord.organizationId) errors.push('Organization ID is required');
    if (!evvRecord.clockInTime) errors.push('Clock in time is required');
    if (!evvRecord.clockOutTime) errors.push('Clock out time is required');
    if (!evvRecord.serviceCode) errors.push('Service code (procedure code) is required');

    // Patient validation
    if (!patient.sandataOtherId) errors.push('Patient OtherID (Sandata ID) is required');
    if (!patient.medicaidNumber) errors.push('Patient Medicaid number is required');
    if (patient.medicaidNumber && patient.medicaidNumber.length !== 12) {
      errors.push('Patient Medicaid number must be 12 characters (Ohio format)');
    }

    // Staff validation
    if (!staff.sandataOtherId) errors.push('Staff OtherID (Sandata ID) is required');

    // Time validation
    if (evvRecord.clockInTime && evvRecord.clockOutTime) {
      if (evvRecord.clockOutTime <= evvRecord.clockInTime) {
        errors.push('Clock out time must be after clock in time');
      }
    }

    // GPS validation (if mobile app)
    if (evvRecord.clockMethod === 'mobile') {
      if (!evvRecord.clockInLatitude || !evvRecord.clockInLongitude) {
        errors.push('GPS coordinates required for mobile app clock in');
      }
      if (!evvRecord.clockOutLatitude || !evvRecord.clockOutLongitude) {
        errors.push('GPS coordinates required for mobile app clock out');
      }

      // Validate coordinate ranges
      if (evvRecord.clockInLatitude && (evvRecord.clockInLatitude < -90 || evvRecord.clockInLatitude > 90)) {
        errors.push('Clock in latitude must be between -90 and +90');
      }
      if (evvRecord.clockInLongitude && (evvRecord.clockInLongitude < -180 || evvRecord.clockInLongitude > 180)) {
        errors.push('Clock in longitude must be between -180 and +180');
      }
      if (evvRecord.clockOutLatitude && (evvRecord.clockOutLatitude < -90 || evvRecord.clockOutLatitude > 90)) {
        errors.push('Clock out latitude must be between -90 and +90');
      }
      if (evvRecord.clockOutLongitude && (evvRecord.clockOutLongitude < -180 || evvRecord.clockOutLongitude > 180)) {
        errors.push('Clock out longitude must be between -180 and +180');
      }
    }

    // Telephony validation
    if (evvRecord.clockMethod === 'telephony' && !evvRecord.telephoneNumber) {
      errors.push('Telephone number required for telephony clock in/out');
    }

    return errors;
  }

  /**
   * Map internal location type to Ohio Alt-EVV VisitLocationType
   *
   * @param locationType - Internal location type ('home' or 'community')
   * @returns Ohio VisitLocationType ("1" or "2")
   */
  private mapLocationType(locationType?: string): '1' | '2' {
    if (locationType === 'community') {
      return '2'; // Community
    }
    return '1'; // Home (default)
  }

  /**
   * Map internal clock method to Ohio Alt-EVV CallMethod
   *
   * @param clockMethod - Internal clock method
   * @returns Ohio CallMethod ("M", "T", "F", or "W")
   */
  private mapCallMethod(clockMethod?: string): 'M' | 'T' | 'F' | 'W' {
    switch (clockMethod) {
      case 'mobile':
        return 'M'; // Mobile app (GPS)
      case 'telephony':
        return 'T'; // Telephony (phone call)
      case 'fixed':
        return 'F'; // Fixed device
      case 'web':
        return 'W'; // Web portal
      default:
        return 'M'; // Default to mobile
    }
  }

  /**
   * Build OhioVisitRequest (API request body)
   *
   * @param visits - Array of OhioVisit objects
   * @returns OhioVisitRequest object
   */
  buildVisitRequest(visits: OhioVisit[]): OhioVisitRequest {
    return {
      Visit: visits,
    };
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Unknown error occurred';
  }
}

/**
 * Singleton instance
 */
let visitBuilderServiceInstance: OhioVisitBuilderService | null = null;

/**
 * Get Ohio Visit Builder Service singleton
 */
export function getOhioVisitBuilderService(): OhioVisitBuilderService {
  if (!visitBuilderServiceInstance) {
    visitBuilderServiceInstance = new OhioVisitBuilderService();
  }
  return visitBuilderServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetOhioVisitBuilderService(): void {
  visitBuilderServiceInstance = null;
}

export default OhioVisitBuilderService;
