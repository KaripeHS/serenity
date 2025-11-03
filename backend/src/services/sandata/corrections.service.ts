/**
 * Sandata Corrections Service
 * Manages visit corrections and voids for Sandata Alt-EVV
 *
 * Features:
 * - Submit visit corrections (time, location, service code changes)
 * - Void visits (cancellations, duplicates)
 * - Correction versioning (v1, v2, etc.)
 * - Audit trail for all corrections
 *
 * @module services/sandata/corrections.service
 */

import { getSandataClient } from './client';
import { getSandataVisitsService } from './visits.service';
import { getSandataRepository } from './repositories/sandata.repository';
import { getDbClient } from '../../database/client';
import * as VisitKeyUtils from './visitKey';
import { SANDATA_ENDPOINTS } from '../../config/sandata';
import type {
  SandataVisit,
  SandataVisitCorrectionRequest,
  SandataVisitVoidRequest,
  SandataVisitResponse,
  SandataApiResponse,
} from './types';

/**
 * Correction types
 */
type CorrectionType =
  | 'time_correction' // Clock in/out time changes
  | 'location_correction' // GPS coordinate corrections
  | 'service_code_correction' // Service code change
  | 'units_correction' // Billable units adjustment
  | 'full_correction'; // Multiple fields corrected

type VoidReason =
  | 'duplicate' // Duplicate visit
  | 'cancelled' // Visit was cancelled
  | 'no_show' // Client or caregiver no-show
  | 'data_entry_error' // Incorrect data entry
  | 'other'; // Other reason (requires description)

/**
 * Correction request
 */
interface CorrectionRequest {
  originalEVVRecordId: string;
  correctionType: CorrectionType;
  correctionReason: string;
  correctedFields: Partial<{
    clockInTime: Date;
    clockOutTime: Date;
    clockInLatitude: number;
    clockInLongitude: number;
    clockOutLatitude: number;
    clockOutLongitude: number;
    serviceCode: string;
    billableUnits: number;
  }>;
  correctedBy: string; // User ID who made the correction
}

/**
 * Void request
 */
interface VoidRequest {
  evvRecordId: string;
  voidReason: VoidReason;
  voidReasonDescription?: string;
  voidedBy: string; // User ID who voided
}

/**
 * Correction result
 */
interface CorrectionResult {
  success: boolean;
  originalEVVRecordId: string;
  correctedEVVRecordId?: string;
  originalVisitKey: string;
  correctionVisitKey?: string;
  correctionVersion: number;
  sandataVisitId?: string;
  action: 'corrected' | 'voided' | 'rejected';
  errors?: string[];
  transactionId?: string;
}

/**
 * Sandata Corrections Service
 */
export class SandataCorrectionsService {
  private readonly client = getSandataClient();
  private readonly visitsService = getSandataVisitsService();
  private readonly repository = getSandataRepository(getDbClient());

