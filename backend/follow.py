from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Follow, User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Follow user
@router.post("/follow")
def follow_user(follower_id: int, following_id: int, db: Session = Depends(get_db)):
    
    if follower_id == following_id:
        return {"message": "You cannot follow yourself"}

    existing = db.query(Follow).filter(
        Follow.follower_id == follower_id,
        Follow.following_id == following_id
    ).first()

    if existing:
        return {"message": "Already following"}

    follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(follow)
    db.commit()

    return {"message": "Followed successfully"}


# Unfollow user
@router.post("/unfollow")
def unfollow_user(follower_id: int, following_id: int, db: Session = Depends(get_db)):
    
    follow = db.query(Follow).filter(
        Follow.follower_id == follower_id,
        Follow.following_id == following_id
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

    return {"followers": count}

@router.get("/following-count/{user_id}")
def following_count(user_id: int, db: Session = Depends(get_db)):
    
    count = db.query(Follow).filter(
        Follow.follower_id == user_id
    ).count()

    return {"following": count}

