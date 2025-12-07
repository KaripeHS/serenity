/**
 * Sandata Employees Service
 * Manages caregiver synchronization with Sandata Alt-EVV
 *
 * Features:
 * - Create/update employees in Sandata
 * - Sync Sandata IDs back to our database
 * - Handle certification tracking
 * - Transaction logging for audit trail
 *
 * @module services/sandata/employees.service
 */

import { getSandataClient } from './client';
import { getSandataValidator } from './validator.service';
import { getSandataRepository } from './repositories/sandata.repository';
import { getDbClient } from '../../database/client';
import { SANDATA_ENDPOINTS } from '../../config/sandata';
import type {
  SandataEmployee,
  SandataEmployeeResponse,
  SandataEmployeeCertification,
  SandataApiResponse,
} from './types';

/**
 * Database user types (to be replaced with actual Prisma/Drizzle types)
 */
interface DatabaseUser {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  ssnEncrypted?: string; // Encrypted SSN from DB (bytea converted to string or hex)
  sandataEmployeeId?: string | null;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
  hireDate?: Date;
  terminationDate?: Date | null;
  status: string;
  role: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseCertification {
  id: string;
  userId: string;
  certificationType: string;
  certificationNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  expirationDate: Date;
  status: string;
}

interface EmployeeSyncOptions {
  forceUpdate?: boolean; // Re-sync even if Sandata ID exists
  dryRun?: boolean; // Validate only, don't submit
  includeCertifications?: boolean; // Include certifications in sync
}

interface EmployeeSyncResult {
  success: boolean;
  userId: string;
  sandataEmployeeId?: string;
  action: 'created' | 'updated' | 'skipped' | 'validated';
  errors?: string[];
  warnings?: string[];
  transactionId?: string;
}

/**
 * Sandata Employees Service
 */
export class SandataEmployeesService {
  private readonly client = getSandataClient();
  private readonly validator = getSandataValidator();
  private readonly repository = getSandataRepository(getDbClient());

