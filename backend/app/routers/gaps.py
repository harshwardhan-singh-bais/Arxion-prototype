"""
Gaps router — CRUD for research gaps.
GET    /api/v1/gaps
POST   /api/v1/gaps
PUT    /api/v1/gaps/{gap_id}
DELETE /api/v1/gaps/{gap_id}
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id
from app.core.database_sql import get_db
from app.models.sql_models import Gap

router = APIRouter()


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


@router.get("/gaps", response_model=list[GapResponse], summary="List all gaps")
async def list_gaps(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import uuid
    try:
        user_param = uuid.UUID(user_id)
    except:
        user_param = str(user_id)
        
    result = await db.execute(
        select(Gap).where(Gap.user_id == user_param).order_by(Gap.created_at.desc())
    )
    return [_to_response(g) for g in result.scalars().all()]


@router.post("/gaps", response_model=GapResponse, summary="Create a gap")
async def create_gap(
    data: GapCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    gap = Gap(
        user_id=user_id,
        title=data.title,
        description=data.description,
        linked_paper_ids=data.linked_paper_ids,
    )
    db.add(gap)
    await db.commit()
    await db.refresh(gap)
    return _to_response(gap)


@router.put("/gaps/{gap_id}", response_model=GapResponse, summary="Update a gap")
async def update_gap(
    gap_id: str,
    data: GapUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import uuid
    try:
        user_param = uuid.UUID(user_id)
    except:
        user_param = str(user_id)

    result = await db.execute(
        select(Gap).where(Gap.id == gap_id, Gap.user_id == user_param)
    )
    gap = result.scalar_one_or_none()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")

    if data.title is not None:
        gap.title = data.title
    if data.description is not None:
        gap.description = data.description
    if data.linked_paper_ids is not None:
        gap.linked_paper_ids = data.linked_paper_ids

    await db.commit()
    await db.refresh(gap)
    return _to_response(gap)


@router.delete("/gaps/{gap_id}", summary="Delete a gap")
async def delete_gap(
    gap_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import uuid
    try:
        user_param = uuid.UUID(user_id)
    except:
        user_param = str(user_id)

    result = await db.execute(
        select(Gap).where(Gap.id == gap_id, Gap.user_id == user_param)
    )
    gap = result.scalar_one_or_none()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")

    await db.delete(gap)
    await db.commit()
    return {"message": f"Gap {gap_id} deleted."}
