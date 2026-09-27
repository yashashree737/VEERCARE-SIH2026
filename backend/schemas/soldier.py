from typing import Optional
from pydantic import BaseModel, Field


class WHO5Create(BaseModel):
    q1_cheerful: int = Field(..., ge=0, le=5, description="Score 0-5")
    q2_calm: int = Field(..., ge=0, le=5, description="Score 0-5")
    q3_active: int = Field(..., ge=0, le=5, description="Score 0-5")
    q4_fresh: int = Field(..., ge=0, le=5, description="Score 0-5")
    q5_interests: int = Field(..., ge=0, le=5, description="Score 0-5")


class VitalsCreate(BaseModel):
    sleep_duration_hours: float = Field(..., ge=0.0, le=24.0)
    resting_heart_rate: Optional[float] = Field(None, ge=30.0, le=220.0)
    hrv_ms: Optional[float] = Field(None, ge=0.0)
    step_count: Optional[float] = Field(None, ge=0.0)
    mobility_radius_km: Optional[float] = Field(None, ge=0.0)
