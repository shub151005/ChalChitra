from sqlalchemy.orm import Session

from app.models.movie import Movie

from app.services.tmdb_service import (
    get_movie_details,
    get_popular_movies,
    get_top_rated_movies,
    discover_movies_by_genre,
    discover_movies_by_language,
    get_similar_movies,
    get_tmdb_movie_recommendations,
    get_person_movie_credits
)

from app.services.movie_cache_service import (
    get_movie_by_tmdb_id,
    save_or_update_basic_movie,
    save_or_update_detailed_movie
)


GENRE_SEED_IDS = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "mystery": 9648,
    "romance": 10749,
    "science_fiction": 878,
    "thriller": 53,
    "war": 10752,
    "western": 37
}


LANGUAGE_SEED_CODES = [
    "en", "hi", "bn", "as", "te", "ta", "ml", "kn", "mr", "pa", "ur",
    "ko", "ja", "zh", "th", "id", "vi", "tl",
    "fa", "ar", "he", "tr",
    "fr", "it", "es", "de", "ru", "pt", "pl", "sv", "da", "no",
    "nl", "el", "ro", "hu", "cs", "uk", "fi", "is",
    "sw", "am", "ha", "yo", "zu",
    "ms", "my", "km", "lo",
    "ne", "si"
]


def cache_basic_movies(
    db: Session,
    movies: list
):
    cached_count = 0
    skipped_count = 0
    failed_count = 0

    for movie_data in movies:
        if not movie_data.get("tmdb_id"):
            skipped_count += 1
            continue

        try:
            save_or_update_basic_movie(
                db=db,
                movie_data=movie_data
            )
            cached_count += 1
        except Exception:
            failed_count += 1
            continue

    return {
        "cached": cached_count,
        "skipped": skipped_count,
        "failed": failed_count
    }


def cache_detailed_movie(
    db: Session,
    tmdb_id: int
):
    existing_movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if (
        existing_movie
        and existing_movie.details_cached
        and existing_movie.popularity is not None
        and existing_movie.genres
        and existing_movie.directors
        and existing_movie.cast_members
    ):
        return existing_movie

    movie_data = get_movie_details(tmdb_id)

    return save_or_update_detailed_movie(
        db=db,
        movie_data=movie_data
    )


def cache_detailed_movies_limited(
    db: Session,
    movies: list,
    max_details: int
):
    detailed_count = 0
    failed_count = 0

    if max_details <= 0:
        return {
            "detailed_cached": 0,
            "failed": 0
        }

    for movie_data in movies[:max_details]:
        tmdb_id = movie_data.get("tmdb_id")

        if not tmdb_id:
            continue

        try:
            cache_detailed_movie(
                db=db,
                tmdb_id=tmdb_id
            )
            detailed_count += 1
        except Exception:
            failed_count += 1
            continue

    return {
        "detailed_cached": detailed_count,
        "failed": failed_count
    }


def get_catalog_totals(db: Session):
    movie_count = db.query(Movie).count()

    detailed_count = db.query(Movie).filter(
        Movie.details_cached == True
    ).count()

    return {
        "movies": movie_count,
        "detailed_movies": detailed_count
    }


def seed_popular_movies(
    db: Session,
    pages: int = 1,
    detail_per_page: int = 5
):
    total_basic = 0
    total_basic_failed = 0
    total_detailed = 0
    total_failed = 0
    discover_failed = 0

    for page in range(1, pages + 1):
        try:
            movies = get_popular_movies(page=page)
        except Exception:
            discover_failed += 1
            continue

        basic_result = cache_basic_movies(
            db=db,
            movies=movies
        )

        detail_result = cache_detailed_movies_limited(
            db=db,
            movies=movies,
            max_details=detail_per_page
        )

        total_basic += basic_result["cached"]
        total_basic_failed += basic_result["failed"]
        total_detailed += detail_result["detailed_cached"]
        total_failed += detail_result["failed"]

    return {
        "popular_basic_cached": total_basic,
        "popular_basic_failed": total_basic_failed,
        "popular_detailed_cached": total_detailed,
        "popular_detail_failed": total_failed,
        "popular_discover_failed": discover_failed,
        "database_totals": get_catalog_totals(db)
    }


