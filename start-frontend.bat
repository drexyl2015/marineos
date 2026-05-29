@echo off
REM Start Frontend Server
cd /d "%~dp0"
cd frontend

echo Installing Node dependencies...
call npm install

echo.
echo Frontend is starting at http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
