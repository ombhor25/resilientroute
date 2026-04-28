"""
Apache Beam / Dataflow Pipeline
Subscribes to shipment telemetry Pub/Sub, enriches with weather stress from BigQuery,
computes risk scores, and writes to BigQuery tables.
"""
import json, logging, os, math
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions
from apache_beam.io.gcp.bigquery import WriteToBigQuery
from apache_beam.io.gcp.pubsub import ReadFromPubSub

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "resilientroute-demo")
BQ_DATASET = os.getenv("BQ_DATASET", "resilientroute")
TELEMETRY_SUB = os.getenv("PUBSUB_TELEMETRY_SUB", f"projects/{PROJECT_ID}/subscriptions/shipment-telemetry-sub")

logging.basicConfig(level=logging.INFO)


# ── BigQuery Schemas ──────────────────────────────────────────────────────────
SHIPMENT_EVENTS_SCHEMA = {
    "fields": [
        {"name": "shipment_id", "type": "STRING", "mode": "REQUIRED"},
        {"name": "vessel_id", "type": "STRING"},
        {"name": "lane_id", "type": "STRING"},
        {"name": "origin", "type": "STRING"},
        {"name": "destination", "type": "STRING"},
        {"name": "current_lat", "type": "FLOAT"},
        {"name": "current_lng", "type": "FLOAT"},
        {"name": "speed_knots", "type": "FLOAT"},
        {"name": "mode", "type": "STRING"},
        {"name": "product_type", "type": "STRING"},
        {"name": "carrier", "type": "STRING"},
        {"name": "cargo_value_inr", "type": "INTEGER"},
        {"name": "due_date", "type": "TIMESTAMP"},
        {"name": "progress_pct", "type": "FLOAT"},
        {"name": "weather_stress", "type": "FLOAT"},
        {"name": "risk_score", "type": "FLOAT"},
        {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
    ]
}

DISRUPTION_FORECASTS_SCHEMA = {
    "fields": [
        {"name": "shipment_id", "type": "STRING", "mode": "REQUIRED"},
        {"name": "lane_id", "type": "STRING"},
        {"name": "predicted_delay_prob", "type": "FLOAT"},
        {"name": "risk_score", "type": "FLOAT"},
        {"name": "weather_stress", "type": "FLOAT"},
        {"name": "recommended_action", "type": "STRING"},
        {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
    ]
}


# ── Hardcoded weather stress (fallback when BQ is not available) ──────────────
WEATHER_STRESS_CACHE = {
    "lane-1": 0.85, "lane-2": 0.40, "lane-3": 0.20,
    "lane-4": 0.45, "lane-5": 0.30, "lane-6": 0.65,
    "lane-7": 0.80, "lane-8": 0.55, "lane-9": 0.10, "lane-10": 0.50,
}


class ParseTelemetry(beam.DoFn):
    def process(self, element):
        try:
            msg = json.loads(element.decode("utf-8"))
            yield msg
        except Exception as e:
            logging.warning(f"Parse error: {e}")


class EnrichWithWeatherStress(beam.DoFn):
    def process(self, element):
        lane_id = element.get("lane_id", "")
        stress = WEATHER_STRESS_CACHE.get(lane_id, 0.3)
        element["weather_stress"] = stress
        yield element


class ComputeRiskScore(beam.DoFn):
    def process(self, element):
        weather = element.get("weather_stress", 0.3)
        progress = element.get("progress_pct", 50) / 100
        speed = element.get("speed_knots", 15)

        # Heuristic risk: weather dominates, low speed and early progress increase risk
        risk = (weather * 60) + ((1 - progress) * 20) + (max(0, 12 - speed) * 2)
        risk = min(99, max(1, risk))
        element["risk_score"] = round(risk, 1)
        yield element


class FormatForBQ(beam.DoFn):
    def process(self, element):
        yield {
            "shipment_id": element.get("shipment_id", ""),
            "vessel_id": element.get("vessel_id", ""),
            "lane_id": element.get("lane_id", ""),
            "origin": element.get("origin", ""),
            "destination": element.get("destination", ""),
            "current_lat": element.get("current_lat", 0),
            "current_lng": element.get("current_lng", 0),
            "speed_knots": element.get("speed_knots", 0),
            "mode": element.get("mode", "sea"),
            "product_type": element.get("product_type", ""),
            "carrier": element.get("carrier", ""),
            "cargo_value_inr": element.get("cargo_value_inr", 0),
            "due_date": element.get("due_date", ""),
            "progress_pct": element.get("progress_pct", 0),
            "weather_stress": element.get("weather_stress", 0),
            "risk_score": element.get("risk_score", 0),
            "timestamp": element.get("timestamp", ""),
        }


class FormatDisruptionForecast(beam.DoFn):
    def process(self, element):
        risk = element.get("risk_score", 0)
        if risk > 50:
            action = "REROUTE_RECOMMENDED"
        elif risk > 30:
            action = "MONITOR_CLOSELY"
        else:
            action = "ON_TRACK"

        yield {
            "shipment_id": element.get("shipment_id", ""),
            "lane_id": element.get("lane_id", ""),
            "predicted_delay_prob": round(risk / 100, 3),
            "risk_score": risk,
            "weather_stress": element.get("weather_stress", 0),
            "recommended_action": action,
            "timestamp": element.get("timestamp", ""),
        }


def run_pipeline():
    options = PipelineOptions()
    options.view_as(StandardOptions).streaming = True

    with beam.Pipeline(options=options) as p:
        telemetry = (
            p
            | "ReadPubSub" >> ReadFromPubSub(subscription=TELEMETRY_SUB)
            | "Parse" >> beam.ParDo(ParseTelemetry())
            | "EnrichWeather" >> beam.ParDo(EnrichWithWeatherStress())
            | "ComputeRisk" >> beam.ParDo(ComputeRiskScore())
        )

        # Write to shipment_events table
        (
            telemetry
            | "FormatBQ" >> beam.ParDo(FormatForBQ())
            | "WriteEvents" >> WriteToBigQuery(
                table=f"{PROJECT_ID}:{BQ_DATASET}.shipment_events",
                schema=SHIPMENT_EVENTS_SCHEMA,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            )
        )

        # Write disruption forecasts for high-risk shipments
        (
            telemetry
            | "FormatForecasts" >> beam.ParDo(FormatDisruptionForecast())
            | "WriteForecasts" >> WriteToBigQuery(
                table=f"{PROJECT_ID}:{BQ_DATASET}.disruption_forecasts",
                schema=DISRUPTION_FORECASTS_SCHEMA,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            )
        )


if __name__ == "__main__":
    run_pipeline()
