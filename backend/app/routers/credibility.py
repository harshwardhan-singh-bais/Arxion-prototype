"""
Credibility router — Component B endpoints.

GET  /api/v1/papers/{paper_id}/credibility   → Full credibility report + RCI
GET  /api/v1/papers/{paper_id}/flags         → Just risk flags (lightweight)
GET  /api/v1/credibility/summary             → Aggregate stats across all papers
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.paper import PaperStatus
from app.models.credibility import CredibilityReport, RiskFlag
from app.models.store import get_paper, list_papers
from app.services.credibility import compute_credibility

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/papers/{paper_id}/credibility",
    response_model=CredibilityReport,
    summary="Get full credibility report for a paper (RCI, scores, flags, breakdown)",
)
async def get_credibility(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    if paper.status != PaperStatus.PROCESSED:
        raise HTTPException(
            status_code=409,
            detail=f"Paper is not yet processed. Current status: {paper.status.value}. Wait for PROCESSED before requesting credibility.",
        )

    return compute_credibility(paper)


# ── Lightweight flag endpoint ─────────────────────────────────────────────────

class FlagsResponse(BaseModel):
    paper_id: str
    title: str | None
    risk_flags: list[RiskFlag]
    flag_count: int


@router.get(
    "/papers/{paper_id}/flags",
    response_model=FlagsResponse,
    summary="Get just the risk flags for a paper (fast)",
)
async def get_flags(paper_id: str):
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    if paper.status != PaperStatus.PROCESSED:
        raise HTTPException(status_code=409, detail=f"Paper not yet processed: {paper.status.value}")

    report = compute_credibility(paper)
    return FlagsResponse(
        paper_id=paper.id,
        title=paper.title,
        risk_flags=report.risk_flags,
        flag_count=len(report.risk_flags),
    )


# ── Aggregate summary across all processed papers ─────────────────────────────

class CredibilitySummary(BaseModel):
    total_papers: int
    processed_papers: int
    avg_rci: float
    avg_reproducibility: float
    avg_confidence: float
    avg_transparency: float
    grade_distribution: dict[str, int]          # {"A": 3, "B": 5, ...}
    most_common_flags: list[dict]               # [{"flag": "...", "count": N}, ...]


@router.get(
    "/credibility/summary",
    response_model=CredibilitySummary,
    summary="Aggregate credibility stats across all processed papers (Field Health)",
)
async def get_credibility_summary():
    all_papers = list_papers()
    processed = [p for p in all_papers if p.status == PaperStatus.PROCESSED]

    if not processed:
        return CredibilitySummary(
            total_papers=len(all_papers),
            processed_papers=0,
            avg_rci=0.0,
            avg_reproducibility=0.0,
            avg_confidence=0.0,
            avg_transparency=0.0,
            grade_distribution={"A": 0, "B": 0, "C": 0, "D": 0, "F": 0},
            most_common_flags=[],
        )

    reports = [compute_credibility(p) for p in processed]

    avg_rci   = round(sum(r.rci for r in reports) / len(reports), 1)
    avg_repro = round(sum(r.reproducibility_score for r in reports) / len(reports), 1)
    avg_conf  = round(sum(r.confidence_score for r in reports) / len(reports), 1)
    avg_trans = round(sum(r.transparency_score for r in reports) / len(reports), 1)

    grades: dict[str, int] = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for r in reports:
        grades[r.grade] = grades.get(r.grade, 0) + 1

    # Count flag frequency across all reports
    flag_counts: dict[str, int] = {}
    for r in reports:
        for f in r.risk_flags:
            flag_counts[f.value] = flag_counts.get(f.value, 0) + 1

    most_common = sorted(
        [{"flag": k, "count": v} for k, v in flag_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:8]

    return CredibilitySummary(
        total_papers=len(all_papers),
        processed_papers=len(processed),
        avg_rci=avg_rci,
        avg_reproducibility=avg_repro,
        avg_confidence=avg_conf,
        avg_transparency=avg_trans,
        grade_distribution=grades,
        most_common_flags=most_common,
    )
