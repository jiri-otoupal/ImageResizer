from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    MAX_FILES: int = 100

    class Config:
        env_file = ".env"


settings = Settings()
