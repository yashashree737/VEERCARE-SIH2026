from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.personnel import PersonnelProfile


class HealthVitalsLog(Base):
    __tablename__ = "health_vitals_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    personnel_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("personnel_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    
    log_date: Mapped[Optional[date]] = mapped_column(Date, index=True, nullable=True)

    sleep_duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sleep_min_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_consec_nights_below_5h: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_debt_7d: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sleep_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sleep_onset_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sleep_timing_variability_7d: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    fatigue_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recovery_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    resting_heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hrv_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    step_count: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mobility_radius_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    baseline_sleep_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped["PersonnelProfile"] = relationship("PersonnelProfile", back_populates="health_logs")
