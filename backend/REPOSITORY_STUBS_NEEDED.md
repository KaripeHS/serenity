# Repository Methods - Implementation Status

This document tracks which repository methods are needed by the API layer and which are implemented.

## Implementation Priority

**P0 - Critical (blocks Phase 0)**:
- Authentication methods (getUserByEmail, createUser, createSession, etc.)
- Basic user queries (getUser, getActiveUsers)
- Basic client queries (getClient, getActiveClients)

**P1 - High (needed for Phase 1)**:
- Pods management (createPod, getPods, assignUsersToPod, etc.)
- Morning check-in (createMorningCheckIn, getMorningCheckIns)
- Shifts management (createShift, getShifts, updateShift)

**P2 - Medium (needed for Phase 2)**:
- Certifications (createCertification, getUserCertifications)
- Audit logs (createAuditLog, getAuditLogs)
- Feature flags (getFeatureFlags, updateFeatureFlag)

**P3 - Low (nice to have)**:
- Advanced metrics (getSystemMetrics, getCaregiverMetrics)
- Complex queries with multiple joins

---

## Status Legend

- ✅ **Implemented** - Method exists with full implementation
- 🟡 **Stub** - Method exists but returns placeholder data
- ❌ **Missing** - Method doesn't exist, needs implementation

---

## Authentication & Sessions (P0 - Critical)

| Method | Status | Notes |
|--------|--------|-------|
| getUserByEmail | 🟡 Stub | Add to repository |
| createUser | 🟡 Stub | Add to repository |
| updateUser | 🟡 Stub | Add to repository |
| createSession | 🟡 Stub | Add to repository |
| getSessionByRefreshToken | 🟡 Stub | Add to repository |
| revokeSession | 🟡 Stub | Add to repository |
| getUserSessions | 🟡 Stub | Add to repository |
| revokeAllUserSessions | 🟡 Stub | Add to repository |
| createPasswordResetToken | 🟡 Stub | Add to repository |
| getPasswordResetToken | 🟡 Stub | Add to repository |
| markPasswordResetTokenUsed | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  refresh_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Users & Clients (P0 - Critical)

| Method | Status | Notes |
|--------|--------|-------|
| getUser | ✅ Implemented | EXISTS |
| getActiveUsers | 🟡 Stub | Add to repository |
| getUsersWithFilters | 🟡 Stub | Add to repository |
| getClient | ✅ Implemented | EXISTS |
| getActiveClients | 🟡 Stub | Add to repository |
| getClientByMedicaidNumber | 🟡 Stub | Add to repository |
| createClient | 🟡 Stub | Add to repository |
| updateClient | 🟡 Stub | Add to repository |

---

## Pods Management (P1 - High)

| Method | Status | Notes |
|--------|--------|-------|
| getPods | 🟡 Stub | Add to repository |
| getPod | 🟡 Stub | Add to repository |
| createPod | 🟡 Stub | Add to repository |
| updatePod | 🟡 Stub | Add to repository |
| getPodMembers | 🟡 Stub | Add to repository |
| getPodClients | 🟡 Stub | Add to repository |
| assignUsersToPod | 🟡 Stub | Add to repository |
| removeUserFromPod | 🟡 Stub | Add to repository |
| assignClientsToPod | 🟡 Stub | Add to repository |
| removeClientFromPod | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  pod_name VARCHAR(100) NOT NULL,
  pod_lead_user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add pod_id to users and clients tables
