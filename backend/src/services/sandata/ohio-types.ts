/**
 * Ohio Alt-EVV v4.3 TypeScript Types
 * Based on "Alternate EVV Data Collection Systems - Interface Specs - v4.3 - 08/28/2025"
 *
 * CRITICAL: These types MUST match the exact field names and structures in the Ohio specification.
 * Any deviation will result in rejection from Sandata.
 *
 * Key differences from generic Sandata types:
 * - Uses SequenceID for all record types (Patient, Staff, Visit)
 * - Uses Ohio-specific field names (PatientOtherID, not individualId)
 * - Requires BusinessEntityID and BusinessEntityMedicaidIdentifier headers
 * - Visit requires Calls[] array with minimum 2 calls
 * - VisitLocationType uses numeric strings ("1", "2") not text enums
 *
 * @module services/sandata/ohio-types
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * SequenceID is used for idempotency and versioning
 * - Must increment by 1 for each new/updated record of the same type
 * - Patient, Staff, and Visit each have independent SequenceID sequences
 * - Re-POSTing with the same SequenceID = update, higher SequenceID = new version
 */
export type SequenceID = number;

/**
 * Visit Location Type (Ohio Alt-EVV v4.3)
 * CRITICAL: Must be numeric string, not text enum
 * "1" = Home (patient residence)
 * "2" = Community (other location)
 */
export type VisitLocationType = "1" | "2";

/**
 * Reason Code for manual entries/edits (Appendix H)
 * CRITICAL: Only "99" is valid for Ohio as of v4.3
 * "99" = Corrected/manually entered
 */
export type ReasonCode = "99";

// ============================================================================
// HTTP Headers (Required for all Ohio Alt-EVV requests)
// ============================================================================

export interface OhioAltEVVHeaders {
  /**
   * OAuth 2.0 Bearer token
   */
  Authorization: string;

  /**
   * Sandata's ID for Serenity Care Partners
   * Provided during onboarding
   */
  BusinessEntityID: string;

  /**
   * Ohio Department of Medicaid Enterprise (ODME) Provider ID
   * 7-digit number assigned by ODM
   */
  BusinessEntityMedicaidIdentifier: string;

  /**
   * Standard HTTP headers
   */
  'Content-Type': 'application/json';
  Accept: 'application/json';
}

// ============================================================================
// Patient (Individual/Client) Types - Ohio Alt-EVV v4.3
// ============================================================================

export interface OhioPatient {
  /**
   * SequenceID - REQUIRED
   * Incrementing number for this patient record
   * First submission = 1, updates increment by 1
   */
  SequenceID: SequenceID;

  /**
   * PatientOtherID - REQUIRED
   * Our internal UUID for the patient
   * Used to correlate with Serenity database
   */
  PatientOtherID: string;

  /**
   * PatientMedicaidID - REQUIRED
   * 12-character Ohio Medicaid ID (sometimes called RID)
   * Format: 2 letters + 10 digits (e.g., "AB1234567890")
   */
  PatientMedicaidID: string;

  /**
   * PatientFirstName - REQUIRED
   * Max 35 characters
   */
  PatientFirstName: string;

  /**
   * PatientLastName - REQUIRED
   * Max 60 characters
   */
  PatientLastName: string;

  /**
   * PatientMiddleName - OPTIONAL
   * Max 25 characters
   */
  PatientMiddleName?: string;

  /**
   * PatientBirthDate - REQUIRED
   * Format: MM/DD/YYYY (e.g., "03/15/1950")
   * CRITICAL: Forward slashes, not dashes
   */
  PatientBirthDate: string;

  /**
   * PatientGender - OPTIONAL
   * "M" = Male, "F" = Female, "U" = Unknown
   */
  PatientGender?: "M" | "F" | "U";

  /**
   * PatientSSN - OPTIONAL
   * 9 digits, no dashes (e.g., "123456789")
   * Encrypted in transit, never logged
   */
  PatientSSN?: string;

  /**
   * IsPatientNewborn - OPTIONAL
   * "Y" or "N"
   * Use "N" for home care (most common)
   */
  IsPatientNewborn?: "Y" | "N";

