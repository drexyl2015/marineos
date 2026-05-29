"""AI-powered endpoints for maritime compliance and document analysis"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.ai_service import ai_service
from app import schemas, models
from typing import Optional

router = APIRouter()

@router.post("/parse-document", response_model=dict)
async def parse_document(
    file: UploadFile = File(...),
    document_type: str = "certificate",
    db: Session = Depends(get_db)
):
    """
    Upload a maritime document and extract structured data using Claude AI.
    Supports: Certificates, licenses, crew documents, vessel documents
    """
    try:
        content = await file.read()
        text_content = content.decode('utf-8', errors='ignore')

        result = ai_service.parse_certificate_document(text_content, document_type)

        return {
            "status": "success",
            "document_type": document_type,
            "extracted_data": result,
            "file_name": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/parse-certificate-image", response_model=dict)
async def parse_certificate_image(file: UploadFile = File(...)):
    """
    Upload a certificate photo or scan; Claude vision extracts the fields.
    Returns: certificate_type, issue_date, expiry_date, issuing_authority, confidence.
    """
    ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    media_type = (file.content_type or "image/jpeg").split(";")[0].strip()
    if media_type not in ALLOWED:
        raise HTTPException(400, detail="Only JPEG, PNG, WebP, or GIF images are supported.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, detail="Image must be under 10 MB.")
    try:
        result = ai_service.parse_certificate_image(data, media_type)
        return result
    except Exception as e:
        raise HTTPException(500, detail=f"AI parsing failed: {str(e)}")


@router.post("/check-compliance", response_model=dict)
async def check_compliance(
    crew_id: int,
    regulation_type: str = "STCW",
    db: Session = Depends(get_db)
):
    """
    Verify crew member against maritime regulations.
    Checks: STCW, MLC, SOLAS, IMO GISIS
    Returns compliance status, gaps, and recommendations
    """
    crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")

    result = ai_service.check_regulatory_compliance(crew_id, db)

    return {
        "status": "success",
        "crew_id": crew_id,
        "crew_name": crew.name,
        "compliance_check": result
    }

@router.post("/recommend-crew", response_model=dict)
async def recommend_crew(
    vessel_id: int,
    position: str,
    db: Session = Depends(get_db)
):
    """
    Get AI recommendations for crew assignments.
    Uses Claude AI to match crew based on:
    - Position/role requirements
    - Certificate/qualification match
    - Availability
    - Experience level
    """
    vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")

    result = ai_service.generate_crew_matching_recommendations(vessel_id, position, db)

    return {
        "status": "success",
        "vessel_id": vessel_id,
        "position": position,
        "recommendations": result
    }

@router.post("/generate-briefing", response_model=dict)
async def generate_briefing(
    vessel_id: int,
    port_name: str,
    db: Session = Depends(get_db)
):
    """
    Generate port arrival compliance briefing.
    Includes:
    - PSC inspection requirements
    - Crew documentation needs
    - Safety compliance checklist
    - Environmental regulations
    - Required documentation
    """
    vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")

    result = ai_service.generate_compliance_briefing(vessel_id, port_name, db)

    # Store briefing in database
    briefing = models.ComplianceBriefing(
        vessel_id=vessel_id,
        briefing_type="port_arrival",
        port_name=port_name,
        content=result.get("briefing", ""),
        ai_generated=True
    )
    db.add(briefing)
    db.commit()

    return {
        "status": "success",
        "vessel_id": vessel_id,
        "port": port_name,
        "briefing": result,
        "briefing_id": briefing.id
    }

@router.post("/assess-risks", response_model=dict)
async def assess_risks(
    crew_id: int,
    db: Session = Depends(get_db)
):
    """
    Predictive compliance risk assessment.
    Identifies:
    - Certificate expiration risks
    - Regulatory compliance gaps
    - Training currency issues
    - Estimated time to non-compliance
    """
    crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")

    result = ai_service.assess_compliance_risk(crew_id, db)

    # Create alert if high risk
    if result.get("risk_level") == "high":
        alert = models.Alert(
            crew_id=crew_id,
            alert_type="compliance_risk",
            severity="high",
            message=f"Risk Score: {result.get('overall_risk_score')}",
            resolved=False
        )
        db.add(alert)
        db.commit()

    return {
        "status": "success",
        "crew_id": crew_id,
        "risk_assessment": result
    }

@router.get("/crew-pool-analysis", response_model=dict)
async def crew_pool_analysis(db: Session = Depends(get_db)):
    """
    Strategic workforce analysis.
    Provides insights on:
    - Crew capacity vs demand
    - Position-specific gaps
    - Certificate expiration timeline
    - Hiring recommendations
    - Skills redundancy
    """
    result = ai_service.analyze_crew_pool(db)

    return {
        "status": "success",
        "analysis": result
    }

@router.get("/health")
async def health_check():
    """Check if AI service is operational"""
    try:
        # Test Claude API connectivity
        test_message = ai_service.client.messages.create(
            model=ai_service.model,
            max_tokens=10,
            messages=[{"role": "user", "content": "OK"}]
        )
        return {
            "status": "healthy",
            "ai_service": "operational",
            "model": ai_service.model
        }
    except Exception as e:
        return {
            "status": "degraded",
            "ai_service": "error",
            "error": str(e)
        }
