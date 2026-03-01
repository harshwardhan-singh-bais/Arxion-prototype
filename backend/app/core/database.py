"""
Qdrant database connection and collection management.
Provides a singleton AsyncQdrantClient with lazy initialization.
"""
import logging
import warnings
from fastapi import HTTPException
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams
from app.core.config import settings

logger = logging.getLogger(__name__)

# Singleton async client + last connection error for diagnostics
_client: AsyncQdrantClient | None = None
_last_error: str = ""


def get_qdrant() -> AsyncQdrantClient:
    if _client is None:
        hint = f" (last error: {_last_error})" if _last_error else ""
        raise HTTPException(
            status_code=503,
            detail=(
                f"Qdrant is not connected{hint}. "
                "Check QDRANT_URL and QDRANT_API_KEY in your .env file. "
                "If using Qdrant Cloud, verify the cluster is running at https://cloud.qdrant.io"
            ),
        )
    return _client


def get_qdrant_status() -> dict:
    """Return connection status for health-check endpoint."""
    return {
        "connected": _client is not None,
        "url": settings.QDRANT_URL,
        "error": _last_error or None,
    }


async def init_qdrant():
    """
    Create the Qdrant client and ensure collections exist.
    Called once at app startup (lifespan). Never raises — connection
    failures are logged and endpoints return 503 if Qdrant is needed.
    """
    global _client, _last_error

    try:
        is_cloud = settings.QDRANT_URL.startswith("https://")

        # Suppress qdrant-client version mismatch UserWarning
        # (async client doesn't accept check_version kwarg — use warnings module instead)
        warnings.filterwarnings(
            "ignore",
            message="Qdrant client version.*incompatible",
            category=UserWarning,
        )

        client_kwargs = dict(
            url=settings.QDRANT_URL,
            prefer_grpc=False,   # REST is more reliable through cloud firewalls/NAT
            timeout=15,          # 15s timeout so startup doesn't hang forever
        )
        if settings.QDRANT_API_KEY:
            client_kwargs["api_key"] = settings.QDRANT_API_KEY

        _client = AsyncQdrantClient(**client_kwargs)

        mode = "Cloud (REST)" if is_cloud else "Local"
        logger.info(f"Qdrant client created [{mode}]. Verifying connection...")

        # Probe the server — this is the call that actually hits the network
        await _client.get_collections()

        logger.info("Qdrant connection verified. Ensuring collections exist...")
        await _ensure_collection(settings.QDRANT_COLLECTION_CHUNKS)
        await _ensure_collection(settings.QDRANT_COLLECTION_CLAIMS)
        _last_error = ""
        logger.info("Qdrant ready ✓")

    except Exception as e:
        _last_error = str(e)
        _client = None
        logger.warning(
            f"\n{'='*60}\n"
            f"⚠️  QDRANT CONNECTION FAILED\n"
            f"   URL: {settings.QDRANT_URL}\n"
            f"   Error: {e}\n"
            f"\n"
            f"   HOW TO FIX:\n"
            f"   1. Qdrant Cloud → go to https://cloud.qdrant.io and check:\n"
            f"      • Is your cluster running? (free clusters auto-pause)\n"
            f"      • Is your API key still valid? Regenerate if needed.\n"
            f"   2. Local Docker → run: docker run -p 6333:6333 qdrant/qdrant\n"
            f"      then set QDRANT_URL=http://localhost:6333 in .env\n"
            f"{'='*60}"
        )


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
