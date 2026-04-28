from fastapi import APIRouter

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/")
def recommendation_test():
    return {"message": "Recommendation routes working"}