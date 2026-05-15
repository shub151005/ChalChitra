from fastapi import APIRouter, Depends, Query
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
from app.schemas.watchlist_schema import (
    WatchlistCreate,
    WatchlistResponse,
    WatchlistItem
)
from app.schemas.follow_schema import (
    FollowCreate,
    FollowResponse,
    FollowItem
)
from app.schemas.analytics_schema import (
    TasteAnalyticsResponse,
    GenrePreferenceItem,
    LanguagePreferenceItem,
    CreatorPreferenceItem
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
from app.services.watchlist_service import (
    add_or_update_watchlist,
    get_current_user_watchlist,
    remove_from_watchlist
)
from app.services.follow_service import (
    follow_person,
    get_current_user_follows,
    unfollow_person
)
from app.services.analytics_service import (
    calculate_user_taste_analytics,
    get_user_genre_analytics,
    get_user_language_analytics,
    get_user_creator_analytics
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


@router.post(
    "/watchlist",
    response_model=WatchlistResponse
)
def add_watchlist_item(
    watchlist_data: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return add_or_update_watchlist(
        db=db,
        current_user=current_user,
        tmdb_id=watchlist_data.tmdb_id,
        status=watchlist_data.status
    )


@router.get(
    "/watchlist/me",
    response_model=list[WatchlistItem]
)
def my_watchlist(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_current_user_watchlist(
        db=db,
        current_user=current_user,
        status=status
    )


@router.delete(
    "/watchlist/{tmdb_id}"
)
def delete_watchlist_item(
    tmdb_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return remove_from_watchlist(
        db=db,
        current_user=current_user,
        tmdb_id=tmdb_id
    )


@router.post(
    "/follows",
    response_model=FollowResponse
)
def follow_actor_or_director(
    follow_data: FollowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return follow_person(
        db=db,
        current_user=current_user,
        person_id=follow_data.person_id,
        follow_type=follow_data.type,
        name=follow_data.name,
        profile_url=follow_data.profile_url
    )


@router.get(
    "/follows/me",
    response_model=list[FollowItem]
)
def my_follows(
    type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_current_user_follows(
        db=db,
        current_user=current_user,
        follow_type=type
    )


@router.delete(
    "/follows/{person_id}"
)
def delete_follow(
    person_id: int,
    type: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return unfollow_person(
        db=db,
        current_user=current_user,
        person_id=person_id,
        follow_type=type
    )


@router.get(
    "/analytics/me",
    response_model=TasteAnalyticsResponse
)
def my_taste_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return calculate_user_taste_analytics(
        db=db,
        current_user=current_user
    )


@router.get(
    "/analytics/me/genres"
)
def my_genre_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_genre_analytics(
        db=db,
        current_user=current_user
    )


@router.get(
    "/analytics/me/languages"
)
def my_language_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_language_analytics(
        db=db,
        current_user=current_user
    )


@router.get(
    "/analytics/me/creators"
)
def my_creator_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_creator_analytics(
        db=db,
        current_user=current_user
    )