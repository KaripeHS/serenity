# Public Website & Careers Portal - Current Status & Implementation Plan

**Date:** 2025-11-03
**Assessment:** Deep dive into public-facing website and job board functionality

---

## Executive Summary

**Current Status: ~15% Complete**

### What Exists
- ✅ Backend API endpoints (scaffolded but not functional)
- ✅ Database schema for applicants and job requisitions
- ✅ HR application review UI (but disconnected from backend)
- ✅ Complete recruiting service logic

### What's Missing
- ❌ **Public website** (serenitycarepartners.com) - Doesn't exist at all
- ❌ **Careers page UI** - No job listings display
- ❌ **Application form UI** - No applicant submission form
- ❌ **Backend persistence** - API doesn't save to database
- ❌ **Email notifications** - No confirmation emails sent
- ❌ **Job posting management** - No Admin UI to create/edit jobs

---

## Detailed Assessment

### 1. Backend API Status

**Location:** `/backend/src/api/routes/public/index.ts`

#### ✅ Endpoint Structure (Good Design)
```typescript
GET  /api/public/careers/jobs     // Get job listings
POST /api/public/careers/apply    // Submit application
```

#### 🔴 Critical Issues

**Problem 1: Hardcoded Mock Data**
```typescript
router.get('/careers/jobs', async (req, res) => {
  // TODO: Fetch from database
  res.json({
    jobs: [
      { id: 'job-1', title: 'Home Health Aide (HHA)', ... },
      { id: 'job-2', title: 'Licensed Practical Nurse (LPN)', ... }
    ]
  });
});
```
**Impact:** Always returns same 2 fake jobs, doesn't read from `job_requisitions` table

**Problem 2: Application Doesn't Save**
```typescript
router.post('/careers/apply', async (req, res) => {
  // Validation works ✅
  if (!firstName || !lastName || !email || !phone || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // TODO: Store application in database ❌
  // TODO: Send confirmation email ❌

  res.status(201).json({
    success: true,
    applicationId: `app-${Date.now()}` // Fake ID
  });
});
```
**Impact:** Application data is lost, no HR notification, applicant gets fake confirmation

---

### 2. Database Schema Status

**Location:** `/backend/src/database/migrations/013_recruiting_talent_management.sql`

#### ✅ Excellent Schema (Production-Ready)

**`applicants` Table:**
- All required fields: name, email, phone, address
- Application metadata: position, date, source (website/referral/indeed)
- AI screening: scores, notes
- Background checks: status tracking
- Interview tracking: linked to `interviews` table
- Status pipeline: new → screening → interviewing → hired/rejected

**`job_requisitions` Table:**
- Job posting details: title, description, requirements
- Compensation: pay range, benefits
- Status: draft, active, closed
- Hiring manager assignment
- Application count tracking

**Status:** ✅ **100% ready for production use**

---

### 3. Frontend Components

#### ❌ Public Website - COMPLETELY MISSING

**What Should Exist:**
```
/                          → Home page (company overview)
/about                     → About Serenity Care Partners
/services                  → Home care services offered
/careers                   → Job listings
/careers/:jobId            → Job detail page
/careers/apply/:jobId      → Application form
/contact                   → Contact/referral form
```

**What Actually Exists:**
- NOTHING - No public website components at all
- WorkingHomePage.tsx is the CONSOLE home page (authenticated users only)

#### 🟡 HR Application Review UI - EXISTS BUT DISCONNECTED

**Component:** `WorkingHRApplications.tsx`
- **Status:** Fully built, professional UI
- **Features:** Application list, filtering, interview scheduling, offer letters
- **Problem:** Uses hardcoded mock data, doesn't call backend API

---

### 4. Job Board & Careers Portal - What's Needed

#### Phase 1: Public Website Shell (3-4 days)

**Pages to Build:**

1. **Home Page (`/`)**
   - Hero section: "Compassionate Home Care Across Ohio"
   - Value proposition: pod model, caregiver support
   - CTA: "Join Our Team" → /careers
   - Testimonials (placeholder)
   - Contact info

2. **About Page (`/about`)**
   - Company mission/vision
   - Leadership: Gloria (CEO), Bignon (COO/CFO)
   - Pod-based care model explained
   - Ohio service areas

3. **Services Page (`/services`)**
   - Personal care
   - Skilled nursing
   - Companionship
   - Respite care
   - Service areas map

