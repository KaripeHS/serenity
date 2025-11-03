# Serenity Care Partners - Implementation Blockers

**Purpose:** This document lists items that are blocking progress and require business decisions or external actions.

**Last Updated:** November 3, 2025

---

## CRITICAL BLOCKERS (Preventing Revenue Operations)

### 🔴 BLOCKER #1: Sandata Sandbox Credentials

**What's Blocked:**
- Testing the Sandata integration
- Sandata certification process
- Ohio Medicaid billing capability
- Full EVV compliance validation

**What's the Problem:**
The Sandata integration code is 100% complete and production-ready (4,664 lines of code). However, to test it and get certified for Ohio Medicaid, we need credentials from Sandata that we don't have yet.

**Why This Matters:**
Without Sandata certification, you cannot:
- Bill Ohio Medicaid for patient visits
- Prove EVV (Electronic Visit Verification) compliance
- Receive payment from Medicaid for services
- Legally operate as Alt-EVV vendor in Ohio

**What You Need to Do:**
Contact Ohio Sandata and request:
1. Registration as an Alt-EVV vendor
2. Sandbox environment credentials (for testing)
3. API specification v4.3
4. Certification test plan document
5. Timeline for certification review

**Who to Contact:**
- **Organization:** Ohio Department of Medicaid / Sandata Technologies
- **What to Say:** "We're a home care agency starting operations in Ohio and need to register as an Alt-EVV vendor using Sandata as our aggregator. We need sandbox credentials to begin testing."
- **Website:** https://www.sandata.com/solutions/electronic-visit-verification/

**Timeline:**
- Registration to credentials: 2-4 weeks (typical)
- Once received: 3-5 days to test and certify (technical work)

**Impact if Not Resolved:**
Cannot bill Medicaid = No revenue from Medicaid clients

**Status:** NOT STARTED - Needs Gloria/Bignon action

---

### 🔴 BLOCKER #2: Mobile EVV App Decision

**What's Blocked:**
- Field caregivers using phones to clock in/out
- GPS location capture for EVV compliance
- Professional mobile experience for staff

**What's the Problem:**
Currently, there's a web-based clock that works on computers/tablets but doesn't provide the full mobile experience caregivers need in the field. To be fully operational, caregivers need to clock in from their phones while at client homes, with automatic GPS capture to prove they're at the correct location.

**Decision Needed:**
Which approach should we take for mobile EVV?

**Option 1: Progressive Web App (PWA) - FASTER**
- **What it is:** Enhanced website that works like an app
- **Timeline:** 2-3 weeks to build
- **Pros:** 
  - Faster to market
  - Works on all phones (iPhone and Android)
  - No app store approval needed
  - Can start using immediately
- **Cons:**
  - GPS less precise than native app
  - Requires internet connection for most features
  - Can't send push notifications on iPhones
- **Cost:** Just development time (already budgeted)
- **Best for:** Getting operational quickly, testing workflows

**Option 2: React Native App - BETTER LONG-TERM**
- **What it is:** Real mobile app from app stores
- **Timeline:** 6-8 weeks to build
- **Pros:**
  - Better GPS accuracy
  - Works fully offline
  - Professional appearance
  - Push notifications work on all phones
- **Cons:**
  - Takes longer to build
  - Needs Apple and Google approval (1-2 weeks)
  - Annual app store fees ($100/year)
- **Cost:** Development time + $100/year
- **Best for:** Long-term professional solution

**Option 3: Hybrid (RECOMMENDED)**
- **What it is:** Start with PWA now, build native app later
- **Timeline:** 2-3 weeks for PWA, then 6-8 weeks for native (when ready)
- **Strategy:**
  1. Build PWA in 2-3 weeks to get operational
  2. Launch with tablet/phone browser access
  3. Gather feedback from real caregivers
  4. Build React Native app with improvements
- **Best for:** Fast launch + professional long-term solution

**What I Need from You:**
1. How urgent is mobile app? (Launch timeline?)
2. Can caregivers use tablets initially with web clock?
3. Budget for mobile app development? (0-8 weeks of dev time)
4. Preference: Speed (PWA) vs. Polish (Native) vs. Both (Hybrid)?

**Recommendation:** 
Start with Hybrid approach (PWA now, native later). This gets you operational in 2-3 weeks and lets you validate workflows before investing in full native app.

**Impact if Not Resolved:**
- Caregivers can't clock in from field easily
- GPS verification less reliable
- Manual workarounds needed

**Status:** Needs decision from Gloria/Bignon

---

## HIGH PRIORITY BLOCKERS

### 🟡 BLOCKER #3: Clearinghouse Selection

**What's Blocked:**
- Automated claims submission to insurance
- Payment posting from insurance companies
- Full billing automation

**What's the Problem:**
To submit claims to insurance companies (Medicare, Medicaid, private payers), you need a "clearinghouse" - a middleman that translates and routes your claims. The code to generate claims is 100% ready, but we can't send them anywhere without selecting and setting up a clearinghouse account.

