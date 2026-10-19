"""
Project JEEVAN — Incidents Router
REST API endpoints for incident CRUD, filtering, and image upload.
"""

import os
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from config import settings
from models.incident import (
    Incident,
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    VALID_CATEGORIES,
    VALID_SEVERITIES,
    VALID_STATUSES,
)
from models.responder import IncidentTimeline
from services.priority_engine import assess_incident_priority
from services.duplicate_detector import check_for_duplicates
from services.image_classifier import classify_incident_image

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a new incident",
)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
):
    """Create a new emergency incident report."""
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category '{payload.category}'. Valid categories are: {VALID_CATEGORIES}",
        )

    if payload.severity not in VALID_SEVERITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid severity '{payload.severity}'. Valid severities are: {VALID_SEVERITIES}",
        )

    # 1. Explainable Priority Rules Assessment
    has_img = bool(payload.image_path)
    priority_score, priority_expl = assess_incident_priority(
        category=payload.category,
        description=payload.description,
        reported_severity=payload.reported_severity if hasattr(payload, 'reported_severity') else payload.severity,
        has_image=has_img,
        is_verified=False,
    )

    # 2. Duplicate Detection across recent reports
    dup_id, dup_score = check_for_duplicates(
        db=db,
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        category=payload.category,
    )

    # 3. Optional image classification if photo attached
    ai_cat = None
    ai_conf = None
    if payload.image_path:
        local_path = settings.UPLOAD_DIR + "/" + Path(payload.image_path).name
        ai_cat, ai_conf = classify_incident_image(local_path)

    incident = Incident(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        image_path=payload.image_path,
        source=payload.source,
        reporter_name=payload.reporter_name,
        reporter_contact=payload.reporter_contact,
        status="reported",
        is_verified=False,
        # AI Suggestions (non-authoritative)
        ai_priority_score=priority_score,
        ai_priority_explanation=priority_expl,
        ai_duplicate_of_id=dup_id,
        ai_duplicate_score=dup_score,
        ai_category_suggestion=ai_cat,
        ai_category_confidence=ai_conf,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Automatically create initial timeline record
    timeline_entry = IncidentTimeline(
        incident_id=incident.id,
        event_type="created",
        description=f"Incident reported via {payload.source} by {payload.reporter_name}. AI Priority: {priority_score}/10",
        created_by="system",
    )
    db.add(timeline_entry)
    db.commit()

    return incident


@router.post(
    "/upload-image",
    summary="Upload image for an incident",
)
async def upload_incident_image(file: UploadFile = File(...)):
    """Upload photo/evidence for an incident. Returns the accessible image URL."""
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{suffix}'. Allowed: {allowed_extensions}",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}{suffix}"
    destination = upload_dir / unique_filename

    contents = await file.read()
    with open(destination, "wb") as f:
        f.write(contents)

    # Relative path that is served via /uploads static mount
    relative_path = f"/uploads/{unique_filename}"
    return {
        "filename": unique_filename,
        "image_path": relative_path,
        "size_bytes": len(contents),
    }


@router.get(
    "",
    response_model=List[IncidentResponse],
    summary="List incidents with filtering and pagination",
)
def list_incidents(
    category: Optional[str] = Query(None, description="Filter by hazard category"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status"
    ),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    is_verified: Optional[bool] = Query(None, description="Filter by verified status"),
    source: Optional[str] = Query(None, description="Filter by source"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve incidents sorted by most recently updated."""
    query = db.query(Incident)

    if category:
        query = query.filter(Incident.category == category)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity:
        query = query.filter(Incident.severity == severity)
    if is_verified is not None:
        query = query.filter(Incident.is_verified == is_verified)
    if source:
        query = query.filter(Incident.source == source)

    incidents = (
        query.order_by(desc(Incident.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return incidents


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
    summary="Get incident details by ID",
)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Fetch single incident details."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )
    return incident


@router.patch(
    "/{incident_id}",
    response_model=IncidentResponse,
    summary="Update incident details, status, or AI suggestions",
)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
):
    """Update fields on an incident and log significant status transitions."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )

    update_dict = payload.model_dump(exclude_unset=True)

    if "category" in update_dict and update_dict["category"] not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category '{update_dict['category']}'. Valid: {VALID_CATEGORIES}",
        )

    if "severity" in update_dict and update_dict["severity"] not in VALID_SEVERITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid severity '{update_dict['severity']}'. Valid: {VALID_SEVERITIES}",
        )

    if "status" in update_dict and update_dict["status"] not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{update_dict['status']}'. Valid: {VALID_STATUSES}",
        )

    # Detect status or verification change to log in timeline
    old_status = incident.status
    old_verified = incident.is_verified

    for field, value in update_dict.items():
        setattr(incident, field, value)

    incident.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)

    # Timeline event if status changed
    if "status" in update_dict and update_dict["status"] != old_status:
        db.add(
            IncidentTimeline(
                incident_id=incident.id,
                event_type="status_change",
                description=f"Status updated from '{old_status}' to '{incident.status}'",
                created_by="system",
            )
        )
        db.commit()

    # Timeline event if verification changed
    if "is_verified" in update_dict and update_dict["is_verified"] != old_verified:
        event_desc = (
            "Incident verified by response team"
            if incident.is_verified
            else "Incident marked as unverified"
        )
        db.add(
            IncidentTimeline(
                incident_id=incident.id,
                event_type="verified",
                description=event_desc,
                created_by="system",
            )
        )
        db.commit()

    return incident


@router.delete(
    "/{incident_id}",
    status_code=status.HTTP_200_OK,
    summary="Archive an incident",
)
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    """Soft archive an incident rather than permanent deletion for auditability."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found",
        )

    incident.status = "archived"
    incident.updated_at = datetime.now(timezone.utc)

    db.add(
        IncidentTimeline(
            incident_id=incident.id,
            event_type="status_change",
            description="Incident archived",
            created_by="system",
        )
    )
    db.commit()

    return {"message": f"Incident #{incident_id} archived successfully", "id": incident_id}
