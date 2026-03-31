"""
Layer 2 Router — Modular add-on system.
Includes understanding, evaluation, cross-paper intelligence,
action/build, productivity, and exploration modules.
"""

from __future__ import annotations

import csv
import io
import itertools
import inspect
import logging
from collections import Counter, defaultdict
from datetime import datetime
from functools import wraps
from typing import Any, Awaitable, Callable

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import String, cast, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user_id
from app.core.database_sql import get_db
from app.core.feature_logging import log_feature_failure, log_feature_start, log_feature_success
from app.core.gemini import get_generation_model
from app.models.paper import PaperInDB
from app.models.sql_models import Annotation
from app.models.store import get_paper, list_papers

logger = logging.getLogger(__name__)
router = APIRouter()


def _feature_endpoint(step: str) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    def decorator(fn: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            log_feature_start(logger, "LAYER2", step, "Request started")
            try:
                result = await fn(*args, **kwargs)
                log_feature_success(logger, "LAYER2", step, "Request completed")
                return result
            except HTTPException as e:
                log_feature_failure(logger, "LAYER2", step, "Request failed with HTTP exception", error=f"{e.status_code}:{e.detail}")
                raise
            except Exception as e:
                log_feature_failure(logger, "LAYER2", step, "Request failed", error=e)
                raise

        wrapper.__signature__ = inspect.signature(fn)
        return wrapper

    return decorator


def _paper_text_blob(p: PaperInDB) -> str:
    parts = [p.title or "", p.abstract or ""]
    parts.extend([c.statement for c in p.claims])
    parts.extend([m.name for m in p.methods])
    parts.extend([d.name for d in p.datasets])
    return "\n".join([x for x in parts if x]).strip()


def _safe_generate(prompt: str, fallback: str) -> str:
    try:
        model = get_generation_model()
        res = model.generate_content(prompt)
        text = (res.text or "").strip()
        return text or fallback
    except Exception:
        return fallback


def _shorten(text: str, n: int = 500) -> str:
    if not text:
        return ""
    return text if len(text) <= n else (text[:n] + "...")


def _eq_id(column: Any, value: str):
    # Cast to text so comparisons work across mixed UUID/varchar legacy schemas.
    return cast(column, String) == str(value)


class TextResponse(BaseModel):
    content: str


class MathExplainRequest(BaseModel):
    equation: str
    context: str | None = None


class SectionSummaryResponse(BaseModel):
    abstract_summary: str
    method_summary: str
    results_summary: str
    contribution_summary: str


class CredibilityResponse(BaseModel):
    overall_rci: float
    reproducibility_score: float
    transparency_score: float
    evaluation_quality_score: float
    risk_flags: list[str]
    strengths: list[str]
    weaknesses: list[str]


class FairnessIssue(BaseModel):
    type: str
    description: str
    severity: str


class FairnessResponse(BaseModel):
    fairness_score: float
    issues: list[FairnessIssue]
    recommendations: list[str]


class BiasItem(BaseModel):
    category: str
    name: str
    description: str
    evidence: str


class BiasResponse(BaseModel):
    bias_score: float
    detected_biases: list[BiasItem]


class ContradictionPair(BaseModel):
    paper_id_a: str
    claim_a: str
    paper_id_b: str
    claim_b: str
    severity: str
    explanation: str


class ContradictionResponse(BaseModel):
    contradictions: list[ContradictionPair]


class GapItem(BaseModel):
    type: str
    description: str
    papers_with_method: int
    papers_with_dataset: int
    papers_with_both: int
    opportunity_score: float


class GapFinderResponse(BaseModel):
    gaps: list[GapItem]


class TrendSeries(BaseModel):
    name: str
    papers_by_year: dict[str, int]
    trend: str


class TrendResponse(BaseModel):
    method_trends: list[TrendSeries]
    dataset_trends: list[TrendSeries]


class CitationNetworkNode(BaseModel):
    paper_id: str
    title: str
    centrality_score: float
    links: int


class CitationNetworkResponse(BaseModel):
    influential_papers: list[CitationNetworkNode]


class EffortResponse(BaseModel):
    gpu_type: str
    gpu_count: int
    gpu_hours: float
    complexity_score: float
    difficulty: str
    feasibility_score: float
    risks: list[str]


class StarterKitResponse(BaseModel):
    repository_name: str
    files: dict[str, str]


class NotesCreate(BaseModel):
    paper_id: str
    section: str | None = None
    text: str


class NotesUpdate(BaseModel):
    section: str | None = None
    text: str


class NoteOut(BaseModel):
    id: int
    paper_id: str
    section: str | None
    text: str
    created_at: str


class DatasetUsage(BaseModel):
    name: str
    usage_count: int
    trend: str


class DatasetExplorerResponse(BaseModel):
    total_unique: int
    datasets: list[DatasetUsage]


class FieldHealthResponse(BaseModel):
    overall_health_score: float
    reproducibility_rate: float
    code_availability_rate: float
    benchmark_saturation_score: float
    papers_count: int


class CompareRequest(BaseModel):
    paper_ids: list[str]


class CompareRow(BaseModel):
    paper_id: str
    title: str
    year: int | None
    authors: list[str]
    methods: list[str]
    datasets: list[str]
    metrics: list[str]
    claims_count: int
    limitations_count: int
    credibility_overall_rci: float


class CompareResponse(BaseModel):
    compared_count: int
    common_methods: list[str]
    common_datasets: list[str]
    rows: list[CompareRow]


async def _get_paper_or_404(paper_id: str) -> PaperInDB:
    p = await get_paper(paper_id)
    if not p:
        raise HTTPException(status_code=404, detail="Paper not found")
    return p


@router.post("/layer2/papers/{paper_id}/simplify", response_model=TextResponse)
@_feature_endpoint("simplify_paper")
async def simplify_paper(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    prompt = (
        "Explain the following paper in simple terms for a beginner. "
        "Return concise, practical explanation in 5 bullets.\n\n"
        f"TITLE: {p.title}\nABSTRACT: {p.abstract or ''}\nCLAIMS: {'; '.join([c.statement for c in p.claims])}"
    )
    fallback = "\n".join(
        [
            f"- {p.title}",
            "- This paper proposes a method and evaluates it on datasets.",
            "- Main claims were extracted and can be reviewed in the paper detail view.",
            "- Check methods/datasets sections for implementation insights.",
            "- Use Effort Estimator to assess reproducibility cost.",
        ]
    )
    return TextResponse(content=_safe_generate(prompt, fallback))


@router.post("/layer2/math/explain", response_model=TextResponse)
@_feature_endpoint("explain_math")
async def explain_math(req: MathExplainRequest):
    prompt = (
        "Explain this equation step-by-step in plain language. Include intuition and variable meanings.\n\n"
        f"Equation: {req.equation}\nContext: {req.context or ''}"
    )
    fallback = "Step 1: Identify terms. Step 2: Explain each variable and operation. Step 3: Explain what changing each variable does to output."
    return TextResponse(content=_safe_generate(prompt, fallback))


@router.get("/layer2/papers/{paper_id}/section-summaries", response_model=SectionSummaryResponse)
@_feature_endpoint("section_summaries")
async def section_summaries(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    abstract_summary = _shorten(p.abstract or "No abstract available.", 350)
    method_summary = _shorten("; ".join([m.name for m in p.methods]) or "No methods extracted.", 300)
    results_summary = _shorten("; ".join([c.statement for c in p.claims]) or "No results/claims extracted.", 350)
    contribution_summary = _shorten((p.title or "") + ": " + (results_summary or "No contribution extracted."), 350)
    return SectionSummaryResponse(
        abstract_summary=abstract_summary,
        method_summary=method_summary,
        results_summary=results_summary,
        contribution_summary=contribution_summary,
    )


@router.get("/layer2/papers/{paper_id}/credibility", response_model=CredibilityResponse)
@_feature_endpoint("credibility_score")
async def credibility_score(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    rep = 50.0
    rep += 15 if p.code_link else 0
    rep += 10 if p.data_link else 0
    rep += 10 if p.hyperparameters and p.hyperparameters.disclosed else 0
    rep += 10 if p.compute and p.compute.disclosed else 0
    rep += 5 if p.metrics else 0
    rep = min(rep, 100.0)

    trans = 45.0
    trans += 20 if p.abstract else 0
    trans += 15 if p.limitations else 0
    trans += 10 if p.methods else 0
    trans += 10 if p.datasets else 0
    trans = min(trans, 100.0)

    eval_q = 40.0
    eval_q += 20 if len(p.metrics) >= 2 else 0
    eval_q += 20 if p.baseline else 0
    eval_q += 10 if len(p.datasets) >= 2 else 0
    eval_q += 10 if len(p.claims) >= 2 else 0
    eval_q = min(eval_q, 100.0)

    overall = round((rep + trans + eval_q) / 3.0, 2)
    risk_flags: list[str] = []
    if not p.code_link:
        risk_flags.append("MISSING_CODE_REPO")
    if not p.hyperparameters or not p.hyperparameters.disclosed:
        risk_flags.append("HIDDEN_HYPERPARAMETERS")
    if not p.baseline:
        risk_flags.append("MISSING_BASELINE")

    strengths = []
    if p.methods:
        strengths.append("Methods are documented")
    if p.datasets:
        strengths.append("Datasets are identified")
    if p.metrics:
        strengths.append("Quantitative metrics are present")

    weaknesses = []
    if not p.code_link:
        weaknesses.append("No public code link")
    if not p.compute or not p.compute.disclosed:
        weaknesses.append("Compute disclosure missing")

    return CredibilityResponse(
        overall_rci=overall,
        reproducibility_score=round(rep, 2),
        transparency_score=round(trans, 2),
        evaluation_quality_score=round(eval_q, 2),
        risk_flags=risk_flags,
        strengths=strengths,
        weaknesses=weaknesses,
    )


@router.get("/layer2/papers/{paper_id}/benchmark-fairness", response_model=FairnessResponse)
@_feature_endpoint("benchmark_fairness")
async def benchmark_fairness(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    issues: list[FairnessIssue] = []
    score = 85.0
    if not p.baseline:
        issues.append(FairnessIssue(type="MISSING_BASELINE", description="No explicit baseline extracted.", severity="high"))
        score -= 25
    if len(p.metrics) == 0:
        issues.append(FairnessIssue(type="NO_METRICS", description="No comparable metrics extracted.", severity="high"))
        score -= 25
    if len(p.datasets) == 1:
        issues.append(FairnessIssue(type="SINGLE_DATASET", description="Evaluation appears limited to one dataset.", severity="medium"))
        score -= 10
    if len(p.claims) >= 1 and len(p.metrics) == 0:
        issues.append(FairnessIssue(type="UNBACKED_CLAIMS", description="Claims exist without extracted metric evidence.", severity="medium"))
        score -= 10

    recommendations = [
        "Add direct baseline comparisons with identical setup.",
        "Report statistical confidence and multiple-run variance.",
        "Evaluate across at least two datasets when possible.",
    ]
    return FairnessResponse(fairness_score=max(0, round(score, 2)), issues=issues, recommendations=recommendations)


@router.get("/layer2/papers/{paper_id}/bias", response_model=BiasResponse)
@_feature_endpoint("detect_bias")
async def detect_bias(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    items: list[BiasItem] = []
    score = 80.0
    if len(p.datasets) <= 1:
        items.append(BiasItem(category="evaluation_bias", name="Low dataset diversity", description="Limited dataset diversity can inflate apparent performance.", evidence="Only one or zero datasets extracted."))
        score -= 20
    if not p.limitations:
        items.append(BiasItem(category="reporting_bias", name="Missing limitations", description="Paper does not clearly report limitations.", evidence="No limitation items extracted."))
        score -= 15
    if len(p.claims) > 3 and len(p.metrics) < 1:
        items.append(BiasItem(category="overclaiming", name="Claim-heavy evidence-light", description="Many claims with weak extracted quantitative support.", evidence="Claims > 3 and metrics < 1."))
        score -= 15

    return BiasResponse(bias_score=max(0, round(score, 2)), detected_biases=items)


@router.get("/layer2/contradictions", response_model=ContradictionResponse)
@_feature_endpoint("contradictions")
async def contradictions(limit: int = Query(default=25, ge=1, le=200)):
    papers = await list_papers()
    claims_by_paper = [(p.id, c.statement) for p in papers for c in p.claims if c.statement]

    contrad_words = [("increase", "decrease"), ("improves", "worse"), ("higher", "lower"), ("outperforms", "underperforms")]
    found: list[ContradictionPair] = []

    for (pa, ca), (pb, cb) in itertools.combinations(claims_by_paper, 2):
        if pa == pb:
            continue
        a = ca.lower()
        b = cb.lower()
        for w1, w2 in contrad_words:
            if (w1 in a and w2 in b) or (w2 in a and w1 in b):
                found.append(
                    ContradictionPair(
                        paper_id_a=pa,
                        claim_a=_shorten(ca, 220),
                        paper_id_b=pb,
                        claim_b=_shorten(cb, 220),
                        severity="high",
                        explanation=f"Potential opposite direction claims detected ({w1}/{w2}).",
                    )
                )
                break
        if len(found) >= limit:
            break

    return ContradictionResponse(contradictions=found)


@router.get("/layer2/gap-finder", response_model=GapFinderResponse)
@_feature_endpoint("gap_finder")
async def gap_finder(limit: int = Query(default=50, ge=1, le=200)):
    papers = await list_papers()
    methods = sorted({m.name for p in papers for m in p.methods if m.name})
    datasets = sorted({d.name for p in papers for d in p.datasets if d.name})

    pair_count: dict[tuple[str, str], int] = defaultdict(int)
    method_count: Counter[str] = Counter()
    dataset_count: Counter[str] = Counter()

    for p in papers:
        p_methods = {m.name for m in p.methods if m.name}
        p_datasets = {d.name for d in p.datasets if d.name}
        method_count.update(p_methods)
        dataset_count.update(p_datasets)
        for m in p_methods:
            for d in p_datasets:
                pair_count[(m, d)] += 1

    gaps: list[GapItem] = []
    for m in methods:
        for d in datasets:
            both = pair_count.get((m, d), 0)
            if both == 0 and method_count[m] > 0 and dataset_count[d] > 0:
                opportunity = min(1.0, (method_count[m] + dataset_count[d]) / max(1, len(papers) * 2))
                gaps.append(
                    GapItem(
                        type="MISSING_COMBO",
                        description=f"No papers combine method '{m}' with dataset '{d}'.",
                        papers_with_method=method_count[m],
                        papers_with_dataset=dataset_count[d],
                        papers_with_both=0,
                        opportunity_score=round(opportunity, 3),
                    )
                )
                if len(gaps) >= limit:
                    return GapFinderResponse(gaps=gaps)

    return GapFinderResponse(gaps=gaps)


def _series_trend(values: dict[str, int]) -> str:
    if len(values) < 2:
        return "stable"
    years = sorted(values.keys())
    first = values[years[0]]
    last = values[years[-1]]
    if last > first:
        return "growing"
    if last < first:
        return "declining"
    return "stable"


@router.get("/layer2/trends", response_model=TrendResponse)
@_feature_endpoint("trends")
async def trends():
    papers = await list_papers()
    method_year_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    dataset_year_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for p in papers:
        y = str(p.year or "unknown")
        for m in p.methods:
            if m.name:
                method_year_counts[m.name][y] += 1
        for d in p.datasets:
            if d.name:
                dataset_year_counts[d.name][y] += 1

    method_trends = [
        TrendSeries(name=k, papers_by_year=dict(v), trend=_series_trend(dict(v)))
        for k, v in sorted(method_year_counts.items(), key=lambda x: sum(x[1].values()), reverse=True)[:20]
    ]
    dataset_trends = [
        TrendSeries(name=k, papers_by_year=dict(v), trend=_series_trend(dict(v)))
        for k, v in sorted(dataset_year_counts.items(), key=lambda x: sum(x[1].values()), reverse=True)[:20]
    ]
    return TrendResponse(method_trends=method_trends, dataset_trends=dataset_trends)


@router.get("/layer2/citation-network", response_model=CitationNetworkResponse)
@_feature_endpoint("citation_network")
async def citation_network():
    papers = await list_papers()
    nodes: list[CitationNetworkNode] = []
    for p in papers:
        links = len(p.claims) + len(p.methods) + len(p.datasets)
        centrality = min(1.0, links / 20.0)
        nodes.append(
            CitationNetworkNode(
                paper_id=p.id,
                title=p.title,
                centrality_score=round(centrality, 3),
                links=links,
            )
        )
    nodes.sort(key=lambda n: n.centrality_score, reverse=True)
    return CitationNetworkResponse(influential_papers=nodes[:30])


@router.get("/layer2/papers/{paper_id}/generate-code", response_model=StarterKitResponse)
@_feature_endpoint("generate_code")
async def generate_code(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    model_name = (p.methods[0].name if p.methods else "PaperModel").replace(" ", "")
    model_name = "".join([c for c in model_name if c.isalnum()]) or "PaperModel"
    files = {
        "README.md": f"# {p.title}\n\nAuto-generated implementation skeleton for paper {p.id}.",
        "requirements.txt": "torch\nnumpy\n",
        "src/model.py": f"class {model_name}:\n    def __init__(self, config):\n        self.config = config\n\n    def forward(self, x):\n        return x\n",
        "src/train.py": "def train():\n    print('Training loop skeleton')\n",
        "src/evaluate.py": "def evaluate():\n    print('Evaluation skeleton')\n",
        "config.yaml": "learning_rate: 0.001\nbatch_size: 32\nepochs: 10\n",
    }
    return StarterKitResponse(repository_name=f"paper-{paper_id}", files=files)


@router.get("/layer2/papers/{paper_id}/reproduction-plan", response_model=TextResponse)
@_feature_endpoint("reproduction_plan")
async def reproduction_plan(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    steps = [
        "1. Create virtual environment and install dependencies.",
        "2. Download required dataset(s): " + (", ".join([d.name for d in p.datasets]) or "not specified"),
        "3. Implement method: " + (", ".join([m.name for m in p.methods]) or "not specified"),
        "4. Train with reported hyperparameters (if available).",
        "5. Reproduce metrics and compare with baseline.",
    ]
    return TextResponse(content="\n".join(steps))


@router.get("/layer2/papers/{paper_id}/effort-estimator", response_model=EffortResponse)
@_feature_endpoint("effort_estimator")
async def effort_estimator(paper_id: str):
    p = await _get_paper_or_404(paper_id)
    complexity = 3.0 + (len(p.methods) * 1.2) + (len(p.datasets) * 0.8) + (len(p.metrics) * 0.3)
    complexity = min(10.0, complexity)
    gpu_hours = 50.0 + len(p.methods) * 40.0 + len(p.datasets) * 20.0
    disclosed = bool(p.compute and p.compute.disclosed)
    gpu_type = (p.compute.gpu_type if p.compute and p.compute.gpu_type else "A100")
    difficulty = "advanced" if complexity >= 7 else ("intermediate" if complexity >= 4 else "beginner")
    feasibility = max(0.1, round(1.0 - (complexity / 12.0), 3))
    risks = []
    if not disclosed:
        risks.append("Compute details not disclosed")
    if not p.code_link:
        risks.append("No public code repository")
    if len(p.datasets) == 0:
        risks.append("Dataset information missing")
    return EffortResponse(
        gpu_type=gpu_type,
        gpu_count=1 if complexity < 6 else 4,
        gpu_hours=round(gpu_hours, 2),
        complexity_score=round(complexity, 2),
        difficulty=difficulty,
        feasibility_score=feasibility,
        risks=risks,
    )


@router.get("/layer2/papers/{paper_id}/starter-kit", response_model=StarterKitResponse)
@_feature_endpoint("starter_kit")
async def starter_kit(paper_id: str):
    return await generate_code(paper_id)


@router.get("/layer2/citations/export", response_model=TextResponse)
@_feature_endpoint("citation_manager_export")
async def citation_manager_export(
    format: str = Query(default="bibtex", pattern="^(bibtex|json|csv|ris)$")
):
    papers = await list_papers()
    if format == "json":
        rows = [
            {
                "id": p.id,
                "title": p.title,
                "authors": p.authors,
                "year": p.year,
            }
            for p in papers
        ]
        return TextResponse(content=str(rows))

    if format == "csv":
        out = io.StringIO()
        w = csv.writer(out)
        w.writerow(["id", "title", "authors", "year"])
        for p in papers:
            w.writerow([p.id, p.title, ", ".join(p.authors), p.year or ""])
        return TextResponse(content=out.getvalue())

    if format == "ris":
        lines = []
        for p in papers:
            lines.append("TY  - JOUR")
            lines.append(f"TI  - {p.title}")
            for a in p.authors:
                lines.append(f"AU  - {a}")
            if p.year:
                lines.append(f"PY  - {p.year}")
            lines.append("ER  - ")
            lines.append("")
        return TextResponse(content="\n".join(lines))

    bib = []
    for p in papers:
        key = f"arxion_{p.id.replace('-', '')[:10]}"
        authors = " and ".join(p.authors) if p.authors else "Unknown"
        year = p.year or datetime.utcnow().year
        bib.append(
            f"@article{{{key},\n  title={{ {p.title} }},\n  author={{ {authors} }},\n  year={{ {year} }}\n}}"
        )
    return TextResponse(content="\n\n".join(bib))


@router.post("/layer2/notes", response_model=NoteOut)
@_feature_endpoint("create_note")
async def create_note(
    data: NotesCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    note = Annotation(user_id=user_id, paper_id=data.paper_id, section=data.section, text=data.text)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return NoteOut(id=note.id, paper_id=note.paper_id, section=note.section, text=note.text, created_at=note.created_at.isoformat() if note.created_at else "")


@router.get("/layer2/notes", response_model=list[NoteOut])
@_feature_endpoint("list_notes")
async def list_notes(
    paper_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Annotation).where(_eq_id(Annotation.user_id, user_id))
    if paper_id:
        stmt = stmt.where(_eq_id(Annotation.paper_id, paper_id))
    stmt = stmt.order_by(Annotation.created_at.desc())
    res = await db.execute(stmt)
    rows = res.scalars().all()
    return [NoteOut(id=n.id, paper_id=n.paper_id, section=n.section, text=n.text, created_at=n.created_at.isoformat() if n.created_at else "") for n in rows]


@router.put("/layer2/notes/{note_id}", response_model=NoteOut)
@_feature_endpoint("update_note")
async def update_note(
    note_id: int,
    data: NotesUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Annotation).where(Annotation.id == note_id, _eq_id(Annotation.user_id, user_id)))
    note = res.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if data.section is not None:
        note.section = data.section
    note.text = data.text
    await db.commit()
    await db.refresh(note)
    return NoteOut(id=note.id, paper_id=note.paper_id, section=note.section, text=note.text, created_at=note.created_at.isoformat() if note.created_at else "")


@router.delete("/layer2/notes/{note_id}")
@_feature_endpoint("delete_note")
async def delete_note(
    note_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Annotation).where(Annotation.id == note_id, _eq_id(Annotation.user_id, user_id)))
    note = res.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)
    await db.commit()
    return {"message": f"Note {note_id} deleted"}


@router.get("/layer2/datasets", response_model=DatasetExplorerResponse)
@_feature_endpoint("dataset_explorer")
async def dataset_explorer():
    papers = await list_papers()
    by_dataset: Counter[str] = Counter()
    for p in papers:
        by_dataset.update([d.name for d in p.datasets if d.name])

    rows = [
        DatasetUsage(name=name, usage_count=count, trend="stable")
        for name, count in by_dataset.most_common(100)
    ]
    return DatasetExplorerResponse(total_unique=len(by_dataset), datasets=rows)


@router.get("/layer2/methods/timeline", response_model=TrendResponse)
@_feature_endpoint("method_timeline")
async def method_timeline():
    return await trends()


@router.get("/layer2/field-health", response_model=FieldHealthResponse)
@_feature_endpoint("field_health")
async def field_health():
    papers = await list_papers()
    if not papers:
        return FieldHealthResponse(
            overall_health_score=0,
            reproducibility_rate=0,
            code_availability_rate=0,
            benchmark_saturation_score=0,
            papers_count=0,
        )

    repro_ok = sum(1 for p in papers if p.hyperparameters and p.hyperparameters.disclosed)
    code_ok = sum(1 for p in papers if p.code_link)

    dataset_counter: Counter[str] = Counter()
    for p in papers:
        dataset_counter.update([d.name for d in p.datasets if d.name])
    top_dataset_use = dataset_counter.most_common(1)[0][1] if dataset_counter else 0
    saturation = min(1.0, top_dataset_use / max(1, len(papers)))

    reproducibility_rate = repro_ok / len(papers)
    code_rate = code_ok / len(papers)
    overall = round((reproducibility_rate * 0.45 + code_rate * 0.35 + (1 - saturation) * 0.20) * 100, 2)

    return FieldHealthResponse(
        overall_health_score=overall,
        reproducibility_rate=round(reproducibility_rate * 100, 2),
        code_availability_rate=round(code_rate * 100, 2),
        benchmark_saturation_score=round(saturation * 100, 2),
        papers_count=len(papers),
    )


@router.post("/layer2/compare", response_model=CompareResponse)
@_feature_endpoint("compare_papers")
async def compare_papers(data: CompareRequest):
    # Allow practical compare range while avoiding oversized payloads.
    ids = [x.strip() for x in data.paper_ids if x and x.strip()]
    if len(ids) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 paper IDs to compare")
    if len(ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 papers can be compared at once")

    rows: list[CompareRow] = []
    method_sets: list[set[str]] = []
    dataset_sets: list[set[str]] = []

    for pid in ids:
        p = await get_paper(pid)
        if not p:
            continue

        methods = sorted({m.name for m in p.methods if m.name})
        datasets = sorted({d.name for d in p.datasets if d.name})
        metrics = [f"{m.metric_name}: {m.value}" for m in p.metrics if m.metric_name and m.value]

        rep = 50.0
        rep += 15 if p.code_link else 0
        rep += 10 if p.data_link else 0
        rep += 10 if p.hyperparameters and p.hyperparameters.disclosed else 0
        rep += 10 if p.compute and p.compute.disclosed else 0
        rep += 5 if p.metrics else 0
        rep = min(rep, 100.0)

        trans = 45.0
        trans += 20 if p.abstract else 0
        trans += 15 if p.limitations else 0
        trans += 10 if p.methods else 0
        trans += 10 if p.datasets else 0
        trans = min(trans, 100.0)

        eval_q = 40.0
        eval_q += 20 if len(p.metrics) >= 2 else 0
        eval_q += 20 if p.baseline else 0
        eval_q += 10 if len(p.datasets) >= 2 else 0
        eval_q += 10 if len(p.claims) >= 2 else 0
        eval_q = min(eval_q, 100.0)
        overall = round((rep + trans + eval_q) / 3.0, 2)

        rows.append(
            CompareRow(
                paper_id=p.id,
                title=p.title,
                year=p.year,
                authors=p.authors,
                methods=methods,
                datasets=datasets,
                metrics=metrics,
                claims_count=len(p.claims),
                limitations_count=len(p.limitations),
                credibility_overall_rci=overall,
            )
        )
        method_sets.append(set(methods))
        dataset_sets.append(set(datasets))

    if len(rows) < 2:
        raise HTTPException(status_code=404, detail="At least 2 valid papers are required for comparison")

    common_methods = sorted(set.intersection(*method_sets)) if method_sets else []
    common_datasets = sorted(set.intersection(*dataset_sets)) if dataset_sets else []

    return CompareResponse(
        compared_count=len(rows),
        common_methods=common_methods,
        common_datasets=common_datasets,
        rows=rows,
    )
