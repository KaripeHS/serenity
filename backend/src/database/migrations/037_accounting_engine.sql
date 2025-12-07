-- ============================================================================
-- Accounting Engine Migration
-- Implements Double-Entry General Ledger, Chart of Accounts, and Bank Accounts
-- ============================================================================

-- 1. Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    subtype VARCHAR(50), -- Current Asset, Long Term Liability, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, code),
    CONSTRAINT valid_account_type CHECK (type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense'))
);

CREATE INDEX idx_coa_org_code ON chart_of_accounts(organization_id, code);

-- 2. Bank Accounts (Linked to COA)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Chase Operating"
    institution_name VARCHAR(100),
    account_number_last4 VARCHAR(4),
    routing_number VARCHAR(9),
    gl_account_id UUID REFERENCES chart_of_accounts(id), -- Link to GL Asset Account
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Journal Entries (The General Ledger Header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50), -- 'payment_posting', 'invoice', 'manual', 'payroll'
    reference_id UUID, -- Polymorphic link
    status VARCHAR(20) DEFAULT 'posted', -- draft, posted, voided
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_journal_status CHECK (status IN ('draft', 'posted', 'voided'))
);

CREATE INDEX idx_journal_date ON journal_entries(date);
CREATE INDEX idx_journal_ref ON journal_entries(reference_type, reference_id);

-- 4. Journal Lines (Debits and Credits)
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    description TEXT,
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_amounts CHECK (debit >= 0 AND credit >= 0)
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- 5. RLS Policies
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

-- COA RLS
CREATE POLICY coa_org_isolation ON chart_of_accounts
    USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);

-- Bank RLS
CREATE POLICY bank_org_isolation ON bank_accounts
    USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);

-- Journal RLS
CREATE POLICY journal_org_isolation ON journal_entries
    USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);

-- Journal Lines RLS (inherit from Header via Join ideally, but for simplicity/perf we can assume valid app logic or duplicate org_id. 
-- For strict RLS without denormalizing org_id to lines, we rely on the header check for specific lookups, 
-- but for bulk reporting we might need org_id on lines. Adding org_id to lines is safer for RLS)

ALTER TABLE journal_lines ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- Trigger/App logic must ensure this matches header. For now, assuming app handles it.

CREATE POLICY journal_lines_org_isolation ON journal_lines
    USING (organization_id = (current_setting('app.current_organization_id', true))::UUID);
