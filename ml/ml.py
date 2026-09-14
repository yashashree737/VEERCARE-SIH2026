from pathlib import Path
import joblib
import pandas as pd
import shap
try:
    from ml.datapipeline import process_db_records, encode_sample
except ModuleNotFoundError:
    from datapipeline import process_db_records, encode_sample

BASE_DIR = Path(__file__).resolve().parent

model_welfare = joblib.load(BASE_DIR / "model_welfare.joblib")
model_pss = joblib.load(BASE_DIR / "model_pss.joblib")
model_burnout = joblib.load(BASE_DIR / "model_burnout.joblib")
model_strain = joblib.load(BASE_DIR / "model_strain.joblib")
feature_columns = joblib.load(BASE_DIR / "feature_columns.joblib")


def predict(sample: dict):
    # Process and encode raw DB/JSON sample record
    encoded_dict = encode_sample(sample)
    
    # Align sample dict to the exact training column order
    X = pd.DataFrame([encoded_dict], columns=feature_columns)
    return {
        "welfare_incident_next_week": int(model_welfare.predict(X)[0]),
        "pss_score": float(model_pss.predict(X)[0]),
        "burnout_score": float(model_burnout.predict(X)[0]),
        "strain_index": float(model_strain.predict(X)[0]),
    }


def predict_batch(records):
    # Process and encode bulk records (list of dicts or DataFrame)
    encoded_df = process_db_records(records)
    X = encoded_df.reindex(columns=feature_columns)
    
    results = pd.DataFrame({
        "welfare_incident_next_week": model_welfare.predict(X),
        "pss_score": model_pss.predict(X),
        "burnout_score": model_burnout.predict(X),
        "strain_index": model_strain.predict(X),
    })
    return results.to_dict(orient="records")


if __name__ == "__main__":
    # Sample input with raw string values fetched from DB/frontend
    raw_sample = {
        "rank": "Head Constable",
        "age_band": "26-30",
        "accommodation_type": "Field Accommodation",
        "deployment_zone": "High Altitude Area",
        "hardship_category": "A",
        "duty_hours": 52.0,
        "sleep_duration_hours": 5.5,
    }
    print("Prediction Result:")
    print(predict(raw_sample))
