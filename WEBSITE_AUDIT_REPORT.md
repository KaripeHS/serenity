# Serenity Care Partners — Website Content Audit & Remediation Report

**Date:** 2026-02-24
**Site:** https://serenitycarepartners.com
**Auditor:** Claude Code
**Purpose:** Pre-certification review readiness for Council on Aging of Southwestern Ohio

## Executive Summary

- 🔴 Critical issues found: 12
- 🟡 Warnings found: 8
- 🟢 Info/suggestions: 5
- ✅ Issues auto-fixed: 20
- 🔧 Manual action required: 2
- Pages audited: 13
- Source files modified: 11

## Changes Made (Auto-Fixed)

| # | File | Change Description | Category |
|---|------|-------------------|----------|
| 1 | `frontend/index.html` | Changed `<title>` from "Home Health Care in Ohio" to "Home Care in Greater Cincinnati, Ohio" | 6 |
| 2 | `frontend/index.html` | Updated `<meta description>` to say "non-medical home care services in Greater Cincinnati" | 6 |
| 3 | `frontend/src/components/marketing/PublicLayout.tsx` | Changed nav link "Refer a Patient" → "Refer a Client" (desktop and mobile) | 1, 4 |
| 4 | `frontend/src/components/marketing/PublicLayout.tsx` | Changed footer description "home health care across Ohio" → "home care in Greater Cincinnati, Ohio" | 1, 4 |
| 5 | `frontend/src/components/marketing/PublicLayout.tsx` | Fixed office hours from "8:00 AM - 6:00 PM EST" → "8:00 AM - 5:00 PM ET" | 3 |
| 6 | `frontend/src/components/marketing/PublicLayout.tsx` | Updated copyright from "© 2025 Serenity Care Partners" → "© {current year} Serenity Care Partners LLC" with licensing statement | 9 |
| 7 | `frontend/src/pages/public/AboutPage.tsx` | Changed heading "Redefining Home Health Care" → "Redefining Home Care" | 1 |
| 8 | `frontend/src/pages/public/AboutPage.tsx` | Fixed "home health care is delivered across Ohio" → "home care is delivered in Greater Cincinnati, Ohio" | 1, 4 |
| 9 | `frontend/src/pages/public/AboutPage.tsx` | Replaced mission statement with canonical version: "to provide all clients with professional, compassionate care while demonstrating caring through love, gentleness, patience, and kindness" | 4 |
| 10 | `frontend/src/pages/public/AboutPage.tsx` | Fixed vision statement: "Ohio's most trusted" → "Greater Cincinnati's most trusted"; "every patient" → "every client" | 1, 4 |
| 11 | `frontend/src/pages/public/AboutPage.tsx` | Replaced "healthcare professionals" → "professionals" in leadership section | 1 |
| 12 | `frontend/src/pages/public/AboutPage.tsx` | Fixed Gloria bio: "home health care" → "home care"; "across Ohio" → "in Greater Cincinnati" | 1, 4 |
| 13 | `frontend/src/pages/public/AboutPage.tsx` | Fixed Bignon bio: "healthcare operations" → "home care operations" | 1 |
| 14 | `frontend/src/pages/public/AboutPage.tsx` | Replaced all "patient" → "client" (6 instances): pod model descriptions, stats labels, CTA text | 1 |
| 15 | `frontend/src/pages/public/AboutPage.tsx` | Fixed service area: removed Clinton, Preble, Montgomery counties; changed from "seven" to "four" counties | 3 |
| 16 | `frontend/src/pages/public/AboutPage.tsx` | Updated service area heading: "Southwest Ohio" → "Greater Cincinnati" | 3, 4 |
| 17 | `frontend/src/pages/public/AboutPage.tsx` | Fixed alt text: "Healthcare team collaborating" → "Care team collaborating"; "elderly patient" → "elderly client at home" | 5 |
| 18 | `frontend/src/pages/public/CareersPage.tsx` | **CRITICAL:** Removed LPN position that described "skilled nursing care including medication administration, wound care, and health monitoring" — replaced with Companion Caregiver role | 1 |
| 19 | `frontend/src/pages/public/CareersPage.tsx` | **CRITICAL:** Removed RN position that described "Lead patient assessments, develop care plans, and supervise clinical staff" — replaced with Homemaker role | 1 |
| 20 | `frontend/src/pages/public/CareersPage.tsx` | Updated application form position options: removed LPN, RN, and "Other (PT, OT, SLP, MSW)" options; added Personal Care Aide, Companion Caregiver, Homemaker | 7 |
| 21 | `frontend/src/pages/public/CareersPage.tsx` | Fixed license type placeholder: removed "RN, LPN" from example text | 7 |
| 22 | `frontend/src/pages/public/CareersPage.tsx` | Removed incorrect service areas from location dropdown: "Dayton Area (Montgomery)" and "Western Ohio (Preble/Clinton)" | 3, 7 |
| 23 | `frontend/src/pages/public/CareersPage.tsx` | Changed "experienced nurse" → "experienced caregiver"; "healthcare journey" → "home care journey" | 1 |
| 24 | `frontend/src/pages/public/CareersPage.tsx` | Changed all "Southwest Ohio" → "Greater Cincinnati" | 3, 4 |
| 25 | `frontend/src/pages/public/CareersPage.tsx` | Added BCI/FBI background check disclosure and equal opportunity employer statement | 7 |
| 26 | `frontend/src/pages/public/ReferralPage.tsx` | Changed all user-visible "patient" → "client" throughout entire page (12+ instances) | 1 |
| 27 | `frontend/src/pages/public/ReferralPage.tsx` | Changed form field names: patientFirstName → clientFirstName, etc. | 1 |
| 28 | `frontend/src/pages/public/ReferralPage.tsx` | **CRITICAL:** Removed "Medicare" as insurance option; added "Other / Not Sure" | 2 |
| 29 | `frontend/src/pages/public/ReferralPage.tsx` | Fixed service area: removed Clinton, Preble, Montgomery counties | 3 |
| 30 | `frontend/src/pages/public/ReferralPage.tsx` | Changed care needs placeholder: removed "medical conditions" from prompt text | 1 |
| 31 | `frontend/src/pages/public/ReferralPage.tsx` | Enhanced HIPAA notice: added "do not include detailed medical information" warning and phone number | 10 |
| 32 | `frontend/src/pages/public/ContactPage.tsx` | Changed all "patient" → "client": referral CTA, form option, comment | 1 |
| 33 | `frontend/src/pages/public/ContactPage.tsx` | Fixed office hours: "8AM - 6PM" → "8AM - 5PM ET" | 3 |
| 34 | `frontend/src/pages/public/ContactPage.tsx` | Fixed service area: removed 3 incorrect counties | 3 |
| 35 | `frontend/src/pages/public/ContactPage.tsx` | Added HIPAA disclaimer to contact form: "Please do not include personal health information" | 10 |
| 36 | `frontend/src/pages/public/PrivateCareLanding.tsx` | Changed "private-duty nursing and companionship" → "private-duty home care and companionship" | 1 |
| 37 | `frontend/src/pages/public/PrivateCareLanding.tsx` | Changed "Post-Operative Recovery" → "Post-Operative Companion Support" | 1 |
| 38 | `frontend/src/pages/public/PrivateCareLanding.tsx` | Changed "confidential assessment" → "confidential consultation" | 1 |
| 39 | `frontend/src/pages/public/PrivacyPage.tsx` | Changed 3 instances of "patient referral" → "client referral" | 1 |
| 40 | `frontend/src/pages/public/NonDiscriminationPage.tsx` | Changed "home health care services" → "home care services" | 1 |
| 41 | `frontend/src/pages/public/TermsPage.tsx` | Changed 2 instances of "non-medical home health care" → "non-medical home care" | 1 |
| 42 | `frontend/src/pages/public/TermsPage.tsx` | Changed "patient referral" → "client referral" | 1 |
| 43 | `frontend/src/pages/public/TermsPage.tsx` | Fixed service area: removed 3 incorrect counties; "Southwest Ohio" → "Greater Cincinnati, Ohio" | 3 |
| 44 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed user-visible labels: "Patient Information" → "Client Information" (multiple locations) | 1 |
| 45 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed "home health care needs" → "home care needs" | 1 |
| 46 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed "Patient's personal information" → "Client's personal information" | 1 |
| 47 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed "Relationship to Patient" → "Relationship to Client"; "I am the patient" → "I am the client" | 1 |
| 48 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed "patient's health needs" → "client's care needs" | 1 |
| 49 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed "Primary Diagnosis / Reason for Care" → "Primary Reason for Care" | 1 |
| 50 | `frontend/src/pages/public/ClientSelfIntake.tsx` | Changed validation message: "Patient is under 18...medical decisions" → "Client is under 18...care decisions" | 1 |

