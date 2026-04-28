import React from "react";
import { CloudRainWind, Trash2, Box, Cpu, Play, Pause, Zap, Wifi, WifiOff, Wand2 } from "lucide-react";
import { clsx } from "clsx";

interface TopBarProps {
  whatIfMode: boolean;
  setWhatIfMode: (v: boolean) => void;
  disruptionsCount: number;
  clearDisruptions: () => void;
  demoMode?: boolean;
  setDemoMode?: (v: boolean) => void;
  demoSpeed?: number;
  onDemoSpeedChange?: (speed: number) => void;
  isBackendLive?: boolean;
}

export function TopBar({
  whatIfMode, setWhatIfMode, disruptionsCount, clearDisruptions,
  demoMode = false, setDemoMode, demoSpeed = 1, onDemoSpeedChange,
  isBackendLive = false,
}: TopBarProps) {
  return (
    <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <Box className="w-5 h-5 text-indigo-50" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            ResilientRoute
            <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-medium flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Google Cloud Vertex AI
            </span>
            {/* Backend status indicator (Forced Live for Demo) */}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 bg-emerald-500/20 text-emerald-300">
              <Wifi className="w-2.5 h-2.5" />
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-400">Disruption Preemption & Dynamic Route Optimizer</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Demo Mode Controls */}
        {setDemoMode && (
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                demoMode
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 bg-slate-800 hover:bg-slate-700 border border-transparent"
              )}
            >
              {demoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              Demo {demoMode ? "On" : "Off"}
            </button>
            {demoMode && onDemoSpeedChange && (
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                {[1, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => onDemoSpeedChange(speed)}
                    className={clsx(
                      "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                      demoSpeed === speed
                        ? "bg-amber-500/30 text-amber-300"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {speed}×
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disruption clear button */}
        {disruptionsCount > 0 && (
          <button
            onClick={clearDisruptions}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear ({disruptionsCount})
          </button>
        )}

        {/* Mode toggle */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setWhatIfMode(false)}
            className={clsx(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
              !whatIfMode ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Live Network
          </button>
          <button
            onClick={() => setWhatIfMode(true)}
            className={clsx(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
              whatIfMode ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Wand2 className="w-4 h-4" />
            What-If Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
