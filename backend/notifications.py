from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from models import User, Notification, Post
from deps import get_db
from security import get_current_user

router = APIRouter()

@router.get("/")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifications = db.query(Notification).options(
        joinedload(Notification.sender),
        joinedload(Notification.post)
    ).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "type": n.type,
            "sender_username": n.sender.username,
            "sender_profile_pic": n.sender.profile_pic,
            "post_id": n.post_id,
            "post_image": n.post.image_url if n.post else None,
            "text": n.text,
            "is_seen": n.is_seen,
            "created_at": n.created_at
        })

    return {"notifications": result}

@router.post("/mark-seen")
def mark_notifications_seen(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_seen == False
    ).update({Notification.is_seen: True}, synchronize_session=False)
    db.commit()
    return {"message": "Notifications marked as seen"}

@router.get("/unseen-count")
def get_unseen_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_seen == False
    ).count()
    return {"count": count}
