from collections import defaultdict
import asyncio

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Follow, Message, User
from jose import jwt, JWTError
import json
import os
import uuid
import shutil
from fastapi import WebSocket, WebSocketDisconnect, File, UploadFile
from security import get_current_user, SECRET_KEY, ALGORITHM
from datetime import timezone, datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Message).filter(Message.receiver_id == current_user.id, Message.is_read == False).count()
    return {"count": count}

@router.get("/test-token")
def test_token_endpoint(token: str, db: Session = Depends(get_db)):
    """Test endpoint to verify JWT token validity"""
    import asyncio
    from security import SECRET_KEY, ALGORITHM
    from jose import jwt, JWTError

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return {"valid": False, "error": "No user ID in token"}

        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            return {"valid": False, "error": "User not found"}

        return {
            "valid": True,
            "user_id": user.id,
            "username": user.username,
            "expires": payload.get("exp")
        }
    except JWTError as e:
        return {"valid": False, "error": f"JWT Error: {str(e)}"}
    except Exception as e:
        return {"valid": False, "error": f"Unexpected error: {str(e)}"}

async def verify_websocket_token(token: str, db: Session):
    """Verify JWT token for WebSocket connection"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user

@router.get("/messages/{user_id}")
def get_messages(
    user_id: int,
    before: str = Query(default=None),
    limit: int = Query(default=40, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    )

    if before:
        try:
            before_dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
            query = query.filter(Message.timestamp < before_dt)
        except ValueError:
            pass

    rows = query.order_by(Message.timestamp.desc()).limit(limit + 1).all()
    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]
    rows.reverse()

    result = []
    for msg in rows:
        result.append({
            "from": msg.sender_id,
            "to": msg.receiver_id,
            "text": msg.text,
            "time": msg.timestamp,
            "is_read": msg.is_read,
            "replied_to_id": msg.replied_to_id,
            "reactions": msg.reactions,
            "message_type": msg.message_type,
            "media_url": msg.media_url,
            "id": msg.id
        })

    next_before = (
        rows[0].timestamp.replace(tzinfo=timezone.utc).isoformat()
        if has_more and rows and rows[0].timestamp
        else None
    )

    return {
        "messages": result,
        "has_more": has_more,
        "next_before": next_before,
    }


@router.get("/contacts")
def get_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contacts = {}

    following = db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    followers = db.query(Follow).filter(Follow.following_id == current_user.id).all()

    contact_ids = {follow.following_id for follow in following}
    contact_ids.update(follow.follower_id for follow in followers)

    message_rows = db.query(Message).filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    ).all()

    contact_ids.update(msg.sender_id for msg in message_rows)
    contact_ids.update(msg.receiver_id for msg in message_rows)
    contact_ids.discard(current_user.id)

    if not contact_ids:
        return {"contacts": []}

    last_message_by_contact = {}
    unread_count_by_contact = defaultdict(int)
    sorted_messages = sorted(
        message_rows,
        key=lambda msg: msg.timestamp or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )

    for msg in sorted_messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_user_id == current_user.id:
            continue

        if other_user_id not in last_message_by_contact:
            last_message_by_contact[other_user_id] = msg

        if msg.receiver_id == current_user.id and msg.sender_id == other_user_id and not msg.is_read:
            unread_count_by_contact[other_user_id] += 1

    users = db.query(User).filter(User.id.in_(contact_ids)).all()
    for user in users:
        last_message = last_message_by_contact.get(user.id)
        contacts[user.id] = {
            "id": user.id,
            "username": user.username,
            "profile_pic": user.profile_pic or "",
            "last_message": (last_message.text or "") if last_message else "",
            "last_message_at": (
                last_message.timestamp.replace(tzinfo=timezone.utc).isoformat()
                if last_message and last_message.timestamp
                else None
            ),
            "last_message_type": last_message.message_type if last_message else None,
            "unread_count": unread_count_by_contact.get(user.id, 0),
        }

    ordered_contacts = sorted(
        contacts.values(),
        key=lambda c: c.get("last_message_at") or "",
        reverse=True,
    )
    return {"contacts": ordered_contacts}


connections = defaultdict(set)  # user_id -> websocket connections

CALL_SIGNAL_TYPES = {
    "call_invite",
    "call_accept",
    "call_reject",
    "call_busy",
    "call_end",
    "screen_share_status",
    "webrtc_offer",
    "webrtc_answer",
    "webrtc_ice_candidate",
}

CALL_INVITE_TIMEOUT_SECONDS = 30
active_calls = {}  # call_id -> metadata
user_call_map = {}  # user_id -> call_id
call_timeout_tasks = {}  # call_id -> asyncio.Task

async def broadcast_status(user_id: int, status: str):
    msg = {"type": "status", "user_id": user_id, "status": status}
    stale_to_remove = []
    for uid, connections_set in connections.items():
        if uid != user_id:
            stale = []
            for ws in connections_set:
                try:
                    await ws.send_json(msg)
                except Exception:
                    stale.append(ws)
            for ws in stale:
                connections_set.discard(ws)
            if not connections_set:
                stale_to_remove.append(uid)
    for uid in stale_to_remove:
        connections.pop(uid, None)


async def send_to_user(target_id: int, payload: dict):
    stale_connections = []
    for connection in connections.get(target_id, set()):
        try:
            await connection.send_json(payload)
        except Exception:
            stale_connections.append(connection)

    for stale_connection in stale_connections:
        connections[target_id].discard(stale_connection)

    if target_id in connections and not connections[target_id]:
        connections.pop(target_id, None)


def serialize_message(msg: Message):
    return {
        "from": msg.sender_id,
        "to": msg.receiver_id,
        "text": msg.text,
        "time": msg.timestamp.replace(tzinfo=timezone.utc).isoformat() if msg.timestamp else None,
        "is_read": msg.is_read,
        "replied_to_id": msg.replied_to_id,
        "reactions": msg.reactions,
        "message_type": msg.message_type,
        "media_url": msg.media_url,
        "id": msg.id
    }


async def broadcast_to_participants(user_id: int, receiver_id: int, payload: dict):
    for target_id in {user_id, receiver_id}:
        await send_to_user(target_id, payload)


def create_system_message(db: Session, sender_id: int, receiver_id: int, text: str):
    msg = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        text=text,
        message_type="system",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


async def publish_system_message(sender_id: int, receiver_id: int, text: str):
    db = SessionLocal()
    try:
        msg = create_system_message(db, sender_id=sender_id, receiver_id=receiver_id, text=text)
        await broadcast_to_participants(sender_id, receiver_id, {"type": "chat", **serialize_message(msg)})
    finally:
        db.close()


def is_user_busy(user_id: int):
    call_id = user_call_map.get(user_id)
    if not call_id:
        return False
    meta = active_calls.get(call_id)
    return bool(meta and meta.get("state") in {"ringing", "connecting", "active"})


def cleanup_call(call_id: str):
    metadata = active_calls.pop(call_id, None)
    if not metadata:
        return None
    for participant_id in metadata.get("participants", []):
        if user_call_map.get(participant_id) == call_id:
            user_call_map.pop(participant_id, None)
    timeout_task = call_timeout_tasks.pop(call_id, None)
    if timeout_task and not timeout_task.done():
        timeout_task.cancel()
    return metadata


async def teardown_user_call(user_id: int, reason: str = "call_end"):
    call_id = user_call_map.get(user_id)
    if not call_id:
        return
    metadata = active_calls.get(call_id)
    if not metadata:
        user_call_map.pop(user_id, None)
        return

    participants = list(metadata.get("participants", []))
    counterpart = next((pid for pid in participants if pid != user_id), None)
    call_mode = metadata.get("call_mode", "audio")
    if counterpart:
        await send_to_user(counterpart, {"type": "call_end", "from": user_id, "to": counterpart, "call_id": call_id, "call_mode": call_mode, "reason": reason})
    cleanup_call(call_id)


async def schedule_invite_timeout(call_id: str):
    try:
        await asyncio.sleep(CALL_INVITE_TIMEOUT_SECONDS)
        metadata = active_calls.get(call_id)
        if not metadata or metadata.get("state") != "ringing":
            return

        caller_id = metadata["caller_id"]
        callee_id = metadata["callee_id"]
        call_mode = metadata.get("call_mode", "audio")
        await send_to_user(caller_id, {"type": "call_missed", "to": caller_id, "from": callee_id, "call_id": call_id, "call_mode": call_mode})
        await send_to_user(callee_id, {"type": "call_missed", "to": callee_id, "from": caller_id, "call_id": call_id, "call_mode": call_mode})
        await publish_system_message(caller_id, callee_id, f"Missed {call_mode} call")
        cleanup_call(call_id)
    except asyncio.CancelledError:
        return

@router.post("/upload")
async def upload_chat_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/{unique_filename}"
    
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/{file_path}"}

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket, token: str = Query(...)):
    db = SessionLocal()

    try:
        # Verify token and get user
        user = await verify_websocket_token(token, db)
        if not user:
            print("WebSocket auth failed: Invalid token provided")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            db.close()
            return

        user_id = user.id
        print(f"WebSocket connection established for user {user_id} ({user.username})")
        await websocket.accept()
        
        is_new_connection = user_id not in connections or len(connections[user_id]) == 0
        connections[user_id].add(websocket)

        # Send initial online users to the newly connected user
        currently_online = [uid for uid, socks in connections.items() if len(socks) > 0]
        await websocket.send_json({"type": "init_online", "users": currently_online})

        if is_new_connection:
            await broadcast_status(user_id, "online")

        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type", "chat")
                receiver_id = data.get("to")
                
                if not receiver_id:
                    continue

                if msg_type in ("typing_start", "typing_stop"):
                    payload = {"type": msg_type, "from": user_id, "to": receiver_id}
                    await send_to_user(receiver_id, payload)
                    continue

                if msg_type == "call_invite":
                    call_mode = data.get("call_mode", "audio")
                    if is_user_busy(user_id) or is_user_busy(receiver_id):
                        await send_to_user(user_id, {"type": "call_busy", "to": user_id, "from": receiver_id, "reason": "user_busy"})
                        continue

                    call_id = str(uuid.uuid4())
                    active_calls[call_id] = {
                        "call_id": call_id,
                        "caller_id": user_id,
                        "callee_id": receiver_id,
                        "participants": {user_id, receiver_id},
                        "call_mode": call_mode,
                        "state": "ringing",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                    user_call_map[user_id] = call_id
                    user_call_map[receiver_id] = call_id
                    call_timeout_tasks[call_id] = asyncio.create_task(schedule_invite_timeout(call_id))
                    await publish_system_message(user_id, receiver_id, f"{user.username} started a {call_mode} call")

                    payload = {
                        **data,
                        "type": "call_invite",
                        "from": user_id,
                        "to": receiver_id,
                        "call_id": call_id,
                        "from_username": user.username,
                        "from_profile_pic": user.profile_pic or "",
                    }
                    await send_to_user(receiver_id, payload)
                    await send_to_user(user_id, payload)
                    continue

                if msg_type in CALL_SIGNAL_TYPES:
                    call_id = data.get("call_id")
                    if msg_type != "call_invite":
                        if not call_id or call_id not in active_calls:
                            continue
                        metadata = active_calls[call_id]
                        if user_id not in metadata.get("participants", set()) or receiver_id not in metadata.get("participants", set()):
                            continue

                        if msg_type == "call_accept":
                            metadata["state"] = "active"
                            timeout_task = call_timeout_tasks.pop(call_id, None)
                            if timeout_task and not timeout_task.done():
                                timeout_task.cancel()
                            await publish_system_message(user_id, receiver_id, f"{user.username} accepted the call")
                        elif msg_type == "call_reject":
                            await publish_system_message(user_id, receiver_id, f"{user.username} declined the call")
                            cleanup_call(call_id)
                        elif msg_type == "call_end":
                            await publish_system_message(user_id, receiver_id, "Call ended")
                            cleanup_call(call_id)

                    payload = {
                        **data,
                        "type": msg_type,
                        "from": user_id,
                        "to": receiver_id,
                        "call_id": call_id,
                        "from_username": user.username,
                        "from_profile_pic": user.profile_pic or "",
                    }
                    await send_to_user(receiver_id, payload)
                    await send_to_user(user_id, payload)
                    continue
                
                if msg_type == "delete":
                    message_id = data.get("message_id")
                    msg = db.query(Message).filter(Message.id == message_id).first()
                    if msg and (msg.sender_id == user_id or msg.receiver_id == user_id):
                        db.delete(msg)
                        db.commit()
                        
                        payload = {"type": "delete", "id": message_id, "to": receiver_id, "from": user_id}
                        for target_id in {user_id, receiver_id}:
                            for connection in connections.get(target_id, set()):
                                try: await connection.send_json(payload)
                                except: pass
                    continue
                
                if msg_type == "reaction":
                    message_id = data.get("message_id")
                    emoji = data.get("emoji")
                    msg = db.query(Message).filter(Message.id == message_id).first()
                    if msg:
                        # Toggle logic
                        current_reactions = json.loads(msg.reactions or "{}")
                        if emoji in current_reactions:
                            if user_id in current_reactions[emoji]:
                                current_reactions[emoji].remove(user_id)
                                if not current_reactions[emoji]:
                                    del current_reactions[emoji]
                            else:
                                current_reactions[emoji].append(user_id)
                        else:
                            current_reactions[emoji] = [user_id]
                        
                        msg.reactions = json.dumps(current_reactions)
                        db.commit()
                        
                        payload = {"type": "reaction", "id": message_id, "reactions": msg.reactions, "to": receiver_id, "from": user_id}
                        for target_id in {user_id, receiver_id}:
                            for connection in connections.get(target_id, set()):
                                try: await connection.send_json(payload)
                                except: pass
                    continue

                if msg_type == "mark_read":
                    unread_messages = db.query(Message).filter(
                        Message.sender_id == receiver_id,
                        Message.receiver_id == user_id,
                        Message.is_read == False
                    ).all()
                    
                    if unread_messages:
                        for m in unread_messages:
                            m.is_read = True
                        db.commit()
                        
                        payload = {"type": "messages_read", "from": user_id, "to": receiver_id}
                        for connection in connections.get(receiver_id, set()):
                            try:
                                await connection.send_json(payload)
                            except:
                                pass
                    continue

                message_text = data.get("text", "")
                message_type = data.get("message_type", "text")
                media_url = data.get("media_url")
                client_id = data.get("client_id")
                
                if not message_text and not media_url:
                    continue

                # Save message to DB
                msg = Message(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    text=message_text,
                    replied_to_id=data.get("replied_to_id"),
                    message_type=message_type,
                    media_url=media_url
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                if client_id:
                    await websocket.send_json({
                        "type": "chat_ack",
                        "client_id": client_id,
                        "id": msg.id,
                        "from": user_id,
                        "to": receiver_id,
                        "time": msg.timestamp.replace(tzinfo=timezone.utc).isoformat() if msg.timestamp else None,
                    })

                payload = {
                    "type": "chat",
                    **serialize_message(msg),
                    **({"client_id": client_id} if client_id else {}),
                }
                await broadcast_to_participants(user_id, receiver_id, payload)

        except WebSocketDisconnect:
            connections[user_id].discard(websocket)
            is_offline = not connections[user_id]
            if is_offline:
                connections.pop(user_id, None)
                await teardown_user_call(user_id, reason="disconnect")
            print(f"WebSocket disconnected for user {user_id}")
            if is_offline:
                await broadcast_status(user_id, "offline")
        except Exception as e:
            print(f"Chat error for user {user_id}: {e}")
            connections[user_id].discard(websocket)
            is_offline = not connections[user_id]
            if is_offline:
                connections.pop(user_id, None)
                await teardown_user_call(user_id, reason="disconnect")
            if is_offline:
                await broadcast_status(user_id, "offline")

    except Exception as e:
        print(f"WebSocket setup error: {e}")
    finally:
        db.close()