def seed_top_rated_movies(
    db: Session,
    pages: int = 1,
    detail_per_page: int = 5
):
    total_basic = 0
    total_basic_failed = 0
    total_detailed = 0
    total_failed = 0
    discover_failed = 0

    for page in range(1, pages + 1):
        try:
            movies = get_top_rated_movies(page=page)
        except Exception:
            discover_failed += 1
            continue

        basic_result = cache_basic_movies(
            db=db,
            movies=movies
        )

        detail_result = cache_detailed_movies_limited(
            db=db,
            movies=movies,
            max_details=detail_per_page
        )

        total_basic += basic_result["cached"]
        total_basic_failed += basic_result["failed"]
        total_detailed += detail_result["detailed_cached"]
        total_failed += detail_result["failed"]

    return {
        "top_rated_basic_cached": total_basic,
        "top_rated_basic_failed": total_basic_failed,
        "top_rated_detailed_cached": total_detailed,
        "top_rated_detail_failed": total_failed,
        "top_rated_discover_failed": discover_failed,
        "database_totals": get_catalog_totals(db)
    }


def seed_single_genre(
    db: Session,
    genre_name: str,
    pages: int = 1,
    detail_limit: int = 3
):
    normalized_genre = genre_name.lower().strip()

    if normalized_genre not in GENRE_SEED_IDS:
        return {
            "error": "Invalid genre name",
            "available_genres": list(GENRE_SEED_IDS.keys())
        }

    genre_id = GENRE_SEED_IDS[normalized_genre]
    genre_movies = []
    discover_failed = 0

    for page in range(1, pages + 1):
        try:
            movies = discover_movies_by_genre(
                genre_id=genre_id,
                page=page
            )
            genre_movies.extend(movies)
        except Exception:
            discover_failed += 1
            continue

    if not genre_movies:
        return {
            "genre": normalized_genre,
            "basic_cached": 0,
            "basic_failed": 0,
            "detailed_cached": 0,
            "detail_failed": 0,
            "discover_failed": discover_failed,
            "message": "No movies cached because TMDb discover failed or returned no results.",
            "database_totals": get_catalog_totals(db)
        }

    basic_result = cache_basic_movies(
        db=db,
        movies=genre_movies
    )

    detail_result = cache_detailed_movies_limited(
        db=db,
        movies=genre_movies,
        max_details=detail_limit
    )

    return {
        "genre": normalized_genre,
        "basic_cached": basic_result["cached"],
        "basic_failed": basic_result["failed"],
        "detailed_cached": detail_result["detailed_cached"],
        "detail_failed": detail_result["failed"],
        "discover_failed": discover_failed,
        "database_totals": get_catalog_totals(db)
    }


def seed_single_language(
    db: Session,
    language_code: str,
    pages: int = 1,
    detail_limit: int = 2
):
    normalized_language = language_code.lower().strip()

    language_movies = []
    discover_failed = 0

    for page in range(1, pages + 1):
        try:
            movies = discover_movies_by_language(
                language_code=normalized_language,
                page=page
            )
            language_movies.extend(movies)
        except Exception:
            discover_failed += 1
            continue

    if not language_movies:
        return {
            "language": normalized_language,
            "basic_cached": 0,
            "basic_failed": 0,
            "detailed_cached": 0,
            "detail_failed": 0,
            "discover_failed": discover_failed,
            "message": "No movies cached because TMDb language discover failed or returned no results.",
            "database_totals": get_catalog_totals(db)
        }

    basic_result = cache_basic_movies(
        db=db,
        movies=language_movies
    )

    detail_result = cache_detailed_movies_limited(
        db=db,
        movies=language_movies,
        max_details=detail_limit
    )

    return {
        "language": normalized_language,
        "basic_cached": basic_result["cached"],
        "basic_failed": basic_result["failed"],
        "detailed_cached": detail_result["detailed_cached"],
        "detail_failed": detail_result["failed"],
        "discover_failed": discover_failed,
        "database_totals": get_catalog_totals(db)
    }


def seed_language_batch(
    db: Session,
    start: int = 0,
    batch_size: int = 5,
    pages_per_language: int = 1,
    detail_per_language: int = 1
):
    if start < 0:
        start = 0

    if batch_size < 1:
        batch_size = 5

    if batch_size > 10:
        batch_size = 10

    selected_languages = LANGUAGE_SEED_CODES[
        start:start + batch_size
    ]

    results = {}

    for language_code in selected_languages:
        try:
            result = seed_single_language(
                db=db,
                language_code=language_code,
                pages=pages_per_language,
                detail_limit=detail_per_language
            )
            results[language_code] = result
        except Exception as error:
            results[language_code] = {
                "error": str(error)
            }

    return {
        "start": start,
        "batch_size": batch_size,
        "languages_processed": selected_languages,
        "next_start": start + batch_size,
        "has_more": start + batch_size < len(LANGUAGE_SEED_CODES),
        "results": results,
        "database_totals": get_catalog_totals(db)
    }


