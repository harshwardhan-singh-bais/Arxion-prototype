"""
Writing & Export Service — Component G
BibTeX, CSV, and auto-generated related-work paragraph.
"""
import csv
import io
import logging

from app.models.paper import PaperInDB, PaperStatus
from app.models.chat import RelatedWorkRequest, RelatedWorkResponse, ExportCSVRequest
from app.services.credibility import compute_credibility
from app.core.gemini import generate_text

logger = logging.getLogger(__name__)


# ── BibTeX Export ─────────────────────────────────────────────────────────────

def generate_bibtex(paper: PaperInDB) -> str:
    """Generate a BibTeX entry for a single paper."""
    first_author = (paper.authors[0].split()[-1] if paper.authors else "Unknown").lower()
    year_str     = str(paper.year) if paper.year else "0000"
    title_slug   = "".join(c for c in (paper.title or "untitled")[:20] if c.isalnum()).lower()
    citekey      = f"{first_author}{year_str}{title_slug}"
    authors_str  = " and ".join(paper.authors) if paper.authors else "Unknown"

    # Compute RCI only if paper is processed — otherwise leave blank
    rci_str = "N/A"
    if paper.status == PaperStatus.PROCESSED:
        try:
            rci_str = str(compute_credibility(paper).rci)
        except Exception:
            pass

    lines = [
        f"@article{{{citekey},",
        f"  title   = {{{paper.title or 'Untitled'}}},",
        f"  author  = {{{authors_str}}},",
        f"  year    = {{{paper.year or 'n.d.'}}},",
    ]
    if paper.code_link:
        lines.append(f"  url     = {{{paper.code_link}}},")
    lines.append(f"  note    = {{Arxion RCI: {rci_str}}}")
    lines.append("}")

    return "\n".join(lines)


def generate_bibtex_bulk(papers: list[PaperInDB]) -> str:
    """Generate a combined .bib file for multiple papers."""
    return "\n\n".join(generate_bibtex(p) for p in papers)


# ── CSV Export ────────────────────────────────────────────────────────────────

def generate_csv(papers: list[PaperInDB], include_credibility: bool = True) -> str:
    """Generate a CSV string for the literature matrix."""
    output = io.StringIO()

    base_fields = [
        "paper_id", "title", "authors", "year", "tags",
        "datasets", "methods", "code_link", "data_link",
        "claims_count", "metrics_count",
    ]
    cred_fields = ["rci", "grade", "reproducibility", "confidence", "transparency", "flags"]
    fieldnames  = base_fields + (cred_fields if include_credibility else [])

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for paper in papers:
        row: dict = {
            "paper_id":      paper.id,
            "title":         paper.title,
            "authors":       "; ".join(paper.authors),
            "year":          paper.year or "",
            "tags":          "; ".join(paper.tags),
            "datasets":      "; ".join(d.name for d in paper.datasets),
            "methods":       "; ".join(m.name for m in paper.methods),
            "code_link":     paper.code_link or "",
            "data_link":     paper.data_link or "",
            "claims_count":  len(paper.claims),
            "metrics_count": len(paper.metrics),
        }
        if include_credibility:
            if paper.status == PaperStatus.PROCESSED:
                try:
                    r = compute_credibility(paper)
                    row.update({
                        "rci":            r.rci,
                        "grade":          r.grade,
                        "reproducibility": r.reproducibility_score,
                        "confidence":     r.confidence_score,
                        "transparency":   r.transparency_score,
                        "flags":          "; ".join(f.value for f in r.risk_flags),
                    })
                except Exception:
                    row.update(dict.fromkeys(cred_fields, ""))
            else:
                row.update(dict.fromkeys(cred_fields, ""))
        writer.writerow(row)

    return output.getvalue()


# ── Related Work Generator ────────────────────────────────────────────────────

async def generate_related_work(request: RelatedWorkRequest, papers: list[PaperInDB]) -> RelatedWorkResponse:
    """
    Use Gemini to produce a structured, citation-aware related work paragraph
    from selected papers.
    """
    selected = [p for p in papers if p.id in request.paper_ids]
    if not selected:
        return RelatedWorkResponse(paragraph="No matching papers found for the given IDs.", paper_ids_used=[])

    summaries = []
    for p in selected:
        ds_str   = ", ".join(d.name for d in p.datasets[:3]) or "unspecified datasets"
        meth_str = ", ".join(m.name for m in p.methods[:2])  or "unspecified methods"
        claim    = p.claims[0].statement if p.claims else "contribution not extracted"
        authors  = ", ".join(p.authors[:2]) or "Unknown"
        summaries.append(
            f'- "{p.title}" ({authors}, {p.year or "n.d."}): '
            f"uses {meth_str} on {ds_str}. Primary contribution: {claim}"
        )

    topic_clause = f"\nFocus area: {request.topic_hint}" if request.topic_hint else ""

    prompt = f"""\
You are a scientific writing assistant. Write a cohesive, academic "Related Work" paragraph based on the following papers.{topic_clause}

Papers:
{chr(10).join(summaries)}

Rules:
- Write exactly ONE dense paragraph (150–250 words)
- Cite each paper inline as (AuthorLastName et al., Year)
- Group papers by theme or methodology where possible
- Use formal academic language
- Do NOT use bullet points or headers

Related Work:"""

    try:
        paragraph = await generate_text(prompt, temperature=0.4, max_tokens=512)
    except Exception as e:
        logger.error(f"Related work generation failed: {e}")
        paragraph = f"Generation failed: {e}"

    return RelatedWorkResponse(
        paragraph=paragraph.strip(),
        paper_ids_used=[p.id for p in selected],
    )
