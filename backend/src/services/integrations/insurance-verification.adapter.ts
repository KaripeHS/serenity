/**
 * Insurance Eligibility Verification Adapter
 * Integrates with Availity and Change Healthcare for real-time eligibility checks
 *
 * Features:
 * - Real-time eligibility verification (EDI 270/271)
 * - Payer coverage details
 * - Copay, deductible, and out-of-pocket max
 * - Authorization requirements
 * - Effective dates and termination
 */

import axios from 'axios';
import { pool } from '../../config/database';


import { createLogger } from '../../utils/logger';

const logger = createLogger('insurance-verification');
interface EligibilityRequest {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  payerId: string;
  serviceType?: string; // '33' for home health
  providerNPI: string;
  serviceDate?: string; // YYYY-MM-DD
}

interface EligibilityResponse {
  verified: boolean;
  active: boolean;
  effectiveDate?: string;
  terminationDate?: string;
  planName?: string;
  groupNumber?: string;
  coverage: {
    copay?: number;
    coinsurance?: number; // percentage
    deductible?: number;
    deductibleMet?: number;
    outOfPocketMax?: number;
    outOfPocketMet?: number;
  };
  benefits: Array<{
    serviceType: string;
    serviceTypeName: string;
    coverageLevel: string;
    inNetwork: boolean;
    benefits?: string;
  }>;
  priorAuthRequired: boolean;
  priorAuthNumber?: string;
  errors?: string[];
  rawResponse?: any;
}

export class InsuranceVerificationAdapter {
  private provider: 'availity' | 'change_healthcare';
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(provider: 'availity' | 'change_healthcare' = 'availity') {
    this.provider = provider;

    switch (provider) {
      case 'availity':
        this.apiKey = process.env.AVAILITY_CLIENT_ID || '';
        this.apiSecret = process.env.AVAILITY_CLIENT_SECRET || '';
        this.baseUrl = 'https://api.availity.com/availity/v1';
        break;
      case 'change_healthcare':
        this.apiKey = process.env.CHANGE_HEALTHCARE_CLIENT_ID || '';
        this.apiSecret = process.env.CHANGE_HEALTHCARE_CLIENT_SECRET || '';
        this.baseUrl = 'https://api.changehealthcare.com/medicalnetwork/eligibility/v3';
        break;
    }

    if (!this.apiKey || !this.apiSecret) {
      logger.warn(`[InsuranceVerification] ${provider} credentials not configured`);
    }
  }

  /**
   * Verify insurance eligibility
   */
  async verifyEligibility(
    organizationId: string,
    request: EligibilityRequest
  ): Promise<EligibilityResponse | null> {
    try {
      let response: EligibilityResponse;

      switch (this.provider) {
        case 'availity':
          response = await this.verifyAvailityEligibility(request);
          break;
        case 'change_healthcare':
          response = await this.verifyChangeHealthcareEligibility(request);
          break;
      }

      // Save verification to database
      await this.saveVerification(organizationId, request, response);

      return response;
    } catch (error) {
      logger.error('[InsuranceVerification] Error verifying eligibility:', error);
      return null;
    }
  }

