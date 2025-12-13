// Claims Service - Manages claims submission and tracking

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
    // Mock data
    const claims: Claim[] = [
      {
        id: '1',
        claimNumber: 'CLM-2024-00142',
        clientId: 'c1',
        clientName: 'Dorothy Williams',
        dateOfService: '2024-03-08',
        serviceType: 'Personal Care',
        serviceCode: 'T1019',
        units: 16,
        unitRate: 7.24,
        totalAmount: 115.84,
        payerId: 'p1',
        payerName: 'Ohio Medicaid - PASSPORT',
        payerType: 'medicaid',
        status: 'ready_to_submit',
        createdAt: '2024-03-09',
        caregiverId: 'cg1',
        caregiverName: 'Maria Garcia',
        evvRecordId: 'evv-123',
        authorizationNumber: 'AUTH-2024-001'
      },
      {
        id: '2',
        claimNumber: 'CLM-2024-00141',
        clientId: 'c2',
        clientName: 'Robert Thompson',
        dateOfService: '2024-03-07',
        serviceType: 'Personal Care',
        serviceCode: 'T1019',
        units: 12,
        unitRate: 7.24,
        totalAmount: 86.88,
        payerId: 'p1',
        payerName: 'Ohio Medicaid - PASSPORT',
        payerType: 'medicaid',
        status: 'submitted',
        createdAt: '2024-03-08',
        submittedAt: '2024-03-09',
        caregiverId: 'cg2',
        caregiverName: 'James Wilson',
        evvRecordId: 'evv-124',
        authorizationNumber: 'AUTH-2024-002'
      },
      {
        id: '3',
        claimNumber: 'CLM-2024-00140',
        clientId: 'c3',
        clientName: 'Helen Martinez',
        dateOfService: '2024-03-05',
        serviceType: 'Homemaker',
        serviceCode: 'S5130',
        units: 8,
        unitRate: 6.50,
        totalAmount: 52.00,
        payerId: 'p1',
        payerName: 'Ohio Medicaid - PASSPORT',
        payerType: 'medicaid',
        status: 'paid',
        createdAt: '2024-03-06',
        submittedAt: '2024-03-07',
        paidAt: '2024-03-12',
        paidAmount: 52.00,
        caregiverId: 'cg1',
        caregiverName: 'Maria Garcia',
        evvRecordId: 'evv-125'
      },
      {
        id: '4',
        claimNumber: 'CLM-2024-00139',
        clientId: 'c1',
        clientName: 'Dorothy Williams',
        dateOfService: '2024-03-04',
        serviceType: 'Personal Care',
        serviceCode: 'T1019',
        units: 16,
        unitRate: 7.24,
        totalAmount: 115.84,
        payerId: 'p1',
        payerName: 'Ohio Medicaid - PASSPORT',
        payerType: 'medicaid',
        status: 'denied',
        createdAt: '2024-03-05',
        submittedAt: '2024-03-06',
        denialReason: 'Authorization expired',
        denialCode: 'CO-197',
        caregiverId: 'cg1',
        caregiverName: 'Maria Garcia',
        evvRecordId: 'evv-126',
        authorizationNumber: 'AUTH-2023-089'
      },
      {
        id: '5',
        claimNumber: 'CLM-2024-00138',
        clientId: 'c4',
        clientName: 'James Brown',
        dateOfService: '2024-03-03',
        serviceType: 'Respite',
        serviceCode: 'S5150',
        units: 32,
        unitRate: 7.15,
        totalAmount: 228.80,
        payerId: 'p2',
        payerName: 'DODD - Individual Options',
        payerType: 'medicaid',
        status: 'pending_correction',
        createdAt: '2024-03-04',
        validationErrors: ['Missing EVV out-punch', 'Service exceeds authorized hours'],
        caregiverId: 'cg3',
        caregiverName: 'Sarah Davis',
        authorizationNumber: 'DODD-AUTH-123'
      },
      {
        id: '6',
        claimNumber: 'CLM-2024-00137',
        clientId: 'c5',
        clientName: 'Margaret Johnson',
        dateOfService: '2024-03-01',
        serviceType: 'Personal Care',
        serviceCode: 'T1019',
        units: 20,
        unitRate: 35.00,
        totalAmount: 700.00,
        payerId: 'p3',
        payerName: 'Private Pay',
        payerType: 'private_pay',
        status: 'draft',
        createdAt: '2024-03-02',
        caregiverId: 'cg2',
        caregiverName: 'James Wilson'
      }
    ];

    const stats: ClaimStats = {
      totalClaims: claims.length,
      totalAmount: claims.reduce((sum, c) => sum + c.totalAmount, 0),
      byStatus: {
        draft: { count: 1, amount: 700.00 },
        ready_to_submit: { count: 1, amount: 115.84 },
        submitted: { count: 1, amount: 86.88 },
        accepted: { count: 0, amount: 0 },
        rejected: { count: 0, amount: 0 },
        paid: { count: 1, amount: 52.00 },
        denied: { count: 1, amount: 115.84 },
        pending_correction: { count: 1, amount: 228.80 },
        appealed: { count: 0, amount: 0 }
      },
      byPayer: [
        { payerName: 'Ohio Medicaid - PASSPORT', count: 4, amount: 370.56, paidAmount: 52.00 },
        { payerName: 'DODD - Individual Options', count: 1, amount: 228.80, paidAmount: 0 },
        { payerName: 'Private Pay', count: 1, amount: 700.00, paidAmount: 0 }
      ],
      denialRate: 16.7,
      avgDaysToPayment: 5.5,
      cleanClaimRate: 83.3
    };

    return { claims, stats };
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
    // Mock - would call backend
    return claimIds.map(id => ({
      claimId: id,
      result: { isValid: true, errors: [], warnings: [] }
    }));
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
    return [
      {
        id: 'b1',
        batchNumber: 'BATCH-2024-003',
        payerId: 'p1',
        payerName: 'Ohio Medicaid - PASSPORT',
        claimCount: 12,
        totalAmount: 1450.88,
        status: 'completed',
        submittedAt: '2024-03-10',
        acknowledgedAt: '2024-03-10',
        claims: [],
        fileType: '837P'
      },
      {
        id: 'b2',
        batchNumber: 'BATCH-2024-002',
        payerId: 'p1',
        payerName: 'Ohio Medicaid - PASSPORT',
        claimCount: 8,
        totalAmount: 892.64,
        status: 'processing',
        submittedAt: '2024-03-08',
        acknowledgedAt: '2024-03-08',
        claims: [],
        fileType: '837P'
      },
      {
        id: 'b3',
        batchNumber: 'BATCH-2024-001',
        payerId: 'p2',
        payerName: 'DODD - Individual Options',
        claimCount: 5,
        totalAmount: 1125.50,
        status: 'submitted',
        submittedAt: '2024-03-12',
        claims: [],
        fileType: '837P'
      }
    ];
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
