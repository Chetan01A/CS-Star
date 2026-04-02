import os
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
import secrets
import pyotp
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
from models import User, PasswordResetToken, DeviceLogin, RefreshToken
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

load_dotenv()

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

GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"

# Signup
@router.post("/signup")
@limiter.limit("5/minute")
def signup(req: SignupRequest, request: Request, db: Session = Depends(get_db)):
    if not verify_captcha(req.captcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")

    hashed_password = get_password_hash(req.password)

    # Check if email exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    verification_code = "{:06d}".format(secrets.randbelow(1_000_000))
    user = User(
        username=req.username, 
        email=req.email, 
        password=hashed_password,
        verification_code=verification_code
    )
    db.add(user)
    db.commit()
    
    send_verification_email(user.email, verification_code)

    return {"message": "User created. Please check your email for the verification code."}

# Login
@router.post("/login")
@limiter.limit("10/minute")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    if not verify_captcha(req.captcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")

    # Look up the user by email OR username
    user = db.query(User).filter(
        or_(User.email == req.identifier, User.username == req.identifier)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
        
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first.")

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
        # Validate Google Token securely
        idinfo = id_token.verify_oauth2_token(req.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        google_id = idinfo['sub']
        
        # Find user by email or google ID
        user = db.query(User).filter(or_(User.email == email, User.google_id == google_id)).first()
        
        if not user:
            # Auto-provision a new user!
            base_username = email.split("@")[0]
            user = User(
                username=base_username, 
                email=email, 
                password=None,
                google_id=google_id,
                is_verified=True # Google verifies emails automatically
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Link google_id if they log in via Google for the first time
        if not user.google_id:
            user.google_id = google_id
            db.commit()

        # Mint our own token
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
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    # We do not return 404 here to prevent hackers from knowing which emails exist.
    if user:
        token = secrets.token_hex(32)
        reset_token = PasswordResetToken(user_id=user.id, token=token)
        db.add(reset_token)
        db.commit()
        
        # Send the actual email
        send_reset_email(user.email, token)

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
    db.delete(reset_token) # Delete the token so it can only be used once
    db.commit()
    
    return {"message": "Password reset successfully"}

# Verify Email
@router.post("/verify-email")
@limiter.limit("5/minute")
def verify_email(req: VerifyEmailRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if user.is_verified:
        return {"message": "Email already verified"}
        
    if user.verification_code != req.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_verified = True
    user.verification_code = None
    db.commit()
    
    return {"message": "Email successfully verified. You can now log in."}

# Resend Verification Code
@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(req: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user:
        # Avoid user enumeration, but since this is for verification, 
        # we might want to be slightly more helpful or stay silent.
        return {"message": "If that email is registered and not yet verified, a new code has been sent."}
        
    if user.is_verified:
        return {"message": "Email already verified. Please log in."}
        
    # Generate new code
    verification_code = "{:06d}".format(secrets.randbelow(1_000_000))
    user.verification_code = verification_code
    db.commit()
    
    send_verification_email(user.email, verification_code)
    
    return {"message": "A new verification code has been sent."}

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
    
    # URI for Google Authenticator / Authy
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
    # SQLite often returns naive datetimes; treat them as UTC for token expiry checks.
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
        
    if _as_utc_aware(db_token.expires_at) < datetime.now(timezone.utc):
        db.delete(db_token)
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired, please log in again")
        
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # Generate new access token
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
        "bio": current_user.bio
    }
