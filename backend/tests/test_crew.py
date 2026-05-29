"""Crew endpoint tests"""


def test_create_crew(client, auth_headers):
    res = client.post("/api/crew/", json={
        "name": "John Smith",
        "nationality": "British",
        "position": "Master",
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "created"
    assert data["name"] == "John Smith"


def test_create_crew_requires_auth(client):
    res = client.post("/api/crew/", json={
        "name": "Unauth Crew",
        "nationality": "British",
        "position": "Master",
    })
    assert res.status_code == 401


def test_list_crew(client, auth_headers):
    client.post("/api/crew/", json={"name": "Alice", "nationality": "Filipino", "position": "Cook"}, headers=auth_headers)
    client.post("/api/crew/", json={"name": "Bob", "nationality": "Indian", "position": "Bosun"}, headers=auth_headers)
    res = client.get("/api/crew/")
    assert res.status_code == 200
    assert res.json()["total"] == 2


def test_get_crew(client, auth_headers):
    create = client.post("/api/crew/", json={"name": "Carlos", "nationality": "Spanish", "position": "Master"}, headers=auth_headers)
    crew_id = create.json()["crew_id"]
    res = client.get(f"/api/crew/{crew_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Carlos"


def test_update_crew(client, auth_headers):
    create = client.post("/api/crew/", json={"name": "Dave", "nationality": "German", "position": "Cook"}, headers=auth_headers)
    crew_id = create.json()["crew_id"]
    res = client.put(f"/api/crew/{crew_id}", json={"status": "onboard"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "updated"


def test_update_crew_requires_auth(client, auth_headers):
    create = client.post("/api/crew/", json={"name": "AuthTest", "nationality": "British", "position": "Cook"}, headers=auth_headers)
    crew_id = create.json()["crew_id"]
    res = client.put(f"/api/crew/{crew_id}", json={"status": "onboard"})
    assert res.status_code == 401


def test_delete_crew(client, auth_headers):
    create = client.post("/api/crew/", json={"name": "Eve", "nationality": "French", "position": "Bosun"}, headers=auth_headers)
    crew_id = create.json()["crew_id"]
    res = client.delete(f"/api/crew/{crew_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
    assert client.get(f"/api/crew/{crew_id}").status_code == 404


def test_delete_crew_requires_auth(client, auth_headers):
    create = client.post("/api/crew/", json={"name": "NoDelete", "nationality": "French", "position": "Bosun"}, headers=auth_headers)
    crew_id = create.json()["crew_id"]
    res = client.delete(f"/api/crew/{crew_id}")
    assert res.status_code == 401


def test_duplicate_employee_id(client, auth_headers):
    client.post("/api/crew/", json={"name": "Frank", "nationality": "Norwegian", "position": "Master", "employee_id": "EMP001"}, headers=auth_headers)
    res = client.post("/api/crew/", json={"name": "Grace", "nationality": "Swedish", "position": "Cook", "employee_id": "EMP001"}, headers=auth_headers)
    assert res.status_code == 400


def test_get_crew_not_found(client):
    res = client.get("/api/crew/99999")
    assert res.status_code == 404


def test_list_crew_pagination(client, auth_headers):
    for i in range(5):
        client.post("/api/crew/", json={"name": f"Crew{i}", "nationality": "Filipino", "position": "Cook"}, headers=auth_headers)
    res = client.get("/api/crew/?limit=3")
    assert res.status_code == 200
    assert len(res.json()["crew"]) == 3
