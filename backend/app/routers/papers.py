"""
Papers router — fetch, edit, delete, and re-analyze extracted paper data.
"""
import logging
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
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
    log_feature_start(logger, "PAPERS", "list", "Listing papers", status_filter=status.value if status else None, tag_filter=tag)
    papers = await list_papers()

    if status:
        papers = [p for p in papers if p.status == status]
    if tag:
        papers = [p for p in papers if tag.lower() in [t.lower() for t in p.tags]]

    log_feature_success(logger, "PAPERS", "list", "Papers listed", count=len(papers))
    return papers


@router.get("/papers/{paper_id}", response_model=PaperResponse, summary="Get a single paper by ID")
async def get_paper_by_id(paper_id: str):
    log_feature_start(logger, "PAPERS", "get", "Fetching paper by id", paper_id=paper_id)
    paper = await get_paper(paper_id)
    if not paper:
        log_feature_failure(logger, "PAPERS", "get", "Paper not found", paper_id=paper_id)
        raise HTTPException(status_code=404, detail="Paper not found.")
    log_feature_success(logger, "PAPERS", "get", "Paper fetched", paper_id=paper_id)
    return paper


@router.put("/papers/{paper_id}", response_model=PaperResponse, summary="Edit paper metadata")
async def edit_paper(paper_id: str, data: PaperEditRequest):
    log_feature_start(logger, "PAPERS", "edit", "Editing paper metadata", paper_id=paper_id)
    paper = await get_paper(paper_id)
    if not paper:
        log_feature_failure(logger, "PAPERS", "edit", "Paper not found for edit", paper_id=paper_id)
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

    await update_paper(paper)
    log_feature_success(logger, "PAPERS", "edit", "Paper metadata updated", paper_id=paper_id)
    return paper


@router.post("/papers/{paper_id}/reanalyze", summary="Re-analyze a paper")
async def reanalyze_paper(paper_id: str, background_tasks: BackgroundTasks):
    log_feature_start(logger, "PAPERS", "reanalyze", "Reanalysis requested", paper_id=paper_id)
    paper = await get_paper(paper_id)
    if not paper:
        log_feature_failure(logger, "PAPERS", "reanalyze", "Paper not found for reanalysis", paper_id=paper_id)
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.file_path:
        log_feature_failure(logger, "PAPERS", "reanalyze", "Paper has no associated file", paper_id=paper_id)
        raise HTTPException(status_code=400, detail="No file associated with this paper.")

    # Delete old vectors and re-process
    await delete_paper_vectors(paper_id)
    paper.status = PaperStatus.INGESTED
    paper.error_message = None
    await update_paper(paper)

    background_tasks.add_task(run_ingestion_pipeline, paper)
    log_feature_success(logger, "PAPERS", "reanalyze", "Reanalysis queued", paper_id=paper_id)

    return {"message": f"Re-analysis started for paper {paper_id}. Poll /api/v1/status/{paper_id} for updates."}


@router.delete("/papers/{paper_id}", summary="Delete a paper and its vectors")
async def delete_paper_by_id(paper_id: str):
    log_feature_start(logger, "PAPERS", "delete", "Delete requested", paper_id=paper_id)
    paper = await get_paper(paper_id)
    if not paper:
        log_feature_failure(logger, "PAPERS", "delete", "Paper not found for delete", paper_id=paper_id)
        raise HTTPException(status_code=404, detail="Paper not found.")

    await delete_paper_vectors(paper_id)
    await delete_paper(paper_id)
    log_feature_success(logger, "PAPERS", "delete", "Paper and vectors deleted", paper_id=paper_id)
    return {"message": f"Paper {paper_id} and all associated vectors have been deleted."}
