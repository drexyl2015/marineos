"""Alert management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth_utils import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def list_alerts(
    crew_id: int = None,
    alert_type: str = None,
    resolved: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List system alerts"""
    query = db.query(models.Alert).filter(models.Alert.resolved == resolved)

    if crew_id:
        query = query.filter(models.Alert.crew_id == crew_id)

    if alert_type:
        query = query.filter(models.Alert.alert_type == alert_type)

    alerts = query.offset(skip).limit(limit).all()
    total = query.count()

    return {
        "total": total,
        "alerts": [
            {
                "id": a.id,
                "crew_id": a.crew_id,
                "type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "created_at": a.created_at.isoformat(),
                "resolved": a.resolved
            }
            for a in alerts
        ]
    }

@router.get("/{alert_id}", response_model=dict)
async def get_alert(alert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get alert details"""
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    crew = db.query(models.Crew).filter(models.Crew.id == alert.crew_id).first()

    return {
        "id": alert.id,
        "crew_id": alert.crew_id,
        "crew_name": crew.name if crew else "Unknown",
        "type": alert.alert_type,
        "severity": alert.severity,
        "message": alert.message,
        "created_at": alert.created_at.isoformat(),
        "resolved": alert.resolved,
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
    }

@router.put("/{alert_id}/resolve", response_model=dict)
async def resolve_alert(alert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Mark alert as resolved"""
    from datetime import datetime

    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()

    return {
        "status": "resolved",
        "alert_id": alert.id,
        "resolved_at": alert.resolved_at.isoformat()
    }
