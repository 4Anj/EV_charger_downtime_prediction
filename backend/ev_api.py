from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import joblib
import pandas as pd
import threading
import time
import random
import json
import asyncio
from pathlib import Path
from typing import Dict
from datetime import datetime
from fastapi.responses import JSONResponse


BASE_DIR = Path(__file__).resolve().parent


MODEL_PATH = BASE_DIR / "ev_charger_failure_model.pkl"
FEATURES_PATH = BASE_DIR / "model_features.pkl"
STATE_FILE = BASE_DIR / "charger_state.json"

SIMULATION_MODE = "auto"  # auto | force_normal | force_stress | force_edge
SIMULATION_INTERVAL = 5  # seconds

AUTO_CHARGERS = [f"EV-{100+i}" for i in range(1, 22)]  # EV-101 → EV-121



rf = joblib.load(MODEL_PATH)
FEATURES = joblib.load(FEATURES_PATH)



def default_telemetry():
    return {
        "charger_output_voltage_V": 400.0,
        "charging_current_A": 50.0,
        "charging_power_kW": 20.0,
        "charger_load_kW": 18.0,
        "ambient_temperature_C": 30.0,
        "charger_internal_temperature_C": 45.0
    }



charger_state: Dict[str, dict] = {}

def normalize_charger_state():
    """
    Backward-compatible state migration.
    Ensures every charger has required fields.
    """
    for charger in charger_state.values():
        if "regime" not in charger:
            charger["regime"] = "normal"

        if "telemetry" not in charger:
            charger["telemetry"] = default_telemetry()

        if "history" not in charger:
            charger["history"] = []

if STATE_FILE.exists():
    charger_state = json.loads(STATE_FILE.read_text())
    normalize_charger_state()

def save_state():
    STATE_FILE.write_text(json.dumps(charger_state, indent=2))



