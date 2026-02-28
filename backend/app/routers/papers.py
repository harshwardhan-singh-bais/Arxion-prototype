"""
Papers router — fetch extracted paper data.
GET /api/v1/papers
GET /api/v1/papers/{paper_id}
DELETE /api/v1/papers/{paper_id}
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from app.models.paper import PaperResponse, PaperStatus
from app.models.store import get_paper, list_papers, delete_paper
from app.services.vector_store import delete_paper_vectors

logger = logging.getLogger(__name__)
router = APIRouter()


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


@router.delete("/papers/{paper_id}", summary="Delete a paper and its vectors")
async def delete_paper_by_id(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    await delete_paper_vectors(paper_id)
    delete_paper(paper_id)
    return {"message": f"Paper {paper_id} and all associated vectors have been deleted."}
