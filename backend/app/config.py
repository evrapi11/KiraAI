import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI")
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY")
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

settings = Settings()