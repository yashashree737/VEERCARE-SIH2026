from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.personnel import PersonnelProfile


class LeaveRecord(Base):
    __tablename__ = "leave_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    personnel_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("personnel_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )

    leave_applications: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    leave_granted: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    leave_rejected: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    leave_cancelled_after_approval: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    leave_days_taken: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    emergency_leave_applications: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)

    days_notice_given: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    days_since_last_leave: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_since_last_home_leave: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    consecutive_leave_rejections: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    rejection_rate_90d: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    days_since_last_granted: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped["PersonnelProfile"] = relationship("PersonnelProfile", back_populates="leave_records")
