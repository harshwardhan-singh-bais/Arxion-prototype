"""
Status polling router — lightweight endpoint for the frontend to poll.
GET /api/v1/status/{paper_id}
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
from app.models.paper import PaperStatus
from app.models.store import get_paper

router = APIRouter()
logger = logging.getLogger(__name__)


class StatusResponse(BaseModel):
    paper_id: str
    status: PaperStatus
    title: str | None
    error_message: str | None


@router.get("/status/{paper_id}", response_model=StatusResponse, summary="Poll processing status for a paper")
async def get_status(paper_id: str):
    log_feature_start(logger, "STATUS", "poll", "Polling paper status", paper_id=paper_id)
    paper = await get_paper(paper_id)
    if not paper:
        log_feature_failure(logger, "STATUS", "poll", "Paper not found during status poll", paper_id=paper_id)
        raise HTTPException(status_code=404, detail="Paper not found.")
    log_feature_success(logger, "STATUS", "poll", "Paper status returned", paper_id=paper.id, status=paper.status.value)
    return StatusResponse(
        paper_id=paper.id,
        status=paper.status,
        title=paper.title,
        error_message=paper.error_message,
    )
