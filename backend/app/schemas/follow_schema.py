from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FollowCreate(BaseModel):
    person_id: int
    type: str
    name: Optional[str] = None
    profile_url: Optional[str] = None


class FollowResponse(BaseModel):
    id: int
    user_id: int
    person_id: int
    type: str
    name: Optional[str] = None
    profile_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FollowItem(BaseModel):
    follow_id: int
    person_id: int
    type: str
    name: Optional[str] = None
    profile_url: Optional[str] = None
    created_at: datetime