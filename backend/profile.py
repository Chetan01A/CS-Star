from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from pydantic import BaseModel
from deps import get_db
from security import get_current_user

router = APIRouter()

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
        "profile_pic": user.profile_pic
    }

class ProfileUpdateRequest(BaseModel):
    bio: str = ""
    profile_pic: str = ""

# Update profile
@router.put("/{user_id}")
def update_profile(user_id: int, req: ProfileUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.bio = req.bio
    user.profile_pic = req.profile_pic

    db.commit()

    return {"message": "Profile updated"}