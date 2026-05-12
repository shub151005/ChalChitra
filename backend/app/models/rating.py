from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship("User", back_populates="ratings")
    movie = relationship("Movie", back_populates="ratings")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "movie_id",
            name="unique_user_movie_rating"
        ),
    )