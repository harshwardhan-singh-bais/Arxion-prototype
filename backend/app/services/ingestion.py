"""
Background ingestion pipeline.
Orchestrates: extract → chunk → embed → structured entity extraction → store.
Runs as a FastAPI BackgroundTask so the upload endpoint returns immediately.

State lifecycle:   INGESTED → PROCESSING → PROCESSED | FAILED
"""
import logging
from typing import Callable
from app.models.paper import PaperInDB, PaperStatus, ClaimData, EvidencePointer, DatasetData, MethodData, MetricResult, LimitationData, HyperparameterSignal, ComputeDisclosure
from app.models.store import update_paper
from app.core.feature_logging import log_feature_start, log_feature_success, log_feature_failure
from app.services.extractor import extract_text_from_pdf
from app.services.chunker import chunk_text
from app.services.vector_store import store_chunks, store_claims
from app.services.entity_extractor import extract_entities
from app.core.realtime import publish_processing_event

logger = logging.getLogger(__name__)


async def run_ingestion_pipeline(
    paper: PaperInDB,
    text_extractor: Callable[[str], str] = extract_text_from_pdf,
) -> None:
    """
    Full async ingestion pipeline. Called as a background task after upload.
    Mutates the paper in-place inside the store.
    """
    print(f"\n[{'*'*15} ARXION INGESTION PIPELINE STARTED {'*'*15}]")
    print(f"📄 Target ID : {paper.id}")
    print(f"📁 Filename  : {paper.filename}\n")
    logger.info(f"[Pipeline] Starting ingestion for paper {paper.id} ({paper.filename})")
    log_feature_start(logger, "INGESTION", "pipeline", "Background ingestion started", paper_id=paper.id, filename=paper.filename)
    await publish_processing_event(paper.id, "pipeline", "START", "Background ingestion started", filename=paper.filename)

    # ── Step 1: Mark as PROCESSING ────────────────────────────────────────────
    print(f"👉 [PHASE 1] Initializing Database State...")
    paper.status = PaperStatus.PROCESSING
    await update_paper(paper)
    print(f"   ✓ Status updated to PROCESSING")
    log_feature_success(logger, "INGESTION", "phase_1_status", "Paper status moved to PROCESSING", paper_id=paper.id)
    await publish_processing_event(paper.id, "phase_1_status", "SUCCESS", "Paper status moved to PROCESSING")

    try:
        # ── Step 2: Raw text extraction ───────────────────────────────────────
        print(f"\n👉 [PHASE 2] Extracting Raw Text via PyPDF2...")
        logger.info(f"[Pipeline] Extracting text for {paper.id}")
        log_feature_start(logger, "INGESTION", "phase_2_extract", "Extracting raw text", paper_id=paper.id)
        await publish_processing_event(paper.id, "phase_2_extract", "START", "Extracting raw text")
        raw_text = text_extractor(paper.file_path)

        if not raw_text.strip():
            print(f"   ❌ FAILURE: No text extracted. File might be corrupted or scanned image.")
            raise ValueError("No text could be extracted from the uploaded file.")
        print(f"   ✓ Extracted {len(raw_text)} raw characters")
        log_feature_success(logger, "INGESTION", "phase_2_extract", "Raw text extracted", paper_id=paper.id, char_count=len(raw_text))
        await publish_processing_event(paper.id, "phase_2_extract", "SUCCESS", "Raw text extracted", char_count=len(raw_text))

        # ── Step 3: Chunking ──────────────────────────────────────────────────
        print(f"\n👉 [PHASE 3] Semantic Chunking Engine (LangChain)...")
        logger.info(f"[Pipeline] Chunking text for {paper.id}")
        log_feature_start(logger, "INGESTION", "phase_3_chunk", "Chunking extracted text", paper_id=paper.id)
        await publish_processing_event(paper.id, "phase_3_chunk", "START", "Chunking extracted text")
        chunks = chunk_text(raw_text)
        print(f"   ✓ Split document into {len(chunks)} contextual chunks")
        log_feature_success(logger, "INGESTION", "phase_3_chunk", "Text chunking completed", paper_id=paper.id, chunk_count=len(chunks))
        await publish_processing_event(paper.id, "phase_3_chunk", "SUCCESS", "Text chunking completed", chunk_count=len(chunks))

        # ── Step 4: Embed chunks → Qdrant ─────────────────────────────────────
        print(f"\n👉 [PHASE 4] Qdrant Vector Projection (Chunks)...")
        print(f"   ...Generating deep math embeddings via Gemini API...")
        logger.info(f"[Pipeline] Embedding {len(chunks)} chunks for {paper.id}")
        log_feature_start(logger, "EMBEDDING", "phase_4_store_chunks", "Embedding and storing chunks", paper_id=paper.id, chunk_count=len(chunks))
        await publish_processing_event(paper.id, "phase_4_store_chunks", "START", "Embedding and storing chunk vectors", chunk_count=len(chunks))
        await store_chunks(paper.id, chunks)
        print(f"   ✓ Uploaded {len(chunks)} chunk vectors to Qdrant cluster")
        log_feature_success(logger, "EMBEDDING", "phase_4_store_chunks", "Chunk vectors stored", paper_id=paper.id, chunk_count=len(chunks))
        await publish_processing_event(paper.id, "phase_4_store_chunks", "SUCCESS", "Chunk vectors stored", chunk_count=len(chunks))

        # ── Step 5: Structured entity extraction via Gemini ───────────────────
        print(f"\n👉 [PHASE 5] Autonomous Intelligence Extraction (Gemini)...")
        print(f"   ...Parsing title, authors, abstracts, claims, limitations...")
        logger.info(f"[Pipeline] Extracting entities for {paper.id}")
        log_feature_start(logger, "EXTRACTION", "phase_5_entities", "Running structured entity extraction", paper_id=paper.id)
        await publish_processing_event(paper.id, "phase_5_entities", "START", "Running structured entity extraction")
        entities = await extract_entities(raw_text)
        if not isinstance(entities, dict):
            entities = {}
        print(f"   ✓ Strict JSON extraction successful.")
        log_feature_success(logger, "EXTRACTION", "phase_5_entities", "Entity extraction completed", paper_id=paper.id)
        await publish_processing_event(paper.id, "phase_5_entities", "SUCCESS", "Entity extraction completed")
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

        claims: list[ClaimData] = []
        for c in entities.get("claims", []):
            if not isinstance(c, dict):
                continue
            evidence_items: list[EvidencePointer] = []
            for e in c.get("evidence", []):
                if not isinstance(e, dict):
                    continue
                snippet = e.get("snippet") or e.get("text") or ""
                if not snippet:
                    continue
                try:
                    evidence_items.append(
                        EvidencePointer(
                            section=e.get("section"),
                            page=e.get("page"),
                            snippet=snippet,
                        )
                    )
                except Exception:
                    continue
            statement = c.get("statement") or c.get("claim") or ""
            if statement:
                claims.append(ClaimData(statement=statement, evidence=evidence_items))
        paper.claims = claims

        datasets: list[DatasetData] = []
        for d in entities.get("datasets", []):
            if not isinstance(d, dict):
                continue
            name = d.get("name") or "Unknown"
            datasets.append(
                DatasetData(
                    name=name,
                    description=d.get("description"),
                    source=d.get("source"),
                )
            )
        paper.datasets = datasets

        methods: list[MethodData] = []
        for m in entities.get("methods", []):
            if not isinstance(m, dict):
                continue
            name = m.get("name") or "Unknown"
            methods.append(MethodData(name=name, description=m.get("description")))
        paper.methods = methods

        metrics: list[MetricResult] = []
        for m in entities.get("metrics", []):
            if not isinstance(m, dict):
                continue
            metric_name = m.get("metric_name") or m.get("name")
            value = m.get("value")
            if not metric_name or value is None:
                continue
            metrics.append(
                MetricResult(
                    metric_name=str(metric_name),
                    value=str(value),
                    dataset=m.get("dataset"),
                    comparison_baseline=m.get("comparison_baseline"),
                )
            )
        paper.metrics = metrics

        limitations: list[LimitationData] = []
        for l in entities.get("limitations", []):
            if not isinstance(l, dict):
                continue
            description = l.get("description") or l.get("text") or ""
            if description:
                limitations.append(LimitationData(description=description))
        paper.limitations = limitations

        hp = entities.get("hyperparameters")
        if isinstance(hp, dict):
            paper.hyperparameters = HyperparameterSignal(**hp)

        comp = entities.get("compute")
        if isinstance(comp, dict):
            paper.compute = ComputeDisclosure(**comp)

        print(f"   ✓ Extracted {len(paper.claims)} claims, {len(paper.limitations)} risk flags.")
        log_feature_success(
            logger,
            "EXTRACTION",
            "phase_6_mapping",
            "Entity mapping completed",
            paper_id=paper.id,
            claims=len(paper.claims),
            datasets=len(paper.datasets),
            methods=len(paper.methods),
            limitations=len(paper.limitations),
        )
        await publish_processing_event(
            paper.id,
            "phase_6_mapping",
            "SUCCESS",
            "Entity mapping completed",
            claims=len(paper.claims),
            datasets=len(paper.datasets),
            methods=len(paper.methods),
            limitations=len(paper.limitations),
        )

        # ── Step 7: Embed claims → Qdrant ─────────────────────────────────────
        claim_texts = [c.statement for c in paper.claims]
        if claim_texts:
            print(f"\n👉 [PHASE 7] Qdrant Vector Projection (Claims)...")
            logger.info(f"[Pipeline] Embedding {len(claim_texts)} claims for {paper.id}")
            log_feature_start(logger, "EMBEDDING", "phase_7_store_claims", "Embedding and storing claims", paper_id=paper.id, claim_count=len(claim_texts))
            await publish_processing_event(paper.id, "phase_7_store_claims", "START", "Embedding and storing claim vectors", claim_count=len(claim_texts))
            await store_claims(paper.id, claim_texts)
            print(f"   ✓ Uploaded {len(claim_texts)} claim vectors to Qdrant cluster")
            log_feature_success(logger, "EMBEDDING", "phase_7_store_claims", "Claim vectors stored", paper_id=paper.id, claim_count=len(claim_texts))
            await publish_processing_event(paper.id, "phase_7_store_claims", "SUCCESS", "Claim vectors stored", claim_count=len(claim_texts))
        else:
            print(f"\n👉 [PHASE 7] Skipping Claim Vectorization (None found)")
            log_feature_success(logger, "EMBEDDING", "phase_7_store_claims", "No claims found, skipped claim vectorization", paper_id=paper.id)
            await publish_processing_event(paper.id, "phase_7_store_claims", "SUCCESS", "No claims found, skipped claim vectorization")

        # ── Step 8: Mark as PROCESSED ─────────────────────────────────────────
        print(f"\n👉 [PHASE 8] Finalizing RCI Core...")
        paper.status = PaperStatus.PROCESSED
        await update_paper(paper)
        logger.info(f"[Pipeline] ✓ Paper {paper.id} processed successfully.")
        print(f"[{'*'*15} ARXION INGESTION COMPLETE {'*'*15}]\n")
        log_feature_success(logger, "INGESTION", "phase_8_finalize", "Paper processing completed", paper_id=paper.id, status=paper.status.value)
        await publish_processing_event(paper.id, "phase_8_finalize", "SUCCESS", "Paper processing completed", status=paper.status.value)

    except Exception as e:
        logger.error(f"[Pipeline] ✗ Failed to process paper {paper.id}: {e}", exc_info=True)
        log_feature_failure(logger, "INGESTION", "pipeline", "Ingestion pipeline failed", error=e, paper_id=paper.id)
        await publish_processing_event(paper.id, "pipeline", "FAILURE", "Ingestion pipeline failed", error=str(e))
        print(f"\n[!!! CRITICAL PIPELINE FAILURE !!!]")
        print(f"   Paper ID   : {paper.id}")
        print(f"   Fatal Error: {str(e)}")
        print(f"   Check the Python stack trace above for the exact breakdown.")
        paper.status = PaperStatus.FAILED
        paper.error_message = str(e)
        await update_paper(paper)
        print(f"   ✓ Status updated to FAILED in NeonDB state.")
        log_feature_failure(logger, "INGESTION", "phase_error_finalize", "Paper status moved to FAILED", error=e, paper_id=paper.id)
        await publish_processing_event(paper.id, "phase_error_finalize", "FAILURE", "Paper status moved to FAILED", error=str(e))
