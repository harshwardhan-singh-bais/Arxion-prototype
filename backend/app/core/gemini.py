import logging
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure the Gemini client once at module load
genai.configure(api_key=settings.GEMINI_API_KEY)


async def get_embeddings(text: str) -> list[float]:
    """Generate a text embedding using the Gemini embedding model."""
    result = genai.embed_content(
        model=settings.EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_DOCUMENT",
    )
    return result["embedding"]


def get_generation_model() -> genai.GenerativeModel:
    """Return a configured Gemini generation model."""
    return genai.GenerativeModel(settings.GEMINI_MODEL)
