"""
Upload router — handles PDF and raw text ingestion.
POST /api/v1/upload/pdf
POST /api/v1/upload/text
"""
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form

from app.core.config import settings
from app.models.paper import PaperInDB, PaperStatus, UploadResponse
from app.models.store import save_paper
from app.services.ingestion import run_ingestion_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/upload/pdf", response_model=UploadResponse, summary="Upload a research paper PDF")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF file of the research paper"),
):
    """
    Accept a PDF upload, save it to disk, register the paper as INGESTED,
    and kick off the background ingestion pipeline.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are accepted.")

    # Read and size-check
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    paper_id = str(uuid.uuid4())
    safe_name = f"{paper_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_name

    file_path.write_bytes(content)
    logger.info(f"Saved PDF upload: {file_path}")

    paper = PaperInDB(
        id=paper_id,
        title=file.filename,          # Placeholder — Gemini will extract the real title
        filename=file.filename,
        file_path=str(file_path),
        status=PaperStatus.INGESTED,
    )
    save_paper(paper)

    background_tasks.add_task(run_ingestion_pipeline, paper)

    return UploadResponse(
        paper_id=paper_id,
        filename=file.filename,
        status=PaperStatus.INGESTED,
        message="Paper received. Processing has started in the background. Poll /api/v1/status/{paper_id} for updates.",
    )


@router.post("/upload/text", response_model=UploadResponse, summary="Ingest raw text or JSON")
async def upload_text(
    background_tasks: BackgroundTasks,
    text: str = Form(..., description="Raw text content of the research paper"),
    title: str = Form(default="Untitled Paper"),
):
    """
    Accept raw text (copy-paste), save as a .txt file, and run the standard ingestion pipeline.
    The extractor dispatches on .txt extension and reads it as plain text (no PDF parsing).
    """
    if len(text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Submitted text is too short (minimum 100 characters).")

    paper_id = str(uuid.uuid4())
    filename  = f"{paper_id}_raw.txt"
    file_path = UPLOAD_DIR / filename
    file_path.write_text(text, encoding="utf-8")

    paper = PaperInDB(
        id=paper_id,
        title=title,
        filename=filename,
        file_path=str(file_path),
        status=PaperStatus.INGESTED,
    )
    save_paper(paper)
    background_tasks.add_task(run_ingestion_pipeline, paper)

    return UploadResponse(
        paper_id=paper_id,
        filename=filename,
        status=PaperStatus.INGESTED,
        message="Text received. Processing has started. Poll /api/v1/status/{paper_id} for updates.",
    )
