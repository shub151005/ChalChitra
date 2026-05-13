from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class WatchlistCreate(BaseModel):
    tmdb_id: int
    status: str = Field(default="watch_later")


class WatchlistUpdate(BaseModel):
    status: str


class WatchlistResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WatchlistItem(BaseModel):
    watchlist_id: int
    status: str
    movie_id: int
    tmdb_id: int
    title: str
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    release_date: Optional[str] = None
    rating: Optional[float] = None
    language: Optional[str] = None