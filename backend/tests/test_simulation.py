"""
Project JEEVAN — Simulation & Response Coordination Test Suite
Tests for scenario seeding, clear data provenance, and simulation resets.
"""

import pytest
from fastapi.testclient import TestClient


def test_seed_simulation_scenario(client):
    # 1. Seed demo scenario
    seed_res = client.post("/api/simulation/seed")
    assert seed_res.status_code == 201
    data = seed_res.json()
    assert data["status"] == "success"
    assert data["incidents_seeded"] == 5
    assert data["teams_seeded"] == 5

    # 2. Check that all seeded incidents are tagged as source="simulation"
    incidents_res = client.get("/api/incidents?source=simulation")
    assert incidents_res.status_code == 200
    incidents = incidents_res.json()
    assert len(incidents) == 5
    assert all(i["source"] == "simulation" for i in incidents)

    # 3. Check duplicate detection in seeded scenario (5th report is duplicate of 1st)
    dup_match = [i for i in incidents if i["ai_duplicate_of_id"] is not None]
    assert len(dup_match) >= 1
    assert dup_match[0]["ai_duplicate_score"] >= 0.70

    # 4. Check responder teams are registered
    teams_res = client.get("/api/responders")
    assert teams_res.status_code == 200
    teams = teams_res.json()
    assert len(teams) >= 5

    # 5. Check reset endpoint
    reset_res = client.post("/api/simulation/reset")
    assert reset_res.status_code == 200
    after_reset_res = client.get("/api/incidents?source=simulation")
    assert len(after_reset_res.json()) == 0
