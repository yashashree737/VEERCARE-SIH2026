from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.personnel import PersonnelProfile
    from models.intervention import Intervention


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    personnel_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("personnel_profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    
    prediction_timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True, nullable=False
    )

    burnout_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    burnout_band: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    burnout_severity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    strain_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    strain_band: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    strain_alert: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    pss_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pss_band: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    stress_score_est: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stress_band: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    stress_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    welfare_risk_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


    strain_flag: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stress_flag: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    strain_delta_from_baseline: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    strain_z_from_baseline: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_alert_flag: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    strain_trend_3w: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trend_flag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    intervention_recommended: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    baseline_duty_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_sleep_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_strain_mean: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_strain_sd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    welfare_incident: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    welfare_incident_next_week: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # High-Risk Flag: Unlocks visibility for Welfare Officers
    is_high_risk: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    personnel: Mapped["PersonnelProfile"] = relationship("PersonnelProfile", back_populates="ml_predictions")
    interventions: Mapped[List["Intervention"]] = relationship("Intervention", back_populates="prediction")
