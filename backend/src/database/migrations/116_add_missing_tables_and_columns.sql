-- 1. recurring_visit_templates
CREATE TABLE IF NOT EXISTS recurring_visit_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    service_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    recurrence_pattern JSONB NOT NULL, -- e.g. { "frequency": "weekly", "days": ["mon", "wed"] }
    duration_minutes INTEGER NOT NULL,
    preferred_caregiver_id UUID REFERENCES caregivers(id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. spi_daily_scores
CREATE TABLE IF NOT EXISTS spi_daily_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    score DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
    risk_level VARCHAR(20) NOT NULL,
    factors JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. visit_check_ins
CREATE TABLE IF NOT EXISTS visit_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    location JSONB,
    method VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. care_notes missing column
ALTER TABLE care_notes
ADD COLUMN IF NOT EXISTS note_type VARCHAR(30) DEFAULT 'general';

-- 5. expense_categories missing column
ALTER TABLE expense_categories
ADD COLUMN IF NOT EXISTS type VARCHAR(30) DEFAULT 'general';

-- 6. users missing hourly_rate
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2);

-- 7. missing columns in care_plans
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    status VARCHAR(20) DEFAULT 'active',
    version INTEGER DEFAULT 1,
    assessment_date DATE,
    plan_start_date DATE,
    adl_assessment JSONB,
    iadl_assessment JSONB,
    medical_history TEXT,
    medications JSONB,
    allergies JSONB,
    dietary_needs TEXT,
    emergency_contacts JSONB,
    physician_contacts JSONB,
    goals TEXT[],
    care_tasks JSONB,
    schedule_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

ALTER TABLE care_plans
ADD COLUMN IF NOT EXISTS assessment_date DATE,
ADD COLUMN IF NOT EXISTS plan_start_date DATE,
ADD COLUMN IF NOT EXISTS adl_assessment JSONB,
ADD COLUMN IF NOT EXISTS iadl_assessment JSONB,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS medications JSONB,
ADD COLUMN IF NOT EXISTS allergies JSONB,
ADD COLUMN IF NOT EXISTS dietary_needs TEXT,
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB,
ADD COLUMN IF NOT EXISTS physician_contacts JSONB,
ADD COLUMN IF NOT EXISTS goals TEXT[];

-- 8. claim_batches table (Test 7.2)
CREATE TABLE IF NOT EXISTS claim_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    batch_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'created',
    total_charge_amount DECIMAL(10, 2),
    claim_count INTEGER DEFAULT 0,
    submission_date TIMESTAMP WITH TIME ZONE,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. shifts missing required_skills
ALTER TABLE shifts
ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';
