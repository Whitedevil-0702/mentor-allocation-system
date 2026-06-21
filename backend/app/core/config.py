import os

class Settings:
    PROJECT_NAME: str = "Mentor Allocation System"
    API_PREFIX: str = "/api"
    
    # Secret key for optional future auth/JWT tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey123")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()
