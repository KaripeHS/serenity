# Serenity Care Partners - Implementation Status & Build Plan v1

**Date:** November 2, 2025
**Author:** Claude (Anthropic)
**Purpose:** Comprehensive assessment of current state vs. Manifesto v2.3 requirements
**Status:** Phase 0-1 In Progress (Weeks 1-4 of 60-day plan)

---

## Executive Summary

**Current State:** Significant foundation built (~15,000 LOC across backend, partial frontend)
**Phase Progress:** Phase 0-1 foundational work ~60% complete
**Sandata Integration:** Core services complete, repository integration just finished
**Next Critical Path:** Complete full system integration, then write comprehensive tests

**Key Finding:** We have been building **individual components** (Sandata services, HR modules, billing) but need to **integrate them into a cohesive ERP system** following the manifesto's three-domain architecture (Public / Console / Admin).

---

## Section 1: Current Codebase Inventory

### Backend Services (~/backend/src)

#### ✅ **Completed Components** (Production-Ready or Near-Complete)

| Component | Files | LOC | Tests | Status | Manifesto Alignment |
|-----------|-------|-----|-------|--------|---------------------|
| **Sandata Integration** | 12 | ~4,800 | 223+ | ✅ Services complete, repository integrated | Phase 1-3 Req |
| **Database Client** | 1 | ~300 | - | ✅ Complete with singleton | Phase 0 Req |
| **Audit System** | 2 | ~800 | - | ✅ Logger & service complete | Phase 0 Req |
| **Security** | 3 | ~600 | - | ✅ PHI detector, access control, middleware | Phase 0 Req |
| **Configuration** | 3 | ~400 | - | ✅ Environment, Sandata config, security config | Phase 0 Req |
| **AI Agents** | 3 | ~2,500 | - | ✅ Enhanced agent, GPT-5 router | Phase 5 (future) |
| **Automation** | 5 | ~4,000 | - | ✅ Document templates, filing, talent pipeline | Phase 2-5 |

**Subtotal Completed:** ~27 files, ~13,400 LOC

#### ⚠️ **Partial/Scaffolded Components** (Need Integration)

| Component | Files | LOC | Status | Gap |
|-----------|-------|-----|--------|-----|
| **EVV Service** | 1 | ~500 | Scaffolded | Needs mobile app integration, GPS validation |
| **HR Service** | 1 | ~600 | Scaffolded | Needs onboarding workflow UI, credential tracking |
| **Billing Service** | 1 | ~400 | Scaffolded | Needs 837/835 integration, EVV-claim matching |
| **Scheduling Service** | 1 | ~500 | Scaffolded | Needs shift engine, Morning Check-In dashboard |
| **Payroll Service** | 1 | ~300 | Scaffolded | Needs ADP/Gusto integration |
| **Recruiting Service** | 1 | ~400 | Scaffolded | Needs applicant workflow, interview scheduling |
| **Tax Service** | 1 | ~200 | Scaffolded | Needs compliance automation |

**Subtotal Partial:** ~7 files, ~2,900 LOC

#### ❌ **Missing Critical Components**

1. **Public Website** - Careers page, application form, job listings
2. **Console UI (React/Next.js)** - Admin dashboards, Pod scorecards, Morning Check-In
3. **Mobile App** - EVV clock-in/out with GPS, offline sync
4. **API Layer** - REST endpoints connecting services to UI
5. **Authentication** - SSO/MFA for Console access
6. **Feature Flags System** - Progressive activation per manifesto
7. **Retry Queue** - Bull + Redis for Sandata retries
8. **Claims Integration** - Clearinghouse connector (837/835)
9. **Payroll Integration** - ADP/Gusto API connector
10. **Notification System** - SMS/email/push for alerts

### Database Migrations (~/backend/src/database/migrations)

#### ✅ **Completed Migrations**

| Migration | Purpose | Phase | Status |
|-----------|---------|-------|--------|
| 001 | Pod governance schema | Phase 0 | ✅ |
| 012 | Tax compliance tables | Phase 4 | ✅ |
| 013 | Recruiting/talent management | Phase 1-2 | ✅ |
| 014 | AI agent tracking | Phase 5 | ✅ |
| **015** | **Sandata integration** | **Phase 1-3** | **✅ Complete** |
| 016 | Policy center | Phase 2 | ✅ |
| 017 | Earned overtime | Phase 2 | ✅ |
| 018 | On-call coverage | Phase 3 | ✅ |
| 019 | Payer rules | Phase 4 | ✅ |
| 020 | Audit chain verification | Phase 0 | ✅ |

