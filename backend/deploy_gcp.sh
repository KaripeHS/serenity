#!/bin/bash

# Serenity Backend Deployment Script (Google App Engine)

echo "🚀 Deploying Serenity Backend to Google Cloud Platform..."

# 1. Check if gcloud is installed
if ! command -v gcloud &> /dev/null
then
    echo "❌ Error: 'gcloud' CLI is not found."
    echo "   Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 2. Login check
echo "🔍 Checking gcloud authentication..."
gcloud auth list

# 3. Deploy
echo "☁️  Uploading and Building on App Engine..."
echo "   (This may take 5-10 minutes)"
if ! gcloud app deploy app.yaml --project=serenity-erp-prod --quiet; then
    echo "❌ DEPLOYMENT FAILED!"
    echo "   Reason: You are not logged in or the project 'serenity-erp-prod' does not exist."
    echo "   Fix: Run 'gcloud auth login' and try again."
    exit 1
fi

echo "✅ Deployment Complete!"
echo "   URL: https://serenity-erp-prod.uc.r.appspot.com"
