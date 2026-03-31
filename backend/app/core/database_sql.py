"""
Neon PostgreSQL database layer via SQLAlchemy async + asyncpg.
Connection-pooling compatible with Neon serverless.
"""
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text, inspect

from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpg does not support ?sslmode=require in the connection string.
# We strip query params and manually pass {"ssl": "require"} to connect_args
if "?" in db_url:
    db_url = db_url.split("?")[0]

is_sqlite = db_url.startswith("sqlite")

engine_kwargs = {
    "echo": settings.DEBUG,
}

if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {"ssl": "require"} if "neon" in db_url else {}
    })

engine = create_async_engine(db_url, **engine_kwargs)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_sql_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        from app.models.sql_models import (  # noqa
            User,
            Paper,
            PaperVersion,
            Gap,
            ProcessingLog,
            Annotation,
            Collection,
            CollectionPaper,
            SavedQuery,
        )
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_schema_compatibility(conn)
    logger.info("Neon PostgreSQL database initialized.")


async def _ensure_schema_compatibility(conn) -> None:
    """
    Ensure existing databases remain compatible with current SQLAlchemy models.
    This applies lightweight additive migrations for missing columns.
    """

    def _get_columns(sync_conn, table_name: str) -> set[str]:
        insp = inspect(sync_conn)
        try:
            return {c["name"] for c in insp.get_columns(table_name)}
        except Exception:
            return set()

    paper_columns = await conn.run_sync(_get_columns, "papers")
    if not paper_columns:
        return

    dialect = conn.dialect.name
    ddl: list[str] = []

    if "error_message" not in paper_columns:
        ddl.append("ALTER TABLE papers ADD COLUMN error_message TEXT")

    if "progress_percentage" not in paper_columns:
        ddl.append("ALTER TABLE papers ADD COLUMN progress_percentage INTEGER DEFAULT 0")

    if "rci_score" not in paper_columns:
        ddl.append("ALTER TABLE papers ADD COLUMN rci_score DOUBLE PRECISION")

    if "extracted_data" not in paper_columns:
        if dialect == "postgresql":
            ddl.append("ALTER TABLE papers ADD COLUMN extracted_data JSON")
        else:
            ddl.append("ALTER TABLE papers ADD COLUMN extracted_data JSON")

    if "created_at" not in paper_columns:
        if dialect == "postgresql":
            ddl.append("ALTER TABLE papers ADD COLUMN created_at TIMESTAMPTZ")
        else:
            ddl.append("ALTER TABLE papers ADD COLUMN created_at DATETIME")

    if "updated_at" not in paper_columns:
        if dialect == "postgresql":
            ddl.append("ALTER TABLE papers ADD COLUMN updated_at TIMESTAMPTZ")
        else:
            ddl.append("ALTER TABLE papers ADD COLUMN updated_at DATETIME")

    for statement in ddl:
        try:
            await conn.execute(text(statement))
            logger.info(f"Applied schema compatibility patch: {statement}")
        except Exception as e:
            logger.warning(f"Schema patch skipped/failed: {statement} :: {e}")


async def get_db():
    """FastAPI dependency — yields a DB session."""
    async with SessionLocal() as session:
        yield session
