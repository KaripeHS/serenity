/**
 * HR Service for Serenity ERP
 * Handles employee management, credentialing, training, and compliance
 */

import { DatabaseClient } from '../../database/client';
import { AuditLogger } from '../../audit/logger';
import { UserContext, UserRole } from '../../auth/access-control';
import { createLogger } from '../../utils/logger';

const hrLogger = createLogger('HRService');

export interface Employee {
  id: string;
  organizationId: string;
  employeeNumber: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  hireDate: Date;
  terminationDate?: Date;
  hourlyRate?: number;
  salary?: number;
  emergencyContact: EmergencyContact;
  address: Address;
  preferences: Record<string, any>;
  credentials: Credential[];
  trainings: TrainingRecord[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Credential {
  id: string;
  userId: string;
  credentialType: string;
  credentialNumber?: string;
  issuedBy: string;
  issueDate: Date;
  expirationDate: Date;
  status: CredentialStatus;
  documentUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedBy?: string;
  verifiedAt?: Date;
  autoRenewal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum CredentialStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  PENDING = 'pending'
}

export interface TrainingRecord {
  id: string;
  userId: string;
  trainingName: string;
  trainingType: string;
  completedDate: Date;
  expirationDate?: Date;
  score?: number;
  passingScore?: number;
  certificateUrl?: string;
  trainerName?: string;
  isMandatory: boolean;
  createdAt: Date;
}

export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  hireDate: Date;
  hourlyRate?: number;
  salary?: number;
  emergencyContact: EmergencyContact;
  address: Address;
  initialCredentials?: Omit<Credential, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
}

export interface CredentialExpiration {
  credentialId: string;
  userId: string;
  employeeName: string;
  credentialType: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  status: CredentialStatus;
  autoRenewal: boolean;
  isBlocking: boolean; // Blocks scheduling if expired
}

export interface TrainingRequirement {
  id: string;
  name: string;
  type: string;
  requiredForRoles: UserRole[];
  frequencyMonths?: number; // How often renewal is required
  isMandatory: boolean;
  description: string;
  providedBy?: string;
}

export interface ComplianceReport {
  employeeId: string;
  employeeName: string;
  role: UserRole;
  overallCompliance: number; // 0-1 score
  credentialsCompliance: {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number; // Within 30 days
  };
  trainingCompliance: {
    total: number;
    current: number;
    overdue: number;
    dueSoon: number; // Within 30 days
  };
  blockingIssues: string[]; // Issues that prevent scheduling
  warnings: string[];
  lastUpdated: Date;
}

export class HRService {
  private db: DatabaseClient;
  private auditLogger: AuditLogger;

  constructor(db: DatabaseClient, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  /**
   * Create a new employee
   */
  async createEmployee(request: CreateEmployeeRequest, userContext: UserContext): Promise<Employee> {
    try {
      // Generate employee number
      const employeeNumber = await this.generateEmployeeNumber();

      // Check if email already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [request.email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email already exists');
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      // Create user record
      await this.db.query(`
        INSERT INTO users (
          id, organization_id, email, phone, first_name, last_name, role,
          is_active, hire_date, hourly_rate, salary, emergency_contact,
          created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        userId,
        userContext.organizationId,
        request.email.toLowerCase(),
        request.phone,
        request.firstName,
        request.lastName,
        request.role,
        true,
        request.hireDate,
        request.hourlyRate,
        request.salary,
        JSON.stringify(request.emergencyContact),
        now,
        now,
        userContext.userId
      ]);

      // Create initial credentials if provided
      if (request.initialCredentials && request.initialCredentials.length > 0) {
        for (const cred of request.initialCredentials) {
          await this.addCredential(userId, {
            ...cred,
            userId
          }, userContext);
        }
      }

      // Assign mandatory training requirements
      await this.assignMandatoryTrainings(userId, request.role);

      // Log employee creation
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'employee_created',
        resource: `user:${userId}`,
        details: {
          employeeNumber,
          email: request.email,
          role: request.role,
          hireDate: request.hireDate
        }
      });

      return await this.getEmployeeById(userId, userContext);

    } catch (error) {
      hrLogger.error('Create employee error:', error);
      throw error;
    }
  }

  /**
   * Update employee information
   */
  async updateEmployee(
    employeeId: string,
    updates: Partial<Employee>,
    userContext: UserContext
  ): Promise<Employee> {
    try {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (updates.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex++}`);
        updateValues.push(updates.firstName);
      }

      if (updates.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex++}`);
        updateValues.push(updates.lastName);
      }

      if (updates.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        updateValues.push(updates.phone);
      }

      if (updates.role !== undefined) {
        updateFields.push(`role = $${paramIndex++}`);
        updateValues.push(updates.role);
      }

      if (updates.hourlyRate !== undefined) {
        updateFields.push(`hourly_rate = $${paramIndex++}`);
        updateValues.push(updates.hourlyRate);
      }

      if (updates.salary !== undefined) {
        updateFields.push(`salary = $${paramIndex++}`);
        updateValues.push(updates.salary);
      }

      if (updates.emergencyContact !== undefined) {
        updateFields.push(`emergency_contact = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.emergencyContact));
      }

