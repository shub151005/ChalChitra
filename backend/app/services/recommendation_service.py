import re
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.constants.weights import (
    RECOMMENDATION_WEIGHTS,
    HIDDEN_GEM_WEIGHTS
)
from app.services.movie_cache_service import (
    get_movie_by_tmdb_id,
    movie_to_basic_response
)


STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for",
    "with", "as", "by", "at", "from", "into", "about", "is", "are", "was",
    "were", "be", "been", "being", "that", "this", "it", "its", "their",
    "his", "her", "they", "them", "he", "she", "we", "you", "i", "who",
    "when", "where", "why", "how", "what", "which", "has", "have", "had",
    "will", "would", "could", "should", "can", "may", "might", "not",
    "all", "new", "one", "two", "life", "world"
}


def tokenize_text(text: str | None):
    if not text:
        return set()

    words = re.findall(r"[a-zA-Z]+", text.lower())

    return {
        word
        for word in words
        if word not in STOPWORDS and len(word) > 2
    }


def jaccard_similarity(set_a, set_b):
    if not set_a or not set_b:
        return 0.0

    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))

    if union == 0:
        return 0.0

    return intersection / union


def normalize_rating(rating):
    if rating is None:
        return 0.0

    return min(float(rating) / 10.0, 1.0)


def normalize_popularity(popularity, max_popularity):
    if popularity is None or max_popularity <= 0:
        return 0.0

    return min(float(popularity) / max_popularity, 1.0)


def extract_people_ids(people_list):
    if not people_list:
        return set()

    return {
        person.get("id")
        for person in people_list
        if isinstance(person, dict) and person.get("id") is not None
    }


def extract_genres(movie: Movie):
    if not movie.genres:
        return set()

    return {
        genre.lower().strip()
        for genre in movie.genres
        if isinstance(genre, str)
    }


def has_real_taste_connection(score_breakdown):
    return (
        score_breakdown["genre_score"] > 0
        or score_breakdown["description_score"] >= 0.03
        or score_breakdown["director_score"] > 0
        or score_breakdown["actor_score"] > 0
    )


def calculate_movie_similarity(
    source_movie: Movie,
    candidate_movie: Movie,
    max_popularity: float
):
    source_genres = extract_genres(source_movie)
    candidate_genres = extract_genres(candidate_movie)

    genre_score = jaccard_similarity(
        source_genres,
        candidate_genres
    )

    source_description_tokens = tokenize_text(
        source_movie.description
    )
    candidate_description_tokens = tokenize_text(
        candidate_movie.description
    )

    description_score = jaccard_similarity(
        source_description_tokens,
        candidate_description_tokens
    )

    source_directors = extract_people_ids(
        source_movie.directors
    )
    candidate_directors = extract_people_ids(
        candidate_movie.directors
    )

    director_score = jaccard_similarity(
        source_directors,
        candidate_directors
    )

    source_actors = extract_people_ids(
        source_movie.cast_members
    )
    candidate_actors = extract_people_ids(
        candidate_movie.cast_members
    )

    actor_score = jaccard_similarity(
        source_actors,
        candidate_actors
    )

    language_score = 1.0 if (
        source_movie.language
        and candidate_movie.language
        and source_movie.language == candidate_movie.language
    ) else 0.0

    rating_score = normalize_rating(
        candidate_movie.rating
    )

    popularity_score = normalize_popularity(
        candidate_movie.popularity,
        max_popularity
    )

    score_breakdown = {
        "genre_score": round(genre_score, 4),
        "description_score": round(description_score, 4),
        "director_score": round(director_score, 4),
        "actor_score": round(actor_score, 4),
        "language_score": round(language_score, 4),
        "rating_score": round(rating_score, 4),
        "popularity_score": round(popularity_score, 4)
    }

    if not has_real_taste_connection(score_breakdown):
        return {
            "final_score": 0.0,
            "score_breakdown": score_breakdown,
            "valid_match": False
        }

    final_score = (
        genre_score * RECOMMENDATION_WEIGHTS["genre"]
        + description_score * RECOMMENDATION_WEIGHTS["description"]
        + director_score * RECOMMENDATION_WEIGHTS["director"]
        + actor_score * RECOMMENDATION_WEIGHTS["actor"]
        + language_score * RECOMMENDATION_WEIGHTS["language"]
        + rating_score * RECOMMENDATION_WEIGHTS["rating"]
        + popularity_score * RECOMMENDATION_WEIGHTS["popularity"]
    )

    return {
        "final_score": round(final_score, 4),
        "score_breakdown": score_breakdown,
        "valid_match": True
    }


