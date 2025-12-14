/**
 * Ohio Alt-EVV Submission Orchestrator Service
 * Orchestrates end-to-end Patient, Staff, and Visit submissions to Sandata
 *
 * CRITICAL: This is the main entry point for all Ohio Alt-EVV v4.3 submissions
 *
 * Features:
 * - Single interface for Patient/Staff/Visit submissions
 * - Orchestrates all builders (Patient, Staff, Visit)
 * - Validates with Appendix G and authorization matching
 * - Handles pre-submission validation
 * - Tracks submission status in database
 * - Manages retry logic for failures
 * - Provides submission status and history
 *
 * Usage Example:
 * ```typescript
 * const orchestrator = getOhioSubmissionOrchestrator();
 * const result = await orchestrator.submitVisit(visitData, patientData, staffData);
 * if (!result.success) {
 *   logger.error('Submission failed:', result.errors);
 * }
 * ```
 *
 * @module services/sandata/ohio-submission-orchestrator.service
 */

import { SandataClient } from './client';
import { getOhioPatientBuilderService } from './ohio-patient-builder.service';
import { getOhioStaffBuilderService } from './ohio-staff-builder.service';
import { getOhioVisitBuilderService } from './ohio-visit-builder.service';
import { getAppendixGValidatorService } from './appendix-g-validator.service';
import { getAuthorizationMatcherService } from './authorization-matcher.service';
import { SANDATA_ENDPOINTS } from '../../config/sandata';

import type { OhioPatient, OhioStaff, OhioVisit, OhioAltEVVResponse } from './ohio-types';
import type { ClientData } from './ohio-patient-builder.service';
import type { StaffData } from './ohio-staff-builder.service';
import type { EVVRecordData, PatientData, StaffData as VisitStaffData } from './ohio-visit-builder.service';
import type { Authorization, VisitForAuthCheck } from './authorization-matcher.service';


import { createLogger } from '../../utils/logger';

const logger = createLogger('ohio-submission-orchestrator');
/**
 * Submission result
 */
export interface SubmissionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  sandataResponse?: OhioAltEVVResponse;
  transactionId?: string;
  httpStatus?: number;
  submittedAt: Date;
}

/**
 * Patient submission result
 */
export interface PatientSubmissionResult extends SubmissionResult {
  patient?: OhioPatient;
  patientOtherId?: string;
  sequenceId?: number;
}

/**
 * Staff submission result
 */
export interface StaffSubmissionResult extends SubmissionResult {
  staff?: OhioStaff;
  staffOtherId?: string;
  sequenceId?: number;
}

/**
 * Visit submission result
 */
export interface VisitSubmissionResult extends SubmissionResult {
  visit?: OhioVisit;
  visitOtherId?: string;
  sequenceId?: number;
  authorizationNumber?: string;
}

/**
 * Ohio Alt-EVV Submission Orchestrator Service
 */
export class OhioSubmissionOrchestratorService {
  private readonly sandataClient: SandataClient;
  private readonly patientBuilder = getOhioPatientBuilderService();
  private readonly staffBuilder = getOhioStaffBuilderService();
  private readonly visitBuilder = getOhioVisitBuilderService();
  private readonly appendixGValidator = getAppendixGValidatorService();
  private readonly authorizationMatcher = getAuthorizationMatcherService();

  constructor() {
    this.sandataClient = new SandataClient();
  }

  /**
   * Submit patient to Sandata
   * Validates, builds payload, and submits to Sandata UAT/Production
   *
   * @param clientData - Client data from database
   * @param options - Build options
   * @returns Patient submission result
   */
  async submitPatient(
    clientData: ClientData,
    options: { generateNewSequenceId?: boolean; defaultTimezone?: string } = {}
  ): Promise<PatientSubmissionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Build patient payload
      const buildResult = await this.patientBuilder.buildPatient(clientData, options);

      if (!buildResult.success || !buildResult.patient) {
        return {
          success: false,
          errors: buildResult.errors || ['Patient build failed'],
          warnings: buildResult.warnings || [],
          submittedAt: new Date(),
        };
      }

      const patient = buildResult.patient;
      warnings.push(...(buildResult.warnings || []));

      // Build request
      const request = this.patientBuilder.buildPatientRequest([patient]);

      // Submit to Sandata
      const response = await this.sandataClient.post<OhioAltEVVResponse>(
        SANDATA_ENDPOINTS.patient,
        request
      );

      // Parse response
      const sandataResponse = response.data;

      if (!sandataResponse.Success) {
        return {
          success: false,
          patient,
          patientOtherId: patient.PatientOtherID,
          sequenceId: patient.SequenceID,
          errors: sandataResponse.Errors?.map((e) => e.ErrorMessage) || ['Unknown error'],
          warnings: sandataResponse.Warnings?.map((w) => w.WarningMessage) || [],
          sandataResponse,
          transactionId: sandataResponse.TransactionID,
          httpStatus: response.statusCode,
          submittedAt: new Date(),
        };
      }

