"""
Route optimization service.
Generates multi-objective reroute alternatives (fastest, cheapest, lowest carbon).
"""
from __future__ import annotations
import math
import random
from models import (
    RerouteOption, GeoPoint, RiskLevel, TransitMode, Shipment
)

# ── Known hub network for multi-modal routing ─────────────────────────────────
HUBS = {
    "Mumbai (JNPT)":        GeoPoint(lat=18.9386,  lng=72.9356,  name="Mumbai (JNPT)"),
    "Nhava Sheva":          GeoPoint(lat=18.9500,  lng=72.9500,  name="Nhava Sheva"),
    "Mundra":               GeoPoint(lat=22.8393,  lng=69.6922,  name="Mundra"),
    "Kandla":               GeoPoint(lat=23.0333,  lng=70.0833,  name="Kandla"),
    "Chennai":              GeoPoint(lat=13.0827,  lng=80.2707,  name="Chennai"),
    "Ennore":               GeoPoint(lat=13.2339,  lng=80.3250,  name="Ennore"),
    "Visakhapatnam":        GeoPoint(lat=17.6868,  lng=83.2185,  name="Visakhapatnam"),
    "Kolkata (SMPK)":       GeoPoint(lat=22.5726,  lng=88.3639,  name="Kolkata (SMPK)"),
    "Haldia":               GeoPoint(lat=22.0257,  lng=88.0985,  name="Haldia"),
    "Paradip":              GeoPoint(lat=20.2961,  lng=86.1743,  name="Paradip"),
    "Kochi":                GeoPoint(lat=9.9312,   lng=76.2673,  name="Kochi"),
    "New Mangalore":        GeoPoint(lat=12.9141,  lng=74.8560,  name="New Mangalore"),
    "Tuticorin":            GeoPoint(lat=8.7642,   lng=78.1348,  name="Tuticorin"),
    "Goa (Mormugao)":       GeoPoint(lat=15.4127,  lng=73.7970,  name="Goa (Mormugao)"),
    "Krishnapatnam":        GeoPoint(lat=14.2547,  lng=80.1480,  name="Krishnapatnam"),
    "Delhi (ICD)":          GeoPoint(lat=28.7041,  lng=77.1025,  name="Delhi (ICD Tughlakabad)"),
    "Bengaluru (ICD)":      GeoPoint(lat=12.9141,  lng=77.6411,  name="Bengaluru (Whitefield ICD)"),
    "Hyderabad (ICD)":      GeoPoint(lat=17.3850,  lng=78.4867,  name="Hyderabad"),
    "Ahmedabad (ICD)":      GeoPoint(lat=23.0225,  lng=72.5714,  name="Ahmedabad"),
    "Pune (ICD)":           GeoPoint(lat=18.5204,  lng=73.8567,  name="Pune"),
    "Colombo":              GeoPoint(lat=6.9271,   lng=79.8612,  name="Colombo"),
    "Chittagong":           GeoPoint(lat=22.3384,  lng=91.8317,  name="Chittagong"),
    "Dubai (Jebel Ali)":    GeoPoint(lat=25.0657,  lng=55.1713,  name="Dubai (Jebel Ali)"),
    "Singapore":            GeoPoint(lat=1.3521,   lng=103.8198, name="Singapore"),
    "Port Klang":           GeoPoint(lat=3.0019,   lng=101.3929, name="Port Klang"),
    "Salalah":              GeoPoint(lat=16.9366,  lng=54.0009,  name="Salalah (Oman)"),
    "Pipavav":              GeoPoint(lat=20.9000,  lng=71.5000,  name="Pipavav"),
}


def _haversine(p1: GeoPoint, p2: GeoPoint) -> float:
    """Great-circle distance in km."""
    R = 6371
    lat1, lat2 = math.radians(p1.lat), math.radians(p2.lat)
    dlat = lat2 - lat1
    dlng = math.radians(p2.lng - p1.lng)
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def _interpolate_path(points: list[GeoPoint], n: int = 6) -> list[list[float]]:
    """Create a polyline from a list of GeoPoints."""
    path = []
    for p in points:
        path.append([p.lng, p.lat])
    return path


