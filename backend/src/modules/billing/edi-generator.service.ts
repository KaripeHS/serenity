/**
 * EDI 837P Claims File Generator
 *
 * Generates HIPAA-compliant 837P (Professional) claims files in X12 format
 * for submission to Medicaid clearinghouses.
 *
 * 837P Format Structure:
 * - ISA (Interchange Control Header)
 * - GS (Functional Group Header)
 * - ST (Transaction Set Header)
 * - BHT (Beginning of Hierarchical Transaction)
 * - NM1 loops (Submitter, Receiver, Provider, Subscriber, Patient)
 * - CLM (Claim Information)
 * - DTP (Date Time Period)
 * - HI (Health Care Diagnosis Code)
 * - LX (Service Line Number)
 * - SV1 (Professional Service)
 * - SE (Transaction Set Trailer)
 * - GE (Functional Group Trailer)
 * - IEA (Interchange Control Trailer)
 *
 * @module modules/billing/edi-generator
 */

export interface ClaimVisit {
  id: string;
  visitDate: Date;
  serviceCode: string;
  billableUnits: number;
  diagnosisCode?: string;
  authorizationNumber: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    medicaidNumber: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  caregiver: {
    id: string;
    firstName: string;
    lastName: string;
    npi?: string;
  };
  placeOfService: string; // '12' = home
}

export interface OrganizationInfo {
  name: string;
  npi: string;
  taxId: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  contactName: string;
  contactPhone: string;
}

export interface Clearinghouse {
  name: string;
  id: string;
  submissionId: string;
}

/**
 * EDI 837P Generator Service
 */
export class EDI837GeneratorService {
  private segmentDelimiter = '~';
  private elementDelimiter = '*';
  private subElementDelimiter = ':';

  /**
   * Generate 837P claims file
   */
  async generate837P(
    visits: ClaimVisit[],
    organization: OrganizationInfo,
    clearinghouse: Clearinghouse
  ): Promise<string> {
    const segments: string[] = [];
    const currentDate = new Date();
    const dateStr = this.formatDate(currentDate, 'YYMMDD');
    const timeStr = this.formatTime(currentDate);

    // Generate interchange control number (incremental)
    const interchangeControlNumber = this.padNumber(1, 9);
    const groupControlNumber = '1';

    // ISA - Interchange Control Header
    segments.push(this.generateISA(
      organization.taxId,
      clearinghouse.id,
      dateStr,
      timeStr,
      interchangeControlNumber
    ));

    // GS - Functional Group Header
    segments.push(this.generateGS(
      organization.taxId,
      clearinghouse.submissionId,
      dateStr,
      timeStr,
      groupControlNumber
    ));

    // Group claims by date for transaction sets
    const claimsByDate = this.groupClaimsByDate(visits);
    let transactionSetNumber = 1;

    for (const [date, dateVisits] of claimsByDate.entries()) {
      const transactionSegments = this.generateTransactionSet(
        dateVisits,
        organization,
        clearinghouse,
        transactionSetNumber.toString().padStart(4, '0'),
        dateStr,
        timeStr
      );
      segments.push(...transactionSegments);
      transactionSetNumber++;
    }

    // GE - Functional Group Trailer
    segments.push(`GE${this.elementDelimiter}${transactionSetNumber - 1}${this.elementDelimiter}${groupControlNumber}`);

    // IEA - Interchange Control Trailer
    segments.push(`IEA${this.elementDelimiter}1${this.elementDelimiter}${interchangeControlNumber}`);

    // Join all segments with segment delimiter and add final delimiter
    return segments.join(this.segmentDelimiter) + this.segmentDelimiter;
  }

  /**
   * Generate ISA segment (Interchange Control Header)
   */
  private generateISA(
    senderTaxId: string,
    receiverId: string,
    date: string,
    time: string,
    controlNumber: string
  ): string {
    const parts = [
      'ISA',
      '00',                    // Authorization Information Qualifier
      '          ',            // Authorization Information (10 spaces)
      '00',                    // Security Information Qualifier
      '          ',            // Security Information (10 spaces)
      'ZZ',                    // Sender ID Qualifier
      this.padRight(senderTaxId.substring(0, 15), 15),
      'ZZ',                    // Receiver ID Qualifier
      this.padRight(receiverId.substring(0, 15), 15),
      date,                    // Interchange Date
      time,                    // Interchange Time
      'U',                     // Standards ID
      '00401',                 // Version
      controlNumber,           // Interchange Control Number
      '0',                     // Acknowledgment Requested
      'P',                     // Usage Indicator (P=Production, T=Test)
      this.subElementDelimiter // Sub-element Delimiter
    ];

    return parts.join(this.elementDelimiter);
  }

  /**
   * Generate GS segment (Functional Group Header)
   */
  private generateGS(
    senderCode: string,
    receiverCode: string,
    date: string,
    time: string,
    controlNumber: string
  ): string {
    return [
      'GS',
      'HC',                    // Functional ID Code (HC = Health Care Claim)
      senderCode,              // Application Sender Code
      receiverCode,            // Application Receiver Code
      date,                    // Date
      time,                    // Time
      controlNumber,           // Group Control Number
      'X',                     // Responsible Agency Code
      '005010X222A1'           // Version/Release/Industry ID
    ].join(this.elementDelimiter);
  }

