from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from models import Post, User, Follow, Like, Comment
import shutil
import uuid
import os
from deps import get_db
from security import get_current_user

router = APIRouter()

# Create post
@router.post("/create")
def create_post(image_url: str, caption: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = Post(user_id=current_user.id, image_url=image_url, caption=caption)
    db.add(post)
    db.commit()
    return {"message": "Post created"}

@router.get("/feed")
def get_feed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get users you follow
    following = db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
    following_ids = [f[0] for f in following]
    following_ids.append(current_user.id)

    # Use joinedload to fetch user data in the same query (Fix N+1)
    posts = db.query(Post).options(joinedload(Post.author)).filter(
        Post.user_id.in_(following_ids)
    ).all()

    result = []
    for post in posts:
        result.append({
            "post_id": post.id,
            "username": post.author.username,
            "image_url": post.image_url,
            "caption": post.caption
        })

    return {"feed": result}

# Like post
@router.post("/like")
def like_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()

    if existing:
        return {"message": "Already liked"}

    like = Like(user_id=current_user.id, post_id=post_id)
    db.add(like)
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
    db.commit()
    return {"message": "Post unliked"}

@router.post("/comment")
def add_comment(post_id: int, text: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = Comment(user_id=current_user.id, post_id=post_id, text=text)
    db.add(comment)
    db.commit()
    return {"message": "Comment added"}

@router.get("/comments/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    # Fetch comments with authors in one query
    comments = db.query(Comment).options(joinedload(Comment.author)).filter(Comment.post_id == post_id).all()

    result = []
    for c in comments:
        result.append({
            "username": c.author.username,
            "text": c.text
        })

    return {"comments": result}

@router.post("/upload")
def upload_post(caption: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Generate unique filename to prevent collisions
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/{unique_filename}"

    # Ensure uploads directory exists
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

    return {"message": "Post uploaded", "file_path": file_path}