**Key Finding:** Database schema is **significantly ahead** of application layer. We have tables for features that don't yet have working UIs/APIs.

### Seeds & Configuration

- ✅ **003_manifesto_feature_flags.sql** - Feature flag system ready
- ✅ **004_sandata_config_seed.sql** - Sandata configuration seeded
- ✅ **001_sample_data_generator.ts** - Mock data generator exists
- ✅ **002_run_sample_data.ts** - Seed runner exists

---

## Section 2: Gap Analysis - Manifesto Requirements

### Phase 0 Requirements (Week 1-2)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Public site live | ❌ Missing | Need to build/deploy |
| Console auth (SSO/MFA) | ❌ Missing | Auth service exists but not wired up |
| Database schemas deployed | ✅ Complete | All migrations exist |
| Pod-1 exists in system | ⚠️ Partial | Schema ready, need seed data |
| Admin UI accessible | ❌ Missing | No React/Next.js frontend yet |
| Register with Sandata | ⏸️ Blocked | Waiting on Bignon |
| Request sandbox credentials | ⏸️ Blocked | Dependent on registration |
| Mock data seed | ⚠️ Partial | Generator exists, needs execution |

**Phase 0 Completion: ~40%**

### Phase 1 Requirements (Week 2-6)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Public website refresh | ❌ Missing | serenitycarepartners.com |
| Careers page | ❌ Missing | Job listings, application form |
| Email confirmations | ❌ Missing | Notification service exists but not wired |
| Sandata Individuals feed | ✅ Complete | Service + repository ready |
| Sandata Employees feed | ✅ Complete | Service + repository ready |
| Field mapping document | ⚠️ Partial | Types defined, need formal doc |
| Test in sandbox | ⏸️ Blocked | Waiting on credentials |

**Phase 1 Completion: ~30%** (services ready, UX/testing missing)

### Phase 2 Requirements (Month 1-2)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Applicant review workflow | ❌ Missing | UI needed |
| Onboarding checklist | ⚠️ Partial | Schema ready, UI missing |
| Credential tracker | ⚠️ Partial | Schema ready, alerts missing |
| Pod assignment | ⚠️ Partial | Schema ready, UI missing |
| SPI tracking | ⚠️ Partial | Tables exist, calculation engine missing |
| Auto-post to Sandata on hire | ✅ Complete | Services ready |
| Error handling/retry | ⚠️ Partial | Logic exists, queue infrastructure missing |

**Phase 2 Completion: ~25%** (backend ready, frontend/integration missing)

### Phase 3 Requirements (Month 2-4)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Shift engine | ⚠️ Partial | Schema exists, logic missing |
| Morning Check-In dashboard | ❌ Missing | UI needed |
| EVV mobile app | ❌ Missing | Critical blocker |
| EVV validation | ⚠️ Partial | Validator service complete, mobile integration missing |
| Sandata Visits feed | ✅ Complete | Service + repository ready |
| Certification Test Plan | ❌ Missing | Need to execute |
| Production credentials | ⏸️ Blocked | After certification |
| 7-day production monitoring | ⏸️ Blocked | After credentials |

**Phase 3 Completion: ~15%** (services ready, EVV app + certification missing)

### Phase 4-5 Requirements (Month 3-6+)

| Requirement | Status | Notes |
|-------------|--------|-------|
| 837 claims generation | ⚠️ Partial | Billing service scaffolded |
| 835 remittance processing | ❌ Missing | Need clearinghouse integration |
| Payroll integration | ⚠️ Partial | Service scaffolded, ADP/Gusto missing |
| Executive dashboards | ❌ Missing | Analytics UI needed |
| Predictive alerts | ⚠️ Partial | AI agents exist, integration missing |

**Phase 4-5 Completion: ~10%** (mostly scaffolding)

---

## Section 3: Architecture Assessment

### Current Architecture: **Component-First** (Problem)

