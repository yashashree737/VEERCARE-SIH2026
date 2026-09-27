from typing import Optional
from pydantic import BaseModel


class MLPredictSampleInput(BaseModel):
    rank: str = "Head Constable"
    age_band: str = "26-30"
    accommodation_type: str = "Field Accommodation"
    deployment_zone: str = "High Altitude Area"
    hardship_category: str = "A"
    duty_hours: float = 52.0
    sleep_duration_hours: float = 5.5
    who5_response_status: Optional[str] = "Responded"
    strain_band: Optional[str] = "Moderate"
    trend_flag: Optional[str] = "Rising"


class MLPredictResponse(BaseModel):
    welfare_incident: int
    welfare_risk_label: str
    pss_score: float
    stress_level: str
    burnout_score: float
    burnout_severity: str
    strain_index: float
    strain_alert: str