def build_recommendation_reason(score_breakdown):
    reasons = []

    if score_breakdown["genre_score"] > 0:
        reasons.append("similar genres")

    if score_breakdown["description_score"] >= 0.03:
        reasons.append("similar story themes")

    if score_breakdown["director_score"] > 0:
        reasons.append("same director")

    if score_breakdown["actor_score"] > 0:
        reasons.append("shared cast")

    if score_breakdown["language_score"] > 0:
        reasons.append("same original language as a minor supporting signal")

    if not reasons:
        reasons.append("overall taste profile match")

    return "Recommended because of " + ", ".join(reasons) + "."


def get_movie_recommendations(
    db: Session,
    tmdb_id: int,
    limit: int = 10
):
    if limit < 1:
        limit = 10

    if limit > 50:
        limit = 50

    source_movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if not source_movie:
        raise HTTPException(
            status_code=404,
            detail="Source movie not found in database. Search or open movie details first."
        )

    candidate_movies = db.query(Movie).filter(
        Movie.tmdb_id != tmdb_id,
        Movie.details_cached == True
    ).all()

    if not candidate_movies:
        return {
            "source_movie": movie_to_basic_response(source_movie),
            "total_candidates": 0,
            "returned": 0,
            "recommendations": []
        }

    max_popularity = max(
        [
            movie.popularity or 0
            for movie in candidate_movies
        ]
    )

    scored_movies = []

    for candidate in candidate_movies:
        similarity_data = calculate_movie_similarity(
            source_movie=source_movie,
            candidate_movie=candidate,
            max_popularity=max_popularity
        )

        if not similarity_data["valid_match"]:
            continue

        if similarity_data["final_score"] <= 0:
            continue

        movie_response = movie_to_basic_response(candidate)

        scored_movies.append({
            "movie": movie_response,
            "match_score": round(
                similarity_data["final_score"] * 100,
                2
            ),
            "score_breakdown": similarity_data["score_breakdown"],
            "reason": build_recommendation_reason(
                similarity_data["score_breakdown"]
            )
        })

    scored_movies.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return {
        "source_movie": movie_to_basic_response(source_movie),
        "total_candidates": len(candidate_movies),
        "returned": min(limit, len(scored_movies)),
        "recommendations": scored_movies[:limit]
    }


def get_hidden_gems_for_movie(
    db: Session,
    tmdb_id: int,
    limit: int = 10
):
    if limit < 1:
        limit = 10

    if limit > 50:
        limit = 50

    source_movie = get_movie_by_tmdb_id(
        db=db,
        tmdb_id=tmdb_id
    )

    if not source_movie:
        raise HTTPException(
            status_code=404,
            detail="Source movie not found in database. Search or open movie details first."
        )

    candidate_movies = db.query(Movie).filter(
        Movie.tmdb_id != tmdb_id,
        Movie.details_cached == True
    ).all()

    if not candidate_movies:
        return {
            "source_movie": movie_to_basic_response(source_movie),
            "returned": 0,
            "hidden_gems": []
        }

    max_popularity = max(
        [
            movie.popularity or 0
            for movie in candidate_movies
        ]
    )

    hidden_gems = []

    for candidate in candidate_movies:
        similarity_data = calculate_movie_similarity(
            source_movie=source_movie,
            candidate_movie=candidate,
            max_popularity=max_popularity
        )

        if not similarity_data["valid_match"]:
            continue

        similarity_score = similarity_data["final_score"]
        rating_score = normalize_rating(candidate.rating)
        popularity_score = normalize_popularity(
            candidate.popularity,
            max_popularity
        )

        hidden_gem_score = (
            similarity_score * HIDDEN_GEM_WEIGHTS["similarity"]
            + rating_score * HIDDEN_GEM_WEIGHTS["rating"]
            - popularity_score * HIDDEN_GEM_WEIGHTS["popularity_penalty"]
        )

        if hidden_gem_score <= 0:
            continue

        movie_response = movie_to_basic_response(candidate)

        hidden_gems.append({
            "movie": movie_response,
            "hidden_gem_score": round(hidden_gem_score * 100, 2),
            "match_score": round(similarity_score * 100, 2),
            "rating_score": round(rating_score * 100, 2),
            "popularity_penalty": round(popularity_score * 100, 2),
            "score_breakdown": similarity_data["score_breakdown"],
            "reason": "A less obvious pick with real taste similarity and strong quality signals."
        })

    hidden_gems.sort(
        key=lambda item: item["hidden_gem_score"],
        reverse=True
    )

    return {
        "source_movie": movie_to_basic_response(source_movie),
        "returned": min(limit, len(hidden_gems)),
        "hidden_gems": hidden_gems[:limit]
    }