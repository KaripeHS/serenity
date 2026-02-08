-- SAFE_MIGRATION

CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  url VARCHAR(1024) NOT NULL,
  description TEXT,
  section VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID -- Reference to user UUID if available, nullable for now
);

CREATE INDEX idx_content_assets_key ON content_assets(key);
CREATE INDEX idx_content_assets_section ON content_assets(section);

-- Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_content_assets_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_assets_updated_at
    BEFORE UPDATE ON content_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_content_assets_updated_at_column();