  /**
   * PatientTimezone - OPTIONAL but RECOMMENDED
   * IANA timezone (e.g., "America/New_York")
   * Important for accurate visit timestamps
   */
  PatientTimezone?: string;

  /**
   * Address - OPTIONAL but RECOMMENDED (array of addresses)
   * Used for geofence validation
   */
  Address?: OhioAddress[];

  /**
   * Phones - OPTIONAL (array of phone numbers)
   */
  Phones?: OhioPhone[];

  /**
   * IndividualPayerInformation - OPTIONAL but RECOMMENDED
   * Payer/program associations for this patient
   */
  IndividualPayerInformation?: OhioIndividualPayerInfo[];
}

export interface OhioAddress {
  /**
   * AddressType - REQUIRED if Address array present
   * "H" = Home, "W" = Work, "O" = Other
   */
  AddressType: "H" | "W" | "O";

  /**
   * AddressLine1 - REQUIRED if Address array present
   * Max 55 characters
   */
  AddressLine1: string;

  /**
   * AddressLine2 - OPTIONAL
   * Max 55 characters
   */
  AddressLine2?: string;

  /**
   * City - REQUIRED if Address array present
   * Max 30 characters
   */
  City: string;

  /**
   * State - REQUIRED if Address array present
   * 2-letter code (e.g., "OH")
   */
  State: string;

  /**
   * ZipCode - REQUIRED if Address array present
   * 5 or 9 digits (e.g., "43215" or "432151234")
   */
  ZipCode: string;

  /**
   * County - OPTIONAL
   * Max 25 characters
   */
  County?: string;
}

export interface OhioPhone {
  /**
   * PhoneType - REQUIRED if Phones array present
   * "H" = Home, "C" = Cell, "W" = Work, "O" = Other
   */
  PhoneType: "H" | "C" | "W" | "O";

  /**
   * PhoneNumber - REQUIRED if Phones array present
   * 10 digits (e.g., "6145551234")
   */
  PhoneNumber: string;
}

export interface OhioIndividualPayerInfo {
  /**
   * Payer - REQUIRED if IndividualPayerInformation array present
   * 5-character payer code (e.g., "ODJFS")
   * See Appendix G for valid values
   */
  Payer: string;

  /**
   * PayerProgram - REQUIRED if IndividualPayerInformation array present
   * Program code (e.g., "PASSPORT", "MYCARE")
   * See Appendix G for valid values
   */
  PayerProgram: string;
}

/**
 * Patient POST request body
 */
export interface OhioPatientRequest {
  Patient: OhioPatient[];
}

// ============================================================================
// Staff (Employee/Caregiver) Types - Ohio Alt-EVV v4.3
// ============================================================================

export interface OhioStaff {
  /**
   * SequenceID - REQUIRED
   * Incrementing number for this staff record
   * Independent from Patient SequenceID
   */
  SequenceID: SequenceID;

  /**
   * StaffOtherID - REQUIRED
   * Our internal UUID for the staff member
   * Used to correlate with Serenity database
   */
  StaffOtherID: string;

  /**
   * StaffID - REQUIRED
   * Telephony PIN or employee number
   * Max 20 characters
   * Used for phone-based clock in/out
   */
  StaffID: string;

  /**
   * StaffFirstName - REQUIRED
   * Max 35 characters
   */
  StaffFirstName: string;

  /**
   * StaffLastName - REQUIRED
   * Max 60 characters
   */
  StaffLastName: string;

  /**
   * StaffMiddleName - OPTIONAL
   * Max 25 characters
   */
  StaffMiddleName?: string;

  /**
   * StaffBirthDate - REQUIRED
   * Format: MM/DD/YYYY (e.g., "05/20/1985")
   * CRITICAL: Forward slashes, not dashes
   */
  StaffBirthDate: string;

  /**
   * StaffSSN - REQUIRED
   * 9 digits, no dashes (e.g., "987654321")
   * CRITICAL: SSN is REQUIRED for Ohio staff (not optional)
   * Encrypted in transit, never logged
   */
  StaffSSN: string;

