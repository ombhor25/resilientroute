import React from "react";
import { motion } from "motion/react";
import { X, AlertTriangle, Ship, Sparkles, Clock, DollarSign, Leaf } from "lucide-react";
import type { WhatIfResult } from "../api";

interface WhatIfPanelProps {
  result: WhatIfResult;
  onSelectShipment: (id: string) => void;
  onClose: () => void;
}

function formatINRCompact(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function WhatIfPanel({ result, onSelectShipment, onClose }: WhatIfPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute bottom-6 right-6 w-96 max-h-[60vh] bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-red-500/10 border-b border-red-500/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-bold text-red-300">
            What-If Analysis Results
          </span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto max-h-[50vh]">
        {/* Impact Summary */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-red-300 uppercase tracking-wider font-bold">Impact Summary</span>
            <span className="text-xs text-slate-500">
              {result.disruption.type.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">
            {result.affected_shipment_ids.length} shipments at risk
          </div>
          <p className="text-xs text-slate-400">{result.summary}</p>
        </div>

        {/* Recommended Reroutes */}
        {result.recommended_reroutes.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI-Recommended Reroutes
            </h4>
            <div className="space-y-2">
              {result.recommended_reroutes.map((reroute) => (
                <button
                  key={reroute.shipment_id}
                  onClick={() => onSelectShipment(reroute.shipment_id)}
                  className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 transition-all hover:border-indigo-500/30 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Ship className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-sm font-medium text-slate-200">{reroute.shipment_id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-red-400">{reroute.old_risk}%</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-emerald-400">{reroute.new_risk}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {reroute.recommended_option} • {formatINRCompact(reroute.cargo_value)} cargo
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-300">
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700/50">
                      <Clock className="w-3 h-3 text-indigo-400"/> {reroute.option.transit_time}d
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700/50">
                      <DollarSign className="w-3 h-3 text-emerald-400"/> {formatINRCompact(reroute.option.cost)}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700/50">
                      <Leaf className="w-3 h-3 text-teal-400"/> {(reroute.option.carbon / 1000).toFixed(1)}t
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
