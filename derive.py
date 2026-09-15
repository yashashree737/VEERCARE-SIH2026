"""
derive.py - Feature Derivation Engine for VeerCare Backend

This module computes and derives all calculated ML parameters required by the VeerCare machine learning models
from raw, non-encoded HR records and user-reported vitals/logs.
"""

from typing import Dict, Any, List, Optional
import math


def derive_sleep_metrics(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Derives sleep debt, sleep timing variability, fatigue score, and recovery score."""
    sleep_hours = float(raw.get("sleep_duration_hours", 7.0) or 7.0)
    baseline_sleep = float(raw.get("baseline_sleep_hours", 7.5) or 7.5)
    sleep_min = float(raw.get("sleep_min_hours", sleep_hours - 1.0) or (sleep_hours - 1.0))
    hrv = float(raw.get("hrv_ms", 55.0) or 55.0)
    rhr = float(raw.get("resting_heart_rate", 65.0) or 65.0)
    sleep_quality = float(raw.get("sleep_quality_score", 7.0) or 7.0)
    duty_hours = float(raw.get("duty_hours", 40.0) or 40.0)
    night_shifts = int(raw.get("night_shift_count", 0) or 0)

    # 1. 7-day Sleep Debt (hours deficit per week)
    sleep_debt_7d = max(0.0, round((baseline_sleep - sleep_hours) * 7.0, 2))

    # 2. Max consecutive nights below 5 hours
    max_consec_nights_below_5h = int(raw.get("max_consec_nights_below_5h", 0) or (1 if sleep_hours < 5.0 else 0))

    # 3. Sleep timing variability (variance in onset time)
    sleep_onset = float(raw.get("sleep_onset_time", 23.0) or 23.0)
    sleep_timing_variability_7d = float(raw.get("sleep_timing_variability_7d", 1.2) or 1.2)

    # 4. Fatigue Score (0 - 10 scale derived from sleep debt, duty hours, night shifts, and HRV)
    hrv_penalty = max(0.0, (60.0 - hrv) / 10.0)
    fatigue_score = min(10.0, round(
        (sleep_debt_7d / 10.0) * 3.0 +
        (duty_hours / 50.0) * 3.0 +
        (night_shifts / 4.0) * 2.0 +
        hrv_penalty,
        2
    ))

    # 5. Recovery Score (0 - 10 scale derived from sleep hours, sleep quality, and HRV)
    recovery_score = min(10.0, max(0.0, round(
        (sleep_hours / 8.0) * 4.0 +
        (sleep_quality / 10.0) * 4.0 +
        (hrv / 70.0) * 2.0,
        2
    )))

    return {
        "sleep_debt_7d": raw.get("sleep_debt_7d", sleep_debt_7d),
        "max_consec_nights_below_5h": max_consec_nights_below_5h,
        "sleep_timing_variability_7d": sleep_timing_variability_7d,
        "fatigue_score": raw.get("fatigue_score", fatigue_score),
        "recovery_score": raw.get("recovery_score", recovery_score),
        "sleep_min_hours": sleep_min,
        "sleep_quality_score": sleep_quality,
        "sleep_onset_time": sleep_onset,
    }


def derive_duty_metrics(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Derives operational workload score, quick turnarounds, and cumulative strain load."""
    duty_hours = float(raw.get("duty_hours", 40.0) or 40.0)
    duty_days = int(raw.get("duty_days", 5) or 5)
    night_shifts = int(raw.get("night_shift_count", 0) or 0)
    overtime_hours = float(raw.get("overtime_hours", 0.0) or 0.0)
    high_risk_duty = int(raw.get("high_risk_duty_count", 0) or 0)
    rest_interval = float(raw.get("rest_interval_hours", 12.0) or 12.0)

    # 1. Quick turnaround count (rest interval < 8 hours)
    quick_turnaround_count = int(raw.get("quick_turnaround_count", 0) or (1 if rest_interval < 8.0 else 0))

    # 2. Workload Score (0 - 100 index)
    workload_score = round(min(100.0, (
        (duty_hours / 60.0) * 45.0 +
        (overtime_hours / 15.0) * 20.0 +
        (night_shifts / 5.0) * 20.0 +
        (high_risk_duty / 3.0) * 15.0
    )), 2)

    # 3. Cumulative Strain Load
    consec_duty = int(raw.get("max_consec_duty_days", duty_days) or duty_days)
    cumulative_strain_load = round(float(raw.get("cumulative_strain_load", workload_score * (consec_duty / 5.0)) or (workload_score * (consec_duty / 5.0))), 2)

    return {
        "quick_turnaround_count": quick_turnaround_count,
        "workload_score": raw.get("workload_score", workload_score),
        "cumulative_strain_load": cumulative_strain_load,
    }


def derive_leave_metrics(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Derives leave rejection rates, days since last leave, and consecutive rejections."""
    apps = int(raw.get("leave_applications", 0) or 0)
    granted = int(raw.get("leave_granted", 0) or 0)
    rejected = int(raw.get("leave_rejected", 0) or 0)

    # Rejection rate 90-day window (0.0 to 1.0)
    if apps > 0:
        rejection_rate = round(rejected / float(apps), 3)
    else:
        rejection_rate = float(raw.get("rejection_rate_90d", 0.0) or 0.0)

    consecutive_rejections = int(raw.get("consecutive_leave_rejections", rejected) or rejected)
    days_since_leave = int(raw.get("days_since_last_leave", 30) or 30)
    days_since_home_leave = int(raw.get("days_since_last_home_leave", days_since_leave + 30) or (days_since_leave + 30))
    days_since_granted = int(raw.get("days_since_last_granted", days_since_leave) or days_since_leave)

    return {
        "rejection_rate_90d": raw.get("rejection_rate_90d", rejection_rate),
        "consecutive_leave_rejections": consecutive_rejections,
        "days_since_last_leave": days_since_leave,
        "days_since_last_home_leave": days_since_home_leave,
        "days_since_last_granted": days_since_granted,
    }


def derive_pvt_cognitive_metrics(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Derives standardized PVT z-scores (speed z & lapses z)."""
    pvt_lapses = float(raw.get("pvt_lapses", 2.0) or 2.0)
    baseline_lapses = float(raw.get("baseline_pvt_lapses", 2.0) or 2.0)
    pvt_speed = float(raw.get("pvt_response_speed", 3.8) or 3.8)
    baseline_speed = float(raw.get("baseline_pvt_response_speed", 3.8) or 3.8)

    # Lapses Z score
    lapses_z = round(float(raw.get("pvt_lapses_z", pvt_lapses - baseline_lapses) or (pvt_lapses - baseline_lapses)), 3)
    # Speed Z score
    speed_z = round(float(raw.get("pvt_speed_z", pvt_speed - baseline_speed) or (pvt_speed - baseline_speed)), 3)

    return {
        "pvt_lapses_z": lapses_z,
        "pvt_speed_z": speed_z,
        "baseline_pvt_lapses": baseline_lapses,
        "baseline_pvt_response_speed": baseline_speed,
        "pvt_trials": int(raw.get("pvt_trials", 60) or 60),
        "pvt_mean_rt_ms": float(raw.get("pvt_mean_rt_ms", 260.0) or 260.0),
        "pvt_false_starts": float(raw.get("pvt_false_starts", 0.0) or 0.0),
        "pvt_fastest10_rt_ms": float(raw.get("pvt_fastest10_rt_ms", 200.0) or 200.0),
        "pvt_slowest10_rt_ms": float(raw.get("pvt_slowest10_rt_ms", 350.0) or 350.0),
        "cognitive_test_completed": int(raw.get("cognitive_test_completed", 1) or 1),
    }


def derive_strain_baselines_and_trends(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Derives baseline metrics, strain delta, strain z-score, and trend flag."""
    duty_hours = float(raw.get("duty_hours", 40.0) or 40.0)
    sleep_hours = float(raw.get("sleep_duration_hours", 7.0) or 7.0)

    baseline_duty = float(raw.get("baseline_duty_hours", 42.0) or 42.0)
    baseline_sleep = float(raw.get("baseline_sleep_hours", 7.5) or 7.5)
    baseline_strain_mean = float(raw.get("baseline_strain_mean", 35.0) or 35.0)
    baseline_strain_sd = float(raw.get("baseline_strain_sd", 10.0) or 10.0)

    # Estimate current unencoded strain score preview
    current_est_strain = float(raw.get("cumulative_strain_load", 35.0) or 35.0)
    strain_delta = round(float(raw.get("strain_delta_from_baseline", current_est_strain - baseline_strain_mean) or (current_est_strain - baseline_strain_mean)), 2)
    strain_z = round(float(raw.get("strain_z_from_baseline", strain_delta / max(1.0, baseline_strain_sd)) or (strain_delta / max(1.0, baseline_strain_sd))), 3)

    strain_trend_3w = float(raw.get("strain_trend_3w", strain_delta) or strain_delta)

    # Trend flag: Improving, Stable, Rising
    if "trend_flag" in raw and raw["trend_flag"]:
        trend_flag = raw["trend_flag"]
    else:
        if strain_trend_3w < -2.0:
            trend_flag = "Improving"
        elif strain_trend_3w > 2.0:
            trend_flag = "Rising"
        else:
            trend_flag = "Stable"

    return {
        "baseline_duty_hours": baseline_duty,
        "baseline_sleep_hours": baseline_sleep,
        "baseline_strain_mean": baseline_strain_mean,
        "baseline_strain_sd": baseline_strain_sd,
        "strain_delta_from_baseline": strain_delta,
        "strain_z_from_baseline": strain_z,
        "strain_trend_3w": strain_trend_3w,
        "trend_flag": trend_flag,
        "baseline_alert_flag": int(raw.get("baseline_alert_flag", 1 if abs(strain_z) > 1.5 else 0) or 0),
    }


def derive_personnel_ml_features(raw_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main Entry Point: Accepts raw non-encoded HR data + User-reported vitals/logs dictionary.
    Computes and populates all derived ML parameters required by dataset2.csv / ML models.

    Returns:
        Dict[str, Any]: Complete non-encoded record containing both direct raw HR fields and all derived parameters.
    """
    record = dict(raw_record)

    # Merge derived dictionary blocks
    record.update(derive_sleep_metrics(record))
    record.update(derive_duty_metrics(record))
    record.update(derive_leave_metrics(record))
    record.update(derive_pvt_cognitive_metrics(record))
    record.update(derive_strain_baselines_and_trends(record))

    # Ensure standard non-encoded defaults for categorical & consent fields if missing
    defaults = {
        "rank": "Constable",
        "service_years": 5,
        "age_band": "26-30",
        "accommodation_type": "Unit Lines",
        "deployment_zone": "Peace Station",
        "hardship_category": "D",
        "days_deployed": 0,
        "days_in_hardship_A": 0,
        "zone_changes": 0,
        "distance_from_parent_unit_km": 50,
        "rotation_notice_days": 30,
        "posting_duration_days": 180,
        "transfers_12m": 0,
        "critical_incidents_12m": 0,
        "who5_score": 15,
        "who5_assessment_due": 0,
        "who5_response_status": "Responded",
        "sick_report_days": 0,
        "unplanned_absence_days": 0,
        "late_reporting_days": 0,
        "grievances_raised": 0,
        "safety_lapses": 0,
        "disciplinary_incidents": 0,
        "support_request": 0,
        "days_since_last_intervention": 999,
        "interventions_90d": 0,
        "last_intervention_effective": 0,
        "critical_incident_this_week": 0,
        "days_since_critical_incident": 999,
        "welfare_record_access": "Standard",
        "device_consent_status": "Consented",
        "self_report_consent": "Consented",
    }

    for key, val in defaults.items():
        if key not in record or record[key] is None:
            record[key] = val

    return record
