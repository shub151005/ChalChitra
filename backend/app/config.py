from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    TMDB_API_KEY = os.getenv("TMDB_API_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440)
    )


settings = Settings()