ALTER TABLE users ADD COLUMN pod_id UUID REFERENCES pods(id);
ALTER TABLE clients ADD COLUMN pod_id UUID REFERENCES pods(id);
```

---

## Morning Check-In (P1 - High)

| Method | Status | Notes |
|--------|--------|-------|
| getMorningCheckIns | 🟡 Stub | Add to repository |
| getMorningCheckIn | 🟡 Stub | Add to repository |
| getMorningCheckInById | 🟡 Stub | Add to repository |
| createMorningCheckIn | 🟡 Stub | Add to repository |
| updateMorningCheckIn | 🟡 Stub | Add to repository |
| getMorningCheckInsWithFilters | 🟡 Stub | Add to repository |
| getMorningCheckInStats | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE morning_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- available, unavailable, late, absent
  check_in_time TIMESTAMP NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

---

## Shifts Management (P1 - High)

| Method | Status | Notes |
|--------|--------|-------|
| getShiftsByDate | 🟡 Stub | Add to repository |
| getShift | 🟡 Stub | Add to repository |
| getShiftsWithFilters | 🟡 Stub | Add to repository |
| createShift | 🟡 Stub | Add to repository |
| updateShift | 🟡 Stub | Add to repository |
| deleteShift | 🟡 Stub | Add to repository |
| getCaregiverShiftsByDateRange | 🟡 Stub | Add to repository |
| getClientShiftsByDateRange | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  caregiver_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, missed, cancelled
  service_code VARCHAR(10),
  authorization_number VARCHAR(100),
  pod_id UUID REFERENCES pods(id),
  evv_record_id UUID REFERENCES evv_records(id),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Certifications (P2 - Medium)

| Method | Status | Notes |
|--------|--------|-------|
| getUserCertifications | 🟡 Stub | Add to repository |
| getCertification | 🟡 Stub | Add to repository |
| createCertification | 🟡 Stub | Add to repository |
| updateCertification | 🟡 Stub | Add to repository |
| getExpiringCertifications | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  certification_type VARCHAR(50) NOT NULL,
  certification_number VARCHAR(100) NOT NULL,
  issuing_authority VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Audit & Admin (P2 - Medium)

| Method | Status | Notes |
|--------|--------|-------|
| createAuditLog | 🟡 Stub | Add to repository |
| getAuditLogs | 🟡 Stub | Add to repository |
| getFeatureFlags | 🟡 Stub | Add to repository |
| getFeatureFlag | 🟡 Stub | Add to repository |
| createFeatureFlag | 🟡 Stub | Add to repository |
| updateFeatureFlag | 🟡 Stub | Add to repository |
| getAllOrganizations | 🟡 Stub | Add to repository |
| getOrganization | 🟡 Stub | Add to repository |
| createOrganization | 🟡 Stub | Add to repository |
| updateOrganization | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feature_flags (
  key VARCHAR(100) PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  sandata_provider_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Care Plans & Authorizations (P2 - Medium)

| Method | Status | Notes |
|--------|--------|-------|
| getClientAuthorizations | 🟡 Stub | Add to repository |
| createAuthorization | 🟡 Stub | Add to repository |
| getClientCarePlan | 🟡 Stub | Add to repository |
| createCarePlan | 🟡 Stub | Add to repository |
| updateCarePlan | 🟡 Stub | Add to repository |

**SQL Needed**:
```sql
CREATE TABLE authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  authorization_number VARCHAR(100) NOT NULL UNIQUE,
  service_code VARCHAR(10) NOT NULL,
  units_approved INTEGER NOT NULL,
  units_used INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  goals TEXT,
  special_instructions TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Metrics & Reporting (P3 - Low)

| Method | Status | Notes |
|--------|--------|-------|
| getCaregiverMetrics | 🟡 Stub | Add to repository |
| getCaregiverClients | 🟡 Stub | Add to repository |
| getCaregiverRecentShifts | 🟡 Stub | Add to repository |
| getClientCaregivers | 🟡 Stub | Add to repository |
| getClientRecentShifts | 🟡 Stub | Add to repository |
| getSystemMetrics | 🟡 Stub | Add to repository |
| getEVVRecordsByDateRange | 🟡 Stub | Add to repository |
| getRecentTransactions | 🟡 Stub | Partial implementation exists |

---

## Implementation Plan

### Week 1 - Phase 0 Critical Path
1. Add authentication tables (sessions, password_reset_tokens)
2. Implement auth repository methods
3. Test login/register flow

### Week 2 - Phase 0 Completion
4. Add basic stubs for all other methods (return empty arrays)
5. Test API endpoints don't crash
6. Deploy with placeholder data

### Week 3-4 - Phase 1
7. Add pods table and implement pod methods
8. Add morning_check_ins table and implement check-in methods
9. Add shifts table and implement shift methods
10. Test full Console workflow

### Week 5-6 - Phase 2
11. Add certifications, audit_logs, feature_flags tables
12. Implement remaining repository methods
13. Full integration testing

---

## Current Workaround

All stub methods currently return:
- Empty arrays for list queries
- `null` for single-item queries
- `'stub-id'` for create operations

This allows the API to function without crashing while development continues.

---

**Last Updated**: 2025-11-02
