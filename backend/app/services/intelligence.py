"""
Advanced Intelligence Service — Component E
- Cross-paper claim similarity search via Qdrant
- Contradiction classification via Gemini
- Field Health aggregation
- Reproduction Effort Estimator
"""
import json
import logging
from collections import Counter

from app.models.paper import PaperInDB, PaperStatus
from app.models.gaps import ContradictionItem
from app.services.vector_store import search_chunks
from app.services.credibility import compute_credibility
from app.models.store import get_paper
from app.core.gemini import generate_text

logger = logging.getLogger(__name__)


# ── Cross-paper semantic claim search ─────────────────────────────────────────

async def search_claims(query: str, paper_ids: list[str] | None = None, limit: int = 10) -> list[dict]:
    """Semantic search over the Qdrant chunks collection."""
    return await search_chunks(query, paper_ids=paper_ids, limit=limit)


# ── Contradiction detection ───────────────────────────────────────────────────

async def detect_contradictions(papers: list[PaperInDB], threshold: float = 0.82) -> list[ContradictionItem]:
    """
    For each processed paper, search for highly similar claims in OTHER papers.
    Gemini classifies whether they actually contradict.
    """
    processed = [p for p in papers if p.status == PaperStatus.PROCESSED]
    if len(processed) < 2:
        return []

    contradictions: list[ContradictionItem] = []
    seen_pairs: set[frozenset] = set()

    for paper in processed:
        for claim in paper.claims[:3]:  # Top 3 claims per paper — limits API calls
            similar = await search_chunks(claim.statement, limit=5)
            for hit in similar:
                hit_paper_id = hit.get("paper_id")
                # Skip same paper, low-score, or already-checked pairs
                if not hit_paper_id or hit_paper_id == paper.id:
                    continue
                if hit["score"] < threshold:
                    continue

                pair = frozenset([paper.id, hit_paper_id])
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)

                other = get_paper(hit_paper_id)
                if not other:
                    continue

                result = await _classify_contradiction(
                    claim_a=claim.statement,
                    paper_a=paper.title,
                    claim_b=hit["text"],
                    paper_b=other.title,
                )
                if result:
                    contradictions.append(ContradictionItem(
                        paper_id_a=paper.id,
                        title_a=paper.title,
                        paper_id_b=other.id,
                        title_b=other.title,
                        claim_a=claim.statement,
                        claim_b=hit["text"],
                        similarity_score=round(hit["score"], 3),
                        contradiction_type=result.get("type", "SEMANTIC"),
                        explanation=result.get("explanation", ""),
                    ))

    return contradictions[:20]


async def _classify_contradiction(claim_a: str, paper_a: str, claim_b: str, paper_b: str) -> dict | None:
    """Ask Gemini if two similar claims actually contradict each other."""
    prompt = f"""\
You are a scientific fact-checker. Two research papers make similar but potentially conflicting claims.

Paper A: "{paper_a}"
Claim A: "{claim_a}"

Paper B: "{paper_b}"
Claim B: "{claim_b}"

Determine if these claims CONTRADICT each other. Reply ONLY with valid JSON:

If they contradict:     {{"is_contradiction": true, "type": "FACTUAL|METHODOLOGICAL|STATISTICAL|ONTOLOGICAL", "explanation": "one sentence"}}
If they do NOT contradict: {{"is_contradiction": false}}

JSON:"""
    try:
        raw = await generate_text(prompt, temperature=0.1, max_tokens=256)
        data = json.loads(raw.strip().strip("```json").strip("```").strip())
        if data.get("is_contradiction"):
            return {"type": data.get("type", "SEMANTIC"), "explanation": data.get("explanation", "")}
    except Exception as e:
        logger.warning(f"Contradiction classification failed: {e}")
    return None


# ── Field Health Aggregation ──────────────────────────────────────────────────

def compute_field_health(papers: list[PaperInDB]) -> dict:
    """
    Aggregate transparency metrics across all processed papers.
    Powers the Global Field Health dashboard.
    """
    processed = [p for p in papers if p.status == PaperStatus.PROCESSED]
    total = len(processed)
    if total == 0:
        return {
            "total_papers": len(papers),
            "processed_papers": 0,
            "avg_rci": 0.0,
            "pct_public_code": 0.0,
            "pct_full_hyperparams": 0.0,
            "pct_compute_disclosed": 0.0,
            "contradiction_density": 0.0,
            "dataset_overuse": [],
            "grade_distribution": {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0},
        }

    reports = [compute_credibility(p) for p in processed]

    pct_code   = round(sum(1 for p in processed if p.code_link) / total * 100, 1)
    pct_hp     = round(sum(1 for p in processed if p.hyperparameters and p.hyperparameters.disclosed) / total * 100, 1)
    pct_comp   = round(sum(1 for p in processed if p.compute and p.compute.disclosed) / total * 100, 1)
    avg_rci    = round(sum(r.rci for r in reports) / total, 1)
    high_flag_count = sum(1 for r in reports if len(r.risk_flags) >= 3)

    dataset_freq = Counter(d.name for p in processed for d in p.datasets)

    return {
        "total_papers": len(papers),
        "processed_papers": total,
        "avg_rci": avg_rci,
        "pct_public_code": pct_code,
        "pct_full_hyperparams": pct_hp,
        "pct_compute_disclosed": pct_comp,
        "contradiction_density": round(high_flag_count / total * 100, 1),
        "dataset_overuse": [
            {"name": ds, "count": count}
            for ds, count in dataset_freq.most_common(10)
        ],
        "grade_distribution": {
            grade: sum(1 for r in reports if r.grade == grade)
            for grade in ("A", "B", "C", "D", "F")
        },
    }


# ── Reproduction Effort Estimator ─────────────────────────────────────────────

def estimate_reproduction_effort(paper: PaperInDB) -> dict:
    """
    Estimate GPU hours, engineering complexity, and reproduction risk.
    """
    report = compute_credibility(paper)

    if paper.compute and paper.compute.disclosed and paper.compute.gpu_hours:
        gpu_estimate  = paper.compute.gpu_hours
        gpu_src       = "DISCLOSED"
    else:
        # Heuristic: num_methods × num_datasets × baseline 24h
        gpu_estimate  = max(1, len(paper.methods)) * max(1, len(paper.datasets)) * 24
        gpu_src       = "ESTIMATED (compute not disclosed)"

    # Engineering complexity: count missing disclosure signals (max ~10)
    complexity = 0
    if not paper.code_link:                                              complexity += 3
    if not paper.data_link:                                              complexity += 2
    if not (paper.hyperparameters and paper.hyperparameters.disclosed):  complexity += 3
    if len(paper.methods) > 2:                                           complexity += 1
    if len(paper.datasets) > 3:                                          complexity += 1

    complexity_label = (
        "LOW"       if complexity <= 2 else
        "MEDIUM"    if complexity <= 4 else
        "HIGH"      if complexity <= 6 else
        "VERY HIGH"
    )

    return {
        "paper_id":               paper.id,
        "rci":                    report.rci,
        "gpu_hours_estimate":     round(gpu_estimate, 1),
        "gpu_estimate_source":    gpu_src,
        "gpu_type":               paper.compute.gpu_type if paper.compute else None,
        "engineering_complexity": complexity_label,
        "complexity_score":       complexity,
        "reproduction_risk":      report.reproduction_effort,
        "reproduction_notes":     report.reproduction_notes,
        "barriers":               [f.value for f in report.risk_flags[:5]],
    }
