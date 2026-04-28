import { Shipment, Lane } from "../types";

// ─── Indian Ocean Trade Lanes ────────────────────────────────────────────────
// All path arrays are [lng, lat] pairs for react-simple-maps geodesic rendering
export const MOCK_LANES: Lane[] = [
  {
    id: "lane-1",
    origin:      { lat: 18.9386,  lng:  72.9356, name: "Mumbai (JNPT)" },
    destination: { lat:  1.3521,  lng: 103.8198, name: "Singapore" },
    riskScore: 87,
    riskLevel: "high",
    path: [
      [ 72.9356, 18.9386], // Mumbai
      [ 76.5,    11.5   ], // off SW India coast
      [ 79.8612,  6.9271], // Colombo
      [ 82.0,     4.5   ], // open Indian Ocean
      [ 90.0,     2.5   ], // Bay of Bengal south
      [ 96.5,     2.0   ], // Strait of Malacca approach
      [103.8198,  1.3521], // Singapore
    ],
  },
  {
    id: "lane-2",
    origin:      { lat: 22.8393, lng:  69.6922, name: "Mundra" },
    destination: { lat: 25.0657, lng:  55.1713, name: "Dubai (Jebel Ali)" },
    riskScore: 44,
    riskLevel: "medium",
    path: [
      [ 69.6922, 22.8393], // Mundra
      [ 66.5,    21.5   ], // Gulf of Oman approach
      [ 62.0,    22.0   ], // Arabian Sea
      [ 58.5,    22.5   ], // Gulf of Oman
      [ 56.5,    23.5   ], // Strait of Hormuz
      [ 55.1713, 25.0657], // Dubai
    ],
  },
  {
    id: "lane-3",
    origin:      { lat: 13.0827, lng:  80.2707, name: "Chennai" },
    destination: { lat:  1.3521, lng: 103.8198, name: "Singapore" },
    riskScore: 14,
    riskLevel: "low",
    path: [
      [ 80.2707, 13.0827], // Chennai
      [ 82.5,     9.5   ], // south of Sri Lanka
      [ 87.0,     5.5   ], // open Indian Ocean
      [ 92.0,     3.5   ], // Andaman Sea
      [ 97.5,     2.2   ], // Malacca approach
      [103.8198,  1.3521], // Singapore
    ],
  },
  {
    id: "lane-4",
    origin:      { lat:  9.9312, lng:  76.2673, name: "Kochi" },
    destination: { lat: 16.9366, lng:  54.0009, name: "Salalah (Oman)" },
    riskScore: 38,
    riskLevel: "medium",
    path: [
      [ 76.2673,  9.9312], // Kochi
      [ 73.0,    10.5   ], // Lakshadweep Sea
      [ 68.0,    12.5   ], // Arabian Sea
      [ 63.0,    14.5   ], // mid Arabian Sea
      [ 57.5,    16.0   ], // Gulf of Aden approach
      [ 54.0009, 16.9366], // Salalah
    ],
  },
  {
    id: "lane-5",
    origin:      { lat: 17.6868, lng:  83.2185, name: "Visakhapatnam" },
    destination: { lat: 22.5726, lng:  88.3639, name: "Kolkata (SMPK)" },
    riskScore: 22,
    riskLevel: "medium",
    path: [
      [ 83.2185, 17.6868], // Visakhapatnam
      [ 84.5,    19.0   ], // coastal
      [ 86.0,    20.5   ], // Bay of Bengal coast
      [ 87.5,    21.5   ], // approaching delta
      [ 88.3639, 22.5726], // Kolkata
    ],
  },
  {
    id: "lane-6",
    origin:      { lat: 28.7041, lng:  77.1025, name: "Delhi (ICD Tughlakabad)" },
    destination: { lat: 25.0657, lng:  55.1713, name: "Dubai (Jebel Ali)" },
    riskScore: 72,
    riskLevel: "high",
    path: [
      [ 77.1025, 28.7041], // Delhi ICD
      [ 73.5,    22.5   ], // rail to Mundra
      [ 69.6922, 22.8393], // Mundra port
      [ 66.5,    21.5   ], // Arabian Sea
      [ 62.0,    22.0   ], // mid-sea
      [ 55.1713, 25.0657], // Dubai
    ],
  },
];

