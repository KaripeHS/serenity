-- Migration: 121_onboarding_digitization.sql
-- Purpose: Add digital forms, document uploads, e-signatures, and skip functionality to onboarding
-- Author: Claude
-- Date: 2025-12-30

-- =====================================================
-- PHASE 1: Add new columns to onboarding_items
-- =====================================================

-- Item type to distinguish different kinds of tasks
ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  item_type VARCHAR(50) DEFAULT 'task';
COMMENT ON COLUMN onboarding_items.item_type IS 'Type of item: task, form, upload, video, meeting, signature';

-- Digital form support
ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  form_schema JSONB;
COMMENT ON COLUMN onboarding_items.form_schema IS 'JSON schema defining form fields for form-type items';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  form_data JSONB;
COMMENT ON COLUMN onboarding_items.form_data IS 'Submitted form data from the user';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  form_submitted_at TIMESTAMP WITH TIME ZONE;

-- Video/training support
ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  video_url TEXT;
COMMENT ON COLUMN onboarding_items.video_url IS 'URL to training video (YouTube, Vimeo, or self-hosted)';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  video_duration_seconds INTEGER;

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  video_watched_seconds INTEGER DEFAULT 0;

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  video_completed_at TIMESTAMP WITH TIME ZONE;

-- Downloadable files (e.g., PDFs to fill out)
ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  downloadable_file_url TEXT;
COMMENT ON COLUMN onboarding_items.downloadable_file_url IS 'URL to a file the user can download (e.g., blank form PDF)';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  downloadable_file_name TEXT;

-- E-signature support
ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  e_signature TEXT;
COMMENT ON COLUMN onboarding_items.e_signature IS 'Base64 encoded signature image';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  signed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  signer_ip_address INET;

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  signer_user_agent TEXT;

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  signature_attestation TEXT;
COMMENT ON COLUMN onboarding_items.signature_attestation IS 'Legal attestation text the user agreed to when signing';

-- Skip/Not Applicable functionality
ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  skipped_by UUID REFERENCES users(id);

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  skipped_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  skipped_reason TEXT;
COMMENT ON COLUMN onboarding_items.skipped_reason IS 'Reason why this item was skipped/marked not applicable';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  skip_approved_by UUID REFERENCES users(id);
COMMENT ON COLUMN onboarding_items.skip_approved_by IS 'For required items, who approved the skip';

ALTER TABLE onboarding_items ADD COLUMN IF NOT EXISTS
  skip_approved_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- PHASE 2: Create onboarding_files table
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_item_id UUID NOT NULL REFERENCES onboarding_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  file_category VARCHAR(100),
  description TEXT,

  -- Upload tracking
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Verification workflow
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,

  -- Rejection handling
  rejected BOOLEAN DEFAULT FALSE,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for onboarding_files
CREATE INDEX IF NOT EXISTS idx_onboarding_files_item ON onboarding_files(onboarding_item_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_files_org ON onboarding_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_files_pending_verification
  ON onboarding_files(organization_id, verified, rejected)
  WHERE verified = FALSE AND rejected = FALSE;

-- =====================================================
-- PHASE 3: Create form_templates table for reusable forms
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),

  -- Template info
  form_type VARCHAR(100) NOT NULL,
  form_name TEXT NOT NULL,
  form_version VARCHAR(20) DEFAULT '1.0',
  description TEXT,

  -- Form definition
  schema JSONB NOT NULL,
  validation_rules JSONB,

  -- Display settings
  requires_signature BOOLEAN DEFAULT FALSE,
  signature_attestation_text TEXT,
  instructions TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Unique constraint: one active template per form type per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_templates_active
  ON onboarding_form_templates(organization_id, form_type)
  WHERE is_active = TRUE;

-- =====================================================
-- PHASE 4: Insert default form templates
-- =====================================================

