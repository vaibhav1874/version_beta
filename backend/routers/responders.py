"""
Project JEEVAN — Responders & Assignments Router
REST API endpoints for responder teams, incident assignment, and timeline auditing.
"""

from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models.incident import Incident
from models.responder import (
    ResponderTeam,
    ResponderTeamCreate,
    ResponderTeamResponse,
    Assignment,
    AssignmentCreate,
    AssignmentResponse,
    IncidentTimeline,
    TimelineEventCreate,
    TimelineEventResponse,
    VALID_TEAM_TYPES,
    VALID_TEAM_STATUSES,
    VALID_ASSIGNMENT_STATUSES,
)

router = APIRouter(prefix="/api", tags=["Responders & Coordination"])


# ── Responder Teams ───────────────────────────────────────────────────

@router.post(
    "/responders",
    response_model=ResponderTeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new responder team",
)
def create_responder_team(
    payload: ResponderTeamCreate,
    db: Session = Depends(get_db),
):
    """Register a emergency responder unit."""
    if payload.type not in VALID_TEAM_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid team type '{payload.type}'. Valid: {VALID_TEAM_TYPES}",
        )

    if payload.status not in VALID_TEAM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{payload.status}'. Valid: {VALID_TEAM_STATUSES}",
        )

    team = ResponderTeam(
        name=payload.name,
        type=payload.type,
        status=payload.status,
        contact=payload.contact,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get(
    "/responders",
    response_model=List[ResponderTeamResponse],
    summary="List responder teams",
)
def list_responder_teams(
    type_filter: Optional[str] = Query(None, alias="type"),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """Get list of responder teams with optional type/status filters."""
    query = db.query(ResponderTeam)
    if type_filter:
        query = query.filter(ResponderTeam.type == type_filter)
    if status_filter:
        query = query.filter(ResponderTeam.status == status_filter)
    return query.all()


# ── Incident Assignments ──────────────────────────────────────────────

@router.post(
    "/incidents/{incident_id}/assign",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a responder team to an incident",
)
def assign_team_to_incident(
    incident_id: int,
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
):
    """Assign an available responder unit to an incident and set status to responding."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )

    team = db.query(ResponderTeam).filter(ResponderTeam.id == payload.team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Responder team #{payload.team_id} not found",
        )

    assignment = Assignment(
        incident_id=incident.id,
        team_id=team.id,
        status="assigned",
        notes=payload.notes,
    )
    db.add(assignment)

    # Automatically set incident status to 'responding' if currently 'reported' or 'verified'
    if incident.status in ["reported", "verified"]:
        incident.status = "responding"
        incident.updated_at = datetime.now(timezone.utc)

    # Set team status to deployed
    team.status = "deployed"

    # Add audit event to timeline
    timeline_event = IncidentTimeline(
        incident_id=incident.id,
        event_type="assigned",
        description=f"Assigned {team.name} ({team.type}) to incident. Notes: {payload.notes or 'None'}",
        created_by="coordinator",
    )
    db.add(timeline_event)

    db.commit()
    db.refresh(assignment)
    return assignment


@router.get(
    "/incidents/{incident_id}/assignments",
    response_model=List[AssignmentResponse],
    summary="Get team assignments for an incident",
)
def get_incident_assignments(incident_id: int, db: Session = Depends(get_db)):
    """Fetch all team assignments linked to an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )

    assignments = (
        db.query(Assignment)
        .filter(Assignment.incident_id == incident_id)
        .order_by(desc(Assignment.assigned_at))
        .all()
    )
    return assignments


# ── Incident Timeline ─────────────────────────────────────────────────

@router.get(
    "/incidents/{incident_id}/timeline",
    response_model=List[TimelineEventResponse],
    summary="Get incident audit timeline",
)
def get_incident_timeline(incident_id: int, db: Session = Depends(get_db)):
    """Fetch lifecycle log events for an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )

    events = (
        db.query(IncidentTimeline)
        .filter(IncidentTimeline.incident_id == incident_id)
        .order_by(IncidentTimeline.created_at.asc())
        .all()
    )
    return events


@router.post(
    "/incidents/{incident_id}/timeline",
    response_model=TimelineEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an event or coordinator note to the incident timeline",
)
def add_timeline_event(
    incident_id: int,
    payload: TimelineEventCreate,
    db: Session = Depends(get_db),
):
    """Add coordinator note or manual status entry to incident log."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )

    event = IncidentTimeline(
        incident_id=incident_id,
        event_type=payload.event_type,
        description=payload.description,
        created_by=payload.created_by,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