4. **Contact/Referral Page (`/contact`)**
   - Contact form for patient referrals
   - Phone, email, address
   - Service area lookup

5. **Careers Landing Page (`/careers`)**
   - Job listings (pulled from API)
   - Benefits overview
   - Application process
   - "Why Work Here" section

**Technology Stack:**
- **Option A:** Separate Next.js static site
  - Pros: SEO-optimized, fast, simple deployment
  - Cons: Two codebases to maintain

- **Option B:** Add public routes to existing React app
  - Pros: Single codebase
  - Cons: More complex routing, risk of PHI exposure

**Recommended:** Option A (Next.js static site)

---

#### Phase 2: Careers Portal (2-3 days)

**Job Listings Page (`/careers`):**

```typescript
// Fetch jobs from backend
const [jobs, setJobs] = useState<Job[]>([]);

useEffect(() => {
  fetch('/api/public/careers/jobs')
    .then(res => res.json())
    .then(data => setJobs(data.jobs));
}, []);

// Display job cards
{jobs.map(job => (
  <JobCard
    key={job.id}
    title={job.title}
    payRange={job.payRange}
    description={job.description}
    onApply={() => navigate(`/careers/apply/${job.id}`)}
  />
))}
```

**Job Detail Page (`/careers/:jobId`):**
- Job title, description, requirements
- Pay range, benefits
- "Apply Now" button → application form

**Application Form (`/careers/apply/:jobId`):**

```typescript
interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  jobId: string;
  availability: 'full-time' | 'part-time' | 'prn';
  hasLicense: boolean;
  consent: boolean; // Required for HIPAA compliance
}

const handleSubmit = async (data: ApplicationFormData) => {
  const response = await fetch('/api/public/careers/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    // Show confirmation with application ID
    setConfirmation(true);
    // Send confirmation email (backend)
  }
};
```

**Form Fields:**
- Personal info: First/last name, email, phone
- Address (for proximity to service areas)
- Position applied for (auto-filled from job listing)
- Availability: Full-time, Part-time, PRN
- "Do you have an active [HHA/LPN/RN] license?" (Yes/No)
- Resume upload (optional at application stage per manifesto)
- Consent checkbox: "I consent to background check and data processing"

**Validation:**
- Email format
- Phone format (US)
- Required fields
- Consent must be checked

---

#### Phase 3: Wire Backend to Database (1 day)

**Fix Job Listings Endpoint:**

```typescript
// /api/public/careers/jobs
router.get('/careers/jobs', async (req, res) => {
  const db = DatabaseClient.getInstance();

  const jobs = await db.query(`
    SELECT
      id,
      title,
      job_type,
      description,
      pay_range,
      requirements,
      posted_at
    FROM job_requisitions
    WHERE status = 'active'
      AND organization_id = $1
    ORDER BY posted_at DESC
  `, [req.organizationId]);

  res.json({ jobs: jobs.rows });
});
```

**Fix Application Submission:**

```typescript
// /api/public/careers/apply
router.post('/careers/apply', async (req, res) => {
  const { firstName, lastName, email, phone, jobId, availability, consent } = req.body;

  // Validation (already exists ✅)

  // Save to database
  const db = DatabaseClient.getInstance();
  const applicationId = uuidv4();

  await db.query(`
    INSERT INTO applicants (
      id, organization_id, first_name, last_name, email, phone,
      position_applied_for, application_date, source, status, current_stage
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'website', 'new', 'application_received')
  `, [applicationId, req.organizationId, firstName, lastName, email, phone, jobId]);

  // Send confirmation email
  await sendApplicationConfirmationEmail(email, applicationId);

  // Notify HR
  await notifyHRNewApplication(applicationId);

  res.status(201).json({
    success: true,
    applicationId: applicationId
  });
});
```

---

#### Phase 4: Email Integration (1-2 days)

**Email Service Setup:**

**Option 1: SendGrid** (Recommended)
- Free tier: 100 emails/day
- Simple API
- Template support

**Option 2: AWS SES**
- Very cheap ($0.10 per 1000 emails)
- Requires domain verification
- More complex setup

**Option 3: Resend**
- Developer-friendly
- React Email templates
- Good documentation

**Email Templates Needed:**

