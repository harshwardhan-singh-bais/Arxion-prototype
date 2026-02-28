"""
Chat / RAG schemas — Component F
"""
from pydantic import BaseModel
from typing import Optional


class ChatSource(BaseModel):
    paper_id: str
    title: Optional[str]
    section: Optional[str]
    snippet: str
    confidence: float


class ChatRequest(BaseModel):
    query: str
    paper_ids: Optional[list[str]] = None   # scope to specific papers (None = all)
    limit: int = 8                           # number of chunks to retrieve


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    query_embedding_used: bool


# ── Export schemas — Component G ──────────────────────────────────────────────

class RelatedWorkRequest(BaseModel):
    paper_ids: list[str]
    topic_hint: Optional[str] = None


class RelatedWorkResponse(BaseModel):
    paragraph: str
    paper_ids_used: list[str]


class ExportCSVRequest(BaseModel):
    paper_ids: Optional[list[str]] = None   # None = export all
    include_credibility: bool = True
