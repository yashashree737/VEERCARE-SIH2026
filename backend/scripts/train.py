from sklearn.metrics import r2_score,root_mean_squared_error,mean_absolute_error,accuracy_score
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import HistGradientBoostingClassifier,HistGradientBoostingRegressor
import joblib 
data=pd.read_csv("datasets/cleaned_data2.csv")

model_welfare=HistGradientBoostingClassifier(
      loss="log_loss",
    learning_rate=0.1,
    max_iter=100,
    max_leaf_nodes=31,
    max_depth=None,
    min_samples_leaf=20,
    l2_regularization=0.0,
    random_state=None
)
model_pss=HistGradientBoostingRegressor(
    loss="squared_error",
    learning_rate=0.1,
    max_iter=100,
    max_leaf_nodes=31,
    max_depth=None,
    min_samples_leaf=20,
    l2_regularization=0.0,
    random_state=None
)
model_burnout=HistGradientBoostingRegressor(
    loss="squared_error",
    learning_rate=0.1,
    max_iter=100,
    max_leaf_nodes=31,
    max_depth=None,
    min_samples_leaf=20,
    l2_regularization=0.0,
    random_state=None
)
model_strin=HistGradientBoostingRegressor(
    loss="squared_error",
    learning_rate=0.1,
    max_iter=100,
    max_leaf_nodes=31,
    max_depth=None,
    min_samples_leaf=20,
    l2_regularization=0.0,
    random_state=None
)


# columns computed *from* a target -> leak the answer, drop them
LEAKY = [
    "pss_band",                 # pss_score binned
    "stress_score_est",         # filled estimate of pss_score
    "stress_band",              # stress_score_est binned
    "stress_flag",              # threshold on stress_band
    "burnout_band",             # burnout_score binned
    "who5_score",               # same construct as PSS, same week
    "intervention_recommended", # rule built on stress_band + strain_flag
]
X= data.drop(columns=[
    "welfare_incident_next_week",
    "pss_score",
    "burnout_score",
    "strain_index",
    *LEAKY,
])
Y_welfare=data["welfare_incident_next_week"]
Y_pss=data["pss_score"]
Y_burnout=data["burnout_score"]
Y_strain=data["strain_index"]

# personnel_id lives in the raw csv (dropped during cleaning); rows align 1:1
groups = pd.read_csv("datasets/data2.csv")["personnel_id"]

# one person-level split, reused for every model (no soldier in both train and test)
splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(splitter.split(X, groups=groups))

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
Y_welfare_train, Y_welfare_test = Y_welfare.iloc[train_idx], Y_welfare.iloc[test_idx]
Y_pss_train, Y_pss_test = Y_pss.iloc[train_idx], Y_pss.iloc[test_idx]
Y_burnout_train, Y_burnout_test = Y_burnout.iloc[train_idx], Y_burnout.iloc[test_idx]
Y_strain_train, Y_strain_test = Y_strain.iloc[train_idx], Y_strain.iloc[test_idx]



model_pss.fit(X_train,Y_pss_train)
model_burnout.fit(X_train,Y_burnout_train)
model_strin.fit(X_train,Y_strain_train)
model_welfare.fit(X_train,Y_welfare_train)




welfare_pred=model_welfare.predict(X_test)
welfare_acc=accuracy_score(Y_welfare_test,welfare_pred)
print("welfare accuracy",welfare_acc)


pss_pred=model_pss.predict(X_test)
pss_acc=r2_score(Y_pss_test,pss_pred)
pss_acc2=root_mean_squared_error(Y_pss_test,pss_pred)
pss_acc3=mean_absolute_error(Y_pss_test,pss_pred)
print("r2=",pss_acc,"root mean square=",pss_acc2,"mean_absolute_error=",pss_acc3)


burnout_pred=model_burnout.predict(X_test)
burnout_acc=r2_score(Y_burnout_test,burnout_pred)
burnout_acc2=root_mean_squared_error(Y_burnout_test,burnout_pred)
burnout_acc3=mean_absolute_error(Y_burnout_test,burnout_pred)
print("r2=",burnout_acc,"root mean square=",burnout_acc2,"mean_absolute_error=",burnout_acc3)


strain_pred=model_strin.predict(X_test)
strain_acc=r2_score(Y_strain_test,strain_pred)
strain_acc2=root_mean_squared_error(Y_strain_test,strain_pred)
strain_acc3=mean_absolute_error(Y_strain_test,strain_pred)
print("r2=",strain_acc,"root mean square=",strain_acc2,"mean_absolute_error=",strain_acc3)


joblib.dump(model_welfare,"model_welfare.joblib")
joblib.dump(model_pss,"model_pss.joblib")
joblib.dump(model_burnout,"model_burnout.joblib")
joblib.dump(model_strin,"model_strain.joblib")
joblib.dump(list(X.columns),"feature_columns.joblib")



