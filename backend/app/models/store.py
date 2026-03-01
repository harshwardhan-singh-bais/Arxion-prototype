import json
import logging
from app.models.paper import PaperInDB
from app.core.database_sql import engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sql_models import Paper

logger = logging.getLogger(__name__)

async def save_paper(paper: PaperInDB, user_id: str = "00000000-0000-0000-0000-000000000123") -> None:
    async with AsyncSession(engine) as db:
        new_paper = Paper(
            id=paper.id,
            user_id=user_id,
            title=paper.title,
            file_path=paper.file_path,
            status=paper.status.value if hasattr(paper.status, 'value') else paper.status,
            extracted_data=paper.model_dump()
        )
        db.add(new_paper)
        await db.commit()

async def get_paper(paper_id: str) -> PaperInDB | None:
    async with AsyncSession(engine) as db:
        result = await db.execute(select(Paper).where(Paper.id == paper_id))
        p = result.scalar_one_or_none()
        if p and p.extracted_data:
            return PaperInDB(**p.extracted_data)
        elif p:
            data = {"id": p.id, "title": p.title, "filename": p.title, "file_path": p.file_path, "status": p.status}
            return PaperInDB(**data)
        return None

async def update_paper(paper: PaperInDB) -> None:
    async with AsyncSession(engine) as db:
        result = await db.execute(select(Paper).where(Paper.id == paper.id))
        p = result.scalar_one_or_none()
        if p:
            p.title = paper.title
            p.status = paper.status.value if hasattr(paper.status, 'value') else paper.status
            if getattr(paper, "error_message", None):
                p.error_message = paper.error_message
            p.extracted_data = paper.model_dump()
            await db.commit()
        else:
            await save_paper(paper)

async def list_papers() -> list[PaperInDB]:
    async with AsyncSession(engine) as db:
        result = await db.execute(select(Paper))
        papers = result.scalars().all()
        papers_list = []
        for p in papers:
            if p.extracted_data:
                papers_list.append(PaperInDB(**p.extracted_data))
            else:
                data = {"id": p.id, "title": p.title, "filename": p.title, "file_path": p.file_path, "status": p.status}
                papers_list.append(PaperInDB(**data))
        return papers_list

async def delete_paper(paper_id: str) -> bool:
    async with AsyncSession(engine) as db:
        result = await db.execute(select(Paper).where(Paper.id == paper_id))
        p = result.scalar_one_or_none()
        if p:
            await db.delete(p)
            await db.commit()
            return True
        return False
