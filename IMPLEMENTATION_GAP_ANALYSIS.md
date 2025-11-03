# Serenity Care Partners - Implementation Gap Analysis & Updated Roadmap

**Date:** 2025-11-03
**Version:** 1.0
**Status:** Based on Manifesto v2.3 and Current Codebase Assessment

---

## Executive Summary

**Overall Completion: ~60%**

### What's Working Well
- ✅ **Database Foundation (90%)** - 20 migrations, comprehensive schemas, RLS policies
- ✅ **Sandata Integration Services (95%)** - Services complete, needs API wiring & mobile app
- ✅ **Authentication System (87%)** - JWT, sessions, RBAC/ABAC, audit logging
- ✅ **Feature Flags System (100%)** - 14 flags, 27 config parameters, all seeded
- ✅ **Audit Logging (85%)** - Hash chain, triggers, compliance tracking

### Critical Gaps (Blockers for Phase 1-3)
- 🔴 **Mobile EVV App** - No GPS capture, no clock-in/out UI (CRITICAL)
- 🔴 **Morning Check-In Dashboard** - Most-used daily feature, missing
- 🔴 **Public Website** - serenitycarepartners.com doesn't exist
- 🔴 **Claims Gate** - No EVV ACK validation before claim submission
- 🔴 **Sandata Live Testing** - Waiting on sandbox credentials from Bignon

### Medium Gaps (Needed for Revenue Operations)
- 🟡 **837/835 Claims Processing** - No EDI generation or remittance processing
- 🟡 **Shift Engine** - Matching algorithm incomplete
- 🟡 **HR Onboarding UI** - Schemas exist, no user interface
- 🟡 **Careers Portal** - API exists, no storage or UI
- 🟡 **Dashboard Wiring** - 9 dashboards designed, none connected to backend

---

## Gap Analysis by Manifesto Phase

### PHASE 0 - Foundation (Week 1-2)

**Manifesto Requirements:**
- Public site live (even if basic)
- Console authentication working (SSO/MFA)
- Database schemas deployed
- Pod-1 exists in system
- Admin UI accessible
- Register as Alt-EVV system with Ohio Sandata
- Mock data seed (10 caregivers, 3 pods, 30 patients, 2 weeks EVV history)

**Current Status:**

| Requirement | Status | Gap Analysis |
|-------------|--------|--------------|
| Public site live | 🔴 **MISSING** | No domain, no deployment, no content |
| Console authentication | ✅ **COMPLETE** | JWT, sessions, RBAC all working |
| Database schemas | ✅ **COMPLETE** | 20 migrations, 40+ tables deployed |
| Pod-1 exists | 🟡 **PARTIAL** | Schema exists, no UI to create/view |
| Admin UI | 🟡 **PARTIAL** | APIs exist, no frontend |
| Sandata registration | 🔴 **BLOCKED** | Waiting on Gloria/Bignon to register |
| Mock data seed | 🟡 **PARTIAL** | Feature flags seeded, no realistic caregivers/patients/EVV |

**Action Items for Phase 0 Completion:**

1. **Deploy Public Website (2-3 days)**
   - Use Next.js static site or simple React app
   - Pages needed: Home, About, Services, Contact
   - Host on Vercel/Netlify with custom domain
   - No PHI, separate domain from Console

2. **Create Mock Data Seeder (1 day)**
   - Script to generate 10 caregivers with realistic SPI scores
   - 3 pods (Pod-1, Pod-2, Pod-3)
   - 30 patients with Medicaid IDs
   - 2 weeks of EVV records with mix of perfect/good/problematic patterns
   - Include mock Sandata transactions (ACKs, errors, retries)

3. **Build Admin UI Shell (2 days)**
   - Connect SuperAdminConsole.tsx to backend APIs
   - Feature flag toggle UI
   - Sandata config UI
   - Organization management UI

