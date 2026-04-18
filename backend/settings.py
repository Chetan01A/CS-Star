from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User, UserSettings, BlockedUser
from pydantic import BaseModel
from typing import Optional, List
from deps import get_db
from security import get_current_user
import json

router = APIRouter()


def get_or_create_settings(db: Session, user_id: int) -> UserSettings:
    """Return the UserSettings row for a user, creating one with defaults if missing."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def settings_to_dict(settings: UserSettings, user: User) -> dict:
    try:
        hidden_story_live_from = json.loads(settings.hidden_story_live_from or "[]")
        if not isinstance(hidden_story_live_from, list):
            hidden_story_live_from = []
    except json.JSONDecodeError:
        hidden_story_live_from = []

    return {
        # profile fields
        "website": user.website or "",
        "bio": user.bio or "",
        "gender": user.gender or "Prefer not to say",
        # toggles
        "show_threads_badge": settings.show_threads_badge,
        "show_profile_suggestions": settings.show_profile_suggestions,
        "push_notifications": settings.push_notifications,
        "account_private": settings.account_private,
        "close_friends_enabled": settings.close_friends_enabled,
        "story_location_sharing": settings.story_location_sharing,
        "hidden_story_live_from": hidden_story_live_from,
        "message_controls": settings.message_controls,
        "message_request_audience": settings.message_request_audience or "everyone",
        "group_invite_audience": settings.group_invite_audience or "everyone",
        "message_replies": settings.message_replies,
        "story_reply_audience": settings.story_reply_audience or "everyone",
        "show_activity_status": settings.show_activity_status,
        "tags_mentions": settings.tags_mentions,
        "tag_audience": settings.tag_audience or "everyone",
        "mention_audience": settings.mention_audience or "everyone",
        "manual_tag_approval": settings.manual_tag_approval,
        "sharing_reuse": settings.sharing_reuse,
        "restricted_accounts": settings.restricted_accounts,
        "hidden_words": settings.hidden_words,
        "muted_accounts": settings.muted_accounts,
        "autoplay_reels": settings.autoplay_reels,
        "appearance_mode": settings.appearance_mode,
    }


# --- Pydantic schema for partial updates ---
class SettingsUpdate(BaseModel):
    # Profile fields
    website: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    # Toggle settings
    show_threads_badge: Optional[bool] = None
    show_profile_suggestions: Optional[bool] = None
    push_notifications: Optional[bool] = None
    account_private: Optional[bool] = None
    close_friends_enabled: Optional[bool] = None
    story_location_sharing: Optional[bool] = None
    hidden_story_live_from: Optional[List[int]] = None
    message_controls: Optional[bool] = None
    message_request_audience: Optional[str] = None
    group_invite_audience: Optional[str] = None
    message_replies: Optional[bool] = None
    story_reply_audience: Optional[str] = None
    show_activity_status: Optional[bool] = None
    tags_mentions: Optional[bool] = None
    tag_audience: Optional[str] = None
    mention_audience: Optional[str] = None
    manual_tag_approval: Optional[bool] = None
    sharing_reuse: Optional[bool] = None
    restricted_accounts: Optional[bool] = None
    hidden_words: Optional[bool] = None
    muted_accounts: Optional[bool] = None
    autoplay_reels: Optional[bool] = None
    appearance_mode: Optional[str] = None


# ─── GET all settings ─────────────────────────────────────────────
@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = get_or_create_settings(db, current_user.id)
    return settings_to_dict(settings, current_user)


# ─── PUT (partial update) ─────────────────────────────────────────
@router.put("/")
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = get_or_create_settings(db, current_user.id)

    # Profile fields live on the User row
    if payload.website is not None:
        current_user.website = payload.website
    if payload.bio is not None:
        current_user.bio = payload.bio[:150]  # enforce 150-char limit
    if payload.gender is not None:
        current_user.gender = payload.gender

    # Toggle / preference fields live on UserSettings
    toggle_fields = [
        "show_threads_badge", "show_profile_suggestions", "push_notifications",
        "account_private", "close_friends_enabled", "story_location_sharing",
        "message_controls", "message_request_audience", "group_invite_audience", "message_replies", "story_reply_audience", "show_activity_status", "tags_mentions", "sharing_reuse",
        "tag_audience", "mention_audience", "manual_tag_approval",
        "restricted_accounts", "hidden_words", "muted_accounts",
        "autoplay_reels", "appearance_mode",
    ]
    for field in toggle_fields:
        value = getattr(payload, field)
        if value is not None:
            setattr(settings, field, value)

    if payload.hidden_story_live_from is not None:
        settings.hidden_story_live_from = json.dumps([
            int(user_id) for user_id in payload.hidden_story_live_from
        ])

    db.commit()
    db.refresh(settings)
    db.refresh(current_user)

    return settings_to_dict(settings, current_user)


# ─── Block a user ─────────────────────────────────────────────────
@router.post("/block/{user_id}")
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == current_user.id,
        BlockedUser.blocked_id == user_id,
    ).first()
    if existing:
        return {"message": "Already blocked"}

    db.add(BlockedUser(blocker_id=current_user.id, blocked_id=user_id))
    db.commit()
    return {"message": "User blocked"}


# ─── Unblock a user ───────────────────────────────────────────────
@router.delete("/block/{user_id}")
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == current_user.id,
        BlockedUser.blocked_id == user_id,
    ).first()
    if not row:
        return {"message": "Not blocked"}

    db.delete(row)
    db.commit()
    return {"message": "User unblocked"}


# ─── List blocked users ───────────────────────────────────────────
@router.get("/blocked")
def list_blocked(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(BlockedUser).filter(BlockedUser.blocker_id == current_user.id).all()
    result = []
    for row in rows:
        user = db.query(User).filter(User.id == row.blocked_id).first()
        if user:
            result.append({
                "id": user.id,
                "username": user.username,
                "profile_pic": user.profile_pic or "",
            })
    return {"blocked": result}
