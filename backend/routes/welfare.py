from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models.personnel import PersonnelProfile
from models.ml_prediction import MLPrediction
from models.health_log import HealthVitalsLog
from models.who5_assessment import WHO5Assessment
from models.duty_log import DutyHRLog
from models.intervention import Intervention
from schemas.welfare import InterventionCreate, InterventionStatusUpdate

router = APIRouter(
    prefix="/api/welfare",
    tags=["Welfare Officer Portal"]
)


@router.get("/high-risk-alerts")
def get_high_risk_alerts(db: Session = Depends(get_db)):
    """
    Returns ONLY personnel flagged with high stress, critical burnout, or welfare incident risk.
    Enforces Welfare Officer privacy filtering rules.
    """
    high_risk_predictions = (
        db.query(MLPrediction)
        .filter(MLPrediction.is_high_risk == True)
        .order_by(MLPrediction.prediction_timestamp.desc())
        .all()
    )

    alerts = []
    seen_personnel = set()
    for pred in high_risk_predictions:
        if pred.personnel_id in seen_personnel:
            continue
        seen_personnel.add(pred.personnel_id)

        profile = db.query(PersonnelProfile).filter(PersonnelProfile.id == pred.personnel_id).first()
        if not profile:
            continue

        alerts.append({
            "prediction_id": pred.id,
            "personnel_id": profile.id,
            "personnel_code": profile.personnel_code,
            "rank": profile.rank,
            "deployment_zone": profile.deployment_zone,
            "burnout_score": pred.burnout_score,
            "burnout_severity": pred.burnout_severity,
            "pss_score": pred.pss_score,
            "stress_level": pred.stress_level,
            "strain_index": pred.strain_index,
            "welfare_risk_label": pred.welfare_risk_label,
            "recommended_intervention": pred.intervention_recommended,
            "prediction_timestamp": pred.prediction_timestamp,
        })

    return {
        "high_risk_alerts_count": len(alerts),
        "alerts": alerts,
    }


@router.get("/personnel-detail/{personnel_id}")
def get_high_risk_personnel_detail(personnel_id: int, db: Session = Depends(get_db)):
    """
    Allows Welfare Officer to inspect detailed health vitals, PSS score, and WHO-5 scores
    FOR HIGH-RISK PERSONNEL ONLY.
    """
    profile = db.query(PersonnelProfile).filter(PersonnelProfile.id == personnel_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Personnel profile not found")

    # Check high-risk authorization flag
    latest_pred = (
        db.query(MLPrediction)
        .filter(MLPrediction.personnel_id == personnel_id)
        .order_by(MLPrediction.prediction_timestamp.desc())
        .first()
    )

    if not latest_pred or not latest_pred.is_high_risk:
        raise HTTPException(
            status_code=403,
            detail="Access Restricted: Detailed medical & WHO-5 records are visible to Welfare Officers only for high-risk personnel."
        )

    # Fetch vitals
    vitals_history = (
        db.query(HealthVitalsLog)
        .filter(HealthVitalsLog.personnel_id == personnel_id)
        .order_by(HealthVitalsLog.created_at.desc())
        .limit(10)
        .all()
    )

    # Fetch WHO-5 assessments
    who5_history = (
        db.query(WHO5Assessment)
        .filter(WHO5Assessment.personnel_id == personnel_id)
        .order_by(WHO5Assessment.created_at.desc())
        .limit(10)
        .all()
    )

    # Fetch active interventions
    interventions = (
        db.query(Intervention)
        .filter(Intervention.personnel_id == personnel_id)
        .order_by(Intervention.created_at.desc())
        .all()
    )

    return {
        "personnel_id": profile.id,
        "personnel_code": profile.personnel_code,
        "rank": profile.rank,
        "deployment_zone": profile.deployment_zone,
        "latest_prediction": {
            "burnout_score": latest_pred.burnout_score,
            "burnout_severity": latest_pred.burnout_severity,
            "pss_score": latest_pred.pss_score,
            "stress_level": latest_pred.stress_level,
            "strain_index": latest_pred.strain_index,
            "welfare_risk_label": latest_pred.welfare_risk_label,
            "recommended_intervention": latest_pred.intervention_recommended,
        },
        "vitals_history": [
            {
                "sleep_duration_hours": v.sleep_duration_hours,
                "resting_heart_rate": v.resting_heart_rate,
                "hrv_ms": v.hrv_ms,
                "logged_at": v.created_at,
            }
            for v in vitals_history
        ],
        "who5_history": [
            {
                "score": w.who5_score,
                "status": w.who5_response_status,
                "assessed_at": w.created_at,
            }
            for w in who5_history
        ],
        "active_interventions": [
            {
                "intervention_id": i.id,
                "action_type": i.action_type,
                "status": i.status,
                "notes": i.notes,
                "assigned_by_user_id": i.assigned_by_user_id,
                "created_at": i.created_at,
            }
            for i in interventions
        ]
    }


@router.post("/interventions/{welfare_officer_user_id}")
def create_welfare_intervention(
    welfare_officer_user_id: int,
    payload: InterventionCreate,
    db: Session = Depends(get_db)
):
    """Assigns & creates a welfare intervention for a high-risk soldier."""
    profile = db.query(PersonnelProfile).filter(PersonnelProfile.id == payload.personnel_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Personnel profile not found")

    intervention = Intervention(
        personnel_id=payload.personnel_id,
        prediction_id=payload.prediction_id,
        assigned_by_user_id=welfare_officer_user_id,
        action_type=payload.action_type,
        status="Pending",
        notes=payload.notes,
        created_at=datetime.utcnow()
    )
    db.add(intervention)
    db.commit()
    db.refresh(intervention)

    return {
        "message": "Welfare intervention assigned successfully",
        "intervention_id": intervention.id,
        "personnel_code": profile.personnel_code,
        "action_type": intervention.action_type,
        "status": intervention.status,
    }
