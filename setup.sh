#!/bin/bash

# Marine Document System - Local Setup Script
# Runs on Mac/Linux to set up the entire application

set -e  # Exit on error

echo "================================"
echo "🚀 Marine Document System Setup"
echo "================================"
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python 3 not found. Please install Python from https://www.python.org/downloads/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi

echo "✓ All prerequisites found"
echo ""

# Start PostgreSQL with Docker
echo "🐳 Starting PostgreSQL with Docker..."
docker run --name marine-postgres \
  -e POSTGRES_USER=marine_user \
  -e POSTGRES_PASSWORD=marine_password \
  -e POSTGRES_DB=marine \
  -p 5432:5432 \
  -d postgres:15-alpine 2>/dev/null || docker start marine-postgres

sleep 3
echo "✓ PostgreSQL started"
echo ""

# Setup Backend
echo "⚙️  Setting up Backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo "✓ Dependencies installed"

# Run migrations
alembic upgrade head --quiet 2>/dev/null || echo "⚠️  Migrations skipped (schema may already exist)"
echo "✓ Database initialized"

# Start backend
echo ""
echo "🚀 Starting Backend (http://localhost:8000)..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
sleep 2

cd ..

# Setup Frontend
echo ""
echo "⚙️  Setting up Frontend..."
cd frontend

# Install dependencies
npm install --silent
echo "✓ Dependencies installed"

# Start frontend
echo ""
echo "🚀 Starting Frontend (http://localhost:5173)..."
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"
sleep 2

cd ..

# Success message
echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "📝 Notes:"
echo "   - Backend PID: $BACKEND_PID"
echo "   - Frontend PID: $FRONTEND_PID"
echo "   - PostgreSQL is running in Docker"
echo ""
echo "🛑 To stop all services, run: pkill -P $$"
echo ""
