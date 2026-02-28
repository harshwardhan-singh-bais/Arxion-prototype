"""
Multi-Paper Intelligence schemas — Component C
"""
from pydantic import BaseModel
from typing import Optional
from enum import Enum


class MatrixRow(BaseModel):
    paper_id: str
    title: str
    authors: list[str]
    year: Optional[int]
    tags: list[str]
    rci: float
    grade: str
    risk_flags: list[str]
    datasets: list[str]        # dataset names only (for display)
    methods: list[str]         # method names only
    claims_count: int
    metrics_count: int
    has_code: bool
    has_data: bool
    status: str                # "VERIFIED" | "CONTRADICTION" | "BASELINE" | "PROCESSING" | "FAILED"
    top_flag: Optional[str]    # most severe flag for the matrix "status" cell


class MatrixResponse(BaseModel):
    papers: list[MatrixRow]
    total: int
    avg_rci: float


# ── Graph schemas ─────────────────────────────────────────────────────────────

class NodeType(str, Enum):
    PAPER   = "paper"
    DATASET = "dataset"
    METHOD  = "method"


class EdgeType(str, Enum):
    USES_DATASET = "uses_dataset"
    USES_METHOD  = "uses_method"
    CONTRADICTS  = "contradicts"


class GraphNode(BaseModel):
    id: str
    type: NodeType
    label: str
    paper_id: Optional[str] = None   # for paper nodes
    rci: Optional[float] = None      # for paper nodes
    size: float = 1.0                # scaled by importance
    color: str


class GraphEdge(BaseModel):
    source: str                      # node id
    target: str                      # node id
    type: EdgeType
    color: str
    opacity: float = 0.6


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    node_count: int
    edge_count: int
