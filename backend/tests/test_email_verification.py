"""Email verification and one-time sign-in code flows."""
import re

from app.config import settings
from app import models


REGISTER_BODY = {
    "email": "newuser@example.com",
    "password": "a-strong-password-123",
    "full_name": "New User",
}


def _register_with_verification(client):
    settings.REQUIRE_EMAIL_VERIFICATION = True
    res = client.post("/api/auth/register", json=REGISTER_BODY)
    assert res.status_code == 200
    assert res.json()["status"] == "verification_sent"
    return res


# --- Registration requires verification before login ---------------------------

def test_unverified_user_cannot_login(client):
    _register_with_verification(client)
    res = client.post("/api/auth/login", json={
        "email": REGISTER_BODY["email"],
        "password": REGISTER_BODY["password"],
    })
    assert res.status_code == 403
    assert "verify" in res.json()["detail"].lower()


def test_verification_link_enables_login(client, db):
    _register_with_verification(client)
    user = db.query(models.User).filter(models.User.email == REGISTER_BODY["email"]).first()
    assert user is not None and user.verification_token

    res = client.get(
        f"/api/auth/verify-email?token={user.verification_token}",
        follow_redirects=False,
    )
    assert res.status_code in (302, 307)
    assert "verified=1" in res.headers["location"]

    res = client.post("/api/auth/login", json={
        "email": REGISTER_BODY["email"],
        "password": REGISTER_BODY["password"],
    })
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_bad_verification_token_rejected(client):
    res = client.get("/api/auth/verify-email?token=not-a-real-token", follow_redirects=False)
    assert res.status_code in (302, 307)
    assert "verified=0" in res.headers["location"]


# --- One-time sign-in code ("forgot password") ---------------------------------

def _register_verified_user(client):
    settings.REQUIRE_EMAIL_VERIFICATION = False
    res = client.post("/api/auth/register", json=REGISTER_BODY)
    assert res.status_code == 200


def _request_code_and_capture(client, monkeypatch):
    from app.api import auth as auth_module

    sent = {}

    def fake_send(to, subject, body_html):
        sent["to"] = to
        sent["html"] = body_html

    monkeypatch.setattr(auth_module, "send_email_background", fake_send)
    auth_module._email_requests.clear()

    res = client.post("/api/auth/request-login-code", json={"email": REGISTER_BODY["email"]})
    assert res.status_code == 200
    match = re.search(r">(\d{6})<", sent["html"])
    assert match, "sign-in code not found in email body"
    return match.group(1)


def test_login_with_emailed_code(client, monkeypatch):
    _register_verified_user(client)
    code = _request_code_and_capture(client, monkeypatch)

    res = client.post("/api/auth/login-with-code", json={
        "email": REGISTER_BODY["email"],
        "code": code,
    })
    assert res.status_code == 200
    assert res.json()["access_token"]

    # The code is single-use.
    res = client.post("/api/auth/login-with-code", json={
        "email": REGISTER_BODY["email"],
        "code": code,
    })
    assert res.status_code == 401


def test_wrong_code_rejected(client, monkeypatch):
    _register_verified_user(client)
    code = _request_code_and_capture(client, monkeypatch)
    wrong = "000000" if code != "000000" else "111111"

    res = client.post("/api/auth/login-with-code", json={
        "email": REGISTER_BODY["email"],
        "code": wrong,
    })
    assert res.status_code == 401


def test_code_request_never_reveals_account_existence(client, monkeypatch):
    from app.api import auth as auth_module
    monkeypatch.setattr(auth_module, "send_email_background", lambda *a: None)
    auth_module._email_requests.clear()

    res = client.post("/api/auth/request-login-code", json={"email": "ghost@example.com"})
    assert res.status_code == 200
    assert "if that email" in res.json()["message"].lower()
