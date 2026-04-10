# Arxion Prototype

Arxion is a full-stack research intelligence prototype that ingests research PDFs, extracts structured entities, stores semantic vectors, and lets users explore insights through matrix views, chat, gap tracking, graph visualization, and export tools.

This README explains:
1. What the project does
2. All core features
3. The full end-to-end flow
4. What input is given at each stage and what output is returned
5. How to run the project

## 1) Project

Arxion helps teams move from raw papers to usable research intelligence.

Instead of manually reading every PDF, users can:
1. Upload papers
2. Let the pipeline extract metadata, claims, methods, datasets, and limitations
3. Ask questions over the ingested corpus
4. Track research gaps and contradictions
5. Export synthesis artifacts (CSV matrix, related-work draft)

## 2) High-Level Architecture

Arxion has three practical layers:

1. Frontend (Next.js): Dashboard and workflow UI
2. Backend (FastAPI): Upload, processing, retrieval, CRUD, and export APIs
3. Data + Intelligence Services:
	- SQL database for paper/user/gap records
	- Qdrant for vector similarity search
	- Gemini for extraction, generation, and embeddings

## 3) Core Features

### A. Ingestion
1. Upload single PDF via API
2. Upload multiple PDFs in one request
3. Upload raw text and process it as a paper
4. Background ingestion pipeline so API responds quickly

### B. Paper Management
1. List all papers
2. Filter by status or tag
3. View one paper by ID
4. Edit paper metadata
5. Re-analyze a paper
6. Delete a paper and its vectors

### C. Matrix and Graph Exploration
1. Literature matrix table of ingested papers
2. Per-paper detail page with extracted evidence mapping
3. 3D graph linking papers to datasets and methods

### D. Research Gap Tracking
1. Create, list, update, and delete user-defined gaps
2. Link gaps to paper IDs
3. Combine user gaps with static demo gap cards in UI

### E. Retrieval-Augmented Chat
1. Ask a question across all papers or selected paper IDs
2. System retrieves top semantic chunks from Qdrant
3. Gemini generates grounded response with chunk citations

### F. Export and Writing
1. Export as CSV matrix
2. Export as BibTeX
3. Generate related-work draft text

### G. Profile and Auth
1. Clerk-based protected dashboard routes
2. Profile endpoint for display name and counts
3. Backend includes a local development auth bypass fallback

## 4) Full Workflow (Input -> Process -> Output)

### Step 1: Upload Research Material
Input:
1. PDF file(s) via multipart form-data
2. Or raw text + optional title via form fields

Process:
1. File/text is saved and registered as INGESTED
2. Background task starts ingestion pipeline

Output:
1. Immediate API response with paper_id, filename, status, message
2. Status can be polled using status endpoint

### Step 2: Background Ingestion Pipeline
Input:
1. Paper record with file path

Process:
1. Extract text
2. Chunk text
3. Generate embeddings
4. Store vectors in Qdrant
5. Extract structured entities with Gemini
6. Update paper record to PROCESSED (or FAILED)

Output:
1. Updated paper object with extracted fields:
	- title, authors, abstract, year, tags
	- claims, datasets, methods, metrics, limitations
	- code/data links and other signals

### Step 3: Explore Papers
Input:
1. Optional filters (status, tag) or paper_id

Process:
1. Backend reads records and returns serialized paper data

Output:
1. Paper lists for matrix/table views
2. Single paper detail for deep inspection

### Step 4: Ask Research Questions (RAG)
Input:
1. query string
2. optional list of paper_ids

Process:
1. Retrieve top matching chunks from Qdrant
2. Build grounded prompt
3. Generate answer with Gemini

Output:
1. answer text
2. citations list (paper_id, chunk_index, text, score)

### Step 5: Track Gaps
Input:
1. title
2. description
3. linked_paper_ids

Process:
1. Create/update/delete gap rows scoped to current user

Output:
1. Gap objects with IDs and timestamps

### Step 6: Export Artifacts
Input:
1. paper_ids list
2. format: bibtex, csv_matrix, related_work_draft

Process:
1. Load target papers
2. Branch by format
3. Generate content

Output:
1. content string
2. format echo

## 5) API Overview (Inputs and Outputs)

Base URL: http://localhost:8000/api/v1

### Upload Endpoints
1. POST /upload/pdf
	- Input: multipart form-data field file (.pdf)
	- Output: UploadResponse { paper_id, filename, status, message }

2. POST /upload/pdfs
	- Input: multipart form-data field files[] (.pdf)
	- Output: list of UploadResponse (per file)

3. POST /upload/text
	- Input: form fields text, title (optional)
	- Output: UploadResponse

### Status Endpoint
1. GET /status/{paper_id}
	- Input: paper_id path param
	- Output: { paper_id, status, title, error_message }

### Papers Endpoints
1. GET /papers
	- Input: optional query params status, tag
	- Output: list of PaperResponse

2. GET /papers/{paper_id}
	- Input: paper_id path param
	- Output: PaperResponse

