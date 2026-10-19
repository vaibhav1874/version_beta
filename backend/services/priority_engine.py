"""
Project JEEVAN — Priority Rules Engine
Transparent, explainable, category-specific emergency priority scoring.
"""

from typing import Dict, Any, List, Tuple


def assess_incident_priority(
    category: str,
    description: str,
    reported_severity: str = "medium",
    has_image: bool = False,
    is_verified: bool = False,
) -> Tuple[int, str]:
    """
    Evaluates explainable priority score (1-10) and human-readable explanation.
    Does not use black-box ML so dispatchers can audit every single scoring decision.
    """
    text = description.lower()
    score = 4  # baseline
    reasons: List[str] = []

    # Baseline adjustment by reported severity
    severity_weights = {
        "low": 0,
        "medium": 1,
        "high": 3,
        "critical": 4,
    }
    sev_boost = severity_weights.get(reported_severity, 1)
    score += sev_boost
    reasons.append(f"Reported severity is '{reported_severity}' (+{sev_boost})")

    # Category-specific explainable rule evaluations
    if category == "flood":
        # Water depth indicators
        if any(w in text for w in ["deep", "submerged", "underwater", "waist", "chest", "feet", "meter"]):
            score += 2
            reasons.append("High water depth / vehicle submersion detected (+2)")
        if any(w in text for w in ["trapped", "stranded", "rescue", "drowning", "passengers"]):
            score += 3
            reasons.append("Citizens trapped / stranded in rising flood water (+3)")
        if any(w in text for w in ["hospital", "station", "metro", "school", "highway", "flyover"]):
            score += 1
            reasons.append("Proximity to critical transit/public infrastructure (+1)")

    elif category == "fire":
        # Fire urgency indicators
        if any(w in text for w in ["explosion", "gas", "chemical", "cylinder", "lpg"]):
            score += 3
            reasons.append("Explosive or flammable hazardous materials involved (+3)")
        if any(w in text for w in ["trapped", "residents", "children", "patients"]):
            score += 3
            reasons.append("Occupants trapped inside building (+3)")
        if any(w in text for w in ["spreading", "dense", "residential", "market", "commercial"]):
            score += 2
            reasons.append("High risk of rapid lateral spread (+2)")

    elif category == "severe_weather":
        # Weather / fallen tree indicators
        if any(w in text for w in ["wire", "electric", "power", "live cable", "transformer"]):
            score += 3
            reasons.append("Electrocution hazard from snapped lines/cables (+3)")
        if any(w in text for w in ["blocked", "both lanes", "impassable", "arterial", "highway"]):
            score += 2
            reasons.append("Primary evacuation route or arterial road completely blocked (+2)")
        if any(w in text for w in ["roof", "collapsed", "debris", "crushed"]):
            score += 2
            reasons.append("Structural collapse or heavy impact damage (+2)")

    elif category == "road_accident":
        # Accident urgency indicators
        if any(w in text for w in ["fatal", "unconscious", "bleeding", "severe injury", "ambulance"]):
            score += 3
            reasons.append("Critical casualties / medical emergency required (+3)")
        if any(w in text for w in ["pileup", "multi-vehicle", "bus", "tanker"]):
            score += 2
            reasons.append("Multi-vehicle collision or large transit carrier (+2)")
        if any(w in text for w in ["leak", "fire", "fuel", "diesel"]):
            score += 2
            reasons.append("Fuel leak fire hazard (+2)")

    # Photo evidence verification bonus
    if has_image:
        score += 1
        reasons.append("Photographic evidence attached (+1)")

    # Dispatcher verification bonus
    if is_verified:
        score += 1
        reasons.append("Confirmed by field personnel (+1)")

    # Clamp score strictly between 1 and 10
    final_score = max(1, min(10, score))
    explanation = "; ".join(reasons)

    return final_score, explanation
