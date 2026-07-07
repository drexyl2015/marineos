"""Free month + $10/month subscription gating."""
from datetime import datetime, timedelta

from app import models
from app.auth_utils import hash_password
from app.config import settings


def _make_user(db, email, *, role="crew_manager", trial_delta_days=None, subscribed_delta_days=None):
    user = models.User(
        email=email,
        hashed_password=hash_password("password-123456"),
        full_name="Billing Test",
        role=role,
        is_active=True,
        email_verified=True,
        trial_expires_at=(
            datetime.utcnow() + timedelta(days=trial_delta_days)
            if trial_delta_days is not None else None
        ),
        subscribed_until=(
            datetime.utcnow() + timedelta(days=subscribed_delta_days)
            if subscribed_delta_days is not None else None
        ),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client, email):
    return client.post("/api/auth/login", json={"email": email, "password": "password-123456"})


def test_registration_grants_free_month(client, db):
    settings.REQUIRE_EMAIL_VERIFICATION = False
    client.post("/api/auth/register", json={
        "email": "fresh@example.com", "password": "password-123456", "full_name": "Fresh",
    })
    user = db.query(models.User).filter(models.User.email == "fresh@example.com").first()
    assert user.trial_expires_at is not None
    days_left = (user.trial_expires_at - datetime.utcnow()).days
    assert 28 <= days_left <= settings.TRIAL_DAYS


def test_active_trial_can_login(client, db):
    _make_user(db, "trialing@example.com", trial_delta_days=10)
    assert _login(client, "trialing@example.com").status_code == 200


def test_expired_trial_gets_402(client, db):
    _make_user(db, "expired@example.com", trial_delta_days=-1)
    res = _login(client, "expired@example.com")
    assert res.status_code == 402
    assert "$10/month" in res.json()["detail"]


def test_paid_subscriber_can_login(client, db):
    _make_user(db, "paid@example.com", trial_delta_days=-30, subscribed_delta_days=20)
    assert _login(client, "paid@example.com").status_code == 200


def test_super_admin_is_exempt(client, db):
    _make_user(db, "boss@example.com", role="super_admin", trial_delta_days=-30)
    assert _login(client, "boss@example.com").status_code == 200


def test_activate_subscription_is_super_admin_only(client, db, auth_headers):
    target = _make_user(db, "customer@example.com", trial_delta_days=-1)
    # auth_headers is a crew_manager — must be rejected.
    res = client.post(f"/api/auth/activate-subscription/{target.id}", headers=auth_headers)
    assert res.status_code == 403


def test_activate_subscription_grants_access(client, db):
    target = _make_user(db, "customer2@example.com", trial_delta_days=-1)
    _make_user(db, "admin2@example.com", role="super_admin", trial_delta_days=None)
    admin_token = _login(client, "admin2@example.com").json()["access_token"]

    res = client.post(
        f"/api/auth/activate-subscription/{target.id}?days=31",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["subscribed_until"] is not None

    assert _login(client, "customer2@example.com").status_code == 200


def test_billing_info_is_public(client):
    res = client.get("/api/auth/billing-info")
    assert res.status_code == 200
    body = res.json()
    assert body["price"] == "$10/month"
    assert body["trial_days"] == settings.TRIAL_DAYS
