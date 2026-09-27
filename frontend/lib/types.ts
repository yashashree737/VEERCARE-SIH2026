// CONTRACT.md §4 Enumerations
export type StrainBand = "Low" | "Moderate" | "High" | "Severe";

export type TrendFlag = "Rising" | "Stable" | "Improving";

export type MonitoringTier = "Daily Telemetry Cohort" | "Monthly HR Reporting";

export type RiskBand = "Low" | "Moderate" | "High" | "Critical";

export type HardshipCategory = "A" | "B" | "C" | "D";

export type Rank =
  | "Constable"
  | "Head Constable"
  | "Assistant Sub Inspector"
  | "Sub Inspector"
  | "Inspector"
  | "Assistant Commandant";

export type DeploymentZone =
  | "Peace Station"
  | "Semi-Urban Deployment"
  | "Field Area"
  | "High Altitude Area"
  | "Counter Insurgency Zone"
  | "Border Forward Post"
  | "Disaster Relief Operation";

export type DutyType =
  | "Area Patrol"
  | "Static Guard"
  | "Night Picket"
  | "Checkpoint Duty"
  | "Convoy Escort"
  | "Operations Task"
  | "Training"
  | "Court / Escort Duty"
  | "Administrative Duty"
  | "Rest Day"
  | "On Leave"
  | "Sick Report";

export type LeaveStatus = "Approved" | "Rejected" | "Withdrawn";

export type LeaveType =
  | "Casual Leave"
  | "Earned Leave"
  | "Medical Leave"
  | "Compassionate Leave"
  | "Emergency Leave";

export type InterventionType =
  | "No Action"
  | "Peer Buddy Assignment"
  | "Priority Leave Grant"
  | "Workload Rebalancing"
  | "Unit Medical Referral"
  | "Counselling Referral"
  | "Immediate Welfare Escalation"
  | "Counselling Session"
  | "Family Liaison Support"
  | "Medical Referral";

export type InitiatedBy =
  | "AI System Alert"
  | "Welfare Officer"
  | "Unit Commander"
  | "Self Referral";

// CONTRACT.md §6 API Models

export interface StrainDistributionItem {
  band: StrainBand;
  count: number;
  pct: number;
}

export interface SummaryResponse {
  current_month: string;
  personnel_monitored: number;
  cohort_size: number;
  baseline_alerts_active: number;
  of_concern: number;
  incidents_last_month: number;
  interventions_this_month: number;
  model_version: string;
  is_stub: boolean;
  strain_distribution: StrainDistributionItem[];
}

export interface WatchlistItem {
  personnel_id: string;
  monitoring_tier: string;
  rank: string;
  deployment_zone: string;
  strain_index: number;
  strain_band: StrainBand;
  strain_z_from_baseline: number;
  baseline_alert_flag: number;
  trend_flag: TrendFlag;
  risk_probability: number;
  risk_band: RiskBand;
  intervention_recommended: string;
  record_restricted: boolean;
}

export interface WatchlistResponse {
  count: number;
  results: WatchlistItem[];
}

export interface WallSparklinePoint {
  year_month: string;
  strain_index: number;
  strain_band: StrainBand;
  baseline_alert_flag: number;
}

export interface WallCard {
  personnel_id: string;
  rank: string;
  record_restricted: boolean;
  current_strain_band: StrainBand;
  current_strain_index: number;
  current_z: number;
  baseline_alert_flag: number;
  trend_flag: TrendFlag;
  risk_probability: number;
  duty_hours_current_month: number;
  personal_baseline_mean: number;
  personal_baseline_sd: number;
  series: WallSparklinePoint[];
}

export interface WallResponse {
  count: number;
  results: WallCard[];
}

export interface BaselineInfo {
  mean: number;
  sd: number;
  window: string[];
}

export interface ProjectedNext {
  year_month: string;
  strain_index: number;
}

export interface PersonnelProfile {
  personnel_id: string;
  monitoring_tier: string;
  force_branch: string;
  rank: string;
  seniority_level: string;
  home_unit_id: string;
  years_of_service: number;
  education_level: string;
  accommodation_type: string;
  physical_efficiency_test_score: number;
  physical_efficiency_test_date: string;
  welfare_record_access: string;
  device_consent_status: string;
  demo_featured?: string | null;
}

export interface MonthlyRecord {
  personnel_id: string;
  monitoring_tier: string;
  year_month: string;
  month_index: number;
  rank: string;
  deployment_zone: string;
  hardship_category: string;
  days_in_month: number;
  total_duty_hours: number;
  avg_duty_hours_per_week: number;
  duty_days: number;
  rest_days: number;
  night_duty_count: number;
  high_risk_duty_count: number;
  overtime_hours: number;
  max_consecutive_duty_days: number;
  avg_rest_hours: number;
  zone_changes_in_month: number;
  days_in_hardship_A: number;
  leave_days_taken: number;
  leave_applications: number;
  leave_rejections: number;
  emergency_leave_applications: number;
  days_since_last_leave_eom: number;
  days_since_last_home_leave_eom: number;
  sick_report_days: number;
  unplanned_absence_days: number;
  late_reporting_days: number;
  grievances_raised: number;
  safety_lapses: number;
  disciplinary_incidents: number;
  welfare_record_access: string;
  strain_index: number;
  strain_band: StrainBand;
  personal_baseline_mean: number;
  personal_baseline_sd: number;
  strain_delta_from_baseline: number;
  strain_z_from_baseline: number;
  baseline_alert_flag: number;
  is_baseline_window: number;
  strain_trend_3m: number;
  trend_flag: TrendFlag;
  welfare_incident_next_month: number | null;
  strain_index_next_month: number | null;
  intervention_recommended: string;
  risk_probability: number;
  risk_band: RiskBand;
  model_version: string;
}

