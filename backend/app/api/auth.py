"""Authentication endpoints: register, email verification, login, one-time sign-in codes"""
import hashlib
import html as html_lib
import secrets
import time
from collections import defaultdict, deque
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app import schemas, models
from app.auth_utils import hash_password, verify_password, create_access_token, get_current_user, require_super_admin
from app.config import settings
from app.email_utils import send_email_background

router = APIRouter()

VERIFICATION_TOKEN_HOURS = 24
LOGIN_CODE_MINUTES = 10
MAX_LOGIN_CODE_ATTEMPTS = 5

# Per-email rate limit for outbound email endpoints: 3 requests / 15 minutes.
_EMAIL_RATE_LIMIT = 3
_EMAIL_RATE_WINDOW_SECONDS = 900
_email_requests: dict[str, deque] = defaultdict(deque)


def _enforce_email_rate_limit(email: str) -> None:
    now = time.monotonic()
    hits = _email_requests[email]
    while hits and now - hits[0] > _EMAIL_RATE_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= _EMAIL_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a few minutes and try again.",
        )
    hits.append(now)


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _send_verification_email(user: models.User) -> None:
    verify_url = f"{settings.BACKEND_URL}/api/auth/verify-email?token={user.verification_token}"
    name = html_lib.escape(user.full_name or "there")
    send_email_background(
        user.email,
        "Verify your MarineOS account",
        f"""
<html><body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  <h2 style="color: #1a5f7a;">Welcome to MarineOS</h2>
  <p>Hi {name},</p>
  <p>Thanks for signing up. Click the button below to verify your email address
     and activate your account:</p>
  <p style="margin: 28px 0;">
    <a href="{verify_url}" style="background:#0e9f6e;color:#fff;padding:12px 24px;
       border-radius:8px;text-decoration:none;font-weight:bold;">Verify my email</a>
  </p>
  <p style="font-size:13px;color:#666;">Or copy this link into your browser:<br>{verify_url}</p>
  <p style="font-size:12px;color:#888;">This link expires in {VERIFICATION_TOKEN_HOURS} hours.
     If you didn't create a MarineOS account, you can ignore this email.</p>
</body></html>
""",
    )


class EmailPayload(BaseModel):
    email: EmailStr


class CodeLoginPayload(BaseModel):
    email: EmailStr
    code: str


@router.post("/register", response_model=dict)
async def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if not settings.ALLOW_PUBLIC_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is disabled. Sign in with an owner account.",
        )
    email = user_in.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="crew_manager",  # public registration always gets the lowest-privilege role
        email_verified=not settings.REQUIRE_EMAIL_VERIFICATION,
    )
    if settings.REQUIRE_EMAIL_VERIFICATION:
        user.verification_token = secrets.token_urlsafe(32)
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_HOURS)
    db.add(user)
    db.commit()
    db.refresh(user)

    if settings.REQUIRE_EMAIL_VERIFICATION:
        _send_verification_email(user)
        return {
            "status": "verification_sent",
            "message": "Account created. Check your email for the verification link, then sign in.",
        }

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"status": "ok", "access_token": token, "token_type": "bearer"}


@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verification link target — redirects to the frontend with the result."""
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    valid = (
        user is not None
        and user.verification_token_expires is not None
        and datetime.utcnow() <= user.verification_token_expires
    )
    if not valid:
        return RedirectResponse(f"{settings.FRONTEND_URL}/?verified=0")
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    return RedirectResponse(f"{settings.FRONTEND_URL}/?verified=1")


@router.post("/resend-verification", response_model=dict)
async def resend_verification(payload: EmailPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    _enforce_email_rate_limit(email)
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and not user.email_verified:
        user.verification_token = secrets.token_urlsafe(32)
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_HOURS)
        db.commit()
        _send_verification_email(user)
    # Same response whether or not the account exists — no account enumeration.
    return {"status": "ok", "message": "If that email needs verification, a new link is on its way."}


@router.post("/login", response_model=schemas.Token)
async def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    email = credentials.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email first — check your inbox for the verification link.",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/request-login-code", response_model=dict)
async def request_login_code(payload: EmailPayload, db: Session = Depends(get_db)):
    """Forgot password: email a one-time sign-in code instead of resetting."""
    email = payload.email.strip().lower()
    _enforce_email_rate_limit(email)
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.is_active and user.email_verified:
        code = f"{secrets.randbelow(1_000_000):06d}"
        user.login_code_hash = _hash_code(code)
        user.login_code_expires = datetime.utcnow() + timedelta(minutes=LOGIN_CODE_MINUTES)
        user.login_code_attempts = 0
        db.commit()
        send_email_background(
            user.email,
            "Your MarineOS sign-in code",
            f"""
<html><body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  <h2 style="color: #1a5f7a;">MarineOS sign-in code</h2>
  <p>Use this code to sign in to your account:</p>
  <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">{code}</p>
  <p style="font-size:12px;color:#888;">The code expires in {LOGIN_CODE_MINUTES} minutes.
     If you didn't request it, you can ignore this email — your account is safe.</p>
</body></html>
""",
        )
    # Same response whether or not the account exists — no account enumeration.
    return {"status": "ok", "message": "If that email has an account, a sign-in code is on its way."}


@router.post("/login-with-code", response_model=schemas.Token)
async def login_with_code(payload: CodeLoginPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code")
    user = db.query(models.User).filter(models.User.email == email).first()
    if (
        not user
        or not user.is_active
        or not user.login_code_hash
        or not user.login_code_expires
        or datetime.utcnow() > user.login_code_expires
        or (user.login_code_attempts or 0) >= MAX_LOGIN_CODE_ATTEMPTS
    ):
        raise invalid
    if not secrets.compare_digest(user.login_code_hash, _hash_code(payload.code.strip())):
        user.login_code_attempts = (user.login_code_attempts or 0) + 1
        db.commit()
        raise invalid
    # Success: the code is single-use.
    user.login_code_hash = None
    user.login_code_expires = None
    user.login_code_attempts = 0
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/grant-trial/{user_id}", response_model=schemas.UserResponse)
async def grant_trial(
    user_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.trial_expires_at = datetime.utcnow() + timedelta(days=days)
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user
