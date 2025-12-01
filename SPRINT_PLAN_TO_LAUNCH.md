# 🚀 SERENITY CARE PARTNERS - SPRINT PLAN TO OPERATIONAL LAUNCH
## From License to First Patient - Complete Implementation Guide

**Created:** November 24, 2025
**Target Launch:** December 16, 2025 (3 weeks)
**Status:** You have patients waiting - URGENT PRIORITY

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Sprint Overview](#sprint-overview)
3. [Pre-Sprint Setup (Day 0)](#pre-sprint-setup-day-0)
4. [Sprint 1: Foundation (Days 1-5)](#sprint-1-foundation-days-1-5)
5. [Sprint 2: Core Operations (Days 6-10)](#sprint-2-core-operations-days-6-10)
6. [Sprint 3: EVV & Mobile (Days 11-15)](#sprint-3-evv--mobile-days-11-15)
7. [Sprint 4: Billing & Launch (Days 16-21)](#sprint-4-billing--launch-days-16-21)
8. [External Dependencies Checklist](#external-dependencies-checklist)
9. [Technical Debt Registry](#technical-debt-registry)
10. [Post-Launch Phase](#post-launch-phase)

---

## EXECUTIVE SUMMARY

### Current State
- ✅ State license obtained
- ✅ Sophisticated codebase (~17,400 LOC backend)
- ✅ Database schema defined (23 migrations)
- ✅ Sandata integration framework (70% complete)
- ❌ Database tables not created
- ❌ Repository layer 75% missing
- ❌ Frontend disconnected from backend
- ❌ No external service credentials

### Target State (3 Weeks)
- ✅ Accept patient referrals
- ✅ Onboard caregivers
- ✅ Schedule visits
- ✅ Clock in/out with EVV
- ✅ Submit to Sandata (sandbox)
- ✅ Basic billing workflow
- ✅ Morning check-in operational

### Critical Path
```
Day 0: Environment setup + External service signups
Day 1-5: Database + Authentication + Core repository
Day 6-10: Shifts, pods, scheduling, morning check-in
Day 11-15: EVV mobile integration, Sandata testing
Day 16-21: Billing, testing, soft launch
```

---

## SPRINT OVERVIEW

| Sprint | Focus | Duration | Key Deliverables |
|--------|-------|----------|------------------|
| **0** | Setup | 1 day | .env configured, DB provisioned, services signed up |
| **1** | Foundation | 5 days | Auth works, core CRUD, migrations run |
| **2** | Operations | 5 days | Scheduling, pods, morning check-in |
| **3** | EVV | 5 days | Mobile app works, Sandata sandbox |
| **4** | Launch | 5 days | Billing, testing, go-live |

---

## PRE-SPRINT SETUP (DAY 0)

### 0.1 Provision PostgreSQL Database

**Option A: Local Development (Fastest)**
```bash
# Install PostgreSQL 14+ if not installed
# Windows: Download from postgresql.org
# Create database
psql -U postgres -c "CREATE DATABASE serenity_erp;"
psql -U postgres -c "CREATE USER serenity WITH PASSWORD 'your-secure-password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE serenity_erp TO serenity;"
```

**Option B: AWS RDS (Production)**
```bash
# Via AWS Console or Terraform
# Instance: db.t3.micro ($15/month)
# Engine: PostgreSQL 14
# Storage: 20GB gp2
# Enable automated backups
```

### 0.2 Create Environment File

```bash
cd backend
cp .env.example .env
```

**Edit `.env` with these REQUIRED values:**

```env
# =============================================================================
# CRITICAL - MUST CHANGE
# =============================================================================

# Database (REQUIRED)
DATABASE_URL=postgresql://serenity:your-password@localhost:5432/serenity_erp

# Security (REQUIRED - generate new secret)
JWT_SECRET=run-this-command-openssl-rand-base64-64-and-paste-result-here

# =============================================================================
# EXTERNAL SERVICES - Sign up this week
# =============================================================================

# SendGrid (FREE - https://sendgrid.com)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxx

# Twilio (FREE trial - https://twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# =============================================================================
# SANDATA - Contact immediately, 2-3 week lead time
# =============================================================================
SANDATA_API_KEY=your-api-key-here
SANDATA_PROVIDER_ID=your-7-digit-odme-provider-id
SANDATA_ENVIRONMENT=sandbox

# =============================================================================
# LEAVE AS DEFAULT FOR NOW
# =============================================================================
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:3001,http://localhost:3002
FRONTEND_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
```

### 0.3 External Service Signups (Do TODAY)

| Service | URL | Time to Setup | Cost |
|---------|-----|---------------|------|
| **SendGrid** | https://sendgrid.com | 5 minutes | FREE (40k emails/mo) |
| **Twilio** | https://twilio.com | 10 minutes | FREE trial + $15 |
| **Sandata** | Contact your rep | 2-3 WEEKS | Included |

**⚠️ CRITICAL: Call Sandata TODAY** - They have the longest lead time.

### 0.4 Verify Setup

```bash
cd backend
npm install
npm run build
# Should compile without errors (may have warnings)

npm run dev:api
# Should start on port 3000

curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

---

## SPRINT 1: FOUNDATION (DAYS 1-5)

### Day 1: Database Migrations

#### Task 1.1: Run Existing Migrations (2 hours)

```bash
cd backend

# Create migration runner script
cat > run-migrations.js << 'EOF'
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'src/database/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`✅ ${file} completed`);
    } catch (err) {
      console.error(`❌ ${file} failed:`, err.message);
      // Continue with other migrations
    }
  }
  await pool.end();
}

runMigrations();
EOF

# Run migrations
node run-migrations.js
```

#### Task 1.2: Create Missing Auth Tables (1 hour)

Create file: `backend/src/database/migrations/024_auth_tables.sql`

```sql
-- ============================================================================
-- Authentication Tables Migration
-- Sessions and Password Reset Tokens
-- ============================================================================

-- Sessions table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_refresh_token (refresh_token),
    INDEX idx_sessions_expires_at (expires_at)
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_password_reset_user_id (user_id),
    INDEX idx_password_reset_token (token)
);

-- Morning check-ins table
CREATE TABLE IF NOT EXISTS morning_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pod_id UUID REFERENCES pods(id),
    check_in_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    check_in_time TIMESTAMP WITH TIME ZONE,
    method VARCHAR(20), -- sms, app, call, manual
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, check_in_date),
    CONSTRAINT valid_checkin_status CHECK (status IN ('pending', 'available', 'unavailable', 'late', 'absent', 'excused'))
);

-- Shifts table (if not in existing migrations)
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
);

-- Certifications table
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
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO feature_flags (key, value, description) VALUES
    ('claims_gate_enabled', false, 'Block claims without Sandata acknowledgment'),
    ('sandata_sandbox_enabled', true, 'Use Sandata sandbox environment'),
    ('morning_checkin_notifications', true, 'Send morning check-in SMS notifications'),
    ('auto_sandata_sync', false, 'Automatically sync to Sandata')
ON CONFLICT (key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_date ON shifts(caregiver_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_shifts_client_date ON shifts(client_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_certifications_expiration ON certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_morning_checkins_date ON morning_check_ins(check_in_date);
```

### Day 2: Core Repository Implementation

#### Task 2.1: Create Main Repository File (4 hours)

Create file: `backend/src/repositories/core.repository.ts`

```typescript
/**
 * Core Repository
 * Main data access layer for Serenity ERP
 *
 * Implements all CRUD operations for:
 * - Users (authentication, profiles)
 * - Sessions (JWT refresh tokens)
 * - Clients (patients)
 * - Shifts (scheduled visits)
 * - Pods (team management)
 * - Morning Check-ins
 * - Certifications
 * - Audit Logs
 */

import { Pool, QueryResult } from 'pg';

// Database connection
let pool: Pool;

export function initializePool(connectionString: string): void {
  pool = new Pool({ connectionString });
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

// ============================================================================
// USERS - Authentication & Profiles
// ============================================================================

export interface User {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  status: string;
  last_login?: Date;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await getPool().query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await getPool().query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser(user: {
  organizationId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}): Promise<User> {
  const result = await getPool().query<User>(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     RETURNING *`,
    [user.organizationId, user.email.toLowerCase(), user.passwordHash,
     user.firstName, user.lastName, user.phone, user.role]
  );
  return result.rows[0];
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'status', 'password_hash', 'last_login'];

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (allowedFields.includes(snakeKey) && value !== undefined) {
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getUserById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function getActiveUsers(organizationId: string): Promise<User[]> {
  const result = await getPool().query<User>(
    `SELECT * FROM users WHERE organization_id = $1 AND status = 'active' ORDER BY last_name, first_name`,
    [organizationId]
  );
  return result.rows;
}

export async function getUsersByRole(organizationId: string, role: string): Promise<User[]> {
  const result = await getPool().query<User>(
    `SELECT * FROM users WHERE organization_id = $1 AND role = $2 AND status = 'active'`,
    [organizationId, role]
  );
  return result.rows;
}

// ============================================================================
// SESSIONS - JWT Refresh Token Management
// ============================================================================

export interface Session {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  revoked_at?: Date;
  user_agent?: string;
  ip_address?: string;
  created_at: Date;
}

export async function createSession(session: {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}): Promise<Session> {
  const result = await getPool().query<Session>(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [session.userId, session.refreshToken, session.expiresAt, session.userAgent, session.ipAddress]
  );
  return result.rows[0];
}

export async function getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
  const result = await getPool().query<Session>(
    `SELECT * FROM sessions
     WHERE refresh_token = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [refreshToken]
  );
  return result.rows[0] || null;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await getPool().query(
    `UPDATE sessions SET revoked_at = NOW() WHERE id = $1`,
    [sessionId]
  );
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await getPool().query(
    `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const result = await getPool().query<Session>(
    `SELECT * FROM sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ============================================================================
// PASSWORD RESET TOKENS
// ============================================================================

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at?: Date;
  created_at: Date;
}

export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
  const result = await getPool().query<PasswordResetToken>(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, token, expiresAt]
  );
  return result.rows[0];
}

export async function getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const result = await getPool().query<PasswordResetToken>(
    `SELECT * FROM password_reset_tokens
     WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [token]
  );
  return result.rows[0] || null;
}

export async function markPasswordResetTokenUsed(tokenId: string): Promise<void> {
  await getPool().query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenId]
  );
}

// ============================================================================
// CLIENTS (Patients)
// ============================================================================

export interface Client {
  id: string;
  organization_id: string;
  pod_id: string;
  client_code: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  medicaid_number?: string;
  address: any;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function getClientById(id: string): Promise<Client | null> {
  const result = await getPool().query<Client>(
    'SELECT * FROM clients WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getActiveClients(organizationId: string): Promise<Client[]> {
  const result = await getPool().query<Client>(
    `SELECT * FROM clients WHERE organization_id = $1 AND status = 'active' ORDER BY last_name, first_name`,
    [organizationId]
  );
  return result.rows;
}

export async function getClientsByPod(podId: string): Promise<Client[]> {
  const result = await getPool().query<Client>(
    `SELECT * FROM clients WHERE pod_id = $1 AND status = 'active' ORDER BY last_name, first_name`,
    [podId]
  );
  return result.rows;
}

export async function createClient(client: {
  organizationId: string;
  podId: string;
  clientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  medicaidNumber?: string;
  address: any;
}): Promise<Client> {
  const result = await getPool().query<Client>(
    `INSERT INTO clients (organization_id, pod_id, client_code, first_name, last_name, date_of_birth, medicaid_number, address, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
     RETURNING *`,
    [client.organizationId, client.podId, client.clientCode, client.firstName,
     client.lastName, client.dateOfBirth, client.medicaidNumber, JSON.stringify(client.address)]
  );
  return result.rows[0];
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['id', 'organization_id', 'created_at'].includes(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(key === 'address' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return getClientById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<Client>(
    `UPDATE clients SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function getClientByMedicaidNumber(medicaidNumber: string, organizationId: string): Promise<Client | null> {
  const result = await getPool().query<Client>(
    `SELECT * FROM clients WHERE medicaid_number = $1 AND organization_id = $2`,
    [medicaidNumber, organizationId]
  );
  return result.rows[0] || null;
}

// ============================================================================
// SHIFTS
// ============================================================================

export interface Shift {
  id: string;
  organization_id: string;
  pod_id?: string;
  caregiver_id: string;
  client_id: string;
  scheduled_start: Date;
  scheduled_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  status: string;
  service_code?: string;
  authorization_number?: string;
  evv_record_id?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export async function getShiftById(id: string): Promise<Shift | null> {
  const result = await getPool().query<Shift>(
    'SELECT * FROM shifts WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getShiftsByDate(organizationId: string, date: Date): Promise<Shift[]> {
  const result = await getPool().query<Shift>(
    `SELECT s.*,
            u.first_name as caregiver_first_name, u.last_name as caregiver_last_name,
            c.first_name as client_first_name, c.last_name as client_last_name
     FROM shifts s
     JOIN users u ON s.caregiver_id = u.id
     JOIN clients c ON s.client_id = c.id
     WHERE s.organization_id = $1
       AND DATE(s.scheduled_start) = $2
     ORDER BY s.scheduled_start`,
    [organizationId, date]
  );
  return result.rows;
}

export async function getShiftsByCaregiver(caregiverId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
  const result = await getPool().query<Shift>(
    `SELECT * FROM shifts
     WHERE caregiver_id = $1
       AND scheduled_start >= $2
       AND scheduled_start <= $3
     ORDER BY scheduled_start`,
    [caregiverId, startDate, endDate]
  );
  return result.rows;
}

export async function getShiftsByClient(clientId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
  const result = await getPool().query<Shift>(
    `SELECT * FROM shifts
     WHERE client_id = $1
       AND scheduled_start >= $2
       AND scheduled_start <= $3
     ORDER BY scheduled_start`,
    [clientId, startDate, endDate]
  );
  return result.rows;
}

export async function createShift(shift: {
  organizationId: string;
  podId?: string;
  caregiverId: string;
  clientId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  serviceCode?: string;
  authorizationNumber?: string;
  notes?: string;
  createdBy?: string;
}): Promise<Shift> {
  const result = await getPool().query<Shift>(
    `INSERT INTO shifts (organization_id, pod_id, caregiver_id, client_id, scheduled_start, scheduled_end,
                         service_code, authorization_number, notes, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
     RETURNING *`,
    [shift.organizationId, shift.podId, shift.caregiverId, shift.clientId,
     shift.scheduledStart, shift.scheduledEnd, shift.serviceCode,
     shift.authorizationNumber, shift.notes, shift.createdBy]
  );
  return result.rows[0];
}

export async function updateShift(id: string, updates: Partial<Shift>): Promise<Shift | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['id', 'organization_id', 'created_at', 'created_by'].includes(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getShiftById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<Shift>(
    `UPDATE shifts SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteShift(id: string): Promise<boolean> {
  const result = await getPool().query(
    `DELETE FROM shifts WHERE id = $1`,
    [id]
  );
  return (result.rowCount || 0) > 0;
}

// ============================================================================
// PODS
// ============================================================================

export interface Pod {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  team_lead_id?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function getPodById(id: string): Promise<Pod | null> {
  const result = await getPool().query<Pod>(
    'SELECT * FROM pods WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getPods(organizationId: string): Promise<Pod[]> {
  const result = await getPool().query<Pod>(
    `SELECT * FROM pods WHERE organization_id = $1 ORDER BY name`,
    [organizationId]
  );
  return result.rows;
}

export async function getActivePods(organizationId: string): Promise<Pod[]> {
  const result = await getPool().query<Pod>(
    `SELECT * FROM pods WHERE organization_id = $1 AND status = 'active' ORDER BY name`,
    [organizationId]
  );
  return result.rows;
}

export async function createPod(pod: {
  organizationId: string;
  code: string;
  name: string;
  city: string;
  state?: string;
  capacity?: number;
  teamLeadId?: string;
}): Promise<Pod> {
  const result = await getPool().query<Pod>(
    `INSERT INTO pods (organization_id, code, name, city, state, capacity, team_lead_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     RETURNING *`,
    [pod.organizationId, pod.code, pod.name, pod.city, pod.state || 'OH', pod.capacity || 35, pod.teamLeadId]
  );
  return result.rows[0];
}

export async function updatePod(id: string, updates: Partial<Pod>): Promise<Pod | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['id', 'organization_id', 'created_at'].includes(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getPodById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<Pod>(
    `UPDATE pods SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function getPodMembers(podId: string): Promise<User[]> {
  const result = await getPool().query<User>(
    `SELECT u.* FROM users u
     JOIN user_pod_memberships upm ON u.id = upm.user_id
     WHERE upm.pod_id = $1 AND upm.status = 'active'
     ORDER BY u.last_name, u.first_name`,
    [podId]
  );
  return result.rows;
}

export async function assignUserToPod(userId: string, podId: string, roleInPod: string, grantedBy?: string): Promise<void> {
  await getPool().query(
    `INSERT INTO user_pod_memberships (user_id, pod_id, role_in_pod, granted_by, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (user_id, pod_id) DO UPDATE SET role_in_pod = $3, status = 'active', granted_at = NOW()`,
    [userId, podId, roleInPod, grantedBy]
  );
}

export async function removeUserFromPod(userId: string, podId: string): Promise<void> {
  await getPool().query(
    `UPDATE user_pod_memberships SET status = 'inactive' WHERE user_id = $1 AND pod_id = $2`,
    [userId, podId]
  );
}

// ============================================================================
// MORNING CHECK-INS
// ============================================================================

export interface MorningCheckIn {
  id: string;
  user_id: string;
  organization_id: string;
  pod_id?: string;
  check_in_date: Date;
  status: string;
  check_in_time?: Date;
  method?: string;
  notes?: string;
  recorded_by?: string;
  created_at: Date;
  updated_at: Date;
}

export async function getMorningCheckIns(organizationId: string, date: Date): Promise<MorningCheckIn[]> {
  const result = await getPool().query<MorningCheckIn>(
    `SELECT mci.*, u.first_name, u.last_name, u.phone
     FROM morning_check_ins mci
     JOIN users u ON mci.user_id = u.id
     WHERE mci.organization_id = $1 AND mci.check_in_date = $2
     ORDER BY mci.check_in_time`,
    [organizationId, date]
  );
  return result.rows;
}

export async function getMorningCheckInsByPod(podId: string, date: Date): Promise<MorningCheckIn[]> {
  const result = await getPool().query<MorningCheckIn>(
    `SELECT mci.*, u.first_name, u.last_name, u.phone
     FROM morning_check_ins mci
     JOIN users u ON mci.user_id = u.id
     WHERE mci.pod_id = $1 AND mci.check_in_date = $2
     ORDER BY mci.check_in_time`,
    [podId, date]
  );
  return result.rows;
}

export async function createMorningCheckIn(checkIn: {
  userId: string;
  organizationId: string;
  podId?: string;
  checkInDate: Date;
  status: string;
  checkInTime?: Date;
  method?: string;
  notes?: string;
  recordedBy?: string;
}): Promise<MorningCheckIn> {
  const result = await getPool().query<MorningCheckIn>(
    `INSERT INTO morning_check_ins (user_id, organization_id, pod_id, check_in_date, status, check_in_time, method, notes, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, check_in_date) DO UPDATE
       SET status = $5, check_in_time = $6, method = $7, notes = $8, recorded_by = $9, updated_at = NOW()
     RETURNING *`,
    [checkIn.userId, checkIn.organizationId, checkIn.podId, checkIn.checkInDate,
     checkIn.status, checkIn.checkInTime, checkIn.method, checkIn.notes, checkIn.recordedBy]
  );
  return result.rows[0];
}

export async function updateMorningCheckIn(id: string, updates: Partial<MorningCheckIn>): Promise<MorningCheckIn | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['id', 'user_id', 'organization_id', 'check_in_date', 'created_at'].includes(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<MorningCheckIn>(
    `UPDATE morning_check_ins SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export interface Certification {
  id: string;
  user_id: string;
  organization_id: string;
  certification_type: string;
  certification_number?: string;
  issuing_authority?: string;
  issue_date: Date;
  expiration_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function getUserCertifications(userId: string): Promise<Certification[]> {
  const result = await getPool().query<Certification>(
    `SELECT * FROM certifications WHERE user_id = $1 ORDER BY expiration_date`,
    [userId]
  );
  return result.rows;
}

export async function getExpiringCertifications(organizationId: string, daysUntilExpiration: number): Promise<Certification[]> {
  const result = await getPool().query<Certification>(
    `SELECT c.*, u.first_name, u.last_name, u.email
     FROM certifications c
     JOIN users u ON c.user_id = u.id
     WHERE c.organization_id = $1
       AND c.status = 'active'
       AND c.expiration_date <= NOW() + INTERVAL '1 day' * $2
     ORDER BY c.expiration_date`,
    [organizationId, daysUntilExpiration]
  );
  return result.rows;
}

export async function createCertification(cert: {
  userId: string;
  organizationId: string;
  certificationType: string;
  certificationNumber?: string;
  issuingAuthority?: string;
  issueDate: Date;
  expirationDate: Date;
}): Promise<Certification> {
  const result = await getPool().query<Certification>(
    `INSERT INTO certifications (user_id, organization_id, certification_type, certification_number,
                                  issuing_authority, issue_date, expiration_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     RETURNING *`,
    [cert.userId, cert.organizationId, cert.certificationType, cert.certificationNumber,
     cert.issuingAuthority, cert.issueDate, cert.expirationDate]
  );
  return result.rows[0];
}

export async function updateCertification(id: string, updates: Partial<Certification>): Promise<Certification | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['id', 'user_id', 'organization_id', 'created_at'].includes(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<Certification>(
    `UPDATE certifications SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export interface AuditLog {
  id: string;
  organization_id: string;
  pod_id?: string;
  event_type: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  outcome: string;
  ip_address?: string;
  user_agent?: string;
  event_data?: any;
  phi_accessed: boolean;
  timestamp: Date;
}

export async function createAuditLog(log: {
  organizationId: string;
  podId?: string;
  eventType: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  outcome: string;
  ipAddress?: string;
  userAgent?: string;
  eventData?: any;
  phiAccessed?: boolean;
}): Promise<AuditLog> {
  const result = await getPool().query<AuditLog>(
    `INSERT INTO audit_events (organization_id, pod_id, event_type, user_id, resource_type,
                                resource_id, action, outcome, ip_address, user_agent, event_data, phi_accessed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [log.organizationId, log.podId, log.eventType, log.userId, log.resourceType,
     log.resourceId, log.action, log.outcome, log.ipAddress, log.userAgent,
     log.eventData ? JSON.stringify(log.eventData) : null, log.phiAccessed || false]
  );
  return result.rows[0];
}

export async function getAuditLogs(organizationId: string, filters: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  const conditions: string[] = ['organization_id = $1'];
  const values: any[] = [organizationId];
  let paramIndex = 2;

  if (filters.startDate) {
    conditions.push(`timestamp >= $${paramIndex++}`);
    values.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`timestamp <= $${paramIndex++}`);
    values.push(filters.endDate);
  }
  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    values.push(filters.userId);
  }
  if (filters.eventType) {
    conditions.push(`event_type = $${paramIndex++}`);
    values.push(filters.eventType);
  }
  if (filters.resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    values.push(filters.resourceType);
  }

  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  const result = await getPool().query<AuditLog>(
    `SELECT * FROM audit_events
     WHERE ${conditions.join(' AND ')}
     ORDER BY timestamp DESC
     LIMIT ${limit} OFFSET ${offset}`,
    values
  );
  return result.rows;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlag {
  key: string;
  value: boolean;
  description?: string;
  organization_id?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export async function getFeatureFlags(organizationId?: string): Promise<FeatureFlag[]> {
  const result = await getPool().query<FeatureFlag>(
    `SELECT * FROM feature_flags WHERE organization_id IS NULL OR organization_id = $1`,
    [organizationId]
  );
  return result.rows;
}

export async function getFeatureFlag(key: string): Promise<FeatureFlag | null> {
  const result = await getPool().query<FeatureFlag>(
    `SELECT * FROM feature_flags WHERE key = $1`,
    [key]
  );
  return result.rows[0] || null;
}

export async function updateFeatureFlag(key: string, value: boolean, updatedBy?: string): Promise<FeatureFlag | null> {
  const result = await getPool().query<FeatureFlag>(
    `UPDATE feature_flags SET value = $2, updated_by = $3, updated_at = NOW() WHERE key = $1 RETURNING *`,
    [key, value, updatedBy]
  );
  return result.rows[0] || null;
}

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  settings: any;
  created_at: Date;
  updated_at: Date;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const result = await getPool().query<Organization>(
    'SELECT * FROM organizations WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const result = await getPool().query<Organization>(
    'SELECT * FROM organizations ORDER BY name'
  );
  return result.rows;
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['id', 'created_at'].includes(key)) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(key === 'settings' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return getOrganizationById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await getPool().query<Organization>(
    `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

// ============================================================================
// EVV RECORDS (Extended from Sandata Repository)
// ============================================================================

export interface EVVRecord {
  id: string;
  organization_id: string;
  pod_id?: string;
  visit_id?: string;
  shift_id?: string;
  caregiver_id: string;
  client_id: string;
  clock_in_time?: Date;
  clock_out_time?: Date;
  clock_in_location?: any;
  clock_out_location?: any;
  clock_in_method?: string;
  clock_out_method?: string;
  service_code?: string;
  sandata_status?: string;
  sandata_visit_id?: string;
  compliance_status: string;
  created_at: Date;
  updated_at: Date;
}

export async function createEVVRecord(record: {
  organizationId: string;
  podId?: string;
  shiftId?: string;
  caregiverId: string;
  clientId: string;
  clockInTime: Date;
  clockInLocation: { latitude: number; longitude: number };
  clockInMethod: string;
  serviceCode?: string;
}): Promise<EVVRecord> {
  const result = await getPool().query<EVVRecord>(
    `INSERT INTO evv_records (organization_id, pod_id, shift_id, caregiver_id, client_id,
                              clock_in_time, clock_in_location, clock_in_method, service_code, compliance_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
     RETURNING *`,
    [record.organizationId, record.podId, record.shiftId, record.caregiverId, record.clientId,
     record.clockInTime, JSON.stringify(record.clockInLocation), record.clockInMethod, record.serviceCode]
  );
  return result.rows[0];
}

export async function updateEVVRecordClockOut(id: string, clockOut: {
  clockOutTime: Date;
  clockOutLocation: { latitude: number; longitude: number };
  clockOutMethod: string;
}): Promise<EVVRecord | null> {
  const result = await getPool().query<EVVRecord>(
    `UPDATE evv_records
     SET clock_out_time = $2, clock_out_location = $3, clock_out_method = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, clockOut.clockOutTime, JSON.stringify(clockOut.clockOutLocation), clockOut.clockOutMethod]
  );
  return result.rows[0] || null;
}

export async function getEVVRecordsByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<EVVRecord[]> {
  const result = await getPool().query<EVVRecord>(
    `SELECT * FROM evv_records
     WHERE organization_id = $1
       AND clock_in_time >= $2
       AND clock_in_time <= $3
     ORDER BY clock_in_time`,
    [organizationId, startDate, endDate]
  );
  return result.rows;
}

// Export all functions
export default {
  initializePool,
  getPool,
  // Users
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getActiveUsers,
  getUsersByRole,
  // Sessions
  createSession,
  getSessionByRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
  // Password Reset
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  // Clients
  getClientById,
  getActiveClients,
  getClientsByPod,
  createClient,
  updateClient,
  getClientByMedicaidNumber,
  // Shifts
  getShiftById,
  getShiftsByDate,
  getShiftsByCaregiver,
  getShiftsByClient,
  createShift,
  updateShift,
  deleteShift,
  // Pods
  getPodById,
  getPods,
  getActivePods,
  createPod,
  updatePod,
  getPodMembers,
  assignUserToPod,
  removeUserFromPod,
  // Morning Check-ins
  getMorningCheckIns,
  getMorningCheckInsByPod,
  createMorningCheckIn,
  updateMorningCheckIn,
  // Certifications
  getUserCertifications,
  getExpiringCertifications,
  createCertification,
  updateCertification,
  // Audit
  createAuditLog,
  getAuditLogs,
  // Feature Flags
  getFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
  // Organizations
  getOrganizationById,
  getAllOrganizations,
  updateOrganization,
  // EVV
  createEVVRecord,
  updateEVVRecordClockOut,
  getEVVRecordsByDateRange,
};
```

### Day 3: Wire Authentication Routes

#### Task 3.1: Update Auth Routes to Use Repository (3 hours)

The auth routes at `backend/src/api/routes/auth/index.ts` need to be updated to use the new repository. Here's the key changes needed:

**Replace mock implementations with:**

```typescript
// At top of file, add import:
import * as repo from '../../../repositories/core.repository';

// In login handler, replace mock with:
const user = await repo.getUserByEmail(email);
if (!user) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

// After successful password verification:
await repo.createSession({
  userId: user.id,
  refreshToken,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip
});

// In register handler:
const newUser = await repo.createUser({
  organizationId: 'org-serenity-001', // Default org
  email,
  passwordHash: hashedPassword,
  firstName,
  lastName,
  phone,
  role: 'caregiver'
});
```

### Day 4: Seed Initial Data

#### Task 4.1: Create Seed Script (2 hours)

Create file: `backend/src/database/seeds/seed-initial-data.ts`

```typescript
/**
 * Initial Data Seed Script
 * Creates founder user and sample data for testing
 */

import bcrypt from 'bcrypt';
import { getPool } from '../../repositories/core.repository';

async function seedInitialData() {
  const pool = getPool();

  console.log('🌱 Seeding initial data...');

  // 1. Create founder user (you!)
  const founderPassword = await bcrypt.hash('ChangeMe123!', 10);

  await pool.query(`
    INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, status)
    VALUES (
      'usr-founder-001',
      'org-serenity-001',
      'founder@serenitycarepartners.com',
      $1,
      'Admin',
      'Founder',
      '+15135551234',
      'founder',
      'active'
    )
    ON CONFLICT (email) DO UPDATE SET password_hash = $1
  `, [founderPassword]);
  console.log('✅ Founder user created');

  // 2. Create sample Pod Lead
  const podLeadPassword = await bcrypt.hash('PodLead123!', 10);

  await pool.query(`
    INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, phone, role, status)
    VALUES (
      'usr-podlead-001',
      'org-serenity-001',
      'podlead@serenitycarepartners.com',
      $1,
      'Sarah',
      'Johnson',
      '+15135551235',
      'field_supervisor',
      'active'
    )
    ON CONFLICT (email) DO NOTHING
  `, [podLeadPassword]);
  console.log('✅ Pod Lead user created');

  // 3. Create sample caregivers
  const caregiverPassword = await bcrypt.hash('Caregiver123!', 10);

  const caregivers = [
    { id: 'usr-cg-001', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@serenitycarepartners.com' },
    { id: 'usr-cg-002', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@serenitycarepartners.com' },
    { id: 'usr-cg-003', firstName: 'Emily', lastName: 'Chen', email: 'emily.chen@serenitycarepartners.com' },
  ];

  for (const cg of caregivers) {
    await pool.query(`
      INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, status)
      VALUES ($1, 'org-serenity-001', $2, $3, $4, $5, 'caregiver', 'active')
      ON CONFLICT (email) DO NOTHING
    `, [cg.id, cg.email, caregiverPassword, cg.firstName, cg.lastName]);
  }
  console.log('✅ Sample caregivers created');

  // 4. Assign users to pods
  await pool.query(`
    INSERT INTO user_pod_memberships (user_id, pod_id, role_in_pod, is_primary, status)
    VALUES
      ('usr-podlead-001', 'pod-cin-a-001', 'team_lead', true, 'active'),
      ('usr-cg-001', 'pod-cin-a-001', 'caregiver', true, 'active'),
      ('usr-cg-002', 'pod-cin-a-001', 'caregiver', true, 'active'),
      ('usr-cg-003', 'pod-cin-b-001', 'caregiver', true, 'active')
    ON CONFLICT DO NOTHING
  `);
  console.log('✅ Pod memberships assigned');

  // 5. Create sample clients
  const clients = [
    { id: 'cli-001', code: 'SCP-001', firstName: 'Robert', lastName: 'Smith', medicaid: '123456789A', pod: 'pod-cin-a-001' },
    { id: 'cli-002', code: 'SCP-002', firstName: 'Dorothy', lastName: 'Johnson', medicaid: '234567890B', pod: 'pod-cin-a-001' },
    { id: 'cli-003', code: 'SCP-003', firstName: 'William', lastName: 'Brown', medicaid: '345678901C', pod: 'pod-cin-b-001' },
  ];

  for (const client of clients) {
    await pool.query(`
      INSERT INTO clients (id, organization_id, pod_id, client_code, first_name, last_name, medicaid_number, address, status)
      VALUES ($1, 'org-serenity-001', $2, $3, $4, $5, $6, $7, 'active')
      ON CONFLICT (client_code) DO NOTHING
    `, [client.id, client.pod, client.code, client.firstName, client.lastName, client.medicaid,
        JSON.stringify({ street: '123 Main St', city: 'Cincinnati', state: 'OH', zip: '45202' })]);
  }
  console.log('✅ Sample clients created');

  // 6. Create sample shifts for today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const shifts = [
    { caregiver: 'usr-cg-001', client: 'cli-001', start: '08:00', end: '12:00', pod: 'pod-cin-a-001' },
    { caregiver: 'usr-cg-001', client: 'cli-002', start: '13:00', end: '17:00', pod: 'pod-cin-a-001' },
    { caregiver: 'usr-cg-002', client: 'cli-002', start: '09:00', end: '13:00', pod: 'pod-cin-a-001' },
    { caregiver: 'usr-cg-003', client: 'cli-003', start: '10:00', end: '14:00', pod: 'pod-cin-b-001' },
  ];

  for (const shift of shifts) {
    const startTime = new Date(today);
    startTime.setHours(parseInt(shift.start.split(':')[0]), parseInt(shift.start.split(':')[1]), 0, 0);

    const endTime = new Date(today);
    endTime.setHours(parseInt(shift.end.split(':')[0]), parseInt(shift.end.split(':')[1]), 0, 0);

    await pool.query(`
      INSERT INTO shifts (organization_id, pod_id, caregiver_id, client_id, scheduled_start, scheduled_end, status, service_code)
      VALUES ('org-serenity-001', $1, $2, $3, $4, $5, 'scheduled', 'T1019')
      ON CONFLICT DO NOTHING
    `, [shift.pod, shift.caregiver, shift.client, startTime, endTime]);
  }
  console.log('✅ Sample shifts created');

  console.log('\n🎉 Initial data seeding complete!');
  console.log('\n📝 Login credentials:');
  console.log('   Founder: founder@serenitycarepartners.com / ChangeMe123!');
  console.log('   Pod Lead: podlead@serenitycarepartners.com / PodLead123!');
  console.log('   Caregivers: [name]@serenitycarepartners.com / Caregiver123!');

  await pool.end();
}

seedInitialData().catch(console.error);
```

### Day 5: Test Authentication Flow

#### Task 5.1: Test Login/Register (2 hours)

```bash
# Start the server
cd backend
npm run dev:api

# Test health endpoint
curl http://localhost:3000/health

# Test login with founder account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@serenitycarepartners.com","password":"ChangeMe123!"}'

# Should return: { "accessToken": "...", "refreshToken": "...", "user": {...} }

# Test protected endpoint
curl http://localhost:3000/api/console/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## SPRINT 2: CORE OPERATIONS (DAYS 6-10)

### Day 6-7: Connect Console Routes to Repository

#### Task 6.1: Update Console Dashboard Route

File: `backend/src/api/routes/console/dashboard.ts`

Replace mock data with repository calls for:
- Total patients count
- Active caregivers count
- Today's scheduled shifts
- EVV compliance rate

#### Task 6.2: Update Shifts Route

File: `backend/src/api/routes/console/shifts.ts` (if exists) or create it

```typescript
import { Router } from 'express';
import * as repo from '../../../repositories/core.repository';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Get shifts for a date
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, podId, caregiverId, clientId } = req.query;
    const organizationId = req.user?.organizationId || 'org-serenity-001';

    let shifts;
    if (caregiverId) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      shifts = await repo.getShiftsByCaregiver(caregiverId as string, startDate, endDate);
    } else {
      shifts = await repo.getShiftsByDate(organizationId, new Date(date as string));
    }

    res.json({ shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Create a new shift
router.post('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org-serenity-001';
    const { podId, caregiverId, clientId, scheduledStart, scheduledEnd, serviceCode, authorizationNumber, notes } = req.body;

    const shift = await repo.createShift({
      organizationId,
      podId,
      caregiverId,
      clientId,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      serviceCode,
      authorizationNumber,
      notes,
      createdBy: req.user?.id
    });

    // Log audit event
    await repo.createAuditLog({
      organizationId,
      eventType: 'shift_created',
      userId: req.user?.id,
      resourceType: 'shift',
      resourceId: shift.id,
      action: 'create',
      outcome: 'success',
      phiAccessed: true
    });

    res.status(201).json({ shift });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// Update a shift
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const shift = await repo.updateShift(id, updates);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({ shift });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

// Delete a shift
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await repo.deleteShift(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

export default router;
```

### Day 8-9: Morning Check-In Workflow

#### Task 8.1: Create Morning Check-In Route

File: `backend/src/api/routes/console/morning-checkin.ts`

```typescript
import { Router } from 'express';
import * as repo from '../../../repositories/core.repository';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Get today's check-in status for all caregivers
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org-serenity-001';
    const { podId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkIns;
    if (podId) {
      checkIns = await repo.getMorningCheckInsByPod(podId as string, today);
    } else {
      checkIns = await repo.getMorningCheckIns(organizationId, today);
    }

    // Get all active caregivers to show who hasn't checked in
    const caregivers = await repo.getUsersByRole(organizationId, 'caregiver');

    // Merge check-in status with caregiver list
    const checkinStatus = caregivers.map(cg => {
      const checkin = checkIns.find(ci => ci.user_id === cg.id);
      return {
        caregiverId: cg.id,
        caregiverName: `${cg.first_name} ${cg.last_name}`,
        phone: cg.phone,
        status: checkin?.status || 'not_checked_in',
        checkInTime: checkin?.check_in_time,
        method: checkin?.method,
        notes: checkin?.notes
      };
    });

    res.json({
      date: today,
      checkIns: checkinStatus,
      summary: {
        total: caregivers.length,
        available: checkinStatus.filter(c => c.status === 'available').length,
        unavailable: checkinStatus.filter(c => c.status === 'unavailable').length,
        notCheckedIn: checkinStatus.filter(c => c.status === 'not_checked_in').length
      }
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// Record a check-in
router.post('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org-serenity-001';
    const { userId, podId, status, method, notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = await repo.createMorningCheckIn({
      userId,
      organizationId,
      podId,
      checkInDate: today,
      status,
      checkInTime: new Date(),
      method: method || 'manual',
      notes,
      recordedBy: req.user?.id
    });

    // If unavailable, might need to trigger dispatch
    if (status === 'unavailable') {
      // TODO: Trigger coverage gap detection
      console.log(`⚠️ Caregiver ${userId} marked unavailable - check for coverage gaps`);
    }

    res.status(201).json({ checkIn });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// Bulk check-in (for SMS responses)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org-serenity-001';
    const { checkIns } = req.body; // Array of { userId, status, method }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];
    for (const ci of checkIns) {
      const checkIn = await repo.createMorningCheckIn({
        userId: ci.userId,
        organizationId,
        checkInDate: today,
        status: ci.status,
        checkInTime: new Date(),
        method: ci.method || 'sms',
        recordedBy: req.user?.id
      });
      results.push(checkIn);
    }

    res.status(201).json({ checkIns: results });
  } catch (error) {
    console.error('Error bulk recording check-ins:', error);
    res.status(500).json({ error: 'Failed to record check-ins' });
  }
});

export default router;
```

### Day 10: Connect Frontend to Real API

#### Task 10.1: Update Frontend API Service

File: `frontend/src/services/api.service.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('accessToken');
    }
    return this.token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, try refresh or redirect to login
      this.token = null;
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const result = await this.fetch<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.accessToken);
    return result;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboard() {
    return this.fetch('/console/dashboard');
  }

  // Shifts
  async getShifts(date: string, podId?: string) {
    const params = new URLSearchParams({ date });
    if (podId) params.append('podId', podId);
    return this.fetch(`/console/shifts?${params}`);
  }

  async createShift(data: any) {
    return this.fetch('/console/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Morning Check-In
  async getMorningCheckIns(podId?: string) {
    const params = podId ? `?podId=${podId}` : '';
    return this.fetch(`/console/morning-checkin/today${params}`);
  }

  async recordCheckIn(data: { userId: string; status: string; notes?: string }) {
    return this.fetch('/console/morning-checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Caregivers
  async getCaregivers() {
    return this.fetch('/console/caregivers');
  }

  // Clients
  async getClients() {
    return this.fetch('/console/clients');
  }

  // Pods
  async getPods() {
    return this.fetch('/console/pods');
  }
}

export const apiService = new ApiService();
export default apiService;
```

---

## SPRINT 3: EVV & MOBILE (DAYS 11-15)

### Day 11-12: Mobile API Integration

#### Task 11.1: Update Mobile Routes with Repository

File: `backend/src/api/routes/mobile/index.ts`

Replace all TODO comments and mock data with real repository calls.

Key endpoints to implement:
- `GET /api/mobile/shifts/today` - Get caregiver's shifts for today
- `POST /api/mobile/evv/clock-in` - Record clock-in with GPS
- `POST /api/mobile/evv/clock-out` - Record clock-out with GPS

### Day 13: Sandata Sandbox Testing

#### Task 13.1: Test Sandata Connection (If credentials received)

```typescript
// backend/src/scripts/test-sandata.ts
import { SandataClient } from '../services/sandata/client';

async function testSandataConnection() {
  const client = new SandataClient({
    apiKey: process.env.SANDATA_API_KEY!,
    providerId: process.env.SANDATA_PROVIDER_ID!,
    environment: 'sandbox'
  });

  try {
    // Test authentication
    const token = await client.authenticate();
    console.log('✅ Sandata authentication successful');

    // Test a simple query
    // const individuals = await client.getIndividuals();
    // console.log('✅ Retrieved individuals:', individuals.length);

  } catch (error) {
    console.error('❌ Sandata connection failed:', error);
  }
}

testSandataConnection();
```

### Day 14-15: Wire EVV Submission

#### Task 14.1: Implement Auto-Submit Job

Replace TODO comments in `backend/src/jobs/sandata-auto-submit.job.ts` with real database queries.

---

## SPRINT 4: BILLING & LAUNCH (DAYS 16-21)

### Day 16-17: Claims Gate Integration

#### Task 16.1: Wire Claims Gate to Real Data

Update `backend/src/modules/billing/claims-gate.service.ts` to query real EVV records before allowing claim submission.

### Day 18-19: End-to-End Testing

#### Task 18.1: Complete User Flow Test

Test the following flow:
1. Login as founder
2. Create a client
3. Create a caregiver
4. Assign to pod
5. Create a shift
6. Caregiver logs in (mobile or web)
7. Caregiver clocks in with GPS
8. Caregiver clocks out
9. EVV record created
10. EVV submitted to Sandata (sandbox)
11. Claim generated (if EVV accepted)

### Day 20: Soft Launch Preparation

#### Task 20.1: Production Checklist

```markdown
## Pre-Launch Checklist

### Infrastructure
- [ ] PostgreSQL production database created
- [ ] Redis instance running
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Backup schedule active

### Security
- [ ] JWT_SECRET changed from default
- [ ] All passwords updated from dev defaults
- [ ] CORS origins restricted to production URLs
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

### External Services
- [ ] SendGrid API key (production)
- [ ] Twilio credentials (production)
- [ ] Sandata credentials (production or sandbox approved)

### Data
- [ ] Founder account created
- [ ] At least one pod created
- [ ] Test client removed or marked
- [ ] Test caregiver removed or marked

### Monitoring
- [ ] Error logging configured
- [ ] Health check endpoint working
- [ ] Backup tested
```

### Day 21: GO LIVE 🚀

#### Task 21.1: Deploy and Monitor

1. Deploy backend to production
2. Deploy frontend
3. Accept first patient referral
4. Monitor logs for errors
5. Celebrate! 🎉

---

## EXTERNAL DEPENDENCIES CHECKLIST

| Service | Sign Up URL | Lead Time | Status |
|---------|-------------|-----------|--------|
| PostgreSQL | AWS RDS or Local | Immediate | ⬜ |
| SendGrid | sendgrid.com | 5 minutes | ⬜ |
| Twilio | twilio.com | 10 minutes | ⬜ |
| Sandata | Contact rep | 2-3 WEEKS | ⬜ |
| Change Healthcare | changehealthcare.com | 1-2 weeks | ⬜ |
| Apple Developer | developer.apple.com | 1-2 days | ⬜ |
| Google Play | play.google.com/console | Immediate | ⬜ |

---

## TECHNICAL DEBT REGISTRY

These items can be addressed after launch:

| Item | Priority | Sprint |
|------|----------|--------|
| Replace remaining mock data in jobs | High | Post-launch Week 1 |
| Implement comprehensive test suite | High | Post-launch Week 1-2 |
| Add frontend error boundaries | Medium | Post-launch Week 2 |
| Implement offline mobile sync | Medium | Post-launch Week 3 |
| Add dashboard caching (Redis) | Low | Post-launch Week 4 |
| Implement AI agents | Low | Phase 2 |
| Add document generation | Low | Phase 2 |

---

## POST-LAUNCH PHASE

### Week 1 After Launch
- Monitor system stability
- Address any critical bugs
- Gather user feedback
- Fine-tune scheduling workflow

### Week 2-4 After Launch
- Scale to 10-20 patients
- Add more caregivers
- Implement credential monitoring
- Set up Change Healthcare (if not done)

### Month 2+
- Scale to full capacity (450 patients, 500 staff)
- Implement remaining AI features
- Add family portal
- Expand to additional pods

---

## SUPPORT & RESOURCES

### Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Backend entry | `backend/src/server.ts` |
| API routes | `backend/src/api/routes/` |
| Repository | `backend/src/repositories/core.repository.ts` |
| Migrations | `backend/src/database/migrations/` |
| Environment | `backend/.env` |
| Frontend entry | `frontend/src/main.tsx` |
| Mobile entry | `mobile/src/App.tsx` |

### Emergency Contacts

- **Sandata Support**: [Your rep's contact]
- **AWS Support**: aws.amazon.com/support
- **SendGrid Support**: support.sendgrid.com
- **Twilio Support**: twilio.com/help

---

**Document Version:** 1.0
**Last Updated:** November 24, 2025
**Next Review:** After Sprint 1

---

## 🎯 REMEMBER: You have patients waiting!

Focus on the critical path:
1. ✅ Database running
2. ✅ Authentication working
3. ✅ Shifts can be created
4. ✅ Clock in/out works
5. ✅ EVV records captured

Everything else can wait until after you start serving patients!
