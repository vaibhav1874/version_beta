# 🚨 Project JEEVAN

**AI-Assisted Multi-Hazard Emergency Intelligence & Response Coordination Platform**

JEEVAN is a prototype emergency management system that helps communities report, track, and respond to urban emergencies — floods, fires, severe weather damage, and road accidents — with AI-assisted intelligence and transparent, human-verified decision-making.

---

## 🎯 Supported Emergency Categories

| Category | Examples |
|---|---|
| 🌊 **Flooding** | Urban waterlogging, submerged roads, rising water levels |
| 🔥 **Fire** | Building fires, smoke reports, wildfire proximity |
| 🌪️ **Severe Weather** | Storm damage, fallen trees, blocked roads |
| 🚗 **Road Accidents** | Vehicle collisions, road blockages, injury reports |

> The architecture supports future expansion to other hazards without claiming one generic model can handle every disaster.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Vanilla CSS (custom properties) |
| Maps | Leaflet + OpenStreetMap (free, no API key) |
| Backend | Python + FastAPI + Uvicorn |
| Database | SQLite (via SQLAlchemy) |
| Image AI | Hugging Face Transformers (ResNet-50) |
| Text AI | Sentence Transformers (all-MiniLM-L6-v2) |
| Priority | Explainable category-specific Python rules |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/vaibhav1874/version_beta.git
cd version_beta
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp ../.env.example .env
# Edit .env if needed (defaults work for local development)

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs (Swagger UI) at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
version_beta/
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules
├── README.md                 # This file
│
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── config.py             # Settings & env-var loading
│   ├── database.py           # SQLite connection & tables
│   ├── requirements.txt      # Python dependencies
│   ├── models/               # SQLAlchemy & Pydantic models
│   ├── routers/              # API endpoint handlers
│   ├── services/             # AI & business logic services
│   ├── tests/                # Backend tests
│   └── uploads/              # Uploaded images (git-ignored)
│
├── frontend/
│   ├── src/                  # React + TypeScript source
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite configuration
│
└── docs/
    └── architecture.md       # Architecture documentation
```

---

## 🤖 AI Features

All AI outputs are **suggestions only** — always editable, never auto-confirmed.

| Feature | How It Works | Label |
|---|---|---|
| **Category Suggestion** | Image classifier analyzes uploaded photos | `🤖 AI-suggested` |
| **Duplicate Detection** | Text similarity + location + time proximity | `⚠️ Possible duplicate` |
| **Priority Scoring** | Category-specific rules with explanations | `📊 AI priority score` |

---

## ⚠️ Important Disclaimers

- AI suggestions are **never** presented as confirmed facts
- A route is **not** labelled safe merely because no incident has been reported
- No validated disaster-prediction accuracy is claimed without suitable data and evaluation
- All data sources are clearly distinguished: **live**, **verified**, **unverified**, **stale**, or **simulated**

---

## 📄 License

This project is developed for educational and hackathon purposes.
