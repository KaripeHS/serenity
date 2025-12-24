# Serenity Care Partners ERP - Comprehensive Test Suite

**Document Version:** 2.0.0
**Last Updated:** December 24, 2024
**Author:** Claude Code (AI-Assisted)
**System:** Serenity Care Partners ERP & Marketing Website

---

## Table of Contents

1. [Overview](#1-overview)
2. [Critical Schema Changes](#2-critical-schema-changes)
3. [Test Credentials](#3-test-credentials)
4. [Test Environment Setup](#4-test-environment-setup)
5. [Authentication & Authorization Tests](#5-authentication--authorization-tests)
6. [RBAC & Permission Tests](#6-rbac--permission-tests)
7. [Dashboard & Navigation Tests](#7-dashboard--navigation-tests)
8. [API Endpoint Tests](#8-api-endpoint-tests)
9. [Database Schema Validation Tests](#9-database-schema-validation-tests)
10. [Feature Workflow Tests](#10-feature-workflow-tests)
11. [Visual Consistency Tests](#11-visual-consistency-tests)
12. [Mobile & Responsive Tests](#12-mobile--responsive-tests)
13. [Integration Tests](#13-integration-tests)
14. [Security Tests](#14-security-tests)
15. [Performance Tests](#15-performance-tests)
16. [Accessibility Tests](#16-accessibility-tests)
17. [Data Validation Tests](#17-data-validation-tests)
18. [Error Handling Tests](#18-error-handling-tests)
19. [Cross-Browser Tests](#19-cross-browser-tests)
20. [Regression Test Checklist](#20-regression-test-checklist)
21. [Known Issues & Workarounds](#21-known-issues--workarounds)

---

## 1. Overview

### 1.1 Purpose

This document provides a comprehensive test suite for the Serenity Care Partners ERP system and marketing website. It covers:

- **30 distinct user roles** with varying permission levels
- **60+ frontend routes/dashboards**
- **767+ API endpoints**
- **100+ UI components**
- All critical business workflows
- **Database schema validation** after major refactoring

### 1.2 Version 2.0 Changes

This version incorporates significant database schema changes:
- **Visits renamed to Shifts** throughout the system
- **Caregivers table refactored** - PII now in users table
- **Multiple table/column renames** (see Section 2)
- **Background checks schema updates**
- **Care plans consolidated to single migration**

### 1.3 Test Classification

| Priority | Description | SLA |
|----------|-------------|-----|
| **P0 - Critical** | System unusable, data loss risk, security breach | Immediate |
| **P1 - High** | Major feature broken, significant user impact | < 4 hours |
| **P2 - Medium** | Feature degraded but workaround exists | < 24 hours |
| **P3 - Low** | Minor issue, cosmetic, edge case | < 1 week |

### 1.4 Test Types

| Type | Description |
|------|-------------|
| **Programmatic** | Automated tests (Jest, Playwright, Cypress) |
| **Manual** | Human-executed test cases |
| **Visual** | UI/UX consistency, layout, styling |
| **API** | Backend endpoint validation |
| **Schema** | Database structure validation |
| **Integration** | End-to-end workflow testing |
| **Security** | Penetration, access control testing |
| **Performance** | Load, stress, response time testing |

---

## 2. Critical Schema Changes

### 2.1 BREAKING CHANGES - Must Update All Tests

#### 2.1.1 Visits → Shifts Rename

| Old Term | New Term | Impact |
|----------|----------|--------|
| `visits` table | `shifts` table | All queries must use `shifts` |
| `visit_id` | `shift_id` | Foreign key references updated |
| `visit_notes` | `shift_notes` | Table renamed |
| `visit_status` | `shift_status` | Column renamed |
| EVV "visit" | EVV "shift" | API endpoints updated |

**Test Action:** Search and replace all `visit` references with `shift` in test files.

#### 2.1.2 Caregiver Identity Model

**OLD (Incorrect):**
```sql
SELECT first_name, last_name, email FROM caregivers WHERE id = $1;
```

**NEW (Correct):**
```sql
SELECT u.first_name, u.last_name, u.email
FROM caregivers c
JOIN users u ON c.user_id = u.id
WHERE c.id = $1;
```

**Test Action:** All caregiver queries must JOIN to users table for PII.

#### 2.1.3 Table/Column Renames

| Old Name | New Name | Notes |
|----------|----------|-------|
| `pod_members` | `user_pod_memberships` | Pod governance |
| `pod_members.role` | `user_pod_memberships.role_in_pod` | Avoids role ambiguity |
| `caregivers.status` | `caregivers.employment_status` | Employment status |
| `*.primary_pod_id` | `*.pod_id` | Standardized FK |
| `background_checks.candidate_id` | `background_checks.applicant_id` | References applicants |
| `caregiver_availability` | `caregiver_availability_patterns` | Weekly patterns |
| `users.active` | `users.is_active` | Boolean standard |

#### 2.1.4 Background Checks Schema

| Old Column | New Column |
|------------|------------|
| `candidate_id` | `applicant_id` |
| `provider` | `check_provider` |
| `provider_check_id` | `submission_reference` |
| `package_type` | `check_type` |
| `overall_result` | `result` |

#### 2.1.5 Tables That DO NOT EXIST

Tests must NOT reference these deprecated tables:
- `insurance_claims` → Use `claims_batches`
- `invoices` → Not implemented
- `supervisory_shifts` → Not implemented
- `caregiver_training` → Use `training_assignments`
- `recurring_visit_templates` → Not implemented

---

## 3. Test Credentials

### 3.1 Production Test Domain
- **Console URL:** https://console.serenitycarepartners.com
- **Marketing Site:** https://serenitycarepartners.com
- **API Base:** https://serenity-erp-prod-529254538029.us-central1.run.app

### 3.2 How to Seed Test Users

```bash
cd backend
npx tsx src/database/seeds/seed-test-roles.ts
```

### 3.3 Complete Test Credentials Table

#### Executive Leadership (Full Access)

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Founder** | founder@test.serenitycare.com | Founder123! | Full system access |
| **CEO** | ceo@test.serenitycare.com | Ceo123456! | Full system access |
| **CFO** | cfo@test.serenitycare.com | Cfo123456! | Finance + Executive |
| **COO** | coo@test.serenitycare.com | Coo123456! | Operations + HR + Executive |

#### Finance Department

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Finance Director | finance.director@test.serenitycare.com | FinDir123! | All finance operations |
| Finance Manager | finance.manager@test.serenitycare.com | FinMgr123! | Payroll, Billing, AP/AR |
| Billing Manager | billing.manager@test.serenitycare.com | BillMgr123! | Claims, AR, Submission |
| RCM Analyst | rcm.analyst@test.serenitycare.com | Rcm12345! | Revenue cycle analysis |
| Insurance Manager | insurance.manager@test.serenitycare.com | InsMgr123! | Insurance verification |
| Billing Coder | billing.coder@test.serenitycare.com | Coder1234! | Medical coding |

#### Operations Department

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Operations Manager | ops.manager@test.serenitycare.com | OpsMgr123! | All operations oversight |
| Field Ops Manager | field.ops.manager@test.serenitycare.com | FieldOps123! | Multi-pod field operations |
| Pod Lead | pod.lead@test.serenitycare.com | PodLead123! | Single pod management |
| Field Supervisor | field.supervisor@test.serenitycare.com | FieldSup123! | Field staff supervision |
| Scheduling Manager | scheduling.manager@test.serenitycare.com | SchedMgr123! | Scheduling team oversight |
| Scheduler | scheduler@test.serenitycare.com | Sched12345! | Schedule creation |
| Dispatcher | dispatcher@test.serenitycare.com | Dispatch123! | Real-time coordination |
| QA Manager | qa.manager@test.serenitycare.com | QaMgr1234! | Quality assurance |

#### Clinical Department

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Director of Nursing | don@test.serenitycare.com | Don1234567! | Clinical leadership |
| Clinical Director | clinical.director@test.serenitycare.com | ClinDir123! | Clinical operations |
| Nursing Supervisor | nursing.supervisor@test.serenitycare.com | NurseSup123! | Regional nursing |
| RN Case Manager | rn.case.manager@test.serenitycare.com | RnCase123! | Assessments, care plans |
| LPN/LVN | lpn@test.serenitycare.com | Lpn1234567! | Nursing care |
| QIDP | qidp@test.serenitycare.com | Qidp123456! | IDD program |
| Therapist | therapist@test.serenitycare.com | Therapist1! | PT/OT/SLP services |

#### Direct Care Staff

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| DSP Med-Certified | dsp.med@test.serenitycare.com | DspMed123! | Med administration |
| DSP Basic | dsp.basic@test.serenitycare.com | DspBasic123! | Basic direct support |
| Home Health Aide | hha@test.serenitycare.com | Hha1234567! | Home health care |
| CNA | cna@test.serenitycare.com | Cna1234567! | Certified nursing assistant |
| Caregiver | caregiver@test.serenitycare.com | Caregiver1! | Legacy caregiver |

#### HR Department

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| HR Director | hr.director@test.serenitycare.com | HrDir1234! | All HR functions |
| HR Manager | hr.manager@test.serenitycare.com | HrMgr1234! | Recruitment, training |
| Recruiter | recruiter@test.serenitycare.com | Recruit123! | Applicant management |
| Credentialing Specialist | credentialing@test.serenitycare.com | Cred123456! | Credential verification |

#### Compliance & Security

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Compliance Officer | compliance.officer@test.serenitycare.com | Comply123! | Audit, HIPAA, compliance |
| Security Officer | security.officer@test.serenitycare.com | Secure123! | Security management |

#### IT Department

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| IT Admin | it.admin@test.serenitycare.com | ItAdmin123! | System configuration |
| Support Agent | support.agent@test.serenitycare.com | Support123! | Basic support access |

#### External Access

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Client | client@test.serenitycare.com | Client1234! | Patient portal |
| Family Member | family@test.serenitycare.com | Family1234! | Family portal |
| Payer Auditor | payer.auditor@test.serenitycare.com | Auditor123! | Audit access |

### 3.4 Quick Login Commands

```bash
# Get auth token for any role
curl -X POST https://serenity-erp-prod-529254538029.us-central1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@test.serenitycare.com","password":"Founder123!"}'

# Use token for authenticated requests
TOKEN="<jwt_from_login>"
curl -H "Authorization: Bearer $TOKEN" \
  https://serenity-erp-prod-529254538029.us-central1.run.app/api/console/dashboard/metrics
```

---

## 4. Test Environment Setup

### 4.1 Prerequisites

```bash
# Frontend testing tools
npm install -D @playwright/test cypress jest @testing-library/react

# Backend testing tools
npm install -D jest supertest @types/jest ts-jest

# Visual regression
npm install -D @percy/cli @percy/playwright
```

### 4.2 Environment Configuration

```env
# .env.test
VITE_API_URL=https://serenity-erp-prod-529254538029.us-central1.run.app
VITE_USE_MOCK_DATA=false
DATABASE_URL=<test_database_connection_string>
```

### 4.3 Running Tests

```bash
# Run all programmatic tests
npm run test

# Run Playwright E2E tests
npx playwright test

# Run specific test file
npx jest tests/auth.test.ts

# Run visual regression
npx percy exec -- npx playwright test

# Run schema validation tests
npm run test:schema
```

---

## 5. Authentication & Authorization Tests

### AUTH-001: Valid Login

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-001 |
| **Name** | Valid Login with Correct Credentials |
| **Description** | Verify that users can log in with valid email and password |
| **Why Important** | Core functionality - system access requires authentication |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic + Manual |
| **Dependencies** | None |
| **Feeds Into** | All authenticated tests |

**Steps:**
1. Navigate to https://console.serenitycarepartners.com
2. Enter valid email (e.g., founder@test.serenitycare.com)
3. Enter valid password (Founder123!)
4. Click "Sign In"
5. Verify redirect to dashboard home

**Expected Results:**
- User is redirected to `/` (home dashboard)
- User's name appears in header
- JWT token stored in localStorage
- Sidebar navigation is visible

**Test for Each Role:**
- [ ] Founder
- [ ] CEO
- [ ] CFO
- [ ] COO
- [ ] Finance Director
- [ ] Finance Manager
- [ ] Billing Manager
- [ ] RCM Analyst
- [ ] Insurance Manager
- [ ] Billing Coder
- [ ] Operations Manager
- [ ] Field Ops Manager
- [ ] Pod Lead
- [ ] Field Supervisor
- [ ] Scheduling Manager
- [ ] Scheduler
- [ ] Dispatcher
- [ ] QA Manager
- [ ] Director of Nursing
- [ ] Clinical Director
- [ ] Nursing Supervisor
- [ ] RN Case Manager
- [ ] LPN/LVN
- [ ] QIDP
- [ ] Therapist
- [ ] DSP Med
- [ ] DSP Basic
- [ ] HHA
- [ ] CNA
- [ ] Caregiver
- [ ] HR Director
- [ ] HR Manager
- [ ] Recruiter
- [ ] Credentialing Specialist
- [ ] Compliance Officer
- [ ] Security Officer
- [ ] IT Admin
- [ ] Support Agent
- [ ] Client
- [ ] Family
- [ ] Payer Auditor

---

### AUTH-002: Invalid Login - Wrong Password

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-002 |
| **Name** | Invalid Login with Wrong Password |
| **Description** | Verify that login fails with incorrect password |
| **Why Important** | Security - prevent unauthorized access |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic + Manual |
| **Dependencies** | None |
| **Feeds Into** | Security tests |

**Steps:**
1. Navigate to login page
2. Enter valid email
3. Enter incorrect password
4. Click "Sign In"

**Expected Results:**
- Error message: "Invalid email or password"
- User remains on login page
- No token is stored
- Login attempt is logged

---

### AUTH-003: Invalid Login - Non-existent User

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-003 |
| **Name** | Invalid Login with Non-existent Email |
| **Description** | Verify that login fails with email not in system |
| **Why Important** | Security - prevent user enumeration attacks |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic + Manual |
| **Dependencies** | None |
| **Feeds Into** | Security tests |

**Steps:**
1. Navigate to login page
2. Enter non-existent email (e.g., notauser@test.com)
3. Enter any password
4. Click "Sign In"

**Expected Results:**
- Same generic error: "Invalid email or password" (not "User not found")
- Response time similar to valid user attempt (prevent timing attacks)

---

### AUTH-004: Session Expiration

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-004 |
| **Name** | Session Timeout After Inactivity |
| **Description** | Verify that session expires after configured timeout period |
| **Why Important** | Security - prevent session hijacking on abandoned devices |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Security compliance |

**Steps:**
1. Log in successfully
2. Wait for session timeout period (typically 12 hours)
3. Attempt to access protected route

**Expected Results:**
- User is redirected to login page
- Token is removed from localStorage
- Error message indicates session expired

---

### AUTH-005: Logout Functionality

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-005 |
| **Name** | User Logout |
| **Description** | Verify that logout clears session and redirects |
| **Why Important** | Security - allow users to terminate sessions |
| **Criticality** | P1 - High |
| **Type** | Programmatic + Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Security tests |

**Steps:**
1. Log in successfully
2. Click user menu / logout button
3. Confirm logout

**Expected Results:**
- User redirected to login page
- Token removed from localStorage
- Subsequent API calls return 401
- Back button does not return to authenticated pages

---

### AUTH-006: Token Refresh

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-006 |
| **Name** | JWT Token Refresh |
| **Description** | Verify that tokens are refreshed before expiration |
| **Why Important** | UX - prevent unexpected logouts during active sessions |
| **Criticality** | P2 - Medium |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Session management |

**Steps:**
1. Log in and obtain JWT
2. Wait until close to token expiration
3. Make API call

**Expected Results:**
- Token is automatically refreshed
- User session continues uninterrupted
- New token is stored

---

### AUTH-007: Protected Route Access Without Auth

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-007 |
| **Name** | Unauthenticated Access to Protected Routes |
| **Description** | Verify that protected routes redirect to login |
| **Why Important** | Security - prevent unauthorized access |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic + Manual |
| **Dependencies** | None |
| **Feeds Into** | RBAC tests |

**Steps:**
1. Clear all cookies/localStorage
2. Navigate directly to /dashboard/executive
3. Observe behavior

**Expected Results:**
- User is redirected to login page
- Return URL is preserved for post-login redirect
- No dashboard content is visible

---

### AUTH-008: API Access Without Token

| Field | Value |
|-------|-------|
| **Test ID** | AUTH-008 |
| **Name** | API Call Without Authorization Header |
| **Description** | Verify that API endpoints reject unauthenticated requests |
| **Why Important** | Security - API-level access control |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | API security tests |

**Steps:**
```bash
curl -X GET https://serenity-erp-prod-529254538029.us-central1.run.app/api/console/dashboard/metrics
```

**Expected Results:**
- HTTP 401 Unauthorized
- Response: `{"error": "Authentication required"}`

---

## 6. RBAC & Permission Tests

### RBAC-001: Sidebar Navigation Filtering

| Field | Value |
|-------|-------|
| **Test ID** | RBAC-001 |
| **Name** | Sidebar Shows Only Accessible Routes |
| **Description** | Verify that sidebar navigation items are filtered by user role |
| **Why Important** | UX & Security - users only see what they can access |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | All dashboard access tests |

**Role-Specific Expected Sidebar Items:**

| Role | Expected Navigation Items |
|------|--------------------------|
| Founder | Home, Executive, HR & Talent, Tax, Operations, Clinical, Patients, Scheduling, Billing, Compliance, Training, EVV Clock, Family Portal, Communications |
| CFO | Home, Executive, Tax, Billing, Finance routes |
| HR Director | Home, HR & Talent, Training, Credentials, Background Checks |
| Caregiver | Home, EVV Clock, Patients (assigned only) |
| Family | Home, Family Portal |

**Test Each Role:**
- [ ] Login as each of 30+ roles
- [ ] Count sidebar navigation items
- [ ] Verify each item matches ROUTE_ACCESS configuration in useRoleAccess.tsx

---

### RBAC-002: Route Protection - Access Denied

| Field | Value |
|-------|-------|
| **Test ID** | RBAC-002 |
| **Name** | Protected Route Shows Access Denied |
| **Description** | Verify that unauthorized route access shows access denied page |
| **Why Important** | Security - enforce route-level RBAC |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Security compliance |

**Test Matrix:**

| Test Case | Login As | Navigate To | Expected |
|-----------|----------|-------------|----------|
| RBAC-002a | Caregiver | /dashboard/executive | Access Denied |
| RBAC-002b | Caregiver | /dashboard/billing | Access Denied |
| RBAC-002c | Caregiver | /dashboard/tax | Access Denied |
| RBAC-002d | Caregiver | /admin/users | Access Denied |
| RBAC-002e | HR Manager | /dashboard/tax | Access Denied |
| RBAC-002f | HR Manager | /dashboard/billing | Access Denied |
| RBAC-002g | Billing Coder | /dashboard/hr | Access Denied |
| RBAC-002h | Billing Coder | /admin/users | Access Denied |
| RBAC-002i | Scheduler | /dashboard/executive | Access Denied |
| RBAC-002j | Family | /dashboard/executive | Access Denied |
| RBAC-002k | Family | /dashboard/hr | Access Denied |
| RBAC-002l | Family | /admin/users | Access Denied |

**Access Denied Page Verification:**
- [ ] Shows "Access Denied" heading
- [ ] Displays user's current role
- [ ] Provides "Return to Home" button
- [ ] Does not leak any protected data

---

### RBAC-003: Super User Full Access

| Field | Value |
|-------|-------|
| **Test ID** | RBAC-003 |
| **Name** | Founder Has Full System Access |
| **Description** | Verify that founder role can access all routes |
| **Why Important** | Admin functionality - super users need full access |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Admin workflows |

**Steps:**
1. Login as founder@test.serenitycare.com
2. Navigate to each route in the system

**Routes to Test (40+ routes):**
- [ ] /dashboard/executive
- [ ] /dashboard/executive-v2
- [ ] /dashboard/hr
- [ ] /dashboard/tax
- [ ] /dashboard/operations
- [ ] /dashboard/clinical
- [ ] /dashboard/billing
- [ ] /dashboard/billing-ar
- [ ] /dashboard/compliance
- [ ] /dashboard/training
- [ ] /dashboard/scheduling
- [ ] /dashboard/scheduling-calendar
- [ ] /dashboard/dispatch
- [ ] /dashboard/credentials
- [ ] /dashboard/licenses
- [ ] /dashboard/background-checks
- [ ] /dashboard/payroll-v2
- [ ] /dashboard/caregiver-bonuses
- [ ] /dashboard/dodd-hpc
- [ ] /dashboard/consumer-directed
- [ ] /dashboard/client-intake
- [ ] /dashboard/claims-workflow
- [ ] /dashboard/care-plans
- [ ] /dashboard/crm
- [ ] /dashboard/finance/bank-accounts
- [ ] /dashboard/finance/reports
- [ ] /dashboard/finance/vendors
- [ ] /dashboard/finance/expenses
- [ ] /dashboard/finance/bank-feeds
- [ ] /dashboard/finance/payroll
- [ ] /admin/users
- [ ] /admin/roles
- [ ] /admin/pods
- [ ] /admin/audit
- [ ] /admin/settings/communications
- [ ] /admin/settings/email-accounts
- [ ] /patients
- [ ] /evv/clock
- [ ] /family-portal

**Expected Results:**
- All routes accessible without "Access Denied"
- All features functional

---

### RBAC-004: API Permission Enforcement

| Field | Value |
|-------|-------|
| **Test ID** | RBAC-004 |
| **Name** | Backend API Enforces Permissions |
| **Description** | Verify that API endpoints check user permissions |
| **Why Important** | Security - prevent permission bypass via direct API calls |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Security compliance |

**Test Cases:**

```bash
# Login as caregiver
TOKEN=$(curl -s -X POST .../api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"caregiver@test.serenitycare.com","password":"Caregiver1!"}' \
  | jq -r '.token')

# Attempt to access billing endpoint (should fail)
curl -H "Authorization: Bearer $TOKEN" \
  .../api/console/billing/dashboard
# Expected: 403 Forbidden

# Attempt to create user (should fail)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","role":"admin"}' \
  .../api/console/admin/users
# Expected: 403 Forbidden
```

---

### RBAC-005: Pod-Based Access Control

| Field | Value |
|-------|-------|
| **Test ID** | RBAC-005 |
| **Name** | Users Only See Their Pod's Data |
| **Description** | Verify that pod-scoped roles only see their pod's patients and schedules |
| **Why Important** | Data isolation - HIPAA compliance |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | AUTH-001, RBAC-001 |
| **Feeds Into** | PHI protection |

**Steps:**
1. Login as pod.lead@test.serenitycare.com
2. Navigate to /patients
3. Verify only CIN-A pod patients are visible
4. Navigate to /dashboard/scheduling
5. Verify only CIN-A pod schedules are visible

**Expected Results:**
- Patient list filtered to pod assignment
- Schedule shows only pod-assigned shifts
- No cross-pod data visible

---

### RBAC-006: Caseload-Based Access (Clinical)

| Field | Value |
|-------|-------|
| **Test ID** | RBAC-006 |
| **Name** | Clinicians Only See Assigned Patients |
| **Description** | Verify that clinical staff only access patients on their caseload |
| **Why Important** | HIPAA - minimum necessary access principle |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | PHI protection |

**Steps:**
1. Login as rn.case.manager@test.serenitycare.com
2. Navigate to /patients
3. Verify only caseload-assigned patients visible
4. Attempt to access non-assigned patient record

**Expected Results:**
- Patient list shows only assigned patients
- Non-assigned patient access shows error

---

## 7. Dashboard & Navigation Tests

### DASH-001: Home Dashboard Loads

| Field | Value |
|-------|-------|
| **Test ID** | DASH-001 |
| **Name** | Home Dashboard Loads Successfully |
| **Description** | Verify that home dashboard loads with correct metrics from database |
| **Why Important** | Core landing page for all users |
| **Criticality** | P0 - Critical |
| **Type** | Manual + Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | All dashboard tests |

**Steps:**
1. Login as any role
2. Observe home dashboard loading

**Expected Results:**
- Page loads within 3 seconds
- Welcome message with user name displayed
- Dashboard cards show REAL data (NOT mock values: 447, 485, $2,150,000)
- Loading states display properly
- No console errors

**API Verification:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  .../api/console/dashboard/metrics
```
Response should return actual database counts, zeros if empty.

---

### DASH-002: Executive Dashboard

| Field | Value |
|-------|-------|
| **Test ID** | DASH-002 |
| **Name** | Executive Dashboard Loads with KPIs |
| **Description** | Verify executive command center displays accurate KPIs |
| **Why Important** | Critical decision-making dashboard for leadership |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001, RBAC-003 |
| **Feeds Into** | Executive reporting |
| **Allowed Roles** | Founder, CEO, CFO, COO, Finance Director |

**Verification Checklist:**
- [ ] Revenue metrics display (real data, not mock)
- [ ] Patient census accurate
- [ ] Staff utilization metrics
- [ ] Compliance percentages
- [ ] Chart visualizations render
- [ ] Date range filters work
- [ ] Export functionality works

---

### DASH-003: HR Dashboard

| Field | Value |
|-------|-------|
| **Test ID** | DASH-003 |
| **Name** | HR Dashboard Loads with Real Data |
| **Description** | Verify HR dashboard shows actual applicants from database |
| **Why Important** | HR workflow depends on accurate applicant data |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Recruitment workflow |
| **Allowed Roles** | Founder, CEO, COO, HR Director, HR Manager, Recruiter |

**Verification Checklist:**
- [ ] NO mock names (Sarah Chen, Michael Johnson, etc.)
- [ ] Applicant count from database (0 if empty)
- [ ] Pipeline stages accurate
- [ ] Metrics calculated from real data
- [ ] Time-to-hire based on actual dates

---

### DASH-004: Tax Compliance Dashboard

| Field | Value |
|-------|-------|
| **Test ID** | DASH-004 |
| **Name** | Tax Dashboard Shows Accurate Calculations |
| **Description** | Verify tax compliance dashboard with real financial data |
| **Why Important** | Regulatory compliance - Ohio tax requirements |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Tax reporting |
| **Allowed Roles** | Founder, CEO, CFO, Finance Director, Finance Manager, Compliance Officer |

**Verification Checklist:**
- [ ] NO mock data ($11.1M revenue, $1893K liability)
- [ ] Tax calculations from actual billing data
- [ ] Quarterly deadlines accurate
- [ ] Compliance status reflects actual filings

---

### DASH-005: Billing Dashboard

| Field | Value |
|-------|-------|
| **Test ID** | DASH-005 |
| **Name** | Billing Dashboard with Accurate Revenue |
| **Description** | Verify billing metrics reflect actual claims and payments |
| **Why Important** | Revenue cycle management accuracy |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Revenue reporting |
| **Allowed Roles** | Founder, CEO, CFO, Finance Director, Finance Manager, Billing Manager, RCM Analyst, Billing Coder, Insurance Manager |

**Verification Checklist:**
- [ ] Monthly revenue from actual claims (NOT $2,150,000 mock)
- [ ] AR aging buckets calculated correctly
- [ ] Payer breakdown from real data
- [ ] Claims count accurate

---

### DASH-006 through DASH-015: Additional Dashboards

| Test ID | Dashboard | Allowed Roles | Key Verifications |
|---------|-----------|---------------|-------------------|
| DASH-006 | Operations | Founder, CEO, COO, Ops Manager, Field Ops, Pod Lead, Schedulers, Clinical Directors | Shift counts (not visits), real scheduling data |
| DASH-007 | Clinical | Founder, CEO, COO, DON, Clinical Director, Nursing Supervisor, RN, LPN, Therapist, QIDP, Compliance, QA | Care plan counts, patient data from joins |
| DASH-008 | Scheduling | Founder, CEO, COO, Ops Managers, Schedulers, Dispatchers, Clinical Directors | Uses `shifts` table, not `visits` |
| DASH-009 | Compliance | Founder, CEO, COO, Compliance Officer, Security Officer, QA Manager, DON, Clinical Director | Training assignments, not caregiver_training |
| DASH-010 | Training | Founder, CEO, COO, HR Director, HR Manager, DON, Clinical Director, Compliance | Uses `training_assignments` table |
| DASH-011 | Credentials | Founder, HR Director, HR Manager, Credentialing Specialist, Compliance | Credential expiration dates |
| DASH-012 | Background Checks | Founder, HR Director, HR Manager, Recruiter | Uses `applicant_id`, not `candidate_id` |
| DASH-013 | Payroll | Founder, CFO, Finance Director, Finance Manager, HR Director | Caregiver data requires user JOIN |
| DASH-014 | Care Plans | Founder, DON, Clinical Director, Nursing Supervisor, RN, Therapist, QIDP | Uses care_plans from migration 075 |
| DASH-015 | Dispatch | Founder, Ops Manager, Scheduling Manager, Dispatcher, Pod Lead | Uses `shifts` table |

---

### DASH-016: Navigation Breadcrumbs

| Field | Value |
|-------|-------|
| **Test ID** | DASH-016 |
| **Name** | Breadcrumb Navigation Works |
| **Description** | Verify breadcrumb trail shows correct path |
| **Why Important** | UX - user orientation within system |
| **Criticality** | P3 - Low |
| **Type** | Manual |
| **Dependencies** | DASH-001 |
| **Feeds Into** | UX testing |

---

### DASH-017: Communications Settings (No Double Layout)

| Field | Value |
|-------|-------|
| **Test ID** | DASH-017 |
| **Name** | Communications Page Renders Correctly |
| **Description** | Verify Communications settings page shows single layout (not duplicated) |
| **Why Important** | Bug fix verification - previously had double sidebar |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | AUTH-001, RBAC-001 |
| **Feeds Into** | Layout consistency |

**Steps:**
1. Login as founder@test.serenitycare.com
2. Navigate to /admin/settings/communications
3. Verify page layout

**Expected Results:**
- Single sidebar on left
- Communication Settings content on right
- NO duplicate navigation/menu
- Clean single-level layout

---

## 8. API Endpoint Tests

### API-001: Dashboard Metrics Endpoint

| Field | Value |
|-------|-------|
| **Test ID** | API-001 |
| **Name** | GET /api/console/dashboard/metrics |
| **Description** | Verify dashboard metrics API returns valid data |
| **Why Important** | Core data source for home dashboard |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | DASH-001 |

**Request:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://serenity-erp-prod-529254538029.us-central1.run.app/api/console/dashboard/metrics
```

**Expected Response Structure:**
```json
{
  "activePatients": 0,
  "activeStaff": 0,
  "completedVisits": 0,
  "scheduledVisits": 0,
  "monthlyRevenue": 0,
  "pendingClaims": 0,
  "trainingCompliance": 0,
  "openPositions": 0
}
```

**Validation:**
- [ ] HTTP 200 status
- [ ] Response time < 500ms
- [ ] All fields present
- [ ] Values are numbers (not strings)
- [ ] No mock data values (447, 485, $2,150,000)

---

### API-002: HR Metrics Endpoint

| Field | Value |
|-------|-------|
| **Test ID** | API-002 |
| **Name** | GET /api/console/hr/metrics |
| **Description** | Verify HR metrics returns accurate staff data |
| **Why Important** | HR dashboard data source |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | DASH-003 |

**Schema Note:** Must query users table for caregiver names via JOIN.

---

### API-003: HR Applicants Endpoint

| Field | Value |
|-------|-------|
| **Test ID** | API-003 |
| **Name** | GET /api/console/hr/applicants |
| **Description** | Verify applicants API returns database records |
| **Why Important** | Recruitment pipeline data |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | DASH-003 |

**Request:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  .../api/console/hr/applicants
```

**Validation:**
- [ ] Returns array of applicants
- [ ] No mock names (Sarah Chen, Michael Johnson)
- [ ] Supports pagination
- [ ] Supports filtering by status

---

### API-004: Scheduling/Shifts Endpoint

| Field | Value |
|-------|-------|
| **Test ID** | API-004 |
| **Name** | GET /api/console/scheduling |
| **Description** | Verify scheduling API uses `shifts` table (not visits) |
| **Why Important** | Schema change validation |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | DASH-006, DASH-008, DASH-015 |

**Schema Validation:**
- [ ] Response uses `shift_id` not `visit_id`
- [ ] References `shifts` table internally
- [ ] Caregiver info comes from users JOIN

---

### API-005 through API-020: Core API Endpoints

| Test ID | Endpoint | Method | Schema Notes |
|---------|----------|--------|--------------|
| API-005 | /api/console/clients | GET | Uses `pod_id` not `primary_pod_id` |
| API-006 | /api/console/clients | POST | Create client |
| API-007 | /api/console/clients/:id | GET | Client detail |
| API-008 | /api/console/caregivers | GET | Must JOIN users for PII |
| API-009 | /api/console/shifts | POST | Uses `shifts` table |
| API-010 | /api/console/evv/shifts | GET | Uses `shifts` not `visits` |
| API-011 | /api/console/evv/shifts | POST | Record shift clock in/out |
| API-012 | /api/console/billing/dashboard | GET | Uses `claims_batches` not `insurance_claims` |
| API-013 | /api/console/claims | GET | List claims |
| API-014 | /api/console/claims | POST | Create claim |
| API-015 | /api/console/credentials | GET | List credentials |
| API-016 | /api/console/training/assignments | GET | Uses `training_assignments` not `caregiver_training` |
| API-017 | /api/console/compliance/audits | GET | Audit logs |
| API-018 | /api/console/pods | GET | Uses `user_pod_memberships` |
| API-019 | /api/console/background-checks | GET | Uses `applicant_id` not `candidate_id` |
| API-020 | /api/auth/login | POST | User login |

---

## 9. Database Schema Validation Tests

### SCHEMA-001: Shifts Table Exists (Not Visits)

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-001 |
| **Name** | Verify `shifts` Table Exists |
| **Description** | Confirm the visits→shifts rename is complete |
| **Why Important** | Breaking schema change validation |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | All shift-related tests |

**SQL Test:**
```sql
-- This should succeed
SELECT * FROM shifts LIMIT 1;

-- This should fail
SELECT * FROM visits LIMIT 1; -- ERROR: relation "visits" does not exist
```

---

### SCHEMA-002: Caregivers Table Structure

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-002 |
| **Name** | Caregivers Table Has Correct Structure |
| **Description** | Verify caregivers is profile extension only (no PII) |
| **Why Important** | Identity model change validation |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Caregiver data queries |

**SQL Test:**
```sql
-- These columns should NOT exist in caregivers
SELECT first_name FROM caregivers; -- ERROR
SELECT last_name FROM caregivers; -- ERROR
SELECT email FROM caregivers; -- ERROR

-- This should work
SELECT c.id, c.user_id, c.employment_status, u.first_name, u.last_name
FROM caregivers c
JOIN users u ON c.user_id = u.id;
```

---

### SCHEMA-003: User Pod Memberships Table

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-003 |
| **Name** | Verify `user_pod_memberships` Table |
| **Description** | Confirm pod_members→user_pod_memberships rename |
| **Why Important** | Pod governance schema change |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Pod access tests |

**SQL Test:**
```sql
-- This should succeed
SELECT user_id, pod_id, role_in_pod FROM user_pod_memberships LIMIT 1;

-- This should fail
SELECT * FROM pod_members; -- ERROR
```

---

### SCHEMA-004: Background Checks Columns

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-004 |
| **Name** | Background Checks Table Schema |
| **Description** | Verify column renames in background_checks |
| **Why Important** | Migration 058 schema validation |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Background check workflow |

**SQL Test:**
```sql
-- These column names should work
SELECT applicant_id, check_provider, submission_reference, check_type, result
FROM background_checks LIMIT 1;

-- These old names should fail
SELECT candidate_id FROM background_checks; -- ERROR
SELECT provider FROM background_checks; -- ERROR
SELECT provider_check_id FROM background_checks; -- ERROR
```

---

### SCHEMA-005: Care Plans Table

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-005 |
| **Name** | Care Plans Table Structure |
| **Description** | Verify care_plans from migration 075 |
| **Why Important** | Care plan functionality |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Clinical workflows |

**SQL Test:**
```sql
SELECT client_id, assessment_id, goals, interventions, service_schedule
FROM care_plans LIMIT 1;
```

---

### SCHEMA-006: Training Assignments Table

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-006 |
| **Name** | Training Assignments Table Exists |
| **Description** | Verify training_assignments (not caregiver_training) |
| **Why Important** | Training module schema |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Training workflows |

**SQL Test:**
```sql
-- This should succeed
SELECT * FROM training_assignments LIMIT 1;

-- This should fail
SELECT * FROM caregiver_training; -- ERROR: does not exist
```

---

### SCHEMA-007: Caregiver Availability Patterns

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-007 |
| **Name** | Availability Patterns Table |
| **Description** | Verify caregiver_availability_patterns table |
| **Why Important** | Scheduling functionality |
| **Criticality** | P2 - Medium |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Scheduling workflows |

**SQL Test:**
```sql
-- This should succeed
SELECT * FROM caregiver_availability_patterns LIMIT 1;

-- This should fail
SELECT * FROM caregiver_availability; -- ERROR
```

---

### SCHEMA-008: Users is_active Column

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-008 |
| **Name** | Users is_active Boolean Column |
| **Description** | Verify users.active→is_active rename |
| **Why Important** | Boolean standard compliance |
| **Criticality** | P2 - Medium |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | User queries |

**SQL Test:**
```sql
SELECT is_active FROM users LIMIT 1; -- Should work
SELECT active FROM users LIMIT 1; -- Should fail
```

---

### SCHEMA-009: Claims Batches (Not Insurance Claims)

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-009 |
| **Name** | Claims Batches Table |
| **Description** | Verify claims_batches exists (not insurance_claims) |
| **Why Important** | Billing schema |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Billing workflows |

**SQL Test:**
```sql
SELECT * FROM claims_batches LIMIT 1; -- Should work
SELECT * FROM insurance_claims LIMIT 1; -- Should fail
```

---

### SCHEMA-010: Deprecated Tables Do Not Exist

| Field | Value |
|-------|-------|
| **Test ID** | SCHEMA-010 |
| **Name** | Verify Deprecated Tables Removed |
| **Description** | Confirm removed tables do not exist |
| **Why Important** | Prevent test failures on old schema |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Test suite maintenance |

**Tables That Should NOT Exist:**
```sql
SELECT * FROM insurance_claims; -- ERROR
SELECT * FROM invoices; -- ERROR
SELECT * FROM supervisory_shifts; -- ERROR
SELECT * FROM caregiver_training; -- ERROR
SELECT * FROM recurring_visit_templates; -- ERROR
SELECT * FROM visits; -- ERROR (renamed to shifts)
SELECT * FROM pod_members; -- ERROR (renamed)
SELECT * FROM caregiver_availability; -- ERROR (renamed)
```

---

## 10. Feature Workflow Tests

### WF-001: Billing Flow - Create to Payment

| Field | Value |
|-------|-------|
| **Test ID** | WF-001 |
| **Name** | Complete Billing Workflow |
| **Description** | Test full billing cycle from claim creation to payment |
| **Why Important** | Revenue-critical workflow |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | AUTH-001, API endpoints |
| **Feeds Into** | Financial reporting |
| **Schema Note** | Uses `claims_batches` table |

**Workflow Steps:**
1. Login as billing.coder@test.serenitycare.com
2. Create new claim for billable service
3. Submit claim for review
4. Login as billing.manager@test.serenitycare.com
5. Review and approve claim
6. Submit to clearinghouse
7. Process remittance
8. Verify payment recorded

**Roles Involved:**
- Billing Coder (create)
- Billing Manager (review/approve)
- Finance Director (oversight)
- CFO (final approval for large amounts)

---

### WF-002: Scheduling Flow (Using Shifts)

| Field | Value |
|-------|-------|
| **Test ID** | WF-002 |
| **Name** | Complete Scheduling Workflow |
| **Description** | Test shift creation through EVV completion |
| **Why Important** | Core operations workflow |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | EVV, Billing |
| **Schema Note** | Uses `shifts` table (NOT visits) |

**Workflow Steps:**
1. Login as scheduler@test.serenitycare.com
2. Create new **shift** (not visit)
3. Assign caregiver (via user JOIN)
4. Login as caregiver@test.serenitycare.com
5. View assigned **shift**
6. Clock in via EVV
7. Complete service
8. Clock out via EVV
9. Verify **shift** recorded

---

### WF-003: Clinical Flow - Care Plan

| Field | Value |
|-------|-------|
| **Test ID** | WF-003 |
| **Name** | Care Plan Workflow |
| **Description** | Test care plan creation and approval |
| **Why Important** | Clinical compliance |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Clinical documentation |
| **Schema Note** | Uses care_plans from migration 075 |

**Workflow Steps:**
1. Login as rn.case.manager@test.serenitycare.com
2. Create new care plan (goals, interventions as JSONB)
3. Add goals and interventions
4. Submit for review
5. Login as nursing.supervisor@test.serenitycare.com
6. Review and approve
7. Login as don@test.serenitycare.com
8. Final approval

---

### WF-004: HR Flow - Applicant to Employee

| Field | Value |
|-------|-------|
| **Test ID** | WF-004 |
| **Name** | Recruitment Workflow |
| **Description** | Test full hiring process |
| **Why Important** | Staffing pipeline |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Onboarding, Payroll |
| **Schema Note** | Background checks use `applicant_id` |

**Workflow Steps:**
1. Applicant submits via careers page
2. Login as recruiter@test.serenitycare.com
3. Review application, move to screening
4. Initiate background check (uses `applicant_id`)
5. Schedule interview
6. Conduct interview, update status
7. Login as hr.manager@test.serenitycare.com
8. Extend offer
9. Convert to employee (creates user record)
10. Create caregiver profile (links to user_id)
11. Assign to pod via `user_pod_memberships`
12. Initiate onboarding

---

### WF-005: Compliance Flow - Incident Report

| Field | Value |
|-------|-------|
| **Test ID** | WF-005 |
| **Name** | Incident Reporting Workflow |
| **Description** | Test incident creation through resolution |
| **Why Important** | Regulatory compliance |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Audit logs |

---

### WF-006: EVV Workflow (Shifts)

| Field | Value |
|-------|-------|
| **Test ID** | WF-006 |
| **Name** | EVV Clock In/Out Workflow |
| **Description** | Test electronic visit verification for shifts |
| **Why Important** | Sandata compliance |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | WF-002 |
| **Feeds Into** | Billing, Sandata |
| **Schema Note** | Uses `shifts` table, references `shift_id` |

**Workflow Steps:**
1. Login as caregiver@test.serenitycare.com
2. Navigate to /evv/clock
3. View today's assigned **shifts**
4. Select shift to start
5. Clock in with GPS verification
6. Complete service
7. Document shift notes (stored in `shift_notes`)
8. Clock out
9. Submit shift

---

### WF-007: Training Assignment Workflow

| Field | Value |
|-------|-------|
| **Test ID** | WF-007 |
| **Name** | Training Assignment and Completion |
| **Description** | Test training assignment through completion |
| **Why Important** | Compliance tracking |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Credential verification |
| **Schema Note** | Uses `training_assignments` (NOT caregiver_training) |

**Workflow Steps:**
1. Login as hr.manager@test.serenitycare.com
2. Create training assignment
3. Assign to caregiver (via user_id)
4. Login as caregiver@test.serenitycare.com
5. View training assignment
6. Complete training modules
7. Mark as complete
8. Verify training_assignments record updated

---

### WF-008: Caregiver Onboarding Workflow

| Field | Value |
|-------|-------|
| **Test ID** | WF-008 |
| **Name** | New Caregiver Onboarding |
| **Description** | Test complete onboarding flow with new schema |
| **Why Important** | Proper staff setup |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | WF-004 |
| **Feeds Into** | Scheduling, EVV |
| **Schema Notes** | Creates user, caregivers profile, user_pod_memberships, caregiver_availability_patterns |

**Workflow Steps:**
1. HR creates user account (users table)
2. Create caregiver profile (caregivers table with user_id FK)
3. Set employment_status = 'active'
4. Assign to pod via user_pod_memberships (role_in_pod)
5. Set availability patterns (caregiver_availability_patterns)
6. Assign initial training (training_assignments)
7. Verify all relationships properly created

---

## 11. Visual Consistency Tests

### VIS-001: Typography Consistency

| Field | Value |
|-------|-------|
| **Test ID** | VIS-001 |
| **Name** | Font Family and Sizes |
| **Description** | Verify consistent typography across all pages |
| **Why Important** | Professional appearance, brand consistency |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | DASH-001 |
| **Feeds Into** | UI polish |

**Checklist:**
- [ ] Primary font: Inter or system sans-serif
- [ ] Heading sizes: h1=2xl (24px), h2=xl (20px), h3=lg (18px)
- [ ] Body text: base (16px)
- [ ] Small text: sm (14px)
- [ ] Consistent line heights
- [ ] No mixed font families

---

### VIS-002: Color Scheme Consistency

| Field | Value |
|-------|-------|
| **Test ID** | VIS-002 |
| **Name** | Brand Colors Applied Correctly |
| **Description** | Verify color scheme across all components |
| **Why Important** | Brand identity |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | UI polish |

**Color Palette Verification:**
- [ ] Primary blue: #2563eb (buttons, links)
- [ ] Success green: #16a34a
- [ ] Warning yellow/orange: #f59e0b
- [ ] Error red: #dc2626
- [ ] Background gray: #f9fafb
- [ ] Card background: white (#ffffff)
- [ ] Text primary: #111827
- [ ] Text secondary: #6b7280

---

### VIS-003: Spacing and Padding

| Field | Value |
|-------|-------|
| **Test ID** | VIS-003 |
| **Name** | Consistent Spacing |
| **Description** | Verify consistent padding and margins |
| **Why Important** | Visual rhythm, professional appearance |
| **Criticality** | P3 - Low |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | UI polish |

**Checklist:**
- [ ] Page padding: p-6 (24px)
- [ ] Card padding: p-4 to p-6 (16-24px)
- [ ] Button padding: px-4 py-2 (16px horizontal, 8px vertical)
- [ ] Form field spacing: space-y-4 (16px vertical gap)
- [ ] Section spacing: mb-6 to mb-8 (24-32px)
- [ ] Consistent grid gaps: gap-4 to gap-6 (16-24px)

---

### VIS-004: Button Styling

| Field | Value |
|-------|-------|
| **Test ID** | VIS-004 |
| **Name** | Button Visual Consistency |
| **Description** | Verify all buttons follow design system |
| **Why Important** | UX consistency, accessibility |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Component library |

**Button Types:**
- [ ] Primary: blue-600 background, white text
- [ ] Secondary: gray/outline styling
- [ ] Danger: red-600 background
- [ ] Disabled: opacity-50, cursor-not-allowed
- [ ] Consistent border-radius (rounded-md or rounded-lg)
- [ ] Hover states visible and responsive

---

### VIS-005: Card Styling

| Field | Value |
|-------|-------|
| **Test ID** | VIS-005 |
| **Name** | Card Component Consistency |
| **Description** | Verify card styling across dashboards |
| **Why Important** | Visual consistency |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Component library |

**Checklist:**
- [ ] White background
- [ ] Consistent shadow (shadow-sm or shadow)
- [ ] Rounded corners (rounded-lg)
- [ ] Consistent padding (p-4 or p-6)
- [ ] Border: none or border-gray-200

---

### VIS-006: Form Styling

| Field | Value |
|-------|-------|
| **Test ID** | VIS-006 |
| **Name** | Form Element Consistency |
| **Description** | Verify form inputs follow design system |
| **Why Important** | UX, accessibility |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Component library |

**Checklist:**
- [ ] Input borders: gray-300
- [ ] Focus ring: blue-500
- [ ] Labels positioned above inputs
- [ ] Error states: red border, error message below
- [ ] Disabled states: gray background, reduced opacity
- [ ] Consistent input heights

---

### VIS-007: Table Styling

| Field | Value |
|-------|-------|
| **Test ID** | VIS-007 |
| **Name** | Data Table Consistency |
| **Description** | Verify table styling across all data views |
| **Why Important** | Readability, UX |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Component library |

**Checklist:**
- [ ] Header row: gray background, bold text
- [ ] Row hover: light gray highlight
- [ ] Alternating row colors (if applicable)
- [ ] Consistent cell padding
- [ ] Sortable column indicators
- [ ] Pagination styling consistent

---

### VIS-008: Icons and Badges

| Field | Value |
|-------|-------|
| **Test ID** | VIS-008 |
| **Name** | Icon and Badge Consistency |
| **Description** | Verify icon library and badge styling |
| **Why Important** | Visual consistency |
| **Criticality** | P3 - Low |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Component library |

**Checklist:**
- [ ] Using Heroicons consistently
- [ ] Icon sizes: w-4 h-4, w-5 h-5, w-6 h-6
- [ ] Badge colors match severity
- [ ] Status badges consistent across views

---

### VIS-009: Loading States

| Field | Value |
|-------|-------|
| **Test ID** | VIS-009 |
| **Name** | Loading State Visuals |
| **Description** | Verify loading spinners and skeletons |
| **Why Important** | UX during async operations |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | UX polish |

**Checklist:**
- [ ] Spinner displays during API calls
- [ ] Skeleton loaders for content areas
- [ ] Button loading states (spinner inside button)
- [ ] Page-level loading overlays when appropriate

---

### VIS-010: Empty States

| Field | Value |
|-------|-------|
| **Test ID** | VIS-010 |
| **Name** | Empty State Displays |
| **Description** | Verify empty state messaging and visuals |
| **Why Important** | UX when no data exists |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | UX polish |

**Checklist:**
- [ ] Friendly message when no data (not blank screen)
- [ ] Illustration or icon
- [ ] Call-to-action button if applicable
- [ ] No broken layouts with empty data
- [ ] Shows zeros, not mock data

---

## 12. Mobile & Responsive Tests

### MOB-001: Mobile Login

| Field | Value |
|-------|-------|
| **Test ID** | MOB-001 |
| **Name** | Mobile Login Experience |
| **Description** | Verify login works on mobile devices |
| **Why Important** | Field staff access via mobile |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Mobile workflows |

**Test On:**
- [ ] iPhone SE (375px width)
- [ ] iPhone 14 (390px width)
- [ ] Android typical (360px width)
- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)

---

### MOB-002: Responsive Sidebar

| Field | Value |
|-------|-------|
| **Test ID** | MOB-002 |
| **Name** | Sidebar Behavior on Mobile |
| **Description** | Verify sidebar collapses and hamburger menu works |
| **Why Important** | Navigation on small screens |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | DASH-001 |
| **Feeds Into** | Mobile UX |

**Checklist:**
- [ ] Sidebar hidden by default on mobile (<768px)
- [ ] Hamburger menu icon visible
- [ ] Sidebar slides in when opened
- [ ] Overlay behind sidebar
- [ ] Close on navigation item click
- [ ] Close on outside click

---

### MOB-003: Dashboard Cards Stack

| Field | Value |
|-------|-------|
| **Test ID** | MOB-003 |
| **Name** | Dashboard Cards Responsive |
| **Description** | Verify dashboard cards stack vertically on mobile |
| **Why Important** | Content visibility on small screens |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | DASH-001 |
| **Feeds Into** | Responsive design |

---

### MOB-004: EVV Mobile Experience

| Field | Value |
|-------|-------|
| **Test ID** | MOB-004 |
| **Name** | EVV Clock on Mobile |
| **Description** | Verify EVV clock in/out works on mobile devices |
| **Why Important** | Primary use case for field staff |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | WF-006 |
| **Feeds Into** | Field operations |

---

### MOB-005: Tables Scroll Horizontally

| Field | Value |
|-------|-------|
| **Test ID** | MOB-005 |
| **Name** | Data Tables Mobile Behavior |
| **Description** | Verify tables scroll or adapt on mobile |
| **Why Important** | Data accessibility on small screens |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Responsive design |

---

## 13. Integration Tests

### INT-001: Sandata EVV Integration

| Field | Value |
|-------|-------|
| **Test ID** | INT-001 |
| **Name** | Sandata Shift Submission |
| **Description** | Verify shifts submit to Sandata correctly |
| **Why Important** | EVV compliance |
| **Criticality** | P0 - Critical |
| **Type** | Manual + Programmatic |
| **Dependencies** | WF-006 |
| **Feeds Into** | Billing |
| **Schema Note** | Uses `shifts` table, shift_id references |

**Checklist:**
- [ ] Shift data formatted correctly (not "visit")
- [ ] Ohio ALTEVV format compliance
- [ ] SSN handling per requirements
- [ ] Authorization matching
- [ ] Error response handling
- [ ] Transaction ID returned

---

### INT-002: Clearinghouse Integration

| Field | Value |
|-------|-------|
| **Test ID** | INT-002 |
| **Name** | Claims Submission to Clearinghouse |
| **Description** | Verify claims submit successfully |
| **Why Important** | Revenue collection |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | WF-001 |
| **Feeds Into** | AR management |
| **Schema Note** | Uses claims_batches table |

---

### INT-003: Twilio SMS Integration

| Field | Value |
|-------|-------|
| **Test ID** | INT-003 |
| **Name** | SMS Notification Delivery |
| **Description** | Verify SMS notifications send correctly |
| **Why Important** | Staff communication |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Notifications |

---

### INT-004: Email Integration (SMTP)

| Field | Value |
|-------|-------|
| **Test ID** | INT-004 |
| **Name** | Email Delivery via SMTP |
| **Description** | Verify emails send via configured SMTP |
| **Why Important** | Staff and client communication |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Notifications |

---

## 14. Security Tests

### SEC-001: SQL Injection Prevention

| Field | Value |
|-------|-------|
| **Test ID** | SEC-001 |
| **Name** | SQL Injection Resistance |
| **Description** | Verify inputs sanitized against SQL injection |
| **Why Important** | Data protection |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Security compliance |

**Test Payloads:**
```
' OR '1'='1
'; DROP TABLE users; --
Robert'); DROP TABLE students;--
```

---

### SEC-002: XSS Prevention

| Field | Value |
|-------|-------|
| **Test ID** | SEC-002 |
| **Name** | Cross-Site Scripting Prevention |
| **Description** | Verify output encoding prevents XSS |
| **Why Important** | User protection |
| **Criticality** | P0 - Critical |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Security compliance |

**Test Payloads:**
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

---

### SEC-003: CSRF Protection

| Field | Value |
|-------|-------|
| **Test ID** | SEC-003 |
| **Name** | CSRF Token Validation |
| **Description** | Verify forms protected by CSRF tokens |
| **Why Important** | Request forgery prevention |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Security compliance |

---

### SEC-004: PHI Access Logging

| Field | Value |
|-------|-------|
| **Test ID** | SEC-004 |
| **Name** | PHI Access Audit Trail |
| **Description** | Verify all PHI access is logged |
| **Why Important** | HIPAA compliance |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Compliance audits |

---

### SEC-005: Password Policy

| Field | Value |
|-------|-------|
| **Test ID** | SEC-005 |
| **Name** | Password Complexity Enforcement |
| **Description** | Verify password requirements enforced |
| **Why Important** | Account security |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Account management |

**Requirements:**
- [ ] Minimum 8 characters
- [ ] At least one uppercase letter
- [ ] At least one lowercase letter
- [ ] At least one number
- [ ] At least one special character

---

### SEC-006: Rate Limiting

| Field | Value |
|-------|-------|
| **Test ID** | SEC-006 |
| **Name** | API Rate Limiting |
| **Description** | Verify rate limits prevent abuse |
| **Why Important** | DDoS protection |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Security compliance |

---

## 15. Performance Tests

### PERF-001: Dashboard Load Time

| Field | Value |
|-------|-------|
| **Test ID** | PERF-001 |
| **Name** | Dashboard Load Performance |
| **Description** | Verify dashboards load within SLA |
| **Why Important** | User experience |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | AUTH-001 |
| **Feeds Into** | Performance baseline |

**SLA:**
- Page load: < 3 seconds
- Time to interactive: < 2 seconds
- API response: < 500ms

---

### PERF-002: API Response Times

| Field | Value |
|-------|-------|
| **Test ID** | PERF-002 |
| **Name** | API Performance |
| **Description** | Verify API endpoints meet SLA |
| **Why Important** | System responsiveness |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Performance baseline |

---

### PERF-003: Concurrent User Load

| Field | Value |
|-------|-------|
| **Test ID** | PERF-003 |
| **Name** | Concurrent User Capacity |
| **Description** | Verify system handles expected load |
| **Why Important** | Scalability |
| **Criticality** | P1 - High |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | Capacity planning |

**Target:**
- 100 concurrent users
- 1000 requests/minute
- No performance degradation

---

## 16. Accessibility Tests

### A11Y-001: Keyboard Navigation

| Field | Value |
|-------|-------|
| **Test ID** | A11Y-001 |
| **Name** | Full Keyboard Navigation |
| **Description** | Verify all features accessible via keyboard |
| **Why Important** | Accessibility compliance |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | ADA compliance |

**Checklist:**
- [ ] Tab order is logical
- [ ] Focus indicator is visible
- [ ] Enter key activates buttons
- [ ] Escape key closes modals
- [ ] Arrow keys work in dropdown menus

---

### A11Y-002: Screen Reader Compatibility

| Field | Value |
|-------|-------|
| **Test ID** | A11Y-002 |
| **Name** | Screen Reader Support |
| **Description** | Verify content readable by screen readers |
| **Why Important** | Accessibility for visually impaired |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | ADA compliance |

---

### A11Y-003: Color Contrast

| Field | Value |
|-------|-------|
| **Test ID** | A11Y-003 |
| **Name** | Color Contrast Ratios |
| **Description** | Verify text meets WCAG contrast requirements |
| **Why Important** | Visual accessibility |
| **Criticality** | P2 - Medium |
| **Type** | Programmatic |
| **Dependencies** | None |
| **Feeds Into** | ADA compliance |

**Requirement:**
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio

---

## 17. Data Validation Tests

### VAL-001: Required Fields

| Field | Value |
|-------|-------|
| **Test ID** | VAL-001 |
| **Name** | Required Field Validation |
| **Description** | Verify required fields show errors when empty |
| **Why Important** | Data integrity |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Form validation |

---

### VAL-002: Email Format

| Field | Value |
|-------|-------|
| **Test ID** | VAL-002 |
| **Name** | Email Format Validation |
| **Description** | Verify email fields validate format |
| **Why Important** | Data quality |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Form validation |

---

### VAL-003: Phone Number Format

| Field | Value |
|-------|-------|
| **Test ID** | VAL-003 |
| **Name** | Phone Number Validation |
| **Description** | Verify phone fields accept valid formats |
| **Why Important** | Communication data quality |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Form validation |

---

### VAL-004: Date Range Validation

| Field | Value |
|-------|-------|
| **Test ID** | VAL-004 |
| **Name** | Date Range Validation |
| **Description** | Verify start date before end date |
| **Why Important** | Schedule integrity |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Scheduling |

---

### VAL-005: SSN Format

| Field | Value |
|-------|-------|
| **Test ID** | VAL-005 |
| **Name** | SSN Format Validation |
| **Description** | Verify SSN fields validate XXX-XX-XXXX format |
| **Why Important** | Compliance data accuracy |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | HR, Sandata integration |

---

## 18. Error Handling Tests

### ERR-001: Network Timeout

| Field | Value |
|-------|-------|
| **Test ID** | ERR-001 |
| **Name** | Network Timeout Handling |
| **Description** | Verify graceful handling of API timeouts |
| **Why Important** | User experience during connectivity issues |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Error UX |

---

### ERR-002: 404 Page

| Field | Value |
|-------|-------|
| **Test ID** | ERR-002 |
| **Name** | 404 Not Found Page |
| **Description** | Verify 404 page displays for invalid routes |
| **Why Important** | Navigation recovery |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Error UX |

---

### ERR-003: Server Error Display

| Field | Value |
|-------|-------|
| **Test ID** | ERR-003 |
| **Name** | 500 Error Handling |
| **Description** | Verify server errors display user-friendly message |
| **Why Important** | User experience during errors |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Error UX |

---

### ERR-004: Form Validation Errors

| Field | Value |
|-------|-------|
| **Test ID** | ERR-004 |
| **Name** | Form Error Display |
| **Description** | Verify form errors display inline and are clear |
| **Why Important** | Data entry UX |
| **Criticality** | P2 - Medium |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Form UX |

---

## 19. Cross-Browser Tests

### BROWSER-001: Chrome Latest

| Field | Value |
|-------|-------|
| **Test ID** | BROWSER-001 |
| **Name** | Chrome Compatibility |
| **Description** | Verify full functionality in Chrome |
| **Why Important** | Primary browser for most users |
| **Criticality** | P0 - Critical |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Browser support |

---

### BROWSER-002: Firefox Latest

| Field | Value |
|-------|-------|
| **Test ID** | BROWSER-002 |
| **Name** | Firefox Compatibility |
| **Description** | Verify full functionality in Firefox |
| **Why Important** | Browser diversity |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Browser support |

---

### BROWSER-003: Safari Latest

| Field | Value |
|-------|-------|
| **Test ID** | BROWSER-003 |
| **Name** | Safari Compatibility |
| **Description** | Verify full functionality in Safari |
| **Why Important** | Mac/iOS users |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Browser support |

---

### BROWSER-004: Edge Latest

| Field | Value |
|-------|-------|
| **Test ID** | BROWSER-004 |
| **Name** | Edge Compatibility |
| **Description** | Verify full functionality in Edge |
| **Why Important** | Enterprise users |
| **Criticality** | P1 - High |
| **Type** | Manual |
| **Dependencies** | None |
| **Feeds Into** | Browser support |

---

## 20. Regression Test Checklist

### Pre-Deployment Regression Suite

Run before each production deployment:

#### Authentication (5 tests)
- [ ] AUTH-001: Valid login all roles
- [ ] AUTH-002: Invalid password rejected
- [ ] AUTH-005: Logout works
- [ ] AUTH-007: Protected routes redirect
- [ ] AUTH-008: API auth required

#### RBAC (5 tests)
- [ ] RBAC-001: Sidebar filtering works
- [ ] RBAC-002: Access denied displays correctly
- [ ] RBAC-003: Founder has full access
- [ ] RBAC-004: API permission enforcement
- [ ] RBAC-005: Pod-based filtering

#### Schema Validation (5 tests)
- [ ] SCHEMA-001: Shifts table exists
- [ ] SCHEMA-002: Caregivers uses user JOIN
- [ ] SCHEMA-003: user_pod_memberships exists
- [ ] SCHEMA-004: Background checks schema correct
- [ ] SCHEMA-010: Deprecated tables don't exist

#### Core Dashboards (5 tests)
- [ ] DASH-001: Home loads with real data
- [ ] DASH-002: Executive loads (no mock data)
- [ ] DASH-003: HR shows database applicants
- [ ] DASH-004: Tax shows real calculations
- [ ] DASH-005: Billing shows actual revenue

#### Core Workflows (5 tests)
- [ ] WF-001: Billing flow works
- [ ] WF-002: Scheduling uses shifts (not visits)
- [ ] WF-004: HR hiring creates proper records
- [ ] WF-006: EVV clock in/out works
- [ ] WF-008: Caregiver onboarding creates all relationships

#### Visual (3 tests)
- [ ] VIS-001: Typography consistent
- [ ] VIS-002: Colors correct
- [ ] VIS-009: Loading states work

#### Mobile (2 tests)
- [ ] MOB-001: Mobile login works
- [ ] MOB-004: EVV works on mobile

#### Security (3 tests)
- [ ] SEC-001: SQL injection blocked
- [ ] SEC-002: XSS prevented
- [ ] SEC-004: PHI access logged

---

## 21. Known Issues & Workarounds

### 21.1 Schema-Related Issues

| Issue | Workaround |
|-------|------------|
| Tests using `visits` table fail | Replace with `shifts` table references |
| Caregiver name queries fail | Always JOIN caregivers to users table |
| `pod_members` table not found | Use `user_pod_memberships` instead |
| Background check `candidate_id` | Use `applicant_id` column |
| `caregiver_training` not found | Use `training_assignments` table |

### 21.2 UI Issues

| Issue | Workaround |
|-------|------------|
| Double sidebar on Communications | Fixed in latest deployment |
| Mock data appearing in production | Ensure `__PROD__` constant is true in build |

### 21.3 Integration Issues

| Issue | Workaround |
|-------|------------|
| Sandata uses "visit" terminology | Internal system uses "shift", API translates |

---

## Appendix A: Test Execution Log Template

```markdown
# Test Execution Log

**Date:** ____________
**Tester:** ____________
**Environment:** [ ] Production [ ] Staging [ ] Local
**Build/Version:** ____________
**Database Schema Version:** ____________

## Schema Validation
- [ ] SCHEMA-001 through SCHEMA-010 passed

## Tests Executed

| Test ID | Status | Notes |
|---------|--------|-------|
| AUTH-001 | [ ] Pass [ ] Fail | |
| AUTH-002 | [ ] Pass [ ] Fail | |
| RBAC-001 | [ ] Pass [ ] Fail | |
| ... | | |

## Issues Found

| Issue # | Test ID | Severity | Description | Schema Related? |
|---------|---------|----------|-------------|-----------------|
| 1 | | | | [ ] Yes [ ] No |
| 2 | | | | [ ] Yes [ ] No |

## Sign-off

Tested by: ____________ Date: ____________
Reviewed by: ____________ Date: ____________
```

---

## Appendix B: Automated Test Scripts Location

```
/tests
├── /e2e
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── rbac.spec.ts
│   └── workflows.spec.ts
├── /api
│   ├── auth.test.ts
│   ├── dashboard.test.ts
│   ├── hr.test.ts
│   └── billing.test.ts
├── /schema
│   ├── shifts.test.ts
│   ├── caregivers.test.ts
│   ├── background-checks.test.ts
│   └── deprecated-tables.test.ts
├── /visual
│   ├── snapshots/
│   └── visual.spec.ts
└── /performance
    └── load.test.js
```

---

## Appendix C: Database Schema Quick Reference

### Current Table Names (Use These)
- `shifts` (not visits)
- `shift_notes` (not visit_notes)
- `user_pod_memberships` (not pod_members)
- `training_assignments` (not caregiver_training)
- `caregiver_availability_patterns` (not caregiver_availability)
- `claims_batches` (not insurance_claims)

### Current Column Names (Use These)
- `caregivers.employment_status` (not status)
- `caregivers.user_id` → JOIN to `users` for PII
- `user_pod_memberships.role_in_pod` (not role)
- `background_checks.applicant_id` (not candidate_id)
- `background_checks.check_provider` (not provider)
- `background_checks.check_type` (not package_type)
- `background_checks.result` (not overall_result)
- `users.is_active` (not active)
- `*.pod_id` (not primary_pod_id)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-23 | Claude Code | Initial comprehensive test suite |
| 2.0.0 | 2024-12-24 | Claude Code | Added schema validation tests, updated for visits→shifts rename, caregiver identity model change, table/column renames |

---

**End of Document**
