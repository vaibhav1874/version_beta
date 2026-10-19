"""
Project JEEVAN — Backend Configuration
Loads environment variables with sensible defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory or project root
env_path = Path(__file__).resolve().parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    """Application settings loaded from environment variables."""

    # --- Database ---
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./jeevan.db")

    # --- Server ---
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")

    # --- File Uploads ---
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    # --- AI Models ---
    IMAGE_MODEL_NAME: str = os.getenv(
        "IMAGE_MODEL_NAME", "microsoft/resnet-50"
    )
    SENTENCE_MODEL_NAME: str = os.getenv(
        "SENTENCE_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
    )
    AI_CONFIDENCE_THRESHOLD: float = float(
        os.getenv("AI_CONFIDENCE_THRESHOLD", "0.6")
    )
    DUPLICATE_SIMILARITY_THRESHOLD: float = float(
        os.getenv("DUPLICATE_SIMILARITY_THRESHOLD", "0.75")
    )
    DUPLICATE_TIME_WINDOW_HOURS: int = int(
        os.getenv("DUPLICATE_TIME_WINDOW_HOURS", "48")
    )
    DUPLICATE_DISTANCE_METERS: int = int(
        os.getenv("DUPLICATE_DISTANCE_METERS", "500")
    )


settings = Settings()
