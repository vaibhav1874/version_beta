# Project JEEVAN — 5-Minute Hackathon Demonstration Script

This repeatable guide walks judges and evaluators through the complete end-to-end multi-hazard emergency intelligence workflow of Project JEEVAN.

---

## 🕒 Demonstration Timeline (5 Minutes)

### Minute 1: The Problem & The Platform Overview
1. **Explain the Challenge:**
   - During acute urban crises (monsoon waterlogging, commercial fires, severe squalls, multi-vehicle pileups), dispatch centers suffer from duplicate noise, unverified rumors, and delayed resource allocation.
2. **Show the Clean Slate / Architecture:**
   - Point to the split dashboard: Live Incident Feed on the left, interactive Leaflet Map on the right, and the active system status pill (`AI Coordination Live`).
   - Mention the local-first, zero-paid-API design (FastAPI + SQLite + React + Leaflet + OpenStreetMap).

### Minute 2: Single-Click Simulation Scenario (Demonstrating Multi-Hazard Support)
1. **Click the `⚡ Demo Scenario` button** in the top navigation bar.
2. **Observe what loads instantly:**
   - 5 multi-hazard incidents across Delhi:
     - 🌊 **Flood:** Minto Bridge underpass with stranded taxi.
     - 🔥 **Fire:** Barakhamba Road commercial complex server room fire.
     - 🌪️ **Severe Weather:** Uprooted 80ft banyan tree blocking 4 arterial lanes.
     - 🚗 **Road Accident:** Lajpat Nagar flyover multi-vehicle collision with diesel leak.
     - 🌊 **Flood Duplicate:** Secondary commuter report of Minto Bridge flooding.
   - 5 pre-registered responder units (Fire Service, NDRF Aquatic Rescue, CATS Ambulance, Traffic Police, MCD Tree Removal).
3. **Point out Data Provenance:**
   - Every simulated report carries an amber `SIMULATION` badge to distinguish it from live citizen reports.

### Minute 3: AI Intelligence in Action (Explainable & Auditable)
1. **Click on the Minto Bridge Flood Incident:**
   - The map smoothly flies to Connaught Place coordinates (`28.6328, 77.2215`).
   - The Incident Inspector panel slides in on the right.
2. **Show the AI Intelligence Box:**
   - **Explainable Priority Score (e.g. 9/10 — Critical):**
     - Emphasize that this is **not** a black-box opaque guess.
     - Expand the breakdown: *"High water depth / vehicle submersion detected (+2); Citizens trapped / stranded in rising flood water (+3); Transit infrastructure proximity (+1)"*.
   - **Duplicate Detection:**
     - Click on the second Minto Bridge report.
     - Point out the warning banner: `⚠️ Possible duplicate of Incident #1 (88% match within 500m)`.
     - Explain how Haversine spatial distance, temporal window (48h), and character n-gram text similarity combine to flag redundancies without discarding citizen voices.

### Minute 4: Response Coordination & Dispatch Workflow
1. **Field Verification:**
   - Click the `Mark as Verified` button. Notice the status updates to `Verified` and the live card badge turns green.
2. **Unit Dispatch:**
   - Switch to the `Response` tab.
   - Select `NDRF Flood & Aquatic Rescue Unit Alpha` from the dropdown.
   - Add note: *"Deploying inflatable boats and high-capacity submersible pumps"*.
   - Click `Dispatch Unit to Incident`.
   - The unit status changes to `DEPLOYED`, and the incident moves to `RESPONDING`.
3. **Audit Trail (Timeline):**
   - Switch to the `Timeline` tab.
   - Show the immutable lifecycle log: `Created` → `Verified` → `Assigned` with precise timestamps and actor attribution.

### Minute 5: Citizen Reporting with AI Pre-Submission Assistance
1. **Click `🚨 Report Incident` in the navbar.**
2. **Demonstrate Device GPS:**
   - Click `📍 Use Device GPS` to demonstrate one-tap coordinate detection.
3. **Demonstrate AI Category Photo Suggestion:**
   - Attach a sample photo (e.g., of fire or water).
   - Point out the instant `🤖 AI Photo Suggestion` pill with confidence percentage and the `Apply` button that fills the category selector.
4. **Demonstrate Real-Time Duplicate Warning:**
   - Type a title and description similar to an active incident.
   - On blur, the yellow banner alerts the user: `⚠️ Possible duplicate of Incident #...` before submission.
5. **Conclude with Safety & Ethical Guardrails:**
   - Predictions are non-authoritative recommendations.
   - Routes are never marked safe merely due to lack of reports.
   - Everything remains accountable to human responders.

---

## 🛠️ Quick Commands for Evaluators

```bash
# Run complete test suite (17 unit & integration tests)
cd backend
.\venv\Scripts\pytest.exe -v

# Start backend server
.\venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port 8000

# Start frontend application
cd ../frontend
npm run dev
```
Navigate to: `http://localhost:5173`
Interactive API Docs (Swagger): `http://localhost:8000/docs`
