"""
Research Credibility Engine — Component B
==========================================
Scores each ingested paper across three independent axes:

  1. Reproducibility Score  (0–100)  — Can someone actually reproduce this?
  2. Confidence Score       (0–100)  — Is the evidence solid and complete?
  3. Transparency Score     (0–100)  — How much did the authors disclose?

RCI (Research Credibility Index):
  RCI = (Reproducibility × 0.50) + (Confidence × 0.30) + (Transparency × 0.20)

Grades:  A≥85 | B≥70 | C≥55 | D≥40 | F<40
"""
from app.models.paper import PaperInDB
from app.models.credibility import (
    CredibilityReport,
    RiskFlag,
    ReproducibilityBreakdown,
    ConfidenceBreakdown,
    TransparencyBreakdown,
)


# ── Risk Flag Deduction Table ─────────────────────────────────────────────────
# Each flag deducts this many points from the Transparency base score of 100
_FLAG_DEDUCTIONS: dict[RiskFlag, int] = {
    RiskFlag.NO_CODE_LINK:        15,
    RiskFlag.NO_DATA_LINK:        12,
    RiskFlag.MISSING_HYPERPARAMS: 15,
    RiskFlag.MISSING_COMPUTE:     10,
    RiskFlag.NO_LIMITATIONS:      10,
    RiskFlag.NO_BASELINE:         10,
    RiskFlag.MISSING_METRICS:     12,
    RiskFlag.WEAK_CLAIM_EVIDENCE: 10,
    RiskFlag.NO_CLAIMS:           15,
    RiskFlag.NO_DATASETS:         12,
    RiskFlag.SINGLE_DATASET:       5,
    RiskFlag.NO_METHODS:           8,
}


def _rci_grade(rci: float) -> str:
    if rci >= 85: return "A"
    if rci >= 70: return "B"
    if rci >= 55: return "C"
    if rci >= 40: return "D"
    return "F"


def _reproduction_effort(repro_score: float, flags: list[RiskFlag]) -> tuple[str, str]:
    """Estimate how hard it would be so reproduce this paper."""
    high_risk = {RiskFlag.NO_CODE_LINK, RiskFlag.MISSING_HYPERPARAMS, RiskFlag.MISSING_COMPUTE}
    active_high = high_risk.intersection(set(flags))

    if repro_score >= 75 and not active_high:
        return "LOW", "Paper discloses code, data, hyperparameters, and compute. Reproduction is achievable."
    if repro_score >= 50 or len(active_high) <= 1:
        return "MEDIUM", "Some key details are missing. Reproduction requires additional engineering effort to fill gaps."
    if repro_score >= 25 or len(active_high) == 2:
        return "HIGH", "Multiple critical details (code, hyperparameters, or compute) are undisclosed. Significant effort required."
    return "VERY HIGH", "Paper is largely non-reproducible. Code, data, hyperparameters, and/or compute are all missing."


# ── Scoring Axes ──────────────────────────────────────────────────────────────

def _score_reproducibility(paper: PaperInDB) -> ReproducibilityBreakdown:
    code  = 25 if paper.code_link else 0
    data  = 20 if paper.data_link else 0
    hp    = 25 if (paper.hyperparameters and paper.hyperparameters.disclosed) else 0
    comp  = 15 if (paper.compute and paper.compute.disclosed) else 0
    lims  = 10 if paper.limitations else 0
    multi = 5  if len(paper.datasets) > 1 else 0

    total = code + data + hp + comp + lims + multi

    return ReproducibilityBreakdown(
        code_availability=code,
        data_availability=data,
        hyperparams_disclosed=hp,
        compute_disclosed=comp,
        limitations_present=lims,
        multi_dataset_benchmark=multi,
        total=total,
    )


