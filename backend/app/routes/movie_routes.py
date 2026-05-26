from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db

from difflib import SequenceMatcher

from app.models.movie import Movie
from app.services.movie_cache_service import movie_to_basic_response

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
    movie_to_detail_response,
    is_detailed_cache_complete
)

from app.services.catalog_service import (
    seed_starter_catalog,
    expand_catalog_around_movie,
    seed_popular_movies,
    seed_top_rated_movies,
    seed_single_genre,
    seed_single_language,
    seed_language_batch,
    GENRE_SEED_IDS,
    LANGUAGE_SEED_CODES
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
    query: str,
    page: int = 1,
    db: Session = Depends(get_db)
):
    tmdb_response = search_movies(query, page)

    if isinstance(tmdb_response, dict):
        movies = tmdb_response.get("results", [])
    else:
        movies = tmdb_response

    for movie in movies:
        if isinstance(movie, dict):
            save_or_update_basic_movie(
                db=db,
                movie_data=movie
            )

    if movies:
        return {
            "results": movies,
            "search_type": "tmdb"
        }

    fuzzy_movies = fuzzy_local_movie_search(
        db=db,
        query=query,
        limit=12
    )

    return {
        "results": fuzzy_movies,
        "search_type": "fuzzy_local"
    }

@router.get("/trending")
def trending_movies(
    page: int = 1,
    db: Session = Depends(get_db)
):
    movies = get_trending_movies(page=page)    

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

@router.post("/catalog/seed")
def seed_catalog(
    include_languages: bool = Query(default=False),
    include_genres: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    return seed_starter_catalog(
        db=db,
        include_languages=include_languages,
        include_genres=include_genres
    )


@router.post("/catalog/seed/popular")
def seed_popular_catalog(
    pages: int = Query(default=1, ge=1, le=5),
    detail_per_page: int = Query(default=5, ge=0, le=10),
    db: Session = Depends(get_db)
):
    return seed_popular_movies(
        db=db,
        pages=pages,
        detail_per_page=detail_per_page
    )


@router.post("/catalog/seed/top-rated")
def seed_top_rated_catalog(
    pages: int = Query(default=1, ge=1, le=5),
    detail_per_page: int = Query(default=5, ge=0, le=10),
    db: Session = Depends(get_db)
):
    return seed_top_rated_movies(
        db=db,
        pages=pages,
        detail_per_page=detail_per_page
    )


@router.post("/catalog/seed/genre/{genre_name}")
def seed_genre_catalog(
    genre_name: str,
    pages: int = Query(default=1, ge=1, le=3),
    detail_limit: int = Query(default=3, ge=0, le=10),
    db: Session = Depends(get_db)
):
    return seed_single_genre(
        db=db,
        genre_name=genre_name,
        pages=pages,
        detail_limit=detail_limit
    )


@router.post("/catalog/seed/language/{language_code}")
def seed_language_catalog(
    language_code: str,
    pages: int = Query(default=1, ge=1, le=3),
    detail_limit: int = Query(default=2, ge=0, le=10),
    db: Session = Depends(get_db)
):
    return seed_single_language(
        db=db,
        language_code=language_code,
        pages=pages,
        detail_limit=detail_limit
    )


@router.post("/catalog/seed/languages/batch")
def seed_languages_batch_catalog(
    start: int = Query(default=0, ge=0),
    batch_size: int = Query(default=5, ge=1, le=10),
    pages_per_language: int = Query(default=1, ge=1, le=2),
    detail_per_language: int = Query(default=1, ge=0, le=5),
    db: Session = Depends(get_db)
):
    return seed_language_batch(
        db=db,
        start=start,
        batch_size=batch_size,
        pages_per_language=pages_per_language,
        detail_per_language=detail_per_language
    )


@router.get("/catalog/genres")
def available_genres():
    return {
        "genres": list(GENRE_SEED_IDS.keys())
    }


@router.get("/catalog/languages")
def available_languages():
    return {
        "languages": LANGUAGE_SEED_CODES,
        "total": len(LANGUAGE_SEED_CODES)
    }


@router.post("/{tmdb_id}/expand")
def expand_movie_catalog(
    tmdb_id: int,
    detail_limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return expand_catalog_around_movie(
        db=db,
        tmdb_id=tmdb_id,
        detail_limit=detail_limit
    )


@router.get("/{tmdb_id}")
def movie_details(
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    cached_movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if cached_movie and is_detailed_cache_complete(cached_movie):
        return movie_to_detail_response(cached_movie)

    movie_data = get_movie_details(tmdb_id)

    saved_movie = save_or_update_detailed_movie(
        db=db,
        movie_data=movie_data
    )

    return movie_to_detail_response(saved_movie)

def similarity_score(text_one: str, text_two: str):
    if not text_one or not text_two:
        return 0

    return SequenceMatcher(
        None,
        text_one.lower().strip(),
        text_two.lower().strip()
    ).ratio()


def fuzzy_local_movie_search(db: Session, query: str, limit: int = 12):
    cached_movies = db.query(Movie).filter(Movie.title.isnot(None)).all()

    scored_movies = []

    for movie in cached_movies:
        title_score = similarity_score(query, movie.title)

        original_title_score = 0
        if movie.original_title:
            original_title_score = similarity_score(query, movie.original_title)

        best_score = max(title_score, original_title_score)

        if best_score >= 0.55:
            scored_movies.append((best_score, movie))

    scored_movies.sort(key=lambda item: item[0], reverse=True)

    return [
        movie_to_basic_response(movie)
        for score, movie in scored_movies[:limit]
    ]