# Serenity Care Partners — Audit Remediation v2 (Correction Pass)

**Date:** 2026-02-24
**Branch:** claude/audit-website-content-sr4yw

## Summary

- Reversions applied: 19
- Previous fixes retained: 20
- New fixes applied: 0
- Manual action items: 0

## Reversions (Over-Corrections Fixed)

| File | What Was Reverted | Why |
|------|------------------|-----|
| CareersPage.tsx | Restored LPN job listing (was replaced with Companion Caregiver) | Agency employs LPNs for clinical supervision under RN direction — real position |
| CareersPage.tsx | Restored RN Supervisor job listing (was replaced with Homemaker) | Agency employs RN Supervisors per Policy 44 — conducts assessments, develops care plans, provides clinical oversight |
| CareersPage.tsx | Restored LPN and RN Supervisor in position dropdown | Clinical roles are real positions that need to be available in the application form |
| CareersPage.tsx | Restored "RN, LPN" in license type placeholder | Clinical staff have nursing licenses — the placeholder should reflect this |
| CareersPage.tsx | "experienced caregiver" → "experienced healthcare professional" in bottom CTA | With clinical roles restored, CTA should be inclusive of nurses and caregivers |
| AboutPage.tsx | "Redefining Home Care" → "Redefining Home Health Care" | "Home health care" is the correct Ohio licensure category under ORC Chapter 3701-60 |
| AboutPage.tsx | "home care is delivered" → "home health care is delivered" | Same — correct licensure terminology |
| AboutPage.tsx | "most trusted home care provider" → "most trusted home health care provider" | Correct licensure category |
| AboutPage.tsx | "Experienced professionals" → "Experienced healthcare professionals" | Staff ARE healthcare professionals working in the home health care industry |
| AboutPage.tsx | "experience in home care" → "experience in home health care" (Gloria bio) | Correct industry descriptor |
| AboutPage.tsx | "home care operations" → "healthcare operations" (Bignon bio) | "Healthcare operations" is standard HIPAA language and accurate industry descriptor |
| ClientSelfIntake.tsx | "care decisions" → "medical decisions" (under-18 guardian flag) | Legal/rights term — guardians are designated for medical decisions (informed consent, advance directives) |
| ClientSelfIntake.tsx | "home care needs" → "home health care needs" (welcome text) | Correct licensure category |
| ClientSelfIntake.tsx | "client's care needs" → "client's health needs" (medical info section) | Clients have health needs; describing them is not claiming to provide medical services |
| ClientSelfIntake.tsx | "Primary Reason for Care" → "Primary Diagnosis / Reason for Care" | Diagnosis is a standard and necessary intake field — clients have medical diagnoses that inform care plans |
| PrivateCareLanding.tsx | "confidential consultation" → "confidential assessment" | RN Supervisor conducts assessments per Policy 41 and 43 — this is accurate |
| PrivateCareLanding.tsx | "private-duty home care" → "private-duty nursing" | Per owner direction — keep original "private-duty nursing" language |
| PublicLayout.tsx | "home care in Greater Cincinnati" → "home health care in Greater Cincinnati" (footer) | Correct licensure category |
| index.html | "Home Care" → "Home Health Care" (page title and meta description) | Correct licensure category; also restored "non-medical home health care services" in description |
| TermsPage.tsx | "non-medical home care services/agency" → "non-medical home health care services/agency" (4 instances) | "Non-medical home health care" is the correct and accurate licensure descriptor |
| NonDiscriminationPage.tsx | "home care services" → "home health care services" | Correct licensure category |
| ReferralPage.tsx | Restored "medical conditions" in care needs placeholder | Clients have medical conditions — describing them in a referral is standard and necessary |

## Previous Fixes Retained

