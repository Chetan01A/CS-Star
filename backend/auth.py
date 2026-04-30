import os
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
import secrets
import pyotp
import time
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from limiter import limiter
from email_service import send_reset_email, send_verification_email
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import urllib.request
import urllib.parse
import json
from models import User, PasswordResetToken, DeviceLogin, RefreshToken, PendingSignup
from pydantic import BaseModel
from dotenv import load_dotenv

from deps import get_db
from security import (
    create_access_token, 
    get_current_user, 
    verify_password, 
    get_password_hash,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

# Configuration from environment
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 30))
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY", "YOUR_RECAPTCHA_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com")

# oauth2_scheme is imported from security if needed, or defined here
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_captcha(token: str) -> bool:
    if not token:
        # If no token is provided, we fail the captcha (unless dev mode is on)
        if RECAPTCHA_SECRET_KEY == "YOUR_RECAPTCHA_SECRET_KEY":
            return True
        return False
        
    if RECAPTCHA_SECRET_KEY == "YOUR_RECAPTCHA_SECRET_KEY":
        return True # Bypass in development
        
    url = "https://www.google.com/recaptcha/api/siteverify"
    data = urllib.parse.urlencode({
        "secret": RECAPTCHA_SECRET_KEY,
        "response": token
    }).encode("utf-8")
    
    try:
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get("success", False)
    except Exception:
        return False

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    captcha_token: str | None = None

class LoginRequest(BaseModel):
    identifier: str  # Can be email or username
    password: str
    totp_code: str | None = None
    captcha_token: str | None = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    email: str
    code: str

class GoogleLoginRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: str

# Signup
@router.post("/signup")
@limiter.limit("5/minute")
def signup(req: SignupRequest, request: Request, db: Session = Depends(get_db)):
    start_time = time.time()
    print(f"DEBUG: Starting signup for {req.email}")
    hashed_password = get_password_hash(req.password)
    print(f"DEBUG: Password hashed in {time.time() - start_time:.4f}s")

    # Check if email exists in main User table
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        print(f"DEBUG: Signup blocked - {req.email} already exists in main User table.")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if a pending signup exists for this email and delete it if so
    pending = db.query(PendingSignup).filter(PendingSignup.email == req.email).first()
    if pending:
        db.delete(pending)
    
    # Create new user directly (Verified by default)
    new_user = User(
        username=req.username,
        email=req.email,
        password=hashed_password,
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(f"DEBUG: User created in {time.time() - start_time:.4f}s")
    
    # Generate JWT Token for Auto-Login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )

    # Generate Refresh Token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_str = secrets.token_hex(64)
    db_refresh_token = RefreshToken(
        user_id=new_user.id,
        token=refresh_token_str,
        expires_at=datetime.now(timezone.utc) + refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token_str,
        "token_type": "bearer", 
        "message": "Signup successful. Welcome!",
        "user_id": new_user.id
    }

# Login
@router.post("/login")
@limiter.limit("10/minute")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    start_time = time.time()
    print(f"DEBUG: Starting login attempt for {req.identifier}")
    # Look up the user by email OR username
    user = db.query(User).filter(
        or_(User.email == req.identifier, User.username == req.identifier)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(req.password, user.password):
        raise HTTPException(status_code=400, detail="Wrong password")

    # 2FA Check
    if user.totp_enabled:
        if not req.totp_code:
            raise HTTPException(status_code=401, detail="2FA code required")
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(req.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    # Generate JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    # Generate Refresh Token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_str = secrets.token_hex(64)
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.now(timezone.utc) + refresh_token_expires
    )
    db.add(db_refresh_token)

    # Record Device Login
    device_login = DeviceLogin(
        user_id=user.id,
        ip_address=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("User-Agent", "Unknown")
    )
    db.add(device_login)
    db.commit()
    print(f"DEBUG: Login successful in {time.time() - start_time:.4f}s")

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token_str,
        "token_type": "bearer", 
        "message": "Login successful"
    }

# Google Login
@router.post("/google")
@limiter.limit("5/minute")
def login_with_google(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(req.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        google_id = idinfo['sub']
        
        user = db.query(User).filter(or_(User.email == email, User.google_id == google_id)).first()
        
        if not user:
            base_username = email.split("@")[0]
            user = User(
                username=base_username, 
                email=email, 
                password=None,
                google_id=google_id,
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        if not user.google_id:
            user.google_id = google_id
            db.commit()

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)

        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token_str = secrets.token_hex(64)
        db_refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=datetime.now(timezone.utc) + refresh_token_expires
        )
        db.add(db_refresh_token)
        
        device_login = DeviceLogin(
            user_id=user.id,
            ip_address=request.client.host if request.client else "Unknown",
            user_agent=request.headers.get("User-Agent", "Unknown")
        )
        db.add(device_login)
        db.commit()

        return {
            "access_token": access_token, 
            "refresh_token": refresh_token_str,
            "token_type": "bearer", 
            "message": "Google Login successful"
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

# Forgot Password
@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(req: ForgotPasswordRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if user:
        token = secrets.token_hex(32)
        reset_token = PasswordResetToken(user_id=user.id, token=token)
        db.add(reset_token)
        db.commit()
        
        background_tasks.add_task(send_reset_email, user.email, token)

    return {"message": "If that email is registered, a reset link has been sent."}

# Reset Password
@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == req.token).first()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
        
    user.password = get_password_hash(req.new_password)
    db.delete(reset_token)
    db.commit()
    
    return {"message": "Password reset successfully"}

# Verify Email (DEPRECATED)
@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, request: Request, db: Session = Depends(get_db)):
    return {"message": "Email verification is no longer required."}

# Resend Verification Code (DEPRECATED)
@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    return {"message": "Email verification is no longer required."}

class TwoFactorSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

# 2FA Setup
@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
@limiter.limit("5/minute")
def setup_2fa(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    db.commit()
    
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="CS-Star App"
    )
    return {"secret": secret, "provisioning_uri": uri}

# 2FA Verify
@router.post("/2fa/verify")
@limiter.limit("5/minute")
def verify_2fa(req: TwoFactorVerifyRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
        
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(req.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    current_user.totp_enabled = True
    db.commit()
    return {"message": "Two factor authentication successfully enabled"}

class RefreshTokenRequest(BaseModel):
    refresh_token: str

def _as_utc_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

# Refresh Token
@router.post("/refresh")
@limiter.limit("5/minute")
def refresh_token(req: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    db_token = db.query(RefreshToken).filter(RefreshToken.token == req.refresh_token).first()
    
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    token_expiry = _as_utc_aware(db_token.expires_at)
    now_utc = datetime.now(timezone.utc)
        
    if token_expiry < now_utc:
        db.delete(db_token)
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired, please log in again")
        
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": new_access_token, "token_type": "bearer"}

# Get Current User Info
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "totp_enabled": current_user.totp_enabled,
        "profile_pic": current_user.profile_pic,
        "bio": current_user.bio,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }
