"""
Profile router — user profile CRUD scoped to Clerk user ID.
GET  /api/v1/profile
PUT  /api/v1/profile
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id
from app.core.database_sql import get_db
from app.models.sql_models import UserProfile, PaperRecord, GapRecord

router = APIRouter()


class ProfileResponse(BaseModel):
    clerk_user_id: str
    display_name: str
    papers_count: int = 0
    processed_count: int = 0
    gaps_count: int = 0


class ProfileUpdate(BaseModel):
    display_name: str


@router.get("/profile", response_model=ProfileResponse, summary="Get current user profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserProfile).where(UserProfile.clerk_user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(clerk_user_id=user_id, display_name="")
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    # Count papers
    papers_result = await db.execute(
        select(PaperRecord).where(PaperRecord.clerk_user_id == user_id)
    )
    papers = papers_result.scalars().all()
    papers_count = len(papers)
    processed_count = sum(1 for p in papers if p.status == "PROCESSED")

    # Count gaps
    gaps_result = await db.execute(
        select(GapRecord).where(GapRecord.clerk_user_id == user_id)
    )
    gaps_count = len(gaps_result.scalars().all())

    return ProfileResponse(
        clerk_user_id=profile.clerk_user_id,
        display_name=profile.display_name,
        papers_count=papers_count,
        processed_count=processed_count,
        gaps_count=gaps_count,
    )


@router.put("/profile", response_model=ProfileResponse, summary="Update profile display name")
async def update_profile(
    data: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserProfile).where(UserProfile.clerk_user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(clerk_user_id=user_id, display_name=data.display_name)
        db.add(profile)
    else:
        profile.display_name = data.display_name

    await db.commit()
    await db.refresh(profile)

    return ProfileResponse(
        clerk_user_id=profile.clerk_user_id,
        display_name=profile.display_name,
    )
