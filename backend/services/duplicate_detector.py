"""
Project JEEVAN — Duplicate Incident Detector
Identifies potential duplicate reports using text similarity (character n-grams & tokens),
spatial distance (Haversine), and temporal proximity.
All outputs are suggestions requiring human dispatcher confirmation.
"""

import math
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session

from config import settings
from models.incident import Incident


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculates distance between two GPS coordinates in meters using the Haversine formula."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_char_ngrams(text: str, n: int = 3) -> set:
    """Extract character n-grams to handle typos and compound words (e.g. waterlogging vs water logging)."""
    cleaned = re.sub(r"[^\w\s]", "", text.lower())
    compact = re.sub(r"\s+", " ", cleaned).strip()
    if len(compact) < n:
        return {compact}
    return {compact[i : i + n] for i in range(len(compact) - n + 1)}


def compute_text_similarity(text1: str, text2: str) -> float:
    """
    Computes text similarity using character tri-grams and word tokens.
    Guaranteed local execution, fast, and handles compound phrases.
    """
    grams1 = get_char_ngrams(text1, 3)
    grams2 = get_char_ngrams(text2, 3)

    if not grams1 or not grams2:
        return 0.0

    inter = grams1.intersection(grams2)
    union = grams1.union(grams2)
    char_sim = len(inter) / len(union)

    # Word level overlap
    words1 = set(re.findall(r"\b\w{3,}\b", text1.lower()))
    words2 = set(re.findall(r"\b\w{3,}\b", text2.lower()))
    word_sim = 0.0
    if words1 and words2:
        word_sim = len(words1.intersection(words2)) / len(words1.union(words2))

    return round(0.6 * char_sim + 0.4 * word_sim, 3)


def check_for_duplicates(
    db: Session,
    title: str,
    description: str,
    latitude: float,
    longitude: float,
    category: str = "",
    exclude_incident_id: Optional[int] = None,
    threshold: float = 0.50,
) -> Tuple[Optional[int], Optional[float]]:
    """
    Scans recent incidents in the database for potential duplicate reports.
    Returns (matched_incident_id, similarity_score) or (None, None).
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(
        hours=settings.DUPLICATE_TIME_WINDOW_HOURS
    )

    query = db.query(Incident).filter(
        Incident.category == category,
        Incident.created_at >= cutoff_time,
        Incident.status != "archived",
    )
    if exclude_incident_id:
        query = query.filter(Incident.id != exclude_incident_id)

    candidates = query.all()
    target_text = f"{title} {description}"

    best_match_id: Optional[int] = None
    highest_score: float = 0.0

    for candidate in candidates:
        dist_meters = calculate_haversine_distance(
            latitude, longitude, candidate.latitude, candidate.longitude
        )
        if dist_meters > settings.DUPLICATE_DISTANCE_METERS:
            continue

        cand_text = f"{candidate.title} {candidate.description}"
        sim_score = compute_text_similarity(target_text, cand_text)

        # Distance weighting factor (closer = higher score)
        dist_factor = max(0.0, 1.0 - (dist_meters / settings.DUPLICATE_DISTANCE_METERS))
        combined_score = round(0.7 * sim_score + 0.3 * dist_factor, 3)

        if combined_score >= threshold and combined_score > highest_score:
            highest_score = combined_score
            best_match_id = candidate.id

    if highest_score >= threshold:
        return best_match_id, highest_score

    return None, None
