# Serenity Care Partners - Business Blockers & Action Items

**Date:** November 3, 2025  
**For:** Gloria & Bignon  
**Purpose:** Clear action items to unblock development and move to production

---

## Overview

**Good News:** The code is 85-90% complete! 🎉

**The Challenge:** Most remaining "blockers" are **business processes** (accounts, registrations, credentials), not technical development.

**This document** tells you exactly what to do, who to contact, how much it costs, and why it matters.

---

## 🔴 CRITICAL - BLOCKING MEDICAID REVENUE

### 1. Sandata Sandbox Credentials

**What You Need:** API credentials for Ohio Sandata Aggregator (Alt-EVV system)

**Why This Matters:**
- You CANNOT test the Sandata integration without these credentials
- You CANNOT get certified for Ohio Medicaid without testing
- You CANNOT bill Medicaid patients until certified
- **This is your #1 revenue blocker**

**Current Status:**
- You said: "I started the Sandata registration"
- We need to know: What's the exact status? Have you heard back?

**What To Do RIGHT NOW:**

1. **Find your Sandata contact:**
   - Check your email for any Sandata correspondence
   - Note the account manager or registration contact name

2. **Call/Email to escalate:**
   - Say: "We've registered as an Alt-EVV vendor and need sandbox credentials urgently. Our first patient is scheduled for [your date]. What's the status?"
   - Ask for:
     - Sandbox API keys (test environment)
     - Ohio Sandata API v4.3 specification document
     - Certification Test Plan
     - Timeline to receive production credentials

3. **If you don't have a contact:**
   - Call Ohio Department of Medicaid: (614) 644-0140
   - Ask for: "Sandata Alt-EVV registration department"
   - Reference: Ohio Medicaid EVV requirements

4. **Follow up:**
   - Email every 2-3 days until you get credentials
   - CC me (Claude) on responses so I can help interpret technical requirements

**Timeline:**
- Normal process: 2-4 weeks
- With escalation: Potentially 1-2 weeks
- **Start this TODAY**

**Cost:** Unknown (ask Sandata - likely included in Ohio Medicaid participation)

**What Happens After You Get Credentials:**
- I can test the integration in 3-5 days
- We submit certification evidence to Sandata
- They review (1-2 weeks)
- You receive production credentials
- **You can start billing Medicaid!**

**Workaround Until This Completes:**
- You can launch operations with non-Medicaid patients
- You can capture all EVV data (ready to submit when certified)
- You can train staff and build processes
- You just can't bill Medicaid yet

---

## 🟡 HIGH PRIORITY - NEEDED THIS WEEK

### 2. Twilio Account (SMS Dispatch)

**What You Need:** SMS service for two-way caregiver dispatch

**Why This Matters:**
- Pod Leads need to text on-call caregivers when there's a coverage gap
- Caregivers reply "YES" or "NO" to accept dispatch
- System tracks response times automatically
- **Without this, Pod Leads make manual phone calls (slow, no tracking)**

**What To Do:**

1. **Sign up (15 minutes):**
   - Go to: https://www.twilio.com/try-twilio
   - Click "Sign Up"
   - Use Serenity company email
   - Verify phone number

2. **Purchase phone number (5 minutes):**
   - After signup, go to "Phone Numbers" → "Buy a Number"
   - Choose Ohio area code (937 for Dayton, 614 for Columbus)
   - Make sure it has "SMS" capability
   - Cost: ~$1-15/month depending on features

3. **Get credentials:**
   - Go to "Account" → "API Keys & Tokens"
   - Copy these three things:
     - Account SID (starts with "AC...")
     - Auth Token (long string)
     - Your Twilio Phone Number (format: +19375550100)

4. **Send to me:**
   - Create a file called `.env.twilio` with:
     ```
     TWILIO_ACCOUNT_SID=AC...
     TWILIO_AUTH_TOKEN=...
     TWILIO_PHONE_NUMBER=+19375550100
     ```
   - I'll add these to the production server

**Timeline:** 30 minutes total

**Cost:**
- Phone number: ~$1-15/month (one-time $1 is fine to start)
- Per-SMS: $0.0075 per message
- Example monthly cost with 50 caregivers, 10 dispatches/week: ~$6-7/month

