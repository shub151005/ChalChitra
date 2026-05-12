from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    tmdb_id: int
    review_text: str = Field(..., min_length=3)
    rating: Optional[int] = Field(default=None, ge=1, le=10)


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    review_text: str
    rating: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MovieReviewItem(BaseModel):
    review_id: int
    user_id: int
    user_name: str
    movie_id: int
    tmdb_id: int
    title: str
    review_text: str
    rating: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserReviewItem(BaseModel):
    review_id: int
    movie_id: int
    tmdb_id: int
    title: str
    poster_url: Optional[str] = None
    release_date: Optional[str] = None
    review_text: str
    rating: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None