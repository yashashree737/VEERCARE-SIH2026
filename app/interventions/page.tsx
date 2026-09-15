"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { InterventionsResponse } from "@/lib/types";
import {
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

type SortField = "action_date" | "personnel_id" | "trigger_strain" | "trigger_z" | "strain_change_30d";
type SortDir = "asc" | "desc";

function InterventionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<InterventionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [effectiveFilter, setEffectiveFilter] = useState(searchParams.get("outcome") || "");
  const [sortField, setSortField] = useState<SortField | null>(
    (searchParams.get("sortBy") as SortField) || null
  );
  const [sortDir, setSortDir] = useState<SortDir>(
    (searchParams.get("sortDir") as SortDir) || "desc"
  );
  const [displayLimit, setDisplayLimit] = useState(100);

  const syncToUrl = useCallback(
    (s: string, t: string, eff: string, sf: SortField | null, sd: SortDir) => {
      const sp = new URLSearchParams();
      if (s) sp.set("search", s);
      if (t) sp.set("type", t);
      if (eff) sp.set("outcome", eff);
      if (sf) {
        sp.set("sortBy", sf);
        sp.set("sortDir", sd);
      }
      const qs = sp.toString();
      router.replace(`/interventions${qs ? `?${qs}` : ""}`);
    },
    [router]
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    syncToUrl(val, typeFilter, effectiveFilter, sortField, sortDir);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    syncToUrl(search, val, effectiveFilter, sortField, sortDir);
  };

  const handleEffectiveChange = (val: string) => {
    setEffectiveFilter(val);
    syncToUrl(search, typeFilter, val, sortField, sortDir);
  };

  const handleSort = (field: SortField) => {
    let nextField: SortField | null = field;
    let nextDir: SortDir = "desc";

    if (sortField === field) {
      if (sortDir === "desc") {
        nextDir = "asc";
      } else {
        nextField = null;
        nextDir = "desc";
      }
    }

    setSortField(nextField);
    setSortDir(nextDir);
    syncToUrl(search, typeFilter, effectiveFilter, nextField, nextDir);
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setEffectiveFilter("");
    setSortField(null);
    setSortDir("desc");
    syncToUrl("", "", "", null, "desc");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage(null);
      const res = await api.getInterventions();
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err: any) {
      console.error("Error loading interventions:", err);
      if (err instanceof ApiError) {
        setErrorStatus(err.status);
        setErrorMessage(err.detail || err.message);
      } else {
        setErrorStatus(500);
        setErrorMessage(err.message || "Failed to load interventions data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const types = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.results.map((r) => r.intervention_type))).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.results.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        if (!item.personnel_id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (typeFilter && item.intervention_type !== typeFilter) {
        return false;
      }
      if (effectiveFilter) {
        if (effectiveFilter === "effective" && item.outcome_effective !== 1) return false;
        if (effectiveFilter === "no_change" && item.outcome_effective !== 0) return false;
        if (effectiveFilter === "in_progress" && item.outcome_effective !== null) return false;
      }
      return true;
    });

    if (sortField) {
      list = [...list].sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "string") {
          const cmp = valA.localeCompare(valB);
          return sortDir === "asc" ? cmp : -cmp;
        }

        return sortDir === "asc" ? valA - valB : valB - valA;
      });
    }

    return list;
  }, [data, search, typeFilter, effectiveFilter, sortField, sortDir]);

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) return;

    const headers = [
      "Intervention ID",
      "Action Date",
      "Personnel ID",
      "Intervention Type",
      "Initiated By",
      "Trigger Strain",
      "Trigger Z",
      "Follow-Up Date",
      "Post Strain 30d",
      "Strain Change 30d",
      "Outcome Status",
    ];

    const rows = filtered.map((r) => [
      r.intervention_id,
      r.action_date,
      r.personnel_id,
      `"${r.intervention_type.replace(/"/g, '""')}"`,
      `"${r.initiated_by.replace(/"/g, '""')}"`,
      r.trigger_strain !== null ? r.trigger_strain.toFixed(1) : "",
      r.trigger_z !== null ? r.trigger_z.toFixed(2) : "",
      r.trigger_strain !== null && r.strain_change_30d !== null ? (r.trigger_strain + r.strain_change_30d).toFixed(1) : "",
      r.strain_change_30d !== null ? r.strain_change_30d.toFixed(1) : "",
      r.outcome_effective === 1 ? "Effective" : r.outcome_effective === 0 ? "No Change" : "In Progress",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `veercare-interventions-${effectiveFilter || "all"}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Loading force welfare interventions & outcome registry...</p>
      </div>
    );
  }

  if (errorStatus || !data) {
    const isForbidden = errorStatus === 403;
    const isUnauth = errorStatus === 401;

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="p-8 neu-card space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-amber-600 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isUnauth ? "Authentication Required" : isForbidden ? "Command Access Restricted" : "Registry Service Error"}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed neu-inset p-3">
            {isForbidden
              ? "The Force Interventions Registry is accessible only to Welfare Officers and Unit Commanders. Personnel are restricted to confidential personal records."
              : errorMessage || "Failed to load interventions data"}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={loadData}
              className="neu-btn px-4 py-2 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
            <Link
              href="/"
              className="neu-btn-primary px-5 py-2 text-xs font-bold"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effPct = (data.headline_effectiveness * 100).toFixed(1);
  const visibleRows = filtered.slice(0, displayLimit);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Headline KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Title Card */}
        <div className="md:col-span-2 neu-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl neu-inset text-blue-600">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Force Welfare Interventions & Outcomes
                </h1>
              </div>

              {/* Freshness timestamp & Refresh control */}
              <div className="flex items-center gap-2 text-xs text-slate-600 neu-card-flat px-3 py-1">
                <span>Updated {lastUpdated}</span>
                <button
                  type="button"
                  aria-label="Refresh registry data"
                  onClick={loadData}
                  className="p-1 hover:text-slate-950 transition-colors rounded"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Longitudinal tracking of welfare officer actions, clinical/counselling referrals, workload rebalancing, and post-intervention strain resolution.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Total Logged Actions: <strong className="text-slate-900 font-mono font-bold">{data.count.toLocaleString()}</strong>
              </span>
              <span>·</span>
              <span>Includes real-time session interventions</span>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Headline Effectiveness KPI Tile */}
        <div className="neu-card p-6 flex flex-col justify-between border-emerald-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Headline Effectiveness
            </span>
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-emerald-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-4xl font-extrabold text-slate-900 font-mono">{effPct}%</div>
            <p className="text-xs text-slate-600 mt-1">
              Mean rate of confirmed strain reduction or symptom resolution at 30-day review.
            </p>
          </div>

          <div className="text-xs text-emerald-800 font-bold">
            Verified across 30-day follow-up evaluations
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Showing <strong className="text-slate-900 font-mono font-bold">{visibleRows.length}</strong> of{" "}
            <strong className="text-slate-900 font-mono font-bold">{filtered.length}</strong> matching actions
            {filtered.length > displayLimit && (
              <span className="text-amber-800 ml-1.5 font-bold">
                (Refine filters or click Load More below)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full sm:w-auto">
            {/* Search Person ID */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search Person ID..."
                className="w-full sm:w-44 neu-inset pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="neu-inset px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All Action Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Effective Filter */}
            <select
              value={effectiveFilter}
              onChange={(e) => handleEffectiveChange(e.target.value)}
              className="neu-inset px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All Outcomes</option>
              <option value="effective">Effective</option>
              <option value="no_change">No change</option>
              <option value="in_progress">In progress</option>
            </select>
          </div>
        </div>

        {/* Table of Interventions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#ebf0f7] border-b border-slate-200/80 text-slate-700 font-bold tracking-wider uppercase text-xs">
                <th
                  onClick={() => handleSort("action_date")}
                  className="py-3 px-3 cursor-pointer hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortField === "action_date" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("personnel_id")}
                  className="py-3 px-3 cursor-pointer hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Person</span>
                    {sortField === "personnel_id" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("trigger_strain")}
                  className="py-3 px-3 cursor-pointer hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Trigger Strain</span>
                    {sortField === "trigger_strain" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("trigger_z")}
                  className="py-3 px-3 cursor-pointer hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Trigger Z</span>
                    {sortField === "trigger_z" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4">Intervention Type</th>
                <th className="py-3 px-3">Initiated By</th>
                <th className="py-3 px-3">Follow-up</th>

                <th
                  onClick={() => handleSort("strain_change_30d")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-950 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Strain Δ 30d</span>
                    {sortField === "strain_change_30d" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-3 text-center">Outcome Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center font-sans">
                    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                      <p className="text-sm text-slate-600 font-medium">No intervention records match these filters.</p>
                      <button
                        onClick={clearFilters}
                        className="neu-btn px-4 py-1.5 text-slate-800 text-xs font-semibold flex items-center gap-1.5 mt-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear All Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => {
                  const isEff = r.outcome_effective === 1;
                  const isNoChange = r.outcome_effective === 0;

                  return (
                    <tr
                      key={r.intervention_id}
                      className="hover:bg-white/70 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {r.action_date}
                      </td>

                      {/* Person */}
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap font-sans">
                        <Link
                          href={`/personnel/${r.personnel_id}`}
                          className="hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                        >
                          {r.personnel_id}
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      </td>

                      {/* Trigger Strain */}
                      <td className="py-3 px-3 text-slate-800">
                        {r.trigger_strain !== null ? r.trigger_strain.toFixed(1) : "—"}
                      </td>

                      {/* Trigger Z */}
                      <td className="py-3 px-3">
                        {r.trigger_z !== null ? (
                          <span
                            className={
                              r.trigger_z >= 1.0 ? "text-rose-700 font-bold" : "text-slate-700"
                            }
                          >
                            {r.trigger_z >= 0 ? `+${r.trigger_z.toFixed(2)}` : r.trigger_z.toFixed(2)}σ
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 font-sans font-bold text-slate-800 whitespace-nowrap">
                        {r.intervention_type}
                      </td>

                      {/* Initiated By */}
                      <td className="py-3 px-3 font-sans text-slate-600 whitespace-nowrap">
                        {r.initiated_by}
                      </td>

                      {/* Follow-up */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {r.follow_up_date || "Pending"}
                      </td>

                      {/* Strain Change 30d */}
                      <td className="py-3 px-3 text-right">
                        {r.strain_change_30d !== null ? (
                          <span
                            className={
                              r.strain_change_30d < 0
                                ? "text-emerald-700 font-bold"
                                : r.strain_change_30d > 0
                                ? "text-rose-700 font-bold"
                                : "text-slate-700"
                            }
                          >
                            {r.strain_change_30d > 0
                              ? `+${r.strain_change_30d.toFixed(1)}`
                              : `${r.strain_change_30d.toFixed(1)}`}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Outcome Status Badges */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                        {isEff ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold neu-card-flat text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Effective
                          </span>
                        ) : isNoChange ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold neu-card-flat text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            No Change
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold neu-card-flat text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button if filtered exceeds limit */}
        {filtered.length > displayLimit && (
          <div className="pt-3 text-center border-t border-slate-200/80">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="neu-btn px-5 py-2 text-slate-800 text-xs font-bold"
            >
              Load Next 100 Records (Showing {displayLimit} of {filtered.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterventionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-600">Loading interventions registry...</p>
        </div>
      }
    >
      <InterventionsContent />
    </Suspense>
  );
}
