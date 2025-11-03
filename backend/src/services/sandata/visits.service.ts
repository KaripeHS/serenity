/**
 * Sandata Visits Service
 * Orchestrates EVV visit submission workflow with Sandata Alt-EVV
 *
 * Features:
 * - Pre-submission validation (6-element EVV, geofence, authorization)
 * - Visit key generation for idempotency
 * - Time rounding for billing compliance
 * - Transaction logging and retry queue
 * - Status tracking and error handling
 *
 * @module services/sandata/visits.service
 */

import { getSandataClient } from './client';
import { getSandataValidator } from './validator.service';
import { getSandataRepository } from './repositories/sandata.repository';
import { getDbClient } from '../../database/client';
import * as VisitKeyUtils from './visitKey';
import * as RoundingUtils from './rounding';
import { SANDATA_ENDPOINTS, getSandataBusinessRules } from '../../config/sandata';
import type {
  SandataVisit,
  SandataVisitResponse,
  SandataApiResponse,
  ValidationContext,
  ValidationResult,
  RoundingMode,
} from './types';

/**
 * Database EVV record types (to be replaced with actual Prisma/Drizzle types)
 */
interface DatabaseEVVRecord {
  id: string;
  shiftId: string;
  clientId: string;
  caregiverId: string;
  serviceCode: string;
  serviceDate: Date;
  clockInTime: Date;
  clockOutTime: Date;
  clockInLatitude: number;
  clockInLongitude: number;
  clockOutLatitude: number;
  clockOutLongitude: number;
  billableUnits?: number;
  authorizationNumber?: string;
  visitKey?: string | null;
  sandataStatus?: string | null;
  sandataVisitId?: string | null;
  sandataSubmittedAt?: Date | null;
  sandataRejectedReason?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseClient {
  id: string;
  sandataClientId?: string | null;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  evvConsentStatus?: string;
}

interface DatabaseUser {
  id: string;
  sandataEmployeeId?: string | null;
}

interface VisitSubmissionOptions {
  skipValidation?: boolean; // Skip pre-submission validation
  dryRun?: boolean; // Validate only, don't submit
  roundingMode?: RoundingMode; // Override default rounding
  forceSubmit?: boolean; // Submit even if already submitted
}

interface VisitSubmissionResult {
  success: boolean;
  evvRecordId: string;
  sandataVisitId?: string;
  visitKey?: string;
  action: 'submitted' | 'validated' | 'skipped' | 'rejected';
  validationErrors?: string[];
  validationWarnings?: string[];
  sandataErrors?: string[];
  transactionId?: string;
}

/**
 * Sandata Visits Service
 */
export class SandataVisitsService {
  private readonly client = getSandataClient();
  private readonly validator = getSandataValidator();
  private readonly repository = getSandataRepository(getDbClient());
  private readonly businessRules = getSandataBusinessRules();

