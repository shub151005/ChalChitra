from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.watchlist import Watchlist
from app.models.movie import Movie
from app.models.user import User

from app.services.movie_cache_service import (
    get_movie_by_tmdb_id,
    save_or_update_detailed_movie
)
from app.services.tmdb_service import get_movie_details


VALID_WATCHLIST_STATUSES = {
    "watch_later",
    "watching",
    "completed",
    "dropped"
}


def validate_watchlist_status(status: str):
    if status not in VALID_WATCHLIST_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Use watch_later, watching, completed, or dropped."
        )


def add_or_update_watchlist(
    db: Session,
    current_user: User,
    tmdb_id: int,
    status: str
):
    validate_watchlist_status(status)

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

    existing_item = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie.id
    ).first()

    if existing_item:
        existing_item.status = status
        db.commit()
        db.refresh(existing_item)
        return existing_item

    new_item = Watchlist(
        user_id=current_user.id,
        movie_id=movie.id,
        status=status
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


def get_current_user_watchlist(
    db: Session,
    current_user: User,
    status: str | None = None
):
    query = db.query(Watchlist).join(Movie).filter(
        Watchlist.user_id == current_user.id
    )

    if status:
        validate_watchlist_status(status)
        query = query.filter(Watchlist.status == status)

    items = query.order_by(
        Watchlist.updated_at.desc()
    ).all()

    return [
        {
            "watchlist_id": item.id,
            "status": item.status,
            "movie_id": item.movie.id,
            "tmdb_id": item.movie.tmdb_id,
            "title": item.movie.title,
            "poster_url": item.movie.poster_url,
            "backdrop_url": item.movie.backdrop_url,
            "release_date": item.movie.release_date,
            "rating": item.movie.rating,
            "language": item.movie.language
        }
        for item in items
    ]


def remove_from_watchlist(
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

    item = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Watchlist item not found"
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Movie removed from watchlist successfully"
    }