export interface PersonnelDetailResponse {
  profile: PersonnelProfile;
  monitoring_tier: string;
  record_restricted: boolean;
  baseline: BaselineInfo;
  series: MonthlyRecord[];
  current: MonthlyRecord;
  projected_next: ProjectedNext;
}

export interface RosterRow {
  roster_id: string;
  personnel_id: string;
  duty_date: string;
  day_of_week: string;
  year_month: string;
  deployment_id: string;
  deployment_zone: string;
  hardship_category: string;
  duty_type: string;
  hours_worked: number;
  overtime_hours: number;
  is_night_duty: number;
  is_high_risk_duty: number;
  is_rest_day: number;
  is_leave_day: number;
  leave_type_if_any: string | null;
  is_sick_report: number;
  consecutive_duty_days: number;
  rest_hours_before_next_duty: number;
  days_since_last_leave: number;
  days_since_home_visit: number;
  is_unplanned_absence?: number;
}

export interface RosterResponse {
  tier: string;
  daily_available: boolean;
  rows: RosterRow[];
}

export interface TelemetryRow {
  record_id: string;
  personnel_id: string;
  record_date: string;
  year_month: string;
  sleep_hours: number;
  sleep_interruptions: number;
  resting_heart_rate: number;
  hrv_ms: number;
  step_count: number;
  device_consent_status: string;
}

export interface TelemetryResponse {
  tier: string;
  telemetry_available: boolean;
  rows: TelemetryRow[];
}

export interface DriverItem {
  rank_order: number;
  feature: string;
  display_label: string;
  current_value: number;
  personal_baseline: number;
  unit: string;
  deviation_z: number;
  contribution: number;
  direction: "worsening" | "improving";
}

export interface DriversResponse {
  personnel_id: string;
  record_restricted: boolean;
  drivers: DriverItem[];
}

export interface StrainBreakdownTerm {
  field: string;
  label: string;
  direction: "add" | "subtract";
  value: number;
  reference: number;
  points_per_unit_above: number;
  points: number;
  cap: number;
  is_capped: boolean;
}

export interface StrainBreakdownResponse {
  personnel_id: string;
  year_month: string;
  base: number;
  stored_strain_index: number;
  computed_strain_index: number;
  terms: StrainBreakdownTerm[];
}

export interface HistoryItem {
  kind: "incident" | "intervention";
  date: string;
  title: string;
  detail: string;
  data: Record<string, string | number | boolean | null>;
}

export interface HistoryResponse {
  personnel_id: string;
  record_restricted: boolean;
  history: HistoryItem[];
}

export interface InterventionRecord {
  intervention_id: string;
  personnel_id: string;
  action_date: string;
  trigger_strain: number | null;
  trigger_z: number | null;
  intervention_type: string;
  initiated_by: string;
  follow_up_date: string | null;
  strain_change_30d: number | null;
  outcome_effective: number | null;
  notes: string | null;
}

export interface InterventionsResponse {
  count: number;
  headline_effectiveness: number;
  results: InterventionRecord[];
}

export interface CreateInterventionRequest {
  personnel_id: string;
  intervention_type: string;
  notes?: string | null;
}

export interface OperatingPoint {
  threshold: number;
  recall: number;
  precision: number;
}

export interface ForceWideMetrics {
  rows: number;
  people: number;
  roc_auc: number;
  precision: number;
  recall: number;
  positive_rate: number;
}

export interface CohortMetrics {
  rows: number;
  people: number;
  roc_auc: number;
}

export interface MetricsResponse {
  model_version: string;
  trained_at: string;
  force_wide: ForceWideMetrics;
  cohort: CohortMetrics;
  split: string;
  operating_point: OperatingPoint;
  is_stub: boolean;
}

export interface CaseNote {
  personnel_id: string;
  rank: string;
  home_unit_id: string;
  demo_featured: string;
  story_headline: string;
  story_narrative: string;
}

export interface SituationalPointers {
  openness_score: number;
  situational_coping: number;
  stress_resilience: number;
  peer_connectedness: number;
  fatigue_awareness: number;
  situational_readiness: string;
}

export interface SituationalAssessmentRequest {
  personnel_id: string;
  scenario_id: string;
  soldier_response: string;
  scenario_title?: string;
  scenario_context?: string;
  openness_indicator?: number;
  coping_indicator?: number;
  fatigue_level_self_report?: number;
  conversation_history?: Array<{ role: "ai" | "soldier" | "user"; text: string }>;
}

export interface SituationalAssessmentResponse {
  personnel_id: string;
  assessment_id: string;
  timestamp: string;
  pointers: SituationalPointers;
  ai_feedback: string;
  recommended_support: string;
  stress_factors?: string[];
  reply?: string;
  scenario_title?: string;
  soldier_response?: string;
}

// Authentication & RBAC types
export interface AuthUser {
  user_id: string;
  name: string;
  role: "welfare" | "commander" | "personnel" | "system" | "admin";
  rank: string;
  unit_id?: string | null;
  personnel_id?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
