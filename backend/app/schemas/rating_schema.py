from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class RatingCreate(BaseModel):
    tmdb_id: int
    rating: int = Field(..., ge=1, le=10)


class RatingResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    rating: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserRatingItem(BaseModel):
    rating_id: int
    rating: int
    movie_id: int
    tmdb_id: int
    title: str
    poster_url: Optional[str] = None
    release_date: Optional[str] = None


class MovieRatingSummary(BaseModel):
    movie_id: int
    tmdb_id: int
    title: str
    average_rating: float
    total_ratings: int