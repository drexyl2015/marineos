"""Document management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth_utils import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def list_documents(
    vessel_id: int = None,
    doc_type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List uploaded documents"""
    query = db.query(models.Document)

    if vessel_id:
        query = query.filter(models.Document.vessel_id == vessel_id)

    if doc_type:
        query = query.filter(models.Document.document_type == doc_type)

    documents = query.offset(skip).limit(limit).all()
    total = query.count()

    return {
        "total": total,
        "documents": [
            {
                "id": d.id,
                "vessel_id": d.vessel_id,
                "type": d.document_type,
                "file_name": d.file_name,
                "uploaded_at": d.uploaded_at.isoformat(),
                "compliance_status": d.compliance_status
            }
            for d in documents
        ]
    }

@router.get("/{doc_id}", response_model=dict)
async def get_document(doc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get document details and extracted data"""
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": doc.id,
        "vessel_id": doc.vessel_id,
        "type": doc.document_type,
        "file_name": doc.file_name,
        "uploaded_at": doc.uploaded_at.isoformat(),
        "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
        "compliance_status": doc.compliance_status,
        "extracted_data": doc.extracted_data,
        "ai_analysis": doc.ai_analysis
    }
