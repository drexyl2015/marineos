"""Authentication endpoints: register, login, me"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app import schemas, models
from app.auth_utils import hash_password, verify_password, create_access_token, get_current_user, require_super_admin
from app.config import settings

router = APIRouter()

@router.post("/register", response_model=schemas.Token)
async def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if not settings.ALLOW_PUBLIC_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is disabled. Sign in with an owner account.",
        )
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="crew_manager",  # public registration always gets the lowest-privilege role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
async def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    if user.trial_expires_at and datetime.utcnow() > user.trial_expires_at:
        raise HTTPException(status_code=403, detail="Trial period has expired")
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
