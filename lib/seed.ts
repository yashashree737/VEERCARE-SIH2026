/**
 * Seed & Mock Data Module for VeerCare Frontend.
 * Allows the frontend to run 100% standalone and offline without requiring
 * an active FastAPI backend server.
 */

import {
  SummaryResponse,
  WatchlistResponse,
  WatchlistItem,
  WallResponse,
  WallCard,
  PersonnelDetailResponse,
  PersonnelProfile,
  MonthlyRecord,
  RosterResponse,
  RosterRow,
  TelemetryResponse,
  TelemetryRow,
  DriversResponse,
  DriverItem,
  StrainBreakdownResponse,
  HistoryResponse,
  HistoryItem,
  InterventionsResponse,
  InterventionRecord,
  CreateInterventionRequest,
  MetricsResponse,
  CaseNote,
  SituationalAssessmentRequest,
  SituationalAssessmentResponse,
  AuthUser,
  LoginResponse,
} from "./types";

const MOCK_MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

// Demo accounts database
export const MOCK_USERS: Record<string, AuthUser> = {
  P1001: {
    user_id: "1",
    name: "Rajesh Kumar",
    role: "personnel",
    rank: "Constable",
    unit_id: "12th Battalion CRPF",
    personnel_id: "P1001",
  },
  P0013: {
    user_id: "13",
    name: "Vikram Singh",
    role: "personnel",
    rank: "Head Constable",
    unit_id: "12th Battalion CRPF",
    personnel_id: "P0013",
  },
  P0024: {
    user_id: "24",
    name: "Amit Sharma",
    role: "personnel",
    rank: "Constable",
    unit_id: "15th Battalion CRPF",
    personnel_id: "P0024",
  },
  C1001: {
    user_id: "2",
    name: "Cmdr. Vikram Rathore",
    role: "commander",
    rank: "Commandant",
    unit_id: "12th Battalion CRPF",
    personnel_id: "C1001",
  },
  "CDR-U012": {
    user_id: "12",
    name: "Cmdr. Rajesh Guard",
    role: "commander",
    rank: "Commandant",
    unit_id: "12th Battalion CRPF",
    personnel_id: "CDR-U012",
  },
  W1001: {
    user_id: "3",
    name: "Anita Deshmukh",
    role: "welfare",
    rank: "Welfare Officer",
    unit_id: "12th Battalion CRPF",
    personnel_id: "W1001",
  },
  "WO-DELHI": {
    user_id: "33",
    name: "Welfare Officer Delhi",
    role: "welfare",
    rank: "Senior Welfare Officer",
    unit_id: "HQ Alpha",
    personnel_id: "WO-DELHI",
  },
  "HR-001": {
    user_id: "4",
    name: "Suresh Verma",
    role: "admin",
    rank: "HR Director",
    unit_id: "HQ Alpha",
    personnel_id: "HR-001",
  },
  "PROTOTYPE-ADMIN": {
    user_id: "99",
    name: "System Admin",
    role: "admin",
    rank: "System Administrator",
    unit_id: "HQ Alpha",
    personnel_id: "PROTOTYPE-ADMIN",
  },
};

// Local in-memory interventions list
let localInterventions: InterventionRecord[] = [
  {
    intervention_id: "INT-101",
    personnel_id: "P0013",
    action_date: "2026-09-05",
    trigger_strain: 74.2,
    trigger_z: 2.3,
    intervention_type: "Priority Leave Grant",
    initiated_by: "Welfare Officer",
    follow_up_date: "2026-09-20",
    strain_change_30d: -8.5,
    outcome_effective: 1,
    notes: "Granted 14 days mandatory home leave for family recovery.",
  },
  {
    intervention_id: "INT-102",
    personnel_id: "P1001",
    action_date: "2026-09-08",
    trigger_strain: 68.5,
    trigger_z: 1.9,
    intervention_type: "Peer Buddy Assignment",
    initiated_by: "AI System Alert",
    follow_up_date: "2026-09-22",
    strain_change_30d: null,
    outcome_effective: null,
    notes: "Paired with senior buddy for night picket rotation support.",
  },
  {
    intervention_id: "INT-103",
    personnel_id: "P0024",
    action_date: "2026-08-28",
    trigger_strain: 61.0,
    trigger_z: 1.6,
    intervention_type: "Counselling Referral",
    initiated_by: "Welfare Officer",
    follow_up_date: "2026-09-12",
    strain_change_30d: -5.2,
    outcome_effective: 1,
    notes: "Completed 2 sessions with unit psychological counselor.",
  },
];

