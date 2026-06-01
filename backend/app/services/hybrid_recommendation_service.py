from sqlalchemy.orm import Session

from app.services.recommendation_service import get_movie_recommendations
from app.services.ml_recommendation_service import get_ml_similar_movies

try:
    from app.services.recommendation_quality_service import build_similar_taste_results
except Exception:
    build_similar_taste_results = None


RULE_WEIGHT = 0.35
ML_WEIGHT = 0.45
RATING_WEIGHT = 0.10
POSTER_BONUS = 0.03
MULTI_SOURCE_BONUS = 0.07


def extract_movie_list(raw_data):
    if not raw_data:
        return []

    if isinstance(raw_data, list):
        return [item for item in raw_data if isinstance(item, dict)]

    if isinstance(raw_data, dict):
        possible_keys = [
            "results",
            "recommendations",
            "hidden_gems",
            "movies",
            "data",
            "items"
        ]

        for key in possible_keys:
            value = raw_data.get(key)

            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]

            if isinstance(value, dict):
                nested_movies = extract_movie_list(value)

                if nested_movies:
                    return nested_movies

    return []


def normalize_score(value, max_value=1):
    if value is None:
        return 0

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return 0

    if max_value <= 0:
        return 0

    return max(0, min(numeric_value / max_value, 1))