4. **Register with Sandata (OWNER: BIGNON)**
   - Complete registration as Alt-EVV system
   - Request sandbox credentials
   - Download v4.3 spec and Certification Test Plan

---

### PHASE 1 - Public Website + Careers + Alt-EVV Setup (Week 2-6)

**Manifesto Requirements:**
- Launch serenitycarepartners.com
- Careers page with job listings
- Application form with backend storage
- Consent and privacy notices
- Email confirmations
- Build Sandata Individuals & Employees feeds
- Field mapping document
- Test in Sandata sandbox

**Current Status:**

| Requirement | Status | Gap Analysis |
|-------------|--------|--------------|
| Public website | 🔴 **MISSING** | Need domain, hosting, content |
| Careers page | 🔴 **MISSING** | API scaffolded, no storage/UI |
| Application form | 🔴 **MISSING** | POST endpoint exists, doesn't save to DB |
| Consent/privacy | 🔴 **MISSING** | No legal copy drafted |
| Email confirmations | 🔴 **MISSING** | No email service integrated |
| Sandata Individuals feed | ✅ **COMPLETE** | Service + API endpoint working |
| Sandata Employees feed | ✅ **COMPLETE** | Service + API endpoint working |
| Field mapping doc | 🟡 **PARTIAL** | Code has mappings, no documentation |
| Sandbox testing | 🔴 **BLOCKED** | Need credentials |

**Action Items for Phase 1 Completion:**

1. **Complete Public Website (3-4 days)**
   - Design and build Home, About, Services, FAQs pages
   - SEO optimization (meta tags, sitemap, robots.txt)
   - Google Analytics integration
   - Contact form with email notification

2. **Build Careers Portal (2-3 days)**
   - Job listings page (pull from `job_requisitions` table)
   - Application form UI
   - Wire POST /api/public/careers/apply to save to `applicants` table
   - Generate application ID
   - Email confirmation to applicant
   - Email notification to HR

3. **Integrate Email Service (1 day)**
   - Set up SendGrid, AWS SES, or Resend
   - Email templates: application confirmation, password reset, interview invite
   - Store email credentials in Secrets Manager

4. **Create Field Mapping Workbook (1 day)**
   - Excel workbook with 3 tabs: Individuals, Employees, Visits
   - Map Serenity fields → Ohio v4.3 spec fields
   - Include validation rules (required, format, length)
   - Get RCM/Billing sign-off

5. **Sandata Sandbox Testing (2-3 days, AFTER credentials received)**
   - Test Individuals feed (create, update, invalid Medicaid ID)
   - Test Employees feed (create, update, inactive)
   - Verify idempotency (duplicate submissions)
   - Log all test results for certification packet

---

### PHASE 2 - HR Onboarding + Alt-EVV Data Sync (Month 1-2)

**Manifesto Requirements:**
- Applicant review workflow in Console
- Onboarding checklist (I-9, W-4, background, TB/CPR, policy e-sign)
- Credential tracker with expiration alerts
- Pod assignment UI
- SPI tracking begins
- Auto-post to Sandata on hire/patient intake
- Store Sandata transaction IDs

**Current Status:**

| Requirement | Status | Gap Analysis |
|-------------|--------|--------------|
| Applicant review workflow | 🔴 **MISSING** | Schema complete, no UI |
| Onboarding checklist | 🔴 **MISSING** | No checklist steps defined |
| Credential tracker | 🟡 **PARTIAL** | Schema exists, no alerts wired |
| Pod assignment | 🔴 **MISSING** | No UI to assign staff/patients to pods |
| SPI tracking | 🟡 **PARTIAL** | Schema exists, no calculation engine |
| Auto-post to Sandata | ✅ **COMPLETE** | Services ready, need trigger on hire/intake |
| Transaction ID storage | ✅ **COMPLETE** | `sandata_transactions` table working |

**Action Items for Phase 2 Completion:**

