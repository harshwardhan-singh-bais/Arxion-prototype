"""
Neon PostgreSQL database layer via SQLAlchemy async + asyncpg.
Connection-pooling compatible with Neon serverless.
"""
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"ssl": "require"} if "neon" in settings.DATABASE_URL else {},
)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_sql_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        from app.models.sql_models import User, Paper, PaperVersion, Gap, ProcessingLog  # noqa
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Neon PostgreSQL database initialized.")


async def get_db():
    """FastAPI dependency — yields a DB session."""
    async with SessionLocal() as session:
        yield session
