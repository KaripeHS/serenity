# Serenity ERP - Production Readiness Manual Test Plan

## Overview

**Console URL**: https://console.serenitycarepartners.com

This comprehensive manual test plan simulates real-world home health care operations to validate the Serenity ERP platform is production-ready. The tests cover:

- **Caregiver Lifecycle**: Hiring → Onboarding → Credentialing → Scheduling → Performance → Termination
- **Patient Lifecycle**: Referral → Intake → Authorization → Care Plan → Scheduling → Billing
- **Compliance & HIPAA**: Access controls, audit logging, data protection
- **Error Handling**: System responses to invalid operations
- **Multi-Role Operations**: CEO (Clinical), COO (Operations), Pod Lead, Caregivers

---

## Test Environment Setup

### Test Accounts

**IMPORTANT**: All test accounts use the email domain `@test.serenitycare.com` and the standard password `TestPassword123!`

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| Founder | founder@test.serenitycare.com | TestPassword123! | Founder access, all permissions |
| CEO | ceo@test.serenitycare.com | TestPassword123! | Clinical oversight, executive dashboards |
| COO | coo@test.serenitycare.com | TestPassword123! | Operations, HR, scheduling, billing |
| CFO | cfo@test.serenitycare.com | TestPassword123! | Financial oversight |
| Pod Lead | pod.lead@test.serenitycare.com | TestPassword123! | Pod management, team oversight |
| HR Manager | hr.manager@test.serenitycare.com | TestPassword123! | Recruiting, onboarding |
| HR Director | hr.director@test.serenitycare.com | TestPassword123! | HR oversight |
| Recruiter | recruiter@test.serenitycare.com | TestPassword123! | Talent acquisition |
| Scheduler | scheduler@test.serenitycare.com | TestPassword123! | Shift management |
| Scheduling Manager | scheduling.manager@test.serenitycare.com | TestPassword123! | Scheduling oversight |
| Billing Manager | billing.manager@test.serenitycare.com | TestPassword123! | Claims, billing oversight |
| RCM Analyst | rcm.analyst@test.serenitycare.com | TestPassword123! | Revenue cycle management |
| Caregiver | caregiver@test.serenitycare.com | TestPassword123! | Field operations |
| HHA | hha@test.serenitycare.com | TestPassword123! | Home health aide |
| CNA | cna@test.serenitycare.com | TestPassword123! | Certified nursing assistant |
| DSP Med | dsp.med@test.serenitycare.com | TestPassword123! | Direct support professional (med) |
| DSP Basic | dsp.basic@test.serenitycare.com | TestPassword123! | Direct support professional |
| RN Case Manager | rn.case.manager@test.serenitycare.com | TestPassword123! | Clinical case management |
| LPN | lpn@test.serenitycare.com | TestPassword123! | Licensed practical nurse |
| Director of Nursing | don@test.serenitycare.com | TestPassword123! | Nursing oversight |
| Clinical Director | clinical.director@test.serenitycare.com | TestPassword123! | Clinical oversight |
| Compliance Officer | compliance.officer@test.serenitycare.com | TestPassword123! | Compliance oversight |
| IT Admin | it.admin@test.serenitycare.com | TestPassword123! | System administration |
| Operations Manager | ops.manager@test.serenitycare.com | TestPassword123! | Operations oversight |
| Field Ops Manager | field.ops.manager@test.serenitycare.com | TestPassword123! | Field operations oversight |
| Dispatcher | dispatcher@test.serenitycare.com | TestPassword123! | Dispatch coordination |

### Test Patients (To Be Created)

| Patient ID | Name | Service Type | Payer |
|------------|------|--------------|-------|
| TEST-PAT-001 | John Smith | Personal Care | Medicaid |
| TEST-PAT-002 | Mary Johnson | Home Health Aide | Medicare |
| TEST-PAT-003 | Robert Williams | DODD HPC | DODD |
| TEST-PAT-004 | Patricia Brown | Consumer Directed | Private Pay |
| TEST-PAT-005 | Michael Davis | Skilled Nursing | Medicare Advantage |

### Test Pod

| Pod Code | Name | Region | Pod Lead |
|----------|------|--------|----------|
| TEST-POD | Test Operations Pod | Columbus, OH | podlead.test |

---

## PHASE 1: ACCOUNT SETUP & ACCESS CONTROL TESTS

### Test 1.1: Create Test User Accounts
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- User creation functionality
- Role assignment
- Password requirements enforcement
- Email notifications

#### Why This Test Matters
- Ensures proper access control from day one
- Validates RBAC (Role-Based Access Control) is working
- Confirms new users receive proper credentials

