from typing import Optional
from pydantic import BaseModel, Field


class InterventionCreate(BaseModel):
    personnel_id: int
    prediction_id: Optional[int] = None
    action_type: str = Field(..., description="e.g. Peer Buddy Assignment, Workload Rebalancing, Priority Leave Grant, Counselling Referral, Unit Medical Referral, Immediate Welfare Escalation")
    notes: Optional[str] = None


class InterventionStatusUpdate(BaseModel):
    status: str = Field(..., description="Pending, In Progress, Completed, Escalated")
    notes: Optional[str] = None
