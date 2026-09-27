"use client";

import React from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { MonthlyRecord, BaselineInfo, ProjectedNext, StrainBand } from "@/lib/types";
import { STRAIN_BAND_COLOR } from "@/lib/tokens";

interface BaselineChartProps {
  series: MonthlyRecord[];
  baseline: BaselineInfo;
  projectedNext: ProjectedNext;
}

export default function BaselineChart({
  series,
  baseline,
  projectedNext,
}: BaselineChartProps) {
  if (!series || series.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 italic neu-card">
        No series data available
      </div>
    );
  }

  const baselineLower = Math.max(0, baseline.mean - baseline.sd);
  const baselineUpper = Math.min(100, baseline.mean + baseline.sd);

  // Find first month where baseline_alert_flag flipped to 1
  const firstAlert = series.find((d) => d.baseline_alert_flag === 1);

  // Prepare chart dataset: 12 historical months + 1 projected month
  const chartData = series.map((d) => ({
    year_month: d.year_month,
    strain_index: d.strain_index,
    strain_band: d.strain_band,
    strain_z: d.strain_z_from_baseline,
    baseline_alert: d.baseline_alert_flag === 1,
    baselineLower: baselineLower,
    baselineBand: [baselineLower, baselineUpper],
    baselineMean: baseline.mean,
    duty_hours: d.avg_duty_hours_per_week,
    projected: null as number | null,
  }));

  // Append projected month (dashed segment from month 12 to 13)
  const lastHistorical = series[series.length - 1];
  chartData[chartData.length - 1].projected = lastHistorical.strain_index;

  chartData.push({
    year_month: projectedNext.year_month,
    strain_index: null as unknown as number,
    strain_band: null as unknown as StrainBand,
    strain_z: 0,
    baseline_alert: false,
    baselineLower: baselineLower,
    baselineBand: [baselineLower, baselineUpper],
    baselineMean: baseline.mean,
    duty_hours: 0,
    projected: projectedNext.strain_index,
  });

  const firstMonthVal = series[0]?.strain_index ?? 0;
  const lastMonthVal = series[series.length - 1]?.strain_index ?? 0;
  const figSummary = `Strain moved from ${firstMonthVal.toFixed(1)} to ${lastMonthVal.toFixed(1)} over ${series.length} months; personal baseline ${baseline.mean.toFixed(1)} ± ${baseline.sd.toFixed(1)}${firstAlert ? `; first alert in ${firstAlert.year_month} (z=+${firstAlert.strain_z_from_baseline.toFixed(1)}σ)` : ''}.`;

  interface DotProps {
    cx?: number;
    cy?: number;
    payload?: {
      year_month: string;
      strain_index: number | null;
      strain_band: StrainBand | null;
      baseline_alert: boolean;
    };
  }

  const renderCustomDot = (props: DotProps) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.strain_index === null || payload.strain_index === undefined) {
      return null;
    }

    const isAlert = payload.baseline_alert;
    const bandKey = (payload.strain_band || "Low") as StrainBand;
    const bandColor = STRAIN_BAND_COLOR[bandKey]?.hex || "#3b82f6";

    return (
      <circle
        key={`dot-${payload.year_month}`}
        cx={cx}
        cy={cy}
        r={isAlert ? 6 : 4}
        fill={isAlert ? "#dc2626" : bandColor}
        stroke="#ffffff"
        strokeWidth={isAlert ? 2 : 1.5}
      />
    );
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        year_month: string;
        strain_index: number | null;
        strain_band: StrainBand | null;
        strain_z: number;
        baseline_alert: boolean;
        duty_hours: number;
        projected: number | null;
      };
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProj = label === projectedNext.year_month;

      return (
        <div className="neu-card p-3 shadow-2xl text-xs bg-[#f0f3f8] border border-white/80 text-slate-800">
          <div className="font-bold text-slate-900 mb-1.5 flex items-center justify-between gap-2">
            <span>{label}</span>
            {isProj && (
              <span className="px-2 py-0.5 rounded text-xs neu-card-flat text-indigo-800 font-semibold">
                Projected Next Month
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Strain Index:</span>
              <span className="font-bold text-slate-900 font-mono">
                {isProj ? data.projected : data.strain_index}
              </span>
            </div>

            {isProj ? (
              <div className="mt-1 pt-1 border-t border-indigo-200 text-indigo-800 text-xs italic">
                Trend extrapolation, not a prediction
              </div>
            ) : (
              <>
                {data.strain_band && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">Strain Band:</span>
                    <span
                      className="font-bold"
                      style={{
                        color:
                          STRAIN_BAND_COLOR[(data.strain_band || "Low") as StrainBand]?.hex ||
                          "#2563eb",
                      }}
                    >
                      {data.strain_band}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Deviation z-score:</span>
                  <span
                    className={`font-mono ${
                      data.strain_z >= 1 ? "text-rose-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    {data.strain_z >= 0 ? `+${data.strain_z.toFixed(2)}` : data.strain_z.toFixed(2)}σ
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Weekly Duty:</span>
                  <span className="text-slate-800 font-mono">{data.duty_hours} hrs/wk</span>
                </div>

                {data.baseline_alert && (
                  <div className="mt-1 pt-1 border-t border-rose-300 text-rose-800 font-bold flex items-center gap-1">
                    <span>⚠ Baseline Alert Active (z ≥ 1.0)</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <figure
      role="img"
      aria-label={figSummary}
      className="w-full neu-card p-5 m-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            12-Month Longitudinal Strain & Personal Baseline
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Shaded region shows personal norm (mean ± 1 SD:{" "}
            <span className="font-mono text-slate-800 font-bold">
              {baselineLower.toFixed(1)}–{baselineUpper.toFixed(1)}
            </span>
            ). Points colored by strain band.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/40" />
            <span>Baseline ±1σ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-blue-600" />
            <span>Baseline Mean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
            <span>Alert Point</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-indigo-600" />
            <span>Projected</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
            <XAxis
              dataKey="year_month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 30, 40, 50, 60, 68, 80, 100]}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              dx={-5}
              label={{
                value: "Strain Index",
                angle: -90,
                position: "insideLeft",
                fill: "#475569",
                fontSize: 12,
                dy: 40,
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Faint horizontal band thresholds */}
            <ReferenceLine
              y={30}
              stroke="#ca8a04"
              strokeDasharray="2 4"
              strokeOpacity={0.6}
              label={{
                value: "Mod (30)",
                position: "insideRight",
                fill: "#854d0e",
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={50}
              stroke="#ea580c"
              strokeDasharray="2 4"
              strokeOpacity={0.6}
              label={{
                value: "High (50)",
                position: "insideRight",
                fill: "#9a3412",
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={68}
              stroke="#e11d48"
              strokeDasharray="2 4"
              strokeOpacity={0.6}
              label={{
                value: "Severe (68)",
                position: "insideRight",
                fill: "#9f1239",
                fontSize: 11,
              }}
            />

            {/* Shaded baseline band across full width: baseline.mean ± baseline.sd */}
            <Area
              dataKey="baselineBand"
              fill="#3b82f6"
              fillOpacity={0.12}
              stroke="none"
              isAnimationActive={false}
            />

            {/* Dashed centre line labelled: personal baseline {mean} */}
            <ReferenceLine
              y={baseline.mean}
              stroke="#2563eb"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `personal baseline ${baseline.mean.toFixed(1)}`,
                position: "insideBottomLeft",
                fill: "#1d4ed8",
                fontSize: 11,
              }}
            />

            {/* Vertical marker at first month where baseline_alert_flag flips to 1 */}
            {firstAlert && (
              <ReferenceLine
                x={firstAlert.year_month}
                stroke="#dc2626"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `First Alert (z=+${firstAlert.strain_z_from_baseline.toFixed(1)}σ)`,
                  position: "top",
                  fill: "#b91c1c",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
            )}

            {/* Historical Strain Line */}
            <Line
              type="monotone"
              dataKey="strain_index"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={renderCustomDot}
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />

            {/* Dashed segment to projected_next */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#7c3aed", stroke: "#ffffff" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="text-xs text-slate-600 mt-3 pt-2 border-t border-slate-200/80 italic">
        {figSummary}
      </figcaption>
    </figure>
  );
}