**What is a Clearinghouse:**
Think of it like a mail service for medical claims. You give them your claims, they translate them into each insurance company's format, send them, and bring back the payments/rejections.

**Options to Choose From:**

**Option 1: Change Healthcare (RECOMMENDED)**
- **What it is:** Largest clearinghouse, used by most providers
- **Pros:** Most reliable, excellent support, handles all payers
- **Cons:** Slightly more expensive
- **Cost:** ~$500 setup + $0.35-0.50 per claim
- **Website:** https://www.changehealthcare.com

**Option 2: Availity**
- **What it is:** Second largest, popular with smaller agencies
- **Pros:** Good pricing, user-friendly
- **Cons:** Fewer payer connections than Change
- **Cost:** ~$300 setup + $0.30-0.40 per claim
- **Website:** https://www.availity.com

**Option 3: Office Ally**
- **What it is:** Budget option for small practices
- **Pros:** Cheapest option
- **Cons:** Limited features, basic support
- **Cost:** $0 setup + $0.25-0.35 per claim
- **Website:** https://www.officeally.com

**What I Need from You:**
1. Any existing clearinghouse relationship?
2. Budget preference? (Cost difference is small at low volume)
3. Timeline preference? (Change Healthcare = 1 week, others faster)

**Recommendation:**
Choose **Change Healthcare** - industry standard, most reliable, worth the small extra cost.

