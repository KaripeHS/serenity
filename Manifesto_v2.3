# Serenity Care Partners — Operating Manifesto (v2.3 — PRODUCTION-READY)

**Purpose:** Single source of truth for leadership, staff, and engineers (Claude/tech team).

**Authors:** Serenity Leadership (Gloria – CEO; Bignon – COO/CFO).

**Status:** Production-Ready Blueprint — All Certification Prerequisites Identified

**Scope:** Vision, operating model (pods), roles, HR & rewards, "Earned Overtime," on-call coverage, compliance, technology platform (Public Website + Careers, Console/ERP, Admin), and **Ohio Medicaid Alt-EVV certification via Sandata Aggregator** with full hardening checklist.

**Core Principles:**
- **AI-first:** Automate routine; humans handle care, judgment, and relationships.
- **Compliance-by-design:** HIPAA + Alt-EVV architecture from Day 1; audit-ready always.
- **People-centered:** Fair, transparent, rewarding culture embedded in systems.
- **Data-driven:** Measure what matters; configure based on learning.
- **Configuration > Hardcoding:** Operations tune parameters; engineers build the dials.
- **Scale-ready, not scale-dependent:** Build infrastructure for 100 pods; reveal complexity progressively.
- **Single source of truth:** Serenity Console is EVV system of record; Sandata is aggregator only.
- **Zero manual double-entry:** Staff never key visits in Sandata; all corrections via Console.

---

## PRODUCTION READINESS STATUS

**GREEN (Ready):** ✅
- Configuration-first architecture
- RACI matrix defined
- Audit chain design (immutable, hash-chained)
- "No EVV → No Pay" enforcement model
- Claims gate architecture (block without Sandata ACK)
- Queue/retry design (Bull with exponential backoff)
- SOPs documented ("Fix & Resend," Daily Reconciliation)

**YELLOW (In Progress - Must Complete Before Phase 1):** 🟡
- GPS/time integrity controls (spoofing detection, NTP sync, DST handling)
- Rounding/units policy (nearest 6 min, authorization over-unit block)
- Multi-visit same-day rules (no overlaps, exact unit allocation)
- Patient consent copy (location services notice)
- BAA inventory (Sandata, clearinghouse, SMS provider)

**RED (Blocking - Must Complete Before Sandata Certification):** 🔴
- Ohio HCPCS/Modifier code set tables (frozen for Phase 3)
- Field mapping workbook (Serenity → Ohio v4.3 with validation rules)
- VisitKey immutability policy documented
- Error taxonomy wired to alerting system
- Sandata BAA signed and on file

---

## 1) Vision & North Star

**Mission:** Deliver compassionate, consistent home care while running a lean, system-driven operation that is audit-ready every day.

**North Star Outcomes (first 12–18 months):**
- Reliable care for 450+ patients with high continuity
- Pods at steady state (35–40 patients each) with accountable Pod Leads
- Hiring pipeline always on; credential freshness ≥95%
- **EVV compliance ≥98%; Alt-EVV certification complete; zero manual Sandata entry**
- **"No EVV → No Pay" enforcement active; claims pre-validated against EVV match**
- Claims timeliness and denial rates better than industry medians
- Staff retention and morale improved by fair, transparent rewards

**Management Philosophy:**
- **Local accountability (pods)** + **centralized intelligence (Console/ERP)**
- Automation handles routine; humans handle care, judgment, and relationships
- **Systems teach culture:** If it matters, it's measured and visible from Day 1
- **Revenue protection:** No claim submitted without EVV match (prevents denials before they happen)

---

## 2) Configuration Philosophy

**Core Principle:** Operations staff (Gloria, Bignon, Pod Leads) must be able to tune the system without engineering changes.

**What This Means:**

### Build Parameters, Not Policies

❌ **Bad:** SPI weights hardcoded in application logic
```typescript
const attendanceScore = visits * 0.30; // Can't change without code deploy
```

✅ **Good:** SPI weights configurable in Admin UI
```typescript
const config = await getActiveConfig('spi_weights');
const attendanceScore = visits * config.attendance_weight;
```

### Admin Configuration Dashboard

Every operational parameter lives in **Console → Admin → Configuration** with:
- Current value
- Effective date (for historical tracking)
- Simple form to update (no code, no SQL)
- "Preview Impact" before saving (e.g., "This would affect 12 caregivers")
- Audit trail (who changed what when)

### Configuration Change Governance

**Approval Thresholds:**
- **Minor changes** (<10% adjustment): Pod Leads can propose, DoO approves
- **Moderate changes** (10-25% adjustment): DoO proposes, COO/CFO approves
- **Major changes** (>25% adjustment): COO/CFO proposes, CEO + COO/CFO both approve

**Examples:**
- Changing SPI attendance weight from 30% → 32%: Minor (DoO approval)
- Changing SPI attendance weight from 30% → 40%: Moderate (COO/CFO approval)
- Changing SPI attendance weight from 30% → 50%: Major (CEO + COO/CFO approval)
- Changing pod target size from 35 → 38: Minor
- Changing Earned OT threshold from SPI 80 → 70: Moderate

**System Enforcement:**
- Admin UI shows required approval level before saving
- Changes >10% require justification text (logged in audit trail)
- Multi-approver flow built into Console for major changes

### Configurable Parameters (Examples)

**SPI System:**
- Component weights (attendance 30%, quality 25%, etc.)
- Eligibility threshold for Earned OT (currently SPI ≥80)
- Complaint lookback period (currently 60 days)

**Pod Management:**
- Target pod size (currently 35)
- Maximum pod size (currently 40)
- Split trigger threshold (e.g., split when pod hits 38 for 2 weeks)

**Earned Overtime:**
- Daily hour cap (currently 16)
- Weekly alert threshold (currently 70 hours)
- Rest period requirement (currently 8 hours)

**Bonus System:**
- Base percentages by role (HHA 2%, LPN 3%, RN 3%, Pod Lead 4%)
- Hours threshold for full bonus (currently 1,560)
- OTC cap (currently 1.33×)

**On-Call Ratios:**
- Staff-to-patient ratio (currently 1:10)
- Role mix targets (70% HHA, 20% LPN, 10% RN)
- Standby retainer amounts

**Alt-EVV:**
- Geofence radius (currently 0.25 miles)
- Clock-in tolerance (currently ±15 minutes)
- Auto-retry limits (currently 3 attempts, exponential backoff)
- EVV strict/lenient mode (strict = block scheduling if GPS missing)
- Claims gate enforcement (block claims for visits without Sandata ACK)
- **Rounding policy** (default: nearest 6 minutes = 0.1 hour unit)
- **Authorization over-unit block** (prevent units exceeding approved hours)

**Compliance:**
- Credential expiration notice period (currently 30 days)
- Access review frequency (currently quarterly)

### UI/UX for Configuration

Non-technical users need:
- **Plain language labels:** "How many days before license expiration should we alert?" (not `credential_alert_days`)
- **Inline help text:** Hover tooltips explaining impact
- **Range validation:** Can't set pod size to 5 or 500 (system suggests 30-45)
- **Confirmation prompts:** "Changing SPI weights will recalculate scores for 47 caregivers. Continue?"
- **Rollback capability:** "Revert to previous configuration" button
- **Approval workflow UI:** For changes requiring multiple approvers

### Feature Flags (Progressive Disclosure)

**Concept:** Build features that activate when operationally ready, not when code is deployed.

**Example: On-Call Dispatch UI**

**Configuration:**
```
Feature: oncall_dispatch
Status: Hidden
Auto-Enable When: active_pods >= 2 OR total_patients >= 50
Manual Override: Admin can enable early for testing
```

**What This Means:**
- Code exists in production from Day 1
- UI hidden until conditions met
- No code deploy needed to "launch" the feature
- Admin can enable early if needed (e.g., for training)

**UI Pattern:**
- Disabled features show in Admin as "Coming Soon" with activation conditions
- When auto-enabled, users get a one-time tutorial/walkthrough

---

## 3) Pod Operating Model

**Definition:** A pod is a self-contained care unit responsible for end-to-end delivery to 35–40 patients (target 35; 40 max).

**Why pods:** Continuity, clear ownership, fast learning loops, scale without chaos.

### Pod Lifecycle:

**Phase 1: Pod-1 (Founder-Led)**
- All new patients assigned here until ~35
- Gloria or experienced hire as Pod Lead
- Build muscle memory for systems and workflows

**Phase 2: Split to Pod-2**
- **Trigger:** Configurable (default: Pod-1 reaches 35 patients)
- **Process:** Even split while preserving caregiver–patient pairs
- **Automation:** Console "Split Pod Wizard" guides the process:
  1. Recommends split based on geography/continuity
  2. Shows impact preview (which pairs stay, which move)
  3. Generates family notification templates
  4. Creates audit log entry
- **New Pod Lead:** Hire/promote; assign in Console

**Phase 3: Fill Pods 1 & 2**
- Round-robin new patient assignments
- Console automatically balances to target size

**Phase 4: Split to Pod-3+**
- Repeat process; Console tracks optimal split candidate
- Historic data informs continuity preservation

### Continuity Rules (Hard Guardrails)

1. **Always move caregiver–patient pairs together** when rebalancing
2. **Care plans, cadence, EVV routines remain unchanged** post-move (only `pod_id` changes)
3. **Exceptions** (safety/skills mismatch) require:
   - Documented justification
   - Pod Lead approval
   - Family communication (auto-generated template)
4. **Every reassignment audited** (who/why/when) in immutable log

### Pod KPIs

**Tier 1 (Track from Day 1):**
- **EVV Compliance %** — visits with valid EVV vs. total visits
- **Sandata Acceptance %** — visits accepted by Aggregator vs. submitted
- **Continuity %** — same caregiver for repeat visits
- **Visit Coverage %** — scheduled visits completed vs. missed

**Tier 2 (Activate at Pod-2+):**
- **Credential Freshness %** — staff with current licenses/certs
- **Retention Rate** — caregivers staying 90+ days
- **Gap Fill Rate** — no-shows covered by on-call within 2 hours
- **Claims Readiness %** — billable visits (EVV match confirmed) vs. total

**Tier 3 (Activate at 4+ Pods):**
- **Family Satisfaction** — quarterly survey scores
- **Rehospitalization Rate** — benchmarked against regional data
- **Utilization** — actual hours vs. authorized hours

**Configuration:** Which KPIs are visible to which roles is configurable in Admin.

---

## 4) Organization & Roles

### Current Leadership (Pre-Revenue):
- **CEO (Gloria)** – Nominal now; steps in as needed
- **COO/CFO (Bignon)** – Operations, HR, finance, RCM, compliance cadence

### Post–Pod-2 Structure:
- **Director of Operations (DoO)** → Manages Pod Leads (hire when 2+ pods)
- **Pod Leads (1 per pod)** → Day-to-day delivery & KPIs
- **HR/Recruiting** → Applicant pipeline, onboarding
- **Credentialing/Training** → License tracking, compliance education
- **Billing/RCM** → Claims, denials, payer relations, **EVV-claim matching**
- **Finance/Payroll** → Comp, bonuses, tax reporting
- **Compliance** → Audits, HIPAA, EVV validation, **Sandata reconciliation** (dotted-line independence)

**Reporting Line (Simple):**
```
CEO → COO/CFO → DoO → Pod Leads → Caregivers
         ↓
    HR/RCM/Finance/Compliance (report to COO/CFO)
```

---

## 5) HR & Workforce System

### 5.1 Serenity Performance Index (SPI)

**Composite 0–100 score; monthly with 12-month rolling average.**

**Default Weights (Configurable in Admin):**
- **Attendance & Reliability** – 30% (EVV on-time %, no-show count)
- **Care Quality / Patient Feedback** – 25% (family surveys, supervisor observations)
- **Documentation & EVV Compliance** – 25% (note completeness, EVV accuracy, **Sandata acceptance rate**)
- **Team Collaboration** – 10% (peer feedback, responsiveness)
- **Learning & Credentials** – 10% (training completion, cert freshness)

**Used for:** Recognition, coaching, annual bonus eligibility, Earned OT gate.

**Admin Configuration UI:**
- Adjust weights (must sum to 100%)
- Set minimum score for Earned OT (default: 80)
- Define complaint lookback period (default: 60 days)
- Preview impact: "If you lower OT threshold to 75, 8 more caregivers become eligible"
- Approval workflow for changes >10%

### 5.2 Recognition — "Serenity Star" (Short-Cycle Rewards)

**Bronze (Quarterly):**
- **Criteria (Configurable):** Perfect attendance + 0 EVV violations + 100% Sandata acceptance
- **Reward:** $100 bonus

