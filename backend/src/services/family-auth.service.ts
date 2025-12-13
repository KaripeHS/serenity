/**
 * Family Authentication Service
 * Handles family member registration, login, sessions, and password management
 *
 * Phase 3, Months 9-10 - Family Portal
 */

import { getDbClient } from '../database/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'serenity-family-portal-secret';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;

interface InviteFamilyMemberData {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;
  accessLevel?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasPoa?: boolean;
  invitedBy: string;
}

interface FamilyMemberUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneType?: string;
  relationship?: string;
  accessLevel?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasPoa?: boolean;
  notifyVisitStart?: boolean;
  notifyVisitEnd?: boolean;
  notifyScheduleChanges?: boolean;
  notifyCareUpdates?: boolean;
  notifyBilling?: boolean;
  notificationMethod?: string;
}

interface TokenPayload {
  familyMemberId: string;
  clientId: string;
  organizationId: string;
  email: string;
  accessLevel: string;
  type: 'access' | 'refresh';
}

export class FamilyAuthService {
  /**
   * Invite a family member (creates account with pending status)
   */
  async inviteFamilyMember(
    organizationId: string,
    data: InviteFamilyMemberData
  ): Promise<any> {
    const db = await getDbClient();

    // Check if email already exists for this organization
    const existing = await db.query(
      `SELECT id FROM family_members WHERE organization_id = $1 AND email = $2`,
      [organizationId, data.email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      throw new Error('A family member with this email already exists');
    }

    // Verify client belongs to organization
    const clientCheck = await db.query(
      `SELECT id FROM clients WHERE id = $1 AND organization_id = $2`,
      [data.clientId, organizationId]
    );

    if (clientCheck.rows.length === 0) {
      throw new Error('Client not found');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await db.query(
      `
      INSERT INTO family_members (
        organization_id, client_id,
        first_name, last_name, email, phone,
        relationship, access_level,
        is_primary_contact, is_emergency_contact, has_poa,
        verification_token, verification_expires,
        invited_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
      RETURNING *
    `,
      [
        organizationId,
        data.clientId,
        data.firstName,
        data.lastName,
        data.email.toLowerCase(),
        data.phone || null,
        data.relationship,
        data.accessLevel || 'basic',
        data.isPrimaryContact || false,
        data.isEmergencyContact || false,
        data.hasPoa || false,
        verificationToken,
        verificationExpires,
        data.invitedBy,
      ]
    );

    // TODO: Send invitation email with verification link

    return {
      ...result.rows[0],
      verificationToken, // Include for testing, remove in production
    };
  }

  /**
   * Complete registration (set password after email verification)
   */
  async completeRegistration(
    verificationToken: string,
    password: string
  ): Promise<any> {
    const db = await getDbClient();

    // Find member with valid token
    const memberResult = await db.query(
      `
      SELECT * FROM family_members
      WHERE verification_token = $1
        AND verification_expires > NOW()
        AND status = 'pending'
    `,
      [verificationToken]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const member = memberResult.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Update member
    const result = await db.query(
      `
      UPDATE family_members
      SET password_hash = $1,
          is_verified = TRUE,
          verification_token = NULL,
          verification_expires = NULL,
          status = 'active',
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [passwordHash, member.id]
    );

    return result.rows[0];
  }

  /**
   * Login family member
   */
  async login(
    email: string,
    password: string,
    deviceInfo?: any
  ): Promise<any> {
    const db = await getDbClient();

    // Find member by email
    const memberResult = await db.query(
      `
      SELECT fm.*, c.first_name || ' ' || c.last_name AS client_name
      FROM family_members fm
      JOIN clients c ON c.id = fm.client_id
      WHERE fm.email = $1 AND fm.status = 'active'
    `,
      [email.toLowerCase()]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const member = memberResult.rows[0];

    // Check if locked
    if (member.locked_until && new Date(member.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, member.password_hash);

    if (!isValid) {
      // Increment failed attempts
      await db.query(
        `
        UPDATE family_members
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE
              WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
              ELSE NULL
            END
        WHERE id = $1
      `,
        [member.id]
      );

      throw new Error('Invalid email or password');
    }

    // Reset failed attempts and update last login
    await db.query(
      `
      UPDATE family_members
      SET failed_login_attempts = 0,
          locked_until = NULL,
          last_login = NOW()
      WHERE id = $1
    `,
      [member.id]
    );

    // Generate tokens
    const tokens = await this.createSession(member, deviceInfo);

    return {
      member: {
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        clientId: member.client_id,
        clientName: member.client_name,
        organizationId: member.organization_id,
        accessLevel: member.access_level,
        relationship: member.relationship,
      },
      ...tokens,
    };
  }

  /**
   * Create a new session with tokens
   */
  private async createSession(
    member: any,
    deviceInfo?: any
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const db = await getDbClient();

    const payload: Omit<TokenPayload, 'type'> = {
      familyMemberId: member.id,
      clientId: member.client_id,
      organizationId: member.organization_id,
      email: member.email,
      accessLevel: member.access_level,
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    const accessExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.query(
      `
      INSERT INTO family_sessions (
        family_member_id, access_token, refresh_token,
        device_info, access_expires, refresh_expires
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        member.id,
        accessToken,
        refreshToken,
        JSON.stringify(deviceInfo || {}),
        accessExpires,
        refreshExpires,
      ]
    );

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    const db = await getDbClient();

    // Verify refresh token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find session
    const sessionResult = await db.query(
      `
      SELECT * FROM family_sessions
      WHERE refresh_token = $1
        AND is_active = TRUE
        AND refresh_expires > NOW()
    `,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found or expired');
    }

    const session = sessionResult.rows[0];

    // Get member info
    const memberResult = await db.query(
      `SELECT * FROM family_members WHERE id = $1 AND status = 'active'`,
      [session.family_member_id]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('Member not found or inactive');
    }

    const member = memberResult.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        familyMemberId: member.id,
        clientId: member.client_id,
        organizationId: member.organization_id,
        email: member.email,
        accessLevel: member.access_level,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const newAccessExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Update session
    await db.query(
      `
      UPDATE family_sessions
      SET access_token = $1, access_expires = $2
      WHERE id = $3
    `,
      [newAccessToken, newAccessExpires, session.id]
    );

    return { accessToken: newAccessToken };
  }

  /**
   * Logout (revoke session)
   */
  async logout(accessToken: string): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `
      UPDATE family_sessions
      SET is_active = FALSE, revoked_at = NOW(), revoked_reason = 'logout'
      WHERE access_token = $1
    `,
      [accessToken]
    );
  }

  /**
   * Logout all sessions for a family member
   */
  async logoutAll(familyMemberId: string): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `
      UPDATE family_sessions
      SET is_active = FALSE, revoked_at = NOW(), revoked_reason = 'logout_all'
      WHERE family_member_id = $1 AND is_active = TRUE
    `,
      [familyMemberId]
    );
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<any> {
    // Verify JWT
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(accessToken, JWT_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid token');
    }

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    const db = await getDbClient();

    // Verify session is active
    const sessionResult = await db.query(
      `
      SELECT * FROM family_sessions
      WHERE access_token = $1
        AND is_active = TRUE
        AND access_expires > NOW()
    `,
      [accessToken]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found or expired');
    }

    // Get member info
    const memberResult = await db.query(
      `
      SELECT fm.*, c.first_name || ' ' || c.last_name AS client_name
      FROM family_members fm
      JOIN clients c ON c.id = fm.client_id
      WHERE fm.id = $1 AND fm.status = 'active'
    `,
      [decoded.familyMemberId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('Member not found or inactive');
    }

    const member = memberResult.rows[0];

    return {
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      clientId: member.client_id,
      clientName: member.client_name,
      organizationId: member.organization_id,
      accessLevel: member.access_level,
      relationship: member.relationship,
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const db = await getDbClient();

    const memberResult = await db.query(
      `SELECT * FROM family_members WHERE email = $1 AND status = 'active'`,
      [email.toLowerCase()]
    );

    if (memberResult.rows.length === 0) {
      // Don't reveal if email exists
      return;
    }

    const member = memberResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      `
      UPDATE family_members
      SET reset_token = $1, reset_token_expires = $2
      WHERE id = $3
    `,
      [resetToken, resetExpires, member.id]
    );

    // TODO: Send password reset email
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const db = await getDbClient();

    const memberResult = await db.query(
      `
      SELECT * FROM family_members
      WHERE reset_token = $1
        AND reset_token_expires > NOW()
    `,
      [resetToken]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const member = memberResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await db.query(
      `
      UPDATE family_members
      SET password_hash = $1,
          reset_token = NULL,
          reset_token_expires = NULL,
          failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = NOW()
      WHERE id = $2
    `,
      [passwordHash, member.id]
    );

    // Revoke all sessions
    await this.logoutAll(member.id);
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(
    familyMemberId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const db = await getDbClient();

    const memberResult = await db.query(
      `SELECT * FROM family_members WHERE id = $1`,
      [familyMemberId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('Member not found');
    }

    const member = memberResult.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, member.password_hash);

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
      `
      UPDATE family_members
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `,
      [passwordHash, familyMemberId]
    );
  }

  // ============================================
  // FAMILY MEMBER MANAGEMENT
  // ============================================

  /**
   * Get family members for a client
   */
  async getFamilyMembers(
    clientId: string,
    organizationId: string
  ): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        fm.*,
        u.first_name || ' ' || u.last_name AS invited_by_name
      FROM family_members fm
      LEFT JOIN users u ON u.id = fm.invited_by
      WHERE fm.client_id = $1 AND fm.organization_id = $2
      ORDER BY fm.is_primary_contact DESC, fm.created_at
    `,
      [clientId, organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      phoneType: row.phone_type,
      relationship: row.relationship,
      accessLevel: row.access_level,
      isPrimaryContact: row.is_primary_contact,
      isEmergencyContact: row.is_emergency_contact,
      hasPoa: row.has_poa,
      status: row.status,
      isVerified: row.is_verified,
      lastLogin: row.last_login,
      invitedAt: row.invited_at,
      invitedBy: row.invited_by_name,
      notificationPreferences: {
        visitStart: row.notify_visit_start,
        visitEnd: row.notify_visit_end,
        scheduleChanges: row.notify_schedule_changes,
        careUpdates: row.notify_care_updates,
        billing: row.notify_billing,
        method: row.notification_method,
      },
    }));
  }

  /**
   * Get family member by ID
   */
  async getFamilyMember(
    familyMemberId: string,
    organizationId: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        fm.*,
        c.first_name || ' ' || c.last_name AS client_name
      FROM family_members fm
      JOIN clients c ON c.id = fm.client_id
      WHERE fm.id = $1 AND fm.organization_id = $2
    `,
      [familyMemberId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      phoneType: row.phone_type,
      relationship: row.relationship,
      accessLevel: row.access_level,
      isPrimaryContact: row.is_primary_contact,
      isEmergencyContact: row.is_emergency_contact,
      hasPoa: row.has_poa,
      status: row.status,
      isVerified: row.is_verified,
      lastLogin: row.last_login,
      notificationPreferences: {
        visitStart: row.notify_visit_start,
        visitEnd: row.notify_visit_end,
        scheduleChanges: row.notify_schedule_changes,
        careUpdates: row.notify_care_updates,
        billing: row.notify_billing,
        method: row.notification_method,
      },
    };
  }

  /**
   * Update family member
   */
  async updateFamilyMember(
    familyMemberId: string,
    organizationId: string,
    updates: FamilyMemberUpdate
  ): Promise<any | null> {
    const db = await getDbClient();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      phone: 'phone',
      phoneType: 'phone_type',
      relationship: 'relationship',
      accessLevel: 'access_level',
      isPrimaryContact: 'is_primary_contact',
      isEmergencyContact: 'is_emergency_contact',
      hasPoa: 'has_poa',
      notifyVisitStart: 'notify_visit_start',
      notifyVisitEnd: 'notify_visit_end',
      notifyScheduleChanges: 'notify_schedule_changes',
      notifyCareUpdates: 'notify_care_updates',
      notifyBilling: 'notify_billing',
      notificationMethod: 'notification_method',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push((updates as any)[key]);
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(familyMemberId, organizationId);

    const result = await db.query(
      `
      UPDATE family_members
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Suspend/Reactivate family member
   */
  async setFamilyMemberStatus(
    familyMemberId: string,
    organizationId: string,
    status: 'active' | 'suspended' | 'inactive'
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE family_members
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [status, familyMemberId, organizationId]
    );

    if (result.rows.length > 0 && status !== 'active') {
      // Revoke all sessions
      await this.logoutAll(familyMemberId);
    }

    return result.rows[0] || null;
  }

  /**
   * Resend invitation email
   */
  async resendInvitation(
    familyMemberId: string,
    organizationId: string
  ): Promise<void> {
    const db = await getDbClient();

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `
      UPDATE family_members
      SET verification_token = $1,
          verification_expires = $2,
          updated_at = NOW()
      WHERE id = $3 AND organization_id = $4 AND status = 'pending'
      RETURNING *
    `,
      [verificationToken, verificationExpires, familyMemberId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Family member not found or already activated');
    }

    // TODO: Send invitation email
  }
}

export const familyAuthService = new FamilyAuthService();
