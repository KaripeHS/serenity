
-- 1. Vendors (Payees)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50), -- EIN or SSN
    email VARCHAR(255),
    phone VARCHAR(50),
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    default_gl_account_id UUID REFERENCES chart_of_accounts(id), -- Auto-categorization
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bills (Accounts Payable)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    bill_number VARCHAR(100), -- Invoice # from vendor
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending_approval, approved, paid, void
    approval_stage VARCHAR(50) DEFAULT 'draft', -- draft, supervisor_review, cfo_review, approved
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id), -- Final approver
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Expenses (Employee Reimbursements)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id), -- Who spent the money
    amount DECIMAL(15, 2) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    date_incurred DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- Travel, Meals, Supplies
    description TEXT,
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, reimbursed, rejected
    reimbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Approval Workflows (The "Governance" Engine)
-- Definitions: Requirements for approval
CREATE TABLE IF NOT EXISTS approval_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'bill', 'expense'
    min_amount DECIMAL(15, 2) DEFAULT 0,
    max_amount DECIMAL(15, 2), -- NULL = Infinity
    required_role VARCHAR(50) NOT NULL, -- 'field_supervisor', 'cfo', 'ceo'
    step_order INTEGER NOT NULL, -- 1 = First Review, 2 = Final Signoff
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs: Audit trail of every action
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL, -- bill_id or expense_id
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'submit', 'approve', 'reject', 'override'
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Banking Integration (Plaid)
-- Plaid Items: Connected bank logins
CREATE TABLE IF NOT EXISTS plaid_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_id VARCHAR(255) NOT NULL, -- Plaid's ID
    access_token VARCHAR(255) NOT NULL, -- Encrypted in app, stored here for now
    institution_id VARCHAR(100),
    institution_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Transactions: Raw feed from Plaid
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plaid_item_id UUID REFERENCES plaid_items(id),
    plaid_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    account_id VARCHAR(255) NOT NULL, -- Plaid's account_id
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    name VARCHAR(255), -- Merchant name
    merchant_name VARCHAR(255),
    category VARCHAR(255), -- Plaid's category
    pending BOOLEAN DEFAULT false,
    
    -- Reconciliation
    status VARCHAR(50) DEFAULT 'unreconciled', -- unreconciled, matched, ignored
    matched_journal_entry_id UUID REFERENCES journal_entries(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_vendors ON vendors USING (organization_id = current_setting('app.current_organization_id')::uuid);
CREATE POLICY tenant_isolation_bills ON bills USING (organization_id = current_setting('app.current_organization_id')::uuid);
CREATE POLICY tenant_isolation_expenses ON expenses USING (organization_id = current_setting('app.current_organization_id')::uuid);
CREATE POLICY tenant_isolation_approval_logs ON approval_logs USING (organization_id = current_setting('app.current_organization_id')::uuid);
CREATE POLICY tenant_isolation_plaid_items ON plaid_items USING (organization_id = current_setting('app.current_organization_id')::uuid);
CREATE POLICY tenant_isolation_bank_transactions ON bank_transactions USING (organization_id = current_setting('app.current_organization_id')::uuid);
