@echo off
REM Start Backend Server
cd /d "%~dp0"
cd backend

echo Creating Python virtual environment...
if not exist venv (
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt -q

echo Running database migrations...
alembic upgrade head

echo.
echo Backend is starting at http://localhost:8000
echo API Docs will be at http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
