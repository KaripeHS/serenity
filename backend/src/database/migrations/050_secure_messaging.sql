-- Migration: Secure Messaging System
-- Description: Adds tables for conversations and messages between users.

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'direct', -- 'direct', 'group', 'broadcast'
    participants UUID[] NOT NULL, -- Array of User IDs involved
    participant_data JSONB DEFAULT '{}', -- Store metadata like { "userId": { "lastRead": "timestamp" } }
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Attachments, message type
    read_by UUID[], -- Array of user IDs who have read this message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 3. RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they are participants in
CREATE POLICY conversations_participant_access ON conversations
    USING (
        auth.uid() = ANY(participants)
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin') -- Admins might see all org convos
            AND u.organization_id = conversations.organization_id
        )
    );

-- Messages: Users can see messages in conversations they are part of
CREATE POLICY messages_participant_access ON messages
    USING (
        conversation_id IN (
            SELECT id FROM conversations
            WHERE auth.uid() = ANY(participants)
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
            AND u.organization_id = (SELECT organization_id FROM conversations WHERE id = messages.conversation_id)
        )
    );
