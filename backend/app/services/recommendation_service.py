import re
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.user import User
from app.models.rating import Rating
from app.models.watchlist import Watchlist
from app.models.follow import Follow

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


def get_user_source_movies(
    db: Session,
    current_user: User
):
    source_movies = []

    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.rating >= 7
    ).all()

    for rating in ratings:
        if rating.movie and rating.movie.details_cached:
            source_movies.append({
                "movie": rating.movie,
                "source_type": "high_rating",
                "source_weight": rating.rating / 10
            })

    watchlist_items = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.status.in_(["watch_later", "watching", "completed"])
    ).all()

    for item in watchlist_items:
        if item.movie and item.movie.details_cached:
            source_movies.append({
                "movie": item.movie,
                "source_type": "watchlist",
                "source_weight": 0.75
            })

    unique_sources = {}

    for item in source_movies:
        movie_id = item["movie"].id

        if movie_id not in unique_sources:
            unique_sources[movie_id] = item
        else:
            unique_sources[movie_id]["source_weight"] = max(
                unique_sources[movie_id]["source_weight"],
                item["source_weight"]
            )

    return list(unique_sources.values())


def get_user_interacted_movie_ids(
    db: Session,
    current_user: User
):
    movie_ids = set()

    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    for rating in ratings:
        movie_ids.add(rating.movie_id)

    watchlist_items = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).all()

    for item in watchlist_items:
        movie_ids.add(item.movie_id)

    return movie_ids


def get_user_followed_people_ids(
    db: Session,
    current_user: User,
    follow_type: str
):
    follows = db.query(Follow).filter(
        Follow.user_id == current_user.id,
        Follow.type == follow_type
    ).all()

    return {
        follow.person_id
        for follow in follows
    }


def calculate_follow_boost(
    candidate_movie: Movie,
    followed_directors,
    followed_actors
):
    candidate_directors = extract_people_ids(
        candidate_movie.directors
    )
    candidate_actors = extract_people_ids(
        candidate_movie.cast_members
    )

    director_boost = 0.0
    actor_boost = 0.0

    if candidate_directors.intersection(followed_directors):
        director_boost = 0.15

    if candidate_actors.intersection(followed_actors):
        actor_boost = 0.10

    return {
        "director_follow_boost": director_boost,
        "actor_follow_boost": actor_boost,
        "total_follow_boost": director_boost + actor_boost
    }


def get_personalized_recommendations(
    db: Session,
    current_user: User,
    limit: int = 10
):
    if limit < 1:
        limit = 10

    if limit > 50:
        limit = 50

    source_movies = get_user_source_movies(
        db=db,
        current_user=current_user
    )

    if not source_movies:
        return {
            "message": "Rate or add a few movies to your watchlist to get personalized recommendations.",
            "returned": 0,
            "recommendations": []
        }

    interacted_movie_ids = get_user_interacted_movie_ids(
        db=db,
        current_user=current_user
    )

    followed_directors = get_user_followed_people_ids(
        db=db,
        current_user=current_user,
        follow_type="director"
    )

    followed_actors = get_user_followed_people_ids(
        db=db,
        current_user=current_user,
        follow_type="actor"
    )

    candidate_movies = db.query(Movie).filter(
        Movie.details_cached == True,
        ~Movie.id.in_(interacted_movie_ids)
    ).all()

    if not candidate_movies:
        return {
            "returned": 0,
            "recommendations": []
        }

    max_popularity = max(
        [
            movie.popularity or 0
            for movie in candidate_movies
        ]
    )

    scored_candidates = {}

    for candidate in candidate_movies:
        best_score = 0.0
        best_breakdown = None
        best_source = None

        for source in source_movies:
            similarity_data = calculate_movie_similarity(
                source_movie=source["movie"],
                candidate_movie=candidate,
                max_popularity=max_popularity
            )

            if not similarity_data["valid_match"]:
                continue

            weighted_score = (
                similarity_data["final_score"]
                * source["source_weight"]
            )

            if weighted_score > best_score:
                best_score = weighted_score
                best_breakdown = similarity_data["score_breakdown"]
                best_source = source

        follow_boost = calculate_follow_boost(
            candidate_movie=candidate,
            followed_directors=followed_directors,
            followed_actors=followed_actors
        )

        final_score = best_score + follow_boost["total_follow_boost"]

        if final_score <= 0:
            continue

        scored_candidates[candidate.id] = {
            "movie": movie_to_basic_response(candidate),
            "personalized_score": round(final_score * 100, 2),
            "score_breakdown": best_breakdown,
            "follow_boost": follow_boost,
            "based_on": {
                "movie_title": best_source["movie"].title if best_source else None,
                "source_type": best_source["source_type"] if best_source else "follow_boost"
            },
            "reason": "Recommended from your ratings, watchlist, and followed creators."
        }

    results = list(scored_candidates.values())

    results.sort(
        key=lambda item: item["personalized_score"],
        reverse=True
    )

    return {
        "returned": min(limit, len(results)),
        "recommendations": results[:limit]
    }


