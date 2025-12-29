-- 1. Fix care_notes patient_id FK
-- It was referencing users(id), should reference clients(id)
ALTER TABLE care_notes DROP CONSTRAINT IF EXISTS care_notes_patient_id_fkey;
ALTER TABLE care_notes ADD CONSTRAINT care_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES clients(id);

-- 2. Add user_id to disciplinary_actions
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE disciplinary_actions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 3. Add review_date to care_plans
ALTER TABLE care_plans ADD COLUMN IF NOT EXISTS review_date DATE DEFAULT CURRENT_DATE;

-- 4. Add max_hours_per_week to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_hours_per_week INTEGER DEFAULT 40;

-- 5. Add code to expense_categories
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS code VARCHAR(20);
