from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Message, User
from security import get_current_user
from fastapi import WebSocket, WebSocketDisconnect

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

connections = {}  # user_id -> websocket

@router.websocket("/ws/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: int):
    await websocket.accept()
    connections[user_id] = websocket

    db = SessionLocal()

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

            # Send real-time to receiver if online
            if receiver_id in connections:
                await connections[receiver_id].send_json({
                    "from": user_id,
                    "text": message_text
                })

    except WebSocketDisconnect:
        if user_id in connections:
            del connections[user_id]
        db.close()
    except Exception as e:
        print(f"Chat error: {e}")
        if user_id in connections:
            del connections[user_id]
        db.close()