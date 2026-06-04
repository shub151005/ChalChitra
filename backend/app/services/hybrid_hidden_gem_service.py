from sqlalchemy.orm import Session

from app.services.hybrid_recommendation_service import (
    build_hybrid_movie_recommendations
)


def safe_float(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def get_popularity_penalty(popularity):
    popularity_value = safe_float(popularity)

    if popularity_value <= 0:
        return 0.02

    if popularity_value <= 5:
        return 0

    if popularity_value <= 10:
        return 0.03

    if popularity_value <= 20:
        return 0.08

    if popularity_value <= 40:
        return 0.16

    return 0.28


def is_valid_hidden_gem(movie):
    if not isinstance(movie, dict):
        return False

    if not movie.get("tmdb_id"):
        return False

    if not movie.get("title"):
        return False

    if not movie.get("poster_url"):
        return False

    rating = safe_float(movie.get("rating"))
    popularity = safe_float(movie.get("popularity"))
    ml_score = safe_float(movie.get("ml_score"))
    hybrid_score = safe_float(movie.get("hybrid_score"))

    if rating < 6.4:
        return False

    if popularity > 45:
        return False

    if ml_score < 0.035 and hybrid_score < 0.12:
        return False

    return True


def calculate_hidden_gem_score(movie):
    hybrid_score = safe_float(movie.get("hybrid_score"))
    ml_score = safe_float(movie.get("ml_score"))
    rule_score = safe_float(movie.get("rule_score"))
    rating_score = safe_float(movie.get("rating_score"))
    popularity = safe_float(movie.get("popularity"))

    popularity_penalty = get_popularity_penalty(popularity)

    source_bonus = 0
    sources = movie.get("sources") or []

    if "ml" in sources and "rule" in sources:
        source_bonus = 0.04
    elif "ml" in sources:
        source_bonus = 0.02

    hidden_gem_score = (
        (hybrid_score * 0.45)
        + (ml_score * 0.35)
        + (rule_score * 0.08)
        + (rating_score * 0.12)
        + source_bonus
        - popularity_penalty
    )

    return round(max(hidden_gem_score, 0), 4)


def build_hybrid_hidden_gems_for_movie(
    db: Session,
    tmdb_id: int,
    limit: int = 10
):
    hybrid_response = build_hybrid_movie_recommendations(
        db=db,
        tmdb_id=tmdb_id,
        limit=max(limit * 8, 80)
    )

    candidates = hybrid_response.get("results", [])

    hidden_gems = []

    for movie in candidates:
        if not is_valid_hidden_gem(movie):
            continue

        if int(movie.get("tmdb_id")) == int(tmdb_id):
            continue

        movie["hidden_gem_score"] = calculate_hidden_gem_score(movie)
        movie["popularity_penalty"] = get_popularity_penalty(movie.get("popularity"))
        movie["hidden_gem_reason"] = build_hidden_gem_reason(movie)

        hidden_gems.append(movie)

    hidden_gems.sort(
        key=lambda movie: (
            movie.get("hidden_gem_score", 0),
            movie.get("ml_score", 0),
            movie.get("rating_score", 0)
        ),
        reverse=True
    )

    return {
        "source_tmdb_id": tmdb_id,
        "type": "hybrid_hidden_gems",
        "model": "hybrid_similarity_plus_low_popularity",
        "candidate_count": len(candidates),
        "results": hidden_gems[:limit],
        "hidden_gems": hidden_gems[:limit]
    }


def build_hidden_gem_reason(movie):
    parts = []

    ml_score = safe_float(movie.get("ml_score"))
    rule_score = safe_float(movie.get("rule_score"))
    popularity = safe_float(movie.get("popularity"))
    rating = safe_float(movie.get("rating"))

    if ml_score >= 0.08:
        parts.append("strong ML taste similarity")
    elif ml_score >= 0.04:
        parts.append("moderate ML taste similarity")

    if rule_score >= 0.20:
        parts.append("supporting genre/story signals")

    if rating >= 7.5:
        parts.append("strong rating")

    if popularity <= 10:
        parts.append("lower mainstream popularity")
    elif popularity <= 20:
        parts.append("moderate mainstream visibility")

    if not parts:
        return "Selected as a lower-popularity movie with relevant taste signals."

    return "Recommended for " + ", ".join(parts) + "."