from fastapi import APIRouter

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/")
def movie_test():
    return {"message": "Movie routes working"}