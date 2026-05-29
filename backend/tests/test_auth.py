"""Auth endpoint tests"""


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
