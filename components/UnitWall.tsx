"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { WallCard } from "@/lib/types";
import { STRAIN_BAND_COLOR } from "@/lib/tokens";
import Sparkline from "./Sparkline";
import TrendArrow from "./TrendArrow";
import StrainBadge from "./StrainBadge";
import { ArrowUpDown, Lock, Clock } from "lucide-react";

interface UnitWallProps {
  cards: WallCard[];
  totalCount?: number;
  sortKey?: string;
  onSortChange?: (key: string) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  limit?: number;
}

type SortKey = "risk" | "z" | "duty";

export default function UnitWall({
  cards,
  totalCount,
  sortKey: controlledSortKey,
  onSortChange,
  page,
  onPageChange,
  limit = 10,
}: UnitWallProps) {
  const [localSortKey, setLocalSortKey] = useState<SortKey>("risk");
  
  const sortKey = (controlledSortKey as SortKey) || localSortKey;

  const handleSortChange = (key: SortKey) => {
    if (onSortChange) {
      onSortChange(key);
    } else {
      setLocalSortKey(key);
    }
  };

  const sortedCards = useMemo(() => {
    let result = cards;
    
    if (!onSortChange) {
      result = [...cards].sort((a, b) => {
        if (sortKey === "risk") {
          return b.risk_probability - a.risk_probability;
        }
        if (sortKey === "z") {
          return b.current_z - a.current_z;
        }
        if (sortKey === "duty") {
          return b.duty_hours_current_month - a.duty_hours_current_month;
        }
        return 0;
      });
    }

    // Fallback: If backend didn't paginate and returned all results, slice it locally
    if (result.length > limit) {
      const currentPage = page || 1;
      const startIndex = (currentPage - 1) * limit;
      result = result.slice(startIndex, startIndex + limit);
    }

    return result;
  }, [cards, sortKey, onSortChange, limit, page]);

  const displayCount = totalCount !== undefined ? totalCount : cards.length;

  return (
    <div className="neu-card p-6 space-y-4">
      {/* Wall Subheader & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Cohort Grid ({displayCount} monitored)
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full neu-card-flat text-blue-700 font-semibold">
            12-Mo Sparklines
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 neu-inset p-1 rounded-xl text-xs">
          <span className="text-xs text-slate-600 px-2 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </span>

          <button
            type="button"
            onClick={() => handleSortChange("risk")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              sortKey === "risk"
                ? "neu-btn-primary shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Risk
          </button>

          <button
            type="button"
            onClick={() => handleSortChange("z")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              sortKey === "z"
                ? "neu-btn-primary shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Z-Score
          </button>

          <button
            type="button"
            onClick={() => handleSortChange("duty")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              sortKey === "duty"
                ? "neu-btn-primary shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Duty Hours
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {sortedCards.map((card) => {
          const bandHex = STRAIN_BAND_COLOR[card.current_strain_band]?.hex || "#3b82f6";
          const isAlert = card.baseline_alert_flag === 1;

          return (
            <Link
              key={card.personnel_id}
              href={`/personnel/${card.personnel_id}`}
              className="group relative rounded-xl neu-card-flat p-3.5 hover:shadow-[-5px_-5px_15px_#ffffff,5px_5px_15px_rgba(163,177,198,0.6)] transition-all hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden"
            >
              {/* Band color bar at top */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: bandHex }}
              />

              <div className="pt-1">
                {/* Top row: ID, Rank, Trend */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {card.personnel_id}
                    </span>
                    <p className="text-xs text-slate-600 truncate max-w-[120px]">
                      {card.rank}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <TrendArrow trend={card.trend_flag} />
                    {isAlert && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border border-rose-400 text-rose-800 bg-rose-50"
                        title="Baseline alert active (z ≥ 1.0)"
                      >
                        Alert
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Band Pill & Risk */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <StrainBadge band={card.current_strain_band} size="sm" />
                  <span className="font-mono text-xs text-slate-700 font-semibold">
                    {(card.risk_probability * 100).toFixed(0)}% risk
                  </span>
                </div>

                {/* Trajectory Sparkline or Restricted Block */}
                <div className="my-2 py-1.5 px-1 neu-inset rounded-xl flex items-center justify-center min-h-[44px]">
                  {card.record_restricted ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Record restricted</span>
                    </div>
                  ) : (
                    <Sparkline data={card.series} width={130} height={32} />
                  )}
                </div>
              </div>

              {/* Bottom stats: Z-score & Duty hours */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-mono">
                <span className={card.current_z >= 1 ? "text-rose-700 font-bold" : ""}>
                  z: {card.current_z >= 0 ? `+${card.current_z.toFixed(1)}` : card.current_z.toFixed(1)}σ
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {card.duty_hours_current_month.toFixed(0)}h
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Pagination Controls */}
      {totalCount !== undefined && totalCount > limit && page !== undefined && onPageChange && (
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="neu-btn px-4 py-2 font-semibold text-slate-800 disabled:opacity-50 text-xs sm:text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 font-medium">
            Page {page} of {Math.ceil(totalCount / limit)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= Math.ceil(totalCount / limit)}
            className="neu-btn px-4 py-2 font-semibold text-slate-800 disabled:opacity-50 text-xs sm:text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
