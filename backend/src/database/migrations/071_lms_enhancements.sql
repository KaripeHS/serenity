-- ============================================================================
-- Migration 071: LMS Enhancements
-- Best-in-Class Feature: Full Learning Management System with course content,
-- quizzes, learning paths, and certificates
-- ============================================================================

-- ============================================================================
-- COURSE MODULES TABLE
-- Course content broken into individual modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_type_id UUID NOT NULL REFERENCES training_types(id) ON DELETE CASCADE,

  -- Module info
  module_order INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Content
  content_type VARCHAR(50) NOT NULL DEFAULT 'text',
  -- 'text', 'video', 'document', 'scorm', 'quiz', 'interactive', 'external_link'

  content_data JSONB,
  /*
    For text: { "html": "<p>Content here...</p>" }
    For video: { "url": "https://...", "duration_seconds": 600, "provider": "vimeo|youtube|self" }
    For document: { "url": "https://...", "file_type": "pdf", "pages": 10 }
    For scorm: { "package_url": "https://...", "version": "1.2|2004" }
    For quiz: { "quiz_id": "uuid" } -- Links to course_quizzes
    For external_link: { "url": "https://...", "open_in_new_tab": true }
  */

  -- Requirements
  estimated_duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT TRUE,
  passing_score INTEGER, -- For quiz modules
  max_attempts INTEGER, -- For quiz modules

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_modules_training ON course_modules(training_type_id);
CREATE INDEX idx_course_modules_order ON course_modules(training_type_id, module_order);

-- ============================================================================
-- COURSE QUIZZES TABLE
-- Quizzes/assessments for course modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_type_id UUID NOT NULL REFERENCES training_types(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Quiz settings
  time_limit_minutes INTEGER, -- NULL = no limit
  passing_score INTEGER NOT NULL DEFAULT 70, -- Percentage
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT TRUE,
  shuffle_answers BOOLEAN DEFAULT TRUE,
  show_correct_answers BOOLEAN DEFAULT TRUE, -- After completion
  allow_review BOOLEAN DEFAULT TRUE,

  -- Question count
  total_questions INTEGER DEFAULT 0,
  questions_to_display INTEGER, -- NULL = show all, or random subset

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_quizzes_training ON course_quizzes(training_type_id);

-- ============================================================================
-- QUIZ QUESTIONS TABLE
-- Individual quiz questions
-- ============================================================================

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,

  question_order INTEGER NOT NULL DEFAULT 1,
  question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  -- 'multiple_choice', 'true_false', 'multiple_select', 'fill_blank', 'matching', 'short_answer'

  question_text TEXT NOT NULL,
  question_media_url TEXT, -- Optional image/video for question
  explanation TEXT, -- Explanation shown after answer

  -- Points and scoring
  points INTEGER DEFAULT 1,
  partial_credit BOOLEAN DEFAULT FALSE, -- For multiple_select

  -- Answer data (structure depends on question_type)
  answer_data JSONB NOT NULL,
  /*
    multiple_choice: {
      "options": [
        { "id": "a", "text": "Option A", "is_correct": false },
        { "id": "b", "text": "Option B", "is_correct": true },
        { "id": "c", "text": "Option C", "is_correct": false }
      ]
    }

    true_false: {
      "correct_answer": true
    }

    multiple_select: {
      "options": [...],
      "min_correct": 2,
      "max_correct": 3
    }

    fill_blank: {
      "blanks": [
        { "position": 1, "acceptable_answers": ["answer1", "answer2"], "case_sensitive": false }
      ]
    }

    matching: {
      "pairs": [
        { "left": "Term 1", "right": "Definition 1" },
        { "left": "Term 2", "right": "Definition 2" }
      ]
    }
  */

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, question_order);

