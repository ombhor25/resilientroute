"""
Shipment Telemetry Generator
Publishes realistic shipment telemetry to Pub/Sub every 1-2 minutes.
Can run as a Cloud Scheduler job or standalone script.
"""
import json, time, random, math, os, logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resilientroute-demo")
TOPIC_ID = os.getenv("PUBSUB_TELEMETRY_TOPIC", "shipment-telemetry")

# Indian trade lanes with realistic waypoints
TRADE_LANES = [
    {"id": "lane-1", "origin": "Mumbai (JNPT)", "dest": "Singapore",
     "waypoints": [(72.94,18.94),(76.5,11.5),(79.86,6.93),(82.0,4.5),(90.0,2.5),(96.5,2.0),(103.82,1.35)]},
    {"id": "lane-2", "origin": "Mundra", "dest": "Dubai (Jebel Ali)",
     "waypoints": [(69.69,22.84),(66.5,21.5),(62.0,22.0),(58.5,22.5),(56.5,23.5),(55.17,25.07)]},
    {"id": "lane-3", "origin": "Chennai", "dest": "Singapore",
     "waypoints": [(80.27,13.08),(82.5,9.5),(87.0,5.5),(92.0,3.5),(97.5,2.2),(103.82,1.35)]},
    {"id": "lane-6", "origin": "Delhi (ICD)", "dest": "Dubai (Jebel Ali)",
     "waypoints": [(77.10,28.70),(73.5,22.5),(69.69,22.84),(66.5,21.5),(62.0,22.0),(55.17,25.07)]},
    {"id": "lane-7", "origin": "Chennai", "dest": "Colombo",
     "waypoints": [(80.27,13.08),(80.0,10.5),(79.86,6.93)]},
    {"id": "lane-8", "origin": "Paradip", "dest": "Chittagong",
     "waypoints": [(86.17,20.30),(87.5,20.0),(89.0,20.5),(90.5,21.5),(91.83,22.34)]},
]

CARRIERS = ["Tata Motors SCM", "Reliance Logistics", "Mahindra Supply Chain", "Adani Ports", "JSW Shipping"]
PRODUCTS = ["Auto Parts", "Textiles", "Electronics", "Pharma", "Steel Coils", "Chemicals", "IT Hardware", "Petroleum Products"]
MODES = ["sea", "road", "rail"]


def _interpolate(waypoints, progress):
    """Interpolate position along waypoints given progress 0-1."""
    n = len(waypoints) - 1
    if n < 1:
        return waypoints[0]
    seg = progress * n
    idx = min(int(seg), n - 1)
    t = seg - idx
    lng = waypoints[idx][0] + t * (waypoints[idx+1][0] - waypoints[idx][0])
    lat = waypoints[idx][1] + t * (waypoints[idx+1][1] - waypoints[idx][1])
    return (lng, lat)


def generate_telemetry_batch(num_shipments=8):
    """Generate a batch of shipment telemetry messages."""
    messages = []
    for i in range(num_shipments):
        lane = random.choice(TRADE_LANES)
        progress = random.uniform(0.1, 0.9)
        lng, lat = _interpolate(lane["waypoints"], progress)
        speed_knots = random.uniform(8, 22) if "sea" in MODES else random.uniform(40, 80)

        msg = {
            "shipment_id": f"SIM-{random.randint(1000,9999)}",
            "vessel_id": f"V-{random.randint(100,999)}",
            "lane_id": lane["id"],
            "origin": lane["origin"],
            "destination": lane["dest"],
            "current_lat": round(lat, 4),
            "current_lng": round(lng, 4),
            "speed_knots": round(speed_knots, 1),
            "mode": random.choice(MODES),
            "product_type": random.choice(PRODUCTS),
            "carrier": random.choice(CARRIERS),
            "cargo_value_inr": random.randint(10_000_000, 500_000_000),
            "due_date": (datetime.now() + timedelta(days=random.randint(3, 20))).isoformat(),
            "progress_pct": round(progress * 100, 1),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        messages.append(msg)
    return messages


def publish_to_pubsub(messages):
    """Publish messages to Pub/Sub."""
    try:
        from google.cloud import pubsub_v1
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
        for msg in messages:
            data = json.dumps(msg).encode("utf-8")
            future = publisher.publish(topic_path, data)
            logger.info(f"Published {msg['shipment_id']} -> {future.result()}")
    except Exception as e:
        logger.warning(f"Pub/Sub unavailable: {e}. Logging locally.")
        for msg in messages:
            logger.info(f"[LOCAL] {json.dumps(msg)}")


def main():
    """Main loop – publish telemetry every 60-120 seconds."""
    logger.info("Starting shipment telemetry generator...")
    while True:
        batch = generate_telemetry_batch(num_shipments=8)
        publish_to_pubsub(batch)
        sleep_time = random.uniform(60, 120)
        logger.info(f"Next batch in {sleep_time:.0f}s")
        time.sleep(sleep_time)


if __name__ == "__main__":
    main()
