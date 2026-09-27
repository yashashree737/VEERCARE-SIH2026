import React from "react";
import { TelemetryRow } from "@/lib/types";
import { Heart, Activity, Footprints } from "lucide-react";

interface TelemetryPanelProps {
  telemetry: TelemetryRow[];
  consentStatus: string;
  isCohort: boolean;
}

export default function TelemetryPanel({
  telemetry,
  consentStatus,
  isCohort,
}: TelemetryPanelProps) {
  if (!isCohort || consentStatus === "Not Enrolled" || !telemetry || telemetry.length === 0) {
    return null;
  }

  const recent30 = telemetry.slice(-30);
  const avgRhr = recent30.reduce((acc, r) => acc + (r.resting_heart_rate || 0), 0) / recent30.length;
  const avgHrv = recent30.reduce((acc, r) => acc + (r.hrv_ms || 0), 0) / recent30.length;
  const avgSteps = recent30.reduce((acc, r) => acc + (r.step_count || 0), 0) / recent30.length;

  return (
    <div className="neu-card p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Resting Heart Rate */}
        <div className="p-3 rounded-xl neu-card-flat">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span>Resting HR</span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {avgRhr.toFixed(0)} <span className="text-xs text-slate-500 font-normal">bpm</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Nighttime baseline</div>
        </div>

        {/* Heart Rate Variability */}
        <div className="p-3 rounded-xl neu-card-flat">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>HRV (RMSSD)</span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {avgHrv.toFixed(0)} <span className="text-xs text-slate-500 font-normal">ms</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Autonomic recovery</div>
        </div>

        {/* Step Count */}
        <div className="p-3 rounded-xl neu-card-flat">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Footprints className="w-3.5 h-3.5 text-amber-600" />
            <span>Avg Daily Steps</span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {avgSteps.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            <span className="text-xs text-slate-500 font-normal">steps</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Patrol & movement</div>
        </div>
      </div>
    </div>
  );
}
