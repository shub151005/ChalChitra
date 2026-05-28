def extract_movie_list(raw_data):
    if not raw_data:
        return []

    if isinstance(raw_data, list):
        return raw_data

    if isinstance(raw_data, dict):
        possible_keys = [
            "results",
            "recommendations",
            "hidden_gems",
            "movies",
            "data"
        ]

        for key in possible_keys:
            value = raw_data.get(key)

            if isinstance(value, list):
                return value

        return []

    return []


def normalize_recommendation_item(item):
    if not item:
        return None

    if isinstance(item, dict):
        if item.get("movie"):
            movie = item.get("movie")

            if not isinstance(movie, dict):
                return None

            return {
                **movie,
                "recommendation_score": (
                    item.get("score")
                    or item.get("similarity_score")
                    or item.get("final_score")
                    or item.get("recommendation_score")
                    or movie.get("recommendation_score")
                ),
                "score_breakdown": item.get("score_breakdown"),
                "reason": item.get("reason") or item.get("explanation")
            }

        if item.get("recommended_movie"):
            movie = item.get("recommended_movie")

            if not isinstance(movie, dict):
                return None

            return {
                **movie,
                "recommendation_score": (
                    item.get("score")
                    or item.get("similarity_score")
                    or item.get("final_score")
                    or item.get("recommendation_score")
                    or movie.get("recommendation_score")
                ),
                "score_breakdown": item.get("score_breakdown"),
                "reason": item.get("reason") or item.get("explanation")
            }

        if item.get("tmdb_id"):
            return item

    return None


def deduplicate_movies(raw_data):
    raw_movies = extract_movie_list(raw_data)

    unique_movies = []
    seen_ids = set()

    for item in raw_movies:
        movie = normalize_recommendation_item(item)

        if not movie:
            continue

        tmdb_id = movie.get("tmdb_id")

        if not tmdb_id:
            continue

        if tmdb_id in seen_ids:
            continue

        seen_ids.add(tmdb_id)
        unique_movies.append(movie)

    return unique_movies


def get_movie_score(movie):
    score = (
        movie.get("recommendation_score")
        or movie.get("similarity_score")
        or movie.get("final_score")
        or movie.get("score")
        or movie.get("hybrid_score")
        or 0
    )

    try:
        return float(score)
    except (TypeError, ValueError):
        return 0.0


def get_movie_rating(movie):
    rating = (
        movie.get("rating")
        or movie.get("vote_average")
        or movie.get("average_rating")
        or 0
    )

    try:
        return float(rating)
    except (TypeError, ValueError):
        return 0.0


def get_movie_popularity(movie):
    popularity = movie.get("popularity") or 0

    try:
        return float(popularity)
    except (TypeError, ValueError):
        return 0.0


def build_similar_taste_results(raw_movies, limit=10):
    movies = deduplicate_movies(raw_movies)

    movies.sort(
        key=lambda movie: (
            get_movie_score(movie),
            get_movie_rating(movie),
            get_movie_popularity(movie)
        ),
        reverse=True
    )

    return movies[:limit]


def build_hidden_gem_results(
    raw_movies,
    similar_movies=None,
    limit=10,
    exclude_top_similar_count=5
):
    movies = deduplicate_movies(raw_movies)

    similar_movies = similar_movies or []

    excluded_ids = {
        movie.get("tmdb_id")
        for movie in similar_movies[:exclude_top_similar_count]
        if movie.get("tmdb_id")
    }

    filtered_movies = [
        movie
        for movie in movies
        if movie.get("tmdb_id") not in excluded_ids
    ]

    if not filtered_movies:
        filtered_movies = [
            movie
            for movie in movies
            if movie.get("tmdb_id") not in {
                item.get("tmdb_id") for item in similar_movies[:2]
            }
        ]

    if not filtered_movies:
        filtered_movies = movies

    max_popularity = max(
        [get_movie_popularity(movie) for movie in filtered_movies] or [1]
    )

    if max_popularity <= 0:
        max_popularity = 1

    scored_movies = []

    for movie in filtered_movies:
        similarity_score = get_movie_score(movie)
        rating_score = get_movie_rating(movie) / 10
        popularity = get_movie_popularity(movie)
        low_popularity_score = 1 - min(popularity / max_popularity, 1)

        hidden_gem_score = (
            similarity_score * 0.55
            + rating_score * 0.30
            + low_popularity_score * 0.15
        )

        updated_movie = {
            **movie,
            "hidden_gem_score": round(hidden_gem_score, 4),
            "recommendation_score": movie.get("recommendation_score") or similarity_score,
            "reason": movie.get("reason")
            or "Balanced by taste similarity, rating quality, and lower mainstream popularity."
        }

        scored_movies.append(updated_movie)

    scored_movies.sort(
        key=lambda movie: (
            movie.get("hidden_gem_score", 0),
            get_movie_rating(movie),
            -get_movie_popularity(movie)
        ),
        reverse=True
    )

    return scored_movies[:limit]