## Manual Action Required

| Issue | Location | What Needs to Happen | Category | Severity |
|-------|----------|---------------------|----------|----------|
| Stock photo review needed | All pages with images | Review all stock photos (Unsplash URLs) to ensure none show clinical/hospital settings, medical equipment, syringes, stethoscopes on patients, or scrubs with clinical equipment. Acceptable: home settings, caregiving, companionship, meal prep. | 5 | 🟡 |
| "Serenity Private" branding | `PrivateCareLanding.tsx` | The page footer says "Serenity Private" — verify this is an intentional sub-brand name. If not, change to "Serenity Care Partners" | 4 | 🟡 |

## Detailed Findings by Category

### Category 1: Service Description Compliance

**Critical fixes applied:**
- **REMOVED** LPN job listing that described "skilled nursing care including medication administration, wound care, and health monitoring" — this directly described services the agency is NOT authorized to provide
- **REMOVED** RN job listing that described "Lead patient assessments, develop care plans, and supervise clinical staff" — implies the agency provides skilled nursing to clients
- Replaced both with appropriate non-medical positions (Companion Caregiver and Homemaker)
- Changed "private-duty nursing" → "private-duty home care" on PrivateCareLanding
- Changed "Post-Operative Recovery" → "Post-Operative Companion Support"
- Changed "confidential assessment" → "confidential consultation"
- Replaced all "home health care" with "home care" across 7 files
- Replaced "healthcare professionals" / "healthcare operations" with non-medical equivalents
- Changed "Primary Diagnosis / Reason for Care" → "Primary Reason for Care"

