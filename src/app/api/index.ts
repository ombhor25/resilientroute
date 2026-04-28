/**
 * ResilientRoute API Service Layer
 * Connects frontend to the FastAPI backend (Cloud Run).
 * Falls back to local mock data when backend is unreachable.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ── Types matching backend Pydantic models ────────────────────────────────────
export interface ApiShipment {
  id: string;
  lane_id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  current_lat: number;
  current_lng: number;
  mode: string;
  due_date: string;
  cargo_value: number;
  status: string;
  risk_score: number;
  risk_level: string;
  progress: number;
  product_type: string;
  carrier: string;
  current_route_details: {
    estimated_days: number;
    cost: number;
    carbon: number;
    risk_score: number;
  };
  reroute_options: ApiRerouteOption[];
}

export interface ApiRerouteOption {
  id: string;
  label: string;
  mode: string;
  transit_time: number;
  cost: number;
  carbon: number;
  risk_score: number;
  risk_level: string;
  rationale: string;
  polyline: number[][];
}

export interface ApiLane {
  id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  risk_score: number;
  risk_level: string;
  path: number[][];
}

export interface KPIStats {
  active_shipments: number;
  at_risk_count: number;
  disruptions_preempted_today: number;
  cost_saved_inr: number;
  carbon_avoided_kg: number;
}

export interface WhatIfPayload {
  type: string;
  lat: number;
  lng: number;
  radius_km: number;
  severity: number;
  name: string;
}

export interface WhatIfResult {
  disruption: WhatIfPayload;
  affected_shipment_ids: string[];
  updated_risk_scores: Record<string, number>;
  recommended_reroutes: Array<{
    shipment_id: string;
    recommended_option: string;
    option: ApiRerouteOption;
    old_risk: number;
    new_risk: number;
    cargo_value: number;
  }>;
  summary: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** Fetch all shipments and lanes */
export async function fetchShipments(): Promise<{
  shipments: ApiShipment[];
  lanes: ApiLane[];
}> {
  return apiFetch("/shipments");
}

/** Fetch a single shipment by ID */
export async function fetchShipment(id: string): Promise<ApiShipment> {
  return apiFetch(`/shipment/${id}`);
}

/** Request reroute options for a shipment */
export async function fetchRerouteOptions(id: string): Promise<{
  shipment_id: string;
  current_route: { estimated_days: number; cost: number; carbon: number; risk_score: number };
  alternatives: ApiRerouteOption[];
}> {
  return apiFetch(`/shipment/${id}/reroute_options`, { method: "POST" });
}

/** Approve a reroute option */
export async function approveReroute(
  shipmentId: string,
  optionId: string
): Promise<{
  status: string;
  shipment_id: string;
  new_risk: number;
  carrier_confirmation: string;
}> {
  return apiFetch(`/shipment/${shipmentId}/approve`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  });
}

/** Run a What-If scenario */
export async function runWhatIf(payload: WhatIfPayload): Promise<WhatIfResult> {
  return apiFetch("/whatif", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Fetch KPI stats */
export async function fetchKPIs(): Promise<KPIStats> {
  return apiFetch("/kpi");
}

/** Set demo playback speed */
export async function setDemoSpeed(speed: number): Promise<{ demo_speed: number }> {
  return apiFetch(`/demo/speed?speed=${speed}`, { method: "POST" });
}

/** Tick demo forward */
export async function tickDemo(): Promise<{ ticked: number; speed: number }> {
  return apiFetch("/demo/tick", { method: "POST" });
}

/** Check backend health */
export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch("/health");
    return true;
  } catch {
    return false;
  }
}

// ── Data Transform Helpers ────────────────────────────────────────────────────

/** Convert API shipment to frontend Shipment type */
export function toFrontendShipment(api: ApiShipment) {
  return {
    id: api.id,
    laneId: api.lane_id,
    origin: api.origin,
    destination: api.destination,
    currentLat: api.current_lat,
    currentLng: api.current_lng,
    mode: api.mode as "sea" | "air" | "rail" | "road",
    dueDate: api.due_date,
    cargoValue: api.cargo_value,
    status: api.status as "in_transit" | "delayed" | "rerouted",
    riskScore: api.risk_score,
    riskLevel: api.risk_level as "low" | "medium" | "high",
    progress: api.progress,
    currentRouteDetails: {
      estimatedDays: api.current_route_details.estimated_days,
      cost: api.current_route_details.cost,
      carbon: api.current_route_details.carbon,
      riskScore: api.current_route_details.risk_score,
    },
    rerouteOptions: api.reroute_options.map(toFrontendOption),
  };
}

export function toFrontendOption(api: ApiRerouteOption) {
  return {
    id: api.id,
    label: api.label,
    mode: api.mode as "sea" | "air" | "rail" | "road",
    transitTime: api.transit_time,
    cost: api.cost,
    carbon: api.carbon,
    riskScore: api.risk_score,
    riskLevel: api.risk_level as "low" | "medium" | "high",
    rationale: api.rationale,
  };
}

export function toFrontendLane(api: ApiLane) {
  return {
    id: api.id,
    origin: api.origin,
    destination: api.destination,
    riskScore: api.risk_score,
    riskLevel: api.risk_level as "low" | "medium" | "high",
    path: api.path as [number, number][],
  };
}

// ── Indian Number Formatting ──────────────────────────────────────────────────

/** Format number in Indian numbering (Lakhs, Crores) */
export function formatINR(value: number): string {
  if (value >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1)} Cr`;
  }
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)} L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Format large numbers with Indian comma separation */
export function formatIndianNumber(value: number): string {
  return value.toLocaleString("en-IN");
}