  /**
   * Generate complete transaction set for a batch of claims
   */
  private generateTransactionSet(
    visits: ClaimVisit[],
    organization: OrganizationInfo,
    clearinghouse: Clearinghouse,
    transactionSetNumber: string,
    date: string,
    time: string
  ): string[] {
    const segments: string[] = [];
    const segmentCount = { count: 0 };

    // ST - Transaction Set Header
    segments.push(this.generateST(transactionSetNumber));
    segmentCount.count++;

    // BHT - Beginning of Hierarchical Transaction
    segments.push(this.generateBHT(date, time));
    segmentCount.count++;

    // 1000A - Submitter Name
    segments.push(...this.generateSubmitter(organization));
    segmentCount.count += 2;

    // 1000B - Receiver Name
    segments.push(...this.generateReceiver(clearinghouse));
    segmentCount.count += 1;

    // 2000A - Billing Provider Hierarchical Level
    segments.push(...this.generateBillingProvider(organization));
    segmentCount.count += 4;

    // Process each claim
    let claimCount = 0;
    for (const visit of visits) {
      const claimSegments = this.generateClaim(visit, organization, claimCount + 1);
      segments.push(...claimSegments);
      segmentCount.count += claimSegments.length;
      claimCount++;
    }

    // SE - Transaction Set Trailer
    segments.push(`SE${this.elementDelimiter}${segmentCount.count + 1}${this.elementDelimiter}${transactionSetNumber}`);

    return segments;
  }

  /**
   * Generate ST segment (Transaction Set Header)
   */
  private generateST(transactionSetNumber: string): string {
    return `ST${this.elementDelimiter}837${this.elementDelimiter}${transactionSetNumber}${this.elementDelimiter}005010X222A1`;
  }

  /**
   * Generate BHT segment (Beginning of Hierarchical Transaction)
   */
  private generateBHT(date: string, time: string): string {
    const referenceNumber = `${date}${time}`;
    return [
      'BHT',
      '0019',                  // Hierarchical Structure Code
      '00',                    // Transaction Set Purpose Code
      referenceNumber,         // Reference Identification
      date,                    // Date
      time,                    // Time
      'CH'                     // Claim or Encounter Identifier
    ].join(this.elementDelimiter);
  }

  /**
   * Generate submitter segments (1000A loop)
   */
  private generateSubmitter(org: OrganizationInfo): string[] {
    return [
      // NM1 - Submitter Name
      [
        'NM1',
        '41',                  // Entity ID Code (41 = Submitter)
        '2',                   // Entity Type (2 = Non-Person)
        org.name,              // Name
        '',                    // First Name
        '',                    // Middle Name
        '',                    // Suffix
        '',                    // ID Code Qualifier
        '46',                  // ID Code
        org.taxId              // Tax ID
      ].join(this.elementDelimiter),

      // PER - Submitter Contact
      [
        'PER',
        'IC',                  // Contact Function Code
        org.contactName,       // Name
        'TE',                  // Communication Number Qualifier
        org.contactPhone       // Phone
      ].join(this.elementDelimiter)
    ];
  }

  /**
   * Generate receiver segments (1000B loop)
   */
  private generateReceiver(clearinghouse: Clearinghouse): string[] {
    return [
      [
        'NM1',
        '40',                  // Entity ID Code (40 = Receiver)
        '2',                   // Entity Type
        clearinghouse.name,    // Name
        '',
        '',
        '',
        '',
        '46',
        clearinghouse.id
      ].join(this.elementDelimiter)
    ];
  }

  /**
   * Generate billing provider segments (2000A loop)
   */
  private generateBillingProvider(org: OrganizationInfo): string[] {
    return [
      // HL - Billing Provider Hierarchical Level
      `HL${this.elementDelimiter}1${this.elementDelimiter}${this.elementDelimiter}20${this.elementDelimiter}1`,

      // NM1 - Billing Provider Name
      [
        'NM1',
        '85',                  // Entity ID Code (85 = Billing Provider)
        '2',                   // Entity Type
        org.name,
        '',
        '',
        '',
        '',
        'XX',                  // NPI
        org.npi
      ].join(this.elementDelimiter),

      // N3 - Billing Provider Address
      `N3${this.elementDelimiter}${org.addressLine1}`,

      // N4 - Billing Provider City/State/ZIP
      `N4${this.elementDelimiter}${org.city}${this.elementDelimiter}${org.state}${this.elementDelimiter}${org.zipCode}`
    ];
  }

