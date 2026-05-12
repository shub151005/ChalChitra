from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.rating_schema import (
    RatingCreate,
    RatingResponse,
    UserRatingItem,
    MovieRatingSummary
)
from app.services.rating_service import (
    create_or_update_rating,
    get_current_user_ratings,
    get_movie_rating_summary
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/")
def user_test():
    return {
        "message": "User routes working"
    }


@router.post(
    "/ratings",
    response_model=RatingResponse
)
def rate_movie(
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_or_update_rating(
        db=db,
        current_user=current_user,
        tmdb_id=rating_data.tmdb_id,
        rating_value=rating_data.rating
    )


@router.get(
    "/ratings/me",
    response_model=list[UserRatingItem]
)
def my_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_current_user_ratings(
        db=db,
        current_user=current_user
    )


@router.get(
    "/ratings/movie/{tmdb_id}",
    response_model=MovieRatingSummary
)
def movie_rating_summary(
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    return get_movie_rating_summary(
        db=db,
        tmdb_id=tmdb_id
    )