# Google Play Store Submission Materials

Use this document to copy-and-paste directly into your Google Play Console.

---

## 1. Store Listing (Marketing)

### App Name
`Serenity Care Partners`

### Short Description (Max 80 chars)
*Secure portal for Serenity caregivers. Verify visits, document care, and track earnings.*

### Full Description (Max 4000 chars)
**Serenity Mobile is the official field operations app for Serenity Care Partners staff.**

Designed for our dedicated caregivers, this application transforms how we deliver home health care, ensuring every visit is documented accurately and every patient receives the highest standard of support.

**Key Features:**

*   **📅 Real-Time Schedule:** View your daily and weekly assigned visits at a glance. Get instant notifications for schedule updates.
*   **📍 Verified Visits (EVV):** Seamless Electronic Visit Verification compliant with the 21st Century Cures Act. GPS-enabled Clock-In and Clock-Out ensures accurate timekeeping.
*   **📋 Clinical Care Plans:** Access patient-specific care plans and medication lists directly on your device. Never miss a critical task.
*   **💊 ADL Documentation:** Easy checklist interface to record Activities of Daily Living (Bathing, Meals, Mobility) directly at the point of care.
*   **💰 Earnings Tracker:** Monitor your completed visits and estimated earnings in real-time.
*   **🔒 Secure & Private:** Built with HIPAA-compliant security, including FaceID/Biometric login and end-to-end data encryption.

**Note:** This application is restricted to employed staff of Serenity Care Partners. An active employee account is required to log in.

---

## 2. Privacy Policy

**URL:** `https://www.serenitycarepartners.com/privacy`
*(This page is already built in your web platform).*

---

## 3. App Access (For Google Reviewers)

**Instructions:**
> "This application is an enterprise tool for home health aides. To test the app, please use the provided demo credentials.
>
> 1. Grant Location Permission (Required for EVV Compliance).
> 2. Log in with the email and password provided.
> 3. On the 'Home' tab, you will see a list of assigned visits.
> 4. Tap 'Clock In' to start a visit.
> 5. Tap 'Patient Details' to view the Care Plan.
> 6. Tap 'End Visit' to complete ADL documentation and Clock Out."

**Demo Credentials:**
*   **Username (Email):** `demo@serenitycarepartners.com`
*   **Password:** `Demo1234!`

> [!WARNING]
> These credentials will ONLY work if your Backend is deployed to GCP. The Reviewers connect to the live server.

---

## 4. Data Safety Form (Answers)

**Does your app collect or share any of the required user data types?** -> **YES**

| Category | Data Type | Collected? | Shared? | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Location** | Exact Location | **Yes** | No | **App Functionality, Fraud Prevention** (For EVV Compliance) |
| **Personal Info** | Name, Email, User IDs | **Yes** | No | **Account Management** |
| **Personal Info** | Address, Phone # | **Yes** | No | **App Functionality** (Patient navigation) |
| **Health & Fitness** | Health info | **Yes** | No | **App Functionality** (Care Plans/Meds - Read only) |
| **App Activity** | App interactions | **Yes** | No | **Analytics** (To improve the app) |

*   **Is all data encrypted in transit?** -> **YES**
*   **Can users request data deletion?** -> **YES** (Via the Office Admin)

---

## 5. Content Rating
*   **Category:** Utility / Productivity (Enterprise).
*   **Violence/Gore/Profanity:** No.
*   **Communication:** Yes (Messaging Feature).

**Likely Rating:** "E" (Everyone) or "E10+".

---
