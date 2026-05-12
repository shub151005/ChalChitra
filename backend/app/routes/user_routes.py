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
from app.schemas.review_schema import (
    ReviewCreate,
    ReviewResponse,
    MovieReviewItem,
    UserReviewItem
)

from app.services.rating_service import (
    create_or_update_rating,
    get_current_user_ratings,
    get_movie_rating_summary
)
from app.services.review_service import (
    create_or_update_review,
    get_reviews_for_movie,
    get_current_user_reviews,
    delete_current_user_review
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


@router.post(
    "/reviews",
    response_model=ReviewResponse
)
def review_movie(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_or_update_review(
        db=db,
        current_user=current_user,
        tmdb_id=review_data.tmdb_id,
        review_text=review_data.review_text,
        rating_value=review_data.rating
    )


@router.get(
    "/reviews/me",
    response_model=list[UserReviewItem]
)
def my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_current_user_reviews(
        db=db,
        current_user=current_user
    )


@router.get(
    "/reviews/movie/{tmdb_id}",
    response_model=list[MovieReviewItem]
)
def movie_reviews(
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    return get_reviews_for_movie(
        db=db,
        tmdb_id=tmdb_id
    )


@router.delete(
    "/reviews/{tmdb_id}"
)
def delete_review(
    tmdb_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return delete_current_user_review(
        db=db,
        current_user=current_user,
        tmdb_id=tmdb_id
    )