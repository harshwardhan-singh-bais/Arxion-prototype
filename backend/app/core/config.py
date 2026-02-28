from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",   # silently ignore unknown .env keys
    )

    # Application
    APP_NAME: str = "Arxion"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Gemini
    GEMINI_API_KEY: str

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_CHUNKS: str = "arxion_chunks"
    QDRANT_COLLECTION_CLAIMS: str = "arxion_claims"

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Embeddings
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    EMBEDDING_DIMENSION: int = 768

    # Generation
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Auth (Component H)
    JWT_SECRET: str = "arxion-dev-secret-change-in-production"


settings = Settings()
