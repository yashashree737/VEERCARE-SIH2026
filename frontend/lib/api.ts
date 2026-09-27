/**
 * VeerCare Frontend API Client.
 * Now configured to route through the Next.js API Proxy to hide backend URLs,
 * API Keys, and authentication details from the browser.
 */

import {
  SummaryResponse,
  WatchlistResponse,
  WallResponse,
  PersonnelDetailResponse,
  RosterResponse,
  TelemetryResponse,
  DriversResponse,
  StrainBreakdownResponse,
  HistoryResponse,
  InterventionsResponse,
  CreateInterventionRequest,
  InterventionRecord,
  MetricsResponse,
  CaseNote,
  SituationalAssessmentRequest,
  SituationalAssessmentResponse,
  AuthUser,
  LoginResponse,
} from "./types";
import { seedApi } from "./seed";

// Toggle flag: false = Live Backend Mode, true = Standalone Seed Mode
const USE_SEED_MODE = false;

// API_BASE is now empty to target the local Next.js proxy
const API_BASE = "";

export class ApiError extends Error {
  status: number;
  endpoint: string;
  detail: string;

  constructor(status: number, endpoint: string, detail: string) {
    super(detail || `Request to ${endpoint} failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.detail = detail;
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = "";
    try {
      const err = await res.json();
      errorDetail = typeof err.detail === "string"
        ? err.detail
        : err.detail?.detail || err.error || JSON.stringify(err);
    } catch {
      errorDetail = await res.text();
    }

    if (res.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== "/" && !currentPath.startsWith("/?")) {
        window.location.href = `/?next=${encodeURIComponent(currentPath)}`;
      }
    }

    throw new ApiError(res.status, endpoint, errorDetail);
  }

  return res.json();
}

export const api = {
  getSummary: (unit?: string): Promise<SummaryResponse> => {
    if (USE_SEED_MODE) return seedApi.getSummary();
    const qs = unit ? `?unit_id=${encodeURIComponent(unit)}` : "";
    return fetchJson<SummaryResponse>(`/api/summary${qs}`);
  },

  getWatchlist: (params?: {
    month?: string;
    limit?: number;
    page?: number;
    zone?: string;
    trend?: string;
    tier?: string;
    band?: string;
    unit?: string;
    flagged_only?: boolean;
    alert_only?: boolean;
    min_risk?: number;
    search?: string;
    sort_key?: string;
    sort_direction?: string;
  }): Promise<WatchlistResponse> => {
    if (USE_SEED_MODE) return seedApi.getWatchlist(params);
    const q = new URLSearchParams();
    if (params?.month) q.set("month", params.month);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.page) q.set("page", String(params.page));
    if (params?.zone) q.set("zone", params.zone);
    if (params?.trend) q.set("trend", params.trend);
    if (params?.tier) q.set("tier", params.tier);
    if (params?.band) q.set("band", params.band);
    if (params?.unit) q.set("unit_id", params.unit);
    if (params?.flagged_only) q.set("flagged_only", "true");
    if (params?.alert_only) q.set("alert_only", "true");
    if (params?.min_risk !== undefined) q.set("min_risk", String(params.min_risk));
    if (params?.search) q.set("search", params.search);
    if (params?.sort_key) q.set("sort_key", params.sort_key);
    if (params?.sort_direction) q.set("sort_direction", params.sort_direction);

    const qs = q.toString();
    return fetchJson<WatchlistResponse>(`/api/watchlist${qs ? `?${qs}` : ""}`);
  },

  getWall: (params?: {
    unit?: string;
    limit?: number;
    page?: number;
    search?: string;
    sort_key?: string;
    sort_direction?: string;
    zone?: string;
    trend?: string;
    band?: string;
    min_risk?: number;
    alert_only?: boolean;
  }): Promise<WallResponse> => {
    if (USE_SEED_MODE) return seedApi.getWall(params?.unit); // seed doesn't fully support all for wall, but it's ok
    const q = new URLSearchParams();
    if (params?.unit) q.set("unit_id", params.unit);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.page) q.set("page", String(params.page));
    if (params?.search) q.set("search", params.search);
    if (params?.sort_key) q.set("sort_key", params.sort_key);
    if (params?.sort_direction) q.set("sort_direction", params.sort_direction);
    if (params?.zone) q.set("zone", params.zone);
    if (params?.trend) q.set("trend", params.trend);
    if (params?.band) q.set("band", params.band);
    if (params?.min_risk !== undefined) q.set("min_risk", String(params.min_risk));
    if (params?.alert_only) q.set("alert_only", "true");
    
    const qs = q.toString();
    return fetchJson<WallResponse>(`/api/wall${qs ? `?${qs}` : ""}`);
  },

  getPersonnel: (id: string): Promise<PersonnelDetailResponse> => {
    if (USE_SEED_MODE) return seedApi.getPersonnel(id);
    return fetchJson<PersonnelDetailResponse>(`/api/personnel/${id}`);
  },

  getRoster: (id: string): Promise<RosterResponse> => {
    if (USE_SEED_MODE) return seedApi.getRoster(id);
    return fetchJson<RosterResponse>(`/api/personnel/${id}/roster`);
  },

  getTelemetry: (id: string): Promise<TelemetryResponse> => {
    if (USE_SEED_MODE) return seedApi.getTelemetry(id);
    return fetchJson<TelemetryResponse>(`/api/personnel/${id}/telemetry`);
  },

  getDrivers: (id: string): Promise<DriversResponse> => {
    if (USE_SEED_MODE) return seedApi.getDrivers(id);
    return fetchJson<DriversResponse>(`/api/personnel/${id}/drivers`);
  },

  getStrainBreakdown: (id: string): Promise<StrainBreakdownResponse> => {
    if (USE_SEED_MODE) return seedApi.getStrainBreakdown(id);
    return fetchJson<StrainBreakdownResponse>(`/api/personnel/${id}/strain-breakdown`);
  },

  getHistory: (id: string): Promise<HistoryResponse> => {
    if (USE_SEED_MODE) return seedApi.getHistory(id);
    return fetchJson<HistoryResponse>(`/api/personnel/${id}/history`);
  },

  getInterventions: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    outcome?: string;
    sort_key?: string;
    sort_direction?: string;
  }): Promise<InterventionsResponse> => {
    if (USE_SEED_MODE) return seedApi.getInterventions();
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    if (params?.type) q.set("type", params.type);
    if (params?.outcome) q.set("outcome", params.outcome);
    if (params?.sort_key) q.set("sort_key", params.sort_key);
    if (params?.sort_direction) q.set("sort_direction", params.sort_direction);
    
    const qs = q.toString();
    return fetchJson<InterventionsResponse>(`/api/interventions${qs ? `?${qs}` : ""}`);
  },

  createIntervention: (req: CreateInterventionRequest): Promise<InterventionRecord> => {
    if (USE_SEED_MODE) return seedApi.createIntervention(req);
    return fetchJson<InterventionRecord>("/api/interventions", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  getMetrics: (): Promise<MetricsResponse> => {
    if (USE_SEED_MODE) return seedApi.getMetrics();
    return fetchJson<MetricsResponse>("/api/model/metrics");
  },

  getUnits: (): Promise<{ units: string[] }> => {
    if (USE_SEED_MODE) return seedApi.getUnits();
    return fetchJson<{ units: string[] }>("/api/units");
  },

  getCaseNotes: (): Promise<CaseNote[]> => {
    if (USE_SEED_MODE) return seedApi.getCaseNotes();
    return fetchJson<CaseNote[]>("/api/case-notes");
  },

  submitSituationalAssessment: (
    req: SituationalAssessmentRequest
  ): Promise<SituationalAssessmentResponse> => {
    if (USE_SEED_MODE) return seedApi.submitSituationalAssessment(req);
    return fetchJson<SituationalAssessmentResponse>(
      `/api/personnel/${req.personnel_id}/situational-assessment`,
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    );
  },

  getSituationalAssessments: (
    id: string
  ): Promise<{ personnel_id: string; assessments: SituationalAssessmentResponse[] }> => {
    if (USE_SEED_MODE) return seedApi.getSituationalAssessments(id);
    return fetchJson<{ personnel_id: string; assessments: SituationalAssessmentResponse[] }>(
      `/api/personnel/${id}/situational-assessment`
    );
  },

  login: async (personnel_id: string, password: string): Promise<LoginResponse> => {
    if (USE_SEED_MODE) {
      return seedApi.login(personnel_id, password);
    }
    return fetchJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ personnel_id, password }),
    });
  },

  getMe: (): Promise<AuthUser> => {
    return fetchJson<AuthUser>("/api/auth/me");
  },

  logout: async (): Promise<{ message: string }> => {
    return fetchJson<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  },
};

