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
    EMAIL_HOST: Optional[str] = None
    EMAIL_PORT: Optional[int] = None
    EMAIL_USERNAME: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None

    # Security — SECRET_KEY has no default; it must be set in .env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # MarineOS is free and self-service: anyone may sign up, gated by email
    # verification rather than owner approval.
    ALLOW_PUBLIC_REGISTRATION: bool = True
    REQUIRE_EMAIL_VERIFICATION: bool = True

    # Public URLs used in transactional emails and post-verification redirects.
    FRONTEND_URL: str = "https://marineos.app"
    BACKEND_URL: str = "https://marineos.onrender.com"

    # Owner account bootstrap. Set these in the deployment environment to create
    # or keep one private super-admin account available.
    OWNER_EMAIL: Optional[str] = None
    OWNER_PASSWORD: Optional[str] = None
    OWNER_FULL_NAME: Optional[str] = "MarineOS Owner"
    OWNER_ROLE: str = "super_admin"
    OWNER_UPDATE_PASSWORD_ON_STARTUP: bool = False

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
