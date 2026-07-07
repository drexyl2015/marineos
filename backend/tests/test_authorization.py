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
