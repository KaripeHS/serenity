/**
 * Sandata Individuals Service
 * Manages client/patient synchronization with Sandata Alt-EVV
 *
 * Features:
 * - Create/update individuals in Sandata
 * - Sync Sandata IDs back to our database
 * - Handle eligibility verification
 * - Transaction logging for audit trail
 *
 * @module services/sandata/individuals.service
 */

import { getSandataClient } from './client';
import { getSandataValidator } from './validator.service';
import { getSandataRepository } from './repositories/sandata.repository';
import { getDbClient } from '../../database/client';
import { SANDATA_ENDPOINTS } from '../../config/sandata';
import type {
  SandataIndividual,
  SandataIndividualResponse,
  SandataApiResponse,
  SandataTransaction,
} from './types';

/**
 * Database client types (to be replaced with actual Prisma/Drizzle types)
 */
interface DatabaseClient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  medicaidNumber?: string;
  sandataClientId?: string | null;
  evvConsentDate?: Date | null;
  evvConsentStatus?: string | null;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
  status: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IndividualSyncOptions {
  forceUpdate?: boolean; // Re-sync even if Sandata ID exists
  dryRun?: boolean; // Validate only, don't submit
}

interface IndividualSyncResult {
  success: boolean;
  clientId: string;
  sandataIndividualId?: string;
  action: 'created' | 'updated' | 'skipped' | 'validated';
  errors?: string[];
  warnings?: string[];
  transactionId?: string;
}

/**
 * Sandata Individuals Service
 */
export class SandataIndividualsService {
  private readonly client = getSandataClient();
  private readonly validator = getSandataValidator();
  private readonly repository = getSandataRepository(getDbClient());

