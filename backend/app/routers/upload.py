"""
Upload router — handles PDF and raw text ingestion.
POST /api/v1/upload/pdf
POST /api/v1/upload/pdfs    (multi-file)
POST /api/v1/upload/text
"""
import uuid
import logging
from pathlib import Path
from typing import List
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
        title=file.filename,
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


@router.post("/upload/pdfs", response_model=List[UploadResponse], summary="Upload multiple research paper PDFs")
async def upload_multiple_pdfs(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="One or more PDF files"),
):
    """
    Accept multiple PDFs, save each to disk, register them as INGESTED,
    and kick off independent background pipelines.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    responses: List[UploadResponse] = []

    for file in files:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            responses.append(UploadResponse(
                paper_id="",
                filename=file.filename or "unknown",
                status=PaperStatus.FAILED,
                message=f"Skipped: '{file.filename}' is not a .pdf file.",
            ))
            continue

        content = await file.read()
        if len(content) > MAX_BYTES:
            responses.append(UploadResponse(
                paper_id="",
                filename=file.filename,
                status=PaperStatus.FAILED,
                message=f"Skipped: exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
            ))
            continue

        paper_id = str(uuid.uuid4())
        safe_name = f"{paper_id}_{file.filename}"
        file_path = UPLOAD_DIR / safe_name

        file_path.write_bytes(content)
        logger.info(f"Saved multi-PDF upload: {file_path}")

        paper = PaperInDB(
            id=paper_id,
            title=file.filename,
            filename=file.filename,
            file_path=str(file_path),
            status=PaperStatus.INGESTED,
        )
        save_paper(paper)

        background_tasks.add_task(run_ingestion_pipeline, paper)

        responses.append(UploadResponse(
            paper_id=paper_id,
            filename=file.filename,
            status=PaperStatus.INGESTED,
            message=f"Paper received. Processing started.",
        ))

    return responses


@router.post("/upload/text", response_model=UploadResponse, summary="Ingest raw text or JSON")
async def upload_text(
    background_tasks: BackgroundTasks,
    text: str = Form(..., description="Raw text content of the research paper"),
    title: str = Form(default="Untitled Paper"),
):
    """
    Accept raw text (copy-paste or JSON body), register as INGESTED,
    and kick off the background pipeline.
    """
    if len(text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Submitted text is too short.")

    paper_id = str(uuid.uuid4())
    filename = f"{paper_id}_raw.txt"
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

    async def _text_pipeline(p: PaperInDB):
        from app.models.paper import PaperStatus
        from app.models.store import update_paper
        from app.services.ingestion import run_ingestion_pipeline
        from app.services.extractor import extract_text_from_pdf

        import app.services.ingestion as ing
        original_fn = ing.extract_text_from_pdf

        def read_text_file(path):
            return Path(path).read_text(encoding="utf-8")

        ing.extract_text_from_pdf = read_text_file
        await run_ingestion_pipeline(p)
        ing.extract_text_from_pdf = original_fn

    background_tasks.add_task(_text_pipeline, paper)

    return UploadResponse(
        paper_id=paper_id,
        filename=filename,
        status=PaperStatus.INGESTED,
        message="Text received. Processing has started. Poll /api/v1/status/{paper_id} for updates.",
    )