**What Happens Next:**
- SMS dispatch starts working immediately
- Caregivers receive texts with shift details
- They reply YES/NO
- System updates gap status automatically
- Pod Leads see all responses in Morning Check-In dashboard

**Testing:**
- We can test with your phone number first
- Send you a test dispatch, you reply YES
- See it update in the dashboard

---

### 3. SendGrid Account (Email Notifications)

**What You Need:** Email service for system notifications

**Why This Matters:**
- Caregivers get alerts when their license is expiring
- Job applicants get confirmation emails
- HR gets daily credential expiration digests
- Users get password reset emails
- **Without this, you manually email everyone (not scalable)**

**What To Do:**

1. **Sign up (10 minutes):**
   - Go to: https://sendgrid.com
   - Click "Start for Free"
   - Use Serenity company email
   - Choose "Free" plan (40,000 emails/month - more than enough!)

2. **Verify sender (10 minutes):**
   - SendGrid will ask you to verify your sending email
   - Option 1 (Easier): Single Sender Verification
     - Use: hr@serenitycarepartners.com or notifications@serenitycarepartners.com
     - They'll send verification email to this address
     - Click link to verify
   - Option 2 (Better for production): Domain Authentication
     - Requires adding DNS records to your domain
     - SendGrid provides exact records
     - Takes 30 minutes

3. **Create API Key (5 minutes):**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "Serenity Production"
   - Choose "Full Access" (or just "Mail Send" if you prefer minimal permissions)
   - Copy the API key (starts with "SG...")
   - **Save it somewhere safe - you can only see it once!**

4. **Send to me:**
   - Create a file called `.env.sendgrid` with:
     ```
     SENDGRID_API_KEY=SG....
     EMAIL_FROM=notifications@serenitycarepartners.com
     HR_EMAIL=hr@serenitycarepartners.com
     ```

**Timeline:** 30 minutes total

**Cost:** FREE (40,000 emails/month)

**What Happens Next:**
- System sends professional emails automatically
- Credential expiration alerts (30 days before, 15 days, 7 days, expired)
- Application confirmations
- Password resets
- Daily HR digest

**Testing:**
- We'll send you a test email first
- Then test credential alert for a mock caregiver
- Check that HR digest works

---

### 4. Apple Developer Account (iPhone App)

**What You Need:** Account to deploy mobile app to iPhones

**Why This Matters:**
- Caregivers need the mobile app on their iPhones
- Without it, they can't clock in from the field with GPS
- **Code is 100% ready - just needs deployment**

**What To Do:**

