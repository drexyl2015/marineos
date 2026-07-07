"""Shared test fixtures"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app import models  # registers all models with Base.metadata before create_all
from app.config import settings

SQLITE_URL = "sqlite://"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    settings.ALLOW_PUBLIC_REGISTRATION = True
    settings.OWNER_EMAIL = None
    settings.OWNER_PASSWORD = None
    settings.OWNER_UPDATE_PASSWORD_ON_STARTUP = False
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def auth_headers(client):
    """Register a user and return Bearer auth headers."""
    client.post("/api/auth/register", json={
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "crew_manager",
    })
    res = client.post("/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "testpassword123",
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def low_priv_headers(client, db):
    """Create a low-privilege (seafarer) user directly and return Bearer headers.

    Public registration always assigns the crew_manager role, so a read-only
    role has to be seeded straight into the database.
    """
    from app.auth_utils import hash_password
    user = models.User(
        email="seafarer@example.com",
        hashed_password=hash_password("seafarerpass123"),
        full_name="Sea Farer",
        role="seafarer",
        is_active=True,
    )
    db.add(user)
    db.commit()
    res = client.post("/api/auth/login", json={
        "email": "seafarer@example.com",
        "password": "seafarerpass123",
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    from main import app
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
