# Serenity Mobile: App Store Launch Guide

Since you are using **Expo**, you have access to **EAS (Expo Application Services)**. This relies on cloud build servers to handle the complex "Signing Coefficients" and "Certificate Management" that usually confuse first-time developers. 

**This guide assumes you have NO prior experience.** Follow it step-by-step.

---

## 🛑 Step 1: The "Entry Tickets" (Developer Accounts)
Before you can upload anything, you must purchase developer licenses. This verifies your business identity.

### 🍎 Apple App Store (iOS)
*   **Cost:** $99 / year.
*   **Action:** Enroll in the [Apple Developer Program](https://developer.apple.com/programs/).
*   **Critical Note:** Enroll as an **Organization** (Serenity Care Partners), *not* an Individual. This allows "Serenity" to appear as the seller, not your personal name. You will need your D-U-N-S number (standard for businesses).

### 🤖 Google Play Store (Android)
*   **Cost:** $25 (One-time fee).
*   **Action:** Sign up for the [Google Play Console](https://play.google.com/console).
*   **Note:** Verification takes 1-3 days. Do this *now* while you prepare the app.

---

## 🛠️ Step 2: Prepare Your Workstation
You need the Expo CLI tool installed on your computer to talk to the cloud builders.

1.  **Open Terminal** (in VS Code).
2.  **Install EAS CLI:**
    ```bash
    npm install -g eas-cli
    ```
3.  **Login to Expo:**
    ```bash
    eas login
    ```
    *   *If you don't have an Expo account, create one at [expo.dev](https://expo.dev).*

---

## ☁️ Step 3: Configure Cloud Build
We have already configured `eas.json` in Phase 31, but let's double-check the project is linked.

1.  **Navigate to Mobile Folder:**
    ```bash
    cd mobile
    ```
2.  **Link Project:**
    ```bash
    eas build:configure
    ```
    *   Select **All** platforms (Android & iOS).
    *   This generates a `projectId` in your `app.json`.

---

## 🚀 Step 4: The Build (Magic Button)
This step sends your code to Expo's massive servers. They compile the actual native `.ipa` (iOS) and `.aab` (Android) files.

**Run this command:**
```bash
eas build --platform all --profile production --auto-submit
```

### What will happen?
1.  **Apple Login:** It will ask for your Apple ID. Login. It will *automatically* generate all the Certificates and Provisioning Profiles for you. (This saves you hours of headache).
2.  **Android Key:** It will ask to generate a Keystore. Say **YES**.
3.  **Waiting:** The build takes 15-30 minutes. You can turn off your computer; it runs in the cloud.

---

## 📦 Step 5: Store Submission

### If you used `--auto-submit`:
Expo will automatically upload the binary to **App Store Connect** (Apple) and **Google Play Console**.

### If you need to submit manually later:
```bash
eas submit --platform ios
eas submit --platform android
```

---

## 📝 Step 6: The "Store Listing" (Marketing)
While the code is building, go to the websites (App Store Connect / Play Console) and fill in the text/images.

### Checklist
*   **App Icon:** 1024x1024 png (We have this).
*   **Screenshots:** You need at least 3 screenshots of the app in action.
    *   *Tip: Run the app in the simulator, take screenshots, and use a tool like "AppMockup" to frame them nicely.*
*   **Description:** "Comprehensive caregiver portal for Serenity Care Partners. manage visits, document care, and track earnings."
*   **Privacy Policy:** You must host a URL. Use: `https://www.serenitycarepartners.com/privacy` (We can create this page easily).
*   **Support URL:** `https://www.serenitycarepartners.com/support`.

---

## ⏳ Step 7: The Review
Once uploaded and listed:
1.  Click **"Submit for Review"** on both portals.
2.  **Wait:**
    *   **Apple:** Usually 24-48 hours. They might reject it for small things (e.g., "Need a demo account"). Provide them with a test user: `demo@serenity.com` / `password123`.
    *   **Google:** Can take 3-5 days for the first review.

### Common "Gotchas"
*   **Biometrics:** You must explain *why* you use FaceID (Answer: "For secure, HIPAA-compliant authentication").
*   **Location:** You must explain *why* you use Background Location (Answer: "For Electronic Visit Verification (EVV) compliance as mandated by the 21st Century Cures Act").

---

## 🆘 Need Help?
If the build fails, the error log URL provided by EAS is usually very clear.
**Command to check build status:**
```bash
eas build:list
```
