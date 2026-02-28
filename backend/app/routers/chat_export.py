"""
Components F + G router — Chat (RAG) + Export
POST /api/v1/chat
GET  /api/v1/papers/{id}/export/bibtex
POST /api/v1/export/bibtex/bulk
POST /api/v1/export/csv
POST /api/v1/export/related-work
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel
import io

from app.models.chat import ChatRequest, ChatResponse, RelatedWorkRequest, RelatedWorkResponse, ExportCSVRequest
from app.models.paper import PaperStatus
from app.models.store import get_paper, list_papers
from app.services.rag import chat_with_matrix
from app.services.export import (
    generate_bibtex,
    generate_bibtex_bulk,
    generate_csv,
    generate_related_work,
)

router = APIRouter()


# ── Component F: RAG Chat ─────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with the Knowledge Matrix (RAG)",
)
async def chat(request: ChatRequest):
    """
    Multi-paper RAG endpoint.
    1. Embeds the query using Gemini embeddings
    2. Retrieves the most semantically relevant chunks from Qdrant
    3. Generates a citation-backed answer using Gemini
    4. Returns answer + source chips for the frontend terminal UI

    Optionally scope to specific paper_ids for focused queries.
    """
    return await chat_with_matrix(request)


# ── Component G: Exports ──────────────────────────────────────────────────────

@router.get(
    "/papers/{paper_id}/export/bibtex",
    response_class=PlainTextResponse,
    summary="Export a single paper as BibTeX",
)
async def export_bibtex_single(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return PlainTextResponse(
        content=generate_bibtex(paper),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{paper_id}.bib"'},
    )


class BulkBibtexRequest(BaseModel):
    paper_ids: list[str]


@router.post(
    "/export/bibtex",
    response_class=PlainTextResponse,
    summary="Export multiple papers as a combined .bib file",
)
async def export_bibtex_bulk(request: BulkBibtexRequest):
    papers = [get_paper(pid) for pid in request.paper_ids]
    papers = [p for p in papers if p is not None]
    if not papers:
        raise HTTPException(status_code=404, detail="No matching papers found.")
    return PlainTextResponse(
        content=generate_bibtex_bulk(papers),
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="arxion_export.bib"'},
    )


@router.post(
    "/export/csv",
    response_class=PlainTextResponse,
    summary="Export papers as CSV (literature matrix)",
)
async def export_csv(request: ExportCSVRequest):
    all_papers = list_papers()
    if request.paper_ids:
        papers = [p for p in all_papers if p.id in request.paper_ids]
    else:
        papers = [p for p in all_papers if p.status == PaperStatus.PROCESSED]

    if not papers:
        raise HTTPException(status_code=404, detail="No processed papers to export.")

    csv_content = generate_csv(papers, include_credibility=request.include_credibility)
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="arxion_matrix.csv"'},
    )


@router.post(
    "/export/related-work",
    response_model=RelatedWorkResponse,
    summary="Auto-generate a structured related work paragraph",
)
async def export_related_work(request: RelatedWorkRequest):
    """
    Generates a publication-quality related work paragraph for the selected papers.
    Uses Gemini with full paper metadata (title, authors, methods, datasets, claims).
    """
    if not request.paper_ids:
        raise HTTPException(status_code=400, detail="Provide at least one paper_id.")
    papers = list_papers()
    return await generate_related_work(request, papers)
