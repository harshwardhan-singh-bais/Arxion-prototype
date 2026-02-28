"""
Status polling router — lightweight endpoint for the frontend to poll.
GET /api/v1/status/{paper_id}
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.paper import PaperStatus
from app.models.store import get_paper

router = APIRouter()


class StatusResponse(BaseModel):
    paper_id: str
    status: PaperStatus
    title: str | None
    error_message: str | None


@router.get("/status/{paper_id}", response_model=StatusResponse, summary="Poll processing status for a paper")
async def get_status(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return StatusResponse(
        paper_id=paper.id,
        status=paper.status,
        title=paper.title,
        error_message=paper.error_message,
    )
