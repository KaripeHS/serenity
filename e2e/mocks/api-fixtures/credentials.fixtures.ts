import { randomUUID } from 'crypto';

export interface Credential {
  id: string;
  staffId: string;
  staffName: string;
  type: string;
  credentialType?: string;
  credentialNumber?: string;
  number?: string;
  issueDate: string;
  expirationDate: string;
  status: 'valid' | 'expiring' | 'expired';
  daysLeft?: number;
  daysExpired?: number;
  documentUrl?: string;
  verificationStatus?: 'verified' | 'pending' | 'failed';
}

export interface CredentialSummary {
  expired: number;
  expiring_7_days: number;
  expiring_15_days: number;
  expiring_30_days: number;
  total_active: number;
}

const credentialTypes = [
  'CPR',
  'First Aid',
  'CNA License',
  'RN License',
  'LPN License',
  'HHA Certification',
  'STNA Certification',
  'Background Check',
  'TB Test',
  'Drug Screen'
];

const addDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

export const credentialFixtures = {
  // Generate single credential
  generateCredential: (overrides?: Partial<Credential>): Credential => {
    const type = credentialTypes[Math.floor(Math.random() * credentialTypes.length)];
    const issueDate = addDays(new Date(), -365);
    const expirationDate = addDays(new Date(), Math.floor(Math.random() * 365));
    const daysLeft = Math.floor((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: randomUUID(),
      staffId: randomUUID(),
      staffName: 'Test Staff Member',
      type,
      credentialType: type,
      number: `${type.replace(/\s/g, '').toUpperCase()}-${Math.random().toString().slice(2, 9)}`,
      credentialNumber: `${type.replace(/\s/g, '').toUpperCase()}-${Math.random().toString().slice(2, 9)}`,
      issueDate,
      expirationDate,
      status: daysLeft < 0 ? 'expired' : daysLeft < 30 ? 'expiring' : 'valid',
      daysLeft: daysLeft > 0 ? daysLeft : undefined,
      daysExpired: daysLeft < 0 ? Math.abs(daysLeft) : undefined,
      documentUrl: `/documents/credentials/${randomUUID()}.pdf`,
      verificationStatus: 'verified',
      ...overrides
    };
  },

  // Predefined credential states
  validCredential: (staffId: string, staffName: string, type: string = 'CPR'): Credential =>
    credentialFixtures.generateCredential({
      staffId,
      staffName,
      type,
      credentialType: type,
      expirationDate: addDays(new Date(), 180),
      status: 'valid',
      daysLeft: 180
    }),

  expiringCredential: (staffId: string, staffName: string, type: string = 'CPR', daysLeft: number = 15): Credential =>
    credentialFixtures.generateCredential({
      staffId,
      staffName,
      type,
      credentialType: type,
      expirationDate: addDays(new Date(), daysLeft),
      status: 'expiring',
      daysLeft
    }),

  expiredCredential: (staffId: string, staffName: string, type: string = 'CPR', daysExpired: number = 10): Credential =>
    credentialFixtures.generateCredential({
      staffId,
      staffName,
      type,
      credentialType: type,
      expirationDate: addDays(new Date(), -daysExpired),
      status: 'expired',
      daysExpired
    }),

  // Generate lists
  validCredentials: (count: number = 10): Credential[] => {
    return Array.from({ length: count }, (_, i) =>
      credentialFixtures.validCredential(
        randomUUID(),
        `Staff Member ${i + 1}`,
        credentialTypes[i % credentialTypes.length]
      )
    );
  },

  expiringCredentials: (count: number = 5): Credential[] => {
    return Array.from({ length: count }, (_, i) => {
      const daysLeft = [7, 10, 15, 20, 25][i % 5];
      return credentialFixtures.expiringCredential(
        randomUUID(),
        `Staff Member ${i + 1}`,
        credentialTypes[i % credentialTypes.length],
        daysLeft
      );
    });
  },

  expiredCredentials: (count: number = 3): Credential[] => {
    return Array.from({ length: count }, (_, i) => {
      const daysExpired = [5, 15, 30][i % 3];
      return credentialFixtures.expiredCredential(
        randomUUID(),
        `Staff Member ${i + 1}`,
        credentialTypes[i % credentialTypes.length],
        daysExpired
      );
    });
  },

  // Credential summary
  credentialSummary: (): CredentialSummary => ({
    expired: 12,
    expiring_7_days: 8,
    expiring_15_days: 15,
    expiring_30_days: 23,
    total_active: 145
  }),

  // API Response generators
  getExpiringCredentialsResponse: (days: number = 30): { success: boolean; credentials: Credential[] } => ({
    success: true,
    credentials: days === 7
      ? credentialFixtures.expiringCredentials(3).filter(c => c.daysLeft! <= 7)
      : credentialFixtures.expiringCredentials(8)
  }),

  getExpiredCredentialsResponse: (): { success: boolean; credentials: Credential[] } => ({
    success: true,
    credentials: credentialFixtures.expiredCredentials(5)
  }),

  getCredentialSummaryResponse: (): { success: boolean; summary: CredentialSummary } => ({
    success: true,
    summary: credentialFixtures.credentialSummary()
  }),

  getCaregiverCredentialsResponse: (caregiverId: string): { success: boolean; credentials: Credential[] } => {
    const staffName = 'John Caregiver';
    return {
      success: true,
      credentials: [
        credentialFixtures.validCredential(caregiverId, staffName, 'CPR'),
        credentialFixtures.validCredential(caregiverId, staffName, 'First Aid'),
        credentialFixtures.expiringCredential(caregiverId, staffName, 'HHA Certification', 25),
        credentialFixtures.validCredential(caregiverId, staffName, 'Background Check')
      ]
    };
  },

  updateCredentialResponse: (credentialId: string, updates: Partial<Credential>): { success: boolean; credential: Credential } => ({
    success: true,
    credential: credentialFixtures.generateCredential({ id: credentialId, ...updates })
  }),

  renewCredentialResponse: (credentialId: string, newExpirationDate: string): { success: boolean; credential: Credential } => {
    const daysLeft = Math.floor((new Date(newExpirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return {
      success: true,
      credential: credentialFixtures.generateCredential({
        id: credentialId,
        expirationDate: newExpirationDate,
        status: 'valid',
        daysLeft
      })
    };
  },

  createCredentialResponse: (data: Partial<Credential>): { success: boolean; credential: Credential } => ({
    success: true,
    credential: credentialFixtures.generateCredential(data)
  }),

  deleteCredentialResponse: { success: true, message: 'Credential deleted successfully' },

  // Error responses
  validationError: (field: string) => ({
    error: 'Validation failed',
    message: `${field} is required`,
    details: { [field]: `${field} is required` }
  }),

  credentialNotFoundError: {
    error: 'Not found',
    message: 'Credential not found'
  },

  expiredCredentialError: {
    error: 'Expired credential',
    message: 'Cannot schedule caregiver with expired credentials'
  }
};
