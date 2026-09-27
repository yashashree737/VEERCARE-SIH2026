from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.user import User
    from models.personnel import PersonnelProfile


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    unit_name: Mapped[str] = mapped_column(String(150), nullable=False)
    region_zone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    commander_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped[list["PersonnelProfile"]] = relationship("PersonnelProfile", back_populates="unit")
