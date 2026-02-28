"""
Text chunking service using LangChain RecursiveCharacterTextSplitter.
Produces semantically meaningful overlapping chunks for embedding.
"""
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Chunk sizes are tuned for research papers:
#   1000 tokens ≈ 4000 chars with 200-char overlap to preserve context across section boundaries
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
)


def chunk_text(text: str) -> list[str]:
    """Split raw text into overlapping chunks."""
    if not text or not text.strip():
        logger.warning("chunk_text() received empty text, returning empty list.")
        return []
    chunks = _splitter.split_text(text)
    logger.info(f"Text split into {len(chunks)} chunks.")
    return chunks
