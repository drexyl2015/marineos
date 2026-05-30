"""Configuration settings for Marine Document System"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://marine_user:marine_password@localhost:5432/marine"

    # Claude AI
    CLAUDE_API_KEY: str = ""

    # Email — all optional; email notifications are skipped if not configured
    RESEND_API_KEY: Optional[str] = None
    NOTIFY_EMAIL: Optional[str] = None

    # Security — SECRET_KEY has no default; it must be set in .env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", "http://localhost:3000"]

    # API Settings
    API_TITLE: str = "Marine Document System API"
    API_VERSION: str = "1.0.0"

    # Logging
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False
    RELOAD: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
