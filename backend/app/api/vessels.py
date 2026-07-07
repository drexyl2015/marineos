"""Vessel management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_user, require_manager

router = APIRouter()

@router.get("/", response_model=dict)
async def list_vessels(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    vessels = db.query(models.Vessel).offset(skip).limit(limit).all()
    total = db.query(models.Vessel).count()
    result = []
    for v in vessels:
        crew_count = db.query(models.CrewAssignment).filter(
            models.CrewAssignment.vessel_id == v.id,
            models.CrewAssignment.status == "active"
        ).count()
        result.append({
            "id": v.id,
            "name": v.name,
            "imo": v.imo,
            "type": v.vessel_type,
            "flag": v.flag_state,
            "status": v.status,
            "crew_count": crew_count,
        })
    return {"total": total, "vessels": result}

@router.post("/", response_model=dict)
async def create_vessel(vessel: schemas.VesselCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_manager)):
    if vessel.imo and db.query(models.Vessel).filter(models.Vessel.imo == vessel.imo).first():
        raise HTTPException(status_code=400, detail="IMO number already exists")
    db_vessel = models.Vessel(**vessel.model_dump())
    db.add(db_vessel)
    db.commit()
    db.refresh(db_vessel)
    return {"status": "created", "vessel_id": db_vessel.id, "name": db_vessel.name}

@router.get("/{vessel_id}", response_model=dict)
async def get_vessel(vessel_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    assignments = db.query(models.CrewAssignment).filter(
        models.CrewAssignment.vessel_id == vessel_id,
        models.CrewAssignment.status == "active"
    ).all()
    return {
        "id": vessel.id,
        "name": vessel.name,
        "imo": vessel.imo,
        "type": vessel.vessel_type,
        "flag": vessel.flag_state,
        "status": vessel.status,
        "crew": [{"crew_id": a.crew_id, "position": a.position, "assignment_id": a.id} for a in assignments],
    }

@router.put("/{vessel_id}", response_model=dict)
async def update_vessel(vessel_id: int, vessel_update: schemas.VesselUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_manager)):
    vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    for field, value in vessel_update.model_dump(exclude_unset=True).items():
        setattr(vessel, field, value)
    db.commit()
    db.refresh(vessel)
    return {"status": "updated", "vessel_id": vessel.id}

@router.delete("/{vessel_id}", response_model=dict)
async def delete_vessel(vessel_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_manager)):
    vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    db.delete(vessel)
    db.commit()
    return {"status": "deleted", "vessel_id": vessel_id}

@router.get("/{vessel_id}/assignments", response_model=dict)
async def get_vessel_assignments(vessel_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    assignments = db.query(models.CrewAssignment).filter(
        models.CrewAssignment.vessel_id == vessel_id
    ).all()
    result = []
    for a in assignments:
        crew = db.query(models.Crew).filter(models.Crew.id == a.crew_id).first()
        result.append({
            "id": a.id,
            "crew_id": a.crew_id,
            "crew_name": crew.name if crew else "Unknown",
            "position": a.position,
            "status": a.status,
            "assignment_date": a.assignment_date.isoformat() if a.assignment_date else None,
        })
    return {"vessel_id": vessel_id, "assignments": result}
