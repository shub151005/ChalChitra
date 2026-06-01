import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"

sys.path.append(str(BACKEND_ROOT))

from app.database import SessionLocal
from app.models.movie import Movie


OUTPUT_PATH = PROJECT_ROOT / "ml" / "data" / "movie_dataset.json"


def safe_list_to_names(items):
    if not items:
        return []

    names = []

    for item in items:
        if isinstance(item, str):
            names.append(item)
        elif hasattr(item, "name"):
            names.append(item.name)
        elif hasattr(item, "person_name"):
            names.append(item.person_name)

    return [name for name in names if name]


def build_movie_text(movie):
    title = movie.title or ""
    original_title = movie.original_title or ""
    description = movie.description or ""
    language = movie.language or ""

    genres = " ".join(safe_list_to_names(movie.genres))
    directors = " ".join(safe_list_to_names(movie.directors))
    cast = " ".join(
        safe_list_to_names(movie.cast_members[:8] if movie.cast_members else [])
    )

    weighted_text_parts = [
        description,
        description,
        description,
        genres,
        genres,
        directors,
        directors,
        cast,
        language,
        title,
        original_title
    ]

    return " ".join(weighted_text_parts).strip()

def movie_to_record(movie):
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "original_title": movie.original_title,
        "description": movie.description,
        "poster_url": movie.poster_url,
        "backdrop_url": movie.backdrop_url,
        "release_date": movie.release_date,
        "language": movie.language,
        "rating": movie.rating,
        "popularity": movie.popularity,
        "genres": safe_list_to_names(movie.genres),
        "directors": safe_list_to_names(movie.directors),
        "cast": safe_list_to_names(movie.cast_members[:8] if movie.cast_members else []),
        "ml_text": build_movie_text(movie)
    }


def prepare_dataset():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()

    try:
        movies = (
            db.query(Movie)
            .filter(Movie.tmdb_id.isnot(None))
            .filter(Movie.title.isnot(None))
            .all()
        )

        records = []

        for movie in movies:
            record = movie_to_record(movie)

            if record["ml_text"]:
                records.append(record)

        with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
            json.dump(records, file, ensure_ascii=False, indent=2)

        print(f"Dataset created successfully.")
        print(f"Movies exported: {len(records)}")
        print(f"Output path: {OUTPUT_PATH}")

    finally:
        db.close()


if __name__ == "__main__":
    prepare_dataset()