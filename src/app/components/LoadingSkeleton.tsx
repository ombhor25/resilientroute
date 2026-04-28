import React from "react";
import { motion } from "motion/react";

/**
 * Loading skeleton that mimics the map's grid lines
 * while data fetches. Shows a pulsing grid pattern.
 */
export function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {/* Top bar skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/30 p-2 rounded-lg w-9 h-9 animate-pulse" />
            <div>
              <div className="h-5 w-40 bg-slate-800 rounded animate-pulse mb-1" />
              <div className="h-3 w-56 bg-slate-800/50 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Map area skeleton */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          {/* Grid lines mimicking map */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Animated route lines */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[
              { x1: "20%", y1: "30%", x2: "80%", y2: "70%", delay: 0 },
              { x1: "30%", y1: "20%", x2: "70%", y2: "50%", delay: 0.3 },
              { x1: "15%", y1: "50%", x2: "85%", y2: "40%", delay: 0.6 },
              { x1: "40%", y1: "15%", x2: "60%", y2: "80%", delay: 0.9 },
              { x1: "10%", y1: "60%", x2: "90%", y2: "30%", delay: 1.2 },
            ].map((line, i) => (
              <motion.line
                key={i}
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="8 4"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: [0, 0.6, 0.3], pathLength: 1 }}
                transition={{
                  duration: 2,
                  delay: line.delay,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </svg>

          {/* Pulsing dots at intersections */}
          {[
            { cx: "25%", cy: "35%", delay: 0.2 },
            { cx: "65%", cy: "45%", delay: 0.5 },
            { cx: "45%", cy: "55%", delay: 0.8 },
            { cx: "75%", cy: "30%", delay: 1.1 },
            { cx: "35%", cy: "65%", delay: 1.4 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-indigo-500/30"
              style={{ left: dot.cx, top: dot.cy }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0.4] }}
              transition={{
                duration: 1.5,
                delay: dot.delay,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}

          {/* Center loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 border-2 border-indigo-500/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-indigo-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-300">Initializing ResilientRoute</div>
                <div className="text-xs text-slate-500 mt-1">Loading Indian supply chain network...</div>
              </div>
            </motion.div>
          </div>

          {/* Bottom-left KPI skeleton */}
          <div className="absolute bottom-6 left-6">
            <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-xl w-64">
              <div className="h-3 w-32 bg-slate-800 rounded animate-pulse mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
                <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