1. **Application Confirmation (to applicant):**
```
Subject: Application Received - [Job Title] at Serenity Care Partners

Hi [First Name],

Thank you for applying to the [Job Title] position at Serenity Care Partners!

Your application has been received and is being reviewed by our team.

Application ID: [ID]
Position: [Job Title]
Date Submitted: [Date]

What's Next:
1. Our HR team will review your application within 3-5 business days
2. If your qualifications match our needs, we'll contact you to schedule an interview
3. You can check your application status at: [URL]

Questions? Reply to this email or call us at (XXX) XXX-XXXX.

Best regards,
Serenity Care Partners HR Team
```

2. **New Application Alert (to HR):**
```
Subject: New Application - [Job Title]

A new application has been submitted:

Applicant: [Name]
Position: [Job Title]
Email: [Email]
Phone: [Phone]
Application ID: [ID]

Review application: [Console URL]
```

**Implementation:**

```typescript
// /backend/src/services/notifications/email.service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendApplicationConfirmationEmail(
  applicantEmail: string,
  applicationId: string,
  jobTitle: string,
  applicantName: string
) {
  const msg = {
    to: applicantEmail,
    from: 'careers@serenitycarepartners.com',
    subject: `Application Received - ${jobTitle}`,
    html: `
      <h2>Thank you for applying!</h2>
      <p>Hi ${applicantName},</p>
      <p>Your application for <strong>${jobTitle}</strong> has been received.</p>
      <p><strong>Application ID:</strong> ${applicationId}</p>
      <p>We'll review your application and contact you within 3-5 business days.</p>
    `
  };

  await sgMail.send(msg);
}
```

---

#### Phase 5: Job Management Admin UI (2-3 days)

**Admin Console → Jobs → Job Requisitions**

**Features:**
1. **Job Listings Table**
   - All jobs (draft, active, closed)
   - Application count per job
   - Status toggle (activate/deactivate)

2. **Create New Job Form**
   - Job title (dropdown: HHA, LPN, RN, Pod Lead, Admin)
   - Description (rich text editor)
   - Requirements (bullet list)
   - Pay range
   - Benefits
   - Hiring manager
   - Status (draft/active)

3. **Edit Job**
   - Update any field
   - Close job (marks inactive, hides from public)

4. **View Applications**
   - Click job → see all applications for that job
   - Link to HR Applications dashboard

---

## Implementation Roadmap

### Week 1: Public Website Shell (3-4 days)
**Engineer:** 1 FTE
- [ ] Set up Next.js project for public site
- [ ] Build Home page
- [ ] Build About page
- [ ] Build Services page
- [ ] Build Contact/Referral form
- [ ] Deploy to Vercel/Netlify at serenitycarepartners.com

**Deliverable:** Public website live, no jobs yet

---

### Week 1-2: Careers Portal UI (2-3 days)
**Engineer:** 1 FTE
- [ ] Build Careers landing page
- [ ] Build Job Listings page (pulls from API)
- [ ] Build Job Detail page
- [ ] Build Application Form
- [ ] Confirmation page/modal

**Deliverable:** Careers portal UI complete, uses mock data

---

### Week 2: Backend Integration (1 day)
**Engineer:** 1 FTE
- [ ] Wire GET /careers/jobs to database
- [ ] Wire POST /careers/apply to database
- [ ] Test end-to-end flow

**Deliverable:** Applications saved to database

---

### Week 2: Email Integration (1-2 days)
**Engineer:** 1 FTE
- [ ] Set up SendGrid account
- [ ] Create email templates
- [ ] Implement sendApplicationConfirmationEmail()
- [ ] Implement notifyHRNewApplication()
- [ ] Test emails

**Deliverable:** Applicants receive confirmation, HR gets alerts

---

### Week 3: Admin Job Management (2-3 days)
**Engineer:** 1 FTE
- [ ] Build Job Requisitions list in Admin Console
- [ ] Build Create/Edit Job form
- [ ] Wire to database
- [ ] Test job posting workflow

**Deliverable:** HR can create/manage job postings without code changes

---

### Week 3: Connect HR UI to Backend (1 day)
**Engineer:** 1 FTE
- [ ] Modify WorkingHRApplications.tsx to fetch from API
- [ ] Wire interview scheduling to database
- [ ] Wire offer letters to database

**Deliverable:** HR dashboard fully functional

---

## Total Effort Estimate

