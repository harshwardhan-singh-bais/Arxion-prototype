"""
Credibility Engine response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Risk Flags ────────────────────────────────────────────────────────────────

class RiskFlag(str, Enum):
    NO_CODE_LINK          = "NO_CODE_LINK"
    NO_DATA_LINK          = "NO_DATA_LINK"
    MISSING_HYPERPARAMS   = "MISSING_HYPERPARAMS"
    MISSING_COMPUTE       = "MISSING_COMPUTE"
    NO_LIMITATIONS        = "NO_LIMITATIONS"
    NO_BASELINE           = "NO_BASELINE"
    MISSING_METRICS       = "MISSING_METRICS"
    WEAK_CLAIM_EVIDENCE   = "WEAK_CLAIM_EVIDENCE"   # avg evidence-per-claim < 1
    NO_CLAIMS             = "NO_CLAIMS"
    SINGLE_DATASET        = "SINGLE_DATASET"         # only 1 dataset benchmarked
    NO_DATASETS           = "NO_DATASETS"
    NO_METHODS            = "NO_METHODS"


# ── Score Breakdowns ──────────────────────────────────────────────────────────

class ReproducibilityBreakdown(BaseModel):
    code_availability:        int = Field(ge=0, le=25, description="0 or 25 pts")
    data_availability:        int = Field(ge=0, le=20, description="0 or 20 pts")
    hyperparams_disclosed:    int = Field(ge=0, le=25, description="0 or 25 pts")
    compute_disclosed:        int = Field(ge=0, le=15, description="0 or 15 pts")
    limitations_present:      int = Field(ge=0, le=10, description="0 or 10 pts")
    multi_dataset_benchmark:  int = Field(ge=0, le=5,  description="0 or 5 pts")
    total: int = Field(ge=0, le=100)


class ConfidenceBreakdown(BaseModel):
    has_abstract:             int = Field(ge=0, le=10,  description="0 or 10 pts")
    has_authors:              int = Field(ge=0, le=5,   description="0 or 5 pts")
    has_year:                 int = Field(ge=0, le=5,   description="0 or 5 pts")
    claim_evidence_ratio:     int = Field(ge=0, le=40,  description="0–40 pts based on avg evidence per claim")
    has_metrics:              int = Field(ge=0, le=20,  description="0 or 20 pts")
    has_baseline:             int = Field(ge=0, le=20,  description="0 or 20 pts")
    total: int = Field(ge=0, le=100)


class TransparencyBreakdown(BaseModel):
    base_score:   int = Field(default=100, description="Starts at 100, deducted per risk flag")
    deductions:   dict[str, int] = Field(default_factory=dict, description="flag → points deducted")
    total: int = Field(ge=0, le=100)


# ── Main Credibility Response ─────────────────────────────────────────────────

class CredibilityReport(BaseModel):
    paper_id: str

    # Scores
    reproducibility_score: float = Field(ge=0.0, le=100.0)
    confidence_score:      float = Field(ge=0.0, le=100.0)
    transparency_score:    float = Field(ge=0.0, le=100.0)
    rci:                   float = Field(ge=0.0, le=100.0, description="Research Credibility Index (weighted composite)")

    # Grade (A–F derived from RCI)
    grade: str

    # Breakdowns (clickable evidence for every component)
    reproducibility_breakdown: ReproducibilityBreakdown
    confidence_breakdown:      ConfidenceBreakdown
    transparency_breakdown:    TransparencyBreakdown

    # Risk flags
    risk_flags: list[RiskFlag]

    # Estimated reproduction effort
    reproduction_effort: str   # "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH"
    reproduction_notes:  str
