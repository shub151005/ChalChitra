from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, nullable=False)
    title = Column(String, nullable=False)
    original_title = Column(String)
    description = Column(Text)
    poster_url = Column(String)
    backdrop_url = Column(String)
    language = Column(String)
    release_date = Column(String)
    rating = Column(Float)
    runtime = Column(Integer)

    ratings = relationship("Rating", back_populates="movie")
    reviews = relationship("Review", back_populates="movie")
    watchlist = relationship("Watchlist", back_populates="movie")