from collections import defaultdict

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Follow, Message, User
from security import get_current_user, SECRET_KEY, ALGORITHM
from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

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
            "time": msg.timestamp
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
        connections[user_id].add(websocket)

        try:
            while True:
                data = await websocket.receive_json()

                receiver_id = data["to"]
                message_text = data["text"]

                # Save message to DB
                msg = Message(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    text=message_text
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                payload = {
                    "from": user_id,
                    "to": receiver_id,
                    "text": message_text,
                    "time": msg.timestamp.isoformat() if msg.timestamp else None,
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
            if not connections[user_id]:
                connections.pop(user_id, None)
            print(f"WebSocket disconnected for user {user_id}")
        except Exception as e:
            print(f"Chat error for user {user_id}: {e}")
            connections[user_id].discard(websocket)
            if not connections[user_id]:
                connections.pop(user_id, None)

    except Exception as e:
        print(f"WebSocket setup error: {e}")
    finally:
        db.close()
