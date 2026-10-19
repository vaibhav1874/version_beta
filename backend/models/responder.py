"""
Project JEEVAN — Responder Models
SQLAlchemy ORM model and Pydantic schemas for responder teams,
assignments, and incident timeline events.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey
)
from pydantic import BaseModel, Field

from database import Base


# ── Valid Values ──────────────────────────────────────────────────────
VALID_TEAM_TYPES = [
    "fire_brigade", "medical", "police", "municipal", "rescue"
]
VALID_TEAM_STATUSES = ["available", "deployed", "off_duty"]
VALID_ASSIGNMENT_STATUSES = [
    "assigned", "en_route", "on_scene", "completed"
]
VALID_EVENT_TYPES = [
    "created", "verified", "assigned", "status_change",
    "resolved", "note"
]


# ── SQLAlchemy ORM Models ────────────────────────────────────────────

class ResponderTeam(Base):
    """A team of responders (fire brigade, medical, etc.)."""
    __tablename__ = "responder_teams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(String(20), default="available")
    contact = Column(String(255), nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


class Assignment(Base):
    """Links a responder team to an incident."""
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    team_id = Column(
        Integer, ForeignKey("responder_teams.id"), nullable=False
    )
    status = Column(String(20), default="assigned")
    notes = Column(Text, nullable=True)
    assigned_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class IncidentTimeline(Base):
    """Audit log entry for an incident's lifecycle."""
    __tablename__ = "incident_timeline"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(String(255), default="system")
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


# ── Pydantic Schemas ─────────────────────────────────────────────────

class ResponderTeamCreate(BaseModel):
    """Schema for creating a responder team."""
    name: str = Field(..., min_length=2, max_length=255)
    type: str = Field(..., description="One of: fire_brigade, medical, police, municipal, rescue")
    status: str = Field(default="available")
    contact: Optional[str] = None


class ResponderTeamResponse(BaseModel):
    """Schema for responder team API responses."""
    id: int
    name: str
    type: str
    status: str
    contact: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignmentCreate(BaseModel):
    """Schema for assigning a team to an incident."""
    team_id: int
    notes: Optional[str] = None


class AssignmentResponse(BaseModel):
    """Schema for assignment API responses."""
    id: int
    incident_id: int
    team_id: int
    status: str
    notes: Optional[str] = None
    assigned_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TimelineEventCreate(BaseModel):
    """Schema for adding a timeline event."""
    event_type: str
    description: str
    created_by: str = "system"


class TimelineEventResponse(BaseModel):
    """Schema for timeline event API responses."""
    id: int
    incident_id: int
    event_type: str
    description: str
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
