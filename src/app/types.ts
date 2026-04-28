export type RiskLevel = "low" | "medium" | "high";
export type TransitMode = "sea" | "air" | "rail" | "road";

export interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
}

export interface DisruptionEvent {
  id: string;
  lat: number;
  lng: number;
  type: "storm" | "port_congestion" | "labor_strike";
  radius: number; // For rendering visual radius
}

export interface RerouteOption {
  id: string;
  label: string;
  mode: TransitMode;
  transitTime: number; // in days
  cost: number; // in USD
  carbon: number; // in kg CO2
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  rationale: string;
}

export interface Lane {
  id: string;
  origin: GeoPoint;
  destination: GeoPoint;
  riskScore: number;
  riskLevel: RiskLevel;
  path: [number, number][]; // Array of [lng, lat] for curving lines
  disrupted?: boolean; // Set to true when a What-If storm affects this lane
}

export interface Shipment {
  id: string;
  laneId: string;
  origin: GeoPoint;
  destination: GeoPoint;
  currentLat: number;
  currentLng: number;
  mode: TransitMode;
  dueDate: string;
  cargoValue: number;
  status: "in_transit" | "delayed" | "rerouted";
  riskScore: number;
  riskLevel: RiskLevel;
  progress: number; // 0 to 100
  
  // Current route details for comparison
  currentRouteDetails: {
    estimatedDays: number;
    cost: number;
    carbon: number;
    riskScore: number;
  };
  
  // Suggested alternatives (from mocked Vertex/Gemini pipeline)
  rerouteOptions: RerouteOption[];
}