export const seedApi = {
  getSummary: async (): Promise<SummaryResponse> => {
    return {
      current_month: "2026-09",
      personnel_monitored: 142,
      cohort_size: 142,
      baseline_alerts_active: 12,
      of_concern: 28,
      incidents_last_month: 3,
      interventions_this_month: localInterventions.length,
      model_version: "veercare-strain-v1.2-standalone",
      is_stub: false,
      strain_distribution: [
        { band: "Low", count: 82, pct: 57.7 },
        { band: "Moderate", count: 32, pct: 22.5 },
        { band: "High", count: 20, pct: 14.1 },
        { band: "Severe", count: 8, pct: 5.6 },
      ],
    };
  },

  getWatchlist: async (params?: any): Promise<WatchlistResponse> => {
    const items: WatchlistItem[] = [
      {
        personnel_id: "P0013",
        monitoring_tier: "Daily Telemetry Cohort",
        rank: "Head Constable",
        deployment_zone: "High Altitude Area",
        strain_index: 74.5,
        strain_band: "Severe",
        strain_z_from_baseline: 2.45,
        baseline_alert_flag: 1,
        trend_flag: "Rising",
        risk_probability: 0.82,
        risk_band: "Critical",
        intervention_recommended: "Priority Leave Grant",
        record_restricted: false,
      },
      {
        personnel_id: "P1001",
        monitoring_tier: "Monthly HR Reporting",
        rank: "Constable",
        deployment_zone: "Counter Insurgency Zone",
        strain_index: 68.2,
        strain_band: "High",
        strain_z_from_baseline: 1.88,
        baseline_alert_flag: 1,
        trend_flag: "Rising",
        risk_probability: 0.69,
        risk_band: "High",
        intervention_recommended: "Peer Buddy Assignment",
        record_restricted: false,
      },
      {
        personnel_id: "P0024",
        monitoring_tier: "Daily Telemetry Cohort",
        rank: "Constable",
        deployment_zone: "Field Area",
        strain_index: 61.4,
        strain_band: "High",
        strain_z_from_baseline: 1.52,
        baseline_alert_flag: 1,
        trend_flag: "Stable",
        risk_probability: 0.54,
        risk_band: "High",
        intervention_recommended: "Workload Rebalancing",
        record_restricted: false,
      },
      {
        personnel_id: "P0048",
        monitoring_tier: "Monthly HR Reporting",
        rank: "Sub Inspector",
        deployment_zone: "Border Forward Post",
        strain_index: 58.0,
        strain_band: "High",
        strain_z_from_baseline: 1.35,
        baseline_alert_flag: 1,
        trend_flag: "Rising",
        risk_probability: 0.48,
        risk_band: "Moderate",
        intervention_recommended: "Counselling Referral",
        record_restricted: true,
      },
      {
        personnel_id: "P0092",
        monitoring_tier: "Monthly HR Reporting",
        rank: "Constable",
        deployment_zone: "Semi-Urban Deployment",
        strain_index: 47.3,
        strain_band: "Moderate",
        strain_z_from_baseline: 0.82,
        baseline_alert_flag: 0,
        trend_flag: "Improving",
        risk_probability: 0.28,
        risk_band: "Moderate",
        intervention_recommended: "No Action",
        record_restricted: false,
      },
    ];

    let filtered = items;
    if (params?.band) {
      filtered = filtered.filter((i) => i.strain_band.toLowerCase() === params.band.toLowerCase());
    }
    if (params?.flagged_only || params?.alert_only) {
      filtered = filtered.filter((i) => i.baseline_alert_flag === 1);
    }
    if (params?.min_risk !== undefined) {
      filtered = filtered.filter((i) => i.risk_probability >= params.min_risk);
    }

    return {
      count: filtered.length,
      results: filtered,
    };
  },

  getWall: async (unit?: string): Promise<WallResponse> => {
    const cards: WallCard[] = [
      {
        personnel_id: "P0013",
        rank: "Head Constable",
        record_restricted: false,
        current_strain_band: "Severe",
        current_strain_index: 74.5,
        current_z: 2.45,
        baseline_alert_flag: 1,
        trend_flag: "Rising",
        risk_probability: 0.82,
        duty_hours_current_month: 248,
        personal_baseline_mean: 48.5,
        personal_baseline_sd: 6.2,
        series: [
          { year_month: "2026-04", strain_index: 46.2, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-05", strain_index: 52.0, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-06", strain_index: 58.4, strain_band: "High", baseline_alert_flag: 0 },
          { year_month: "2026-07", strain_index: 64.1, strain_band: "High", baseline_alert_flag: 1 },
          { year_month: "2026-08", strain_index: 69.8, strain_band: "High", baseline_alert_flag: 1 },
          { year_month: "2026-09", strain_index: 74.5, strain_band: "Severe", baseline_alert_flag: 1 },
        ],
      },
      {
        personnel_id: "P1001",
        rank: "Constable",
        record_restricted: false,
        current_strain_band: "High",
        current_strain_index: 68.2,
        current_z: 1.88,
        baseline_alert_flag: 1,
        trend_flag: "Rising",
        risk_probability: 0.69,
        duty_hours_current_month: 236,
        personal_baseline_mean: 45.0,
        personal_baseline_sd: 5.8,
        series: [
          { year_month: "2026-04", strain_index: 42.0, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-05", strain_index: 44.5, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-06", strain_index: 49.0, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-07", strain_index: 56.2, strain_band: "High", baseline_alert_flag: 0 },
          { year_month: "2026-08", strain_index: 62.1, strain_band: "High", baseline_alert_flag: 1 },
          { year_month: "2026-09", strain_index: 68.2, strain_band: "High", baseline_alert_flag: 1 },
        ],
      },
      {
        personnel_id: "P0024",
        rank: "Constable",
        record_restricted: false,
        current_strain_band: "High",
        current_strain_index: 61.4,
        current_z: 1.52,
        baseline_alert_flag: 1,
        trend_flag: "Stable",
        risk_probability: 0.54,
        duty_hours_current_month: 220,
        personal_baseline_mean: 46.0,
        personal_baseline_sd: 6.0,
        series: [
          { year_month: "2026-04", strain_index: 48.0, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-05", strain_index: 50.1, strain_band: "Moderate", baseline_alert_flag: 0 },
          { year_month: "2026-06", strain_index: 55.4, strain_band: "High", baseline_alert_flag: 0 },
          { year_month: "2026-07", strain_index: 60.2, strain_band: "High", baseline_alert_flag: 1 },
          { year_month: "2026-08", strain_index: 61.0, strain_band: "High", baseline_alert_flag: 1 },
          { year_month: "2026-09", strain_index: 61.4, strain_band: "High", baseline_alert_flag: 1 },
        ],
      },
    ];

    return {
      count: cards.length,
      results: cards,
    };
  },

  getPersonnel: async (id: string): Promise<PersonnelDetailResponse> => {
    const isP0013 = id === "P0013";
    const strainVal = isP0013 ? 74.5 : 68.2;
    const bandVal = isP0013 ? "Severe" : "High";

    const profile: PersonnelProfile = {
      personnel_id: id,
      monitoring_tier: "Daily Telemetry Cohort",
      force_branch: "CRPF",
      rank: isP0013 ? "Head Constable" : "Constable",
      seniority_level: "Senior",
      home_unit_id: "12th Battalion CRPF",
      years_of_service: 6,
      education_level: "Higher Secondary",
      accommodation_type: "Barracks",
      physical_efficiency_test_score: 82,
      physical_efficiency_test_date: "2026-05-10",
      welfare_record_access: "Standard",
      device_consent_status: "Enrolled",
      demo_featured: "true",
    };

    const series: MonthlyRecord[] = MOCK_MONTHS.map((ym, idx) => ({
      personnel_id: id,
      monitoring_tier: "Daily Telemetry Cohort",
      year_month: ym,
      month_index: idx,
      rank: profile.rank,
      deployment_zone: "High Altitude Area",
      hardship_category: "A",
      days_in_month: 30,
      total_duty_hours: 220 + idx * 5,
      avg_duty_hours_per_week: 55 + idx,
      duty_days: 25,
      rest_days: 5,
      night_duty_count: 6 + idx,
      high_risk_duty_count: 4,
      overtime_hours: 18 + idx * 2,
      max_consecutive_duty_days: 12 + idx,
      avg_rest_hours: 8.5,
      zone_changes_in_month: 1,
      days_in_hardship_A: 25,
      leave_days_taken: 0,
      leave_applications: 1,
      leave_rejections: 0,
      emergency_leave_applications: 0,
      days_since_last_leave_eom: 110 + idx * 30,
      days_since_last_home_leave_eom: 120 + idx * 30,
      sick_report_days: 0,
      unplanned_absence_days: 0,
      late_reporting_days: 0,
      grievances_raised: 0,
      safety_lapses: 0,
      disciplinary_incidents: 0,
      welfare_record_access: "Standard",
      strain_index: Math.min(85, 45 + idx * 5.5),
      strain_band: idx > 4 ? bandVal : idx > 2 ? "High" : "Moderate",
      personal_baseline_mean: 46.0,
      personal_baseline_sd: 6.0,
      strain_delta_from_baseline: idx * 5.5,
      strain_z_from_baseline: Number((idx * 0.4).toFixed(2)),
      baseline_alert_flag: idx >= 4 ? 1 : 0,
      is_baseline_window: idx < 3 ? 1 : 0,
      strain_trend_3m: 3.2,
      trend_flag: "Rising",
      welfare_incident_next_month: idx === 5 ? 1 : null,
      strain_index_next_month: idx === 5 ? strainVal + 2.5 : null,
      intervention_recommended: "Priority Leave Grant",
      risk_probability: 0.78,
      risk_band: "High",
      model_version: "veercare-strain-v1.2-standalone",
    }));

    return {
      profile,
      monitoring_tier: "Daily Telemetry Cohort",
      record_restricted: false,
      baseline: { mean: 46.0, sd: 6.0, window: MOCK_MONTHS.slice(0, 3) },
      series,
      current: series[series.length - 1],
      projected_next: { year_month: "2026-10", strain_index: strainVal + 2.5 },
    };
  },

  getRoster: async (id: string): Promise<RosterResponse> => {
    const rows: RosterRow[] = Array.from({ length: 14 }).map((_, i) => ({
      roster_id: `ROS-${id}-${100 + i}`,
      personnel_id: id,
      duty_date: `2026-09-${String(i + 1).padStart(2, "0")}`,
      day_of_week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7],
      year_month: "2026-09",
      deployment_id: "DEP-12",
      deployment_zone: "High Altitude Area",
      hardship_category: "A",
      duty_type: i % 6 === 5 ? "Rest Day" : i % 3 === 0 ? "Night Picket" : "Area Patrol",
      hours_worked: i % 6 === 5 ? 0 : 8,
      overtime_hours: i % 4 === 0 ? 2 : 0,
      is_night_duty: i % 3 === 0 ? 1 : 0,
      is_high_risk_duty: i % 5 === 0 ? 1 : 0,
      is_rest_day: i % 6 === 5 ? 1 : 0,
      is_leave_day: 0,
      leave_type_if_any: null,
      is_sick_report: 0,
      consecutive_duty_days: i + 1,
      rest_hours_before_next_duty: i % 6 === 5 ? 24 : 8,
      days_since_last_leave: 140 + i,
      days_since_home_visit: 152 + i,
    }));

    return {
      tier: "Daily Telemetry Cohort",
      daily_available: true,
      rows,
    };
  },

  getTelemetry: async (id: string): Promise<TelemetryResponse> => {
    const rows: TelemetryRow[] = Array.from({ length: 14 }).map((_, i) => ({
      record_id: `TEL-${id}-${200 + i}`,
      personnel_id: id,
      record_date: `2026-09-${String(i + 1).padStart(2, "0")}`,
      year_month: "2026-09",
      sleep_hours: Number((4.5 + (i % 3) * 0.4).toFixed(1)),
      sleep_interruptions: 2 + (i % 3),
      resting_heart_rate: 72 + (i % 5),
      hrv_ms: 42 - (i % 4),
      step_count: 8500 + i * 200,
      device_consent_status: "Enrolled",
    }));

    return {
      tier: "Daily Telemetry Cohort",
      telemetry_available: true,
      rows,
    };
  },

  getDrivers: async (id: string): Promise<DriversResponse> => {
    const drivers: DriverItem[] = [
      {
        rank_order: 1,
        feature: "max_consecutive_duty_days",
        display_label: "Consecutive Days Without Rest",
        current_value: 14,
        personal_baseline: 6,
        unit: "days",
        deviation_z: 2.35,
        contribution: 0.38,
        direction: "worsening",
      },
      {
        rank_order: 2,
        feature: "days_since_home_leave",
        display_label: "Days Since Last Home Leave",
        current_value: 152,
        personal_baseline: 90,
        unit: "days",
        deviation_z: 1.92,
        contribution: 0.29,
        direction: "worsening",
      },
      {
        rank_order: 3,
        feature: "night_duty_count",
        display_label: "Night Picket Duty Frequency",
        current_value: 8,
        personal_baseline: 3,
        unit: "shifts/mo",
        deviation_z: 1.45,
        contribution: 0.18,
        direction: "worsening",
      },
      {
        rank_order: 4,
        feature: "sleep_hours",
        display_label: "Short Sleep Duration (<5h)",
        current_value: 4.2,
        personal_baseline: 7.0,
        unit: "hrs/night",
        deviation_z: -1.65,
        contribution: 0.15,
        direction: "worsening",
      },
    ];

    return {
      personnel_id: id,
      record_restricted: false,
      drivers,
    };
  },

  getStrainBreakdown: async (id: string): Promise<StrainBreakdownResponse> => {
    return {
      personnel_id: id,
      year_month: "2026-09",
      base: 30.0,
      stored_strain_index: 74.5,
      computed_strain_index: 74.5,
      terms: [
        {
          field: "consecutive_duty_days",
          label: "Consecutive Duty Days",
          direction: "add",
          value: 14,
          reference: 7,
          points_per_unit_above: 2.5,
          points: 17.5,
          cap: 20,
          is_capped: false,
        },
        {
          field: "night_duty_count",
          label: "Night Picket Duty",
          direction: "add",
          value: 8,
          reference: 3,
          points_per_unit_above: 3.0,
          points: 15.0,
          cap: 18,
          is_capped: false,
        },
        {
          field: "days_since_home_leave",
          label: "Days Since Home Leave",
          direction: "add",
          value: 152,
          reference: 90,
          points_per_unit_above: 0.2,
          points: 12.4,
          cap: 15,
          is_capped: false,
        },
      ],
    };
  },

  getHistory: async (id: string): Promise<HistoryResponse> => {
    const history: HistoryItem[] = [
      {
        kind: "intervention",
        date: "2026-09-05",
        title: "Intervention: Priority Leave Grant",
        detail: "Approved 14 days emergency home leave by Welfare Officer.",
        data: { status: "Active", type: "Priority Leave Grant" },
      },
      {
        kind: "incident",
        date: "2026-08-14",
        title: "Administrative Record: Sick Report",
        detail: "Logged 24h fatigue sick report after extended night picket duty.",
        data: { severity: "Minor", category: "Medical" },
      },
    ];

    return {
      personnel_id: id,
      record_restricted: false,
      history,
    };
  },

  getInterventions: async (): Promise<InterventionsResponse> => {
    return {
      count: localInterventions.length,
      headline_effectiveness: 0.85,
      results: [...localInterventions],
    };
  },

  createIntervention: async (req: CreateInterventionRequest): Promise<InterventionRecord> => {
    const newRecord: InterventionRecord = {
      intervention_id: `INT-${Date.now().toString().slice(-4)}`,
      personnel_id: req.personnel_id,
      action_date: new Date().toISOString().split("T")[0],
      trigger_strain: 68.0,
      trigger_z: 1.8,
      intervention_type: req.intervention_type,
      initiated_by: "Welfare Officer",
      follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      strain_change_30d: null,
      outcome_effective: null,
      notes: req.notes || "Assigned via VeerCare Welfare Portal.",
    };

    localInterventions.unshift(newRecord);
    return newRecord;
  },

  getMetrics: async (): Promise<MetricsResponse> => {
    return {
      model_version: "veercare-strain-v1.2-standalone",
      trained_at: "2026-09-01T00:00:00Z",
      force_wide: {
        rows: 852,
        people: 142,
        roc_auc: 0.88,
        precision: 0.74,
        recall: 0.71,
        positive_rate: 0.18,
      },
      cohort: {
        rows: 852,
        people: 142,
        roc_auc: 0.91,
      },
      split: "temporal (train <=2026-06, test >=2026-07)",
      operating_point: {
        threshold: 0.45,
        recall: 0.71,
        precision: 0.74,
      },
      is_stub: false,
    };
  },

  getUnits: async (): Promise<{ units: string[] }> => {
    return {
      units: [
        "12th Battalion CRPF",
        "15th Battalion CRPF",
        "HQ Alpha",
        "7th BSF Regiment",
        "Counter Insurgency Task Unit",
      ],
    };
  },

  getCaseNotes: async (): Promise<CaseNote[]> => {
    return [
      {
        personnel_id: "P0013",
        rank: "Head Constable",
        home_unit_id: "12th Battalion CRPF",
        demo_featured: "true",
        story_headline: "High fatigue cumulative strain after 152 days in High Altitude Area",
        story_narrative:
          "Sustained elevated strain index (74.5) driven by consecutive night picket rotations and denied leave. Intervened with Priority Leave Grant.",
      },
    ];
  },

  submitSituationalAssessment: async (
    req: SituationalAssessmentRequest
  ): Promise<SituationalAssessmentResponse> => {
    return {
      personnel_id: req.personnel_id,
      assessment_id: `SA-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      pointers: {
        openness_score: 0.85,
        situational_coping: 0.78,
        stress_resilience: 0.82,
        peer_connectedness: 0.75,
        fatigue_awareness: 0.88,
        situational_readiness: "Ready with Monitoring",
      },
      ai_feedback:
        "Thank you for sharing your thoughts. Your responses indicate strong resilience but notable operational fatigue. Ensure adequate sleep hydration during duty breaks.",
      recommended_support: "Peer Buddy Support & Workload Rebalancing",
      stress_factors: ["Night Shift Fatigue", "Hardship Posting Duration"],
      reply: "We have recorded your check-in. Your welfare team is here to support you anytime.",
      scenario_title: req.scenario_title || "Routine Situational Check-in",
      soldier_response: req.soldier_response,
    };
  },

  getSituationalAssessments: async (id: string) => {
    return {
      personnel_id: id,
      assessments: [],
    };
  },

  login: async (personnel_id: string, password: string): Promise<LoginResponse> => {
    const key = personnel_id.toUpperCase().trim();
    const user = MOCK_USERS[key] || {
      user_id: "100",
      name: `Officer ${personnel_id}`,
      role: key.startsWith("C") ? "commander" : key.startsWith("W") ? "welfare" : key.startsWith("HR") ? "admin" : "personnel",
      rank: key.startsWith("C") ? "Commandant" : key.startsWith("W") ? "Welfare Officer" : "Constable",
      unit_id: "12th Battalion CRPF",
      personnel_id: personnel_id,
    };

    return {
      token: `standalone-token-${user.user_id}`,
      user,
    };
  },
};
