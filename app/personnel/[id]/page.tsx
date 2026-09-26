"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  PersonnelDetailResponse,
  RosterResponse,
  TelemetryResponse,
  DriversResponse,
  StrainBreakdownResponse,
  HistoryResponse,
  HistoryItem,
} from "@/lib/types";
import { INTERVENTION_URGENCY } from "@/lib/tokens";
import BaselineChart from "@/components/BaselineChart";
import StrainBadge from "@/components/StrainBadge";
import TrendArrow from "@/components/TrendArrow";
import StrainBreakdown from "@/components/StrainBreakdown";
import DriverBars from "@/components/DriverBars";
import DutyCalendar from "@/components/DutyCalendar";
import TelemetryPanel from "@/components/TelemetryPanel";
import HistoryTimeline from "@/components/HistoryTimeline";
import SituationalAssessmentChat from "@/components/SituationalAssessmentChat";
import SoldierHomeView from "@/components/SoldierHomeView";
import PeriodicTestView from "@/components/PeriodicTestView";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Building2,
  Lock,
  PlusCircle,
  HeartHandshake,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Activity,
  Sliders,
  History,
  Info,
  X,
  Home,
  MessageSquare,
  PhoneCall,
  Heart,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  ChevronDown,
  Brain,
} from "lucide-react";

type TabKey = "home" | "test" | "overview" | "drivers" | "duty" | "history" | "self-assessment" | "support";

function PersonnelDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const id = (params?.id as string) || "";

  const [detail, setDetail] = useState<PersonnelDetailResponse | null>(null);
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);
  const [drivers, setDrivers] = useState<DriversResponse | null>(null);
  const [breakdown, setBreakdown] = useState<StrainBreakdownResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tabParam = searchParams.get("tab") as TabKey | null;
  const userRole = user?.role || "welfare";
  const validTabs: TabKey[] =
    userRole === "personnel"
      ? ["home", "test", "self-assessment", "duty", "support", "overview"]
      : userRole === "commander"
        ? ["duty", "history"]
        : userRole === "admin"
          ? ["duty"]
          : ["overview", "test", "drivers", "duty", "history"];

  const initialTab: TabKey =
    tabParam && validTabs.includes(tabParam)
      ? tabParam
      : validTabs[0] || "overview";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>(INTERVENTION_URGENCY[6]);
  const [notes, setNotes] = useState("");
  const [isEscalationConfirmStep, setIsEscalationConfirmStep] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tabParam) {
      if (validTabs.includes(tabParam as TabKey)) {
        setActiveTab(tabParam as TabKey);
      } else {
        setActiveTab(validTabs[0]);
      }
    }
  }, [tabParam, userRole]);

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(`/personnel/${id}?tab=${tab}`);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage(null);

      const [detRes, rostRes, telemRes, drivRes, breakRes, histRes] =
        await Promise.all([
          api.getPersonnel(id),
          api.getRoster(id).catch(() => ({ tier: "Monthly HR Reporting", daily_available: false, rows: [] })),
          api.getTelemetry(id).catch(() => ({ tier: "Monthly HR Reporting", telemetry_available: false, rows: [] })),
          api.getDrivers(id).catch(() => ({ personnel_id: id, record_restricted: false, drivers: [] })),
          api.getStrainBreakdown(id),
          api.getHistory(id),
        ]);

      setDetail(detRes);
      setRoster(rostRes);
      setTelemetry(telemRes);
      setDrivers(drivRes);
      setBreakdown(breakRes);
      setHistory(histRes);
      setSelectedAction(detRes.current.intervention_recommended || INTERVENTION_URGENCY[6]);
    } catch (err: any) {
      console.error("Error loading personnel profile:", err);
      if (err instanceof ApiError) {
        setErrorStatus(err.status);
        setErrorMessage(err.detail || err.message);
      } else {
        setErrorStatus(500);
        setErrorMessage(err.message || "Failed to load personnel profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (showLogModal) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        selectRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = "";
      logButtonRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showLogModal) {
        setShowLogModal(false);
        setIsEscalationConfirmStep(false);
        setActionError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogModal]);

  const handleLogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    const isCritical =
      selectedAction === "Immediate Welfare Escalation" ||
      selectedAction === "Unit Medical Referral";

    if (isCritical && !isEscalationConfirmStep) {
      setIsEscalationConfirmStep(true);
      return;
    }

    try {
      setSubmittingAction(true);
      setActionError(null);

      const created = await api.createIntervention({
        personnel_id: id,
        intervention_type: selectedAction,
        notes: notes || undefined,
      });

      const newHistoryItem: HistoryItem = {
        kind: "intervention",
        date: created.action_date,
        title: created.intervention_type,
        detail: `Initiated by: ${created.initiated_by} · Action logged in current session · Notes: ${notes || "None"}`,
        data: {
          intervention_id: created.intervention_id,
          personnel_id: created.personnel_id,
          action_date: created.action_date,
          intervention_type: created.intervention_type,
          initiated_by: created.initiated_by,
        },
      };

      setHistory((prev) =>
        prev
          ? {
            ...prev,
            history: [newHistoryItem, ...prev.history],
          }
          : null
      );

      setJustLogged(true);
      setActionSuccessMsg(`Successfully logged welfare action: ${created.intervention_type}`);
      setShowLogModal(false);
      setIsEscalationConfirmStep(false);
      setNotes("");

      changeTab("history");

      setTimeout(() => {
        setActionSuccessMsg(null);
        setJustLogged(false);
      }, 8000);
    } catch (err: any) {
      setActionError(err.message || "Failed to log intervention. Please verify permissions.");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Loading comprehensive service & strain record for {id}...</p>
      </div>
    );
  }

  if (errorStatus || !detail) {
    const isForbidden = errorStatus === 403;
    const isUnauth = errorStatus === 401;
    const isNotFound = errorStatus === 404;

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="p-8 neu-card space-y-4 w-full">
          <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {isUnauth
              ? "Authentication Required"
              : isForbidden
                ? "Access Restricted / Confidentiality Guard"
                : isNotFound
                  ? "Personnel Record Not Found"
                  : "Unable to Load Personnel File"}
          </h2>

          <p className="text-sm text-slate-700 leading-relaxed neu-inset p-3">
            {isForbidden
              ? "You do not have clearance to view this service file. Personnel records are strictly partitioned by unit and triage flags per force confidentiality policy."
              : errorMessage || `No record found for ID ${id}`}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={loadData}
              className="w-full sm:w-auto px-4 py-2 rounded-xl neu-btn text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Request
            </button>
            {user?.role === "personnel" ? (
              <Link
                href={`/personnel/${user.personnel_id || "P0013"}`}
                className="w-full sm:w-auto px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold"
              >
                Your Self Record
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold"
              >
                Return to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { profile, current, baseline, series, projected_next, record_restricted } = detail;
  const isCohort = profile.monitoring_tier === "Daily Telemetry Cohort";

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        {user?.role === "personnel" ? (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 neu-btn px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Portal Home
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 neu-btn px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        )}

      </div>

      {/* Sticky Compact Identity Bar at Top */}
      <div className="top-16 z-20 neu-card backdrop-blur-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-mono font-extrabold text-slate-900 tracking-tight">
            {profile.personnel_id}
          </span>
          <span className="text-xs font-bold text-slate-800 px-2.5 py-1 rounded-xl neu-card-flat">
            {profile.rank}
          </span>
          <span className="text-xs text-slate-600 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            Unit: <strong className="text-slate-900">{profile.home_unit_id}</strong>
          </span>
          <span className="text-xs text-slate-600 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {current.deployment_zone}
          </span>

          {user?.role === "personnel" ? (
            <span className="text-xs font-semibold text-emerald-800 neu-card-flat px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Private Wellness Space
            </span>
          ) : user?.role === "commander" || user?.role === "admin" ? (
            /* SECURITY: Individual clinical risk scores & Z-scores hidden for Commander / HR role. True enforcement requires backend RBAC. */
            <span className="text-xs font-semibold text-slate-700 neu-card-flat px-3 py-1 rounded-full border border-slate-300 flex items-center gap-1.5 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Restricted Duty Record (Operational Context Only)
            </span>
          ) : (
            <>
              <StrainBadge
                band={current.strain_band}
                showAlert={current.baseline_alert_flag === 1}
                score={current.strain_index}
                zScore={current.strain_z_from_baseline}
                size="sm"
              />
              <TrendArrow trend={current.trend_flag} showLabel={true} />
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {user?.role === "personnel" ? (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl neu-inset text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Confidential Jawan Space</span>
            </div>
          ) : user?.role === "welfare" || user?.role === "system" ? (
            <>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl neu-inset text-xs text-slate-700">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-600">Recommended:</span>
                <strong className="text-blue-700">{current.intervention_recommended}</strong>
              </div>

              <button
                ref={logButtonRef}
                onClick={() => setShowLogModal(true)}
                className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log Action</span>
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl neu-inset text-xs text-slate-600">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Clinical Log Restricted</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Navigation (hidden on md+) */}
      <div className="md:hidden">
        {(() => {
          // Tab definitions per role — mirrors desktop sidebar exactly
          const tabsByRole: Record<string, { value: TabKey; label: string; icon: React.ReactNode }[]> = {
            personnel: [
              { value: "home",            label: "Home",                  icon: <Home className="w-4 h-4 text-blue-600" /> },
              { value: "test",            label: "Periodic Tests",        icon: <Brain className="w-4 h-4 text-amber-500" /> },
              { value: "self-assessment", label: "AI Scenario Chat",      icon: <MessageSquare className="w-4 h-4 text-blue-500" /> },
              { value: "duty",            label: "Duty & Rest Calendar",  icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
              { value: "support",         label: "Support & Helplines",   icon: <PhoneCall className="w-4 h-4 text-emerald-500" /> },
              { value: "overview",        label: "Service Stats & Baseline", icon: <Activity className="w-4 h-4 text-blue-600" /> },
            ],
            commander: [
              { value: "duty",    label: "Duty & Calendar",   icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
              { value: "history", label: "History Timeline",  icon: <History className="w-4 h-4 text-slate-600" /> },
            ],
            admin: [
              { value: "duty", label: "Duty & Calendar", icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
            ],
          };
          const defaultTabs: { value: TabKey; label: string; icon: React.ReactNode }[] = [
            { value: "overview", label: "Overview",         icon: <Activity className="w-4 h-4 text-blue-600" /> },
            { value: "test",     label: "Periodic Tests",   icon: <Brain className="w-4 h-4 text-amber-500" /> },
            { value: "drivers",  label: "Risk Drivers",     icon: <Sliders className="w-4 h-4 text-slate-600" /> },
            { value: "duty",     label: "Duty & Telemetry", icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
            { value: "history",  label: "History Timeline", icon: <History className="w-4 h-4 text-slate-600" /> },
          ];
          const tabs = user?.role ? (tabsByRole[user.role] ?? defaultTabs) : defaultTabs;
          const active = tabs.find((t) => t.value === activeTab) ?? tabs[0];

          return (
            <div className="relative">
              <button
                type="button"
                id="mobile-tab-trigger"
                aria-haspopup="listbox"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((o) => !o)}
                onBlur={(e) => {
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                    setMobileMenuOpen(false);
                  }
                }}
                className="w-full neu-card px-4 py-3 pr-10 text-sm font-semibold text-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400/50 cursor-pointer flex items-center gap-2.5 text-left"
              >
                {active?.icon}
                <span className="flex-1">{active?.label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${mobileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {mobileMenuOpen && (
                <ul
                  role="listbox"
                  aria-label="Navigate sections"
                  className="absolute z-30 mt-2 w-full neu-card rounded-2xl py-1.5 shadow-xl overflow-hidden"
                >
                  {tabs.map((tab) => (
                    <li key={tab.value} role="option" aria-selected={activeTab === tab.value}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          changeTab(tab.value);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                          activeTab === tab.value
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </div>

      {/* Two-Column Sidebar + Content Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar Navigation */}
        <nav
          role="tablist"
          aria-label="Personnel Profile Navigation"
          className="hidden md:block w-full md:w-60 md:shrink-0 md:sticky md:top-36 md:self-start neu-card p-3 space-y-1.5 z-10"
        >
          <div className="text-metadata font-bold text-slate-600 uppercase tracking-wider px-3 py-1.5 hidden md:block border-b border-slate-200/80 mb-2">
            Sections
          </div>

          <div className="flex flex-wrap md:flex-col gap-1.5">
            {user?.role === "personnel" ? (
              <>
                <button
                  role="tab"
                  id="tab-home"
                  aria-selected={activeTab === "home"}
                  aria-controls="panel-home"
                  onClick={() => changeTab("home")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between gap-2 ${activeTab === "home"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span>Home</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    Welcome
                  </span>
                </button>

                <button
                  role="tab"
                  id="tab-test"
                  aria-selected={activeTab === "test"}
                  aria-controls="panel-test"
                  onClick={() => changeTab("test")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between gap-2 ${activeTab === "test"
                    ? "neu-btn-active text-amber-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span>Periodic Tests</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                    Weekly
                  </span>
                </button>

                <button
                  role="tab"
                  id="tab-self-assessment"
                  aria-selected={activeTab === "self-assessment"}
                  aria-controls="panel-self-assessment"
                  onClick={() => changeTab("self-assessment")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "self-assessment"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>AI Scenario Chat</span>
                </button>

                <button
                  role="tab"
                  id="tab-duty"
                  aria-selected={activeTab === "duty"}
                  aria-controls="panel-duty"
                  onClick={() => changeTab("duty")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "duty"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Duty & Rest Calendar</span>
                </button>

                <button
                  role="tab"
                  id="tab-support"
                  aria-selected={activeTab === "support"}
                  aria-controls="panel-support"
                  onClick={() => changeTab("support")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "support"
                    ? "neu-btn-active text-emerald-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <PhoneCall className="w-4 h-4 text-emerald-500" />
                  <span>Support & Helplines</span>
                </button>

                <button
                  role="tab"
                  id="tab-overview"
                  aria-selected={activeTab === "overview"}
                  aria-controls="panel-overview"
                  onClick={() => changeTab("overview")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "overview"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Service Stats & Baseline</span>
                </button>
              </>
            ) : user?.role === "commander" ? (
              /* SECURITY: Commander role gets Duty & Calendar + History Timeline only per Section 0 matrix */
              <>
                <button
                  role="tab"
                  id="tab-duty"
                  aria-selected={activeTab === "duty"}
                  aria-controls="panel-duty"
                  onClick={() => changeTab("duty")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "duty"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Duty & Calendar</span>
                </button>

                <button
                  role="tab"
                  id="tab-history"
                  aria-selected={activeTab === "history"}
                  aria-controls="panel-history"
                  onClick={() => changeTab("history")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "history"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <History className="w-4 h-4 text-slate-600" />
                  <span>History Timeline</span>
                </button>
              </>
            ) : user?.role === "admin" ? (
              /* SECURITY: HR (admin) role gets Duty & Calendar only per Section 0 matrix */
              <>
                <button
                  role="tab"
                  id="tab-duty"
                  aria-selected={activeTab === "duty"}
                  aria-controls="panel-duty"
                  onClick={() => changeTab("duty")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "duty"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Duty & Calendar</span>
                </button>
              </>
            ) : (
              /* Welfare / System Officer tabs */
              <>
                <button
                  role="tab"
                  id="tab-overview"
                  aria-selected={activeTab === "overview"}
                  aria-controls="panel-overview"
                  onClick={() => changeTab("overview")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "overview"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Overview</span>
                </button>

                <button
                  role="tab"
                  id="tab-test"
                  aria-selected={activeTab === "test"}
                  aria-controls="panel-test"
                  onClick={() => changeTab("test")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "test"
                    ? "neu-btn-active text-amber-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Brain className="w-4 h-4 text-amber-500" />
                  <span>Periodic Tests</span>
                </button>

                <button
                  role="tab"
                  id="tab-drivers"
                  aria-selected={activeTab === "drivers"}
                  aria-controls="panel-drivers"
                  onClick={() => changeTab("drivers")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "drivers"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Sliders className="w-4 h-4 text-slate-600" />
                  <span>Risk Drivers</span>
                </button>

                <button
                  role="tab"
                  id="tab-duty"
                  aria-selected={activeTab === "duty"}
                  aria-controls="panel-duty"
                  onClick={() => changeTab("duty")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "duty"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Duty & Telemetry</span>
                </button>

                <button
                  role="tab"
                  id="tab-history"
                  aria-selected={activeTab === "history"}
                  aria-controls="panel-history"
                  onClick={() => changeTab("history")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "history"
                    ? "neu-btn-active text-blue-600"
                    : "neu-btn text-slate-700 hover:text-slate-950"
                    }`}
                >
                  <History className="w-4 h-4 text-slate-600" />
                  <span>History Timeline</span>
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Right Content Panel */}
        <div className="flex-1 min-w-0 w-full">

          {/* Tab Panels */}
          {/* 0. SOLDIER WELCOME HOME TAB */}
          {activeTab === "home" && (
            <div id="panel-home" role="tabpanel" aria-labelledby="tab-home" className="space-y-6">
              <SoldierHomeView
                profile={profile}
                userName={user?.name}
                onNavigateTab={(t) => changeTab(t as TabKey)}
                deploymentZone={current.deployment_zone}
                dutyCount={roster ? roster.rows.filter(r => r.duty_type.toLowerCase().includes("duty") || (r.hours_worked || 0) > 0).length : 0}
                restCount={roster ? roster.rows.filter(r => r.is_rest_day === 1 || r.duty_type === "Rest Day").length : 0}
              />
            </div>
          )}

          {/* PERIODIC TEST TAB (PVT & WHO-5) */}
          {activeTab === "test" && (
            <div id="panel-test" role="tabpanel" aria-labelledby="tab-test" className="space-y-6">
              <PeriodicTestView personnelId={id} userName={user?.name} />
            </div>
          )}

          {/* SUPPORT & HELPLINES TAB */}
          {activeTab === "support" && (
            <div id="panel-support" role="tabpanel" aria-labelledby="tab-support" className="space-y-6">
              <div className="neu-card p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-emerald-600">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        24/7 Confidential Jawan Support & Helplines
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Free, confidential, and judgment-free assistance for all Indian Armed Forces personnel and families.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 neu-card-flat px-3 py-1 rounded-full border border-emerald-200 w-fit">
                    Toll-Free 24x7
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1 */}
                  <div className="neu-card-flat p-5 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Direct National Hotline
                    </div>
                    <div className="text-xl font-extrabold text-blue-700 font-mono">
                      1800-VEER-CARE
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      24x7 toll-free military mental health & welfare helpline. Speak with an army counselor in your preferred regional language.
                    </p>
                    <div className="text-[11px] text-emerald-700 font-medium pt-1">
                      ✓ 100% Private · Zero Record in ACR
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="neu-card-flat p-5 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Unit Welfare Officer
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      WO-{profile.home_unit_id} Dispatch
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Confidential welfare liaison assigned to {profile.home_unit_id}. Assistance with leave requests, family medical aid, and shift adjustments.
                    </p>
                    <div className="text-[11px] text-indigo-700 font-medium pt-1">
                      ✓ Unit Welfare Assistance
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="neu-card-flat p-5 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Peer Support Jawan
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      Buddy Check Network
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Trained peer comrades who listen without ranking barriers. Perfect for talking through post fatigue, high altitude stress, or family worries.
                    </p>
                    <div className="text-[11px] text-amber-800 font-medium pt-1">
                      ✓ Brother-to-Brother Comrade Support
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl neu-inset space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    VeerCare Strict Confidentiality Guarantee
                  </p>
                  <p className="leading-relaxed">
                    Per Indian Armed Forces Health and Welfare Guidelines, seeking guidance or speaking with counselors is a sign of operational strength and personal responsibility. Your interactions, self-checks, and calls are strictly private and are never disclosed in Annual Confidential Reports (ACR), promotion rosters, or leadership dossiers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
              <BaselineChart
                series={series}
                baseline={baseline}
                projectedNext={projected_next}
              />

              {breakdown && <StrainBreakdown breakdown={breakdown} />}

              {/* Recommended Action Card */}
              <div className="neu-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" />
                    Triage Recommendation Engine
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    {current.intervention_recommended}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Synthesized from current strain band ({current.strain_band}), personal baseline deviation (z = {current.strain_z_from_baseline.toFixed(2)}σ), and predictive incident risk probability ({(current.risk_probability * 100).toFixed(1)}%).
                  </p>
                </div>

                {user?.role !== "personnel" && (
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="neu-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Log Action Now</span>
                  </button>
                )}
              </div>

              {/* Soldier Data & Consent Transparency Panel */}
              {user?.role === "personnel" && (
                <div className="neu-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base font-bold text-slate-900">Your Data, Privacy & Consent Transparency</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full neu-card-flat text-emerald-800 border border-emerald-200">
                      Protected Self-Service
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl neu-card-flat space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        What Your Unit Commander Sees:
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Unit operational readiness, attendance, and aggregated roster duty hours. Commanders cannot view private coping dialogue, clinical assessments, or peer discussions.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl neu-card-flat space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
                        What The Welfare Officer Sees:
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Welfare officers only access records when risk deviations trigger triage watchlists. Routine healthy duty records are shielded by default.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl neu-card-flat space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-600" />
                        Wearable Device Pilot Status:
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Status: <strong className="text-slate-900">{profile.device_consent_status}</strong>. Sensor streams from the 24-volunteer pilot are strictly excluded from predictive strain scoring.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl neu-card-flat space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        Record Confidentiality Mode:
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Status: <strong className="text-slate-900">{record_restricted ? "Active Restricted Mode" : "Standard Force Triage"}</strong>. To request adjustments to sharing preferences, contact your Unit Welfare Cell.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DRIVERS TAB (Suppressed for Personnel Role per PRD §8.1) */}
          {user?.role !== "personnel" && activeTab === "drivers" && (
            <div id="panel-drivers" role="tabpanel" aria-labelledby="tab-drivers" className="space-y-6">
              {drivers && (
                <DriverBars
                  drivers={drivers.drivers}
                  recordRestricted={record_restricted}
                />
              )}

              <div className="neu-card p-5 text-xs space-y-2 text-slate-600">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  About ML Welfare Attribution
                </h4>
                <p className="leading-relaxed">
                  Drivers are sign-normalised feature deviations derived from XGBoost gradient boosting trees trained over 2,000 anonymised personnel duty profiles. Features identify which specific physiological, duty load, or recovery variances pushed this individual&apos;s risk probability above their historical baseline.
                </p>
              </div>
            </div>
          )}

          {/* 3. DUTY & TELEMETRY TAB */}
          {activeTab === "duty" && (
            <div id="panel-duty" role="tabpanel" aria-labelledby="tab-duty" className="space-y-6">
              {roster && (
                <DutyCalendar
                  roster={roster.rows}
                  dailyAvailable={roster.daily_available}
                  tier={profile.monitoring_tier}
                />
              )}
            </div>
          )}

          {/* 4. HISTORY TAB */}
          {activeTab === "history" && (
            <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="space-y-6">
              {history && (
                <HistoryTimeline
                  history={history.history}
                  recordRestricted={record_restricted}
                  highlightFirst={justLogged}
                />
              )}
            </div>
          )}

          {/* 5. SELF-ASSESSMENT TAB (PERSONNEL EXCLUSIVE) */}
          {activeTab === "self-assessment" && user?.role === "personnel" && (
            <div id="panel-self-assessment" role="tabpanel" aria-labelledby="tab-self-assessment" className="space-y-6">
              <SituationalAssessmentChat
                personnelId={id}
                rank={profile.rank}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog */}
      {showLogModal && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="intervention-modal-title"
          onClick={() => {
            setShowLogModal(false);
            setIsEscalationConfirmStep(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-card p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h4 id="intervention-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-blue-600" />
                Log Welfare Action for {profile.rank} {id}
              </h4>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => {
                  setShowLogModal(false);
                  setIsEscalationConfirmStep(false);
                }}
                className="neu-btn p-1.5 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {isEscalationConfirmStep ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    High-Consequence Action Confirmation
                  </div>
                  <p className="leading-relaxed">
                    You are logging <strong>{selectedAction}</strong> for <strong>{profile.personnel_id} ({profile.rank})</strong>.
                    This initiates emergency clinical protocol and immediately notifies unit command and medical cells.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEscalationConfirmStep(false)}
                    className="neu-btn px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Back to Form
                  </button>
                  <button
                    type="button"
                    onClick={handleLogAction}
                    disabled={submittingAction}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                  >
                    {submittingAction ? "Recording Action..." : "Confirm & Execute Escalation"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogAction} className="space-y-4">
                <div>
                  <label htmlFor="intervention-type-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Intervention Type (Urgency Ordered)
                  </label>
                  <select
                    id="intervention-type-select"
                    ref={selectRef}
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full neu-inset px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40"
                    required
                  >
                    {INTERVENTION_URGENCY.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="intervention-notes" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Welfare Officer Clinical & Operational Notes
                  </label>
                  <textarea
                    id="intervention-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter clinical context, agreed duty adjustments, counselling schedule, follow-up dates..."
                    rows={3}
                    className="w-full neu-inset px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="neu-btn px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="neu-btn-primary px-5 py-2.5 text-xs font-bold disabled:opacity-50"
                  >
                    {submittingAction ? "Recording..." : "Continue & Log Action"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl neu-card bg-[#f0f3f8] border border-emerald-300 shadow-2xl flex items-center gap-3 text-xs text-emerald-900 backdrop-blur-md max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-semibold">
            {actionSuccessMsg}
          </div>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PersonnelDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Loading personnel service record...</p>
        </div>
      }
    >
      <PersonnelDetailContent />
    </Suspense>
  );
}