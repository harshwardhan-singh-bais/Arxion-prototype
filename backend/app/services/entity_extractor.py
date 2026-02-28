"""
Structured entity extraction using Gemini with strict JSON schema enforcement.
Extracts: title, authors, abstract, claims, datasets, methods, metrics,
limitations, baseline, hyperparameters, compute, code/data links.
"""
import logging
from app.core.gemini import generate_json

logger = logging.getLogger(__name__)

# ── Extraction Prompt ─────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a scientific paper intelligence extractor. Given raw text from an academic paper, extract the following entities and return ONLY a valid JSON object matching the schema below. Do not include any prose, markdown, or code fences.

SCHEMA:
{
  "title": "string (paper title)",
  "authors": ["list of author names"],
  "abstract": "string (abstract text)",
  "year": null or integer,
  "claims": [
    {
      "statement": "string (main contribution claim)",
      "evidence": [
        { "section": "string or null", "page": null or integer, "snippet": "string (supporting text)" }
      ]
    }
  ],
  "datasets": [
    { "name": "string", "description": "string or null", "source": "string or null" }
  ],
  "methods": [
    { "name": "string", "description": "string or null" }
  ],
  "metrics": [
    { "metric_name": "string", "value": "string", "dataset": "string or null", "comparison_baseline": "string or null" }
  ],
  "limitations": [
    { "description": "string" }
  ],
  "baseline": "string or null (the model/method this paper is compared against)",
  "hyperparameters": {
    "disclosed": true or false,
    "details": "string or null (e.g., 'lr=0.001, batch=32')"
  },
  "compute": {
    "disclosed": true or false,
    "gpu_type": "string or null",
    "gpu_hours": null or float,
    "details": "string or null"
  },
  "code_link": "string or null (URL to code repository)",
  "data_link": "string or null (URL to data/dataset)",
  "tags": ["list of 2-5 topic tags, e.g., 'NLP', 'image classification', 'transformers'"]
}

Be thorough but precise. If a field is not mentioned in the paper, return null or an empty list.
"""

_EMPTY_ENTITIES: dict = {
    "title": None,
    "authors": [],
    "abstract": None,
    "year": None,
    "claims": [],
    "datasets": [],
    "methods": [],
    "metrics": [],
    "limitations": [],
    "baseline": None,
    "hyperparameters": {"disclosed": False, "details": None},
    "compute": {"disclosed": False, "gpu_type": None, "gpu_hours": None, "details": None},
    "code_link": None,
    "data_link": None,
    "tags": [],
}


async def extract_entities(paper_text: str, max_chars: int = 40_000) -> dict:
    """
    Call Gemini to extract structured entities from raw paper text.
    Truncates to max_chars to stay within token limits.
    Returns a dict matching the schema above, or a safe empty fallback on failure.
    """
    prompt = f"{_SYSTEM_PROMPT}\n\nPAPER TEXT:\n{paper_text[:max_chars]}"

    try:
        return await generate_json(prompt, temperature=0.1, max_tokens=8192)
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        return dict(_EMPTY_ENTITIES)  # defensive copy
