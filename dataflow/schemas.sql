-- BigQuery Schema Definitions for ResilientRoute
-- Dataset: resilientroute

-- 1. Shipment Events (streaming from Dataflow)
CREATE TABLE IF NOT EXISTS `resilientroute.shipment_events` (
  shipment_id STRING NOT NULL,
  vessel_id STRING,
  lane_id STRING,
  origin STRING,
  destination STRING,
  current_lat FLOAT64,
  current_lng FLOAT64,
  speed_knots FLOAT64,
  mode STRING,
  product_type STRING,
  carrier STRING,
  cargo_value_inr INT64,
  due_date TIMESTAMP,
  progress_pct FLOAT64,
  weather_stress FLOAT64,
  risk_score FLOAT64,
  timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY lane_id, shipment_id;

-- 2. Lane Weather Stress (daily from weather_risk_injector)
CREATE TABLE IF NOT EXISTS `resilientroute.lane_weather_stress` (
  lane_id STRING NOT NULL,
  lane_name STRING,
  weather_stress_index FLOAT64,
  is_cyclone_season BOOL,
  wind_speed_knots FLOAT64,
  wave_height_m FLOAT64,
  visibility_nm FLOAT64,
  timestamp TIMESTAMP NOT NULL,
  date DATE
)
PARTITION BY date
CLUSTER BY lane_id;

-- 3. Disruption Forecasts (from Dataflow + Vertex AI)
CREATE TABLE IF NOT EXISTS `resilientroute.disruption_forecasts` (
  shipment_id STRING NOT NULL,
  lane_id STRING,
  predicted_delay_prob FLOAT64,
  risk_score FLOAT64,
  weather_stress FLOAT64,
  recommended_action STRING,
  timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY lane_id, shipment_id;

-- 4. Route Alternatives (from optimizer)
CREATE TABLE IF NOT EXISTS `resilientroute.route_alternatives` (
  shipment_id STRING NOT NULL,
  option_id STRING NOT NULL,
  label STRING,
  mode STRING,
  transit_time_days FLOAT64,
  cost_inr FLOAT64,
  carbon_kg FLOAT64,
  risk_score FLOAT64,
  risk_level STRING,
  rationale STRING,
  was_selected BOOL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY shipment_id;
