import { randomUUID } from 'crypto';

export interface Claim {
  id: string;
  visitId?: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  caregiverName: string;
  serviceDate: string;
  serviceType: string;
  hours: number;
  units: number;
  chargeAmount: number;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'paid';
  submittedDate?: string;
  paidDate?: string;
  rejectionReason?: string;
  clearinghouseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Denial {
  id: string;
  claimId: string;
  patientName: string;
  serviceDate: string;
  denialReason: string;
  denialCode: string;
  amount: number;
  appealStatus: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  appealSubmittedDate?: string;
  appealNotes?: string;
  attachments?: string[];
  createdAt: string;
}

export interface ARRecord {
  id: string;
  patientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  daysOutstanding: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
  status: 'current' | 'overdue' | 'collections';
}

const serviceTypes = ['Personal Care', 'Companionship', 'Homemaking', 'Respite Care', 'Skilled Nursing'];
const denialReasons = [
  'Missing documentation',
  'Service not covered',
  'Invalid authorization',
  'Duplicate claim',
  'Invalid diagnosis code',
  'EVV data missing'
];
const denialCodes = ['CO-16', 'CO-18', 'CO-22', 'CO-50', 'CO-97', 'CO-167'];

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const billingFixtures = {
  // Generate single claim
  generateClaim: (overrides?: Partial<Claim>): Claim => {
    const serviceDate = addDays(new Date(), -Math.floor(Math.random() * 30));
    const hours = Math.floor(Math.random() * 8) + 1;
    const rate = 25.00;

    return {
      id: randomUUID(),
      patientId: randomUUID(),
      patientName: 'Mary Client',
      caregiverId: randomUUID(),
      caregiverName: 'Maria Garcia',
      serviceDate: serviceDate.toISOString().split('T')[0],
      serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      hours,
      units: hours * 4, // 15-minute units
      chargeAmount: hours * rate,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  // Predefined claims
  draftClaim: (): Claim => billingFixtures.generateClaim({ status: 'draft' }),

  submittedClaim: (): Claim => billingFixtures.generateClaim({
    status: 'submitted',
    submittedDate: new Date().toISOString(),
    clearinghouseId: `CLH-${Math.random().toString().slice(2, 11)}`
  }),

  acceptedClaim: (): Claim => billingFixtures.generateClaim({
    status: 'accepted',
    submittedDate: addDays(new Date(), -10).toISOString()
  }),

  paidClaim: (): Claim => billingFixtures.generateClaim({
    status: 'paid',
    submittedDate: addDays(new Date(), -30).toISOString(),
    paidDate: addDays(new Date(), -5).toISOString()
  }),

  rejectedClaim: (): Claim => billingFixtures.generateClaim({
    status: 'rejected',
    submittedDate: addDays(new Date(), -15).toISOString(),
    rejectionReason: 'Missing EVV documentation'
  }),

  // Generate denial
  generateDenial: (overrides?: Partial<Denial>): Denial => ({
    id: randomUUID(),
    claimId: randomUUID(),
    patientName: 'Mary Client',
    serviceDate: addDays(new Date(), -20).toISOString().split('T')[0],
    denialReason: denialReasons[Math.floor(Math.random() * denialReasons.length)],
    denialCode: denialCodes[Math.floor(Math.random() * denialCodes.length)],
    amount: 100 + Math.floor(Math.random() * 400),
    appealStatus: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  pendingDenial: (): Denial => billingFixtures.generateDenial({ appealStatus: 'pending' }),

  appealedDenial: (): Denial => billingFixtures.generateDenial({
    appealStatus: 'submitted',
    appealSubmittedDate: new Date().toISOString(),
    appealNotes: 'Documentation was submitted with original claim',
    attachments: ['supporting-doc.pdf']
  }),

  // Generate AR record
  generateARRecord: (overrides?: Partial<ARRecord>): ARRecord => {
    const daysOutstanding = Math.floor(Math.random() * 120);
    const amount = 500 + Math.floor(Math.random() * 2000);
    const amountPaid = Math.random() > 0.5 ? Math.floor(amount * (Math.random() * 0.5)) : 0;

    return {
      id: randomUUID(),
      patientName: 'Mary Client',
      invoiceNumber: `INV-${Math.random().toString().slice(2, 9)}`,
      invoiceDate: addDays(new Date(), -daysOutstanding).toISOString().split('T')[0],
      amount,
      amountPaid,
      amountDue: amount - amountPaid,
      daysOutstanding,
      agingBucket: daysOutstanding <= 30 ? '0-30' :
                   daysOutstanding <= 60 ? '31-60' :
                   daysOutstanding <= 90 ? '61-90' : '90+',
      status: daysOutstanding <= 30 ? 'current' :
              daysOutstanding <= 90 ? 'overdue' : 'collections',
      ...overrides
    };
  },

  currentAR: (): ARRecord => billingFixtures.generateARRecord({
    daysOutstanding: 15,
    agingBucket: '0-30',
    status: 'current'
  }),

  overdueAR: (): ARRecord => billingFixtures.generateARRecord({
    daysOutstanding: 65,
    agingBucket: '61-90',
    status: 'overdue'
  }),

  collectionsAR: (): ARRecord => billingFixtures.generateARRecord({
    daysOutstanding: 120,
    agingBucket: '90+',
    status: 'collections'
  }),

  // API Response generators
  getClaimsResponse: (params?: { status?: string; patientId?: string; startDate?: string; endDate?: string }) => {
    let claims: Claim[] = [
      ...Array.from({ length: 5 }, () => billingFixtures.draftClaim()),
      ...Array.from({ length: 3 }, () => billingFixtures.submittedClaim()),
      billingFixtures.acceptedClaim(),
      billingFixtures.rejectedClaim()
    ];

    if (params?.status) {
      claims = claims.filter(c => c.status === params.status);
    }

    if (params?.patientId) {
      claims = claims.filter(c => c.patientId === params.patientId);
    }

    return {
      success: true,
      claims,
      total: claims.length
    };
  },

  generateClaimFromVisitResponse: (visitId: string): { success: boolean; claim: Claim } => ({
    success: true,
    claim: billingFixtures.generateClaim({ visitId, status: 'draft' })
  }),

  submitClaimResponse: (claimId: string): { success: boolean; claim: Claim; message: string } => ({
    success: true,
    claim: billingFixtures.submittedClaim(),
    message: 'Claim submitted to clearinghouse successfully'
  }),

  submitBatchClaimsResponse: (claimIds: string[]): { success: boolean; submitted: number; message: string } => ({
    success: true,
    submitted: claimIds.length,
    message: `${claimIds.length} claims submitted successfully`
  }),

  // Denial responses
  getDenialsResponse: (params?: { appealStatus?: string }) => {
    let denials: Denial[] = [
      ...Array.from({ length: 3 }, () => billingFixtures.pendingDenial()),
      billingFixtures.appealedDenial()
    ];

    if (params?.appealStatus) {
      denials = denials.filter(d => d.appealStatus === params.appealStatus);
    }

    return {
      success: true,
      denials,
      total: denials.length
    };
  },

  initiateAppealResponse: (denialId: string, appealData: any): { success: boolean; denial: Denial } => ({
    success: true,
    denial: billingFixtures.appealedDenial()
  }),

  // AR responses
  getARAgingResponse: () => {
    const records: ARRecord[] = [
      ...Array.from({ length: 10 }, () => billingFixtures.currentAR()),
      ...Array.from({ length: 5 }, () => billingFixtures.overdueAR()),
      ...Array.from({ length: 3 }, () => billingFixtures.collectionsAR())
    ];

    return {
      success: true,
      records,
      summary: {
        '0-30': records.filter(r => r.agingBucket === '0-30').reduce((sum, r) => sum + r.amountDue, 0),
        '31-60': records.filter(r => r.agingBucket === '31-60').reduce((sum, r) => sum + r.amountDue, 0),
        '61-90': records.filter(r => r.agingBucket === '61-90').reduce((sum, r) => sum + r.amountDue, 0),
        '90+': records.filter(r => r.agingBucket === '90+').reduce((sum, r) => sum + r.amountDue, 0)
      }
    };
  },

  // Error responses
  missingEVVError: {
    error: 'Missing EVV',
    message: 'Cannot submit claim without EVV documentation'
  },

  invalidClaimError: {
    error: 'Invalid claim',
    message: 'Claim validation failed'
  }
};
