from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from models import Post, Like, Comment, User
from deps import get_db
from security import get_current_user
from post import serialize_post

router = APIRouter()

@router.get("/likes")
def get_liked_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).join(Like).options(
        joinedload(Post.author),
        joinedload(Post.likes),
        joinedload(Post.comments)
    ).filter(Like.user_id == current_user.id).order_by(Like.id.desc()).all()
    return {"posts": [serialize_post(post, current_user.id) for post in posts]}

@router.get("/comments")
def get_user_comments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comments = db.query(Comment).options(
        joinedload(Comment.post).joinedload(Post.author)
    ).filter(Comment.user_id == current_user.id).order_by(Comment.created_at.desc()).all()
    
    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "text": c.text,
            "created_at": c.created_at,
            "post_id": c.post_id,
            "post_image_url": c.post.image_url if c.post else None,
            "post_author": c.post.author.username if c.post and c.post.author else None,
            "post_author_id": c.post.author.id if c.post and c.post.author else None,
            "post_media_type": "video" if c.post and c.post.image_url and any(c.post.image_url.lower().endswith(ext) for ext in [".mp4", ".mov", ".webm"]) else "image"
        })
    return {"comments": result}

@router.get("/posts")
def get_user_activity_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).options(
        joinedload(Post.author),
        joinedload(Post.likes),
        joinedload(Post.comments)
    ).filter(Post.user_id == current_user.id).order_by(Post.created_at.desc()).all()
    
    serialized = [serialize_post(post, current_user.id) for post in posts]
    images = [p for p in serialized if p["media_type"] == "image"]
    return {"posts": images}

@router.get("/reels")
def get_user_activity_reels(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).options(
        joinedload(Post.author),
        joinedload(Post.likes),
        joinedload(Post.comments)
    ).filter(Post.user_id == current_user.id).order_by(Post.created_at.desc()).all()
    
    serialized = [serialize_post(post, current_user.id) for post in posts]
    videos = [p for p in serialized if p["media_type"] == "video"]
    return {"reels": videos}
