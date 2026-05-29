"""SQLAlchemy ORM models for Marine Document System"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text, Date, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    imo = Column(String(20), unique=True, index=True)
    vessel_type = Column(String(100))
    flag_state = Column(String(100))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crew = relationship("CrewAssignment", back_populates="vessel")
    documents = relationship("Document", back_populates="vessel")

class Crew(Base):
    __tablename__ = "crew"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    employee_id = Column(String(50), unique=True, index=True)
    nationality = Column(String(100))
    position = Column(String(100))
    status = Column(String(50), default="available")
    email = Column(String(255))
    phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    certificates = relationship("Certificate", back_populates="crew")
    assignments = relationship("CrewAssignment", back_populates="crew")
    alerts = relationship("Alert", back_populates="crew")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crew.id"))
    certificate_type = Column(String(100), index=True)
    issue_date = Column(Date)
    expiry_date = Column(Date, index=True)
    issuing_authority = Column(String(255))
    ratings = Column(JSON, default=list)
    endorsements = Column(JSON, default=list)
    document_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crew = relationship("Crew", back_populates="certificates")

class CrewAssignment(Base):
    __tablename__ = "crew_assignments"

    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crew.id"))
    vessel_id = Column(Integer, ForeignKey("vessels.id"))
    position = Column(String(100))
    assignment_date = Column(DateTime, default=datetime.utcnow)
    expected_end_date = Column(DateTime)
    status = Column(String(50), default="active")

    crew = relationship("Crew", back_populates="assignments")
    vessel = relationship("Vessel", back_populates="crew")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    vessel_id = Column(Integer, ForeignKey("vessels.id"))
    document_type = Column(String(100), index=True)
    file_name = Column(String(255))
    file_url = Column(String(500))
    extracted_data = Column(JSON)
    ai_analysis = Column(JSON)
    compliance_status = Column(String(50))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    vessel = relationship("Vessel", back_populates="documents")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crew.id"))
    alert_type = Column(String(100), index=True)
    severity = Column(String(20))
    message = Column(Text)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)

    crew = relationship("Crew", back_populates="alerts")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="crew_manager")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ComplianceBriefing(Base):
    __tablename__ = "compliance_briefings"

    id = Column(Integer, primary_key=True, index=True)
    vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=True)
    briefing_type = Column(String(100))
    content = Column(Text)
    port_name = Column(String(255), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    ai_generated = Column(Boolean, default=True)
