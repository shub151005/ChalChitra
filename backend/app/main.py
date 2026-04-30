from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import *

from app.routes.auth_routes import router as auth_router
from app.routes.movie_routes import router as movie_router
from app.routes.recommendation_routes import router as recommendation_router
from app.routes.user_routes import router as user_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChalChitra API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(movie_router)
app.include_router(recommendation_router)
app.include_router(user_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to ChalChitra API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }