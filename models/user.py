from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.unit import Unit
    from models.personnel import PersonnelProfile


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Supabase Auth user ID (made optional)
    supabase_user_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=True
    )

    # Password auth
    hashed_password: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )


    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    last_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    # Roles: 'soldier', 'commander', 'hr_officer', 'welfare_officer'
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    unit_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("units.id", ondelete="SET NULL"),
        nullable=True
    )

    profile_photo: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    personnel_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        nullable=True
    )

    unit: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user_unit: Mapped[Optional["Unit"]] = relationship("Unit", foreign_keys=[unit_id])
    personnel_profile: Mapped[Optional["PersonnelProfile"]] = relationship(
        "PersonnelProfile", back_populates="user", uselist=False
    )