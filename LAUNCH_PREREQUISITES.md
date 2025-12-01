# Serenity Care Partners - Launch Prerequisites

**Target Launch Date:** December 16, 2025
**Last Updated:** November 26, 2025

---

## Status Overview

| Category | Status | Completion |
|----------|--------|------------|
| Backend Code | COMPLETE | 100% |
| Database Schema | COMPLETE | 100% |
| Frontend Code | COMPLETE | 100% |
| External Services | NOT STARTED | 0% |
| Production Infrastructure | NOT STARTED | 0% |

---

## CRITICAL PATH - External Services

### 1. Sandata API Credentials
- [ ] **CALL TODAY** - 2-3 week lead time
- [ ] Contact: Sandata support or Ohio Medicaid EVV program
- [ ] Request: Sandbox/test environment credentials
- [ ] Request: Production credentials
- [ ] Document: API endpoint URLs, authentication method
- [ ] Test: Connection to sandbox environment

**Why Critical:** Cannot submit EVV data to Ohio Medicaid without Sandata integration. This is the longest lead time item.

### 2. SendGrid (Email Service)
- [ ] Create account at https://sendgrid.com
- [ ] Verify sender domain (serenitycarepartners.com)
- [ ] Generate API key
- [ ] Add to `.env`: `SENDGRID_API_KEY=xxx`
- [ ] Test: Send test email

**Time Required:** ~15 minutes

### 3. Twilio (SMS Service)
- [ ] Create account at https://twilio.com
- [ ] Get phone number for sending SMS
- [ ] Generate API credentials (Account SID, Auth Token)
- [ ] Add to `.env`: `TWILIO_ACCOUNT_SID=xxx`, `TWILIO_AUTH_TOKEN=xxx`
- [ ] Test: Send test SMS

**Time Required:** ~15 minutes

---

## Production Infrastructure

### 4. Production Database (PostgreSQL)
- [ ] Choose provider:
  - [ ] Option A: Railway (recommended for simplicity)
  - [ ] Option B: Supabase (includes auth features)
  - [ ] Option C: AWS RDS (enterprise)
  - [ ] Option D: DigitalOcean Managed Database
- [ ] Provision database
- [ ] Run migrations: `npm run migrate`
- [ ] Run seed data (if needed): `npm run seed`
- [ ] Update production `DATABASE_URL`

**Time Required:** ~30 minutes

### 5. Backend Deployment
- [ ] Choose platform:
  - [ ] Option A: Railway (recommended)
  - [ ] Option B: Render
  - [ ] Option C: AWS ECS/Fargate
  - [ ] Option D: DigitalOcean App Platform
- [ ] Set environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET` (generate secure random string)
  - [ ] `NODE_ENV=production`
  - [ ] `SENDGRID_API_KEY`
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `SANDATA_API_KEY` (when received)
  - [ ] `SANDATA_API_URL`
- [ ] Deploy backend
- [ ] Verify health endpoint: `https://api.serenitycarepartners.com/health`

**Time Required:** ~1 hour

### 6. Frontend Deployment
- [ ] Choose platform:
  - [ ] Option A: Vercel (recommended for React)
  - [ ] Option B: Netlify
  - [ ] Option C: AWS CloudFront + S3
- [ ] Set environment variables:
  - [ ] `VITE_API_URL=https://api.serenitycarepartners.com`
- [ ] Deploy frontend
- [ ] Verify: https://app.serenitycarepartners.com

**Time Required:** ~30 minutes

### 7. Domain & SSL
- [ ] Configure DNS for:
  - [ ] `api.serenitycarepartners.com` -> backend
  - [ ] `app.serenitycarepartners.com` -> frontend
- [ ] SSL certificates (usually automatic with Railway/Vercel)
- [ ] Verify HTTPS works

**Time Required:** ~30 minutes (plus DNS propagation)

---

## Pre-Launch Testing

### 8. End-to-End Testing
- [ ] Console login (founder account)
- [ ] View dashboard with real data
- [ ] Create new caregiver
- [ ] Create new client
- [ ] Create new shift
- [ ] Mobile login (caregiver account)
- [ ] View today's shifts
- [ ] Clock in with GPS
- [ ] Clock out with GPS
- [ ] Verify shift status updated
- [ ] Check claims readiness report

### 9. Security Checklist
- [ ] JWT_SECRET is unique and secure (32+ chars)
- [ ] Database credentials not in code
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] No sensitive data in logs

### 10. Monitoring Setup
- [ ] Error tracking (Sentry recommended)
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Database backup schedule configured

---

## Environment Variables Reference

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/serenity_erp

# Authentication
JWT_SECRET=your-secure-random-string-32-chars-minimum

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Sandata EVV Integration
SANDATA_API_URL=https://api.sandata.com/v1
SANDATA_API_KEY=xxxxxxxxxxxx
SANDATA_AGENCY_ID=xxxxxxxxxxxx

# Environment
NODE_ENV=production
PORT=3001
```

---

## Quick Commands

```bash
# Development
cd backend && npm run dev:api     # Start API server

# Database
npm run migrate                    # Run migrations
npm run seed                       # Seed test data

# Production Build
npm run build                      # Build for production
npm start                          # Start production server
```

---

## Contacts

| Service | Contact | Notes |
|---------|---------|-------|
| Sandata | TBD | EVV aggregator for Ohio |
| SendGrid | support@sendgrid.com | Email service |
| Twilio | support@twilio.com | SMS service |

---

## Timeline

| Date | Milestone |
|------|-----------|
| Nov 26 | Backend code complete |
| Nov 27 | Call Sandata for credentials |
| Dec 1 | Set up SendGrid, Twilio |
| Dec 5 | Production database provisioned |
| Dec 10 | Backend deployed to production |
| Dec 12 | Frontend deployed to production |
| Dec 14 | End-to-end testing complete |
| Dec 15 | Sandata credentials received (estimate) |
| **Dec 16** | **LAUNCH** |

---

## Notes

- Sandata is the critical path - everything else can be done in 1-2 days
- Test with sandbox/staging before production
- Keep founder@serenitycarepartners.com / ChangeMe123! for initial admin access
- Mobile PIN for all caregivers in dev: 1234
