from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.review import Review
from app.models.movie import Movie
from app.models.user import User

from app.services.movie_cache_service import (
    get_movie_by_tmdb_id,
    save_or_update_detailed_movie
)
from app.services.tmdb_service import get_movie_details
from app.services.rating_service import create_or_update_rating


def create_or_update_review(
    db: Session,
    current_user: User,
    tmdb_id: int,
    review_text: str,
    rating_value: int | None = None
):
    cleaned_review = review_text.strip()

    if len(cleaned_review) < 3:
        raise HTTPException(
            status_code=400,
            detail="Review must contain at least 3 characters"
        )

    if rating_value is not None and (
        rating_value < 1 or rating_value > 10
    ):
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 10"
        )

    movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if not movie:
        movie_data = get_movie_details(tmdb_id)
        movie = save_or_update_detailed_movie(
            db=db,
            movie_data=movie_data
        )

    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.movie_id == movie.id
    ).first()

    if existing_review:
        existing_review.review_text = cleaned_review
        existing_review.rating = rating_value

        db.commit()
        db.refresh(existing_review)

        if rating_value is not None:
            create_or_update_rating(
                db=db,
                current_user=current_user,
                tmdb_id=tmdb_id,
                rating_value=rating_value
            )

        return existing_review

    new_review = Review(
        user_id=current_user.id,
        movie_id=movie.id,
        review_text=cleaned_review,
        rating=rating_value
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    if rating_value is not None:
        create_or_update_rating(
            db=db,
            current_user=current_user,
            tmdb_id=tmdb_id,
            rating_value=rating_value
        )

    return new_review


def get_reviews_for_movie(
    db: Session,
    tmdb_id: int
):
    movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if not movie:
        raise HTTPException(
            status_code=404,
            detail="Movie not found in database. Search or open movie details first."
        )

    reviews = db.query(Review).join(User).filter(
        Review.movie_id == movie.id
    ).order_by(
        Review.updated_at.desc()
    ).all()

    return [
        {
            "review_id": review.id,
            "user_id": review.user.id,
            "user_name": review.user.name,
            "movie_id": movie.id,
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "review_text": review.review_text,
            "rating": review.rating,
            "created_at": review.created_at,
            "updated_at": review.updated_at
        }
        for review in reviews
    ]


def get_current_user_reviews(
    db: Session,
    current_user: User
):
    reviews = db.query(Review).join(Movie).filter(
        Review.user_id == current_user.id
    ).order_by(
        Review.updated_at.desc()
    ).all()

    return [
        {
            "review_id": review.id,
            "movie_id": review.movie.id,
            "tmdb_id": review.movie.tmdb_id,
            "title": review.movie.title,
            "poster_url": review.movie.poster_url,
            "release_date": review.movie.release_date,
            "review_text": review.review_text,
            "rating": review.rating,
            "created_at": review.created_at,
            "updated_at": review.updated_at
        }
        for review in reviews
    ]


def delete_current_user_review(
    db: Session,
    current_user: User,
    tmdb_id: int
):
    movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if not movie:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.movie_id == movie.id
    ).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found"
        )

    db.delete(review)
    db.commit()

    return {
        "message": "Review deleted successfully"
    }