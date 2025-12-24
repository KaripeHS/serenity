-- Recruiting and Talent Management Database Schema
-- Complete system for applicant tracking, performance management, and retention

-- Applicants and recruiting pipeline
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

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
  source VARCHAR(50) NOT NULL DEFAULT 'website'
    CHECK (source IN ('website', 'referral', 'indeed', 'ziprecruiter', 'facebook', 'linkedin', 'other')),
  referred_by UUID REFERENCES users(id),

  -- Resume and qualifications
  resume_file_id UUID,
  cover_letter_file_id UUID,
  parsed_resume_data JSONB,
  experience_level VARCHAR(20) NOT NULL DEFAULT 'entry'
    CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'expert')),
  certifications TEXT[],
  skills TEXT[],

  -- Availability
  availability JSONB, -- {fullTime: bool, partTime: bool, weekends: bool, etc.}
  desired_salary_min DECIMAL(10,2),
  desired_salary_max DECIMAL(10,2),
  available_start_date DATE,

  -- Screening results
  ai_screening_score INTEGER CHECK (ai_screening_score BETWEEN 0 AND 100),
  ai_screening_notes TEXT,
  background_check_status VARCHAR(20) DEFAULT 'not_started'
    CHECK (background_check_status IN ('not_started', 'in_progress', 'clear', 'concerns', 'failed')),
  reference_check_status VARCHAR(20) DEFAULT 'not_started'
    CHECK (reference_check_status IN ('not_started', 'in_progress', 'positive', 'mixed', 'negative')),

  -- Application status
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'screening', 'interviewing', 'reference_check', 'background_check', 'offer_pending', 'hired', 'rejected', 'withdrawn')),
  current_stage VARCHAR(20) NOT NULL DEFAULT 'application'
    CHECK (current_stage IN ('application', 'ai_screening', 'phone_screen', 'interviews', 'final_review', 'offer', 'onboarding')),

  -- Decision tracking
  hired_date DATE,
  hired_as_employee_id UUID REFERENCES users(id),
  rejection_reason TEXT,
  rejection_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Interview tracking
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES applicants(id),
  interview_type VARCHAR(20) NOT NULL
    CHECK (interview_type IN ('phone', 'video', 'in_person', 'panel')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  interviewer_id UUID NOT NULL REFERENCES users(id),
  secondary_interviewer_id UUID REFERENCES users(id),

  -- Interview structure
  questions JSONB, -- Array of interview questions
  responses JSONB, -- Array of responses with ratings

  -- Results
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 10),
  notes TEXT,
  recommendation VARCHAR(20)
    CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),

  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Job requisitions and positions
CREATE TABLE job_requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  position_title VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  position_type VARCHAR(20) NOT NULL
    CHECK (position_type IN ('full_time', 'part_time', 'contract', 'temp')),

  -- Requirements
  required_qualifications TEXT[],
  preferred_qualifications TEXT[],
  required_certifications TEXT[],
  experience_required VARCHAR(20) NOT NULL
    CHECK (experience_required IN ('entry', 'junior', 'mid', 'senior', 'expert')),

  -- Compensation
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  hourly_rate_min DECIMAL(8,2),
  hourly_rate_max DECIMAL(8,2),
  benefits_summary TEXT,

  -- Hiring details
  positions_to_fill INTEGER NOT NULL DEFAULT 1,
  target_start_date DATE,
  hiring_manager_id UUID NOT NULL REFERENCES users(id),
  recruiter_id UUID REFERENCES users(id),

  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('draft', 'open', 'on_hold', 'filled', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),

  review_period VARCHAR(20) NOT NULL, -- e.g., "2024-Q1", "2024-Annual"
  review_type VARCHAR(20) NOT NULL
    CHECK (review_type IN ('quarterly', 'annual', 'probationary', 'improvement', 'promotion')),

  -- Performance metrics
  metrics JSONB NOT NULL, -- Array of {category, description, rating, weight, comments}
  overall_rating DECIMAL(3,2) CHECK (overall_rating BETWEEN 1.0 AND 5.0),

  -- Goals and development
  goals_achieved JSONB, -- Array of goal objects
  new_goals JSONB,
  development_plan JSONB, -- {skillGaps, trainingRecommendations, etc.}

  -- Compensation discussions
  current_salary DECIMAL(12,2),
  recommended_salary_adjustment DECIMAL(12,2),
  promotion_recommended BOOLEAN NOT NULL DEFAULT false,
  promotion_details TEXT,

  -- Review process
  reviewed_by UUID NOT NULL REFERENCES users(id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  employee_comments TEXT,
  employee_signed_at TIMESTAMPTZ,

  status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_employee_input', 'pending_signatures', 'completed', 'disputed')),

  -- Follow-up
  next_review_date DATE,
  improvement_plan_required BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee goals tracking
CREATE TABLE employee_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  performance_review_id UUID REFERENCES performance_reviews(id),

  goal_description TEXT NOT NULL,
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('performance', 'skill_development', 'career', 'compliance', 'behavioral')),

  target_date DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled', 'deferred')),

  -- Goal details
  success_criteria TEXT,
  resources_needed TEXT,
  manager_support TEXT,

  -- Progress tracking
  progress_updates JSONB, -- Array of {date, update, progress}
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Retention risk analysis
CREATE TABLE retention_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),

  risk_level VARCHAR(10) NOT NULL
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),

  -- Risk factors
  risk_factors JSONB NOT NULL, -- Array of {factor, impact, description}
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Retention strategies
  recommended_actions JSONB, -- Array of retention action objects
  actions_taken JSONB DEFAULT '[]'::jsonb,

  -- Follow-up
  next_assessment_date DATE,
  assigned_to UUID REFERENCES users(id), -- HR/Manager responsible

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training and development tracking
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  program_name VARCHAR(200) NOT NULL,
  program_type VARCHAR(30) NOT NULL
    CHECK (program_type IN ('orientation', 'compliance', 'skills', 'leadership', 'safety', 'continuing_education')),

  description TEXT,
  duration_hours DECIMAL(5,2),

  -- Requirements
  required_for_roles TEXT[], -- Array of role names
  prerequisite_programs UUID[],
  certification_earned VARCHAR(100),

  -- Content
  training_materials JSONB, -- Array of material objects
  assessment_required BOOLEAN NOT NULL DEFAULT false,
  passing_score INTEGER,

  -- Scheduling
  instructor_id UUID REFERENCES users(id),
  max_participants INTEGER,

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'suspended', 'archived')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- Training enrollments and completions
CREATE TABLE training_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  training_program_id UUID NOT NULL REFERENCES training_programs(id),

  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_date TIMESTAMPTZ,

  -- Completion tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  passed BOOLEAN,

  -- Certification
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  certificate_number VARCHAR(50),
  certificate_expires_at DATE,

  status VARCHAR(20) NOT NULL DEFAULT 'enrolled'
    CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed', 'cancelled')),

  notes TEXT,

  UNIQUE(employee_id, training_program_id, enrolled_at)
);

