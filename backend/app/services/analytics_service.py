from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.rating import Rating
from app.models.review import Review
from app.models.watchlist import Watchlist
from app.models.follow import Follow


def safe_rating_weight(rating_value: int | None):
    if rating_value is None:
        return 0.5

    return max(min(rating_value / 10, 1), 0)


def add_movie_genre_scores(
    genre_scores,
    genre_counts,
    movie,
    weight: float
):
    if not movie or not movie.genres:
        return

    for genre in movie.genres:
        if not isinstance(genre, str):
            continue

        cleaned_genre = genre.strip()

        if not cleaned_genre:
            continue

        genre_scores[cleaned_genre] += weight
        genre_counts[cleaned_genre] += 1


def add_movie_language_scores(
    language_scores,
    language_counts,
    movie,
    weight: float
):
    if not movie or not movie.language:
        return

    language = movie.language.strip()

    if not language:
        return

    language_scores[language] += weight
    language_counts[language] += 1


def add_creator_scores(
    creator_scores,
    creator_counts,
    creator_meta,
    people,
    creator_type: str,
    weight: float
):
    if not people:
        return

    for person in people:
        if not isinstance(person, dict):
            continue

        person_id = person.get("id")

        if person_id is None:
            continue

        creator_scores[(person_id, creator_type)] += weight
        creator_counts[(person_id, creator_type)] += 1

        if (person_id, creator_type) not in creator_meta:
            creator_meta[(person_id, creator_type)] = {
                "person_id": person_id,
                "name": person.get("name"),
                "type": creator_type,
                "profile_url": person.get("profile_url")
            }


def build_ranked_genres(
    genre_scores,
    genre_counts,
    limit: int = 10
):
    items = []

    for genre, score in genre_scores.items():
        items.append({
            "genre": genre,
            "score": round(score, 2),
            "movie_count": genre_counts[genre]
        })

    items.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return items[:limit]


def build_ranked_languages(
    language_scores,
    language_counts,
    limit: int = 10
):
    items = []

    for language, score in language_scores.items():
        items.append({
            "language": language,
            "score": round(score, 2),
            "movie_count": language_counts[language]
        })

    items.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return items[:limit]


def build_ranked_creators(
    creator_scores,
    creator_counts,
    creator_meta,
    creator_type: str,
    limit: int = 10
):
    items = []

    for key, score in creator_scores.items():
        person_id, current_type = key

        if current_type != creator_type:
            continue

        meta = creator_meta.get(
            key,
            {
                "person_id": person_id,
                "name": None,
                "type": creator_type,
                "profile_url": None
            }
        )

        items.append({
            "person_id": meta["person_id"],
            "name": meta["name"],
            "type": meta["type"],
            "profile_url": meta["profile_url"],
            "score": round(score, 2),
            "movie_count": creator_counts[key]
        })

    items.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return items[:limit]


def build_watchlist_summary(
    watchlist_items
):
    summary = {
        "total": len(watchlist_items),
        "watch_later": 0,
        "watching": 0,
        "completed": 0,
        "dropped": 0
    }

    for item in watchlist_items:
        if item.status in summary:
            summary[item.status] += 1

    return summary


def build_taste_summary(
    top_genres,
    top_languages,
    top_directors,
    average_rating,
    total_ratings
):
    if total_ratings == 0:
        return "Not enough rating data yet. Rate a few movies to build your taste profile."

    genre_text = "mixed genres"

    if top_genres:
        genre_text = ", ".join(
            item["genre"]
            for item in top_genres[:3]
        )

    language_text = "multiple languages"

    if top_languages:
        language_text = ", ".join(
            item["language"]
            for item in top_languages[:3]
        )

    director_text = ""

    if top_directors:
        director_names = [
            item["name"]
            for item in top_directors[:2]
            if item["name"]
        ]

        if director_names:
            director_text = " You show strong affinity toward directors like " + ", ".join(director_names) + "."

    return (
        f"Your taste currently leans toward {genre_text}, "
        f"with notable interest in {language_text} cinema. "
        f"Your average rating is {round(average_rating, 2)}/10."
        + director_text
    )


