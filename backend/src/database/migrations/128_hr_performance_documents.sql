-- Migration: 128_hr_performance_documents
-- Description: Add tables for performance reviews and employee documents
-- Created: 2026-01-02

-- Performance Reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    review_type VARCHAR(50) NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_date DATE NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    categories JSONB,
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    employee_comments TEXT,
    follow_up_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_user ON performance_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_org ON performance_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_date ON performance_reviews(review_date DESC);

-- Employee Documents table
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expiration_date DATE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_user ON employee_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_org ON employee_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_category ON employee_documents(category);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiration ON employee_documents(expiration_date) WHERE expiration_date IS NOT NULL;

-- Disciplinary Actions table (for recording warnings, write-ups, etc.)
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    action_date DATE NOT NULL,
    reason_category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    witness_name VARCHAR(255),
    follow_up_date DATE,
    employee_acknowledged BOOLEAN DEFAULT FALSE,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_user ON disciplinary_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_org ON disciplinary_actions(organization_id);

-- Leave Requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    expected_return_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    reason TEXT NOT NULL,
    documentation_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    coverage_arranged BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_org ON leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Terminations table
CREATE TABLE IF NOT EXISTS terminations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    termination_type VARCHAR(50) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    last_work_day DATE NOT NULL,
    effective_date DATE NOT NULL,
    exit_interview_scheduled BOOLEAN DEFAULT FALSE,
    exit_interview_date DATE,
    equipment_returned BOOLEAN DEFAULT FALSE,
    equipment_notes TEXT,
    access_revoked BOOLEAN DEFAULT FALSE,
    final_paycheck_date DATE,
    cobra_notification_sent BOOLEAN DEFAULT FALSE,
    benefits_end_date DATE,
    rehire_eligible BOOLEAN DEFAULT TRUE,
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terminations_user ON terminations(user_id);
CREATE INDEX IF NOT EXISTS idx_terminations_org ON terminations(organization_id);

-- Comments
COMMENT ON TABLE performance_reviews IS 'Employee performance review records';
COMMENT ON TABLE employee_documents IS 'Employee document storage (W-4, I-9, certifications, etc.)';
COMMENT ON TABLE disciplinary_actions IS 'Employee disciplinary action records';
COMMENT ON TABLE leave_requests IS 'Employee leave of absence requests';
COMMENT ON TABLE terminations IS 'Employee termination records and offboarding details';