app = FastAPI(
    title="EV Charger Predictive Maintenance API",
    version="5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ev-monitoring-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChargerCreate(BaseModel):
    charger_id: str = Field(..., example="EV-130")


def register_charger(cid: str):
    if cid in charger_state:
        return

    charger_state[cid] = {
        "charger_id": cid,
        "created_at": datetime.utcnow().isoformat(),
        "regime": "normal",
        "telemetry": default_telemetry(),
        "history": []
    }

for cid in AUTO_CHARGERS:
    register_charger(cid)

save_state()



def base_load_by_hour(hour):
    return 25 if 8 <= hour <= 11 or 17 <= hour <= 21 else 12

def maybe_switch_regime(charger):
    if SIMULATION_MODE != "auto":
        return

    r = random.random()
    current = charger["regime"]

    if current == "normal":
        if r < 0.03:
            charger["regime"] = "edge"
        elif r < 0.08:
            charger["regime"] = "stress"
    else:
        if r < 0.25:
            charger["regime"] = "normal"

def effective_regime(charger):
    if SIMULATION_MODE == "force_edge":
        return "edge"
    if SIMULATION_MODE == "force_stress":
        return "stress"
    if SIMULATION_MODE == "force_normal":
        return "normal"
    return charger["regime"]

def update_telemetry(charger):
    t = charger["telemetry"]
    regime = effective_regime(charger)

    t["ambient_temperature_C"] = max(
        15, min(t["ambient_temperature_C"] + random.uniform(-0.1, 0.1), 50)
    )

    base = base_load_by_hour(datetime.utcnow().hour)

    if regime == "normal":
        drift, target = random.uniform(-0.8, 0.8), base
    elif regime == "stress":
        drift, target = random.uniform(0.5, 1.2), base * 1.15
    else:
        drift, target = random.uniform(1.5, 2.5), base * 1.45

    t["charger_load_kW"] = max(
        0, min(t["charger_load_kW"] + drift + 0.04 * (target - t["charger_load_kW"]), 40)
    )

    voltage = t["charger_output_voltage_V"]
    load = t["charger_load_kW"]

    voltage += random.uniform(-3, 3) - 0.015 * load + 0.08 * (400 - voltage)
    t["charger_output_voltage_V"] = max(360, min(voltage, 440))

    t["charging_current_A"] = (load * 1000) / t["charger_output_voltage_V"]
    t["charging_power_kW"] = (t["charger_output_voltage_V"] * t["charging_current_A"] * 0.95) / 1000

    heat_gen = 0.04 * t["charging_power_kW"] * (1.25 if regime == "edge" else 1.0)
    heat_loss = 0.02 * (t["charger_internal_temperature_C"] - t["ambient_temperature_C"])

    t["charger_internal_temperature_C"] = max(
        t["ambient_temperature_C"],
        min(t["charger_internal_temperature_C"] + heat_gen - heat_loss, 105)
    )


def classify_priority(health):
    if health < 30:
        return "Emergency"
    if health < 80:
        return "High"
    if health < 86:
        return "Medium"
    if health < 90:
        return "Low"
    return "Healthy"

def run_prediction(charger):
    df = pd.DataFrame([charger["telemetry"]])[FEATURES]
    risk = rf.predict(df)[0]
    health = max(0, min(100, (1 - risk) * 100))

    charger["history"].append({
        "timestamp": datetime.utcnow().isoformat(),
        "predicted_failure_risk": round(float(risk), 4),
        "charger_health_score": round(float(health), 2),
        "maintenance_priority": classify_priority(health)
    })


def simulation_loop():
    while True:
        for charger in charger_state.values():
            maybe_switch_regime(charger)
            update_telemetry(charger)
            run_prediction(charger)
        save_state()
        time.sleep(SIMULATION_INTERVAL)

@app.on_event("startup")
def start_simulation():
    threading.Thread(target=simulation_loop, daemon=True).start()



@app.get("/health")
def health():
    return {"status": "ok", "chargers": len(charger_state)}

@app.post("/chargers")
def add_charger(data: ChargerCreate):
    cid = data.charger_id.strip()
    if not cid or cid in charger_state:
        raise HTTPException(status_code=400, detail="Invalid or existing charger")

    register_charger(cid)
    save_state()
    return {"status": "created", "charger_id": cid}

@app.get("/chargers/exists/{charger_id}")
def charger_exists(charger_id: str):
    return {"exists": charger_id in charger_state}

@app.get("/chargers/live")
def chargers_live():
    out = []
    for c in charger_state.values():
        latest = c["history"][-1] if c["history"] else None
        out.append({
            "charger_id": c["charger_id"],
            "health_score": latest["charger_health_score"] if latest else None,
            "maintenance_priority": latest["maintenance_priority"] if latest else "No data",
            "failure_risk": latest["predicted_failure_risk"] if latest else None,
            "last_updated": latest["timestamp"] if latest else None
        })
    return out

@app.get("/chargers/{charger_id}")
def get_charger(charger_id: str):
    charger = charger_state.get(charger_id)
    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    return charger

@app.get("/chargers/{charger_id}/timeline")
def timeline(charger_id: str):
    charger = charger_state.get(charger_id)
    if not charger:
        raise HTTPException(status_code=404)

    history = charger["history"][-50:]
    return {
        "timestamps": [h["timestamp"] for h in history],
        "health_score": [h["charger_health_score"] for h in history],
        "failure_risk": [h["predicted_failure_risk"] for h in history]
    }

@app.get("/fleet/summary")
def fleet_summary():
    latest = [c["history"][-1] for c in charger_state.values() if c["history"]]
    return {
        "total_chargers": len(charger_state),
        "emergency": sum(h["charger_health_score"] < 30 for h in latest),
        "high": sum(30 <= h["charger_health_score"] < 80 for h in latest),
        "medium": sum(50 <= h["charger_health_score"] < 86 for h in latest),
        "healthy": sum(h["charger_health_score"] >= 87 for h in latest),
    }

@app.post("/simulation/mode/{mode}")
def set_mode(mode: str):
    global SIMULATION_MODE
    SIMULATION_MODE = mode
    return {"simulation_mode": mode}

@app.get("/fleet/logs")
def download_fleet_logs():
    """
    Returns full fleet logs (all charger histories).
    """
    return JSONResponse(
        content={
            "generated_at": datetime.utcnow().isoformat(),
            "chargers": charger_state
        }
    )

class PredictRequest(BaseModel):
    charger_output_voltage_V: float
    charging_current_A: float
    charging_power_kW: float
    charger_load_kW: float
    ambient_temperature_C: float
    charger_internal_temperature_C: float

@app.post("/predict")
def predict_manual(data: PredictRequest):
    """
    Manual prediction endpoint (NO charger, NO simulation)
    Used for preview dashboards
    """
    df = pd.DataFrame([data.dict()])[FEATURES]

    risk = float(rf.predict(df)[0])
    health = max(0, min(100, (1 - risk) * 100))

    return {
        "predicted_failure_risk": round(risk, 4),
        "charger_health_score": round(health, 2),
        "maintenance_priority": classify_priority(health),
    }




@app.websocket("/ws/chargers/{charger_id}")
async def charger_ws(websocket: WebSocket, charger_id: str):
    await websocket.accept()

    if charger_id not in charger_state:
        await websocket.send_json({"error": "Invalid charger ID"})
        await websocket.close()
        return

    try:
        while True:
            charger = charger_state[charger_id]
            latest = charger["history"][-1] if charger["history"] else None

            payload = {
                "charger_id": charger_id,
                "timestamp": datetime.utcnow().isoformat(),
                "telemetry": charger["telemetry"],
                "health": {
                    "risk": latest["predicted_failure_risk"] if latest else None,
                    "health_score": latest["charger_health_score"] if latest else None,
                    "priority": latest["maintenance_priority"] if latest else None,
                },
                "regime": charger["regime"],
            }

            await websocket.send_json(payload)
            await asyncio.sleep(SIMULATION_INTERVAL)

    except WebSocketDisconnect:
        print(f"[WS] Disconnected: {charger_id}")
