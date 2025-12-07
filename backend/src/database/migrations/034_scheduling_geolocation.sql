-- ============================================================================
-- Intelligent Scheduling & Geolocation Migration
-- Adds coordinates to Clients and Users for distance calculation
-- ============================================================================

-- 1. Add coordinates to Users (Caregivers)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Index for fast geospatial lookups
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);

-- 2. Add coordinates to Clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Index for fast geospatial lookups
CREATE INDEX IF NOT EXISTS idx_clients_location ON clients(latitude, longitude);

-- 3. Mileage Tracking Table
CREATE TABLE IF NOT EXISTS mileage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    start_location_lat DECIMAL(10, 8),
    start_location_lng DECIMAL(11, 8),
    end_location_lat DECIMAL(10, 8),
    end_location_lng DECIMAL(11, 8),
    distance_miles DECIMAL(8, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, reimbursed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_mileage_status CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed'))
);

CREATE INDEX idx_mileage_user_date ON mileage_logs(user_id, date);
