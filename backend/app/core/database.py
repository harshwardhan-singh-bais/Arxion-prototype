import logging
from fastapi import HTTPException
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams
from app.core.config import settings

logger = logging.getLogger(__name__)

# Singleton async client
_client: AsyncQdrantClient | None = None


def get_qdrant() -> AsyncQdrantClient:
    if _client is None:
        raise HTTPException(
            status_code=503,
            detail="Qdrant is not connected. Check QDRANT_URL and QDRANT_API_KEY in your .env file."
        )
    return _client


async def init_qdrant():
    """Create the Qdrant client and ensure collections exist."""
    global _client

    try:
        is_cloud = settings.QDRANT_URL.startswith("https://")

        if settings.QDRANT_API_KEY:
            _client = AsyncQdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY,
                prefer_grpc=False,   # REST is more reliable through cloud firewalls
            )
        else:
            _client = AsyncQdrantClient(
                url=settings.QDRANT_URL,
                prefer_grpc=not is_cloud,  # Use gRPC only for local instances
            )

        mode = "Cloud (REST)" if is_cloud else "Local"
        logger.info(f"Qdrant client initialized [{mode}]. Ensuring collections exist...")
        await _ensure_collection(settings.QDRANT_COLLECTION_CHUNKS)
        await _ensure_collection(settings.QDRANT_COLLECTION_CLAIMS)
        logger.info("Qdrant collections ready.")

    except Exception as e:
        logger.warning(
            f"⚠️  Could not connect to Qdrant at {settings.QDRANT_URL}: {e}\n"
            "   Check your QDRANT_URL and QDRANT_API_KEY in .env\n"
            "   Qdrant Cloud: https://cloud.qdrant.io | Local: docker run -p 6333:6333 qdrant/qdrant"
        )
        _client = None  # Keep the app alive; endpoints will return 503 if Qdrant is needed


async def _ensure_collection(name: str):
    """Create a collection if it does not already exist."""
    client = get_qdrant()
    existing = await client.get_collections()
    existing_names = [c.name for c in existing.collections]

    if name not in existing_names:
        logger.info(f"Creating Qdrant collection: {name}")
        await client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=settings.EMBEDDING_DIMENSION,
                distance=Distance.COSINE,
            ),
        )
    else:
        logger.info(f"Qdrant collection already exists: {name}")
