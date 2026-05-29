"""Crew management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, models
from app.auth_utils import get_current_user
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=dict)
async def list_crew(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all crew members with optional filtering"""
    query = db.query(models.Crew)

    if status:
        query = query.filter(models.Crew.status == status)

    crew = query.offset(skip).limit(limit).all()
    total = query.count()

    return {
        "total": total,
        "crew": [
            {
                "id": c.id,
                "name": c.name,
                "employee_id": c.employee_id,
                "position": c.position,
                "status": c.status,
                "nationality": c.nationality
            }
            for c in crew
        ]
    }

@router.get("/{crew_id}", response_model=dict)
async def get_crew(crew_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get crew member details"""
    crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")

    certificates = db.query(models.Certificate).filter(
        models.Certificate.crew_id == crew_id
    ).all()

    return {
        "id": crew.id,
        "name": crew.name,
        "employee_id": crew.employee_id,
        "position": crew.position,
        "status": crew.status,
        "nationality": crew.nationality,
        "email": crew.email,
        "phone": crew.phone,
        "certificates": [
            {
                "id": c.id,
                "type": c.certificate_type,
                "expiry": c.expiry_date.isoformat()
            }
            for c in certificates
        ]
    }

@router.post("/", response_model=dict)
async def create_crew(
    crew: schemas.CrewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create new crew member"""
    if crew.employee_id:
        existing = db.query(models.Crew).filter(
            models.Crew.employee_id == crew.employee_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID / Contract No. already exists")

    db_crew = models.Crew(**crew.dict())
    db.add(db_crew)
    db.commit()
    db.refresh(db_crew)

    return {
        "status": "created",
        "crew_id": db_crew.id,
        "name": db_crew.name
    }

@router.put("/{crew_id}", response_model=dict)
async def update_crew(
    crew_id: int,
    crew_update: schemas.CrewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update crew member"""
    crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")

    update_data = crew_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crew, field, value)

    db.commit()
    db.refresh(crew)

    return {
        "status": "updated",
        "crew_id": crew.id,
        "name": crew.name
    }

@router.delete("/{crew_id}", response_model=dict)
async def delete_crew(crew_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Delete crew member"""
    crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    db.delete(crew)
    db.commit()
    return {"status": "deleted", "crew_id": crew_id}
