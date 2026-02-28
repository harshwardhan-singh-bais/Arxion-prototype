"""
File text extraction service.
Dispatches by file extension: .pdf (PyPDF2 + pdfminer fallback), .txt (plain read).
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text(file_path: str) -> str:
    """
    Extract raw text from a file.
    Routes by extension: .pdf uses PDF extractors, everything else reads as plain text.
    Raises ValueError if the file produces no usable content.
    """
    path = Path(file_path)
    if path.suffix.lower() == ".pdf":
        text = _extract_pdf(path)
    else:
        text = path.read_text(encoding="utf-8", errors="replace")

    if len(text.strip()) < 50:
        raise ValueError(f"Could not extract enough text from '{path.name}'. File may be empty or corrupt.")
    return text


def _extract_pdf(path: Path) -> str:
    """Try PyPDF2, fall back to pdfminer if result is too short."""
    text = _try_pypdf2(path)
    if len(text.strip()) < 200:
        logger.warning(f"PyPDF2 gave minimal text for {path.name}. Falling back to pdfminer.")
        text = _try_pdfminer(path)
    return text


def _try_pypdf2(path: Path) -> str:
    try:
        import PyPDF2
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)
    except Exception as e:
        logger.error(f"PyPDF2 extraction failed for {path.name}: {e}")
        return ""


def _try_pdfminer(path: Path) -> str:
    try:
        from pdfminer.high_level import extract_text
        return extract_text(str(path))
    except Exception as e:
        logger.error(f"pdfminer extraction failed for {path.name}: {e}")
        return ""
