"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

# Crew Schemas
class CrewBase(BaseModel):
    name: str
    employee_id: Optional[str] = None
    nationality: str
    position: str
    email: Optional[str] = None
    phone: Optional[str] = None

class CrewCreate(CrewBase):
    pass

class CrewUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    nationality: Optional[str] = None

class CrewResponse(CrewBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Certificate Schemas
class CertificateBase(BaseModel):
    certificate_type: str
    issue_date: date
    expiry_date: date
    issuing_authority: str
    ratings: List[str] = []
    endorsements: List[str] = []

class CertificateCreate(CertificateBase):
    crew_id: int

class CertificateUpdate(BaseModel):
    certificate_type: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    issuing_authority: Optional[str] = None

class CertificateResponse(CertificateBase):
    id: int
    crew_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Vessel Schemas
class VesselBase(BaseModel):
    name: str
    imo: str
    vessel_type: str
    flag_state: str

class VesselCreate(VesselBase):
    pass

class VesselUpdate(BaseModel):
    name: Optional[str] = None
    vessel_type: Optional[str] = None
    flag_state: Optional[str] = None
    status: Optional[str] = None

class AssignmentCreate(BaseModel):
    crew_id: int
    vessel_id: int
    position: str

class AssignmentResponse(BaseModel):
    id: int
    crew_id: int
    vessel_id: int
    position: str
    status: str

    class Config:
        from_attributes = True

class VesselResponse(VesselBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    vessel_id: int
    document_type: str
    file_name: str
    compliance_status: Optional[str]
    uploaded_at: datetime
    extracted_data: Optional[dict]
    ai_analysis: Optional[dict]

    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    crew_id: int
    alert_type: str
    severity: str
    message: str
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

# AI Service Schemas
class ComplianceCheckRequest(BaseModel):
    crew_id: int
    regulation_type: str = "STCW"

class ComplianceCheckResponse(BaseModel):
    crew_id: int
    regulation_type: str
    is_compliant: bool
    gaps: List[str]
    recommendations: List[str]
    confidence_score: float

class CrewMatchingRequest(BaseModel):
    vessel_id: int
    position: str
    urgency: str = "normal"

class CrewMatchingResponse(BaseModel):
    vessel_id: int
    position: str
    recommended_crew: List[dict]
    match_scores: List[float]

class ComplianceBriefingResponse(BaseModel):
    vessel_id: Optional[int]
    briefing_type: str
    content: str
    port_name: Optional[str]
    generated_at: datetime

class CrewPoolAnalysisResponse(BaseModel):
    total_crew: int
    available_crew: int
    onboard_crew: int
    by_position: dict
    soon_available: List[dict]
    expiring_certificates: List[dict]
    risk_assessment: dict

# Auth Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    trial_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
