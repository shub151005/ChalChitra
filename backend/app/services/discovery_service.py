from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.services.movie_cache_service import movie_to_basic_response


GENRE_ALIASES = {
    "romance": ["romance"],
    "drama": ["drama"],
    "thriller": ["thriller"],
    "horror": ["horror"],
    "crime": ["crime"],
    "action": ["action"],
    "comedy": ["comedy"],
    "science-fiction": ["science fiction", "sci-fi", "scifi"],
    "sci-fi": ["science fiction", "sci-fi", "scifi"],
    "animation": ["animation"],
    "documentary": ["documentary"],
    "mystery": ["mystery"],
    "fantasy": ["fantasy"],
    "adventure": ["adventure"],
    "family": ["family"],
    "history": ["history"],
    "war": ["war"],
    "music": ["music"]
}


def paginate_items(items, page: int = 1, limit: int = 20):
    safe_page = max(page, 1)
    safe_limit = max(1, min(limit, 40))
    start = (safe_page - 1) * safe_limit
    end = start + safe_limit

    return items[start:end]


def movies_to_response(movies):
    return [movie_to_basic_response(movie) for movie in movies]


def normalize_json_names(value):
    if not value:
        return []

    names = []

    if isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                names.append(item.strip().lower())
            elif isinstance(item, dict):
                name = (
                    item.get("name") or
                    item.get("title") or
                    item.get("genre") or
                    item.get("value")
                )

                if name:
                    names.append(str(name).strip().lower())

    elif isinstance(value, str):
        names.append(value.strip().lower())

    return [name for name in names if name]


def movie_has_genre(movie, genre_name: str):
    normalized_genre = genre_name.strip().lower()
    possible_names = GENRE_ALIASES.get(
        normalized_genre,
        [genre_name.replace("-", " ").strip().lower()]
    )

    movie_genres = normalize_json_names(movie.genres)

    for genre in movie_genres:
        for possible_name in possible_names:
            if possible_name in genre or genre in possible_name:
                return True

    return False


def get_base_cached_movies(db: Session, max_items: int = 1200):
    return (
        db.query(Movie)
        .filter(Movie.poster_url.isnot(None))
        .filter(Movie.title.isnot(None))
        .order_by(Movie.rating.desc().nullslast(), Movie.popularity.desc().nullslast())
        .limit(max_items)
        .all()
    )


def get_award_winning_acclaimed_movies(
    db: Session,
    page: int = 1,
    limit: int = 20
):
    query = (
        db.query(Movie)
        .filter(Movie.poster_url.isnot(None))
        .filter(Movie.rating.isnot(None))
        .filter(Movie.rating >= 7.7)
        .order_by(Movie.rating.desc(), Movie.popularity.desc().nullslast())
    )

    movies = query.offset((max(page, 1) - 1) * limit).limit(limit).all()

    return {
        "results": movies_to_response(movies),
        "page": page,
        "section": "award_winning_acclaimed",
        "title": "Award-Winning & Acclaimed",
        "description": "Highly rated and critically acclaimed cinema from the cached ChalChitra catalog."
    }


def get_festival_favorite_movies(
    db: Session,
    page: int = 1,
    limit: int = 20
):
    query = (
        db.query(Movie)
        .filter(Movie.poster_url.isnot(None))
        .filter(Movie.rating.isnot(None))
        .filter(Movie.rating >= 7.0)
        .filter(Movie.popularity.isnot(None))
        .filter(Movie.popularity <= 15)
        .order_by(Movie.rating.desc(), Movie.popularity.asc())
    )

    movies = query.offset((max(page, 1) - 1) * limit).limit(limit).all()

    return {
        "results": movies_to_response(movies),
        "page": page,
        "section": "festival_favorites",
        "title": "Festival & Art-House Favorites",
        "description": "Lower-mainstream, highly rated films useful for global cinema discovery."
    }


def get_global_hidden_gem_movies(
    db: Session,
    page: int = 1,
    limit: int = 20
):
    query = (
        db.query(Movie)
        .filter(Movie.poster_url.isnot(None))
        .filter(Movie.rating.isnot(None))
        .filter(Movie.rating >= 6.8)
        .filter(Movie.popularity.isnot(None))
        .filter(Movie.popularity <= 8)
        .order_by(Movie.rating.desc(), Movie.popularity.asc())
    )

    movies = query.offset((max(page, 1) - 1) * limit).limit(limit).all()

    return {
        "results": movies_to_response(movies),
        "page": page,
        "section": "global_hidden_gems",
        "title": "Global Hidden Gems",
        "description": "Less obvious films with strong ratings and lower mainstream popularity."
    }


def get_movies_by_genre_name(
    db: Session,
    genre_name: str,
    page: int = 1,
    limit: int = 20
):
    cached_movies = get_base_cached_movies(db=db)

    matching_movies = [
        movie for movie in cached_movies
        if movie_has_genre(movie, genre_name)
    ]

    matching_movies.sort(
        key=lambda movie: (
            movie.rating or 0,
            movie.popularity or 0
        ),
        reverse=True
    )

    paginated_movies = paginate_items(
        matching_movies,
        page=page,
        limit=limit
    )

    clean_title = genre_name.replace("-", " ").title()

    return {
        "results": movies_to_response(paginated_movies),
        "page": page,
        "section": f"genre_{genre_name}",
        "title": f"{clean_title} Cinema",
        "description": f"Cached ChalChitra movies matched with the {clean_title} genre."
    }