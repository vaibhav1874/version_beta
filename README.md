# 🚨 Project JEEVAN

**AI-Assisted Multi-Hazard Emergency Intelligence & Response Coordination Platform**

JEEVAN is an emergency management and intelligence platform designed to help urban communities, municipal operators, and emergency services report, track, assess, and coordinate responses to multi-hazard crises — urban flooding, fires, severe weather/fallen trees, and road accidents.

---

## 🎯 Supported Hazard Categories

| Hazard | Category Key | Visual Signal | Example Emergencies |
|---|---|---|---|
| 🌊 **Flooding & Urban Waterlogging** | `flood` | Cyan Marker (`#0ea5e9`) | Submerged roads, trapped underpass vehicles, overflowing drains |
| 🔥 **Fires & Smoke Reports** | `fire` | Orange Marker (`#ea580c`) | Commercial complex fires, HVAC short circuits, LPG leaks |
| 🌪️ **Severe Weather & Fallen Trees** | `severe_weather` | Amber Marker (`#d97706`) | Uprooted trees, impassable arterial roads, live snapped power lines |
| 🚗 **Road Accidents** | `road_accident` | Rose Marker (`#e11d48`) | Multi-vehicle pileups, hazardous diesel leaks, traffic gridlock |

> **Architecture Principle:** Project JEEVAN is built with modular hazard adapters. It avoids claiming that a single generic black-box model can predict or handle every disaster, ensuring domain-specific rule assessment.

---

## 🏗️ Technology Architecture

```
[ Citizen / Sensor Report ]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite Frontend                 │
│  • Leaflet + OpenStreetMap Interactive Geospatial Map  │
│  • Real-time Incident Feed & Custom Hazard Markers     │
│  • AI Photo Suggestion & Real-Time Duplicate Warning   │
│  • Response Coordination & Dispatch Inspector          │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST (/api)
                           ▼
┌────────────────────────────────────────────────────────┐
│  FastAPI (Python) Backend                              │
│  • SQLite via SQLAlchemy 2.0 ORM                       │
│  • Static Evidence File Serving (/uploads)             │
│  • Multi-Tier Automated AI Engine:                     │
│    ├── Image Hazard Classifier (Visual Signals)        │
│    ├── Spatial & Lexical Duplicate Detector            │
│    └── Explainable Category-Specific Priority Rules    │
│  • Repeatable Demo Simulation Scenario Engine          │
└────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Features & Ethical Principles

All AI outputs are **strictly preliminary decision aids** and are subject to human review:

| Feature | Engine | How It Works | Ethical Guardrail |
|---|---|---|---|
| **Category Suggestion** | Visual chromatic & texture extraction | Analyzes uploaded photos and suggests top hazard category with confidence score | Always editable with one-click "Apply" button; never overrides human choice |
| **Duplicate Detection** | Haversine distance + character n-grams | Compares reports within 500m radius and 48-hour window for lexical and spatial overlap | Flags duplicates as `ai_duplicate_of_id` with match percentage without silencing citizen voices |
| **Explainable Priority** | Category-specific rule evaluation | Assigns 1-10 priority score based on submersion depth, trapped victims, power lines, and transit proximity | Provides transparent bullet-point rationale so dispatchers audit every score |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.14 fully supported)
- **Node.js 18+**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/vaibhav1874/version_beta.git
cd version_beta
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
py -m venv venv          # On Windows
# python3 -m venv venv   # On macOS/Linux

# Activate virtual environment
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --host 127.0.0.1 --port 8000
```
Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```
The application dashboard will be live at: `http://localhost:5173`

---

## 🧪 Testing & Verification

Project JEEVAN includes automated integration and unit test coverage for all endpoints, AI engines, and simulation workflows.

```bash
cd backend
.\venv\Scripts\pytest.exe -v
```
**Results:** `17 passed, 0 failed` across:
- `tests/test_incidents.py`: CRUD, image upload, filtering, archiving, timeline.
- `tests/test_ai.py`: Priority rules for all 4 categories, Haversine distance, text similarity, duplicate detection.
- `tests/test_simulation.py`: Scenario seeding, data provenance tags (`source="simulation"`), and reset.

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/incidents` | Create a new incident report (auto-triggers AI analysis) |
| `GET` | `/api/incidents` | List incidents with category, severity, status, and source filters |
| `GET` | `/api/incidents/{id}` | Retrieve incident details |
| `PATCH` | `/api/incidents/{id}` | Update verification, severity, status, or AI fields |
| `DELETE` | `/api/incidents/{id}` | Archive an incident |
| `POST` | `/api/incidents/upload-image` | Upload photo evidence (returns `/uploads/...` URL) |
| `POST` | `/api/responders` | Register an emergency responder unit |
| `GET` | `/api/responders` | List available responder units |
| `POST` | `/api/incidents/{id}/assign` | Dispatch a responder unit to an incident |
| `GET` | `/api/incidents/{id}/timeline` | Retrieve chronological audit timeline |
| `POST` | `/api/ai/classify-image` | Suggest category from image with confidence |
| `POST` | `/api/ai/check-duplicates` | Check if a report duplicates a recent nearby incident |
| `POST` | `/api/ai/assess-priority` | Evaluate explainable priority score (1-10) |
| `POST` | `/api/simulation/seed` | Seed repeatable multi-hazard demo scenario |
| `POST` | `/api/simulation/reset` | Clear simulation scenario records |

---

## ⚡ 5-Minute Demonstration Walkthrough

For hackathon judges and evaluators, see the complete step-by-step walkthrough in [docs/demo_guide.md](docs/demo_guide.md):
1. Launch app at `http://localhost:5173`.
2. Click **`⚡ Demo Scenario`** in the top navbar to load 5 multi-hazard incidents and 5 emergency units.
3. Select an incident to observe the **Explainable Priority Breakdown** and **Duplicate Detection Alerts**.
4. Test **Response Coordination**: mark incident as verified and deploy an emergency unit.
5. Click **`🚨 Report Incident`** to experience one-click GPS coordinates, photo category suggestions, and real-time duplicate alerts.

---

## ⚠️ Important Disclaimers & Safety Rules
- AI suggestions are **never** presented as confirmed facts.
- A route or area is **never** labelled safe merely because no incident has been reported.
- No unvalidated disaster-prediction accuracy is claimed without real-world telemetry evaluation.
- Live citizen reports and simulation demo data are clearly distinguished at all times via visual source tags.
