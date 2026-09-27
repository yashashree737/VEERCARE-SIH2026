"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { WatchlistItem } from "@/lib/types";
import { STRAIN_BAND_COLOR } from "@/lib/tokens";
import StrainBadge from "./StrainBadge";
import TrendArrow from "./TrendArrow";
import { Search, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ShieldAlert, X } from "lucide-react";

interface WatchlistTableProps {
  items: WatchlistItem[];
  totalCount?: number;
  search?: string;
  onSearchChange?: (val: string) => void;
  selectedZone?: string;
  onZoneChange?: (val: string) => void;
  selectedBand?: string;
  onBandChange?: (val: string) => void;
  selectedTrend?: string;
  onTrendChange?: (val: string) => void;
  alertOnly?: boolean;
  onAlertOnlyChange?: (val: boolean) => void;
  onClearFilters?: () => void;
  availableZones?: string[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  isLoading?: boolean;
}

export default function WatchlistTable({
  items,
  totalCount,
  search: controlledSearch,
  onSearchChange,
  selectedZone: controlledZone,
  onZoneChange,
  selectedBand: controlledBand,
  onBandChange,
  selectedTrend: controlledTrend,
  onTrendChange,
  alertOnly: controlledAlertOnly,
  onAlertOnlyChange,
  onClearFilters,
  availableZones,
  sortKey: controlledSortKey,
  sortDirection: controlledSortDirection,
  onSortChange,
  isLoading = false,
}: WatchlistTableProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [localZone, setLocalZone] = useState("");
  const [localBand, setLocalBand] = useState("");
  const [localTrend, setLocalTrend] = useState("");
  const [localAlertOnly, setLocalAlertOnly] = useState(false);
  const [localSortKey, setLocalSortKey] = useState<string>("risk");
  const [localSortDirection, setLocalSortDirection] = useState<"asc" | "desc">("desc");

  const search = controlledSearch !== undefined ? controlledSearch : localSearch;
  const selectedZone = controlledZone !== undefined ? controlledZone : localZone;
  const selectedBand = controlledBand !== undefined ? controlledBand : localBand;
  const selectedTrend = controlledTrend !== undefined ? controlledTrend : localTrend;
  const alertOnly = controlledAlertOnly !== undefined ? controlledAlertOnly : localAlertOnly;
  const sortKey = controlledSortKey !== undefined ? controlledSortKey : localSortKey;
  const sortDirection = controlledSortDirection !== undefined ? controlledSortDirection : localSortDirection;

  const [searchInput, setSearchInput] = useState(search || "");

  React.useEffect(() => {
    setSearchInput(search || "");
  }, [search]);

  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setLocalSearch(val);
  };

  const handleZoneChange = (val: string) => {
    if (onZoneChange) onZoneChange(val);
    else setLocalZone(val);
  };

  const handleBandChange = (val: string) => {
    if (onBandChange) onBandChange(val);
    else setLocalBand(val);
  };

  const handleTrendChange = (val: string) => {
    if (onTrendChange) onTrendChange(val);
    else setLocalTrend(val);
  };

