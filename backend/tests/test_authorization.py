"""Negative authorization tests.

Verify that backend role enforcement is a real security boundary: low-privilege
roles (seafarer) keep authenticated read access but cannot mutate data or trigger
paid AI endpoints, and non-super-admins cannot grant trials.
"""


# --- Low-privilege role cannot write -----------------------------------------

def test_seafarer_cannot_create_crew(client, low_priv_headers):
    res = client.post(
        "/api/crew/",
        json={"name": "Blocked", "nationality": "Filipino", "position": "Cook"},
        headers=low_priv_headers,
    )
    assert res.status_code == 403


def test_seafarer_cannot_update_crew(client, auth_headers, low_priv_headers):
    # A manager creates the record...
    created = client.post(
        "/api/crew/",
        json={"name": "Target", "nationality": "German", "position": "Cook"},
        headers=auth_headers,
    )
    crew_id = created.json()["crew_id"]
    # ...the seafarer must not be able to modify it.
    res = client.put(
        f"/api/crew/{crew_id}",
        json={"status": "onboard"},
        headers=low_priv_headers,
    )
    assert res.status_code == 403


def test_seafarer_cannot_delete_crew(client, auth_headers, low_priv_headers):
    created = client.post(
        "/api/crew/",
        json={"name": "Target2", "nationality": "German", "position": "Cook"},
        headers=auth_headers,
    )
    crew_id = created.json()["crew_id"]
    res = client.delete(f"/api/crew/{crew_id}", headers=low_priv_headers)
    assert res.status_code == 403


def test_seafarer_cannot_create_vessel(client, low_priv_headers):
    res = client.post(
        "/api/vessels/",
        json={"name": "MV Blocked", "imo": "IMO9999999", "vessel_type": "Tanker", "flag_state": "Panama"},
        headers=low_priv_headers,
    )
    assert res.status_code == 403


def test_seafarer_cannot_create_certificate(client, low_priv_headers):
    res = client.post(
        "/api/certificates/",
        json={
            "crew_id": 1,
            "certificate_type": "STCW",
            "issue_date": "2024-01-01",
            "expiry_date": "2027-01-01",
            "issuing_authority": "Flag State",
        },
        headers=low_priv_headers,
    )
    assert res.status_code == 403


def test_seafarer_cannot_use_ai_compliance_check(client, low_priv_headers):
    res = client.post(
        "/api/ai/check-compliance?crew_id=1&regulation_type=STCW",
        headers=low_priv_headers,
    )
    assert res.status_code == 403


# --- Low-privilege role keeps read access ------------------------------------

def test_seafarer_can_still_read_crew_list(client, low_priv_headers):
    res = client.get("/api/crew/", headers=low_priv_headers)
    assert res.status_code == 200


def test_seafarer_can_still_read_vessel_list(client, low_priv_headers):
    res = client.get("/api/vessels/", headers=low_priv_headers)
    assert res.status_code == 200


# --- Manager role retains write access (no regression) -----------------------

def test_manager_can_create_crew(client, auth_headers):
    res = client.post(
        "/api/crew/",
        json={"name": "Allowed", "nationality": "Filipino", "position": "Cook"},
        headers=auth_headers,
    )
    assert res.status_code == 200


# --- grant-trial is super_admin only -----------------------------------------

def test_non_super_admin_cannot_grant_trial(client, auth_headers):
    # auth_headers is a crew_manager, not super_admin.
    res = client.post("/api/auth/grant-trial/1", headers=auth_headers)
    assert res.status_code == 403


def test_grant_trial_requires_auth(client):
    res = client.post("/api/auth/grant-trial/1")
    assert res.status_code == 401


# --- Registration is closed when public registration is disabled -------------

def test_registration_blocked_when_disabled(client):
    from app.config import settings
    settings.ALLOW_PUBLIC_REGISTRATION = False
    res = client.post("/api/auth/register", json={
        "email": "newperson@example.com",
        "password": "securepassword",
        "full_name": "New Person",
    })
    assert res.status_code == 403


# --- Assignments and alerts enforce the same boundary -------------------------

def test_assignments_list_requires_auth(client):
    res = client.get("/api/assignments/")
    assert res.status_code == 401


def test_seafarer_cannot_create_assignment(client, low_priv_headers):
    res = client.post(
        "/api/assignments/",
        json={"crew_id": 1, "vessel_id": 1, "position": "Cook"},
        headers=low_priv_headers,
    )
    assert res.status_code == 403


def test_seafarer_cannot_resolve_alert(client, low_priv_headers):
    res = client.put("/api/alerts/1/resolve", headers=low_priv_headers)
    assert res.status_code == 403


# --- Anonymous AI chat is rate limited ----------------------------------------

def test_anonymous_chat_rate_limited(client, monkeypatch):
    from app.api import ai_chat
    from app.ai_service import ai_service

    monkeypatch.setattr(
        ai_service,
        "chat_with_tools",
        lambda *args, **kwargs: {"reply": "ok", "history": [], "tools_used": []},
    )
    ai_chat._anon_chat_hits.clear()

    for _ in range(ai_chat.ANON_CHAT_LIMIT):
        res = client.post("/api/ai/chat/", json={"message": "hello"})
        assert res.status_code == 200

    res = client.post("/api/ai/chat/", json={"message": "one too many"})
    assert res.status_code == 429
    ai_chat._anon_chat_hits.clear()


def test_chat_rejects_oversized_history(client):
    from app.api import ai_chat
    ai_chat._anon_chat_hits.clear()
    big_history = [{"role": "user", "content": "x"}] * (ai_chat.MAX_HISTORY_MESSAGES + 1)
    res = client.post("/api/ai/chat/", json={"message": "hi", "history": big_history})
    assert res.status_code == 413
    ai_chat._anon_chat_hits.clear()


def test_chat_passes_authentication_state(client, auth_headers, monkeypatch):
    """Anonymous callers must reach the AI service with authenticated=False
    (restricted toolset); signed-in users with authenticated=True."""
    from app.api import ai_chat
    from app.ai_service import ai_service

    captured = {}

    def fake_chat(message, history, context, db, authenticated=True):
        captured["authenticated"] = authenticated
        return {"reply": "ok", "history": [], "tools_used": []}

    monkeypatch.setattr(ai_service, "chat_with_tools", fake_chat)
    ai_chat._anon_chat_hits.clear()

    res = client.post("/api/ai/chat/", json={"message": "hi"})
    assert res.status_code == 200
    assert captured["authenticated"] is False

    res = client.post("/api/ai/chat/", json={"message": "hi"}, headers=auth_headers)
    assert res.status_code == 200
    assert captured["authenticated"] is True
    ai_chat._anon_chat_hits.clear()
