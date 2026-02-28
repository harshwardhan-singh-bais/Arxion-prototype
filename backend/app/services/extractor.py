"""
PDF & text extraction service.
Extracts raw text from uploaded PDF files using PyPDF2 with pdfminer fallback.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file. Tries PyPDF2 first, falls back to pdfminer."""
    text = _try_pypdf2(file_path)
    if len(text.strip()) < 200:
        logger.warning(f"PyPDF2 extracted minimal text for {file_path}. Falling back to pdfminer.")
        text = _try_pdfminer(file_path)
    return text


def _try_pypdf2(file_path: str) -> str:
    try:
        import PyPDF2
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)
    except Exception as e:
        logger.error(f"PyPDF2 extraction failed: {e}")
        return ""


def _try_pdfminer(file_path: str) -> str:
    try:
        from pdfminer.high_level import extract_text
        return extract_text(file_path)
    except Exception as e:
        logger.error(f"pdfminer extraction failed: {e}")
        return ""