  const handleAlertOnlyToggle = () => {
    const next = !alertOnly;
    if (onAlertOnlyChange) onAlertOnlyChange(next);
    else setLocalAlertOnly(next);
  };

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      setLocalSearch("");
      setLocalZone("");
      setLocalBand("");
      setLocalTrend("");
      setLocalAlertOnly(false);
    }
  };

  const handleHeaderSort = (key: string) => {
    if (onSortChange) {
      onSortChange(key);
    } else {
      if (localSortKey === key) {
        setLocalSortDirection(localSortDirection === "asc" ? "desc" : "asc");
      } else {
        setLocalSortKey(key);
        setLocalSortDirection("desc");
      }
    }
  };

  const zones = useMemo(() => {
    if (availableZones && availableZones.length > 0) return availableZones;
    return Array.from(new Set(items.map((i) => i.deployment_zone))).sort();
  }, [items, availableZones]);

  const displayedItems = useMemo(() => {
    let res = items;
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (i) => i.personnel_id.toLowerCase().includes(q) || i.rank.toLowerCase().includes(q)
      );
    }
    if (!onZoneChange && selectedZone) {
      res = res.filter((i) => i.deployment_zone === selectedZone);
    }
    if (!onBandChange && selectedBand) {
      res = res.filter((i) => i.strain_band === selectedBand);
    }
    if (!onTrendChange && selectedTrend) {
      res = res.filter((i) => i.trend_flag === selectedTrend);
    }
    if (!onAlertOnlyChange && alertOnly) {
      res = res.filter((i) => i.baseline_alert_flag === 1);
    }

    return [...res].sort((a, b) => {
      let comp = 0;
      if (sortKey === "risk") comp = a.risk_probability - b.risk_probability;
      else if (sortKey === "z") comp = a.strain_z_from_baseline - b.strain_z_from_baseline;
      else if (sortKey === "strain") comp = a.strain_index - b.strain_index;
      else if (sortKey === "id") comp = a.personnel_id.localeCompare(b.personnel_id);
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [items, search, selectedZone, selectedBand, selectedTrend, alertOnly, sortKey, sortDirection, onSearchChange, onZoneChange, onBandChange, onTrendChange, onAlertOnlyChange]);

  const hasActiveFilters = Boolean(search || selectedZone || selectedBand || selectedTrend || alertOnly);

  const renderSortIcon = (colKey: string) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  return (
    <div className="neu-card shadow-xl overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="p-5 border-b border-white/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Force Welfare Triage Watchlist
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Prioritized by risk probability and personal-baseline deviation. Select filters to refine operational scope.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 font-bold">{displayedItems.length}</strong>
              {totalCount !== undefined ? ` of ${totalCount}` : ` of ${items.length}`} monitored personnel
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline font-semibold ml-2"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search ID or Rank */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchChange(searchInput);
                }}
                placeholder="Search ID / Rank..."
                aria-label="Search personnel by ID or rank"
                className="w-full neu-inset rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSearchChange(searchInput)}
              className="neu-btn-primary px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
            >
              Apply
            </button>
          </div>

          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => handleZoneChange(e.target.value)}
            aria-label="Filter by deployment zone"
            className="neu-inset rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          {/* Strain Band Filter */}
          <select
            value={selectedBand}
            onChange={(e) => handleBandChange(e.target.value)}
            aria-label="Filter by strain band"
            className="neu-inset rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">All Strain Bands</option>
            <option value="Severe">Severe (68-100)</option>
            <option value="High">High (50-67)</option>
            <option value="Moderate">Moderate (30-49)</option>
            <option value="Low">Low (0-29)</option>
          </select>

          {/* Trend Filter */}
          <select
            value={selectedTrend}
            onChange={(e) => handleTrendChange(e.target.value)}
            aria-label="Filter by trend"
            className="neu-inset rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">All Trends</option>
            <option value="Rising">Rising ▲</option>
            <option value="Stable">Stable –</option>
            <option value="Improving">Improving ▼</option>
          </select>

          {/* Baseline Alerts Only Toggle Button */}
          <button
            type="button"
            onClick={handleAlertOnlyToggle}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${alertOnly
                ? "bg-rose-100 text-rose-800 border border-rose-300 font-bold shadow-inner"
                : "neu-btn text-slate-700 hover:text-slate-900"
              }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Alerts Only (z ≥ 1.0)</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 neu-card px-4 py-2 rounded-xl shadow-lg">
              <span>Updating watchlist...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#ebf0f7] border-b border-slate-200/80 text-slate-700 font-bold uppercase text-xs tracking-wider">
              <th scope="col" className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("id")}
                  className="flex items-center gap-1 group font-bold"
                >
                  <span>Personnel</span>
                  {renderSortIcon("id")}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-3">Rank</th>
              <th scope="col" className="py-3.5 px-3">Deployment Zone</th>
              <th scope="col" className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("strain")}
                  className="flex items-center gap-1 group font-bold"
                >
                  <span>Strain & Band</span>
                  {renderSortIcon("strain")}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("z")}
                  className="flex items-center gap-1 group font-bold"
                >
                  <span>Baseline Deviation</span>
                  {renderSortIcon("z")}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-2 text-center">Trend</th>
              <th scope="col" className="py-3.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("risk")}
                  className="inline-flex items-center gap-1 group font-bold justify-end w-full"
                >
                  <span>Risk %</span>
                  {renderSortIcon("risk")}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4">Recommended Action</th>
              <th scope="col" className="py-3.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-600">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-semibold text-slate-800">No personnel match these filter criteria</p>
                    <p className="text-xs text-slate-500">
                      Try clearing or adjusting zone, band, or baseline alert filters.
                    </p>
                    {hasActiveFilters && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="neu-btn-primary px-3.5 py-1.5 text-xs font-semibold"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                const bandHex = STRAIN_BAND_COLOR[item.strain_band]?.hex || "#64748b";
                const isAlert = item.baseline_alert_flag === 1;
                const isSevere = item.strain_band === "Severe";

                return (
                  <tr
                    key={item.personnel_id}
                    className="hover:bg-white/70 transition-colors group"
                    style={{
                      borderLeft: isSevere ? `5px solid ${bandHex}` : `3px solid ${bandHex}`,
                    }}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/personnel/${item.personnel_id}`}
                        className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      >
                        {item.personnel_id}
                        {item.record_restricted && (
                          <span
                            className="w-2 h-2 rounded-full bg-slate-400 shrink-0"
                            title="Restricted welfare record (consent protected)"
                          />
                        )}
                      </Link>
                    </td>

                    {/* Rank */}
                    <td className="py-3.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                      {item.rank}
                    </td>

                    {/* Deployment Zone */}
                    <td className="py-3.5 px-3 text-slate-600 max-w-[160px] truncate" title={item.deployment_zone}>
                      {item.deployment_zone}
                    </td>

                    {/* Strain & Band */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <StrainBadge
                        band={item.strain_band}
                        score={item.strain_index}
                        size="sm"
                      />
                    </td>

                    {/* Baseline Deviation (z-score + alert badge) */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-semibold ${item.strain_z_from_baseline >= 1.0
                              ? "text-rose-700 font-bold"
                              : "text-slate-700"
                            }`}
                        >
                          {item.strain_z_from_baseline >= 0
                            ? `+${item.strain_z_from_baseline.toFixed(2)}`
                            : item.strain_z_from_baseline.toFixed(2)}
                          σ
                        </span>

                        {isAlert && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold border border-rose-400 text-rose-800 bg-rose-50">
                            Alert
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Trend */}
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <TrendArrow trend={item.trend_flag} />
                    </td>

                    {/* Risk % */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          item.risk_probability >= 0.5
                            ? "text-rose-700 font-bold"
                            : item.risk_probability >= 0.22
                              ? "text-amber-800 font-bold"
                              : "text-slate-700"
                        }
                      >
                        {(item.risk_probability * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4 text-slate-700 text-xs sm:text-sm max-w-[220px]">
                      <span className="line-clamp-2" title={item.intervention_recommended}>
                        {item.intervention_recommended}
                      </span>
                    </td>

                    {/* Action link */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/personnel/${item.personnel_id}`}
                        className="neu-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 hover:text-blue-600"
                      >
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