  /**
   * StaffGender - OPTIONAL
   * "M" = Male, "F" = Female, "U" = Unknown
   */
  StaffGender?: "M" | "F" | "U";

  /**
   * Address - OPTIONAL (array of addresses)
   */
  Address?: OhioAddress[];

  /**
   * Phones - OPTIONAL (array of phone numbers)
   */
  Phones?: OhioPhone[];

  /**
   * StaffHireDate - OPTIONAL but RECOMMENDED
   * Format: MM/DD/YYYY
   */
  StaffHireDate?: string;

  /**
   * StaffTerminationDate - OPTIONAL
   * Format: MM/DD/YYYY
   * Set when staff member is terminated
   */
  StaffTerminationDate?: string;
}

/**
 * Staff POST request body
 */
export interface OhioStaffRequest {
  Staff: OhioStaff[];
}

// ============================================================================
// Visit (EVV Record) Types - Ohio Alt-EVV v4.3
// ============================================================================

export interface OhioVisit {
  /**
   * SequenceID - REQUIRED
   * Incrementing number for this visit record
   * Independent from Patient/Staff SequenceID
   */
  SequenceID: SequenceID;

  /**
   * VisitOtherID - REQUIRED
   * Our internal UUID for the visit/EVV record
   * Used to correlate with Serenity database
   */
  VisitOtherID: string;

  /**
   * PatientOtherID - REQUIRED
   * Must match PatientOtherID from Patient submission
   */
  PatientOtherID: string;

  /**
   * PatientMedicaidID - REQUIRED
   * 12-character Ohio Medicaid ID
   * Must match patient record
   */
  PatientMedicaidID: string;

  /**
   * StaffOtherID - REQUIRED
   * Must match StaffOtherID from Staff submission
   */
  StaffOtherID: string;

  /**
   * Payer - REQUIRED
   * 5-character payer code (e.g., "ODJFS")
   * See Appendix G for valid payer/program combinations
   */
  Payer: string;

  /**
   * PayerProgram - REQUIRED
   * Program code (e.g., "PASSPORT", "MYCARE")
   * See Appendix G for valid payer/program combinations
   */
  PayerProgram: string;

  /**
   * ProcedureCode - REQUIRED
   * HCPCS/procedure code (e.g., "T1019", "S5125")
   * See Appendix G for valid payer/program/procedure combinations
   */
  ProcedureCode: string;

  /**
   * Modifier - OPTIONAL but COMMON
   * Array of modifier codes (e.g., ["U4", "UD"])
   * See Appendix G for valid modifiers per procedure
   */
  Modifier?: string[];

  /**
   * TimeZone - REQUIRED
   * IANA timezone (e.g., "America/New_York")
   * CRITICAL for accurate timestamp interpretation
   */
  TimeZone: string;

  /**
   * VisitLocationType - REQUIRED
   * "1" = Home (patient residence)
   * "2" = Community (other location)
   * CRITICAL: Must be string "1" or "2", not number or text
   */
  VisitLocationType: VisitLocationType;

  /**
   * BillVisit - REQUIRED
   * "Y" = Yes, bill this visit
   * "N" = No, do not bill (training, observation, etc.)
   */
  BillVisit: "Y" | "N";

  /**
   * Calls - REQUIRED (CRITICAL - DEMO BLOCKER)
   * Array of clock in/out events
   * Minimum 2 calls required: Call In + Call Out
   * CRITICAL: This is the MOST IMPORTANT field for EVV compliance
   */
  Calls: OhioVisitCall[];

  /**
   * VisitChanges - OPTIONAL but REQUIRED if manual entry/edit occurred
   * Array of audit trail entries for manual edits
   * Used when office staff corrects clock in/out times
   */
  VisitChanges?: OhioVisitChange[];

  /**
   * AuthorizationNumber - OPTIONAL but RECOMMENDED
   * Service authorization number
   * Used for authorization matching
   */
  AuthorizationNumber?: string;

