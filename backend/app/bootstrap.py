"""Startup bootstrap tasks for owner access."""
import logging
from sqlalchemy.orm import Session
from app import models
from app.auth_utils import hash_password
from app.config import settings

logger = logging.getLogger(__name__)


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
    )
    db.add(owner)
    db.commit()
    logger.info("Owner account created: %s", owner_email)
