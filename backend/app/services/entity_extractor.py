"""
Structured entity extraction using Gemini with strict JSON schema enforcement.
Extracts: title, authors, abstract, claims, datasets, methods, metrics, 
limitations, baseline, hyperparameters, compute, code/data links.
"""
import json
import logging
import asyncio
from functools import partial
from app.core.gemini import get_generation_model

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


async def extract_entities(paper_text: str, max_chars: int = 40000) -> dict:
    """
    Call Gemini to extract structured entities from raw paper text.
    Truncates to max_chars to stay within token limits.
    Returns a dict matching the schema above (or best-effort partial).
    """
    truncated_text = paper_text[:max_chars]
    prompt = f"{_SYSTEM_PROMPT}\n\nPAPER TEXT:\n{truncated_text}"

    model = get_generation_model()

    # Run blocking Gemini SDK call in a thread pool
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        partial(_call_gemini, model, prompt),
    )

    return _parse_response(response)


def _call_gemini(model, prompt: str) -> str:
    """Synchronous Gemini call — runs in a thread executor."""
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.1,  # Low temp for strict JSON output
            "max_output_tokens": 8192,
        },
    )
    return response.text


def _parse_response(raw: str) -> dict:
    """Clean and parse the JSON response from Gemini."""
    # Strip markdown code fences if the model adds them
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini JSON response: {e}\nRaw response:\n{text[:500]}")
        # Return a safe minimal fallback
        return {
            "title": "Unknown",
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
