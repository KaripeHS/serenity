# 🚀 Serenity GCP Deployment Guide (Zero to Hero)

This guide will take you from **zero GCP configuration** to a fully automated, HIPAA-compliant deployment pipeline.

## Phase 0: Strategy & Architecture (Multi-App)
**READ THIS FIRST:** Since you have multiple apps/platforms, you must adopt the correct structure from Day 1.

### **The Golden Rule: One Project Per App**
Do **NOT** put all your apps into a single GCP Project. Instead, create a separate Project for each application.

*   **App 1 (Serenity):** Project ID `serenity-erp-prod`
*   **App 2 (Vendor Portal):** Project ID `vendor-portal-prod`
*   **App 3 (Mobile API):** Project ID `mobile-api-prod`

### **Why?**
1.  **Security Isolation:** If one app is compromised, the hackers cannot touch the database or resources of the other apps.
2.  **Cost Tracking:** You can see exactly how much each app costs on your billing report.
3.  **Cleanliness:** It prevents naming conflicts (e.g., two apps both wanting a database named `users`).

### **How to Manage Billing?**
You only need **ONE Billing Account** (one credit card). You can link hundreds of Projects to that single Billing Account.
1.  Go to **Billing** in the Console.
2.  You will see a unified invoice, but you can filter by "Project" to see who is spending what.

---

## Phase 1: Account & Project Setup
1.  **Create GCP Account:** Go to [cloud.google.com](https://cloud.google.com) and sign up. You usually get $300 in free credits.
2.  **Create a Project:**
    *   Console > Top Bar > Select Project > **New Project**.
    *   Name: `serenity-erp-prod`.
    *   Note the **Project ID** (e.g., `serenity-erp-prod-12345`). You will need this later.
3.  **Enable Billing:** Ensure a billing account is linked to this project.
4.  **Enable APIs:**
    *   Go to **APIs & Services > Library**.
    *   Search for and ENABLE the following:
        *   **Cloud Run API**
        *   **Artifact Registry API**
        *   **Cloud SQL Admin API**
        *   **Cloud Build API**
        *   **Firebase Management API**

## Phase 2: Database Setup (Cloud SQL)
1.  Go to **SQL** in the GCP Console.
2.  Click **Create Instance** > **PostgreSQL**.
3.  **Instance ID:** `serenity-db`.
4.  **Password:** Generate a strong password (SAVE THIS!).
5.  **Database Version:** PostgreSQL 15 (or 14).
6.  **Configuration (Cost Saving):**
    *   **Region:** `us-central1` (Iowa) - usually cheapest.
    *   **Zonal availability:** Single zone (cheaper than HA).
    *   **Machine type:** `Shared core` > `db-f1-micro` (approx $10/mo).
7.  **Connections:**
    *   Select **Public IP** (for easiest setup initially).
    *   **Authorized Networks:** Add `0.0.0.0/0` (temporarily) to allow connection from your local machine for migration, OR use Cloud SQL Auth Proxy (more secure).
8.  Click **Create Instance**.
9.  **Create Database:** Once ready, go to **Databases** tab > **Create Database** > Name: `serenity`.

## Phase 3: Backend Setup (Cloud Run)
1.  **Install gcloud CLI:** [Download & Install](https://cloud.google.com/sdk/docs/install).
2.  **Login:** Run `gcloud auth login` in your terminal.
3.  **Set Project:** `gcloud config set project [YOUR_PROJECT_ID]`.
4.  **Create Artifact Registry:**
    ```bash
    gcloud artifacts repositories create serenity-repo \
        --repository-format=docker \
        --location=us-central1 \
        --description="Serenity Backend Docker Repo"
    ```
5.  **Build & Push Image (First Time):**
    ```bash
    cd backend
    # Build the image (replace [PROJECT_ID] with yours)
    docker build -t us-central1-docker.pkg.dev/[PROJECT_ID]/serenity-repo/serenity-backend:initial .
    
    # Configure Docker auth
    gcloud auth configure-docker us-central1-docker.pkg.dev
    
    # Push the image
    docker push us-central1-docker.pkg.dev/[PROJECT_ID]/serenity-repo/serenity-backend:initial
    ```
6.  **Deploy to Cloud Run (First Time):**
    *   Go to **Cloud Run** in Console > **Create Service**.
    *   **Container Image URL:** Select the image you just pushed.
    *   **Service Name:** `serenity-backend`.
    *   **Region:** `us-central1`.
    *   **Authentication:** "Allow unauthenticated invocations" (since this is an API, you handle auth internally, or restrict if using API Gateway).
    *   **Environment Variables:** Add `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`.
    *   Click **Create**.

## Phase 4: Frontend Setup (Firebase Hosting)
1.  **Install Firebase CLI:** `npm install -g firebase-tools`.
2.  **Login:** `firebase login`.
3.  **Initialize:**
    ```bash
    cd frontend
    firebase init hosting
    ```
    *   **Project:** Use an existing project > Select `serenity-erp-prod`.
    *   **Public directory:** `dist` (Vite builds to `dist`).
    *   **Configure as single-page app?** Yes.
    *   **Set up automatic builds and deploys with GitHub?** Yes (This creates the service account for you!).
4.  **Build & Deploy (Manual Test):**
    ```bash
    npm run build
    firebase deploy
    ```

## Phase 5: CI/CD Automation (GitHub Actions)
I have already created the workflow file for you at `.github/workflows/deploy-gcp.yml`. You just need to configure the secrets in GitHub.

1.  **Create Service Account for Backend Deploy:**
    *   Go to **IAM & Admin > Service Accounts**.
    *   Create new SA: `github-deployer`.
    *   **Roles:**
        *   `Cloud Run Admin`
        *   `Service Account User`
        *   `Artifact Registry Writer`
    *   **Keys:** Create new Key > JSON. Download it.
2.  **GitHub Secrets:**
    *   Go to your GitHub Repo > **Settings > Secrets and variables > Actions**.
    *   Add the following secrets:
        *   `GCP_PROJECT_ID`: Your Project ID.
        *   `GCP_SA_KEY`: Paste the entire content of the JSON key file from step 1.
        *   `FIREBASE_SERVICE_ACCOUNT`: (Should be created automatically by `firebase init`, if not, follow similar steps for Firebase Admin role).
        *   `DB_HOST`: Your Cloud SQL Public IP.
        *   `DB_USER`: `postgres`.
        *   `DB_PASS`: Your DB password.
        *   `DB_NAME`: `serenity`.

## Phase 6: Go Live!
1.  **Commit & Push:**
    ```bash
    git add .
    git commit -m "Setup GCP deployment pipeline"
    git push origin main
    ```
2.  **Watch the Magic:** Go to the **Actions** tab in GitHub. You should see the "Deploy to GCP" workflow running.
3.  **Verify:**
    *   Backend: Check Cloud Run URL.
    *   Frontend: Check Firebase Hosting URL.

## Cost Summary (Estimated)
*   **Frontend:** $0/mo (Firebase Free Tier).
*   **Backend:** ~$0-2/mo (Cloud Run Free Tier covers 2M requests/mo).
*   **Database:** ~$10/mo (Cloud SQL Micro).
*   **Total:** **~$10-12/month** (vs. $20+ for Vercel Pro or hundreds for Enterprise).
