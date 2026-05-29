@echo off
REM Marine Document System - Windows Setup Script

setlocal enabledelayedexpansion

echo ================================
echo 🚀 Marine Document System Setup
echo ================================
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python not found. Please install from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ All prerequisites found
echo.

REM Start PostgreSQL with Docker
echo 🐳 Starting PostgreSQL with Docker...
docker run --name marine-postgres ^
  -e POSTGRES_USER=marine_user ^
  -e POSTGRES_PASSWORD=marine_password ^
  -e POSTGRES_DB=marine ^
  -p 5432:5432 ^
  -d postgres:15-alpine >nul 2>&1

if errorlevel 1 (
    echo ℹ️  PostgreSQL container already running
) else (
    echo ✓ PostgreSQL started
)
timeout /t 2 /nobreak >nul

REM Setup Backend
echo.
echo ⚙️  Setting up Backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
echo ✓ Dependencies installed

REM Initialize database
alembic upgrade head >nul 2>&1
echo ✓ Database initialized

REM Start backend
echo.
echo 🚀 Starting Backend (http://localhost:8000)...
start cmd /k uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo ✓ Backend starting in new window
timeout /t 2 /nobreak >nul

cd ..

REM Setup Frontend
echo.
echo ⚙️  Setting up Frontend...
cd frontend

REM Install dependencies
call npm install --silent >nul 2>&1
echo ✓ Dependencies installed

REM Start frontend
echo.
echo 🚀 Starting Frontend (http://localhost:5173)...
start cmd /k npm run dev
echo ✓ Frontend starting in new window
timeout /t 2 /nobreak >nul

cd ..

REM Success message
echo.
echo ================================
echo ✅ Setup Complete!
echo ================================
echo.
echo 🌐 Application URLs:
echo    Frontend:     http://localhost:5173
echo    Backend API:  http://localhost:8000
echo    API Docs:     http://localhost:8000/docs
echo.
echo 📝 Notes:
echo    - Backend and Frontend are running in separate windows
echo    - PostgreSQL is running in Docker
echo    - Close the windows to stop services
echo.
pause
