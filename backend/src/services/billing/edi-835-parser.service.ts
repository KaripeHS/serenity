/**
 * EDI 835 (Electronic Remittance Advice) Parser Service
 *
 * Parses ANSI X12 835 files from health insurance payers containing:
 * - Payment information for submitted claims
 * - Adjustment reasons and codes
 * - Service line details
 * - Remittance advice
 *
 * Standard EDI 835 Format:
 * - ISA: Interchange Control Header
 * - GS: Functional Group Header
 * - ST: Transaction Set Header (835)
 * - BPR: Financial Information
 * - TRN: Reassociation Trace Number
 * - N1: Payer/Payee Identification
 * - LX: Service Line Number
 * - CLP: Claim Payment Information
 * - CAS: Claims Adjustment
 * - SE: Transaction Set Trailer
 * - GE: Functional Group Trailer
 * - IEA: Interchange Control Trailer
 *
 * @module services/billing/edi-835-parser
 */

import { logger } from '../../shared/utils/logger';

/**
 * EDI 835 Parsed Data Structure
 */
export interface EDI835Data {
  // Interchange metadata
  interchangeControlNumber: string;
  groupControlNumber: string;
  transactionSetControlNumber: string;

  // Financial information (BPR segment)
  payment: {
    totalPayment: number;
    paymentMethod: 'CHK' | 'ACH' | 'BOP' | 'FWT' | 'NON';
    paymentDate: Date;
    checkNumber?: string;
    payerName: string;
    payerId: string;
  };

  // Claims
  claims: EDI835Claim[];

  // Metadata
  parsedAt: Date;
  rawContent: string;
}

export interface EDI835Claim {
  // Claim identification (CLP segment)
  claimId: string;
  claimStatus: 1 | 2 | 3 | 4 | 19 | 20 | 21 | 22 | 23; // 1=processed, 2=adjusted, 3=denied, etc.
  chargedAmount: number;
  paidAmount: number;
  patientResponsibility: number;
  filingIndicator: string;
  payerClaimControlNumber?: string;

  // Patient information (NM1 segment)
  patient: {
    firstName: string;
    lastName: string;
    identifier: string;
  };

  // Service lines (SVC segment)
  serviceLines: EDI835ServiceLine[];

  // Adjustments (CAS segment)
  adjustments: EDI835Adjustment[];
}

export interface EDI835ServiceLine {
  procedureCode: string;
  chargedAmount: number;
  paidAmount: number;
  units: number;
  serviceDate: Date;
  adjustments: EDI835Adjustment[];
}

export interface EDI835Adjustment {
  groupCode: 'CO' | 'CR' | 'OA' | 'PI' | 'PR'; // CO=Contractual, PR=Patient Responsibility, etc.
  reasonCode: string;
  amount: number;
  quantity?: number;
}

/**
 * EDI 835 Parser Service
 */
export class EDI835ParserService {
  private readonly SEGMENT_DELIMITER = '~';
  private readonly ELEMENT_DELIMITER = '*';

  /**
   * Parse EDI 835 file content
   */
  async parse(content: string): Promise<EDI835Data> {
    logger.info('Starting EDI 835 parse');

    // Clean content
    const cleanContent = content.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Extract delimiters from ISA segment
    const isaSegment = cleanContent.substring(0, 106);
    const elementDelimiter = isaSegment.charAt(3);
    const segmentDelimiter = isaSegment.charAt(105);

    // Split into segments
    const segments = cleanContent.split(segmentDelimiter).map(s => s.trim()).filter(s => s.length > 0);

    // Parse segments
    const data: Partial<EDI835Data> = {
      claims: [],
      parsedAt: new Date(),
      rawContent: content
    };

    let currentClaim: Partial<EDI835Claim> | null = null;
    let currentServiceLine: Partial<EDI835ServiceLine> | null = null;

    for (const segment of segments) {
      const elements = segment.split(elementDelimiter);
      const segmentId = elements[0];

      switch (segmentId) {
        case 'ISA':
          data.interchangeControlNumber = elements[13];
          break;

        case 'GS':
          data.groupControlNumber = elements[6];
          break;

        case 'ST':
          data.transactionSetControlNumber = elements[2];
          break;

        case 'BPR': // Financial Information
          data.payment = {
            totalPayment: parseFloat(elements[2]) || 0,
            paymentMethod: elements[3] as any || 'CHK',
            paymentDate: this.parseEDIDate(elements[16]),
            payerName: '',
            payerId: ''
          };
          break;

        case 'TRN': // Trace Number
          if (data.payment) {
            data.payment.checkNumber = elements[2];
          }
          break;

        case 'N1': // Payer/Payee Identification
          if (elements[1] === 'PR' && data.payment) {
            // Payer
            data.payment.payerName = elements[2] || '';
            data.payment.payerId = elements[4] || '';
          }
          break;

        case 'CLP': // Claim Payment Information
          // Save previous claim if exists
          if (currentClaim && currentClaim.claimId) {
            data.claims!.push(currentClaim as EDI835Claim);
          }

          // Start new claim
          currentClaim = {
            claimId: elements[1],
            claimStatus: parseInt(elements[2]) as any,
            chargedAmount: parseFloat(elements[3]) || 0,
            paidAmount: parseFloat(elements[4]) || 0,
            patientResponsibility: parseFloat(elements[5]) || 0,
            filingIndicator: elements[6] || '',
            payerClaimControlNumber: elements[7],
            serviceLines: [],
            adjustments: [],
            patient: {
              firstName: '',
              lastName: '',
              identifier: ''
            }
          };
          break;

        case 'NM1': // Patient Information
          if (elements[1] === 'QC' && currentClaim) {
            // QC = Patient
            currentClaim.patient = {
              lastName: elements[3] || '',
              firstName: elements[4] || '',
              identifier: elements[9] || ''
            };
          }
          break;

        case 'SVC': // Service Line
          if (!currentClaim) break;

          // Parse procedure code (may be composite)
          const procedureCodeComposite = elements[1].split(':');
          const procedureCode = procedureCodeComposite[procedureCodeComposite.length - 1];

          currentServiceLine = {
            procedureCode,
            chargedAmount: parseFloat(elements[2]) || 0,
            paidAmount: parseFloat(elements[3]) || 0,
            units: parseFloat(elements[5]) || 1,
            serviceDate: new Date(), // DTM segment would provide actual date
            adjustments: []
          };

          currentClaim.serviceLines!.push(currentServiceLine as EDI835ServiceLine);
          break;

        case 'DTM': // Service Date
          if (elements[1] === '472' && currentServiceLine) {
            // 472 = Service Date
            currentServiceLine.serviceDate = this.parseEDIDate(elements[2]);
          }
          break;

        case 'CAS': // Claims Adjustment
          const adjustment: EDI835Adjustment = {
            groupCode: elements[1] as any,
            reasonCode: elements[2],
            amount: parseFloat(elements[3]) || 0,
            quantity: elements[4] ? parseFloat(elements[4]) : undefined
          };

          // Determine where to add adjustment
          if (currentServiceLine) {
            currentServiceLine.adjustments!.push(adjustment);
          } else if (currentClaim) {
            currentClaim.adjustments!.push(adjustment);
          }
          break;

        case 'SE': // Transaction Set Trailer
          // Save last claim
          if (currentClaim && currentClaim.claimId) {
            data.claims!.push(currentClaim as EDI835Claim);
            currentClaim = null;
          }
          break;
      }
    }

    // Validate required fields
    if (!data.payment) {
      throw new Error('Invalid EDI 835: Missing BPR segment (payment information)');
    }

    if (!data.interchangeControlNumber) {
      throw new Error('Invalid EDI 835: Missing ISA segment (interchange control)');
    }

    logger.info(`EDI 835 parsed successfully: ${data.claims!.length} claims, $${data.payment.totalPayment}`);

    return data as EDI835Data;
  }