1. **Build HR Application Review UI (3-4 days)**
   - Connect WorkingHRApplications.tsx to backend
   - Applicant list with filtering (new, reviewed, hired, rejected)
   - Application detail view
   - Approve/Reject/Schedule Interview actions
   - Email notifications to applicants

2. **Create Onboarding Checklist System (2-3 days)**
   - Define checklist steps in config or database
   - Onboarding progress tracker UI
   - Document upload for I-9, W-4, certifications
   - Policy e-signature flow
   - Mark checklist items complete

3. **Build Credential Alert System (1-2 days)**
   - Cron job to check expiring credentials daily
   - Email/SMS alerts at 30, 15, 7 days before expiration
   - Dashboard flag for staff with expiring credentials
   - Block scheduling if credential expired

4. **Create Pod Management UI (2-3 days)**
   - Pod list view (active pods, patient count, caregiver count)
   - Pod detail view (roster, metrics, KPIs)
   - Assign patient to pod UI
   - Assign caregiver to pod UI
   - Pod Lead assignment

5. **Build SPI Calculation Engine (3-4 days)**
   - Implement weighted scoring algorithm
   - Attendance score calculation (EVV on-time %, no-shows)
   - Documentation score (note completeness, Sandata acceptance rate)
   - Quality score (family surveys, supervisor observations)
   - Collaboration score (peer feedback)
   - Learning score (training completion)
   - Monthly batch calculation job
   - SPI history tracking

6. **Wire Auto-Sync to Sandata (1 day)**
   - Trigger on `INSERT` to `caregivers` table → call Employees feed
   - Trigger on `INSERT` to `clients` table (if Medicaid ID present) → call Individuals feed
   - Handle errors gracefully (log, retry queue)

---

### PHASE 3 - Scheduling, EVV, Alt-EVV Certification (Month 2-4)

**Manifesto Requirements:**
- Shift engine live (Pod Lead assigns shifts)
- **Morning Check-In dashboard** (CRITICAL)
- EVV capture (mobile app: clock-in/out, GPS, 6 elements)
- EVV validation (real-time checks)
- Coverage Gap alerts
- Build Sandata Visits feed
- Execute Sandata Certification Test Plan
- Receive production credentials
- 7 consecutive days of 100% acceptance
- On-Call Pool setup
- One-click dispatch (SMS/push)

**Current Status:**

| Requirement | Status | Gap Analysis |
|-------------|--------|--------------|
| Shift engine | 🟡 **PARTIAL** | Service exists, matching logic incomplete |
| **Morning Check-In** | 🔴 **MISSING** | **CRITICAL BLOCKER - Most used feature** |
| EVV capture (mobile) | 🔴 **MISSING** | **No mobile app at all** |
| EVV validation | ✅ **COMPLETE** | SandataValidatorService has all 6 elements |
| Coverage Gap alerts | 🔴 **MISSING** | No detection or notification |
| Sandata Visits feed | ✅ **COMPLETE** | Service ready, needs mobile app to submit |
| Certification Test Plan | 🔴 **NOT STARTED** | Waiting on sandbox credentials |
| Production credentials | 🔴 **BLOCKED** | Need certification first |
| 7-day acceptance | 🔴 **BLOCKED** | Need production first |
| On-Call Pool | 🟡 **PARTIAL** | Schema exists, no UI or dispatch |
| One-click dispatch | 🔴 **MISSING** | No SMS/push integration |

**Action Items for Phase 3 Completion:**

1. **BUILD MORNING CHECK-IN DASHBOARD (4-5 days) - HIGHEST PRIORITY**
   - Daily shift list for today (expected vs. actual)
   - Caregiver check-in status (green = clocked in, yellow = late, red = no-show)
   - Sandata sync status indicators (✅ accepted, 🟡 pending, 🔴 rejected, ⚫ not submitted)
   - Coverage gap detection (no-shows flagged within 15 min of shift start)
   - One-click "Find Coverage" button (dispatches to on-call pool)
   - Drill-down to visit details
   - Real-time updates via WebSocket or polling

