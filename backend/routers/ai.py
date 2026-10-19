"""
Project JEEVAN — AI Intelligence Router
REST endpoints for image classification, duplicate detection, and explainable priority scoring.
"""

from typing import Optional, List
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from config import settings
from services.priority_engine import assess_incident_priority
from services.duplicate_detector import check_for_duplicates
from services.image_classifier import classify_incident_image

router = APIRouter(prefix="/api/ai", tags=["AI Assistance & Intelligence"])


# ── Schemas ──────────────────────────────────────────────────────────

class DuplicateCheckRequest(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    latitude: float
    longitude: float
    category: str
    exclude_incident_id: Optional[int] = None


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    duplicate_of_id: Optional[int] = None
    similarity_score: Optional[float] = None
    message: str


class PriorityAssessRequest(BaseModel):
    category: str
    description: str
    reported_severity: str = "medium"
    has_image: bool = False
    is_verified: bool = False


class PriorityAssessResponse(BaseModel):
    priority_score: int
    severity: str
    explanation: str


class ImageClassificationResponse(BaseModel):
    suggested_category: Optional[str] = None
    confidence: Optional[float] = None
    is_confident: bool
    disclaimer: str


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post(
    "/classify-image",
    response_model=ImageClassificationResponse,
    summary="Suggest hazard category from uploaded image",
)
async def classify_image_endpoint(file: UploadFile = File(...)):
    """
    Analyzes an uploaded photo to suggest the most likely hazard category.
    Returns a preliminary suggestion that must be confirmed by the human reporter.
    """
    contents = await file.read()
    temp_dir = Path(settings.UPLOAD_DIR) / "_temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_file = temp_dir / file.filename

    with open(temp_file, "wb") as f:
        f.write(contents)

    try:
        category, confidence = classify_incident_image(str(temp_file))
        is_confident = (confidence or 0.0) >= settings.AI_CONFIDENCE_THRESHOLD
        return ImageClassificationResponse(
            suggested_category=category,
            confidence=confidence,
            is_confident=is_confident,
            disclaimer="AI category suggestions are non-authoritative recommendations and require human verification.",
        )
    finally:
        if temp_file.exists():
            temp_file.unlink()


@router.post(
    "/check-duplicates",
    response_model=DuplicateCheckResponse,
    summary="Check if a report is likely a duplicate of a recent incident",
)
def check_duplicates_endpoint(
    payload: DuplicateCheckRequest,
    db: Session = Depends(get_db),
):
    """
    Compares report description and coordinates against recent reports within 48h.
    """
    dup_id, score = check_for_duplicates(
        db=db,
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        category=payload.category,
        exclude_incident_id=payload.exclude_incident_id,
    )

    if dup_id:
        return DuplicateCheckResponse(
            is_duplicate=True,
            duplicate_of_id=dup_id,
            similarity_score=score,
            message=f"Possible duplicate of Incident #{dup_id} ({int(score * 100)}% match within {settings.DUPLICATE_DISTANCE_METERS}m).",
        )

    return DuplicateCheckResponse(
        is_duplicate=False,
        duplicate_of_id=None,
        similarity_score=None,
        message="No matching duplicate reports identified in local vicinity.",
    )


@router.post(
    "/assess-priority",
    response_model=PriorityAssessResponse,
    summary="Compute transparent, explainable priority score",
)
def assess_priority_endpoint(payload: PriorityAssessRequest):
    """
    Computes rule-based priority score (1-10) with complete explainability breakdown.
    """
    score, explanation = assess_incident_priority(
        category=payload.category,
        description=payload.description,
        reported_severity=payload.reported_severity,
        has_image=payload.has_image,
        is_verified=payload.is_verified,
    )

    # Derive severity from score
    if score >= 8:
        derived_sev = "critical"
    elif score >= 6:
        derived_sev = "high"
    elif score >= 4:
        derived_sev = "medium"
    else:
        derived_sev = "low"

    return PriorityAssessResponse(
        priority_score=score,
        severity=derived_sev,
        explanation=explanation,
    )