```
backend/src/
├── modules/           ← Domain services (billing, evv, hr, scheduling)
├── services/          ← Utility services (sandata, notifications, payroll)
├── automation/        ← AI agents (talent pipeline, document templates)
└── database/          ← Migrations, seeds, client

❌ Problem: No clear separation between Public/Console/Admin domains
❌ Problem: No API layer connecting services to UIs
❌ Problem: Services exist but aren't wired into user flows
```

### Required Architecture: **Domain-First** (Manifesto Requirement)

```
/
├── public/            ← serenitycarepartners.com (Next.js)
│   ├── pages/         ├── home, about, careers
│   ├── components/    ├── job-listings, application-form
│   └── api/           └── /api/apply, /api/jobs
│
├── console/           ← Console ERP (Next.js + React)
│   ├── pages/         ├── dashboard, pods, morning-check-in, fix-resend
│   ├── components/    ├── spi-scorecard, evv-health, shift-calendar
│   └── api/           └── /api/shifts, /api/evv, /api/sandata-status
│
├── admin/             ← Admin Configuration (Next.js + React)
│   ├── pages/         ├── config, feature-flags, user-management
│   ├── components/    ├── config-editor, audit-log-viewer
│   └── api/           └── /api/config, /api/feature-flags
│
├── mobile/            ← EVV App (React Native)
│   ├── screens/       ├── clock-in, shift-list, offline-queue
│   ├── services/      ├── gps, ntp-sync, offline-storage
│   └── api/           └── /api/clock-in, /api/clock-out
│
└── backend/           ← Shared Backend (Node.js + Express)
    ├── api/           ← REST endpoints (PUBLIC, CONSOLE, ADMIN, MOBILE)
    ├── services/      ← Business logic (sandata, billing, scheduling)
    ├── database/      ← PostgreSQL client, migrations, seeds
    └── queue/         └── Bull + Redis for retries
```

**Key Insight:** We have excellent **backend services** but are missing the **API layer** and **frontend UIs** that make them usable.

---

## Section 4: Recommended Implementation Strategy

### Critical Path Forward (60-Day Plan)

#### **Week 1-2: Complete Phase 0 Foundation**

**Priority 1: Wire Up Authentication**
- Implement SSO/MFA using existing `auth.service.ts`
- Add JWT middleware for API protection
- Test with mock users

**Priority 2: Deploy Database & Seeds**
- Run all migrations on development database
- Execute mock data generator for demo environment
- Verify Pod-1 exists with 10 caregivers, 30 patients

**Priority 3: Build Core API Layer**
- Create Express router structure for `/api/public`, `/api/console`, `/api/admin`
- Wire up existing services to REST endpoints
- Test with Postman/Thunder Client

**Priority 4: Minimal Public Site**
- Deploy static Next.js site to serenitycarepartners.com
- Add basic careers page with "Coming Soon" message
- Placeholder application form (email collection only)

**Deliverable:** Gloria can log into Console, see Pod-1 dashboard (even if minimal)

---

#### **Week 3-4: Phase 1 Completion**

**Priority 1: Sandata Sandbox Testing**
- Obtain sandbox credentials from Bignon
- Test Individuals + Employees feeds in sandbox
- Fix any API contract issues
- Document field mappings formally

**Priority 2: Public Site Full Build**
- Complete careers page (job listings from database)
- Full application form (name, contact, role, availability, consent)
- Email confirmation automation
- Backend stores applications securely

**Priority 3: Console - Applicant Review**
- Build applicant list UI in Console
- Approve/reject/schedule interview workflow
- Email notifications to applicants

**Deliverable:** Full recruiting pipeline working (apply → review → hire)

---

#### **Week 5-6: Phase 2 Completion**

**Priority 1: HR Onboarding Workflow**
- Build onboarding checklist UI in Console
- Credential entry forms (license, TB, CPR)
- Auto-sync new hires to Sandata Employees feed
- Pod assignment interface

**Priority 2: Retry Queue Infrastructure**
- Setup Bull + Redis for background jobs
- Implement Sandata retry logic with exponential backoff
- Dead-letter queue for failed submissions
- Admin UI to view/retry failed transactions

**Priority 3: SPI Calculation Engine**
- Implement SPI score calculation from manifesto formula
- Nightly batch job to compute scores
- SPI leaderboard in Console

**Deliverable:** Complete HR pipeline with Sandata auto-sync

