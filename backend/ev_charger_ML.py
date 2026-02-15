import pandas as pd
import numpy as np
import shap
import joblib
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
from pathlib import Path



BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = BASE_DIR / "EV_Charger_Downtime_Final_ML_Dataset.xlsx"

df = pd.read_excel(DATA_PATH)
df = df.sort_values(["charger_id", "timestamp"])

FEATURES = [
    "charger_output_voltage_V",
    "charging_current_A",
    "charging_power_kW",
    "charger_load_kW",
    "ambient_temperature_C",
    "charger_internal_temperature_C"
]

TARGET = "failure_probability"

X = df[FEATURES]
y = df[TARGET]

split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test  = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test  = y.iloc[split_index:]

rf = RandomForestRegressor(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=20,
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train, y_train)

y_pred = rf.predict(X_test)

print("MAE :", mean_absolute_error(y_test, y_pred))
rmse = mean_squared_error(y_test, y_pred) ** 0.5
print("RMSE:", rmse)
print("R²  :", r2_score(y_test, y_pred))

importance = pd.Series(
    rf.feature_importances_,
    index=FEATURES
).sort_values(ascending=False)

print("\nTop 10 features:")
print(importance.head(10))

# Predict continuous failure risk
df["predicted_failure_risk"] = rf.predict(df[FEATURES])

# Convert to health score
df["charger_health_score"] = (
    (1 - df["predicted_failure_risk"]) * 100
).clip(0, 100)

# Maintenance priority
df["maintenance_priority"] = pd.cut(
    df["charger_health_score"],
    bins=[0, 30, 50, 70, 90, 100],
    labels=["Emergency", "High", "Medium", "Low", "Healthy"]
)

# Alert windows
df["alert_24h"] = (df["predicted_failure_risk"] >= 0.65).astype(int)
df["alert_48h"] = (df["predicted_failure_risk"] >= 0.45).astype(int)
df["alert_72h"] = (df["predicted_failure_risk"] >= 0.30).astype(int)

joblib.dump(rf, r"/home/rayan/Projects/ev_downtime/backend/ev_charger_failure_model.pkl")
joblib.dump(FEATURES, r"/home/rayan/Projects/ev_downtime/backend/model_features.pkl")

#Shap Analysis
explainer = shap.TreeExplainer(rf)
X_sample = X.sample(2000, random_state=42)

shap_values = explainer.shap_values(X_sample)

shap.summary_plot(
    shap_values,
    X_sample,
    plot_type="dot"
)

shap.summary_plot(
    shap_values,
    X_sample,
    plot_type="bar"
)

def predict_charger_risk(input_df):
    risk = rf.predict(input_df)[0]
    health = max(0, min(100, (1 - risk) * 100))

    if health < 30:
        priority = "Emergency"
    elif health < 50:
        priority = "High"
    elif health < 70:
        priority = "Medium"
    elif health < 90:
        priority = "Low"
    else:
        priority = "Healthy"

    return {
        "predicted_failure_risk": float(risk),
        "charger_health_score": float(health),
        "maintenance_priority": priority,
        "alert_24h": int(risk >= 0.65),
        "alert_48h": int(risk >= 0.45),
        "alert_72h": int(risk >= 0.30)
    }

