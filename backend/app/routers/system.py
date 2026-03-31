from __future__ import annotations

import inspect
import logging
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Awaitable, Callable

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import String, cast, delete, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id
from app.core.database_sql import get_db
from app.core.feature_logging import log_feature_failure, log_feature_start, log_feature_success
from app.core.realtime import list_events, subscribe, unsubscribe
from app.models.sql_models import Collection, CollectionPaper, SavedQuery, User
from app.services.vector_store import search_chunks


router = APIRouter()
logger = logging.getLogger(__name__)


def _feature_endpoint(step: str) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    def decorator(fn: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            log_feature_start(logger, "SYSTEM", step, "Request started")
            try:
                result = await fn(*args, **kwargs)
                log_feature_success(logger, "SYSTEM", step, "Request completed")
                return result
            except HTTPException as e:
                log_feature_failure(logger, "SYSTEM", step, "Request failed with HTTP exception", error=f"{e.status_code}:{e.detail}")
                raise
            except Exception as e:
                log_feature_failure(logger, "SYSTEM", step, "Request failed", error=e)
                raise

        wrapper.__signature__ = inspect.signature(fn)
        return wrapper

    return decorator


class FeatureItem(BaseModel):
    key: str
    title: str
    layer: str
    category: str
    enabled: bool


class CollectionCreate(BaseModel):
    name: str
    description: str | None = ""


class CollectionOut(BaseModel):
    id: str
    name: str
    description: str
    papers_count: int
    created_at: str


class AddPaperToCollection(BaseModel):
    paper_id: str


class SavedQueryCreate(BaseModel):
    name: str
    query_text: str
    paper_ids: list[str] | None = None


class SavedQueryOut(BaseModel):
    id: str
    name: str
    query_text: str
    paper_ids: list[str]
    created_at: str


async def _ensure_user_exists(db: AsyncSession, user_id: str) -> None:
    row = await db.execute(select(User).where(User.id == user_id))
    user = row.scalar_one_or_none()
    if user is None:
        fallback_email = f"{user_id}@arxion.local"
        if db.bind is not None and db.bind.dialect.name == "postgresql":
            await db.execute(
                pg_insert(User)
                .values(id=user_id, clerk_id=user_id, email=fallback_email, name="")
                .on_conflict_do_nothing()
            )
        else:
            db.add(User(id=user_id, clerk_id=user_id, email=fallback_email, name=""))
        await db.commit()


def _eq_id(column: Any, value: str):
    # Cast to text so comparisons work across mixed UUID/varchar legacy schemas.
    return cast(column, String) == str(value)


@router.get("/features", response_model=list[FeatureItem])
@_feature_endpoint("get_features")
async def get_features():
    features = [
        ("layer1.ingestion", "Paper Ingestion", "layer1", "core"),
        ("layer1.processing", "Processing Pipeline", "layer1", "core"),
        ("layer1.embedding", "Semantic Embedding", "layer1", "core"),
        ("layer1.extraction", "Structured Extraction", "layer1", "core"),
        ("layer1.rag", "RAG Chat", "layer1", "core"),
        ("layer1.matrix", "Literature Matrix", "layer1", "core"),
        ("layer1.graph", "Knowledge Graph", "layer1", "core"),
        ("layer1.paper_detail", "Paper Detail", "layer1", "core"),
        ("layer1.export", "Export Engine", "layer1", "core"),
        ("layer2.understanding", "Understanding Modules", "layer2", "understanding"),
        ("layer2.evaluation", "Evaluation Modules", "layer2", "evaluation"),
        ("layer2.cross_paper", "Cross-Paper Intelligence", "layer2", "cross-paper"),
        ("layer2.action", "Action/Build Modules", "layer2", "action"),
        ("layer2.productivity", "Productivity Modules", "layer2", "productivity"),
        ("layer2.exploration", "Exploration Modules", "layer2", "exploration"),
        ("system.workspace", "User Workspace", "system", "platform"),
        ("system.realtime", "Real-time Processing Feed", "system", "platform"),
        ("system.plugin_arch", "Plugin Architecture", "system", "platform"),
    ]
    return [FeatureItem(key=f[0], title=f[1], layer=f[2], category=f[3], enabled=True) for f in features]


@router.get("/workspace/collections", response_model=list[CollectionOut])
@_feature_endpoint("list_collections")
async def list_collections(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user_exists(db, user_id)
    rows = await db.execute(select(Collection).where(_eq_id(Collection.user_id, user_id)).order_by(Collection.created_at.desc()))
    collections = rows.scalars().all()

    output: list[CollectionOut] = []
    for c in collections:
        count_result = await db.execute(select(CollectionPaper).where(_eq_id(CollectionPaper.collection_id, c.id)))
        papers_count = len(count_result.scalars().all())
        output.append(
            CollectionOut(
                id=c.id,
                name=c.name,
                description=c.description or "",
                papers_count=papers_count,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
        )
    return output


@router.post("/workspace/collections", response_model=CollectionOut)
@_feature_endpoint("create_collection")
async def create_collection(
    data: CollectionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user_exists(db, user_id)
    collection_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    await db.execute(
        text(
            """
            INSERT INTO collections (id, user_id, name, description, created_at)
            VALUES (:id, :user_id, :name, :description, :created_at)
            """
        ),
        {
            "id": collection_id,
            "user_id": user_id,
            "name": data.name,
            "description": data.description or "",
            "created_at": created_at,
        },
    )
    await db.commit()
    return CollectionOut(
        id=collection_id,
        name=data.name,
        description=data.description or "",
        papers_count=0,
        created_at=created_at.isoformat(),
    )


@router.post("/workspace/collections/{collection_id}/papers")
@_feature_endpoint("add_paper_to_collection")
async def add_paper_to_collection(
    collection_id: str,
    data: AddPaperToCollection,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(select(Collection).where(_eq_id(Collection.id, collection_id), _eq_id(Collection.user_id, user_id)))
    collection = row.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    existing = await db.execute(
        select(CollectionPaper).where(
            _eq_id(CollectionPaper.collection_id, collection_id),
            _eq_id(CollectionPaper.paper_id, data.paper_id),
        )
    )
    if existing.scalar_one_or_none() is None:
        await db.execute(
            text(
                """
                INSERT INTO collection_papers (collection_id, paper_id, created_at)
                VALUES (:collection_id, :paper_id, :created_at)
                """
            ),
            {
                "collection_id": collection_id,
                "paper_id": data.paper_id,
                "created_at": datetime.now(timezone.utc),
            },
        )
        await db.commit()

    return {"message": "Paper added to collection"}


@router.get("/workspace/collections/{collection_id}")
@_feature_endpoint("get_collection_details")
async def get_collection_details(
    collection_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(select(Collection).where(_eq_id(Collection.id, collection_id), _eq_id(Collection.user_id, user_id)))
    collection = row.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    links = await db.execute(select(CollectionPaper).where(_eq_id(CollectionPaper.collection_id, collection_id)))
    paper_ids = [r.paper_id for r in links.scalars().all()]
    return {
        "id": collection.id,
        "name": collection.name,
        "description": collection.description or "",
        "paper_ids": paper_ids,
        "created_at": collection.created_at.isoformat() if collection.created_at else "",
    }


@router.delete("/workspace/collections/{collection_id}")
@_feature_endpoint("delete_collection")
async def delete_collection(
    collection_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(select(Collection).where(_eq_id(Collection.id, collection_id), _eq_id(Collection.user_id, user_id)))
    collection = row.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    await db.execute(delete(CollectionPaper).where(_eq_id(CollectionPaper.collection_id, collection_id)))
    await db.delete(collection)
    await db.commit()
    return {"message": "Collection deleted"}


@router.delete("/workspace/collections/{collection_id}/papers/{paper_id}")
@_feature_endpoint("remove_paper_from_collection")
async def remove_paper_from_collection(
    collection_id: str,
    paper_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(select(Collection).where(_eq_id(Collection.id, collection_id), _eq_id(Collection.user_id, user_id)))
    if row.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    await db.execute(
        delete(CollectionPaper).where(
            _eq_id(CollectionPaper.collection_id, collection_id),
            _eq_id(CollectionPaper.paper_id, paper_id),
        )
    )
    await db.commit()
    return {"message": "Paper removed from collection"}


@router.get("/workspace/queries", response_model=list[SavedQueryOut])
@_feature_endpoint("list_saved_queries")
async def list_saved_queries(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user_exists(db, user_id)
    rows = await db.execute(select(SavedQuery).where(_eq_id(SavedQuery.user_id, user_id)).order_by(SavedQuery.created_at.desc()))
    queries = rows.scalars().all()
    return [
        SavedQueryOut(
            id=q.id,
            name=q.name,
            query_text=q.query_text,
            paper_ids=q.paper_ids or [],
            created_at=q.created_at.isoformat() if q.created_at else "",
        )
        for q in queries
    ]


@router.post("/workspace/queries", response_model=SavedQueryOut)
@_feature_endpoint("create_saved_query")
async def create_saved_query(
    data: SavedQueryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user_exists(db, user_id)
    query_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    await db.execute(
        text(
            """
            INSERT INTO saved_queries (id, user_id, name, query_text, paper_ids, created_at)
            VALUES (:id, :user_id, :name, :query_text, :paper_ids, :created_at)
            """
        ),
        {
            "id": query_id,
            "user_id": user_id,
            "name": data.name,
            "query_text": data.query_text,
            "paper_ids": data.paper_ids or [],
            "created_at": created_at,
        },
    )
    await db.commit()
    return SavedQueryOut(
        id=query_id,
        name=data.name,
        query_text=data.query_text,
        paper_ids=data.paper_ids or [],
        created_at=created_at.isoformat(),
    )


@router.delete("/workspace/queries/{query_id}")
@_feature_endpoint("delete_saved_query")
async def delete_saved_query(
    query_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(select(SavedQuery).where(_eq_id(SavedQuery.id, query_id), _eq_id(SavedQuery.user_id, user_id)))
    query = row.scalar_one_or_none()
    if not query:
        raise HTTPException(status_code=404, detail="Saved query not found")
    await db.delete(query)
    await db.commit()
    return {"message": "Saved query deleted"}


@router.post("/workspace/queries/{query_id}/run")
@_feature_endpoint("run_saved_query")
async def run_saved_query(
    query_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(select(SavedQuery).where(_eq_id(SavedQuery.id, query_id), _eq_id(SavedQuery.user_id, user_id)))
    query = row.scalar_one_or_none()
    if not query:
        raise HTTPException(status_code=404, detail="Saved query not found")

    hits = await search_chunks(query.query_text, paper_ids=query.paper_ids or None, limit=10)
    return {
        "query": query.query_text,
        "paper_ids": query.paper_ids or [],
        "result_count": len(hits),
        "results": hits,
    }


@router.get("/processing/events")
@_feature_endpoint("get_processing_events")
async def get_processing_events(
    paper_id: str | None = None,
    limit: int = Query(default=200, ge=1, le=1000),
):
    return {"events": list_events(paper_id=paper_id, limit=limit)}


@router.websocket("/processing/stream")
async def processing_stream(websocket: WebSocket, paper_id: str | None = None):
    log_feature_start(logger, "SYSTEM", "processing_stream", "WebSocket stream start", paper_id=paper_id)
    key = await subscribe(websocket, paper_id=paper_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        log_feature_success(logger, "SYSTEM", "processing_stream", "WebSocket disconnected", paper_id=paper_id)
        await unsubscribe(websocket, key)
    except Exception:
        log_feature_failure(logger, "SYSTEM", "processing_stream", "WebSocket stream failed", paper_id=paper_id)
        await unsubscribe(websocket, key)
