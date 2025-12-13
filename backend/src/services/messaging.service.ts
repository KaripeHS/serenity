
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('messaging-service');

export class MessagingService {

    /**
     * Get all conversations for a user
     */
    async getConversations(userId: string) {
        const db = getDbClient();

        // Fetch conversations where user is a participant
        // Also fetch the last sender's name for display
        const result = await db.query(
            `SELECT 
                c.id,
                c.type,
                c.updated_at,
                c.last_message,
                c.last_message_at,
                c.participant_data,
                c.participants,
                (SELECT json_agg(json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name, 'role', u.role)) 
                 FROM users u WHERE u.id = ANY(c.participants)) as participant_details
             FROM conversations c
             WHERE $1 = ANY(c.participants)
             ORDER BY c.last_message_at DESC`,
            [userId]
        );

        return result.rows.map(row => ({
            id: row.id,
            type: row.type,
            updatedAt: row.updated_at,
            lastMessage: row.last_message,
            lastMessageAt: row.last_message_at,
            participants: row.participant_details || [],
            // Helper: Find the "other" person for 1:1 chats
            otherUser: row.participant_details.find((p: any) => p.id !== userId) || row.participant_details[0]
        }));
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId: string, userId: string) {
        const db = getDbClient();

        // Verify access first (RLS handles this in SQL usually, but good practice here too)
        // For now, simpler query:
        const result = await db.query(
            `SELECT 
                m.id,
                m.conversation_id,
                m.sender_id,
                m.content,
                m.created_at,
                m.read_at,
                u.first_name,
                u.last_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = $1
             ORDER BY m.created_at ASC`,
            [conversationId]
        );

        return result.rows.map(row => ({
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: row.created_at,
            senderName: `${row.first_name} ${row.last_name}`,
            isMe: row.sender_id === userId
        }));
    }

    /**
     * Send a message
     */
    async sendMessage(senderId: string, conversationId: string, content: string) {
        const db = getDbClient();

        try {
            await db.query('BEGIN');

            // 1. Insert Message
            const messageResult = await db.query(
                `INSERT INTO messages (conversation_id, sender_id, content)
                 VALUES ($1, $2, $3)
                 RETURNING id, created_at`,
                [conversationId, senderId, content]
            );

            // 2. Update Conversation (last_message)
            await db.query(
                `UPDATE conversations 
                 SET last_message = $1, last_message_at = NOW(), updated_at = NOW()
                 WHERE id = $2`,
                [content, conversationId]
            );

            await db.query('COMMIT');

            return {
                id: messageResult.rows[0].id,
                createdAt: messageResult.rows[0].created_at,
                content
            };
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }

    /**
     * Start a new conversation (Direct)
     */
    async createDirectConversation(initiatorId: string, recipientId: string, organizationId: string) {
        const db = getDbClient();

        // Check if exists
        const existing = await db.query(
            `SELECT id FROM conversations 
             WHERE type = 'direct' 
             AND participants @> ARRAY[$1, $2]::uuid[]
             LIMIT 1`,
            [initiatorId, recipientId]
        );

        if (existing.rows.length > 0) {
            return existing.rows[0].id;
        }

        // Create new
        const result = await db.query(
            `INSERT INTO conversations (organization_id, type, participants)
             VALUES ($1, 'direct', ARRAY[$2, $3]::uuid[])
             RETURNING id`,
            [organizationId, initiatorId, recipientId]
        );

        return result.rows[0].id;
    }
}

export const messagingService = new MessagingService();
