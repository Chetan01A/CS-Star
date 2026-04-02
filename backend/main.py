from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from database import Base, engine
import models
from auth import router as auth_router
from profile import router as profile_router
from follow import router as follow_router
from post import router as post_router
from notifications import router as notification_router
from fastapi.staticfiles import StaticFiles
from chat import router as chat_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


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

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; you can restrict this to ["http://localhost:5173"] later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create tables
Base.metadata.create_all(bind=engine)
ensure_posts_schema()

# Routes
app.include_router(auth_router, prefix="/auth")

@app.get("/")
def home():
    return {"message": "API running"}

app.include_router(profile_router, prefix="/profile")
app.include_router(follow_router, prefix="/follow")
app.include_router(post_router, prefix="/post")
app.include_router(notification_router, prefix="/notifications")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(chat_router, prefix="/chat")
