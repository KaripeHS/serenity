/**
 * Fix Offline Sync Queue - Add missing columns
 */

DROP TABLE IF EXISTS offline_sync_queue CASCADE;

CREATE TABLE offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type VARCHAR(100) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt TIMESTAMPTZ,
  error_message TEXT,
  local_timestamp TIMESTAMPTZ NOT NULL,
  client_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_offline_sync_user ON offline_sync_queue(user_id);
CREATE INDEX idx_offline_sync_status ON offline_sync_queue(status);
CREATE INDEX idx_offline_sync_org ON offline_sync_queue(organization_id);
