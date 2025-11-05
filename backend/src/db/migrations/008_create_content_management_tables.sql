-- Migration 008: Content Management System Tables
-- Creates tables for managing public website content

-- 1. Pages (top-level pages like Home, About, Services, etc.)
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Page identification
    page_slug VARCHAR(100) NOT NULL, -- e.g., 'home', 'about', 'services'
    page_title VARCHAR(200) NOT NULL,

    -- Hero section
    hero_title VARCHAR(300),
    hero_subtitle VARCHAR(500),
    hero_cta_text VARCHAR(100),
    hero_cta_url VARCHAR(300),
    hero_image_url TEXT,

    -- SEO
    meta_description TEXT,
    meta_keywords TEXT,

    -- Publishing
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    UNIQUE(organization_id, page_slug)
);

-- 2. Page Sections (modular content blocks within pages)
CREATE TABLE IF NOT EXISTS page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

    -- Section details
    section_type VARCHAR(50) NOT NULL, -- 'text', 'features', 'stats', 'cta', 'image-text', etc.
    section_title VARCHAR(300),
    section_subtitle VARCHAR(500),

    -- Content (supports markdown/html)
    content TEXT,
    content_format VARCHAR(20) DEFAULT 'markdown', -- 'markdown', 'html', 'plain'

    -- Visual elements
    image_url TEXT,
    image_alt TEXT,
    background_color VARCHAR(50),

    -- CTA
    cta_text VARCHAR(100),
    cta_url VARCHAR(300),

    -- Ordering and visibility
    position INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Team Members (leadership, staff profiles)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Personal info
    full_name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    department VARCHAR(100),

    -- Content
    bio TEXT,
    quote TEXT,

    -- Media
    photo_url TEXT,

    -- Contact (optional)
    email VARCHAR(255),
    phone VARCHAR(20),
    linkedin_url VARCHAR(300),

    -- Display
    display_order INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false, -- Show on homepage

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 4. Testimonials (customer reviews and feedback)
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Testimonial content
    quote TEXT NOT NULL,
    author_name VARCHAR(200) NOT NULL,
    author_title VARCHAR(200), -- e.g., "Family Member", "Client"
    author_location VARCHAR(200),

    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Media
    author_photo_url TEXT,

    -- Display
    display_order INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false, -- Show on homepage

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 5. Services (care services offered)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Service details
    service_name VARCHAR(200) NOT NULL,
    service_slug VARCHAR(100) NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,

    -- Visual
    icon_name VARCHAR(100), -- Icon identifier (e.g., 'heart', 'medical')
    image_url TEXT,

    -- Features (JSON array of feature strings)
    features JSONB DEFAULT '[]'::jsonb,

    -- Pricing (optional)
    starting_price DECIMAL(10, 2),
    price_description VARCHAR(200),

    -- Display
    display_order INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false, -- Show on homepage

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    UNIQUE(organization_id, service_slug)
);

-- 6. Media Assets (uploaded files and images)
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- File details
    file_name VARCHAR(300) NOT NULL,
    original_file_name VARCHAR(300) NOT NULL,
    file_path TEXT NOT NULL, -- Storage path
    file_url TEXT NOT NULL, -- Public URL

    -- Metadata
    file_type VARCHAR(100), -- MIME type
    file_size INTEGER, -- bytes
    width INTEGER, -- for images
    height INTEGER, -- for images

    -- Categorization
    alt_text TEXT,
    caption TEXT,
    tags JSONB DEFAULT '[]'::jsonb,

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- 7. Organization Settings (global site settings)
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Contact information
    primary_phone VARCHAR(20),
    primary_email VARCHAR(255),
    address_line1 VARCHAR(300),
    address_line2 VARCHAR(300),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),

    -- Business hours
    business_hours JSONB DEFAULT '{}'::jsonb, -- {"monday": "9am-5pm", ...}

    -- Trust metrics (for homepage badges)
    patient_satisfaction_rate INTEGER, -- percentage
    total_pods INTEGER,
    years_of_experience INTEGER,
    cities_served INTEGER,
    total_caregivers INTEGER,
    total_clients_served INTEGER,

    -- Social media
    facebook_url VARCHAR(300),
    twitter_url VARCHAR(300),
    linkedin_url VARCHAR(300),
    instagram_url VARCHAR(300),

    -- Legal
    privacy_policy_url VARCHAR(300),
    terms_of_service_url VARCHAR(300),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),

    UNIQUE(organization_id)
);

-- Indexes for performance
CREATE INDEX idx_pages_org_slug ON pages(organization_id, page_slug);
CREATE INDEX idx_pages_published ON pages(published, published_at);
CREATE INDEX idx_page_sections_page ON page_sections(page_id, position);
CREATE INDEX idx_team_members_org ON team_members(organization_id, display_order);
CREATE INDEX idx_team_members_published ON team_members(published, featured);
CREATE INDEX idx_testimonials_org ON testimonials(organization_id, display_order);
CREATE INDEX idx_testimonials_published ON testimonials(published, featured);
CREATE INDEX idx_services_org ON services(organization_id, display_order);
CREATE INDEX idx_services_published ON services(published, featured);
CREATE INDEX idx_media_assets_org ON media_assets(organization_id, uploaded_at DESC);
CREATE INDEX idx_organization_settings_org ON organization_settings(organization_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON page_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data with current hardcoded content from public website
-- This will be inserted after migration runs