  /**
   * Verify with Availity
   */
  private async verifyAvailityEligibility(
    request: EligibilityRequest
  ): Promise<EligibilityResponse> {
    // Get OAuth token
    const token = await this.getAvailityToken();

    // Build EDI 270 request
    const edi270 = {
      payerId: request.payerId,
      provider: {
        npi: request.providerNPI
      },
      subscriber: {
        memberId: request.memberId,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth
      },
      encounter: {
        serviceTypeCodes: [request.serviceType || '33'], // 33 = Home Health Care
        serviceDate: request.serviceDate || new Date().toISOString().split('T')[0]
      }
    };

    const response = await axios.post(
      `${this.baseUrl}/eligibility`,
      edi270,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseAvailityResponse(response.data);
  }

  /**
   * Verify with Change Healthcare
   */
  private async verifyChangeHealthcareEligibility(
    request: EligibilityRequest
  ): Promise<EligibilityResponse> {
    // Get OAuth token
    const token = await this.getChangeHealthcareToken();

    const payload = {
      controlNumber: this.generateControlNumber(),
      tradingPartnerServiceId: request.payerId,
      provider: {
        npi: request.providerNPI
      },
      subscriber: {
        memberId: request.memberId,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth
      },
      encounter: {
        serviceTypeCodes: [request.serviceType || '33']
      }
    };

    const response = await axios.post(
      `${this.baseUrl}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseChangeHealthcareResponse(response.data);
  }

  /**
   * Get Availity OAuth token
   */
  private async getAvailityToken(): Promise<string> {
    const response = await axios.post(
      'https://api.availity.com/availity/v1/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'hipaa'
      }),
      {
        auth: {
          username: this.apiKey,
          password: this.apiSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;
  }

  /**
   * Get Change Healthcare OAuth token
   */
  private async getChangeHealthcareToken(): Promise<string> {
    const response = await axios.post(
      'https://auth.changehealthcare.com/oauth/token',
      {
        grant_type: 'client_credentials'
      },
      {
        auth: {
          username: this.apiKey,
          password: this.apiSecret
        }
      }
    );

    return response.data.access_token;
  }

  /**
   * Parse Availity response (EDI 271)
   */
  private parseAvailityResponse(data: any): EligibilityResponse {
    const isActive = data.benefitsInformation?.some(
      (b: any) => b.code === '1' && b.coverageLevel === 'IND'
    );

    const coverage: any = {};
    const benefits: any[] = [];

    // Parse coverage details
    data.benefitsInformation?.forEach((benefit: any) => {
      if (benefit.serviceTypeCodes?.includes('33')) {
        // Home health
        if (benefit.benefitAmount) {
          if (benefit.code === 'C') {
            coverage.copay = parseFloat(benefit.benefitAmount);
          } else if (benefit.code === 'A') {
            coverage.coinsurance = parseFloat(benefit.benefitPercent || '0');
          }
        }

        benefits.push({
          serviceType: '33',
          serviceTypeName: 'Home Health Care',
          coverageLevel: benefit.coverageLevel,
          inNetwork: benefit.inPlanNetworkIndicator === 'Y',
          benefits: benefit.benefitDescription
        });
      }
    });

    // Parse deductible
    const deductibleInfo = data.benefitsInformation?.find(
      (b: any) => b.code === 'F' && b.serviceTypeCodes?.includes('33')
    );
    if (deductibleInfo) {
      coverage.deductible = parseFloat(deductibleInfo.benefitAmount || '0');
      coverage.deductibleMet = parseFloat(deductibleInfo.benefitAmountMet || '0');
    }

    // Parse out-of-pocket max
    const oopInfo = data.benefitsInformation?.find(
      (b: any) => b.code === 'G' && b.serviceTypeCodes?.includes('33')
    );
    if (oopInfo) {
      coverage.outOfPocketMax = parseFloat(oopInfo.benefitAmount || '0');
      coverage.outOfPocketMet = parseFloat(oopInfo.benefitAmountMet || '0');
    }

    return {
      verified: true,
      active: isActive,
      effectiveDate: data.subscriberDetails?.effectiveDate,
      terminationDate: data.subscriberDetails?.terminationDate,
      planName: data.subscriberDetails?.planName,
      groupNumber: data.subscriberDetails?.groupNumber,
      coverage,
      benefits,
      priorAuthRequired: data.benefitsInformation?.some(
        (b: any) => b.authRequired === 'Y'
      ) || false,
      rawResponse: data
    };
  }

  /**
   * Parse Change Healthcare response
   */
  private parseChangeHealthcareResponse(data: any): EligibilityResponse {
    const eligibility = data.eligibilityBenefitInformation || [];

    const isActive = eligibility.some(
      (e: any) => e.eligibilityOrBenefitInformation === 'Active Coverage'
    );

    const coverage: any = {};
    const benefits: any[] = [];

    eligibility.forEach((benefit: any) => {
      if (benefit.serviceTypeCodes?.includes('33')) {
        if (benefit.monetaryAmount) {
          if (benefit.benefitsInformation === 'Co-Payment') {
            coverage.copay = benefit.monetaryAmount;
          } else if (benefit.benefitsInformation === 'Deductible') {
            coverage.deductible = benefit.monetaryAmount;
          } else if (benefit.benefitsInformation === 'Out of Pocket (Stop Loss)') {
            coverage.outOfPocketMax = benefit.monetaryAmount;
          }
        }

        if (benefit.percentageAmount) {
          coverage.coinsurance = benefit.percentageAmount;
        }

        benefits.push({
          serviceType: '33',
          serviceTypeName: 'Home Health Care',
          coverageLevel: benefit.coverageLevel,
          inNetwork: benefit.inPlanNetworkIndicator === 'Y',
          benefits: benefit.benefitsDescription
        });
      }
    });

    return {
      verified: true,
      active: isActive,
      effectiveDate: data.subscriberDetail?.effectiveDate,
      terminationDate: data.subscriberDetail?.terminationDate,
      planName: data.subscriberDetail?.planName,
      groupNumber: data.subscriberDetail?.groupNumber,
      coverage,
      benefits,
      priorAuthRequired: eligibility.some(
        (e: any) => e.authOrCertificationRequired === 'Y'
      ) || false,
      rawResponse: data
    };
  }

  /**
   * Save verification to database
   */
  private async saveVerification(
    organizationId: string,
    request: EligibilityRequest,
    response: EligibilityResponse
  ): Promise<void> {
    await pool.query(
      `
      INSERT INTO insurance_verifications (
        organization_id,
        member_id,
        payer_id,
        provider_npi,
        service_date,
        verified,
        active,
        effective_date,
        termination_date,
        plan_name,
        coverage_details,
        benefits,
        prior_auth_required,
        raw_response,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      `,
      [
        organizationId,
        request.memberId,
        request.payerId,
        request.providerNPI,
        request.serviceDate,
        response.verified,
        response.active,
        response.effectiveDate,
        response.terminationDate,
        response.planName,
        JSON.stringify(response.coverage),
        JSON.stringify(response.benefits),
        response.priorAuthRequired,
        JSON.stringify(response.rawResponse)
      ]
    );
  }

  /**
   * Verify client insurance
   */
  async verifyClientInsurance(
    clientId: string,
    organizationId: string
  ): Promise<EligibilityResponse | null> {
    try {
      // Get client details
      const clientResult = await pool.query(
        `
        SELECT
          c.*,
          o.npi as provider_npi
        FROM clients c
        JOIN organizations o ON c.organization_id = o.id
        WHERE c.id = $1 AND c.organization_id = $2
        `,
        [clientId, organizationId]
      );

      if (clientResult.rows.length === 0) {
        throw new Error('Client not found');
      }

      const client = clientResult.rows[0];

      const request: EligibilityRequest = {
        memberId: client.insurance_member_id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        payerId: client.insurance_payer_id,
        serviceType: '33', // Home health
        providerNPI: client.provider_npi
      };

      return await this.verifyEligibility(organizationId, request);
    } catch (error) {
      logger.error('[InsuranceVerification] Error verifying client insurance:', error);
      return null;
    }
  }

  /**
   * Get verification history for client
   */
  async getClientVerificationHistory(
    clientId: string,
    limit: number = 10
  ): Promise<
    Array<{
      id: string;
      verified: boolean;
      active: boolean;
      planName?: string;
      createdAt: Date;
    }>
  > {
    const result = await pool.query(
      `
      SELECT
        iv.id,
        iv.verified,
        iv.active,
        iv.plan_name,
        iv.created_at
      FROM insurance_verifications iv
      JOIN clients c ON iv.member_id = c.insurance_member_id
      WHERE c.id = $1
      ORDER BY iv.created_at DESC
      LIMIT $2
      `,
      [clientId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      verified: row.verified,
      active: row.active,
      planName: row.plan_name,
      createdAt: row.created_at
    }));
  }

  /**
   * Generate control number for EDI transaction
   */
  private generateControlNumber(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get list of supported payers
   */
  async getSupportedPayers(): Promise<
    Array<{
      id: string;
      name: string;
      payerId: string;
    }>
  > {
    // Common payers
    return [
      { id: '1', name: 'Medicare', payerId: '00192' },
      { id: '2', name: 'Medicaid', payerId: '00522' },
      { id: '3', name: 'Aetna', payerId: '60054' },
      { id: '4', name: 'Anthem', payerId: '39026' },
      { id: '5', name: 'Blue Cross Blue Shield', payerId: '00590' },
      { id: '6', name: 'Cigna', payerId: '62308' },
      { id: '7', name: 'Humana', payerId: '61101' },
      { id: '8', name: 'United Healthcare', payerId: '87726' }
    ];
  }
}

export const insuranceVerificationAdapter = new InsuranceVerificationAdapter();
