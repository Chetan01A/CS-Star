from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Follow, User, Notification
from deps import get_db
from security import get_current_user
from pydantic import BaseModel

router = APIRouter()

class FollowRequest(BaseModel):
    following_id: int

# Follow user
@router.post("/follow")
def follow_user(req: FollowRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    if current_user.id == req.following_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target = db.query(User).filter(User.id == req.following_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == req.following_id
    ).first()

    if existing:
        return {"message": "Already following"}

    follow = Follow(follower_id=current_user.id, following_id=req.following_id)
    db.add(follow)
    
    # Notification for Follow
    notif = Notification(
        recipient_id=req.following_id,
        sender_id=current_user.id,
        type="follow"
    )
    db.add(notif)
    
    db.commit()

    return {"message": "Followed successfully"}


# Unfollow user
@router.post("/unfollow")
def unfollow_user(req: FollowRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == req.following_id
    ).first()

    if not follow:
        return {"message": "Not following"}

    db.delete(follow)
    db.commit()

    return {"message": "Unfollowed successfully"}

@router.get("/followers/{user_id}")
def get_followers(user_id: int, db: Session = Depends(get_db)):
    followers = db.query(Follow).filter(
        Follow.following_id == user_id
    ).all()

    result = []
    for f in followers:
        user = db.query(User).filter(User.id == f.follower_id).first()
        if user:
            result.append({
                "id": user.id,
                "username": user.username,
                "profile_pic": user.profile_pic
            })

    return {"followers": result}

@router.get("/following/{user_id}")
def get_following(user_id: int, db: Session = Depends(get_db)):
    following = db.query(Follow).filter(
        Follow.follower_id == user_id
    ).all()

    result = []
    for f in following:
        user = db.query(User).filter(User.id == f.following_id).first()
        if user:
            result.append({
                "id": user.id,
                "username": user.username,
                "profile_pic": user.profile_pic
            })

    return {"following": result}

@router.get("/followers-count/{user_id}")
def followers_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Follow).filter(
        Follow.following_id == user_id
    ).count()

    return {"count": count}

@router.get("/following-count/{user_id}")
def following_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Follow).filter(
        Follow.follower_id == user_id
    ).count()

    return {"count": count}

@router.get("/status/{user_id}")
def get_follow_status(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()
    
    return {"is_following": existing is not None}
