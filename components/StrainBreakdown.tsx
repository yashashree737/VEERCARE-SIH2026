import React from "react";
import { StrainBreakdownResponse } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

interface StrainBreakdownProps {
  breakdown: StrainBreakdownResponse;
}

export default function StrainBreakdown({ breakdown }: StrainBreakdownProps) {
  if (!breakdown || !breakdown.terms || breakdown.terms.length === 0) {
    return (
      <div className="neu-card p-5 text-center text-sm text-slate-500">
        Strain breakdown data is unavailable for this record.
      </div>
    );
  }

  const addTerms = breakdown.terms.filter((t) => t.direction === "add");
  const subTerms = breakdown.terms.filter((t) => t.direction === "subtract");

  return (
    <div className="neu-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Auditable Strain Index Breakdown
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 neu-card-flat px-2.5 py-0.5 rounded-full border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Transparent Rule Engine
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Published formula over observable HR monthly aggregates (Base {breakdown.base.toFixed(1)} pts).
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-600">Total Strain Index</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {breakdown.stored_strain_index.toFixed(1)}{" "}
            <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Add Terms */}
        <div>
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>+ Strain Adding Factors (Over Thresholds)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {addTerms.map((term) => {
              const active = term.points > 0;
              const barWidth = Math.min(100, Math.max(0, (term.points / term.cap) * 100));

              return (
                <div
                  key={term.field}
                  className={`p-2.5 rounded-xl neu-card-flat text-xs transition-colors ${
                    active ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-800 truncate">
                      {term.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {term.is_capped && (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Capped ({term.cap}p)
                        </span>
                      )}
                      <span
                        className={`font-mono font-bold ${
                          active ? "text-rose-700" : "text-slate-500"
                        }`}
                      >
                        +{term.points.toFixed(1)} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-mono">
                    <span>
                      value: <strong className="text-slate-800">{term.value}</strong>
                    </span>
                    <span>ref: {term.reference}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 neu-inset rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        term.is_capped ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtract Terms */}
        <div>
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>- Strain Mitigating Factors (Rest & Leave)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {subTerms.map((term) => {
              const active = term.points > 0;
              const barWidth = Math.min(100, Math.max(0, (term.points / term.cap) * 100));

              return (
                <div
                  key={term.field}
                  className={`p-2.5 rounded-xl neu-card-flat text-xs transition-colors ${
                    active ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-800 truncate">
                      {term.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {term.is_capped && (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Capped ({term.cap}p)
                        </span>
                      )}
                      <span
                        className={`font-mono font-bold ${
                          active ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        -{term.points.toFixed(1)} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-mono">
                    <span>
                      value: <strong className="text-slate-800">{term.value}</strong>
                    </span>
                    <span>ref: {term.reference}</span>
                  </div>

                  <div className="w-full h-1.5 neu-inset rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