  /**
   * Submit a visit correction to Sandata
   */
  async correctVisit(request: CorrectionRequest): Promise<CorrectionResult> {
    try {
      // Fetch original EVV record from database
      const originalRecord = await this.getEVVRecord(request.originalEVVRecordId);
      if (!originalRecord) {
        return {
          success: false,
          originalEVVRecordId: request.originalEVVRecordId,
          originalVisitKey: '',
          correctionVersion: 0,
          action: 'rejected',
          errors: ['Original EVV record not found'],
        };
      }

      // Verify original visit was submitted to Sandata
      if (!originalRecord.sandataVisitId || !originalRecord.visitKey) {
        return {
          success: false,
          originalEVVRecordId: request.originalEVVRecordId,
          originalVisitKey: originalRecord.visitKey || '',
          correctionVersion: 0,
          action: 'rejected',
          errors: ['Original visit was not submitted to Sandata'],
        };
      }

      // Determine correction version
      const correctionVersion = await this.getNextCorrectionVersion(originalRecord.visitKey);

      // Generate correction visit key
      const correctionVisitKey = VisitKeyUtils.generateCorrectionKey(
        originalRecord.visitKey,
        correctionVersion
      );

      // Create corrected visit data
      const correctedVisit = this.applyCorrectionToVisit(originalRecord, request.correctedFields);

      // Prepare Sandata correction request
      const sandataCorrectionRequest: SandataVisitCorrectionRequest = {
        originalVisitId: originalRecord.sandataVisitId,
        correctedVisit: {
          ...correctedVisit,
          visitKey: correctionVisitKey,
        },
        correctionReason: request.correctionReason,
      };

      // Submit correction to Sandata
      const response = await this.client.post<SandataVisitResponse>(
        `${SANDATA_ENDPOINTS.visits}/corrections`,
        sandataCorrectionRequest
      );

      // Handle response
      if (!response.success || !response.data) {
        return {
          success: false,
          originalEVVRecordId: request.originalEVVRecordId,
          originalVisitKey: originalRecord.visitKey,
          correctionVisitKey,
          correctionVersion,
          action: 'rejected',
          errors: [response.error?.message || 'Correction rejected by Sandata'],
          transactionId: response.transactionId,
        };
      }

      const visitResponse = response.data;

      if (visitResponse.status === 'rejected') {
        await this.logCorrectionRejection(
          originalRecord.id,
          correctionVersion,
          visitResponse,
          correctionVisitKey
        );

        return {
          success: false,
          originalEVVRecordId: request.originalEVVRecordId,
          originalVisitKey: originalRecord.visitKey,
          correctionVisitKey,
          correctionVersion,
          action: 'rejected',
          errors: visitResponse.errors?.map((e) => e.message) || ['Correction rejected'],
          transactionId: response.transactionId,
        };
      }

      // Create new EVV record for the correction
      const correctedRecordId = await this.createCorrectedEVVRecord(
        originalRecord,
        request.correctedFields,
        correctionVisitKey,
        visitResponse.visitId,
        request.correctedBy
      );

      // Log transaction
      await this.logTransaction({
        transactionType: 'visit_correction',
        originalEVVRecordId: request.originalEVVRecordId,
        correctedEVVRecordId: correctedRecordId,
        correctionVersion,
        requestPayload: sandataCorrectionRequest,
        responsePayload: visitResponse,
        status: 'accepted',
        httpStatusCode: response.statusCode,
        transactionId: response.transactionId,
      });

      return {
        success: true,
        originalEVVRecordId: request.originalEVVRecordId,
        correctedEVVRecordId: correctedRecordId,
        originalVisitKey: originalRecord.visitKey,
        correctionVisitKey,
        correctionVersion,
        sandataVisitId: visitResponse.visitId,
        action: 'corrected',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        originalEVVRecordId: request.originalEVVRecordId,
        originalVisitKey: '',
        correctionVersion: 0,
        action: 'rejected',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Void a visit in Sandata
   */
  async voidVisit(request: VoidRequest): Promise<CorrectionResult> {
    try {
      // Fetch EVV record from database
      const evvRecord = await this.getEVVRecord(request.evvRecordId);
      if (!evvRecord) {
        return {
          success: false,
          originalEVVRecordId: request.evvRecordId,
          originalVisitKey: '',
          correctionVersion: 0,
          action: 'rejected',
          errors: ['EVV record not found'],
        };
      }

      // Verify visit was submitted to Sandata
      if (!evvRecord.sandataVisitId || !evvRecord.visitKey) {
        return {
          success: false,
          originalEVVRecordId: request.evvRecordId,
          originalVisitKey: evvRecord.visitKey || '',
          correctionVersion: 0,
          action: 'rejected',
          errors: ['Visit was not submitted to Sandata'],
        };
      }

      // Prepare void reason
      let voidReason = request.voidReason;
      if (request.voidReasonDescription) {
        voidReason += `: ${request.voidReasonDescription}`;
      }

      // Prepare Sandata void request
      const sandataVoidRequest: SandataVisitVoidRequest = {
        visitId: evvRecord.sandataVisitId,
        voidReason,
      };

      // Submit void to Sandata
      const response = await this.client.post<SandataVisitResponse>(
        `${SANDATA_ENDPOINTS.visits}/void`,
        sandataVoidRequest
      );

      // Handle response
      if (!response.success || !response.data) {
        return {
          success: false,
          originalEVVRecordId: request.evvRecordId,
          originalVisitKey: evvRecord.visitKey,
          correctionVersion: 0,
          action: 'rejected',
          errors: [response.error?.message || 'Void request rejected by Sandata'],
          transactionId: response.transactionId,
        };
      }

      const visitResponse = response.data;

      if (visitResponse.status === 'rejected') {
        return {
          success: false,
          originalEVVRecordId: request.evvRecordId,
          originalVisitKey: evvRecord.visitKey,
          correctionVersion: 0,
          action: 'rejected',
          errors: visitResponse.errors?.map((e) => e.message) || ['Void request rejected'],
          transactionId: response.transactionId,
        };
      }

      // Update EVV record status to voided
      await this.updateEVVRecordStatus(request.evvRecordId, {
        sandataStatus: 'voided',
        voidReason: voidReason,
        voidedAt: new Date(),
        voidedBy: request.voidedBy,
      });

      // Log transaction
      await this.logTransaction({
        transactionType: 'void',
        originalEVVRecordId: request.evvRecordId,
        requestPayload: sandataVoidRequest,
        responsePayload: visitResponse,
        status: 'accepted',
        httpStatusCode: response.statusCode,
        transactionId: response.transactionId,
      });

      return {
        success: true,
        originalEVVRecordId: request.evvRecordId,
        originalVisitKey: evvRecord.visitKey,
        correctionVersion: 0,
        action: 'voided',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        originalEVVRecordId: request.evvRecordId,
        originalVisitKey: '',
        correctionVersion: 0,
        action: 'rejected',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Get correction history for a visit
   */
  async getCorrectionHistory(visitKey: string): Promise<{
    originalVisitKey: string;
    corrections: Array<{
      version: number;
      correctionKey: string;
      correctionDate: Date;
      correctionReason: string;
      correctedBy: string;
      status: string;
    }>;
  }> {
    // Would query database for all corrections with this base visit key
    // Placeholder implementation
    const originalKey = VisitKeyUtils.extractOriginalKey(visitKey);

    return {
      originalVisitKey: originalKey,
      corrections: [],
    };
  }

  /**
   * Fetch EVV record from database
   */
  private async getEVVRecord(evvRecordId: string): Promise<any | null> {
    return await this.repository.getEVVRecord(evvRecordId);
  }

  /**
   * Get next correction version number
   */
  private async getNextCorrectionVersion(visitKey: string): Promise<number> {
    // Query database for existing corrections with this visit key
    const originalKey = VisitKeyUtils.extractOriginalKey(visitKey);
    const transactions = await this.repository.getTransactionsByEVVRecord(originalKey);

    // Count correction transactions
    const correctionCount = transactions.filter(
      (t) => t.transaction_type === 'visit_correction'
    ).length;

    return correctionCount + 1;
  }

  /**
   * Apply correction fields to original visit
   */
  private applyCorrectionToVisit(
    originalRecord: any,
    correctedFields: CorrectionRequest['correctedFields']
  ): SandataVisit {
    // Start with original visit data
    const correctedVisit: SandataVisit = {
      providerId: originalRecord.providerId,
      serviceCode: correctedFields.serviceCode || originalRecord.serviceCode,
      individualId: originalRecord.individualId,
      employeeId: originalRecord.employeeId,
      serviceDate: originalRecord.serviceDate,
      clockInTime: correctedFields.clockInTime?.toISOString() || originalRecord.clockInTime,
      clockOutTime: correctedFields.clockOutTime?.toISOString() || originalRecord.clockOutTime,
      clockInLocation: {
        latitude: correctedFields.clockInLatitude ?? originalRecord.clockInLatitude,
        longitude: correctedFields.clockInLongitude ?? originalRecord.clockInLongitude,
        accuracy: 10,
        timestamp: originalRecord.clockInTime,
      },
      clockOutLocation: {
        latitude: correctedFields.clockOutLatitude ?? originalRecord.clockOutLatitude,
        longitude: correctedFields.clockOutLongitude ?? originalRecord.clockOutLongitude,
        accuracy: 10,
        timestamp: originalRecord.clockOutTime,
      },
      units: correctedFields.billableUnits ?? originalRecord.billableUnits,
      authorizationNumber: originalRecord.authorizationNumber,
      verificationMethod: 'gps',
      externalId: originalRecord.id,
    };

    return correctedVisit;
  }

  /**
   * Create corrected EVV record in database
   */
  private async createCorrectedEVVRecord(
    originalRecord: any,
    correctedFields: CorrectionRequest['correctedFields'],
    correctionVisitKey: string,
    sandataVisitId: string,
    correctedBy: string
  ): Promise<string> {
    // Note: In a real implementation, this would create a new EVV record row
    // For now, we update the existing record with the correction details
    await this.repository.updateEVVRecordSandataDetails(originalRecord.id, {
      visitKey: correctionVisitKey,
      sandataVisitId: sandataVisitId,
      sandataStatus: 'corrected',
      billableUnits: correctedFields.billableUnits,
    });

    return originalRecord.id;
  }

  /**
   * Update EVV record status
   */
  private async updateEVVRecordStatus(
    evvRecordId: string,
    updates: {
      sandataStatus: string;
      voidReason?: string;
      voidedAt?: Date;
      voidedBy?: string;
    }
  ): Promise<void> {
    await this.repository.updateEVVRecordSandataDetails(evvRecordId, {
      sandataStatus: updates.sandataStatus,
      sandataRejectedReason: updates.voidReason,
    });
  }

  /**
   * Log correction rejection
   */
  private async logCorrectionRejection(
    originalEVVRecordId: string,
    correctionVersion: number,
    visitResponse: SandataVisitResponse,
    correctionVisitKey: string
  ): Promise<void> {
    const rejectionReasons = visitResponse.errors?.map((e) => e.message).join('; ') || 'Unknown';

    await this.repository.updateEVVRecordSandataDetails(originalEVVRecordId, {
      visitKey: correctionVisitKey,
      sandataStatus: 'rejected',
      sandataRejectedReason: rejectionReasons,
    });
  }

  /**
   * Log transaction to database
   */
  private async logTransaction(transaction: {
    transactionType: string;
    originalEVVRecordId: string;
    correctedEVVRecordId?: string;
    correctionVersion?: number;
    requestPayload: any;
    responsePayload: any;
    status: string;
    httpStatusCode?: number;
    transactionId?: string | undefined;
  }): Promise<void> {
    // Get organization ID from EVV record
    const evvRecord = await this.repository.getEVVRecord(transaction.originalEVVRecordId);
    const organizationId = evvRecord?.organization_id || '';

    await this.repository.createTransaction({
      transactionType: transaction.transactionType,
      transactionId: transaction.transactionId,
      requestPayload: transaction.requestPayload,
      responsePayload: transaction.responsePayload,
      httpStatusCode: transaction.httpStatusCode,
      status: transaction.status,
      evvRecordId: transaction.originalEVVRecordId,
      organizationId: organizationId,
    });
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
let correctionsServiceInstance: SandataCorrectionsService | null = null;

/**
 * Get Sandata Corrections Service singleton
 */
export function getSandataCorrectionsService(): SandataCorrectionsService {
  if (!correctionsServiceInstance) {
    correctionsServiceInstance = new SandataCorrectionsService();
  }
  return correctionsServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetSandataCorrectionsService(): void {
  correctionsServiceInstance = null;
}

export default SandataCorrectionsService;