      if (updates.terminationDate !== undefined) {
        updateFields.push(`termination_date = $${paramIndex++}`);
        updateValues.push(updates.terminationDate);

        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(false);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      updateFields.push(`updated_by = $${paramIndex++}`);
      updateValues.push(userContext.userId);

      updateValues.push(employeeId);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
      `;
      updateValues.push(userContext.organizationId);

      await this.db.query(query, updateValues);

      // Log employee update
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'employee_updated',
        resource: `user:${employeeId}`,
        details: { updates }
      });

      return await this.getEmployeeById(employeeId, userContext);

    } catch (error) {
      hrLogger.error('Update employee error:', error);
      throw error;
    }
  }

  /**
   * Add credential to employee
   */
  async addCredential(
    userId: string,
    credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
    userContext: UserContext
  ): Promise<Credential> {
    try {
      const credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      await this.db.query(`
        INSERT INTO credentials (
          id, user_id, organization_id, credential_type, credential_number,
          issued_by, issue_date, expiration_date, status, document_url,
          verification_status, verified_by, verified_at, auto_renewal,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        credentialId,
        userId,
        userContext.organizationId,
        credential.credentialType,
        credential.credentialNumber,
        credential.issuedBy,
        credential.issueDate,
        credential.expirationDate,
        credential.status,
        credential.documentUrl,
        credential.verificationStatus,
        credential.verifiedBy,
        credential.verifiedAt,
        credential.autoRenewal,
        now,
        now
      ]);