// ─── Active Shipments ─────────────────────────────────────────────────────────
export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: "RRF-4501",
    laneId: "lane-1",
    origin:      { lat: 18.9386,  lng:  72.9356, name: "Mumbai (JNPT)" },
    destination: { lat:  1.3521,  lng: 103.8198, name: "Singapore" },
    currentLat: 6.5,
    currentLng: 82.0,
    mode: "sea",
    dueDate: "2026-05-04",
    cargoValue: 125000000, // ₹12.5 Cr
    status: "in_transit",
    riskScore: 87,
    riskLevel: "high",
    progress: 42,
    currentRouteDetails: {
      estimatedDays: 14,
      cost: 1520000,    // ₹15.2 L
      carbon: 48000,    // kg CO₂
      riskScore: 87,
    },
    rerouteOptions: [
      {
        id: "opt-1a",
        label: "Kochi–Salalah Divert",
        mode: "sea",
        transitTime: 16,
        cost: 1740000,
        carbon: 44000,
        riskScore: 18,
        riskLevel: "low",
        rationale:
          "Cyclone Mandous (85% probability) will close Colombo port for 48 h. Rerouting via Kochi → Salalah → Singapore bypasses the storm entirely, saving ₹18 L in delay penalties at the cost of ₹2.2 L extra freight. Carbon footprint drops 8% due to favourable ocean current along this corridor. Recommended by Gemini fleet-risk model v2.1.",
      },
      {
        id: "opt-1b",
        label: "Wait & Slow-Steam",
        mode: "sea",
        transitTime: 19,
        cost: 1280000,
        carbon: 40000,
        riskScore: 35,
        riskLevel: "medium",
        rationale:
          "Reduce vessel speed to 12 knots to allow Cyclone Mandous to clear the Colombo corridor. Saves ₹2.4 L in fuel; however cargo arrives 5 days late (ETA: May 9), risking ₹9 L in contractual penalties with Reliance SCM. Suitable only if buyer confirms tolerance for delay.",
      },
      {
        id: "opt-1c",
        label: "Air Freight Direct (Priority)",
        mode: "air",
        transitTime: 2,
        cost: 8500000,
        carbon: 320000,
        riskScore: 4,
        riskLevel: "low",
        rationale:
          "Emergency air transfer from Colombo Bandaranaike Airport. Eliminates all weather risk; cargo at Singapore in 2 days. Cost surges ₹70 L — justifiable only if cargo value exceeds ₹5 Cr or buyer SLA penalties exceed this threshold. Not recommended for bulk shipments.",
      },
    ],
  },
  {
    id: "TL-2890",
    laneId: "lane-2",
    origin:      { lat: 22.8393, lng:  69.6922, name: "Mundra" },
    destination: { lat: 25.0657, lng:  55.1713, name: "Dubai (Jebel Ali)" },
    currentLat: 22.2,
    currentLng: 62.5,
    mode: "sea",
    dueDate: "2026-05-08",
    cargoValue: 85000000, // ₹8.5 Cr
    status: "in_transit",
    riskScore: 44,
    riskLevel: "medium",
    progress: 55,
    currentRouteDetails: {
      estimatedDays: 6,
      cost: 920000,
      carbon: 18000,
      riskScore: 44,
    },
    rerouteOptions: [
      {
        id: "opt-2a",
        label: "Northern Oman Coast Hug",
        mode: "sea",
        transitTime: 7,
        cost: 980000,
        carbon: 17500,
        riskScore: 20,
        riskLevel: "low",
        rationale:
          "Port congestion at Jebel Ali berths 8-12 (labor action, 30% probability of 36-hour delay). Coastal waypoint via Sohar port reduces arrival queue exposure by 60%. Transit adds only 1 day and ₹0.6 L in pilotage fees. Tata Logistics has a preferential berth arrangement at Sohar. Recommended.",
      },
    ],
  },
  {
    id: "ISCM-8871",
    laneId: "lane-3",
    origin:      { lat: 13.0827, lng:  80.2707, name: "Chennai" },
    destination: { lat:  1.3521, lng: 103.8198, name: "Singapore" },
    currentLat: 4.5,
    currentLng: 95.0,
    mode: "sea",
    dueDate: "2026-05-10",
    cargoValue: 320000000, // ₹32 Cr
    status: "in_transit",
    riskScore: 14,
    riskLevel: "low",
    progress: 78,
    currentRouteDetails: {
      estimatedDays: 10,
      cost: 1100000,
      carbon: 35000,
      riskScore: 14,
    },
    rerouteOptions: [],
  },
  {
    id: "RIL-6040",
    laneId: "lane-6",
    origin:      { lat: 28.7041, lng:  77.1025, name: "Delhi (ICD)" },
    destination: { lat: 25.0657, lng:  55.1713, name: "Dubai (Jebel Ali)" },
    currentLat: 22.9,
    currentLng: 69.7,
    mode: "road",
    dueDate: "2026-05-06",
    cargoValue: 210000000, // ₹21 Cr
    status: "in_transit",
    riskScore: 72,
    riskLevel: "high",
    progress: 28,
    currentRouteDetails: {
      estimatedDays: 9,
      cost: 2100000,
      carbon: 62000,
      riskScore: 72,
    },
    rerouteOptions: [
      {
        id: "opt-4a",
        label: "Pipavav Port Fast-Track",
        mode: "sea",
        transitTime: 8,
        cost: 1950000,
        carbon: 55000,
        riskScore: 22,
        riskLevel: "low",
        rationale:
          "Mundra congestion (72% risk) can be bypassed via Pipavav (GPPL), which has 3 open berths and a dedicated Reliance SCM container crane. Rail shuttle Delhi → Pipavav (overnight) + feeder to Dubai saves 1 day and ₹1.5 L versus the congested Mundra route. Carbon footprint is 11% lower.",
      },
      {
        id: "opt-4b",
        label: "Kandla Alternative Gateway",
        mode: "sea",
        transitTime: 10,
        cost: 2280000,
        carbon: 58000,
        riskScore: 30,
        riskLevel: "medium",
        rationale:
          "Kandla port (Deendayal Port) is operating at 62% capacity with no labour disputes. Road from Delhi takes 18 h; adds 2 days total transit. Higher cost but fully de-risks Mundra congestion. Suitable for non-perishable high-value cargo.",
      },
    ],
  },
];
