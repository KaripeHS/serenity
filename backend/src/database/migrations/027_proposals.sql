CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, pending_approval, approved, sent, rejected
    care_configuration JSONB NOT NULL, -- Stores the selected care tiers and hours
    total_weekly_cost DECIMAL(10, 2) NOT NULL,
    created_by UUID, -- Ideally references users table, nullable for now if auth not fully strict
    approved_by UUID, -- References users table
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX idx_proposals_status ON proposals(status);

TRIGGER_UPDATE_TIMESTAMP(proposals);
