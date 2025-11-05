/**
 * Ohio Alt-EVV Staff Builder Service
 * Builds compliant staff payloads for Ohio Alt-EVV v4.3 Sandata API
 *
 * CRITICAL: Staff records must be synced to Sandata BEFORE submitting visits
 * Otherwise visits will be rejected with error code BUS_EMP_404
 *
 * CRITICAL: SSN is REQUIRED for Ohio staff (9 digits, no dashes)
 *
 * Features:
 * - Transforms database user/caregiver records to OhioStaff format
 * - Assigns SequenceID for idempotency
 * - Validates required fields (9-digit SSN, DOB, etc.)
 * - Formats dates to Ohio spec (MM/DD/YYYY)
 * - Handles encrypted SSN from database
 * - Supports address and phone arrays
 * - Generates StaffID (telephony PIN) if not present
 *
 * @module services/sandata/ohio-staff-builder.service
 */

import { getSandataSequenceService } from './sequence.service';
import { getSandataRepository } from './repositories/sandata.repository';
import { getDbClient } from '../../database/client';
import type {
  OhioStaff,
  OhioStaffRequest,
  OhioAddress,
  OhioPhone,
  SequenceID,
} from './ohio-types';
import { formatOhioDate } from './ohio-types';

/**
 * User/Caregiver/Staff data from our database
 */
export interface StaffData {
  id: string;
  organizationId: string;

  // Demographics
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender?: 'M' | 'F' | 'U';

  // SSN (REQUIRED for Ohio Alt-EVV v4.3)
  ssnEncrypted?: string; // Encrypted SSN from database
  ssnDecrypted?: string; // Decrypted SSN (9 digits, no dashes)

  // Employment
  hireDate?: Date;
  terminationDate?: Date;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Contact
  phoneNumber?: string;
  phoneType?: 'home' | 'cell' | 'work' | 'other';
  email?: string;

  // Sandata fields
  sandataOtherId?: string; // StaffOtherID
  sandataSequenceId?: SequenceID;
  sandataStaffPin?: string; // StaffID (telephony PIN)
}

/**
 * Staff build options
 */
export interface StaffBuildOptions {
  /**
   * If true, generates a new SequenceID (for new staff or forced update)
   * If false, uses existing SequenceID from record (for re-submission)
   */
  generateNewSequenceId?: boolean;

  /**
   * If true, generates a StaffID (telephony PIN) if not present
   * PIN format: 4-6 digit numeric code
   */
  generateStaffPin?: boolean;

  /**
   * Custom StaffID (telephony PIN) to use
   * If not provided, will use existing or generate new
   */
  customStaffId?: string;
}

/**
 * Staff build result
 */
export interface StaffBuildResult {
  success: boolean;
  staff?: OhioStaff;
  errors?: string[];
  warnings?: string[];
}

/**
 * Ohio Alt-EVV Staff Builder Service
 */
export class OhioStaffBuilderService {
  private readonly sequenceService = getSandataSequenceService();
  private sandataRepo: any = null;

  /**
   * Get repository instance (lazy-loaded)
   */
  private getRepository() {
    if (!this.sandataRepo) {
      const db = getDbClient();
      this.sandataRepo = getSandataRepository(db);
    }
    return this.sandataRepo;
  }