-- W-4 Form Template
INSERT INTO onboarding_form_templates (id, organization_id, form_type, form_name, description, schema, requires_signature, signature_attestation_text)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  NULL,  -- Global template
  'w4',
  'W-4 Employee''s Withholding Certificate',
  'Federal tax withholding form',
  '{
    "sections": [
      {
        "id": "personal",
        "title": "Step 1: Personal Information",
        "fields": [
          {"id": "firstName", "type": "text", "label": "First name", "required": true},
          {"id": "lastName", "type": "text", "label": "Last name", "required": true},
          {"id": "ssn", "type": "ssn", "label": "Social Security Number", "required": true, "mask": "XXX-XX-####"},
          {"id": "address", "type": "text", "label": "Address", "required": true},
          {"id": "city", "type": "text", "label": "City", "required": true},
          {"id": "state", "type": "select", "label": "State", "required": true, "options": "us_states"},
          {"id": "zip", "type": "text", "label": "ZIP Code", "required": true, "validation": "zip"}
        ]
      },
      {
        "id": "filing_status",
        "title": "Step 1(c): Filing Status",
        "fields": [
          {"id": "filingStatus", "type": "radio", "label": "Filing Status", "required": true, "options": [
            {"value": "single", "label": "Single or Married filing separately"},
            {"value": "married", "label": "Married filing jointly"},
            {"value": "head_of_household", "label": "Head of household"}
          ]}
        ]
      },
      {
        "id": "multiple_jobs",
        "title": "Step 2: Multiple Jobs or Spouse Works",
        "description": "Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly and your spouse also works.",
        "fields": [
          {"id": "multipleJobs", "type": "checkbox", "label": "Check if applicable: There are only two jobs total"},
          {"id": "multipleJobsWorksheet", "type": "number", "label": "Amount from worksheet (if using)", "helpText": "Use the Multiple Jobs Worksheet on page 3"}
        ]
      },
      {
        "id": "dependents",
        "title": "Step 3: Claim Dependents",
        "description": "If your total income will be $200,000 or less ($400,000 if married filing jointly)",
        "fields": [
          {"id": "qualifyingChildren", "type": "number", "label": "Number of qualifying children under 17", "min": 0},
          {"id": "qualifyingChildrenAmount", "type": "calculated", "formula": "qualifyingChildren * 2000"},
          {"id": "otherDependents", "type": "number", "label": "Number of other dependents", "min": 0},
          {"id": "otherDependentsAmount", "type": "calculated", "formula": "otherDependents * 500"},
          {"id": "totalDependentsAmount", "type": "calculated", "formula": "qualifyingChildrenAmount + otherDependentsAmount"}
        ]
      },
      {
        "id": "other_adjustments",
        "title": "Step 4: Other Adjustments (Optional)",
        "fields": [
          {"id": "otherIncome", "type": "currency", "label": "4(a) Other income (not from jobs)", "helpText": "Include interest, dividends, retirement income"},
          {"id": "deductions", "type": "currency", "label": "4(b) Deductions", "helpText": "If you expect to claim deductions other than the standard deduction"},
          {"id": "extraWithholding", "type": "currency", "label": "4(c) Extra withholding per paycheck"}
        ]
      }
    ]
  }'::jsonb,
  TRUE,
  'Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.'
)
ON CONFLICT DO NOTHING;

-- Direct Deposit Form Template
INSERT INTO onboarding_form_templates (id, organization_id, form_type, form_name, description, schema, requires_signature, signature_attestation_text)
VALUES (
  'f0000000-0000-0000-0000-000000000002',
  NULL,
  'direct_deposit',
  'Direct Deposit Authorization',
  'Bank account information for payroll',
  '{
    "sections": [
      {
        "id": "bank_info",
        "title": "Bank Account Information",
        "fields": [
          {"id": "bankName", "type": "text", "label": "Bank Name", "required": true},
          {"id": "routingNumber", "type": "routing", "label": "Routing Number (9 digits)", "required": true, "validation": "routing_number"},
          {"id": "accountNumber", "type": "text", "label": "Account Number", "required": true},
          {"id": "confirmAccountNumber", "type": "text", "label": "Confirm Account Number", "required": true, "validation": "match:accountNumber"},
          {"id": "accountType", "type": "radio", "label": "Account Type", "required": true, "options": [
            {"value": "checking", "label": "Checking"},
            {"value": "savings", "label": "Savings"}
          ]}
        ]
      },
      {
        "id": "deposit_amount",
        "title": "Deposit Amount",
        "fields": [
          {"id": "depositType", "type": "radio", "label": "Deposit Type", "required": true, "options": [
            {"value": "full", "label": "Deposit entire net pay"},
            {"value": "fixed", "label": "Deposit a fixed amount"},
            {"value": "percentage", "label": "Deposit a percentage"}
          ]},
          {"id": "depositAmount", "type": "currency", "label": "Amount", "conditionalDisplay": {"field": "depositType", "value": "fixed"}},
          {"id": "depositPercentage", "type": "number", "label": "Percentage", "min": 1, "max": 100, "conditionalDisplay": {"field": "depositType", "value": "percentage"}}
        ]
      },
      {
        "id": "void_check",
        "title": "Verification",
        "description": "Please attach a voided check or bank letter for verification",
        "fields": [
          {"id": "voidCheckUpload", "type": "upload", "label": "Upload voided check or bank letter", "accept": "image/*,.pdf"}
        ]
      }
    ]
  }'::jsonb,
  TRUE,
  'I authorize my employer to deposit my pay into the account specified above. I understand that this authorization will remain in effect until I provide written notice to cancel or change it.'
)
ON CONFLICT DO NOTHING;

