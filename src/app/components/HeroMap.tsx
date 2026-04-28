import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  ZoomableGroup,
  useMapContext,
  ZoomPanContext,
} from "react-simple-maps";
import { Lane, Shipment, DisruptionEvent } from "../types";
import { Plus, Minus } from "lucide-react";
import { clsx } from "clsx";

// Detailed TopoJSON of the world
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface HeroMapProps {
  lanes: Lane[];
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onShipmentSelect: (id: string) => void;
  whatIfMode: boolean;
  disruptions: DisruptionEvent[];
  onMapClick: (lat: number, lng: number) => void;
}

const getRiskColor = (level: string) => {
  if (level === "low")    return "#138808"; // Indian Green
  if (level === "medium") return "#FF9933"; // Indian Saffron
  return "#EF4444"; // Red
};

// ─── Inner component: must live inside <ComposableMap> & <ZoomableGroup> ─────
// Renders a transparent click-capture rect and converts screen → geo coords
// correctly using the D3 projection inverse + ZoomPanContext transform state.
interface ClickCaptureProps {
  active: boolean;
  onGeoClick: (lat: number, lng: number) => void;
}

function ClickCapture({ active, onGeoClick }: ClickCaptureProps) {
  // projection from MapContext maps [lng,lat] → [svgX, svgY]
  const { projection, width, height } = useMapContext();

  // ZoomPanContext supplies the current d3-zoom transform: translate(x, y) scale(k)
  // A feature at projection coords [px, py] is drawn at SVG coords [k*px+x, k*py+y]
  const { x, y, k } = useContext(ZoomPanContext as React.Context<{ x: number; y: number; k: number }>);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (!active || !projection) return;

      const svgEl = (e.currentTarget as Element).closest("svg") as SVGSVGElement | null;
      if (!svgEl) return;

      // Step 1: Convert screen pixel → SVG viewport coordinate
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const screenCTM = svgEl.getScreenCTM();
      if (!screenCTM) return;
      const svgP = pt.matrixTransform(screenCTM.inverse());

      // Step 2: Undo ZoomableGroup's translate(x,y)scale(k) to get projection coords
      // svgX = k*projX + x  →  projX = (svgX - x) / k
      const projX = (svgP.x - x) / k;
      const projY = (svgP.y - y) / k;

      // Step 3: Apply projection inverse to get geographic [lng, lat]
      const geoCoords = (projection as any).invert([projX, projY]);
      if (geoCoords && isFinite(geoCoords[0]) && isFinite(geoCoords[1])) {
        onGeoClick(geoCoords[1], geoCoords[0]); // callback expects (lat, lng)
      }
    },
    [active, projection, x, y, k, onGeoClick]
  );

  return (
    <rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill="transparent"
      style={{
        cursor: active ? "crosshair" : "default",
        pointerEvents: active ? "all" : "none",
      }}
      onClick={handleClick}
    />
  );
}

