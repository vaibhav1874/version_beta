"""
Project JEEVAN — Simulation Router
Endpoints to seed and reset clearly labelled emergency demonstration scenarios.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.incident import Incident
from models.responder import ResponderTeam, Assignment, IncidentTimeline
from services.simulation import seed_simulation_scenario

router = APIRouter(prefix="/api/simulation", tags=["Simulation & Demo"])


@router.post(
    "/seed",
    status_code=status.HTTP_201_CREATED,
    summary="Seed repeatable hackathon demo emergency scenario",
)
def seed_demo_scenario(db: Session = Depends(get_db)):
    """
    Populates multi-hazard incidents (flood, fire, weather, accident)
    with responder units, assignments, and audit timelines.
    All data is clearly labelled with source='simulation'.
    """
    return seed_simulation_scenario(db)


@router.post(
    "/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset simulation incidents and clear demo data",
)
def reset_simulation_data(db: Session = Depends(get_db)):
    """Removes records created by the simulation engine."""
    # Find simulated incident IDs
    sim_incidents = db.query(Incident).filter(Incident.source == "simulation").all()
    sim_ids = [inc.id for inc in sim_incidents]

    if sim_ids:
        # Delete timeline events
        db.query(IncidentTimeline).filter(IncidentTimeline.incident_id.in_(sim_ids)).delete(synchronize_session=False)
        # Delete assignments
        db.query(Assignment).filter(Assignment.incident_id.in_(sim_ids)).delete(synchronize_session=False)
        # Delete incidents
        db.query(Incident).filter(Incident.id.in_(sim_ids)).delete(synchronize_session=False)

    db.commit()
    return {
        "status": "success",
        "message": f"Cleared {len(sim_ids)} simulated incident records.",
    }