  /**
   * Generate claim segments (2300 loop)
   */
  private generateClaim(visit: ClaimVisit, org: OrganizationInfo, claimNumber: number): string[] {
    const segments: string[] = [];
    const patientControlNumber = `${visit.client.medicaidNumber}-${this.formatDate(visit.visitDate, 'YYMMDD')}`;
    const totalCharge = this.calculateCharge(visit.serviceCode, visit.billableUnits);

    // HL - Subscriber Hierarchical Level
    segments.push(`HL${this.elementDelimiter}${claimNumber + 1}${this.elementDelimiter}1${this.elementDelimiter}22${this.elementDelimiter}0`);

    // SBR - Subscriber Information
    segments.push(`SBR${this.elementDelimiter}P${this.elementDelimiter}18${this.elementDelimiter}${this.elementDelimiter}${this.elementDelimiter}${this.elementDelimiter}${this.elementDelimiter}${this.elementDelimiter}${this.elementDelimiter}MC`);

    // NM1 - Subscriber Name
    segments.push([
      'NM1',
      'IL',                    // Entity ID (IL = Insured/Subscriber)
      '1',                     // Entity Type (1 = Person)
      visit.client.lastName,
      visit.client.firstName,
      '',
      '',
      '',
      'MI',                    // ID Code Qualifier (MI = Medicaid)
      visit.client.medicaidNumber
    ].join(this.elementDelimiter));

    // N3 - Subscriber Address
    segments.push(`N3${this.elementDelimiter}${visit.client.addressLine1}`);

    // N4 - Subscriber City/State/ZIP
    segments.push(`N4${this.elementDelimiter}${visit.client.city}${this.elementDelimiter}${visit.client.state}${this.elementDelimiter}${visit.client.zipCode}`);

    // DMG - Subscriber Demographics
    segments.push(`DMG${this.elementDelimiter}D8${this.elementDelimiter}${this.formatDate(visit.client.dateOfBirth, 'YYYYMMDD')}`);

    // CLM - Claim Information
    segments.push([
      'CLM',
      patientControlNumber,    // Patient Control Number
      totalCharge.toFixed(2),  // Total Claim Charge
      '',
      '',
      '',
      `${visit.placeOfService}${this.subElementDelimiter}B${this.subElementDelimiter}1`, // Place of Service
      'Y',                     // Provider Signature
      'A',                     // Assignment of Benefits
      'Y',                     // Release of Information
      'Y'                      // Patient Signature on File
    ].join(this.elementDelimiter));

    // DTP - Date of Service
    segments.push(`DTP${this.elementDelimiter}472${this.elementDelimiter}D8${this.elementDelimiter}${this.formatDate(visit.visitDate, 'YYYYMMDD')}`);

    // HI - Diagnosis Codes
    if (visit.diagnosisCode) {
      segments.push(`HI${this.elementDelimiter}ABK${this.subElementDelimiter}${visit.diagnosisCode}`);
    }

    // REF - Authorization Number
    if (visit.authorizationNumber) {
      segments.push(`REF${this.elementDelimiter}G1${this.elementDelimiter}${visit.authorizationNumber}`);
    }

    // LX - Service Line
    segments.push(`LX${this.elementDelimiter}1`);

    // SV1 - Professional Service
    segments.push([
      'SV1',
      `HC${this.subElementDelimiter}${visit.serviceCode}`, // Service Code
      totalCharge.toFixed(2),  // Line Item Charge
      'UN',                    // Unit Basis of Measurement (UN = Units)
      visit.billableUnits.toString(), // Service Units
      '',
      '',
      `1${this.subElementDelimiter}${visit.diagnosisCode || ''}`
    ].join(this.elementDelimiter));

    // DTP - Service Date
    segments.push(`DTP${this.elementDelimiter}472${this.elementDelimiter}D8${this.elementDelimiter}${this.formatDate(visit.visitDate, 'YYYYMMDD')}`);

    return segments;
  }

  /**
   * Group claims by service date
   */
  private groupClaimsByDate(visits: ClaimVisit[]): Map<string, ClaimVisit[]> {
    const grouped = new Map<string, ClaimVisit[]>();

    for (const visit of visits) {
      const dateKey = this.formatDate(visit.visitDate, 'YYYYMMDD');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(visit);
    }

    return grouped;
  }

  /**
   * Calculate charge for service
   */
  private calculateCharge(serviceCode: string, units: number): number {
    // Medicaid reimbursement rates (mock - actual rates vary by state)
    const rates: Record<string, number> = {
      'T1019': 25.00,  // Personal Care per 15 min
      'T1020': 30.00,  // Personal Care with skilled monitoring
      'S5125': 28.00,  // Attendant Care
      'S5126': 32.00,  // Homemaker
      'G0156': 35.00   // Services of home health aide
    };

    const rate = rates[serviceCode] || 25.00;
    return rate * units;
  }

  /**
   * Format date
   */
  private formatDate(date: Date, format: 'YYMMDD' | 'YYYYMMDD'): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    if (format === 'YYMMDD') {
      return year.toString().substring(2) + month + day;
    }
    return year.toString() + month + day;
  }

  /**
   * Format time (HHMM)
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return hours + minutes;
  }

  /**
   * Pad number with leading zeros
   */
  private padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }

  /**
   * Pad string with trailing spaces
   */
  private padRight(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }
}

// Singleton instance
let instance: EDI837GeneratorService | null = null;

export function getEDI837GeneratorService(): EDI837GeneratorService {
  if (!instance) {
    instance = new EDI837GeneratorService();
  }
  return instance;
}