2. **BUILD MOBILE EVV APP (6-8 weeks) - CRITICAL**
   - **Platform:** React Native (iOS + Android) or Progressive Web App
   - **MVP Features:**
     - Login with JWT
     - Today's shift list for logged-in caregiver
     - Clock-in button (capture GPS, timestamp, device info)
     - Clock-out button (capture GPS, timestamp, tasks completed)
     - Photo proof (optional fallback if GPS weak)
     - Offline mode (cache visits, sync when online)
     - Show visit status (syncing, submitted, accepted by Sandata)
   - **Advanced Features:**
     - Push notifications for shift reminders
     - Navigation to patient address
     - Voice notes
     - Signature capture
   - **Security:**
     - Detect rooted/jailbroken devices
     - Detect mock locations (GPS spoofing)
     - Secure storage for credentials
     - 15-minute session timeout

3. **Complete Shift Engine (3-4 days)**
   - Implement caregiver-client matching algorithm
   - Skill matching (HHA/LPN/RN requirements)
   - Geographic optimization (minimize travel time)
   - Continuity scoring (prefer existing pairs)
   - Availability checking
   - OT eligibility validation
   - Shift assignment UI for Pod Leads

4. **Build Coverage Gap Detection (2-3 days)**
   - Real-time monitoring of expected vs. actual clock-ins
   - Flag no-shows within 15 min of shift start
   - Alert Pod Lead via email/SMS/push
   - Suggest on-call caregivers (by skills, location, availability)
   - Track gap resolution time

5. **Execute Sandata Certification (3-4 weeks, AFTER sandbox credentials)**
   - Follow Certification Test Plan from Sandata
   - Test all three feeds (Individuals, Employees, Visits)
   - Test negative cases (invalid data, duplicates, corrections)
   - Capture screenshots, JSON payloads, API responses
   - Create test evidence packet (see Appendix E in manifesto)
   - Submit to Sandata for review
   - Receive production credentials