-- Compensation history and adjustments
CREATE TABLE compensation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),

  effective_date DATE NOT NULL,
  salary_amount DECIMAL(12,2),
  hourly_rate DECIMAL(8,2),

  -- Adjustment details
  adjustment_type VARCHAR(30) NOT NULL
    CHECK (adjustment_type IN ('hire', 'merit', 'promotion', 'market_adjustment', 'cost_of_living', 'correction')),
  adjustment_percentage DECIMAL(5,2),
  adjustment_amount DECIMAL(12,2),

  -- Approval chain
  approved_by UUID NOT NULL REFERENCES users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performance_review_id UUID REFERENCES performance_reviews(id),

  reason TEXT,
  budget_impact DECIMAL(12,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills and competency matrix
CREATE TABLE skills_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  skill_name VARCHAR(100) NOT NULL,
  skill_category VARCHAR(50) NOT NULL
    CHECK (skill_category IN ('clinical', 'technical', 'communication', 'leadership', 'compliance', 'administrative')),

  description TEXT,
  proficiency_levels JSONB, -- Array of level definitions

  -- Requirements
  required_for_roles TEXT[],
  certification_available BOOLEAN NOT NULL DEFAULT false,
  training_program_id UUID REFERENCES training_programs(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, skill_name)
);

-- Employee skills assessment
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  skill_id UUID NOT NULL REFERENCES skills_matrix(id),

  proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessed_by UUID NOT NULL REFERENCES users(id),

  -- Assessment details
  assessment_method VARCHAR(30)
    CHECK (assessment_method IN ('self_assessment', 'manager_review', 'peer_review', 'test', 'observation')),
  notes TEXT,

  -- Development tracking
  target_level INTEGER CHECK (target_level BETWEEN 1 AND 5),
  development_plan TEXT,

  UNIQUE(employee_id, skill_id, assessed_at)
);

-- Indexes for performance
CREATE INDEX idx_applicants_organization ON applicants(organization_id);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_stage ON applicants(current_stage);
CREATE INDEX idx_applicants_application_date ON applicants(application_date);
CREATE INDEX idx_applicants_position ON applicants(position_applied_for);

CREATE INDEX idx_interviews_applicant ON interviews(applicant_id);
CREATE INDEX idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX idx_interviews_status ON interviews(status);

CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_period ON performance_reviews(review_period);
CREATE INDEX idx_performance_reviews_type ON performance_reviews(review_type);
CREATE INDEX idx_performance_reviews_status ON performance_reviews(status);

CREATE INDEX idx_employee_goals_employee ON employee_goals(employee_id);
CREATE INDEX idx_employee_goals_target_date ON employee_goals(target_date);
CREATE INDEX idx_employee_goals_status ON employee_goals(status);