**Silver (Semi-Annual):**
- **Criteria:** SPI ≥95 + client compliments
- **Reward:** $250 bonus

**Gold (Annual):**
- **Criteria:** SPI ≥97 + mentoring contributions
- **Reward:** $500 bonus

**Pod Excellence (Annual):**
- **Criteria:** Top pod by composite KPI score (including EVV/claims metrics)
- **Reward:** Team celebration budget (configurable amount)

**Configuration:** All thresholds, amounts, and frequency adjustable in Admin → Rewards → Serenity Star Settings.

### 5.3 Annual Performance & Retention Bonus

**Eligibility (Configurable):**
- **Tenure:** 12 months by Dec 31 (configurable date)
- **Hours Threshold:** ≥1,560 for full bonus (≈30 hrs/wk); pro-rated 1,040–1,559
- **SPI Gate:** 12-month average ≥80 (configurable)
- **Compliance:** No active violations or pending discipline

**Formula:**
```
Bonus = (Base% of Annual Earnings) × (SPI/100) × OTC
```

**Base% (Configurable by Role):**
- HHA: 2%
- LPN: 3%
- RN: 3%
- Pod Lead: 4%
- Admin: 2%

**OTC (Overtime Credit):**
- Factor = (Actual Hours / 1,560), capped at 1.33× (≈2,080 hrs)
- Rewards caregivers who carry extra load

**Payout Schedule (Configurable):**
- Default: 50% in June, 50% in December (following year)
- Must be employed on each pay date
- If terminated before payout, forfeited

**Cash-Flow Protection:**
- If Serenity postpones a scheduled payout for cash-flow reasons, payout must occur within 90 days of the original scheduled date
- Interest accrues at 3% APR for delayed payouts beyond 30 days
- Staff notified in writing with new payout date

**Admin Configuration UI:**
- Adjust base % by role
- Change hours threshold and OTC cap
- Set SPI minimum and lookback period
- Modify payout schedule (e.g., quarterly instead of bi-annual)
- **Bonus Calculator** (staff-facing): "Enter your hours and see your projected bonus"

### 5.4 "Earned Overtime" (Streamlined, Auto-Evaluated)

**Philosophy:** Overtime is encouraged with minimal friction; quality is the gate, not arbitrary caps.

**Eligibility (Auto-Checked Monthly):**
1. **SPI ≥ 80** (configurable threshold)
2. **No substantiated client complaints in 60 days** (configurable lookback)
3. **All documentation current** (no late visit notes >48 hours)
4. **No active discipline or safety issues**
5. **EVV compliance ≥95%** (Sandata acceptance rate)

**If Eligible:**
- Unlimited voluntary OT (subject to configurable daily cap, default 16 hours)
- Must have 8-hour rest period between shifts (configurable, enforced automatically)
- OT hours count toward bonus OTC

**If Paused:**
- Yellow badge in Console (visible to caregiver and Pod Lead)
- Re-evaluated automatically next month or upon issue resolution
- Coaching conversation required (template provided in Console)

**Light-Touch Controls (Configurable):**
- **Weekly Alert Threshold:** Default 70 hours → Pod Lead notified (not blocked)
- **Sustainability Check-In:** At 60+ hrs/week, automated prompt: "How are you feeling? Any signs of fatigue?"
- **Random QA:** 1–2 visits/month for high-OT caregivers (quality spot-check)

**Admin Configuration UI:**
- Set SPI threshold for eligibility (default: 80)
- Adjust complaint lookback (default: 60 days)
- Set EVV compliance minimum (default: 95%)
- Change daily hour cap (default: 16)
- Modify rest period requirement (default: 8 hours)
- Set weekly alert level (default: 70 hours)
- Enable/disable sustainability check-ins

### 5.5 Centralized On-Call Team (COT)

**Purpose:** HQ-managed reserve to fill gaps fast (no-show, late, call-out).

**Ratio Guideline (Configurable):**
- Default: 1 on-call staff per 10 active patients (pooled across pods)
- Example: 70 patients → 7 on-call staff

**Role Mix (Configurable):**
- Target: 70% HHA, 20% LPN, 10% RN
- Allow hybrid: Office staff with clinical credentials can be on-call

**Compensation (Configurable):**
- **Standby Retainer:** Small weekly payment for availability (e.g., $50–100/week)
- **Call-In Premium:** Extra pay for covering a shift (e.g., +$5/hr)
- **Reliability Bonus:** Monthly bonus for <2hr response time

**Console Features (Progressive Activation):**
- **Morning Check-In Dashboard** (Day 1): Shows expected visits, check-in status, **Sandata sync status**
- **Coverage Gap Alerts** (Pod-1+): Flags no-shows, late clock-ins, **EVV rejections**
- **One-Click Dispatch** (Pod-2+): SMS/push to on-call staff with shift details
- **Response Tracking** (Pod-2+): Logs who accepted, time to arrival

**KPIs:**
- **Gap Fill Rate** — % of no-shows covered within 2 hours
- **Response Time** — Median minutes from alert to caregiver en route
- **On-Call Utilization** — % of standby hours used
- **Cost per Covered Hour** — Total COT cost / hours covered

**Configuration:**
- Staff-to-patient ratio
- Role mix targets
- Compensation amounts (retainer, premium, bonus)
- Response time SLA (default: 2 hours)
- Auto-activation threshold (e.g., enable dispatch at 2+ pods)

---

## 6) Compliance & Data Governance

### Data Classes:

1. **Public Data** — Marketing content, general job descriptions (no PHI, no HR-sensitive data)
2. **HR-Sensitive** — SSN, tax documents, background checks (Console only, restricted access)
3. **PHI** — Patient demographics, diagnoses, visit notes, care plans (Console only, HIPAA scope)
4. **EVV Data** — Clock-in/out timestamps, GPS coordinates, service codes (PHI class, synced to Sandata)

### Golden Rules (Non-Negotiable, Built into Architecture):

✅ **PHI never touches public surfaces** (separate domains, separate databases)

✅ **TLS 1.3 in transit; AES-256 at rest** (enforced at infrastructure layer)

✅ **Separate encryption keys for HR and PHI datasets**
   - HR data encrypted with `hr_master_key`
   - PHI encrypted with `phi_master_key`
   - Keys rotated quarterly (automated, logged)
   - Key access restricted to infrastructure admins only

✅ **Immutable audit logs** for every Console action (who, what, when, from where)

✅ **Alt-EVV as single source of truth:** Serenity Console captures EVV; Sandata is aggregator only

✅ **SSO + MFA for Console access** (no exceptions)

✅ **Least-privilege RBAC + ABAC** (role-based + attribute-based: pod, region, patient)

✅ **Break-glass with justification** (emergency access logged and alerted)

✅ **"No EVV → No Pay"** enforced at two levels:
   - Payroll: no valid EVV = visit not paid
   - Claims: no Sandata ACK = claim blocked (prevents denials)

### Compliance Operating Rhythm (Configurable Cadence):

**Daily:**
- **EVV reconciliation** (Serenity visits vs. Sandata acceptance, flag errors)
- **EVV backlog:** Must be 0 visits pending >24 hours **(CRITICAL SLO)**
- Morning Check-In (expected visits, coverage gaps, **Sandata sync status**)

**Weekly:**
- **Claims pre-validation** (block claims where EVV match will fail)
- On-call response time review
- **Sandata acceptance rate:** Must maintain ≥98%; alert if <95% for 2 consecutive days

**Monthly:**
- Credential freshness review (automated alerts at 30 days before expiration)
- Access review (new hires, role changes, terminations)
- Key rotation review (confirm quarterly rotation on schedule)
- **Sandata error analysis** (top rejection codes, remediation time)

**Quarterly:**
- Vendor BAA audit (confirm all BAAs current and signed, including Sandata)
- Incident response drill (test breach notification workflow)
- Encryption key rotation (automated, verify completion)

**Annual:**
- Penetration testing (third-party security assessment)
- HIPAA training (all staff, tracked in Console)
- Risk assessment update (document new risks, controls)
- **Alt-EVV re-certification** (if Ohio requires periodic renewal)

**Continuous:**
- EVV validation (real-time)
- **Sandata sync monitoring** (alert if submission backlog >24 hours)
- Audit log monitoring (automated alerts for suspicious activity)

**Configuration:**
- Adjust notice periods (e.g., 60 days for credential expiration instead of 30)
- Change review frequency (e.g., access reviews monthly instead of quarterly)
- Enable/disable specific compliance checks (e.g., geo-fence radius for EVV)
- Set Sandata retry/alert thresholds

---

## 7) Technology Surfaces & Architecture

### 7.1 Domains & Separation (Day 1 Architecture)

**Public Website:**
- **Domain:** `https://serenitycarepartners.com`
- **Purpose:** Marketing, Careers
- **Data:** No PHI, no HR-sensitive data, no EVV data
- **Technology:** Static site or simple CMS (WordPress, Webflow, custom React)

**Console (ERP):**
- **Domain:** `https://console.serenitycarepartners.com`
- **Purpose:** Operations, HR, scheduling, EVV, billing, compliance, **Alt-EVV system of record**
- **Data:** PHI + HR-sensitive + EVV data (HIPAA scope)
- **Technology:** Custom application (React + Node.js/TypeScript + PostgreSQL)

**Admin:**
- **Location:** Inside Console at `/admin`
- **Purpose:** User provisioning, role/policy management, configuration, feature flags, **Sandata credentials management**
- **Access:** Elevated privileges (Gloria, Bignon, DoO only)

**Sandata Aggregator (External):**
- **Integration:** REST API (Ohio v4.3 spec)
- **Data flow:** Serenity → Sandata (one-way push for Individuals, Employees, Visits)
- **Purpose:** Claims matching for Ohio Medicaid; Serenity is EVV system of record

### 7.2 Public Website (with Integrated Careers)

**Goals:** Credibility, SEO, conversion, easy application process.

**Pages:**
- Home, About, Services, How It Works, FAQs, Careers, Contact/Referral

**Careers Section:**
- **Job Listings:** HHA, LPN, RN roles (pulled from configurable job board in Console)
- **Application Form:** Name, contact, role, availability, consent
- **No certification upload required** at application stage (reduces friction)
- Instead: "Do you have an active [HHA/LPN/RN] license?" (Yes/No)
- Collect certs during onboarding after hire
- **Data Storage:** Secure backend (no PHI); flows into Console Recruiting module when admin activates
- **Confirmation:** Auto-email with application ID and status lookup link

---

### 7.3 Console (ERP) — Core Modules

**Architecture Pattern: Modular + Configurable**

Each module follows:
- **Data models** designed for scale (100+ pods, 1000+ users)
- **Configuration UI** for all operational parameters
- **Feature flags** for progressive activation
- **Audit trails** on all writes (using universal `audit_events` table)
- **RBAC/ABAC enforcement** at every endpoint

---

#### Module 1: Recruiting & HR

**Features:**
- Applicant pipeline (from Careers site)
- Interview scheduling and notes
- Onboarding checklist (I-9, W-4, background, TB/CPR, policy e-sign)
- Credential tracker (license expiration alerts)
- SPI engine (auto-calculation, manual overrides)
- Rewards ledger (Serenity Star, bonus tracking)
- **Auto-sync to Sandata Employees feed** (when caregiver hired)

**Configuration:**
- Onboarding checklist steps (add/remove/reorder)
- Credential alert periods (30, 60, 90 days)
- SPI component weights
- Reward criteria and amounts

**Progressive Activation:**
- **Day 1:** Applicant review, onboarding checklist
- **Week 2:** Sandata Employees feed (auto-post on hire)
- **Month 1+:** SPI auto-calculation
- **Quarter 1+:** Serenity Star automation

---

#### Module 2: Pods & Staffing

**Features:**
- Pod roster (patients, caregivers, Pod Lead)
- Patient-caregiver pairing with continuity tracking
- "Split Pod Wizard" (guides even split while preserving pairs)
- Morning Check-In dashboard (includes **Sandata sync status**)
- On-Call Pool management
- Coverage Gap dispatch

**Configuration:**
- Target pod size (default: 35)
- Maximum pod size (default: 40)
- Split trigger rules
- On-call ratio (1:10 patients)
- Role mix targets (70/20/10 HHA/LPN/RN)

**Progressive Activation:**
- **Day 1:** Pod-1 exists, patient assignments, Morning Check-In (basic)
- **Pod-2:** Split Wizard, advanced Check-In (gap detection, **EVV error flags**)
- **Pod-2+:** On-Call Dispatch UI, SMS/push notifications

---

#### Module 3: Scheduling & EVV (with Alt-EVV Integration)

