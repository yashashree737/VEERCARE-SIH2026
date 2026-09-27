from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.unit import Unit
from models.personnel import PersonnelProfile
from models.duty_log import DutyHRLog

router = APIRouter(
    prefix="/api/hr",
    tags=["Command HR Portal"]
)


@router.get("/global-analytics")
def get_global_hr_analytics(db: Session = Depends(get_db)):
    """Returns organization-wide duty hours & operational statistics across ALL units."""
    total_units = db.query(Unit).count()
    total_personnel = db.query(PersonnelProfile).count()

    all_duty_logs = db.query(DutyHRLog).all()
    total_hours = sum(log.duty_hours for log in all_duty_logs) if all_duty_logs else 0.0
    avg_hours = round(total_hours / len(all_duty_logs), 2) if all_duty_logs else 0.0
    total_overtime = sum(log.overtime_hours or 0.0 for log in all_duty_logs) if all_duty_logs else 0.0

    return {
        "total_units": total_units,
        "total_personnel_count": total_personnel,
        "total_logged_duty_hours": total_hours,
        "average_duty_hours": avg_hours,
        "total_overtime_hours": total_overtime,
    }


@router.get("/unit-comparison")
def get_unit_comparison(db: Session = Depends(get_db)):
    """Compares average workload and duty hours across different battalion units."""
    units = db.query(Unit).all()

    comparison = []
    for u in units:
        personnel_in_unit = db.query(PersonnelProfile).filter(PersonnelProfile.unit_id == u.id).all()
        p_ids = [p.id for p in personnel_in_unit]

        logs = db.query(DutyHRLog).filter(DutyHRLog.personnel_id.in_(p_ids)).all() if p_ids else []
        unit_avg_duty = round(sum(l.duty_hours for l in logs) / len(logs), 2) if logs else 0.0

        comparison.append({
            "unit_id": u.id,
            "unit_code": u.unit_code,
            "unit_name": u.unit_name,
            "region_zone": u.region_zone,
            "personnel_count": len(personnel_in_unit),
            "average_duty_hours": unit_avg_duty,
        })

    return {
        "unit_comparison": comparison
    }
