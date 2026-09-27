"""
Push cleaned_data2.json data to Remote Supabase PostgreSQL Database.

Usage:
  Set SUPABASE_DB_URL or DATABASE_URL in your environment or .env file:
    export SUPABASE_DB_URL="postgresql://postgres.xxxx:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres"
  Then run:
    python scripts/push_to_supabase.py
"""

import json
import os
import sys

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal, db_url
import models
from models import Unit, User, PersonnelProfile, MLPrediction, DutyHRLog, HealthVitalsLog, LeaveRecord, Intervention, IncidentDisciplineLog
from auth import get_password_hash

CLEANED_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cleaned_data2.json"
)

def push_data_to_supabase():
    print(f"Connecting to database via URL: {db_url}")
    if "sqlite" in db_url:
        print("\n[WARNING] Database URL is currently pointing to local SQLite (veercare.db).")
        print("To push to your remote Supabase database, please set the environment variable SUPABASE_DB_URL or DATABASE_URL.")
        print("Example:")
        print("  $env:SUPABASE_DB_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres\"")
        print("  python scripts/push_to_supabase.py\n")

    if not os.path.exists(CLEANED_DATA_PATH):
        print(f"Error: {CLEANED_DATA_PATH} not found!")
        return

    with open(CLEANED_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Create all schema tables in target DB if missing
    print("Creating database tables if not present...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 2. Push Units
        units_list = data.get("units", {}).get("units", [])
        print(f"Syncing {len(units_list)} units...")
        unit_map = {}
        for idx, u_name in enumerate(units_list, start=1):
            unit = db.query(Unit).filter(Unit.unit_name == u_name).first()
            if not unit:
                unit = Unit(id=idx, unit_code=f"U{idx:03d}", unit_name=u_name, region_zone="Sector Alpha")
                db.add(unit)
                db.commit()
                db.refresh(unit)
            unit_map[u_name] = unit.id

        default_unit_id = list(unit_map.values())[0] if unit_map else 1

        # 3. Push Users & Personnel Profiles & ML Predictions
        watchlist = data.get("watchlist", {}).get("results", [])
        personnel_dict = data.get("personnel_data", {})
        
        # Combine PIDs from watchlist and personnel_data
        all_pids = set(personnel_dict.keys())
        for w in watchlist:
            if "personnel_id" in w:
                all_pids.add(w["personnel_id"])

        print(f"Syncing {len(all_pids)} personnel profiles & users...")
        for pid in all_pids:
            p_block = personnel_dict.get(pid, {})
            detail = p_block.get("detail", {}).get("profile", {})
            
            # Roles setup
            role = "soldier"
            if pid.startswith("C"):
                role = "commander"
            elif pid.startswith("W"):
                role = "welfare_officer"
            elif pid.startswith("HR"):
                role = "hr_officer"

            first_name = detail.get("first_name", pid)
            last_name = detail.get("last_name", "User")
            email = f"{pid.lower()}@veercare.gov.in"
            rank = detail.get("rank") or "Constable"
            zone = detail.get("deployment_zone") or "Field Area"
            accommodation = detail.get("accommodation_type") or "Barracks"

            user = db.query(User).filter(User.personnel_id == pid).first()
            if not user:
                hashed_pass = get_password_hash("password123")
                user = User(
                    personnel_id=pid,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    role=role,
                    unit_id=default_unit_id,
                    hashed_password=hashed_pass,
                    supabase_user_id=f"SUPA-{pid}",
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            profile = db.query(PersonnelProfile).filter(PersonnelProfile.user_id == user.id).first()
            if not profile:
                profile = PersonnelProfile(
                    user_id=user.id,
                    unit_id=default_unit_id,
                    personnel_code=pid,
                    rank=rank,
                    service_years=detail.get("years_of_service", 5),
                    age_band="26-35",
                    accommodation_type=accommodation,
                    deployment_zone=zone,
                    hardship_category="B",
                    days_deployed=120,
                    welfare_record_access=detail.get("welfare_record_access", "Standard"),
                    device_consent_status=detail.get("device_consent_status", "Not Enrolled"),
                    self_report_consent="Consented",
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)

            # Strain & predictions for this personnel
            strain_val = 50.0
            strain_band_val = "Moderate"
            for w in watchlist:
                if w.get("personnel_id") == pid:
                    strain_val = w.get("strain_index", 50.0)
                    strain_band_val = w.get("strain_band", "Moderate")
                    break

            pred = db.query(MLPrediction).filter(MLPrediction.personnel_id == profile.id).first()
            if not pred:
                db.add(MLPrediction(
                    personnel_id=profile.id,
                    strain_index=strain_val,
                    strain_band=strain_band_val,
                    burnout_score=strain_val * 0.8,
                    burnout_band="Moderate" if strain_val < 60 else "High",
                    baseline_alert_flag=1 if strain_val >= 60 else 0,
                    trend_flag="Stable",
                    intervention_recommended="Counselling Referral" if strain_val >= 55 else "No Action",
                    is_high_risk=strain_val >= 60,
                ))
                db.commit()

        # 4. Push Interventions
        interventions_data = data.get("interventions", {}).get("results", [])
        print(f"Syncing {len(interventions_data)} intervention records...")
        admin_user = db.query(User).filter(User.role.in_(["welfare_officer", "hr_officer", "commander"])).first() or db.query(User).first()
        for item in interventions_data:
            target_pid = item.get("personnel_id")
            prof = db.query(PersonnelProfile).filter(PersonnelProfile.personnel_code == target_pid).first()
            if prof:
                existing_int = db.query(Intervention).filter(
                    Intervention.personnel_id == prof.id,
                    Intervention.action_type == item.get("intervention_type")
                ).first()
                if not existing_int:
                    db.add(Intervention(
                        personnel_id=prof.id,
                        assigned_by_user_id=admin_user.id if admin_user else prof.user_id,
                        action_type=item.get("intervention_type", "Counselling Referral"),
                        status="Completed" if item.get("outcome_effective") == 1 else "Pending",
                        notes=item.get("notes", "Assigned from cohort analysis"),
                    ))
                    db.commit()

        print("Data sync completed successfully!")

    except Exception as e:
        print(f"Error pushing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    push_data_to_supabase()