def seed_starter_catalog(
    db: Session,
    include_languages: bool = False,
    include_genres: bool = False
):
    popular_result = seed_popular_movies(
        db=db,
        pages=1,
        detail_per_page=5
    )

    top_rated_result = seed_top_rated_movies(
        db=db,
        pages=1,
        detail_per_page=5
    )

    genre_result = None
    language_result = None

    if include_genres:
        genre_result = seed_single_genre(
            db=db,
            genre_name="drama",
            pages=1,
            detail_limit=2
        )

    if include_languages:
        language_result = seed_language_batch(
            db=db,
            start=0,
            batch_size=3,
            pages_per_language=1,
            detail_per_language=1
        )

    return {
        "message": "Starter catalog seeding completed",
        "popular": popular_result,
        "top_rated": top_rated_result,
        "genres": genre_result,
        "languages": language_result,
        "database_totals": get_catalog_totals(db)
    }


def expand_catalog_around_movie(
    db: Session,
    tmdb_id: int,
    detail_limit: int = 20
):
    source_movie = cache_detailed_movie(
        db=db,
        tmdb_id=tmdb_id
    )

    candidate_movies = []
    failed_sources = []

    try:
        similar_movies = get_similar_movies(
            tmdb_id=tmdb_id,
            page=1
        )
        candidate_movies.extend(similar_movies)
    except Exception as error:
        failed_sources.append({
            "source": "similar_movies",
            "error": str(error)
        })

    try:
        recommendation_movies = get_tmdb_movie_recommendations(
            tmdb_id=tmdb_id,
            page=1
        )
        candidate_movies.extend(recommendation_movies)
    except Exception as error:
        failed_sources.append({
            "source": "tmdb_recommendations",
            "error": str(error)
        })

    if source_movie.directors:
        for director in source_movie.directors[:2]:
            director_id = director.get("id")

            if not director_id:
                continue

            try:
                credits = get_person_movie_credits(director_id)
                candidate_movies.extend(credits.get("crew", [])[:10])
            except Exception as error:
                failed_sources.append({
                    "source": f"director_{director_id}_credits",
                    "error": str(error)
                })

    if source_movie.cast_members:
        for actor in source_movie.cast_members[:3]:
            actor_id = actor.get("id")

            if not actor_id:
                continue

            try:
                credits = get_person_movie_credits(actor_id)
                candidate_movies.extend(credits.get("cast", [])[:10])
            except Exception as error:
                failed_sources.append({
                    "source": f"actor_{actor_id}_credits",
                    "error": str(error)
                })

    if source_movie.genres:
        source_genres = [
            genre.lower()
            for genre in source_movie.genres
        ]

        for genre_name, genre_id in GENRE_SEED_IDS.items():
            readable_genre = genre_name.replace("_", " ").lower()

            if readable_genre in source_genres:
                try:
                    genre_movies = discover_movies_by_genre(
                        genre_id=genre_id,
                        page=1
                    )
                    candidate_movies.extend(genre_movies[:10])
                except Exception as error:
                    failed_sources.append({
                        "source": f"genre_{genre_name}",
                        "error": str(error)
                    })

    if source_movie.language:
        try:
            language_movies = discover_movies_by_language(
                language_code=source_movie.language,
                page=1
            )
            candidate_movies.extend(language_movies[:10])
        except Exception as error:
            failed_sources.append({
                "source": f"language_{source_movie.language}",
                "error": str(error)
            })

    unique_candidates = {}

    for movie_data in candidate_movies:
        candidate_tmdb_id = movie_data.get("tmdb_id")

        if not candidate_tmdb_id:
            continue

        if candidate_tmdb_id == tmdb_id:
            continue

        unique_candidates[candidate_tmdb_id] = movie_data

    candidate_list = list(unique_candidates.values())

    basic_result = cache_basic_movies(
        db=db,
        movies=candidate_list
    )

    detail_result = cache_detailed_movies_limited(
        db=db,
        movies=candidate_list,
        max_details=detail_limit
    )

    return {
        "message": "Catalog expansion completed",
        "source_movie": {
            "id": source_movie.id,
            "tmdb_id": source_movie.tmdb_id,
            "title": source_movie.title
        },
        "candidates_found": len(candidate_list),
        "basic_cached": basic_result["cached"],
        "basic_failed": basic_result["failed"],
        "detailed_cached": detail_result["detailed_cached"],
        "detail_failed": detail_result["failed"],
        "failed_sources": failed_sources,
        "database_totals": get_catalog_totals(db)
    }