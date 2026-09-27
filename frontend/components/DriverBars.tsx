import React from "react";
import { DriverItem } from "@/lib/types";
import { AlertTriangle, CheckCircle, Lock } from "lucide-react";

interface DriverBarsProps {
  drivers: DriverItem[];
  recordRestricted: boolean;
}

export default function DriverBars({ drivers, recordRestricted }: DriverBarsProps) {
  if (recordRestricted || !drivers || drivers.length === 0) {
    return (
      <div className="neu-card p-6 flex items-center justify-center min-h-[160px] text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-full neu-inset flex items-center justify-center text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-sm text-slate-800 font-bold">
            Attribution unavailable for restricted records.
          </p>
          <p className="text-xs text-slate-600 max-w-sm">
            Welfare record sharing has not been consented for this personnel. Driver attribution is suppressed per force privacy policy.
          </p>
        </div>
      </div>
    );
  }

  const maxContrib = Math.max(...drivers.map((d) => Math.abs(d.contribution)), 0.01);
  const summaryText = `Top ${drivers.length} ML welfare risk drivers: leading factor is ${drivers[0]?.display_label || "operational stress"} (${(drivers[0]?.contribution * 100 || 0).toFixed(1)}% contribution).`;

  return (
    <figure
      role="img"
      aria-label={summaryText}
      className="neu-card p-5 m-0"
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          Top 5 ML Welfare Risk Drivers
        </h3>
        <p className="text-xs text-slate-600 mt-0.5">
          Sign-normalised feature deviations contributing to incident risk probability.
        </p>
      </div>

      <div className="space-y-3.5">
        {drivers.map((d) => {
          const isWorsening = d.direction === "worsening";
          const pctWidth = Math.min(100, Math.max(2, (Math.abs(d.contribution) / maxContrib) * 100));
          const contribPct = (d.contribution * 100).toFixed(1);

          return (
            <div key={d.rank_order} className="p-2.5 rounded-xl neu-card-flat">
              <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full neu-inset text-slate-800 font-bold text-xs flex items-center justify-center">
                    {d.rank_order}
                  </span>
                  <span className="font-bold text-slate-800">{d.display_label}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-600">
                    <span className="text-slate-900 font-bold">{d.current_value}</span> {d.unit}
                    <span className="text-slate-400 mx-1">/</span>
                    norm: {d.personal_baseline}
                  </span>

                  <span className="font-mono text-xs text-slate-600 font-medium">
                    Contrib: <strong className={isWorsening ? "text-rose-700" : "text-emerald-700"}>{contribPct}%</strong>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      isWorsening
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {isWorsening ? (
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    )}
                    {d.deviation_z >= 0 ? `+${d.deviation_z.toFixed(2)}` : d.deviation_z.toFixed(2)}σ
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="w-full h-2 rounded-full neu-inset overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isWorsening
                      ? "bg-gradient-to-r from-amber-500 to-rose-600"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  }`}
                  style={{ width: `${pctWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <figcaption className="sr-only">
        {summaryText}
      </figcaption>
    </figure>
  );
}
