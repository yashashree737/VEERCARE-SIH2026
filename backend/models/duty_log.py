from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.personnel import PersonnelProfile
    from models.user import User


class DutyHRLog(Base):
    __tablename__ = "duty_hr_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    personnel_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("personnel_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    
    week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    log_date: Mapped[Optional[date]] = mapped_column(Date, index=True, nullable=True)

    duty_hours: Mapped[float] = mapped_column(Float, nullable=False)
    duty_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rest_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rest_interval_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    night_shift_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_consec_night_shifts: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    high_risk_duty_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    overtime_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_consec_duty_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    training_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quick_turnaround_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    baseline_duty_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    updated_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped["PersonnelProfile"] = relationship("PersonnelProfile", back_populates="duty_logs")
    updated_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by_user_id])
