from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models import User
from pydantic import BaseModel
from deps import get_db
from security import get_current_user
import os
import shutil
import uuid

router = APIRouter()

ALLOWED_PROFILE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Get user profile
@router.get("/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "bio": user.bio,
        "profile_pic": user.profile_pic,
        "website": user.website or "",
        "gender": user.gender or "Prefer not to say"
    }

class ProfileUpdateRequest(BaseModel):
    username: str = ""
    bio: str = ""
    profile_pic: str = ""
    website: str = ""
    gender: str = "Prefer not to say"

# Update profile
@router.put("/{user_id}")
def update_profile(user_id: int, req: ProfileUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.username.strip():
        user.username = req.username.strip()
    user.bio = req.bio
    user.profile_pic = req.profile_pic
    user.website = req.website
    user.gender = req.gender

    db.commit()

    return {
        "message": "Profile updated",
        "profile": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "profile_pic": user.profile_pic,
            "website": user.website or "",
            "gender": user.gender or "Prefer not to say"
        }
    }


@router.post("/{user_id}/photo")
def upload_profile_photo(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_PROFILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only image files are allowed for profile photos")

    os.makedirs("uploads/profile", exist_ok=True)
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/profile/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    old_file = user.profile_pic
    user.profile_pic = file_path
    db.commit()

    if old_file and old_file.startswith("uploads/") and os.path.exists(old_file):
        try:
            os.remove(old_file)
        except OSError:
            pass

    return {"message": "Profile photo updated", "profile_pic": file_path}


@router.delete("/{user_id}/photo")
def remove_profile_photo(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_file = user.profile_pic
    user.profile_pic = ""
    db.commit()

    if old_file and old_file.startswith("uploads/") and os.path.exists(old_file):
        try:
            os.remove(old_file)
        except OSError:
            pass

    return {"message": "Profile photo removed", "profile_pic": ""}

# Search for users by username
@router.get("/search/")
def search_users(query: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not query:
        return {"users": []}

    # Case-insensitive partial match
    users = db.query(User).filter(User.username.ilike(f"%{query}%")).limit(10).all()

    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "profile_pic": u.profile_pic,
            "bio": u.bio
        })

    return {"users": result}
