from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib

import pandas as pd

MODEL_PATH = r"C:\Users\anjan\Downloads\EV_downtime_prediction\ev_charger_failure_model.pkl"
FEATURES_PATH = r"C:\Users\anjan\Downloads\EV_downtime_prediction\model_features.pkl"

rf = joblib.load(MODEL_PATH)
FEATURES = joblib.load(FEATURES_PATH)
print("MODEL TYPE:", type(rf))

app = FastAPI(
    title="EV Charger Downtime Prediction API",
    version="1.0"
)

class ChargerInput(BaseModel):
    charger_output_voltage_V: float = Field(..., ge=100, le=1000, example=230)
    charging_current_A: float = Field(..., ge=0, le=500, example=28)
    charging_power_kW: float = Field(..., ge=0, le=500, example=6.5)
    charger_load_kW: float = Field(..., ge=0, le=500, example=6.8)
    ambient_temperature_C: float = Field(..., ge=-20, le=60, example=32)
    charger_internal_temperature_C: float = Field(..., ge=-20, le=120, example=54)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": True,
        "num_features": len(FEATURES)
    }

@app.post("/predict")
def predict_failure(input: ChargerInput):
    payload=input.model_dump()

    missing = set(FEATURES) - set(payload.keys())
    if missing:
        return {"error": f"Missing input fields: {missing}"}

    input_df = pd.DataFrame([payload])[FEATURES]
    print("INPUT DF:")
    print(input_df)
    print("DTYPES:")
    print(input_df.dtypes)
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
        "predicted_failure_risk": round(float(risk), 4),
        "charger_health_score": round(float(health), 2),
        "maintenance_priority": priority,
        "alert_24h": bool(risk >= 0.25),
        "alert_48h": bool(risk >= 0.20),
        "alert_72h": bool(risk >= 0.15)
    }

    