-- ============================================================================
-- QUIZ ATTEMPTS TABLE
-- Records of user quiz attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  training_assignment_id UUID REFERENCES training_assignments(id),

  -- Attempt info
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,

  -- Results
  status VARCHAR(20) DEFAULT 'in_progress',
  -- 'in_progress', 'completed', 'passed', 'failed', 'abandoned'
  score DECIMAL(5, 2),
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,

  -- Answer data (for review)
  answers JSONB,
  /*
    {
      "question_id_1": { "selected": ["b"], "correct": true, "points": 1 },
      "question_id_2": { "selected": ["a", "c"], "correct": false, "points": 0 }
    }
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_assignment ON quiz_attempts(training_assignment_id);
CREATE INDEX idx_quiz_attempts_status ON quiz_attempts(status);

-- ============================================================================
-- LEARNING PATHS TABLE
-- Sequences of courses for role-based or skill-based progression
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),

  -- Target audience
  target_roles TEXT[], -- e.g., ['caregiver', 'nurse']
  target_skill_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'

  -- Path settings
  is_sequential BOOLEAN DEFAULT TRUE, -- Must complete in order
  estimated_total_hours DECIMAL(5, 1),

  -- Completion rewards
  completion_badge VARCHAR(100),
  completion_certificate_template_id UUID,

  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_paths_org ON learning_paths(organization_id);
CREATE INDEX idx_learning_paths_roles ON learning_paths USING GIN(target_roles);

-- ============================================================================
-- LEARNING PATH ITEMS TABLE
-- Courses/trainings within a learning path
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  training_type_id UUID NOT NULL REFERENCES training_types(id),

  item_order INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  is_unlocked_by_default BOOLEAN DEFAULT FALSE, -- First item typically true

  -- Prerequisites within the path
  prerequisite_item_ids UUID[], -- Must complete these items first

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_path_items_path ON learning_path_items(learning_path_id);
CREATE INDEX idx_learning_path_items_order ON learning_path_items(learning_path_id, item_order);

-- ============================================================================
-- USER LEARNING PATH PROGRESS TABLE
-- Track user progress through learning paths
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_learning_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id),

  -- Enrollment
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES users(id), -- NULL = self-enrolled

  -- Progress
  status VARCHAR(20) DEFAULT 'enrolled',
  -- 'enrolled', 'in_progress', 'completed', 'abandoned'
  current_item_id UUID REFERENCES learning_path_items(id),
  items_completed INTEGER DEFAULT 0,
  total_items INTEGER NOT NULL,
  progress_percent DECIMAL(5, 2) DEFAULT 0,

  -- Completion
  completed_at TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, learning_path_id)
);

CREATE INDEX idx_user_lp_progress_user ON user_learning_path_progress(user_id);
CREATE INDEX idx_user_lp_progress_path ON user_learning_path_progress(learning_path_id);
CREATE INDEX idx_user_lp_progress_status ON user_learning_path_progress(status);

-- ============================================================================
-- CERTIFICATE TEMPLATES TABLE
-- Templates for generating completion certificates
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template design
  template_type VARCHAR(50) DEFAULT 'standard',
  -- 'standard', 'professional', 'modern', 'custom'

  template_data JSONB,
  /*
    {
      "background_color": "#ffffff",
      "accent_color": "#1a73e8",
      "logo_url": "https://...",
      "signature_url": "https://...",
      "signature_name": "John Smith, Director of Training",
      "custom_text": "This certifies that {employee_name} has successfully completed...",
      "show_score": true,
      "show_hours": true
    }
  */

  -- Variables available: employee_name, course_name, completion_date, score, hours, certificate_number

  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cert_templates_org ON certificate_templates(organization_id);

-- ============================================================================
-- ISSUED CERTIFICATES TABLE
-- Records of certificates issued to users
-- ============================================================================

CREATE TABLE IF NOT EXISTS issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- What it's for
  training_assignment_id UUID REFERENCES training_assignments(id),
  learning_path_id UUID REFERENCES learning_paths(id),
  certificate_template_id UUID REFERENCES certificate_templates(id),

  -- Certificate details
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,

  -- Achievement data
  course_name VARCHAR(255),
  completion_date DATE NOT NULL,
  score INTEGER,
  hours_completed DECIMAL(6, 2),

  -- Certificate file
  certificate_url TEXT,
  pdf_generated_at TIMESTAMPTZ,

  -- Verification
  verification_code VARCHAR(20) UNIQUE, -- For external verification
  verified_by_name VARCHAR(255),
  verified_by_title VARCHAR(255),

  -- Validity
  expires_at DATE, -- NULL = doesn't expire
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issued_certs_user ON issued_certificates(user_id);
CREATE INDEX idx_issued_certs_org ON issued_certificates(organization_id);
CREATE INDEX idx_issued_certs_number ON issued_certificates(certificate_number);
CREATE INDEX idx_issued_certs_verification ON issued_certificates(verification_code);

-- ============================================================================
-- COURSE RATINGS TABLE
-- User ratings and feedback for courses
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_type_id UUID NOT NULL REFERENCES training_types(id),
  user_id UUID NOT NULL REFERENCES users(id),
  training_assignment_id UUID REFERENCES training_assignments(id),

  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,

  -- Specific ratings
  content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
  difficulty_level VARCHAR(20), -- 'too_easy', 'just_right', 'too_hard'
  relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5),
  would_recommend BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(training_type_id, user_id, training_assignment_id)
);

CREATE INDEX idx_course_ratings_training ON course_ratings(training_type_id);
CREATE INDEX idx_course_ratings_user ON course_ratings(user_id);

-- ============================================================================
-- LMS DASHBOARD VIEW
-- Summary metrics for learning management
-- ============================================================================

