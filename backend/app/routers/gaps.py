"""
Gaps router — CRUD for research gaps.
GET    /api/v1/gaps
POST   /api/v1/gaps
PUT    /api/v1/gaps/{gap_id}
DELETE /api/v1/gaps/{gap_id}
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import String, cast, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id
from app.core.database_sql import get_db
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
from app.models.sql_models import Gap, User

router = APIRouter()
logger = logging.getLogger(__name__)


class GapCreate(BaseModel):
    title: str
    description: str = ""
    linked_paper_ids: list[str] = []


class GapUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    linked_paper_ids: list[str] | None = None


class GapResponse(BaseModel):
    id: str
    title: str
    description: str
    linked_paper_ids: list[str]
    created_at: str
    updated_at: str


def _to_response(gap: Gap) -> GapResponse:
    return GapResponse(
        id=gap.id,
        title=gap.title,
        description=gap.description,
        linked_paper_ids=gap.linked_paper_ids or [],
        created_at=gap.created_at.isoformat() if gap.created_at else "",
        updated_at=gap.created_at.isoformat() if gap.created_at else "",
    )


def _eq_id(column, value: str):
    # Cast to text so comparisons work across mixed UUID/varchar legacy schemas.
    return cast(column, String) == str(value)


async def _ensure_user_exists(db: AsyncSession, user_id: str) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
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


@router.get("/gaps", response_model=list[GapResponse], summary="List all gaps")
async def list_gaps(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log_feature_start(logger, "GAPS", "list", "Listing gaps", user_id=user_id)
    await _ensure_user_exists(db, user_id)

    result = await db.execute(
        select(Gap).where(_eq_id(Gap.user_id, user_id)).order_by(Gap.created_at.desc())
    )
    rows = [_to_response(g) for g in result.scalars().all()]
    log_feature_success(logger, "GAPS", "list", "Gaps listed", user_id=user_id, count=len(rows))
    return rows


@router.post("/gaps", response_model=GapResponse, summary="Create a gap")
async def create_gap(
    data: GapCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log_feature_start(logger, "GAPS", "create", "Creating gap", user_id=user_id, title=data.title)
    await _ensure_user_exists(db, user_id)

    gap = Gap(
        user_id=user_id,
        title=data.title,
        description=data.description,
        linked_paper_ids=data.linked_paper_ids,
    )
    db.add(gap)
    await db.commit()
    await db.refresh(gap)
    log_feature_success(logger, "GAPS", "create", "Gap created", user_id=user_id, gap_id=gap.id)
    return _to_response(gap)


@router.put("/gaps/{gap_id}", response_model=GapResponse, summary="Update a gap")
async def update_gap(
    gap_id: str,
    data: GapUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log_feature_start(logger, "GAPS", "update", "Updating gap", user_id=user_id, gap_id=gap_id)
    await _ensure_user_exists(db, user_id)

    result = await db.execute(
        select(Gap).where(_eq_id(Gap.id, gap_id), _eq_id(Gap.user_id, user_id))
    )
    gap = result.scalar_one_or_none()
    if not gap:
        log_feature_failure(logger, "GAPS", "update", "Gap not found for update", user_id=user_id, gap_id=gap_id)
        raise HTTPException(status_code=404, detail="Gap not found")

    if data.title is not None:
        gap.title = data.title
    if data.description is not None:
        gap.description = data.description
    if data.linked_paper_ids is not None:
        gap.linked_paper_ids = data.linked_paper_ids

    await db.commit()
    await db.refresh(gap)
    log_feature_success(logger, "GAPS", "update", "Gap updated", user_id=user_id, gap_id=gap_id)
    return _to_response(gap)


@router.delete("/gaps/{gap_id}", summary="Delete a gap")
async def delete_gap(
    gap_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log_feature_start(logger, "GAPS", "delete", "Deleting gap", user_id=user_id, gap_id=gap_id)
    await _ensure_user_exists(db, user_id)

    result = await db.execute(
        select(Gap).where(_eq_id(Gap.id, gap_id), _eq_id(Gap.user_id, user_id))
    )
    gap = result.scalar_one_or_none()
    if not gap:
        log_feature_failure(logger, "GAPS", "delete", "Gap not found for delete", user_id=user_id, gap_id=gap_id)
        raise HTTPException(status_code=404, detail="Gap not found")

    await db.delete(gap)
    await db.commit()
    log_feature_success(logger, "GAPS", "delete", "Gap deleted", user_id=user_id, gap_id=gap_id)
    return {"message": f"Gap {gap_id} deleted."}
