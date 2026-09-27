import sys
import os

from database import engine, Base, SessionLocal
import models
from models import Unit, User, PersonnelProfile, MLPrediction, DutyHRLog, HealthVitalsLog, LeaveRecord, Intervention
from auth import get_password_hash

def init_db_and_seed():
    # 1. Create all tables if missing
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 2. Seed Units if empty
        if db.query(Unit).count() == 0:
            units_data = [
                Unit(id=1, unit_code="U012", unit_name="12th Battalion CRPF", region_zone="Sector Alpha"),
                Unit(id=2, unit_code="U015", unit_name="15th Battalion CRPF", region_zone="Sector Bravo"),
                Unit(id=3, unit_code="UHQ1", unit_name="HQ Alpha", region_zone="Central Command"),
            ]
            db.add_all(units_data)
            db.commit()

        # 3. Seed Users & Profiles if missing
        users_to_create = [
            {
                "personnel_id": "P1001",
                "first_name": "Ramesh",
                "last_name": "Kumar",
                "email": "p1001@veercare.gov.in",
                "role": "soldier",
                "password": "password123",
                "unit_id": 1,
                "rank": "Constable",
                "consent": "Enrolled",
                "access": "Standard",
                "hardship": "A",
                "zone": "High Hardship (LCH Zone)",
            },
            {
                "personnel_id": "P1002",
                "first_name": "Suresh",
                "last_name": "Singh",
                "email": "p1002@veercare.gov.in",
                "role": "soldier",
                "password": "password123",
                "unit_id": 1,
                "rank": "Head Constable",
                "consent": "Enrolled",
                "access": "Standard",
                "hardship": "B",
                "zone": "Medium Hardship Zone",
            },
            {
                "personnel_id": "P1003",
                "first_name": "Vikram",
                "last_name": "Sharma",
                "email": "p1003@veercare.gov.in",
                "role": "soldier",
                "password": "password123",
                "unit_id": 1,
                "rank": "Constable",
                "consent": "Not Enrolled",
                "access": "Restricted",
                "hardship": "A",
                "zone": "Sector Alpha Forward Picket",
            },
            {
                "personnel_id": "C1001",
                "first_name": "Vikram",
                "last_name": "Rathore",
                "email": "c1001@veercare.gov.in",
                "role": "commander",
                "password": "password123",
                "unit_id": 1,
                "rank": "Commandant",
                "consent": "Not Enrolled",
                "access": "Standard",
                "hardship": "B",
                "zone": "12th Bn HQ",
            },
            {
                "personnel_id": "W1001",
                "first_name": "Anita",
                "last_name": "Deshmukh",
                "email": "w1001@veercare.gov.in",
                "role": "welfare_officer",
                "password": "password123",
                "unit_id": 1,
                "rank": "Welfare Officer",
                "consent": "Not Enrolled",
                "access": "Standard",
                "hardship": "B",
                "zone": "12th Bn Welfare Cell",
            },
            {
                "personnel_id": "HR-001",
                "first_name": "Dummy",
                "last_name": "HR",
                "email": "hr001@veercare.gov.in",
                "role": "hr_officer",
                "password": "securepassword123",
                "unit_id": 3,
                "rank": "HR Officer",
                "consent": "Not Enrolled",
                "access": "Standard",
                "hardship": "C",
                "zone": "HQ Alpha Admin",
            },
        ]

        for item in users_to_create:
            # Get existing unit id or default unit
            target_unit = db.query(Unit).first()
            unit_id = target_unit.id if target_unit else 1

            # Ensure user exists
            user = db.query(User).filter(User.personnel_id == item["personnel_id"]).first()
            if not user:
                hashed_pass = get_password_hash(item["password"])
                user = User(
                    personnel_id=item["personnel_id"],
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    email=item["email"],
                    role=item["role"],
                    unit_id=unit_id,
                    hashed_password=hashed_pass,
                    supabase_user_id=f"SUPA-{item['personnel_id']}",
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Ensure PersonnelProfile exists
            profile = db.query(PersonnelProfile).filter(PersonnelProfile.user_id == user.id).first()
            if not profile:
                profile = PersonnelProfile(
                    user_id=user.id,
                    unit_id=unit_id,
                    personnel_code=item["personnel_id"],
                    rank=item["rank"],
                    service_years=6,
                    age_band="26-35",
                    accommodation_type="Barracks",
                    deployment_zone=item["zone"],
                    hardship_category=item["hardship"],
                    days_deployed=180,
                    days_in_hardship_A=45 if item["hardship"] == "A" else 10,
                    zone_changes=2,
                    welfare_record_access=item["access"],
                    device_consent_status=item["consent"],
                    self_report_consent="Enrolled" if item["consent"] == "Enrolled" else "Declined",
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)

            # Ensure MLPrediction exists for soldiers
            if item["role"] == "soldier":
                pred = db.query(MLPrediction).filter(MLPrediction.personnel_id == profile.id).first()
                if not pred:
                    db.add(MLPrediction(
                        personnel_id=profile.id,
                        strain_index=68.5 if item["personnel_id"] == "P1001" else 42.0,
                        welfare_incident_next_week=0.45 if item["personnel_id"] == "P1001" else 0.12,
                        baseline_alert_flag=1 if item["personnel_id"] == "P1001" else 0,
                        trend_flag="Rising" if item["personnel_id"] == "P1001" else "Stable",
                        intervention_recommended="Counselling & Leave Priority" if item["personnel_id"] == "P1001" else "No Action",
                    ))
                    db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
    print("Database initialized and seeded successfully!")
