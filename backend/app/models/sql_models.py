"""
SQL models for Neon PostgreSQL — UUID primary keys, proper FKs.
Tables: users, papers, paper_versions, gaps, processing_logs
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database_sql import Base


def _utcnow():
    return datetime.now(timezone.utc)


def _uuid():
    return str(uuid.uuid4())


# ── Users ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    clerk_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(500), nullable=False)
    name = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), default=_utcnow)

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    paper_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    section = Column(String(255), nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)


# ── Papers ────────────────────────────────────────────────────────────────────

class Paper(Base):
    __tablename__ = "papers"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), default="Untitled")
    file_path = Column(String(1000), nullable=True)
    status = Column(String(50), default="INGESTED")
    progress_percentage = Column(Integer, default=0)
    rci_score = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    extracted_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


# ── Paper Versions ────────────────────────────────────────────────────────────

class PaperVersion(Base):
    __tablename__ = "paper_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    paper_id = Column(UUID(as_uuid=False), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, default=1)
    updated_at = Column(DateTime(timezone=True), default=_utcnow)


# ── Gaps ──────────────────────────────────────────────────────────────────────

class Gap(Base):
    __tablename__ = "gaps"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    linked_paper_ids = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow)


# ── Processing Logs ──────────────────────────────────────────────────────────

class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    paper_id = Column(UUID(as_uuid=False), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)


# ── Workspace Collections ───────────────────────────────────────────────────

class Collection(Base):
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=_utcnow)


class CollectionPaper(Base):
    __tablename__ = "collection_papers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    collection_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    paper_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)


class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    query_text = Column(Text, nullable=False)
    paper_ids = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