**Features:**
- Shift assignment (AI-assisted matching by skills, location, availability)
- EVV capture (clock-in/out, geo-fence, service codes)
- EVV validation (real-time checks: on-time, correct location, valid service, **6 federal elements**)
- **Alt-EVV Sandata integration** (three feeds: Individuals, Employees, Visits)
- **"No EVV → No Pay" enforcement** (invalid visits flagged, excluded from payroll AND claims)
- Late/no-show alerts
- **Claims pre-validation** (block claims where Sandata match will fail)

**Configuration:**
- Geo-fence radius (e.g., 0.25 miles)
- Clock-in tolerance (e.g., ±15 minutes)
- EVV validation rules (strict vs. lenient mode)
- Payroll block threshold (e.g., <95% EVV compliance)
- **Sandata retry limits** (default: 3 attempts, exponential backoff)
- **Claims gate enforcement** (require Sandata ACK before claim submission)
- **Rounding policy** (default: nearest 6 minutes = 0.1 hour unit)
- **Authorization over-unit block** (prevent units exceeding approved hours)

**VisitKey Design (CRITICAL):**
- **VisitKey is immutable** — once generated, never changes
- **Strategy:** Deterministic hash: `SHA256(patient_id + caregiver_id + service_date + scheduled_start)`
- **Purpose:** Idempotency for Sandata submissions (prevents duplicate billing)
- **Corrections:** All corrections create a new Sandata submission referencing the prior VisitKey per Sandata guidance
- **Storage:** Both VisitKey (Sandata identifier) and visit_id (Serenity UUID) stored; VisitKey used for all Sandata communication

**GPS & Time Integrity Controls:**
- **NTP sync:** All servers synchronized to authoritative time source
- **Device time drift detection:** Flag if mobile device clock differs >2 minutes from server
- **Spoofing detection:** 
  - Flag if GPS jumps >500 meters between clock-in and clock-out
  - Flag if Android Developer Mode/Mock Locations enabled
  - Flag if iOS jailbreak detected
- **Timezone handling:** Store all timestamps in UTC with location metadata; display local time to users

**Multi-Visit Rules:**
- **Allow:** Multiple visits same day for same patient/caregiver (split tasks, back-to-back)
- **Enforce:** No overlapping time periods for same caregiver
- **Enforce:** Sum of units cannot exceed patient's daily authorization
- **UI:** Show warning if back-to-back visits with <15 min break (suggest rest period)

**Progressive Activation:**
- **Day 1:** Manual scheduling (Pod Lead assigns shifts)
- **Week 2:** Sandata Individuals feed (auto-post patient intake with Medicaid ID)
- **Month 2:** EVV capture goes live (mobile app or tablet)
- **Month 2-3:** Sandata Visits feed + certification testing
- **Month 3:** AI Scheduler Assist (suggests optimal matches)
- **Month 3-4:** "No EVV → No Pay" enforcement (after Sandata certification complete)
- **Month 4+:** Claims pre-validation gate (requires Sandata ACK)

**Alt-EVV Integration Details:**

**Status:** Revenue-critical dependency for Ohio Medicaid billing.

**Architecture:**
- **Serenity is the EVV system of record** (not Sandata)
- Visits captured in Serenity Console/mobile app
- Real-time validation (6 elements, geofence, time tolerance)
- Automated push to Ohio Sandata Aggregator via REST API (v4.3 spec)
- Claims pre-validation against EVV match (prevents denials)

**Three Data Feeds (REST/JSON):**

| Feed | Purpose | Trigger | Required Before |
|------|---------|---------|-----------------|
| **Individuals (Clients)** | Load Medicaid members | Patient intake/update | First visit scheduled |
| **Employees** | Load caregivers/nurses | Hire/credential change | First visit scheduled |
| **Visits** | Submit service visits | Clock-out + validation | Claims submission |

**Certification Path:**
1. Register as Alt-EVV system with Ohio Sandata (Week 1 - Phase 0)
2. Build feeds to v4.3 spec (Week 2-4 - Phase 1-2)
3. Execute Certification Test Plan in sandbox (Week 4-6 - Phase 3)
4. Receive production credentials (Week 6 - Phase 3)
5. Go live with production endpoints (Week 6-7 - Phase 3)
6. 7 consecutive days of 100% acceptance (Phase 3 exit criteria)

**Acceptance Criteria:**
- Sandata certification approved (production credentials issued)
- 100% of Medicaid visits accepted by Aggregator within 24 hours
- Zero claim denials for EVV mismatch across full billing cycle
- No manual Sandata entry required (Console-only corrections)
- Daily reconciliation: Serenity visit count matches Sandata accepted count

**See Appendix D for complete Alt-EVV technical specification, field mappings, and certification test plan.**

---

#### Module 4: Care Management

**Features:**
- Client profiles (demographics, insurance, emergency contacts)
- Service authorization tracking (approved hours, effective dates)
- Visit notes (caregiver observations, tasks completed)
- Plan of Care (POC) management (goals, interventions, updates)
- HIPAA audit trails (every PHI access logged)

**Configuration:**
- Required fields for intake (flexible based on payer)
- Visit note templates (customize by service type)
- POC review frequency (e.g., every 60 days)

**Progressive Activation:**
- **Day 1:** Client profiles, service auth tracking
- **Week 2:** Auto-sync to Sandata Individuals feed (when Medicaid ID present)
- **Month 2:** Visit notes (when EVV goes live)
- **Month 4:** Full POC management (as clinical staff ramp up)

---

#### Module 5: Billing/RCM (with EVV-Claim Matching)

**Features:**
- Claims generation (837 format, submitted to clearinghouse)
- **Claims pre-validation** (check EVV match before submission)
- Remittance processing (835 format, auto-post payments)
- Denial management (flag reasons, workflow for correction/resubmission)
- **EVV mismatch tracking** (alert if claim denied due to missing Sandata record)
- Payer rules engine (Medicaid, Medicare, private insurance)
- Revenue dashboards (claims submitted, paid, denied, DSO, **EVV readiness %**)

**Configuration:**
- Payer-specific rules (service codes, modifiers, documentation requirements)
- Denial reason categories
- Auto-resubmit rules (e.g., for certain denial codes)
- **Claims gate threshold** (e.g., require ≥98% Sandata acceptance before submitting claims file)

**Progressive Activation:**
- **Month 1-2:** Manual billing (use clearinghouse web portal)
- **Month 3-4:** 837 generation in Console (export to clearinghouse)
- **Month 4:** Claims pre-validation (check Sandata ACK before submission)
- **Month 5-6:** Full automation (837 send, 835 auto-post, denial workflow, EVV mismatch alerts)

---

#### Module 6: Compliance

**Features:**
- Access reviews (quarterly report: who has access to what, justification)
- Incident tracking (HIPAA breaches, safety events, complaints)
- Exportable audit binders (for state surveys, payer audits)
- BAA management (track vendor agreements, expiration alerts, **including Sandata BAA**)
- Credential compliance dashboard (staff with expiring licenses)
- **Alt-EVV reconciliation** (daily Sandata sync report, error tracking)

**Configuration:**
- Access review frequency (quarterly, monthly)
- Incident severity classification
- Required documentation for each incident type
- **Sandata error escalation** (alert if acceptance rate <95% for 3 consecutive days)

**Progressive Activation:**
- **Day 1:** Audit logging (background, automatic via `audit_events`)
- **Week 2:** Sandata BAA tracking
- **Month 3:** Quarterly access reviews, daily Sandata reconciliation
- **Month 6:** Full incident tracking and audit binder export

---

#### Module 7: Analytics

