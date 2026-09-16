"""
Converter Pipeline: CSV Line to JSON Models to Neon DB

Processes data2.csv line-by-line, formats row dictionaries into normalized SQLAlchemy models,
and pushes them to your NEON PostgreSQL database in high-performance batches (500 rows per batch).

NOTE: This script intentionally does NOT use the `engine` / `SessionLocal` / `db_url`
exported by database.py (those still point at Supabase for your live app). Instead it
builds its own engine from the NEON_DATABASE_URL environment variable, so running this
migration script has zero effect on your app's normal Supabase connection.

Only the models/table schemas (Base.metadata) are reused from your existing codebase --
the actual DB connection used here is Neon.

RESUME BEHAVIOR:
This script tracks progress in a small checkpoint file (MIGRATION_CHECKPOINT_PATH,
alongside this script). On every successful batch commit, it records the CSV row
number it has committed through. On the next run it reads that checkpoint and
skips straight past already-committed rows instead of reprocessing them -- so
re-running the script safely continues where it left off rather than duplicating
DutyHRLog / HealthVitalsLog / LeaveRecord / WHO5Assessment / MLPrediction /
PVTCognitiveTest rows for personnel/weeks you've already migrated.

FIELD VALUES:
All model fields are taken directly from the CSV, as-is. Empty/missing cells are
passed through as NULL -- nothing is silently filled in with a fabricated default.
The one deliberate exception is the personnel_id / unit_id lookup keys themselves:
those are used as foreign-key anchors, so if a row is missing them a synthetic
placeholder id is generated (P0001-style / UNIT_001) purely so the row has
somewhere to attach. That fallback is isolated in `pid_str` / `unit_str` below --
delete it and let the row fail instead if you'd rather not have that exception.
"""

import csv
import json
import os
import sys
import time
from datetime import datetime

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# We still need Base (for schema metadata) and the model classes, but NOT the
# Supabase-bound engine/SessionLocal/db_url -- those are redefined below for Neon.
from database import Base
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

# --- Neon connection setup -------------------------------------------------
db_url = os.environ.get("NEON_DATABASE_URL")
if not db_url:
    print(
        "Error: NEON_DATABASE_URL environment variable is not set.\n"
        "Set it to your Neon connection string, e.g.:\n"
        '  export NEON_DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require"\n',
        flush=True,
    )
    sys.exit(1)

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# -----------------------------------------------------------------------------

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "datasets", "data2.csv"
)

MIGRATION_CHECKPOINT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "migration_checkpoint.json"
)

BATCH_SIZE = 500  # Process and commit 500 rows at a time
TOTAL_TARGET_ROWS = 10000  # Migrate the first 10,000 CSV rows

# RESET_ON_START = True means: wipe the six per-week log tables (the ones with
# no dedup/unique check -- see module docstring) and the checkpoint file before
# this run, then migrate all TOTAL_TARGET_ROWS rows fresh from row 1. This is
# the default so a run never builds on top of whatever partial/duplicated data
# is already in Neon from earlier runs.
# Set the MIGRATION_RESET env var to "0" to fall back to checkpoint-resume
# behavior instead (continue after the last committed row, no wipe).
RESET_ON_START = os.environ.get("MIGRATION_RESET", "1").strip().lower() not in ("0", "false", "no")

# Tables wiped by a reset. Unit / User / PersonnelProfile are NOT included --
# those are deduped by the unit_cache/user_cache/profile_cache lookups above
# and are safe to keep across runs.
RESETTABLE_LOG_MODELS = [
    DutyHRLog,
    HealthVitalsLog,
    LeaveRecord,
    WHO5Assessment,
    MLPrediction,
    PVTCognitiveTest,
]


def _float(val):
    """Pass the CSV value straight through. Empty/missing -> None (NULL in DB)."""
    if val is None or val == "":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _int(val):
    """Pass the CSV value straight through. Empty/missing -> None (NULL in DB)."""
    if val is None or val == "":
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _bool(val):
    """Pass the CSV value straight through. Empty/missing -> None (NULL in DB)."""
    if val is None or val == "":
        return None
    s = str(val).strip().lower()
    return s in ("1", "true", "yes", "t", "y")


def _str(val):
    """Pass the CSV string value straight through. Empty/missing -> None (NULL in DB)."""
    if val is None or val == "":
        return None
    return val


