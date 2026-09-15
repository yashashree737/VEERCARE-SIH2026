from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.personnel import PersonnelProfile


class IncidentDisciplineLog(Base):
    __tablename__ = "incident_discipline_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    personnel_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("personnel_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )

    sick_report_days: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    unplanned_absence_days: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    late_reporting_days: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)

    grievances_raised: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    safety_lapses: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    disciplinary_incidents: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    support_request: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)

    days_since_last_intervention: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    interventions_90d: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    last_intervention_effective: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    workload_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cumulative_strain_load: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    critical_incident_this_week: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    critical_incidents_12m: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    days_since_critical_incident: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    transfers_12m: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped["PersonnelProfile"] = relationship("PersonnelProfile", back_populates="incident_logs")