  /**
   * Sync a single client to Sandata
   */
  async syncIndividual(
    client: DatabaseClient,
    options: IndividualSyncOptions = {}
  ): Promise<IndividualSyncResult> {
    const { forceUpdate = false, dryRun = false } = options;

    try {
      // Check if already synced (unless force update)
      if (client.sandataClientId && !forceUpdate) {
        return {
          success: true,
          clientId: client.id,
          sandataIndividualId: client.sandataClientId,
          action: 'skipped',
          warnings: ['Individual already synced to Sandata'],
        };
      }

      // Check EVV consent
      if (!this.hasValidEVVConsent(client)) {
        return {
          success: false,
          clientId: client.id,
          action: 'skipped',
          errors: ['EVV consent required before syncing to Sandata'],
          warnings: ['Client must sign EVV consent form'],
        };
      }

      // Map database client to Sandata individual
      const sandataIndividual = await this.mapClientToSandataIndividual(client);

      // Dry run - validate only
      if (dryRun) {
        const validationErrors = this.validateIndividual(sandataIndividual);
        if (validationErrors.length > 0) {
          return {
            success: false,
            clientId: client.id,
            action: 'validated',
            errors: validationErrors,
          };
        }

        return {
          success: true,
          clientId: client.id,
          action: 'validated',
          warnings: ['Dry run - no actual sync performed'],
        };
      }

      // Determine if create or update
      const isUpdate = !!client.sandataClientId;
      const endpoint = isUpdate
        ? `${SANDATA_ENDPOINTS.individuals}/${client.sandataClientId}`
        : SANDATA_ENDPOINTS.individuals;

      // Submit to Sandata
      const response = isUpdate
        ? await this.client.put<SandataIndividualResponse>(endpoint, {
            individual: sandataIndividual,
          })
        : await this.client.post<SandataIndividualResponse>(endpoint, {
            individual: sandataIndividual,
          });

      // Handle response
      if (!response.success) {
        return {
          success: false,
          clientId: client.id,
          action: isUpdate ? 'updated' : 'created',
          errors: [response.error?.message || 'Unknown error'],
          transactionId: response.transactionId,
        };
      }

      // Log transaction to database
      await this.logTransaction({
        transactionType: 'individual',
        requestPayload: sandataIndividual,
        responsePayload: response.data,
        status: 'accepted',
        httpStatusCode: response.statusCode,
        clientId: client.id,
        organizationId: client.organizationId,
        transactionId: response.transactionId,
      });

      // Update database with Sandata ID (would normally call Prisma/Drizzle)
      if (response.data?.individualId) {
        await this.updateClientSandataId(client.id, response.data.individualId);
      }

      return {
        success: true,
        clientId: client.id,
        sandataIndividualId: response.data?.individualId,
        action: isUpdate ? 'updated' : 'created',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        clientId: client.id,
        action: 'created',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Sync multiple clients in batch
   */
  async syncIndividuals(
    clients: DatabaseClient[],
    options: IndividualSyncOptions = {}
  ): Promise<IndividualSyncResult[]> {
    const results: IndividualSyncResult[] = [];

    // Process sequentially to avoid rate limiting
    // TODO: Add batch processing with rate limit handling
    for (const client of clients) {
      const result = await this.syncIndividual(client, options);
      results.push(result);

      // Add delay to avoid rate limiting (250ms = 4 requests/sec)
      await this.delay(250);
    }

    return results;
  }

  /**
   * Get sync status for a client
   */
  async getSyncStatus(clientId: string): Promise<{
    isSynced: boolean;
    sandataIndividualId?: string | null;
    lastSyncAt?: Date | null;
    syncErrors?: string[];
  }> {
    // Would query database for client and last transaction
    // Placeholder implementation
    return {
      isSynced: false,
      sandataIndividualId: null,
      lastSyncAt: null,
    };
  }

  /**
   * Retrieve individual from Sandata by ID
   */
  async getIndividual(sandataIndividualId: string): Promise<SandataApiResponse<SandataIndividual>> {
    return await this.client.get<SandataIndividual>(
      `${SANDATA_ENDPOINTS.individuals}/${sandataIndividualId}`
    );
  }

  /**
   * Search for individuals in Sandata
   */
  async searchIndividuals(criteria: {
    medicaidNumber?: string;
    lastName?: string;
    firstName?: string;
    dateOfBirth?: string;
  }): Promise<SandataApiResponse<SandataIndividual[]>> {
    const queryParams = new URLSearchParams(
      Object.entries(criteria).filter(([_, v]) => v != null) as [string, string][]
    );

    return await this.client.get<SandataIndividual[]>(
      `${SANDATA_ENDPOINTS.individuals}?${queryParams.toString()}`
    );
  }

  /**
   * Deactivate individual in Sandata
   */
  async deactivateIndividual(sandataIndividualId: string): Promise<IndividualSyncResult> {
    try {
      const response = await this.client.put<SandataIndividualResponse>(
        `${SANDATA_ENDPOINTS.individuals}/${sandataIndividualId}`,
        {
          individual: {
            individualId: sandataIndividualId,
            status: 'inactive',
            terminationDate: new Date().toISOString().split('T')[0],
          },
        }
      );

      return {
        success: response.success,
        clientId: sandataIndividualId,
        sandataIndividualId,
        action: 'updated',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        clientId: sandataIndividualId,
        action: 'updated',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Check if client has valid EVV consent
   */
  private hasValidEVVConsent(client: DatabaseClient): boolean {
    return (
      client.evvConsentStatus === 'signed' &&
      client.evvConsentDate != null &&
      client.evvConsentDate <= new Date()
    );
  }

  /**
   * Map database client to Sandata individual format
   */
  private async mapClientToSandataIndividual(client: DatabaseClient): Promise<SandataIndividual> {
    const individual: SandataIndividual = {
      providerId: await this.getProviderId(client.organizationId),
      lastName: client.lastName,
      firstName: client.firstName,
      dateOfBirth: this.formatDate(client.dateOfBirth),
      medicaidNumber: client.medicaidNumber || '',
      status: client.status === 'active' ? 'active' : 'inactive',
      externalId: client.id, // Our UUID for reference
    };

    // Add optional fields if present
    if (client.addressLine1 && client.city && client.state && client.zipCode) {
      individual.address = {
        street1: client.addressLine1,
        city: client.city,
        state: client.state,
        zipCode: client.zipCode,
      };
    }

    if (client.phoneNumber) {
      individual.phoneNumber = client.phoneNumber;
    }

    if (client.email) {
      individual.email = client.email;
    }

    // Add Sandata ID if updating
    if (client.sandataClientId) {
      individual.individualId = client.sandataClientId;
    }

    return individual;
  }

  /**
   * Validate individual data before submission
   */
  private validateIndividual(individual: SandataIndividual): string[] {
    const errors: string[] = [];

    // Required fields
    if (!individual.providerId) errors.push('Provider ID is required');
    if (!individual.lastName) errors.push('Last name is required');
    if (!individual.firstName) errors.push('First name is required');
    if (!individual.dateOfBirth) errors.push('Date of birth is required');
    if (!individual.medicaidNumber) errors.push('Medicaid number is required');

    // Medicaid number format (Ohio = 10 digits)
    if (individual.medicaidNumber && !/^\d{10}$/.test(individual.medicaidNumber)) {
      errors.push('Medicaid number must be 10 digits');
    }

    // Date format validation
    if (individual.dateOfBirth && !this.isValidDate(individual.dateOfBirth)) {
      errors.push('Invalid date of birth format (expected YYYY-MM-DD)');
    }

    // Age validation (must be 18+ for most home care)
    if (individual.dateOfBirth) {
      const age = this.calculateAge(individual.dateOfBirth);
      if (age < 18) {
        errors.push('Individual must be 18 or older');
      }
    }

    return errors;
  }

  /**
   * Log transaction to database
   */
  private async logTransaction(transaction: {
    transactionType: string;
    requestPayload: any;
    responsePayload: any;
    status: string;
    httpStatusCode?: number;
    clientId: string;
    organizationId: string;
    transactionId?: string | undefined;
  }): Promise<void> {
    await this.repository.createTransaction({
      transactionType: transaction.transactionType,
      transactionId: transaction.transactionId,
      requestPayload: transaction.requestPayload,
      responsePayload: transaction.responsePayload,
      httpStatusCode: transaction.httpStatusCode,
      status: transaction.status,
      organizationId: transaction.organizationId,
    });
  }

  /**
   * Update client with Sandata ID
   */
  private async updateClientSandataId(clientId: string, sandataId: string): Promise<void> {
    await this.repository.updateClientSandataId(clientId, sandataId);
  }

  /**
   * Get provider ID for organization
   */
  private async getProviderId(organizationId: string): Promise<string> {
    const config = await this.repository.getConfig(organizationId);
    if (!config) {
      throw new Error(`Sandata configuration not found for organization ${organizationId}`);
    }
    return config.sandata_provider_id;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: string | Date): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Validate date format
   */
  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Unknown error occurred';
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
let individualsServiceInstance: SandataIndividualsService | null = null;

/**
 * Get Sandata Individuals Service singleton
 */
export function getSandataIndividualsService(): SandataIndividualsService {
  if (!individualsServiceInstance) {
    individualsServiceInstance = new SandataIndividualsService();
  }
  return individualsServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetSandataIndividualsService(): void {
  individualsServiceInstance = null;
}

export default SandataIndividualsService;
