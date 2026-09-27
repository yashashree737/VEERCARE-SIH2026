from typing import Union, Dict, List, Any
import pandas as pd

# Encoding maps matching dataset.py specifications
ENCODING_MAPS: Dict[str, Dict[str, int]] = {
    "age_band": {
        "21-25": 0,
        "26-30": 1,
        "31-35": 2,
        "36-45": 3,
        "46-55": 4,
    },
    "rank": {
        "Constable": 0,
        "Head Constable": 1,
        "Assistant Sub Inspector": 2,
        "Sub Inspector": 3,
        "Inspector": 4,
        "Assistant Commandant": 5,
    },
    "accommodation_type": {
        "Family Quarters": 0,
        "Unit Lines": 1,
        "Field Accommodation": 2,
    },
    "deployment_zone": {
        "Peace Station": 0,
        "Semi-Urban Deployment": 1,
        "Disaster Relief Operation": 2,
        "Field Area": 3,
        "High Altitude Area": 4,
        "Border Forward Post": 5,
        "Counter Insurgency Zone": 6,
    },
    "hardship_category": {
        "D": 0,
        "C": 1,
        "B": 2,
        "A": 3,
    },
    "who5_response_status": {
        "Not Due": 0,
        "Responded": 1,
        "Not Responded": 2,
    },
    "strain_band": {
        "Low": 0,
        "Moderate": 1,
        "High": 2,
        "Severe": 3,
    },
    "stress_band": {
        "Low": 0,
        "Moderate": 1,
        "High": 2,
        "Severe": 3,
    },
    "burnout_band": {
        "Low": 0,
        "Moderate": 1,
        "High": 2,
        "Critical": 3,
    },
    "pss_band": {
        "Low": 0,
        "Moderate": 1,
        "High": 2,
    },
    "welfare_record_access": {
        "Standard": 0,
        "Restricted": 1,
    },
    "device_consent_status": {
        "Consented": 1,
        "Not Enrolled": 0,
    },
    "self_report_consent": {
        "Consented": 1,
        "Declined": 0,
    },
    "trend_flag": {
        "Improving": 0,
        "Stable": 1,
        "Rising": 2,
    },
    "intervention_recommended": {
        "No Action": 0,
        "Peer Buddy Assignment": 1,
        "Workload Rebalancing": 2,
        "Priority Leave Grant": 3,
        "Counselling Referral": 4,
        "Unit Medical Referral": 5,
        "Immediate Welfare Escalation": 6,
    },
}

# Non-feature / identifier columns to drop during encoding if requested
ID_COLUMNS: List[str] = [
    "personnel_id",
    "unit_id",
    "resting_heart_rate",
    "hrv_ms",
    "step_count",
    "mobility_radius_km",
]


def encode_dataframe(df: pd.DataFrame, drop_ids: bool = False) -> pd.DataFrame:
    """
    Encode a Pandas DataFrame fetched from DB or Excel upload.
    
    Parameters:
        df (pd.DataFrame): Raw dataframe.
        drop_ids (bool): If True, drops ID columns.
        
    Returns:
        pd.DataFrame: Clean encoded dataframe ready for ML model prediction.
    """
    data = df.copy()

    if drop_ids:
        cols_to_drop = [c for c in ID_COLUMNS if c in data.columns]
        if cols_to_drop:
            data = data.drop(columns=cols_to_drop)

    for col, mapping in ENCODING_MAPS.items():
        if col in data.columns:
            # Map string values to ints; leave numeric or unmapped as is
            data[col] = data[col].map(lambda x: mapping.get(x, x) if isinstance(x, str) else x)

    return data


import sys
from pathlib import Path

# Import derive_personnel_ml_features from derive module
try:
    from derive import derive_personnel_ml_features
except ImportError:
    backend_root = Path(__file__).resolve().parent.parent
    if str(backend_root) not in sys.path:
        sys.path.append(str(backend_root))
    from derive import derive_personnel_ml_features


def process_db_records(records: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame], drop_ids: bool = False) -> pd.DataFrame:
    """
    Main entry point for DB / JSON data pipeline.
    Fetches raw non-encoded DB records, derives all computed parameters via derive.py,
    and returns an encoded DataFrame.
    """
    if isinstance(records, dict):
        derived_record = derive_personnel_ml_features(records)
        df = pd.DataFrame([derived_record])
    elif isinstance(records, list):
        derived_records = [derive_personnel_ml_features(r) for r in records]
        df = pd.DataFrame(derived_records)
    elif isinstance(records, pd.DataFrame):
        records_list = records.to_dict(orient="records")
        derived_records = [derive_personnel_ml_features(r) for r in records_list]
        df = pd.DataFrame(derived_records)
    else:
        raise ValueError(f"Unsupported record type: {type(records)}")

    return encode_dataframe(df, drop_ids=drop_ids)


if __name__ == "__main__":
    # Test script with raw DB / JSON payload
    raw_sample = {
        "personnel_id": "CRPF-2024-001",
        "rank": "Head Constable",
        "age_band": "26-30",
        "accommodation_type": "Field Accommodation",
        "deployment_zone": "High Altitude Area",
        "hardship_category": "A",
        "who5_response_status": "Responded",
        "strain_band": "Moderate",
        "trend_flag": "Rising",
        "duty_hours": 52.0,
        "sleep_duration_hours": 5.5,
    }

    print("--- Raw DB Sample ---")
    print(raw_sample)

    encoded_df = process_db_records(raw_sample)

    print("\n--- Encoded Data variable for ML Model ---")
    print(encoded_df.to_dict(orient="records")[0])
