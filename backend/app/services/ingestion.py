"""
Background ingestion pipeline.
Orchestrates: extract → chunk → embed → structured entity extraction → store.
Runs as a FastAPI BackgroundTask so the upload endpoint returns immediately.

State lifecycle:   INGESTED → PROCESSING → PROCESSED | FAILED
"""
import logging
from app.models.paper import PaperInDB, PaperStatus, ClaimData, EvidencePointer, DatasetData, MethodData, MetricResult, LimitationData, HyperparameterSignal, ComputeDisclosure
from app.models.store import update_paper
from app.services.extractor import extract_text_from_pdf
from app.services.chunker import chunk_text
from app.services.vector_store import store_chunks, store_claims
from app.services.entity_extractor import extract_entities

logger = logging.getLogger(__name__)


async def run_ingestion_pipeline(paper: PaperInDB) -> None:
    """
    Full async ingestion pipeline. Called as a background task after upload.
    Mutates the paper in-place inside the store.
    """
    logger.info(f"[Pipeline] Starting ingestion for paper {paper.id} ({paper.filename})")

    # ── Step 1: Mark as PROCESSING ────────────────────────────────────────────
    paper.status = PaperStatus.PROCESSING
    update_paper(paper)

    try:
        # ── Step 2: Raw text extraction ───────────────────────────────────────
        logger.info(f"[Pipeline] Extracting text for {paper.id}")
        raw_text = extract_text_from_pdf(paper.file_path)

        if not raw_text.strip():
            raise ValueError("No text could be extracted from the uploaded file.")

        # ── Step 3: Chunking ──────────────────────────────────────────────────
        logger.info(f"[Pipeline] Chunking text for {paper.id}")
        chunks = chunk_text(raw_text)

        # ── Step 4: Embed chunks → Qdrant ─────────────────────────────────────
        logger.info(f"[Pipeline] Embedding {len(chunks)} chunks for {paper.id}")
        await store_chunks(paper.id, chunks)

        # ── Step 5: Structured entity extraction via Gemini ───────────────────
        logger.info(f"[Pipeline] Extracting entities for {paper.id}")
        entities = await extract_entities(raw_text)

        # ── Step 6: Map entities → PaperInDB fields ───────────────────────────
        paper.title = entities.get("title") or paper.title
        paper.authors = entities.get("authors") or []
        paper.abstract = entities.get("abstract")
        paper.year = entities.get("year")
        paper.tags = entities.get("tags") or []
        paper.baseline = entities.get("baseline")
        paper.code_link = entities.get("code_link")
        paper.data_link = entities.get("data_link")

        paper.claims = [
            ClaimData(
                statement=c.get("statement", ""),
                evidence=[
                    EvidencePointer(**e)
                    for e in c.get("evidence", [])
                    if isinstance(e, dict)
                ],
            )
            for c in entities.get("claims", [])
            if isinstance(c, dict)
        ]

        paper.datasets = [
            DatasetData(**d)
            for d in entities.get("datasets", [])
            if isinstance(d, dict)
        ]

        paper.methods = [
            MethodData(**m)
            for m in entities.get("methods", [])
            if isinstance(m, dict)
        ]

        paper.metrics = [
            MetricResult(**m)
            for m in entities.get("metrics", [])
            if isinstance(m, dict)
        ]

        paper.limitations = [
            LimitationData(**l)
            for l in entities.get("limitations", [])
            if isinstance(l, dict)
        ]

        hp = entities.get("hyperparameters")
        if isinstance(hp, dict):
            paper.hyperparameters = HyperparameterSignal(**hp)

        comp = entities.get("compute")
        if isinstance(comp, dict):
            paper.compute = ComputeDisclosure(**comp)

        # ── Step 7: Embed claims → Qdrant ─────────────────────────────────────
        claim_texts = [c.statement for c in paper.claims]
        if claim_texts:
            logger.info(f"[Pipeline] Embedding {len(claim_texts)} claims for {paper.id}")
            await store_claims(paper.id, claim_texts)

        # ── Step 8: Mark as PROCESSED ─────────────────────────────────────────
        paper.status = PaperStatus.PROCESSED
        update_paper(paper)
        logger.info(f"[Pipeline] ✓ Paper {paper.id} processed successfully.")

    except Exception as e:
        logger.error(f"[Pipeline] ✗ Failed to process paper {paper.id}: {e}", exc_info=True)
        paper.status = PaperStatus.FAILED
        paper.error_message = str(e)
        update_paper(paper)
