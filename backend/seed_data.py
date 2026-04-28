"""
Seed data for demo mode.
All Indian trade lanes with realistic data.
"""
from models import (
    Shipment, Lane, GeoPoint, CurrentRouteDetails, RerouteOption,
    RiskLevel, TransitMode, ShipmentStatus
)

# ────────────────────────────────────────────────────────────────────────────────
# INDIAN OCEAN TRADE LANES
# ────────────────────────────────────────────────────────────────────────────────

SEED_LANES: list[Lane] = [
    Lane(
        id="lane-1",
        origin=GeoPoint(lat=18.9386, lng=72.9356, name="Mumbai (JNPT)"),
        destination=GeoPoint(lat=1.3521, lng=103.8198, name="Singapore"),
        risk_score=87, risk_level=RiskLevel.high,
        path=[
            [72.9356, 18.9386], [76.5, 11.5], [79.8612, 6.9271],
            [82.0, 4.5], [90.0, 2.5], [96.5, 2.0], [103.8198, 1.3521],
        ],
    ),
    Lane(
        id="lane-2",
        origin=GeoPoint(lat=22.8393, lng=69.6922, name="Mundra"),
        destination=GeoPoint(lat=25.0657, lng=55.1713, name="Dubai (Jebel Ali)"),
        risk_score=44, risk_level=RiskLevel.medium,
        path=[
            [69.6922, 22.8393], [66.5, 21.5], [62.0, 22.0],
            [58.5, 22.5], [56.5, 23.5], [55.1713, 25.0657],
        ],
    ),
    Lane(
        id="lane-3",
        origin=GeoPoint(lat=13.0827, lng=80.2707, name="Chennai"),
        destination=GeoPoint(lat=1.3521, lng=103.8198, name="Singapore"),
        risk_score=14, risk_level=RiskLevel.low,
        path=[
            [80.2707, 13.0827], [82.5, 9.5], [87.0, 5.5],
            [92.0, 3.5], [97.5, 2.2], [103.8198, 1.3521],
        ],
    ),
    Lane(
        id="lane-4",
        origin=GeoPoint(lat=9.9312, lng=76.2673, name="Kochi"),
        destination=GeoPoint(lat=16.9366, lng=54.0009, name="Salalah (Oman)"),
        risk_score=38, risk_level=RiskLevel.medium,
        path=[
            [76.2673, 9.9312], [73.0, 10.5], [68.0, 12.5],
            [63.0, 14.5], [57.5, 16.0], [54.0009, 16.9366],
        ],
    ),
    Lane(
        id="lane-5",
        origin=GeoPoint(lat=17.6868, lng=83.2185, name="Visakhapatnam"),
        destination=GeoPoint(lat=22.5726, lng=88.3639, name="Kolkata (SMPK)"),
        risk_score=22, risk_level=RiskLevel.low,
        path=[
            [83.2185, 17.6868], [84.5, 19.0], [86.0, 20.5],
            [87.5, 21.5], [88.3639, 22.5726],
        ],
    ),
    Lane(
        id="lane-6",
        origin=GeoPoint(lat=28.7041, lng=77.1025, name="Delhi (ICD Tughlakabad)"),
        destination=GeoPoint(lat=25.0657, lng=55.1713, name="Dubai (Jebel Ali)"),
        risk_score=72, risk_level=RiskLevel.high,
        path=[
            [77.1025, 28.7041], [73.5, 22.5], [69.6922, 22.8393],
            [66.5, 21.5], [62.0, 22.0], [55.1713, 25.0657],
        ],
    ),
    Lane(
        id="lane-7",
        origin=GeoPoint(lat=13.0827, lng=80.2707, name="Chennai"),
        destination=GeoPoint(lat=6.9271, lng=79.8612, name="Colombo"),
        risk_score=65, risk_level=RiskLevel.high,
        path=[
            [80.2707, 13.0827], [80.0, 10.5], [79.8612, 6.9271],
        ],
    ),
    Lane(
        id="lane-8",
        origin=GeoPoint(lat=20.2961, lng=86.1743, name="Paradip"),
        destination=GeoPoint(lat=22.3384, lng=91.8317, name="Chittagong"),
        risk_score=31, risk_level=RiskLevel.medium,
        path=[
            [86.1743, 20.2961], [87.5, 20.0], [89.0, 20.5],
            [90.5, 21.5], [91.8317, 22.3384],
        ],
    ),
    Lane(
        id="lane-9",
        origin=GeoPoint(lat=12.9141, lng=77.6411, name="Bengaluru (Whitefield ICD)"),
        destination=GeoPoint(lat=8.7642, lng=78.1348, name="Tuticorin"),
        risk_score=18, risk_level=RiskLevel.low,
        path=[
            [77.6411, 12.9141], [77.5, 11.5], [78.0, 10.0],
            [78.1348, 8.7642],
        ],
    ),
    Lane(
        id="lane-10",
        origin=GeoPoint(lat=18.9386, lng=72.9356, name="Mumbai (JNPT)"),
        destination=GeoPoint(lat=25.0657, lng=55.1713, name="Dubai (Jebel Ali)"),
        risk_score=52, risk_level=RiskLevel.medium,
        path=[
            [72.9356, 18.9386], [68.0, 20.0], [63.0, 22.0],
            [58.0, 23.5], [55.1713, 25.0657],
        ],
    ),
]