  /**
   * Submit a single visit to Sandata
   */
  async submitVisit(
    evvRecord: DatabaseEVVRecord,
    client: DatabaseClient,
    caregiver: DatabaseUser,
    options: VisitSubmissionOptions = {}
  ): Promise<VisitSubmissionResult> {
    const {
      skipValidation = false,
      dryRun = false,
      roundingMode = this.businessRules.roundingMode,
      forceSubmit = false,
    } = options;

    try {
      // Check if already submitted (unless force submit)
      if (evvRecord.sandataVisitId && evvRecord.sandataStatus === 'accepted' && !forceSubmit) {
        return {
          success: true,
          evvRecordId: evvRecord.id,
          sandataVisitId: evvRecord.sandataVisitId,
          visitKey: evvRecord.visitKey || undefined,
          action: 'skipped',
          validationWarnings: ['Visit already submitted and accepted by Sandata'],
        };
      }

      // Check prerequisites
      const prerequisiteCheck = this.checkPrerequisites(evvRecord, client, caregiver);
      if (!prerequisiteCheck.success) {
        return {
          success: false,
          evvRecordId: evvRecord.id,
          action: 'rejected',
          validationErrors: prerequisiteCheck.errors,
        };
      }

      // Generate visit key (idempotent identifier)
      const visitKey = evvRecord.visitKey || this.generateVisitKey(evvRecord);

      // Round clock times for billing compliance
      const { roundedClockIn, roundedClockOut, billableUnits } = this.roundVisitTimes(
        evvRecord,
        roundingMode
      );

      // Map to Sandata visit format
      const sandataVisit = await this.mapEVVRecordToSandataVisit(
        evvRecord,
        client,
        caregiver,
        visitKey,
        roundedClockIn,
        roundedClockOut,
        billableUnits
      );

      // Pre-submission validation
      let validationResult: ValidationResult | null = null;
      if (!skipValidation) {
        const validationContext: ValidationContext = {
          geofenceRadiusMiles: this.businessRules.geofenceRadiusMiles,
          clockInToleranceMinutes: this.businessRules.clockInToleranceMinutes,
          clientAddress: this.getClientAddress(client),
          // Would fetch authorization from database
          // authorization: await this.getAuthorization(evvRecord.authorizationNumber),
        };

        validationResult = await this.validator.validateVisit(sandataVisit, validationContext);

        if (!validationResult.isValid) {
          return {
            success: false,
            evvRecordId: evvRecord.id,
            visitKey,
            action: 'rejected',
            validationErrors: validationResult.errors.map((e) => e.message),
            validationWarnings: validationResult.warnings?.map((w) => w.message),
          };
        }
      }

      // Dry run - validate only
      if (dryRun) {
        return {
          success: true,
          evvRecordId: evvRecord.id,
          visitKey,
          action: 'validated',
          validationWarnings: validationResult?.warnings?.map((w) => w.message) || [
            'Dry run - no actual submission',
          ],
        };
      }

      // Submit to Sandata
      const response = await this.client.post<SandataVisitResponse>(SANDATA_ENDPOINTS.visits, {
        visit: sandataVisit,
      });

      // Handle response
      if (!response.success || !response.data) {
        return {
          success: false,
          evvRecordId: evvRecord.id,
          visitKey,
          action: 'rejected',
          sandataErrors: [response.error?.message || 'Unknown error'],
          transactionId: response.transactionId,
        };
      }

      const visitResponse = response.data;

      // Check if accepted or rejected
      if (visitResponse.status === 'rejected') {
        await this.logRejection(evvRecord.id, visitResponse, visitKey);

        return {
          success: false,
          evvRecordId: evvRecord.id,
          visitKey,
          action: 'rejected',
          sandataErrors: visitResponse.errors?.map((e) => e.message) || ['Visit rejected'],
          transactionId: response.transactionId,
        };
      }

      // Log successful transaction
      await this.logTransaction({
        transactionType: 'visit',
        requestPayload: sandataVisit,
        responsePayload: visitResponse,
        status: 'accepted',
        httpStatusCode: response.statusCode,
        evvRecordId: evvRecord.id,
        organizationId: evvRecord.organizationId,
        transactionId: response.transactionId,
      });

      // Update EVV record with Sandata details
      await this.updateEVVRecord(evvRecord.id, {
        visitKey,
        sandataVisitId: visitResponse.visitId,
        sandataStatus: 'accepted',
        sandataSubmittedAt: new Date(),
        billableUnits,
      });

      return {
        success: true,
        evvRecordId: evvRecord.id,
        sandataVisitId: visitResponse.visitId,
        visitKey,
        action: 'submitted',
        validationWarnings: validationResult?.warnings?.map((w) => w.message),
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        evvRecordId: evvRecord.id,
        action: 'rejected',
        sandataErrors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Submit multiple visits in batch
   */
  async submitVisits(
    visits: Array<{
      evvRecord: DatabaseEVVRecord;
      client: DatabaseClient;
      caregiver: DatabaseUser;
    }>,
    options: VisitSubmissionOptions = {}
  ): Promise<VisitSubmissionResult[]> {
    const results: VisitSubmissionResult[] = [];

    // Process sequentially to avoid rate limiting
    // TODO: Implement proper queue-based processing
    for (const { evvRecord, client, caregiver } of visits) {
      const result = await this.submitVisit(evvRecord, client, caregiver, options);
      results.push(result);

      // Add delay to avoid rate limiting (250ms = 4 requests/sec)
      await this.delay(250);
    }

    return results;
  }

  /**
   * Retrieve visit from Sandata
   */
  async getVisit(sandataVisitId: string): Promise<SandataApiResponse<SandataVisit>> {
    return await this.client.get<SandataVisit>(`${SANDATA_ENDPOINTS.visits}/${sandataVisitId}`);
  }

  /**
   * Get submission status for an EVV record
   */
  async getSubmissionStatus(evvRecordId: string): Promise<{
    isSubmitted: boolean;
    sandataVisitId?: string | null;
    sandataStatus?: string | null;
    visitKey?: string | null;
    submittedAt?: Date | null;
    rejectedReason?: string | null;
  }> {
    // Would query database for EVV record
    // Placeholder implementation
    return {
      isSubmitted: false,
      sandataVisitId: null,
      sandataStatus: null,
      visitKey: null,
      submittedAt: null,
      rejectedReason: null,
    };
  }

  /**
   * Resubmit a rejected visit (after fixing issues)
   */
  async resubmitVisit(
    evvRecordId: string,
    options: VisitSubmissionOptions = {}
  ): Promise<VisitSubmissionResult> {
    // Would fetch EVV record, client, and caregiver from database
    // Then call submitVisit with forceSubmit: true
    throw new Error('Not implemented - requires database integration');
  }

  /**
   * Check prerequisites before submission
   */
  private checkPrerequisites(
    evvRecord: DatabaseEVVRecord,
    client: DatabaseClient,
    caregiver: DatabaseUser
  ): { success: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Client must have Sandata ID
    if (!client.sandataClientId) {
      errors.push('Client must be synced to Sandata before submitting visits');
    }

    // Caregiver must have Sandata ID
    if (!caregiver.sandataEmployeeId) {
      errors.push('Caregiver must be synced to Sandata before submitting visits');
    }

    // Client must have EVV consent
    if (client.evvConsentStatus !== 'signed') {
      errors.push('Client must have signed EVV consent');
    }

    // Basic data validation
    if (!evvRecord.serviceCode) {
      errors.push('Service code is required');
    }

    if (!evvRecord.clockInTime || !evvRecord.clockOutTime) {
      errors.push('Clock in/out times are required');
    }

    if (evvRecord.clockOutTime <= evvRecord.clockInTime) {
      errors.push('Clock out time must be after clock in time');
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Generate visit key
   */
  private generateVisitKey(evvRecord: DatabaseEVVRecord): string {
    return VisitKeyUtils.generateVisitKey({
      clientId: evvRecord.clientId,
      caregiverId: evvRecord.caregiverId,
      serviceDate: evvRecord.serviceDate.toISOString().split('T')[0],
      serviceCode: evvRecord.serviceCode,
    });
  }

  /**
   * Round visit times for billing compliance
   */
  private roundVisitTimes(
    evvRecord: DatabaseEVVRecord,
    roundingMode: RoundingMode
  ): {
    roundedClockIn: Date;
    roundedClockOut: Date;
    billableUnits: number;
  } {
    const roundingMinutes = this.businessRules.roundingMinutes;

    const clockInResult = RoundingUtils.roundTime(evvRecord.clockInTime, {
      roundingMinutes,
      roundingMode,
    });

    const clockOutResult = RoundingUtils.roundTime(evvRecord.clockOutTime, {
      roundingMinutes,
      roundingMode,
    });

    const billableUnits = RoundingUtils.calculateBillableUnitsFromTimes(
      clockInResult.roundedTime,
      clockOutResult.roundedTime,
      { roundingMinutes, roundingMode }
    );

    return {
      roundedClockIn: clockInResult.roundedTime,
      roundedClockOut: clockOutResult.roundedTime,
      billableUnits,
    };
  }

  /**
   * Map EVV record to Sandata visit format
   */
  private async mapEVVRecordToSandataVisit(
    evvRecord: DatabaseEVVRecord,
    client: DatabaseClient,
    caregiver: DatabaseUser,
    visitKey: string,
    roundedClockIn: Date,
    roundedClockOut: Date,
    billableUnits: number
  ): Promise<SandataVisit> {
    return {
      providerId: await this.getProviderId(evvRecord.organizationId),
      serviceCode: evvRecord.serviceCode,
      individualId: client.sandataClientId!,
      employeeId: caregiver.sandataEmployeeId!,
      serviceDate: evvRecord.serviceDate.toISOString().split('T')[0],
      clockInTime: roundedClockIn.toISOString(),
      clockOutTime: roundedClockOut.toISOString(),
      clockInLocation: {
        latitude: evvRecord.clockInLatitude,
        longitude: evvRecord.clockInLongitude,
        accuracy: 10, // Would come from mobile device data
        timestamp: evvRecord.clockInTime.toISOString(),
      },
      clockOutLocation: {
        latitude: evvRecord.clockOutLatitude,
        longitude: evvRecord.clockOutLongitude,
        accuracy: 10,
        timestamp: evvRecord.clockOutTime.toISOString(),
      },
      units: billableUnits,
      authorizationNumber: evvRecord.authorizationNumber,
      verificationMethod: 'gps',
      visitKey,
      externalId: evvRecord.id, // Our EVV record UUID
      shiftId: evvRecord.shiftId,
    };
  }

  /**
   * Get client address for geofence validation
   */
  private getClientAddress(client: DatabaseClient): any {
    if (!client.addressLine1 || !client.city || !client.state) {
      return undefined;
    }

    return {
      street1: client.addressLine1,
      city: client.city,
      state: client.state,
      zipCode: client.zipCode || '',
    };
  }

  /**
   * Log transaction to database
   */
  private async logTransaction(transaction: {
    transactionType: string;
    requestPayload: any;
    responsePayload: any;
    status: string;
    httpStatusCode?: number;
    evvRecordId: string;
    organizationId: string;
    transactionId?: string | undefined;
  }): Promise<void> {
    await this.repository.createTransaction({
      transactionType: transaction.transactionType,
      transactionId: transaction.transactionId,
      requestPayload: transaction.requestPayload,
      responsePayload: transaction.responsePayload,
      httpStatusCode: transaction.httpStatusCode,
      status: transaction.status,
      evvRecordId: transaction.evvRecordId,
      organizationId: transaction.organizationId,
    });
  }

  /**
   * Log rejection to database
   */
  private async logRejection(
    evvRecordId: string,
    visitResponse: SandataVisitResponse,
    visitKey: string
  ): Promise<void> {
    const rejectionReasons = visitResponse.errors?.map((e) => e.message).join('; ') || 'Unknown';

    await this.updateEVVRecord(evvRecordId, {
      visitKey,
      sandataStatus: 'rejected',
      sandataRejectedReason: rejectionReasons,
      sandataSubmittedAt: new Date(),
    });

    this.logger.error('Visit rejected', {
      evvRecordId,
      visitKey,
      reasons: rejectionReasons,
    });
  }

  /**
   * Update EVV record with Sandata details
   */
  private async updateEVVRecord(
    evvRecordId: string,
    updates: {
      visitKey?: string;
      sandataVisitId?: string;
      sandataStatus?: string;
      sandataSubmittedAt?: Date;
      sandataRejectedReason?: string;
      billableUnits?: number;
    }
  ): Promise<void> {
    await this.repository.updateEVVRecordSandataDetails(evvRecordId, updates);
  }

  /**
   * Get provider ID for organization
   */
  private async getProviderId(organizationId: string): Promise<string> {
    const config = await this.repository.getConfig(organizationId);
    if (!config) {
      throw new Error(`Sandata configuration not found for organization ${organizationId}`);
    }
    return config.sandata_provider_id;
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

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
let visitsServiceInstance: SandataVisitsService | null = null;

/**
 * Get Sandata Visits Service singleton
 */
export function getSandataVisitsService(): SandataVisitsService {
  if (!visitsServiceInstance) {
    visitsServiceInstance = new SandataVisitsService();
  }
  return visitsServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetSandataVisitsService(): void {
  visitsServiceInstance = null;
}

export default SandataVisitsService;
