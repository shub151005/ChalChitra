from app.services.hybrid_recommendation_service import build_hybrid_movie_recommendations
from app.services.hybrid_hidden_gem_service import build_hybrid_hidden_gems_for_movie
from app.services.ml_recommendation_service import get_ml_similar_movies
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User

from app.services.recommendation_quality_service import (
    build_hidden_gem_results,
    build_similar_taste_results
)

from app.services.recommendation_service import (
    get_movie_recommendations,
    get_hidden_gems_for_movie,
    get_personalized_recommendations,
    get_personalized_hidden_gems,
    get_recommendations_from_followed_directors,
    get_recommendations_from_followed_actors
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

@router.get("/ml/movie/{tmdb_id}")
def ml_movie_recommendations(
    tmdb_id: int,
    limit: int = 10
):
    return get_ml_similar_movies(
        tmdb_id=tmdb_id,
        limit=limit
    )

@router.get("/hybrid/movie/{tmdb_id}")
def hybrid_movie_recommendations(
    tmdb_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return build_hybrid_movie_recommendations(
        db=db,
        tmdb_id=tmdb_id,
        limit=limit
    )

@router.get("/movie/{tmdb_id}")
def movie_recommendations(
    tmdb_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    raw_recommendations = get_movie_recommendations(
        db=db,
        tmdb_id=tmdb_id,
        limit=max(limit * 2, 20)
    )

    similar_results = build_similar_taste_results(
        raw_movies=raw_recommendations,
        limit=limit
    )

    return {
        "results": similar_results,
        "recommendations": similar_results,
        "type": "similar_taste"
    }

@router.get("/hidden-gems/{tmdb_id}")
def hidden_gems(
    tmdb_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return build_hybrid_hidden_gems_for_movie(
        db=db,
        tmdb_id=tmdb_id,
        limit=limit
    )


@router.get("/me")
def personalized_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_personalized_recommendations(
        db=db,
        current_user=current_user,
        limit=limit
    )


@router.get("/me/hidden-gems")
def personalized_hidden_gems(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_personalized_hidden_gems(
        db=db,
        current_user=current_user,
        limit=limit
    )


@router.get("/me/directors")
def recommendations_from_directors(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_recommendations_from_followed_directors(
        db=db,
        current_user=current_user,
        limit=limit
    )


@router.get("/me/actors")
def recommendations_from_actors(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_recommendations_from_followed_actors(
        db=db,
        current_user=current_user,
        limit=limit
    )