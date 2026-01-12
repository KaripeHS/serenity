# Serenity ERP - Executive Manual Test Plan

## Purpose
This test plan is designed for executive leadership (CEO, COO, CFO, Clinical Director) to:
1. Verify the system is working correctly before go-live
2. Serve as training on key workflows you'll use regularly

**Time Required:** 30-45 minutes per role

---

## Getting Started

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| CEO/Founder | founder@test.serenitycare.com | (provided separately) |
| COO | coo@test.serenitycare.com | (provided separately) |
| CFO | cfo@test.serenitycare.com | (provided separately) |
| Clinical Director | clinical.director@test.serenitycare.com | (provided separately) |

### Access URL
- **Production Console:** https://console.serenitycarepartners.com
- **Firebase Hosted App:** https://serenity-erp-prod.web.app

---

## CEO / Founder Tests

### Test 1: Executive Dashboard Access
**Purpose:** Verify you can see company-wide KPIs

1. Log in with your credentials
2. Navigate to **Dashboard > Executive**
3. **Verify you see:**
   - [ ] Revenue metrics (MTD, YTD)
   - [ ] Active patient count
   - [ ] Active caregiver count
   - [ ] Compliance score

**Expected Result:** Dashboard loads with data within 3 seconds

---

### Test 2: User Management
**Purpose:** Verify you can manage system users

1. Navigate to **Admin > Users**
2. **Verify you can:**
   - [ ] See list of all users
   - [ ] Filter by role (e.g., Caregiver, Nurse)
   - [ ] Search for a specific user
   - [ ] Click "Add User" and see the form (don't submit)

**Expected Result:** All user management functions accessible

---

### Test 3: Audit Log Review
**Purpose:** Verify you can track system activity

1. Navigate to **Admin > Audit Logs**
2. **Verify you can:**
   - [ ] See recent system activities
   - [ ] Filter by date range
   - [ ] Filter by user
   - [ ] See who performed each action

**Expected Result:** Audit logs show recent activity with timestamps

---

## COO Tests

### Test 1: Operations Dashboard
**Purpose:** Verify operational metrics visibility

1. Log in with your credentials
2. Navigate to **Dashboard > Operations**
3. **Verify you see:**
   - [ ] Today's scheduled visits
   - [ ] Caregiver availability
   - [ ] Open shifts needing coverage
   - [ ] EVV compliance rate

**Expected Result:** Operations dashboard loads with current data

---

### Test 2: Scheduling Overview
**Purpose:** Verify schedule visibility

1. Navigate to **Dashboard > Scheduling**
2. **Verify you can:**
   - [ ] See the weekly calendar view
   - [ ] Switch between day/week/month views
   - [ ] See scheduled visits with caregiver names
   - [ ] Click on a visit to see details

**Expected Result:** Calendar displays scheduled visits

---

### Test 3: Pod Management Review
**Purpose:** Verify pod structure visibility

1. Navigate to **Admin > Pods**
2. **Verify you can:**
   - [ ] See all active pods
   - [ ] See pod lead assignments
   - [ ] See caregiver counts per pod
   - [ ] See client counts per pod

**Expected Result:** Pod structure visible with assignments

---

## CFO Tests

### Test 1: Revenue Dashboard
**Purpose:** Verify financial metrics visibility

1. Log in with your credentials
2. Navigate to **Dashboard > Billing**
3. **Verify you see:**
   - [ ] Total AR balance
   - [ ] AR aging buckets (0-30, 31-60, 61-90, 90+)
   - [ ] Claims pending submission
   - [ ] Recent payment receipts

**Expected Result:** Financial dashboard loads with data

---

### Test 2: Claims Status Review
**Purpose:** Verify claims visibility

1. Navigate to **Dashboard > Claims Workflow**
2. **Verify you can:**
   - [ ] See claims by status (Draft, Submitted, Paid, Denied)
   - [ ] Filter claims by date range
   - [ ] Filter claims by payer
   - [ ] See claim amounts

**Expected Result:** Claims list with filtering options

---

### Test 3: Payroll Overview
**Purpose:** Verify payroll visibility

1. Navigate to **Dashboard > Payroll**
2. **Verify you can:**
   - [ ] See current pay period summary
   - [ ] See total hours worked
   - [ ] See overtime hours
   - [ ] See gross pay totals

**Expected Result:** Payroll summary accessible

---

### Test 4: Financial Reports Access
**Purpose:** Verify report generation

1. Navigate to **Finance > Reports**
2. **Verify you can:**
   - [ ] See list of available reports
   - [ ] Select date range for a report
   - [ ] Preview a report (e.g., Revenue by Payer)

**Expected Result:** Report generation interface accessible

---

## Clinical Director Tests

### Test 1: Clinical Dashboard
**Purpose:** Verify clinical metrics visibility

1. Log in with your credentials
2. Navigate to **Dashboard > Clinical**
3. **Verify you see:**
   - [ ] Active patient count
   - [ ] Assessments due
   - [ ] Care plan reviews pending
   - [ ] Incident reports (if any)

**Expected Result:** Clinical dashboard loads with data

---

### Test 2: Patient List Review
**Purpose:** Verify patient access

1. Navigate to **Patients**
2. **Verify you can:**
   - [ ] See list of all patients
   - [ ] Search for a patient by name
   - [ ] Click on a patient to see their profile
   - [ ] See care plan summary

**Expected Result:** Patient list and profiles accessible

---

### Test 3: Supervisory Visits
**Purpose:** Verify supervision tracking

1. Navigate to **Dashboard > Supervisory Visits**
2. **Verify you can:**
   - [ ] See scheduled supervisory visits
   - [ ] See overdue visits (if any)
   - [ ] See completed visit summaries

**Expected Result:** Supervisory visit tracking accessible

---

### Test 4: Credential Tracking
**Purpose:** Verify staff credential visibility

1. Navigate to **Dashboard > Credentials**
2. **Verify you can:**
   - [ ] See staff credentials list
   - [ ] See expiring credentials (30-day warning)
   - [ ] Filter by credential type
   - [ ] See expired credentials (if any)

**Expected Result:** Credential dashboard shows compliance status

---

### Test 5: Incident Review
**Purpose:** Verify incident management access

1. Navigate to **Dashboard > Incidents**
2. **Verify you can:**
   - [ ] See incident list (may be empty)
   - [ ] See incident reporting form
   - [ ] Filter by incident type

**Expected Result:** Incident management interface accessible

---

## Universal Tests (All Roles)

### Test A: Navigation
1. **Verify sidebar navigation:**
   - [ ] Can expand/collapse sidebar
   - [ ] Menu items match your role permissions
   - [ ] Clicking menu items navigates correctly

### Test B: Search
1. **Verify global search:**
   - [ ] Click search icon in header
   - [ ] Type a patient or staff name
   - [ ] Results appear and are clickable

### Test C: Profile & Logout
1. **Verify profile access:**
   - [ ] Click your profile icon (top right)
   - [ ] Can see your profile information
   - [ ] Sign Out button works

---

## Issue Reporting

If you encounter any issues during testing:

1. **Note the following:**
   - What you were trying to do
   - What you expected to happen
   - What actually happened
   - Screenshot if possible

2. **Report to:** IT Support / System Administrator

---

## Sign-Off

After completing your role-specific tests, please sign below:

| Role | Name | Date | Pass/Fail | Notes |
|------|------|------|-----------|-------|
| CEO/Founder | | | | |
| COO | | | | |
| CFO | | | | |
| Clinical Director | | | | |

---

**System Version:** Production Release v1.0
**Test Plan Version:** 1.0
**Last Updated:** January 2026
