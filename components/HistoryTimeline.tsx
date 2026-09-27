import React from "react";
import { HistoryItem } from "@/lib/types";
import { ShieldAlert, HeartHandshake, Lock } from "lucide-react";

interface HistoryTimelineProps {
  history: HistoryItem[];
  recordRestricted: boolean;
  highlightFirst?: boolean;
}

export default function HistoryTimeline({
  history,
  recordRestricted,
  highlightFirst = false,
}: HistoryTimelineProps) {
  return (
    <div className="neu-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Longitudinal Incident & Intervention History
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Merged chronological timeline of HR-recorded adverse incidents and welfare triage actions.
          </p>
        </div>

        {recordRestricted && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-800 neu-card-flat px-2.5 py-1 rounded-full border border-amber-300">
            <Lock className="w-3.5 h-3.5" />
            Interventions suppressed (Restricted Access)
          </span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm italic">
          No historical incident or intervention records logged.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
          {history.map((item, idx) => {
            const isIncident = item.kind === "incident";
            const isHighlighted = highlightFirst && idx === 0;

            return (
              <div key={`${item.date}-${idx}`} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border flex items-center justify-center neu-card-flat ${
                    isIncident
                      ? "border-rose-400 text-rose-600"
                      : "border-blue-400 text-blue-600"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>

                <div
                  className={`p-3.5 rounded-xl transition-all ${
                    isHighlighted
                      ? "neu-card border-blue-400 ring-2 ring-blue-500/40 shadow-lg"
                      : isIncident
                      ? "neu-card-flat border-rose-200"
                      : "neu-card-flat border-blue-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isIncident
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {isIncident ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            HR Incident
                          </>
                        ) : (
                          <>
                            <HeartHandshake className="w-3.5 h-3.5" />
                            Welfare Action
                          </>
                        )}
                      </span>

                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {isHighlighted && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          Just Logged
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-xs text-slate-500">
                      {item.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