| File | Fix | Category |
|------|-----|----------|
| All public pages | "patient" → "client" in user-facing text (30+ instances) | Terminology |
| ReferralPage.tsx | Removed Medicare as insurance option, added "Other / Not Sure" | Regulatory |
| Multiple files | Office hours corrected to 8:00 AM–5:00 PM ET | Contact info |
| Multiple files | Service area corrected to 4 counties (Hamilton, Butler, Warren, Clermont) | Geography |
| Multiple files | "Southwest Ohio" → "Greater Cincinnati" | Geography |
| Multiple files | "Seven counties" → "four counties" | Geography |
| PublicLayout.tsx | Copyright updated to dynamic year with "Serenity Care Partners LLC" | Legal |
| PublicLayout.tsx | "Licensed by the Ohio Department of Health" added to footer | Regulatory |
| CareersPage.tsx | Removed "skilled nursing care including medication administration, wound care, and health monitoring" from caregiver descriptions | Regulatory |
| ContactPage.tsx, ReferralPage.tsx | Added HIPAA disclaimers to forms | Compliance |
| CareersPage.tsx | Added BCI/FBI background check disclosure | Compliance |
| CareersPage.tsx | Added equal opportunity employer statement | Legal |
| PrivateCareLanding.tsx | "Post-Operative Recovery" → "Post-Operative Companion Support" | Regulatory |
| All public pages | Phone number fixed to (513) 400-5113 everywhere | Contact info |
| All public pages | Email fixed to Hello@serenitycarepartners.com everywhere | Contact info |
| AboutPage.tsx | Image alt text "elderly patient" → "elderly client at home" | Terminology |
| PublicLayout.tsx | Navigation "Refer a Patient" → "Refer a Client" | Terminology |
| AboutPage.tsx | Mission statement updated to canonical version | Content accuracy |
| ContactPage.tsx | Office hours "8AM - 6PM" → "8AM - 5PM ET" | Contact info |
| TermsPage.tsx | Service area description updated to 4 counties | Geography |

## New Fixes (If Any)

| File | Fix | Category |
|------|-----|----------|
| None | — | — |

## Manual Action Required

| Issue | Location | Instructions |
|-------|----------|-------------|
| None | — | — |

## Build Verification

- TypeScript compilation: PASS (pre-existing type definition warning only, not related to changes)
- Vite production build: PASS (3251 modules transformed, built in 22.22s)
- No runtime errors introduced

## Regulatory Line Summary

**What Serenity Care Partners IS:**
- A non-medical home health care agency licensed by the Ohio Department of Health
- Employs clinical staff (RN Supervisor, LPN) for oversight and supervision
- Provides personal care, homemaker services, companionship, respite care

**What the website correctly describes:**
- Clinical roles: RN Supervisor conducts assessments, develops care plans, provides clinical oversight
- LPN provides clinical supervision under RN direction
- Clients have diagnoses, health needs, medical conditions — these inform care plans
- "Healthcare professionals," "healthcare operations" — standard HIPAA and industry language
- "Home health care" — correct Ohio licensure category

**What the website correctly avoids claiming:**
- No skilled nursing services to clients as a billable service line
- No medication administration (only reminders)
- No wound care, IV therapy, physical/occupational/speech therapy
- No Medicare billing
- No medical provider accreditations not held

## Suggested Commit Message

```
fix: correct over-aggressive content audit, restore clinical terminology

Reversions:
- Restored RN Supervisor and LPN job listings with corrected descriptions
- Restored LPN/RN options in careers form dropdown
- Restored "Primary Diagnosis / Reason for Care" intake field
- Restored "healthcare professionals," "healthcare operations" (HIPAA language)
- Restored "home health care" (correct licensure category)
- Restored "confidential assessment" and "health needs"
- Restored "medical decisions" in client rights context
- Restored "private-duty nursing" per owner direction

Retained from v1:
- All "patient" → "client" replacements
- Medicare removal, service area corrections, contact info fixes
- HIPAA disclaimers, EEO statement, background check disclosure
- Copyright, footer, and office hours corrections

Non-medical home health agencies use medical terminology for clinical
oversight, client diagnoses, and regulatory compliance. The line is
providing vs. describing — we do not provide skilled nursing services
to clients, but our clinical staff conduct assessments and supervise care.
```
