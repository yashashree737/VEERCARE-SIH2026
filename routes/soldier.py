from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models.user import User
from models.personnel import PersonnelProfile
from models.health_log import HealthVitalsLog
from models.who5_assessment import WHO5Assessment
from models.duty_log import DutyHRLog
from schemas.soldier import WHO5Create, VitalsCreate

router = APIRouter(
    prefix="/api/soldier",
    tags=["Soldier Portal"]
)


@router.get("/dashboard/{user_id}")
def get_soldier_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Returns self-dashboard metrics for the authenticated soldier."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(PersonnelProfile).filter(PersonnelProfile.user_id == user_id).first()
    
    # Latest Vitals Log
    latest_vitals = None
    if profile:
        vitals_entry = (
            db.query(HealthVitalsLog)
            .filter(HealthVitalsLog.personnel_id == profile.id)
            .order_by(HealthVitalsLog.created_at.desc())
            .first()
        )
        if vitals_entry:
            latest_vitals = {
                "sleep_duration_hours": vitals_entry.sleep_duration_hours,
                "resting_heart_rate": vitals_entry.resting_heart_rate,
                "hrv_ms": vitals_entry.hrv_ms,
                "step_count": vitals_entry.step_count,
                "mobility_radius_km": vitals_entry.mobility_radius_km,
                "logged_at": vitals_entry.created_at,
            }

    # Latest WHO-5 Assessment
    latest_who5 = None
    if profile:
        who5_entry = (
            db.query(WHO5Assessment)
            .filter(WHO5Assessment.personnel_id == profile.id)
            .order_by(WHO5Assessment.created_at.desc())
            .first()
        )
        if who5_entry:
            latest_who5 = {
                "score": who5_entry.who5_score,
                "status": who5_entry.who5_response_status,
                "assessed_at": who5_entry.created_at,
            }

    # Assigned Duty Hours
    duty_summary = None
    if profile:
        duty_entry = (
            db.query(DutyHRLog)
            .filter(DutyHRLog.personnel_id == profile.id)
            .order_by(DutyHRLog.created_at.desc())
            .first()
        )
        if duty_entry:
            duty_summary = {
                "duty_hours": duty_entry.duty_hours,
                "duty_days": duty_entry.duty_days,
                "night_shift_count": duty_entry.night_shift_count,
            }

    return {
        "user_id": user.id,
        "name": f"{user.first_name} {user.last_name or ''}".strip(),
        "role": user.role,
        "personnel_code": profile.personnel_code if profile else user.personnel_id,
        "rank": profile.rank if profile else "Unknown",
        "deployment_zone": profile.deployment_zone if profile else "Peace Station",
        "latest_vitals": latest_vitals,
        "latest_who5": latest_who5,
        "duty_summary": duty_summary,
    }


@router.post("/who5/{user_id}")
def submit_who5_assessment(user_id: int, payload: WHO5Create, db: Session = Depends(get_db)):
    """Submits WHO-5 well-being index survey answers."""
    profile = db.query(PersonnelProfile).filter(PersonnelProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Personnel profile not found for this user")

    raw_sum = payload.q1_cheerful + payload.q2_calm + payload.q3_active + payload.q4_fresh + payload.q5_interests
    pct_score = (raw_sum / 25.0) * 100.0

    assessment = WHO5Assessment(
        personnel_id=profile.id,
        who5_score=pct_score,
        who5_assessment_due=False,
        who5_response_status="Responded",
        created_at=datetime.utcnow()
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "message": "WHO-5 Assessment submitted successfully",
        "assessment_id": assessment.id,
        "raw_sum": raw_sum,
        "percentage_score": pct_score,
    }


@router.post("/vitals/{user_id}")
def log_daily_vitals(user_id: int, payload: VitalsCreate, db: Session = Depends(get_db)):
    """Logs daily physiological vitals for a soldier."""
    profile = db.query(PersonnelProfile).filter(PersonnelProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Personnel profile not found for this user")

    vitals = HealthVitalsLog(
        personnel_id=profile.id,
        sleep_duration_hours=payload.sleep_duration_hours,
        resting_heart_rate=payload.resting_heart_rate,
        hrv_ms=payload.hrv_ms,
        step_count=payload.step_count,
        mobility_radius_km=payload.mobility_radius_km,
        created_at=datetime.utcnow()
    )
    db.add(vitals)
    db.commit()
    db.refresh(vitals)

    return {
        "message": "Daily vitals logged successfully",
        "vitals_id": vitals.id,
    }
