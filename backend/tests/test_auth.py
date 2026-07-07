"""Auth endpoint tests"""
from app.config import settings
from app.bootstrap import ensure_owner_user
from app.auth_utils import verify_password
from app import models


def test_register_new_user(client):
    res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword",
        "full_name": "Test User",
        "role": "crew_manager",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_disabled_by_default_for_private_access(client):
    settings.ALLOW_PUBLIC_REGISTRATION = False
    res = client.post("/api/auth/register", json={
        "email": "blocked@example.com",
        "password": "securepassword",
        "full_name": "Blocked User",
    })
    assert res.status_code == 403


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass1234"}
    client.post("/api/auth/register", json=payload)
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400


def test_login_valid(client):
    client.post("/api/auth/register", json={"email": "login@example.com", "password": "mypassword"})
    res = client.post("/api/auth/login", json={"email": "login@example.com", "password": "mypassword"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"email": "wrong@example.com", "password": "correctpass"})
    res = client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "wrongpass"})
    assert res.status_code == 401


def test_get_me(client):
    reg = client.post("/api/auth/register", json={
        "email": "me@example.com", "password": "testpass", "full_name": "Me User",
    })
    token = reg.json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me User"


def test_get_me_invalid_token(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert res.status_code == 401


def test_owner_account_bootstrap_creates_super_admin(db):
    settings.OWNER_EMAIL = "owner@example.com"
    settings.OWNER_PASSWORD = "ownerpassword123"
    settings.OWNER_FULL_NAME = "MarineOS Owner"
    settings.OWNER_ROLE = "super_admin"

    ensure_owner_user(db)

    owner = db.query(models.User).filter(models.User.email == "owner@example.com").first()
    assert owner is not None
    assert owner.role == "super_admin"
    assert owner.full_name == "MarineOS Owner"
    assert owner.is_active is True
    assert verify_password("ownerpassword123", owner.hashed_password)
