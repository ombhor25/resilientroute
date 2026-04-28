import React, { useState, useEffect, useCallback, useRef } from "react";
import { HeroMap } from "./components/HeroMap";
import { DetailSidebar } from "./components/DetailSidebar";
import { TopBar } from "./components/TopBar";
import { KPIOverlay } from "./components/KPIOverlay";
import { WhatIfPanel } from "./components/WhatIfPanel";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { MOCK_SHIPMENTS, MOCK_LANES } from "./data/mockData";
import { Shipment, Lane, RerouteOption, DisruptionEvent } from "./types";
import {
  fetchShipments, fetchRerouteOptions, approveReroute, runWhatIf,
  fetchKPIs, tickDemo, setDemoSpeed, checkHealth,
  toFrontendShipment, toFrontendLane, formatINR,
  type KPIStats, type WhatIfResult,
} from "./api";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [lanes, setLanes] = useState<Lane[]>(MOCK_LANES);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [kpi, setKpi] = useState<KPIStats | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoSpeed, setDemoSpeedState] = useState(1);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check backend health & load data on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const healthy = await checkHealth();
      setIsBackendLive(healthy);

      if (healthy) {
        try {
          const data = await fetchShipments();
          setShipments(data.shipments.map(toFrontendShipment));
          setLanes(data.lanes.map(toFrontendLane));
        } catch (e) {
          console.warn("Backend fetch failed, using mock data:", e);
        }
      }

      // Load KPIs
      try {
        if (healthy) {
          const stats = await fetchKPIs();
          setKpi(stats);
        }
      } catch { /* use defaults */ }

      // Simulate loading for visual effect
      setTimeout(() => setIsLoading(false), 1200);
    }
    init();
  }, []);

  // Demo mode: tick every second (or smooth local animation)
  useEffect(() => {
    if (demoMode) {
      if (isBackendLive) {
        demoIntervalRef.current = setInterval(async () => {
          try {
            await tickDemo();
            const data = await fetchShipments();
            setShipments(data.shipments.map(toFrontendShipment));
            setLanes(data.lanes.map(toFrontendLane));
          } catch { /* ignore */ }
        }, 1000 / demoSpeed);
      } else {
        // Local fallback: smoothly move shipments
        demoIntervalRef.current = setInterval(() => {
          setShipments(prev => prev.map(s => {
            let newProgress = s.progress + (0.5 * demoSpeed);
            if (newProgress > 100) newProgress = 0; // loop
            
            const lane = lanes.find(l => l.id === s.laneId);
            if (!lane || !lane.path || lane.path.length === 0) return { ...s, progress: newProgress };
            
            const path = lane.path;
            const targetIndex = (newProgress / 100) * (path.length - 1);
            const lowerIndex = Math.floor(targetIndex);
            const upperIndex = Math.ceil(targetIndex);
            
            let newLng = s.currentLng;
            let newLat = s.currentLat;
            
            if (lowerIndex === upperIndex) {
              newLng = path[lowerIndex][0];
              newLat = path[lowerIndex][1];
            } else {
              const weight = targetIndex - lowerIndex;
              newLng = path[lowerIndex][0] + (path[upperIndex][0] - path[lowerIndex][0]) * weight;
              newLat = path[lowerIndex][1] + (path[upperIndex][1] - path[lowerIndex][1]) * weight;
            }
            
            return {
              ...s,
              progress: newProgress,
              currentLng: newLng,
              currentLat: newLat
            };
          }));
        }, 100); // 10fps smooth local animation
      }
    }
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [demoMode, demoSpeed, isBackendLive, lanes]);

  // Handle demo speed changes
  const handleDemoSpeedChange = useCallback(async (speed: number) => {
    setDemoSpeedState(speed);
    if (isBackendLive) {
      try { await setDemoSpeed(speed); } catch { /* ignore */ }
    }
  }, [isBackendLive]);

  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId) || null;

  const handleShipmentSelect = (id: string) => {
    setSelectedShipmentId(id);
  };

  const handleCloseSidebar = () => {
    setSelectedShipmentId(null);
    setWhatIfResult(null);
  };

  const handleApproveReroute = async (optionId: string) => {
    if (!selectedShipment) return;

    if (isBackendLive) {
      try {
        await approveReroute(selectedShipment.id, optionId);
        // Refresh data
        const data = await fetchShipments();
        setShipments(data.shipments.map(toFrontendShipment));
        setLanes(data.lanes.map(toFrontendLane));
        const stats = await fetchKPIs();
        setKpi(stats);
      } catch (e) {
        console.warn("Approve failed, updating locally:", e);
        updateLocalApprove(optionId);
      }
    } else {
      updateLocalApprove(optionId);
    }

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    setTimeout(() => setSelectedShipmentId(null), 1500);
  };

  const updateLocalApprove = (optionId: string) => {
    if (!selectedShipment) return;
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === selectedShipment.id) {
          const chosenOption = s.rerouteOptions.find(o => o.id === optionId);
          return {
            ...s,
            status: "rerouted" as const,
            currentRouteDetails: {
              ...s.currentRouteDetails,
              riskScore: chosenOption?.riskScore || 5,
              estimatedDays: chosenOption?.transitTime || s.currentRouteDetails.estimatedDays,
            },
            riskLevel: "low" as const
          };
        }
        return s;
      })
    );
    setLanes(prev =>
      prev.map(l => l.id === selectedShipment.laneId ? { ...l, riskLevel: 'low', riskScore: 10 } : l)
    );
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (whatIfMode) {
      const newDisruption: DisruptionEvent = {
        id: `dist-${Date.now()}`,
        lat,
        lng,
        type: "storm",
        radius: 1000,
      };
      setDisruptions((prev) => [...prev, newDisruption]);

      // Always highlight lanes near the disruption immediately (for visual feedback)
      highlightNearbyLanes(lat, lng);

      // Call backend What-If API if available
      if (isBackendLive) {
        try {
          const result = await runWhatIf({
            type: "cyclone",
            lat,
            lng,
            radius_km: 500,
            severity: 0.8,
            name: "Simulated Cyclone",
          });
          setWhatIfResult(result);

          // Update shipment risks based on backend response
          if (result.updated_risk_scores) {
            // Compute affected lane IDs now using current shipments (before setState)
            const affectedLaneIds = new Set<string>();
            shipments.forEach(s => {
              const newRisk = result.updated_risk_scores[s.id];
              if (newRisk !== undefined && newRisk > 30) {
                affectedLaneIds.add(s.laneId);
              }
            });

            // Update shipment risk levels
            setShipments(prev => prev.map(s => {
              const newRisk = result.updated_risk_scores[s.id];
              if (newRisk !== undefined) {
                return {
                  ...s,
                  riskScore: newRisk,
                  riskLevel: newRisk > 60 ? "high" as const : newRisk > 30 ? "medium" as const : "low" as const,
                };
              }
              return s;
            }));

            // Mark the affected lanes as disrupted for visual highlight
            setLanes(prev => prev.map(lane => {
              if (affectedLaneIds.has(lane.id)) {
                return { ...lane, disrupted: true, riskLevel: "high" as const };
              }
              return lane;
            }));
          }
        } catch (e) {
          console.warn("What-If API failed, using local simulation:", e);
          // lanes already highlighted above, also update shipments locally
          updateShipmentsNearDisruption(lat, lng);
        }
      } else {
        // Also update shipment risk levels locally
        updateShipmentsNearDisruption(lat, lng);
      }
    } else {
      setSelectedShipmentId(null);
    }
  };

  // Highlight lanes that pass near a disruption point (always runs for visual feedback)
  const highlightNearbyLanes = (lat: number, lng: number) => {
    setTimeout(() => {
      setLanes((prev) =>
        prev.map((lane) => {
          const nearDisruption = lane.path.some(
            ([pLng, pLat]) =>
              Math.abs(pLat - lat) < 15 && Math.abs(pLng - lng) < 15
          );
          if (nearDisruption) {
            return { ...lane, disrupted: true, riskLevel: "high" as const, riskScore: Math.min(lane.riskScore + 35, 95) };
          }
          return lane;
        })
      );
    }, 500);
  };

  // Update shipment risk levels for shipments whose lane passes near a disruption
  const updateShipmentsNearDisruption = (lat: number, lng: number) => {
    // Determine affected shipments immediately
    const affected = shipments.filter((shipment) => {
      const lane = lanes.find((l) => l.id === shipment.laneId);
      if (!lane) return false;
      return lane.path.some(([pLng, pLat]) => Math.abs(pLat - lat) < 15 && Math.abs(pLng - lng) < 15);
    });

    const updated_risk_scores: Record<string, number> = {};
    const recommended_reroutes: any[] = [];
    let totalCargo = 0;

    affected.forEach((s) => {
      const newScore = Math.min(s.riskScore + 35, 95);
      updated_risk_scores[s.id] = newScore;
      if (s.rerouteOptions && s.rerouteOptions.length > 0) {
        const bestOpt = s.rerouteOptions[0];
        totalCargo += s.cargoValue;
        recommended_reroutes.push({
          shipment_id: s.id,
          recommended_option: bestOpt.label,
          option: {
            id: bestOpt.id,
            label: bestOpt.label,
            mode: bestOpt.mode,
            transit_time: bestOpt.transitTime,
            cost: bestOpt.cost,
            carbon: bestOpt.carbon,
            risk_score: bestOpt.riskScore,
            risk_level: bestOpt.riskLevel,
            rationale: bestOpt.rationale,
            polyline: []
          },
          old_risk: newScore,
          new_risk: bestOpt.riskScore,
          cargo_value: s.cargoValue,
        });
      }
    });

    setTimeout(() => {
      if (affected.length > 0) {
        setWhatIfResult({
          disruption: { type: "cyclone", lat, lng, radius_km: 1000, severity: 0.8, name: "Simulated Cyclone" },
          affected_shipment_ids: affected.map(s => s.id),
          updated_risk_scores,
          recommended_reroutes,
          summary: `Cyclone: ${affected.length} shipments affected with ₹${(totalCargo / 10000000).toFixed(1)} Cr at risk. AI-optimised reroutes reduce aggregate risk by 45-65% with ₹2-4 L average cost increase per shipment.`
        });
      }

      setShipments((prev) =>
        prev.map((s) => {
          if (updated_risk_scores[s.id]) {
            const newScore = updated_risk_scores[s.id];
            return {
              ...s,
              riskScore: newScore,
              riskLevel: newScore > 60 ? "high" as const : newScore > 30 ? "medium" as const : "low" as const,
            };
          }
          return s;
        })
      );
    }, 600);
  };

  const clearDisruptions = () => {
    setDisruptions([]);
    setWhatIfResult(null);
    // Reset lanes — clear disrupted flag and restore from mock data
    setLanes(MOCK_LANES.map(l => ({ ...l, disrupted: false })));
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti colors={["#FF9933", "#FFFFFF", "#138808", "#000080"]} width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />
        </div>
      )}

      {/* Main Map Area */}
      <div className="flex-1 flex flex-col relative">
        <TopBar
          whatIfMode={whatIfMode}
          setWhatIfMode={setWhatIfMode}
          disruptionsCount={disruptions.length}
          clearDisruptions={clearDisruptions}
          demoMode={demoMode}
          setDemoMode={setDemoMode}
          demoSpeed={demoSpeed}
          onDemoSpeedChange={handleDemoSpeedChange}
          isBackendLive={isBackendLive}
        />

        <div className="flex-1 relative">
          <HeroMap
            lanes={lanes}
            shipments={shipments}
            selectedShipmentId={selectedShipmentId}
            onShipmentSelect={handleShipmentSelect}
            whatIfMode={whatIfMode}
            disruptions={disruptions}
            onMapClick={handleMapClick}
          />

          {/* KPI Stats Overlay */}
          <KPIOverlay
            kpi={kpi}
            shipments={shipments}
          />

          {/* What-If Instruction Overlay */}
          <AnimatePresence>
            {whatIfMode && (
              <motion.div
                key="what-if-overlay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-6 py-3 rounded-full shadow-lg shadow-indigo-500/10 backdrop-blur pointer-events-none flex items-center gap-2"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                Click anywhere on the map to simulate a weather or port disruption
              </motion.div>
            )}
          </AnimatePresence>

          {/* What-If Results Panel */}
          <AnimatePresence>
            {whatIfResult && whatIfMode && (
              <WhatIfPanel
                result={whatIfResult}
                onSelectShipment={handleShipmentSelect}
                onClose={() => setWhatIfResult(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedShipment && (
          <DetailSidebar
            key="detail-sidebar"
            shipment={selectedShipment}
            onClose={handleCloseSidebar}
            onApprove={handleApproveReroute}
          />
        )}
      </AnimatePresence>
    </div>
  );
}