from collections import defaultdict

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

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
def get_messages(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()

    result = []
    for msg in messages:
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

    return {"messages": result}


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

    for msg in message_rows:
        if msg.sender_id != current_user.id:
            contact_ids.add(msg.sender_id)
        if msg.receiver_id != current_user.id:
            contact_ids.add(msg.receiver_id)

    if not contact_ids:
        return {"contacts": []}

    users = db.query(User).filter(User.id.in_(contact_ids)).all()
    for user in users:
        contacts[user.id] = {
            "id": user.id,
            "username": user.username,
            "profile_pic": user.profile_pic or "",
        }

    return {"contacts": list(contacts.values())}


connections = defaultdict(set)  # user_id -> websocket connections

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
                    for connection in connections.get(receiver_id, set()):
                        try:
                            await connection.send_json(payload)
                        except Exception:
                            pass
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

                payload = {
                    "type": "chat",
                    "from": user_id,
                    "to": receiver_id,
                    "text": message_text,
                    "time": msg.timestamp.isoformat() if msg.timestamp else None,
                    "is_read": False,
                    "replied_to_id": msg.replied_to_id,
                    "reactions": msg.reactions,
                    "message_type": message_type,
                    "media_url": media_url,
                    "id": msg.id
                }

                for target_id in {user_id, receiver_id}:
                    stale_connections = []
                    for connection in connections.get(target_id, set()):
                        try:
                            await connection.send_json(payload)
                        except Exception:
                            stale_connections.append(connection)

                    for stale_connection in stale_connections:
                        connections[target_id].discard(stale_connection)
                    if not connections[target_id]:
                        connections.pop(target_id, None)

        except WebSocketDisconnect:
            connections[user_id].discard(websocket)
            is_offline = not connections[user_id]
            if is_offline:
                connections.pop(user_id, None)
            print(f"WebSocket disconnected for user {user_id}")
            if is_offline:
                await broadcast_status(user_id, "offline")
        except Exception as e:
            print(f"Chat error for user {user_id}: {e}")
            connections[user_id].discard(websocket)
            is_offline = not connections[user_id]
            if is_offline:
                connections.pop(user_id, None)
            if is_offline:
                await broadcast_status(user_id, "offline")

    except Exception as e:
        print(f"WebSocket setup error: {e}")
    finally:
        db.close()
