/**
 * Approval Workflow System
 * Configurable multi-step approval workflows
 */

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100) NOT NULL, -- visit_change, expense, time_off, etc.
  steps JSONB NOT NULL, -- Array of workflow steps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, escalated, cancelled
  current_step INTEGER DEFAULT 1,
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, escalated
  comments TEXT,
  approved_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_def_org ON workflow_definitions(organization_id);
CREATE INDEX idx_workflow_def_entity ON workflow_definitions(entity_type);
CREATE INDEX idx_workflow_inst_org ON workflow_instances(organization_id);
CREATE INDEX idx_workflow_inst_status ON workflow_instances(status);
CREATE INDEX idx_approval_tasks_approver ON approval_tasks(approver_id);
CREATE INDEX idx_approval_tasks_status ON approval_tasks(status);
CREATE INDEX idx_approval_tasks_workflow ON approval_tasks(workflow_instance_id);

COMMENT ON TABLE workflow_definitions IS 'Configurable approval workflow definitions';
COMMENT ON TABLE workflow_instances IS 'Active workflow instances for approval requests';
COMMENT ON TABLE approval_tasks IS 'Individual approval tasks within workflows';
