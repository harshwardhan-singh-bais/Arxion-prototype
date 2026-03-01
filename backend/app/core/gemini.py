import os
import logging
from google import genai
from app.core.config import settings

logger = logging.getLogger(__name__)

_api_key = settings.GEMINI_API_KEY
if not _api_key:
    raise RuntimeError("Missing GEMINI_API_KEY")

try:
    client = genai.Client(api_key=_api_key)
except Exception as e:
    logger.error(f"Failed to initialize GenAI client: {e}")
    client = None

LLM_MODEL = "gemini-2.5-flash"
EMBED_MODEL = "gemini-embedding-001"

async def get_embeddings(text: str) -> list[float]:
    """Generate a text embedding using the modern Gemini GenAI SDK."""
    if not client:
        # Fallback offline
        import random
        return [random.uniform(-0.1, 0.1) for _ in range(768)]
    
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
    )
    return response.embeddings[0].values

class WrappedGenerativeModel:
    """A wrapper class to make the new SDK syntax compatible with our legacy router calls logic."""
    def __init__(self, client_instance, model_name: str):
        self._client = client_instance
        self.model_name = model_name

    def generate_content(self, prompt, **kwargs):
        res = self._client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )
        class ResponseShim:
            def __init__(self, text):
                self.text = text
        return ResponseShim(res.text or "")

def get_generation_model():
    """Return a configured Gemini generation model, wrapping the new SDK."""
    if not client:
        class MockGenerativeModel:
            def generate_content(self, prompt, **kwargs):
                class MockResponse:
                    def __init__(self):
                        self.text = '{"title": "Mocked Academic Paper", "limitations": [{"description": "This is a mocked API response because the provided Gemini Key was invalid or offline."}], "claims": [{"statement": "We successfully mocked the Google AI response.", "evidence": [{"snippet": "Mocked snippet"}]}]}' if "SCHEMA" in prompt else "[MOCKED LLM RAG RESPONSE]: I am currently operating entirely offline because your Google API Key is invalid or rate limited."
                return MockResponse()
        return MockGenerativeModel()
    
    return WrappedGenerativeModel(client, LLM_MODEL)
