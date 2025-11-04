/**
 * Ohio Alt-EVV Patient Builder Service
 * Builds compliant patient payloads for Ohio Alt-EVV v4.3 Sandata API
 *
 * CRITICAL: Patient records must be synced to Sandata BEFORE submitting visits
 * Otherwise visits will be rejected with error code BUS_IND_404
 *
 * Features:
 * - Transforms database client records to OhioPatient format
 * - Assigns SequenceID for idempotency
 * - Validates required fields (12-character Medicaid ID, etc.)
 * - Formats dates to Ohio spec (MM/DD/YYYY)
 * - Handles address and phone arrays
 * - Supports payer/program associations
 *
 * @module services/sandata/ohio-patient-builder.service
 */

import { getSandataSequenceService } from './sequence.service';
import type {
  OhioPatient,
  OhioPatientRequest,
  OhioAddress,
  OhioPhone,
  OhioIndividualPayerInfo,
  SequenceID,
} from './ohio-types';
import { formatOhioDate } from './ohio-types';

/**
 * Client/Patient data from our database
 */
export interface ClientData {
  id: string;
  organizationId: string;

  // Demographics
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender?: 'M' | 'F' | 'U';
  ssn?: string; // Optional for clients (not required like staff)

  // Medicaid info
  medicaidNumber: string; // 12-character Ohio Medicaid ID

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;

  // Contact
  phoneNumber?: string;
  phoneType?: 'home' | 'cell' | 'work' | 'other';
  email?: string;

  // Payer/Program associations
  payer?: string;
  payerProgram?: string;

  // Sandata fields
  sandataOtherId?: string; // PatientOtherID
  sandataSequenceId?: SequenceID;

  // Timezone
  timezone?: string;
}

/**
 * Patient build options
 */
export interface PatientBuildOptions {
  /**
   * If true, generates a new SequenceID (for new patient or forced update)
   * If false, uses existing SequenceID from record (for re-submission)
   */
  generateNewSequenceId?: boolean;

  /**
   * Default timezone if not specified in record
   */
  defaultTimezone?: string;

  /**
   * Include newborn flag (usually "N" for home care)
   */
  isNewborn?: boolean;
}

/**
 * Patient build result
 */
export interface PatientBuildResult {
  success: boolean;
  patient?: OhioPatient;
  errors?: string[];
  warnings?: string[];
}

/**
 * Ohio Alt-EVV Patient Builder Service
 */
export class OhioPatientBuilderService {
  private readonly sequenceService = getSandataSequenceService();

