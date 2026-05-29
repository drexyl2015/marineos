"""Seed sample data for Marine Document System demo"""
from datetime import datetime, timedelta
from app.models import Base, Crew, Certificate, Vessel
from app.database import engine, SessionLocal

def seed_demo_data():
    """Create sample data for testing"""
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Clear existing data
    db.query(Crew).delete()
    db.query(Certificate).delete()
    db.query(Vessel).delete()

    # Create sample vessels
    vessels = [
        Vessel(
            name="MV Pacific Explorer",
            imo="1234567",
            vessel_type="Container Ship",
            flag_state="Panama",
            status="active"
        ),
        Vessel(
            name="MV Sunrise",
            imo="2345678",
            vessel_type="Bulk Carrier",
            flag_state="Liberia",
            status="active"
        ),
        Vessel(
            name="MV Neptune",
            imo="3456789",
            vessel_type="Tanker",
            flag_state="Marshall Islands",
            status="active"
        ),
    ]
    db.add_all(vessels)
    db.flush()

    # Create sample crew
    crew_members = [
        Crew(
            name="Captain John Smith",
            employee_id="CREW001",
            nationality="British",
            position="Master",
            status="available"
        ),
        Crew(
            name="Sarah Johnson",
            employee_id="CREW002",
            nationality="American",
            position="Chief Engineer",
            status="onboard"
        ),
        Crew(
            name="Ahmed Hassan",
            employee_id="CREW003",
            nationality="Egyptian",
            position="Second Officer",
            status="available"
        ),
        Crew(
            name="Maria Garcia",
            employee_id="CREW004",
            nationality="Spanish",
            position="Bosun",
            status="onboard"
        ),
        Crew(
            name="Ivan Petrov",
            employee_id="CREW005",
            nationality="Russian",
            position="Electrician",
            status="available"
        ),
    ]
    db.add_all(crew_members)
    db.flush()

    # Create sample certificates
    certificates = [
        Certificate(
            crew_id=crew_members[0].id,
            certificate_type="STCW Master",
            issue_date=datetime.now().date() - timedelta(days=365),
            expiry_date=datetime.now().date() + timedelta(days=180),
            issuing_authority="UK MCA",
            ratings=["Master", "Master (Ocean-Going)"],
            endorsements=["Container Ships", "Tankers"]
        ),
        Certificate(
            crew_id=crew_members[0].id,
            certificate_type="Medical Certificate",
            issue_date=datetime.now().date() - timedelta(days=200),
            expiry_date=datetime.now().date() + timedelta(days=100),
            issuing_authority="UK MCA",
            ratings=[],
            endorsements=[]
        ),
        Certificate(
            crew_id=crew_members[1].id,
            certificate_type="STCW Chief Engineer",
            issue_date=datetime.now().date() - timedelta(days=300),
            expiry_date=datetime.now().date() + timedelta(days=60),
            issuing_authority="US Coast Guard",
            ratings=["Chief Engineer"],
            endorsements=["Motor Vessel"]
        ),
        Certificate(
            crew_id=crew_members[2].id,
            certificate_type="STCW Officer",
            issue_date=datetime.now().date() - timedelta(days=250),
            expiry_date=datetime.now().date() + timedelta(days=115),
            issuing_authority="AMSA",
            ratings=["Master (Ocean-Going)"],
            endorsements=[]
        ),
        Certificate(
            crew_id=crew_members[3].id,
            certificate_type="Basic Safety Training",
            issue_date=datetime.now().date() - timedelta(days=180),
            expiry_date=datetime.now().date() + timedelta(days=200),
            issuing_authority="Lloyd's Register",
            ratings=[],
            endorsements=[]
        ),
    ]
    db.add_all(certificates)

    db.commit()
    print("✅ Sample data created successfully!")
    print(f"   - Created {len(vessels)} vessels")
    print(f"   - Created {len(crew_members)} crew members")
    print(f"   - Created {len(certificates)} certificates")
    db.close()

if __name__ == "__main__":
    seed_demo_data()
