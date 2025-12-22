// Claims Service - Manages claims submission and tracking

import { shouldUseMockData } from '../config/environment';

export type ClaimStatus =
  | 'draft'
  | 'ready_to_submit'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'denied'
  | 'pending_correction'
  | 'appealed';

export type PayerType =
  | 'medicaid'
  | 'medicare'
  | 'private_insurance'
  | 'private_pay'
  | 'managed_care';

export interface Claim {
  id: string;
  claimNumber: string;
  clientId: string;
  clientName: string;
  dateOfService: string;
  serviceType: string;
  serviceCode: string;
  units: number;
  unitRate: number;
  totalAmount: number;
  payerId: string;
  payerName: string;
  payerType: PayerType;
  status: ClaimStatus;
  createdAt: string;
  submittedAt?: string;
  paidAt?: string;
  paidAmount?: number;
  adjustmentReason?: string;
  denialReason?: string;
  denialCode?: string;
  caregiverId: string;
  caregiverName: string;
  evvRecordId?: string;
  authorizationNumber?: string;
  notes?: string;
  validationErrors?: string[];
  validationWarnings?: string[];
}

export interface ClaimBatch {
  id: string;
  batchNumber: string;
  payerId: string;
  payerName: string;
  claimCount: number;
  totalAmount: number;
  status: 'pending' | 'submitted' | 'acknowledged' | 'processing' | 'completed' | 'rejected';
  submittedAt?: string;
  acknowledgedAt?: string;
  claims: Claim[];
  fileType: '837P' | '837I' | 'CMS1500';
}

export interface ClaimStats {
  totalClaims: number;
  totalAmount: number;
  byStatus: Record<ClaimStatus, { count: number; amount: number }>;
  byPayer: { payerName: string; count: number; amount: number; paidAmount: number }[];
  denialRate: number;
  avgDaysToPayment: number;
  cleanClaimRate: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { code: string; message: string; field?: string }[];
  warnings: { code: string; message: string; field?: string }[];
}

export interface DenialReason {
  code: string;
  description: string;
  category: 'eligibility' | 'authorization' | 'documentation' | 'coding' | 'timing' | 'duplicate' | 'other';
  suggestedAction: string;
}

const API_BASE = '/api/v1';

// Common denial reasons per Ohio Medicaid
const DENIAL_REASONS: DenialReason[] = [
  { code: 'CO-4', description: 'The procedure code is inconsistent with the modifier', category: 'coding', suggestedAction: 'Review modifier usage and correct' },
  { code: 'CO-16', description: 'Claim lacks information needed for adjudication', category: 'documentation', suggestedAction: 'Add missing documentation' },
  { code: 'CO-18', description: 'Duplicate claim/service', category: 'duplicate', suggestedAction: 'Verify if duplicate or appeal' },
  { code: 'CO-27', description: 'Expenses incurred after coverage terminated', category: 'eligibility', suggestedAction: 'Verify eligibility dates' },
  { code: 'CO-29', description: 'Time limit for filing has expired', category: 'timing', suggestedAction: 'File appeal with justification' },
  { code: 'CO-50', description: 'Non-covered service', category: 'authorization', suggestedAction: 'Obtain prior authorization' },
  { code: 'CO-96', description: 'Non-covered charge(s)', category: 'authorization', suggestedAction: 'Review service coverage' },
  { code: 'CO-97', description: 'The benefit for this service is included in the payment for another service', category: 'coding', suggestedAction: 'Review bundling rules' },
  { code: 'CO-197', description: 'Precertification/authorization/notification absent', category: 'authorization', suggestedAction: 'Obtain retro-auth if possible' },
  { code: 'PR-1', description: 'Deductible amount', category: 'other', suggestedAction: 'Bill patient for deductible' },
  { code: 'PR-2', description: 'Coinsurance amount', category: 'other', suggestedAction: 'Bill patient for coinsurance' }
];

