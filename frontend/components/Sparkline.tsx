import React from "react";
import { WallSparklinePoint } from "@/lib/types";
import { STRAIN_BAND_COLOR } from "@/lib/tokens";

interface SparklineProps {
  data: WallSparklinePoint[];
  width?: number;
  height?: number;
}

export default function Sparkline({ data, width = 140, height = 36 }: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-500 italic">No series data</div>;
  }

  const padding = 4;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Strain is bounded 0 to 100
  const minY = 0;
  const maxY = 100;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * plotWidth;
    const y = height - padding - (d.strain_index / (maxY - minY)) * plotHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Last point determines general trend stroke color
  const lastPoint = data[data.length - 1];
  const strokeColor = STRAIN_BAND_COLOR[lastPoint.strain_band]?.hex || "#3b82f6";

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible inline-block"
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Strain trajectory path */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {points.map((p, idx) => {
        const isAlert = p.data.baseline_alert_flag === 1;
        const color = STRAIN_BAND_COLOR[p.data.strain_band]?.hex || "#3b82f6";
        const isLast = idx === points.length - 1;

        return (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={isAlert || isLast ? 3.5 : 2}
            fill={isAlert ? "#ef4444" : color}
            stroke={isAlert ? "#ffffff" : "none"}
            strokeWidth={isAlert ? "1" : "0"}
          >
            <title>
              {p.data.year_month}: {p.data.strain_index} ({p.data.strain_band})
              {isAlert ? " [Baseline Alert]" : ""}
            </title>
          </circle>
        );
      })}
    </svg>
  );
}
