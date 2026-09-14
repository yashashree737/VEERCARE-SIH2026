import pandas as pd
import matplotlib.pyplot as plt

data=pd.read_csv("data2.csv")

data.info(verbose=True, show_counts=True)
print(data["personnel_id"].unique())
print(data["unit_id"].unique())
print(data["rank"].unique())
print(data["age_band"].unique())
print(data["accommodation_type"].unique())
print(data["deployment_zone"].unique())
print(data["hardship_category"].unique())
print(data["who5_response_status"].unique())
print(data["burnout_band"].unique())
print(data["welfare_record_access"].unique())
print(data["device_consent_status"].unique())
print(data["self_report_consent"].unique())
print(data["strain_band"].unique())
print(data["pss_band"].unique())
print(data["stress_band"].unique())
print(data["trend_flag"].unique())
print(data["intervention_recommended"].unique())
data = data.drop("personnel_id",axis=1)
data=data.drop("unit_id",axis=1)




#================ encoding data==================





rank_map = {
    '21-25': 0,
    '26-30': 1,
    '31-35': 2,
    '36-45': 3,
    '46-55': 4
}
data["age_band"]= data["age_band"].map(rank_map)

# rank: junior -> senior
data["rank"] = data["rank"].map({
    'Constable': 0,
    'Head Constable': 1,
    'Assistant Sub Inspector': 2,
    'Sub Inspector': 3,
    'Inspector': 4,
    'Assistant Commandant': 5,
})

# accommodation: comfortable -> field hardship
data["accommodation_type"] = data["accommodation_type"].map({
    'Family Quarters': 0,
    'Unit Lines': 1,
    'Field Accommodation': 2,
})

# deployment zone: peace -> high risk
data["deployment_zone"] = data["deployment_zone"].map({
    'Peace Station': 0,
    'Semi-Urban Deployment': 1,
    'Disaster Relief Operation': 2,
    'Field Area': 3,
    'High Altitude Area': 4,
    'Border Forward Post': 5,
    'Counter Insurgency Zone': 6,
})

# hardship category: D (least) -> A (most)
data["hardship_category"] = data["hardship_category"].map({'D': 0, 'C': 1, 'B': 2, 'A': 3})

# who5 response: not due -> responded -> not responded (rising concern)
data["who5_response_status"] = data["who5_response_status"].map({
    'Not Due': 0, 'Responded': 1, 'Not Responded': 2,
})

# 4-level severity bands
sev4 = {'Low': 0, 'Moderate': 1, 'High': 2, 'Severe': 3}
data["strain_band"] = data["strain_band"].map(sev4)
data["stress_band"] = data["stress_band"].map(sev4)
data["burnout_band"] = data["burnout_band"].map({'Low': 0, 'Moderate': 1, 'High': 2, 'Critical': 3})

# pss band: Low -> High (nan stays nan)
data["pss_band"] = data["pss_band"].map({'Low': 0, 'Moderate': 1, 'High': 2})

# access / consent binaries
data["welfare_record_access"] = data["welfare_record_access"].map({'Standard': 0, 'Restricted': 1})
data["device_consent_status"] = data["device_consent_status"].map({'Consented': 1, 'Not Enrolled': 0})
data["self_report_consent"] = data["self_report_consent"].map({'Consented': 1, 'Declined': 0})

# strain trend: improving -> stable -> rising (rising = worse)
data["trend_flag"] = data["trend_flag"].map({'Improving': 0, 'Stable': 1, 'Rising': 2})

# recommended intervention: escalating severity
data["intervention_recommended"] = data["intervention_recommended"].map({
    'No Action': 0,
    'Peer Buddy Assignment': 1,
    'Workload Rebalancing': 2,
    'Priority Leave Grant': 3,
    'Counselling Referral': 4,
    'Unit Medical Referral': 5,
    'Immediate Welfare Escalation': 6,
})
data.info(verbose=True , show_counts=True)
data.to_csv("cleaned_data.csv",index=False)


data.isnull()