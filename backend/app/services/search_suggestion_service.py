from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.models.movie import Movie


def clean_text(value):
    if not value:
        return ""

    return str(value).strip().lower()


def movie_to_suggestion(movie, score):
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "original_title": movie.original_title,
        "poster_url": movie.poster_url,
        "release_date": movie.release_date,
        "language": movie.language,
        "rating": movie.rating,
        "popularity": movie.popularity,
        "match_score": round(score, 2)
    }


def calculate_match_score(query, movie):
    cleaned_query = clean_text(query)
    title = clean_text(movie.title)
    original_title = clean_text(movie.original_title)

    title_score = fuzz.WRatio(cleaned_query, title)
    original_title_score = fuzz.WRatio(cleaned_query, original_title)

    partial_title_score = fuzz.partial_ratio(cleaned_query, title)
    token_score = fuzz.token_set_ratio(cleaned_query, title)

    best_score = max(
        title_score,
        original_title_score,
        partial_title_score,
        token_score
    )

    if title.startswith(cleaned_query):
        best_score += 8

    if original_title.startswith(cleaned_query):
        best_score += 6

    return min(best_score, 100)


def get_local_movie_suggestions(db: Session, query: str, limit: int = 5):
    cleaned_query = clean_text(query)

    if len(cleaned_query) < 2:
        return []

    movies = (
        db.query(Movie)
        .filter(Movie.title.isnot(None))
        .limit(600)
        .all()
    )

    scored_movies = []

    for movie in movies:
        score = calculate_match_score(cleaned_query, movie)

        if score >= 45:
            scored_movies.append((movie, score))

    scored_movies.sort(
        key=lambda item: (
            item[1],
            item[0].popularity or 0,
            item[0].rating or 0
        ),
        reverse=True
    )

    selected_movies = []
    seen_tmdb_ids = set()

    for movie, score in scored_movies:
        if movie.tmdb_id in seen_tmdb_ids:
            continue

        seen_tmdb_ids.add(movie.tmdb_id)
        selected_movies.append(movie_to_suggestion(movie, score))

        if len(selected_movies) >= limit:
            break

    return selected_movies