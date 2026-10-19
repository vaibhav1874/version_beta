"""
Project JEEVAN — Simulation & Scenario Seeder
Loads clearly labelled, reproducible emergency scenarios for hackathon demonstrations.
All generated records are explicitly tagged as source="simulation".
"""

from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from models.incident import Incident
from models.responder import ResponderTeam, Assignment, IncidentTimeline
from services.priority_engine import assess_incident_priority


SIMULATED_TEAMS = [
    {
        "name": "Delhi Fire Service — Station 4 (Connaught Place)",
        "type": "fire_brigade",
        "status": "available",
        "contact": "+91-11-2341-2222",
    },
    {
        "name": "NDRF Flood & Aquatic Rescue Unit Alpha",
        "type": "rescue",
        "status": "available",
        "contact": "+91-11-2436-3260",
    },
    {
        "name": "CATS Advanced Trauma Ambulance #12",
        "type": "medical",
        "status": "available",
        "contact": "+91-102-CATS",
    },
    {
        "name": "Delhi Traffic Police Emergency Flying Squad",
        "type": "police",
        "status": "available",
        "contact": "+91-11-2584-4444",
    },
    {
        "name": "MCD Rapid Tree & Debris Removal Crew #3",
        "type": "municipal",
        "status": "available",
        "contact": "+91-11-2322-5555",
    },
]


SIMULATED_INCIDENTS = [
    {
        "title": "Severe underpass waterlogging with submerged taxi",
        "description": "Monsoon downpour caused 3.5 feet of water accumulation in Minto Bridge underpass. Taxi submerged with driver stranded on vehicle roof. Traffic completely stalled on Inner Circle.",
        "category": "flood",
        "severity": "critical",
        "latitude": 28.6328,
        "longitude": 77.2215,
        "address": "Minto Bridge Underpass, Connaught Place, New Delhi",
        "reporter_name": "Traffic Warden R. Verma",
        "is_verified": True,
    },
    {
        "title": "Commercial complex 3rd floor electrical fire",
        "description": "Dense black smoke billowing from server room of corporate building. Fire alarms active, building evacuation in progress. No open flames visible on exterior yet.",
        "category": "fire",
        "severity": "high",
        "latitude": 28.6295,
        "longitude": 77.2180,
        "address": "Barakhamba Road, Commercial Block B, New Delhi",
        "reporter_name": "Building Safety Officer",
        "is_verified": True,
    },
    {
        "title": "Storm gust uprooted 80ft banyan tree across 4 lanes",
        "description": "Squall brought down large heritage banyan tree crushing boundary wall and snapping power lines. Entire northbound carriage of Ring Road blocked.",
        "category": "severe_weather",
        "severity": "high",
        "latitude": 28.5910,
        "longitude": 77.2280,
        "address": "Lodhi Road near Nizamuddin Flyover, New Delhi",
        "reporter_name": "Municipal Sensor Node #8",
        "is_verified": False,
    },
    {
        "title": "Multi-vehicle pileup with fuel leak on flyover",
        "description": "Collision between inter-city bus and two light passenger vehicles on flyover descent. One vehicle leaking diesel fuel. Ambulance and rescue unit urgently needed.",
        "category": "road_accident",
        "severity": "critical",
        "latitude": 28.5670,
        "longitude": 77.2430,
        "address": "Lajpat Nagar Flyover, South Delhi",
        "reporter_name": "Highway Patrol Unit 2",
        "is_verified": False,
    },
    {
        "title": "Waterlogging report: Minto Bridge underpass impassable",
        "description": "Water logging rising rapidly under Minto Bridge railway crossing. Vehicles cannot pass, multiple cars turning around causing gridlock.",
        "category": "flood",
        "severity": "high",
        "latitude": 28.6335,
        "longitude": 77.2220,
        "address": "Minto Road Railway Underpass",
        "reporter_name": "Citizen Commuter",
        "is_verified": False,
    },
]


def seed_simulation_scenario(db: Session) -> Dict[str, Any]:
    """
    Clears existing simulation data and inserts a complete multi-hazard demo scenario.
    """
    # 1. Seed Responder Teams
    created_teams: List[ResponderTeam] = []
    for team_data in SIMULATED_TEAMS:
        existing = db.query(ResponderTeam).filter(ResponderTeam.name == team_data["name"]).first()
        if not existing:
            team = ResponderTeam(**team_data)
            db.add(team)
            db.commit()
            db.refresh(team)
            created_teams.append(team)
        else:
            created_teams.append(existing)

    # 2. Seed Incidents with automated explainable AI priority and duplicate link
    created_incidents: List[Incident] = []
    first_flood_id: int = 0

    for i, inc_data in enumerate(SIMULATED_INCIDENTS):
        score, explanation = assess_incident_priority(
            category=inc_data["category"],
            description=inc_data["description"],
            reported_severity=inc_data["severity"],
            has_image=False,
            is_verified=inc_data["is_verified"],
        )

        # Flag the 5th item as duplicate of the 1st (Minto bridge flood)
        dup_id = None
        dup_score = None
        if i == 4 and first_flood_id:
            dup_id = first_flood_id
            dup_score = 0.88

        inc = Incident(
            title=inc_data["title"],
            description=inc_data["description"],
            category=inc_data["category"],
            severity=inc_data["severity"],
            latitude=inc_data["latitude"],
            longitude=inc_data["longitude"],
            address=inc_data["address"],
            source="simulation",
            reporter_name=inc_data["reporter_name"],
            is_verified=inc_data["is_verified"],
            status="verified" if inc_data["is_verified"] else "reported",
            ai_priority_score=score,
            ai_priority_explanation=explanation,
            ai_duplicate_of_id=dup_id,
            ai_duplicate_score=dup_score,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=(5 - i) * 12),
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)

        if i == 0:
            first_flood_id = inc.id

        # Timeline event
        db.add(
            IncidentTimeline(
                incident_id=inc.id,
                event_type="created",
                description=f"[SIMULATION] Scenario incident activated. Priority: {score}/10",
                created_by="scenario_engine",
            )
        )
        if inc.is_verified:
            db.add(
                IncidentTimeline(
                    incident_id=inc.id,
                    event_type="verified",
                    description="[SIMULATION] Incident confirmed by emergency coordination center",
                    created_by="scenario_engine",
                )
            )
        db.commit()
        created_incidents.append(inc)

    # 3. Seed initial assignment for incident #1
    if created_incidents and created_teams:
        primary_inc = created_incidents[0]
        rescue_team = next((t for t in created_teams if t.type == "rescue"), created_teams[0])
        
        assignment = Assignment(
            incident_id=primary_inc.id,
            team_id=rescue_team.id,
            status="en_route",
            notes="Deploying motorized inflatable rescue boat and submersible pumps",
        )
        db.add(assignment)
        primary_inc.status = "responding"
        rescue_team.status = "deployed"
        
        db.add(
            IncidentTimeline(
                incident_id=primary_inc.id,
                event_type="assigned",
                description=f"[SIMULATION] Unit '{rescue_team.name}' dispatched to scene",
                created_by="scenario_engine",
            )
        )
        db.commit()

    return {
        "status": "success",
        "message": "Demo emergency scenario initialized successfully",
        "incidents_seeded": len(created_incidents),
        "teams_seeded": len(created_teams),
        "simulation_label": "ALL RECORDS TAGGED AS SOURCE='SIMULATION'",
    }