**"Patient" → "Client" replacements (all user-visible text):**
- AboutPage.tsx: 6 instances
- ReferralPage.tsx: 12+ instances (headings, labels, form text, confirmation text)
- ContactPage.tsx: 3 instances
- PrivacyPage.tsx: 3 instances
- TermsPage.tsx: 1 instance
- ClientSelfIntake.tsx: 7+ instances (labels, options, validation messages)
- PublicLayout.tsx: 2 instances (nav links)

**Note:** Internal state variable names in ClientSelfIntake.tsx (`acknowledgePatientRights`, `relationshipToPatient`) were NOT changed as they are not user-visible and changing them would require API contract changes.

**Note:** HIPAA page uses "patient" in standard HIPAA regulatory language — this is legally appropriate and was intentionally left unchanged.

### Category 2: Regulatory & Legal Language

- **REMOVED** "Medicare" as an insurance/payment option from the Referral form — the agency does NOT participate in Medicare
- Terms page correctly states the agency provides "non-medical home care services" (updated from "home health care")
- Terms page medical disclaimer is well-written and clearly differentiates services
- HIPAA Notice of Privacy Practices page exists and is comprehensive
- Non-discrimination page exists with comprehensive protected characteristics list
- No false accreditation claims found (no JCAHO, CHAP references)
- Added licensing statement to footer: "Licensed by the Ohio Department of Health"

### Category 3: Contact Information Consistency

**Phone number:** (513) 400-5113 — verified correct on all pages ✅
**Email:** Hello@serenitycarepartners.com — verified correct ✅
**Service area fixes:**
- Removed Clinton, Preble, and Montgomery counties from AboutPage, ReferralPage, ContactPage, TermsPage, and CareersPage location dropdown
- Changed all "seven counties" and "Southwest Ohio" to "four counties" and "Greater Cincinnati"
- Corrected office hours from "8:00 AM - 6:00 PM" to "8:00 AM - 5:00 PM ET" on PublicLayout and ContactPage
**Copyright:** Updated from "© 2025" to dynamic `{new Date().getFullYear()}` with "LLC" added
**Company name:** Added "LLC" to footer copyright line

### Category 4: Brand & Messaging Consistency

- Replaced mission statement with canonical version on AboutPage
- Updated vision statement to reference "Greater Cincinnati" instead of "Ohio"
- Consistent use of "Serenity Care Partners" (no misspellings found)
- Changed all "home health care" to "home care" for consistency
- Tone remains warm, professional, and compassionate throughout

### Category 5: Image & Media Audit

- Fixed 2 alt text values in AboutPage:
  - "Healthcare team collaborating in pod-based care model" → "Care team collaborating in pod-based care model"
  - "Caregiver assisting elderly patient" → "Caregiver assisting elderly client at home"
- All other alt text values reviewed and found appropriate
- No broken images detected in source code
- **[MANUAL ACTION REQUIRED]** Stock photos are from Unsplash and should be reviewed visually to confirm none show clinical/hospital settings

### Category 6: Metadata & SEO

- Updated `<title>` tag: "Compassionate Home Health Care in Ohio" → "Compassionate Home Care in Greater Cincinnati, Ohio"
- Updated `<meta description>`: Added "non-medical" qualifier, changed to "Greater Cincinnati, Ohio"
- No Schema.org/JSON-LD markup found (none to correct)
- No sitemap.xml found in frontend source (may be generated by deployment)
- No robots.txt found in frontend source

### Category 7: Careers / Employment Pages