  /**
   * Units - OPTIONAL (calculated by Sandata from Calls)
   * Billable units (typically 15-minute increments)
   * If omitted, Sandata calculates from Calls[] timestamps
   */
  Units?: number;
}

/**
 * Call (Clock In/Out Event) - CRITICAL FOR EVV COMPLIANCE
 *
 * Each visit MUST have at minimum:
 * - 1 "Call In" (start of service)
 * - 1 "Call Out" (end of service)
 *
 * Additional calls may be added for breaks, suspensions, etc.
 */
export interface OhioVisitCall {
  /**
   * CallType - REQUIRED
   * "I" = Call In (clock in / start service)
   * "O" = Call Out (clock out / end service)
   */
  CallType: "I" | "O";

  /**
   * CallDateTime - REQUIRED
   * Format: MM/DD/YYYY HH:MM:SS (24-hour time)
   * Example: "11/03/2025 08:30:00"
   * CRITICAL: Forward slashes in date, space separator, 24-hour time
   */
  CallDateTime: string;

  /**
   * CallMethod - REQUIRED
   * "M" = Mobile app (GPS)
   * "T" = Telephony (phone call)
   * "F" = Fixed device
   * "W" = Web portal
   */
  CallMethod: "M" | "T" | "F" | "W";

  /**
   * Latitude - REQUIRED for GPS-based calls (CallMethod = "M")
   * Decimal degrees (e.g., 39.961176)
   * Range: -90 to +90
   */
  Latitude?: number;

  /**
   * Longitude - REQUIRED for GPS-based calls (CallMethod = "M")
   * Decimal degrees (e.g., -82.998794)
   * Range: -180 to +180
   */
  Longitude?: number;

  /**
   * GPSAccuracy - OPTIONAL but RECOMMENDED
   * Accuracy in meters (e.g., 10)
   * Lower is better (5-20m typical for good GPS)
   */
  GPSAccuracy?: number;

  /**
   * TelephoneNumber - REQUIRED for telephony calls (CallMethod = "T")
   * Phone number used for clock in/out
   * 10 digits (e.g., "6145551234")
   */
  TelephoneNumber?: string;
}

/**
 * VisitChange (Audit Trail for Manual Edits)
 *
 * Required when office staff manually enters or corrects visit data
 * Used to track who changed what and why
 */
export interface OhioVisitChange {
  /**
   * ChangeField - REQUIRED
   * Name of field that was changed
   * Example: "CallDateTime", "VisitLocationType", "ProcedureCode"
   */
  ChangeField: string;

  /**
   * OldValue - REQUIRED
   * Previous value before change
   * String representation of the old value
   */
  OldValue: string;

  /**
   * NewValue - REQUIRED
   * New value after change
   * String representation of the new value
   */
  NewValue: string;

  /**
   * ChangeDateTime - REQUIRED
   * When the change was made
   * Format: MM/DD/YYYY HH:MM:SS
   */
  ChangeDateTime: string;

  /**
   * ChangeUserID - REQUIRED
   * Who made the change
   * Office staff user ID or name
   */
  ChangeUserID: string;

  /**
   * ReasonCode - REQUIRED
   * Why the change was made
   * Currently only "99" is valid for Ohio (Appendix H)
   */
  ReasonCode: ReasonCode;

  /**
   * ReasonDescription - OPTIONAL but RECOMMENDED
   * Free-text explanation (e.g., "Caregiver forgot to clock out")
   * Max 255 characters
   */
  ReasonDescription?: string;
}

/**
 * Visit POST request body
 */
export interface OhioVisitRequest {
  Visit: OhioVisit[];
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Ohio Alt-EVV API Response
 * Sandata returns this structure for all POST requests
 */
export interface OhioAltEVVResponse {
  /**
   * Success indicator
   */
  Success: boolean;

  /**
   * Response message
   */
  Message?: string;

  /**
   * Validation errors (if Success = false)
   */
  Errors?: OhioValidationError[];

  /**
   * Warnings (non-blocking)
   */
  Warnings?: OhioValidationWarning[];

  /**
   * Transaction ID (for tracking)
   */
  TransactionID?: string;

