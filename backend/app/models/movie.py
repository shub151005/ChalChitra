from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, nullable=False, index=True)

    title = Column(String, nullable=False)
    original_title = Column(String)
    description = Column(Text)

    poster_url = Column(String)
    backdrop_url = Column(String)

    language = Column(String)
    release_date = Column(String)
    rating = Column(Float)
    runtime = Column(Integer)
    popularity = Column(Float)

    genres = Column(JSON)
    directors = Column(JSON)
    writers = Column(JSON)
    cast_members = Column(JSON)

    details_cached = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    ratings = relationship("Rating", back_populates="movie")
    reviews = relationship("Review", back_populates="movie")
    watchlist = relationship("Watchlist", back_populates="movie")