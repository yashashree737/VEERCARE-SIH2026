"""
Converter Pipeline: CSV Line to JSON Models to Supabase DB

Processes data2.csv line-by-line, formats row dictionaries into normalized SQLAlchemy models,
and pushes them to Supabase PostgreSQL in high-performance batches (500 rows per batch).
"""

import csv
import os
import sys
import time
from datetime import datetime

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal, db_url
import models
from models import (
    Unit,
    User,
    PersonnelProfile,
    DutyHRLog,
    HealthVitalsLog,
    LeaveRecord,
    WHO5Assessment,
    PVTCognitiveTest,
    MLPrediction,
)
from auth import get_password_hash

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "datasets", "data2.csv"
)

BATCH_SIZE = 500  # Process and commit 500 rows at a time


def _float(val, default=None):
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _int(val, default=None):
    if val is None or val == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def _bool(val, default=False):
    if val is None or val == "":
        return default
    s = str(val).strip().lower()
    return s in ("1", "true", "yes", "t", "y")


def run_converter():
    print(f"=== Starting CSV to Supabase Batch Converter ===", flush=True)
    print(f"Target Database URL: {db_url}", flush=True)
    print(f"Source CSV Path: {CSV_PATH}", flush=True)
    print(f"Batch Size: {BATCH_SIZE} rows per commit\n", flush=True)

    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found!", flush=True)
        return

    # 1. Ensure database schema is present with retries
    print("Verifying/creating database schema in target DB...", flush=True)
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except Exception as e:
            print(f"Connection attempt {attempt}/{max_retries} failed: {e}. Retrying in 5 seconds...", flush=True)
            time.sleep(5)
            if attempt == max_retries:
                raise

    db = SessionLocal()

    # Synchronize PostgreSQL primary key sequences
    if "postgresql" in db_url:
        from sqlalchemy import text
        print("Synchronizing PostgreSQL sequence generators...", flush=True)
        for tbl in ["units", "users", "personnel_profiles", "ml_predictions", "interventions", "duty_hr_logs", "health_vitals_logs", "leave_records", "who5_assessments", "pvt_cognitive_tests"]:
            try:
                db.execute(text(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), COALESCE((SELECT MAX(id) FROM {tbl}), 1), true);"))
                db.commit()
            except Exception:
                db.rollback()

    # Pre-cache existing units, users, and profiles for instant lookups
    print("Pre-caching existing units and users from DB...", flush=True)
    unit_cache = {}
    for u in db.query(Unit).all():
        if u.unit_code:
            unit_cache[u.unit_code] = u.id
        if u.unit_name:
            unit_cache[u.unit_name] = u.id
    user_cache = {u.personnel_id: u.id for u in db.query(User).all()}
    profile_cache = {p.personnel_code: p.id for p in db.query(PersonnelProfile).all()}

    default_pass_hash = get_password_hash("password123")

    def get_or_create_unit(session, unit_code: str) -> int:
        if unit_code in unit_cache:
            return unit_cache[unit_code]
        u_name = f"{unit_code.replace('_', ' ')} Battalion CRPF"
        if u_name in unit_cache:
            return unit_cache[u_name]
        
        existing_any = session.query(Unit).first()
        if existing_any:
            unit_cache[unit_code] = existing_any.id
            return existing_any.id

        new_unit = Unit(unit_code=unit_code, unit_name=u_name, region_zone="Sector Alpha")
        session.add(new_unit)
        session.commit()
        session.refresh(new_unit)
        unit_cache[unit_code] = new_unit.id
        unit_cache[u_name] = new_unit.id
        return new_unit.id

    def get_or_create_personnel_profile(session, personnel_code: str, unit_id: int, row: dict) -> int:
        if personnel_code in profile_cache:
            return profile_cache[personnel_code]

        if personnel_code not in user_cache:
            role = "soldier"
            if personnel_code.startswith("C"):
                role = "commander"
            elif personnel_code.startswith("W"):
                role = "welfare_officer"
            elif personnel_code.startswith("HR"):
                role = "hr_officer"

            new_user = User(
                personnel_id=personnel_code,
                first_name=personnel_code,
                last_name="User",
                email=f"{personnel_code.lower()}@veercare.gov.in",
                role=role,
                unit_id=unit_id,
                hashed_password=default_pass_hash,
                supabase_user_id=f"SUPA-{personnel_code}",
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            user_cache[personnel_code] = new_user.id

        user_id = user_cache[personnel_code]

        new_profile = PersonnelProfile(
            user_id=user_id,
            unit_id=unit_id,
            personnel_code=personnel_code,
            rank=row.get("rank") or "Constable",
            service_years=_int(row.get("service_years"), 5),
            age_band=row.get("age_band") or "26-35",
            accommodation_type=row.get("accommodation_type") or "Barracks",
            deployment_zone=row.get("deployment_zone") or "Field Area",
            hardship_category=row.get("hardship_category") or "B",
            days_deployed=_int(row.get("days_deployed"), 120),
            days_in_hardship_A=_int(row.get("days_in_hardship_A"), 30),
            zone_changes=_int(row.get("zone_changes"), 1),
            distance_from_parent_unit_km=_float(row.get("distance_from_parent_unit_km"), 150.0),
            rotation_notice_days=_int(row.get("rotation_notice_days"), 14),
            posting_duration_days=_int(row.get("posting_duration_days"), 180),
            welfare_record_access=row.get("welfare_record_access") or "Standard",
            device_consent_status=row.get("device_consent_status") or "Consented",
            self_report_consent=row.get("self_report_consent") or "Consented",
        )
        session.add(new_profile)
        session.commit()
        session.refresh(new_profile)
        profile_cache[personnel_code] = new_profile.id
        return new_profile.id

    db.close()

    # 2. Stream CSV line-by-line and convert to JSON objects
    total_rows = 0
    batch_records = []
    start_time = time.time()
    TOTAL_EXPECTED = 62400

    current_session = SessionLocal()

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            pid_str = row.get("personnel_id") or f"P{total_rows:04d}"
            unit_str = row.get("unit_id") or "UNIT_001"

            try:
                unit_id = get_or_create_unit(current_session, unit_str)
                prof_id = get_or_create_personnel_profile(current_session, pid_str, unit_id, row)

                # JSON mappings for models
                duty_log = DutyHRLog(
                    personnel_id=prof_id,
                    week=_int(row.get("week"), 1),
                    duty_hours=_float(row.get("duty_hours"), 40.0),
                    duty_days=_int(row.get("duty_days"), 5),
                    rest_days=_int(row.get("rest_days"), 2),
                    rest_interval_hours=_float(row.get("rest_interval_hours"), 12.0),
                    night_shift_count=_int(row.get("night_shift_count"), 0),
                    max_consec_night_shifts=_int(row.get("max_consec_night_shifts"), 0),
                    high_risk_duty_count=_int(row.get("high_risk_duty_count"), 0),
                    overtime_hours=_float(row.get("overtime_hours"), 0.0),
                    max_consec_duty_days=_int(row.get("max_consec_duty_days"), 5),
                    training_hours=_float(row.get("training_hours"), 0.0),
                    quick_turnaround_count=_int(row.get("quick_turnaround_count"), 0),
                    baseline_duty_hours=_float(row.get("baseline_duty_hours"), 40.0),
                )

                health_log = HealthVitalsLog(
                    personnel_id=prof_id,
                    sleep_duration_hours=_float(row.get("sleep_duration_hours"), 6.5),
                    sleep_min_hours=_float(row.get("sleep_min_hours"), 5.0),
                    max_consec_nights_below_5h=_int(row.get("max_consec_nights_below_5h"), 0),
                    sleep_debt_7d=_float(row.get("sleep_debt_7d"), 0.0),
                    sleep_quality_score=_float(row.get("sleep_quality_score"), 7.0),
                    sleep_onset_time=_float(row.get("sleep_onset_time"), 23.0),
                    sleep_timing_variability_7d=_float(row.get("sleep_timing_variability_7d"), 1.0),
                    fatigue_score=_float(row.get("fatigue_score"), 3.0),
                    recovery_score=_float(row.get("recovery_score"), 7.0),
                    resting_heart_rate=_float(row.get("resting_heart_rate"), 65.0),
                    hrv_ms=_float(row.get("hrv_ms"), 55.0),
                    step_count=_float(row.get("step_count"), 8000.0),
                    mobility_radius_km=_float(row.get("mobility_radius_km"), 10.0),
                    baseline_sleep_hours=_float(row.get("baseline_sleep_hours"), 7.0),
                )

                leave_rec = LeaveRecord(
                    personnel_id=prof_id,
                    leave_applications=_int(row.get("leave_applications"), 0),
                    leave_granted=_int(row.get("leave_granted"), 0),
                    leave_rejected=_int(row.get("leave_rejected"), 0),
                    leave_cancelled_after_approval=_int(row.get("leave_cancelled_after_approval"), 0),
                    leave_days_taken=_int(row.get("leave_days_taken"), 0),
                    emergency_leave_applications=_int(row.get("emergency_leave_applications"), 0),
                    days_notice_given=_float(row.get("days_notice_given"), 7.0),
                    days_since_last_leave=_int(row.get("days_since_last_leave"), 60),
                    days_since_last_home_leave=_int(row.get("days_since_last_home_leave"), 90),
                    consecutive_leave_rejections=_int(row.get("consecutive_leave_rejections"), 0),
                    rejection_rate_90d=_float(row.get("rejection_rate_90d"), 0.0),
                    days_since_last_granted=_int(row.get("days_since_last_granted"), 60),
                )

                who5_rec = WHO5Assessment(
                    personnel_id=prof_id,
                    who5_score=_float(row.get("who5_score"), 65.0),
                    who5_assessment_due=_bool(row.get("who5_assessment_due"), False),
                    who5_response_status=row.get("who5_response_status") or "Not Due",
                )

                ml_pred = MLPrediction(
                    personnel_id=prof_id,
                    burnout_score=_float(row.get("burnout_score"), 25.0),
                    burnout_band=row.get("burnout_band") or "Low",
                    strain_index=_float(row.get("strain_index"), 35.0),
                    strain_band=row.get("strain_band") or "Low",
                    pss_score=_float(row.get("pss_score"), 12.0),
                    pss_band=row.get("pss_band") or "Low",
                    stress_score_est=_float(row.get("stress_score_est"), 15.0),
                    stress_band=row.get("stress_band") or "Low",
                    strain_flag=_int(row.get("strain_flag"), 0),
                    stress_flag=_int(row.get("stress_flag"), 0),
                    strain_delta_from_baseline=_float(row.get("strain_delta_from_baseline"), 0.0),
                    strain_z_from_baseline=_float(row.get("strain_z_from_baseline"), 0.0),
                    baseline_alert_flag=_int(row.get("baseline_alert_flag"), 0),
                    strain_trend_3w=_float(row.get("strain_trend_3w"), 0.0),
                    trend_flag=row.get("trend_flag") or "Stable",
                    intervention_recommended=row.get("intervention_recommended") or "No Action",
                    baseline_duty_hours=_float(row.get("baseline_duty_hours"), 40.0),
                    baseline_sleep_hours=_float(row.get("baseline_sleep_hours"), 7.0),
                    baseline_strain_mean=_float(row.get("baseline_strain_mean"), 35.0),
                    baseline_strain_sd=_float(row.get("baseline_strain_sd"), 5.0),
                    welfare_incident_next_week=_float(row.get("welfare_incident_next_week"), 0.0),
                    is_high_risk=_bool(row.get("baseline_alert_flag"), False) or (row.get("strain_band") in ("High", "Severe")),
                )

                batch_records.extend([duty_log, health_log, leave_rec, who5_rec, ml_pred])

                if _bool(row.get("cognitive_test_completed")):
                    pvt_test = PVTCognitiveTest(
                        personnel_id=prof_id,
                        cognitive_test_completed=True,
                        pvt_trials=_float(row.get("pvt_trials"), 50.0),
                        pvt_response_speed=_float(row.get("pvt_response_speed"), 3.5),
                        pvt_mean_rt_ms=_float(row.get("pvt_mean_rt_ms"), 280.0),
                        pvt_lapses=_float(row.get("pvt_lapses"), 1.0),
                        pvt_false_starts=_float(row.get("pvt_false_starts"), 0.0),
                        pvt_fastest10_rt_ms=_float(row.get("pvt_fastest10_rt_ms"), 210.0),
                        pvt_slowest10_rt_ms=_float(row.get("pvt_slowest10_rt_ms"), 380.0),
                        baseline_pvt_lapses=_float(row.get("baseline_pvt_lapses"), 1.0),
                        baseline_pvt_response_speed=_float(row.get("baseline_pvt_response_speed"), 3.5),
                        pvt_lapses_z=_float(row.get("pvt_lapses_z"), 0.0),
                        pvt_speed_z=_float(row.get("pvt_speed_z"), 0.0),
                        test_time_of_day=_float(row.get("test_time_of_day"), 14.0),
                        test_duration_s=_float(row.get("test_duration_s"), 180.0),
                        test_interrupted=_bool(row.get("test_interrupted"), False),
                        test_effort_flag=_bool(row.get("test_effort_flag"), True),
                        days_since_last_test=_int(row.get("days_since_last_test"), 7),
                    )
                    batch_records.append(pvt_test)

            except Exception as row_err:
                print(f"Warning: Failed formatting row {total_rows}: {row_err}", flush=True)
                continue

            # Flush batch and recreate DB session every BATCH_SIZE rows to avoid connection timeouts
            if total_rows % BATCH_SIZE == 0:
                try:
                    current_session.add_all(batch_records)
                    current_session.commit()
                    current_session.close()
                    current_session = SessionLocal()  # Fresh connection for next batch
                except Exception as commit_err:
                    print(f"Error committing batch at row {total_rows}: {commit_err}. Reconnecting...", flush=True)
                    current_session.rollback()
                    current_session.close()
                    current_session = SessionLocal()

                elapsed = time.time() - start_time
                rps = total_rows / max(elapsed, 0.001)
                pct = round((total_rows / TOTAL_EXPECTED) * 100, 1)
                remaining = TOTAL_EXPECTED - total_rows
                print(f"[PROGRESS] Processed {total_rows}/{TOTAL_EXPECTED} ({pct}%) | Remaining: {remaining} rows | Speed: {rps:.1f} rows/sec", flush=True)
                batch_records = []

    # Final commit for remaining rows
    if batch_records:
        try:
            current_session.add_all(batch_records)
            current_session.commit()
        except Exception as err:
            print(f"Error in final commit: {err}", flush=True)
        finally:
            current_session.close()

    elapsed = time.time() - start_time
    print(f"\n✅ CONVERTER FINISHED SUCCESSFULLY!", flush=True)
    print(f"Total CSV Rows Processed: {total_rows}", flush=True)
    print(f"Total Time Taken: {elapsed:.2f} seconds ({total_rows / max(elapsed, 0.001):.1f} rows/sec)", flush=True)


if __name__ == "__main__":
    run_converter()
