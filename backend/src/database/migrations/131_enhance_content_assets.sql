-- ============================================================================
-- Migration: Enhance Content Assets for Image Management Dashboard
-- Purpose: Add metadata columns to content_assets to support a full image
--          management dashboard (page, alt text, type, dimensions, etc.)
-- ============================================================================

-- Add new columns
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS page VARCHAR(100);
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS alt_text VARCHAR(500);
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS image_type VARCHAR(50);
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50);
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_assets_page ON content_assets(page);
CREATE INDEX IF NOT EXISTS idx_content_assets_image_type ON content_assets(image_type);
CREATE INDEX IF NOT EXISTS idx_content_assets_page_section ON content_assets(page, section);

-- Add comment
COMMENT ON TABLE content_assets IS 'Manages all website images with metadata for the admin Image Management dashboard';
COMMENT ON COLUMN content_assets.page IS 'Which page this image belongs to (home, about, careers, services)';
COMMENT ON COLUMN content_assets.alt_text IS 'Accessibility alt text for the image';
COMMENT ON COLUMN content_assets.image_type IS 'Type of image (hero, team, location, testimonial, feature, etc.)';
COMMENT ON COLUMN content_assets.is_external IS 'Whether the URL is external (e.g. Unsplash) or a local/GCS upload';
COMMENT ON COLUMN content_assets.sort_order IS 'Display order within a section';