**Features:**
- Executive KPIs (revenue, active patients, pods, staff count, **EVV compliance %**)
- Pod scorecards (8 KPIs per pod, configurable, **including Sandata acceptance rate**)
- SPI trends (individual and cohort)
- Continuity heatmaps (which patient-caregiver pairs are stable)
- OT insights (who's working how much, cost vs. new hire analysis)
- **EVV health dashboard** (success %, rejection codes, remediation time)
- **Claims readiness report** (billable visits with Sandata ACK vs. total)

**Configuration:**
- Which KPIs are visible (Tier 1/2/3)
- Dashboard layout (drag-and-drop widgets)
- Alert thresholds (e.g., alert if EVV% <95%, Sandata acceptance <98%)

**Progressive Activation:**
- **Day 1:** Basic KPIs (patient count, visit count)
- **Week 2:** EVV compliance tracking
- **Month 3:** Pod scorecards (Tier 1 KPIs, including Sandata metrics)
- **Month 6+:** Full analytics (Tier 2-3 KPIs, predictive alerts, EVV trends)

---

### 7.4 Admin (Inside Console at `/admin`)

**Purpose:** Configuration, user management, system settings (not daily operations).

**Key Sections:**

**Users & Roles:**
- User provisioning (invite, assign role, assign pod/region)
- Role definitions (permissions matrix)
- Attribute policies (ABAC rules: e.g., Pod Leads see only their pod)

**Configuration:**
- SPI Settings (weights, thresholds)
- Earned OT Rules (eligibility, caps, rest periods)
- Bonus Calculator (base %, hours thresholds, OTC cap)
- Pod Parameters (target size, split triggers)
- On-Call Ratios (staff:patient, role mix)
- Compliance Cadence (review frequencies, alert periods)
- **Alt-EVV Settings** (geofence, tolerance, retry limits, claims gate)
- Approval workflows (who approves what changes)

**Feature Flags:**
- List of all features (current status, activation conditions)
- Manual override (enable/disable for testing)
- Preview impact ("This affects X users")

**System:**
- Key rotation (encryption keys for HR and PHI, automated quarterly)
- **Sandata credentials management** (API keys, rotation schedule)
- Secrets audit (check for exposed credentials)
- Environment toggles (dev/stage/prod)
- Backup/restore (manual trigger, scheduled)

**Audit & Logs:**
- Recent admin actions (who changed what configuration)
- Export compliance reports (access reviews, incident logs, **Sandata reconciliation**)
- Query universal `audit_events` table

**Alt-EVV Monitoring:**
- **Sandata Health Dashboard:** Success rate, pending submissions, error codes
- **Certification Status:** Sandbox vs. production, last test date
- **Daily Reconciliation:** Serenity visits vs. Sandata accepted (auto-generated report)

---

### 7.5 AI-Assist (Safe Defaults, Human Oversight)

**Philosophy:** AI suggests; humans decide. Especially critical for PHI and compliance.

**Tier 1 AI Agents (Build Now):**

1. **EVV Watchdog**
   - Monitors clock-ins in real-time
   - Flags: late, geo-fence violations, missing clock-out, **missing 6 federal elements**
   - Auto-alerts Pod Lead and caregiver
   - Blocks payroll for invalid visits (configurable grace period)
   - **Monitors Sandata submission queue** (alerts if backlog >24 hours)

2. **Scheduler Assist**
   - Suggests caregiver-patient matches based on:
     - Skills (HHA vs. LPN vs. RN)
     - Location (minimize travel time)
     - Availability (current schedule, OT eligibility)
     - Continuity (prefer existing pairs)
   - Pod Lead reviews and approves

3. **Credentialing Agent**
   - Tracks license/cert expiration dates
   - Sends alerts at 30 days (configurable)
   - Escalates to HR at 15 days
   - Blocks scheduling if expired (configurable)
   - **Auto-updates Sandata Employees feed** (when credential changes)

**Tier 2 AI Agents (Build Soon, Months 2-4):**

4. **Coverage Gap Dispatcher**
   - Detects no-shows within 15 minutes of shift start
   - Recommends on-call staff (by location, skills, availability)
   - Sends one-click dispatch (SMS/push: "Can you cover 123 Main St, 2-4pm? Tap Yes/No")

5. **SPI Calculator**
   - Auto-computes monthly scores from raw data (attendance, EVV%, **Sandata acceptance %**)
   - Flags anomalies (sudden drop, perfect 100 for 6 months)
   - Generates coaching prompts for Pod Leads

6. **Compliance Auditor**
   - Scans code for console statements (PHI leak risk)
   - Reviews access logs for suspicious patterns (3am logins, bulk exports)
   - Generates quarterly access review reports
   - **Monitors Sandata error patterns** (flags recurring rejection codes)

**Tier 3 AI Agents (Build Later, Month 6+):**

7. **Executive Copilot** (read-only suggestions)
8. **Predictive Turnover** (flags at-risk caregivers)
9. **Revenue Optimizer** (payer mix, authorization utilization, **EVV-claim correlation**)
10. **Claims Pre-Validator** (AI checks EVV match before human submits 837)
11-17. Additional optimization agents as needed

**AI Guardrails (All Agents, Non-Negotiable):**
- **PHI Classification:** AI never logs or caches PHI
- **Redaction:** Sensitive data masked in AI logs
- **Least-Privilege I/O:** AI reads only minimum necessary data
- **Decision Logs:** Every AI suggestion logged (for audit)
- **Human Override:** Staff can always ignore AI suggestions
- **No Generative Patient-Facing Content:** AI does not write visit summaries, care plans, or any document sent to patients/families
- **No EVV Data Fabrication:** AI never generates synthetic clock-in/out times or GPS coordinates; any AI suggestion that alters a visit (times, GPS, units) requires dual human approval

---

## 8) Implementation Phases & Acceptance Criteria

### Phase 0 — Foundation (Week 1-2, Before First Patient)

**Goal:** Prove architecture, establish Day 1 systems, create demo environment, **register with Sandata**.

**Deliverables:**
- Public site live (even if basic)
- Console authentication working (SSO/MFA)
- Database schemas deployed (pods, users, patients, caregivers, assignments, audit_events, **evv_visits, sandata_transactions**)
- Pod-1 exists in system (Gloria as Pod Lead)
- Admin UI accessible (basic config forms)
- **Register as Alt-EVV system with Ohio Sandata**
- **Request sandbox credentials, API spec v4.3, Certification Test Plan**
- **Mock data seed:** 10 caregivers, 3 pods, 30 patients, 2 weeks of EVV history
  - Purpose: Enables KPI demos before live operations
  - Realistic scenarios: Mix of perfect/good/problematic caregivers
  - Lets leadership preview dashboards and reports

**Acceptance:**
- Gloria can log into Console
- Pod-1 shows in system with mock caregivers/patients
- Configuration UI lets you change SPI weights
- Mock KPIs display correctly (EVV%, continuity%, SPI scores)
- Can generate sample reports (SPI leaderboard, pod scorecard)
- **Sandata sandbox API keys received**
- **Alt-EVV spec v4.3 and test plan saved in repo**

---

### Phase 1 — Public Website + Careers + Alt-EVV Setup (Week 2-6)

**Goal:** Launch public presence, start recruiting, **build Sandata Individuals & Employees feeds**.

**Deliverables:**
- Refresh/launch serenitycarepartners.com
- Careers page with job listings (HHA, LPN, RN)
- Application form (name, contact, role, availability, consent)
- Consent and privacy notices
- Email confirmations (auto-send after application)
- Backend: Store applications securely (Google Drive + DB, or S3 + DB)
- **Build data model for Alt-EVV (Individuals, Employees, Visits)**
- **Implement REST/JSON producers for Individuals and Employees feeds**
- **Field mapping document** (Serenity → Ohio v4.3 spec)
- **Test happy-path in Sandata sandbox** (Individuals → ACK, Employees → ACK)

**Acceptance:**
- External users can view roles and apply
- HR receives structured submissions (exportable list)
- Privacy/consent copy is visible and compliant
- Confirmation emails sent automatically
- **Individuals feed posts successfully to Sandata sandbox**
- **Employees feed posts successfully to Sandata sandbox**
- **Idempotency working** (duplicate submissions handled via transaction ID)

**Configuration:**
- Job board content (descriptions, pay ranges) managed in Console Admin
- **Sandata sandbox endpoints configured in Admin**

---

### Phase 2 — HR Onboarding + Alt-EVV Data Sync (Month 1-2)

**Goal:** Transition applicants to employees, assign to pods, **auto-sync to Sandata**.

**Deliverables:**
- Applicant review workflow in Console (approve, reject, schedule interview)
- Onboarding checklist (I-9, W-4, background, TB/CPR, policy e-sign)
- Credential tracker (license entry, expiration alerts)
- Pod assignment (assign caregiver to Pod-1)
- SPI tracking begins (even if manual data entry initially)
- **Auto-post to Sandata Employees feed when caregiver hired**
- **Auto-post to Sandata Individuals feed when patient onboarded** (requires Medicaid ID)
- **Store Sandata transaction IDs** (for audit trail and idempotency)

**Acceptance:**
- Hired staff assigned to Pod-1
- Credentials tracked (expiration alerts working)
- SPI score visible in Console (even if placeholder)
- Mock data caregivers can be edited/updated to test workflows
- **Every new hire auto-syncs to Sandata** (Employee feed ACK logged in `sandata_transactions`)
- **Every patient with Medicaid ID auto-syncs to Sandata** (Individuals feed ACK logged)
- **Error handling working** (failed submissions retry with exponential backoff)

**Configuration:**
- Onboarding checklist steps (add/remove)
- Credential alert periods (30, 60, 90 days)
- **Sandata retry limits** (default: 3 attempts)

---

### Phase 3 — Scheduling, EVV, Alt-EVV Certification (Month 2-4)

**Goal:** Automate core operations, **complete Sandata certification**, enforce EVV compliance.

**Deliverables:**
- Shift engine live (Pod Lead assigns shifts in Console)
- Morning Check-In dashboard (shows expected visits, check-in status, **Sandata sync status**)
- EVV capture (mobile app or tablet: clock-in/out, geo-fence, 6 federal elements)
- EVV validation (real-time checks: on-time, correct location, valid service)
- Coverage Gap alerts (flags no-shows)
- **Build Sandata Visits feed** (clock-in/out + GPS → Aggregator within 24 hours)
- **Execute Sandata Certification Test Plan** (all three feeds + negative cases)
- **Deliver certification evidence packet to Sandata**
- **Receive Sandata production credentials**
- **Enable production endpoints**
- **7 consecutive days of production EVV with 100% Aggregator acceptance**
- On-Call Pool setup (when 2+ pods or 50+ patients)
- One-click dispatch (SMS/push to on-call staff)

**Acceptance:**
- EVV compliance ≥98% (after grace period)
- Gap fill rate ≥95% (no-shows covered within 2 hours)
- Continuity ≥90% (same caregiver for repeat visits)
- **Sandata certification approved** (production credentials issued)
- **100% of Medicaid visits accepted by Sandata within 24 hours** (for 7 consecutive days)
- **Daily reconciliation green** (Serenity visit count matches Sandata accepted count)
- **"No EVV → No Pay" enforcement active** (blocks both payroll AND claims)
- **Zero manual Sandata entry required** (all corrections via Console "Fix & Resend")

**Configuration:**
- Geo-fence radius, clock-in tolerance
- EVV validation rules (strict vs. lenient)
- On-call ratio (1:10 patients)
- Gap fill response SLA (2 hours)
- **Sandata production endpoint URLs**
- **Claims gate enforcement** (require Sandata ACK)

---

### Phase 4 — Billing/RCM & Payroll (Month 3-6, Revenue Cycle)

**Goal:** Automate claims, payments, payroll, **with EVV-claim matching**.

**Deliverables:**
- 837 claims generation (export to clearinghouse)
- **Claims pre-validation** (check Sandata ACK before submission, block if missing)
- 835 remittance processing (auto-post payments)
- Denial workflow (flag reasons, correct, resubmit)
- **EVV mismatch tracking** (alert if claim denied due to missing EVV)
- Payroll integration (sync hours, bonuses, deductions with ADP/Gusto)
- Annual bonus calculator (scaffolding for December payout)

**Acceptance:**
- First clean claim cycle (claims submitted, paid, tracked in Console)
- **Zero EVV-related claim denials** (across full billing cycle)
- Denial rate improving (baseline established, workflow functional)
- Payroll synced (hours from EVV flow to payroll without manual entry)
- **Claims readiness report working** (shows billable visits with Sandata ACK)

**Configuration:**
- Payer-specific rules (service codes, modifiers)
- Auto-resubmit rules (for certain denial codes)
- **Claims gate threshold** (e.g., require ≥98% Sandata acceptance before submitting 837)

---

### Phase 5 — Analytics & AI Optimization (Month 6+, Scale & Insights)

**Goal:** Full visibility, predictive intelligence, continuous improvement.

**Deliverables:**
- Executive dashboards (KPIs for leadership, **including EVV health**)
- Pod scorecards (Tier 2-3 KPIs visible, **including Sandata acceptance rate**)
- OT insights (cost vs. new hire analysis)
- Predictive alerts (turnover risk, credential lapses, **EVV compliance trends**)
- Quarterly access reviews (automated report generation)
- **Weekly EVV Health Report** (success %, mean time to fix, top error codes)

**Acceptance:**
- Leadership can see real-time KPIs without asking for reports
- Pod Leads see their scorecard (transparent, motivating)
- Compliance reviews completed on schedule (no manual chasing)
- **EVV health dashboard live** (Pod Leads can drill into rejection codes)

**Configuration:**
- Which KPIs visible to which roles
- Alert thresholds (e.g., alert if continuity <85%, Sandata acceptance <98%)

---

## 9) Data & UX Specs (For Claude: Key Entities)

### Universal Audit Events Table

**Purpose:** Single source of truth for all system changes, enabling compliance queries like "show me all changes touching caregiver X" without complex joins.

```typescript
interface AuditEvent {
  event_id: string; // UUID
  timestamp: timestamp;
  
  // Who
  actor_user_id: string;
  actor_role: string;
  actor_ip: string;
  
  // What
  action: 'create' | 'read' | 'update' | 'delete' | 'config_change' | 'access_granted' | 'access_revoked' | 'sandata_submit' | 'sandata_ack' | 'sandata_error';
  entity_type: 'patient' | 'caregiver' | 'pod' | 'visit' | 'spi_snapshot' | 'config_parameter' | 'user' | 'sandata_transaction';
  entity_id: string; // ID of the affected entity
  
  // Details
  changes: jsonb; // Before/after values for updates
  reason?: string; // Justification (required for break-glass, major config changes)
  
  // Classification
  data_classification: 'public' | 'hr_sensitive' | 'phi';
  requires_notification: boolean; // True for breach-reportable events
  
  // Immutability
  hash: string; // SHA-256 of event, chained to previous event for tamper detection
}
```

**Usage Examples:**
- "Show all PHI access by user X in the last 30 days"
- "Show all changes to patient Y (across pods, caregivers, visits, notes)"
- "Generate quarterly access review report"
- **"Show all Sandata submissions for visit Z (including retries)"**

---

### EVV Visit (Console, PHI + Sandata Sync)

```typescript
interface EVVVisit {
  visit_id: string;
  patient_id: string;
  caregiver_id: string;
  pod_id: string;
  
  // Scheduling
  scheduled_start: timestamp;
  scheduled_end: timestamp;
  service_code: string; // HCPCS for Ohio Medicaid
  
  // 6 Federal Elements (required for EVV compliance)
  service_type: string; // Personal care, homemaking, etc.
  recipient_name: string; // Patient
  service_date: date;
  service_location: {
    address: string;
    latitude: float;
    longitude: float;
  };
  caregiver_name: string;
  clock_in: timestamp;
  clock_out: timestamp;
  
  // Validation
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors: string[]; // e.g., ["GPS out of geofence", "Late clock-in"]
  geofence_radius_miles: float; // Configurable
  
  // Sandata Sync
  sandata_transaction_id?: string; // After submission
  sandata_status: 'not_submitted' | 'pending' | 'accepted' | 'rejected';
  sandata_submitted_at?: timestamp;
  sandata_response_at?: timestamp;
  sandata_error_code?: string; // If rejected
  sandata_retry_count: number; // Default 0
  
  // Billing
  billable: boolean; // True only if valid AND sandata_status = 'accepted'
  claim_id?: string; // After claim generation
  
  // Audit
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

### Sandata Transaction (Console, Audit Trail)

```typescript
interface SandataTransaction {
  transaction_id: string; // UUID (also stored in Sandata for idempotency)
  feed_type: 'individuals' | 'employees' | 'visits';
  entity_id: string; // patient_id, caregiver_id, or visit_id
  
  // Request
  request_payload: jsonb; // Full JSON sent to Sandata
  request_timestamp: timestamp;
  
  // Response
  response_status: 'pending' | 'ack' | 'error' | 'timeout';
  response_code?: string; // Sandata's ACK/ERR code
  response_payload?: jsonb; // Full response from Sandata
  response_timestamp?: timestamp;
  
  // Retry
  retry_count: number;
  max_retries: number; // Configurable (default 3)
  next_retry_at?: timestamp; // For exponential backoff
  
  // Resolution
  resolved: boolean; // True if accepted or permanently failed
  resolved_at?: timestamp;
  resolved_by?: string; // User who manually fixed and resubmitted
  
  // Audit
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

### Applicant (Public Surface)

```typescript
interface Applicant {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'HHA' | 'LPN' | 'RN';
  availability: 'Full-Time' | 'Part-Time' | 'PRN';
  has_license: boolean; // Self-reported, not verified yet
  resume_url?: string; // Optional upload
  consent_given: boolean;
  applied_at: timestamp;
  status: 'New' | 'Reviewed' | 'Interview Scheduled' | 'Hired' | 'Rejected';
}
```
**No SSN, no PHI, no background check data on public surface.**

---

### Employee (Console)

```typescript
interface Employee {
  id: string;
  applicant_id?: string; // If came through Careers site
  pod_id: string; // Always assigned to a pod
  role: 'HHA' | 'LPN' | 'RN' | 'Pod Lead' | 'Admin';
  
  // Identity
  name: string;
  email: string;
  phone: string;
  
  // HR-Sensitive (encrypted with hr_master_key, restricted access)
  ssn_encrypted: string; // AES-256
  tax_docs: object; // W-4, I-9
  background_check: object;
  
  // Credentials
  licenses: License[];
  certifications: Certification[];
  
  // Performance
  spi_current: number; // 0-100
  spi_rolling_12mo: number;
  
  // Rewards
  earned_ot_eligible: boolean;
  serenity_star: ('Bronze' | 'Silver' | 'Gold')[];
  annual_bonus_projected: number;
  
  // Sandata Sync
  sandata_employee_id?: string; // Sandata's identifier (if different from Serenity UUID)
  sandata_last_synced: timestamp;
  
  // Audit
  created_at: timestamp;
  updated_at: timestamp;
  last_login: timestamp;
}

interface License {
  type: 'HHA' | 'LPN' | 'RN';
  number: string;
  state: string;
  issued_date: date;
  expiration_date: date;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}
```

---

### Patient (Console, PHI - encrypted with phi_master_key)

```typescript
interface Patient {
  id: string;
  pod_id: string; // Always assigned to a pod
  
  // Demographics
  name: string;
  dob: date;
  address: string;
  phone: string;
  emergency_contact: object;
  
  // Clinical
  diagnoses: string[];
  medications: string[];
  allergies: string[];
  
  // Authorization
  payer: 'Medicaid' | 'Medicare' | 'Private';
  medicaid_id?: string; // REQUIRED for Sandata Individuals feed
  auth_number: string;
  authorized_hours: number; // Per week or month
  effective_date: date;
  end_date: date;
  
  // Care Team
  primary_caregiver_id: string;
  secondary_caregiver_id?: string;
  pod_lead_id: string;
  
  // Sandata Sync
  sandata_client_id?: string; // Sandata's identifier (if different from Serenity UUID)
  sandata_last_synced: timestamp;
  sandata_sync_required: boolean; // True if Medicaid patient needing sync
  
  // Audit
  created_at: timestamp;
  updated_at: timestamp;
  continuity_score: number; // % of visits with same caregiver
}
```

---

### Pod (Console)

```typescript
interface Pod {
  id: string;
  name: string; // e.g., "Pod-1", "Pod-2 (Dayton)"
  lead_user_id: string; // Pod Lead
  status: 'Active' | 'Forming' | 'Split Pending' | 'Inactive';
  
  // Metrics
  patient_count: number;
  caregiver_count: number;
  target_size: number; // Default 35, configurable
  max_size: number; // Default 40, configurable
  
  // KPIs (computed)
  evv_compliance_pct: number;
  sandata_acceptance_pct: number;
  continuity_pct: number;
  visit_coverage_pct: number;
  claims_readiness_pct: number; // % of visits with Sandata ACK
  
  // Audit
  created_at: timestamp;
  split_from_pod_id?: string; // If created via split
  split_date?: timestamp;
}
```

---

### SPI Snapshot (Console)

```typescript
interface SPISnapshot {
  user_id: string;
  month: string; // YYYY-MM
  
  // Components (0-100 each)
  attendance_score: number;
  quality_score: number;
  documentation_score: number; // Includes Sandata acceptance rate
  collaboration_score: number;
  learning_score: number;
  
  // Composite
  spi_score: number; // Weighted average
  
  // Eligibility
  earned_ot_eligible: boolean;
  
  // Audit
  computed_at: timestamp;
  manual_override?: boolean; // If admin adjusted
  override_reason?: string;
}
```

---

### Configuration (Admin)

```typescript
interface ConfigParameter {
  key: string; // e.g., 'spi_attendance_weight', 'sandata_retry_limit'
  category: 'SPI' | 'Pods' | 'OT' | 'Bonus' | 'OnCall' | 'Compliance' | 'AltEVV';
  
  // Display
  label: string; // e.g., "Attendance Weight (%)", "Sandata Retry Limit"
  help_text: string; // e.g., "How much attendance affects SPI score"
  
  // Value
  value_type: 'number' | 'boolean' | 'string' | 'enum';
  current_value: any;
  default_value: any;
  
  // Validation
  min_value?: number;
  max_value?: number;
  enum_options?: string[]; // For dropdown
  
  // Governance
  change_threshold: 'minor' | 'moderate' | 'major'; // Based on % change
  requires_approval_from: string[]; // Role names
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string[];
  
  // History
  effective_date: timestamp;
  previous_values: ConfigHistory[];
  
  // Audit
  last_updated_by: string;
  last_updated_at: timestamp;
}

interface ConfigHistory {
  value: any;
  effective_date: timestamp;
  updated_by: string;
  approved_by?: string[];
  reason?: string; // Optional justification
}
```

---

### Feature Flag (Admin)

```typescript
interface FeatureFlag {
  key: string; // e.g., 'oncall_dispatch_ui', 'claims_gate_by_evv'
  name: string; // e.g., "On-Call Dispatch", "Claims Gate (EVV Required)"
  description: string;
  
  // Activation
  status: 'Hidden' | 'Enabled' | 'Beta';
  auto_enable_conditions?: string; // e.g., "active_pods >= 2", "sandata_certified = true"
  manual_override: boolean; // Admin can force enable
  
  // Access
  enabled_for_roles?: string[]; // e.g., ['admin', 'director_of_ops']
  enabled_for_users?: string[]; // Specific user IDs for beta testing
  
  // Audit
  enabled_at?: timestamp;
  enabled_by?: string;
}
```

---

### UX Principles (For Claude: Build This Way)

**For Non-Technical Users:**
- **Plain language labels:** "How many days before license expires?" (not `credential_expiration_alert_days`)
- **Inline help:** Hover tooltips, "Learn more" links
- **Visual feedback:** "Saving...", "Saved ✓", "Error: X"
- **Confirmation prompts:** "This will affect 47 caregivers. Continue?"
- **Range validation:** Can't set pod size to 5 or 500 (system suggests 30-45)
- **Approval workflows:** Multi-step forms for changes requiring approvals

**For Mobile (Caregivers):**
- **Large touch targets:** Buttons ≥44px
- **Minimal typing:** Checkboxes, dropdowns, voice input where possible
- **Offline-first:** EVV clock-in works without internet, syncs to Sandata later
- **Clear status:** "You're clocked in", "Visit submitted ✓", **"Synced to Sandata ✓"**
- **Error recovery:** "GPS signal weak — move closer to window and retry"

**For Dashboards (Pod Leads, Leadership):**
- **Information hierarchy:** Most urgent at top
- **Color coding:** Green (good), yellow (attention), red (urgent)
- **One-click actions:** "Approve", "Dispatch", "Contact", **"Fix & Resend to Sandata"**
- **Drill-down:** Click KPI to see details (e.g., click "Sandata 96%" to see rejection codes)

**For Morning Check-In (Pod Leads):**
- **Sandata status indicators:**
  - ✅ Green: Visit accepted by Sandata, billable
  - 🟡 Yellow: Visit pending (submitted, awaiting ACK)
  - 🔴 Red: Visit rejected by Sandata (needs correction)
  - ⚫ Gray: Visit not submitted yet (missing required fields)

---

## 10) SOPs (Living Documents, Maintain Separately)

**Concept:** Manifesto defines **what**; SOPs define **how**.

**Create 1-Pagers for:**

1. **Create a New Pod (Split & Seed)**
2. **Morning Check-In & Coverage Gap**
3. **Reassigning Patients (Continuity First)**
4. **Earned Overtime Eligibility**
5. **Serenity Star & Annual Bonus**
6. **Incident & Breach Playbook**
7. **Fix & Resend Rejected EVV Visit**
   - When: Visit rejected by Sandata (red flag in Morning Check-In)
   - Steps: 
     1. Click "Fix & Resend" in Console
     2. Form pre-populates with bad fields highlighted
     3. Correct errors (e.g., add missing Medicaid ID, fix GPS coordinates)
     4. Click "Resubmit" (uses same transaction ID)
     5. Confirm Sandata ACK within 1 hour
   - Escalation: If rejected again, alert Compliance + DoO
8. **Daily Sandata Reconciliation**
   - When: Every morning at 8 AM (automated report)
   - Who: RCM + Compliance review
   - What: Serenity visit count vs. Sandata accepted count, error list
   - Action: Fix any discrepancies same-day (block claims if needed)

---

## 11) KPIs & Cadence

### Daily:
- **EVV reconciliation** (Serenity visits vs. Sandata acceptance, flag errors)
- **EVV backlog:** Must be 0 visits pending >24 hours **(CRITICAL SLO)**
- Morning Check-In (expected visits, coverage gaps, **Sandata sync status**)

### Weekly:
- **Continuity %** — Same caregiver for repeat visits
- **Visit Coverage %** — Scheduled visits completed
- **EVV Compliance %** — Visits with valid EVV
- **Sandata Acceptance %** — Visits accepted by Aggregator
- **Claims Readiness %** — Billable visits with Sandata ACK
- **Late/No-Show List** — Staff requiring follow-up
- **Coverage Gaps** — No-shows and resolution time
- **On-Call Response Time** — Dispatch to en route
- **Top 5 Sandata Error Codes** — Remediation plan

### Monthly (HR):
- **SPI Updates** — Auto-calculated, reviewed, coaching initiated
- **Serenity Star Awards** — Quarterly recognition
- **Earned OT Eligibility** — Auto-checked, paused/unpaused
- **Credential Freshness** — Expiring licenses flagged
- **Sandata Error Analysis** — Rejection rate trends, caregiver outliers

### Monthly (Finance/RCM):
- **Clean Claim %** — Claims submitted without errors
- **EVV-Matched Claim %** — Claims with Sandata ACK (should be 100%)
- **Denial Reasons** — Top 5, corrective actions
- **DSO (Days Sales Outstanding)** — Time to payment
- **Payroll Variances** — Budget vs. actual

### Quarterly (Exec):
- **Retention** — 90-day caregiver retention rate
- **OT Economics** — Cost of OT vs. cost of new hire
- **Compliance Score** — Composite (EVV, credentials, access reviews, incidents, **Sandata acceptance**)
- **Audit Readiness** — Can we pass a surprise audit today? (Yes/No)
- **Sandata Certification Status** — Current, expiring, or renewal needed

---

## 12) What We Want from Claude (The Builder)

**Tone: You own the technical design. We trust you. Be pragmatic.**

### Your Responsibilities:

1. **Gap Analysis**
   - Review existing repo (if any)
   - Map what's built vs. this blueprint
   - Identify reusable modules

2. **Non-Duplicative Build Plan**
   - Phase 1-2: Public + Careers + HR Onboarding + **Alt-EVV Individuals/Employees feeds** (fast, 6-8 weeks)
   - Phase 3-5: Scheduling, EVV, **Alt-EVV Visits feed + Certification**, Billing, Analytics (staged)
   - Re-use code where possible (don't rebuild authentication, audit logs, etc.)

3. **Domain Separation (Non-Negotiable)**
   - Public / Console / Admin enforced at infrastructure layer
   - PHI never in public database
   - Separate encryption keys for HR vs. PHI (quarterly rotation)
   - **Sandata credentials secured separately** (API keys rotated quarterly)
   - Separate repos? Monorepo? Your call, but separation must be clear

4. **Configuration-First Architecture**
   - Every operational parameter in `config_parameters` table
   - Admin UI for tuning (no code changes needed)
   - Validation, preview, and approval workflows before saving
   - **Include all Alt-EVV parameters** (geofence, tolerance, retry limits, claims gate)

5. **Universal Audit System**
   - Implement `audit_events` table as single source of truth
   - All writes (to any entity) create an audit event
   - **Include Sandata submissions/responses in audit trail**
   - Support complex compliance queries without joins

6. **Feature Flag System**
   - Progressive activation (e.g., On-Call Dispatch at 2+ pods, **Claims Gate at Sandata certification complete**)
   - Manual override for testing
   - Audit trail (who enabled what when)

7. **Mock Data Seeding (Phase 0)**
   - 10 caregivers, 3 pods, 30 patients, 2 weeks EVV history
   - Mix of perfect/good/problematic scenarios
   - **Include mock Sandata transactions** (ACKs, errors, retries)
   - Enables KPI demos before live operations

8. **Alt-EVV Integration (Revenue-Critical)**
   - Implement Ohio Sandata Alt-EVV integration per v4.3 spec (Appendix D)
   - Three feeds: Individuals, Employees, Visits (REST/JSON)
   - Real-time validation (6 elements, geofence, time tolerance)
   - **VisitKey immutability:** Deterministic hash, corrections reference prior key
   - **GPS/time integrity:** NTP sync, device drift detection, spoofing flags
   - **Rounding policy:** Nearest 6 minutes, authorization over-unit blocking
   - Idempotent retries with exponential backoff
   - Queue design (Bull/Redis with dead-letter queue)
   - Complete Sandata Certification Test Plan in sandbox
   - Deliver certification evidence packet (see Appendix E)
   - Production cutover with 7-day monitoring
   - Daily reconciliation report (0 backlog >24h)
   - Error correction workflow ("Fix & Resend" UI)
   - **Error taxonomy wired to alerting** (PagerDuty/Slack integration)

9. **CI/CD & IaC**
   - Propose: Minimal steps to deploy public + console with SSL, monitoring, backups
   - Terraform? CloudFormation? Pulumi? Your choice
   - DR runbook: How to restore from backup in <4 hours
   - Automated quarterly key rotation (HR, PHI, **Sandata API keys**)

10. **Test Plan**
    - Unit tests for critical logic (SPI calc, bonus formula, EVV validation, **Sandata payload formatting**)
    - E2E tests for workflows (careers intake, onboarding, "No EVV → No Pay", **Alt-EVV certification test cases**)
    - Load tests for scale (simulate 100 pods, 1000 users, **250 visits/day → Sandata**)
    - Security tests (pen test ready, OWASP Top 10 coverage)

11. **Pre-Build Deliverables (REQUIRED BEFORE CODE)**
   - **Certification Packet Folder** (3 documents - see Appendix E):
     1. Cover Sheet: Org info, contacts, HIPAA controls, EVV policy
     2. Field Mapping Workbook: Serenity → Ohio v4.3 with validation rules
     3. Test Evidence Index: Test cases, JSON samples, screen recordings
   - **Mini API Contracts** (Markdown):
     - `/alt-evv/individuals` request/response schemas
     - `/alt-evv/employees` request/response schemas
     - `/alt-evv/visits` request/response schemas with retry semantics
   - **Monitoring Runbook** (1 page): Alert definitions, ownership, triage steps
   - **Mobile UX Flows** (wireframes): Clock-in success, weak GPS, offline mode, error handling

### Decision Authority:

✅ **You decide:**
- Technology stack (React vs. Vue, Node vs. Python, PostgreSQL vs. MySQL)
- Directory structure, module organization
- Third-party libraries (as long as licenses are compatible)
- API design (REST vs. GraphQL, endpoint naming)
- Encryption implementation (as long as AES-256 at rest, TLS 1.3 in transit)
- **Queue/retry mechanism for Sandata** (Bull/SQS/custom)
- **Sandata transaction ID generation strategy** (UUID v4 recommended)

❌ **You consult us on:**
- Data privacy decisions (where PHI is stored, who has access)
- Compliance-critical flows (EVV validation, audit logs, breach notification, **Sandata sync**)
- UI/UX for non-technical users (show us mockups or interactive prototypes)
- Major architectural decisions (monorepo vs. separate repos, key management approach)
- **Alt-EVV field mappings** (Medicaid ID handling, GPS precision, service code sets)
- **Certification test evidence** (share packet before submitting to Sandata)
- **Production cutover plan** (staged rollout vs. big-bang for Sandata)

### Communication Preferences:

- **Progress updates:** Daily commits with clear messages
- **Blockers:** Flag immediately (don't wait for weekly check-in)
- **Choices:** Propose 2-3 options with pros/cons (we'll decide in <24 hours)
- **Documentation:** As you build (README, inline comments, architecture diagrams)
- **Sandata milestones:** Weekly updates on certification progress (sandbox tests passing, errors resolved)

### Quality Bar:

- **Security:** No hardcoded secrets, all PHI/HR encrypted with separate keys, audit trails immutable, **Sandata API keys in Secrets Manager**
- **Configurability:** Operational parameters in Admin UI, not code
- **Maintainability:** Another engineer should understand your code in <30 minutes
- **Simplicity:** Prefer boring technology over clever hacks
- **Compliance:** HIPAA-ready from Day 1 (audit trails, encryption, access controls)
- **Resilience:** Sandata integration must handle: network failures, rate limits (429), server errors (5xx), schema validation errors

---

## 13) Claude Build Plan Deliverable (REQUIRED BEFORE CODE)

**Before writing any code, Claude must submit a 5-page "Build Plan v1" covering:**

### Section 1: Interpretation & Scope (1 page)
- Your understanding of the pod model, SPI system, and compliance requirements
- **Your understanding of Alt-EVV architecture and Sandata integration criticality**
- Which features are Phase 0 vs. Phase 1-5
- **Alt-EVV phasing:** When Individuals/Employees/Visits feeds go live, certification timeline
- Any ambiguities or questions needing clarification

### Section 2: Technical Architecture (1.5 pages)
- Proposed stack (frontend, backend, database, infrastructure)
- Domain separation approach (Public/Console/Admin)
- Key management strategy (separate keys for HR/PHI, **Sandata API keys**, rotation automation)
- Audit system design (how `audit_events` integrates with all modules, **including Sandata transactions**)
- Mock data seeding strategy (including **mock Sandata ACKs/errors**)
- **Alt-EVV integration approach:**
  - Three-feed architecture (Individuals, Employees, Visits)
  - Queue design (Bull/Redis? SQS?) with retry/backoff
  - Idempotency strategy (Sandata transaction ID storage)
  - Mobile offline sync (how visits persist without network)
  - Claims pre-validation (how EVV match prevents denials)
  - Error handling (retry logic, escalation paths)
- **VisitKey generation algorithm** (deterministic hash with collision handling)
- **GPS/time integrity implementation** (NTP client, device drift detection, spoofing flags)
- **Rounding engine** (6-minute intervals, authorization enforcement)
- **Error taxonomy** (schema, business, rate, transport) with alerting rules
- **Secrets management** (Sandata API keys per environment, rotation schedule)
- **Mobile hardening** (OS version requirements, root/jailbreak detection, encryption)

### Section 3: Pre-Build Checklist Completion (1 page)
- Status of RED items (code tables, mapping workbook, Sandata BAA)
- Status of YELLOW items (GPS controls, rounding policy, consent copy, BAA inventory)
- Any blockers requiring Gloria/Bignon decision
- Proposed timeline to clear RED items (must be before Phase 3)

### Section 4: 60-Day Milestones (1 page)
- Week-by-week deliverables for Phase 0-1
- **Week 1:** Sandata registration + sandbox setup
- **Week 2-4:** Build Individuals + Employees feeds (sandbox testing)
- **Week 4-6:** Build Visits feed + Certification Test Plan execution
- **Week 6-7:** Sandata approval + production cutover
- Acceptance criteria for each milestone
- Risk areas and mitigation plans (including **Sandata certification delays, API changes**)
- Estimated effort (hours or story points)

### Section 5: Risk Register (0.5 pages)
- Top 5 technical risks (e.g., "Sandata API v4.3 changes during build")
- Top 5 operational risks (e.g., "Certification test failures due to GPS accuracy")
- Mitigation strategy for each
- Contingency plans (e.g., "Manual Sandata entry for first 30 days if certification delayed")

**Format:** PDF or Markdown, delivered in 72 hours after receiving this manifesto.

**Purpose:** Ensures alignment before significant engineering investment.

---

## 14) Plain-English Staff Summary (Post on Bulletin Board)

**Welcome to Serenity Care Partners!**

Here's how we work:

🌿 **Pods:** You're part of a small team (~35 patients) so you know your clients and coworkers personally.

📊 **SPI (Serenity Performance Index):** We track your attendance, quality, documentation, teamwork, and learning. Keep it strong and you'll unlock benefits.

⏰ **Earned Overtime:** If your SPI is ≥80 and you have no complaints, you can pick up extra shifts (up to 16 hours/day). More hours = more pay + bigger annual bonus.

🚨 **Coverage Team:** If you can't make a shift, tell us early. Our On-Call Team will cover so patients never miss care.

⭐ **Recognition:** Great work earns Serenity Stars (quarterly bonuses) and an annual performance bonus (paid June & December).

📱 **Tech:** We use a simple app for clock-in/out (EVV). It tracks your location to confirm you're at the right place. **Your visits automatically sync to Ohio's system so we can bill Medicaid — you never have to enter anything twice.** No EVV = no pay (Medicaid rule, not our choice).

🤝 **Culture:** We run on trust, simplicity, and excellence. Systems help us keep care human.

---

## Appendix A — Minimal Data Artifacts (For Claude's Reference)

**Note:** These are **illustrative**, not prescriptive. Claude has full authority to design schemas that meet the requirements above.

```sql
-- Universal Audit Events (CRITICAL for compliance)
audit_events (
  event_id UUID PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  actor_user_id UUID NOT NULL,
  actor_role VARCHAR(50),
  actor_ip INET,
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'config_change', 'sandata_submit', 'sandata_ack', 'sandata_error'
  entity_type VARCHAR(50) NOT NULL, -- 'patient', 'caregiver', 'pod', 'visit', 'config_parameter', 'sandata_transaction'
  entity_id UUID NOT NULL,
  changes JSONB, -- Before/after values for updates
  reason TEXT, -- Required for break-glass, major config changes
  data_classification VARCHAR(20), -- 'public', 'hr_sensitive', 'phi'
  requires_notification BOOLEAN DEFAULT FALSE,
  hash VARCHAR(64) NOT NULL, -- SHA-256, chained for tamper detection
  previous_event_hash VARCHAR(64) -- Links to previous event for chain verification
);

-- Pods
pods (
  pod_id UUID PRIMARY KEY,
  name VARCHAR(100),
  lead_user_id UUID,
  status VARCHAR(20), -- 'Active', 'Forming', 'Split Pending'
  target_size INT DEFAULT 35,
  max_size INT DEFAULT 40,
  created_at TIMESTAMP,
  split_from_pod_id UUID
);

-- Patient Assignments (with continuity tracking)
patient_assignments (
  assignment_id UUID PRIMARY KEY,
  patient_id UUID,
  pod_id UUID,
  primary_caregiver_id UUID,
  secondary_caregiver_id UUID,
  effective_date DATE,
  end_date DATE,
  reason_code VARCHAR(50) -- 'Initial', 'Split', 'Request', 'Skills'
);

-- Caregiver Assignments
caregiver_assignments (
  assignment_id UUID PRIMARY KEY,
  caregiver_id UUID,
  pod_id UUID,
  role VARCHAR(20), -- 'HHA', 'LPN', 'RN'
  start_date DATE,
  end_date DATE
);

-- Reassignment Log (immutable audit - consider migrating to audit_events)
reassignment_log (
  log_id UUID PRIMARY KEY,
  entity_id UUID, -- patient_id or caregiver_id
  entity_type VARCHAR(20), -- 'Patient', 'Caregiver'
  from_pod_id UUID,
  to_pod_id UUID,
  continuity_preserved BOOLEAN,
  approver_id UUID,
  reason_note TEXT,
  timestamp TIMESTAMP
);

-- Coverage Gap Log
coverage_gap_log (
  gap_id UUID PRIMARY KEY,
  pod_id UUID,
  patient_id UUID,
  shift_id UUID,
  reason_code VARCHAR(50), -- 'NoShow', 'Late', 'CallOut'
  detected_at TIMESTAMP,
  resolved_by UUID, -- on-call caregiver_id
  response_minutes INT,
  resolution_timestamp TIMESTAMP
);

-- On-Call Pool
oncall_pool (
  caregiver_id UUID PRIMARY KEY,
  license_type VARCHAR(10), -- 'HHA', 'LPN', 'RN'
  status VARCHAR(20), -- 'Available', 'On Assignment', 'Off Duty'
  availability_score FLOAT, -- 0-1, based on response history
  last_call_in TIMESTAMP
);

-- SPI Snapshot
spi_snapshot (
  snapshot_id UUID PRIMARY KEY,
  user_id UUID,
  month VARCHAR(7), -- YYYY-MM
  attendance_score FLOAT,
  quality_score FLOAT,
  documentation_score FLOAT, -- Includes Sandata acceptance rate
  collaboration_score FLOAT,
  learning_score FLOAT,
  spi_score FLOAT, -- Weighted composite
  earned_ot_eligible BOOLEAN,
  computed_at TIMESTAMP,
  manual_override BOOLEAN,
  override_reason TEXT
);

-- Rewards Ledger
rewards_ledger (
  ledger_id UUID PRIMARY KEY,
  user_id UUID,
  type VARCHAR(50), -- 'SerenityStarBronze', 'AnnualBonus', etc.
  amount DECIMAL(10,2),
  period VARCHAR(20), -- 'Q1 2025', '2025', etc.
  status VARCHAR(20), -- 'Pending', 'Paid', 'Forfeited', 'Delayed'
  scheduled_payout_date DATE,
  actual_payout_date DATE,
  delay_interest DECIMAL(10,2) -- Accrued if delayed >30 days
);

-- EVV Visits (includes Sandata sync)
evv_visits (
  visit_id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  caregiver_id UUID NOT NULL,
  pod_id UUID NOT NULL,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  service_code VARCHAR(20), -- HCPCS for Ohio Medicaid
  
  -- 6 Federal Elements
  service_type VARCHAR(50),
  recipient_name VARCHAR(200),
  service_date DATE,
  service_location_address TEXT,
  service_location_lat FLOAT,
  service_location_long FLOAT,
  caregiver_name VARCHAR(200),
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  
  -- Validation
  validation_status VARCHAR(20), -- 'pending', 'valid', 'invalid'
  validation_errors JSONB, -- Array of error messages
  geofence_radius_miles FLOAT,
  
  -- Sandata Sync
  sandata_transaction_id UUID, -- FK to sandata_transactions
  sandata_status VARCHAR(20), -- 'not_submitted', 'pending', 'accepted', 'rejected'
  sandata_submitted_at TIMESTAMP,
  sandata_response_at TIMESTAMP,
  sandata_error_code VARCHAR(50),
  sandata_retry_count INT DEFAULT 0,
  
  -- Billing
  billable BOOLEAN DEFAULT FALSE, -- True only if valid AND sandata_status = 'accepted'
  claim_id UUID,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Sandata Transactions (audit trail for all Sandata interactions)
sandata_transactions (
  transaction_id UUID PRIMARY KEY,
  feed_type VARCHAR(20), -- 'individuals', 'employees', 'visits'
  entity_id UUID NOT NULL, -- patient_id, caregiver_id, or visit_id
  
  -- Request
  request_payload JSONB NOT NULL,
  request_timestamp TIMESTAMP NOT NULL,
  
  -- Response
  response_status VARCHAR(20), -- 'pending', 'ack', 'error', 'timeout'
  response_code VARCHAR(50),
  response_payload JSONB,
  response_timestamp TIMESTAMP,
  
  -- Retry
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMP,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID, -- User who manually fixed
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Configuration Parameters
config_parameters (
  param_id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE, -- 'spi_attendance_weight', 'sandata_retry_limit', 'geofence_radius_miles'
  category VARCHAR(50), -- 'SPI', 'Pods', 'OT', 'AltEVV', etc.
  label VARCHAR(200),
  help_text TEXT,
  value_type VARCHAR(20), -- 'number', 'boolean', 'string', 'enum'
  current_value JSONB,
  default_value JSONB,
  min_value FLOAT,
  max_value FLOAT,
  enum_options JSONB,
  change_threshold VARCHAR(20), -- 'minor', 'moderate', 'major'
  requires_approval_from JSONB, -- Array of role names
  approval_status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  approved_by JSONB, -- Array of user IDs who approved
  effective_date TIMESTAMP,
  last_updated_by UUID,
  last_updated_at TIMESTAMP
);

-- Configuration History
config_history (
  history_id UUID PRIMARY KEY,
  param_id UUID,
  value JSONB,
  effective_date TIMESTAMP,
  updated_by UUID,
  approved_by JSONB, -- Array of approvers
  reason TEXT
);

-- Feature Flags
feature_flags (
  flag_id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE, -- 'oncall_dispatch_ui', 'claims_gate_by_evv', 'sandata_production'
  name VARCHAR(200),
  description TEXT,
  status VARCHAR(20), -- 'Hidden', 'Enabled', 'Beta'
  auto_enable_conditions TEXT, -- SQL or expression, e.g., "sandata_certified = true"
  manual_override BOOLEAN,
  enabled_for_roles JSONB, -- Array of role names
  enabled_for_users JSONB, -- Array of user IDs
  enabled_at TIMESTAMP,
  enabled_by UUID
);

-- Encryption Keys (managed by infrastructure, not application)
encryption_keys (
  key_id UUID PRIMARY KEY,
  key_type VARCHAR(20), -- 'hr_master_key', 'phi_master_key', 'sandata_api_key'
  key_value_encrypted TEXT, -- Encrypted with KMS
  created_at TIMESTAMP,
  rotated_at TIMESTAMP,
  next_rotation_due DATE, -- Quarterly (every 90 days)
  status VARCHAR(20) -- 'active', 'rotating', 'retired'
);
```

---

## Appendix B — Careers Page Content

*(Ready to deploy - standard careers page with job descriptions for HHA, LPN, RN roles)*

---

## Appendix C — Job Posting Templates

*(Indeed, LinkedIn-ready job descriptions with competitive pay ranges and Serenity value proposition)*

---

## Appendix D — Alt-EVV Integration & Certification Plan (Ohio / Sandata)

### Goal
Serenity's ERP/mobile becomes the system of record for EVV. Visits are captured in Serenity, validated in real time, and pushed to the Ohio Sandata Aggregator under the Alt-EVV program. We complete Sandata certification and operate with zero double keying.

### Why This Works in Ohio
ODM explicitly supports Alternate EVV via a published Alt-EVV Interface Specification (Ohio-customized Sandata spec). Once certified, agency providers may use their own EVV and send data to the Sandata Aggregator for claims matching.

### Urgency
Ohio's claims validation is live in phases (started Mar 1, 2025 for home health) — **no EVV match = claim denied**. Build to spec and certify before first Medicaid claims.

---

### 0) References (for the devs)

- **Ohio Alt-EVV Interface Spec (latest):** v4.3 (Aug 28, 2025) — REST API, fields & rules
- **Prior specs / change history:** v4.1, Town Hall update (REST endpoints added, field changes)
- **Claims validation timeline & expectations:** ODM announcements & payer guidance
- **Policy backdrop (Cures Act / 6 elements):** federal EVV overview

---

### 1) Workstreams & Milestones

#### W1 — Program Setup (Week 1)

**Tasks:**
- Register as Alt-EVV system with Ohio Sandata
- Request sandbox credentials, testing portal access, latest Alt-EVV spec & Certification Test Plan
- Capture contact paths (EVV hotline, Sandata On-Demand)
- Define Serenity EVV data owners:
  - HR for employees
  - Intake for clients
  - Pod Leads for visits

**Exit Criteria:**
- Sandbox API keys received
- Spec PDFs saved in repo
- Test plan accepted

---

#### W2 — Data Model & Mapping (Week 1–2)

**Tasks:**
- Create canonical Serenity EVV schema (Clients/Individuals, Employees, Visits)
- Map to Ohio fields per v4.3 spec (include codes, enumerations, lengths)
- Decide identifier strategy:
  - `ClientIdentifier` ↔ Serenity patient UUID + stored Medicaid ID (required)
  - `EmployeeIdentifier` ↔ Serenity employee UUID
  - `ProviderID` (ODME) stored centrally for all payloads

**Exit Criteria:**
- Field-level mapping doc with validation rules

---

#### W3 — Build Three Feeds (Week 2–4)

| Feed | Purpose | Triggers | Notes |
|------|---------|----------|-------|
| **Individuals (Clients)** | Load/refresh Medicaid members | Intake create/update | Must include Medicaid ID, demographics, payer/program |
| **Employees** | Load caregivers/nurses | Hire/update/credential change | Role/type fields per spec |
| **Visits** | Send each service visit | Real-time or near-real-time; nightly retry | Must carry the six elements; GPS at clock-in/out; service code/units |

**Design Notes:**
- **Idempotency:** Store Sandata transaction IDs
- **Backpressure:** Queue with retry/backoff on 429/5xx
- **Validation:** Pre-send checks to avoid rejects

**Exit Criteria:**
- All three endpoints post successfully to sandbox with happy-path ACKs

---

#### W4 — Mobile & Console EVV (Week 2–5)

**Caregiver app:**
- Clock-in/out, GPS capture, offline cache → sync
- Show "You're clocked in"/"Visit submitted ✓"

**Console EVV service:**
- Real-time visit validation
- "No EVV → No Pay" flagging for payroll & claims
- Exception dashboard

**Exit Criteria:**
- End-to-end visit from mobile → Console → sandbox Aggregator with ACK

---

#### W5 — Certification Testing (Week 4–6)

**Tasks:**
- Execute Sandata Certification Test Plan (sandbox)
- Capture ACKs and error codes
- Produce test evidence packet for Sandata review

**Exit Criteria:**
- Sandata approval letter
- Production credentials issued

---

#### W6 — Production Cutover (Week 6–7)

**Tasks:**
- Switch to production endpoints & keys
- Enable daily reconciliation job
- Enable claims matching prep

**Exit Criteria:**
- Production flow live
- Reconciliation green for 7 consecutive days

---

### 2) Technical Requirements

**API Transport & Security:**
- HTTPS; Sandata REST endpoints per Ohio v4.3
- OAuth/API key per spec
- TLS 1.2+ in transit; AES-256 at rest
- Secrets in Secrets Manager; rotate quarterly

**Payload Highlights (Ohio v4.3):**
- **Individuals:** MedicaidID, First/Last, DOB, Address, PayerProgram
- **Employees:** EmployeeIdentifier, Name, Role/Discipline
- **Visits:** VisitKey, ClientIdentifier, EmployeeIdentifier, ServiceCode, CallIn/CallOut + GPS, Units/Tasks

**Validation Rules (pre-send):**
- 6 elements present
- Medicaid ID format-valid
- Geofence/tolerance (configurable)
- Service codes align with Ohio tables
- **Rounding policy enforced**
- **Authorization check**
- **VisitKey uniqueness**
- **Time sequence**

**Error Handling & Retries:**
- Persist request/response JSON
- Auto-retry for 429/5xx
- No retry for schema errors (surface to Console)
- Correction flow: "Fix & Resend"

**Reconciliation Jobs:**
- Nightly Aggregator check
- Weekly EVV Health Report
- Claims pre-adjudication gate

---

### 3) Testing Strategy

**Certification Cases (must pass):**
- Individuals: create, update, invalid MedicaidID
- Employees: create, update, inactive/terminated
- Visits: create with GPS, update times, cancel, invalid cases

**E2E Tests:**
- Mobile offline sync
- Time drift protection
- Double-visit detection
- "No EVV → No Pay"

**Load & Scale:**
- Simulate 7 pods / 250 visits/day

---

### 4) Go-Live Checklists

**Technical:**
- [ ] Production credentials tested
- [ ] Nightly reconciliation green 7 days
- [ ] Monitoring & alerts wired
- [ ] Backups & key rotation validated

**Operational:**
- [ ] EVV Playbook issued
- [ ] Exception handling SOP
- [ ] Claims team trained on EVV dependencies

---

### 5) Acceptance Criteria

1. Certification approved by Sandata
2. 100% of visits accepted by Aggregator within 24h
3. Zero claim denials for EVV mismatch
4. Staff never key visits in Sandata

---

## Appendix E — Pre-Build Hardening Checklist & Certification Prerequisites

### Purpose
Documents all operational, compliance, and technical prerequisites before Claude begins coding (RED items) or before Sandata certification (YELLOW items).

---

### A) Certification & Compliance Gaps (MUST CLOSE)

#### 1. Sandata BAA on File ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Bignon (COO/CFO) + Compliance

**Action Items:**
- [ ] Execute BAA with Sandata
- [ ] Execute BAAs with clearinghouse, SMS provider, push notification service
- [ ] Store signed copies in Console → Admin → Compliance → Vendor BAAs
- [ ] Set expiration alerts

**Documentation Required:**
- Signed Sandata BAA (PDF)
- BAA tracker spreadsheet

---

#### 2. Alt-EVV Registration Artifacts ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Bignon + Engineering Lead

**Action Items:**
- [ ] Prepare Certification Packet Cover Sheet
- [ ] Submit to Sandata for registration
- [ ] Receive sandbox credentials

**Documentation Required:**
- Cover sheet (PDF)
- Sandata welcome email

---

#### 3. GPS & Time Integrity Controls 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering (Claude)

**Action Items:**
- [ ] NTP sync on all servers
- [ ] Device time drift detection
- [ ] Spoofing detection (Developer Mode, jailbreak, GPS jump)
- [ ] DST & timezone handling (UTC storage)

**Testing Required:**
- [ ] Simulate wrong time → verify drift flag
- [ ] Simulate mock location → verify spoofing flag
- [ ] Test DST transition → verify UTC storage

---

#### 4. Patient Consent & Notices 🟡 YELLOW - PRE-PHASE 2

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** HR + Compliance

**Action Items:**
- [ ] Draft patient consent form (legal review)
- [ ] Add to patient onboarding in Console
- [ ] Store consent timestamp
- [ ] Provide printable PDF copy

**Documentation Required:**
- Final consent form (PDF)
- Legal review confirmation

---

#### 5. EVV Exception Policy (Written) 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Bignon + Compliance

**Action Items:**
- [ ] Document EVV Exception Policy (1-2 pages)
- [ ] Publish in Console → Help → Policies
- [ ] Train Pod Leads

**Documentation Required:**
- EVV Exception Policy (PDF)
- Training completion log

---

#### 6. Data Retention & Right-to-Delete 🟡 YELLOW - PRE-PHASE 1

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Compliance + Engineering

**Action Items:**
- [ ] Document Data Retention Policy
- [ ] Implement automated retention enforcement
- [ ] Legal hold process
- [ ] Right-to-delete procedure

**Documentation Required:**
- Data Retention Policy (PDF)
- Legal hold procedure (SOP)

---

#### 7. Role-based Sandata Views 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + Compliance

**Action Items:**
- [ ] Define GPS visibility roles
- [ ] Implement RBAC checks in Console
- [ ] Audit all GPS data access

**Testing Required:**
- [ ] Login as Pod Lead → verify cannot see raw GPS
- [ ] Login as Compliance → verify can see raw GPS

---

### B) Payload & Mapping Details (MUST LOCK)

#### 1. Code Set Freeze ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** RCM/Billing + Engineering

**Action Items:**
- [ ] Obtain Ohio HCPCS/Modifier tables
- [ ] Create `service_codes` table
- [ ] Add Config UI for service codes
- [ ] Freeze for Phase 3

**Documentation Required:**
- Ohio HCPCS reference table
- Config UI screenshots

---

#### 2. Field Mapping Workbook ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + RCM/Billing

**Action Items:**
- [ ] Create Excel workbook with 3 tabs (Individuals, Employees, Visits)
- [ ] Get RCM sign-off
- [ ] Store in `/docs/certification/`

**Documentation Required:**
- Completed workbook (Excel)
- RCM sign-off email

---

#### 3. Identifiers Crosswalk 🟡 YELLOW - PRE-PHASE 2

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Add `sandata_client_id`, `sandata_employee_id` columns
- [ ] Implement identifier reconciliation
- [ ] Conflict resolver

---

#### 4. VisitKey Strategy ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Implement VisitKey generation (SHA256 hash)
- [ ] Store in `evv_visits` table
- [ ] Immutability enforcement
- [ ] Document design

**Documentation Required:**
- VisitKey design document (Markdown)
- Unit tests for collision handling

---

#### 5. Rounding & Units Policy ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Bignon + Engineering

**Action Items:**
- [ ] Confirm rounding policy (6 minutes)
- [ ] Implement rounding engine
- [ ] Authorization enforcement
- [ ] Configure in Admin
- [ ] Document in EVV Policy

**Documentation Required:**
- Rounding & Units Policy (1 page)
- Config UI screenshot

---

#### 6. Late Adds & Corrections 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + Compliance

**Action Items:**
- [ ] Define late add threshold (>24 hours)
- [ ] Workflow with justification
- [ ] Sandata submission with CorrectionIndicator
- [ ] Monitoring (alert if >5% late adds)

---

### C) Error Handling, Monitoring, and SLOs

#### 1. Error Taxonomy ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Define error categories (Schema, Business, Rate, Transport)
- [ ] Implement classification logic
- [ ] Retry logic with Bull queue

**Documentation Required:**
- Error taxonomy table (Markdown)
- Retry flowchart

---

#### 2. Operational SLOs 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + Operations

**Action Items:**
- [ ] Define SLOs (EVV → ACK <4hr, 0 backlog >24hr, acceptance ≥98%)
- [ ] Implement monitoring dashboard
- [ ] Escalation rules

**Documentation Required:**
- SLO definitions (1 page)
- Dashboard screenshot (after build)

---

#### 3. Alerting ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Choose alerting platform (PagerDuty/Slack)
- [ ] Configure alerts (queue depth, 429, 5xx, acceptance rate, corrections)
- [ ] Test in staging

**Documentation Required:**
- Alert configuration (YAML/Terraform)
- Runbook for each alert

---

#### 4. Monitoring Runbook ⚠️ RED - BLOCKING

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + Operations

**Action Items:**
- [ ] Create 1-page runbook per alert
- [ ] Store in `/docs/runbooks/`
- [ ] Link from alerting system

**Documentation Required:**
- Monitoring runbooks (~5 pages total)

---

#### 5. Safety Rails - Kill Switch 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Implement "Pause Sandata Submissions" toggle
- [ ] Configure in feature flags
- [ ] Test toggle on/off

**Documentation Required:**
- Kill switch SOP (1 page)

---

### D) Security & Privacy Tightening

#### 1. Secrets & Keys 🟡 YELLOW - PRE-PHASE 1

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + DevOps

**Action Items:**
- [ ] Configure Secrets Manager
- [ ] Store keys per environment
- [ ] Quarterly rotation (automated)
- [ ] Access logging

---

#### 2. PII/PHI Minimization in Logs 🟡 YELLOW - PRE-PHASE 1

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Implement automatic redaction
- [ ] Application log regex patterns
- [ ] "Inspect (Privileged)" UI

---

#### 3. Mobile App Hardening 🟡 YELLOW - PRE-PHASE 2

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering (Mobile)

**Action Items:**
- [ ] Require device security
- [ ] Detect compromised devices
- [ ] Session management (15-min TTL)
- [ ] Secure storage

---

#### 4. Audit Chain Verification 🟡 YELLOW - PRE-PHASE 1

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering

**Action Items:**
- [ ] Implement hash chain
- [ ] Weekly verification job
- [ ] Store verification results

---

### E) UX Edge Cases

#### 1. Clock-in at Doorway vs. Apartment 🟡 YELLOW - PRE-PHASE 2

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering (Mobile) + UX

**Action Items:**
- [ ] UI guidance for GPS signal
- [ ] Photo proof fallback (configurable)

---

#### 2. No Cell Service - Offline Mode 🟡 YELLOW - PRE-PHASE 2

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering (Mobile)

**Action Items:**
- [ ] Offline capture in SQLite/Realm
- [ ] Auto-sync on connectivity

---

#### 3. Address Geocoding Drift 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + Operations

**Action Items:**
- [ ] Admin override (map pin drag)
- [ ] Store facility geofence override

---

#### 4. Service Substitutions 🟡 YELLOW - PRE-PHASE 3

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + RCM

**Action Items:**
- [ ] On-the-spot service code swap
- [ ] Authorization validation
- [ ] Audit logging

---

### F) Claims-Readiness Gate

#### Claims Pre-Validation ⚠️ RED - PRE-PHASE 4

**Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Owner:** Engineering + RCM/Billing

**Action Items:**
- [ ] Implement claims gate in Billing module
- [ ] UI: "Claims Readiness Report"
- [ ] Configuration for enforcement level
- [ ] Managed care quirks (plan-specific rules)

**Testing Required:**
- [ ] Submit visit without ACK → block claim → verify
- [ ] Fix EVV → retry claim → verify accepted

**Documentation Required:**
- Claims gate architecture (flowchart)

---

## What to Hand Claude Right Now - CONSOLIDATED DELIVERABLES

**Before Claude writes any code, Serenity must provide:**

### 1. Certification Packet Folder (3 documents)

**Location:** `/docs/certification/`

#### a) Cover Sheet (`Certification_Cover_Sheet.pdf`)
- Legal entity: Serenity Care Partners LLC
- ODME Provider ID: [TBD]
- Tax ID (EIN): [TBD]
- NPI: [TBD if applicable]
- Primary contacts

#### b) Field Mapping Workbook (`Sandata_Field_Mapping_v4.3.xlsx`)
- **Status:** 🔴 RED - BLOCKING
- **Contents:** 3 tabs (Individuals, Employees, Visits) with all field mappings

#### c) Test Evidence Index (`Test_Evidence_Index.md`)
- **Status:** Created during Phase 3
- **Contents:** Test case table, JSON files, screen recordings

---

### 2. Mini API Contracts (Markdown files)

**Location:** `/docs/api/`

- `Individuals_API.md` - Request/response schemas
- `Employees_API.md` - Request/response schemas
- `Visits_API.md` - Request/response schemas with idempotency

---

### 3. Monitoring Runbook (1 page per alert)

**Location:** `/docs/runbooks/`

Example runbooks for:
- Queue Depth Alert
- 429 Burst
- 5xx Streak
- Acceptance Rate <95%
- Corrections Spike
- API Unreachable

---

### 4. Mobile UX Flows (Wireframes or Screenshots)

**Location:** `/docs/ux/`

**Required Flows:**
- Clock-In Success
- Weak GPS
- Offline Mode
- Visit Rejected
- Fix & Resend

---

## GREEN / YELLOW / RED Status Tracker

| # | Item | Status | Owner | Due Date | Notes |
|---|------|--------|-------|----------|-------|
| **RED ITEMS (BLOCKING)** |
| 1 | Sandata BAA signed | 🔴 Not Started | Bignon | Week 1 | |
| 2 | Alt-EVV Registration | 🔴 Not Started | Bignon | Week 1 | |
| 3 | Ohio HCPCS tables | 🔴 Not Started | RCM | Week 2 | |
| 4 | Field mapping workbook | 🔴 Not Started | Claude | Week 3 | |
| 5 | VisitKey design | 🔴 Not Started | Claude | Week 2 | |
| 6 | Rounding/units policy | 🔴 Not Started | Bignon | Week 1 | |
| 7 | Error taxonomy + alerts | 🔴 Not Started | Claude | Week 4 | |
| 8 | Monitoring runbooks | 🔴 Not Started | Claude | Week 4 | |
| **YELLOW ITEMS (PRE-PHASE 3)** |
| 9 | GPS/time integrity | 🟡 Not Started | Claude | Week 6 | |
| 10 | Patient consent form | 🟡 Not Started | HR | Week 4 | |
| 11 | EVV Exception Policy | 🟡 Not Started | Bignon | Week 5 | |
| 12 | Data retention policy | 🟡 Not Started | Compliance | Week 3 | |
| 13 | Role-based Sandata views | 🟡 Not Started | Claude | Week 6 | |
| 14 | BAA inventory | 🟡 Not Started | Compliance | Week 2 | |
| 15 | Secrets management | 🟡 Not Started | Claude | Week 2 | |
| 16 | Log redaction | 🟡 Not Started | Claude | Week 3 | |
| 17 | Mobile hardening | 🟡 Not Started | Claude | Week 5 | |
| 18 | Audit chain verification | 🟡 Not Started | Claude | Week 3 | |
| 19 | UX edge cases | 🟡 Not Started | Claude | Week 5 | |
| **GREEN ITEMS (READY)** |
| 20 | Config-first architecture | ✅ Ready | Complete | N/A | |
| 21 | RACI matrix | ✅ Ready | Complete | N/A | |
| 22 | Audit chain design | ✅ Ready | Complete | N/A | |
| 23 | "No EVV → No Pay" model | ✅ Ready | Complete | N/A | |
| 24 | Claims gate architecture | ✅ Ready | Complete | N/A | |
| 25 | Queue/retry design | ✅ Ready | Complete | N/A | |
| 26 | SOPs documented | ✅ Ready | Complete | N/A | |

---

## Summary of Changes from v2.2 → v2.3

✅ **Added:** Appendix E (Pre-Build Hardening Checklist) — 30+ items

✅ **Added:** Production Readiness Status Tracker

✅ **Enhanced:** Section 7.3 with VisitKey, GPS integrity, rounding, multi-visit rules

✅ **Enhanced:** Section 9.4 with critical SLO (0 backlog >24h)

✅ **Enhanced:** AI Guardrails with dual-approval for EVV alterations

✅ **Enhanced:** Section 12 with pre-build deliverables list

✅ **Enhanced:** Section 13 expanded to 5 pages with risk register

✅ **Updated:** Appendix D with security hardening

✅ **Added:** Consolidated deliverables section

✅ **Added:** Status tracker table (26 items)

---

**Status:** Production-ready with all prerequisites identified, categorized, and tracked.

**Next Steps:**
1. Bignon: Clear RED items — Target: Week 1-2
2. Claude: Review manifesto, submit 5-page Build Plan — Target: 72 hours
3. Team: Weekly status review — Every Friday
4. Go/No-Go for Phase 1: When all RED items = ✅

**Ready to hand to Claude for Build Plan generation.** 🚀
```
