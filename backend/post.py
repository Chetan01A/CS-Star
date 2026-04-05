from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session, joinedload
from models import Post, User, Follow, Like, Comment, Notification
import shutil
import uuid
import os
from deps import get_db
from security import get_current_user
from pydantic import BaseModel
from notifications import create_notification

router = APIRouter()

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}


def get_media_type(file_path: str) -> str:
    ext = os.path.splitext(file_path or "")[1].lower()
    if ext in VIDEO_EXTENSIONS:
        return "video"
    return "image"


def serialize_post(post: Post, current_user_id: int | None = None):
    is_owner = post.user_id == current_user_id
    is_liked = any(like.user_id == current_user_id for like in post.likes) if current_user_id else False
    return {
        "post_id": post.id,
        "username": post.author.username,
        "user_id": post.author.id,
        "profile_pic": post.author.profile_pic or "",
        "image_url": post.image_url,
        "caption": post.caption,
        "likes_count": len(post.likes),
        "comments_count": len(post.comments),
        "is_liked": is_liked,
        "media_type": get_media_type(post.image_url),
        "created_at": post.created_at,
        "share_count": post.share_count or 0,
        "show_like_count": is_owner or not post.hide_like_count,
        "show_share_count": is_owner or not post.hide_share_count,
        "comments_enabled": post.comments_enabled,
        "downloads_enabled": post.downloads_enabled,
        "hide_like_count": post.hide_like_count,
        "hide_share_count": post.hide_share_count,
        "is_pinned": post.is_pinned,
        "show_on_grid": post.show_on_grid,
        "is_owner": is_owner,
    }


def get_owned_post(post_id: int, db: Session, current_user: User) -> Post:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return post


class PostUpdateRequest(BaseModel):
    caption: str


class PostSettingsRequest(BaseModel):
    hide_like_count: bool | None = None
    hide_share_count: bool | None = None
    comments_enabled: bool | None = None
    downloads_enabled: bool | None = None
    is_pinned: bool | None = None
    show_on_grid: bool | None = None

# Create post
@router.post("/create")
def create_post(image_url: str, caption: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = Post(user_id=current_user.id, image_url=image_url, caption=caption)
    db.add(post)
    db.commit()
    return {"message": "Post created"}

@router.get("/feed")
def get_feed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    following = db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
    following_ids = [f[0] for f in following]
    following_ids.append(current_user.id)

    posts = db.query(Post).options(
        joinedload(Post.author),
        joinedload(Post.likes),
        joinedload(Post.comments)
    ).filter(
        Post.user_id.in_(following_ids)
    ).order_by(Post.created_at.desc()).all()

    return {"feed": [serialize_post(post, current_user.id) for post in posts]}

@router.get("/explore")
def get_explore(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Discovery: Recent posts from everyone
    posts = db.query(Post).options(
        joinedload(Post.author),
        joinedload(Post.likes),
        joinedload(Post.comments)
    ).order_by(Post.created_at.desc()).limit(20).all()

    return {"explore": [serialize_post(post, current_user.id) for post in posts]}


@router.get("/user/{user_id}")
def get_user_posts(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = db.query(Post).options(
        joinedload(Post.author),
        joinedload(Post.likes),
        joinedload(Post.comments)
    ).filter(
        Post.user_id == user_id,
        Post.show_on_grid == True
    ).order_by(Post.is_pinned.desc(), Post.created_at.desc()).all()

    serialized_posts = [serialize_post(post, current_user.id) for post in posts]
    videos_count = sum(1 for post in serialized_posts if post["media_type"] == "video")

    return {
        "posts": serialized_posts,
        "counts": {
            "posts": len(serialized_posts),
            "videos": videos_count,
            "images": len(serialized_posts) - videos_count,
        }
    }

# Like post
@router.post("/like")
def like_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return {"message": "Post not found"}

    existing = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()

    if existing:
        return {"message": "Already liked"}

    like = Like(user_id=current_user.id, post_id=post_id)
    db.add(like)

    create_notification(
        db,
        recipient_id=post.user_id,
        sender_id=current_user.id,
        type="like",
        post_id=post_id,
    )
    
    db.commit()
    return {"message": "Post liked"}


# Unlike post
@router.post("/unlike")
def unlike_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()

    if not like:
        return {"message": "Not liked"}

    db.delete(like)
    db.query(Notification).filter(
        Notification.recipient_id == like.post.user_id,
        Notification.sender_id == current_user.id,
        Notification.type == "like",
        Notification.post_id == post_id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Post unliked"}

@router.post("/comment")
def add_comment(post_id: int, text: str, parent_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return {"message": "Post not found"}
    if not post.comments_enabled:
        raise HTTPException(status_code=400, detail="Comments are turned off for this post")

    parent_comment = None
    if parent_id is not None:
        parent_comment = db.query(Comment).filter(Comment.id == parent_id).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent_comment.post_id != post_id:
            raise HTTPException(status_code=400, detail="Parent comment does not belong to this post")

    comment = Comment(user_id=current_user.id, post_id=post_id, text=text, parent_id=parent_id)
    db.add(comment)
    db.flush() # Ensure comment.id is generated

    if parent_id:
        create_notification(
            db,
            recipient_id=parent_comment.user_id,
            sender_id=current_user.id,
            type="reply",
            post_id=post_id,
            comment_id=comment.id,
            text=text,
        )

    create_notification(
        db,
        recipient_id=post.user_id,
        sender_id=current_user.id,
        type="comment",
        post_id=post_id,
        comment_id=comment.id,
        text=text,
    )

    db.commit()
    return {"message": "Comment added", "id": comment.id}

@router.get("/comments/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).options(joinedload(Comment.author)).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()

    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "parent_id": c.parent_id,
            "username": c.author.username,
            "user_id": c.author.id,
            "text": c.text,
            "created_at": c.created_at
        })

    return {"comments": result}


@router.post("/share")
def share_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.share_count = (post.share_count or 0) + 1
    db.commit()
    return {"message": "Post shared", "share_count": post.share_count}


@router.put("/{post_id}")
def update_post(post_id: int, req: PostUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = get_owned_post(post_id, db, current_user)
    post.caption = req.caption
    db.commit()
    db.refresh(post)
    return {"message": "Post updated", "post": serialize_post(post, current_user.id)}


@router.put("/{post_id}/settings")
def update_post_settings(post_id: int, req: PostSettingsRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = get_owned_post(post_id, db, current_user)

    for field in ["hide_like_count", "hide_share_count", "comments_enabled", "downloads_enabled", "is_pinned", "show_on_grid"]:
        value = getattr(req, field)
        if value is not None:
            setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return {"message": "Post settings updated", "post": serialize_post(post, current_user.id)}


@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = get_owned_post(post_id, db, current_user)
    file_path = post.image_url

    db.delete(post)
    db.commit()

    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    return {"message": "Post deleted"}

@router.post("/upload")
def upload_post(caption: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ext = os.path.splitext(file.filename)[1]
    normalized_ext = ext.lower()

    if normalized_ext not in IMAGE_EXTENSIONS and normalized_ext not in VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only image and video files are supported")

    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/{unique_filename}"

    os.makedirs("uploads", exist_ok=True)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    post = Post(
        user_id=current_user.id,
        image_url=file_path,
        caption=caption
    )

    db.add(post)
    db.commit()

    return {
        "message": "Post uploaded",
        "file_path": file_path,
        "media_type": get_media_type(file_path)
    }