class ClaimsService {
  // Get claims with filtering
  async getClaims(filters?: {
    status?: ClaimStatus;
    payerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ claims: Claim[]; stats: ClaimStats }> {
    return {
      claims: [],
      stats: {
        totalClaims: 0,
        totalAmount: 0,
        byStatus: {
          draft: { count: 0, amount: 0 },
          ready_to_submit: { count: 0, amount: 0 },
          submitted: { count: 0, amount: 0 },
          accepted: { count: 0, amount: 0 },
          rejected: { count: 0, amount: 0 },
          paid: { count: 0, amount: 0 },
          denied: { count: 0, amount: 0 },
          pending_correction: { count: 0, amount: 0 },
          appealed: { count: 0, amount: 0 }
        },
        byPayer: [],
        denialRate: 0,
        avgDaysToPayment: 0,
        cleanClaimRate: 0
      }
    };
  }

  // Validate claim before submission
  async validateClaim(claim: Claim): Promise<ValidationResult> {
    const errors: { code: string; message: string; field?: string }[] = [];
    const warnings: { code: string; message: string; field?: string }[] = [];

    // Required field validation
    if (!claim.clientId) {
      errors.push({ code: 'REQ-001', message: 'Client is required', field: 'clientId' });
    }
    if (!claim.dateOfService) {
      errors.push({ code: 'REQ-002', message: 'Date of service is required', field: 'dateOfService' });
    }
    if (!claim.serviceCode) {
      errors.push({ code: 'REQ-003', message: 'Service code is required', field: 'serviceCode' });
    }
    if (claim.units <= 0) {
      errors.push({ code: 'REQ-004', message: 'Units must be greater than 0', field: 'units' });
    }

    // EVV validation for Medicaid
    if (claim.payerType === 'medicaid' && !claim.evvRecordId) {
      errors.push({ code: 'EVV-001', message: 'EVV record is required for Medicaid claims', field: 'evvRecordId' });
    }

    // Authorization validation
    if (claim.payerType === 'medicaid' && !claim.authorizationNumber) {
      warnings.push({ code: 'AUTH-001', message: 'Authorization number recommended for faster processing', field: 'authorizationNumber' });
    }

    // Date validation
    const serviceDate = new Date(claim.dateOfService);
    const today = new Date();
    const daysSinceService = Math.floor((today.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceService > 365) {
      errors.push({ code: 'DATE-001', message: 'Service date exceeds timely filing limit (365 days)', field: 'dateOfService' });
    } else if (daysSinceService > 300) {
      warnings.push({ code: 'DATE-002', message: 'Approaching timely filing deadline', field: 'dateOfService' });
    }

    if (serviceDate > today) {
      errors.push({ code: 'DATE-003', message: 'Service date cannot be in the future', field: 'dateOfService' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Batch validate claims
  async validateBatch(claimIds: string[]): Promise<{ claimId: string; result: ValidationResult }[]> {
    return [];
  }

  // Submit single claim
  async submitClaim(claimId: string): Promise<{ success: boolean; message: string }> {
    console.log('Submitting claim:', claimId);
    return { success: true, message: 'Claim submitted successfully' };
  }

  // Submit batch of claims
  async submitBatch(claimIds: string[], payerId: string): Promise<{ batchId: string; success: boolean; message: string }> {
    console.log('Submitting batch:', claimIds, payerId);
    return { batchId: 'BATCH-2024-001', success: true, message: `Batch of ${claimIds.length} claims submitted` };
  }

  // Get claim batches
  async getBatches(): Promise<ClaimBatch[]> {
    return [];
  }

  // Get denial reasons
  getDenialReasons(): DenialReason[] {
    return DENIAL_REASONS;
  }

  // Correct and resubmit claim
  async correctClaim(claimId: string, corrections: Partial<Claim>): Promise<{ success: boolean; newClaimId: string }> {
    console.log('Correcting claim:', claimId, corrections);
    return { success: true, newClaimId: 'CLM-2024-00143' };
  }

  // Appeal denied claim
  async appealClaim(claimId: string, reason: string, supportingDocs?: string[]): Promise<{ success: boolean; appealId: string }> {
    console.log('Appealing claim:', claimId, reason);
    return { success: true, appealId: 'APL-2024-001' };
  }

  // Generate 837P file for batch
  async generate837P(batchId: string): Promise<{ fileUrl: string; fileName: string }> {
    console.log('Generating 837P for batch:', batchId);
    return { fileUrl: '/files/837p/batch.edi', fileName: '837P_BATCH_2024_001.edi' };
  }

  // Get payers
  getPayers(): { id: string; name: string; type: PayerType; submissionMethod: string }[] {
    return [
      { id: 'p1', name: 'Ohio Medicaid - PASSPORT', type: 'medicaid', submissionMethod: 'MITS Portal' },
      { id: 'p2', name: 'DODD - Individual Options', type: 'medicaid', submissionMethod: 'eMBS Portal' },
      { id: 'p3', name: 'Private Pay', type: 'private_pay', submissionMethod: 'Invoice' },
      { id: 'p4', name: 'MyCare Ohio - Aetna', type: 'managed_care', submissionMethod: 'EDI 837P' },
      { id: 'p5', name: 'MyCare Ohio - CareSource', type: 'managed_care', submissionMethod: 'EDI 837P' },
      { id: 'p6', name: 'MyCare Ohio - Molina', type: 'managed_care', submissionMethod: 'EDI 837P' }
    ];
  }

  // Get service codes
  getServiceCodes(): { code: string; description: string; defaultRate: number; unit: string }[] {
    return [
      { code: 'T1019', description: 'Personal Care - Agency', defaultRate: 7.24, unit: '15 min' },
      { code: 'T1019-UC', description: 'Personal Care - Consumer Directed', defaultRate: 3.44, unit: '15 min' },
      { code: 'S5130', description: 'Homemaker', defaultRate: 6.50, unit: '15 min' },
      { code: 'S5150', description: 'Respite Care (in-home)', defaultRate: 7.15, unit: '15 min' },
      { code: 'S5150-HQ', description: 'Respite Care (group)', defaultRate: 2.14, unit: '15 min' },
      { code: 'S0215', description: 'Home Care Attendant', defaultRate: 4.70, unit: '15 min' },
      { code: 'T2003', description: 'Non-Medical Transportation', defaultRate: 653.00, unit: 'trip' }
    ];
  }
}

export const claimsService = new ClaimsService();
export default claimsService;
