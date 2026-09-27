from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models.personnel import PersonnelProfile
from models.ml_prediction import MLPrediction
from models.duty_log import DutyHRLog
from models.health_log import HealthVitalsLog
from models.leave import LeaveRecord
from models.who5_assessment import WHO5Assessment
from models.cognitive_test import PVTCognitiveTest
from models.discipline_log import IncidentDisciplineLog
from schemas.ml import MLPredictSampleInput, MLPredictResponse
from ml.ml import predict_vars

router = APIRouter(
    prefix="/api/ml",
    tags=["ML Inference Pipeline"]
)


@router.post("/predict-sample", response_model=MLPredictResponse)
def predict_sample_endpoint(payload: MLPredictSampleInput):
    """Runs ML models on a raw non-encoded sample payload and returns structured risk indicators."""
    sample_dict = payload.model_dump()
    res = predict_vars(sample_dict)
    return res.to_dict()


@router.post("/predict/{personnel_id}")
def predict_for_personnel(personnel_id: int, db: Session = Depends(get_db)):
    """
    Fetches raw non-encoded soldier profile & logs from DB, derives calculated parameters via derive.py,
    encodes via datapipeline.py, runs ML models (Burnout, PSS, Strain, Welfare Incident),
    persists results to `ml_predictions` table, and toggles `is_high_risk` flag automatically.
    """
    profile = db.query(PersonnelProfile).filter(PersonnelProfile.id == personnel_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Personnel profile not found")

    duty_log = (
        db.query(DutyHRLog)
        .filter(DutyHRLog.personnel_id == personnel_id)
        .order_by(DutyHRLog.created_at.desc())
        .first()
    )
    vitals_log = (
        db.query(HealthVitalsLog)
        .filter(HealthVitalsLog.personnel_id == personnel_id)
        .order_by(HealthVitalsLog.created_at.desc())
        .first()
    )
    leave_rec = (
        db.query(LeaveRecord)
        .filter(LeaveRecord.personnel_id == personnel_id)
        .order_by(LeaveRecord.created_at.desc())
        .first()
    )
    who5_rec = (
        db.query(WHO5Assessment)
        .filter(WHO5Assessment.personnel_id == personnel_id)
        .order_by(WHO5Assessment.created_at.desc())
        .first()
    )
    cognitive_rec = (
        db.query(PVTCognitiveTest)
        .filter(PVTCognitiveTest.personnel_id == personnel_id)
        .order_by(PVTCognitiveTest.created_at.desc())
        .first()
    )
    discipline_rec = (
        db.query(IncidentDisciplineLog)
        .filter(IncidentDisciplineLog.personnel_id == personnel_id)
        .order_by(IncidentDisciplineLog.created_at.desc())
        .first()
    )

    # Assemble raw non-encoded dictionary from DB tables
    raw_db_dict = {
        # Personnel HR Profile (raw non-encoded)
        "personnel_id": profile.personnel_code,
        "unit_id": profile.unit_id,
        "rank": profile.rank,
        "service_years": profile.service_years,
        "age_band": profile.age_band,
        "accommodation_type": profile.accommodation_type,
        "deployment_zone": profile.deployment_zone,
        "hardship_category": profile.hardship_category,
        "days_deployed": profile.days_deployed,
        "days_in_hardship_A": profile.days_in_hardship_A,
        "zone_changes": profile.zone_changes,
        "distance_from_parent_unit_km": profile.distance_from_parent_unit_km,
        "rotation_notice_days": profile.rotation_notice_days,
        "posting_duration_days": profile.posting_duration_days,
        "welfare_record_access": profile.welfare_record_access,
        "device_consent_status": profile.device_consent_status,
        "self_report_consent": profile.self_report_consent,

        # Duty HR Logs
        "duty_hours": duty_log.duty_hours if duty_log else 40.0,
        "duty_days": duty_log.duty_days if duty_log else 5,
        "rest_days": duty_log.rest_days if duty_log else 2,
        "rest_interval_hours": duty_log.rest_interval_hours if duty_log else 12.0,
        "night_shift_count": duty_log.night_shift_count if duty_log else 0,
        "max_consec_night_shifts": duty_log.max_consec_night_shifts if duty_log else 0,
        "high_risk_duty_count": duty_log.high_risk_duty_count if duty_log else 0,
        "overtime_hours": duty_log.overtime_hours if duty_log else 0.0,
        "max_consec_duty_days": duty_log.max_consec_duty_days if duty_log else 5,
        "training_hours": duty_log.training_hours if duty_log else 0.0,
        "quick_turnaround_count": duty_log.quick_turnaround_count if duty_log else 0,

        # Health Vitals Logs
        "sleep_duration_hours": vitals_log.sleep_duration_hours if vitals_log else 7.0,
        "sleep_min_hours": vitals_log.sleep_min_hours if vitals_log else 6.0,
        "sleep_quality_score": vitals_log.sleep_quality_score if vitals_log else 7.0,
        "sleep_onset_time": vitals_log.sleep_onset_time if vitals_log else 23.0,
        "resting_heart_rate": vitals_log.resting_heart_rate if vitals_log else 65.0,
        "hrv_ms": vitals_log.hrv_ms if vitals_log else 55.0,
        "step_count": vitals_log.step_count if vitals_log else 8000.0,
        "mobility_radius_km": vitals_log.mobility_radius_km if vitals_log else 10.0,

        # Leave Records
        "leave_applications": leave_rec.leave_applications if leave_rec else 0,
        "leave_granted": leave_rec.leave_granted if leave_rec else 0,
        "leave_rejected": leave_rec.leave_rejected if leave_rec else 0,
        "leave_cancelled_after_approval": leave_rec.leave_cancelled_after_approval if leave_rec else 0,
        "leave_days_taken": leave_rec.leave_days_taken if leave_rec else 0,
        "emergency_leave_applications": leave_rec.emergency_leave_applications if leave_rec else 0,
        "days_notice_given": leave_rec.days_notice_given if leave_rec else 14,

        # WHO-5 Assessments
        "who5_score": who5_rec.who5_score if who5_rec else 15.0,
        "who5_assessment_due": 1 if (who5_rec and who5_rec.who5_assessment_due) else 0,
        "who5_response_status": who5_rec.who5_response_status if who5_rec else "Responded",

        # PVT Cognitive Test
        "pvt_trials": cognitive_rec.pvt_trials if cognitive_rec else 60,
        "pvt_response_speed": cognitive_rec.pvt_response_speed if cognitive_rec else 3.8,
        "pvt_mean_rt_ms": cognitive_rec.pvt_mean_rt_ms if cognitive_rec else 260.0,
        "pvt_lapses": cognitive_rec.pvt_lapses if cognitive_rec else 2.0,

        # Discipline & Administrative Logs
        "sick_report_days": discipline_rec.sick_report_days if discipline_rec else 0,
        "unplanned_absence_days": discipline_rec.unplanned_absence_days if discipline_rec else 0,
        "late_reporting_days": discipline_rec.late_reporting_days if discipline_rec else 0,
        "grievances_raised": discipline_rec.grievances_raised if discipline_rec else 0,
        "safety_lapses": discipline_rec.safety_lapses if discipline_rec else 0,
        "disciplinary_incidents": discipline_rec.disciplinary_incidents if discipline_rec else 0,
    }

    # Execute ML inference pipeline (raw dict -> derive.py -> datapipeline.py -> ml.py models)
    res = predict_vars(raw_db_dict)
    pred_dict = res.to_dict()

    # Determine high risk escalation
    is_high_risk = (
        res.welfare_incident == 1 or
        res.burnout_severity in ["High", "Critical"] or
        res.stress_level in ["High", "Severe"]
    )

    db_pred = MLPrediction(
        personnel_id=personnel_id,
        prediction_timestamp=datetime.utcnow(),
        welfare_incident=res.welfare_incident,
        welfare_risk_label=res.welfare_risk_label,
        pss_score=res.pss_score,
        pss_band=res.stress_level,
        stress_score_est=res.pss_score,
        stress_level=res.stress_level,
        burnout_score=res.burnout_score,
        burnout_severity=res.burnout_severity,
        strain_index=res.strain_index,
        strain_alert=res.strain_alert,
        strain_band=res.strain_alert,
        trend_flag="Stable",
        intervention_recommended="Peer Buddy Assignment" if is_high_risk else "No Action",
        is_high_risk=is_high_risk,
        created_at=datetime.utcnow()
    )

    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)

    return {
        "message": "Raw DB record derived, encoded & ML prediction saved successfully",
        "prediction_id": db_pred.id,
        "personnel_code": profile.personnel_code,
        "is_high_risk": is_high_risk,
        "ml_outputs": pred_dict
    }
