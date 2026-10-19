# Project JEEVAN — Architecture Documentation

For the full implementation plan, see the approved plan document.

## Architecture Overview

```
Reporter → React Frontend → FastAPI Backend → SQLite
                                    ↓
                              AI Services:
                              ├── Image Classifier (HF ResNet-50)
                              ├── Sentence Transformer (MiniLM)
                              └── Priority Rules Engine
```

## Data Flow

1. Reporter submits incident via React form (text + optional image + location)
2. Frontend validates and sends to `POST /api/incidents`
3. Backend saves to SQLite database
4. AI services run:
   - Image classifier suggests category with confidence score
   - Sentence Transformer checks for duplicate reports
   - Priority engine computes score with human-readable explanation
5. All AI results stored as *suggestions* (never auto-confirmed)
6. Dashboard and map update to show new incident
7. Responders review, verify, assign teams, and update status

## Key Design Decisions

- **SQLite** chosen for zero-config prototype; SQLAlchemy abstraction allows easy migration to PostgreSQL
- **Local AI inference** via Hugging Face — no paid API dependencies
- **Rule-based priority** instead of ML — explainable and auditable without training data
- **All AI outputs clearly labelled** — never presented as confirmed facts
