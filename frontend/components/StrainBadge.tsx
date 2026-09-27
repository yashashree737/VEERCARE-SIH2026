import React from "react";
import { StrainBand } from "@/lib/types";
import { STRAIN_BAND_COLOR } from "@/lib/tokens";
import { AlertCircle } from "lucide-react";

interface StrainBadgeProps {
  band: StrainBand;
  showAlert?: boolean;
  score?: number;
  zScore?: number;
  size?: "sm" | "md" | "lg";
}

export default function StrainBadge({
  band,
  showAlert = false,
  score,
  zScore,
  size = "md",
}: StrainBadgeProps) {
  const token = STRAIN_BAND_COLOR[band] || STRAIN_BAND_COLOR.Low;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* Band pill */}
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold border neu-card-flat ${token.bg} ${token.border} ${sizeClasses[size]}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: token.hex }}
        />
        <span>{band}</span>
        {score !== undefined && (
          <span className="font-mono text-slate-600 ml-0.5">({score.toFixed(1)})</span>
        )}
      </span>

      {/* Baseline alert OUTLINE badge */}
      {showAlert && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border border-rose-400 text-rose-800 bg-rose-50 shadow-[-2px_-2px_6px_#ffffff,2px_2px_6px_rgba(244,63,94,0.15)]"
          title={`Personal baseline deviation alert${zScore ? ` (z = +${zScore.toFixed(2)})` : ""}`}
        >
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Alert{zScore !== undefined ? ` +${zScore.toFixed(1)}σ` : ""}</span>
        </span>
      )}
    </div>
  );
}
