"""
Component C router — Multi-Paper Intelligence
GET /api/v1/matrix
GET /api/v1/graph
"""
from fastapi import APIRouter, Query
from app.models.matrix import MatrixResponse, GraphResponse
from app.models.store import list_papers
from app.services.matrix import build_matrix, build_graph

router = APIRouter()


@router.get(
    "/matrix",
    response_model=MatrixResponse,
    summary="Literature Matrix — all processed papers with RCI scores and filters",
)
async def get_matrix(
    tag:     str | None = Query(default=None, description="Filter by topic tag"),
    dataset: str | None = Query(default=None, description="Filter by dataset name"),
    method:  str | None = Query(default=None, description="Filter by method name"),
):
    """
    Returns the full literature matrix — all processed papers, sorted by RCI.
    Supports filtering by tag, dataset, and method.
    Maps directly to the frontend Matrix Table page.
    """
    papers = list_papers()
    return build_matrix(papers, tag=tag, dataset=dataset, method=method)


@router.get(
    "/graph",
    response_model=GraphResponse,
    summary="Knowledge Graph — nodes and edges for all processed papers",
)
async def get_graph():
    """
    Returns all graph nodes (papers, datasets, methods) and edges
    (uses_dataset, uses_method, contradicts).
    Maps directly to the frontend 3D graph renderer.
    """
    papers = list_papers()
    return build_graph(papers)
