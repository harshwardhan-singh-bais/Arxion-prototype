"""
Qdrant vector storage service.
Stores chunk and claim embeddings as points with paper_id metadata.
"""
import uuid
import logging
from qdrant_client.models import PointStruct
from app.core.database import get_qdrant
from app.core.gemini import get_embeddings
from app.core.config import settings

logger = logging.getLogger(__name__)


async def store_chunks(paper_id: str, chunks: list[str]) -> None:
    """Embed each chunk and upsert into the chunks collection."""
    import asyncio
    client = get_qdrant()
    points: list[PointStruct] = []

    for i, chunk in enumerate(chunks):
        try:
            print(f"      - Embedding chunk [{i+1}/{len(chunks)}]...")
            embedding = await get_embeddings(chunk)
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "paper_id": paper_id,
                        "chunk_index": i,
                        "text": chunk,
                    },
                )
            )
            # Prevent Google Free Tier 429 RPM limits.
            await asyncio.sleep(1.0)
        except Exception as e:
            print(f"      ❌ ERROR: Failed to embed chunk {i}: {e}")
            logger.error(f"Failed to embed chunk {i} for paper {paper_id}: {e}")

    if points:
        BATCH_SIZE = 50
        print(f"   ✓ Pushing {len(points)} Chunk points natively into Qdrant server in batches...")
        for i in range(0, len(points), BATCH_SIZE):
            batch = points[i:i + BATCH_SIZE]
            await client.upsert(
                collection_name=settings.QDRANT_COLLECTION_CHUNKS,
                points=batch,
                wait=False,
            )
        logger.info(f"Stored {len(points)} chunk vectors for paper {paper_id}.")


async def store_claims(paper_id: str, claims: list[str]) -> None:
    """Embed claim sentences and upsert into the claims collection."""
    client = get_qdrant()
    points: list[PointStruct] = []

    for claim in claims:
        try:
            embedding = await get_embeddings(claim)
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "paper_id": paper_id,
                        "claim": claim,
                    },
                )
            )
        except Exception as e:
            logger.error(f"Failed to embed claim for paper {paper_id}: {e}")

    if points:
        BATCH_SIZE = 50
        for i in range(0, len(points), BATCH_SIZE):
            batch = points[i:i + BATCH_SIZE]
            await client.upsert(
                collection_name=settings.QDRANT_COLLECTION_CLAIMS,
                points=batch,
                wait=False,
            )
        logger.info(f"Stored {len(points)} claim vectors for paper {paper_id}.")


async def search_chunks(query: str, paper_ids: list[str] | None = None, limit: int = 10) -> list[dict]:
    """Semantic search over chunks. Optionally scoped to a list of paper_ids."""
    print(f"\n🔍 [QDRANT DB] Executing Vector Search...")
    print(f"   Target limit: {limit}, Target paper scope: {paper_ids}")
    client = get_qdrant()
    print(f"   Converting query to high-dimensional math vector...")
    query_vector = await get_embeddings(query)

    query_filter = None
    if paper_ids:
        from qdrant_client.models import Filter, FieldCondition, MatchAny
        query_filter = Filter(
            must=[FieldCondition(key="paper_id", match=MatchAny(any=paper_ids))]
        )

    results = await client.query_points(
        collection_name=settings.QDRANT_COLLECTION_CHUNKS,
        query=query_vector,
        query_filter=query_filter,
        limit=limit,
        with_payload=True,
    )

    return [
        {
            "score": r.score,
            "paper_id": r.payload.get("paper_id"),
            "chunk_index": r.payload.get("chunk_index"),
            "text": r.payload.get("text"),
        }
        for r in results.points
    ]


async def delete_paper_vectors(paper_id: str) -> None:
    """Remove all stored vectors for a paper (for cleanup or re-processing)."""
    client = get_qdrant()
    from qdrant_client.models import Filter, FieldCondition, MatchValue

    filt = Filter(must=[FieldCondition(key="paper_id", match=MatchValue(value=paper_id))])
    await client.delete(collection_name=settings.QDRANT_COLLECTION_CHUNKS, points_selector=filt)
    await client.delete(collection_name=settings.QDRANT_COLLECTION_CLAIMS, points_selector=filt)
    logger.info(f"Deleted all vectors for paper {paper_id}.")
