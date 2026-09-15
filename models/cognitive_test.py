from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.personnel import PersonnelProfile


class PVTCognitiveTest(Base):
    __tablename__ = "pvt_cognitive_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    personnel_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("personnel_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )

    cognitive_test_completed: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    pvt_trials: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_response_speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_mean_rt_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_lapses: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_false_starts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_fastest10_rt_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_slowest10_rt_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    baseline_pvt_lapses: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_pvt_response_speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_lapses_z: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pvt_speed_z: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    test_time_of_day: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    test_duration_s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    test_interrupted: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    test_effort_flag: Mapped[Optional[bool]] = mapped_column(Boolean, default=True, nullable=True)
    days_since_last_test: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped["PersonnelProfile"] = relationship("PersonnelProfile", back_populates="cognitive_tests")
