from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Status Enum ──────────────────────────────────────────────────────────────

class PaperStatus(str, Enum):
    INGESTED = "INGESTED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


# ── Evidence Pointer ──────────────────────────────────────────────────────────

class EvidencePointer(BaseModel):
    section: Optional[str] = None
    page: Optional[int] = None
    snippet: str


# ── Extracted Sub-schemas ─────────────────────────────────────────────────────

class ClaimData(BaseModel):
    statement: str
    evidence: list[EvidencePointer] = []


class DatasetData(BaseModel):
    name: str
    description: Optional[str] = None
    source: Optional[str] = None  # URL or citation


class MethodData(BaseModel):
    name: str
    description: Optional[str] = None


class MetricResult(BaseModel):
    metric_name: str
    value: str
    dataset: Optional[str] = None
    comparison_baseline: Optional[str] = None


class HyperparameterSignal(BaseModel):
    disclosed: bool
    details: Optional[str] = None


class ComputeDisclosure(BaseModel):
    disclosed: bool
    gpu_type: Optional[str] = None
    gpu_hours: Optional[float] = None
    details: Optional[str] = None


class LimitationData(BaseModel):
    description: str


# ── Core Paper ────────────────────────────────────────────────────────────────

class PaperBase(BaseModel):
    title: str
    authors: list[str] = []
    abstract: Optional[str] = None
    year: Optional[int] = None
    tags: list[str] = []


class PaperCreate(PaperBase):
    """Populated from the upload endpoint."""
    pass


class PaperInDB(PaperBase):
    """Full internal representation after processing."""
    id: str
    filename: Optional[str] = None
    file_path: Optional[str] = None
    status: PaperStatus = PaperStatus.INGESTED
    error_message: Optional[str] = None

    # Extracted intelligence
    claims: list[ClaimData] = []
    datasets: list[DatasetData] = []
    methods: list[MethodData] = []
    metrics: list[MetricResult] = []
    limitations: list[LimitationData] = []
    baseline: Optional[str] = None
    hyperparameters: Optional[HyperparameterSignal] = None
    compute: Optional[ComputeDisclosure] = None
    code_link: Optional[str] = None
    data_link: Optional[str] = None


class PaperResponse(PaperInDB):
    """API response model for a paper."""
    pass


# ── Upload response ───────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    paper_id: str
    filename: str
    status: PaperStatus
    message: str