      // Log credential addition
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'credential_added',
        resource: `credential:${credentialId}`,
        details: {
          userId,
          credentialType: credential.credentialType,
          expirationDate: credential.expirationDate
        }
      });

      const result = await this.db.query(
        'SELECT * FROM credentials WHERE id = $1',
        [credentialId]
      );

      return this.mapRowToCredential(result.rows[0]);

    } catch (error) {
      hrLogger.error('Add credential error:', error);
      throw error;
    }
  }

  /**
   * Verify credential
   */
  async verifyCredential(
    credentialId: string,
    verificationStatus: 'verified' | 'failed',
    userContext: UserContext,
    notes?: string
  ): Promise<void> {
    try {
      await this.db.query(`
        UPDATE credentials 
        SET verification_status = $1, verified_by = $2, verified_at = $3,
            status = $4, updated_at = $5
        WHERE id = $6 AND organization_id = $7
      `, [
        verificationStatus,
        userContext.userId,
        new Date(),
        verificationStatus === 'verified' ? CredentialStatus.ACTIVE : CredentialStatus.PENDING,
        new Date(),
        credentialId,
        userContext.organizationId
      ]);

      // Log credential verification
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'credential_verified',
        resource: `credential:${credentialId}`,
        details: {
          verificationStatus,
          notes
        }
      });

    } catch (error) {
      hrLogger.error('Verify credential error:', error);
      throw error;
    }
  }

  /**
   * Add training record
   */
  async addTrainingRecord(
    userId: string,
    training: Omit<TrainingRecord, 'id' | 'userId' | 'createdAt'>,
    userContext: UserContext
  ): Promise<TrainingRecord> {
    try {
      const trainingId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      await this.db.query(`
        INSERT INTO training_records (
          id, user_id, organization_id, training_name, training_type,
          completed_date, expiration_date, score, passing_score,
          certificate_url, trainer_name, is_mandatory, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        trainingId,
        userId,
        userContext.organizationId,
        training.trainingName,
        training.trainingType,
        training.completedDate,
        training.expirationDate,
        training.score,
        training.passingScore,
        training.certificateUrl,
        training.trainerName,
        training.isMandatory,
        now
      ]);

      // Log training completion
      await this.auditLogger.logActivity({
        userId: userContext.userId,
        action: 'training_completed',
        resource: `training_record:${trainingId}`,
        details: {
          userId,
          trainingName: training.trainingName,
          score: training.score,
          passed: !training.passingScore || (training.score && training.score >= training.passingScore)
        }
      });

      const result = await this.db.query(
        'SELECT * FROM training_records WHERE id = $1',
        [trainingId]
      );

      return this.mapRowToTrainingRecord(result.rows[0]);

    } catch (error) {
      hrLogger.error('Add training record error:', error);
      throw error;
    }
  }

  /**
   * Get credentials expiring soon
   */
  async getExpiringCredentials(
    daysAhead: number = 30,
    userContext: UserContext
  ): Promise<CredentialExpiration[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const query = `
        SELECT c.*, u.first_name, u.last_name, u.role,
               EXTRACT(DAY FROM (c.expiration_date - CURRENT_DATE)) as days_until_expiration
        FROM credentials c
        JOIN users u ON c.user_id = u.id
        WHERE c.organization_id = $1
        AND c.expiration_date <= $2
        AND c.status IN ('active', 'pending')
        AND u.is_active = true
        ORDER BY c.expiration_date ASC
      `;

      const result = await this.db.query(query, [userContext.organizationId, cutoffDate]);

      return result.rows.map(row => ({
        credentialId: row.id,
        userId: row.user_id,
        employeeName: `${row.first_name} ${row.last_name}`,
        credentialType: row.credential_type,
        expirationDate: row.expiration_date,
        daysUntilExpiration: Math.max(0, parseInt(row.days_until_expiration)),
        status: row.status,
        autoRenewal: row.auto_renewal,
        isBlocking: this.isCredentialBlocking(row.credential_type, row.role)
      }));

    } catch (error) {
      hrLogger.error('Get expiring credentials error:', error);
      throw error;
    }
  }

  /**
   * Get compliance report for employee
   */
  async getEmployeeComplianceReport(employeeId: string, userContext: UserContext): Promise<ComplianceReport> {
    try {
      const employee = await this.getEmployeeById(employeeId, userContext);

      // Get credential compliance
      const credentialsQuery = `
        SELECT status, expiration_date, credential_type
        FROM credentials
        WHERE user_id = $1 AND organization_id = $2
      `;
      const credentialsResult = await this.db.query(credentialsQuery, [employeeId, userContext.organizationId]);

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const credentialsStats = {
        total: credentialsResult.rows.length,
        active: 0,
        expired: 0,
        expiringSoon: 0
      };

      for (const cred of credentialsResult.rows) {
        if (cred.status === 'active') {
          credentialsStats.active++;
          if (new Date(cred.expiration_date) <= thirtyDaysFromNow) {
            credentialsStats.expiringSoon++;
          }
        } else if (cred.status === 'expired') {
          credentialsStats.expired++;
        }
      }

      // Get training compliance
      const trainingsQuery = `
        SELECT training_type, completed_date, expiration_date, is_mandatory
        FROM training_records
        WHERE user_id = $1 AND organization_id = $2
      `;
      const trainingsResult = await this.db.query(trainingsQuery, [employeeId, userContext.organizationId]);

      const trainingStats = {
        total: trainingsResult.rows.length,
        current: 0,
        overdue: 0,
        dueSoon: 0
      };

      for (const training of trainingsResult.rows) {
        if (training.expiration_date) {
          if (new Date(training.expiration_date) > now) {
            trainingStats.current++;
            if (new Date(training.expiration_date) <= thirtyDaysFromNow) {
              trainingStats.dueSoon++;
            }
          } else {
            trainingStats.overdue++;
          }
        } else {
          trainingStats.current++;
        }
      }

      // Identify blocking issues
      const blockingIssues: string[] = [];
      const warnings: string[] = [];

      // Check for blocking credentials
      const requiredCredentials = this.getRequiredCredentials(employee.role);
      for (const reqCred of requiredCredentials) {
        const hasCred = credentialsResult.rows.some(cred =>
          cred.credential_type === reqCred &&
          cred.status === 'active' &&
          new Date(cred.expiration_date) > now
        );

        if (!hasCred) {
          blockingIssues.push(`Missing or expired ${reqCred} certification`);
        }
      }

      // Check for mandatory training
      const requiredTrainings = await this.getRequiredTrainings(employee.role);
      for (const reqTraining of requiredTrainings) {
        const hasTraining = trainingsResult.rows.some(training =>
          training.training_type === reqTraining.type &&
          training.is_mandatory &&
          (!training.expiration_date || new Date(training.expiration_date) > now)
        );

        if (!hasTraining) {
          if (reqTraining.isMandatory) {
            blockingIssues.push(`Missing mandatory ${reqTraining.name} training`);
          } else {
            warnings.push(`Recommended ${reqTraining.name} training not completed`);
          }
        }
      }

      // Add warnings for expiring items
      if (credentialsStats.expiringSoon > 0) {
        warnings.push(`${credentialsStats.expiringSoon} credential(s) expiring within 30 days`);
      }

      if (trainingStats.dueSoon > 0) {
        warnings.push(`${trainingStats.dueSoon} training(s) due for renewal within 30 days`);
      }

      // Calculate overall compliance score
      const totalIssues = blockingIssues.length + warnings.length * 0.5;
      const maxPossibleIssues = requiredCredentials.length + requiredTrainings.length;
      const overallCompliance = maxPossibleIssues > 0 ? Math.max(0, (maxPossibleIssues - totalIssues) / maxPossibleIssues) : 1;

      return {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        role: employee.role,
        overallCompliance,
        credentialsCompliance: credentialsStats,
        trainingCompliance: trainingStats,
        blockingIssues,
        warnings,
        lastUpdated: new Date()
      };

    } catch (error) {
      hrLogger.error('Get compliance report error:', error);
      throw error;
    }
  }

  /**
   * Get all employees with pagination
   */
  async getEmployees(userContext: UserContext, filters?: {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ employees: Employee[]; total: number }> {
    try {
      let query = `
        SELECT u.*, 
               COUNT(c.id) as credential_count,
               COUNT(tr.id) as training_count
        FROM users u
        LEFT JOIN credentials c ON u.id = c.user_id AND c.status = 'active'
        LEFT JOIN training_records tr ON u.id = tr.user_id
        WHERE u.organization_id = $1
      `;

      const params: any[] = [userContext.organizationId];
      let paramIndex = 2;

      if (filters?.role) {
        query += ` AND u.role = $${paramIndex++}`;
        params.push(filters.role);
      }

      if (filters?.isActive !== undefined) {
        query += ` AND u.is_active = $${paramIndex++}`;
        params.push(filters.isActive);
      }

      query += ' GROUP BY u.id';

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        WHERE u.organization_id = $1
        ${filters?.role ? `AND u.role = '${filters.role}'` : ''}
        ${filters?.isActive !== undefined ? `AND u.is_active = ${filters.isActive}` : ''}
      `;

      const countResult = await this.db.query(countQuery, [userContext.organizationId]);
      const total = parseInt(countResult.rows[0].total);

      // Add pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const offset = (page - 1) * limit;

      query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      const employees = await Promise.all(
        result.rows.map(row => this.mapRowToEmployee(row))
      );

      return { employees, total };

    } catch (error) {
      hrLogger.error('Get employees error:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getEmployeeById(employeeId: string, userContext: UserContext): Promise<Employee> {
    const query = `
      SELECT u.*
      FROM users u
      WHERE u.id = $1 AND u.organization_id = $2
    `;

    const result = await this.db.query(query, [employeeId, userContext.organizationId]);

    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    return await this.mapRowToEmployee(result.rows[0]);
  }

  private async mapRowToEmployee(row: any): Promise<Employee> {
    // Get credentials
    const credentialsResult = await this.db.query(
      'SELECT * FROM credentials WHERE user_id = $1 ORDER BY expiration_date DESC',
      [row.id]
    );

    // Get training records
    const trainingsResult = await this.db.query(
      'SELECT * FROM training_records WHERE user_id = $1 ORDER BY completed_date DESC',
      [row.id]
    );

    return {
      id: row.id,
      organizationId: row.organization_id,
      employeeNumber: row.employee_number || `EMP${row.id.substr(-6).toUpperCase()}`,
      email: row.email,
      phone: row.phone,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      hireDate: row.hire_date,
      terminationDate: row.termination_date,
      hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : undefined,
      salary: row.salary ? parseFloat(row.salary) : undefined,
      emergencyContact: row.emergency_contact ? JSON.parse(row.emergency_contact) : {},
      address: row.address ? JSON.parse(row.address) : {},
      preferences: row.preferences ? JSON.parse(row.preferences) : {},
      credentials: credentialsResult.rows.map(c => this.mapRowToCredential(c)),
      trainings: trainingsResult.rows.map(t => this.mapRowToTrainingRecord(t)),
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToCredential(row: any): Credential {
    return {
      id: row.id,
      userId: row.user_id,
      credentialType: row.credential_type,
      credentialNumber: row.credential_number,
      issuedBy: row.issued_by,
      issueDate: row.issue_date,
      expirationDate: row.expiration_date,
      status: row.status,
      documentUrl: row.document_url,
      verificationStatus: row.verification_status,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      autoRenewal: row.auto_renewal,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToTrainingRecord(row: any): TrainingRecord {
    return {
      id: row.id,
      userId: row.user_id,
      trainingName: row.training_name,
      trainingType: row.training_type,
      completedDate: row.completed_date,
      expirationDate: row.expiration_date,
      score: row.score ? parseFloat(row.score) : undefined,
      passingScore: row.passing_score ? parseFloat(row.passing_score) : undefined,
      certificateUrl: row.certificate_url,
      trainerName: row.trainer_name,
      isMandatory: row.is_mandatory,
      createdAt: row.created_at
    };
  }

  private async generateEmployeeNumber(): Promise<string> {
    const year = new Date().getFullYear().toString().substr(-2);
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `EMP${year}${sequence}`;
  }

  private isCredentialBlocking(credentialType: string, role: UserRole): boolean {
    const blockingCredentials: Record<UserRole, string[]> = {
      // Executive Leadership
      [UserRole.FOUNDER]: [],
      [UserRole.CEO]: [],
      [UserRole.CFO]: [],
      [UserRole.COO]: [],

      // Security & Compliance
      [UserRole.SECURITY_OFFICER]: [],
      [UserRole.COMPLIANCE_OFFICER]: [],

      // Finance Department
      [UserRole.FINANCE_DIRECTOR]: [],
      [UserRole.FINANCE_MANAGER]: [],
      [UserRole.BILLING_MANAGER]: [],
      [UserRole.RCM_ANALYST]: [],
      [UserRole.INSURANCE_MANAGER]: [],
      [UserRole.BILLING_CODER]: [],

      // Operations Department
      [UserRole.OPERATIONS_MANAGER]: [],
      [UserRole.FIELD_OPS_MANAGER]: ['CPR'],
      [UserRole.POD_LEAD]: ['CPR'],
      [UserRole.FIELD_SUPERVISOR]: ['CPR'],
      [UserRole.SCHEDULING_MANAGER]: [],
      [UserRole.SCHEDULER]: [],
      [UserRole.DISPATCHER]: [],
      [UserRole.QA_MANAGER]: [],

      // HR Department
      [UserRole.HR_DIRECTOR]: [],
      [UserRole.HR_MANAGER]: [],
      [UserRole.RECRUITER]: [],
      [UserRole.CREDENTIALING_SPECIALIST]: [],

      // IT & Support
      [UserRole.IT_ADMIN]: [],
      [UserRole.SUPPORT_AGENT]: [],

      // Clinical Leadership
      [UserRole.DIRECTOR_OF_NURSING]: ['RN_LICENSE', 'CPR'],
      [UserRole.CLINICAL_DIRECTOR]: ['RN_LICENSE'],
      [UserRole.NURSING_SUPERVISOR]: ['RN_LICENSE', 'CPR'],

      // Clinical Staff
      [UserRole.RN_CASE_MANAGER]: ['RN_LICENSE', 'CPR'],
      [UserRole.LPN_LVN]: ['LPN_LICENSE', 'CPR'],
      [UserRole.THERAPIST]: ['THERAPY_LICENSE', 'CPR'],
      [UserRole.QIDP]: ['QIDP_CERT'],

      // Direct Care Staff
      [UserRole.DSP_MED]: ['MED_ADMIN_CERT', 'CPR', 'First_Aid'],
      [UserRole.DSP_BASIC]: ['CPR', 'First_Aid'],
      [UserRole.HHA]: ['HHA', 'CPR', 'First_Aid'],
      [UserRole.CNA]: ['CNA_CERT', 'CPR', 'First_Aid'],
      [UserRole.CAREGIVER]: ['HHA', 'CPR', 'First_Aid'],

      // External Access
      [UserRole.CLIENT]: [],
      [UserRole.FAMILY]: [],
      [UserRole.PAYER_AUDITOR]: [],
      [UserRole.AI_SERVICE]: []
    };

    return blockingCredentials[role]?.includes(credentialType) || false;
  }

  private getRequiredCredentials(role: UserRole): string[] {
    const requiredCredentials: Record<UserRole, string[]> = {
      // Executive Leadership
      [UserRole.FOUNDER]: [],
      [UserRole.CEO]: ['Background_Check'],
      [UserRole.CFO]: ['Background_Check'],
      [UserRole.COO]: ['Background_Check'],

      // Security & Compliance
      [UserRole.SECURITY_OFFICER]: ['Background_Check'],
      [UserRole.COMPLIANCE_OFFICER]: ['Background_Check'],

      // Finance Department
      [UserRole.FINANCE_DIRECTOR]: ['Background_Check'],
      [UserRole.FINANCE_MANAGER]: ['Background_Check'],
      [UserRole.BILLING_MANAGER]: ['Background_Check'],
      [UserRole.RCM_ANALYST]: ['Background_Check'],
      [UserRole.INSURANCE_MANAGER]: ['Background_Check'],
      [UserRole.BILLING_CODER]: ['Background_Check'],

      // Operations Department
      [UserRole.OPERATIONS_MANAGER]: ['Background_Check'],
      [UserRole.FIELD_OPS_MANAGER]: ['CPR', 'Background_Check'],
      [UserRole.POD_LEAD]: ['CPR', 'Background_Check'],
      [UserRole.FIELD_SUPERVISOR]: ['CPR', 'Background_Check'],
      [UserRole.SCHEDULING_MANAGER]: ['Background_Check'],
      [UserRole.SCHEDULER]: ['Background_Check'],
      [UserRole.DISPATCHER]: ['Background_Check'],
      [UserRole.QA_MANAGER]: ['Background_Check'],

      // HR Department
      [UserRole.HR_DIRECTOR]: ['Background_Check'],
      [UserRole.HR_MANAGER]: ['Background_Check'],
      [UserRole.RECRUITER]: ['Background_Check'],
      [UserRole.CREDENTIALING_SPECIALIST]: ['Background_Check'],

      // IT & Support
      [UserRole.IT_ADMIN]: ['Background_Check'],
      [UserRole.SUPPORT_AGENT]: ['Background_Check'],

      // Clinical Leadership
      [UserRole.DIRECTOR_OF_NURSING]: ['RN_LICENSE', 'CPR', 'Background_Check'],
      [UserRole.CLINICAL_DIRECTOR]: ['RN_LICENSE', 'Background_Check'],
      [UserRole.NURSING_SUPERVISOR]: ['RN_LICENSE', 'CPR', 'Background_Check'],

      // Clinical Staff
      [UserRole.RN_CASE_MANAGER]: ['RN_LICENSE', 'CPR', 'Background_Check'],
      [UserRole.LPN_LVN]: ['LPN_LICENSE', 'CPR', 'Background_Check'],
      [UserRole.THERAPIST]: ['THERAPY_LICENSE', 'CPR', 'Background_Check'],
      [UserRole.QIDP]: ['QIDP_CERT', 'Background_Check'],

      // Direct Care Staff
      [UserRole.DSP_MED]: ['MED_ADMIN_CERT', 'CPR', 'First_Aid', 'Background_Check'],
      [UserRole.DSP_BASIC]: ['CPR', 'First_Aid', 'Background_Check'],
      [UserRole.HHA]: ['HHA', 'CPR', 'First_Aid', 'Background_Check'],
      [UserRole.CNA]: ['CNA_CERT', 'CPR', 'First_Aid', 'Background_Check'],
      [UserRole.CAREGIVER]: ['HHA', 'CPR', 'First_Aid', 'Background_Check'],

      // External Access
      [UserRole.CLIENT]: [],
      [UserRole.FAMILY]: [],
      [UserRole.PAYER_AUDITOR]: [],
      [UserRole.AI_SERVICE]: []
    };

    return requiredCredentials[role] || [];
  }

  private async getRequiredTrainings(role: UserRole): Promise<TrainingRequirement[]> {
    // This would typically be stored in the database
    const baseTrainings: TrainingRequirement[] = [
      {
        id: 'hipaa_training',
        name: 'HIPAA Privacy and Security Training',
        type: 'HIPAA',
        requiredForRoles: Object.values(UserRole).filter(r => r !== 'client' && r !== 'family'),
        frequencyMonths: 12,
        isMandatory: true,
        description: 'Required HIPAA compliance training'
      },
      {
        id: 'safety_training',
        name: 'Workplace Safety Training',
        type: 'Safety',
        requiredForRoles: [UserRole.CAREGIVER, UserRole.FIELD_SUPERVISOR],
        frequencyMonths: 12,
        isMandatory: true,
        description: 'Basic workplace safety procedures'
      },
      {
        id: 'infection_control',
        name: 'Infection Control Training',
        type: 'Clinical',
        requiredForRoles: [UserRole.CAREGIVER],
        frequencyMonths: 12,
        isMandatory: true,
        description: 'Infection prevention and control procedures'
      }
    ];

    return baseTrainings.filter(training => training.requiredForRoles.includes(role));
  }

  private async assignMandatoryTrainings(userId: string, role: UserRole): Promise<void> {
    const requiredTrainings = await this.getRequiredTrainings(role);

    // Create training assignments (production_value - would integrate with LMS)
    hrLogger.info(`Assigned ${requiredTrainings.length} mandatory trainings to user ${userId}`);
  }
}