-- Public Applicants Table for Career Applications
-- Simplified version that works for public website submissions

-- Create applicants table if not exists (safe migration - no DROP)
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Personal information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  date_of_birth DATE,

  -- Application details
  position_applied_for VARCHAR(100) NOT NULL,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(50) NOT NULL DEFAULT 'website',
  referred_by UUID,

  -- Resume and qualifications
  resume_file_id UUID,
  cover_letter_file_id UUID,
  parsed_resume_data JSONB,
  experience_level VARCHAR(20) NOT NULL DEFAULT 'entry',
  certifications TEXT[],
  skills TEXT[],

  -- Availability
  availability JSONB,
  desired_salary_min DECIMAL(10,2),
  desired_salary_max DECIMAL(10,2),
  available_start_date DATE,

  -- Screening results
  ai_screening_score INTEGER,
  ai_screening_notes TEXT,
  background_check_status VARCHAR(20) DEFAULT 'not_started',
  reference_check_status VARCHAR(20) DEFAULT 'not_started',

  -- Application status
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  current_stage VARCHAR(20) NOT NULL DEFAULT 'application',

  -- Decision tracking
  hired_date DATE,
  hired_as_employee_id UUID,
  rejection_reason TEXT,
  rejection_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Indexes for performance
CREATE INDEX idx_applicants_organization ON applicants(organization_id);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_stage ON applicants(current_stage);
CREATE INDEX idx_applicants_application_date ON applicants(application_date);
CREATE INDEX idx_applicants_position ON applicants(position_applied_for);
CREATE INDEX idx_applicants_email ON applicants(email);
