# Serenity Care Partners - Deployment Guide

This document outlines the deployment process for the Serenity Care Partners application.

## Architecture Overview

| Component | Technology | Hosting |
|-----------|------------|---------|
| Frontend | React + Vite | Firebase Hosting |
| Backend | Node.js + Express | Google Cloud Run |
| Database | PostgreSQL | Google Cloud SQL |
| Mobile App | Expo React Native | App Stores (separate deployment) |

---

## Frontend Deployment

The frontend is deployed to Firebase Hosting at `serenitycarepartners.com`.

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged into Firebase (`firebase login`)

### Deployment Steps

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

3. **Build the production bundle:**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with optimized static files.

4. **Deploy to Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

### Quick Deploy (One Command)
```bash
cd frontend && npm run build && firebase deploy --only hosting
```

### Verifying Deployment
- Visit https://serenitycarepartners.com
- Check Firebase Console for deployment status
- Clear browser cache if old content appears (Ctrl+Shift+R)

---

## Backend Deployment

The backend runs on Google Cloud Run.

### Prerequisites
- Docker installed and running
- Google Cloud CLI installed (`gcloud`)
- Authenticated with GCP (`gcloud auth login`)
- Project configured (`gcloud config set project serenity-erp-prod`)

### Deployment Steps

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Build the Docker image:**
   ```bash
   docker build -t gcr.io/serenity-erp-prod/serenity-backend:latest .
   ```

3. **Push to Google Container Registry:**
   ```bash
   docker push gcr.io/serenity-erp-prod/serenity-backend:latest
   ```

4. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy serenity-backend \
     --image gcr.io/serenity-erp-prod/serenity-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Quick Deploy (One Command)
```bash
cd backend && docker build -t gcr.io/serenity-erp-prod/serenity-backend:latest . && docker push gcr.io/serenity-erp-prod/serenity-backend:latest && gcloud run deploy serenity-backend --image gcr.io/serenity-erp-prod/serenity-backend:latest --platform managed --region us-central1 --allow-unauthenticated
```

---

## Common Issues & Troubleshooting

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Old content still showing | Clear browser cache or use incognito mode |
| Build fails with type errors | Run `npx tsc --noEmit` to see detailed errors |
| Firebase deploy fails | Ensure you're logged in: `firebase login` |
| 404 on page refresh | Firebase rewrites should handle this (check `firebase.json`) |

### Backend Issues

| Issue | Solution |
|-------|----------|
| Docker build fails | Check Dockerfile syntax and ensure all files exist |
| Push fails to GCR | Run `gcloud auth configure-docker` |
| Cloud Run deploy fails | Check logs: `gcloud run services logs read serenity-backend` |
| API returns 500 errors | Check Cloud Run logs in GCP Console |

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://api.serenitycarepartners.com
```

### Backend (Cloud Run Environment)
Set via Cloud Run console or deployment command:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `NODE_ENV` - Set to `production`

---

## Deployment Checklist

Before deploying, verify:

- [ ] All changes committed to git
- [ ] Build completes without errors (`npm run build`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Environment variables are set correctly
- [ ] Database migrations are applied (if any)

After deploying:

- [ ] Verify the live site loads correctly
- [ ] Test critical user flows (login, forms, etc.)
- [ ] Check browser console for errors
- [ ] Monitor Cloud Run logs for backend errors

---

## Programmatic Deployment Verification

**IMPORTANT:** Always verify deployments programmatically before confirming success to the user.

### Frontend Verification

After running `firebase deploy`, verify the site is accessible:

```bash
# Check that the site returns HTTP 200
curl -s -o /dev/null -w "%{http_code}" https://serenitycarepartners.com

# Expected output: 200
```

Full verification script:
```bash
# Deploy and verify frontend
cd frontend
npm run build
firebase deploy --only hosting

# Wait for propagation
sleep 10

# Verify deployment
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://serenitycarepartners.com)
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Frontend deployment verified - Site returns HTTP 200"
else
  echo "❌ Frontend deployment FAILED - Site returns HTTP $HTTP_STATUS"
  exit 1
fi

# Verify content is correct (check for expected text)
if curl -s https://serenitycarepartners.com | grep -q "Serenity Care Partners"; then
  echo "✅ Content verification passed - Site contains expected text"
else
  echo "❌ Content verification FAILED - Expected text not found"
  exit 1
fi
```

### Backend Verification

After deploying to Cloud Run, verify the API is responding:

```bash
# Check API health endpoint
curl -s -o /dev/null -w "%{http_code}" https://api.serenitycarepartners.com/health

# Expected output: 200
```

Full verification script:
```bash
# Deploy and verify backend
cd backend
docker build -t gcr.io/serenity-erp-prod/serenity-backend:latest .
docker push gcr.io/serenity-erp-prod/serenity-backend:latest
gcloud run deploy serenity-backend \
  --image gcr.io/serenity-erp-prod/serenity-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Wait for deployment to complete
sleep 15

# Verify deployment
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.serenitycarepartners.com/health)
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Backend deployment verified - API returns HTTP 200"
else
  echo "❌ Backend deployment FAILED - API returns HTTP $HTTP_STATUS"
  exit 1
fi
```

### Combined Verification Commands

Quick one-liners to verify after deployment:

```bash
# Frontend check
curl -sf https://serenitycarepartners.com > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"

# Backend check
curl -sf https://api.serenitycarepartners.com/health > /dev/null && echo "✅ Backend OK" || echo "❌ Backend FAILED"
```

### What to Check

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Frontend HTTP status | `curl -s -o /dev/null -w "%{http_code}" https://serenitycarepartners.com` | `200` |
| Frontend content | `curl -s https://serenitycarepartners.com \| grep "Serenity"` | Match found |
| Backend health | `curl -s https://api.serenitycarepartners.com/health` | `{"status":"ok"}` |
| API response | `curl -s -o /dev/null -w "%{http_code}" https://api.serenitycarepartners.com/api/public/careers/jobs` | `200` |

### Do NOT Confirm Success Until:

1. ✅ HTTP 200 status code is returned from the live URL
2. ✅ Expected content/text appears on the page
3. ✅ No console errors in browser developer tools
4. ✅ Critical functionality works (forms submit, pages load)

**If any verification fails, investigate and fix before telling the user the deployment succeeded.**

---

## Rollback Procedures

### Frontend Rollback
Firebase keeps previous deployments. To rollback:
1. Go to Firebase Console → Hosting
2. Click on the previous deployment
3. Select "Rollback to this version"

### Backend Rollback
Cloud Run keeps previous revisions:
```bash
gcloud run services update-traffic serenity-backend --to-revisions=REVISION_NAME=100
```

Or via GCP Console → Cloud Run → Revisions → Route traffic.

---

## Contact

For deployment issues, check:
- Firebase Console: https://console.firebase.google.com
- GCP Console: https://console.cloud.google.com
- Cloud Run Logs: GCP Console → Cloud Run → serenity-backend → Logs
