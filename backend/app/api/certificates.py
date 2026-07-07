"""Certificate management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app import schemas, models
from app.auth_utils import get_current_user, require_manager

router = APIRouter()

@router.get("/", response_model=dict)
async def list_certificates(
    crew_id: Optional[int] = None,
    expiring_soon: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List certificates with optional filtering"""
    query = db.query(models.Certificate)

    if crew_id:
        query = query.filter(models.Certificate.crew_id == crew_id)

    if expiring_soon:
        days_ahead = 90
        cutoff = datetime.utcnow().date() + timedelta(days=days_ahead)
        query = query.filter(models.Certificate.expiry_date <= cutoff)

    certificates = query.offset(skip).limit(limit).all()
    total = query.count()

    return {
        "total": total,
        "certificates": [
            {
                "id": c.id,
                "crew_id": c.crew_id,
                "type": c.certificate_type,
                "issue_date": c.issue_date.isoformat(),
                "expiry_date": c.expiry_date.isoformat(),
                "authority": c.issuing_authority
            }
            for c in certificates
        ]
    }

@router.post("/", response_model=dict)
async def create_certificate(
    cert: schemas.CertificateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_manager)
):
    """Create new certificate"""
    crew = db.query(models.Crew).filter(models.Crew.id == cert.crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")

    db_cert = models.Certificate(**cert.model_dump())
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)

    return {
        "status": "created",
        "certificate_id": db_cert.id,
        "crew_id": db_cert.crew_id,
        "expiry_date": db_cert.expiry_date.isoformat()
    }

@router.put("/{cert_id}", response_model=dict)
async def update_certificate(
    cert_id: int,
    cert_update: schemas.CertificateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_manager)
):
    """Update certificate details"""
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    update_data = cert_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cert, field, value)
    db.commit()
    db.refresh(cert)
    return {"status": "updated", "certificate_id": cert.id}

@router.delete("/{cert_id}", response_model=dict)
async def delete_certificate(cert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_manager)):
    """Delete a certificate"""
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    db.delete(cert)
    db.commit()
    return {"status": "deleted", "certificate_id": cert_id}

@router.get("/{cert_id}", response_model=dict)
async def get_certificate(cert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get certificate details"""
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    crew = db.query(models.Crew).filter(models.Crew.id == cert.crew_id).first()

    return {
        "id": cert.id,
        "crew_id": cert.crew_id,
        "crew_name": crew.name if crew else "Unknown",
        "type": cert.certificate_type,
        "issue_date": cert.issue_date.isoformat(),
        "expiry_date": cert.expiry_date.isoformat(),
        "authority": cert.issuing_authority,
        "ratings": cert.ratings,
        "endorsements": cert.endorsements,
        "days_until_expiry": (cert.expiry_date - datetime.utcnow().date()).days
    }
