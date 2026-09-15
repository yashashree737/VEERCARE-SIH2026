from typing import Optional
from pydantic import BaseModel, Field


class DutyLogUpdate(BaseModel):
    duty_hours: Optional[float] = Field(None, ge=0.0, le=168.0)
    duty_days: Optional[int] = Field(None, ge=0, le=7)
    rest_days: Optional[int] = Field(None, ge=0, le=7)
    night_shift_count: Optional[int] = Field(None, ge=0)
    overtime_hours: Optional[float] = Field(None, ge=0.0)
    quick_turnaround_count: Optional[int] = Field(None, ge=0)


class LeaveUpdate(BaseModel):
    status: str = Field(..., description="'Approved' or 'Rejected'")
    notes: Optional[str] = None