# ────────────────────────────────────────────────────────────────────────────────
# ACTIVE SHIPMENTS
# ────────────────────────────────────────────────────────────────────────────────

SEED_SHIPMENTS: list[Shipment] = [
    Shipment(
        id="RRF-4501", lane_id="lane-1",
        origin=GeoPoint(lat=18.9386, lng=72.9356, name="Mumbai (JNPT)"),
        destination=GeoPoint(lat=1.3521, lng=103.8198, name="Singapore"),
        current_lat=6.5, current_lng=82.0,
        mode=TransitMode.sea, due_date="2026-05-04",
        cargo_value=125000000, status=ShipmentStatus.in_transit,
        risk_score=87, risk_level=RiskLevel.high, progress=42,
        product_type="Auto Parts", carrier="Tata Motors SCM",
        current_route_details=CurrentRouteDetails(
            estimated_days=14, cost=1520000, carbon=48000, risk_score=87
        ),
        reroute_options=[
            RerouteOption(
                id="opt-1a", label="Kochi–Salalah Divert", mode=TransitMode.sea,
                transit_time=16, cost=1740000, carbon=44000,
                risk_score=18, risk_level=RiskLevel.low,
                rationale="Cyclone Mandous (85% probability) will close Colombo port for 48 h. Rerouting via Kochi → Salalah → Singapore bypasses the storm entirely, saving ₹18 L in delay penalties at the cost of ₹2.2 L extra freight. Carbon footprint drops 8% due to favourable ocean current along this corridor. Recommended by Gemini fleet-risk model v2.1.",
                polyline=[[72.9356,18.9386],[76.2673,9.9312],[54.0009,16.9366],[65.0,5.0],[90.0,2.0],[103.8198,1.3521]],
            ),
            RerouteOption(
                id="opt-1b", label="Wait & Slow-Steam", mode=TransitMode.sea,
                transit_time=19, cost=1280000, carbon=40000,
                risk_score=35, risk_level=RiskLevel.medium,
                rationale="Reduce vessel speed to 12 knots to allow Cyclone Mandous to clear the Colombo corridor. Saves ₹2.4 L in fuel; however cargo arrives 5 days late (ETA: May 9), risking ₹9 L in contractual penalties with Reliance SCM. Suitable only if buyer confirms tolerance for delay.",
                polyline=[[72.9356,18.9386],[76.5,11.5],[79.8612,6.9271],[82.0,4.5],[90.0,2.5],[103.8198,1.3521]],
            ),
            RerouteOption(
                id="opt-1c", label="Air Freight Direct (Priority)", mode=TransitMode.air,
                transit_time=2, cost=8500000, carbon=320000,
                risk_score=4, risk_level=RiskLevel.low,
                rationale="Emergency air transfer from Colombo Bandaranaike Airport. Eliminates all weather risk; cargo at Singapore in 2 days. Cost surges ₹70 L — justifiable only if cargo value exceeds ₹5 Cr or buyer SLA penalties exceed this threshold. Not recommended for bulk shipments.",
                polyline=[[72.9356,18.9386],[80.0,7.0],[103.8198,1.3521]],
            ),
        ],
    ),
    Shipment(
        id="TL-2890", lane_id="lane-2",
        origin=GeoPoint(lat=22.8393, lng=69.6922, name="Mundra"),
        destination=GeoPoint(lat=25.0657, lng=55.1713, name="Dubai (Jebel Ali)"),
        current_lat=22.2, current_lng=62.5,
        mode=TransitMode.sea, due_date="2026-05-08",
        cargo_value=85000000, status=ShipmentStatus.in_transit,
        risk_score=44, risk_level=RiskLevel.medium, progress=55,
        product_type="Textiles", carrier="Reliance Logistics",
        current_route_details=CurrentRouteDetails(
            estimated_days=6, cost=920000, carbon=18000, risk_score=44
        ),
        reroute_options=[
            RerouteOption(
                id="opt-2a", label="Northern Oman Coast Hug", mode=TransitMode.sea,
                transit_time=7, cost=980000, carbon=17500,
                risk_score=20, risk_level=RiskLevel.low,
                rationale="Port congestion at Jebel Ali berths 8-12 (labor action, 30% probability of 36-hour delay). Coastal waypoint via Sohar port reduces arrival queue exposure by 60%. Transit adds only 1 day and ₹0.6 L in pilotage fees. Tata Logistics has a preferential berth arrangement at Sohar. Recommended.",
                polyline=[[69.6922,22.8393],[66.5,21.5],[58.0,23.0],[56.4,24.5],[55.1713,25.0657]],
            ),
        ],
    ),
    Shipment(
        id="ISCM-8871", lane_id="lane-3",
        origin=GeoPoint(lat=13.0827, lng=80.2707, name="Chennai"),
        destination=GeoPoint(lat=1.3521, lng=103.8198, name="Singapore"),
        current_lat=4.5, current_lng=95.0,
        mode=TransitMode.sea, due_date="2026-05-10",
        cargo_value=320000000, status=ShipmentStatus.in_transit,
        risk_score=14, risk_level=RiskLevel.low, progress=78,
        product_type="Electronics", carrier="Mahindra Supply Chain",
        current_route_details=CurrentRouteDetails(
            estimated_days=10, cost=1100000, carbon=35000, risk_score=14
        ),
        reroute_options=[],
    ),
    Shipment(
        id="RIL-6040", lane_id="lane-6",
        origin=GeoPoint(lat=28.7041, lng=77.1025, name="Delhi (ICD Tughlakabad)"),
        destination=GeoPoint(lat=25.0657, lng=55.1713, name="Dubai (Jebel Ali)"),
        current_lat=22.9, current_lng=69.7,
        mode=TransitMode.road, due_date="2026-05-06",
        cargo_value=210000000, status=ShipmentStatus.in_transit,
        risk_score=72, risk_level=RiskLevel.high, progress=28,
        product_type="Pharma", carrier="Reliance Logistics",
        current_route_details=CurrentRouteDetails(
            estimated_days=9, cost=2100000, carbon=62000, risk_score=72
        ),
        reroute_options=[
            RerouteOption(
                id="opt-4a", label="Pipavav Port Fast-Track", mode=TransitMode.sea,
                transit_time=8, cost=1950000, carbon=55000,
                risk_score=22, risk_level=RiskLevel.low,
                rationale="Mundra congestion (72% risk) can be bypassed via Pipavav (GPPL), which has 3 open berths and a dedicated Reliance SCM container crane. Rail shuttle Delhi → Pipavav (overnight) + feeder to Dubai saves 1 day and ₹1.5 L versus the congested Mundra route. Carbon footprint is 11% lower.",
                polyline=[[77.1025,28.7041],[72.0,20.7],[71.5,20.9],[66.0,21.5],[60.0,23.0],[55.1713,25.0657]],
            ),
            RerouteOption(
                id="opt-4b", label="Kandla Alternative Gateway", mode=TransitMode.sea,
                transit_time=10, cost=2280000, carbon=58000,
                risk_score=30, risk_level=RiskLevel.medium,
                rationale="Kandla port (Deendayal Port) is operating at 62% capacity with no labour disputes. Road from Delhi takes 18 h; adds 2 days total transit. Higher cost but fully de-risks Mundra congestion. Suitable for non-perishable high-value cargo.",
                polyline=[[77.1025,28.7041],[70.0,23.0],[70.0833,23.0333],[66.0,22.0],[60.0,23.0],[55.1713,25.0657]],
            ),
        ],
    ),
    Shipment(
        id="MSC-7712", lane_id="lane-7",
        origin=GeoPoint(lat=13.0827, lng=80.2707, name="Chennai"),
        destination=GeoPoint(lat=6.9271, lng=79.8612, name="Colombo"),
        current_lat=10.5, current_lng=80.0,
        mode=TransitMode.sea, due_date="2026-05-03",
        cargo_value=45000000, status=ShipmentStatus.delayed,
        risk_score=65, risk_level=RiskLevel.high, progress=50,
        product_type="Chemicals", carrier="Tata Motors SCM",
        current_route_details=CurrentRouteDetails(
            estimated_days=3, cost=350000, carbon=8000, risk_score=65
        ),
        reroute_options=[
            RerouteOption(
                id="opt-5a", label="Tuticorin Transshipment", mode=TransitMode.sea,
                transit_time=4, cost=420000, carbon=9500,
                risk_score=25, risk_level=RiskLevel.low,
                rationale="Cyclone Mandous is tracking close to Colombo. Rerouting via Tuticorin and then a feeder vessel avoids the cyclone zone entirely. Adds 1 day and ₹0.7 L. Safest option for chemical cargo which cannot tolerate storm-induced delays at Colombo anchorage.",
                polyline=[[80.2707,13.0827],[78.1348,8.7642],[79.0,7.5],[79.8612,6.9271]],
            ),
        ],
    ),
    Shipment(
        id="HYD-3301", lane_id="lane-8",
        origin=GeoPoint(lat=20.2961, lng=86.1743, name="Paradip"),
        destination=GeoPoint(lat=22.3384, lng=91.8317, name="Chittagong"),
        current_lat=20.5, current_lng=89.0,
        mode=TransitMode.sea, due_date="2026-05-12",
        cargo_value=67000000, status=ShipmentStatus.in_transit,
        risk_score=31, risk_level=RiskLevel.medium, progress=60,
        product_type="Steel Coils", carrier="Mahindra Supply Chain",
        current_route_details=CurrentRouteDetails(
            estimated_days=5, cost=480000, carbon=12000, risk_score=31
        ),
        reroute_options=[],
    ),
    Shipment(
        id="BLR-9955", lane_id="lane-9",
        origin=GeoPoint(lat=12.9141, lng=77.6411, name="Bengaluru (Whitefield ICD)"),
        destination=GeoPoint(lat=8.7642, lng=78.1348, name="Tuticorin"),
        current_lat=11.5, current_lng=77.5,
        mode=TransitMode.road, due_date="2026-05-05",
        cargo_value=38000000, status=ShipmentStatus.in_transit,
        risk_score=18, risk_level=RiskLevel.low, progress=40,
        product_type="IT Hardware", carrier="Reliance Logistics",
        current_route_details=CurrentRouteDetails(
            estimated_days=2, cost=180000, carbon=4500, risk_score=18
        ),
        reroute_options=[],
    ),
    Shipment(
        id="MUM-1127", lane_id="lane-10",
        origin=GeoPoint(lat=18.9386, lng=72.9356, name="Mumbai (JNPT)"),
        destination=GeoPoint(lat=25.0657, lng=55.1713, name="Dubai (Jebel Ali)"),
        current_lat=20.0, current_lng=68.0,
        mode=TransitMode.sea, due_date="2026-05-07",
        cargo_value=150000000, status=ShipmentStatus.in_transit,
        risk_score=52, risk_level=RiskLevel.medium, progress=35,
        product_type="Petroleum Products", carrier="Tata Motors SCM",
        current_route_details=CurrentRouteDetails(
            estimated_days=7, cost=1800000, carbon=42000, risk_score=52
        ),
        reroute_options=[
            RerouteOption(
                id="opt-8a", label="Nhava Sheva Express", mode=TransitMode.sea,
                transit_time=6, cost=1950000, carbon=38000,
                risk_score=28, risk_level=RiskLevel.low,
                rationale="JNPT berths are congested with 4-day vessel queue. Shifting to adjacent Nhava Sheva dedicated petroleum terminal reduces wait time by 72 hours. ₹1.5 L premium for priority berthing. Total carbon savings 10% from shorter anchorage idle time.",
                polyline=[[72.9356,18.9386],[72.95,18.95],[68.0,20.0],[63.0,22.0],[58.0,23.5],[55.1713,25.0657]],
            ),
        ],
    ),
]
