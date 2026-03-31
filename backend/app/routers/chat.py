"""
Chat Router — RAG query interface over ingested paper chunks.
POST /api/v1/chat
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
from app.services.vector_store import search_chunks
from app.core.gemini import get_generation_model

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    query: str
    paper_ids: list[str] | None = None

class Citation(BaseModel):
    paper_id: str
    chunk_index: int
    text: str
    score: float

class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]

@router.post("/chat", response_model=ChatResponse, summary="Chat with papers using RAG")
async def chat_with_papers(req: ChatRequest):
    log_feature_start(logger, "RAG", "chat", "Chat query received", query_length=len(req.query or ""), scoped=bool(req.paper_ids), paper_scope_count=len(req.paper_ids or []))
    print(f"\n[{'*'*15} RAG CHAT TRIGGERED {'*'*15}]")
    print(f"💬 Query: '{req.query}'")
    
    if not req.query.strip():
        print(f"❌ FAILURE: Empty query received.")
        log_feature_failure(logger, "RAG", "chat", "Empty query rejected")
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # 1. Retrieve context chunks from Qdrant
    print(f"🔍 Searching Qdrant Vector Store for context...")
    results = await search_chunks(req.query, req.paper_ids, limit=5)
    
    if not results:
        print(f"⚠️ WARNING: No semantic matches found in Database.")
        log_feature_failure(logger, "RAG", "chat_retrieval", "No semantic matches found", scoped=bool(req.paper_ids), paper_scope_count=len(req.paper_ids or []))
        return ChatResponse(
            answer="I couldn't find any relevant information in the selected papers to answer your question.",
            citations=[]
        )
    print(f"✅ Found {len(results)} relevant chunks in Qdrant.")
    log_feature_success(logger, "RAG", "chat_retrieval", "Semantic retrieval returned context", result_count=len(results))

    # 2. Construct context string and citation mapped list
    print(f"🧬 Constructing Grounded Context for LLM...")
    context_text = ""
    citations = []
    for idx, r in enumerate(results):
        context_text += f"\n--- Source [{idx+1}] (Paper ID: {r['paper_id']}) ---\n{r['text']}\n"
        citations.append(
            Citation(
                paper_id=r.get('paper_id', 'unknown'),
                chunk_index=r.get('chunk_index', 0),
                text=r.get('text', ''),
                score=r.get('score', 0.0)
            )
        )

    # 3. Prompt Gemini
    prompt = f"""You are Arxion, an advanced Research Intelligence Engine.
Answer the user's query using ONLY the provided context from research papers.
If the answer is not in the context, say "I cannot answer this based on the provided papers."
Be concise, analytical, and cite your sources using the source numbers e.g., [1], [2]. Do not format markdown references using actual links, just print the text citation.

CONTEXT:
{context_text}

USER QUERY:
{req.query}
"""
    try:
        print(f"🧠 Pinging Gemini LLM API over RAG context...")
        model = get_generation_model()
        response = model.generate_content(prompt)
        answer = response.text
        print(f"✅ Gemini Response Received: {len(answer)} characters.")
        log_feature_success(logger, "RAG", "chat_generation", "Generated grounded response", answer_length=len(answer), citation_count=len(citations))
    except Exception as e:
        print(f"❌ WARNING: Gemini LLM crashed -> {str(e)} (Mocking Response)")
        log_feature_failure(logger, "RAG", "chat_generation", "Generation failed; returning mocked response", error=e)
        answer = f"[MOCKED RAG RESPONSE] Because the Gemini API Key offline/invalid, I am operating offline. However, I found {len(results)} chunks of context in Qdrant matching your query!"

    print(f"[{'*'*15} CHAT CYCLE COMPLETE {'*'*15}]\n")
    log_feature_success(logger, "RAG", "chat", "Chat request completed", citation_count=len(citations))
    return ChatResponse(answer=answer, citations=citations)
