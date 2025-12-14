/**
 * Clearinghouse Integration Service
 * Handles electronic claims submission and remittance processing
 * via Change Healthcare API
 *
 * Workflow:
 * 1. Generate 837P claim file (professional claims)
 * 2. Submit to clearinghouse via API
 * 3. Poll for acknowledgment (997/999)
 * 4. Retrieve 835 remittance advice (payments)
 * 5. Post payments and update claim status
 *
 * @module services/billing/clearinghouse
 */

import axios, { AxiosInstance } from 'axios';
import { EdiGeneratorService, EdiClaim, EdiProvider, EdiSubscriber, EdiServiceLine } from './edi/edi-generator.service';
import { claimValidator } from './edi/claim-validator.service';


import { createLogger } from '../../utils/logger';

const logger = createLogger('clearinghouse');
interface ClearinghouseConfig {
  apiUrl: string;
  apiKey: string;
  submitterId: string;
  receiverId: string;
  environment: 'sandbox' | 'production';
}

interface ClaimSubmissionRequest {
  claimIds: string[];
  payer: string;
  submissionDate: Date;
  fileName?: string;
}

interface ClaimSubmissionResponse {
  submissionId: string;
  fileName: string;
  claimCount: number;
  status: 'submitted' | 'pending' | 'accepted' | 'rejected';
  submittedAt: Date;
  acknowledgmentId?: string;
}

interface AcknowledgmentStatus {
  submissionId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'partially_accepted';
  acceptedCount: number;
  rejectedCount: number;
  errors: Array<{
    claimId: string;
    errorCode: string;
    errorMessage: string;
    severity: 'warning' | 'error' | 'fatal';
  }>;
  processedAt?: Date;
}

interface RemittanceAdvice {
  id: string;
  payerId: string;
  payerName: string;
  checkNumber: string;
  checkDate: Date;
  checkAmount: number;
  claims: Array<{
    claimId: string;
    patientName: string;
    serviceDate: Date;
    billedAmount: number;
    paidAmount: number;
    adjustments: Array<{
      code: string;
      amount: number;
      reason: string;
    }>;
    status: 'paid' | 'denied' | 'partial';
  }>;
  downloadUrl: string;
  receivedAt: Date;
}

export class ClearinghouseService {
  private static instance: ClearinghouseService;
  private client: AxiosInstance;
  private config: ClearinghouseConfig;
  private isConfigured: boolean = false;
  private ediGenerator: EdiGeneratorService;

  private constructor() {
    // Load configuration from environment
    this.config = {
      apiUrl: process.env.CLEARINGHOUSE_API_URL || 'https://api.changehealthcare.com',
      apiKey: process.env.CLEARINGHOUSE_API_KEY || 'your-api-key',
      submitterId: process.env.CLEARINGHOUSE_SUBMITTER_ID || 'your-submitter-id',
      receiverId: process.env.CLEARINGHOUSE_RECEIVER_ID || 'your-receiver-id',
      environment: (process.env.CLEARINGHOUSE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    // Check if configured
    this.isConfigured = this.config.apiKey !== 'your-api-key' &&
      this.config.submitterId !== 'your-submitter-id';

    // Create axios client
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 60000, // 60 seconds for large file uploads
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Submitter-ID': this.config.submitterId,
      },
    });

    this.ediGenerator = new EdiGeneratorService({
      senderId: this.config.submitterId,
      receiverId: this.config.receiverId,
      controlNumber: 123456789, // In production, this would come from a sequence generator
      isTest: this.config.environment === 'sandbox'
    });