def _estimate_sea_transit(distance_km: float) -> float:
    """Estimate sea transit days at ~18 knots average (800 km/day)."""
    return round(distance_km / 800, 1)


def _estimate_road_transit(distance_km: float) -> float:
    """Estimate road transit days at ~500 km/day."""
    return round(distance_km / 500, 1)


def _estimate_rail_transit(distance_km: float) -> float:
    """Estimate rail transit days at ~600 km/day."""
    return round(distance_km / 600, 1)


def _cost_per_km(mode: TransitMode) -> float:
    """Cost in ₹ per km (approximate)."""
    rates = {
        TransitMode.sea: 35,
        TransitMode.road: 55,
        TransitMode.rail: 25,
        TransitMode.air: 450,
    }
    return rates.get(mode, 40)


def _carbon_per_km(mode: TransitMode) -> float:
    """CO₂ in kg per km (approximate for containerized cargo)."""
    rates = {
        TransitMode.sea: 8.0,
        TransitMode.road: 15.0,
        TransitMode.rail: 5.0,
        TransitMode.air: 120.0,
    }
    return rates.get(mode, 10.0)


def compute_reroute_options(
    shipment: Shipment,
    lane_weather_stress: dict[str, float] | None = None,
) -> list[RerouteOption]:
    """
    Generate 3 reroute alternatives for a shipment:
    1. Fastest route
    2. Cheapest route  
    3. Lowest carbon route
    
    Uses heuristic multi-objective optimization with risk-adjusted cost.
    """
    origin = shipment.origin
    dest = shipment.destination
    direct_dist = _haversine(origin, dest)
    cargo_value = shipment.cargo_value
    
    # Find nearby alternative hubs (potential waypoints)
    alternative_hubs = []
    for name, hub in HUBS.items():
        if hub.name == origin.name or hub.name == dest.name:
            continue
        d_from_origin = _haversine(origin, hub)
        d_to_dest = _haversine(hub, dest)
        detour_ratio = (d_from_origin + d_to_dest) / max(direct_dist, 1)
        if detour_ratio < 2.0:  # Not more than 2x the direct distance
            alternative_hubs.append((name, hub, d_from_origin, d_to_dest, detour_ratio))
    
    alternative_hubs.sort(key=lambda x: x[4])  # Sort by detour ratio
    
    options: list[RerouteOption] = []
    
    # Option 1: FASTEST – direct sea or best mode, possibly air for high-value
    if cargo_value > 100_000_000:  # > ₹10 Cr – consider air
        fast_dist = direct_dist * 1.1  # slight route overhead
        fast_time = round(fast_dist / 8000 + 0.5, 1)  # air: ~8000 km/day + handling
        fast_cost = round(fast_dist * _cost_per_km(TransitMode.air))
        fast_carbon = round(fast_dist * _carbon_per_km(TransitMode.air))
        fast_risk = max(5, shipment.risk_score - 60 + random.randint(-5, 5))
        options.append(RerouteOption(
            id=f"fast-{shipment.id}",
            label="Air Express Priority",
            mode=TransitMode.air,
            transit_time=max(1, fast_time),
            cost=fast_cost,
            carbon=fast_carbon,
            risk_score=min(100, max(1, fast_risk)),
            risk_level=RiskLevel.low if fast_risk < 30 else RiskLevel.medium,
            polyline=_interpolate_path([origin, dest]),
            rationale="",  # Will be filled by Gemini
        ))
    else:
        # Fast sea route via nearest safe hub
        if alternative_hubs:
            hub_name, hub, d1, d2, _ = alternative_hubs[0]
            fast_dist = d1 + d2
            fast_time = _estimate_sea_transit(fast_dist)
            fast_cost = round(fast_dist * _cost_per_km(TransitMode.sea) * 0.9)
            fast_carbon = round(fast_dist * _carbon_per_km(TransitMode.sea))
            fast_risk = max(10, shipment.risk_score - 40 + random.randint(-10, 5))
            options.append(RerouteOption(
                id=f"fast-{shipment.id}",
                label=f"Fast via {hub.name}",
                mode=TransitMode.sea,
                transit_time=fast_time,
                cost=fast_cost,
                carbon=fast_carbon,
                risk_score=min(100, max(1, fast_risk)),
                risk_level=_risk_level(fast_risk),
                polyline=_interpolate_path([origin, hub, dest]),
                rationale="",
            ))

    # Option 2: CHEAPEST – rail + sea multimodal (if inland origin)
    if len(alternative_hubs) >= 2:
        _, hub2, d1_2, d2_2, _ = alternative_hubs[1]
        cheap_dist = d1_2 + d2_2
        # Use rail for first leg if inland
        is_inland = origin.lat > 15 and origin.lng > 74 and origin.lng < 85
        if is_inland:
            rail_dist = d1_2
            sea_dist = d2_2
            cheap_time = _estimate_rail_transit(rail_dist) + _estimate_sea_transit(sea_dist)
            cheap_cost = round(rail_dist * _cost_per_km(TransitMode.rail) + sea_dist * _cost_per_km(TransitMode.sea))
            cheap_carbon = round(rail_dist * _carbon_per_km(TransitMode.rail) + sea_dist * _carbon_per_km(TransitMode.sea))
        else:
            cheap_time = _estimate_sea_transit(cheap_dist) * 1.1
            cheap_cost = round(cheap_dist * _cost_per_km(TransitMode.sea) * 0.75)
            cheap_carbon = round(cheap_dist * _carbon_per_km(TransitMode.sea) * 0.9)
        
        cheap_risk = max(15, shipment.risk_score - 25 + random.randint(-5, 10))
        options.append(RerouteOption(
            id=f"cheap-{shipment.id}",
            label=f"Economy via {hub2.name}",
            mode=TransitMode.rail if is_inland else TransitMode.sea,
            transit_time=round(cheap_time, 1),
            cost=cheap_cost,
            carbon=cheap_carbon,
            risk_score=min(100, max(1, cheap_risk)),
            risk_level=_risk_level(cheap_risk),
            polyline=_interpolate_path([origin, hub2, dest]),
            rationale="",
        ))

    # Option 3: LOWEST CARBON – optimize for emissions
    if len(alternative_hubs) >= 3:
        _, hub3, d1_3, d2_3, _ = alternative_hubs[2]
    elif alternative_hubs:
        _, hub3, d1_3, d2_3, _ = alternative_hubs[0]
        hub3 = GeoPoint(lat=hub3.lat, lng=hub3.lng, name=hub3.name)
    else:
        hub3 = dest
        d1_3 = direct_dist
        d2_3 = 0

    green_dist = d1_3 + d2_3
    green_time = _estimate_sea_transit(green_dist) * 1.15  # slow steam
    green_cost = round(green_dist * _cost_per_km(TransitMode.sea) * 1.05)
    green_carbon = round(green_dist * _carbon_per_km(TransitMode.sea) * 0.65)  # slow steam reduces carbon
    green_risk = max(12, shipment.risk_score - 35 + random.randint(-8, 5))
    options.append(RerouteOption(
        id=f"green-{shipment.id}",
        label=f"Green Corridor via {hub3.name}",
        mode=TransitMode.sea,
        transit_time=round(green_time, 1),
        cost=green_cost,
        carbon=green_carbon,
        risk_score=min(100, max(1, green_risk)),
        risk_level=_risk_level(green_risk),
        polyline=_interpolate_path([origin, hub3, dest]),
        rationale="",
    ))

    # Apply risk-adjusted cost ranking
    for opt in options:
        penalty_cost = cargo_value * 0.1
        opt._risk_adjusted_cost = opt.cost + (opt.risk_score / 100) * penalty_cost  # type: ignore

    return options


def _risk_level(score: float) -> RiskLevel:
    if score < 30:
        return RiskLevel.low
    if score < 60:
        return RiskLevel.medium
    return RiskLevel.high