  /**
   * Timestamp of response
   */
  ResponseDateTime?: string;
}

export interface OhioValidationError {
  /**
   * Error code (e.g., "VAL_001", "BUS_AUTH_MISSING")
   */
  ErrorCode: string;

  /**
   * Error message
   */
  ErrorMessage: string;

  /**
   * Field that caused the error
   */
  FieldName?: string;

  /**
   * Record index in array (0-based)
   */
  RecordIndex?: number;

  /**
   * Severity (always "error" for blocking errors)
   */
  Severity: "error";
}

export interface OhioValidationWarning {
  /**
   * Warning code
   */
  WarningCode: string;

  /**
   * Warning message
   */
  WarningMessage: string;

  /**
   * Field that triggered the warning
   */
  FieldName?: string;

  /**
   * Record index in array (0-based)
   */
  RecordIndex?: number;

  /**
   * Severity (always "warning" for non-blocking warnings)
   */
  Severity: "warning";
}

// ============================================================================
// Appendix G - Valid Payer/Program/Procedure Combinations
// ============================================================================

/**
 * Appendix G Combination
 * Ohio has ~200 valid (Payer, Program, ProcedureCode, Modifier) combinations
 * These must be validated BEFORE submission to prevent rejection
 */
export interface AppendixGCombination {
  Payer: string;
  PayerProgram: string;
  ProcedureCode: string;
  ValidModifiers: string[];
  Description?: string;
}

/**
 * Example Appendix G entries (partial list)
 * Full list should be loaded from database or configuration file
 */
export const OHIO_APPENDIX_G_SAMPLE: AppendixGCombination[] = [
  {
    Payer: "ODJFS",
    PayerProgram: "PASSPORT",
    ProcedureCode: "T1019",
    ValidModifiers: ["U4", "UD"],
    Description: "Personal care services - PASSPORT",
  },
  {
    Payer: "ODJFS",
    PayerProgram: "PASSPORT",
    ProcedureCode: "S5125",
    ValidModifiers: ["U4", "UD"],
    Description: "Attendant care services - PASSPORT",
  },
  {
    Payer: "ODJFS",
    PayerProgram: "MYCARE",
    ProcedureCode: "T1019",
    ValidModifiers: ["U4", "UD"],
    Description: "Personal care services - MyCare Ohio",
  },
  // Additional 200+ combinations should be loaded from official Appendix G
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for Ohio Alt-EVV (MM/DD/YYYY)
 */
export function formatOhioDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format datetime for Ohio Alt-EVV (MM/DD/YYYY HH:MM:SS)
 */
export function formatOhioDateTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse Ohio date string to Date object
 */
export function parseOhioDate(dateStr: string): Date {
  // Format: MM/DD/YYYY
  const [month, day, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse Ohio datetime string to Date object
 */
export function parseOhioDateTime(dateTimeStr: string): Date {
  // Format: MM/DD/YYYY HH:MM:SS
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Validate Appendix G combination
 */
export function isValidAppendixGCombination(
  payer: string,
  program: string,
  procedureCode: string,
  modifiers: string[] = []
): boolean {
  // TODO: Load full Appendix G from database
  const combination = OHIO_APPENDIX_G_SAMPLE.find(
    (entry) =>
      entry.Payer === payer &&
      entry.PayerProgram === program &&
      entry.ProcedureCode === procedureCode
  );

  if (!combination) {
    return false;
  }

  // Check if all modifiers are valid for this combination
  if (modifiers.length > 0) {
    return modifiers.every((mod) => combination.ValidModifiers.includes(mod));
  }

  return true;
}

/**
 * Type guard to check if response has errors
 */
export function hasOhioErrors(response: OhioAltEVVResponse): response is OhioAltEVVResponse & { Errors: OhioValidationError[] } {
  return !response.Success && (response.Errors?.length ?? 0) > 0;
}

/**
 * Type guard to check if response has warnings
 */
export function hasOhioWarnings(response: OhioAltEVVResponse): boolean {
  return (response.Warnings?.length ?? 0) > 0;
}
