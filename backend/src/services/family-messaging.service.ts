/**
 * Family Messaging Service
 * Secure messaging between family members and care team
 *
 * Phase 3, Months 9-10 - Family Portal
 */

import { getDbClient } from '../database/client';

interface CreateConversationData {
  clientId: string;
  subject?: string;
  conversationType?: string;
  priority?: string;
  initialMessage: string;
  familyMemberId: string;
}

interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: string;
  attachments?: any[];
  metadata?: any;
}

interface ConversationFilters {
  status?: string;
  conversationType?: string;
  priority?: string;
}

export class FamilyMessagingService {
  // ============================================
  // CONVERSATIONS
  // ============================================

  /**
   * Create a new conversation (family-initiated)
   */
  async createConversation(
    organizationId: string,
    data: CreateConversationData
  ): Promise<any> {
    const db = await getDbClient();

    // Create conversation
    const convResult = await db.query(
      `
      INSERT INTO family_conversations (
        organization_id, client_id,
        subject, conversation_type, priority,
        family_member_ids, status,
        last_message_at, last_message_by_family
      ) VALUES ($1, $2, $3, $4, $5, $6, 'open', NOW(), TRUE)
      RETURNING *
    `,
      [
        organizationId,
        data.clientId,
        data.subject || 'New Message',
        data.conversationType || 'general',
        data.priority || 'normal',
        JSON.stringify([data.familyMemberId]),
      ]
    );

    const conversation = convResult.rows[0];

    // Add initial message
    await db.query(
      `
      INSERT INTO family_messages (
        conversation_id, family_member_id,
        message_type, content
      ) VALUES ($1, $2, 'text', $3)
    `,
      [conversation.id, data.familyMemberId, data.initialMessage]
    );

    return conversation;
  }

