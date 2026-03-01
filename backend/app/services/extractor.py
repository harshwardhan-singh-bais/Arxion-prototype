"""
File text extraction service.
Extraction chain (PDF): PyPDF2 → pdfminer → PyMuPDF (fitz)
Plain text files are read directly.

PyMuPDF handles PDFs that have non-standard fonts, compression, or encoding
that defeat PyPDF2 and pdfminer.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Minimum characters we consider "enough" content to process a paper
MIN_CHARS = 50


def extract_text(file_path: str) -> str:
    """
    Extract raw text from a file.

    Routes by extension:
    - .pdf  → _extract_pdf (three-stage extraction chain)
    - other → read as UTF-8 plain text

    Raises ValueError if the file produces no usable content.
    """
    path = Path(file_path)
    if not path.exists():
        raise ValueError(f"File not found: {path}")
    if path.stat().st_size == 0:
        raise ValueError(f"File is empty (0 bytes): {path.name}")

    if path.suffix.lower() == ".pdf":
        text = _extract_pdf(path)
    else:
        text = path.read_text(encoding="utf-8", errors="replace")

    clean = text.strip()
    if len(clean) < MIN_CHARS:
        raise ValueError(
            f"Could not extract enough text from '{path.name}'. "
            f"Only {len(clean)} characters found (minimum {MIN_CHARS}). "
            f"The PDF may be image-based, password-protected, or corrupt."
        )
    return clean


# ── Internal extraction stages ─────────────────────────────────────────────────

def _extract_pdf(path: Path) -> str:
    """Try PyPDF2 → pdfminer → PyMuPDF, returning whichever gives the best result."""
    candidates: list[tuple[str, str]] = []

    # Stage 1: PyPDF2
    t1 = _try_pypdf2(path)
    candidates.append(("PyPDF2", t1))

    # Stage 2: pdfminer (only if PyPDF2 gave little text)
    if len(t1.strip()) < 200:
        logger.info(f"PyPDF2 minimal ({len(t1)} chars) for {path.name} — trying pdfminer")
        t2 = _try_pdfminer(path)
        candidates.append(("pdfminer", t2))

    # Stage 3: PyMuPDF (always run as final fallback — best at complex PDFs)
    best_len = max(len(t.strip()) for _, t in candidates)
    if best_len < 200:
        logger.info(f"Both extractors minimal — trying PyMuPDF for {path.name}")
        t3 = _try_pymupdf(path)
        candidates.append(("PyMuPDF", t3))

    # Use whichever gave the most text
    _, best_text = max(candidates, key=lambda x: len(x[1].strip()))
    logger.info(
        f"Extraction result for {path.name}: "
        + " | ".join(f"{name}: {len(t)} chars" for name, t in candidates)
    )
    return best_text


def _try_pypdf2(path: Path) -> str:
    try:
        import PyPDF2
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            if reader.is_encrypted:
                logger.warning(f"{path.name} is encrypted — skipping PyPDF2")
                return ""
            pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)
    except Exception as e:
        logger.warning(f"PyPDF2 failed for {path.name}: {e}")
        return ""


def _try_pdfminer(path: Path) -> str:
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(str(path))
        return text or ""
    except Exception as e:
        logger.warning(f"pdfminer failed for {path.name}: {e}")
        return ""


def _try_pymupdf(path: Path) -> str:
    """
    PyMuPDF (fitz) — handles encrypted/non-standard/complex PDFs.
    Falls back gracefully if not installed.
    """
    try:
        import fitz  # type: ignore  # pip install pymupdf
        doc = fitz.open(str(path))
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))  # type: ignore
        doc.close()
        return "\n\n".join(pages)
    except ImportError:
        logger.debug("PyMuPDF (fitz) not installed — skipping third stage")
        return ""
    except Exception as e:
        logger.warning(f"PyMuPDF failed for {path.name}: {e}")
        return ""
