"""Crew assignment endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def list_assignments(db: Session = Depends(get_db)):
    assignments = db.query(models.CrewAssignment).filter(
        models.CrewAssignment.status == "active"
    ).all()
    result = []
    for a in assignments:
        crew = db.query(models.Crew).filter(models.Crew.id == a.crew_id).first()
        vessel = db.query(models.Vessel).filter(models.Vessel.id == a.vessel_id).first()
        result.append({
            "id": a.id,
            "crew_id": a.crew_id,
            "crew_name": crew.name if crew else "Unknown",
            "vessel_id": a.vessel_id,
            "vessel_name": vessel.name if vessel else "Unknown",
            "position": a.position,
            "status": a.status,
            "assignment_date": a.assignment_date.isoformat() if a.assignment_date else None,
        })
    return {"total": len(result), "assignments": result}

@router.post("/", response_model=dict)
async def create_assignment(assignment: schemas.AssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    crew = db.query(models.Crew).filter(models.Crew.id == assignment.crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    vessel = db.query(models.Vessel).filter(models.Vessel.id == assignment.vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    db_assignment = models.CrewAssignment(**assignment.dict())
    crew.status = "onboard"
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return {"status": "created", "assignment_id": db_assignment.id}

@router.put("/{assignment_id}", response_model=dict)
async def update_assignment(assignment_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assignment = db.query(models.CrewAssignment).filter(models.CrewAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.status = status
    if status == "completed":
        crew = db.query(models.Crew).filter(models.Crew.id == assignment.crew_id).first()
        if crew:
            crew.status = "available"
    db.commit()
    return {"status": "updated", "assignment_id": assignment_id}
