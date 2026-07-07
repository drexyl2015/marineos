"""Startup bootstrap tasks: lightweight schema migration and owner access."""
import logging
from datetime import datetime, timedelta
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from app import models
from app.auth_utils import hash_password
from app.config import settings

logger = logging.getLogger(__name__)

# Columns added after the original users table shipped. create_all() only
# creates missing tables, never missing columns, so existing deployments need
# these ALTERs at startup. DEFAULT TRUE on email_verified grandfathers in all
# pre-existing accounts; new registrations set False explicitly.
_USER_COLUMNS = {
    "email_verified": "BOOLEAN DEFAULT TRUE",
    "verification_token": "VARCHAR(255)",
    "verification_token_expires": "TIMESTAMP",
    "login_code_hash": "VARCHAR(255)",
    "login_code_expires": "TIMESTAMP",
    "login_code_attempts": "INTEGER DEFAULT 0",
    "subscribed_until": "TIMESTAMP",
}


def ensure_user_columns(engine: Engine) -> None:
    existing = {col["name"] for col in inspect(engine).get_columns("users")}
    with engine.begin() as conn:
        for name, ddl_type in _USER_COLUMNS.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl_type}"))
                logger.info("Added users.%s column", name)
                if name == "subscribed_until":
                    # One-time backfill when the billing system first ships:
                    # accounts created before it get their free month from today.
                    conn.execute(text(
                        "UPDATE users SET trial_expires_at = :until WHERE trial_expires_at IS NULL"
                    ), {"until": datetime.utcnow() + timedelta(days=settings.TRIAL_DAYS)})
                    logger.info("Backfilled free-month trial for pre-billing accounts")


def ensure_owner_user(db: Session) -> None:
    """Create or update the configured owner account when credentials are set."""
    owner_email = (settings.OWNER_EMAIL or "").strip().lower()
    owner_password = settings.OWNER_PASSWORD or ""

    if not owner_email or not owner_password:
        if not settings.ALLOW_PUBLIC_REGISTRATION:
            logger.warning(
                "Public registration is disabled and OWNER_EMAIL/OWNER_PASSWORD are not fully configured."
            )
        return

    owner = db.query(models.User).filter(models.User.email == owner_email).first()
    if owner:
        changed = False
        if owner.role != settings.OWNER_ROLE:
            owner.role = settings.OWNER_ROLE
            changed = True
        if not owner.is_active:
            owner.is_active = True
            changed = True
        if not owner.email_verified:
            owner.email_verified = True
            changed = True
        if settings.OWNER_FULL_NAME and owner.full_name != settings.OWNER_FULL_NAME:
            owner.full_name = settings.OWNER_FULL_NAME
            changed = True
        if settings.OWNER_UPDATE_PASSWORD_ON_STARTUP:
            owner.hashed_password = hash_password(owner_password)
            changed = True
        if changed:
            db.commit()
            logger.info("Owner account updated: %s", owner_email)
        return

    owner = models.User(
        email=owner_email,
        hashed_password=hash_password(owner_password),
        full_name=settings.OWNER_FULL_NAME,
        role=settings.OWNER_ROLE,
        is_active=True,
        email_verified=True,
    )
    db.add(owner)
    db.commit()
    logger.info("Owner account created: %s", owner_email)
