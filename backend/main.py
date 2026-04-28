"""
ResilientRoute – FastAPI Backend
Disruption Preemption & Dynamic Route Optimizer for Indian Supply Chains
"""
from __future__ import annotations
import json as _json
import math, copy, logging, os, time, random, pathlib
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Shipment, Lane, DisruptionPayload, WhatIfResponse,
    ApproveRequest, KPIStats, RiskLevel, RerouteOption,
)
from seed_data import SEED_SHIPMENTS, SEED_LANES
from services.optimizer import compute_reroute_options
from services.gemini_engine import generate_rationale, generate_whatif_summary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── In-memory state (demo mode) ────────────────────────────────────────────────
_shipments: dict[str, Shipment] = {}
_lanes: dict[str, Lane] = {}
_demo_speed: float = 1.0  # multiplier for demo mode animation

# Persistent state file (survives server restarts)
_STATE_FILE = pathlib.Path(__file__).parent / "_state.json"


def _save_state():
    """Persist current shipment/lane state to a JSON file."""
    try:
        data = {
            "shipments": {sid: s.model_dump() for sid, s in _shipments.items()},
            "lanes": {lid: l.model_dump() for lid, l in _lanes.items()},
        }
        _STATE_FILE.write_text(_json.dumps(data, default=str), encoding="utf-8")
    except Exception as e:
        logger.warning(f"Failed to save state: {e}")


def _load_state() -> bool:
    """Load persisted state. Returns True if state was restored."""
    if not _STATE_FILE.exists():
        return False
    try:
        raw = _json.loads(_STATE_FILE.read_text(encoding="utf-8"))
        for sid, sdata in raw.get("shipments", {}).items():
            _shipments[sid] = Shipment(**sdata)
        for lid, ldata in raw.get("lanes", {}).items():
            _lanes[lid] = Lane(**ldata)
        logger.info(f"Restored {len(_shipments)} shipments, {len(_lanes)} lanes from state file")
        return True
    except Exception as e:
        logger.warning(f"Failed to load state file: {e}. Will re-seed.")
        return False


