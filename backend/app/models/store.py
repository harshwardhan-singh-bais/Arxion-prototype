import json
import logging
from app.models.paper import PaperInDB
from app.core.database_sql import engine
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.sql_models import Paper, User

logger = logging.getLogger(__name__)

async def save_paper(paper: PaperInDB, user_id: str = "00000000-0000-0000-0000-000000000123") -> None:
    log_feature_start(logger, "DATABASE", "save_paper", "Saving paper", paper_id=paper.id, user_id=user_id)
    async with AsyncSession(engine) as db:
        try:
            fallback_email = f"{user_id}@arxion.local"
            effective_user_id = user_id

            if engine.dialect.name == "postgresql":
                # Upsert fallback user so papers.user_id FK is always satisfiable.
                await db.execute(
                    pg_insert(User)
                    .values(id=user_id, clerk_id=user_id, email=fallback_email, name="")
                    .on_conflict_do_nothing()
                )
            else:
                user_result = await db.execute(select(User).where(User.id == user_id))
                user = user_result.scalar_one_or_none()
                if not user:
                    db.add(User(id=user_id, clerk_id=user_id, email=fallback_email, name=""))

            await db.flush()

            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if not user:
                # Handle edge-case where clerk_id conflicts prevent insert of this specific fallback UUID.
                clerk_result = await db.execute(select(User).where(User.clerk_id == user_id))
                clerk_user = clerk_result.scalar_one_or_none()
                if not clerk_user:
                    raise ValueError(f"Unable to resolve user for fallback id {user_id}")
                effective_user_id = clerk_user.id

            new_paper = Paper(
                id=paper.id,
                user_id=effective_user_id,
                title=paper.title,
                file_path=paper.file_path,
                status=paper.status.value if hasattr(paper.status, 'value') else paper.status,
                extracted_data=paper.model_dump()
            )
            db.add(new_paper)
            await db.commit()
            log_feature_success(logger, "DATABASE", "save_paper", "Paper saved", paper_id=paper.id, user_id=effective_user_id)
        except Exception as e:
            await db.rollback()
            log_feature_failure(logger, "DATABASE", "save_paper", "Failed to save paper", error=e, paper_id=paper.id, user_id=user_id)
            raise

async def get_paper(paper_id: str) -> PaperInDB | None:
    log_feature_start(logger, "DATABASE", "get_paper", "Fetching paper", paper_id=paper_id)
    async with AsyncSession(engine) as db:
        try:
            result = await db.execute(select(Paper).where(Paper.id == paper_id))
            p = result.scalar_one_or_none()
            if p and p.extracted_data:
                log_feature_success(logger, "DATABASE", "get_paper", "Paper fetched with extracted data", paper_id=paper_id)
                return PaperInDB(**p.extracted_data)
            if p:
                data = {"id": p.id, "title": p.title, "filename": p.title, "file_path": p.file_path, "status": p.status}
                log_feature_success(logger, "DATABASE", "get_paper", "Paper fetched with fallback payload", paper_id=paper_id)
                return PaperInDB(**data)
            log_feature_failure(logger, "DATABASE", "get_paper", "Paper not found", paper_id=paper_id)
            return None
        except Exception as e:
            log_feature_failure(logger, "DATABASE", "get_paper", "Failed to fetch paper", error=e, paper_id=paper_id)
            raise

async def update_paper(paper: PaperInDB) -> None:
    log_feature_start(logger, "DATABASE", "update_paper", "Updating paper", paper_id=paper.id)
    async with AsyncSession(engine) as db:
        try:
            result = await db.execute(select(Paper).where(Paper.id == paper.id))
            p = result.scalar_one_or_none()
            if p:
                p.title = paper.title
                p.status = paper.status.value if hasattr(paper.status, 'value') else paper.status
                if getattr(paper, "error_message", None):
                    p.error_message = paper.error_message
                p.extracted_data = paper.model_dump()
                await db.commit()
                log_feature_success(logger, "DATABASE", "update_paper", "Paper updated", paper_id=paper.id)
            else:
                await save_paper(paper)
                log_feature_success(logger, "DATABASE", "update_paper", "Paper missing, created via save", paper_id=paper.id)
        except Exception as e:
            await db.rollback()
            log_feature_failure(logger, "DATABASE", "update_paper", "Failed to update paper", error=e, paper_id=paper.id)
            raise

async def list_papers() -> list[PaperInDB]:
    log_feature_start(logger, "DATABASE", "list_papers", "Listing papers")
    async with AsyncSession(engine) as db:
        try:
            result = await db.execute(select(Paper))
            papers = result.scalars().all()
            papers_list = []
            for p in papers:
                if p.extracted_data:
                    papers_list.append(PaperInDB(**p.extracted_data))
                else:
                    data = {"id": p.id, "title": p.title, "filename": p.title, "file_path": p.file_path, "status": p.status}
                    papers_list.append(PaperInDB(**data))
            log_feature_success(logger, "DATABASE", "list_papers", "Papers listed", count=len(papers_list))
            return papers_list
        except Exception as e:
            log_feature_failure(logger, "DATABASE", "list_papers", "Failed to list papers", error=e)
            raise

async def delete_paper(paper_id: str) -> bool:
    log_feature_start(logger, "DATABASE", "delete_paper", "Deleting paper", paper_id=paper_id)
    async with AsyncSession(engine) as db:
        try:
            result = await db.execute(select(Paper).where(Paper.id == paper_id))
            p = result.scalar_one_or_none()
            if p:
                await db.delete(p)
                await db.commit()
                log_feature_success(logger, "DATABASE", "delete_paper", "Paper deleted", paper_id=paper_id)
                return True
            log_feature_failure(logger, "DATABASE", "delete_paper", "Paper not found for delete", paper_id=paper_id)
            return False
        except Exception as e:
            await db.rollback()
            log_feature_failure(logger, "DATABASE", "delete_paper", "Failed to delete paper", error=e, paper_id=paper_id)
            raise