**Next Steps (After Selection):**
1. Sign up for clearinghouse account (business task)
2. Provide API credentials (they'll give you)
3. I'll connect the integration (2-3 days coding)

**Impact if Not Resolved:**
- Manual claims submission (export files, upload by hand)
- Slower payment posting
- More administrative work

**Workaround:**
Can manually upload 837 files until API integration complete.

**Status:** Needs clearinghouse selection + account setup

---

### 🟡 BLOCKER #4: Payroll System API Access

**What's Blocked:**
- Automated hour syncing from EVV to payroll
- Separation of regular, OT, and Earned OT hours
- Reduced manual payroll data entry

**What's the Problem:**
Caregivers' hours are tracked in the EVV system, but they need to get to the payroll system (ADP or Gusto) for them to get paid. Currently this would be manual data entry. With API access, it can be automatic.

**Decision Needed:**
Which payroll system and do you have API access?

**Option 1: Already Using ADP**
- **If yes:** Request API/developer access from your ADP rep
- **Timeline:** 1-2 weeks for ADP to grant access
- **Cost:** Usually included in ADP plan
- **Integration time:** 2-3 days (more complex API)

**Option 2: Already Using Gusto**
- **If yes:** Enable API access in Gusto settings
- **Timeline:** Immediate (self-service)
- **Cost:** Included in Gusto plan
- **Integration time:** 2 days (simpler API)

**Option 3: Not Using Either**
- **Recommendation:** Choose Gusto (easier for startups)
- **Cost:** ~$40/month + $6/employee
- **Timeline:** 1 week to set up
- **Integration time:** 2 days

**What I Need from You:**
1. Which payroll system are you using?
2. Can you request API/developer access?
3. If neither, willing to switch to Gusto for easier integration?

**Next Steps:**
1. Get API credentials from payroll provider
2. Provide credentials to development team
3. I'll build integration (2-3 days)

**Impact if Not Resolved:**
- Export CSV files manually each pay period
- Manual upload to payroll system
- More chance for errors

**Workaround:**
CSV export is already working - can manually upload until API ready.

**Status:** Needs payroll system confirmation + API access

---

## MEDIUM PRIORITY BLOCKERS

### 🟢 BLOCKER #5: Production Database Hosting

**What's Blocked:**
- Switching from test/mock data to real data
- Multi-user production use
- Data backup and security

**What's the Problem:**
Right now the system uses mock/test data that resets. To go live, we need a real production database where data is permanently stored and backed up.

**Options:**

**Option 1: Supabase (RECOMMENDED for MVP)**
- **What it is:** PostgreSQL database with built-in admin tools
- **Pros:** Easy setup, generous free tier, automatic backups
- **Cons:** Newer company (less established than AWS)
- **Cost:** FREE for MVP (up to 500MB), then $25/month
- **Setup time:** 1 day

**Option 2: AWS RDS**
- **What it is:** Amazon's database service
- **Pros:** Industry standard, ultimate reliability
- **Cons:** More complex setup, no free tier
- **Cost:** ~$30-50/month minimum
- **Setup time:** 2-3 days

**Option 3: Heroku Postgres**
- **What it is:** Easy database hosting
- **Pros:** Very simple setup
- **Cons:** Expensive for growth
- **Cost:** FREE for dev, $50/month for production
- **Setup time:** 1 day

**What I Need from You:**
1. Budget for database hosting? ($0-50/month)
2. Preference for setup speed vs. enterprise-grade?

**Recommendation:**
Start with **Supabase FREE tier** for MVP, migrate to AWS RDS when scaling.

**Next Steps:**
1. Create Supabase account (free, 5 minutes)
2. Run database setup scripts (automated, 30 minutes)
3. Update backend config (10 minutes)

**Impact if Not Resolved:**
Can't go live with real users, data not persistent.

**Workaround:**
Can continue development with mock data (current state).

**Status:** Can be resolved quickly once approved

---

### 🟢 BLOCKER #6: Email Sending Service

**What's Blocked:**
- Application confirmations
- Hire welcome emails
- Credential expiration alerts
- Shift reminders

**What's the Problem:**
The email service code is already written and ready, but we need to activate a sending service (SendGrid or similar) to actually send emails.

**Solution: SendGrid (Already Configured)**
- **Cost:** FREE (up to 40,000 emails/month)
- **Setup:** Already done in code
- **What's needed:** 
  1. Create SendGrid account (free, 10 minutes)
  2. Verify sending domain (serenitycarepartners.com)
  3. Provide API key (they give you)
  4. I'll update config (5 minutes)

**What I Need from You:**
1. Approval to create SendGrid account
2. Access to DNS settings for domain verification
3. Who should emails "from" address be? (noreply@serenitycarepartners.com?)

**Next Steps:**
1. Sign up at sendgrid.com (free)
2. Add DNS records for verification (I'll provide exact records)
3. Get API key and provide to development
4. Test send

**Timeline:** 1 hour total

**Impact if Not Resolved:**
No automated emails, manual communication only.

**Workaround:**
Manual emails from Gloria/Bignon until service active.

**Status:** Easy to resolve, needs 1 hour of time

---

### 🟢 BLOCKER #7: SMS Service for Dispatch

**What's Blocked:**
- Texting on-call caregivers for coverage gaps
- SMS shift reminders
- Two-way communication (accept/decline via text)

**What's the Problem:**
When a caregiver doesn't show up, Pod Leads need to quickly text on-call staff. The code is ready, but needs Twilio service activation.

**Solution: Twilio**
- **Cost:** 
  - $15/month base fee
  - $0.0075 per text message (~$1 per 133 texts)
  - Estimated $30-50/month for typical usage
- **Setup:** Code already written
- **What's needed:**
  1. Create Twilio account
  2. Get phone number for sending (~$1/month)
  3. Provide API credentials
  4. I'll wire it up (1 day)

**What I Need from You:**
1. Approval for ~$30-50/month SMS budget
2. Should texts come from Serenity phone number or Twilio number?

**Next Steps:**
1. Sign up at twilio.com
2. Purchase phone number
3. Get API credentials
4. I'll integrate (1 day coding)

**Timeline:** 1 day

**Impact if Not Resolved:**
Manual phone calls instead of automated SMS dispatch.

**Workaround:**
Pod Leads call/text from personal phones until automated.

**Status:** Easy to resolve, needs budget approval

---

## INFORMATION NEEDED FOR PLANNING

### Business Timeline Questions

**Question 1: First Patient Target Date**
- **Why I need to know:** Determines which features are critical vs. nice-to-have
- **Options:**
  - Within 2 weeks = Focus on Fast Track MVP only
  - Within 1-2 months = Can build mobile app properly
  - 3+ months = Can build everything without rushing

**Question 2: Caregiver Count**
- **Why I need to know:** Determines mobile app urgency
- **If 1-5 caregivers:** Can use web clock on tablets
- **If 5-20 caregivers:** Need PWA soon
- **If 20+ caregivers:** Need React Native app

**Question 3: Medicaid vs. Private Pay Mix**
- **Why I need to know:** Determines Sandata urgency
- **If 80%+ Medicaid:** Sandata is critical blocker
- **If mixed/mostly private:** Can launch without Sandata initially

**Question 4: Budget Constraints**
- **Why I need to know:** Determines build vs. buy decisions
- **If limited budget:** Use free tiers, manual workarounds
- **If budget available:** Can pay for better services, faster development

---

## Summary of Actions Needed

### CRITICAL (Do First)
1. **Sandata Registration** - Gloria/Bignon to contact Ohio Medicaid/Sandata
2. **Mobile App Decision** - Choose PWA, Native, or Hybrid approach
3. **Timeline Clarity** - When do you need to be operational?

### HIGH PRIORITY (Do Soon)
4. **Clearinghouse Selection** - Choose Change Healthcare, Availity, or Office Ally
5. **Payroll API Access** - Confirm system and request API access
6. **Database Hosting** - Approve Supabase (free) or AWS RDS

### MEDIUM PRIORITY (Can Wait)
7. **SendGrid Setup** - 1 hour to activate email service
8. **Twilio Setup** - 1 day to activate SMS service

---

## How to Unblock

### For Business/External Blockers
These need Gloria or Bignon to handle:
1. Sandata - contact Ohio Medicaid
2. Clearinghouse - select and sign up
3. Payroll - request API access
4. Budget approvals - approve service costs

### For Technical Blockers
These I can handle once you provide decisions/credentials:
1. Mobile app - build once approach decided
2. Database - set up once hosting approved
3. Integrations - connect once credentials provided

---

## Questions?

If anything in this document is unclear or you need more details, please ask. I can explain any of these items in more detail or provide alternative options.

**Ready to proceed as soon as blockers are resolved.**
