from sqlalchemy.orm import Session
from app.models.movie import Movie


def get_movie_by_tmdb_id(db: Session, tmdb_id: int):
    return db.query(Movie).filter(
        Movie.tmdb_id == tmdb_id
    ).first()


def save_or_update_basic_movie(
    db: Session,
    movie_data: dict
):
    movie = get_movie_by_tmdb_id(
        db,
        movie_data.get("tmdb_id")
    )

    if movie:
        movie.title = movie_data.get("title")
        movie.original_title = movie_data.get("original_title")
        movie.description = movie_data.get("description")
        movie.poster_url = movie_data.get("poster_url")
        movie.backdrop_url = movie_data.get("backdrop_url")
        movie.language = movie_data.get("language")
        movie.release_date = movie_data.get("release_date")
        movie.rating = movie_data.get("rating")
        movie.popularity = movie_data.get("popularity")
    else:
        movie = Movie(
            tmdb_id=movie_data.get("tmdb_id"),
            title=movie_data.get("title"),
            original_title=movie_data.get("original_title"),
            description=movie_data.get("description"),
            poster_url=movie_data.get("poster_url"),
            backdrop_url=movie_data.get("backdrop_url"),
            language=movie_data.get("language"),
            release_date=movie_data.get("release_date"),
            rating=movie_data.get("rating"),
            popularity=movie_data.get("popularity"),
            details_cached=False
        )

        db.add(movie)

    db.commit()
    db.refresh(movie)

    return movie


def save_or_update_detailed_movie(
    db: Session,
    movie_data: dict
):
    movie = get_movie_by_tmdb_id(
        db,
        movie_data.get("tmdb_id")
    )

    if movie:
        movie.title = movie_data.get("title")
        movie.original_title = movie_data.get("original_title")
        movie.description = movie_data.get("description")
        movie.poster_url = movie_data.get("poster_url")
        movie.backdrop_url = movie_data.get("backdrop_url")
        movie.language = movie_data.get("language")
        movie.release_date = movie_data.get("release_date")
        movie.rating = movie_data.get("rating")
        movie.popularity = movie_data.get("popularity")
        movie.runtime = movie_data.get("runtime")
        movie.genres = movie_data.get("genres")
        movie.directors = movie_data.get("directors")
        movie.writers = movie_data.get("writers")
        movie.cast_members = movie_data.get("cast")
        movie.details_cached = True
    else:
        movie = Movie(
            tmdb_id=movie_data.get("tmdb_id"),
            title=movie_data.get("title"),
            original_title=movie_data.get("original_title"),
            description=movie_data.get("description"),
            poster_url=movie_data.get("poster_url"),
            backdrop_url=movie_data.get("backdrop_url"),
            language=movie_data.get("language"),
            release_date=movie_data.get("release_date"),
            rating=movie_data.get("rating"),
            popularity=movie_data.get("popularity"),
            runtime=movie_data.get("runtime"),
            genres=movie_data.get("genres"),
            directors=movie_data.get("directors"),
            writers=movie_data.get("writers"),
            cast_members=movie_data.get("cast"),
            details_cached=True
        )

        db.add(movie)

    db.commit()
    db.refresh(movie)

    return movie


def movie_to_basic_response(movie: Movie):
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "original_title": movie.original_title,
        "description": movie.description,
        "poster_url": movie.poster_url,
        "backdrop_url": movie.backdrop_url,
        "language": movie.language,
        "release_date": movie.release_date,
        "rating": movie.rating,
        "popularity": movie.popularity
    }


def movie_to_detail_response(movie: Movie):
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "original_title": movie.original_title,
        "description": movie.description,
        "poster_url": movie.poster_url,
        "backdrop_url": movie.backdrop_url,
        "language": movie.language,
        "release_date": movie.release_date,
        "rating": movie.rating,
        "popularity": movie.popularity,
        "runtime": movie.runtime,
        "genres": movie.genres or [],
        "directors": movie.directors or [],
        "writers": movie.writers or [],
        "cast": movie.cast_members or [],
        "details_cached": movie.details_cached
    }

def is_detailed_cache_complete(movie: Movie):
    if not movie:
        return False

    if not movie.details_cached:
        return False

    if movie.popularity is None:
        return False

    if not movie.genres:
        return False

    if not movie.directors:
        return False

    if not movie.cast_members:
        return False

    return True