"""
Weather & Risk Injector
Publishes daily lane weather stress indices to Pub/Sub.
Maps realistic seasonal weather patterns for Indian Ocean trade lanes.
"""
import json, time, random, os, logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resilientroute-demo")
TOPIC_ID = os.getenv("PUBSUB_WEATHER_TOPIC", "lane-weather-stress")

# Hardcoded but realistic seasonal stress indices (0.0 = calm, 1.0 = severe)
LANE_WEATHER_STRESS = {
    "lane-1": {"base": 0.45, "cyclone_season_boost": 0.40, "name": "Mumbai–Singapore"},
    "lane-2": {"base": 0.25, "cyclone_season_boost": 0.15, "name": "Mundra–Dubai"},
    "lane-3": {"base": 0.20, "cyclone_season_boost": 0.25, "name": "Chennai–Singapore"},
    "lane-4": {"base": 0.30, "cyclone_season_boost": 0.20, "name": "Kochi–Salalah"},
    "lane-5": {"base": 0.15, "cyclone_season_boost": 0.30, "name": "Visakhapatnam–Kolkata"},
    "lane-6": {"base": 0.35, "cyclone_season_boost": 0.25, "name": "Delhi–Dubai"},
    "lane-7": {"base": 0.50, "cyclone_season_boost": 0.35, "name": "Chennai–Colombo"},
    "lane-8": {"base": 0.30, "cyclone_season_boost": 0.35, "name": "Paradip–Chittagong"},
    "lane-9": {"base": 0.10, "cyclone_season_boost": 0.05, "name": "Bengaluru–Tuticorin"},
    "lane-10": {"base": 0.30, "cyclone_season_boost": 0.20, "name": "Mumbai–Dubai"},
}

# Indian cyclone season: October–December (Bay of Bengal), May–June (Arabian Sea)
CYCLONE_MONTHS = {5, 6, 10, 11, 12}


def compute_stress_indices():
    """Compute daily stress indices with seasonal modulation."""
    now = datetime.utcnow()
    is_cyclone_season = now.month in CYCLONE_MONTHS
    records = []

    for lane_id, config in LANE_WEATHER_STRESS.items():
        stress = config["base"]
        if is_cyclone_season:
            stress += config["cyclone_season_boost"]
        # Add daily random noise
        stress += random.uniform(-0.05, 0.10)
        stress = round(max(0.0, min(1.0, stress)), 3)

        records.append({
            "lane_id": lane_id,
            "lane_name": config["name"],
            "weather_stress_index": stress,
            "is_cyclone_season": is_cyclone_season,
            "wind_speed_knots": round(stress * 45 + random.uniform(0, 10), 1),
            "wave_height_m": round(stress * 6 + random.uniform(0, 1), 1),
            "visibility_nm": round(max(1, 15 - stress * 12 + random.uniform(-1, 1)), 1),
            "timestamp": now.isoformat() + "Z",
            "date": now.strftime("%Y-%m-%d"),
        })
    return records


def publish_weather_stress(records):
    """Publish to Pub/Sub or log locally."""
    try:
        from google.cloud import pubsub_v1
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
        for record in records:
            data = json.dumps(record).encode("utf-8")
            publisher.publish(topic_path, data)
        logger.info(f"Published {len(records)} weather stress records")
    except Exception as e:
        logger.warning(f"Pub/Sub unavailable: {e}")
        for r in records:
            logger.info(f"[LOCAL] {r['lane_id']}: stress={r['weather_stress_index']}")


def main():
    """Publish daily weather stress (run via Cloud Scheduler or cron)."""
    logger.info("Computing lane weather stress indices...")
    records = compute_stress_indices()
    publish_weather_stress(records)
    logger.info("Done. Next run in 24h.")


if __name__ == "__main__":
    main()
