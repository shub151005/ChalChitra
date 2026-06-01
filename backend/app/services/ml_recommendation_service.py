import json
from pathlib import Path

import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[3]

ML_MODELS_DIR = PROJECT_ROOT / "ml" / "models"
MOVIE_INDEX_PATH = ML_MODELS_DIR / "movie_index.json"
SIMILARITY_MATRIX_PATH = ML_MODELS_DIR / "similarity_matrix.joblib"


_movie_index = None
_similarity_matrix = None


def load_movie_index():
    global _movie_index

    if _movie_index is None:
        if not MOVIE_INDEX_PATH.exists():
            raise FileNotFoundError(
                f"Movie index not found at {MOVIE_INDEX_PATH}. Build ML model first."
            )

        with open(MOVIE_INDEX_PATH, "r", encoding="utf-8") as file:
            _movie_index = json.load(file)

    return _movie_index


def load_similarity_matrix():
    global _similarity_matrix

    if _similarity_matrix is None:
        if not SIMILARITY_MATRIX_PATH.exists():
            raise FileNotFoundError(
                f"Similarity matrix not found at {SIMILARITY_MATRIX_PATH}. Build ML model first."
            )

        _similarity_matrix = joblib.load(SIMILARITY_MATRIX_PATH)

    return _similarity_matrix


def get_ml_similar_movies(tmdb_id: int, limit: int = 10):
    movie_index = load_movie_index()
    similarity_matrix = load_similarity_matrix()

    source_key = str(tmdb_id)

    if source_key not in movie_index:
        return {
            "source_movie": None,
            "results": [],
            "message": "Movie not found in ML index. Rebuild ML model after caching this movie."
        }

    source_movie = movie_index[source_key]
    source_position = source_movie["position"]

    similarity_scores = similarity_matrix[source_position]

    ranked_positions = similarity_scores.argsort()[::-1]

    results = []

    for position in ranked_positions:
        position = int(position)

        if position == source_position:
            continue

        matched_movie = None

        for movie_data in movie_index.values():
            if movie_data["position"] == position:
                matched_movie = movie_data
                break

        if not matched_movie:
            continue

        results.append(
            {
                "tmdb_id": matched_movie["tmdb_id"],
                "title": matched_movie["title"],
                "poster_url": matched_movie["poster_url"],
                "release_date": matched_movie["release_date"],
                "language": matched_movie["language"],
                "rating": matched_movie["rating"],
                "popularity": matched_movie["popularity"],
                "ml_similarity_score": round(float(similarity_scores[position]), 4)
            }
        )

        if len(results) >= limit:
            break

    return {
        "source_movie": {
            "tmdb_id": source_movie["tmdb_id"],
            "title": source_movie["title"]
        },
        "results": results,
        "model": "tfidf_cosine_similarity"
    }