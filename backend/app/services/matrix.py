"""
Multi-Paper Intelligence Service — Component C
Builds the Literature Matrix and 3D Knowledge Graph data.
"""
import hashlib
from app.models.paper import PaperInDB, PaperStatus
from app.models.matrix import MatrixRow, MatrixResponse, GraphResponse, GraphNode, GraphEdge, NodeType, EdgeType
from app.models.credibility import RiskFlag
from app.services.credibility import compute_credibility


# ── Matrix ────────────────────────────────────────────────────────────────────

def _derive_status(paper: PaperInDB, flags: list[RiskFlag]) -> tuple[str, str | None]:
    """Derive the frontend 'status' cell value from flags."""
    if not flags:
        return "VERIFIED", None
    # Contradiction-heavy flags
    high_severity = {RiskFlag.NO_CODE_LINK, RiskFlag.MISSING_HYPERPARAMS, RiskFlag.MISSING_COMPUTE}
    if high_severity.intersection(set(flags)):
        top = next(f for f in flags if f in high_severity)
        return "CONTRADICTION", top.value
    return "VERIFIED", flags[0].value if flags else None


def build_matrix(
    papers: list[PaperInDB],
    tag: str | None = None,
    dataset: str | None = None,
    method: str | None = None,
) -> MatrixResponse:
    processed = [p for p in papers if p.status == PaperStatus.PROCESSED]

    rows: list[MatrixRow] = []
    for paper in processed:
        report = compute_credibility(paper)
        status_label, top_flag = _derive_status(paper, report.risk_flags)

        row = MatrixRow(
            paper_id=paper.id,
            title=paper.title,
            authors=paper.authors,
            year=paper.year,
            tags=paper.tags,
            rci=report.rci,
            grade=report.grade,
            risk_flags=[f.value for f in report.risk_flags],
            datasets=[d.name for d in paper.datasets],
            methods=[m.name for m in paper.methods],
            claims_count=len(paper.claims),
            metrics_count=len(paper.metrics),
            has_code=bool(paper.code_link),
            has_data=bool(paper.data_link),
            status=status_label,
            top_flag=top_flag,
        )
        rows.append(row)

    # Apply filters
    if tag:
        rows = [r for r in rows if any(tag.lower() in t.lower() for t in r.tags)]
    if dataset:
        rows = [r for r in rows if any(dataset.lower() in d.lower() for d in r.datasets)]
    if method:
        rows = [r for r in rows if any(method.lower() in m.lower() for m in r.methods)]

    # Sort by RCI descending
    rows.sort(key=lambda r: r.rci, reverse=True)

    avg_rci = round(sum(r.rci for r in rows) / len(rows), 1) if rows else 0.0
    return MatrixResponse(papers=rows, total=len(rows), avg_rci=avg_rci)


# ── Graph ─────────────────────────────────────────────────────────────────────

def _stable_id(prefix: str, name: str) -> str:
    """Deterministic node ID from name so multiple papers sharing a dataset get the same node."""
    return f"{prefix}_{hashlib.md5(name.lower().encode()).hexdigest()[:8]}"


def build_graph(papers: list[PaperInDB]) -> GraphResponse:
    """
    Build knowledge graph nodes and edges from all processed papers.
    Nodes: paper (white), dataset (red), method (dark red)
    Edges: uses_dataset, uses_method, contradicts
    """
    processed = [p for p in papers if p.status == PaperStatus.PROCESSED]

    nodes: dict[str, GraphNode] = {}
    edges: list[GraphEdge] = []

    for paper in processed:
        report = compute_credibility(paper)

        # Paper node
        paper_node_id = f"paper_{paper.id}"
        nodes[paper_node_id] = GraphNode(
            id=paper_node_id,
            type=NodeType.PAPER,
            label=paper.title[:40] + ("…" if len(paper.title) > 40 else ""),
            paper_id=paper.id,
            rci=report.rci,
            size=0.3 + (report.rci / 100) * 0.7,  # size scales with RCI
            color="#ffffff",
        )

        # Dataset nodes + edges
        for dataset in paper.datasets:
            ds_id = _stable_id("ds", dataset.name)
            if ds_id not in nodes:
                nodes[ds_id] = GraphNode(
                    id=ds_id,
                    type=NodeType.DATASET,
                    label=dataset.name,
                    size=0.8,
                    color="#C02B0A",
                )
            edges.append(GraphEdge(
                source=paper_node_id,
                target=ds_id,
                type=EdgeType.USES_DATASET,
                color="#C02B0A",
                opacity=0.4,
            ))

        # Method nodes + edges
        for method in paper.methods:
            m_id = _stable_id("meth", method.name)
            if m_id not in nodes:
                nodes[m_id] = GraphNode(
                    id=m_id,
                    type=NodeType.METHOD,
                    label=method.name,
                    size=0.6,
                    color="#3C091E",
                )
            edges.append(GraphEdge(
                source=paper_node_id,
                target=m_id,
                type=EdgeType.USES_METHOD,
                color="#3C091E",
                opacity=0.3,
            ))

    return GraphResponse(
        nodes=list(nodes.values()),
        edges=edges,
        node_count=len(nodes),
        edge_count=len(edges),
    )
