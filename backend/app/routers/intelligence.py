"""
Components D + E router — Gaps & Advanced Intelligence
GET  /api/v1/gaps
GET  /api/v1/claims/search
GET  /api/v1/contradictions
GET  /api/v1/field/health
GET  /api/v1/papers/{paper_id}/reproduction-effort
"""
from fastapi import APIRouter, Query, HTTPException
from app.models.gaps import GapFeed, ContradictionItem
from app.models.paper import PaperStatus
from app.models.store import list_papers, get_paper
from app.services.gaps import build_gap_feed
from app.services.intelligence import (
    search_claims,
    detect_contradictions,
    compute_field_health,
    estimate_reproduction_effort,
)

router = APIRouter()


# ── Component D ───────────────────────────────────────────────────────────────

@router.get(
    "/gaps",
    response_model=GapFeed,
    summary="Autonomous Gap Opportunity Feed",
)
async def get_gaps():
    """
    Runs heuristic analysis across all processed papers to surface:
    - Dataset saturation zones
    - Missing method–dataset combinations
    - Benchmark inflation
    - Field stagnation signals
    Each gap is enriched with a Gemini-written description and confidence score.
    """
    papers = list_papers()
    return await build_gap_feed(papers)


# ── Component E ───────────────────────────────────────────────────────────────

@router.get(
    "/claims/search",
    summary="Semantic cross-paper claim search",
)
async def claim_search(
    q:     str           = Query(..., description="Search query string"),
    limit: int           = Query(default=10, ge=1, le=30),
    paper_ids: list[str] = Query(default=None, description="Scope to specific paper IDs"),
):
    """
    Semantically searches the claim embeddings in Qdrant to find
    the most relevant claims across all ingested papers.
    """
    results = await search_claims(q, paper_ids=paper_ids or None, limit=limit)
    return {"query": q, "results": results, "count": len(results)}


@router.get(
    "/contradictions",
    response_model=list[ContradictionItem],
    summary="Detect cross-paper claim contradictions",
)
async def get_contradictions():
    """
    Scans all processed papers for semantically similar but contradictory claims.
    Uses Qdrant for retrieval and Gemini for classification.
    This is a slow endpoint — consider calling it on-demand.
    """
    papers = list_papers()
    return await detect_contradictions(papers)


@router.get(
    "/field/health",
    summary="Field Health Dashboard — aggregate intelligence across all papers",
)
async def get_field_health():
    """
    Returns aggregated field-level intelligence:
    - % papers with public code
    - % papers with full hyperparameters
    - Dataset overuse heatmap (top 10 overused datasets)
    - Contradiction density
    - Grade distribution
    - Average RCI
    Powers the Field Health dashboard page.
    """
    papers = list_papers()
    return compute_field_health(papers)


@router.get(
    "/papers/{paper_id}/reproduction-effort",
    summary="Reproduction Effort Estimator for a specific paper",
)
async def get_reproduction_effort(paper_id: str):
    """
    Estimates how hard a paper would be to reproduce:
    - Estimated GPU hours
    - Engineering complexity
    - Reproduction risk level
    - Key barriers (risk flags)
    """
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    if paper.status != PaperStatus.PROCESSED:
        raise HTTPException(status_code=409, detail=f"Paper not yet processed: {paper.status.value}")

    return estimate_reproduction_effort(paper)
