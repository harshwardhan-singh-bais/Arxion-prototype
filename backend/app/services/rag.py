"""
RAG Chat Service — Component F
Multi-paper semantic retrieval + Gemini citation-backed generation.
"""
import logging
from app.models.chat import ChatRequest, ChatResponse, ChatSource
from app.services.vector_store import search_chunks
from app.models.store import get_paper
from app.core.gemini import generate_text

logger = logging.getLogger(__name__)


async def chat_with_matrix(request: ChatRequest) -> ChatResponse:
    """
    1. Retrieve top-k chunks from Qdrant (optionally scoped to paper_ids)
    2. Build a grounded Gemini prompt with inline source numbering
    3. Return the answer + source chips for the frontend terminal UI
    """
    # ── Step 1: Retrieve relevant chunks ─────────────────────────────────────
    hits = await search_chunks(
        query=request.query,
        paper_ids=request.paper_ids,
        limit=request.limit,
    )

    if not hits:
        return ChatResponse(
            answer="NO RELEVANT CONTEXT FOUND IN THE KNOWLEDGE MATRIX. UPLOAD MORE PAPERS OR BROADEN YOUR QUERY.",
            sources=[],
            query_embedding_used=True,
        )

    # ── Step 2: Build source-numbered context block ───────────────────────────
    source_titles: dict[str, str] = {}
    context_parts: list[str] = []

    for i, hit in enumerate(hits, start=1):
        paper_id = hit.get("paper_id", "")
        if paper_id not in source_titles:
            p = get_paper(paper_id)
            source_titles[paper_id] = p.title if p else paper_id

        context_parts.append(
            f"[SOURCE {i} | {source_titles[paper_id]} | chunk #{hit.get('chunk_index', '?')}]\n"
            f"{hit['text']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    # ── Step 3: Gemini RAG generation ─────────────────────────────────────────
    prompt = f"""\
You are ARXION, a research intelligence system. Using ONLY the provided source excerpts from scientific papers, answer the researcher's query.

Rules:
- Base your answer STRICTLY on the provided sources
- Cite sources inline as [SOURCE N]
- Be specific and technical — this is for researchers
- Write in UPPERCASE (terminal UI aesthetic)
- If sources don't answer the question, reply: "INSUFFICIENT EVIDENCE IN CURRENT KNOWLEDGE MATRIX"
- Do NOT hallucinate information not present in sources

RESEARCHER QUERY: {request.query}

SOURCE CONTEXT:
{context}

ANSWER:"""

    try:
        answer = await generate_text(prompt, temperature=0.2, max_tokens=1024)
    except Exception as e:
        logger.error(f"RAG generation failed: {e}")
        answer = "SYSTEM ERROR: KNOWLEDGE MATRIX GENERATION FAILED. CHECK GEMINI API KEY."

    # ── Step 4: Build frontend source chips ───────────────────────────────────
    sources = [
        ChatSource(
            paper_id=hit.get("paper_id", ""),
            title=source_titles.get(hit.get("paper_id", ""), None),
            section=f"chunk #{hit.get('chunk_index', '?')}",
            snippet=hit["text"][:200] + ("…" if len(hit["text"]) > 200 else ""),
            confidence=round(hit["score"], 3),
        )
        for hit in hits
    ]

    return ChatResponse(
        answer=answer.strip().upper(),
        sources=sources,
        query_embedding_used=True,
    )
