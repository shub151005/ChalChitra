from pydantic import BaseModel
from typing import Optional


class GenrePreferenceItem(BaseModel):
    genre: str
    score: float
    movie_count: int


class LanguagePreferenceItem(BaseModel):
    language: str
    score: float
    movie_count: int


class CreatorPreferenceItem(BaseModel):
    person_id: int
    name: Optional[str] = None
    type: str
    score: float
    movie_count: int
    profile_url: Optional[str] = None


class WatchlistSummary(BaseModel):
    total: int
    watch_later: int
    watching: int
    completed: int
    dropped: int


class TasteAnalyticsResponse(BaseModel):
    user_id: int
    name: str
    total_ratings: int
    total_reviews: int
    total_watchlist_items: int
    followed_directors: int
    followed_actors: int
    average_rating: float
    top_genres: list[GenrePreferenceItem]
    top_languages: list[LanguagePreferenceItem]
    top_directors: list[CreatorPreferenceItem]
    top_actors: list[CreatorPreferenceItem]
    watchlist_summary: WatchlistSummary
    taste_summary: str