| Phase | Effort | Status |
|-------|--------|--------|
| Public website shell | 3-4 days | ❌ Not started |
| Careers portal UI | 2-3 days | ❌ Not started |
| Backend integration | 1 day | 🟡 Scaffolded, not wired |
| Email integration | 1-2 days | ❌ Not started |
| Job management UI | 2-3 days | ❌ Not started |
| HR UI wiring | 1 day | 🟡 UI exists, not wired |
| **TOTAL** | **10-14 days** | **~15% complete** |

**Timeline:** 2-3 weeks at 1 FTE

---

## Quick Wins (Can Complete in 1-2 Days)

If you need a minimal viable careers portal ASAP:

1. **Simple Landing Page (4 hours)**
   - One HTML page with CSS
   - Lists 2-3 job types
   - Links to application form

2. **Application Form (4 hours)**
   - Google Form or Typeform
   - Sends to HR email
   - Manual data entry into Console

3. **Backend Wiring (2 hours)**
   - Fix POST /careers/apply to save to database
   - No email (manual follow-up)

**Total:** 1-2 days for bare minimum

---

## Manifesto Compliance Check

**Manifesto Phase 1 Requirements (Week 2-6):**

| Requirement | Status | Gap |
|-------------|--------|-----|
| Launch serenitycarepartners.com | ❌ MISSING | Need Next.js site + deployment |
| Careers page with job listings | ❌ MISSING | Need UI + wire to database |
| Application form | ❌ MISSING | Need UI + save to database |
| Consent and privacy notices | ❌ MISSING | Need legal copy + display |
| Email confirmations | ❌ MISSING | Need SendGrid + templates |
| Backend storage | 🟡 PARTIAL | Schema exists, API doesn't save |

**Overall Phase 1 Careers Status:** 15% complete

---

## Recommended Approach

### Option A: Fast Track (2 weeks)
**Best for:** Need recruiting pipeline ASAP

1. **Week 1:** Public site + careers UI
2. **Week 2:** Backend + email + job management

**Outcome:** Fully functional careers portal in 2 weeks

---

### Option B: Phased Rollout (3 weeks)
**Best for:** Want to test each piece

1. **Week 1:** Public site only (Home, About, Services, Contact)
2. **Week 2:** Careers portal (jobs, applications, backend)
3. **Week 3:** Email + job management + polish

**Outcome:** Incremental delivery, lower risk

---

### Option C: MVP (3-5 days)
**Best for:** Need something live this week

1. **Day 1-2:** Simple landing page + Google Form for applications
2. **Day 3:** Wire backend to save applications
3. **Day 4-5:** Basic job management UI

**Outcome:** Bare minimum functional, manual processes

---

## Deployment Checklist

### Domain Setup
- [ ] Register serenitycarepartners.com (if not already owned)
- [ ] Set up DNS records
- [ ] SSL certificate (Let's Encrypt or Cloudflare)

### Hosting
- [ ] Public site: Vercel, Netlify, or AWS S3+CloudFront
- [ ] Ensure separation from Console (different domain/subdomain)

### Email
- [ ] Domain verification for SendGrid/SES
- [ ] Set up SPF/DKIM records for deliverability
- [ ] Test email delivery

### Analytics
- [ ] Google Analytics tracking code
- [ ] Set up goal tracking (applications submitted)

### Compliance
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] HIPAA notice for applicants
- [ ] Cookie consent banner (if using tracking)

---

## Next Steps

**IMMEDIATE (This Week):**
1. **Bignon/Gloria:** Approve public website content (Home, About, Services)
2. **Engineering:** Start Next.js public site build
3. **Engineering:** Wire backend API to database (1 day)

**WEEK 2:**
1. **Engineering:** Build careers portal UI
2. **Engineering:** Set up SendGrid + email templates
3. **HR:** Draft legal copy (privacy policy, consent language)

**WEEK 3:**
1. **Engineering:** Build job management Admin UI
2. **Engineering:** Wire HR dashboard to backend
3. **Testing:** End-to-end application flow
4. **Deploy:** Go live with careers portal

---

## Conclusion

**Current State:** Strong backend foundation (95%) with zero public-facing UI (0%)

**Path to Completion:** 10-14 days of focused development

**Critical Blockers:**
1. No public website at all
2. No careers portal UI
3. Backend API doesn't persist data
4. No email service integrated

**Recommended Priority:** HIGH - This is your recruiting pipeline and public credibility

**Quick Win:** Wire backend in 1 day, use temporary landing page, iterate from there

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Next Review:** After public site deployment