-- I-9 Section 1 Form Template
INSERT INTO onboarding_form_templates (id, organization_id, form_type, form_name, description, schema, requires_signature, signature_attestation_text)
VALUES (
  'f0000000-0000-0000-0000-000000000003',
  NULL,
  'i9_section1',
  'I-9 Employment Eligibility Verification - Section 1',
  'Employee section of I-9 form',
  '{
    "sections": [
      {
        "id": "personal",
        "title": "Employee Information",
        "fields": [
          {"id": "lastName", "type": "text", "label": "Last Name (Family Name)", "required": true},
          {"id": "firstName", "type": "text", "label": "First Name (Given Name)", "required": true},
          {"id": "middleInitial", "type": "text", "label": "Middle Initial", "maxLength": 1},
          {"id": "otherLastNames", "type": "text", "label": "Other Last Names Used (if any)"},
          {"id": "address", "type": "text", "label": "Address (Street Number and Name)", "required": true},
          {"id": "aptNumber", "type": "text", "label": "Apt. Number"},
          {"id": "city", "type": "text", "label": "City or Town", "required": true},
          {"id": "state", "type": "select", "label": "State", "required": true, "options": "us_states"},
          {"id": "zip", "type": "text", "label": "ZIP Code", "required": true},
          {"id": "dateOfBirth", "type": "date", "label": "Date of Birth", "required": true},
          {"id": "ssn", "type": "ssn", "label": "U.S. Social Security Number", "required": true},
          {"id": "email", "type": "email", "label": "Employee''s E-mail Address"},
          {"id": "phone", "type": "phone", "label": "Employee''s Telephone Number"}
        ]
      },
      {
        "id": "citizenship",
        "title": "Citizenship/Immigration Status",
        "fields": [
          {"id": "citizenshipStatus", "type": "radio", "label": "I attest, under penalty of perjury, that I am:", "required": true, "options": [
            {"value": "citizen", "label": "A citizen of the United States"},
            {"value": "noncitizen_national", "label": "A noncitizen national of the United States"},
            {"value": "permanent_resident", "label": "A lawful permanent resident (Alien Registration Number/USCIS Number)"},
            {"value": "authorized_alien", "label": "An alien authorized to work until (expiration date)"}
          ]},
          {"id": "alienNumber", "type": "text", "label": "Alien Registration Number/USCIS Number", "conditionalDisplay": {"field": "citizenshipStatus", "value": "permanent_resident"}},
          {"id": "workAuthExpiration", "type": "date", "label": "Work Authorization Expiration Date", "conditionalDisplay": {"field": "citizenshipStatus", "value": "authorized_alien"}},
          {"id": "alienNumberAuth", "type": "text", "label": "Alien Registration Number/USCIS Number", "conditionalDisplay": {"field": "citizenshipStatus", "value": "authorized_alien"}},
          {"id": "i94Number", "type": "text", "label": "Form I-94 Admission Number", "conditionalDisplay": {"field": "citizenshipStatus", "value": "authorized_alien"}},
          {"id": "foreignPassportNumber", "type": "text", "label": "Foreign Passport Number", "conditionalDisplay": {"field": "citizenshipStatus", "value": "authorized_alien"}},
          {"id": "foreignPassportCountry", "type": "select", "label": "Country of Issuance", "options": "countries", "conditionalDisplay": {"field": "citizenshipStatus", "value": "authorized_alien"}}
        ]
      }
    ]
  }'::jsonb,
  TRUE,
  'I am aware that federal law provides for imprisonment and/or fines for false statements, or the use of false documents, in connection with the completion of this form. I attest, under penalty of perjury, that I am (check one of the boxes above), that the information I have provided is true and correct, and that I understand that making false statements or using false documents in connection with the completion of this form could subject me to criminal prosecution under 18 U.S.C. § 1546 and/or civil penalties under 8 U.S.C. § 1324c.'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 5: Update onboarding_instances for early access
-- =====================================================

-- Add field to track when the new hire can access their portal
ALTER TABLE onboarding_instances ADD COLUMN IF NOT EXISTS
  portal_access_granted_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN onboarding_instances.portal_access_granted_at IS 'When the new hire was granted access to complete onboarding tasks';

ALTER TABLE onboarding_instances ADD COLUMN IF NOT EXISTS
  portal_first_accessed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE onboarding_instances ADD COLUMN IF NOT EXISTS
  invite_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE onboarding_instances ADD COLUMN IF NOT EXISTS
  invite_sent_by UUID REFERENCES users(id);

-- =====================================================
-- PHASE 6: Create audit log for onboarding actions
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_instance_id UUID REFERENCES onboarding_instances(id) ON DELETE CASCADE,
  onboarding_item_id UUID REFERENCES onboarding_items(id) ON DELETE CASCADE,

  -- Action details
  action VARCHAR(100) NOT NULL,
  action_details JSONB,

  -- Actor
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Request context
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_onboarding_audit_instance ON onboarding_audit_log(onboarding_instance_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_audit_item ON onboarding_audit_log(onboarding_item_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_audit_action ON onboarding_audit_log(action);

-- =====================================================
-- PHASE 7: Update the updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_onboarding_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_onboarding_files_updated_at ON onboarding_files;
CREATE TRIGGER trigger_onboarding_files_updated_at
  BEFORE UPDATE ON onboarding_files
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_files_updated_at();

-- =====================================================
-- DONE
-- =====================================================

COMMENT ON TABLE onboarding_files IS 'Stores files uploaded during onboarding (IDs, certifications, signed forms)';
COMMENT ON TABLE onboarding_form_templates IS 'Reusable form templates for digital onboarding forms (W-4, I-9, etc.)';
COMMENT ON TABLE onboarding_audit_log IS 'Audit trail for all onboarding actions for compliance';
