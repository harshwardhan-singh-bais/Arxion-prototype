"""
Profile router — user profile CRUD scoped to Clerk user ID.
GET  /api/v1/profile
PUT  /api/v1/profile
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id
from app.core.database_sql import get_db
from app.core.feature_logging import log_feature_start, log_feature_success
from app.models.sql_models import User, Paper, Gap

router = APIRouter()
logger = logging.getLogger(__name__)


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
    log_feature_start(logger, "PROFILE", "get", "Fetching profile", user_id=user_id)
    result = await db.execute(select(User).where(User.clerk_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = User(id=user_id, clerk_id=user_id, name="")
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    # Count papers
    papers_result = await db.execute(
        select(Paper).where(Paper.user_id == profile.id)
    )
    papers = papers_result.scalars().all()
    papers_count = len(papers)
    processed_count = sum(1 for p in papers if p.status == "PROCESSED")

    # Count gaps
    gaps_result = await db.execute(
        select(Gap).where(Gap.user_id == profile.id)
    )
    gaps_count = len(gaps_result.scalars().all())

    response = ProfileResponse(
        clerk_user_id=profile.clerk_id,
        display_name=profile.name,
        papers_count=papers_count,
        processed_count=processed_count,
        gaps_count=gaps_count,
    )
    log_feature_success(logger, "PROFILE", "get", "Profile fetched", user_id=user_id, papers_count=papers_count, processed_count=processed_count, gaps_count=gaps_count)
    return response


@router.put("/profile", response_model=ProfileResponse, summary="Update profile display name")
async def update_profile(
    data: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log_feature_start(logger, "PROFILE", "update", "Updating profile", user_id=user_id)
    result = await db.execute(select(User).where(User.clerk_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = User(id=user_id, clerk_id=user_id, name=data.display_name)
        db.add(profile)
    else:
        profile.name = data.display_name

    await db.commit()
    await db.refresh(profile)

    response = ProfileResponse(
        clerk_user_id=profile.clerk_id,
        display_name=profile.name,
    )
    log_feature_success(logger, "PROFILE", "update", "Profile updated", user_id=user_id)
    return response