#### Steps
1. Navigate to **Admin → Users** (https://console.serenitycarepartners.com/admin/users)
2. Click "Add User" button
3. Create each test account from the table above:
   - Enter first name, last name, email
   - Assign appropriate role from dropdown
   - Set temporary password
   - Assign to organization
4. Verify confirmation email is sent (check spam folder)
5. For each caregiver account, assign to TEST-POD

#### Expected Results
- [ ] All users created successfully
- [ ] Each user receives welcome email
- [ ] Users appear in the Users list with correct roles
- [ ] Caregivers are assigned to TEST-POD

#### Dashboards Impacted
- Admin System Dashboard (user count increases)
- Talent Command Center (staff count)
- Pod Lead Dashboard (team members)

#### Error Scenarios to Test
- [ ] Try creating user with duplicate email → Should show "Email already exists"
- [ ] Try creating user with weak password → Should show password requirements
- [ ] Try creating user without required fields → Should show validation errors

---

### Test 1.2: Role-Based Access Control (RBAC) Verification
**Tested By**: COO
**Duration**: 45 minutes

#### What is Being Tested
- Each role can only access permitted dashboards
- Unauthorized access is blocked
- Menu items are filtered by role

#### Why This Test Matters
- HIPAA compliance requires proper access controls
- Prevents unauthorized data access
- Ensures principle of least privilege

#### Steps
For each test account, login and verify:

**Caregiver Account (caregiver1.test)**:
1. Login with caregiver credentials
2. Verify sidebar shows ONLY: My Portal, My Patients, EVV Clock, My Schedule, My Training, My Pay, Report Incident, Resources
3. Try to directly navigate to https://console.serenitycarepartners.com/admin/users → Should redirect or show "Access Denied"
4. Try to navigate to https://console.serenitycarepartners.com/dashboard/billing → Should redirect or show "Access Denied"
5. Verify caregiver CANNOT see other caregiver's schedules or pay

**Pod Lead Account (podlead.test)**:
1. Login with pod lead credentials
2. Verify can see: Pod Dashboard, My Team, My Clients, Today's Ops, Scheduling, Dispatch, Approvals, Pod Metrics
3. Verify CAN see caregivers in their pod
4. Verify CANNOT see caregivers in other pods
5. Verify CANNOT access Admin section

**HR Manager Account (hr.test)**:
1. Login and verify access to Talent Command Center
2. Verify CAN see all staff records
3. Verify CANNOT access Billing dashboards

**Biller Account (biller.test)**:
1. Login and verify access to Billing dashboards
2. Verify CANNOT access HR records (except name/schedule)

#### Expected Results
- [ ] Caregivers see simplified navigation
- [ ] Pod Leads see pod-specific data only
- [ ] HR can access HR functions but not billing details
- [ ] Billers can access billing but not full HR records
- [ ] Direct URL access to unauthorized pages is blocked

#### Dashboards Impacted
- All dashboards (access filtering)

#### Error Scenarios to Test
- [ ] Caregiver tries https://console.serenitycarepartners.com/dashboard/executive → Access denied
- [ ] Pod Lead tries https://console.serenitycarepartners.com/admin/users → Access denied
- [ ] HR tries https://console.serenitycarepartners.com/dashboard/billing → Access denied

---

### Test 1.3: Audit Log Verification
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- All user actions are logged
- Audit logs capture who, what, when
- Logs are searchable and filterable

#### Why This Test Matters
- HIPAA requires audit trails
- Enables investigation of security incidents
- Supports compliance audits

#### Steps
1. Navigate to **Admin → Audit Logs** (https://console.serenitycarepartners.com/admin/audit)
2. Search for recent user creation events from Test 1.1
3. Verify each user creation shows:
   - Timestamp
   - User who performed action (COO)
   - Action type (USER_CREATED)
   - Target user info
4. Filter by date range
5. Filter by action type
6. Export audit log to CSV

#### Expected Results
- [ ] All user creation events are logged
- [ ] Logs show actor, action, target, timestamp
- [ ] Filtering works correctly
- [ ] Export generates valid CSV

#### Dashboards Impacted
- Compliance Command Center (audit metrics)
- Admin System Dashboard

---

## PHASE 2: CAREGIVER LIFECYCLE TESTS

### Test 2.1: Job Application & Recruiting Pipeline
**Tested By**: COO (HR Manager role)
**Login**: hr.manager@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Public careers page functionality
- Application submission
- Applicant tracking system
- Interview scheduling

#### Why This Test Matters
- Validates recruiting workflow
- Ensures no applications are lost
- Confirms interview scheduling works

#### Steps

**Part A: Submit Test Applications**
1. Open incognito/private browser window
2. Navigate to public careers page: `https://serenitycarepartners.com/careers`
3. Submit 3 test applications:
   - Application 1: Complete, all fields filled
   - Application 2: Minimal info (test required fields)
   - Application 3: Duplicate email (test duplicate detection)

**Part B: Review Applications (as HR)**
1. Login as HR Manager
2. Navigate to **Talent Command Center** (https://console.serenitycarepartners.com/dashboard/hr)
3. Click on "Applicants" or "Pipeline" tab
4. Verify test applications appear in "New" status
5. For Application 1:
   - Click to view details
   - Move to "Screening" status
   - Add notes
   - Schedule phone interview
6. For Application 2:
   - Reject with reason "Incomplete application"
   - Verify rejection email is sent

**Part C: Interview Workflow**
1. For Application 1, schedule in-person interview
2. Add interview notes
3. Move to "Offer" stage
4. Generate offer letter

#### Expected Results
- [ ] Public careers page loads correctly
- [ ] Applications are captured in system
- [ ] Pipeline stages work (New → Screening → Interview → Offer)
- [ ] Interview scheduling creates calendar events
- [ ] Rejection emails are sent
- [ ] Offer letters can be generated

#### Dashboards Impacted
- Talent Command Center (applicant metrics)
- Executive Dashboard (hiring pipeline)

#### Error Scenarios to Test
- [ ] Submit application with invalid email format
- [ ] Submit application with missing required fields
- [ ] Schedule interview for past date

---

### Test 2.2: Onboarding New Hire
**Tested By**: COO (HR Manager role)
**Login**: hr.manager@test.serenitycare.com
**Duration**: 45 minutes

#### What is Being Tested
- Onboarding checklist creation
- Document collection
- I-9 and W-4 processing
- Background check initiation

#### Why This Test Matters
- Ensures compliance with employment law
- Validates all required documents are collected
- Confirms background check integration

#### Steps

**Part A: Accept Offer & Start Onboarding**
1. For test applicant from 2.1, mark offer as accepted
2. System should automatically create onboarding checklist
3. Navigate to **HR → Onboarding** (https://console.serenitycarepartners.com/hr/onboarding/:applicantId)
4. Verify 12-step checklist is created:
   - [ ] Step 1: Personal Information
   - [ ] Step 2: Emergency Contacts
   - [ ] Step 3: Tax Documents (W-4)
   - [ ] Step 4: I-9 Employment Eligibility
   - [ ] Step 5: Direct Deposit
   - [ ] Step 6: Background Check Consent
   - [ ] Step 7: Policy Acknowledgments
   - [ ] Step 8: HIPAA Training
   - [ ] Step 9: Credential Upload
   - [ ] Step 10: Equipment Assignment
   - [ ] Step 11: Schedule Orientation
   - [ ] Step 12: Final Review

**Part B: Complete Onboarding Steps**
1. Complete each step, uploading test documents
2. For Background Check:
   - Initiate BCI check
   - Initiate FBI check
   - Verify status appears in Background Check Dashboard
3. For Credentials:
   - Upload test CPR certification (set expiration 30 days out)
   - Upload test driver's license
   - Upload test auto insurance

**Part C: Convert to Active Employee**
1. Mark all steps complete
2. Click "Complete Onboarding"
3. Verify employee is now active in system
4. Verify employee appears in appropriate pod
5. Verify credentials appear in Credential Dashboard

#### Expected Results
- [ ] 12-step checklist is auto-created
- [ ] Documents can be uploaded
- [ ] Background checks are initiated
- [ ] Credentials are tracked with expiration dates
- [ ] Employee becomes active after completion

#### Dashboards Impacted
- Talent Command Center (onboarding metrics)
- Background Check Dashboard
- Credential Expiration Dashboard

#### Error Scenarios to Test
- [ ] Try to complete onboarding with missing required steps
- [ ] Upload expired credential document
- [ ] Upload document exceeding size limit

---

### Test 2.3: Credential Tracking & Expiration Alerts
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- Credential expiration tracking
- Alert generation for expiring credentials
- Notification system

#### Why This Test Matters
- Regulatory compliance requires valid credentials
- Prevents scheduling caregivers with expired certs
- Protects organization from liability

#### Steps
1. Navigate to **Credential Expiration** (https://console.serenitycarepartners.com/dashboard/credentials)
2. Find the test caregiver with CPR cert expiring in 30 days
3. Verify credential shows in "Expiring Soon" list
4. Click on credential to view details
5. Check that alert appears in notification bell
6. Verify caregiver would be flagged if scheduled after expiration

**Add Test Credentials with Various Expirations**:
1. Go to caregiver profile
2. Add credentials:
   - One expired (yesterday's date)
   - One expiring in 7 days
   - One expiring in 14 days
   - One expiring in 30 days
   - One valid for 1 year

3. Return to Credential Dashboard
4. Verify sorting and filtering by expiration date

#### Expected Results
- [ ] Expired credentials show in red/critical
- [ ] Expiring within 7 days shows as high priority
- [ ] Expiring within 30 days shows as warning
- [ ] Notifications are generated for expiring credentials
- [ ] Dashboard counts are accurate

#### Dashboards Impacted
- Credential Expiration Dashboard
- Talent Command Center
- Compliance Command Center
- Notification Bell (header)

---

### Test 2.4: Training Assignment & Completion
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Training course assignment
- Progress tracking
- Completion certificates
- Compliance reporting

#### Why This Test Matters
- Ohio requires specific training hours
- DODD programs require specialized training
- Training compliance affects billing

#### Steps

**Part A: Assign Required Training**
1. Navigate to **Training Management** (https://console.serenitycarepartners.com/dashboard/training)
2. For each test caregiver, assign:
   - HIPAA Privacy Training (mandatory)
   - Bloodborne Pathogens (mandatory)
   - CPR Refresher (if expiring)
   - DODD-specific training (for DODD caregiver)
3. Set due dates (some overdue for testing)

**Part B: Complete Training (as Caregiver)**
1. Login as caregiver1.test
2. Navigate to My Training tab in Caregiver Portal (https://console.serenitycarepartners.com/caregiver-portal)
3. Start assigned training
4. Complete quiz/assessment
5. View certificate of completion

**Part C: Verify Completion (as COO)**
1. Login as COO
2. Check Training Dashboard for completion status
3. Verify certificate is stored
4. Check compliance percentage updates

#### Expected Results
- [ ] Training can be assigned to caregivers
- [ ] Caregivers can access and complete training
- [ ] Completion updates compliance metrics
- [ ] Certificates are generated and stored
- [ ] Overdue training triggers alerts

#### Dashboards Impacted
- Training Management Dashboard
- Talent Command Center (training tab)
- Caregiver Portal (My Training)
- Compliance Command Center

#### Error Scenarios to Test
- [ ] Assign training with past due date
- [ ] Try to complete training without watching video
- [ ] Fail quiz - verify retry allowed

---

### Test 2.5: Caregiver Scheduling & EVV
**Tested By**: COO (Scheduler role)
**Login**: scheduler@test.serenitycare.com
**Duration**: 45 minutes

#### What is Being Tested
- Shift creation and assignment
- Caregiver availability management
- EVV clock in/out
- Geofencing compliance

#### Why This Test Matters
- EVV is mandatory for Medicaid billing
- Scheduling efficiency affects operations
- Geofencing ensures visits occur at correct location

#### Steps

**Part A: Set Caregiver Availability**
1. Login as Scheduler
2. Navigate to **Scheduling Calendar** (https://console.serenitycarepartners.com/dashboard/scheduling-calendar)
3. For each test caregiver, set availability:
   - Caregiver 1: Mon-Fri, 8am-5pm
   - Caregiver 2: Mon-Wed, 7am-3pm
   - Caregiver 3: Tue-Sat, 9am-6pm
   - Caregiver 4: Thu-Sun, 10am-7pm
   - Caregiver 5: Flexible/On-call

**Part B: Create Shifts**
1. For each test patient (after intake complete), create shifts:
   - Patient 1: Mon/Wed/Fri 9am-12pm with Caregiver 1
   - Patient 2: Tue/Thu 10am-2pm with Caregiver 2
   - Patient 3: Mon-Fri 1pm-5pm with Caregiver 3
   - Patient 4: Sat/Sun 8am-12pm with Caregiver 4
   - Patient 5: PRN coverage
2. Verify conflicts are flagged (test by double-booking)

**Part C: EVV Clock In/Out (as Caregiver)**
1. Login as caregiver1.test
2. Navigate to **EVV Clock** (https://console.serenitycarepartners.com/evv/clock)
3. Select scheduled shift
4. Clock IN:
   - Verify location is captured
   - Verify within geofence (or flag if not)
5. Perform visit tasks
6. Clock OUT:
   - Add visit notes
   - Capture signature (if required)
   - Submit visit

**Part D: EVV Compliance Review (as COO)**
1. Login as COO
2. Navigate to **Operations Command Center** (https://console.serenitycarepartners.com/dashboard/operations)
3. Check EVV compliance metrics
4. Review any geofence violations
5. Verify visit data appears correctly

#### Expected Results
- [ ] Availability is saved and shown on calendar
- [ ] Shifts can be created and assigned
- [ ] Double-booking is flagged
- [ ] EVV captures location and time
- [ ] Geofence violations are flagged
- [ ] Visit data is recorded accurately

#### Dashboards Impacted
- Scheduling Calendar
- Operations Command Center
- Caregiver Portal (My Schedule)
- EVV Clock
- Executive Dashboard (visit metrics)

#### Error Scenarios to Test
- [ ] Schedule caregiver outside availability → Warning shown
- [ ] Schedule caregiver with expired credential → Blocked
- [ ] Clock in from wrong location → Geofence warning
- [ ] Clock out without notes → Validation error

---

### Test 2.6: Caregiver Performance & Discipline
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- SPI (Serenity Performance Index) calculation
- Performance tracking
- Disciplinary action workflow
- PIP (Performance Improvement Plan) management

#### Why This Test Matters
- Ensures quality care delivery
- Documents performance issues for compliance
- Supports fair and consistent discipline

#### Steps

**Part A: Review SPI Scores**
1. Navigate to **Talent Command Center** (https://console.serenitycarepartners.com/dashboard/hr)
2. View Performance tab
3. Review SPI scores for test caregivers:
   - Attendance component
   - Punctuality component
   - EVV compliance component
   - Patient satisfaction component
   - Training compliance component

**Part B: Document Performance Issue**
1. Select test caregiver with lower SPI
2. Click "Add Disciplinary Action"
3. Document incident:
   - Type: Verbal Warning
   - Reason: Late clock-ins
   - Supporting documentation
4. Save and verify in employee record

**Part C: Escalate to Written Warning**
1. Add another incident
2. Type: Written Warning
3. Create Performance Improvement Plan (PIP)
4. Set 30-day review period
5. Schedule follow-up meeting

#### Expected Results
- [ ] SPI scores are calculated and displayed
- [ ] Disciplinary actions can be recorded
- [ ] Escalation path is enforced (verbal → written → PIP)
- [ ] PIPs have clear timelines and goals
- [ ] History is maintained in employee record

#### Dashboards Impacted
- Talent Command Center
- Staff Profile page
- Executive Dashboard (HR metrics)

---

### Test 2.7: Caregiver Termination
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Termination workflow
- Final pay processing
- Equipment return tracking
- Access revocation

#### Why This Test Matters
- Ensures proper offboarding
- Protects company assets
- Maintains compliance records
- Prevents unauthorized access

#### Steps

**Part A: Initiate Termination**
1. Navigate to Caregiver 5 profile in Talent Command Center (https://console.serenitycarepartners.com/dashboard/hr)
2. Click "Terminate Employee"
3. Select termination type:
   - Voluntary (resignation)
   - Involuntary (with cause)
4. Enter termination date
5. Document reason

**Part B: Complete Termination Checklist**
1. Verify termination checklist appears:
   - [ ] Final timesheet submitted
   - [ ] Equipment returned (phone, badge, etc.)
   - [ ] System access revoked
   - [ ] Final paycheck processed
   - [ ] COBRA notification sent (if applicable)
   - [ ] Exit interview completed
2. Complete each item

**Part C: Verify Access Revocation**
1. Try to login as terminated caregiver → Should fail
2. Verify removed from active staff list
3. Verify removed from scheduling
4. Verify audit log shows termination

**Part D: Process Final Pay**
1. Navigate to Payroll Dashboard (https://console.serenitycarepartners.com/dashboard/payroll-v2)
2. Verify final pay calculation includes:
   - Hours worked
   - PTO payout (if applicable)
   - Any deductions
3. Process final payment

#### Expected Results
- [ ] Termination workflow is complete
- [ ] Access is immediately revoked
- [ ] Final pay is calculated correctly
- [ ] Equipment return is tracked
- [ ] Employee record is retained (not deleted) for compliance

#### Dashboards Impacted
- Talent Command Center (turnover metrics)
- Payroll Dashboard
- Admin Users list
- Executive Dashboard

---

## PHASE 3: PATIENT LIFECYCLE TESTS

### Test 3.1: Lead/Referral Management
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- Referral source tracking
- Lead pipeline management
- Conversion tracking

#### Why This Test Matters
- Tracks marketing effectiveness
- Manages sales pipeline
- Ensures no referrals are lost

#### Steps

**Part A: Add Referral Sources**
1. Navigate to **CRM/Lead Pipeline** (https://console.serenitycarepartners.com/dashboard/crm)
2. Add referral sources:
   - Hospital: Columbus General
   - Physician: Dr. Smith
   - Agency: Senior Services Inc.
   - Self-referral/Website

**Part B: Create Test Leads**
1. Add 5 test patient leads (from Patient table above)
2. For each lead, enter:
   - Contact information
   - Referral source
   - Service needs
   - Insurance information
3. Move leads through pipeline stages:
   - New → Contacted → Assessment Scheduled → Converted

**Part C: Track Conversion**
1. Convert leads to patients
2. Verify referral source attribution is maintained
3. Check conversion metrics

#### Expected Results
- [ ] Leads can be created and tracked
- [ ] Pipeline stages work correctly
- [ ] Referral source is tracked through conversion
- [ ] Conversion metrics update

#### Dashboards Impacted
- CRM/Lead Pipeline
- Strategic Growth Dashboard
- Executive Dashboard (census metrics)

---

### Test 3.2: Patient Intake & Assessment
**Tested By**: CEO (Clinical)
**Login**: ceo@test.serenitycare.com
**Duration**: 60 minutes

#### What is Being Tested
- Patient intake workflow
- Clinical assessment completion
- HIPAA-compliant data collection
- Insurance verification

#### Why This Test Matters
- Ensures complete patient information
- Validates clinical assessment tools
- Confirms insurance eligibility
- Supports proper care planning

#### Steps

**Part A: Start Patient Intake (for each test patient)**
1. Navigate to **Client Intake** (https://console.serenitycarepartners.com/dashboard/client-intake)
2. Select converted lead or click "New Patient"
3. Complete Demographics:
   - Personal information
   - Address (for geofencing)
   - Emergency contacts
   - Physician information
4. Complete Insurance:
   - Primary insurance (Medicaid/Medicare/DODD)
   - Secondary insurance (if applicable)
   - Verify eligibility

**Part B: Complete Clinical Assessment**
1. Navigate to Assessment tab in Client Intake (https://console.serenitycarepartners.com/dashboard/client-intake)
2. Complete intake assessment:
   - Medical history
   - Current medications
   - Allergies
   - Functional assessment (ADLs)
   - Fall risk assessment
   - Cognitive assessment
   - Safety assessment
3. Document physician orders
4. Upload supporting documents

**Part C: Create Care Plan**
1. Based on assessment, create care plan:
   - List of services needed
   - Frequency (daily, weekly)
   - Goals and outcomes
   - Special instructions
2. Assign care plan to patient
3. Get physician signature (electronic or upload)

**Part D: Service Authorization**
1. Navigate to Authorizations (https://console.serenitycarepartners.com/dashboard/authorizations)
2. Create authorization:
   - Payer
   - Service type
   - Authorized units/hours
   - Date range
   - Diagnosis codes
3. Verify authorization against care plan

#### Expected Results
- [ ] All demographic data is captured
- [ ] Insurance verification works
- [ ] Assessment tools function correctly
- [ ] Care plan is created from assessment
- [ ] Authorization is linked to patient

#### Dashboards Impacted
- Clinical Command Center
- Authorization Dashboard
- Patient list
- Care Plan Editor

#### Error Scenarios to Test
- [ ] Missing required demographic fields
- [ ] Invalid insurance information
- [ ] Authorization dates outside care plan dates
- [ ] Duplicate patient detection

---

### Test 3.3: Supervisory Visits & Clinical Oversight
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- RN supervisory visit scheduling
- Visit documentation
- Care plan updates
- Clinical compliance tracking

#### Why This Test Matters
- Ohio requires regular RN supervision
- Ensures quality of care
- Updates care plans as conditions change
- Documents clinical oversight

#### Steps

**Part A: Schedule Supervisory Visits**
1. Navigate to **Supervisory Visits** (https://console.serenitycarepartners.com/dashboard/supervisory-visits)
2. For each test patient, schedule initial supervisory visit
3. Verify visits appear on calendar
4. Assign RN (CEO acts as RN for test)

**Part B: Complete Supervisory Visit**
1. Open scheduled visit
2. Complete visit documentation:
   - Patient condition
   - Caregiver performance observation
   - Care plan review
   - Medication reconciliation
   - Patient/family satisfaction
3. Sign and submit visit

**Part C: Update Care Plan**
1. Based on visit, update care plan
2. Add or modify services
3. Document rationale
4. Generate updated care plan document

#### Expected Results
- [ ] Supervisory visits can be scheduled
- [ ] Visit documentation is comprehensive
- [ ] Care plans can be updated
- [ ] Visit history is maintained

#### Dashboards Impacted
- Supervisory Visits Dashboard
- Clinical Command Center
- Care Plan Editor
- Patient record

---

### Test 3.4: Incident Reporting & QAPI
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Incident reporting workflow
- Investigation process
- QAPI (Quality Assurance Performance Improvement)
- Corrective action tracking

#### Why This Test Matters
- Regulatory requirement
- Patient safety
- Continuous improvement
- Legal protection

#### Steps

**Part A: Report Incident (as Caregiver)**
1. Login as caregiver1.test
2. Navigate to Report Incident (https://console.serenitycarepartners.com/dashboard/incidents)
3. Submit test incident:
   - Type: Patient Fall (no injury)
   - Patient: Test Patient 1
   - Date/Time
   - Description
   - Immediate actions taken
4. Submit report

**Part B: Review & Investigate (as CEO)**
1. Login as CEO
2. Navigate to **Incidents Dashboard** (https://console.serenitycarepartners.com/dashboard/incidents)
3. Review new incident
4. Assign for investigation
5. Complete investigation:
   - Root cause analysis
   - Contributing factors
   - Corrective actions
6. Close incident

**Part C: QAPI Review**
1. Navigate to Clinical Command Center → QAPI tab (https://console.serenitycarepartners.com/dashboard/clinical)
2. Review incident trends
3. Identify patterns
4. Create improvement initiative if needed

#### Expected Results
- [ ] Caregivers can report incidents
- [ ] Incidents appear in dashboard immediately
- [ ] Investigation workflow is complete
- [ ] Corrective actions are tracked
- [ ] QAPI metrics update

#### Dashboards Impacted
- Incidents Dashboard
- Clinical Command Center (QAPI tab)
- Caregiver Portal
- Compliance Command Center

---

### Test 3.5: Claims Generation & Submission
**Tested By**: COO (Biller role)
**Login**: billing.manager@test.serenitycare.com
**Duration**: 45 minutes

#### What is Being Tested
- Claims generation from visits
- Claim editing and validation
- Batch submission
- Clearinghouse integration

#### Why This Test Matters
- Revenue depends on clean claims
- Compliance with billing regulations
- Minimizes denials

#### Steps

**Part A: Generate Claims**
1. Navigate to **Claims Workflow** (https://console.serenitycarepartners.com/dashboard/claims-workflow)
2. Click "Generate Claims" for test period
3. System should create claims for:
   - Completed EVV visits
   - With valid authorizations
   - Proper diagnosis codes
4. Review generated claims

**Part B: Validate Claims**
1. Review each claim for:
   - Correct patient info
   - Correct service codes
   - Correct units
   - Valid authorization
   - Proper modifiers
2. Flag any errors

**Part C: Submit Claims**
1. Select claims ready for submission
2. Choose submission method:
   - Electronic (837)
   - Direct to payer
3. Submit batch
4. Verify submission confirmation

**Part D: Track Claims**
1. Check claim status updates
2. Review clearinghouse reports
3. Handle any rejections

#### Expected Results
- [ ] Claims are generated from visit data
- [ ] Validation catches errors before submission
- [ ] Claims can be submitted electronically
- [ ] Status tracking works

#### Dashboards Impacted
- Claims Workflow
- Billing Dashboard
- AR Aging Dashboard
- Revenue Command Center

#### Error Scenarios to Test
- [ ] Generate claim without authorization → Should be flagged
- [ ] Generate claim with expired authorization → Warning
- [ ] Submit claim with invalid diagnosis code → Rejection

---

### Test 3.6: Denial Management
**Tested By**: COO (Biller role)
**Login**: billing.manager@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Denial receipt and categorization
- Appeal workflow
- Denial analytics

#### Why This Test Matters
- Recovers lost revenue
- Identifies billing issues
- Improves clean claim rate

#### Steps

**Part A: Simulate Denial**
1. Navigate to **Denial Dashboard** (https://console.serenitycarepartners.com/dashboard/denials)
2. Manually create test denial (or wait for actual denial)
3. Enter denial information:
   - Claim ID
   - Denial code
   - Denial reason
   - Payer

**Part B: Work Denial**
1. Review denial reason
2. Determine if appealable
3. If appealable:
   - Gather supporting documentation
   - Create appeal letter
   - Submit appeal
4. If not appealable:
   - Document write-off reason
   - Adjust patient account

**Part C: Track Appeal**
1. Monitor appeal status
2. Update when resolved
3. Review denial trends

#### Expected Results
- [ ] Denials are tracked centrally
- [ ] Appeal workflow is documented
- [ ] Analytics show denial patterns
- [ ] Resolution is tracked

#### Dashboards Impacted
- Denial Dashboard
- Billing Dashboard
- AR Aging Dashboard
- Revenue Command Center

---

### Test 3.7: AR Aging & Collections
**Tested By**: COO (Biller role)
**Login**: billing.manager@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- AR aging buckets
- Payment posting
- Collection workflows

#### Why This Test Matters
- Cash flow management
- Revenue cycle efficiency
- Reduces bad debt

#### Steps

**Part A: Review AR Aging**
1. Navigate to **AR Aging Dashboard** (https://console.serenitycarepartners.com/dashboard/billing-ar)
2. Review aging buckets:
   - 0-30 days
   - 31-60 days
   - 61-90 days
   - 90+ days
3. Identify oldest receivables

**Part B: Post Payment**
1. Simulate ERA (Electronic Remittance) receipt
2. Post payments to claims
3. Handle adjustments
4. Verify balances update

**Part C: Collection Action**
1. For test 90+ day account
2. Document collection activity
3. Create patient statement
4. Track follow-up

#### Expected Results
- [ ] AR aging is accurate
- [ ] Payments post correctly
- [ ] DSO (Days Sales Outstanding) calculates
- [ ] Collection activity is documented

#### Dashboards Impacted
- AR Aging Dashboard
- Billing Dashboard
- Revenue Command Center
- Executive Dashboard

---

### Test 3.8: Patient Discharge
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- Discharge workflow
- Final billing
- Record retention
- Care transition

#### Why This Test Matters
- Ensures clean close-out
- Captures final billing
- Documents outcomes
- Supports continuity of care

#### Steps

**Part A: Initiate Discharge**
1. Navigate to Test Patient 5 record in Patients (https://console.serenitycarepartners.com/patients)
2. Click "Discharge Patient"
3. Select discharge reason:
   - Goals met
   - Transfer to facility
   - Patient request
   - Death
4. Enter discharge date

**Part B: Complete Discharge**
1. Complete discharge summary
2. Final supervisory visit
3. Equipment return (if applicable)
4. Verify all visits are billed
5. Close authorization

**Part C: Post-Discharge**
1. Verify patient shows as discharged
2. Verify record is retained (not deleted)
3. Verify no future shifts exist
4. Update census reports

#### Expected Results
- [ ] Discharge workflow is complete
- [ ] Final billing is captured
- [ ] Record is retained for compliance
- [ ] Census updates correctly

#### Dashboards Impacted
- Clinical Command Center
- Executive Dashboard (census)
- Billing Dashboard
- Patient list

---

## PHASE 4: POD MANAGEMENT TESTS

### Test 4.1: Pod Lead Dashboard Operations
**Tested By**: Pod Lead
**Login**: pod.lead@test.serenitycare.com
**Duration**: 45 minutes

#### What is Being Tested
- Pod Lead specific functionality
- Team management
- Client oversight
- Performance metrics

#### Why This Test Matters
- Pod Leads are "Mini-COOs"
- Need complete pod visibility
- Must manage daily operations

#### Steps

**Part A: Review Pod Overview**
1. Login as Pod Lead
2. Navigate to **Pod Lead Dashboard** (https://console.serenitycarepartners.com/dashboard/pod-lead)
3. Verify dashboard shows:
   - Pod name and stats
   - Active caregivers count
   - Active clients count
   - Today's coverage status
   - Urgent alerts

**Part B: Manage Team**
1. Navigate to My Team tab in Pod Lead Dashboard (https://console.serenitycarepartners.com/dashboard/pod-lead)
2. Review each caregiver:
   - Current status
   - Credential expiration
   - Training compliance
   - SPI score
3. Send team announcement
4. View individual schedules

**Part C: Client Oversight**
1. Navigate to My Clients tab in Pod Lead Dashboard (https://console.serenitycarepartners.com/dashboard/pod-lead)
2. Review client list (only TEST-POD clients)
3. Check authorization status
4. View recent visit notes

**Part D: Today's Operations**
1. Navigate to Today's Ops tab in Pod Lead Dashboard (https://console.serenitycarepartners.com/dashboard/pod-lead)
2. Review scheduled visits
3. Check clock-in status
4. Handle any coverage gaps

**Part E: Approvals**
1. Navigate to Approvals tab in Pod Lead Dashboard (https://console.serenitycarepartners.com/dashboard/pod-lead)
2. Review pending:
   - Expense reports
   - Time-off requests
   - Shift swaps
3. Approve or deny with reason

#### Expected Results
- [ ] Pod Lead sees only their pod data
- [ ] Team management functions work
- [ ] Client visibility is limited to pod
- [ ] Approval workflow works

#### Dashboards Impacted
- Pod Lead Dashboard (all tabs)
- Caregiver Portal (when viewing team members)

---

### Test 4.2: Coverage Gap & Dispatch
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Coverage gap detection
- Dispatch alert system
- Caregiver availability matching

#### Why This Test Matters
- Ensures patients receive care
- Minimizes missed visits
- Optimizes scheduling

#### Steps

**Part A: Create Coverage Gap**
1. Navigate to Scheduling Calendar (https://console.serenitycarepartners.com/dashboard/scheduling-calendar)
2. For a test shift, mark caregiver as "called out sick"
3. Verify gap appears in Coverage Dispatch

**Part B: Find Replacement**
1. Navigate to **Dispatch** (https://console.serenitycarepartners.com/dashboard/dispatch)
2. View coverage gap
3. Click "Find Available Caregivers"
4. System should show:
   - Available caregivers
   - Distance from patient
   - Qualification match
   - OT impact

**Part C: Send Dispatch Alert**
1. Select top candidates
2. Send dispatch alert (SMS/Email)
3. Wait for response
4. Assign to responder

#### Expected Results
- [ ] Gaps are detected automatically
- [ ] Available caregivers are ranked
- [ ] Alerts are sent successfully
- [ ] Assignment updates schedule

#### Dashboards Impacted
- Coverage Dispatch
- Operations Command Center
- Scheduling Calendar
- Pod Lead Dashboard

---

## PHASE 5: COMPLIANCE & HIPAA TESTS

### Test 5.1: HIPAA Access Controls
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Minimum necessary access
- PHI (Protected Health Information) protection
- Access logging

#### Why This Test Matters
- HIPAA compliance
- Patient privacy
- Audit readiness

#### Steps

**Part A: Verify Role-Based PHI Access**
1. Login as Biller
2. Verify can see patient name and insurance
3. Verify CANNOT see detailed clinical notes
4. Verify CANNOT see full assessment

5. Login as Caregiver
6. Verify can see assigned patients only
7. Verify can see care plan for assigned patients
8. Verify CANNOT see unassigned patients

**Part B: Verify Audit Logging**
1. Login as CEO
2. Access patient record
3. Check Audit Log
4. Verify access is logged:
   - Who accessed
   - What was accessed
   - When
   - From what IP

**Part C: Test Break-the-Glass**
1. As Caregiver, try to access unassigned patient
2. Should require justification
3. Should be logged with flag

#### Expected Results
- [ ] PHI access is limited by role
- [ ] All access is logged
- [ ] Break-the-glass requires justification
- [ ] Audit trail is complete

#### Dashboards Impacted
- Audit Logs
- Compliance Command Center
- All patient-related screens

---

### Test 5.2: BAA (Business Associate Agreement) Management
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 15 minutes

#### What is Being Tested
- BAA tracking
- Vendor compliance
- Expiration alerts

#### Why This Test Matters
- HIPAA requires BAAs with all vendors
- Expired BAAs create compliance risk

#### Steps

1. Navigate to **Compliance Command Center** (https://console.serenitycarepartners.com/dashboard/compliance)
2. Go to BAAs tab
3. Review existing BAAs:
   - Sandata
   - Clearinghouse
   - Payroll provider
4. Add test BAA:
   - Vendor name
   - Effective date
   - Expiration date
   - Upload document
5. Set one to expire in 30 days
6. Verify alert appears

#### Expected Results
- [ ] BAAs can be tracked
- [ ] Expiration alerts work
- [ ] Documents are stored securely

#### Dashboards Impacted
- Compliance Command Center (BAA tab)
- Notification bell

---

### Test 5.3: Emergency Preparedness
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 15 minutes

#### What is Being Tested
- Emergency contact system
- Patient priority lists
- Communication blast

#### Why This Test Matters
- Regulatory requirement
- Patient safety during emergencies

#### Steps

1. Navigate to Compliance Command Center → Emergency tab (https://console.serenitycarepartners.com/dashboard/compliance)
2. Review emergency contacts for patients
3. Generate high-priority patient list
4. Test communication blast (to test accounts only):
   - Send to all caregivers
   - Verify delivery

#### Expected Results
- [ ] Emergency contacts are accessible
- [ ] Priority list generates correctly
- [ ] Mass communication works

---

## PHASE 6: FINANCIAL & REPORTING TESTS

### Test 6.1: Payroll Processing
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Hours calculation from EVV
- Pay rate application
- Overtime calculation
- Bonus inclusion

#### Why This Test Matters
- Accurate pay is legally required
- Caregiver satisfaction
- Labor cost management

#### Steps

**Part A: Review Payroll**
1. Navigate to **Payroll Dashboard** (https://console.serenitycarepartners.com/dashboard/payroll-v2)
2. Select test pay period
3. Review hours for each test caregiver:
   - Regular hours
   - Overtime hours
   - PTO used
4. Verify calculations match EVV records

**Part B: Apply Differentials**
1. Check shift differential application:
   - Weekend rates
   - Holiday rates (if applicable)
   - Night differential
2. Verify correct rates applied

**Part C: Process Payroll**
1. Review payroll summary
2. Approve payroll
3. Export to payroll system (Gusto/ADP)
4. Verify export file accuracy

#### Expected Results
- [ ] Hours match EVV records
- [ ] Pay rates are correct
- [ ] Overtime calculates at 1.5x
- [ ] Differentials apply correctly
- [ ] Export is accurate

#### Dashboards Impacted
- Payroll Dashboard
- Executive Dashboard (labor costs)
- Caregiver Portal (My Pay)

---

### Test 6.2: Executive Dashboard & KPIs
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- KPI accuracy
- Real-time data updates
- Drill-down functionality

#### Why This Test Matters
- Executive decision making
- Business health monitoring
- Trend identification

#### Steps

1. Navigate to **Executive Dashboard** (https://console.serenitycarepartners.com/dashboard/executive)
2. Verify all KPIs display:
   - Revenue metrics
   - Census metrics
   - Compliance metrics
   - HR metrics
3. Click on each KPI tile
4. Verify drill-down works and shows detail
5. Check trend charts
6. Export executive report

#### Expected Results
- [ ] All KPIs display correctly
- [ ] Data is current
- [ ] Drill-downs navigate correctly
- [ ] Trends are accurate

#### Dashboards Impacted
- Executive Dashboard
- All Command Centers

---

### Test 6.3: Report Generation
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- Report generation
- Export functionality
- Report scheduling

#### Why This Test Matters
- Regulatory reporting
- Board reporting
- Operational analysis

#### Steps

1. Navigate to **Financial Reports** (https://console.serenitycarepartners.com/dashboard/finance/reports)
2. Generate reports:
   - Revenue report by payer
   - Utilization report
   - Staff productivity report
   - Compliance summary
3. Export to PDF and Excel
4. Verify data accuracy

#### Expected Results
- [ ] Reports generate correctly
- [ ] Exports are formatted properly
- [ ] Data matches dashboards

#### Dashboards Impacted
- Financial Reports
- Business Intelligence Dashboard

---

## PHASE 7: ERROR HANDLING & EDGE CASES

### Test 7.1: System Error Handling
**Tested By**: COO
**Duration**: 20 minutes

#### What is Being Tested
- Error messages are user-friendly
- System recovers gracefully
- No data loss on errors

#### Steps

1. **Test Network Error**:
   - Disconnect internet
   - Try to save data
   - Verify error message displays
   - Reconnect and verify retry works

2. **Test Validation Errors**:
   - Submit forms with missing required fields
   - Enter invalid email formats
   - Enter dates out of range
   - Verify specific error messages appear

3. **Test Concurrent Edit**:
   - Open same record in two browsers
   - Edit in both
   - Save both
   - Verify conflict is handled

#### Expected Results
- [ ] Error messages are clear
- [ ] System doesn't crash
- [ ] Data is preserved
- [ ] User can recover

---

### Test 7.2: Browser Compatibility
**Tested By**: COO
**Duration**: 30 minutes

#### What is Being Tested
- Chrome compatibility
- Firefox compatibility
- Safari compatibility
- Mobile responsiveness

#### Steps

Test key workflows in each browser:
1. Login/Logout
2. Navigate dashboards
3. Submit forms
4. EVV Clock
5. View reports

Test mobile:
1. Caregiver Portal on phone
2. EVV Clock on phone
3. Pod Lead Dashboard on tablet

#### Expected Results
- [ ] All browsers work
- [ ] Mobile is usable
- [ ] No layout breaks

---

## PHASE 8: SANDATA EVV INTEGRATION TESTS

### Test 8.1: Sandata EVV - Basic Visit Submission
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 45 minutes

#### What is Being Tested
- EVV data capture meets Sandata requirements
- Visit submission to Sandata
- 21st Century Cures Act compliance
- Real-time submission vs. batch

#### Why This Test Matters
- Medicaid requires EVV compliance
- Ohio uses Sandata as aggregator
- Non-compliant visits = no payment
- Federal mandate compliance

#### Steps

**Part A: Verify EVV Data Capture Requirements**
1. Login as Caregiver (caregiver1.test)
2. Navigate to EVV Clock (https://console.serenitycarepartners.com/evv/clock)
3. Start a new visit for Test Patient 1
4. Verify the following data is captured at Clock-IN:
   - [ ] Caregiver ID (NPI or state ID)
   - [ ] Patient ID (Medicaid ID)
   - [ ] Service Code
   - [ ] Date of Service
   - [ ] Time IN (HH:MM)
   - [ ] Location (GPS coordinates)
   - [ ] Method of verification (GPS/Telephony/Manual)
5. At Clock-OUT, verify:
   - [ ] Time OUT (HH:MM)
   - [ ] Location (GPS coordinates)
   - [ ] Tasks performed (ADL codes)
   - [ ] Caregiver signature
   - [ ] Patient/responsible party signature

**Part B: Submit Visit to Sandata**
1. Login as COO
2. Navigate to Operations Command Center (https://console.serenitycarepartners.com/dashboard/operations)
3. Find completed visit from Part A
4. Verify visit status shows "Ready for Submission"
5. Click "Submit to Sandata" or verify auto-submission
6. Check Sandata submission log:
   - Submission timestamp
   - Confirmation number
   - Response status

**Part C: Verify Sandata Acknowledgment**
1. Navigate to Sandata EVV Dashboard (https://console.serenitycarepartners.com/dashboard/sandata-evv)
2. Check for acknowledgment (may take 15-60 minutes)
3. Verify acknowledgment shows:
   - Visit ID matched
   - Status: Accepted/Rejected/Pending
4. If rejected, note rejection reason code

#### Expected Results
- [ ] All required EVV fields are captured
- [ ] GPS coordinates are accurate (within geofence)
- [ ] Visit submits to Sandata successfully
- [ ] Acknowledgment is received and logged
- [ ] Acceptance rate should be >95%

#### Dashboards Impacted
- EVV Clock
- Operations Command Center (EVV Compliance)
- Sandata Integration Panel

#### Error Scenarios to Test
- [ ] Clock in outside geofence → Warning displayed, manual override available with reason
- [ ] Missing patient signature → Visit flagged, cannot submit until resolved
- [ ] Duplicate visit submission → System prevents duplicate
- [ ] Sandata API timeout → Queued for retry, user notified

---

### Test 8.2: Sandata EVV - Exception Handling
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Manual entry scenarios
- Exception documentation
- Correction workflow

#### Why This Test Matters
- Not all visits can use GPS (equipment issues, rural areas)
- Manual entries require documentation
- Corrections must be handled properly

#### Steps

**Part A: Manual Entry (No GPS)**
1. Login as Caregiver
2. Start visit with "Manual Entry" option
3. Enter reason for manual entry:
   - Phone malfunction
   - No cell service
   - Patient location issue
4. Complete visit with manual time entry
5. Verify supervisor approval is required

**Part B: Approve Manual Entry (as Pod Lead)**
1. Login as Pod Lead at https://console.serenitycarepartners.com
2. Navigate to Approvals tab in Pod Lead Dashboard (https://console.serenitycarepartners.com/dashboard/pod-lead)
3. Find manual entry for review
4. Review documentation/reason
5. Approve or deny with notes
6. Verify visit is released for Sandata submission

**Part C: Correction/Amendment**
1. Login as COO
2. Find a submitted visit that needs correction
3. Open visit for amendment:
   - Change time (if within allowed window)
   - Update service code
   - Add missing documentation
4. Document reason for amendment
5. Resubmit to Sandata
6. Verify Sandata receives amendment

#### Expected Results
- [ ] Manual entries are flagged for review
- [ ] Approvals work correctly
- [ ] Amendments submit with correction indicator
- [ ] Audit trail shows all changes

#### Dashboards Impacted
- EVV Clock
- Pod Lead Dashboard (Approvals)
- Operations Command Center

---

### Test 8.3: Sandata EVV - Compliance Monitoring
**Tested By**: CEO
**Login**: ceo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- EVV compliance rate tracking
- Exception reports
- Trend analysis

#### Why This Test Matters
- Ohio requires high EVV compliance rates
- Low compliance = audit risk
- Proactive monitoring prevents issues

#### Steps

**Part A: Review EVV Compliance Dashboard**
1. Navigate to Sandata EVV Dashboard (https://console.serenitycarepartners.com/dashboard/sandata-evv)
2. Review EVV Compliance widget:
   - Overall compliance rate (target: >95%)
   - Breakdown by caregiver
   - Breakdown by payer
3. Identify caregivers with low compliance

**Part B: Review Exceptions Report**
1. Filter for EVV exceptions
2. Review by exception type:
   - Geofence violations
   - Time discrepancies
   - Missing signatures
   - Late submissions
3. Identify patterns

**Part C: Take Corrective Action**
1. For caregivers with multiple exceptions:
   - Document coaching conversation
   - Assign retraining if needed
2. For system issues:
   - Document root cause
   - Escalate for fix

#### Expected Results
- [ ] Compliance rate is visible and accurate
- [ ] Exceptions are categorized
- [ ] Drill-down to individual visits works
- [ ] Trends are identifiable

#### Dashboards Impacted
- Operations Command Center
- Compliance Command Center
- Executive Dashboard

---

### Test 8.4: Sandata EVV - Payer-Specific Requirements
**Tested By**: COO
**Duration**: 30 minutes

#### What is Being Tested
- Different EVV requirements by payer
- Ohio Medicaid specific rules
- DODD specific requirements

#### Why This Test Matters
- Each payer has specific EVV rules
- DODD has additional documentation requirements
- Non-compliance varies by payer

#### Steps

**Part A: Ohio Medicaid Visit**
1. Complete test visit for Medicaid patient
2. Verify EVV captures:
   - Patient Medicaid ID
   - Provider NPI
   - Service code (from approved list)
   - All 6 Cures Act data points
3. Submit and verify acceptance

**Part B: DODD HPC Visit**
1. Complete test visit for DODD patient (Test Patient 3)
2. Verify additional DODD requirements:
   - Individual Service Plan (ISP) documentation
   - Task completion checklist
   - Incident/behavior notes if applicable
3. Submit and verify DODD portal shows visit

**Part C: Medicare Visit (Non-EVV)**
1. Complete test visit for Medicare patient
2. Verify Medicare visits are tracked but:
   - NOT submitted to Sandata (not required)
   - Internal EVV still captured for operations
3. Confirm billing proceeds without Sandata

#### Expected Results
- [ ] Medicaid visits comply with Sandata requirements
- [ ] DODD visits include additional documentation
- [ ] Medicare visits are handled correctly
- [ ] Payer-specific rules are enforced

#### Dashboards Impacted
- Operations Command Center
- DODD HPC Dashboard
- Billing Dashboard

---

### Test 8.5: Sandata EVV - Batch Processing & Reconciliation
**Tested By**: COO
**Duration**: 20 minutes

#### What is Being Tested
- Daily batch submission
- Reconciliation with Sandata
- Unsubmitted visit tracking

#### Why This Test Matters
- Timely submission is required
- Missed visits = missed revenue
- Reconciliation ensures nothing is lost

#### Steps

**Part A: Review Daily Batch**
1. Navigate to Sandata EVV Dashboard (https://console.serenitycarepartners.com/dashboard/sandata-evv)
2. Review batch submission status:
   - Total visits for day
   - Submitted count
   - Pending count
   - Failed count
3. Identify any unsubmitted visits

**Part B: Reconciliation**
1. Run reconciliation report:
   - Visits in Serenity vs. Sandata
   - Identify discrepancies
2. For each discrepancy:
   - Determine cause
   - Resubmit if needed
   - Document resolution

**Part C: Handle Failures**
1. Filter for failed submissions
2. Review failure reasons:
   - Invalid Medicaid ID
   - Service code mismatch
   - Date/time issues
3. Correct and resubmit

#### Expected Results
- [ ] Daily batch shows clear status
- [ ] Reconciliation identifies gaps
- [ ] Failures can be corrected and resubmitted
- [ ] All visits eventually submit successfully

#### Dashboards Impacted
- Operations Command Center
- Sandata Integration Panel
- Billing Dashboard (claims depend on EVV)

---

### Test 8.6: Sandata EVV - Telephony Backup
**Tested By**: Caregiver
**Login**: caregiver@test.serenitycare.com
**Duration**: 15 minutes

#### What is Being Tested
- Telephony-based EVV as backup
- IVR (Interactive Voice Response) system
- Manual call documentation

#### Why This Test Matters
- Backup needed when app/GPS fails
- Rural areas may need telephony option
- Sandata accepts telephony verification

#### Steps

**Part A: Simulate Telephony Clock-In**
1. Instead of app, call EVV phone number
2. Enter caregiver ID
3. Enter patient ID
4. Confirm service type
5. System records:
   - Caller ID (ANI)
   - Patient phone (DNIS)
   - Timestamp

**Part B: Clock-Out via Telephony**
1. Call EVV phone number
2. Enter caregiver ID
3. Enter patient ID
4. Confirm tasks completed
5. End call

**Part C: Verify Integration**
1. Login as COO at https://console.serenitycarepartners.com
2. Navigate to Sandata EVV Dashboard (https://console.serenitycarepartners.com/dashboard/sandata-evv)
3. Find telephony visit in system
4. Verify data is captured:
   - Times from IVR
   - Location from patient phone
   - Method marked as "Telephony"
4. Verify submits to Sandata correctly

#### Expected Results
- [ ] Telephony clock-in/out works
- [ ] Visit appears in system with correct data
- [ ] Method is marked as Telephony
- [ ] Sandata accepts telephony visits

#### Dashboards Impacted
- EVV Clock (shows telephony visits)
- Operations Command Center

---

### Test 8.7: Sandata EVV - Real-Time Alerts
**Tested By**: COO & Pod Lead
**Duration**: 15 minutes

#### What is Being Tested
- No-show alerts
- Late clock-in alerts
- Geofence violation alerts

#### Why This Test Matters
- Real-time intervention prevents compliance issues
- Proactive management reduces denials
- Patient safety (no-shows)

#### Steps

**Part A: No-Show Alert**
1. Schedule test visit for specific time at https://console.serenitycarepartners.com/dashboard/scheduling-calendar
2. Do NOT clock in
3. 15 minutes past scheduled time:
   - Verify alert appears in Operations Dashboard (https://console.serenitycarepartners.com/dashboard/operations)
   - Verify Pod Lead receives notification
4. Document alert response

**Part B: Late Clock-In Alert**
1. Schedule test visit for specific time at https://console.serenitycarepartners.com/dashboard/scheduling-calendar
2. Clock in 10+ minutes late via EVV Clock (https://console.serenitycarepartners.com/evv/clock)
3. Verify late alert is generated
4. Document exception reason in system

**Part C: Geofence Violation**
1. Clock in from location outside patient geofence via EVV Clock (https://console.serenitycarepartners.com/evv/clock)
2. Verify warning appears immediately
3. Enter override reason
4. Verify visit is flagged in Sandata EVV Dashboard (https://console.serenitycarepartners.com/dashboard/sandata-evv)

#### Expected Results
- [ ] No-show alerts generate within 15 minutes
- [ ] Late alerts generate in real-time
- [ ] Geofence violations are flagged
- [ ] All alerts appear in notification bell

#### Dashboards Impacted
- Operations Command Center
- Pod Lead Dashboard
- Coverage Dispatch
- Notification Bell

---

### Test 8.8: Sandata EVV - Billing Integration
**Tested By**: COO (Biller role)
**Login**: billing.manager@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- EVV acceptance enables billing
- Rejected EVV blocks claims
- Matching EVV to claims

#### Why This Test Matters
- No EVV = No Medicaid payment
- Claims must match EVV data
- Billing depends on EVV acceptance

#### Steps

**Part A: Verify EVV-Claim Link**
1. Navigate to Claims Workflow (https://console.serenitycarepartners.com/dashboard/claims-workflow)
2. Generate claims for test visits
3. Verify each claim shows:
   - Linked EVV visit ID
   - Sandata confirmation number
   - EVV status (Accepted)

**Part B: Test Blocked Claim**
1. Find a visit with rejected/pending EVV
2. Try to generate claim
3. System should:
   - Block claim generation
   - Show reason: "EVV not accepted"
   - Provide link to fix EVV issue

**Part C: Resolve and Generate**
1. Fix the EVV issue (resubmit, correct, etc.)
2. Wait for Sandata acceptance
3. Return to Claims Workflow
4. Generate claim successfully

#### Expected Results
- [ ] Claims are linked to EVV records
- [ ] Rejected EVV blocks billing
- [ ] Clear messaging on blocking reason
- [ ] Resolution enables billing

#### Dashboards Impacted
- Claims Workflow
- Billing Dashboard
- Operations Command Center (EVV status)

---

## PHASE 9: CLEARINGHOUSE & OTHER INTEGRATIONS

### Test 9.1: Clearinghouse Integration (837/835)
**Tested By**: COO (Biller)
**Login**: billing.manager@test.serenitycare.com
**Duration**: 30 minutes

#### What is Being Tested
- Electronic claim submission (837P)
- Remittance advice processing (835)
- ERA auto-posting
- Rejection handling

#### Why This Test Matters
- Electronic billing is industry standard
- Faster payment than paper
- Reduces manual errors
- Required by most payers

#### Steps

**Part A: Submit Claims (837P)**
1. Navigate to Claims Workflow (https://console.serenitycarepartners.com/dashboard/claims-workflow)
2. Select test claims ready for submission
3. Generate 837P batch file
4. Submit to clearinghouse
5. Verify:
   - Batch accepted
   - Confirmation number received
   - Status updates to "Submitted"

**Part B: Receive Acknowledgments**
1. Wait for clearinghouse acknowledgment (277CA)
2. Verify acknowledgment shows:
   - Each claim status
   - Any immediate rejections
3. Handle rejections immediately

**Part C: Process Remittance (835)**
1. Download 835 file from clearinghouse/payer
2. Import into Serenity
3. Review auto-posted payments
4. Handle adjustments:
   - Contractual adjustments
   - Patient responsibility
   - Denials
5. Verify account balances update

#### Expected Results
- [ ] 837P submits successfully
- [ ] Acknowledgments are processed
- [ ] 835 imports and posts payments
- [ ] Account balances are accurate

#### Dashboards Impacted
- Claims Workflow
- Billing Dashboard
- AR Aging Dashboard

---

### Test 9.2: Payroll Integration (Gusto/ADP)
**Tested By**: COO
**Login**: coo@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- Hours export to payroll system
- Pay rate accuracy
- Deduction handling

#### Steps

1. Navigate to Payroll Dashboard (https://console.serenitycarepartners.com/dashboard/payroll-v2)
2. Review pay period hours
3. Export to Gusto/ADP format
4. Verify export file includes:
   - All caregivers
   - Correct hours
   - Proper pay rates
   - Shift differentials
5. Import into payroll system (if applicable)
6. Run payroll and verify

#### Expected Results
- [ ] Hours export correctly
- [ ] Pay rates match
- [ ] Differentials calculate
- [ ] Payroll runs successfully

---

### Test 9.3: Background Check Integration
**Tested By**: HR
**Login**: hr.manager@test.serenitycare.com
**Duration**: 20 minutes

#### What is Being Tested
- BCI/FBI check initiation
- Status tracking
- Result handling

#### Steps

1. For new hire, initiate background check
2. Verify:
   - Request sent to provider
   - Status shows "Pending"
   - Candidate is notified
3. When results return:
   - Review results
   - Make hiring decision
   - Document in employee record

#### Expected Results
- [ ] Checks initiate correctly
- [ ] Status updates automatically
- [ ] Results are accessible
- [ ] Hiring workflow integrates

---

## TEST COMPLETION CHECKLIST

### Summary Metrics to Record

After completing all tests, record:

| Metric | Target | Actual |
|--------|--------|--------|
| Tests Passed | 100% | ___% |
| Critical Bugs Found | 0 | ___ |
| High Bugs Found | <3 | ___ |
| Medium Bugs Found | <10 | ___ |
| Low Bugs Found | <20 | ___ |

### Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CEO (Clinical) | | | |
| COO (Operations) | | | |
| CFO (Financial) | | | |

### Go/No-Go Decision

- [ ] **GO** - System is production-ready
- [ ] **CONDITIONAL GO** - Minor issues to address post-launch
- [ ] **NO-GO** - Critical issues must be resolved

---

## APPENDIX A: BUG REPORT TEMPLATE

When finding issues, document:

```
BUG ID: BUG-XXX
Test Case: (e.g., Test 2.3)
Severity: Critical/High/Medium/Low
Summary:
Steps to Reproduce:
1.
2.
3.
Expected Result:
Actual Result:
Screenshots:
Browser/Device:
Reported By:
Date:
```

---

## APPENDIX B: TEST DATA CLEANUP

After testing, clean up test data:

1. Do NOT delete test accounts (keep for future testing)
2. Mark test patients as "TEST - DO NOT BILL"
3. Archive test claims
4. Document any permanent test data

---

## APPENDIX C: PRODUCTION CHECKLIST

Before go-live:

- [ ] All test accounts have production passwords (not test passwords)
- [ ] Test data is flagged or archived
- [ ] Production credentials are configured
- [ ] Backup systems are verified
- [ ] Support contacts are published
- [ ] Training documentation is complete
- [ ] User acceptance sign-off received

---

**Document Version**: 1.0
**Last Updated**: January 2026
**Next Review**: Before each major release