def _seed_fresh():
    """Seed from built-in data."""
    _shipments.clear()
    _lanes.clear()
    for s in SEED_SHIPMENTS:
        _shipments[s.id] = s.model_copy(deep=True)
    for l in SEED_LANES:
        _lanes[l.id] = l.model_copy(deep=True)
    _save_state()
    logger.info(f"Seeded fresh: {len(_shipments)} shipments, {len(_lanes)} lanes")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load persisted state on startup, or seed fresh if no state file."""
    if not _load_state():
        _seed_fresh()
    yield
    _shipments.clear()
    _lanes.clear()


app = FastAPI(
    title="ResilientRoute API",
    description="Disruption Preemption & Dynamic Route Optimizer – Indian Supply Chains",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "shipments": len(_shipments), "lanes": len(_lanes)}


# ── GET /shipments ─────────────────────────────────────────────────────────────
@app.get("/shipments")
def get_shipments():
    return {
        "shipments": [s.model_dump() for s in _shipments.values()],
        "lanes": [l.model_dump() for l in _lanes.values()],
    }


# ── GET /shipment/{id} ────────────────────────────────────────────────────────
@app.get("/shipment/{shipment_id}")
def get_shipment(shipment_id: str):
    s = _shipments.get(shipment_id)
    if not s:
        raise HTTPException(404, f"Shipment {shipment_id} not found")
    return s.model_dump()


# ── POST /shipment/{id}/reroute_options ────────────────────────────────────────
@app.post("/shipment/{shipment_id}/reroute_options")
async def reroute_options(shipment_id: str):
    s = _shipments.get(shipment_id)
    if not s:
        raise HTTPException(404, f"Shipment {shipment_id} not found")

    # If already has options, return them (skip re-computation for demo)
    if s.reroute_options:
        options = s.reroute_options
    else:
        options = compute_reroute_options(s)

    # Generate Gemini rationales for each option
    enriched = []
    for opt in options:
        if not opt.rationale:
            opt.rationale = await generate_rationale(s, opt)
        enriched.append(opt)

    # Update the shipment
    s.reroute_options = enriched
    _shipments[s.id] = s

    return {
        "shipment_id": s.id,
        "current_route": s.current_route_details.model_dump(),
        "alternatives": [o.model_dump() for o in enriched],
    }


# ── POST /shipment/{id}/approve ───────────────────────────────────────────────
@app.post("/shipment/{shipment_id}/approve")
def approve_reroute(shipment_id: str, body: ApproveRequest):
    s = _shipments.get(shipment_id)
    if not s:
        raise HTTPException(404, f"Shipment {shipment_id} not found")

    chosen = next((o for o in s.reroute_options if o.id == body.option_id), None)
    if not chosen:
        raise HTTPException(400, f"Option {body.option_id} not found")

    s.status = "rerouted"
    s.risk_score = chosen.risk_score
    s.risk_level = RiskLevel.low if chosen.risk_score < 30 else (RiskLevel.medium if chosen.risk_score < 60 else RiskLevel.high)
    s.current_route_details.estimated_days = chosen.transit_time
    s.current_route_details.cost = chosen.cost
    s.current_route_details.carbon = chosen.carbon
    s.current_route_details.risk_score = chosen.risk_score
    _shipments[s.id] = s

    # Update lane risk
    lane = _lanes.get(s.lane_id)
    if lane:
        lane.risk_score = max(10, lane.risk_score - 30)
        lane.risk_level = RiskLevel.low if lane.risk_score < 30 else RiskLevel.medium
        _lanes[lane.id] = lane

    # Persist state so it survives restarts
    _save_state()

    return {
        "status": "approved",
        "shipment_id": s.id,
        "new_risk": s.risk_score,
        "carrier_confirmation": f"Simulated carrier confirmation for {s.carrier} – route updated.",
    }


# ── POST /whatif ───────────────────────────────────────────────────────────────
@app.post("/whatif")
async def whatif_sandbox(payload: DisruptionPayload):
    affected_ids = []
    updated_risks: dict[str, float] = {}
    total_value_at_risk = 0.0

    for sid, s in _shipments.items():
        # Check if shipment's lane passes near the disruption
        lane = _lanes.get(s.lane_id)
        if not lane:
            continue

        is_affected = False
        for pt in lane.path:
            lng, lat = pt[0], pt[1]
            dist = _approx_distance_km(lat, lng, payload.lat, payload.lng)
            if dist < payload.radius_km:
                is_affected = True
                break

        # Also check current position
        curr_dist = _approx_distance_km(s.current_lat, s.current_lng, payload.lat, payload.lng)
        if curr_dist < payload.radius_km:
            is_affected = True

        if is_affected:
            affected_ids.append(sid)
            risk_bump = payload.severity * 40 + random.uniform(5, 15)
            new_risk = min(99, s.risk_score + risk_bump)
            updated_risks[sid] = round(new_risk, 1)
            total_value_at_risk += s.cargo_value

    # Generate reroutes for top 3 high-value affected shipments
    affected_shipments = [(sid, _shipments[sid]) for sid in affected_ids]
    affected_shipments.sort(key=lambda x: x[1].cargo_value, reverse=True)
    top3 = affected_shipments[:3]

    recommended_reroutes = []
    for sid, s in top3:
        options = compute_reroute_options(s)
        if options:
            best = min(options, key=lambda o: o.risk_score)
            best.rationale = await generate_rationale(
                s, best,
                disruption_context=f"{payload.type} near ({payload.lat:.1f}, {payload.lng:.1f}), radius {payload.radius_km}km, severity {payload.severity}"
            )
            recommended_reroutes.append({
                "shipment_id": sid,
                "recommended_option": best.label,
                "option": best.model_dump(),
                "old_risk": s.risk_score,
                "new_risk": best.risk_score,
                "cargo_value": s.cargo_value,
            })

    summary = await generate_whatif_summary(
        payload.type, len(affected_ids), total_value_at_risk, recommended_reroutes
    )

    return WhatIfResponse(
        disruption=payload,
        affected_shipment_ids=affected_ids,
        updated_risk_scores=updated_risks,
        recommended_reroutes=recommended_reroutes,
        summary=summary,
    ).model_dump()


# ── GET /kpi ───────────────────────────────────────────────────────────────────
@app.get("/kpi")
def get_kpi():
    at_risk = sum(1 for s in _shipments.values() if s.risk_score > 60)
    rerouted = [s for s in _shipments.values() if s.status == "rerouted"]
    cost_saved = sum(
        max(0, s.cargo_value * 0.1 * (1 - s.risk_score / 100))
        for s in rerouted
    )
    carbon_avoided = sum(
        max(0, 48000 - s.current_route_details.carbon) for s in rerouted
    )
    return KPIStats(
        active_shipments=len(_shipments),
        at_risk_count=at_risk,
        disruptions_preempted_today=len(rerouted),
        cost_saved_inr=cost_saved,
        carbon_avoided_kg=carbon_avoided,
    ).model_dump()


# ── POST /reset ───────────────────────────────────────────────────────────────
@app.post("/reset")
def reset_state():
    """Reset all data back to original seed state (clears approvals)."""
    _seed_fresh()
    return {"status": "reset", "shipments": len(_shipments), "lanes": len(_lanes)}


# ── POST /demo/speed ──────────────────────────────────────────────────────────
@app.post("/demo/speed")
def set_demo_speed(speed: float = 1.0):
    global _demo_speed
    _demo_speed = max(0.1, min(speed, 100.0))
    return {"demo_speed": _demo_speed}


# ── POST /demo/tick ───────────────────────────────────────────────────────────
@app.post("/demo/tick")
def demo_tick():
    """Advance shipment positions along their lanes (for demo mode animation)."""
    for sid, s in _shipments.items():
        if s.status == "rerouted":
            continue
        lane = _lanes.get(s.lane_id)
        if not lane or not lane.path:
            continue
        # Advance progress
        s.progress = min(100, s.progress + _demo_speed * random.uniform(0.5, 2.0))
        # Interpolate position along lane path
        total_points = len(lane.path)
        if total_points < 2:
            continue
        frac = s.progress / 100
        segment = frac * (total_points - 1)
        idx = int(segment)
        t = segment - idx
        if idx >= total_points - 1:
            idx = total_points - 2
            t = 1.0
        p1 = lane.path[idx]
        p2 = lane.path[idx + 1]
        s.current_lng = p1[0] + t * (p2[0] - p1[0])
        s.current_lat = p1[1] + t * (p2[1] - p1[1])
        _shipments[sid] = s

    return {"ticked": len(_shipments), "speed": _demo_speed}


def _approx_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(min(1, math.sqrt(a)))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
