import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, Navigation, Clock, DollarSign, Leaf, Sparkles, AlertTriangle } from "lucide-react";
import { Shipment, RerouteOption } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { formatINR } from "../api";
import { clsx } from "clsx";

interface DetailSidebarProps {
  shipment: Shipment;
  onClose: () => void;
  onApprove: (optionId: string) => void;
}

export function DetailSidebar({ shipment, onClose, onApprove }: DetailSidebarProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-[#138808] bg-[#138808]/10 border-[#138808]/30";
    if (score < 60) return "text-[#FF9933] bg-[#FF9933]/10 border-[#FF9933]/30";
    return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30";
  };

  const chartData = [
    {
      name: "Original",
      Days: shipment.currentRouteDetails.estimatedDays,
      Cost: shipment.currentRouteDetails.cost / 1000, // in thousands for scale
      Carbon: shipment.currentRouteDetails.carbon / 1000,
      Risk: shipment.currentRouteDetails.riskScore,
    },
    ...shipment.rerouteOptions.map((opt, i) => ({
      name: opt.label.split(" ")[0] + ` ${i + 1}`, // short name, guaranteed unique
      Days: opt.transitTime,
      Cost: opt.cost / 1000,
      Carbon: opt.carbon / 1000,
      Risk: opt.riskScore,
    }))
  ];

  const selectedOption = shipment.rerouteOptions.find(o => o.id === selectedOptionId);

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0.8 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl relative z-20 shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-100">{shipment.id}</span>
            <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border", getRiskColor(shipment.riskScore))}>
              {shipment.riskScore}% Risk
            </span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            {shipment.origin.name} <Navigation className="w-3 h-3" /> {shipment.destination.name}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        {/* Current Status */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">Shipment Status</h3>
            <span className="text-xs text-slate-500 uppercase">Value: {formatINR(shipment.cargoValue)}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 p-3 rounded-lg flex flex-col items-center justify-center text-center">
              <Clock className="w-4 h-4 text-indigo-400 mb-1" />
              <span className="text-xs text-slate-500 mb-0.5">ETA (Days)</span>
              <span className="text-lg font-semibold text-slate-100">{shipment.currentRouteDetails.estimatedDays}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg flex flex-col items-center justify-center text-center">
              <DollarSign className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-xs text-slate-500 mb-0.5">Cost</span>
              <span className="text-[13px] font-semibold text-slate-100">{formatINR(shipment.currentRouteDetails.cost)}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg flex flex-col items-center justify-center text-center">
              <Leaf className="w-4 h-4 text-teal-400 mb-1" />
              <span className="text-xs text-slate-500 mb-0.5">Carbon (t)</span>
              <span className="text-lg font-semibold text-slate-100">{(shipment.currentRouteDetails.carbon / 1000).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Alternatives Section */}
        {shipment.status === "rerouted" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-lg font-medium text-emerald-50 mb-1">Reroute Approved</h3>
            <p className="text-sm text-emerald-200/70">Carrier confirmation simulated and map updated.</p>
          </div>
        ) : shipment.rerouteOptions.length > 0 ? (
          <>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Dynamic Reroute Options
              </h3>
              
              <div className="space-y-3">
                {shipment.rerouteOptions.map(option => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={clsx(
                      "p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                      selectedOptionId === option.id 
                        ? "bg-indigo-600/10 border-indigo-500" 
                        : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div>
                        <div className="text-sm font-medium text-slate-200 mb-1">{option.label}</div>
                        <div className="flex gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {option.transitTime}d</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> {formatINR(option.cost)}</span>
                        </div>
                      </div>
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border", getRiskColor(option.riskScore))}>
                        {option.riskScore}% Risk
                      </span>
                    </div>

                    <AnimatePresence>
                      {selectedOptionId === option.id && (
                        <motion.div
                          key={`anim-opt-${option.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden relative z-10"
                        >
                          {/* Gemini Card */}
                          <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg relative">
                            <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                              <Sparkles className="w-12 h-12 text-indigo-400" />
                            </div>
                            <div className="flex gap-2 items-center mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Vertex AI Rationale</span>
                            </div>
                            <p className="text-xs text-indigo-100 leading-relaxed z-10 relative">
                              {option.rationale}
                            </p>
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove(option.id);
                            }}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                          >
                            Approve Reroute
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Tradeoff Chart */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Tradeoff Analysis</h3>
              <div className="h-48 w-full bg-slate-950 p-2 rounded-xl border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis key="xaxis" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis key="yaxis" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      key="tooltip"
                      cursor={{fill: '#1e293b'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend key="legend" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    <Bar key="bar-days" dataKey="Days" fill="#FF9933" radius={[2, 2, 0, 0]} />
                    <Bar key="bar-cost" dataKey="Cost" fill="#138808" radius={[2, 2, 0, 0]} />
                    <Bar key="bar-risk" dataKey="Risk" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-8 h-8 text-slate-600 mb-3" />
            <h3 className="text-sm font-medium text-slate-400 mb-1">On Track</h3>
            <p className="text-xs text-slate-500">No disruptions forecasted for this lane. Route optimal.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
