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

    if (!this.isConfigured) {
      console.warn('[ClearinghouseService] Not configured. Claims will be logged instead of submitted.');
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
      return this.mockSubmitClaims(request);
    }

    try {
      // TODO: Get 837P file content from claims service
      // const claims837P = await generateClaims837P(request.claimIds);

      const fileName = request.fileName || `claims_${Date.now()}.837`;

      const response = await this.client.post('/claims/submit', {
        fileName,
        fileContent: '<mock-837P-content>', // Base64 encoded 837P file
        submitterId: this.config.submitterId,
        receiverId: this.config.receiverId,
        payer: request.payer,
        claimCount: request.claimIds.length,
      });

      return {
        submissionId: response.data.submissionId,
        fileName: response.data.fileName,
        claimCount: request.claimIds.length,
        status: 'submitted',
        submittedAt: new Date(),
      };
    } catch (error: any) {
      console.error('[ClearinghouseService] Submission failed:', error.message);
      throw new Error(`Clearinghouse submission failed: ${error.message}`);
    }
  }

  /**
   * Check acknowledgment status (997/999)
   */
  async checkAcknowledgment(submissionId: string): Promise<AcknowledgmentStatus> {
    if (!this.isConfigured) {
      return this.mockCheckAcknowledgment(submissionId);
    }

    try {
      const response = await this.client.get(`/claims/acknowledgment/${submissionId}`);

      return {
        submissionId,
        status: response.data.status,
        acceptedCount: response.data.acceptedCount,
        rejectedCount: response.data.rejectedCount,
        errors: response.data.errors || [],
        processedAt: response.data.processedAt ? new Date(response.data.processedAt) : undefined,
      };
    } catch (error: any) {
      console.error('[ClearinghouseService] Acknowledgment check failed:', error.message);
      throw new Error(`Acknowledgment check failed: ${error.message}`);
    }
  }

  /**
   * Get remittance advice (835 - payment information)
   */
  async getRemittanceAdvice(startDate: Date, endDate: Date): Promise<RemittanceAdvice[]> {
    if (!this.isConfigured) {
      return this.mockGetRemittanceAdvice();
    }

    try {
      const response = await this.client.get('/remittance/835', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });

      return response.data.remittances.map((r: any) => ({
        id: r.id,
        payerId: r.payerId,
        payerName: r.payerName,
        checkNumber: r.checkNumber,
        checkDate: new Date(r.checkDate),
        checkAmount: parseFloat(r.checkAmount),
        claims: r.claims.map((c: any) => ({
          claimId: c.claimId,
          patientName: c.patientName,
          serviceDate: new Date(c.serviceDate),
          billedAmount: parseFloat(c.billedAmount),
          paidAmount: parseFloat(c.paidAmount),
          adjustments: c.adjustments || [],
          status: c.status,
        })),
        downloadUrl: r.downloadUrl,
        receivedAt: new Date(r.receivedAt),
      }));
    } catch (error: any) {
      console.error('[ClearinghouseService] Remittance retrieval failed:', error.message);
      throw new Error(`Remittance retrieval failed: ${error.message}`);
    }
  }

  /**
   * Download remittance file (835)
   */
  async downloadRemittanceFile(remittanceId: string): Promise<string> {
    if (!this.isConfigured) {
      return this.mockDownloadRemittanceFile(remittanceId);
    }

    try {
      const response = await this.client.get(`/remittance/835/${remittanceId}/download`, {
        responseType: 'text',
      });

      return response.data;
    } catch (error: any) {
      console.error('[ClearinghouseService] File download failed:', error.message);
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(days: number = 30): Promise<ClaimSubmissionResponse[]> {
    if (!this.isConfigured) {
      return this.mockGetSubmissionHistory();
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.get('/claims/submissions', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
        },
      });

      return response.data.submissions;
    } catch (error: any) {
      console.error('[ClearinghouseService] History retrieval failed:', error.message);
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
    // TODO: Implement pre-submission validation
    // - Check required fields
    // - Validate NPI numbers
    // - Check diagnosis codes
    // - Verify service dates
    // - Check units and modifiers

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  // ========================================
  // MOCK METHODS (for development)
  // ========================================

  private mockSubmitClaims(request: ClaimSubmissionRequest): ClaimSubmissionResponse {
    const submissionId = `SUB-${Date.now()}`;
    const fileName = request.fileName || `claims_${Date.now()}.837`;

    console.log('\n========== CLEARINGHOUSE SUBMISSION (DEV MODE) ==========');
    console.log('Submission ID:', submissionId);
    console.log('File Name:', fileName);
    console.log('Claim Count:', request.claimIds.length);
    console.log('Payer:', request.payer);
    console.log('Claims:', request.claimIds.join(', '));
    console.log('='.repeat(60) + '\n');

    return {
      submissionId,
      fileName,
      claimCount: request.claimIds.length,
      status: 'submitted',
      submittedAt: new Date(),
    };
  }

  private mockCheckAcknowledgment(submissionId: string): AcknowledgmentStatus {
    console.log(`[ClearinghouseService] Mock acknowledgment check for ${submissionId}`);

    return {
      submissionId,
      status: 'accepted',
      acceptedCount: 10,
      rejectedCount: 0,
      errors: [],
      processedAt: new Date(),
    };
  }

  private mockGetRemittanceAdvice(): RemittanceAdvice[] {
    console.log('[ClearinghouseService] Mock remittance advice retrieval');

    return [
      {
        id: 'REM-001',
        payerId: 'BCBS-OH',
        payerName: 'Blue Cross Blue Shield Ohio',
        checkNumber: 'CHK-123456',
        checkDate: new Date(),
        checkAmount: 1250.00,
        claims: [
          {
            claimId: 'CLM-001',
            patientName: 'Margaret Johnson',
            serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            billedAmount: 500.00,
            paidAmount: 425.00,
            adjustments: [
              {
                code: 'CO-45',
                amount: 75.00,
                reason: 'Charge exceeds fee schedule',
              },
            ],
            status: 'paid',
          },
          {
            claimId: 'CLM-002',
            patientName: 'Robert Smith',
            serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            billedAmount: 450.00,
            paidAmount: 450.00,
            adjustments: [],
            status: 'paid',
          },
        ],
        downloadUrl: 'https://mock-clearinghouse.com/download/REM-001',
        receivedAt: new Date(),
      },
    ];
  }

  private mockDownloadRemittanceFile(remittanceId: string): string {
    console.log(`[ClearinghouseService] Mock file download for ${remittanceId}`);

    return `ISA*00*          *00*          *ZZ*CHANGEH        *ZZ*SUBMITTER      *${new Date().toISOString().split('T')[0]}*1234*^*00501*000000001*0*P*:~
GS*HP*CHANGEH*SUBMITTER*${new Date().toISOString().split('T')[0]}*1234*1*X*005010X221A1~
ST*835*0001*005010X221A1~
[835 remittance advice content would go here]
SE*10*0001~
GE*1*1~
IEA*1*000000001~`;
  }

  private mockGetSubmissionHistory(): ClaimSubmissionResponse[] {
    return [
      {
        submissionId: 'SUB-001',
        fileName: 'claims_20251103.837',
        claimCount: 10,
        status: 'accepted',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        acknowledgmentId: 'ACK-001',
      },
      {
        submissionId: 'SUB-002',
        fileName: 'claims_20251102.837',
        claimCount: 8,
        status: 'accepted',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        acknowledgmentId: 'ACK-002',
      },
    ];
  }
}

export function getClearinghouseService(): ClearinghouseService {
  return ClearinghouseService.getInstance();
}