  /**
   * Build Ohio Alt-EVV v4.3 patient payload from client data
   *
   * @param client - Client data from database
   * @param options - Build options
   * @returns Patient build result with OhioPatient payload or errors
   */
  async buildPatient(
    client: ClientData,
    options: PatientBuildOptions = {}
  ): Promise<PatientBuildResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required fields
      const validationErrors = this.validateClientData(client);
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
          client.organizationId,
          'patient'
        );

        // Save SequenceID to database record
        await this.sequenceService.updateRecordSequenceId('patient', client.id, sequenceId);
      } else {
        // Use existing SequenceID
        const existingSequenceId = await this.sequenceService.getRecordSequenceId(
          'patient',
          client.id
        );

        if (!existingSequenceId) {
          errors.push('No existing SequenceID found - set generateNewSequenceId=true');
          return { success: false, errors };
        }

        sequenceId = existingSequenceId;
      }

      // Get PatientOtherID (use existing or generate from record ID)
      const patientOtherId = client.sandataOtherId || client.id;

      // Determine timezone
      const timezone = client.timezone || options.defaultTimezone || 'America/New_York';

      // Build Address array (if address fields present)
      const addresses: OhioAddress[] = [];
      if (client.addressLine1 && client.city && client.state && client.zipCode) {
        addresses.push({
          AddressType: 'H', // Home
          AddressLine1: client.addressLine1,
          AddressLine2: client.addressLine2,
          City: client.city,
          State: client.state,
          ZipCode: client.zipCode,
          County: client.county,
        });
      }

      // Build Phones array (if phone present)
      const phones: OhioPhone[] = [];
      if (client.phoneNumber) {
        const phoneType = this.mapPhoneType(client.phoneType);
        phones.push({
          PhoneType: phoneType,
          PhoneNumber: this.formatPhoneNumber(client.phoneNumber),
        });
      }

      // Build IndividualPayerInformation array (if payer present)
      const payerInfo: OhioIndividualPayerInfo[] = [];
      if (client.payer && client.payerProgram) {
        payerInfo.push({
          Payer: client.payer,
          PayerProgram: client.payerProgram,
        });
      }

      // Build OhioPatient payload
      const patient: OhioPatient = {
        SequenceID: sequenceId,
        PatientOtherID: patientOtherId,
        PatientMedicaidID: client.medicaidNumber,

        // Name
        PatientFirstName: client.firstName.trim(),
        PatientLastName: client.lastName.trim(),
        PatientMiddleName: client.middleName?.trim(),

        // Demographics
        PatientBirthDate: formatOhioDate(client.dateOfBirth),
        PatientGender: client.gender,
        PatientSSN: client.ssn,

        // Newborn flag (usually "N" for home care)
        IsPatientNewborn: options.isNewborn ? 'Y' : 'N',

        // Timezone
        PatientTimezone: timezone,

        // Address (if available)
        Address: addresses.length > 0 ? addresses : undefined,

        // Phones (if available)
        Phones: phones.length > 0 ? phones : undefined,

        // Payer info (if available)
        IndividualPayerInformation: payerInfo.length > 0 ? payerInfo : undefined,
      };

      // Add warnings if applicable
      if (!client.addressLine1) {
        warnings.push('No address provided - geofence validation may fail for visits');
      }

      if (!client.phoneNumber) {
        warnings.push('No phone number provided - may be required by some payers');
      }

      if (!client.payer || !client.payerProgram) {
        warnings.push('No payer/program association - will need to be specified per visit');
      }

      if (client.medicaidNumber.length !== 12) {
        errors.push(
          `Medicaid number must be exactly 12 characters (Ohio format). ` +
          `Got ${client.medicaidNumber.length} characters: "${client.medicaidNumber}"`
        );
        return { success: false, errors };
      }

      return {
        success: true,
        patient,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(`Patient build failed: ${this.getErrorMessage(error)}`);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Build OhioPatientRequest (API request body)
   *
   * @param patients - Array of OhioPatient objects
   * @returns OhioPatientRequest object
   */
  buildPatientRequest(patients: OhioPatient[]): OhioPatientRequest {
    return {
      Patient: patients,
    };
  }

  /**
   * Build patient from multiple clients (batch operation)
   *
   * @param clients - Array of client data
   * @param options - Build options
   * @returns Array of patient build results
   */
  async buildPatients(
    clients: ClientData[],
    options: PatientBuildOptions = {}
  ): Promise<PatientBuildResult[]> {
    const results: PatientBuildResult[] = [];

    for (const client of clients) {
      const result = await this.buildPatient(client, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate client data before building payload
   *
   * @param client - Client data
   * @returns Array of validation errors (empty if valid)
   */
  private validateClientData(client: ClientData): string[] {
    const errors: string[] = [];

    // Required fields
    if (!client.id) errors.push('Client ID is required');
    if (!client.organizationId) errors.push('Organization ID is required');
    if (!client.firstName || !client.firstName.trim()) {
      errors.push('First name is required');
    }
    if (!client.lastName || !client.lastName.trim()) {
      errors.push('Last name is required');
    }
    if (!client.dateOfBirth) {
      errors.push('Date of birth is required');
    }
    if (!client.medicaidNumber || !client.medicaidNumber.trim()) {
      errors.push('Medicaid number is required');
    }

    // Medicaid number format validation (12 characters)
    if (client.medicaidNumber) {
      const medicaidNum = client.medicaidNumber.trim();
      if (medicaidNum.length !== 12) {
        errors.push(
          `Medicaid number must be exactly 12 characters (Ohio format). ` +
          `Got ${medicaidNum.length} characters.`
        );
      }

      // Check format: typically 2 letters + 10 digits
      if (!/^[A-Z]{2}\d{10}$/i.test(medicaidNum)) {
        errors.push(
          `Medicaid number should be 2 letters + 10 digits (e.g., "AB1234567890"). ` +
          `Got: "${medicaidNum}"`
        );
      }
    }

    // Name length validation
    if (client.firstName && client.firstName.length > 35) {
      errors.push('First name cannot exceed 35 characters');
    }
    if (client.lastName && client.lastName.length > 60) {
      errors.push('Last name cannot exceed 60 characters');
    }
    if (client.middleName && client.middleName.length > 25) {
      errors.push('Middle name cannot exceed 25 characters');
    }

    // Date validation (must be in the past)
    if (client.dateOfBirth) {
      const dob = new Date(client.dateOfBirth);
      const today = new Date();

      if (dob >= today) {
        errors.push('Date of birth must be in the past');
      }

      // Sanity check: not more than 130 years ago
      const age = today.getFullYear() - dob.getFullYear();
      if (age > 130) {
        errors.push(`Date of birth seems incorrect (age would be ${age} years)`);
      }
    }

    // Address validation (if provided)
    const hasAddress = client.addressLine1 || client.city || client.state || client.zipCode;
    if (hasAddress) {
      if (!client.addressLine1) errors.push('Address line 1 is required if address provided');
      if (!client.city) errors.push('City is required if address provided');
      if (!client.state) errors.push('State is required if address provided');
      if (!client.zipCode) errors.push('Zip code is required if address provided');

      // State format validation (2 letters)
      if (client.state && !/^[A-Z]{2}$/i.test(client.state)) {
        errors.push('State must be 2-letter code (e.g., "OH")');
      }

      // Zip code format validation (5 or 9 digits)
      if (client.zipCode && !/^\d{5}(\d{4})?$/.test(client.zipCode.replace(/[^0-9]/g, ''))) {
        errors.push('Zip code must be 5 or 9 digits');
      }

      // Address length validation
      if (client.addressLine1 && client.addressLine1.length > 55) {
        errors.push('Address line 1 cannot exceed 55 characters');
      }
      if (client.addressLine2 && client.addressLine2.length > 55) {
        errors.push('Address line 2 cannot exceed 55 characters');
      }
      if (client.city && client.city.length > 30) {
        errors.push('City cannot exceed 30 characters');
      }
    }

    return errors;
  }

  /**
   * Map internal phone type to Ohio Alt-EVV PhoneType
   *
   * @param phoneType - Internal phone type
   * @returns Ohio PhoneType ("H", "C", "W", or "O")
   */
  private mapPhoneType(phoneType?: string): 'H' | 'C' | 'W' | 'O' {
    switch (phoneType?.toLowerCase()) {
      case 'home':
        return 'H';
      case 'cell':
      case 'mobile':
        return 'C';
      case 'work':
        return 'W';
      default:
        return 'C'; // Default to cell
    }
  }

  /**
   * Format phone number to 10 digits (remove formatting)
   *
   * @param phoneNumber - Phone number (may have formatting)
   * @returns 10-digit phone number string
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If starts with 1 (country code), remove it
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits.slice(1);
    }

    // Return 10 digits
    return digits.slice(0, 10);
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
let patientBuilderServiceInstance: OhioPatientBuilderService | null = null;

/**
 * Get Ohio Patient Builder Service singleton
 */
export function getOhioPatientBuilderService(): OhioPatientBuilderService {
  if (!patientBuilderServiceInstance) {
    patientBuilderServiceInstance = new OhioPatientBuilderService();
  }
  return patientBuilderServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetOhioPatientBuilderService(): void {
  patientBuilderServiceInstance = null;
}

export default OhioPatientBuilderService;
