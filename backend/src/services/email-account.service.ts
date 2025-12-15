/**
 * Email Account Service
 * Manages organization email accounts and their configurations
 */

import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('email-account-service');

export interface EmailAccount {
  id: string;
  organizationId: string;
  emailAddress: string;
  displayName: string | null;
  description: string | null;
  purpose: string;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailAccountInput {
  emailAddress: string;
  displayName?: string;
  description?: string;
  purpose: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateEmailAccountInput {
  displayName?: string;
  description?: string;
  purpose?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

class EmailAccountService {
  private db = getDbClient();

  async getEmailAccounts(organizationId: string): Promise<EmailAccount[]> {
    const result = await this.db.query<any>(
      `SELECT
        id,
        organization_id as "organizationId",
        email_address as "emailAddress",
        display_name as "displayName",
        description,
        purpose,
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_secure as "smtpSecure",
        smtp_user as "smtpUser",
        is_active as "isActive",
        is_default as "isDefault",
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM email_accounts
      WHERE organization_id = $1
      ORDER BY is_default DESC, purpose, email_address`,
      [organizationId]
    );
    return result.rows;
  }

  async getEmailAccountById(id: string, organizationId: string): Promise<EmailAccount | null> {
    const result = await this.db.query<any>(
      `SELECT
        id,
        organization_id as "organizationId",
        email_address as "emailAddress",
        display_name as "displayName",
        description,
        purpose,
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_secure as "smtpSecure",
        smtp_user as "smtpUser",
        is_active as "isActive",
        is_default as "isDefault",
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM email_accounts
      WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async getEmailAccountByPurpose(organizationId: string, purpose: string): Promise<EmailAccount | null> {
    const result = await this.db.query<any>(
      `SELECT
        id,
        organization_id as "organizationId",
        email_address as "emailAddress",
        display_name as "displayName",
        description,
        purpose,
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_secure as "smtpSecure",
        smtp_user as "smtpUser",
        is_active as "isActive",
        is_default as "isDefault",
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM email_accounts
      WHERE organization_id = $1 AND purpose = $2 AND is_active = true
      LIMIT 1`,
      [organizationId, purpose]
    );
    return result.rows[0] || null;
  }

  async getDefaultEmailAccount(organizationId: string): Promise<EmailAccount | null> {
    const result = await this.db.query<any>(
      `SELECT
        id,
        organization_id as "organizationId",
        email_address as "emailAddress",
        display_name as "displayName",
        description,
        purpose,
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_secure as "smtpSecure",
        smtp_user as "smtpUser",
        is_active as "isActive",
        is_default as "isDefault",
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM email_accounts
      WHERE organization_id = $1 AND is_default = true AND is_active = true
      LIMIT 1`,
      [organizationId]
    );
    return result.rows[0] || null;
  }

  async createEmailAccount(
    organizationId: string,
    input: CreateEmailAccountInput,
    createdBy: string
  ): Promise<EmailAccount> {
    // If setting as default, unset any existing default
    if (input.isDefault) {
      await this.db.query(
        `UPDATE email_accounts SET is_default = false WHERE organization_id = $1 AND is_default = true`,
        [organizationId]
      );
    }

    const result = await this.db.query<any>(
      `INSERT INTO email_accounts (
        organization_id,
        email_address,
        display_name,
        description,
        purpose,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        is_active,
        is_default,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id,
        organization_id as "organizationId",
        email_address as "emailAddress",
        display_name as "displayName",
        description,
        purpose,
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_secure as "smtpSecure",
        smtp_user as "smtpUser",
        is_active as "isActive",
        is_default as "isDefault",
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [
        organizationId,
        input.emailAddress,
        input.displayName || null,
        input.description || null,
        input.purpose,
        input.smtpHost || null,
        input.smtpPort || 465,
        input.smtpSecure !== false,
        input.smtpUser || null,
        input.isActive !== false,
        input.isDefault || false,
        createdBy,
      ]
    );

    logger.info('Email account created', {
      emailAccountId: result.rows[0].id,
      emailAddress: input.emailAddress,
      purpose: input.purpose,
      createdBy,
    });

    return result.rows[0];
  }

  async updateEmailAccount(
    id: string,
    organizationId: string,
    input: UpdateEmailAccountInput
  ): Promise<EmailAccount | null> {
    // If setting as default, unset any existing default
    if (input.isDefault) {
      await this.db.query(
        `UPDATE email_accounts SET is_default = false WHERE organization_id = $1 AND is_default = true AND id != $2`,
        [organizationId, id]
      );
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.displayName !== undefined) {
      setClauses.push(`display_name = $${paramIndex++}`);
      values.push(input.displayName);
    }
    if (input.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.purpose !== undefined) {
      setClauses.push(`purpose = $${paramIndex++}`);
      values.push(input.purpose);
    }
    if (input.smtpHost !== undefined) {
      setClauses.push(`smtp_host = $${paramIndex++}`);
      values.push(input.smtpHost);
    }
    if (input.smtpPort !== undefined) {
      setClauses.push(`smtp_port = $${paramIndex++}`);
      values.push(input.smtpPort);
    }
    if (input.smtpSecure !== undefined) {
      setClauses.push(`smtp_secure = $${paramIndex++}`);
      values.push(input.smtpSecure);
    }
    if (input.smtpUser !== undefined) {
      setClauses.push(`smtp_user = $${paramIndex++}`);
      values.push(input.smtpUser);
    }
    if (input.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(input.isActive);
    }
    if (input.isDefault !== undefined) {
      setClauses.push(`is_default = $${paramIndex++}`);
      values.push(input.isDefault);
    }

    values.push(id, organizationId);

    const result = await this.db.query<any>(
      `UPDATE email_accounts
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING
        id,
        organization_id as "organizationId",
        email_address as "emailAddress",
        display_name as "displayName",
        description,
        purpose,
        smtp_host as "smtpHost",
        smtp_port as "smtpPort",
        smtp_secure as "smtpSecure",
        smtp_user as "smtpUser",
        is_active as "isActive",
        is_default as "isDefault",
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      values
    );

    if (result.rows[0]) {
      logger.info('Email account updated', { emailAccountId: id });
    }

    return result.rows[0] || null;
  }

  async deleteEmailAccount(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM email_accounts WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    if (result.rowCount && result.rowCount > 0) {
      logger.info('Email account deleted', { emailAccountId: id });
      return true;
    }
    return false;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.db.query(
      `UPDATE email_accounts SET last_used_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}

export const emailAccountService = new EmailAccountService();
