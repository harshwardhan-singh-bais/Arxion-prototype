"""
Autonomous Gap Intelligence Service — Component D
Detects research gaps via heuristics across all processed papers,
then uses Gemini to craft actionable, evidence-linked descriptions.
"""
import uuid
import logging
from collections import Counter
from datetime import datetime, timezone

from app.models.paper import PaperInDB, PaperStatus
from app.models.gaps import GapItem, GapFeed, GapType
from app.core.gemini import generate_text

logger = logging.getLogger(__name__)


# ── Heuristic Gap Detection ───────────────────────────────────────────────────

def _detect_dataset_saturation(papers: list[PaperInDB]) -> list[dict]:
    """Flag datasets appearing in 3+ papers — potential saturation zone."""
    dataset_counts = Counter(d.name for p in papers for d in p.datasets)
    signals = []
    for ds_name, count in dataset_counts.items():
        if count >= 3:
            paper_ids = [p.id for p in papers if any(d.name == ds_name for d in p.datasets)]
            signals.append({
                "type": GapType.DATA_SATURATION,
                "dataset": ds_name,
                "count": count,
                "paper_ids": paper_ids[:6],
            })
    return signals


def _detect_missing_combos(papers: list[PaperInDB]) -> list[dict]:
    """Flag dataset–method combinations that exist independently but no paper has combined."""
    all_datasets = {d.name for p in papers for d in p.datasets}
    all_methods  = {m.name for p in papers for m in p.methods}

    tested = {
        (d.name, m.name)
        for p in papers
        for d in p.datasets
        for m in p.methods
    }

    signals = []
    for ds in all_datasets:
        for meth in all_methods:
            if (ds, meth) not in tested:
                signals.append({
                    "type": GapType.MISSING_COMBINATION,
                    "dataset": ds,
                    "method": meth,
                    "paper_ids": [],
                })
            if len(signals) >= 5:
                return signals
    return signals


def _detect_benchmark_inflation(papers: list[PaperInDB]) -> list[dict]:
    """Flag datasets with 4+ metric entries — potential benchmark inflation."""
    dataset_metric_counts = Counter(m.dataset for p in papers for m in p.metrics if m.dataset)
    signals = []
    for ds, count in dataset_metric_counts.items():
        if count >= 4:
            paper_ids = [p.id for p in papers if any(m.dataset == ds for m in p.metrics)]
            signals.append({
                "type": GapType.BENCHMARK_INFLATION,
                "dataset": ds,
                "count": count,
                "paper_ids": paper_ids[:6],
            })
    return signals


def _detect_stagnation(papers: list[PaperInDB]) -> list[dict]:
    """Flag methods that haven't appeared in papers newer than 1 year ago."""
    current_year = datetime.now(timezone.utc).year
    method_years: dict[str, list[int]] = {}
    for p in papers:
        if p.year:
            for m in p.methods:
                method_years.setdefault(m.name, []).append(p.year)

    signals = []
    for method, years in method_years.items():
        if max(years) < current_year - 1 and len(years) >= 2:
            paper_ids = [p.id for p in papers if any(m.name == method for m in p.methods)]
            signals.append({
                "type": GapType.FIELD_STAGNATION,
                "method": method,
                "last_seen": max(years),
                "paper_ids": paper_ids,
            })
            if len(signals) >= 3:
                break
    return signals


# ── Gemini Enrichment ─────────────────────────────────────────────────────────

async def _rewrite_gap(signal: dict) -> str:
    """Use Gemini to turn a heuristic signal into an insightful gap description."""
    prompt = f"""\
You are a research intelligence analyst. Given a raw research gap signal detected by an automated system, write a clear, expert 2-3 sentence analysis.

Signal data: {signal}

Rules:
- Be specific and technical; name the dataset/method from the signal
- Frame it as an actionable research opportunity or warning
- Do NOT use markdown or bullet points
- Keep to 2-3 sentences maximum
- Write in UPPERCASE (cyberpunk terminal UI)

Analysis:"""
    try:
        return await generate_text(prompt, temperature=0.3, max_tokens=256)
    except Exception as e:
        logger.warning(f"Gap rewrite failed: {e}")
        return _title_from_signal(signal).upper()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _title_from_signal(sig: dict) -> str:
    t = sig["type"]
    if t == GapType.DATA_SATURATION:
        return f"{sig.get('dataset', '?')} Benchmark Saturated ({sig.get('count', '?')} papers)"
    if t == GapType.MISSING_COMBINATION:
        return f"Unexplored: {sig.get('method', '?')} on {sig.get('dataset', '?')}"
    if t == GapType.BENCHMARK_INFLATION:
        return f"Benchmark Inflation Detected: {sig.get('dataset', '?')}"
    if t == GapType.FIELD_STAGNATION:
        return f"Stagnation: {sig.get('method', '?')} (last seen {sig.get('last_seen', '?')})"
    return "Research Gap Detected"


def _confidence_from_signal(sig: dict) -> int:
    paper_count = len(sig.get("paper_ids", []))
    return min(98, 60 + paper_count * 7)


# ── Public API ────────────────────────────────────────────────────────────────

async def build_gap_feed(papers: list[PaperInDB]) -> GapFeed:
    """Run all heuristics and Gemini-enrich each gap candidate."""
    processed = [p for p in papers if p.status == PaperStatus.PROCESSED]

    if len(processed) < 2:
        return GapFeed(gaps=[], total=0, scan_timestamp=datetime.now(timezone.utc).isoformat())

    raw_signals: list[dict] = []
    raw_signals.extend(_detect_dataset_saturation(processed))
    raw_signals.extend(_detect_missing_combos(processed))
    raw_signals.extend(_detect_benchmark_inflation(processed))
    raw_signals.extend(_detect_stagnation(processed))
    raw_signals = raw_signals[:10]  # Cap at 10 items

    enriched: list[GapItem] = []
    for sig in raw_signals:
        description = await _rewrite_gap(sig)
        enriched.append(GapItem(
            id=str(uuid.uuid4()),
            type=sig["type"],
            title=_title_from_signal(sig),
            description=description.strip().upper(),
            confidence=_confidence_from_signal(sig),
            affected_datasets=[sig["dataset"]] if "dataset" in sig else [],
            affected_methods=[sig["method"]]   if "method"  in sig else [],
            evidence_paper_ids=sig.get("paper_ids", []),
            raw_signal=str(sig),
        ))

    return GapFeed(
        gaps=enriched,
        total=len(enriched),
        scan_timestamp=datetime.now(timezone.utc).isoformat(),
    )
