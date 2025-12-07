-- Migration: Create care_notes table
-- Description: Stores daily care notes from caregivers for AI analysis

CREATE TABLE IF NOT EXISTS care_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id), -- Assuming patients are in users table or separate clients table. Using users for now based on previous context.
    caregiver_id UUID NOT NULL REFERENCES users(id),
    visit_id UUID, -- Optional link to a specific visit/shift
    content TEXT NOT NULL,
    sentiment_score DECIMAL(5, 2), -- AI Analysis result
    risk_score DECIMAL(5, 2),      -- AI Analysis result
    flags TEXT[],                  -- AI Detected flags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_care_notes_patient_date ON care_notes(patient_id, created_at);
CREATE INDEX idx_care_notes_risk_score ON care_notes(risk_score);
