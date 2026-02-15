# EV Monitoring & Predictive Maintenance Platform

A full-stack real-time EV charger fleet monitoring and predictive maintenance system built with FastAPI, Next.js, and machine learning.

This platform simulates EV charger telemetry, predicts failure risk using a trained Random Forest model, and provides live fleet analytics through an interactive dashboard.

---

## Overview

EV Monitoring is designed to demonstrate intelligent infrastructure monitoring for EV charging networks. The system combines real-time simulation, predictive analytics, and modern frontend visualization to provide operational insight into charger health and failure risk.

The platform includes:

- Real-time telemetry simulation
- Machine learning–based failure prediction
- Fleet-wide health aggregation
- WebSocket streaming for live updates
- Manual simulation tools for predictive testing

---

## Core Capabilities

- 🔄 Dynamic EV charger telemetry simulation
- 📊 Fleet health trend analysis (5-minute aggregation)
- ⚠️ Failure probability prediction with health scoring
- 📡 Real-time WebSocket data streaming
- 🧪 Manual charger simulation interface
- 📈 Fleet analytics dashboard
- 🛠 Maintenance priority classification system

---

## System Architecture

Frontend (Next.js + TailwindCSS + shadcn/ui)
↓
REST API + WebSockets
↓
Backend (FastAPI)
↓
Machine Learning Model (Random Forest - scikit-learn)

---

## 🖥 Tech Stack

### Backend
- FastAPI
- scikit-learn (Random Forest)
- Pandas
- Joblib
- WebSocket streaming
- JSON state persistence

### Frontend
- Next.js (App Router)
- TailwindCSS
- shadcn/ui
- Recharts
- Real-time polling + WebSocket integration

---

## 🔬 Machine Learning Model

The backend integrates a trained Random Forest classifier that:

- Processes real-time telemetry features
- Predicts failure probability
- Converts probability into a normalized health score (0–100)
- Assigns maintenance priority levels:
  - Healthy
  - Low
  - Medium
  - High
  - Emergency

**Health Score Formula**

health_score = (1 - failure_probability) * 100

---


---

## Installation

### 1️Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload
```

### API documentation will be available at:
http://localhost:8000/docs

### Frontend Setup

cd frontend
npm install
npm run dev

---

## Key API Endpoints

| Endpoint                  | Description                 |
| ------------------------- | --------------------------- |
| `/chargers/live`          | Live fleet health summary   |
| `/chargers/{id}`          | Charger details             |
| `/chargers/{id}/timeline` | Historical health timeline  |
| `/predict`                | Manual failure prediction   |
| `/ws/chargers/{id}`       | Real-time charger stream    |
| `/fleet/summary`          | Fleet-wide health breakdown |

## Simulation Engine

The backend includes a configurable simulation engine featuring:

Load modeling based on time-of-day patterns

Ambient and internal temperature drift

Voltage fluctuation modeling

Regime switching (Normal / Stress / Edge)

Configurable simulation intervals

Continuous health scoring

---

## Contributors

- [@4Anj](https://github.com/4Anj)
- [@Godspell07](https://github.com/Godspell07)
- [@4Anj](https://github.com/4Anj)
- [@Godspell07](https://github.com/Godspell07)

---

## License

Private repository under the Rotware-EV organization.
License to be determined upon public release.
