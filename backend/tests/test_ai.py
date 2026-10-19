"""
Project JEEVAN — AI Assistance Test Suite
Tests for explainable priority rules, duplicate detection, image classification, and AI endpoints.
"""

import io
import pytest

from services.priority_engine import assess_incident_priority
from services.duplicate_detector import (
    calculate_haversine_distance,
    compute_text_similarity,
    check_for_duplicates,
)
from services.image_classifier import classify_incident_image


# ── 1. Priority Rules Engine Tests ────────────────────────────────────

def test_flood_priority_rules():
    # Minor waterlogging
    score_low, exp_low = assess_incident_priority(
        category="flood",
        description="Minor puddling on walkway pavement",
        reported_severity="low",
    )
    assert score_low <= 5

    # Critical flood with submersion and trapped people
    score_crit, exp_crit = assess_incident_priority(
        category="flood",
        description="Water 4 feet deep submerged car, passengers trapped in rising water near metro station",
        reported_severity="critical",
    )
    assert score_crit >= 8
    assert "submersion" in exp_crit.lower()
    assert "trapped" in exp_crit.lower()
    assert "transit" in exp_crit.lower()


def test_fire_priority_rules():
    score, explanation = assess_incident_priority(
        category="fire",
        description="Commercial warehouse fire spreading to residential apartments, LPG cylinder explosion risk",
        reported_severity="critical",
    )
    assert score >= 8
    assert "flammable" in explanation.lower() or "explosion" in explanation.lower()
    assert "spread" in explanation.lower()


def test_weather_and_accident_rules():
    score_weather, _ = assess_incident_priority(
        category="severe_weather",
        description="Live high voltage electric wire snapped across arterial road",
        reported_severity="high",
    )
    assert score_weather >= 7

    score_accident, _ = assess_incident_priority(
        category="road_accident",
        description="Multi-vehicle pileup with diesel fuel leak and severe injury",
        reported_severity="critical",
    )
    assert score_accident >= 8


# ── 2. Duplicate Detection Tests ──────────────────────────────────────

def test_haversine_distance():
    # Points 100m apart
    dist = calculate_haversine_distance(28.6139, 77.2090, 28.6148, 77.2090)
    assert 90 < dist < 110


def test_text_similarity():
    sim_high = compute_text_similarity(
        "Waterlogging submerged vehicles near underpass",
        "Water logging and submerged cars around the underpass",
    )
    assert sim_high >= 0.25

    sim_zero = compute_text_similarity(
        "Flooding in basement parking",
        "Fallen tree blocking suburban highway lane",
    )
    assert sim_zero < 0.20


def test_duplicate_detection_database(client, test_db):
    # 1. Create first incident
    client.post(
        "/api/incidents",
        json={
            "title": "Severe flooding on Main Street",
            "description": "Water logging up to 2 feet near metro station entrance",
            "category": "flood",
            "severity": "high",
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
    )

    # 2. Check duplicate with second similar report 100 meters away
    dup_id, score = check_for_duplicates(
        db=test_db,
        title="Flooding around metro station",
        description="Water logging over 2 feet deep near metro gate",
        latitude=28.6145,
        longitude=77.2092,
        category="flood",
    )
    assert dup_id is not None
    assert score is not None
    assert score >= 0.50


# ── 3. AI Endpoints Tests ─────────────────────────────────────────────

def test_ai_assess_priority_endpoint(client):
    res = client.post(
        "/api/ai/assess-priority",
        json={
            "category": "fire",
            "description": "Flames bursting from chemical store with trapped workers",
            "reported_severity": "critical",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["priority_score"] >= 8
    assert data["severity"] == "critical"
    assert len(data["explanation"]) > 10


def test_ai_check_duplicates_endpoint(client):
    res = client.post(
        "/api/ai/check-duplicates",
        json={
            "title": "Random single fallen branch",
            "description": "Small twig in side alley",
            "latitude": 28.1,
            "longitude": 77.1,
            "category": "severe_weather",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_duplicate"] is False