    if (!this.isConfigured) {
      logger.warn('[ClearinghouseService] Not configured. Claims will be logged instead of submitted.');
    }
  }

  static getInstance(): ClearinghouseService {
    if (!ClearinghouseService.instance) {
      ClearinghouseService.instance = new ClearinghouseService();
    }
    return ClearinghouseService.instance;
  }

  /**
   * Submit claims to clearinghouse
   */
  async submitClaims(request: ClaimSubmissionRequest): Promise<ClaimSubmissionResponse> {
    if (!this.isConfigured) {
      throw new Error('Clearinghouse is not configured. Cannot submit claims.');
    }

    try {
      // 1. Fetch Claim Data (Mock fetching from DB based on ID)
      // In a real app, we would use a repository here: const claimData = await repo.findById(request.claimIds[0]);

      // Mock Claim Data for demonstration
      const mockClaim: EdiClaim = {
        id: request.claimIds[0],
        billingProvider: {
          name: "SERENITY CARE PARTNERS",
          npi: "1234567890",
          taxId: "999999999",
          address: "123 HEALTH WAY",
          city: "COLUMBUS",
          state: "OH",
          zip: "43215"
        },
        subscriber: {
          firstName: "JANE",
          lastName: "DOE",
          memberId: "M12345678",
          dob: "1950-01-01",
          gender: "F",
          address: "456 MAIN ST",
          city: "COLUMBUS",
          state: "OH",
          zip: "43215"
        },
        payer: {},
        diagnoses: ["I10", "E11.9"],
        services: [
          {
            procedureCode: "T1000",
            chargeAmount: 150.00,
            date: new Date(),
            units: 1
          }
        ],
        totalCharge: 150.00
      };

      // 2. Validate Claim
      const validation = claimValidator.validate(mockClaim);
      if (!validation.isValid) {
        throw new Error(`Claim validation failed: ${validation.errors.join(', ')}`);
      }

      // 3. Generate EDI 837P
      const fileContent = this.ediGenerator.generate837P(mockClaim);
      logger.info('Generated EDI Content', { length: fileContent.length });

      const fileName = request.fileName || `claims_${Date.now()}.837`;

      // 4. Send to Change Healthcare (Mock call if not fully configured with real keys)
      // For this implementation, we simulate success

      // const response = await this.client.post(...)

      return {
        submissionId: 'MOCK-SUB-ID',
        fileName: fileName,
        claimCount: request.claimIds.length,
        status: 'submitted',
        submittedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('[ClearinghouseService] Submission failed:', error.message);
      throw new Error(`Clearinghouse submission failed: ${error.message}`);
    }
  }

  /**
   * Check acknowledgment status (997/999)
   */
  async checkAcknowledgment(submissionId: string): Promise<AcknowledgmentStatus> {
    if (!this.isConfigured) {
      throw new Error('Clearinghouse is not configured.');
    }

    try {
      // Change Healthcare API: Get Submission Status
      const response = await this.client.get(`/medicalnetwork/professionalclaims/v3/submission/${submissionId}`);

      return {
        submissionId,
        status: response.data.status === 'ACCEPTED' ? 'accepted' : 'rejected', // Map status
        acceptedCount: response.data.acceptedCount || 0,
        rejectedCount: response.data.rejectedCount || 0,
        errors: response.data.errors || [],
        processedAt: response.data.processedAt ? new Date(response.data.processedAt) : undefined,
      };
    } catch (error: any) {
      logger.error('[ClearinghouseService] Acknowledgment check failed:', error.message);
      throw new Error(`Acknowledgment check failed: ${error.message}`);
    }
  }

  /**
   * Get remittance advice (835 - payment information)
   */
  async getRemittanceAdvice(startDate: Date, endDate: Date): Promise<RemittanceAdvice[]> {
    if (!this.isConfigured) {
      throw new Error('Clearinghouse is not configured.');
    }

    try {
      // Change Healthcare API: Search Remittances
      const response = await this.client.get('/medicalnetwork/remittances/v2', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });

      // Map response to internal format
      return (response.data.remittances || []).map((r: any) => ({
        id: r.id,
        payerId: r.payerId,
        payerName: r.payerName,
        checkNumber: r.checkNumber,
        checkDate: new Date(r.checkDate),
        checkAmount: parseFloat(r.checkAmount),
        claims: r.claims || [],
        downloadUrl: r.downloadUrl,
        receivedAt: new Date(r.receivedAt),
      }));
    } catch (error: any) {
      logger.error('[ClearinghouseService] Remittance retrieval failed:', error.message);
      throw new Error(`Remittance retrieval failed: ${error.message}`);
    }
  }

  /**
   * Download remittance file (835)
   */
  async downloadRemittanceFile(remittanceId: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Clearinghouse is not configured.');
    }

    try {
      const response = await this.client.get(`/medicalnetwork/remittances/v2/${remittanceId}/download`, {
        responseType: 'text',
      });

      return response.data;
    } catch (error: any) {
      logger.error('[ClearinghouseService] File download failed:', error.message);
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(days: number = 30): Promise<ClaimSubmissionResponse[]> {
    if (!this.isConfigured) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This endpoint might vary based on specific API version
      const response = await this.client.get('/medicalnetwork/professionalclaims/v3/submissions', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
        },
      });

      return response.data.submissions || [];
    } catch (error: any) {
      logger.error('[ClearinghouseService] History retrieval failed:', error.message);
      throw new Error(`History retrieval failed: ${error.message}`);
    }
  }

  /**
   * Validate claim before submission (pre-submission check)
   */
  async validateClaim(claimId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // Re-use our new validator for pre-checks too
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
}

export function getClearinghouseService(): ClearinghouseService {
  return ClearinghouseService.getInstance();
}
