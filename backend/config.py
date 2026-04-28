"""
Configuration for the ResilientRoute backend.
All sensitive values come from environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Google Cloud
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resilientroute-demo")
GCP_REGION = os.getenv("GCP_REGION", "asia-south1")

# Firestore
FIRESTORE_COLLECTION = "shipments"

# Vertex AI
VERTEX_ENDPOINT_ID = os.getenv("VERTEX_ENDPOINT_ID", "")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "asia-south1")

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Google Maps
MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# BigQuery
BQ_DATASET = os.getenv("BQ_DATASET", "resilientroute")

# Demo mode: when True, uses in-memory data instead of Firestore
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
