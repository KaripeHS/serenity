-- Migration: Create tables for SPI (Service Performance Index)
-- Description: Stores performance metrics, feedback, and training data

-- 1. SPI Snapshots (Monthly Scores)
CREATE TABLE IF NOT EXISTS spi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id),
    month DATE NOT NULL, -- First day of the month
    overall_score INTEGER NOT NULL,
    attendance_score INTEGER NOT NULL,
    quality_score INTEGER NOT NULL,
    documentation_score INTEGER NOT NULL,
    collaboration_score INTEGER NOT NULL,
    learning_score INTEGER NOT NULL,
    earned_ot_eligible BOOLEAN DEFAULT FALSE,
    tier VARCHAR(50) NOT NULL, -- exceptional, good, needs_improvement, probation
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(caregiver_id, month)
);

CREATE INDEX idx_spi_caregiver_month ON spi_snapshots(caregiver_id, month);

-- 2. Family Feedback (Quality Component)
CREATE TABLE IF NOT EXISTS family_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id),
    client_id UUID NOT NULL REFERENCES users(id), -- Assuming clients are users
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) NOT NULL, -- positive, complaint, neutral
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_caregiver_date ON family_feedback(caregiver_id, created_at);

-- 3. Peer Feedback (Collaboration Component)
CREATE TABLE IF NOT EXISTS peer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id), -- Recipient
    submitted_by UUID NOT NULL REFERENCES users(id), -- Author
    feedback_type VARCHAR(50) NOT NULL, -- positive, negative
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Meeting Attendance (Collaboration Component)
CREATE TABLE IF NOT EXISTS meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id),
    meeting_date DATE NOT NULL,
    meeting_type VARCHAR(100),
    attended BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Training Assignments (Learning Component)
CREATE TABLE IF NOT EXISTS training_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- required, optional
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_caregiver ON training_assignments(caregiver_id);

-- 6. Credentials (Learning Component)
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    expiration_date DATE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
