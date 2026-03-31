"""
Export Router — Generate BibTeX, CSV Matrices, and Related Work drafts.
POST /api/v1/export
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import csv
import io
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
from app.models.store import get_paper
from app.core.gemini import get_generation_model

router = APIRouter()
logger = logging.getLogger(__name__)

class ExportRequest(BaseModel):
    paper_ids: list[str]
    format: str  # "bibtex", "csv_matrix", "related_work_draft"

class ExportResponse(BaseModel):
    content: str
    format: str

@router.post("/export", response_model=ExportResponse, summary="Generate export artifacts")
async def generate_export(req: ExportRequest):
    log_feature_start(logger, "EXPORT", "generate", "Export requested", format=req.format, requested_paper_count=len(req.paper_ids))
    print(f"\n[{'*'*15} EXPORT JOB TRIGGERED {'*'*15}]")
    print(f"📦 Requested Format: {req.format}")
    print(f"📄 Target Papers IDs: {len(req.paper_ids)}")

    if not req.paper_ids:
        print(f"❌ FAILURE: No Paper IDs provided.")
        log_feature_failure(logger, "EXPORT", "validate", "No paper IDs provided")
        raise HTTPException(status_code=400, detail="No paper IDs provided.")
    
    print(f"🔍 Fetching active papers from Memory DB...")
    papers = []
    for pid in req.paper_ids:
        p = await get_paper(pid)
        if p:
            papers.append(p)
            
    if not papers:
        print(f"❌ FAILURE: None of the target papers were found in Memory.")
        log_feature_failure(logger, "EXPORT", "load_papers", "None of the requested papers were found", format=req.format, requested_paper_count=len(req.paper_ids))
        raise HTTPException(status_code=404, detail="None of the requested papers were found.")
    print(f"✅ Loaded {len(papers)} valid paper models.")
    log_feature_success(logger, "EXPORT", "load_papers", "Loaded papers for export", loaded_paper_count=len(papers), format=req.format)

    if req.format == "csv_matrix":
        print(f"📊 Compiling {len(papers)} papers into Literature CSV Matrix...")
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "TITLE", "AUTHORS", "STATUS", "YEAR", "DATASETS_USED", "METHODS_USED", "LIMITATIONS"])
        for p in papers:
            authors = ", ".join(p.authors) if p.authors else "Unknown"
            datasets = "; ".join([d.name for d in p.datasets]) if p.datasets else ""
            methods = "; ".join([m.name for m in p.methods]) if p.methods else ""
            limitations = "; ".join(
                [(getattr(l, "description", None) or getattr(l, "text", "")) for l in p.limitations]
            ) if p.limitations else ""
            
            writer.writerow([
                p.id, 
                p.title, 
                authors, 
                p.status.value,
                p.year or "N/A", 
                datasets, 
                methods,
                limitations
            ])
        print(f"✅ CSV compilation complete. Retuning matrix array object.")
        print(f"[{'*'*15} EXPORT COMPLETE {'*'*15}]\n")
        log_feature_success(logger, "EXPORT", "csv_matrix", "CSV matrix generated", row_count=len(papers), format=req.format)
        return ExportResponse(content=output.getvalue(), format=req.format)
        
    elif req.format == "bibtex":
        print(f"📑 Compiling BibTeX Draft prompt over metadata...")
        prompt = "Generate standard BibTeX entries for the following academic papers based on their metadata. Return ONLY the BibTeX code, no markdown block syntax, just the raw text strings.\n\n"
        for p in papers:
            authors = ", ".join(p.authors) if p.authors else "Unknown"
            prompt += f"ID: {p.id}\nTitle: {p.title}\nAuthors: {authors}\nYear: {p.year or '2024'}\n\n"
            
        try:
            print(f"🧠 Prompting Gemini LLM to format BibTeX block...")
            model = get_generation_model()
            res = model.generate_content(prompt)
            content = res.text.replace("```bibtex", "").replace("```", "").strip()
            print(f"✅ Gemini successfully generated BibTeX block.")
            print(f"[{'*'*15} EXPORT COMPLETE {'*'*15}]\n")
            log_feature_success(logger, "EXPORT", "bibtex", "BibTeX generated", content_length=len(content), format=req.format)
            return ExportResponse(content=content, format=req.format)
        except Exception as e:
            print(f"❌ WARNING: Gemini LLM generation crashed -> {str(e)}")
            log_feature_failure(logger, "EXPORT", "bibtex", "BibTeX generation failed; returning fallback", error=e)
            content = "@article{MOCK_PAPER,\n  title={Mock Paper: System operates offline without API key.}\n}"
            return ExportResponse(content=content, format=req.format)

    elif req.format == "related_work_draft":
        print(f"🖋️ Compiling prompt for robust Academic Related Work synthesis...")
        prompt = "You are Arxion, a distinguished academic AI. Write an extensive, formal 'Related Work' section draft that synthesizes the provided papers. Compare their methodologies, datasets, and distinctly point out missing gaps or contradictions if any exist. Use inline references like [ARX-123]. Make it strictly academic.\n\n"
        
        for p in papers:
            authors = ", ".join(p.authors) if p.authors else "Unknown"
            methods = ", ".join([m.name for m in p.methods]) if p.methods else "None specified"
            claims = " ".join([c.statement for c in p.claims]) if p.claims else "No claims extracted."
            prompt += f"Paper Reference: [{p.id}]\nTitle: {p.title}\nAuthors: {authors}\nMethods: {methods}\nCore Claims: {claims}\n\n"
            
        try:
            print(f"🧠 Prompting Gemini LLM to write high-academic Draft...")
            model = get_generation_model()
            res = model.generate_content(prompt)
            content = res.text + "\n\n[SYS] Arxion generated this draft autonomously from extracted semantic claims. Always verify hallucination risk before publication."
            print(f"✅ Gemini successfully drafted {len(res.text)} characters of Academic synthesis.")
            print(f"[{'*'*15} EXPORT COMPLETE {'*'*15}]\n")
            log_feature_success(logger, "EXPORT", "related_work_draft", "Related-work draft generated", content_length=len(content), format=req.format)
            return ExportResponse(content=content.strip(), format=req.format)
        except Exception as e:
            print(f"❌ WARNING: Gemini synthesis crashed -> {str(e)}")
            log_feature_failure(logger, "EXPORT", "related_work_draft", "Related-work generation failed; returning fallback", error=e)
            content = "[MOCKED DRAFT]: The Arxion engine is running offline. The extracted methods and claims from these papers indicate profound overlapping metadata regarding their scientific datasets and core computational constraints. A proper LLM model is required to render the full academic synthesis."
            return ExportResponse(content=content, format=req.format)
            
    else:
        print(f"❌ FAILURE: Format '{req.format}' is entirely invalid.")
        log_feature_failure(logger, "EXPORT", "validate", "Invalid export format", format=req.format)
        raise HTTPException(status_code=400, detail=f"Invalid export format specified: {req.format}")
