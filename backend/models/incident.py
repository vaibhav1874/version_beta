"""
Project JEEVAN — Incident Models
SQLAlchemy ORM model and Pydantic schemas for incidents.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime
)
from pydantic import BaseModel, Field

from database import Base


# ── Category & Status Enums (as string literals) ──────────────────────
VALID_CATEGORIES = ["flood", "fire", "severe_weather", "road_accident"]
VALID_SEVERITIES = ["low", "medium", "high", "critical"]
VALID_STATUSES = [
    "reported", "verified", "responding", "resolved",
    "duplicate", "archived"
]
VALID_SOURCES = ["citizen", "sensor", "simulation"]


# ── SQLAlchemy ORM Model ─────────────────────────────────────────────

class Incident(Base):
    """SQLAlchemy model for the incidents table."""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), default="")
    image_path = Column(String(500), nullable=True)
    status = Column(String(20), default="reported")
    source = Column(String(20), default="citizen")

    # AI suggestion fields — always clearly marked as suggestions
    ai_category_suggestion = Column(String(50), nullable=True)
    ai_category_confidence = Column(Float, nullable=True)
    ai_duplicate_of_id = Column(Integer, nullable=True)
    ai_duplicate_score = Column(Float, nullable=True)
    ai_priority_explanation = Column(Text, nullable=True)
    ai_priority_score = Column(Integer, nullable=True)

    is_verified = Column(Boolean, default=False)
    reporter_name = Column(String(255), default="Anonymous")
    reporter_contact = Column(String(255), nullable=True)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


# ── Pydantic Schemas ─────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    """Schema for creating a new incident."""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(..., description="One of: flood, fire, severe_weather, road_accident")
    severity: str = Field(default="medium")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: str = Field(default="")
    image_path: Optional[str] = None
    source: str = Field(default="citizen")
    reporter_name: str = Field(default="Anonymous")
    reporter_contact: Optional[str] = None


class IncidentUpdate(BaseModel):
    """Schema for updating an existing incident (partial update)."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_verified: Optional[bool] = None
    ai_category_suggestion: Optional[str] = None
    ai_category_confidence: Optional[float] = None
    ai_duplicate_of_id: Optional[int] = None
    ai_duplicate_score: Optional[float] = None
    ai_priority_explanation: Optional[str] = None
    ai_priority_score: Optional[int] = None


class IncidentResponse(BaseModel):
    """Schema for incident API responses."""
    id: int
    title: str
    description: str
    category: str
    severity: str
    latitude: float
    longitude: float
    address: str
    image_path: Optional[str] = None
    status: str
    source: str

    # AI fields
    ai_category_suggestion: Optional[str] = None
    ai_category_confidence: Optional[float] = None
    ai_duplicate_of_id: Optional[int] = None
    ai_duplicate_score: Optional[float] = None
    ai_priority_explanation: Optional[str] = None
    ai_priority_score: Optional[int] = None

    is_verified: bool
    reporter_name: str
    reporter_contact: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
