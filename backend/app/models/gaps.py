"""
Gap Intelligence schemas — Component D
"""
from pydantic import BaseModel
from typing import Optional
from enum import Enum


class GapType(str, Enum):
    DATA_SATURATION     = "DATA_SATURATION"
    MISSING_COMBINATION = "MISSING_COMBINATION"
    CONTRADICTION       = "CONTRADICTION"
    BENCHMARK_INFLATION = "BENCHMARK_INFLATION"
    FIELD_STAGNATION    = "FIELD_STAGNATION"
    UNDEREXPLORED       = "UNDEREXPLORED"


class GapItem(BaseModel):
    id: str
    type: GapType
    title: str
    description: str        # AI-rewritten, evidence-linked summary
    confidence: int         # 0–100
    affected_datasets: list[str]
    affected_methods: list[str]
    evidence_paper_ids: list[str]
    raw_signal: str         # the heuristic signal before Gemini rewrite


class GapFeed(BaseModel):
    gaps: list[GapItem]
    total: int
    scan_timestamp: str


class ContradictionItem(BaseModel):
    paper_id_a: str
    title_a: str
    paper_id_b: str
    title_b: str
    claim_a: str
    claim_b: str
    similarity_score: float
    contradiction_type: str
    explanation: str
