"""
Pydantic models for the ResilientRoute API.
All currency in ₹ (Indian Rupees), distances in km.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TransitMode(str, Enum):
    sea = "sea"
    air = "air"
    rail = "rail"
    road = "road"


class ShipmentStatus(str, Enum):
    in_transit = "in_transit"
    delayed = "delayed"
    rerouted = "rerouted"
    delivered = "delivered"


class GeoPoint(BaseModel):
    lat: float
    lng: float
    name: str


class RouteStep(BaseModel):
    mode: TransitMode
    from_point: GeoPoint
    to_point: GeoPoint
    distance_km: float = 0
    duration_hours: float = 0


class RerouteOption(BaseModel):
    id: str
    label: str
    mode: TransitMode
    transit_time: float  # days
    cost: float  # ₹
    carbon: float  # kg CO₂
    risk_score: float  # 0-100
    risk_level: RiskLevel
    rationale: str = ""
    polyline: list[list[float]] = []  # [[lng,lat], ...] for GeoJSON
    steps: list[RouteStep] = []


class CurrentRouteDetails(BaseModel):
    estimated_days: float
    cost: float  # ₹
    carbon: float  # kg CO₂
    risk_score: float


class Shipment(BaseModel):
    id: str
    lane_id: str
    origin: GeoPoint
    destination: GeoPoint
    current_lat: float
    current_lng: float
    mode: TransitMode
    due_date: str
    cargo_value: float  # ₹
    status: ShipmentStatus
    risk_score: float
    risk_level: RiskLevel
    progress: float  # 0-100
    product_type: str = "General Cargo"
    carrier: str = "Tata Logistics"
    current_route_details: CurrentRouteDetails
    reroute_options: list[RerouteOption] = []


class Lane(BaseModel):
    id: str
    origin: GeoPoint
    destination: GeoPoint
    risk_score: float
    risk_level: RiskLevel
    path: list[list[float]]  # [[lng,lat], ...]


class DisruptionPayload(BaseModel):
    type: str = Field(..., description="cyclone | port_strike | bridge_collapse | customs")
    lat: float
    lng: float
    radius_km: float = 500
    severity: float = Field(0.8, ge=0, le=1)
    name: str = "Simulated Disruption"


class WhatIfResponse(BaseModel):
    disruption: DisruptionPayload
    affected_shipment_ids: list[str]
    updated_risk_scores: dict[str, float]
    recommended_reroutes: list[dict]
    summary: str


class ApproveRequest(BaseModel):
    option_id: str


class KPIStats(BaseModel):
    active_shipments: int
    at_risk_count: int
    disruptions_preempted_today: int
    cost_saved_inr: float  # ₹
    carbon_avoided_kg: float
