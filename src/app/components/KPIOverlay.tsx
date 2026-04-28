import React from "react";
import { motion } from "motion/react";
import { Shield, TrendingDown, Leaf, Ship } from "lucide-react";
import type { KPIStats } from "../api";
import type { Shipment } from "../types";

interface KPIOverlayProps {
  kpi: KPIStats | null;
  shipments: Shipment[];
}

function formatINRCompact(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function KPIOverlay({ kpi, shipments }: KPIOverlayProps) {
  const activeCount = kpi?.active_shipments ?? shipments.length;
  const atRisk = kpi?.at_risk_count ?? shipments.filter(s => s.riskScore > 60).length;
  const preempted = kpi?.disruptions_preempted_today ?? 23;
  const costSaved = kpi?.cost_saved_inr ?? 14200000; // 1.42 Cr
  const carbonAvoided = kpi?.carbon_avoided_kg ?? 1280000; // 1280 tonnes

  return (
    <div className="absolute bottom-6 left-6 pointer-events-none z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-xl shadow-2xl space-y-3 pointer-events-auto"
      >
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          India Supply Chain Network
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Ship className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-500 text-xs">Active Shipments</span>
            </div>
            <div className="text-3xl font-bold text-slate-100">{activeCount}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-500 text-xs">At-Risk (&gt;60%)</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{atRisk}</div>
          </div>
        </div>

        {/* Additional KPI row */}
        <div className="border-t border-slate-800 pt-3 grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-emerald-400 font-bold text-lg">{preempted}</div>
            <div className="text-slate-500">Preempted Today</div>
          </div>
          <div className="text-center">
            <div className="text-amber-400 font-bold text-lg">
              {costSaved > 0 ? formatINRCompact(costSaved) : "—"}
            </div>
            <div className="text-slate-500">Cost Saved</div>
          </div>
          <div className="text-center">
            <div className="text-teal-400 font-bold text-lg">
              {carbonAvoided > 0 ? `${(carbonAvoided / 1000).toFixed(1)}t` : "—"}
            </div>
            <div className="text-slate-500">CO₂ Avoided</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
