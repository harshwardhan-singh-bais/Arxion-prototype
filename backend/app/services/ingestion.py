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
    print(f"\n[{'*'*15} ARXION INGESTION PIPELINE STARTED {'*'*15}]")
    print(f"📄 Target ID : {paper.id}")
    print(f"📁 Filename  : {paper.filename}\n")
    logger.info(f"[Pipeline] Starting ingestion for paper {paper.id} ({paper.filename})")

    # ── Step 1: Mark as PROCESSING ────────────────────────────────────────────
    print(f"👉 [PHASE 1] Initializing Database State...")
    paper.status = PaperStatus.PROCESSING
    update_paper(paper)
    print(f"   ✓ Status updated to PROCESSING")

    try:
        # ── Step 2: Raw text extraction ───────────────────────────────────────
        print(f"\n👉 [PHASE 2] Extracting Raw Text via PyPDF2...")
        logger.info(f"[Pipeline] Extracting text for {paper.id}")
        raw_text = extract_text_from_pdf(paper.file_path)

        if not raw_text.strip():
            print(f"   ❌ FAILURE: No text extracted. File might be corrupted or scanned image.")
            raise ValueError("No text could be extracted from the uploaded file.")
        print(f"   ✓ Extracted {len(raw_text)} raw characters")

        # ── Step 3: Chunking ──────────────────────────────────────────────────
        print(f"\n👉 [PHASE 3] Semantic Chunking Engine (LangChain)...")
        logger.info(f"[Pipeline] Chunking text for {paper.id}")
        chunks = chunk_text(raw_text)
        print(f"   ✓ Split document into {len(chunks)} contextual chunks")

        # ── Step 4: Embed chunks → Qdrant ─────────────────────────────────────
        print(f"\n👉 [PHASE 4] Qdrant Vector Projection (Chunks)...")
        print(f"   ...Generating deep math embeddings via Gemini API...")
        logger.info(f"[Pipeline] Embedding {len(chunks)} chunks for {paper.id}")
        await store_chunks(paper.id, chunks)
        print(f"   ✓ Uploaded {len(chunks)} chunk vectors to Qdrant cluster")

        # ── Step 5: Structured entity extraction via Gemini ───────────────────
        print(f"\n👉 [PHASE 5] Autonomous Intelligence Extraction (Gemini)...")
        print(f"   ...Parsing title, authors, abstracts, claims, limitations...")
        logger.info(f"[Pipeline] Extracting entities for {paper.id}")
        entities = await extract_entities(raw_text)
        print(f"   ✓ Strict JSON extraction successful.")
        print(f"\n👉 [PHASE 6] Mapping Entities to Arxion DB Schema...")

        # ── Step 6: Map entities → PaperInDB fields ───────────────────────────
        paper.title = entities.get("title") or paper.title
        paper.authors = entities.get("authors") or []
        paper.abstract = entities.get("abstract")
        paper.year = entities.get("year")
        paper.tags = entities.get("tags") or []
        paper.baseline = entities.get("baseline")
        paper.code_link = entities.get("code_link")
        paper.data_link = entities.get("data_link")
        print(f"   ✓ Meta Info Mapped (Title: {paper.title[:30]}...)")

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

        print(f"   ✓ Extracted {len(paper.claims)} claims, {len(paper.limitations)} risk flags.")

        # ── Step 7: Embed claims → Qdrant ─────────────────────────────────────
        claim_texts = [c.statement for c in paper.claims]
        if claim_texts:
            print(f"\n👉 [PHASE 7] Qdrant Vector Projection (Claims)...")
            logger.info(f"[Pipeline] Embedding {len(claim_texts)} claims for {paper.id}")
            await store_claims(paper.id, claim_texts)
            print(f"   ✓ Uploaded {len(claim_texts)} claim vectors to Qdrant cluster")
        else:
            print(f"\n👉 [PHASE 7] Skipping Claim Vectorization (None found)")

        # ── Step 8: Mark as PROCESSED ─────────────────────────────────────────
        print(f"\n👉 [PHASE 8] Finalizing RCI Core...")
        paper.status = PaperStatus.PROCESSED
        update_paper(paper)
        logger.info(f"[Pipeline] ✓ Paper {paper.id} processed successfully.")
        print(f"[{'*'*15} ARXION INGESTION COMPLETE {'*'*15}]\n")

    except Exception as e:
        logger.error(f"[Pipeline] ✗ Failed to process paper {paper.id}: {e}", exc_info=True)
        print(f"\n[!!! CRITICAL PIPELINE FAILURE !!!]")
        print(f"   Paper ID   : {paper.id}")
        print(f"   Fatal Error: {str(e)}")
        print(f"   Check the Python stack trace above for the exact breakdown.")
        paper.status = PaperStatus.FAILED
        paper.error_message = str(e)
        update_paper(paper)
        print(f"   ✓ Status updated to FAILED in NeonDB state.")
