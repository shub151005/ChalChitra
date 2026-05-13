from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services.recommendation_service import (
    get_movie_recommendations,
    get_hidden_gems_for_movie
)

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


@router.get("/")
def recommendation_test():
    return {
        "message": "Recommendation routes working"
    }


@router.get("/movie/{tmdb_id}")
def recommend_by_movie(
    tmdb_id: int,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return get_movie_recommendations(
        db=db,
        tmdb_id=tmdb_id,
        limit=limit
    )


@router.get("/hidden-gems/{tmdb_id}")
def hidden_gems_by_movie(
    tmdb_id: int,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return get_hidden_gems_for_movie(
        db=db,
        tmdb_id=tmdb_id,
        limit=limit
    )