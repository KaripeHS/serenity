-- 105_fix_final_v3.sql
-- Fix address constraint in clients and create expense_categories

-- 1. Fix clients table (address constraint)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address') THEN
        ALTER TABLE clients ALTER COLUMN address DROP NOT NULL;
    END IF;
END
$$;

-- 2. Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON expense_categories(organization_id);
