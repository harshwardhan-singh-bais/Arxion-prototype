"""
Papers router — fetch, edit, delete, and re-analyze extracted paper data.
"""
import logging
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from app.models.paper import PaperResponse, PaperStatus
from app.models.store import get_paper, list_papers, delete_paper, update_paper
from app.services.vector_store import delete_paper_vectors
from app.services.ingestion import run_ingestion_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()


class PaperEditRequest(BaseModel):
    title: str | None = None
    authors: list[str] | None = None
    tags: list[str] | None = None
    abstract: str | None = None
    year: int | None = None


@router.get("/papers", response_model=list[PaperResponse], summary="List all ingested papers")
async def get_all_papers(
    status: PaperStatus | None = Query(default=None, description="Filter by processing status"),
    tag: str | None = Query(default=None, description="Filter by topic tag"),
):
    papers = list_papers()

    if status:
        papers = [p for p in papers if p.status == status]
    if tag:
        papers = [p for p in papers if tag.lower() in [t.lower() for t in p.tags]]

    return papers


@router.get("/papers/{paper_id}", response_model=PaperResponse, summary="Get a single paper by ID")
async def get_paper_by_id(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return paper


@router.put("/papers/{paper_id}", response_model=PaperResponse, summary="Edit paper metadata")
async def edit_paper(paper_id: str, data: PaperEditRequest):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if data.title is not None:
        paper.title = data.title
    if data.authors is not None:
        paper.authors = data.authors
    if data.tags is not None:
        paper.tags = data.tags
    if data.abstract is not None:
        paper.abstract = data.abstract
    if data.year is not None:
        paper.year = data.year

    update_paper(paper)
    return paper


@router.post("/papers/{paper_id}/reanalyze", summary="Re-analyze a paper")
async def reanalyze_paper(paper_id: str, background_tasks: BackgroundTasks):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.file_path:
        raise HTTPException(status_code=400, detail="No file associated with this paper.")

    # Delete old vectors and re-process
    await delete_paper_vectors(paper_id)
    paper.status = PaperStatus.INGESTED
    paper.error_message = None
    update_paper(paper)

    background_tasks.add_task(run_ingestion_pipeline, paper)

    return {"message": f"Re-analysis started for paper {paper_id}. Poll /api/v1/status/{paper_id} for updates."}


@router.delete("/papers/{paper_id}", summary="Delete a paper and its vectors")
async def delete_paper_by_id(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    await delete_paper_vectors(paper_id)
    delete_paper(paper_id)
    return {"message": f"Paper {paper_id} and all associated vectors have been deleted."}
