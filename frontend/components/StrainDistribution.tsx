import React from "react";
import { StrainDistributionItem } from "@/lib/types";
import { STRAIN_BAND_COLOR } from "@/lib/tokens";

interface StrainDistributionProps {
  distribution: StrainDistributionItem[];
  total: number;
}

const BAND_RANGES: Record<string, string> = {
  Low: "0–29",
  Moderate: "30–49",
  High: "50–67",
  Severe: "68–100",
};

export default function StrainDistribution({
  distribution,
  total,
}: StrainDistributionProps) {
  if (!distribution || distribution.length === 0) return null;

  return (
    <div className="neu-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Force-Wide Strain Index Distribution
          </h3>
          <p className="text-xs text-slate-600">
            Current month breakdown across all {total.toLocaleString()} monitored personnel.
          </p>
        </div>
      </div>

      {/* Single stacked horizontal bar */}
      <div className="w-full h-5 rounded-xl neu-inset overflow-hidden flex mb-4">
        {distribution.map((d) => {
          const color = STRAIN_BAND_COLOR[d.band]?.hex || "#3b82f6";
          if (d.pct <= 0) return null;

          return (
            <div
              key={d.band}
              className="h-full transition-all relative group"
              style={{
                width: `${d.pct}%`,
                backgroundColor: color,
              }}
              title={`${d.band} (${BAND_RANGES[d.band]}): ${d.count} (${d.pct}%)`}
            />
          );
        })}
      </div>

      {/* Legend & Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {distribution.map((d) => {
          const token = STRAIN_BAND_COLOR[d.band] || STRAIN_BAND_COLOR.Low;
          return (
            <div
              key={d.band}
              className="p-2.5 rounded-xl neu-card-flat flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: token.hex }}
                />
                <div>
                  <div className="font-bold text-slate-800">{d.band}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {BAND_RANGES[d.band]}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-extrabold text-slate-900 text-sm">
                  {d.count.toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {d.pct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
