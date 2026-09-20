"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  SummaryResponse,
  WatchlistResponse,
  WallResponse,
  CaseNote,
} from "@/lib/types";
import KpiTile from "@/components/KpiTile";
import StrainDistribution from "@/components/StrainDistribution";
import WatchlistTable from "@/components/WatchlistTable";
import UnitWall from "@/components/UnitWall";
import FeaturedCases from "@/components/FeaturedCases";
import { useAuth } from "@/lib/auth";
import {
  Users,
  AlertTriangle,
  BellRing,
  FileWarning,
  Activity,
  Layers,
  RefreshCw,
  Shield,
  Lock,
  ArrowRight,
  User,
  ShieldAlert,
  LogIn,
} from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const urlUnit = searchParams.get("unit") || "";
  const urlScope = searchParams.get("scope") || "";
  const urlZone = searchParams.get("zone") || "";
  const urlBand = searchParams.get("band") || "";
  const urlTrend = searchParams.get("trend") || "";
  const urlAlert = searchParams.get("alert") === "true";
  const urlSearch = searchParams.get("search") || "";

  const [selectedZone, setSelectedZone] = useState(urlZone);
  const [selectedBand, setSelectedBand] = useState(urlBand);
  const [selectedTrend, setSelectedTrend] = useState(urlTrend);
  const [alertOnly, setAlertOnly] = useState(urlAlert);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [limit, setLimit] = useState(50);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
  const [wall, setWall] = useState<WallResponse | null>(null);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ status?: number; message: string; detail?: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const updateUrlParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === null || v === "" || v === "false") {
          sp.delete(k);
        } else {
          sp.set(k, v);
        }
      });
      const qs = sp.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams]
  );

  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
    updateUrlParams({ zone });
  };

  const handleBandChange = (band: string) => {
    setSelectedBand(band);
    updateUrlParams({ band });
  };

  const handleTrendChange = (trend: string) => {
    setSelectedTrend(trend);
    updateUrlParams({ trend });
  };

  const handleAlertOnlyChange = (alert: boolean) => {
    setAlertOnly(alert);
    updateUrlParams({ alert: alert ? "true" : null });
  };

  const handleSearchChange = (q: string) => {
    setSearchTerm(q);
    updateUrlParams({ search: q || null });
  };

  const handleClearFilters = () => {
    setSelectedZone("");
    setSelectedBand("");
    setSelectedTrend("");
    setAlertOnly(false);
    setSearchTerm("");
    updateUrlParams({ zone: null, band: null, trend: null, alert: null, search: null });
  };

  const handleKpiOfConcernClick = () => {
    setSelectedBand("High");
    updateUrlParams({ band: "High" });
  };

  const handleKpiAlertsClick = () => {
    setAlertOnly(true);
    updateUrlParams({ alert: "true" });
  };

  const handleKpiResetClick = () => {
    handleClearFilters();
  };

  const loadData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        if (!summary) setInitialLoading(true);
        else setIsRefreshing(true);
      }
      setError(null);

      try {
        const effectiveRole = user?.role || "admin";
        const isCommander = effectiveRole === "commander";
        const isWelfare = effectiveRole === "welfare" || effectiveRole === "system";
        
        const effectiveUnit = isCommander ? (user?.unit_id || "U012") : (urlUnit || undefined);

        const wlParams: any = {
          limit,
          unit: effectiveUnit,
          flagged_only: isWelfare || urlScope === "flagged",
        };

        if (selectedZone) wlParams.zone = selectedZone;
        if (selectedBand) wlParams.band = selectedBand;
        if (selectedTrend) wlParams.trend = selectedTrend;
        if (alertOnly) wlParams.alert_only = true;

        const [sumRes, wlRes, wallRes, casesRes] = await Promise.all([
          api.getSummary(effectiveUnit),
          api.getWatchlist(wlParams),
          api.getWall(effectiveUnit),
          api.getCaseNotes().catch(() => []),
        ]);

        setSummary(sumRes);
        setWatchlist(wlRes);
        setWall(wallRes);
        setCaseNotes(casesRes);

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setLastUpdated(timeStr);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        if (err instanceof ApiError) {
          setError({
            status: err.status,
            message: err.status === 403 
              ? "You do not have authorization to view this unit's operational data."
              : err.status === 401
              ? "Your session has expired. Please authenticate again."
              : "Unable to connect to the force analytics service.",
            detail: err.detail,
          });
        } else {
          setError({
            message: err?.message || "Failed to load dashboard data",
            detail: String(err),
          });
        }
      } finally {
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [user, urlUnit, urlScope, limit, selectedZone, selectedBand, selectedTrend, alertOnly, summary]
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setInitialLoading(false);
      return;
    }
    loadData();
  }, [isAuthLoading, isAuthenticated, user?.role, user?.unit_id, urlUnit, urlScope, limit, selectedZone, selectedBand, selectedTrend, alertOnly]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Verifying defense credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="p-8 neu-card space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-blue-600 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Security Authentication Required</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The Command Watchlist and Unit Wall are restricted defense resources. Please sign in through the VeerCare portal to access this console.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="neu-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Defense Login Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === "personnel") {
    const soldierId = user?.personnel_id || "P0013";
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
        <div className="p-8 neu-card space-y-4 border-emerald-300">
          <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-emerald-600 mx-auto">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Soldier Confidential Portal</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Per force privacy policies, individual soldiers do not access overall force-wide or peer reports. You are authorized to access your own personal duty hours, working conditions baseline, and voluntary AI coping dialogue.
          </p>
          <div className="pt-2">
            <Link
              href={`/personnel/${soldierId}`}
              className="neu-btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold"
            >
              <span>View Your Service Record ({soldierId})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isForbidden = error.status === 403;
    const isUnauth = error.status === 401;

    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-7 neu-card max-w-lg space-y-3">
          {isForbidden || isUnauth ? (
            <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto mb-2" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          )}
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {isForbidden ? "Command Access Restricted" : isUnauth ? "Session Expired" : "Failed to Connect to Analytics Service"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{error.message}</p>
          
          {error.detail && (
            <details className="text-left neu-inset p-3 text-xs text-slate-700 font-mono">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-800 font-sans font-medium mb-1">
                Technical detail
              </summary>
              <pre className="overflow-x-auto whitespace-pre-wrap">{error.detail}</pre>
            </details>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="neu-btn-primary px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              Switch Account / Sign In
            </Link>
            <button
              type="button"
              onClick={() => loadData()}
              className="neu-btn px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading || !summary || !watchlist || !wall) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-14 neu-card-flat bg-slate-200/60" />
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-300 rounded-xl" />
            <div className="h-4 w-72 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-6 w-28 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 neu-card p-5 space-y-3">
              <div className="h-4 w-24 bg-slate-300 rounded" />
              <div className="h-8 w-16 bg-slate-400 rounded" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="h-80 neu-card" />
      </div>
    );
  }

  const userRole = user?.role;
  const isCommander = userRole === "commander";
  const activeUnit = isCommander ? (user?.unit_id || "U012") : (urlUnit || "");

  return (
    <div className="space-y-6 pb-12">
      {/* Universal Dashboard Title */}
      <div className="pt-2 pb-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {user?.name}&apos;s Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {userRole === "admin" ? "System Administration & Evaluation" : 
           isCommander ? `Commanding Officer, Unit ${activeUnit}` :
           userRole === "welfare" ? "Welfare Officer Clinical Scope" :
           "Personnel Secure Portal"}
        </p>
      </div>

      {/* Role Scoping Banner */}
      {userRole === "admin" ? (
        <div className="p-3.5 sm:p-4 neu-card bg-gradient-to-r from-amber-50/80 via-white/40 to-blue-50/80 border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 shadow-md">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Evaluation access:</strong> Universal clearance active across all units and personnel.
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded neu-card-flat text-amber-900 border border-amber-300/60 shrink-0">
            PROTOTYPE-ADMIN
          </span>
        </div>
      ) : isCommander && activeUnit ? (
        <div className="p-3.5 sm:p-4 neu-card bg-gradient-to-r from-indigo-50/80 via-white/40 to-blue-50/80 border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-indigo-900">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Unit Commander Scope:</strong> Displaying operational roster and welfare posture restricted to <strong>Unit {activeUnit}</strong> ({watchlist.results.length} active personnel).
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-indigo-700 hover:text-indigo-900 underline font-semibold shrink-0"
          >
            Switch Role
          </Link>
        </div>
      ) : userRole === "welfare" ? (
        <div className="p-3.5 sm:p-4 neu-card bg-gradient-to-r from-blue-50/80 via-white/40 to-sky-50/80 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-blue-900">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Welfare Officer Clinical Scope:</strong> Displaying soldiers under active watching or flagged for triage. Unflagged healthy soldiers shielded.
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded neu-card-flat text-blue-800 border border-blue-200">
            {watchlist.results.length} Cases Under Watching
          </span>
        </div>
      ) : null}

      {/* ZONE A — FORCE / SCOPED VIEW */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl neu-inset text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isCommander
                  ? `Unit ${activeUnit} Welfare & Duty Posture`
                  : "Force Triage & Early-Warning Posture"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {isCommander
                  ? `Active deployment and stress tracking for Unit ${activeUnit}`
                  : `Active welfare monitoring across ${summary.personnel_monitored.toLocaleString()} force personnel (Month: ${summary.current_month})`}
              </p>
            </div>
          </div>

          {/* Freshness timestamp & Refresh Button */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {lastUpdated && (
              <span className="neu-card-flat px-2.5 py-1 text-slate-700 font-mono text-xs">
                Updated {lastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg neu-btn text-slate-700 hover:text-slate-950 transition-colors focus-visible"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
            <span className="hidden sm:inline font-mono text-slate-700 neu-card-flat px-3 py-1 text-xs">
              Model: {summary.model_version}
            </span>
          </div>
        </div>

        {/* 4 Interactive KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Personnel Monitored"
            value={summary.personnel_monitored.toLocaleString()}
            subtext={
              isCommander
                ? `Total personnel in Unit ${activeUnit} (Click to reset)`
                : "Force-wide operational tracking (Click to reset)"
            }
            icon={<Users className="w-4 h-4 text-blue-600" />}
            onClick={handleKpiResetClick}
          />

          <KpiTile
            label="Of Concern"
            value={summary.of_concern.toLocaleString()}
            subtext="High/Severe band OR baseline alert (Click to filter)"
            icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
            alert={true}
            onClick={handleKpiOfConcernClick}
          />

          <KpiTile
            label="Baseline Alerts Active"
            value={summary.baseline_alerts_active.toLocaleString()}
            subtext="z >= 1.0 deviation from personal norm (Click to filter)"
            icon={<BellRing className="w-4 h-4 text-amber-600" />}
            onClick={handleKpiAlertsClick}
          />

          <KpiTile
            label="Incidents Last Month"
            value={summary.incidents_last_month.toLocaleString()}
            subtext="Adverse welfare records in 2026-08"
            icon={<FileWarning className="w-4 h-4 text-indigo-600" />}
          />
        </div>

        {/* Strain Distribution Stacked Bar */}
        <StrainDistribution
          distribution={summary.strain_distribution}
          total={summary.personnel_monitored}
        />

        {/* Server-Side Watchlist Table with True Counts & Skeletons */}
        <WatchlistTable
          items={watchlist.results}
          totalCount={watchlist.count}
          search={searchTerm}
          onSearchChange={handleSearchChange}
          selectedZone={selectedZone}
          onZoneChange={handleZoneChange}
          selectedBand={selectedBand}
          onBandChange={handleBandChange}
          selectedTrend={selectedTrend}
          onTrendChange={handleTrendChange}
          alertOnly={alertOnly}
          onAlertOnlyChange={handleAlertOnlyChange}
          onClearFilters={handleClearFilters}
          isLoading={isRefreshing}
        />

        {/* Load More Pagination Affordance */}
        {watchlist.results.length < watchlist.count && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setLimit((prev) => prev + 50)}
              className="neu-btn px-5 py-2 font-semibold text-slate-800 hover:text-blue-600 text-xs sm:text-sm shadow-md"
            >
              Load more personnel (+50)
            </button>
          </div>
        )}
      </section>

      {/* ZONE B — UNIT WALL */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl neu-inset text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isCommander
                  ? `Unit ${activeUnit} Telemetry Grid`
                  : "Tier-1 Unit Telemetry Wall"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                12-month continuous strain trajectories and personal baseline early warnings
              </p>
            </div>
          </div>
        </div>

        {/* Unit Wall Grid */}
        <UnitWall cards={wall.results} />
      </section>

      {/* Case Walkthroughs */}
      {caseNotes.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-slate-200/80">
          <h3 className="text-base font-bold text-slate-800">Featured Clinical Case Walkthroughs</h3>
          <FeaturedCases cases={caseNotes} />
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-600">Loading force welfare dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
