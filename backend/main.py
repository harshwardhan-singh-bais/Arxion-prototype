from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_qdrant
from app.routers import papers, upload, status, credibility, matrix, intelligence, chat_export, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize connections on startup."""
    await init_qdrant()
    yield


app = FastAPI(
    title="Arxion",
    description="Research Credibility & Intelligence Engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,      prefix="/api/v1", tags=["A · Upload"])
app.include_router(papers.router,      prefix="/api/v1", tags=["A · Papers"])
app.include_router(status.router,      prefix="/api/v1", tags=["A · Status"])
app.include_router(credibility.router, prefix="/api/v1", tags=["B · Credibility"])
app.include_router(matrix.router,      prefix="/api/v1", tags=["C · Matrix & Graph"])
app.include_router(intelligence.router,prefix="/api/v1", tags=["D·E · Gap & Intelligence"])
app.include_router(chat_export.router, prefix="/api/v1", tags=["F·G · Chat & Export"])
app.include_router(auth.router,         prefix="/api/v1", tags=["H · Auth"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "0.1.0"}