3. PUT /papers/{paper_id}
	- Input: JSON with editable fields (title, authors, tags, abstract, year)
	- Output: updated PaperResponse

4. POST /papers/{paper_id}/reanalyze
	- Input: paper_id path param
	- Output: { message }

5. DELETE /papers/{paper_id}
	- Input: paper_id path param
	- Output: { message }

### Chat Endpoint
1. POST /chat
	- Input JSON:
	  {
		 "query": "What datasets are most used?",
		 "paper_ids": null
	  }
	- Output JSON:
	  {
		 "answer": "...",
		 "citations": [
			{
			  "paper_id": "...",
			  "chunk_index": 12,
			  "text": "...",
			  "score": 0.84
			}
		 ]
	  }

### Gaps Endpoints
1. GET /gaps
	- Input: authenticated user context
	- Output: list of GapResponse

2. POST /gaps
	- Input: { title, description, linked_paper_ids }
	- Output: GapResponse

3. PUT /gaps/{gap_id}
	- Input: partial update body
	- Output: GapResponse

4. DELETE /gaps/{gap_id}
	- Input: gap_id path param
	- Output: { message }

### Export Endpoint
1. POST /export
	- Input: { paper_ids: [...], format: "bibtex" | "csv_matrix" | "related_work_draft" }
	- Output: { content, format }

### Profile Endpoints
1. GET /profile
	- Input: authenticated user context
	- Output: { clerk_user_id, display_name, papers_count, processed_count, gaps_count }

2. PUT /profile
	- Input: { display_name }
	- Output: updated profile payload

## 6) Frontend Page Flow

1. Landing: product narrative and CTA
2. Dashboard Home: high-level health KPIs
3. Ingestion: upload PDFs
4. Papers: edit, re-analyze, delete
5. Lit Matrix: compare papers in tabular view
6. Paper Detail: inspect one paper deeply
7. 3D Graph: visualize paper-dataset-method links
8. Gap Intelligence: create/manage gaps
9. Matrix Chat: ask corpus-level questions
10. Drafts and Export: generate artifacts
11. Profile: manage display name and usage stats

## 7) Project Structure

```
Arxion-prototype/
  backend/
	 main.py
	 app/
		core/        # config, auth, database clients
		models/      # pydantic + sql models + store
		routers/     # API routes
		services/    # ingestion, extraction, chunking, vector logic
  frontend/
	 app/           # Next.js app router pages
	 components/    # reusable UI
	 lib/           # client utilities/store
```

## 8) Local Setup

### Backend
1. Go to backend directory
2. Create/activate Python virtual environment
3. Install dependencies
4. Add .env file
5. Start FastAPI

Example:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

### Frontend
1. Go to frontend directory
2. Install dependencies
3. Start Next.js dev server

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## 9) Environment Variables (Backend)

Create backend/.env with at least:

```ini
GEMINI_API_KEY=your_key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
DATABASE_URL=sqlite+aiosqlite:///./arxion.db
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=50
CORS_ORIGINS=["http://localhost:3000"]
CLERK_ISSUER_URL=https://clerk.arxion.com
```

## 10) Prototype Notes

1. Some dashboard metrics are currently simulated on frontend (for example RCI display values).
2. Export UI currently uses mock paper IDs by default until dynamic paper selection is wired.
3. Graph node coordinates are randomized per load for visualization.
4. If Gemini is unavailable, some endpoints fall back to mocked text responses.

## 11) Quick Demo Script (What to Show Someone)

1. Open dashboard and upload 2-3 PDFs
2. Poll processing status until PROCESSED
3. Open Lit Matrix to verify extracted entities
4. Open a paper detail page and show claims/evidence mapping
5. Ask a question in Matrix Chat
6. Create one custom gap and link paper IDs
7. Generate csv_matrix or bibtex export

Expected final output:
1. Structured paper records in matrix
2. Cited chat answers
3. Saved gap entries
4. Exported artifact text/content ready to copy into downstream workflows

---

## 12) Product Roadmap & Feature Specifications

For the **complete feature universe and expansion roadmap**, see [FEATURES.md](FEATURES.md).

This master specification document outlines:
- **Layer 1**: Core features (currently shipped)
- **Layer 2**: Modular plugins organized by category:
  - Understanding modules (paper simplifier, math explainer, summaries)
  - **Evaluation modules** (credibility scorer, benchmark fairness, bias detection)
  - **Cross-paper modules** (contradiction detector, gap finder, trends, citation networks)
  - **Action modules** (code generator, reproduction planner, effort estimator)
  - **Productivity modules** (related work, citations, annotations)
  - **Exploration modules** (dataset explorer, method timeline, field health)
- **Implementation strategy**: Phase-based rollout with priority matrix

**Recommended next features** (highest impact + lowest friction):
1. Research Credibility Scorer
2. Contradiction Detector
3. Research Gap Finder
4. Effort Estimator
5. Field Health Dashboard
