"""
Project JEEVAN — FastAPI Application Entry Point
Multi-hazard emergency intelligence and response coordination platform.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # --- Startup ---
    # Create database tables
    init_db()

    # Ensure upload directory exists
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)

    print("[OK] JEEVAN backend started successfully")
    print(f"[UPLOADS] {upload_path.resolve()}")
    print(f"[DB] {settings.DATABASE_URL}")

    yield

    # --- Shutdown ---
    print("[STOP] JEEVAN backend shutting down")


app = FastAPI(
    title="Project JEEVAN",
    description=(
        "AI-Assisted Multi-Hazard Emergency Intelligence "
        "& Response Coordination Platform"
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import incidents_router, responders_router, ai_router

# --- Include API Routers ---
app.include_router(incidents_router)
app.include_router(responders_router)
app.include_router(ai_router)



# --- Mount static files for uploaded images ---
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads",
)


# --- Health Check ---
@app.get("/api/health", tags=["Utility"])
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {
        "status": "healthy",
        "project": "JEEVAN",
        "version": "0.1.0",
        "message": "Emergency intelligence platform is operational",
    }
