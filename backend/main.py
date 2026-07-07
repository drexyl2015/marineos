"""
Marine Document System - Main API Application
FastAPI backend with Claude AI integration for maritime compliance
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.database import Base, SessionLocal, engine
from app.config import settings
from app.bootstrap import ensure_owner_user

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
    db = SessionLocal()
    try:
        ensure_owner_user(db)
    finally:
        db.close()
    yield
    # Shutdown
    logger.info("Application shutting down")

# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="AI-powered maritime document management and compliance system",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Marine Document System API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": settings.API_VERSION
    }

# Import and include routers
from app.api import crew, certificates, documents, alerts, ai_endpoints, subscribe, ai_chat, auth, vessels, assignments

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(vessels.router, prefix="/api/vessels", tags=["Vessels"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(crew.router, prefix="/api/crew", tags=["Crew"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(ai_endpoints.router, prefix="/api/ai", tags=["AI Features"])
app.include_router(subscribe.router, prefix="/api/subscribe", tags=["Subscribe"])
app.include_router(ai_chat.router, prefix="/api/ai/chat", tags=["AI Chat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
