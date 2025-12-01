/**
 * Create Auth Tables
 * Creates sessions, password_reset_tokens, morning_check_ins, shifts, certifications, feature_flags
 */

import { Pool } from 'pg';

async function createAuthTables() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'serenity_erp'
  });

  try {
    console.log('Creating auth-related tables...\n');

    // Sessions table for JWT refresh tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ sessions table created');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)');

    // Password reset tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ password_reset_tokens table created');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token)');

    // Morning check-ins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS morning_check_ins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        pod_id UUID REFERENCES pods(id),
        check_in_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        check_in_time TIMESTAMP WITH TIME ZONE,
        method VARCHAR(20),
        notes TEXT,
        recorded_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_checkin_date UNIQUE(user_id, check_in_date),
        CONSTRAINT valid_checkin_status CHECK (status IN ('pending', 'available', 'unavailable', 'late', 'absent', 'excused'))
      )
    `);
    console.log('✅ morning_check_ins table created');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_morning_checkins_date ON morning_check_ins(check_in_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_morning_checkins_user ON morning_check_ins(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_morning_checkins_pod ON morning_check_ins(pod_id)');

    // Shifts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        pod_id UUID REFERENCES pods(id),
        caregiver_id UUID NOT NULL REFERENCES users(id),
        client_id UUID NOT NULL REFERENCES clients(id),
        scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
        scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
        actual_start TIMESTAMP WITH TIME ZONE,
        actual_end TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'scheduled',
        service_code VARCHAR(20),
        authorization_number VARCHAR(100),
        evv_record_id UUID,
        notes TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT valid_shift_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'missed', 'cancelled'))
      )
    `);
    console.log('✅ shifts table created');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_date ON shifts(caregiver_id, scheduled_start)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shifts_client_date ON shifts(client_id, scheduled_start)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shifts_org_date ON shifts(organization_id, scheduled_start)');

    // Certifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id),
        certification_type VARCHAR(50) NOT NULL,
        certification_number VARCHAR(100),
        issuing_authority VARCHAR(200),
        issue_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        document_url TEXT,
        verified_by UUID REFERENCES users(id),
        verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT valid_cert_status CHECK (status IN ('active', 'expired', 'revoked', 'pending_verification'))
      )
    `);
    console.log('✅ certifications table created');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_certifications_user ON certifications(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certifications_expiration ON certifications(expiration_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certifications_type ON certifications(certification_type)');

    // Feature flags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        key VARCHAR(100) PRIMARY KEY,
        value BOOLEAN NOT NULL DEFAULT false,
        description TEXT,
        organization_id UUID REFERENCES organizations(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ feature_flags table created');

    // Insert default feature flags
    await pool.query(`
      INSERT INTO feature_flags (key, value, description) VALUES
        ('claims_gate_enabled', false, 'Block claims without Sandata acknowledgment'),
        ('sandata_sandbox_enabled', true, 'Use Sandata sandbox environment'),
        ('morning_checkin_notifications', true, 'Send morning check-in SMS notifications'),
        ('auto_sandata_sync', false, 'Automatically sync to Sandata'),
        ('evv_geofence_enabled', true, 'Require GPS within geofence for clock-in'),
        ('overtime_warnings_enabled', true, 'Show overtime warnings in scheduling')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ feature_flags seeded');

    // Add sandata_employee_id to users if not exists
    const userColCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'sandata_employee_id'
    `);
    if (userColCheck.rows.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN sandata_employee_id VARCHAR(50)');
      console.log('✅ sandata_employee_id column added to users');
    }

    // Add sandata_client_id to clients if not exists
    const clientColCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'sandata_client_id'
    `);
    if (clientColCheck.rows.length === 0) {
      await pool.query('ALTER TABLE clients ADD COLUMN sandata_client_id VARCHAR(50)');
      console.log('✅ sandata_client_id column added to clients');
    }

    console.log('\n🎉 All auth tables created successfully!');
    await pool.end();

  } catch (error) {
    const err = error as Error;
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

createAuthTables();