def _score_confidence(paper: PaperInDB) -> ConfidenceBreakdown:
    abstract = 10 if paper.abstract else 0
    authors  = 5  if paper.authors else 0
    year     = 5  if paper.year else 0
    metrics  = 20 if paper.metrics else 0
    baseline = 20 if paper.baseline else 0

    # Claim-to-evidence ratio: each claim should have ≥1 evidence pointer
    # Score scales from 0 → 40 based on average evidence per claim
    if not paper.claims:
        claim_ev_score = 0
    else:
        avg_evidence = sum(len(c.evidence) for c in paper.claims) / len(paper.claims)
        # avg_evidence of 0 → 0pts, 1 → 20pts, 2+ → 40pts (capped)
        claim_ev_score = min(40, int(avg_evidence * 20))

    total = abstract + authors + year + claim_ev_score + metrics + baseline

    return ConfidenceBreakdown(
        has_abstract=abstract,
        has_authors=authors,
        has_year=year,
        claim_evidence_ratio=claim_ev_score,
        has_metrics=metrics,
        has_baseline=baseline,
        total=total,
    )


def _detect_risk_flags(paper: PaperInDB) -> list[RiskFlag]:
    flags: list[RiskFlag] = []

    if not paper.code_link:
        flags.append(RiskFlag.NO_CODE_LINK)
    if not paper.data_link:
        flags.append(RiskFlag.NO_DATA_LINK)
    if not paper.hyperparameters or not paper.hyperparameters.disclosed:
        flags.append(RiskFlag.MISSING_HYPERPARAMS)
    if not paper.compute or not paper.compute.disclosed:
        flags.append(RiskFlag.MISSING_COMPUTE)
    if not paper.limitations:
        flags.append(RiskFlag.NO_LIMITATIONS)
    if not paper.baseline:
        flags.append(RiskFlag.NO_BASELINE)
    if not paper.metrics:
        flags.append(RiskFlag.MISSING_METRICS)
    if not paper.claims:
        flags.append(RiskFlag.NO_CLAIMS)
    elif sum(len(c.evidence) for c in paper.claims) / len(paper.claims) < 1.0:
        flags.append(RiskFlag.WEAK_CLAIM_EVIDENCE)
    if not paper.datasets:
        flags.append(RiskFlag.NO_DATASETS)
    elif len(paper.datasets) == 1:
        flags.append(RiskFlag.SINGLE_DATASET)
    if not paper.methods:
        flags.append(RiskFlag.NO_METHODS)

    return flags


def _score_transparency(flags: list[RiskFlag]) -> TransparencyBreakdown:
    deductions: dict[str, int] = {}
    base = 100

    for flag in flags:
        deduction = _FLAG_DEDUCTIONS.get(flag, 0)
        if deduction:
            deductions[flag.value] = deduction
            base -= deduction

    total = max(0, base)  # Floor at 0
    return TransparencyBreakdown(
        base_score=100,
        deductions=deductions,
        total=total,
    )


# ── Public API ────────────────────────────────────────────────────────────────

def compute_credibility(paper: PaperInDB) -> CredibilityReport:
    """
    Compute the full credibility report for a processed paper.
    Returns a CredibilityReport with all scores, breakdowns, flags, and RCI.
    """
    repro_breakdown  = _score_reproducibility(paper)
    conf_breakdown   = _score_confidence(paper)
    flags            = _detect_risk_flags(paper)
    trans_breakdown  = _score_transparency(flags)

    repro_score  = float(repro_breakdown.total)
    conf_score   = float(conf_breakdown.total)
    trans_score  = float(trans_breakdown.total)

    # Weighted composite
    rci = round(
        (repro_score * 0.50) +
        (conf_score  * 0.30) +
        (trans_score * 0.20),
        1
    )

    effort, notes = _reproduction_effort(repro_score, flags)

    return CredibilityReport(
        paper_id=paper.id,
        reproducibility_score=repro_score,
        confidence_score=conf_score,
        transparency_score=trans_score,
        rci=rci,
        grade=_rci_grade(rci),
        reproducibility_breakdown=repro_breakdown,
        confidence_breakdown=conf_breakdown,
        transparency_breakdown=trans_breakdown,
        risk_flags=flags,
        reproduction_effort=effort,
        reproduction_notes=notes,
    )
