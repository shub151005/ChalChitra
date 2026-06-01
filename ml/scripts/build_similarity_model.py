import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = PROJECT_ROOT / "ml" / "data" / "movie_dataset.json"

MODELS_DIR = PROJECT_ROOT / "ml" / "models"
VECTORIZER_PATH = MODELS_DIR / "tfidf_vectorizer.joblib"
MATRIX_PATH = MODELS_DIR / "movie_tfidf_matrix.joblib"
SIMILARITY_PATH = MODELS_DIR / "similarity_matrix.joblib"
INDEX_PATH = MODELS_DIR / "movie_index.json"


def load_dataset():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}. Run prepare_movie_dataset.py first."
        )

    with open(DATASET_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def build_movie_index(movies):
    index = {}

    for position, movie in enumerate(movies):
        tmdb_id = movie.get("tmdb_id")

        if tmdb_id is not None:
            index[str(tmdb_id)] = {
                "position": position,
                "tmdb_id": tmdb_id,
                "title": movie.get("title"),
                "poster_url": movie.get("poster_url"),
                "release_date": movie.get("release_date"),
                "language": movie.get("language"),
                "rating": movie.get("rating"),
                "popularity": movie.get("popularity")
            }

    return index


def build_model():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    movies = load_dataset()

    if len(movies) < 2:
        raise ValueError("At least 2 movies are required to build similarity model.")

    documents = [movie.get("ml_text", "") for movie in movies]

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        max_features=12000,
        ngram_range=(1, 2),
        min_df=1
    )

    movie_tfidf_matrix = vectorizer.fit_transform(documents)
    similarity_matrix = cosine_similarity(movie_tfidf_matrix)

    movie_index = build_movie_index(movies)

    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(movie_tfidf_matrix, MATRIX_PATH)
    joblib.dump(similarity_matrix, SIMILARITY_PATH)

    with open(INDEX_PATH, "w", encoding="utf-8") as file:
        json.dump(movie_index, file, ensure_ascii=False, indent=2)

    print("TF-IDF similarity model built successfully.")
    print(f"Movies trained: {len(movies)}")
    print(f"Vectorizer: {VECTORIZER_PATH}")
    print(f"TF-IDF matrix: {MATRIX_PATH}")
    print(f"Similarity matrix: {SIMILARITY_PATH}")
    print(f"Movie index: {INDEX_PATH}")


if __name__ == "__main__":
    build_model()