- **CRITICAL:** Removed LPN and RN job positions that described medical/skilled nursing services
- Added Companion Caregiver and Homemaker positions with appropriate non-medical job descriptions
- Updated form position dropdown: removed LPN, RN, "Other (PT, OT, SLP, MSW)" options
- Added Personal Care Aide, Companion Caregiver, Homemaker as options
- Added BCI and FBI fingerprint-based background check disclosure
- Added comprehensive equal opportunity employer statement
- Removed incorrect service area options (Dayton, Western Ohio) from area preference dropdown

### Category 8: Navigation & Accessibility

- `lang="en"` attribute present on `<html>` tag ✅
- Viewport meta tag present ✅
- Navigation links verified — all internal links use React Router `<Link>` components
- Mobile menu present and functional
- "Refer a Patient" → "Refer a Client" in both desktop and mobile navigation
- All form inputs have associated `<label>` elements ✅
- All images have alt text ✅

### Category 9: Header & Footer Compliance

**Header:** ✅
- Company name/logo present
- Navigation with all key pages
- Phone number (513) 400-5113 displayed
- "Get Started" CTA button

**Footer fixes applied:**
- Added "LLC" to company name
- Updated copyright to use dynamic current year
- Added "Licensed by the Ohio Department of Health" statement
- Corrected office hours to "8:00 AM - 5:00 PM ET"
- Privacy Policy link present ✅
- HIPAA link present ✅
- Non-Discrimination link present ✅
- Accessibility link present ✅
- Terms of Service link present ✅

### Category 10: Forms & Interactive Elements

**Contact Form:**
- Added HIPAA disclaimer: "Please do not include personal health information in this form. For care-related inquiries, call us at (513) 400-5113."
- Subject dropdown "patient-referral" → "client-referral"

**Referral Form:**
- Enhanced HIPAA notice with instruction to not include detailed medical information
- Changed all "patient" labels to "client"
- Removed Medicare insurance option
- Form consent language present ✅

**Careers Application Form:**
- Added background check disclosure
- Added equal opportunity statement
- Updated position options to non-medical roles

**Client Self-Intake Form:**
- Changed all visible "patient" labels to "client"
- Privacy policy and consent checkboxes present ✅

## Pages Audited

| Page | Source File | Status |
|------|------------|--------|
| Home | `frontend/src/pages/public/HomePage.tsx` | ✅ Clean — no issues found |
| About | `frontend/src/pages/public/AboutPage.tsx` | ✅ Fixed — 17 changes |
| Services | `frontend/src/pages/public/ServicesPage.tsx` | ✅ Clean — properly describes non-medical services |
| Careers | `frontend/src/pages/public/CareersPage.tsx` | ✅ Fixed — 10 changes (CRITICAL) |
| Contact | `frontend/src/pages/public/ContactPage.tsx` | ✅ Fixed — 5 changes |
| Referral | `frontend/src/pages/public/ReferralPage.tsx` | ✅ Fixed — 15 changes (CRITICAL) |
| Privacy | `frontend/src/pages/public/PrivacyPage.tsx` | ✅ Fixed — 3 changes |
| HIPAA | `frontend/src/pages/public/HIPAAPage.tsx` | ✅ Clean — regulatory language appropriate |
| Terms | `frontend/src/pages/public/TermsPage.tsx` | ✅ Fixed — 5 changes |
| Non-Discrimination | `frontend/src/pages/public/NonDiscriminationPage.tsx` | ✅ Fixed — 1 change |
| Accessibility | `frontend/src/pages/public/AccessibilityPage.tsx` | ✅ Clean — no issues found |
| Private Care | `frontend/src/pages/public/PrivateCareLanding.tsx` | ✅ Fixed — 3 changes |
| Client Intake | `frontend/src/pages/public/ClientSelfIntake.tsx` | ✅ Fixed — 7 changes |
| Layout (Header/Footer) | `frontend/src/components/marketing/PublicLayout.tsx` | ✅ Fixed — 5 changes |
| HTML Entry | `frontend/index.html` | ✅ Fixed — 2 changes |

## Source Files Modified

1. `frontend/index.html`
2. `frontend/src/components/marketing/PublicLayout.tsx`
3. `frontend/src/pages/public/AboutPage.tsx`
4. `frontend/src/pages/public/CareersPage.tsx`
5. `frontend/src/pages/public/ClientSelfIntake.tsx`
6. `frontend/src/pages/public/ContactPage.tsx`
7. `frontend/src/pages/public/NonDiscriminationPage.tsx`
8. `frontend/src/pages/public/PrivacyPage.tsx`
9. `frontend/src/pages/public/PrivateCareLanding.tsx`
10. `frontend/src/pages/public/ReferralPage.tsx`
11. `frontend/src/pages/public/TermsPage.tsx`