  /**
   * Get conversations for a family member
   */
  async getFamilyConversations(
    familyMemberId: string,
    clientId: string,
    filters: ConversationFilters = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        fc.*,
        (SELECT content FROM family_messages fm
         WHERE fm.conversation_id = fc.id
         ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM family_messages fm
         WHERE fm.conversation_id = fc.id
         ORDER BY created_at DESC LIMIT 1) AS last_message_time,
        (SELECT COUNT(*) FROM family_messages fm
         WHERE fm.conversation_id = fc.id
           AND fm.staff_user_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM family_message_reads fmr
             WHERE fmr.message_id = fm.id AND fmr.family_member_id = $1
           )) AS unread_count
      FROM family_conversations fc
      WHERE fc.client_id = $2
        AND $1 = ANY(fc.family_member_ids)
    `;

    const params: any[] = [familyMemberId, clientId];
    let paramIndex = 3;

    if (filters.status) {
      query += ` AND fc.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.conversationType) {
      query += ` AND fc.conversation_type = $${paramIndex++}`;
      params.push(filters.conversationType);
    }

    if (filters.priority) {
      query += ` AND fc.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    query += ` ORDER BY fc.last_message_at DESC NULLS LAST`;

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      conversationType: row.conversation_type,
      priority: row.priority,
      status: row.status,
      lastMessage: row.last_message
        ? row.last_message.substring(0, 100) +
          (row.last_message.length > 100 ? '...' : '')
        : null,
      lastMessageAt: row.last_message_time,
      lastMessageByFamily: row.last_message_by_family,
      unreadCount: parseInt(row.unread_count) || 0,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get conversations for staff (console view)
   */
  async getStaffConversations(
    organizationId: string,
    filters: ConversationFilters & { clientId?: string } = {}
  ): Promise<any[]> {
    const db = await getDbClient();

    let query = `
      SELECT
        fc.*,
        c.first_name || ' ' || c.last_name AS client_name,
        (SELECT content FROM family_messages fm
         WHERE fm.conversation_id = fc.id
         ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT
           CASE
             WHEN fm.family_member_id IS NOT NULL
             THEN (SELECT first_name || ' ' || last_name FROM family_members WHERE id = fm.family_member_id)
             ELSE (SELECT first_name || ' ' || last_name FROM users WHERE id = fm.staff_user_id)
           END
         FROM family_messages fm
         WHERE fm.conversation_id = fc.id
         ORDER BY created_at DESC LIMIT 1) AS last_message_by,
        (SELECT COUNT(*) FROM family_messages fm
         WHERE fm.conversation_id = fc.id
           AND fm.family_member_id IS NOT NULL
           AND fc.last_message_by_family = TRUE) AS needs_response
      FROM family_conversations fc
      JOIN clients c ON c.id = fc.client_id
      WHERE fc.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.clientId) {
      query += ` AND fc.client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }

    if (filters.status) {
      query += ` AND fc.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.conversationType) {
      query += ` AND fc.conversation_type = $${paramIndex++}`;
      params.push(filters.conversationType);
    }

    if (filters.priority) {
      query += ` AND fc.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    query += ` ORDER BY
      CASE WHEN fc.status = 'open' AND fc.last_message_by_family = TRUE THEN 0 ELSE 1 END,
      fc.last_message_at DESC NULLS LAST`;

    const result = await db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      subject: row.subject,
      conversationType: row.conversation_type,
      priority: row.priority,
      status: row.status,
      lastMessage: row.last_message
        ? row.last_message.substring(0, 100) +
          (row.last_message.length > 100 ? '...' : '')
        : null,
      lastMessageBy: row.last_message_by,
      lastMessageAt: row.last_message_at,
      lastMessageByFamily: row.last_message_by_family,
      needsResponse: row.last_message_by_family && row.status === 'open',
      createdAt: row.created_at,
    }));
  }

  /**
   * Get conversation with messages
   */
  async getConversation(
    conversationId: string,
    viewerId: string,
    isStaff: boolean
  ): Promise<any | null> {
    const db = await getDbClient();

    // Get conversation
    const convResult = await db.query(
      `
      SELECT
        fc.*,
        c.first_name || ' ' || c.last_name AS client_name
      FROM family_conversations fc
      JOIN clients c ON c.id = fc.client_id
      WHERE fc.id = $1
    `,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      return null;
    }

    const conversation = convResult.rows[0];

    // Verify access
    if (!isStaff && !conversation.family_member_ids.includes(viewerId)) {
      return null;
    }

    // Get messages
    const messagesResult = await db.query(
      `
      SELECT
        fm.*,
        fam.first_name || ' ' || fam.last_name AS family_member_name,
        u.first_name || ' ' || u.last_name AS staff_name
      FROM family_messages fm
      LEFT JOIN family_members fam ON fam.id = fm.family_member_id
      LEFT JOIN users u ON u.id = fm.staff_user_id
      WHERE fm.conversation_id = $1
        AND fm.is_deleted = FALSE
      ORDER BY fm.created_at
    `,
      [conversationId]
    );

    // Mark messages as read
    if (isStaff) {
      await db.query(
        `
        INSERT INTO family_message_reads (message_id, staff_user_id)
        SELECT fm.id, $2
        FROM family_messages fm
        WHERE fm.conversation_id = $1
          AND fm.family_member_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM family_message_reads fmr
            WHERE fmr.message_id = fm.id AND fmr.staff_user_id = $2
          )
      `,
        [conversationId, viewerId]
      );
    } else {
      await db.query(
        `
        INSERT INTO family_message_reads (message_id, family_member_id)
        SELECT fm.id, $2
        FROM family_messages fm
        WHERE fm.conversation_id = $1
          AND fm.staff_user_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM family_message_reads fmr
            WHERE fmr.message_id = fm.id AND fmr.family_member_id = $2
          )
      `,
        [conversationId, viewerId]
      );
    }

    return {
      id: conversation.id,
      clientId: conversation.client_id,
      clientName: conversation.client_name,
      subject: conversation.subject,
      conversationType: conversation.conversation_type,
      priority: conversation.priority,
      status: conversation.status,
      resolvedAt: conversation.resolved_at,
      createdAt: conversation.created_at,
      messages: messagesResult.rows.map((msg) => ({
        id: msg.id,
        messageType: msg.message_type,
        content: msg.content,
        attachments: msg.attachments,
        isEdited: msg.is_edited,
        sender: msg.family_member_id
          ? {
              type: 'family',
              id: msg.family_member_id,
              name: msg.family_member_name,
            }
          : {
              type: 'staff',
              id: msg.staff_user_id,
              name: msg.staff_name,
            },
        createdAt: msg.created_at,
      })),
    };
  }

  /**
   * Send a message (family member)
   */
  async sendFamilyMessage(
    familyMemberId: string,
    data: SendMessageData
  ): Promise<any> {
    const db = await getDbClient();

    // Verify family member has access to conversation
    const convCheck = await db.query(
      `SELECT id FROM family_conversations WHERE id = $1 AND $2 = ANY(family_member_ids)`,
      [data.conversationId, familyMemberId]
    );

    if (convCheck.rows.length === 0) {
      throw new Error('Conversation not found');
    }

    // Insert message
    const result = await db.query(
      `
      INSERT INTO family_messages (
        conversation_id, family_member_id,
        message_type, content, attachments, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        data.conversationId,
        familyMemberId,
        data.messageType || 'text',
        data.content,
        JSON.stringify(data.attachments || []),
        JSON.stringify(data.metadata || {}),
      ]
    );

    // Update conversation
    await db.query(
      `
      UPDATE family_conversations
      SET last_message_at = NOW(),
          last_message_by_family = TRUE,
          status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END,
          updated_at = NOW()
      WHERE id = $1
    `,
      [data.conversationId]
    );

    // TODO: Send notification to staff

    return result.rows[0];
  }

  /**
   * Send a message (staff)
   */
  async sendStaffMessage(
    staffUserId: string,
    organizationId: string,
    data: SendMessageData
  ): Promise<any> {
    const db = await getDbClient();

    // Verify conversation belongs to organization
    const convCheck = await db.query(
      `SELECT id, family_member_ids FROM family_conversations WHERE id = $1 AND organization_id = $2`,
      [data.conversationId, organizationId]
    );

    if (convCheck.rows.length === 0) {
      throw new Error('Conversation not found');
    }

    // Insert message
    const result = await db.query(
      `
      INSERT INTO family_messages (
        conversation_id, staff_user_id,
        message_type, content, attachments, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        data.conversationId,
        staffUserId,
        data.messageType || 'text',
        data.content,
        JSON.stringify(data.attachments || []),
        JSON.stringify(data.metadata || {}),
      ]
    );

    // Update conversation
    await db.query(
      `
      UPDATE family_conversations
      SET last_message_at = NOW(),
          last_message_by_family = FALSE,
          staff_user_ids = CASE
            WHEN NOT $2 = ANY(staff_user_ids)
            THEN array_append(staff_user_ids, $2)
            ELSE staff_user_ids
          END,
          updated_at = NOW()
      WHERE id = $1
    `,
      [data.conversationId, staffUserId]
    );

    // Queue notifications for family members
    const familyMemberIds = convCheck.rows[0].family_member_ids;
    for (const fmId of familyMemberIds) {
      await db.query(
        `
        INSERT INTO family_notifications (
          family_member_id,
          notification_type, title, body, data,
          send_push, send_email
        ) VALUES ($1, 'new_message', 'New Message', $2, $3, TRUE, FALSE)
      `,
        [
          fmId,
          `You have a new message from the care team.`,
          JSON.stringify({ conversationId: data.conversationId }),
        ]
      );
    }

    return result.rows[0];
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(
    conversationId: string,
    organizationId: string,
    status: string,
    resolvedBy?: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE family_conversations
      SET status = $1,
          resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
          resolved_by = CASE WHEN $1 = 'resolved' THEN $3 ELSE resolved_by END,
          updated_at = NOW()
      WHERE id = $2 AND organization_id = $4
      RETURNING *
    `,
      [status, conversationId, resolvedBy || null, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update conversation priority
   */
  async updateConversationPriority(
    conversationId: string,
    organizationId: string,
    priority: string
  ): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      UPDATE family_conversations
      SET priority = $1, updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [priority, conversationId, organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get messaging stats for dashboard
   */
  async getMessagingStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM family_conversations
         WHERE organization_id = $1 AND status = 'open') AS open_conversations,
        (SELECT COUNT(*) FROM family_conversations
         WHERE organization_id = $1
           AND status = 'open'
           AND last_message_by_family = TRUE) AS awaiting_response,
        (SELECT COUNT(*) FROM family_conversations
         WHERE organization_id = $1
           AND priority IN ('high', 'urgent')
           AND status = 'open') AS high_priority,
        (SELECT COUNT(*) FROM family_conversations
         WHERE organization_id = $1
           AND created_at >= NOW() - INTERVAL '24 hours') AS new_today,
        (SELECT AVG(EXTRACT(EPOCH FROM (
           COALESCE(resolved_at, NOW()) - created_at
         )) / 3600) FROM family_conversations
         WHERE organization_id = $1
           AND status = 'resolved'
           AND resolved_at >= NOW() - INTERVAL '30 days') AS avg_resolution_hours
    `,
      [organizationId]
    );

    const row = result.rows[0];

    return {
      openConversations: parseInt(row.open_conversations) || 0,
      awaitingResponse: parseInt(row.awaiting_response) || 0,
      highPriority: parseInt(row.high_priority) || 0,
      newToday: parseInt(row.new_today) || 0,
      avgResolutionHours: parseFloat(row.avg_resolution_hours) || 0,
    };
  }

  /**
   * Get unread message count for family member
   */
  async getFamilyUnreadCount(
    familyMemberId: string,
    clientId: string
  ): Promise<number> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM family_messages fm
      JOIN family_conversations fc ON fc.id = fm.conversation_id
      WHERE fc.client_id = $2
        AND $1 = ANY(fc.family_member_ids)
        AND fm.staff_user_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM family_message_reads fmr
          WHERE fmr.message_id = fm.id AND fmr.family_member_id = $1
        )
    `,
      [familyMemberId, clientId]
    );

    return parseInt(result.rows[0]?.count) || 0;
  }
}

export const familyMessagingService = new FamilyMessagingService();