def load_checkpoint():
    """Return the last CSV row number successfully committed, or 0 if none yet."""
    if not os.path.exists(MIGRATION_CHECKPOINT_PATH):
        return 0
    try:
        with open(MIGRATION_CHECKPOINT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return int(data.get("last_completed_row", 0))
    except Exception as e:
        print(f"Warning: could not read checkpoint file ({e}). Starting from row 0.", flush=True)
        return 0


def save_checkpoint(last_completed_row):
    tmp_path = MIGRATION_CHECKPOINT_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "last_completed_row": last_completed_row,
                "updated_at": datetime.utcnow().isoformat() + "Z",
            },
            f,
        )
    os.replace(tmp_path, MIGRATION_CHECKPOINT_PATH)


def clear_checkpoint():
    if os.path.exists(MIGRATION_CHECKPOINT_PATH):
        os.remove(MIGRATION_CHECKPOINT_PATH)


def reset_log_tables(session):
    """Delete all rows from the per-week log tables so this run doesn't build
    on top of whatever partial/duplicated data is already in Neon. Units,
    Users, and PersonnelProfiles are left alone -- they're deduped by cache
    lookups and don't need wiping."""
    print("[RESET] MIGRATION_RESET is on -- wiping existing log-table rows before this run...", flush=True)
    for model in RESETTABLE_LOG_MODELS:
        deleted = session.query(model).delete()
        print(f"[RESET]   Cleared {deleted} row(s) from {model.__tablename__}.", flush=True)
    session.commit()
    clear_checkpoint()
    print("[RESET] Done. Checkpoint cleared -- this run starts from CSV row 1.\n", flush=True)