def safe_float(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def get_movie_id(movie):
    if not isinstance(movie, dict):
        return None

    return movie.get("tmdb_id") or movie.get("movie_id") or movie.get("id")


def get_rule_score(movie):
    if not isinstance(movie, dict):
        return 0

    recommendation_score = movie.get("recommendation_score")

    if recommendation_score is not None:
        return normalize_score(recommendation_score, 1)

    direct_score_keys = [
        "final_score",
        "total_score",
        "score",
        "similarity_score",
        "hybrid_score"
    ]

    for key in direct_score_keys:
        if movie.get(key) is not None:
            return normalize_score(movie.get(key), 1)

    score_breakdown = movie.get("score_breakdown") or {}

    if isinstance(score_breakdown, dict):
        genre_score = safe_float(score_breakdown.get("genre_score"))
        description_score = safe_float(score_breakdown.get("description_score"))
        director_score = safe_float(score_breakdown.get("director_score"))
        actor_score = safe_float(score_breakdown.get("actor_score"))
        language_score = safe_float(score_breakdown.get("language_score"))
        rating_score = safe_float(score_breakdown.get("rating_score"))
        popularity_score = safe_float(score_breakdown.get("popularity_score"))

        calculated_score = (
            (genre_score * 0.30)
            + (description_score * 0.25)
            + (director_score * 0.18)
            + (actor_score * 0.12)
            + (language_score * 0.05)
            + (rating_score * 0.07)
            + (popularity_score * 0.03)
        )

        return max(0, min(calculated_score, 1))

    return 0


def get_rating_score(movie):
    if not isinstance(movie, dict):
        return 0

    return normalize_score(movie.get("rating"), 10)


def has_good_movie_data(movie):
    if not isinstance(movie, dict):
        return False

    if not movie.get("tmdb_id"):
        return False

    if not movie.get("title"):
        return False

    return True


def merge_movie(candidate_map, movie, source):
    if not has_good_movie_data(movie):
        return

    movie_id = get_movie_id(movie)

    if movie_id is None:
        return

    movie_id = int(movie_id)

    if movie_id not in candidate_map:
        candidate_map[movie_id] = {
            "tmdb_id": movie_id,
            "title": movie.get("title"),
            "poster_url": movie.get("poster_url"),
            "release_date": movie.get("release_date"),
            "language": movie.get("language"),
            "rating": movie.get("rating"),
            "popularity": movie.get("popularity"),
            "rule_score": 0,
            "ml_score": 0,
            "rating_score": get_rating_score(movie),
            "sources": set(),
            "reason": movie.get("reason")
        }

    existing = candidate_map[movie_id]

    existing["title"] = existing.get("title") or movie.get("title")
    existing["poster_url"] = existing.get("poster_url") or movie.get("poster_url")
    existing["release_date"] = existing.get("release_date") or movie.get("release_date")
    existing["language"] = existing.get("language") or movie.get("language")
    existing["reason"] = existing.get("reason") or movie.get("reason")

    if existing.get("rating") is None:
        existing["rating"] = movie.get("rating")

    if existing.get("popularity") is None:
        existing["popularity"] = movie.get("popularity")

    existing["rating_score"] = max(
        existing.get("rating_score", 0),
        get_rating_score(movie)
    )

    existing["sources"].add(source)

    if source == "rule":
        existing["rule_score"] = max(
            existing.get("rule_score", 0),
            get_rule_score(movie)
        )

    if source == "ml":
        existing["ml_score"] = max(
            existing.get("ml_score", 0),
            safe_float(movie.get("ml_similarity_score"))
        )


def get_rule_based_candidates(db: Session, tmdb_id: int, limit: int):
    raw_rule_results = get_movie_recommendations(
        db=db,
        tmdb_id=tmdb_id,
        limit=limit
    )

    rule_results = extract_movie_list(raw_rule_results)

    if build_similar_taste_results:
        try:
            polished_results = build_similar_taste_results(
                raw_movies=raw_rule_results,
                limit=limit
            )

            polished_results = extract_movie_list(polished_results)

            if polished_results:
                return polished_results
        except Exception as error:
            print(f"Rule result polishing failed for {tmdb_id}: {error}")

    return rule_results


def get_ml_candidates(tmdb_id: int, limit: int):
    ml_response = get_ml_similar_movies(
        tmdb_id=tmdb_id,
        limit=limit
    )

    return extract_movie_list(ml_response)


def calculate_hybrid_score(movie):
    rule_score = movie.get("rule_score", 0)
    ml_score = movie.get("ml_score", 0)
    rating_score = movie.get("rating_score", 0)

    sources = movie.get("sources", set())

    poster_bonus = POSTER_BONUS if movie.get("poster_url") else 0

    has_ml = "ml" in sources
    has_rule = "rule" in sources

    strong_ml_signal = ml_score >= 0.08
    decent_ml_signal = ml_score >= 0.06

    if has_ml and has_rule:
        if strong_ml_signal:
            final_score = (
                (ml_score * 0.78)
                + (rule_score * 0.12)
                + (rating_score * 0.06)
                + poster_bonus
                + 0.04
            )
        elif decent_ml_signal:
            final_score = (
                (ml_score * 0.70)
                + (rule_score * 0.08)
                + (rating_score * 0.05)
                + poster_bonus
            )
        else:
            final_score = (
                (ml_score * 0.80)
                + (rating_score * 0.05)
                + poster_bonus
            )

    elif has_ml:
        final_score = (
            (ml_score * 0.85)
            + (rating_score * 0.08)
            + poster_bonus
        )

    else:
        if rule_score < 0.35:
            final_score = 0
        else:
            final_score = (
                (rule_score * 0.20)
                + (rating_score * 0.05)
                + poster_bonus
            )

    return round(final_score, 4)


def get_source_priority(movie):
    sources = movie.get("sources", [])

    if "ml" in sources and "rule" in sources:
        return 3

    if "ml" in sources:
        return 2

    if "rule" in sources:
        return 1

    return 0


def build_hybrid_movie_recommendations(
    db: Session,
    tmdb_id: int,
    limit: int = 10
):
    candidate_map = {}

    expanded_limit = max(limit * 6, 60)

    rule_error = None
    ml_error = None

    try:
        rule_results = get_rule_based_candidates(
            db=db,
            tmdb_id=tmdb_id,
            limit=expanded_limit
        )
    except Exception as error:
        print(f"Rule-based recommendation failed for {tmdb_id}: {error}")
        rule_error = str(error)
        rule_results = []

    for movie in rule_results:
        merge_movie(candidate_map, movie, "rule")

    try:
        ml_results = get_ml_candidates(
            tmdb_id=tmdb_id,
            limit=expanded_limit
        )
    except Exception as error:
        print(f"ML recommendation failed for {tmdb_id}: {error}")
        ml_error = str(error)
        ml_results = []

    for movie in ml_results:
        merge_movie(candidate_map, movie, "ml")

    hybrid_results = []

    for movie in candidate_map.values():
        movie["hybrid_score"] = calculate_hybrid_score(movie)
        movie["rule_score"] = round(movie.get("rule_score", 0), 4)
        movie["ml_score"] = round(movie.get("ml_score", 0), 4)
        movie["rating_score"] = round(movie.get("rating_score", 0), 4)
        movie["sources"] = sorted(list(movie.get("sources", [])))
        movie["source_priority"] = get_source_priority(movie)

        hybrid_results.append(movie)

    hybrid_results.sort(
    key=lambda movie: (
        movie.get("hybrid_score", 0),
        movie.get("source_priority", 0),
        movie.get("rating_score", 0),
        movie.get("popularity") or 0
    ),
    reverse=True
)

    source_summary = {
        "rule_candidates": len(rule_results),
        "ml_candidates": len(ml_results),
        "merged_candidates": len(hybrid_results),
        "multi_source_candidates": len(
            [
                movie for movie in hybrid_results
                if "ml" in movie.get("sources", []) and "rule" in movie.get("sources", [])
            ]
        ),
        "rule_only_candidates": len(
            [
                movie for movie in hybrid_results
                if movie.get("sources") == ["rule"]
            ]
        ),
        "ml_only_candidates": len(
            [
                movie for movie in hybrid_results
                if movie.get("sources") == ["ml"]
            ]
        )
    }

    response = {
        "source_tmdb_id": tmdb_id,
        "model": "hybrid_rule_based_plus_tfidf",
        "weights": {
            "rule_score": RULE_WEIGHT,
            "ml_score": ML_WEIGHT,
            "rating_score": RATING_WEIGHT,
            "poster_bonus": POSTER_BONUS,
            "multi_source_bonus": MULTI_SOURCE_BONUS
        },
        "source_summary": source_summary,
        "candidate_count": len(hybrid_results),
        "results": hybrid_results[:limit]
    }

    if rule_error or ml_error:
        response["errors"] = {
            "rule_error": rule_error,
            "ml_error": ml_error
        }

    return response