def calculate_user_taste_analytics(
    db: Session,
    current_user: User
):
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    reviews = db.query(Review).filter(
        Review.user_id == current_user.id
    ).all()

    watchlist_items = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).all()

    follows = db.query(Follow).filter(
        Follow.user_id == current_user.id
    ).all()

    genre_scores = defaultdict(float)
    genre_counts = defaultdict(int)

    language_scores = defaultdict(float)
    language_counts = defaultdict(int)

    creator_scores = defaultdict(float)
    creator_counts = defaultdict(int)
    creator_meta = {}

    rating_values = []

    for rating in ratings:
        if not rating.movie:
            continue

        rating_values.append(rating.rating)

        weight = safe_rating_weight(rating.rating)

        add_movie_genre_scores(
            genre_scores=genre_scores,
            genre_counts=genre_counts,
            movie=rating.movie,
            weight=weight
        )

        add_movie_language_scores(
            language_scores=language_scores,
            language_counts=language_counts,
            movie=rating.movie,
            weight=weight
        )

        add_creator_scores(
            creator_scores=creator_scores,
            creator_counts=creator_counts,
            creator_meta=creator_meta,
            people=rating.movie.directors,
            creator_type="director",
            weight=weight
        )

        add_creator_scores(
            creator_scores=creator_scores,
            creator_counts=creator_counts,
            creator_meta=creator_meta,
            people=rating.movie.cast_members,
            creator_type="actor",
            weight=weight * 0.7
        )

    for item in watchlist_items:
        if not item.movie:
            continue

        status_weight = 0.4

        if item.status == "completed":
            status_weight = 0.8
        elif item.status == "watching":
            status_weight = 0.6
        elif item.status == "watch_later":
            status_weight = 0.35
        elif item.status == "dropped":
            status_weight = 0.1

        add_movie_genre_scores(
            genre_scores=genre_scores,
            genre_counts=genre_counts,
            movie=item.movie,
            weight=status_weight
        )

        add_movie_language_scores(
            language_scores=language_scores,
            language_counts=language_counts,
            movie=item.movie,
            weight=status_weight
        )

        add_creator_scores(
            creator_scores=creator_scores,
            creator_counts=creator_counts,
            creator_meta=creator_meta,
            people=item.movie.directors,
            creator_type="director",
            weight=status_weight
        )

        add_creator_scores(
            creator_scores=creator_scores,
            creator_counts=creator_counts,
            creator_meta=creator_meta,
            people=item.movie.cast_members,
            creator_type="actor",
            weight=status_weight * 0.7
        )

    for follow in follows:
        key = (follow.person_id, follow.type)

        creator_scores[key] += 1.0
        creator_counts[key] += 1

        if key not in creator_meta:
            creator_meta[key] = {
                "person_id": follow.person_id,
                "name": follow.name,
                "type": follow.type,
                "profile_url": follow.profile_url
            }

    top_genres = build_ranked_genres(
        genre_scores=genre_scores,
        genre_counts=genre_counts,
        limit=10
    )

    top_languages = build_ranked_languages(
        language_scores=language_scores,
        language_counts=language_counts,
        limit=10
    )

    top_directors = build_ranked_creators(
        creator_scores=creator_scores,
        creator_counts=creator_counts,
        creator_meta=creator_meta,
        creator_type="director",
        limit=10
    )

    top_actors = build_ranked_creators(
        creator_scores=creator_scores,
        creator_counts=creator_counts,
        creator_meta=creator_meta,
        creator_type="actor",
        limit=10
    )

    average_rating = 0

    if rating_values:
        average_rating = sum(rating_values) / len(rating_values)

    followed_directors = len(
        [
            follow
            for follow in follows
            if follow.type == "director"
        ]
    )

    followed_actors = len(
        [
            follow
            for follow in follows
            if follow.type == "actor"
        ]
    )

    watchlist_summary = build_watchlist_summary(
        watchlist_items=watchlist_items
    )

    taste_summary = build_taste_summary(
        top_genres=top_genres,
        top_languages=top_languages,
        top_directors=top_directors,
        average_rating=average_rating,
        total_ratings=len(ratings)
    )

    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "total_ratings": len(ratings),
        "total_reviews": len(reviews),
        "total_watchlist_items": len(watchlist_items),
        "followed_directors": followed_directors,
        "followed_actors": followed_actors,
        "average_rating": round(average_rating, 2),
        "top_genres": top_genres,
        "top_languages": top_languages,
        "top_directors": top_directors,
        "top_actors": top_actors,
        "watchlist_summary": watchlist_summary,
        "taste_summary": taste_summary
    }


def get_user_genre_analytics(
    db: Session,
    current_user: User
):
    analytics = calculate_user_taste_analytics(
        db=db,
        current_user=current_user
    )

    return {
        "top_genres": analytics["top_genres"]
    }


def get_user_language_analytics(
    db: Session,
    current_user: User
):
    analytics = calculate_user_taste_analytics(
        db=db,
        current_user=current_user
    )

    return {
        "top_languages": analytics["top_languages"]
    }


def get_user_creator_analytics(
    db: Session,
    current_user: User
):
    analytics = calculate_user_taste_analytics(
        db=db,
        current_user=current_user
    )

    return {
        "top_directors": analytics["top_directors"],
        "top_actors": analytics["top_actors"]
    }