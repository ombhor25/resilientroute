#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ResilientRoute – One-Command Deployment Script
# Deploys to Google Cloud: Cloud Run, BigQuery, Pub/Sub, Firestore
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-resilientroute-demo}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="resilientroute-api"
BQ_DATASET="resilientroute"
PUBSUB_TELEMETRY_TOPIC="shipment-telemetry"
PUBSUB_WEATHER_TOPIC="lane-weather-stress"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           ResilientRoute – Deployment Script                ║"
echo "║       Google Cloud · Vertex AI · Gemini · Maps             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo ""

# ── 1. Set project ────────────────────────────────────────────────────────────
echo "▸ Setting project..."
gcloud config set project "${PROJECT_ID}"

# ── 2. Enable APIs ────────────────────────────────────────────────────────────
echo "▸ Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  dataflow.googleapis.com \
  cloudscheduler.googleapis.com \
  maps-backend.googleapis.com \
  generativelanguage.googleapis.com

# ── 3. Create Pub/Sub topics ─────────────────────────────────────────────────
echo "▸ Creating Pub/Sub topics..."
gcloud pubsub topics create "${PUBSUB_TELEMETRY_TOPIC}" --quiet 2>/dev/null || true
gcloud pubsub topics create "${PUBSUB_WEATHER_TOPIC}" --quiet 2>/dev/null || true
gcloud pubsub subscriptions create "${PUBSUB_TELEMETRY_TOPIC}-sub" \
  --topic="${PUBSUB_TELEMETRY_TOPIC}" --quiet 2>/dev/null || true

# ── 4. Create BigQuery dataset & tables ───────────────────────────────────────
echo "▸ Creating BigQuery dataset..."
bq --project_id="${PROJECT_ID}" mk --dataset "${BQ_DATASET}" 2>/dev/null || true

echo "▸ Creating BigQuery tables..."
bq query --use_legacy_sql=false --project_id="${PROJECT_ID}" < dataflow/schemas.sql

# ── 5. Deploy Cloud Run (backend) ────────────────────────────────────────────
echo "▸ Building & deploying Cloud Run service..."
cd backend
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},DEMO_MODE=true" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 60
cd ..

# Get the Cloud Run URL
API_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format="value(status.url)")
echo "✓ API deployed at: ${API_URL}"

# ── 6. Create .env for frontend ──────────────────────────────────────────────
echo "▸ Creating frontend .env..."
echo "VITE_API_URL=${API_URL}" > .env

# ── 7. Build frontend ────────────────────────────────────────────────────────
echo "▸ Installing frontend dependencies..."
npm install

echo "▸ Building frontend for production..."
npm run build

# ── 8. Deploy frontend to Firebase Hosting (optional) ─────────────────────────
if command -v firebase &> /dev/null; then
  echo "▸ Deploying to Firebase Hosting..."
  firebase deploy --only hosting
else
  echo "⚠ Firebase CLI not found. Skipping hosting deployment."
  echo "  To deploy: npm install -g firebase-tools && firebase deploy --only hosting"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✓ Deployment Complete!                     ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  API:      ${API_URL}"
echo "║  Frontend: Run 'npm run dev' or deploy to Firebase Hosting  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