---

#### **Week 7-10: Phase 3 Completion (CRITICAL - EVV + Certification)**

**Priority 1: Mobile EVV App** ⚠️ **HIGHEST PRIORITY**
- Build React Native app (iOS + Android)
- Clock-in/out screens with GPS capture
- Offline queue for submissions
- NTP sync for time accuracy
- Root/jailbreak detection

**Priority 2: Morning Check-In Dashboard**
- Build shift calendar UI in Console
- Expected visits vs. actual check-ins
- Sandata sync status indicators
- Gap alerts for no-shows

**Priority 3: Sandata Visits Feed Integration**
- Wire mobile app clock-outs → Visits service
- Auto-submit to Sandata within 24 hours
- EVV record status tracking
- "Fix & Resend" UI for rejections

**Priority 4: Certification Execution**
- Execute Sandata Certification Test Plan
- Collect evidence (JSON samples, screen recordings)
- Submit certification packet
- Obtain production credentials
- 7-day production monitoring

**Deliverable:** Sandata certification approved, EVV compliance ≥98%

---

#### **Week 11-12: Phase 4 Setup (Claims Pre-Validation)**

**Priority 1: Claims Readiness Report**
- Build UI showing billable visits with Sandata ACK
- Block 837 submission if Sandata ACK missing
- Claims gate configuration in Admin

**Priority 2: Clearinghouse Integration (Placeholder)**
- Design 837/835 connector architecture
- Mock integration for testing
- Plan for actual clearinghouse onboarding

**Priority 3: Payroll Integration (Placeholder)**
- Design ADP/Gusto connector
- Mock integration for testing
- Plan for actual payroll system connection

**Deliverable:** Claims gate active, preventing EVV-related denials

---

## Section 5: Technology Stack Proposal

### Frontend

| Domain | Framework | Justification |
|--------|-----------|---------------|
| **Public Site** | Next.js 14 (App Router) | SEO, static export, API routes |
| **Console** | Next.js 14 + React 18 | Server components, data fetching |
| **Admin** | Next.js 14 + React 18 | Consistent with Console |
| **Mobile** | React Native + Expo | Cross-platform, shared logic with web |
| **UI Library** | shadcn/ui + Tailwind CSS | Accessible, customizable, modern |
| **State Management** | Zustand or React Query | Simple, performant |
| **Forms** | React Hook Form + Zod | Type-safe validation |

### Backend

| Component | Technology | Justification |
|-----------|------------|---------------|
| **API** | Express.js or Fastify | Fast, well-supported |
| **Database** | PostgreSQL 15+ | Already in migrations |
| **ORM** | Drizzle ORM or Kysely | Type-safe, lightweight |
| **Queue** | Bull + Redis | Mature, proven for retries |
| **Auth** | NextAuth.js or Clerk | SSO/MFA support |
| **Email** | Resend or SendGrid | Reliable, templated |
| **SMS** | Twilio | On-call dispatch |
| **File Storage** | AWS S3 or Google Cloud Storage | Documents, resumes |
| **Secrets** | AWS Secrets Manager or Vault | Sandata API keys |

### DevOps

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Hosting** | Vercel (frontend) + Railway/Render (backend) | Easy deployment, auto-scaling |
| **Database** | Supabase or Neon | Managed PostgreSQL |
| **CI/CD** | GitHub Actions | Built-in, free for repos |
| **Monitoring** | Sentry (errors) + Grafana (metrics) | Comprehensive visibility |
| **Logging** | Datadog or Better Stack | Audit trail compliance |

### Mobile

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Framework** | Expo (React Native) | Faster development, OTA updates |
| **GPS** | expo-location | Native GPS access |
| **Offline** | WatermelonDB or SQLite | Offline-first architecture |
| **Push** | Expo Notifications | Cross-platform push |

---

## Section 6: Risk Register

### Top 5 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **1. Sandata API v4.3 changes during build** | Medium | High | Version lock in contracts, sandbox testing |
| **2. Mobile GPS accuracy issues** | High | High | Geofence tolerance (0.25mi), manual override workflow |
| **3. Certification test failures** | Medium | Critical | Early sandbox testing, error taxonomy readiness |
| **4. Integration complexity (13+ services)** | High | Medium | API layer abstraction, phased rollout |
| **5. Real-time EVV sync latency** | Medium | Medium | Offline queue, 24-hour window per Ohio rules |

