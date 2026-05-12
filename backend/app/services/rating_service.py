from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.rating import Rating
from app.models.movie import Movie
from app.models.user import User
from app.services.movie_cache_service import (
    get_movie_by_tmdb_id,
    save_or_update_detailed_movie
)
from app.services.tmdb_service import get_movie_details


def create_or_update_rating(
    db: Session,
    current_user: User,
    tmdb_id: int,
    rating_value: int
):
    if rating_value < 1 or rating_value > 10:
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

    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie.id
    ).first()

    if existing_rating:
        existing_rating.rating = rating_value
        db.commit()
        db.refresh(existing_rating)
        return existing_rating

    new_rating = Rating(
        user_id=current_user.id,
        movie_id=movie.id,
        rating=rating_value
    )

    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    return new_rating


def get_current_user_ratings(
    db: Session,
    current_user: User
):
    ratings = db.query(Rating).join(Movie).filter(
        Rating.user_id == current_user.id
    ).order_by(
        Rating.updated_at.desc()
    ).all()

    return [
        {
            "rating_id": item.id,
            "rating": item.rating,
            "movie_id": item.movie.id,
            "tmdb_id": item.movie.tmdb_id,
            "title": item.movie.title,
            "poster_url": item.movie.poster_url,
            "release_date": item.movie.release_date
        }
        for item in ratings
    ]


def get_movie_rating_summary(
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

    result = db.query(
        func.avg(Rating.rating),
        func.count(Rating.id)
    ).filter(
        Rating.movie_id == movie.id
    ).first()

    average_rating = result[0] or 0
    total_ratings = result[1] or 0

    return {
        "movie_id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "average_rating": round(float(average_rating), 2),
        "total_ratings": total_ratings
    }