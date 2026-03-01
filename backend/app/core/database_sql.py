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
        from app.models.sql_models import User, Paper, PaperVersion, Gap, ProcessingLog  # noqa
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Neon PostgreSQL database initialized.")


async def get_db():
    """FastAPI dependency — yields a DB session."""
    async with SessionLocal() as session:
        yield session
