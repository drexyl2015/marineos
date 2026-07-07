"""Vessel endpoint tests"""


def _create_vessel(client, auth_headers, name="MV Test", imo="IMO1234567"):
    res = client.post("/api/vessels/", json={
        "name": name,
        "imo": imo,
        "vessel_type": "Bulk Carrier",
        "flag_state": "Panama",
        "status": "active",
    }, headers=auth_headers)
    return res.json()["vessel_id"]


def test_create_vessel(client, auth_headers):
    res = client.post("/api/vessels/", json={
        "name": "MV Atlantic",
        "imo": "IMO9876543",
        "vessel_type": "Container Ship",
        "flag_state": "Liberia",
        "status": "active",
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "created"
    assert "vessel_id" in data


def test_create_vessel_requires_auth(client):
    res = client.post("/api/vessels/", json={
        "name": "MV Unauth",
        "imo": "IMO0000001",
        "vessel_type": "Tanker",
        "flag_state": "Malta",
        "status": "active",
    })
    assert res.status_code == 401


def test_list_vessels(client, auth_headers):
    _create_vessel(client, auth_headers, "MV Alpha", "IMO0000002")
    _create_vessel(client, auth_headers, "MV Beta", "IMO0000003")
    res = client.get("/api/vessels/", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["vessels"]) == 2


def test_list_vessels_pagination(client, auth_headers):
    for i in range(4):
        _create_vessel(client, auth_headers, f"MV Ship{i}", f"IMO100000{i}")
    res = client.get("/api/vessels/?limit=2", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["vessels"]) == 2
    assert res.json()["total"] == 4


def test_get_vessel(client, auth_headers):
    vessel_id = _create_vessel(client, auth_headers, "MV Pacific", "IMO2222222")
    res = client.get(f"/api/vessels/{vessel_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "MV Pacific"
    assert data["imo"] == "IMO2222222"


def test_get_vessel_not_found(client, auth_headers):
    res = client.get("/api/vessels/99999", headers=auth_headers)
    assert res.status_code == 404


def test_update_vessel(client, auth_headers):
    vessel_id = _create_vessel(client, auth_headers, "MV Update", "IMO3333333")
    res = client.put(f"/api/vessels/{vessel_id}", json={"status": "maintenance"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "updated"


def test_update_vessel_requires_auth(client, auth_headers):
    vessel_id = _create_vessel(client, auth_headers, "MV NoUpdate", "IMO4444444")
    res = client.put(f"/api/vessels/{vessel_id}", json={"status": "maintenance"})
    assert res.status_code == 401


def test_delete_vessel(client, auth_headers):
    vessel_id = _create_vessel(client, auth_headers, "MV Delete", "IMO5555555")
    res = client.delete(f"/api/vessels/{vessel_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
    assert client.get(f"/api/vessels/{vessel_id}", headers=auth_headers).status_code == 404


def test_delete_vessel_requires_auth(client, auth_headers):
    vessel_id = _create_vessel(client, auth_headers, "MV NoDelete", "IMO6666666")
    res = client.delete(f"/api/vessels/{vessel_id}")
    assert res.status_code == 401


def test_duplicate_imo(client, auth_headers):
    _create_vessel(client, auth_headers, "MV Dup1", "IMO7777777")
    res = client.post("/api/vessels/", json={
        "name": "MV Dup2",
        "imo": "IMO7777777",
        "vessel_type": "Tanker",
        "flag_state": "Malta",
        "status": "active",
    }, headers=auth_headers)
    assert res.status_code == 400
