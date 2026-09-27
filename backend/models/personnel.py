from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.user import User
    from models.unit import Unit
    from models.duty_log import DutyHRLog
    from models.health_log import HealthVitalsLog
    from models.leave import LeaveRecord
    from models.cognitive_test import PVTCognitiveTest
    from models.who5_assessment import WHO5Assessment
    from models.discipline_log import IncidentDisciplineLog
    from models.ml_prediction import MLPrediction
    from models.intervention import Intervention


class PersonnelProfile(Base):
    __tablename__ = "personnel_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    unit_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("units.id", ondelete="CASCADE"), index=True, nullable=False
    )
    
    personnel_code: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )

    rank: Mapped[str] = mapped_column(String(50), nullable=False)
    service_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_band: Mapped[str] = mapped_column(String(20), nullable=False)
    accommodation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    deployment_zone: Mapped[str] = mapped_column(String(100), nullable=False)
    hardship_category: Mapped[str] = mapped_column(String(10), nullable=False)

    days_deployed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_in_hardship_A: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    zone_changes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_from_parent_unit_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rotation_notice_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    posting_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    welfare_record_access: Mapped[str] = mapped_column(String(20), default="Standard", nullable=False)
    device_consent_status: Mapped[str] = mapped_column(String(20), default="Not Enrolled", nullable=False)
    self_report_consent: Mapped[str] = mapped_column(String(20), default="Declined", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="personnel_profile")
    unit: Mapped["Unit"] = relationship("Unit", back_populates="personnel")

    duty_logs: Mapped[List["DutyHRLog"]] = relationship("DutyHRLog", back_populates="personnel")
    health_logs: Mapped[List["HealthVitalsLog"]] = relationship("HealthVitalsLog", back_populates="personnel")
    leave_records: Mapped[List["LeaveRecord"]] = relationship("LeaveRecord", back_populates="personnel")
    cognitive_tests: Mapped[List["PVTCognitiveTest"]] = relationship("PVTCognitiveTest", back_populates="personnel")
    who5_assessments: Mapped[List["WHO5Assessment"]] = relationship("WHO5Assessment", back_populates="personnel")
    incident_logs: Mapped[List["IncidentDisciplineLog"]] = relationship("IncidentDisciplineLog", back_populates="personnel")
    ml_predictions: Mapped[List["MLPrediction"]] = relationship("MLPrediction", back_populates="personnel")
    interventions: Mapped[List["Intervention"]] = relationship("Intervention", back_populates="personnel")
