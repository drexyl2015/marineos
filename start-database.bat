@echo off
REM Start PostgreSQL Database
echo Starting PostgreSQL Database with Docker...
docker-compose up -d
echo.
echo PostgreSQL is starting in Docker
echo Docker logs will show: "database system is ready to accept connections"
pause