6. **Build On-Call Dispatch System (2-3 days)**
   - On-call roster UI (who's on-call today, availability)
   - "Find Coverage" button on Morning Check-In
   - SMS dispatch ("Can you cover 123 Main St, 2-4pm? Reply YES/NO")
   - Push notification to mobile app
   - Track response time
   - Auto-escalate if no response in 15 min

7. **Integrate SMS Service (1 day)**
   - Set up Twilio or AWS SNS
   - SMS templates: shift reminder, coverage request, EVV error
   - Two-way SMS handling (YES/NO responses)

---

### PHASE 4 - Billing/RCM & Payroll (Month 3-6)

**Manifesto Requirements:**
- 837 claims generation
- **Claims pre-validation** (check Sandata ACK, block if missing)
- 835 remittance processing
- Denial workflow
- EVV mismatch tracking
- Payroll integration (ADP/Gusto)
- Annual bonus calculator

**Current Status:**

| Requirement | Status | Gap Analysis |
|-------------|--------|--------------|
| 837 generation | 🔴 **MISSING** | No X12 EDI library integrated |
| Claims pre-validation | 🔴 **MISSING** | No EVV ACK check before submission |
| 835 processing | 🔴 **MISSING** | No remittance parser |
| Denial workflow | 🔴 **MISSING** | No appeal generation |
| EVV mismatch tracking | 🟡 **PARTIAL** | Schema exists, no alerting |
| Payroll integration | 🔴 **MISSING** | No ADP/Gusto connector |
| Bonus calculator | 🟡 **PARTIAL** | Formula exists, no UI |

**Action Items for Phase 4 Completion:**

1. **Integrate X12 EDI Library (2-3 days)**
   - Use library: `node-x12` or `edifact`
   - Generate 837P (professional) or 837I (institutional) format
   - Include patient demographics, service codes, units, modifiers
   - Include EVV reference (link to Sandata transaction)

2. **Build Claims Gate Enforcement (2-3 days)**
   - Pre-validation check before 837 generation
   - Query `evv_records` and `sandata_transactions` tables
   - Block claim if `sandata_status != 'accepted'`
   - Show "Claims Readiness Report" (billable visits with ACK vs. total)
   - Configurable mode: block (strict) or warn (lenient)

3. **Integrate Clearinghouse (3-4 days)**
   - Choose clearinghouse: Change Healthcare, Availity, Office Ally
   - Set up SFTP or API connection
   - Upload 837 files
   - Download 835 remittance files
   - Store clearinghouse credentials in Secrets Manager

4. **Build 835 Remittance Processor (3-4 days)**
   - Parse 835 X12 format
   - Auto-post payments to claims
   - Extract denial codes and reasons
   - Update claim status (paid, denied, partially paid)
   - Generate denial report

5. **Create Denial Management Workflow (2-3 days)**
   - Denial dashboard (top denial reasons, count, trend)
   - Denial detail view
   - "Fix & Resubmit" button
   - Appeal letter generation (use AI agent)
   - Track appeal status

6. **Integrate Payroll System (3-5 days)**
   - Choose: ADP, Gusto, or QuickBooks Payroll
   - API integration to sync hours from EVV
   - Sync bonuses, deductions
   - Generate payroll report
   - Handle errors (mismatch between EVV hours and payroll)

7. **Build Bonus Calculator UI (2 days)**
   - Staff-facing: "Enter your hours and see projected bonus"
   - Admin-facing: "Generate bonus report for all staff"
   - Export to CSV for payroll integration

---

### PHASE 5 - Analytics & AI Optimization (Month 6+)

**Manifesto Requirements:**
- Executive dashboards (real-time KPIs)
- Pod scorecards (Tier 2-3 KPIs)
- OT insights (cost vs. new hire analysis)
- Predictive alerts (turnover risk, credential lapses, EVV trends)
- Quarterly access reviews (automated)
- Weekly EVV Health Report

**Current Status:**

| Requirement | Status | Gap Analysis |
|-------------|--------|--------------|
| Executive dashboards | 🟡 **PARTIAL** | UI exists, no data wiring |
| Pod scorecards | 🟡 **PARTIAL** | UI exists, no data wiring |
| OT insights | 🔴 **MISSING** | No cost analysis |
| Predictive alerts | 🔴 **MISSING** | AI agents defined, not wired |
| Quarterly access reviews | 🟡 **PARTIAL** | Query exists, no automation |
| EVV Health Report | 🔴 **MISSING** | No report generation |

**Action Items for Phase 5 Completion:**

1. **Wire Dashboard Data (4-5 days)**
   - Connect 9 dashboard components to backend APIs
   - Real-time metrics calculation
   - Chart libraries (Recharts, Chart.js, or D3)
   - Drill-down views
   - Export to PDF/Excel

2. **Build Pod Scorecard (2-3 days)**
   - Calculate Tier 1-3 KPIs per pod
   - EVV compliance %, Sandata acceptance %, continuity %, coverage %
   - Credential freshness %, retention rate, claims readiness %
   - Rank pods (leaderboard)
   - Pod Lead dashboard (own pod's scorecard)

3. **Create OT Analysis Tool (2 days)**
   - Calculate total OT cost per caregiver
   - Compare to cost of hiring new caregiver
   - Break-even analysis
   - Sustainability check (flag if >60 hrs/week)

4. **Implement Predictive Alerts (3-4 weeks)**
   - Wire AI agents to LLM (Claude or OpenAI)
   - Turnover risk model (identify at-risk caregivers)
   - Credential lapse predictor (flag expiring credentials)
   - EVV compliance trend analysis
   - No-show predictor (24-48 hour forecast)

5. **Automate Access Reviews (2-3 days)**
   - Quarterly job to generate access review report
   - List all users, roles, permissions
   - Flag dormant accounts (no login in 90 days)
   - Flag break-glass usage (compliance review)
   - Email to Compliance team

6. **Build EVV Health Report (2-3 days)**
   - Weekly report: EVV success %, mean time to fix, top error codes
   - Sandata acceptance rate trend
   - Rejection code breakdown
   - Caregiver outliers (low acceptance rate)
   - Email to Operations + Compliance

---

## Priority Matrix

### P0 - CRITICAL BLOCKERS (Must complete before revenue operations)

1. **Mobile EVV App** (6-8 weeks)
   - No EVV capture = no billable visits = no revenue
   - Needed for Sandata Visits feed
   - Needed for "No EVV → No Pay" enforcement

2. **Morning Check-In Dashboard** (4-5 days)
   - Most-used daily feature by Pod Leads
   - Critical for operations visibility
   - Needed for coverage gap management

3. **Public Website + Careers** (5-6 days)
   - Needed for recruiting pipeline
   - Professional appearance for clients/partners

4. **Sandata Certification** (3-4 weeks, AFTER credentials)
   - Revenue-critical: no certification = claims denied
   - Must complete before first Medicaid claim

5. **Claims Gate** (2-3 days)
   - Prevents claim denials before submission
   - Revenue protection

### P1 - HIGH PRIORITY (Needed for Phase 2-3)

6. **HR Onboarding UI** (3-4 days)
7. **Pod Management UI** (2-3 days)
8. **SPI Calculation Engine** (3-4 days)
9. **Shift Engine** (3-4 days)
10. **Coverage Gap Detection** (2-3 days)
11. **On-Call Dispatch** (2-3 days)

### P2 - MEDIUM PRIORITY (Needed for Phase 4-5)

12. **837/835 Claims Processing** (6-8 days)
13. **Clearinghouse Integration** (3-4 days)
14. **Payroll Integration** (3-5 days)
15. **Dashboard Data Wiring** (4-5 days)
16. **Pod Scorecard** (2-3 days)

### P3 - LOW PRIORITY (Nice to have, not blocking)

17. **Tax Form E-Filing** (5-7 days)
18. **Predictive AI Agents** (3-4 weeks)
19. **Advanced Analytics** (2-3 weeks)
20. **Family Portal** (3-4 weeks)

---

## Updated Timeline (Realistic Estimates)

### Sprint 1-2 (Weeks 1-2) - Foundation + Public Site
- Deploy public website with careers portal
- Create mock data seeder
- Build Admin UI shell
- Register with Sandata (OWNER: Bignon)
- **DELIVERABLE:** Public site live, mock data loaded, Sandata registration complete

### Sprint 3-4 (Weeks 3-4) - Critical UI + HR
- Build Morning Check-In dashboard (P0)
- Build HR onboarding UI
- Create Pod Management UI
- Wire applicant review workflow
- **DELIVERABLE:** Morning Check-In operational, HR can review applicants

### Sprint 5-8 (Weeks 5-8) - Mobile EVV App (P0)
- Design mobile app (React Native or PWA)
- Build clock-in/out UI
- Implement GPS capture
- Build offline sync
- Implement security (spoofing detection, device security)
- Test end-to-end: mobile → Console → Sandata sandbox
- **DELIVERABLE:** Mobile EVV app in beta, ready for caregiver testing

### Sprint 9-10 (Weeks 9-10) - Scheduling + Coverage
- Complete shift engine matching algorithm
- Build coverage gap detection
- Build on-call dispatch system
- Integrate SMS service (Twilio)
- **DELIVERABLE:** Shift assignments automated, coverage gaps detected/dispatched

### Sprint 11-12 (Weeks 11-12) - Sandata Certification (CRITICAL)
- Execute Certification Test Plan (all 3 feeds)
- Create test evidence packet
- Submit to Sandata for review
- Receive production credentials
- Cut over to production endpoints
- Monitor 7 consecutive days of 100% acceptance
- **DELIVERABLE:** Sandata certified, production live, claims-ready

### Sprint 13-16 (Weeks 13-16) - Billing/Claims + Payroll
- Integrate X12 EDI library (837/835)
- Build claims gate enforcement
- Integrate clearinghouse
- Build 835 remittance processor
- Create denial management workflow
- Integrate payroll system (ADP/Gusto)
- **DELIVERABLE:** First clean claim cycle, payroll automated

### Sprint 17-20 (Weeks 17-20) - Analytics + AI
- Wire dashboard data to all 9 dashboards
- Build pod scorecard
- Create OT analysis tool
- Wire AI agents to LLM
- Automate access reviews
- Build EVV Health Report
- **DELIVERABLE:** Full visibility, predictive alerts operational

---

## Resource Estimates

### Engineering Effort (Full-Time Equivalent)

| Sprint | Weeks | FTE | Focus |
|--------|-------|-----|-------|
| 1-2 | 2 | 1 FTE | Public site, mock data, Admin UI |
| 3-4 | 2 | 1.5 FTE | Morning Check-In (P0), HR UI, Pod UI |
| 5-8 | 4 | 2 FTE | Mobile EVV app (P0) - most complex |
| 9-10 | 2 | 1.5 FTE | Scheduling, coverage, on-call |
| 11-12 | 2 | 1 FTE | Sandata certification (testing focused) |
| 13-16 | 4 | 1.5 FTE | Billing/claims, payroll integration |
| 17-20 | 4 | 1 FTE | Analytics, dashboards, AI agents |
| **TOTAL** | **20 weeks** | **~1.5 FTE avg** | **~30 FTE-weeks** |

### Non-Engineering Dependencies

| Task | Owner | Timeline | Blocker |
|------|-------|----------|---------|
| Register as Alt-EVV system | Bignon | Week 1 | Blocking Sandata sandbox access |
| Execute Sandata BAA | Bignon + Compliance | Week 1-2 | Legal requirement |
| Draft patient consent forms | HR + Legal | Week 3-4 | Needed before EVV capture |
| Create field mapping workbook | RCM/Billing + Engineering | Week 5-6 | Needed for certification |
| Choose clearinghouse | Bignon + Finance | Week 10-12 | Needed for claims |
| Choose payroll provider | Bignon + Finance | Week 10-12 | Needed for payroll integration |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sandata registration delayed | MEDIUM | HIGH | Start early (Week 1), escalate if blocked >1 week |
| Mobile app takes longer than 8 weeks | HIGH | CRITICAL | Start with PWA (faster) instead of React Native |
| Sandata certification fails | LOW | CRITICAL | Thorough testing in sandbox, fix errors before submission |
| Clearinghouse integration complex | MEDIUM | MEDIUM | Choose well-documented API (Change Healthcare, Availity) |
| AI agent costs exceed budget | MEDIUM | LOW | Use cheaper models (GPT-4o-mini), cache responses, monitor spend |
| Staff resist mobile app | LOW | MEDIUM | User testing, feedback loops, training sessions |
| GPS accuracy issues (apartments) | MEDIUM | MEDIUM | Photo proof fallback, admin override for known locations |
| Payroll integration breaks | LOW | HIGH | Thorough testing, manual fallback process documented |

---

## Acceptance Criteria by Phase

### Phase 0 (Weeks 1-2)
- [ ] Gloria can log into Console
- [ ] Mock data loaded (10 caregivers, 3 pods, 30 patients, 2 weeks EVV)
- [ ] Pod-1 visible in system with mock data
- [ ] Configuration UI lets you change SPI weights
- [ ] Mock KPIs display correctly
- [ ] Sandata sandbox credentials received
- [ ] Public website live at serenitycarepartners.com

### Phase 1 (Weeks 3-6)
- [ ] External users can view jobs and apply
- [ ] HR receives structured applications
- [ ] Email confirmations sent automatically
- [ ] Sandata Individuals feed posts successfully to sandbox
- [ ] Sandata Employees feed posts successfully to sandbox
- [ ] Field mapping workbook complete with RCM sign-off

### Phase 2 (Weeks 7-10)
- [ ] Hired staff assigned to pods
- [ ] Credentials tracked, expiration alerts working
- [ ] SPI score visible in Console
- [ ] Every new hire auto-syncs to Sandata (Employee feed ACK logged)
- [ ] Every Medicaid patient auto-syncs to Sandata (Individuals feed ACK logged)
- [ ] Error handling working (failed submissions retry)

### Phase 3 (Weeks 11-16)
- [ ] **Morning Check-In shows expected visits, check-in status, Sandata sync status**
- [ ] **Mobile app allows clock-in/out with GPS capture**
- [ ] EVV compliance ≥98% (after grace period)
- [ ] Gap fill rate ≥95% (no-shows covered within 2 hours)
- [ ] **Sandata certification approved (production credentials issued)**
- [ ] **100% of Medicaid visits accepted by Sandata for 7 consecutive days**
- [ ] Daily reconciliation green (Serenity count matches Sandata count)
- [ ] "No EVV → No Pay" enforcement active

### Phase 4 (Weeks 17-20)
- [ ] First clean claim cycle (claims submitted, paid, tracked)
- [ ] **Zero EVV-related claim denials**
- [ ] Denial rate baseline established, workflow functional
- [ ] Payroll synced (hours from EVV → payroll without manual entry)
- [ ] Claims readiness report working (billable visits with Sandata ACK)

### Phase 5 (Weeks 21+)
- [ ] Leadership can see real-time KPIs without asking for reports
- [ ] Pod Leads see their scorecard
- [ ] Compliance reviews completed on schedule
- [ ] EVV health dashboard live (drill into rejection codes)

---

## Next Steps (Immediate)

### This Week (Week 1)
1. **BIGNON:** Register as Alt-EVV system with Ohio Sandata
2. **ENGINEERING:** Deploy public website shell (Home, About, Services, Contact)
3. **ENGINEERING:** Create mock data seeder script
4. **ENGINEERING:** Build Admin UI shell (feature flags, Sandata config)

### Next Week (Week 2)
1. **ENGINEERING:** Complete careers portal (job listings, application form, email)
2. **ENGINEERING:** Start Morning Check-In dashboard (P0)
3. **BIGNON:** Execute Sandata BAA
4. **HR:** Draft patient consent forms

### Week 3-4
1. **ENGINEERING:** Complete Morning Check-In dashboard
2. **ENGINEERING:** Build HR onboarding UI
3. **ENGINEERING:** Build Pod Management UI
4. **ENGINEERING:** Start mobile EVV app design

---

## Conclusion

**Current State:** ~60% complete, strong foundation, critical gaps in UI and mobile app.

**Path to Production:** 20 weeks (5 months) to revenue-ready state if adequately resourced.

**Critical Path Items:**
1. Mobile EVV App (6-8 weeks) - BLOCKER
2. Sandata Certification (3-4 weeks) - BLOCKER
3. Morning Check-In Dashboard (4-5 days) - HIGH IMPACT
4. Claims Gate (2-3 days) - REVENUE PROTECTION

**Recommended Approach:** Focus P0 items first (Mobile EVV, Morning Check-In, Sandata Certification) before building additional features. Every day without EVV capture is a day without billable visits.

**Success Metrics:**
- Week 8: Mobile EVV app in beta testing
- Week 12: Sandata certified
- Week 16: First clean claim cycle
- Week 20: Full operational visibility (all dashboards wired)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Next Review:** After Phase 0 completion
