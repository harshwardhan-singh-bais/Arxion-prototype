from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_qdrant
from app.core.database_sql import init_sql_db
from app.routers import papers, upload, status, profile, gaps, chat, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize connections on startup."""
    await init_qdrant()
    await init_sql_db()
    yield


app = FastAPI(
    title="Arxion",
    description="Research Credibility & Intelligence Engine",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(papers.router, prefix="/api/v1", tags=["Papers"])
app.include_router(status.router, prefix="/api/v1", tags=["Status"])
app.include_router(profile.router, prefix="/api/v1", tags=["Profile"])
app.include_router(gaps.router, prefix="/api/v1", tags=["Gaps"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(export.router, prefix="/api/v1", tags=["Export"])


@app.get("/")
async def root():
    return {"status": "online", "message": "Arxion Backend API Engine Active", "docs_url": "/docs"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "0.2.0"}