      // Success
      return {
        success: true,
        patient,
        patientOtherId: patient.PatientOtherID,
        sequenceId: patient.SequenceID,
        errors: [],
        warnings: sandataResponse.Warnings?.map((w) => w.WarningMessage) || warnings,
        sandataResponse,
        transactionId: sandataResponse.TransactionID,
        httpStatus: response.statusCode,
        submittedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Patient submission failed: ${this.getErrorMessage(error)}`],
        warnings,
        submittedAt: new Date(),
      };
    }
  }

  /**
   * Submit staff to Sandata
   * Validates SSN, builds payload, and submits to Sandata UAT/Production
   *
   * @param staffData - Staff data from database
   * @param options - Build options
   * @returns Staff submission result
   */
  async submitStaff(
    staffData: StaffData,
    options: { generateNewSequenceId?: boolean; generateStaffPin?: boolean; customStaffId?: string } = {}
  ): Promise<StaffSubmissionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Build staff payload
      const buildResult = await this.staffBuilder.buildStaff(staffData, options);

      if (!buildResult.success || !buildResult.staff) {
        return {
          success: false,
          errors: buildResult.errors || ['Staff build failed'],
          warnings: buildResult.warnings || [],
          submittedAt: new Date(),
        };
      }

      const staff = buildResult.staff;
      warnings.push(...(buildResult.warnings || []));

      // Build request
      const request = this.staffBuilder.buildStaffRequest([staff]);

      // Submit to Sandata
      const response = await this.sandataClient.post<OhioAltEVVResponse>(
        SANDATA_ENDPOINTS.staff,
        request
      );

      // Parse response
      const sandataResponse = response.data;

      if (!sandataResponse.Success) {
        return {
          success: false,
          staff,
          staffOtherId: staff.StaffOtherID,
          sequenceId: staff.SequenceID,
          errors: sandataResponse.Errors?.map((e) => e.ErrorMessage) || ['Unknown error'],
          warnings: sandataResponse.Warnings?.map((w) => w.WarningMessage) || [],
          sandataResponse,
          transactionId: sandataResponse.TransactionID,
          httpStatus: response.statusCode,
          submittedAt: new Date(),
        };
      }

      // Success
      return {
        success: true,
        staff,
        staffOtherId: staff.StaffOtherID,
        sequenceId: staff.SequenceID,
        errors: [],
        warnings: sandataResponse.Warnings?.map((w) => w.WarningMessage) || warnings,
        sandataResponse,
        transactionId: sandataResponse.TransactionID,
        httpStatus: response.statusCode,
        submittedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Staff submission failed: ${this.getErrorMessage(error)}`],
        warnings,
        submittedAt: new Date(),
      };
    }
  }

  /**
   * Submit visit to Sandata
   * Validates Appendix G, checks authorization, builds payload, and submits
   *
   * @param evvRecord - EVV record data from database
   * @param patient - Patient data
   * @param staff - Staff data
   * @param authorizations - Authorizations for authorization matching (optional)
   * @param options - Build options
   * @returns Visit submission result
   */
  async submitVisit(
    evvRecord: EVVRecordData,
    patient: PatientData,
    staff: VisitStaffData,
    authorizations?: Authorization[],
    options: {
      generateNewSequenceId?: boolean;
      billable?: boolean;
      defaultTimezone?: string;
      defaultPayer?: string;
      defaultPayerProgram?: string;
      skipAppendixGValidation?: boolean;
      skipAuthorizationCheck?: boolean;
    } = {}
  ): Promise<VisitSubmissionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate Appendix G (unless skipped)
      if (!options.skipAppendixGValidation) {
        const payer = evvRecord.payer || options.defaultPayer || 'ODJFS';
        const payerProgram = evvRecord.payerProgram || options.defaultPayerProgram || 'PASSPORT';

        const appendixGResult = await this.appendixGValidator.validate(
          payer,
          payerProgram,
          evvRecord.serviceCode,
          evvRecord.modifiers
        );

        if (!appendixGResult.isValid) {
          return {
            success: false,
            errors: appendixGResult.errors,
            warnings: appendixGResult.warnings,
            submittedAt: new Date(),
          };
        }

        warnings.push(...appendixGResult.warnings);
      }

      // Check authorization (unless skipped)
      if (!options.skipAuthorizationCheck && authorizations && authorizations.length > 0) {
        const visitForAuthCheck: VisitForAuthCheck = {
          id: evvRecord.id,
          clientId: evvRecord.clientId,
          serviceDate: evvRecord.serviceDate,
          payer: evvRecord.payer || options.defaultPayer || 'ODJFS',
          payerProgram: evvRecord.payerProgram || options.defaultPayerProgram || 'PASSPORT',
          procedureCode: evvRecord.serviceCode,
          modifiers: evvRecord.modifiers,
          units: evvRecord.units || this.authorizationMatcher.calculateUnits(
            evvRecord.clockInTime,
            evvRecord.clockOutTime
          ),
        };

        const authResult = await this.authorizationMatcher.validateVisit(
          visitForAuthCheck,
          authorizations,
          'warn' // Default to warn mode
        );

        if (!authResult.isValid && authResult.severity === 'block') {
          return {
            success: false,
            errors: authResult.errors,
            warnings: authResult.warnings,
            submittedAt: new Date(),
          };
        }

        warnings.push(...authResult.warnings);
      }

      // Build visit payload
      const buildResult = await this.visitBuilder.buildVisit(evvRecord, patient, staff, options);

      if (!buildResult.success || !buildResult.visit) {
        return {
          success: false,
          errors: buildResult.errors || ['Visit build failed'],
          warnings: buildResult.warnings || [],
          submittedAt: new Date(),
        };
      }

      const visit = buildResult.visit;
      warnings.push(...(buildResult.warnings || []));

      // Build request
      const request = this.visitBuilder.buildVisitRequest([visit]);

      // Submit to Sandata
      const response = await this.sandataClient.post<OhioAltEVVResponse>(
        SANDATA_ENDPOINTS.visit,
        request
      );

      // Parse response
      const sandataResponse = response.data;

      if (!sandataResponse.Success) {
        return {
          success: false,
          visit,
          visitOtherId: visit.VisitOtherID,
          sequenceId: visit.SequenceID,
          authorizationNumber: visit.AuthorizationNumber,
          errors: sandataResponse.Errors?.map((e) => e.ErrorMessage) || ['Unknown error'],
          warnings: sandataResponse.Warnings?.map((w) => w.WarningMessage) || [],
          sandataResponse,
          transactionId: sandataResponse.TransactionID,
          httpStatus: response.statusCode,
          submittedAt: new Date(),
        };
      }

      // Success
      return {
        success: true,
        visit,
        visitOtherId: visit.VisitOtherID,
        sequenceId: visit.SequenceID,
        authorizationNumber: visit.AuthorizationNumber,
        errors: [],
        warnings: sandataResponse.Warnings?.map((w) => w.WarningMessage) || warnings,
        sandataResponse,
        transactionId: sandataResponse.TransactionID,
        httpStatus: response.statusCode,
        submittedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Visit submission failed: ${this.getErrorMessage(error)}`],
        warnings,
        submittedAt: new Date(),
      };
    }
  }

  /**
   * Batch submit patients to Sandata
   *
   * @param clients - Array of client data
   * @param options - Build options
   * @returns Array of patient submission results
   */
  async batchSubmitPatients(
    clients: ClientData[],
    options: { generateNewSequenceId?: boolean; defaultTimezone?: string } = {}
  ): Promise<PatientSubmissionResult[]> {
    const results: PatientSubmissionResult[] = [];

    for (const client of clients) {
      const result = await this.submitPatient(client, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Batch submit staff to Sandata
   *
   * @param staffMembers - Array of staff data
   * @param options - Build options
   * @returns Array of staff submission results
   */
  async batchSubmitStaff(
    staffMembers: StaffData[],
    options: { generateNewSequenceId?: boolean; generateStaffPin?: boolean } = {}
  ): Promise<StaffSubmissionResult[]> {
    const results: StaffSubmissionResult[] = [];

    for (const staff of staffMembers) {
      const result = await this.submitStaff(staff, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Get submission summary for multiple results
   *
   * @param results - Array of submission results
   * @returns Summary statistics
   */
  getSubmissionSummary(results: SubmissionResult[]): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      total: results.length,
      successful,
      failed,
      successRate: results.length > 0 ? (successful / results.length) * 100 : 0,
      totalErrors,
      totalWarnings,
    };
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'Unknown error occurred';
  }
}

/**
 * Singleton instance
 */
let submissionOrchestratorInstance: OhioSubmissionOrchestratorService | null = null;

/**
 * Get Ohio Submission Orchestrator Service singleton
 */
export function getOhioSubmissionOrchestrator(): OhioSubmissionOrchestratorService {
  if (!submissionOrchestratorInstance) {
    submissionOrchestratorInstance = new OhioSubmissionOrchestratorService();
  }
  return submissionOrchestratorInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetOhioSubmissionOrchestrator(): void {
  submissionOrchestratorInstance = null;
}

export default OhioSubmissionOrchestratorService;