  /**
   * Build Ohio Alt-EVV v4.3 staff payload from user/caregiver data
   *
   * @param staff - Staff data from database
   * @param options - Build options
   * @returns Staff build result with OhioStaff payload or errors
   */
  async buildStaff(
    staff: StaffData,
    options: StaffBuildOptions = {}
  ): Promise<StaffBuildResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required fields
      const validationErrors = this.validateStaffData(staff);
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
          staff.organizationId,
          'staff'
        );

        // Save SequenceID to database record
        await this.sequenceService.updateRecordSequenceId('staff', staff.id, sequenceId);
      } else {
        // Use existing SequenceID
        const existingSequenceId = await this.sequenceService.getRecordSequenceId(
          'staff',
          staff.id
        );

        if (!existingSequenceId) {
          errors.push('No existing SequenceID found - set generateNewSequenceId=true');
          return { success: false, errors };
        }

        sequenceId = existingSequenceId;
      }

      // Get StaffOtherID (use existing or generate from record ID)
      const staffOtherId = staff.sandataOtherId || staff.id;

      // Get or generate StaffID (telephony PIN)
      let staffId: string;
      if (options.customStaffId) {
        staffId = options.customStaffId;
      } else if (staff.sandataStaffPin) {
        staffId = staff.sandataStaffPin;
      } else if (options.generateStaffPin !== false) {
        // Generate 6-digit PIN from user ID hash
        staffId = this.generateStaffPin(staff.id);
        warnings.push(`Generated StaffID (PIN): ${staffId}. Save this to database.`);
      } else {
        errors.push('StaffID (telephony PIN) is required. Set generateStaffPin=true to auto-generate.');
        return { success: false, errors };
      }

      // Get SSN (REQUIRED for Ohio)
      if (!staff.ssnDecrypted && !staff.ssnEncrypted) {
        errors.push(
          'SSN is REQUIRED for Ohio Alt-EVV v4.3 staff submissions. ' +
          'Please collect and encrypt SSN before syncing to Sandata.'
        );
        return { success: false, errors };
      }

      // Decrypt SSN if needed
      let ssn: string;
      if (staff.ssnDecrypted) {
        ssn = staff.ssnDecrypted;
      } else {
        const decryptedSSN = await this.decryptSSN(staff.ssnEncrypted);
        if (!decryptedSSN) {
          errors.push('Failed to decrypt SSN. Please verify SSN encryption is valid.');
          return { success: false, errors };
        }
        ssn = decryptedSSN;
      }

      if (!this.isValidSSN(ssn)) {
        errors.push(
          `Invalid SSN format. Must be 9 digits, no dashes. Got: "${this.maskSSN(ssn)}"`
        );
        return { success: false, errors };
      }

      // Build Address array (if address fields present)
      const addresses: OhioAddress[] = [];
      if (staff.addressLine1 && staff.city && staff.state && staff.zipCode) {
        addresses.push({
          AddressType: 'H', // Home
          AddressLine1: staff.addressLine1,
          AddressLine2: staff.addressLine2,
          City: staff.city,
          State: staff.state,
          ZipCode: staff.zipCode,
        });
      }

      // Build Phones array (if phone present)
      const phones: OhioPhone[] = [];
      if (staff.phoneNumber) {
        const phoneType = this.mapPhoneType(staff.phoneType);
        phones.push({
          PhoneType: phoneType,
          PhoneNumber: this.formatPhoneNumber(staff.phoneNumber),
        });
      }

      // Build OhioStaff payload
      const ohioStaff: OhioStaff = {
        SequenceID: sequenceId,
        StaffOtherID: staffOtherId,
        StaffID: staffId,

        // Name
        StaffFirstName: staff.firstName.trim(),
        StaffLastName: staff.lastName.trim(),
        StaffMiddleName: staff.middleName?.trim(),

        // Demographics
        StaffBirthDate: formatOhioDate(staff.dateOfBirth),
        StaffGender: staff.gender,

        // SSN (REQUIRED - encrypted in transit)
        StaffSSN: ssn,

        // Employment dates
        StaffHireDate: staff.hireDate ? formatOhioDate(staff.hireDate) : undefined,
        StaffTerminationDate: staff.terminationDate ? formatOhioDate(staff.terminationDate) : undefined,

        // Address (if available)
        Address: addresses.length > 0 ? addresses : undefined,

        // Phones (if available)
        Phones: phones.length > 0 ? phones : undefined,
      };

      // Add warnings if applicable
      if (!staff.addressLine1) {
        warnings.push('No address provided - optional but recommended');
      }

      if (!staff.phoneNumber) {
        warnings.push('No phone number provided - optional but recommended');
      }

      if (staff.terminationDate) {
        warnings.push(
          `Staff member has termination date ${formatOhioDate(staff.terminationDate)}. ` +
          'This will mark them as inactive in Sandata.'
        );
      }

      return {
        success: true,
        staff: ohioStaff,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(`Staff build failed: ${this.getErrorMessage(error)}`);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Build OhioStaffRequest (API request body)
   *
   * @param staffMembers - Array of OhioStaff objects
   * @returns OhioStaffRequest object
   */
  buildStaffRequest(staffMembers: OhioStaff[]): OhioStaffRequest {
    return {
      Staff: staffMembers,
    };
  }

  /**
   * Build staff from multiple users (batch operation)
   *
   * @param staffMembers - Array of staff data
   * @param options - Build options
   * @returns Array of staff build results
   */
  async buildStaffMembers(
    staffMembers: StaffData[],
    options: StaffBuildOptions = {}
  ): Promise<StaffBuildResult[]> {
    const results: StaffBuildResult[] = [];

    for (const staff of staffMembers) {
      const result = await this.buildStaff(staff, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate staff data before building payload
   *
   * @param staff - Staff data
   * @returns Array of validation errors (empty if valid)
   */
  private validateStaffData(staff: StaffData): string[] {
    const errors: string[] = [];

    // Required fields
    if (!staff.id) errors.push('Staff ID is required');
    if (!staff.organizationId) errors.push('Organization ID is required');
    if (!staff.firstName || !staff.firstName.trim()) {
      errors.push('First name is required');
    }
    if (!staff.lastName || !staff.lastName.trim()) {
      errors.push('Last name is required');
    }
    if (!staff.dateOfBirth) {
      errors.push('Date of birth is required');
    }

    // Name length validation
    if (staff.firstName && staff.firstName.length > 35) {
      errors.push('First name cannot exceed 35 characters');
    }
    if (staff.lastName && staff.lastName.length > 60) {
      errors.push('Last name cannot exceed 60 characters');
    }
    if (staff.middleName && staff.middleName.length > 25) {
      errors.push('Middle name cannot exceed 25 characters');
    }

    // Date validation (must be in the past)
    if (staff.dateOfBirth) {
      const dob = new Date(staff.dateOfBirth);
      const today = new Date();

      if (dob >= today) {
        errors.push('Date of birth must be in the past');
      }

      // Age validation (must be at least 18 for employment)
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        errors.push('Staff member must be at least 18 years old');
      }
      if (age > 100) {
        errors.push(`Date of birth seems incorrect (age would be ${age} years)`);
      }
    }

    // Address validation (if provided)
    const hasAddress = staff.addressLine1 || staff.city || staff.state || staff.zipCode;
    if (hasAddress) {
      if (!staff.addressLine1) errors.push('Address line 1 is required if address provided');
      if (!staff.city) errors.push('City is required if address provided');
      if (!staff.state) errors.push('State is required if address provided');
      if (!staff.zipCode) errors.push('Zip code is required if address provided');

      // State format validation (2 letters)
      if (staff.state && !/^[A-Z]{2}$/i.test(staff.state)) {
        errors.push('State must be 2-letter code (e.g., "OH")');
      }

      // Zip code format validation (5 or 9 digits)
      if (staff.zipCode && !/^\d{5}(\d{4})?$/.test(staff.zipCode.replace(/[^0-9]/g, ''))) {
        errors.push('Zip code must be 5 or 9 digits');
      }

      // Address length validation
      if (staff.addressLine1 && staff.addressLine1.length > 55) {
        errors.push('Address line 1 cannot exceed 55 characters');
      }
      if (staff.addressLine2 && staff.addressLine2.length > 55) {
        errors.push('Address line 2 cannot exceed 55 characters');
      }
      if (staff.city && staff.city.length > 30) {
        errors.push('City cannot exceed 30 characters');
      }
    }

    return errors;
  }

  /**
   * Validate SSN format
   *
   * @param ssn - SSN string (should be 9 digits, no dashes)
   * @returns True if valid, false otherwise
   */
  private isValidSSN(ssn: string): boolean {
    // Must be exactly 9 digits
    if (!/^\d{9}$/.test(ssn)) {
      return false;
    }

    // Check for invalid patterns
    const invalidPatterns = [
      '000000000', '111111111', '222222222', '333333333', '444444444',
      '555555555', '666666666', '777777777', '888888888', '999999999',
    ];

    if (invalidPatterns.includes(ssn)) {
      return false;
    }

    // Area number (first 3 digits) cannot be 000 or 666
    const area = ssn.substring(0, 3);
    if (area === '000' || area === '666') {
      return false;
    }

    // Area number cannot be 900-999 (reserved)
    if (parseInt(area) >= 900) {
      return false;
    }

    // Group number (middle 2 digits) cannot be 00
    const group = ssn.substring(3, 5);
    if (group === '00') {
      return false;
    }

    // Serial number (last 4 digits) cannot be 0000
    const serial = ssn.substring(5);
    if (serial === '0000') {
      return false;
    }

    return true;
  }

  /**
   * Decrypt SSN from database using PostgreSQL decrypt_ssn() function
   * CRITICAL: Uses same decryption method as migration 022
   * NEVER log the decrypted SSN
   *
   * @param ssnEncrypted - Encrypted SSN bytea or string
   * @returns Decrypted SSN (9 digits, no dashes)
   */
  private async decryptSSN(ssnEncrypted?: string | Buffer): Promise<string | null> {
    if (!ssnEncrypted) {
      return null;
    }

    try {
      // Call repository method which calls decrypt_ssn() PostgreSQL function
      const repo = this.getRepository();
      const decrypted = await repo.decryptSSN(ssnEncrypted);

      if (!decrypted) {
        throw new Error('Decryption returned null or empty value');
      }

      return decrypted;
    } catch (error) {
      // Log error but DON'T log the encrypted value for security
      console.error('[StaffBuilder] SSN decryption failed', {
        error: this.getErrorMessage(error),
        note: 'Check that pgcrypto extension is enabled and app.ssn_encryption_key is set',
      });
      throw error;
    }
  }

  /**
   * Mask SSN for logging (shows only last 4 digits)
   *
   * @param ssn - SSN string
   * @returns Masked SSN (e.g., "***-**-1234")
   */
  private maskSSN(ssn: string): string {
    if (!ssn || ssn.length < 4) {
      return '***-**-****';
    }

    const lastFour = ssn.slice(-4);
    return `***-**-${lastFour}`;
  }

  /**
   * Generate StaffID (telephony PIN) from user ID
   * Uses hash of user ID to generate consistent 6-digit PIN
   *
   * @param userId - User UUID
   * @returns 6-digit PIN as string
   */
  private generateStaffPin(userId: string): string {
    // Simple hash function to generate consistent PIN from UUID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive 6-digit number
    const pin = Math.abs(hash) % 1000000;
    return pin.toString().padStart(6, '0');
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
let staffBuilderServiceInstance: OhioStaffBuilderService | null = null;

/**
 * Get Ohio Staff Builder Service singleton
 */
export function getOhioStaffBuilderService(): OhioStaffBuilderService {
  if (!staffBuilderServiceInstance) {
    staffBuilderServiceInstance = new OhioStaffBuilderService();
  }
  return staffBuilderServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetOhioStaffBuilderService(): void {
  staffBuilderServiceInstance = null;
}

export default OhioStaffBuilderService;
