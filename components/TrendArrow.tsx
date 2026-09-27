import React from "react";
import { TrendFlag } from "@/lib/types";
import { TREND } from "@/lib/tokens";

interface TrendArrowProps {
  trend: TrendFlag;
  showLabel?: boolean;
}

export default function TrendArrow({ trend, showLabel = false }: TrendArrowProps) {
  const t = TREND[trend] || TREND.Stable;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${t.color}`}
      title={`3-Month Strain Trend: ${t.label}`}
    >
      <span className="text-sm">{t.symbol}</span>
      {showLabel && <span>{t.label}</span>}
    </span>
  );
}
