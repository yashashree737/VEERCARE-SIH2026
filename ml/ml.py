from pathlib import Path
import joblib
import pandas as pd

try:
    from ml.datapipeline import process_db_records
except ModuleNotFoundError:
    from datapipeline import process_db_records

BASE_DIR = Path(__file__).resolve().parent

# Load models into RAM at module startup
model_welfare = joblib.load(BASE_DIR / "model_welfare.joblib")
model_pss = joblib.load(BASE_DIR / "model_pss.joblib")
model_burnout = joblib.load(BASE_DIR / "model_burnout.joblib")
model_strain = joblib.load(BASE_DIR / "model_strain.joblib")
feature_columns = joblib.load(BASE_DIR / "feature_columns.joblib")


class PredictionResult:
    """Unpacks ML outputs into accessible variables and severity labels."""
    def __init__(self, raw: dict):
        self.welfare_incident = int(raw["welfare_incident_next_week"])
        self.pss_score = round(float(raw["pss_score"]), 2)
        self.burnout_score = round(float(raw["burnout_score"]), 2)
        self.strain_index = round(float(raw["strain_index"]), 2)

        # Derived human-readable risk labels
        self.welfare_risk_label = "High Risk (Escalation Needed)" if self.welfare_incident == 1 else "Normal / Stable"
        self.burnout_severity = (
            "Critical" if self.burnout_score >= 75.0 else
            "High" if self.burnout_score >= 50.0 else
            "Moderate" if self.burnout_score >= 25.0 else "Low"
        )
        self.stress_level = (
            "Severe" if self.pss_score >= 27.0 else
            "High" if self.pss_score >= 18.0 else
            "Moderate" if self.pss_score >= 14.0 else "Low"
        )
        self.strain_alert = "Elevated Strain" if self.strain_index >= 50.0 else "Normal Strain"

    def to_dict(self) -> dict:
        """Returns all unpacked variables as a clean Python dictionary."""
        return {
            "welfare_incident": self.welfare_incident,
            "welfare_risk_label": self.welfare_risk_label,
            "pss_score": self.pss_score,
            "stress_level": self.stress_level,
            "burnout_score": self.burnout_score,
            "burnout_severity": self.burnout_severity,
            "strain_index": self.strain_index,
            "strain_alert": self.strain_alert,
        }


def predict_vars(sample: dict) -> PredictionResult:
    """Runs ML models and returns structured PredictionResult object."""
    X = process_db_records(sample).reindex(columns=feature_columns)
    raw = {
        "welfare_incident_next_week": model_welfare.predict(X)[0],
        "pss_score": model_pss.predict(X)[0],
        "burnout_score": model_burnout.predict(X)[0],
        "strain_index": model_strain.predict(X)[0],
    }
    return PredictionResult(raw)


def predict(sample: dict) -> dict:
    """Runs ML models and returns dictionary for API responses."""
    return predict_vars(sample).to_dict()


def predict_batch(records) -> list:
    """Runs vectorized predictions on bulk records."""
    X = process_db_records(records).reindex(columns=feature_columns)
    welfare = model_welfare.predict(X)
    pss = model_pss.predict(X)
    burnout = model_burnout.predict(X)
    strain = model_strain.predict(X)

    return [
        PredictionResult({
            "welfare_incident_next_week": welfare[i],
            "pss_score": pss[i],
            "burnout_score": burnout[i],
            "strain_index": strain[i],
        }).to_dict()
        for i in range(len(X))
    ]


if __name__ == "__main__":
    raw_sample = {
        "rank": "Head Constable",
        "age_band": "26-30",
        "accommodation_type": "Field Accommodation",
        "deployment_zone": "High Altitude Area",
        "hardship_category": "A",
        "duty_hours": 52.0,
        "sleep_duration_hours": 5.5,
    }
    res = predict_vars(raw_sample)
    print("Burnout Score:", res.burnout_score)
    print("Burnout Severity:", res.burnout_severity)
    print("Full Dict:", res.to_dict())
