from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services.tmdb_service import (
    search_movies,
    get_movie_details,
    get_trending_movies,
    get_top_rated_movies
)
from app.services.movie_cache_service import (
    get_movie_by_tmdb_id,
    save_or_update_basic_movie,
    save_or_update_detailed_movie,
    movie_to_detail_response
)

router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


@router.get("/")
def movie_test():
    return {
        "message": "Movie routes working"
    }


@router.get("/search")
def search_movie(
    query: str = Query(..., min_length=1),
    page: int = 1,
    db: Session = Depends(get_db)
):
    data = search_movies(
        query=query,
        page=page
    )

    for movie in data.get("results", []):
        save_or_update_basic_movie(
            db=db,
            movie_data=movie
        )

    return data


@router.get("/trending")
def trending_movies(
    db: Session = Depends(get_db)
):
    movies = get_trending_movies()

    for movie in movies:
        save_or_update_basic_movie(
            db=db,
            movie_data=movie
        )

    return {
        "results": movies
    }


@router.get("/top-rated")
def top_rated_movies(
    page: int = 1,
    db: Session = Depends(get_db)
):
    movies = get_top_rated_movies(page=page)

    for movie in movies:
        save_or_update_basic_movie(
            db=db,
            movie_data=movie
        )

    return {
        "results": movies
    }


@router.get("/{tmdb_id}")
def movie_details(
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    cached_movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if cached_movie and cached_movie.details_cached:
        return movie_to_detail_response(cached_movie)

    movie_data = get_movie_details(tmdb_id)

    saved_movie = save_or_update_detailed_movie(
        db=db,
        movie_data=movie_data
    )

    return movie_to_detail_response(saved_movie)