from fastapi import APIRouter, Query
from app.services.tmdb_service import (
    search_movies,
    get_movie_details,
    get_trending_movies,
    get_top_rated_movies
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
    page: int = 1
):
    return search_movies(
        query=query,
        page=page
    )


@router.get("/trending")
def trending_movies():
    return {
        "results": get_trending_movies()
    }


@router.get("/top-rated")
def top_rated_movies(
    page: int = 1
):
    return {
        "results": get_top_rated_movies(page=page)
    }


@router.get("/{tmdb_id}")
def movie_details(tmdb_id: int):
    return get_movie_details(tmdb_id)