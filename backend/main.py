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
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create tables
Base.metadata.create_all(bind=engine)

# Routes
app.include_router(auth_router, prefix="/auth")

@app.get("/")
def home():
    return {"message": "API running"}

app.include_router(profile_router, prefix="/profile")

app.include_router(follow_router, prefix="/follow")

app.include_router(post_router, prefix="/post")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")