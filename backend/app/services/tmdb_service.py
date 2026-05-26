import time
import requests
from fastapi import HTTPException
from app.config import settings

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original"


def build_poster_url(path):
    if not path:
        return None
    return f"{TMDB_IMAGE_BASE_URL}{path}"


def build_backdrop_url(path):
    if not path:
        return None
    return f"{TMDB_BACKDROP_BASE_URL}{path}"


def tmdb_get(endpoint, params=None):
    if not settings.TMDB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="TMDb API key is missing"
        )

    request_params = dict(params) if params else {}
    request_params["api_key"] = settings.TMDB_API_KEY

    headers = {
        "User-Agent": "ChalChitra/1.0"
    }

    last_error = None

    for attempt in range(4):
        try:
            response = requests.get(
                f"{TMDB_BASE_URL}{endpoint}",
                params=request_params,
                headers=headers,
                timeout=(5, 30)
            )

            if response.status_code == 429:
                time.sleep(2 + attempt)
                continue

            if response.status_code != 200:
                try:
                    error_message = response.json().get(
                        "status_message",
                        "TMDb API request failed"
                    )
                except Exception:
                    error_message = "TMDb API request failed"

                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_message
                )

            return response.json()

        except requests.RequestException as error:
            last_error = error
            time.sleep(2 + attempt)

    raise HTTPException(
        status_code=503,
        detail=f"TMDb service unavailable after retries: {str(last_error)}"
    )


def format_movie(movie):
    return {
        "tmdb_id": movie.get("id"),
        "title": movie.get("title"),
        "original_title": movie.get("original_title"),
        "description": movie.get("overview"),
        "poster_url": build_poster_url(movie.get("poster_path")),
        "backdrop_url": build_backdrop_url(movie.get("backdrop_path")),
        "language": movie.get("original_language"),
        "release_date": movie.get("release_date"),
        "rating": movie.get("vote_average"),
        "popularity": movie.get("popularity")
    }


def search_movies(query: str, page: int = 1):
    data = tmdb_get(
        "/search/movie",
        {
            "query": query,
            "page": page,
            "include_adult": False
        }
    )

    movies = [
        format_movie(movie)
        for movie in data.get("results", [])
    ]

    return {
        "page": data.get("page"),
        "total_results": data.get("total_results"),
        "total_pages": data.get("total_pages"),
        "results": movies
    }


def get_movie_details(tmdb_id: int):
    movie = tmdb_get(
        f"/movie/{tmdb_id}",
        {
            "append_to_response": "credits"
        }
    )

    credits = movie.get("credits", {})
    cast_data = credits.get("cast", [])
    crew_data = credits.get("crew", [])

    directors = [
        {
            "id": person.get("id"),
            "name": person.get("name"),
            "job": person.get("job"),
            "profile_url": build_poster_url(person.get("profile_path"))
        }
        for person in crew_data
        if person.get("job") == "Director"
    ]

    writers = [
        {
            "id": person.get("id"),
            "name": person.get("name"),
            "job": person.get("job"),
            "profile_url": build_poster_url(person.get("profile_path"))
        }
        for person in crew_data
        if person.get("job") in ["Writer", "Screenplay", "Story"]
    ]

    cast = [
        {
            "id": person.get("id"),
            "name": person.get("name"),
            "character": person.get("character"),
            "profile_url": build_poster_url(person.get("profile_path"))
        }
        for person in cast_data[:10]
    ]

    return {
        "tmdb_id": movie.get("id"),
        "title": movie.get("title"),
        "original_title": movie.get("original_title"),
        "description": movie.get("overview"),
        "poster_url": build_poster_url(movie.get("poster_path")),
        "backdrop_url": build_backdrop_url(movie.get("backdrop_path")),
        "language": movie.get("original_language"),
        "release_date": movie.get("release_date"),
        "rating": movie.get("vote_average"),
        "popularity": movie.get("popularity"),
        "runtime": movie.get("runtime"),
        "genres": [
            genre.get("name")
            for genre in movie.get("genres", [])
        ],
        "directors": directors,
        "writers": writers,
        "cast": cast
    }


def get_trending_movies(page: int = 1):
    data = tmdb_get(
        "/trending/movie/week",
        {
            "page": page
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def get_top_rated_movies(page: int = 1):
    data = tmdb_get(
        "/movie/top_rated",
        {
            "page": page
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def get_popular_movies(page: int = 1):
    data = tmdb_get(
        "/movie/popular",
        {
            "page": page
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def discover_movies_by_genre(
    genre_id: int,
    page: int = 1
):
    data = tmdb_get(
        "/discover/movie",
        {
            "with_genres": genre_id,
            "page": page,
            "sort_by": "vote_average.desc",
            "vote_count.gte": 100,
            "include_adult": False
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def discover_movies_by_language(
    language_code: str,
    page: int = 1
):
    data = tmdb_get(
        "/discover/movie",
        {
            "with_original_language": language_code,
            "page": page,
            "sort_by": "vote_average.desc",
            "vote_count.gte": 50,
            "include_adult": False
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def get_similar_movies(tmdb_id: int, page: int = 1):
    data = tmdb_get(
        f"/movie/{tmdb_id}/similar",
        {
            "page": page
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def get_tmdb_movie_recommendations(
    tmdb_id: int,
    page: int = 1
):
    data = tmdb_get(
        f"/movie/{tmdb_id}/recommendations",
        {
            "page": page
        }
    )

    return [
        format_movie(movie)
        for movie in data.get("results", [])
    ]


def get_person_movie_credits(person_id: int):
    data = tmdb_get(
        f"/person/{person_id}/movie_credits"
    )

    cast_movies = [
        format_movie(movie)
        for movie in data.get("cast", [])
    ]

    crew_movies = [
        format_movie(movie)
        for movie in data.get("crew", [])
    ]

    return {
        "cast": cast_movies,
        "crew": crew_movies
    }