def get_personalized_hidden_gems(
    db: Session,
    current_user: User,
    limit: int = 10
):
    personalized = get_personalized_recommendations(
        db=db,
        current_user=current_user,
        limit=50
    )

    recommendations = personalized.get("recommendations", [])

    hidden_gems = []

    if not recommendations:
        return {
            "returned": 0,
            "hidden_gems": []
        }

    max_popularity = max(
        [
            item["movie"].get("popularity") or 0
            for item in recommendations
        ]
    )

    for item in recommendations:
        movie = item["movie"]

        popularity = movie.get("popularity") or 0
        rating = movie.get("rating") or 0

        popularity_score = normalize_popularity(
            popularity,
            max_popularity
        )

        rating_score = normalize_rating(rating)

        hidden_gem_score = (
            (item["personalized_score"] / 100) * HIDDEN_GEM_WEIGHTS["similarity"]
            + rating_score * HIDDEN_GEM_WEIGHTS["rating"]
            - popularity_score * HIDDEN_GEM_WEIGHTS["popularity_penalty"]
        )

        if hidden_gem_score <= 0:
            continue

        hidden_gems.append({
            "movie": movie,
            "hidden_gem_score": round(hidden_gem_score * 100, 2),
            "personalized_score": item["personalized_score"],
            "rating_score": round(rating_score * 100, 2),
            "popularity_penalty": round(popularity_score * 100, 2),
            "reason": "A personalized hidden gem based on your taste and lower mainstream popularity."
        })

    hidden_gems.sort(
        key=lambda item: item["hidden_gem_score"],
        reverse=True
    )

    return {
        "returned": min(limit, len(hidden_gems)),
        "hidden_gems": hidden_gems[:limit]
    }


def get_recommendations_from_followed_directors(
    db: Session,
    current_user: User,
    limit: int = 10
):
    followed_directors = get_user_followed_people_ids(
        db=db,
        current_user=current_user,
        follow_type="director"
    )

    if not followed_directors:
        return {
            "returned": 0,
            "recommendations": []
        }

    interacted_movie_ids = get_user_interacted_movie_ids(
        db=db,
        current_user=current_user
    )

    movies = db.query(Movie).filter(
        Movie.details_cached == True,
        ~Movie.id.in_(interacted_movie_ids)
    ).all()

    results = []

    for movie in movies:
        director_ids = extract_people_ids(movie.directors)

        if director_ids.intersection(followed_directors):
            results.append({
                "movie": movie_to_basic_response(movie),
                "reason": "Recommended because you follow this movie's director."
            })

    results.sort(
        key=lambda item: item["movie"].get("rating") or 0,
        reverse=True
    )

    return {
        "returned": min(limit, len(results)),
        "recommendations": results[:limit]
    }


def get_recommendations_from_followed_actors(
    db: Session,
    current_user: User,
    limit: int = 10
):
    followed_actors = get_user_followed_people_ids(
        db=db,
        current_user=current_user,
        follow_type="actor"
    )

    if not followed_actors:
        return {
            "returned": 0,
            "recommendations": []
        }

    interacted_movie_ids = get_user_interacted_movie_ids(
        db=db,
        current_user=current_user
    )

    movies = db.query(Movie).filter(
        Movie.details_cached == True,
        ~Movie.id.in_(interacted_movie_ids)
    ).all()

    results = []

    for movie in movies:
        actor_ids = extract_people_ids(movie.cast_members)

        if actor_ids.intersection(followed_actors):
            results.append({
                "movie": movie_to_basic_response(movie),
                "reason": "Recommended because you follow one of this movie's actors."
            })

    results.sort(
        key=lambda item: item["movie"].get("rating") or 0,
        reverse=True
    )

    return {
        "returned": min(limit, len(results)),
        "recommendations": results[:limit]
    }