### Top 5 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **1. Sandata credentials delayed beyond Nov 30** | Medium | High | Continue with mock tests, build retry queue |
| **2. Caregivers struggle with mobile app** | High | Medium | User testing, simple UI, training videos |
| **3. Claims gate blocks valid claims** | Low | Critical | Warn mode for 2 weeks, manual override |
| **4. Pod Lead adoption resistance** | Medium | Medium | Demo dashboards early, gather feedback |
| **5. EVV compliance <98% in first month** | Medium | High | Grace period, proactive alerts, Fix & Resend UI |

---

## Section 7: 60-Day Milestone Plan

| Week | Phase | Key Deliverables | Acceptance Criteria |
|------|-------|------------------|---------------------|
| 1-2 | Phase 0 | Auth + API layer + Mock data | Gloria can log in, see Pod-1 |
| 3-4 | Phase 1 | Public site + Careers + Sandata sandbox | Applications flowing, Sandata feeds tested |
| 5-6 | Phase 2 | HR onboarding + Retry queue + SPI engine | New hires auto-sync, scores calculated |
| 7-8 | Phase 3a | Mobile EVV app (MVP) | Clock-in/out working with GPS |
| 9-10 | Phase 3b | Visits feed + Certification prep | Visits submitting to Sandata sandbox |
| 11-12 | Phase 3c | Certification execution + Claims gate | Sandata approval, production live |

**Critical Milestone:** End of Week 10 = Sandata certification submitted
**Go-Live:** Week 12 = Production EVV with claims gate active

---

## Section 8: Immediate Next Steps (This Week)

### What to Build Right Now

**Option A: API Layer First** (Recommended)
- Create `/backend/src/api` directory structure
- Build Express app with routes for Console endpoints
- Wire up existing services (sandata, evv, hr, scheduling)
- Test with Postman to prove services work end-to-end

**Option B: Testing First** (De-risk)
- Write comprehensive unit tests for Sandata services
- Write integration tests for repository layer
- Setup CI/CD with automated testing
- Ensure code quality before expanding

**Option C: Frontend First** (User-Visible Progress)
- Setup Next.js Console app
- Build login page + dashboard shell
- Connect to mock API endpoints
- Show Gloria something tangible

**My Recommendation:** **API Layer First (Option A)**, because:
1. Proves existing services work
2. Unblocks frontend development
3. Enables testing with real data flows
4. Addresses manifesto's "integration gap"

---

## Section 9: Questions for Bignon

Before proceeding, I need clarification on:

1. **Sandata Registration Status:** Has Serenity registered with Ohio Sandata yet? If not, who should I contact?

2. **Sandata Credentials Timeline:** When do you expect sandbox credentials? (Manifesto says Nov 30 deadline)

3. **Mobile App Priority:** Should I build EVV mobile app immediately, or is API layer + Console more urgent?

4. **Frontend Framework:** Do you have a preference for Next.js vs. other frameworks?

5. **Hosting Budget:** Are you comfortable with Vercel/Railway/Neon, or should I optimize for self-hosted?

6. **Existing Code Status:** The backend has modules for billing, scheduling, recruiting - are these functional or just scaffolds?

7. **Definition of "Done":** For Phase 0, does "Gloria can log in" mean just authentication, or a working dashboard?

8. **Test Coverage Target:** What's the minimum acceptable test coverage? (Manifesto doesn't specify %)

9. **Documentation Priority:** Should I write inline code docs, or architectural diagrams, or both?

10. **Monorepo vs. Separate Repos:** Current structure is monorepo - keep it or split Public/Console/Admin into separate repos?

---

## Conclusion

**Current State:** Strong foundation (~60% of Phase 0-1), but missing integration layer
**Key Gap:** No API layer connecting backend services to (missing) frontend UIs
**Critical Path:** API → Console UI → Mobile EVV → Sandata Certification
**Timeline:** 60 days achievable if we prioritize ruthlessly

**Recommendation:** Start with **API Layer + Auth + Console Shell** this week, then build Mobile EVV app in Weeks 7-8 to hit certification timeline.

**Next Deliverable:** Which option (A/B/C) should I execute first?

---

**END OF BUILD PLAN v1**
