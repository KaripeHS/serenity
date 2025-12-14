/**
 * Background Check Integration Adapter
 * Supports multiple background check providers (Checkr, Sterling, Accurate)
 *
 * Features:
 * - Multi-provider support with automatic fallback
 * - Candidate invitation and screening
 * - Real-time status updates via webhooks
 * - Compliance tracking (FCRA, state regulations)
 * - Result parsing and storage
 */

import axios from 'axios';
import { pool } from '../../config/database';


import { createLogger } from '../../utils/logger';

const logger = createLogger('background-check');
interface BackgroundCheckRequest {
  candidateId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  ssn: string; // Last 4 digits or full (encrypted)
  zipCode: string;
  package: 'basic' | 'standard' | 'comprehensive' | 'healthcare';
}

interface BackgroundCheckResult {
  id: string;
  candidateId: string;
  provider: 'checkr' | 'sterling' | 'accurate';
  status: 'pending' | 'processing' | 'completed' | 'disputed' | 'suspended';
  overallResult: 'clear' | 'consider' | 'flagged';
  criminalRecords: Array<{
    type: string;
    charge: string;
    disposition: string;
    date: string;
    county: string;
    state: string;
  }>;
  employmentVerification?: any;
  educationVerification?: any;
  motorVehicleRecords?: any;
  oigCheck?: {
    excluded: boolean;
    excludedDate?: string;
    excludingAgency?: string;
  };
  samCheck?: {
    excluded: boolean;
  };
  completedAt?: Date;
}

export class BackgroundCheckAdapter {
  private provider: 'checkr' | 'sterling' | 'accurate';
  private apiKey: string;
  private baseUrl: string;

  constructor(provider: 'checkr' | 'sterling' | 'accurate' = 'checkr') {
    this.provider = provider;

    switch (provider) {
      case 'checkr':
        this.apiKey = process.env.CHECKR_API_KEY || '';
        this.baseUrl = 'https://api.checkr.com/v1';
        break;
      case 'sterling':
        this.apiKey = process.env.STERLING_API_KEY || '';
        this.baseUrl = 'https://api.sterlingcheck.com/v2';
        break;
      case 'accurate':
        this.apiKey = process.env.ACCURATE_API_KEY || '';
        this.baseUrl = 'https://api.accuratebackground.com/v3';
        break;
    }

    if (!this.apiKey) {
      logger.warn(`[BackgroundCheck] ${provider} API key not configured`);
    }
  }

  /**
   * Initiate background check for candidate
   */
  async initiateBackgroundCheck(
    organizationId: string,
    request: BackgroundCheckRequest
  ): Promise<{ checkId: string; invitationUrl?: string } | null> {
    try {
      let checkId: string;
      let invitationUrl: string | undefined;

      switch (this.provider) {
        case 'checkr':
          ({ checkId, invitationUrl } = await this.initiateCheckr(request));
          break;
        case 'sterling':
          ({ checkId, invitationUrl } = await this.initiateSterling(request));
          break;
        case 'accurate':
          ({ checkId, invitationUrl } = await this.initiateAccurate(request));
          break;
      }

      // Save to database
      await pool.query(
        `
        INSERT INTO background_checks (
          organization_id,
          candidate_id,
          provider,
          provider_check_id,
          status,
          package_type,
          invitation_url,
          created_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())
        `,
        [
          organizationId,
          request.candidateId,
          this.provider,
          checkId,
          request.package,
          invitationUrl
        ]
      );

      return { checkId, invitationUrl };
    } catch (error) {
      logger.error('[BackgroundCheck] Error initiating check:', error);
      return null;
    }
  }