CREATE OR REPLACE VIEW lms_dashboard AS
SELECT
  t.organization_id,

  -- Courses
  COUNT(DISTINCT t.id) as total_courses,
  COUNT(DISTINCT t.id) FILTER (WHERE t.is_active) as active_courses,
  COUNT(DISTINCT cm.id) as total_modules,

  -- Assignments
  COUNT(DISTINCT ta.id) as total_assignments,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.status = 'completed') as completed_assignments,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.status = 'in_progress') as in_progress_assignments,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.due_date < CURRENT_DATE AND ta.status NOT IN ('completed', 'waived')) as overdue_assignments,

  -- Learning paths
  COUNT(DISTINCT lp.id) as total_learning_paths,
  COUNT(DISTINCT ulp.id) as path_enrollments,
  COUNT(DISTINCT ulp.id) FILTER (WHERE ulp.status = 'completed') as paths_completed,

  -- Certificates
  COUNT(DISTINCT ic.id) as certificates_issued,
  COUNT(DISTINCT ic.id) FILTER (WHERE ic.created_at >= CURRENT_DATE - INTERVAL '30 days') as certificates_last_30_days,

  -- Quizzes
  COUNT(DISTINCT qa.id) as quiz_attempts,
  COUNT(DISTINCT qa.id) FILTER (WHERE qa.status = 'passed') as quizzes_passed,
  AVG(qa.score) FILTER (WHERE qa.status IN ('passed', 'failed')) as avg_quiz_score,

  -- Ratings
  AVG(cr.rating) as avg_course_rating,
  COUNT(DISTINCT cr.id) as total_ratings

FROM training_types t
LEFT JOIN course_modules cm ON cm.training_type_id = t.id
LEFT JOIN training_assignments ta ON ta.training_type_id = t.id
LEFT JOIN learning_paths lp ON lp.organization_id = t.organization_id
LEFT JOIN user_learning_path_progress ulp ON ulp.learning_path_id = lp.id
LEFT JOIN issued_certificates ic ON ic.organization_id = t.organization_id
LEFT JOIN course_quizzes cq ON cq.training_type_id = t.id
LEFT JOIN quiz_attempts qa ON qa.quiz_id = cq.id
LEFT JOIN course_ratings cr ON cr.training_type_id = t.id
WHERE t.organization_id IS NOT NULL
GROUP BY t.organization_id;

-- ============================================================================
-- FUNCTION: Generate Certificate Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_number VARCHAR(50);
BEGIN
  v_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Generate Verification Code
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6) || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for organization-scoped tables
CREATE POLICY learning_paths_tenant ON learning_paths
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true)::UUID
                 OR organization_id IS NULL);

CREATE POLICY cert_templates_tenant ON certificate_templates
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true)::UUID
                 OR organization_id IS NULL);

CREATE POLICY issued_certs_tenant ON issued_certificates
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true)::UUID
                 OR organization_id IS NULL);

-- ============================================================================
-- SEED DEFAULT LEARNING PATH
-- ============================================================================

-- Create a default "New Hire Orientation" learning path
INSERT INTO learning_paths (name, description, category, target_roles, is_sequential, estimated_total_hours, is_featured)
VALUES (
  'New Hire Caregiver Orientation',
  'Complete onboarding program for new caregivers. Covers company policies, safety, compliance, and EVV training.',
  'onboarding',
  ARRAY['caregiver'],
  true,
  8.0,
  true
);

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lms_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_modules_update_ts
  BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

CREATE TRIGGER course_quizzes_update_ts
  BEFORE UPDATE ON course_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

CREATE TRIGGER quiz_questions_update_ts
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

CREATE TRIGGER quiz_attempts_update_ts
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

CREATE TRIGGER learning_paths_update_ts
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

CREATE TRIGGER user_lp_progress_update_ts
  BEFORE UPDATE ON user_learning_path_progress
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

CREATE TRIGGER cert_templates_update_ts
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW EXECUTE FUNCTION update_lms_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE course_modules IS 'Individual modules within a training course (video, document, quiz, etc.)';
COMMENT ON TABLE course_quizzes IS 'Quiz/assessment configurations for training courses';
COMMENT ON TABLE quiz_questions IS 'Individual quiz questions with various question types';
COMMENT ON TABLE quiz_attempts IS 'User quiz attempts with answers and scores';
COMMENT ON TABLE learning_paths IS 'Sequences of courses for structured learning progressions';
COMMENT ON TABLE learning_path_items IS 'Individual courses within a learning path';
COMMENT ON TABLE user_learning_path_progress IS 'User enrollment and progress in learning paths';
COMMENT ON TABLE certificate_templates IS 'Templates for generating completion certificates';
COMMENT ON TABLE issued_certificates IS 'Certificates issued to users upon completion';
COMMENT ON TABLE course_ratings IS 'User ratings and feedback for completed courses';

-- ============================================================================
-- Migration Complete: 071_lms_enhancements.sql
-- ============================================================================
