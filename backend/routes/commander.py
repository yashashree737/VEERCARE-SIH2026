from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models.user import User
from models.unit import Unit
from models.personnel import PersonnelProfile
from models.duty_log import DutyHRLog
from models.leave import LeaveRecord
from schemas.commander import DutyLogUpdate, LeaveUpdate

router = APIRouter(
    prefix="/api/commander",
    tags=["Unit Commander Portal"]
)


@router.get("/unit-summary/{commander_user_id}")
def get_unit_summary(commander_user_id: int, db: Session = Depends(get_db)):
    """Returns battalion unit metrics for the Commander's unit (unit-scoped access)."""
    commander = db.query(User).filter(User.id == commander_user_id).first()
    if not commander:
        raise HTTPException(status_code=404, detail="Commander user not found")

    unit = db.query(Unit).filter(
        (Unit.commander_user_id == commander_user_id) | (Unit.id == commander.unit_id)
    ).first()

    if not unit:
        # Fallback query if no explicit unit linkage yet
        personnel_list = db.query(PersonnelProfile).all()
        unit_code = "All Units (Fallback)"
    else:
        personnel_list = db.query(PersonnelProfile).filter(PersonnelProfile.unit_id == unit.id).all()
        unit_code = unit.unit_code

    soldier_ids = [p.id for p in personnel_list]
    
    # Calculate average duty hours
    duty_logs = db.query(DutyHRLog).filter(DutyHRLog.personnel_id.in_(soldier_ids)).all() if soldier_ids else []
    total_duty = sum(log.duty_hours for log in duty_logs) if duty_logs else 0.0
    avg_duty = round(total_duty / len(duty_logs), 2) if duty_logs else 0.0

    soldier_summaries = []
    for p in personnel_list:
        latest_duty = (
            db.query(DutyHRLog)
            .filter(DutyHRLog.personnel_id == p.id)
            .order_by(DutyHRLog.created_at.desc())
            .first()
        )
        soldier_summaries.append({
            "personnel_id": p.id,
            "personnel_code": p.personnel_code,
            "rank": p.rank,
            "current_duty_hours": latest_duty.duty_hours if latest_duty else 0.0,
            "night_shifts": latest_duty.night_shift_count if latest_duty else 0,
            "duty_log_id": latest_duty.id if latest_duty else None,
        })

    return {
        "commander_id": commander_user_id,
        "unit_code": unit_code,
        "total_personnel_count": len(personnel_list),
        "average_duty_hours": avg_duty,
        "personnel": soldier_summaries,
    }


@router.put("/duty-hours/{duty_log_id}")
def update_soldier_duty_hours(
    duty_log_id: int,
    commander_user_id: int,
    payload: DutyLogUpdate,
    db: Session = Depends(get_db)
):
    """Commander updates operational duty hours and shift postings for a soldier in their unit."""
    duty_log = db.query(DutyHRLog).filter(DutyHRLog.id == duty_log_id).first()
    if not duty_log:
        raise HTTPException(status_code=404, detail="Duty HR Log entry not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(duty_log, key, value)

    duty_log.updated_by_user_id = commander_user_id
    duty_log.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(duty_log)

    return {
        "message": "Duty HR shift log updated successfully by Commander",
        "duty_log_id": duty_log.id,
        "updated_duty_hours": duty_log.duty_hours,
        "updated_by": commander_user_id,
    }


@router.get("/leave-applications/{unit_id}")
def get_unit_leave_applications(unit_id: int, db: Session = Depends(get_db)):
    """Returns leave records for personnel in a battalion unit."""
    personnel_list = db.query(PersonnelProfile).filter(PersonnelProfile.unit_id == unit_id).all()
    p_ids = [p.id for p in personnel_list]

    leave_records = db.query(LeaveRecord).filter(LeaveRecord.personnel_id.in_(p_ids)).all() if p_ids else []

    results = []
    for lr in leave_records:
        p = db.query(PersonnelProfile).filter(PersonnelProfile.id == lr.personnel_id).first()
        results.append({
            "leave_id": lr.id,
            "personnel_code": p.personnel_code if p else "Unknown",
            "rank": p.rank if p else "Unknown",
            "leave_applications": lr.leave_applications,
            "leave_granted": lr.leave_granted,
            "leave_rejected": lr.leave_rejected,
            "rejection_rate_90d": lr.rejection_rate_90d,
        })

    return {
        "unit_id": unit_id,
        "total_leave_records": len(results),
        "leaves": results,
    }
