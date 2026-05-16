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
from settings import router as settings_router
from activity import router as activity_router
from story import router as story_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://cs-star.onrender.com").rstrip("/")


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
    print("DEBUG: Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("DEBUG: Database initialization complete.")
except Exception as e:
    print(f"CRITICAL: Database initialization failed: {e}")
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
    app.include_router(settings_router, prefix="/settings")
    app.include_router(activity_router, prefix="/activity")
    app.include_router(story_router, prefix="/story")
    print("DEBUG: All routers included successfully.")
except Exception as e:
    print(f"CRITICAL: Failed to include routers: {e}")
    import traceback
    traceback.print_exc()

@app.get("/")
def home():
    return {"message": "API running"}

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
