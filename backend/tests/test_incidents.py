"""
Project JEEVAN — Backend Integration Tests
Tests for incident reporting, filtering, responder assignment, and timeline tracking.
"""

import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
import models  # Ensure all SQLAlchemy models are registered on Base.metadata
from main import app

from sqlalchemy.pool import StaticPool

# In-memory SQLite with StaticPool so all connections share the same database
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Create a fresh database schema for each test."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


# ── Health Endpoint ──────────────────────────────────────────────────

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "JEEVAN"


# ── Incident Creation & Validation ───────────────────────────────────

def test_create_incident_success(client):
    payload = {
        "title": "Severe flooding on Main Street",
        "description": "Water logging up to 2 feet near metro station entrance",
        "category": "flood",
        "severity": "high",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "address": "Connaught Place, New Delhi",
        "reporter_name": "Citizen Alex",
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["category"] == "flood"
    assert data["status"] == "reported"
    assert data["is_verified"] is False


def test_create_incident_invalid_category(client):
    payload = {
        "title": "Unknown emergency event",
        "description": "Something strange happened down the road",
        "category": "alien_invasion",  # Invalid category
        "severity": "medium",
        "latitude": 28.6139,
        "longitude": 77.2090,
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 422


# ── Incident Listing and Filtering ────────────────────────────────────

def test_list_and_filter_incidents(client):
    # Create two incidents in different categories
    client.post(
        "/api/incidents",
        json={
            "title": "Submerged bridge road",
            "description": "Vehicles unable to cross the lower river bridge",
            "category": "flood",
            "severity": "high",
            "latitude": 28.5,
            "longitude": 77.1,
        },
    )
    client.post(
        "/api/incidents",
        json={
            "title": "Factory electrical fire",
            "description": "Black smoke coming from warehouse sector 4",
            "category": "fire",
            "severity": "critical",
            "latitude": 28.6,
            "longitude": 77.3,
        },
    )

    # All incidents
    all_res = client.get("/api/incidents")
    assert all_res.status_code == 200
    assert len(all_res.json()) == 2

    # Filter by category
    flood_res = client.get("/api/incidents?category=flood")
    assert len(flood_res.json()) == 1
    assert flood_res.json()[0]["category"] == "flood"

    fire_res = client.get("/api/incidents?category=fire")
    assert len(fire_res.json()) == 1
    assert fire_res.json()[0]["category"] == "fire"


# ── Incident Details & Updates ────────────────────────────────────────

def test_get_and_update_incident(client):
    create_res = client.post(
        "/api/incidents",
        json={
            "title": "Fallen tree blocking highway",
            "description": "Large branch obstructing two rightmost lanes",
            "category": "severe_weather",
            "severity": "medium",
            "latitude": 28.7,
            "longitude": 77.2,
        },
    )
    inc_id = create_res.json()["id"]

    # Fetch detail
    detail_res = client.get(f"/api/incidents/{inc_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == inc_id

    # Update incident verification and severity
    update_res = client.patch(
        f"/api/incidents/{inc_id}",
        json={"is_verified": True, "severity": "high"},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["is_verified"] is True
    assert updated["severity"] == "high"


def test_archive_incident(client):
    create_res = client.post(
        "/api/incidents",
        json={
            "title": "Minor fender bender",
            "description": "Two cars collided at low speed, traffic slowing",
            "category": "road_accident",
            "severity": "low",
            "latitude": 28.4,
            "longitude": 77.0,
        },
    )
    inc_id = create_res.json()["id"]

    del_res = client.delete(f"/api/incidents/{inc_id}")
    assert del_res.status_code == 200

    # Incident status should now be archived
    get_res = client.get(f"/api/incidents/{inc_id}")
    assert get_res.json()["status"] == "archived"


# ── Image Upload ──────────────────────────────────────────────────────

def test_upload_incident_image(client):
    fake_image_bytes = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    response = client.post(
        "/api/incidents/upload-image",
        files={"file": ("test_flood.gif", io.BytesIO(fake_image_bytes), "image/gif")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "image_path" in data
    assert data["image_path"].startswith("/uploads/")


# ── Responders & Assignments ──────────────────────────────────────────

def test_responder_team_registration_and_assignment(client):
    # 1. Register team
    team_res = client.post(
        "/api/responders",
        json={
            "name": "Rapid Water Rescue Unit 1",
            "type": "rescue",
            "status": "available",
            "contact": "+91-9876543210",
        },
    )
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # 2. Create incident
    inc_res = client.post(
        "/api/incidents",
        json={
            "title": "Flash flood stranded bus",
            "description": "Bus stalled with passengers in water logged underpass",
            "category": "flood",
            "severity": "critical",
            "latitude": 28.55,
            "longitude": 77.25,
        },
    )
    inc_id = inc_res.json()["id"]

    # 3. Assign team to incident
    assign_res = client.post(
        f"/api/incidents/{inc_id}/assign",
        json={"team_id": team_id, "notes": "Deploying 2 inflatable boats"},
    )
    assert assign_res.status_code == 201
    assert assign_res.json()["incident_id"] == inc_id

    # Incident should now have status 'responding'
    inc_updated = client.get(f"/api/incidents/{inc_id}").json()
    assert inc_updated["status"] == "responding"

    # 4. Check timeline
    timeline_res = client.get(f"/api/incidents/{inc_id}/timeline")
    assert timeline_res.status_code == 200
    events = timeline_res.json()
    assert len(events) >= 2  # created + assigned
    assert any(e["event_type"] == "assigned" for e in events)
