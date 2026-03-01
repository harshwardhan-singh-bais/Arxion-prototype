from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
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
    QDRANT_COLLECTION_CHUNKS: str = "arxion_chunks_v2"
    QDRANT_COLLECTION_CLAIMS: str = "arxion_claims_v2"

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Gemini embedding model
    EMBEDDING_MODEL: str = "models/embedding-001"
    EMBEDDING_DIMENSION: int = 3072

    # Gemini chat model
    GEMINI_MODEL: str = "gemini-pro"

    # Neon PostgreSQL (or local SQLite fallback)
    DATABASE_URL: str = "sqlite+aiosqlite:///./arxion.db"

    # Clerk Auth
    CLERK_ISSUER_URL: str = "https://clerk.arxion.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
