from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    person_id = Column(Integer, nullable=False)
    type = Column(String, nullable=False)

    name = Column(String)
    profile_url = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="follows")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "person_id",
            "type",
            name="unique_user_person_follow"
        ),
    )