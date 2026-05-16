from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from deps import get_db
import models
from security import get_current_user
from datetime import datetime, timezone, timedelta
import os
import uuid
import shutil

router = APIRouter(tags=["Stories"])

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.post("/upload", response_model=dict)
async def upload_story(
    file: UploadFile = File(...),
    media_type: str = Form("image"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Generate a unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(UPLOADS_DIR, unique_filename)

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Store relative URL
        media_url = f"/uploads/{unique_filename}"
        
        # Calculate expiration time
        created_at = datetime.now(timezone.utc)
        expires_at = created_at + timedelta(hours=24)

        # Create story record
        new_story = models.Story(
            user_id=current_user.id,
            media_url=media_url,
            media_type=media_type,
            created_at=created_at,
            expires_at=expires_at
        )

        db.add(new_story)
        db.commit()
        db.refresh(new_story)

        return {
            "id": new_story.id,
            "media_url": new_story.media_url,
            "media_type": new_story.media_type,
            "created_at": new_story.created_at,
            "expires_at": new_story.expires_at,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "profile_pic": current_user.profile_pic
            }
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/feed", response_model=list)
def get_story_feed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    
    # 1. Get IDs of users the current user is following
    following_records = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id).all()
    following_ids = [record.following_id for record in following_records]
    
    # Include current user's own stories in the feed
    relevant_user_ids = following_ids + [current_user.id]

    # 2. Fetch active stories for these users
    active_stories = db.query(models.Story).filter(
        models.Story.user_id.in_(relevant_user_ids),
        models.Story.expires_at > now
    ).order_by(models.Story.created_at.asc()).all()

    # 3. Group stories by user to make it easier for the frontend to build the StoryBar
    # The frontend usually expects a list of users, each with a list of their active stories.
    # Alternatively, we can return grouped data here.
    
    grouped_stories = {}
    for story in active_stories:
        user_id = story.user_id
        if user_id not in grouped_stories:
            author = story.author
            grouped_stories[user_id] = {
                "user": {
                    "id": author.id,
                    "username": author.username,
                    "profile_pic": author.profile_pic
                },
                "stories": []
            }
        
        grouped_stories[user_id]["stories"].append({
            "id": story.id,
            "media_url": story.media_url,
            "media_type": story.media_type,
            "created_at": story.created_at,
            "expires_at": story.expires_at
        })
    
    # Convert dict to list
    result = list(grouped_stories.values())
    
    # Put current user first if they have stories
    current_user_item = next((item for item in result if item["user"]["id"] == current_user.id), None)
    if current_user_item:
        result.remove(current_user_item)
        result.insert(0, current_user_item)
        
    return result

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    story = db.query(models.Story).filter(models.Story.id == story_id, models.Story.user_id == current_user.id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or unauthorized")
    
    db.delete(story)
    db.commit()
    return None
