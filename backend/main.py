import os
from dotenv import load_dotenv

# Load environment variables at the very beginning
load_dotenv()

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from database import Base, engine
import models
from auth import router as auth_router
from user_profile import router as profile_router
from follow import router as follow_router
from post import router as post_router
from notifications import router as notification_router
from fastapi.staticfiles import StaticFiles
from chat import router as chat_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://cs-star.onrender.com").rstrip("/")


def ensure_posts_schema():
    expected_columns = {
        "hide_like_count": "BOOLEAN DEFAULT 0",
        "hide_share_count": "BOOLEAN DEFAULT 0",
        "comments_enabled": "BOOLEAN DEFAULT 1",
        "downloads_enabled": "BOOLEAN DEFAULT 1",
        "is_pinned": "BOOLEAN DEFAULT 0",
        "show_on_grid": "BOOLEAN DEFAULT 1",
        "share_count": "INTEGER DEFAULT 0",
    }

    with engine.begin() as connection:
        existing_columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(posts)").fetchall()
        }

        for column_name, definition in expected_columns.items():
            if column_name not in existing_columns:
                connection.exec_driver_sql(
                    f"ALTER TABLE posts ADD COLUMN {column_name} {definition}"
                )

def ensure_messages_schema():
    expected_columns = {
        "is_read": "BOOLEAN DEFAULT 0",
        "replied_to_id": "INTEGER",
        "reactions": "TEXT DEFAULT '{}'",
        "message_type": "TEXT DEFAULT 'text'",
        "media_url": "TEXT",
    }
    with engine.begin() as connection:
        existing_columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(messages)").fetchall()
        }
        for column_name, definition in expected_columns.items():
            if column_name not in existing_columns:
                connection.exec_driver_sql(
                    f"ALTER TABLE messages ADD COLUMN {column_name} {definition}"
                )

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Routes
try:
    print("DEBUG: Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("DEBUG: Checking posts schema...")
    ensure_posts_schema()
    print("DEBUG: Checking messages schema...")
    ensure_messages_schema()
    print("DEBUG: Schema setup complete.")
except Exception as e:
    print(f"CRITICAL: Database/Schema initialization failed: {e}")
    import traceback
    traceback.print_exc()

try:
    print("DEBUG: Including routers...")
    app.include_router(auth_router, prefix="/auth")
    app.include_router(profile_router, prefix="/profile")
    app.include_router(follow_router, prefix="/follow")
    app.include_router(post_router, prefix="/post")
    app.include_router(notification_router, prefix="/notifications")
    app.include_router(chat_router, prefix="/chat")
    print("DEBUG: All routers included successfully.")
except Exception as e:
    print(f"CRITICAL: Failed to include routers: {e}")
    import traceback
    traceback.print_exc()

@app.get("/")
def home():
    return {"message": "API running"}

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
