# MarineOS

AI-powered maritime crew and compliance management platform.  
Built with **FastAPI · React 18 · PostgreSQL · Claude AI**.

---

## Features

- **Crew management** — profiles, status tracking, nationality, position
- **Certificate compliance** — expiry monitoring with 90-day alerts, AI-powered OCR upload
- **Vessel management** — fleet registry, crew assignments, status tracking
- **AI assistant** — 17-tool agentic chat for STCW/MLC lookups, risk assessment, port briefings
- **9 role dashboards** — Super Admin, Crew Manager, Compliance Officer, Master, Seafarer, Fleet Ops, Port Authority, Crew Agency, Vessel Manager
- **JWT authentication** — bcrypt passwords, token-protected write endpoints

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| Database | PostgreSQL |
| AI | Anthropic Claude (tool use + vision) |
| Auth | JWT (python-jose) + bcrypt |

---

## Quick Start

### Prerequisites
- Python 3.11+, Node 18+, PostgreSQL 14+, Docker (optional)

### 1 — Database
```bash
docker-compose up -d          # starts PostgreSQL via Docker
# or create manually:
# psql -U postgres -c "CREATE USER marine_user WITH PASSWORD 'marine_password';"
# psql -U postgres -c "CREATE DATABASE marine OWNER marine_user;"
```

### 2 — Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in CLAUDE_API_KEY and SECRET_KEY
alembic upgrade head
uvicorn main:app --reload      # http://localhost:8000
```

Generate a strong secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3 — Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLAUDE_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |
| `SECRET_KEY` | JWT signing secret — generate with `secrets.token_urlsafe(32)` |
| `EMAIL_USERNAME` | Yahoo address for access notifications |
| `EMAIL_PASSWORD` | Yahoo App Password (not your account password) |

---

## API

All `POST / PUT / DELETE` endpoints require `Authorization: Bearer <token>`.  
Obtain a token via `POST /api/auth/login`.  
Swagger docs available at `http://localhost:8000/docs`.

---

## Tests

```bash
cd backend
pytest tests/ -v
```

35 tests covering auth, crew CRUD, certificate CRUD, vessel CRUD, and 401 enforcement on all write endpoints.

---

## Project Structure

```
marine-document-system/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, crew, vessels, certs, AI…)
│   │   ├── models.py     # SQLAlchemy ORM models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth_utils.py # JWT + bcrypt helpers
│   │   └── ai_service.py # Claude AI — 17 maritime tools
│   ├── tests/            # pytest suite
│   ├── alembic/          # database migrations
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/   # dashboards, modals, shared
        ├── context/      # AuthContext
        └── constants/    # maritime domain constants
```

---

## License

Built by Sadiq Dare. MIT License.
