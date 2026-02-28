"""
Gemini client — single module for all Gemini interactions.
Provides embeddings, a singleton generation model, and shared async/sync generation helpers.
"""
import asyncio
import json
import logging
from functools import partial

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure once at import time
genai.configure(api_key=settings.GEMINI_API_KEY)

# Singleton model — avoids re-instantiation on every call
_model: genai.GenerativeModel | None = None


def get_model() -> genai.GenerativeModel:
    global _model
    if _model is None:
        _model = genai.GenerativeModel(settings.GEMINI_MODEL)
    return _model


# ── Embeddings ─────────────────────────────────────────────────────────────────

async def get_embeddings(text: str) -> list[float]:
    """Generate a Gemini text embedding (async via thread executor)."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: genai.embed_content(
            model=settings.EMBEDDING_MODEL,
            content=text,
            task_type="RETRIEVAL_DOCUMENT",
        ),
    )
    return result["embedding"]


# ── Text generation ────────────────────────────────────────────────────────────

def _generate_sync(prompt: str, temperature: float, max_tokens: int) -> str:
    """Synchronous Gemini generation — always run via run_in_executor."""
    model = get_model()
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        },
    )
    return response.text


async def generate_text(
    prompt: str,
    temperature: float = 0.2,
    max_tokens: int = 1024,
) -> str:
    """Async wrapper — runs blocking Gemini SDK call in a thread executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(_generate_sync, prompt, temperature, max_tokens),
    )


async def generate_json(
    prompt: str,
    temperature: float = 0.1,
    max_tokens: int = 8192,
) -> dict:
    """
    Generate JSON from Gemini and parse it.
    Strips markdown fences if the model adds them.
    Returns a dict or raises ValueError on parse failure.
    """
    raw = await generate_text(prompt, temperature=temperature, max_tokens=max_tokens)
    return _parse_json(raw)


def _parse_json(raw: str) -> dict:
    text = raw.strip()
    # Strip opening ```json or ``` fences
    if text.startswith("```"):
        text = text[text.index("\n") + 1:]   # remove first line (```json)
    if text.endswith("```"):
        text = text[: text.rfind("```")]     # remove closing ```
    text = text.strip()
    return json.loads(text)


# ── Backwards compat alias (used in entity_extractor still) ───────────────────
def get_generation_model() -> genai.GenerativeModel:
    """Deprecated alias — prefer generate_text() / generate_json()."""
    return get_model()