def run_converter():
    print(f"=== Starting CSV to Neon Batch Converter ===", flush=True)
    print(f"Target Database URL: {db_url}", flush=True)
    print(f"Source CSV Path: {CSV_PATH}", flush=True)
    print(f"Checkpoint file: {MIGRATION_CHECKPOINT_PATH}", flush=True)
    print(f"Batch Size: {BATCH_SIZE} rows per commit", flush=True)
    print(f"Target total rows: {TOTAL_TARGET_ROWS}\n", flush=True)

    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found!", flush=True)
        return

    # 1. Ensure database schema is present with retries
    print("Verifying/creating database schema in target DB (Neon)...", flush=True)
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

    if RESET_ON_START:
        try:
            reset_log_tables(db)
        except Exception as reset_err:
            print(
                f"[RESET] Failed to wipe log tables cleanly ({reset_err}). "
                f"Falling back to checkpoint-resume instead of a clean restart.",
                flush=True,
            )
            db.rollback()

    already_done = load_checkpoint()
    if already_done >= TOTAL_TARGET_ROWS:
        print(
            f"[DONE] Checkpoint shows {already_done} rows already migrated, "
            f"which meets the target of {TOTAL_TARGET_ROWS}. Nothing to do.",
            flush=True,
        )
        return
    if already_done > 0:
        print(f"[RESUME] Checkpoint found -- resuming after row {already_done}.", flush=True)

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
            rank=_str(row.get("rank")),
            service_years=_int(row.get("service_years")),
            age_band=_str(row.get("age_band")),
            accommodation_type=_str(row.get("accommodation_type")),
            deployment_zone=_str(row.get("deployment_zone")),
            hardship_category=_str(row.get("hardship_category")),
            days_deployed=_int(row.get("days_deployed")),
            days_in_hardship_A=_int(row.get("days_in_hardship_A")),
            zone_changes=_int(row.get("zone_changes")),
            distance_from_parent_unit_km=_float(row.get("distance_from_parent_unit_km")),
            rotation_notice_days=_int(row.get("rotation_notice_days")),
            posting_duration_days=_int(row.get("posting_duration_days")),
            welfare_record_access=_str(row.get("welfare_record_access")),
            device_consent_status=_str(row.get("device_consent_status")),
            self_report_consent=_str(row.get("self_report_consent")),
        )
        session.add(new_profile)
        session.commit()
        session.refresh(new_profile)
        profile_cache[personnel_code] = new_profile.id
        return new_profile.id

    db.close()

    # 2. Stream CSV line-by-line and convert to JSON objects
    total_rows = 0
    committed_rows = already_done
    batch_records = []
    start_time = time.time()

    current_session = SessionLocal()

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1

            # Fast-forward past rows already committed in a previous run.
            if total_rows <= already_done:
                continue

            # Stop once we've reached the target row count.
            if total_rows > TOTAL_TARGET_ROWS:
                print(f"[LIMIT] Reached target of {TOTAL_TARGET_ROWS} rows. Stopping ingestion.", flush=True)
                break

            # personnel_id / unit_id are lookup keys, not data fields -- see module
            # docstring. They get a synthetic fallback only when truly missing from
            # the row, so every log row has somewhere to attach.
            pid_str = row.get("personnel_id") or f"P{total_rows:04d}"
            unit_str = row.get("unit_id") or "UNIT_001"

            try:
                unit_id = get_or_create_unit(current_session, unit_str)
                prof_id = get_or_create_personnel_profile(current_session, pid_str, unit_id, row)

                # JSON mappings for models -- every value below is taken as-is from
                # the CSV row. Empty/missing cells become NULL, nothing is invented.
                duty_log = DutyHRLog(
                    personnel_id=prof_id,
                    week=_int(row.get("week")),
                    duty_hours=_float(row.get("duty_hours")),
                    duty_days=_int(row.get("duty_days")),
                    rest_days=_int(row.get("rest_days")),
                    rest_interval_hours=_float(row.get("rest_interval_hours")),
                    night_shift_count=_int(row.get("night_shift_count")),
                    max_consec_night_shifts=_int(row.get("max_consec_night_shifts")),
                    high_risk_duty_count=_int(row.get("high_risk_duty_count")),
                    overtime_hours=_float(row.get("overtime_hours")),
                    max_consec_duty_days=_int(row.get("max_consec_duty_days")),
                    training_hours=_float(row.get("training_hours")),
                    quick_turnaround_count=_int(row.get("quick_turnaround_count")),
                    baseline_duty_hours=_float(row.get("baseline_duty_hours")),
                )

                health_log = HealthVitalsLog(
                    personnel_id=prof_id,
                    sleep_duration_hours=_float(row.get("sleep_duration_hours")),
                    sleep_min_hours=_float(row.get("sleep_min_hours")),
                    max_consec_nights_below_5h=_int(row.get("max_consec_nights_below_5h")),
                    sleep_debt_7d=_float(row.get("sleep_debt_7d")),
                    sleep_quality_score=_float(row.get("sleep_quality_score")),
                    sleep_onset_time=_float(row.get("sleep_onset_time")),
                    sleep_timing_variability_7d=_float(row.get("sleep_timing_variability_7d")),
                    fatigue_score=_float(row.get("fatigue_score")),
                    recovery_score=_float(row.get("recovery_score")),
                    resting_heart_rate=_float(row.get("resting_heart_rate")),
                    hrv_ms=_float(row.get("hrv_ms")),
                    step_count=_float(row.get("step_count")),
                    mobility_radius_km=_float(row.get("mobility_radius_km")),
                    baseline_sleep_hours=_float(row.get("baseline_sleep_hours")),
                )

                leave_rec = LeaveRecord(
                    personnel_id=prof_id,
                    leave_applications=_int(row.get("leave_applications")),
                    leave_granted=_int(row.get("leave_granted")),
                    leave_rejected=_int(row.get("leave_rejected")),
                    leave_cancelled_after_approval=_int(row.get("leave_cancelled_after_approval")),
                    leave_days_taken=_int(row.get("leave_days_taken")),
                    emergency_leave_applications=_int(row.get("emergency_leave_applications")),
                    days_notice_given=_float(row.get("days_notice_given")),
                    days_since_last_leave=_int(row.get("days_since_last_leave")),
                    days_since_last_home_leave=_int(row.get("days_since_last_home_leave")),
                    consecutive_leave_rejections=_int(row.get("consecutive_leave_rejections")),
                    rejection_rate_90d=_float(row.get("rejection_rate_90d")),
                    days_since_last_granted=_int(row.get("days_since_last_granted")),
                )

                who5_rec = WHO5Assessment(
                    personnel_id=prof_id,
                    who5_score=_float(row.get("who5_score")),
                    who5_assessment_due=_bool(row.get("who5_assessment_due")),
                    who5_response_status=_str(row.get("who5_response_status")),
                )

                ml_pred = MLPrediction(
                    personnel_id=prof_id,
                    burnout_score=_float(row.get("burnout_score")),
                    burnout_band=_str(row.get("burnout_band")),
                    strain_index=_float(row.get("strain_index")),
                    strain_band=_str(row.get("strain_band")),
                    pss_score=_float(row.get("pss_score")),
                    pss_band=_str(row.get("pss_band")),
                    stress_score_est=_float(row.get("stress_score_est")),
                    stress_band=_str(row.get("stress_band")),
                    strain_flag=_int(row.get("strain_flag")),
                    stress_flag=_int(row.get("stress_flag")),
                    strain_delta_from_baseline=_float(row.get("strain_delta_from_baseline")),
                    strain_z_from_baseline=_float(row.get("strain_z_from_baseline")),
                    baseline_alert_flag=_int(row.get("baseline_alert_flag")),
                    strain_trend_3w=_float(row.get("strain_trend_3w")),
                    trend_flag=_str(row.get("trend_flag")),
                    intervention_recommended=_str(row.get("intervention_recommended")),
                    baseline_duty_hours=_float(row.get("baseline_duty_hours")),
                    baseline_sleep_hours=_float(row.get("baseline_sleep_hours")),
                    baseline_strain_mean=_float(row.get("baseline_strain_mean")),
                    baseline_strain_sd=_float(row.get("baseline_strain_sd")),
                    welfare_incident_next_week=_float(row.get("welfare_incident_next_week")),
                    is_high_risk=bool(_bool(row.get("baseline_alert_flag"))) or (row.get("strain_band") in ("High", "Severe")),
                )

                batch_records.extend([duty_log, health_log, leave_rec, who5_rec, ml_pred])

                if _bool(row.get("cognitive_test_completed")):
                    pvt_test = PVTCognitiveTest(
                        personnel_id=prof_id,
                        cognitive_test_completed=True,
                        pvt_trials=_float(row.get("pvt_trials")),
                        pvt_response_speed=_float(row.get("pvt_response_speed")),
                        pvt_mean_rt_ms=_float(row.get("pvt_mean_rt_ms")),
                        pvt_lapses=_float(row.get("pvt_lapses")),
                        pvt_false_starts=_float(row.get("pvt_false_starts")),
                        pvt_fastest10_rt_ms=_float(row.get("pvt_fastest10_rt_ms")),
                        pvt_slowest10_rt_ms=_float(row.get("pvt_slowest10_rt_ms")),
                        baseline_pvt_lapses=_float(row.get("baseline_pvt_lapses")),
                        baseline_pvt_response_speed=_float(row.get("baseline_pvt_response_speed")),
                        pvt_lapses_z=_float(row.get("pvt_lapses_z")),
                        pvt_speed_z=_float(row.get("pvt_speed_z")),
                        test_time_of_day=_float(row.get("test_time_of_day")),
                        test_duration_s=_float(row.get("test_duration_s")),
                        test_interrupted=_bool(row.get("test_interrupted")),
                        test_effort_flag=_bool(row.get("test_effort_flag")),
                        days_since_last_test=_int(row.get("days_since_last_test")),
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
                    committed_rows = total_rows
                    save_checkpoint(committed_rows)
                except Exception as commit_err:
                    print(f"Error committing batch at row {total_rows}: {commit_err}. Reconnecting...", flush=True)
                    current_session.rollback()
                    current_session.close()
                    current_session = SessionLocal()
                    # Checkpoint is NOT advanced here -- this batch will be retried
                    # (from the last saved checkpoint) on the next run.

                elapsed = time.time() - start_time
                processed_this_run = total_rows - already_done
                rps = processed_this_run / max(elapsed, 0.001)
                pct = round((total_rows / TOTAL_TARGET_ROWS) * 100, 1)
                remaining = TOTAL_TARGET_ROWS - total_rows
                print(f"[PROGRESS] Committed through row {total_rows}/{TOTAL_TARGET_ROWS} ({pct}%) | Remaining: {remaining} rows | Speed: {rps:.1f} rows/sec", flush=True)
                batch_records = []

    # Final commit for remaining rows
    if batch_records:
        try:
            current_session.add_all(batch_records)
            current_session.commit()
            committed_rows = min(total_rows, TOTAL_TARGET_ROWS)
            save_checkpoint(committed_rows)
        except Exception as err:
            print(f"Error in final commit: {err}", flush=True)
        finally:
            current_session.close()

    elapsed = time.time() - start_time
    processed_this_run = max(committed_rows - already_done, 0)
    print(f"\n[SUCCESS] CONVERTER FINISHED SUCCESSFULLY!", flush=True)
    print(f"Rows committed this run: {processed_this_run}", flush=True)
    print(f"Total rows committed overall (checkpoint): {committed_rows}/{TOTAL_TARGET_ROWS}", flush=True)
    print(f"Total Time Taken: {elapsed:.2f} seconds ({processed_this_run / max(elapsed, 0.001):.1f} rows/sec)", flush=True)


if __name__ == "__main__":
    run_converter()