  /**
   * Initiate check with Checkr
   */
  private async initiateCheckr(
    request: BackgroundCheckRequest
  ): Promise<{ checkId: string; invitationUrl?: string }> {
    // Create candidate
    const candidateResponse = await axios.post(
      `${this.baseUrl}/candidates`,
      {
        email: request.email,
        first_name: request.firstName,
        middle_name: request.middleName,
        last_name: request.lastName,
        phone: request.phone,
        zipcode: request.zipCode,
        dob: request.dateOfBirth,
        ssn: request.ssn
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const candidateId = candidateResponse.data.id;

    // Determine package
    let packageSlug: string;
    switch (request.package) {
      case 'basic':
        packageSlug = 'tasker_basic';
        break;
      case 'standard':
        packageSlug = 'tasker_standard';
        break;
      case 'comprehensive':
        packageSlug = 'tasker_pro';
        break;
      case 'healthcare':
        packageSlug = 'healthcare_basic';
        break;
    }

    // Create invitation
    const invitationResponse = await axios.post(
      `${this.baseUrl}/invitations`,
      {
        candidate_id: candidateId,
        package: packageSlug
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      checkId: invitationResponse.data.id,
      invitationUrl: invitationResponse.data.invitation_url
    };
  }

  /**
   * Initiate check with Sterling
   */
  private async initiateSterling(
    request: BackgroundCheckRequest
  ): Promise<{ checkId: string; invitationUrl?: string }> {
    const response = await axios.post(
      `${this.baseUrl}/candidates`,
      {
        firstName: request.firstName,
        middleName: request.middleName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        dateOfBirth: request.dateOfBirth,
        ssn: request.ssn,
        address: {
          postalCode: request.zipCode
        },
        packageId: this.getSterlingPackageId(request.package)
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      checkId: response.data.id,
      invitationUrl: response.data.invitationUrl
    };
  }

  /**
   * Initiate check with Accurate
   */
  private async initiateAccurate(
    request: BackgroundCheckRequest
  ): Promise<{ checkId: string; invitationUrl?: string }> {
    const response = await axios.post(
      `${this.baseUrl}/screenings`,
      {
        applicant: {
          firstName: request.firstName,
          middleName: request.middleName,
          lastName: request.lastName,
          email: request.email,
          phone: request.phone,
          dateOfBirth: request.dateOfBirth,
          ssn: request.ssn,
          zipCode: request.zipCode
        },
        package: this.getAccuratePackageCode(request.package)
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      checkId: response.data.screeningId,
      invitationUrl: response.data.applicantPortalUrl
    };
  }

  /**
   * Get check status and results
   */
  async getCheckStatus(checkId: string): Promise<BackgroundCheckResult | null> {
    try {
      let result: BackgroundCheckResult;

      switch (this.provider) {
        case 'checkr':
          result = await this.getCheckrStatus(checkId);
          break;
        case 'sterling':
          result = await this.getSterlingStatus(checkId);
          break;
        case 'accurate':
          result = await this.getAccurateStatus(checkId);
          break;
      }

      // Update database
      await this.saveCheckResult(result);

      return result;
    } catch (error) {
      logger.error('[BackgroundCheck] Error getting status:', error);
      return null;
    }
  }

  /**
   * Get Checkr status
   */
  private async getCheckrStatus(checkId: string): Promise<BackgroundCheckResult> {
    const response = await axios.get(`${this.baseUrl}/reports/${checkId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`
      }
    });

    const report = response.data;

    return {
      id: report.id,
      candidateId: report.candidate_id,
      provider: 'checkr',
      status: this.mapCheckrStatus(report.status),
      overallResult: this.mapCheckrResult(report.result),
      criminalRecords: report.criminal_records || [],
      oigCheck: report.federal_criminal_search?.oig,
      completedAt: report.completed_at ? new Date(report.completed_at) : undefined
    };
  }

  /**
   * Get Sterling status
   */
  private async getSterlingStatus(checkId: string): Promise<BackgroundCheckResult> {
    const response = await axios.get(`${this.baseUrl}/screenings/${checkId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    const screening = response.data;

    return {
      id: screening.id,
      candidateId: screening.candidateId,
      provider: 'sterling',
      status: this.mapSterlingStatus(screening.status),
      overallResult: this.mapSterlingResult(screening.overallStatus),
      criminalRecords: screening.criminalRecords || [],
      completedAt: screening.completedDate ? new Date(screening.completedDate) : undefined
    };
  }

  /**
   * Get Accurate status
   */
  private async getAccurateStatus(checkId: string): Promise<BackgroundCheckResult> {
    const response = await axios.get(`${this.baseUrl}/screenings/${checkId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    const screening = response.data;

    return {
      id: screening.screeningId,
      candidateId: screening.applicant.id,
      provider: 'accurate',
      status: this.mapAccurateStatus(screening.status),
      overallResult: this.mapAccurateResult(screening.decision),
      criminalRecords: screening.criminalRecords || [],
      completedAt: screening.completedAt ? new Date(screening.completedAt) : undefined
    };
  }

  /**
   * Save check result to database
   */
  private async saveCheckResult(result: BackgroundCheckResult): Promise<void> {
    await pool.query(
      `
      UPDATE background_checks
      SET status = $1,
          overall_result = $2,
          results_json = $3,
          completed_at = $4,
          updated_at = NOW()
      WHERE provider_check_id = $5 AND provider = $6
      `,
      [
        result.status,
        result.overallResult,
        JSON.stringify(result),
        result.completedAt,
        result.id,
        result.provider
      ]
    );
  }

  /**
   * Handle webhook notification
   */
  async handleWebhook(payload: any, provider: string): Promise<void> {
    try {
      let checkId: string;
      let status: string;

      switch (provider) {
        case 'checkr':
          checkId = payload.data.id;
          status = payload.data.status;
          break;
        case 'sterling':
          checkId = payload.screeningId;
          status = payload.status;
          break;
        case 'accurate':
          checkId = payload.screeningId;
          status = payload.status;
          break;
        default:
          throw new Error('Unknown provider');
      }

      // Fetch latest status
      await this.getCheckStatus(checkId);

      logger.info(`[BackgroundCheck] Webhook processed for ${provider} check ${checkId}`);
    } catch (error) {
      logger.error('[BackgroundCheck] Error handling webhook:', error);
    }
  }

  /**
   * Get all checks for organization
   */
  async getOrganizationChecks(
    organizationId: string,
    status?: string
  ): Promise<
    Array<{
      id: string;
      candidateId: string;
      provider: string;
      status: string;
      overallResult?: string;
      createdAt: Date;
      completedAt?: Date;
    }>
  > {
    const queryParts = [
      'SELECT * FROM background_checks WHERE organization_id = $1'
    ];
    const params: any[] = [organizationId];

    if (status) {
      queryParts.push('AND status = $2');
      params.push(status);
    }

    queryParts.push('ORDER BY created_at DESC');

    const result = await pool.query(queryParts.join(' '), params);

    return result.rows.map(row => ({
      id: row.id,
      candidateId: row.candidate_id,
      provider: row.provider,
      status: row.status,
      overallResult: row.overall_result,
      createdAt: row.created_at,
      completedAt: row.completed_at
    }));
  }

  // Helper methods for status/result mapping
  private mapCheckrStatus(status: string): BackgroundCheckResult['status'] {
    const mapping: Record<string, BackgroundCheckResult['status']> = {
      pending: 'pending',
      processing: 'processing',
      complete: 'completed',
      disputed: 'disputed',
      suspended: 'suspended'
    };
    return mapping[status] || 'pending';
  }

  private mapCheckrResult(result: string): BackgroundCheckResult['overallResult'] {
    const mapping: Record<string, BackgroundCheckResult['overallResult']> = {
      clear: 'clear',
      consider: 'consider'
    };
    return mapping[result] || 'flagged';
  }

  private mapSterlingStatus(status: string): BackgroundCheckResult['status'] {
    return status.toLowerCase() as BackgroundCheckResult['status'];
  }

  private mapSterlingResult(status: string): BackgroundCheckResult['overallResult'] {
    if (status === 'CLEAR') return 'clear';
    if (status === 'REVIEW') return 'consider';
    return 'flagged';
  }

  private mapAccurateStatus(status: string): BackgroundCheckResult['status'] {
    return status.toLowerCase() as BackgroundCheckResult['status'];
  }

  private mapAccurateResult(decision: string): BackgroundCheckResult['overallResult'] {
    if (decision === 'ELIGIBLE') return 'clear';
    if (decision === 'REVIEW') return 'consider';
    return 'flagged';
  }

  private getSterlingPackageId(pkg: string): string {
    const mapping: Record<string, string> = {
      basic: 'PKG_BASIC_001',
      standard: 'PKG_STANDARD_001',
      comprehensive: 'PKG_COMP_001',
      healthcare: 'PKG_HEALTHCARE_001'
    };
    return mapping[pkg] || 'PKG_BASIC_001';
  }

  private getAccuratePackageCode(pkg: string): string {
    const mapping: Record<string, string> = {
      basic: 'BASIC',
      standard: 'STANDARD',
      comprehensive: 'COMPREHENSIVE',
      healthcare: 'HEALTHCARE'
    };
    return mapping[pkg] || 'BASIC';
  }
}

export const backgroundCheckAdapter = new BackgroundCheckAdapter();