  /**
   * Sync a single caregiver to Sandata
   */
  async syncEmployee(
    user: DatabaseUser,
    certifications: DatabaseCertification[] = [],
    options: EmployeeSyncOptions = {}
  ): Promise<EmployeeSyncResult> {
    const { forceUpdate = false, dryRun = false, includeCertifications = true } = options;

    try {
      // Check if user is a caregiver
      if (!this.isCaregiverRole(user.role)) {
        return {
          success: false,
          userId: user.id,
          action: 'skipped',
          errors: ['Only caregivers can be synced to Sandata'],
        };
      }

      // Check if already synced (unless force update)
      if (user.sandataEmployeeId && !forceUpdate) {
        return {
          success: true,
          userId: user.id,
          sandataEmployeeId: user.sandataEmployeeId,
          action: 'skipped',
          warnings: ['Employee already synced to Sandata'],
        };
      }

      // Check if user is active
      if (user.status !== 'active') {
        return {
          success: false,
          userId: user.id,
          action: 'skipped',
          errors: ['Only active employees can be synced to Sandata'],
        };
      }

      // Map database user to Sandata employee
      const sandataEmployee = await this.mapUserToSandataEmployee(
        user,
        includeCertifications ? certifications : []
      );

      // Dry run - validate only
      if (dryRun) {
        const validationErrors = this.validateEmployee(sandataEmployee);
        if (validationErrors.length > 0) {
          return {
            success: false,
            userId: user.id,
            action: 'validated',
            errors: validationErrors,
          };
        }

        return {
          success: true,
          userId: user.id,
          action: 'validated',
          warnings: ['Dry run - no actual sync performed'],
        };
      }

      // Determine if create or update
      const isUpdate = !!user.sandataEmployeeId;
      const endpoint = isUpdate
        ? `${SANDATA_ENDPOINTS.employees}/${user.sandataEmployeeId}`
        : SANDATA_ENDPOINTS.employees;

      // Submit to Sandata
      const response = isUpdate
        ? await this.client.put<SandataEmployeeResponse>(endpoint, {
          employee: sandataEmployee,
        })
        : await this.client.post<SandataEmployeeResponse>(endpoint, {
          employee: sandataEmployee,
        });

      // Handle response
      if (!response.success) {
        return {
          success: false,
          userId: user.id,
          action: isUpdate ? 'updated' : 'created',
          errors: [response.error?.message || 'Unknown error'],
          transactionId: response.transactionId,
        };
      }

      // Log transaction to database
      await this.logTransaction({
        transactionType: 'employee',
        requestPayload: sandataEmployee,
        responsePayload: response.data,
        status: 'accepted',
        httpStatusCode: response.statusCode,
        userId: user.id,
        organizationId: user.organizationId,
        transactionId: response.transactionId,
      });

      // Update database with Sandata ID
      if (response.data?.employeeId) {
        await this.updateUserSandataId(user.id, response.data.employeeId);
      }

      return {
        success: true,
        userId: user.id,
        sandataEmployeeId: response.data?.employeeId,
        action: isUpdate ? 'updated' : 'created',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        userId: user.id,
        action: 'created',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Sync multiple employees in batch
   */
  async syncEmployees(
    users: Array<{ user: DatabaseUser; certifications: DatabaseCertification[] }>,
    options: EmployeeSyncOptions = {}
  ): Promise<EmployeeSyncResult[]> {
    const results: EmployeeSyncResult[] = [];

    // Process sequentially to avoid rate limiting
    for (const { user, certifications } of users) {
      const result = await this.syncEmployee(user, certifications, options);
      results.push(result);

      // Add delay to avoid rate limiting (250ms = 4 requests/sec)
      await this.delay(250);
    }

    return results;
  }

  /**
   * Get sync status for an employee
   */
  async getSyncStatus(userId: string): Promise<{
    isSynced: boolean;
    sandataEmployeeId?: string | null;
    lastSyncAt?: Date | null;
    syncErrors?: string[];
  }> {
    // Would query database for user and last transaction
    // Placeholder implementation
    return {
      isSynced: false,
      sandataEmployeeId: null,
      lastSyncAt: null,
    };
  }

  /**
   * Retrieve employee from Sandata by ID
   */
  async getEmployee(sandataEmployeeId: string): Promise<SandataApiResponse<SandataEmployee>> {
    return await this.client.get<SandataEmployee>(
      `${SANDATA_ENDPOINTS.employees}/${sandataEmployeeId}`
    );
  }

  /**
   * Search for employees in Sandata
   */
  async searchEmployees(criteria: {
    lastName?: string;
    firstName?: string;
    dateOfBirth?: string;
  }): Promise<SandataApiResponse<SandataEmployee[]>> {
    const queryParams = new URLSearchParams(
      Object.entries(criteria).filter(([_, v]) => v != null) as [string, string][]
    );

    return await this.client.get<SandataEmployee[]>(
      `${SANDATA_ENDPOINTS.employees}?${queryParams.toString()}`
    );
  }

  /**
   * Deactivate employee in Sandata
   */
  async deactivateEmployee(sandataEmployeeId: string): Promise<EmployeeSyncResult> {
    try {
      const response = await this.client.put<SandataEmployeeResponse>(
        `${SANDATA_ENDPOINTS.employees}/${sandataEmployeeId}`,
        {
          employee: {
            employeeId: sandataEmployeeId,
            status: 'inactive',
            terminationDate: new Date().toISOString().split('T')[0],
          },
        }
      );

      return {
        success: response.success,
        userId: sandataEmployeeId,
        sandataEmployeeId,
        action: 'updated',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        userId: sandataEmployeeId,
        action: 'updated',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Update employee certifications
   */
  async updateCertifications(
    sandataEmployeeId: string,
    certifications: DatabaseCertification[]
  ): Promise<EmployeeSyncResult> {
    try {
      const sandataCertifications = certifications.map((cert) =>
        this.mapCertificationToSandata(cert)
      );

      const response = await this.client.put<SandataEmployeeResponse>(
        `${SANDATA_ENDPOINTS.employees}/${sandataEmployeeId}`,
        {
          employee: {
            employeeId: sandataEmployeeId,
            certifications: sandataCertifications,
          },
        }
      );

      return {
        success: response.success,
        userId: sandataEmployeeId,
        sandataEmployeeId,
        action: 'updated',
        transactionId: response.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        userId: sandataEmployeeId,
        action: 'updated',
        errors: [this.getErrorMessage(error)],
      };
    }
  }

  /**
   * Check if user role is caregiver
   */
  private isCaregiverRole(role: string): boolean {
    const caregiverRoles = ['caregiver', 'aide', 'nurse', 'cna', 'hha', 'pca'];
    return caregiverRoles.includes(role.toLowerCase());
  }

  /**
   * Map database user to Sandata employee format
   */
  private async mapUserToSandataEmployee(
    user: DatabaseUser,
    certifications: DatabaseCertification[]
  ): Promise<SandataEmployee> {
    const employee: SandataEmployee = {
      providerId: await this.getProviderId(user.organizationId),
      lastName: user.lastName,
      firstName: user.firstName,
      dateOfBirth: user.dateOfBirth ? this.formatDate(user.dateOfBirth) : '',
      status: user.status === 'active' ? 'active' : 'inactive',
      externalId: user.id, // Our UUID for reference
    };

    // Add optional fields if present
    if (user.addressLine1 && user.city && user.state && user.zipCode) {
      employee.address = {
        street1: user.addressLine1,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
      };
    }

    if (user.phoneNumber) {
      employee.phoneNumber = user.phoneNumber;
    }

    if (user.email) {
      employee.email = user.email;
    }

    if (user.hireDate) {
      employee.hireDate = this.formatDate(user.hireDate);
    }

    if (user.terminationDate) {
      employee.terminationDate = this.formatDate(user.terminationDate);
    }

    // Handle SSN (Decrypt securely)
    if (user.ssnEncrypted) {
      try {
        const decryptedSSN = await this.repository.decryptSSN(user.ssnEncrypted);
        if (decryptedSSN) {
          employee.socialSecurityNumber = decryptedSSN;
          // Note: We avoid logging this field in any logs
        }
      } catch (error) {
        console.error('Failed to decrypt SSN for user', user.id);
        // We do not stop the process but validation will fail if SSN is required
      }
    }

    // Add certifications
    if (certifications.length > 0) {
      employee.certifications = certifications
        .filter((cert) => cert.status === 'active')
        .map((cert) => this.mapCertificationToSandata(cert));
    }

    // Add Sandata ID if updating
    if (user.sandataEmployeeId) {
      employee.employeeId = user.sandataEmployeeId;
    }

    return employee;
  }

  /**
   * Map certification to Sandata format
   */
  private mapCertificationToSandata(cert: DatabaseCertification): SandataEmployeeCertification {
    return {
      certificationType: cert.certificationType,
      certificationNumber: cert.certificationNumber,
      issuingAuthority: cert.issuingAuthority,
      issueDate: this.formatDate(cert.issueDate),
      expirationDate: this.formatDate(cert.expirationDate),
    };
  }

  /**
   * Validate employee data before submission
   */
  private validateEmployee(employee: SandataEmployee): string[] {
    const errors: string[] = [];

    // Required fields
    if (!employee.providerId) errors.push('Provider ID is required');
    if (!employee.lastName) errors.push('Last name is required');
    if (!employee.firstName) errors.push('First name is required');
    if (!employee.firstName) errors.push('First name is required');
    if (!employee.dateOfBirth) errors.push('Date of birth is required');
    if (!employee.socialSecurityNumber) errors.push('Social Security Number is required for EVV compliance');

    // Date format validation
    if (employee.dateOfBirth && !this.isValidDate(employee.dateOfBirth)) {
      errors.push('Invalid date of birth format (expected YYYY-MM-DD)');
    }

    if (employee.hireDate && !this.isValidDate(employee.hireDate)) {
      errors.push('Invalid hire date format (expected YYYY-MM-DD)');
    }

    // Age validation (must be 18+ to work)
    if (employee.dateOfBirth) {
      const age = this.calculateAge(employee.dateOfBirth);
      if (age < 18) {
        errors.push('Employee must be 18 or older');
      }
    }

    // Certification validation
    if (employee.certifications) {
      employee.certifications.forEach((cert, index) => {
        if (!cert.certificationType) {
          errors.push(`Certification ${index + 1}: Type is required`);
        }
        if (!cert.certificationNumber) {
          errors.push(`Certification ${index + 1}: Number is required`);
        }
        if (!cert.expirationDate) {
          errors.push(`Certification ${index + 1}: Expiration date is required`);
        } else if (new Date(cert.expirationDate) < new Date()) {
          errors.push(`Certification ${index + 1}: Expired`);
        }
      });
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
    userId: string;
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
   * Update user with Sandata ID
   */
  private async updateUserSandataId(userId: string, sandataId: string): Promise<void> {
    await this.repository.updateUserSandataId(userId, sandataId);
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
let employeesServiceInstance: SandataEmployeesService | null = null;

/**
 * Get Sandata Employees Service singleton
 */
export function getSandataEmployeesService(): SandataEmployeesService {
  if (!employeesServiceInstance) {
    employeesServiceInstance = new SandataEmployeesService();
  }
  return employeesServiceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetSandataEmployeesService(): void {
  employeesServiceInstance = null;
}

export default SandataEmployeesService;