CREATE INDEX idx_retention_risks_employee ON retention_risks(employee_id);
CREATE INDEX idx_retention_risks_level ON retention_risks(risk_level);
CREATE INDEX idx_retention_risks_calculated ON retention_risks(calculated_at);

CREATE INDEX idx_training_enrollments_employee ON training_enrollments(employee_id);
CREATE INDEX idx_training_enrollments_program ON training_enrollments(training_program_id);
CREATE INDEX idx_training_enrollments_status ON training_enrollments(status);

CREATE INDEX idx_compensation_history_employee ON compensation_history(employee_id);
CREATE INDEX idx_compensation_history_effective ON compensation_history(effective_date);

CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);

-- Row Level Security
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Organization-scoped)
CREATE POLICY applicants_organization_policy ON applicants
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY interviews_organization_policy ON interviews
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM applicants a
    WHERE a.id = interviews.applicant_id
    AND a.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY job_requisitions_organization_policy ON job_requisitions
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY performance_reviews_organization_policy ON performance_reviews
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = performance_reviews.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY employee_goals_organization_policy ON employee_goals
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = employee_goals.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY retention_risks_organization_policy ON retention_risks
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = retention_risks.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY training_programs_organization_policy ON training_programs
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY training_enrollments_organization_policy ON training_enrollments
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = training_enrollments.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY compensation_history_organization_policy ON compensation_history
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = compensation_history.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

CREATE POLICY skills_matrix_organization_policy ON skills_matrix
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY employee_skills_organization_policy ON employee_skills
  FOR ALL TO authenticated_users
  USING (EXISTS (
    SELECT 1 FROM users e
    WHERE e.id = employee_skills.employee_id
    AND e.organization_id = current_setting('app.current_organization_id')::UUID
  ));

-- Views for common queries
CREATE VIEW recruiting_pipeline_summary AS
SELECT
  a.organization_id,
  a.current_stage,
  COUNT(*) as applicant_count,
  AVG(a.ai_screening_score) as avg_screening_score,
  COUNT(*) FILTER (WHERE a.application_date >= CURRENT_DATE - INTERVAL '30 days') as recent_applications
FROM applicants a
WHERE a.status NOT IN ('hired', 'rejected', 'withdrawn')
GROUP BY a.organization_id, a.current_stage;

CREATE VIEW performance_review_summary AS
SELECT
  pr.employee_id,
  e.first_name,
  e.last_name,
  e.role,
  pr.review_period,
  pr.overall_rating,
  pr.promotion_recommended,
  pr.recommended_salary_adjustment,
  pr.status as review_status
FROM performance_reviews pr
JOIN users e ON pr.employee_id = e.id
WHERE pr.review_period = (
  SELECT MAX(review_period)
  FROM performance_reviews pr2
  WHERE pr2.employee_id = pr.employee_id
);

CREATE VIEW retention_risk_summary AS
SELECT
  rr.employee_id,
  e.first_name,
  e.last_name,
  e.role,
  e.hire_date,
  rr.risk_level,
  rr.risk_score,
  rr.calculated_at,
  jsonb_array_length(rr.recommended_actions) as recommended_action_count,
  jsonb_array_length(rr.actions_taken) as actions_taken_count
FROM retention_risks rr
JOIN users e ON rr.employee_id = e.id
WHERE rr.calculated_at = (
  SELECT MAX(calculated_at)
  FROM retention_risks rr2
  WHERE rr2.employee_id = rr.employee_id
);

-- Functions for common calculations
CREATE OR REPLACE FUNCTION calculate_turnover_rate(
  org_id UUID,
  period_months INTEGER DEFAULT 12
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  active_count INTEGER;
  termination_count INTEGER;
  turnover_rate DECIMAL(5,2);
BEGIN
  -- Get active employee count
  SELECT COUNT(*)
  INTO active_count
  FROM users
  WHERE organization_id = org_id
  AND termination_date IS NULL;

  -- Get termination count for period
  SELECT COUNT(*)
  INTO termination_count
  FROM users
  WHERE organization_id = org_id
  AND termination_date >= CURRENT_DATE - (period_months || ' months')::INTERVAL
  AND termination_date IS NOT NULL;

  -- Calculate turnover rate
  IF active_count > 0 THEN
    turnover_rate := (termination_count::DECIMAL / active_count) * 100;
  ELSE
    turnover_rate := 0;
  END IF;

  RETURN turnover_rate;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON applicants TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON interviews TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_requisitions TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON performance_reviews TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_goals TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON retention_risks TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON training_programs TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON training_enrollments TO authenticated_users;
GRANT SELECT, INSERT ON compensation_history TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON skills_matrix TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_skills TO authenticated_users;

GRANT SELECT ON recruiting_pipeline_summary TO authenticated_users;
GRANT SELECT ON performance_review_summary TO authenticated_users;
GRANT SELECT ON retention_risk_summary TO authenticated_users;