  /**
   * Parse EDI date format (CCYYMMDD or YYMMDD)
   */
  private parseEDIDate(dateStr: string): Date {
    if (!dateStr || dateStr.length < 6) {
      return new Date();
    }

    let year: number;
    let month: number;
    let day: number;

    if (dateStr.length === 8) {
      // CCYYMMDD format
      year = parseInt(dateStr.substring(0, 4));
      month = parseInt(dateStr.substring(4, 6));
      day = parseInt(dateStr.substring(6, 8));
    } else {
      // YYMMDD format
      const yy = parseInt(dateStr.substring(0, 2));
      year = yy > 50 ? 1900 + yy : 2000 + yy;
      month = parseInt(dateStr.substring(2, 4));
      day = parseInt(dateStr.substring(4, 6));
    }

    return new Date(year, month - 1, day);
  }

  /**
   * Get human-readable claim status
   */
  getClaimStatusDescription(status: number): string {
    const statuses: Record<number, string> = {
      1: 'Processed as Primary',
      2: 'Processed as Secondary',
      3: 'Processed as Tertiary',
      4: 'Denied',
      19: 'Processed as Primary, Forwarded to Additional Payer(s)',
      20: 'Processed as Secondary, Forwarded to Additional Payer(s)',
      21: 'Processed as Tertiary, Forwarded to Additional Payer(s)',
      22: 'Reversal of Previous Payment',
      23: 'Not Our Claim, Forwarded to Additional Payer(s)'
    };

    return statuses[status] || 'Unknown';
  }

  /**
   * Get human-readable adjustment group code
   */
  getAdjustmentGroupDescription(groupCode: string): string {
    const groups: Record<string, string> = {
      'CO': 'Contractual Obligation',
      'CR': 'Correction and Reversals',
      'OA': 'Other Adjustments',
      'PI': 'Payer Initiated Reductions',
      'PR': 'Patient Responsibility'
    };

    return groups[groupCode] || groupCode;
  }

  /**
   * Calculate total adjustments by group code
   */
  calculateAdjustmentsByGroup(claim: EDI835Claim): Record<string, number> {
    const totals: Record<string, number> = {};

    // Claim-level adjustments
    for (const adj of claim.adjustments) {
      totals[adj.groupCode] = (totals[adj.groupCode] || 0) + adj.amount;
    }

    // Service-line adjustments
    for (const line of claim.serviceLines) {
      for (const adj of line.adjustments) {
        totals[adj.groupCode] = (totals[adj.groupCode] || 0) + adj.amount;
      }
    }

    return totals;
  }

  /**
   * Validate payment amount matches claim totals
   */
  validatePaymentAmount(data: EDI835Data): boolean {
    const totalClaimPayments = data.claims.reduce((sum, claim) => sum + claim.paidAmount, 0);
    const difference = Math.abs(data.payment.totalPayment - totalClaimPayments);

    // Allow for rounding differences up to $0.10
    return difference < 0.10;
  }
}

export const edi835ParserService = new EDI835ParserService();
