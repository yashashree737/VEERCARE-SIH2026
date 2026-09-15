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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("veercare_token");
  }
  return null;
}

export function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

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
      ...getAuthHeader(),
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
      // Clear expired session and redirect with next param
      localStorage.removeItem("veercare_token");
      localStorage.removeItem("veercare_user");
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
  getSummary: (): Promise<SummaryResponse> => fetchJson<SummaryResponse>("/api/summary"),

  getWatchlist: (params?: {
    month?: string;
    limit?: number;
    zone?: string;
    trend?: string;
    tier?: string;
    band?: string;
    unit?: string;
    flagged_only?: boolean;
    alert_only?: boolean;
    min_risk?: number;
  }): Promise<WatchlistResponse> => {
    const q = new URLSearchParams();
    if (params?.month) q.set("month", params.month);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.zone) q.set("zone", params.zone);
    if (params?.trend) q.set("trend", params.trend);
    if (params?.tier) q.set("tier", params.tier);
    if (params?.band) q.set("band", params.band);
    if (params?.unit) q.set("unit", params.unit);
    if (params?.flagged_only) q.set("flagged_only", "true");
    if (params?.alert_only) q.set("alert_only", "true");
    if (params?.min_risk !== undefined) q.set("min_risk", String(params.min_risk));

    const qs = q.toString();
    return fetchJson<WatchlistResponse>(`/api/watchlist${qs ? `?${qs}` : ""}`);
  },

  getWall: (unit?: string): Promise<WallResponse> => {
    const qs = unit ? `?unit=${encodeURIComponent(unit)}` : "";
    return fetchJson<WallResponse>(`/api/wall${qs}`);
  },

  getPersonnel: (id: string): Promise<PersonnelDetailResponse> =>
    fetchJson<PersonnelDetailResponse>(`/api/personnel/${id}`),

  getRoster: (id: string): Promise<RosterResponse> =>
    fetchJson<RosterResponse>(`/api/personnel/${id}/roster`),

  getTelemetry: (id: string): Promise<TelemetryResponse> =>
    fetchJson<TelemetryResponse>(`/api/personnel/${id}/telemetry`),

  getDrivers: (id: string): Promise<DriversResponse> =>
    fetchJson<DriversResponse>(`/api/personnel/${id}/drivers`),

  getStrainBreakdown: (id: string): Promise<StrainBreakdownResponse> =>
    fetchJson<StrainBreakdownResponse>(`/api/personnel/${id}/strain-breakdown`),

  getHistory: (id: string): Promise<HistoryResponse> =>
    fetchJson<HistoryResponse>(`/api/personnel/${id}/history`),

  getInterventions: (): Promise<InterventionsResponse> =>
    fetchJson<InterventionsResponse>("/api/interventions"),

  createIntervention: (req: CreateInterventionRequest): Promise<InterventionRecord> =>
    fetchJson<InterventionRecord>("/api/interventions", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  getMetrics: (): Promise<MetricsResponse> => fetchJson<MetricsResponse>("/api/model/metrics"),

  getUnits: (): Promise<{ units: string[] }> => fetchJson<{ units: string[] }>("/api/units"),

  getCaseNotes: (): Promise<CaseNote[]> => fetchJson<CaseNote[]>("/api/case-notes"),

  submitSituationalAssessment: (
    req: SituationalAssessmentRequest
  ): Promise<SituationalAssessmentResponse> =>
    fetchJson<SituationalAssessmentResponse>(
      `/api/personnel/${req.personnel_id}/situational-assessment`,
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    ),

  getSituationalAssessments: (
    id: string
  ): Promise<{ personnel_id: string; assessments: SituationalAssessmentResponse[] }> =>
    fetchJson<{ personnel_id: string; assessments: SituationalAssessmentResponse[] }>(
      `/api/personnel/${id}/situational-assessment`
    ),

  login: async (personnel_id: string, password: string): Promise<LoginResponse> => {
    const rawRes = await fetchJson<{
      message: string;
      user: {
        id: number;
        supabase_user_id?: string | null;
        personnel_id: string;
        first_name: string;
        last_name?: string | null;
        email: string;
        role: string;
        unit_id?: number | null;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ personnel_id, password }),
    });

    const userObj = rawRes.user;
    
    // Map backend user role to UI role expectation
    let mappedRole: AuthUser["role"] = "admin";
    if (userObj.role === "soldier") mappedRole = "personnel";
    else if (userObj.role === "commander") mappedRole = "commander";
    else if (userObj.role === "welfare_officer" || userObj.role === "welfare") mappedRole = "welfare";
    else if (userObj.role === "hr_officer" || userObj.role === "admin") mappedRole = "admin";

    const authUser: AuthUser = {
      user_id: String(userObj.id),
      name: `${userObj.first_name} ${userObj.last_name || ""}`.trim(),
      role: mappedRole,
      rank: userObj.role === "soldier" ? "Constable" : (userObj.role === "commander" ? "Commander" : "Officer"),
      unit_id: userObj.unit_id ? String(userObj.unit_id) : "U012",
      personnel_id: userObj.personnel_id,
    };

    return {
      token: `token-user-${userObj.id}`,
      user: authUser,
    };
  },

  // Offline-first session restore: the login response is persisted to
  // localStorage, so we rehydrate from there instead of calling the backend.
  // (No /api/auth/me endpoint exists; the demo must work with no network.)
  getMe: (): Promise<AuthUser> => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("veercare_user") : null;
    if (raw) {
      try {
        return Promise.resolve(JSON.parse(raw) as AuthUser);
      } catch {
        // fall through
      }
    }
    return Promise.reject(new ApiError(401, "/api/auth/me", "No stored session"));
  },

  logout: async (): Promise<{ message: string }> => {
    return { message: "Logged out successfully" };
  },
};
