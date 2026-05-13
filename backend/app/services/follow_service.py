from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.follow import Follow
from app.models.user import User


VALID_FOLLOW_TYPES = {
    "director",
    "actor"
}


def validate_follow_type(follow_type: str):
    if follow_type not in VALID_FOLLOW_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid follow type. Use director or actor."
        )


def follow_person(
    db: Session,
    current_user: User,
    person_id: int,
    follow_type: str,
    name: str | None = None,
    profile_url: str | None = None
):
    validate_follow_type(follow_type)

    existing_follow = db.query(Follow).filter(
        Follow.user_id == current_user.id,
        Follow.person_id == person_id,
        Follow.type == follow_type
    ).first()

    if existing_follow:
        if name:
            existing_follow.name = name

        if profile_url:
            existing_follow.profile_url = profile_url

        db.commit()
        db.refresh(existing_follow)
        return existing_follow

    new_follow = Follow(
        user_id=current_user.id,
        person_id=person_id,
        type=follow_type,
        name=name,
        profile_url=profile_url
    )

    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)

    return new_follow


def get_current_user_follows(
    db: Session,
    current_user: User,
    follow_type: str | None = None
):
    query = db.query(Follow).filter(
        Follow.user_id == current_user.id
    )

    if follow_type:
        validate_follow_type(follow_type)
        query = query.filter(Follow.type == follow_type)

    follows = query.order_by(
        Follow.created_at.desc()
    ).all()

    return [
        {
            "follow_id": follow.id,
            "person_id": follow.person_id,
            "type": follow.type,
            "name": follow.name,
            "profile_url": follow.profile_url,
            "created_at": follow.created_at
        }
        for follow in follows
    ]


def unfollow_person(
    db: Session,
    current_user: User,
    person_id: int,
    follow_type: str
):
    validate_follow_type(follow_type)

    follow = db.query(Follow).filter(
        Follow.user_id == current_user.id,
        Follow.person_id == person_id,
        Follow.type == follow_type
    ).first()

    if not follow:
        raise HTTPException(
            status_code=404,
            detail="Follow entry not found"
        )

    db.delete(follow)
    db.commit()

    return {
        "message": "Unfollowed successfully"
    }