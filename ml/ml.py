import joblib
import pandas as pd

model_welfare = joblib.load("model_welfare.joblib")
model_pss = joblib.load("model_pss.joblib")
model_burnout = joblib.load("model_burnout.joblib")
model_strain = joblib.load("model_strain.joblib")
feature_columns = joblib.load("feature_columns.joblib")


def predict(sample: dict):
    # align sample dict to the exact training column order
    X = pd.DataFrame([sample], columns=feature_columns)
    return {
        "welfare_incident_next_week": int(model_welfare.predict(X)[0]),
        "pss_score": float(model_pss.predict(X)[0]),
        "burnout_score": float(model_burnout.predict(X)[0]),
        "strain_index": float(model_strain.predict(X)[0]),
    }


if __name__ == "__main__":
    # sample input: every training feature; unknown values -> None (models handle NaN)
    sample = {c: None for c in feature_columns}
    print(predict(sample))