1. **Sign up (15 minutes):**
   - Go to: https://developer.apple.com/programs/
   - Click "Enroll"
   - Choose "Organization" (not individual)
   - You'll need:
     - Serenity Care Partners legal business name
     - DUNS number (if you don't have one, Apple helps you get it free)
     - Business email
     - Business phone
     - Legal entity documentation

2. **Pay annual fee:**
   - Cost: $99/year
   - Credit card or purchase order

3. **Wait for approval:**
   - Usually 1-2 business days
   - Apple may call to verify business

4. **Once approved:**
   - Note your "Team ID" (looks like: A1B2C3D4E5)
   - Send to me so I can configure the mobile app build

**Timeline:**
- Sign up: 15 minutes
- Approval: 1-2 business days
- First build: 20 minutes after approval

**Cost:** $99/year

**What Happens Next:**
- I build the iOS app with Expo Application Services
- Submit to TestFlight (Apple's beta testing platform)
- You invite 2-3 caregivers to test
- After testing looks good (~1 week), submit to App Store
- App goes live for all caregivers

**Testing Plan:**
- Week 1: Internal testing (you + 1 caregiver)
- Week 2: Beta with 2-3 caregivers
- Week 3: Production release

---

### 5. Google Play Developer Account (Android App)

**What You Need:** Account to deploy mobile app to Android phones

**Why This Matters:**
- Caregivers with Android phones need the app too
- **About 40-50% of people have Android**

**What To Do:**

1. **Sign up (10 minutes):**
   - Go to: https://play.google.com/console/signup
   - Sign in with Google account (create one with Serenity email if needed)
   - Click "Create account" → "Organization"
   - Provide:
     - Developer name: Serenity Care Partners
     - Contact email
     - Phone number

2. **Pay one-time fee:**
   - Cost: $25 (one-time, not annual)
   - Credit card

3. **Complete account:**
   - Add developer details
   - Accept agreements
   - **Approval is instant!**

**Timeline:** 15 minutes total (instant approval)

**Cost:** $25 (one-time)

**What Happens Next:**
- I build the Android app with Expo Application Services
- Submit to Play Store Internal Testing track
- You invite caregivers to test
- After testing, move to production
- App goes live for all caregivers

**Testing Plan:**
- Same as iOS: Internal → Beta → Production

---

## 🟢 MEDIUM PRIORITY - NEEDED MONTH 2-3

### 6. Production Server Hosting

**What You Need:** Server to run the backend + database

**Why This Matters:**
- Currently everything runs locally on my machine
- Need reliable hosting for production
- Need automatic backups
- Need 99.9% uptime

**Recommended Option: DigitalOcean App Platform**

**Why DigitalOcean:**
- Easy to set up (1-2 hours)
- Automatic SSL certificates
- Automatic backups
- 99.95% uptime guarantee
- Great support
- Fair pricing

**What To Do:**

1. **Sign up:**
   - Go to: https://www.digitalocean.com
   - Click "Sign Up"
   - Use Serenity company email
   - $200 free credit for first 60 days!

2. **Create App:**
   - Click "Create" → "Apps"
   - Connect GitHub repository
   - Choose "Node.js" for backend
   - DigitalOcean auto-detects everything

3. **Add Database:**
   - Click "Create" → "Databases"
   - Choose "PostgreSQL"
   - Choose "Basic" plan ($15/month)
   - Choose "New York" or "San Francisco" region (closest to Ohio)

4. **Configure Environment:**
   - I'll provide all environment variables
   - Add to App Platform settings
   - Includes Twilio, SendGrid, Sandata credentials

**Timeline:** 2-3 hours setup

**Cost:**
- App hosting: ~$12/month
- PostgreSQL database: ~$15/month
- **Total: ~$27/month**

**Alternative Options:**
- **AWS:** More powerful, more complex, ~$30-50/month
- **Heroku:** Easiest, but more expensive, ~$25-40/month

**What Happens Next:**
- Backend goes live at https://console.serenitycarepartners.com
- Database migrations run automatically
- Automatic deployments when code updates
- Monitoring and alerts set up

---

### 7. Change Healthcare Clearinghouse Account

**What You Need:** Electronic claims submission service

**Why This Matters:**
- Automate 837 claims file submission
- Auto-retrieve 835 remittance (payment) files
- Track claim status electronically
- **Without this, you manually upload claims files** (works, just slower)

**What To Do:**

1. **Research options:**
   - **Change Healthcare** (recommended): Industry standard, good API
   - **Availity**: Popular, slightly cheaper
   - **Waystar**: Good for small agencies

2. **Apply:**
   - Go to clearinghouse website
   - Click "Get Started" or "Contact Sales"
   - Provide:
     - Serenity Care Partners NPI
     - Tax ID (EIN)
     - Business license
     - Contact information

3. **Wait for approval:**
   - Usually 1-2 weeks
   - They verify you're a legit healthcare provider
   - May ask for additional documentation

4. **Receive credentials:**
   - Submitter ID
   - Receiver ID
   - API Key
   - Endpoint URLs

**Timeline:** 1-2 weeks for approval

**Cost:**
- Setup fee: ~$500 (one-time)
- Per-claim fee: ~$0.30-0.50 per claim
- Example: 100 claims/month = ~$30-50/month

**When To Do This:**
- Not urgent for Phase 0 (no billing yet)
- Do in Month 2 when you're ready to bill
- **Workaround:** Manual upload via clearinghouse web portal

**What Happens Next:**
- System auto-submits 837 files nightly
- Polls for acknowledgments (997/999)
- Downloads remittance files (835)
- Auto-posts payments
- **Fully automated billing!**

---

### 8. Gusto API Access

**What You Need:** API access to your Gusto payroll account

**Why This Matters:**
- EVV hours flow automatically to payroll
- No manual timesheet entry
- Overtime calculated automatically
- Bonus tracking integrated
- **Without this, you export CSV from Console → manual import to Gusto** (works, just manual)

**What To Do:**

1. **Log into Gusto:**
   - Go to: https://app.gusto.com
   - Use your existing Gusto account

2. **Enable API access:**
   - Go to: https://app.gusto.com/apps/api
   - Click "Request API Access"
   - Provide use case: "Integrate with our home care ERP system for automated timesheets"

3. **Wait for approval:**
   - Usually approved within 1 week
   - Gusto support may contact you

4. **Get credentials:**
   - After approval, generate API token
   - Note your Company ID (in Gusto under Company Settings)

**Timeline:** 1 week for approval

**Cost:** Included in your regular Gusto subscription (no extra fee)

**When To Do This:**
- Do in Month 2 before first payroll
- **Workaround:** CSV export works fine initially

**What Happens Next:**
- Hours from EVV sync to Gusto automatically
- Regular vs. overtime separated
- Bonus amounts calculated
- One-click payroll submission

---

## Summary: What To Do When

### TODAY (30 minutes):
- [ ] **Call/email Sandata to escalate registration** 🔴
- [ ] Sign up for Twilio (~15 min)
- [ ] Sign up for SendGrid (~15 min)

### THIS WEEK (2 hours):
- [ ] Apply for Apple Developer account ($99)
- [ ] Apply for Google Play account ($25)
- [ ] Choose hosting provider (DigitalOcean recommended)
- [ ] Follow up with Sandata (if no response)

### WEEK 2 (3 hours):
- [ ] Set up production server
- [ ] Deploy backend + database
- [ ] Test mobile apps (internal)
- [ ] Continue Sandata escalation

### MONTH 2 (as needed):
- [ ] Apply for clearinghouse account (when ready to bill)
- [ ] Enable Gusto API access (before first payroll)
- [ ] Deploy public website (when ready to recruit)

---

## Cost Summary

**Immediate (Week 1):**
- Apple Developer: $99/year
- Google Play: $25 one-time
- Twilio: ~$15/month
- SendGrid: FREE
- **Total: ~$140 upfront + $15/month**

**Month 1-2:**
- Server hosting: ~$27/month
- **Total: ~$42/month**

**Month 2-3 (when billing starts):**
- Clearinghouse: ~$500 setup + $0.30-0.50/claim
- Gusto API: FREE (included in subscription)
- **Total: ~$500 one-time + variable per claim**

**Annual costs:**
- Apple Developer renewal: $99/year
- Everything else: Monthly subscriptions
- **Total first year: ~$700-800 + server costs + claim fees**

**This is minimal investment for a healthcare operation!**

---

## Questions? Blockers?

**If you're stuck on any of these:**
1. Take a screenshot of where you're stuck
2. Write down the error message or question
3. Send to me and I'll walk you through it

**Common questions:**

**Q: "I don't have a DUNS number for Apple Developer"**
A: Apple provides a free D-U-N-S number request form. Takes 1-2 weeks but they'll help you.

**Q: "Do I need a separate Google account for Play Store?"**
A: You can use your personal Gmail or create serenity@gmail.com - either works.

**Q: "What if Sandata takes months?"**
A: You can still launch with non-Medicaid patients! Private insurance or cash-pay. You'll be ready when Sandata approves.

**Q: "Can we do Heroku instead of DigitalOcean?"**
A: Yes! Heroku is easier but slightly more expensive (~$30-40/month vs $27). Your choice.

**Q: "Do we really need both iPhone and Android?"**
A: Check your caregivers' phones first. If 90%+ have iPhone, start with iOS only. But usually you need both (about 50/50 split).

---

## THE BOTTOM LINE

**Code Status:** 85-90% complete ✅
**Blocking Development:** Nothing! Code is ready.
**Blocking Deployment:** The items in this document.

**Most of these take < 1 hour each. The only long wait is Sandata (weeks).**

**Start with the quick wins (Twilio, SendGrid) so we can test those features immediately!**

**You're so close. Let's get these done and launch!** 🚀
