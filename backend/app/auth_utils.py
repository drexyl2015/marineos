"""Auth utilities: password hashing, JWT creation and verification"""
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exc
    return user


def get_optional_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> models.User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        return user if user and user.is_active else None
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Role-based authorization
#
# UI role switching is a convenience, not a security boundary. Privileged
# actions must be enforced on the API. The role groups below define who may
# perform write / administrative / paid-AI operations. Read-only roles
# (seafarer, port_authority) keep authenticated read access but cannot mutate
# data or trigger paid AI calls.
# ---------------------------------------------------------------------------

# Full administrative control.
ADMIN_ROLES = ("super_admin",)

# Roles allowed to create/update/delete operational records and run AI tools.
MANAGER_ROLES = (
    "super_admin",
    "crew_manager",
    "compliance_officer",
    "vessel_manager",
    "fleet_ops",
    "crew_agency",
    "master",
)


def require_role(*allowed_roles: str):
    """Dependency factory: allow only users whose role is in ``allowed_roles``.

    Usage:
        current_user: models.User = Depends(require_role("super_admin"))
    """
    allowed = set(allowed_roles)

    def checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return checker


# Convenience dependencies for the common cases.
require_super_admin = require_role(*ADMIN_ROLES)
require_manager = require_role(*MANAGER_ROLES)