// ─── Main HeroMap component ───────────────────────────────────────────────────
export function HeroMap({
  lanes,
  shipments,
  selectedShipmentId,
  onShipmentSelect,
  whatIfMode,
  disruptions,
  onMapClick,
}: HeroMapProps) {
  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId);

  // Default center on India (lng=79, lat=20.5)
  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({ coordinates: [79, 20.5], zoom: 4 });

  // When a shipment is selected, pan to it
  useEffect(() => {
    if (selectedShipment) {
      setPosition({
        coordinates: [selectedShipment.currentLng, selectedShipment.currentLat],
        zoom: 3,
      });
    } else {
      setPosition({ coordinates: [79, 20.5], zoom: 4 });
    }
  }, [selectedShipment]);

  // ── Zoom controls ──────────────────────────────────────────────────────────
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 8) }));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }));
  };

  const handleMoveEnd = (pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  };

  return (
    <div
      className={clsx(
        "w-full h-full relative overflow-hidden bg-slate-950",
        whatIfMode ? "cursor-crosshair" : "cursor-default"
      )}
      onClick={(e) => {
        // Only close sidebar when clicking the map background (non-whatIf mode)
        if (!whatIfMode) {
          // Don't deselect if a button was clicked
          if ((e.target as HTMLElement).closest("button")) return;
        }
      }}
    >
      <ComposableMap
        projectionConfig={{ scale: 160 }}
        width={900}
        height={600}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={handleMoveEnd}
        >
          {/* ── SVG filters for glow effects ── */}
          <defs>
            <filter id="glow-red">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-green">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-orange">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Strong red glow for disrupted lanes */}
            <filter id="glow-disrupted" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Click-capture overlay (What-If mode) ── */}
          {/* Rendered first (behind everything) so it doesn't block other clicks */}
          <ClickCapture active={whatIfMode} onGeoClick={onMapClick} />

          {/* ── World geography ── */}
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1E293B"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none", fill: "#334155" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* ── Trade lanes (multi-point geodesic paths via lane.path) ── */}
          {lanes.map((lane) => {
            const color = getRiskColor(lane.riskLevel);
            const glowId =
              lane.disrupted
                ? "url(#glow-disrupted)"
                : lane.riskLevel === "high"
                ? "url(#glow-red)"
                : lane.riskLevel === "low"
                ? "url(#glow-green)"
                : "url(#glow-orange)";

            const isActiveLane =
              selectedShipmentId &&
              shipments.find((s) => s.id === selectedShipmentId)?.laneId === lane.id;

            // Disrupted lanes are always fully visible — never faded
            const opacity = lane.disrupted
              ? 1
              : selectedShipmentId
              ? isActiveLane ? 1 : 0.15
              : 0.85;

            return (
              <g key={lane.id}>
                {/* Base lane line */}
                <Line
                  coordinates={lane.path}
                  stroke={lane.disrupted ? "#EF4444" : color}
                  strokeWidth={lane.disrupted ? 3.5 : isActiveLane ? 2.5 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={opacity}
                  style={{ filter: glowId, transition: "opacity 0.4s, stroke-width 0.4s" }}
                />
                {/* Animated dashed pulse overlay for disrupted lanes */}
                {lane.disrupted && (
                  <Line
                    coordinates={lane.path}
                    stroke="#FF6B6B"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={1}
                    style={{
                      filter: "url(#glow-disrupted)",
                      strokeDasharray: "8 12",
                      animation: "disruptedPulse 1.2s ease-in-out infinite alternate",
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* ── Shipment markers ── */}
          {shipments.map((shipment) => {
            const color = getRiskColor(shipment.riskLevel);
            const isSelected = selectedShipmentId === shipment.id;
            const isFaded = selectedShipmentId && !isSelected;

            return (
              <Marker
                key={shipment.id}
                coordinates={[shipment.currentLng, shipment.currentLat]}
                onClick={(e) => {
                  (e as any).stopPropagation?.();
                  if (!whatIfMode) onShipmentSelect(shipment.id);
                }}
                style={{
                  default: { cursor: whatIfMode ? "crosshair" : "pointer", outline: "none" },
                  hover:   { cursor: whatIfMode ? "crosshair" : "pointer", outline: "none" },
                  pressed: { cursor: whatIfMode ? "crosshair" : "pointer", outline: "none" },
                }}
              >
                <g style={{ opacity: isFaded ? 0.25 : 1, transition: "opacity 0.3s" }}>
                  {/* Pulse ring for high-risk */}
                  {shipment.riskLevel === "high" && (
                    <circle r={12} fill={color} opacity={0.3}>
                      <animate attributeName="r"       from="6"   to="22"  dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0"   dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <circle
                    r={isSelected ? 6 : 4}
                    fill={color}
                    stroke="#0F172A"
                    strokeWidth={2}
                    filter={`url(#glow-${shipment.riskLevel === "high" ? "red" : shipment.riskLevel === "low" ? "green" : "orange"})`}
                  />

                  {isSelected && (
                    <text
                      textAnchor="middle"
                      y={-12}
                      style={{ fontFamily: "system-ui", fill: "#f8fafc", fontSize: "9px", fontWeight: "bold" }}
                    >
                      {shipment.id}
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}

          {/* ── Disruption markers (What-If sandbox) ── */}
          {disruptions.map((disruption) => (
            <Marker key={disruption.id} coordinates={[disruption.lng, disruption.lat]}>
              <g style={{ pointerEvents: "none" }}>
                <circle r={25} fill="#EF4444" opacity={0.15}>
                  <animate attributeName="r"       from="8"  to="45" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r={9} fill="#EF4444" filter="url(#glow-red)" />
                <text
                  textAnchor="middle"
                  y={-16}
                  style={{ fontFamily: "system-ui", fill: "#fca5a5", fontSize: "9px", fontWeight: "bold" }}
                >
                  {disruption.type === "storm" ? "⚡ STORM" : disruption.type === "labor_strike" ? "✊ STRIKE" : "⚠ DISRUPTION"}
                </text>
              </g>
            </Marker>
          ))}

          {/* ── Port / hub dots ── */}
          {Array.from(
            new Map(
              lanes.flatMap((l) => [
                [l.origin.name,      l.origin],
                [l.destination.name, l.destination],
              ])
            ).values()
          ).map((point) => (
            <Marker key={`port-${point.name}`} coordinates={[point.lng, point.lat]}>
              <circle r={2.5} fill="#94a3b8" stroke="#0F172A" strokeWidth={0.5} style={{ pointerEvents: "none" }} />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* ── Zoom controls ─────────────────────────────────────────────────── */}
      <div className="absolute right-5 bottom-24 flex flex-col gap-2 z-10">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleZoomIn}
          className="bg-slate-800/90 hover:bg-slate-700 text-white p-2.5 rounded-lg backdrop-blur shadow-lg border border-slate-700/60 transition-colors"
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleZoomOut}
          className="bg-slate-800/90 hover:bg-slate-700 text-white p-2.5 rounded-lg backdrop-blur shadow-lg border border-slate-700/60 transition-colors"
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
      </div>

      {/* ── Current zoom indicator ────────────────────────────────────────── */}
      <div className="absolute right-5 bottom-16 z-10 text-[10px] text-slate-500 text-center w-10 pointer-events-none">
        {position.zoom.toFixed(1)}×
      </div>
    </div>
  );
}