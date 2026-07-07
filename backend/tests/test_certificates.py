"""Certificate endpoint tests"""


def _create_crew(client, auth_headers, name="Test Crew"):
    res = client.post("/api/crew/", json={"name": name, "nationality": "Filipino", "position": "Master"}, headers=auth_headers)
    return res.json()["crew_id"]


def test_create_certificate(client, auth_headers):
    crew_id = _create_crew(client, auth_headers)
    res = client.post("/api/certificates/", json={
        "crew_id": crew_id,
        "certificate_type": "Medical Certificate (ENG1)",
        "issue_date": "2024-01-01",
        "expiry_date": "2026-01-01",
        "issuing_authority": "MCA UK",
        "ratings": [],
        "endorsements": [],
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "created"


def test_create_certificate_requires_auth(client, auth_headers):
    crew_id = _create_crew(client, auth_headers)
    res = client.post("/api/certificates/", json={
        "crew_id": crew_id,
        "certificate_type": "Medical Certificate (ENG1)",
        "issue_date": "2024-01-01",
        "expiry_date": "2026-01-01",
        "issuing_authority": "MCA UK",
        "ratings": [],
        "endorsements": [],
    })
    assert res.status_code == 401


def test_list_by_crew(client, auth_headers):
    crew_id = _create_crew(client, auth_headers, "Cert Test Crew")
    for i in range(3):
        client.post("/api/certificates/", json={
            "crew_id": crew_id,
            "certificate_type": "STCW Basic Safety Training (VI/1)",
            "issue_date": "2024-01-01",
            "expiry_date": f"202{6+i}-01-01",
            "issuing_authority": "MCA UK",
            "ratings": [], "endorsements": [],
        }, headers=auth_headers)
    res = client.get(f"/api/certificates/?crew_id={crew_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] == 3


def test_update_certificate(client, auth_headers):
    crew_id = _create_crew(client, auth_headers)
    create = client.post("/api/certificates/", json={
        "crew_id": crew_id,
        "certificate_type": "Medical Certificate (ENG1)",
        "issue_date": "2024-01-01",
        "expiry_date": "2026-01-01",
        "issuing_authority": "MCA UK",
        "ratings": [], "endorsements": [],
    }, headers=auth_headers)
    cert_id = create.json()["certificate_id"]
    res = client.put(f"/api/certificates/{cert_id}", json={"issuing_authority": "Panama Maritime"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "updated"


def test_update_certificate_requires_auth(client, auth_headers):
    crew_id = _create_crew(client, auth_headers)
    create = client.post("/api/certificates/", json={
        "crew_id": crew_id,
        "certificate_type": "Medical Certificate (ENG1)",
        "issue_date": "2024-01-01",
        "expiry_date": "2026-01-01",
        "issuing_authority": "MCA UK",
        "ratings": [], "endorsements": [],
    }, headers=auth_headers)
    cert_id = create.json()["certificate_id"]
    res = client.put(f"/api/certificates/{cert_id}", json={"issuing_authority": "Unauth"})
    assert res.status_code == 401


def test_delete_certificate(client, auth_headers):
    crew_id = _create_crew(client, auth_headers)
    create = client.post("/api/certificates/", json={
        "crew_id": crew_id,
        "certificate_type": "GMDSS General Operator Certificate",
        "issue_date": "2024-01-01",
        "expiry_date": "2026-01-01",
        "issuing_authority": "MCA",
        "ratings": [], "endorsements": [],
    }, headers=auth_headers)
    cert_id = create.json()["certificate_id"]
    res = client.delete(f"/api/certificates/{cert_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
    assert client.get(f"/api/certificates/{cert_id}", headers=auth_headers).status_code == 404


def test_create_certificate_crew_not_found(client, auth_headers):
    res = client.post("/api/certificates/", json={
        "crew_id": 99999,
        "certificate_type": "Medical Certificate (ENG1)",
        "issue_date": "2024-01-01",
        "expiry_date": "2026-01-01",
        "issuing_authority": "MCA UK",
        "ratings": [], "endorsements": [],
    }, headers=auth_headers)
    assert res.status_code == 404
