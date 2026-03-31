# 🚀 ARXION – MASTER FEATURE SPECIFICATION

## 🧠 Project Definition

**Arxion** is a modular **Research Operating System** that ingests academic papers and provides a unified intelligence platform to **understand, evaluate, compare, query, and act on research literature**, eliminating the need for scattered tools.

### Core User Outcomes
1. Upload papers → Get immediate actionable insights
2. Query across corpus → Get grounded answers with citations
3. Evaluate credibility → Trust research before building on it
4. Discover gaps → Know what's NOT been explored
5. Take action → Generate code, reproduction guides, related work

---

# 🟦 LAYER 1: CORE INTELLIGENCE ENGINE (MVP – CURRENTLY SHIPPED)

These features are **mandatory** and already implemented.

### 1.1 Paper Ingestion System ✅
- Single PDF upload
- Batch PDF upload (multiple files)
- Raw text upload with optional title
- Background async processing (non-blocking API)
- Status tracking: INGESTED → PROCESSING → PROCESSED / FAILED

**Frontend**: `/dashboard/upload`  
**API**: `POST /upload/pdf`, `POST /upload/pdfs`, `POST /upload/text`

### 1.2 Document Processing Pipeline ✅
- PDF → text extraction (PyPDF2)
- Section-aware semantic chunking (LangChain)
- Metadata detection (title, authors, year)
- Text cleaning & normalization

**Backend Service**: `app/services/extractor.py`, `chunker.py`

### 1.3 Semantic Embedding System ✅
- Generate embeddings for chunks via Gemini Embedding API
- Store chunks + metadata in Qdrant vector DB
- Attach: paper_id, chunk_index, section, page

**Backend Service**: `app/services/vector_store.py`

### 1.4 Structured Extraction Engine ✅
Extract via Gemini LLM into strict JSON schema:
- **Metadata**: title, authors, abstract, year, tags, baseline
- **Method**: methods list with descriptions
- **Data**: datasets used (name, description, source)
- **Results**: claims, metrics, limitations
- **Reproducibility**: code_link, data_link, hyperparameters, compute disclosure

**Backend Service**: `app/services/entity_extractor.py`

### 1.5 Research Database (NeonDB/SQLite) ✅
Persistent storage:
- Papers (id, title, authors, status, extracted_data)
- Users (clerk_id, name, created_at)
- Gaps (title, description, linked_paper_ids, user_id)
- Future: notes, collections, saved queries

**Backend**: `app/models/sql_models.py`

### 1.6 Retrieval-Augmented Generation (RAG) ✅
- Query across all papers (or filtered subset)
- Retrieve top-K similar chunks from Qdrant (semantic search)
- Generate grounded answer via Gemini with citations
- Citations include: paper_id, chunk_index, relevance score, snippet

**Frontend**: `/dashboard/chat`  
**API**: `POST /chat`

### 1.7 Literature Matrix ✅
- Table view of all ingested papers
- Columns: ID, Title, Authors, RCI (credibility), Datasets, Methods, Status
- Sorting + filtering by status/tag
- Click row to drill into paper detail

**Frontend**: `/dashboard/matrix`  
**API**: `GET /papers` (with optional filters)

### 1.8 Knowledge Graph ✅
- 3D visualization of paper–dataset–method relationships
- Node types: Papers (white), Datasets (orange), Methods (dark)
- Edges: paper→dataset (orange), paper→method (dark)
- Interactive: hover for tooltips, rotate/zoom

**Frontend**: `/dashboard/graph`  
**Backend**: Constructs graph from API `/papers` response

### 1.9 Paper Detail View ✅
- Single paper inspection page
- Show: title, authors, RCI score, reproducibility score
- Extracted entities as structured sections:
  - Datasets table
  - Methods list
  - Claims with evidence pointers
  - Limitations
  - Code/data links
- Risk flags for missing metadata

**Frontend**: `/dashboard/paper/[id]`  
**API**: `GET /papers/{paper_id}`

### 1.10 Export Engine ✅
- **CSV Matrix**: Tabular export of papers + all extracted fields
- **BibTeX**: Generate standard citation format
- **Related Work Draft**: AI-generated literature review synthesis

**Frontend**: `/dashboard/export`  
**API**: `POST /export` (format: csv_matrix | bibtex | related_work_draft)

### 1.11 Gap Tracking System ✅
- User-defined research gaps
- CRUD: create, list, update, delete
- Link gaps to paper IDs for context
- Demo gaps: auto-detected contradictions, data saturation

**Frontend**: `/dashboard/gaps`  
**API**: `GET|POST|PUT|DELETE /gaps`

### 1.12 User Authentication & Profiles ✅
- Clerk-based signup/login
- Protected dashboard routes
- Profile page: display name, paper counts, processed stats
- Local dev auth bypass

**Frontend**: `/sign-in`, `/sign-up`, `/dashboard/profile`  
**API**: `GET|PUT /profile`

---

# 🟥 LAYER 2: MODULAR ADD-ON SYSTEM (PLUGINS)

These features extend core capabilities and can be toggled/implemented incrementally.

---

## 🧩 CATEGORY A: PAPER UNDERSTANDING MODULES

### A1. Paper Simplifier
**Purpose**: Convert dense academic paper into accessible explanation

**Input**: paper_id  
**Output**: Beginner-friendly summary (3-4 paragraphs)

**Implementation**:
- New route: `POST /papers/{paper_id}/simplify`
- Prompt: "Explain this paper for a high school student"
- Store in paper record for caching

**Frontend Component**: `/dashboard/paper/[id]` tab: "Simple Explanation"

**Effort**: Low (~2 days)

---

### A2. Math Step-by-Step Explainer
**Purpose**: Break down equations line-by-line

**Input**: equation snippet (from paper or user paste)  
**Output**: Step-by-step explanation + intuition

**Implementation**:
- New endpoint: `POST /math/explain`
- Prompt engineer for clarity
- Return structured steps

**Frontend**: Modal in paper view; floating math explainer widget

**Effort**: Low (~1 day)

---

### A3. Section Summarizer
**Purpose**: Generate separate summaries for abstract, method, results

**Input**: paper_id  
**Output**: { abstract_summary, method_summary, results_summary, contribution_summary }

**Implementation**:
- New endpoint: `POST /papers/{paper_id}/section-summaries`
- Use Gemini to extract + summarize each section independently

**Frontend**: Accordion view on paper detail page

**Effort**: Low (~1 day)

---

## 🧩 CATEGORY B: EVALUATION MODULES ⭐ (HIGH VALUE)

### B1. Research Credibility Scorer 🌟
**Purpose**: Quantify research trustworthiness

**Input**: paper_id  
**Output**:
```json
{
  "overall_rci": 87.5,
  "reproducibility_score": 92,
    "components": {
      "code_available": true,
      "datasets_available": true,
      "hyperparams_disclosed": true,
      "multiple_runs": true,
      "error_bars": true
    }
  "transparency_score": 81,
    "components": {
      "methods_detailed": true,
      "limitations_acknowledged": true,
      "failure_cases_discussed": false,
      "hardware_disclosed": true
    }
  "evaluation_quality_score": 78,
    "components": {
      "multiple_baselines": true,
      "statistical_significance": true,
      "ablation_study": false,
      "cross_dataset_eval": true
    }
  "risk_flags": ["MISSING_CODE_REPO", "SUSPICIOUS_IMPROVEMENT"],
  "evidence": {
    "strengths": ["..."],
    "weaknesses": ["..."]
  }
}
```

**Implementation**:
- New service: `app/services/credibility_scorer.py`
- Analyze extracted fields + paper claims
- Score each dimension (0-100)
- Return breakdown + evidence + flags
- Cache in paper record for performance

**Frontend**:
- Replace mock RCI with real calculation
- `/dashboard/paper/[id]`: Show breakdown + evidence
- `/dashboard/matrix`: Color-code RCI column by score (red/yellow/green)

**Effort**: Medium (~5 days)

---

### B2. Benchmark Fairness Analyzer
**Purpose**: Detect unfair experiment comparisons

**Input**: paper_id  
**Output**:
```json
{
  "fairness_score": 72,
  "issues": [
    {
      "type": "MISSING_BASELINE",
      "description": "No comparison to XYZ baseline",
      "severity": "high"
    },
    {
      "type": "SUSPICIOUS_IMPROVEMENT",
      "description": "+45% over baseline with no ablation",
      "severity": "medium"
    }
  ],
  "recommendations": ["..."]
}
```

**Implementation**:
- Analyze claims vs evaluation results
- Check for baselines in related work vs results
- Detect outlier improvements
- Prompt-engineer heuristics in Gemini

**Frontend**: Risk assessment tab in paper view

**Effort**: Medium (~4 days)

---

### B3. Bias Detector
**Purpose**: Surface potential dataset/evaluation bias

**Input**: paper_id  
**Output**:
```json
{
  "bias_score": 64,
  "detected_biases": [
    {
      "category": "dataset_bias",
      "name": "Geographic Imbalance",
      "description": "75% of data from one region",
      "evidence": "..."
    }
  ]
}
```

**Implementation**:
- Analyze dataset descriptions
- Cross-reference with known dataset biases (internal knowledge base)
- Check evaluation on subset distributions
- Surface imbalances

**Frontend**: Bias section in paper detail

**Effort**: Medium (~4 days)

---

## 🧩 CATEGORY C: CROSS-PAPER INTELLIGENCE ⭐ (HIGHEST VALUE)

### C1. Contradiction Detector 🌟
**Purpose**: Find conflicting claims across papers

**Input**: entire corpus or subset  
**Output**:
```json
{
  "contradictions": [
    {
      "id": "contra_001",
      "claim_1": {
        "paper_id": "ARX-142",
        "text": "Attention is O(n)",
        "confidence": 0.95
      },
      "claim_2": {
        "paper_id": "ARX-811",
        "text": "Attention is O(n²) complexity",
        "confidence": 0.92
      },
      "severity": "high",
      "explanation": "Direct contradiction on algorithmic complexity"
    }
  ]
}
```

**Implementation**:
- Batch retrieve all claims from all papers
- Use Gemini to cluster + compare semantically
- Detect contradictions
- Return pairs with confidence + evidence

**Frontend**: 
- New page: `/dashboard/contradictions`
- Table view with side-by-side comparison
- Click to view full paper context

**Effort**: Medium (~6 days)

---

### C2. Research Gap Finder 🌟
**Purpose**: Identify unexplored research combinations

**Input**: corpus + gap threshold  
**Output**:
```json
{
  "gaps": [
    {
      "gap_id": "gap_001",
      "type": "MISSING_COMBO",
      "description": "No papers combine Method-XYZ with Dataset-ABC",
      "evidence": {
        "papers_with_method": 12,
        "papers_with_dataset": 8,
        "papers_with_both": 0
      },
      "opportunity_score": 0.87
    }
  ]
}
```

**Implementation**:
- Extract method–dataset pairs from all papers
- Build combination matrix
- Find unfilled cells (potential gaps)
- Score by related work + growth potential

**Frontend**:
- `/dashboard/gap-matrix`: Heatmap of method×dataset combinations
- Green = explored, Red = gap
- Click to see papers or create gap

**Effort**: High (~8 days)

---

### C3. Trend Analyzer
**Purpose**: Track how research topics/methods evolve

**Input**: corpus  
**Output**:
```json
{
  "method_trends": [
    {
      "method": "Attention",
      "papers_by_year": { "2020": 5, "2021": 14, "2022": 32, "2023": 18 },
      "trend": "peaked_2022",
      "velocity": "declining"
    }
  ],
  "dataset_trends": [...],
  "topic_trends": [...]
}
```

**Implementation**:
- Aggregate metadata by year
- Count method/dataset/topic occurrences
- Calculate trend direction (linear regression)
- Detect peaks/valleys

**Frontend**: `/dashboard/trends` with line charts (Recharts)

**Effort**: Medium (~4 days)

---

### C4. Citation Network Analyzer
**Purpose**: Identify influential papers + research communities

**Input**: corpus  
**Output**:
```json
{
  "influential_papers": [
    {
      "paper_id": "ARX-001",
      "title": "...",
      "centrality_score": 0.92,
      "citations_in_corpus": 34
    }
  ],
  "communities": [
    {
      "community_id": 1,
      "papers": ["ARX-001", "ARX-002", ...],
      "topic": "Vision Transformers",
      "density": 0.8
    }
  ]
}
```

**Implementation**:
- Parse references in papers (from extracted data)
- Build citation graph
- Calculate PageRank + modularity
- Detect communities (graph clustering)

**Frontend**: Graph view enhanced with community colors

**Effort**: High (~10 days)

---

## 🧩 CATEGORY D: ACTION / BUILD MODULES 🌟 (MOST UNIQUE)

### D1. Code Generator 🌟
**Purpose**: Convert paper → working code skeleton

**Input**: paper_id  
**Output**:
```python
# Generated code file
class PaperModel(nn.Module):
    def __init__(self, config):
        super().__init__()
        # Auto-populated from extracted methods
    
    def forward(self, x):
        # Skeleton with comments showing next steps

# Training loop template
# Config template (yaml)
# Requirements.txt
```

**Implementation**:
- New endpoint: `POST /papers/{paper_id}/generate-code`
- Prompt: "Generate minimal working implementation"
- Extract method steps + hyperparams from paper
- Use Gemini to generate `.py`, `.yaml`, `README.md`
- Return as downloadable zip

**Frontend**: 
- Button in `/dashboard/paper/[id]` → "Generate Code"
- Modal with preview
- Download zip with repo structure

**Effort**: High (~8 days)

---

### D2. Reproduction Planner 🌟
**Purpose**: Step-by-step guide to reproduce paper

**Input**: paper_id  
**Output**:
```json
{
  "steps": [
    {
      "step": 1,
      "title": "Setup Environment",
      "commands": ["python --version", "pip install torch..."],
      "time_estimate": "10 min"
    },
    {
      "step": 2,
      "title": "Download Dataset",
      "details": "ImageNet (requires registration at ...)",
      "time_estimate": "2 hours"
    }
  ],
  "total_time_estimate": "1-2 weeks",
  "difficulty": "intermediate",
  "blockers": ["Need GPU access", "...]
}
```

**Implementation**:
- New endpoint: `POST /papers/{paper_id}/reproduction-plan`
- Extract: datasets, hardware, training details
- Generate step-by-step guide
- Add time/difficulty estimates
- Surface blockers

**Frontend**: `/dashboard/paper/[id]` → "Reproduction Guide" accordion

**Effort**: Medium (~5 days)

---

### D3. Effort Estimator 🌟
**Purpose**: Estimate cost/complexity to reproduce paper

**Input**: paper_id  
**Output**:
```json
{
  "gpu_requirement": {
    "type": "A100",
    "count": 8,
    "hours": 720,
    "cost_usd": 4800
  },
  "implementation_difficulty": "intermediate",
    "complexity_score": 6.5,
    "reasoning": "Complex attention mechanism, but standard training"
  "time_to_reproduce": {
    "setup": "1 day",
    "data_prep": "3 days",
    "training": "2 weeks",
    "evaluation": "3 days",
    "total": "3.5 weeks"
  },
  "risk_factors": ["Requires specific GPU type", "Dataset limited availability"],
  "feasibility_score": 0.72
}
```

**Implementation**:
- New service: `app/services/effort_estimator.py`
- Analyze: compute disclosure, dataset size, method complexity
- Use heuristics + ML to estimate
- Return breakdown + risk factors

**Frontend**: 
- Card in `/dashboard/paper/[id]` showing effort summary
- Click to expand details

**Effort**: Medium (~4 days)

---

### D4. Project Starter Kit
**Purpose**: Generate ready-to-use GitHub repo

**Input**: paper_id + template preference  
**Output**: Downloadable zip with:
```
paper-implementation/
  README.md (generated)
  requirements.txt
  config.yaml (from paper)
  src/
    model.py (generated)
    train.py (generated)
    evaluate.py (generated)
  data/
    download_script.sh
  notebooks/
    exploration.ipynb
```

**Implementation**:
- Build on Code Generator
- Add: `.gitignore`, `setup.py`, CI/CD templates
- Generate `README.md` with citations, setup steps
- Return as zip for download

**Frontend**: Button in code generator modal

**Effort**: Low (~2 days, builds on D1)

---

## 🧩 CATEGORY E: PRODUCTIVITY MODULES

### E1. Related Work Generator
**Purpose**: Generate literature review section

**Input**: paper_ids (curated subset)  
**Output**: Markdown section (~1500 words)
```markdown
## Related Work

Several approaches address this problem:

**Vision Transformers (ViT)** [1, 2, ...] introduce attention mechanisms...

**Efficient Attention** [3, 4] addresses computational complexity by...

**Comparative Analysis**: While ViT achieves X%, our approach achieves Y% 
by combining properties from [5, 6]...
```

**Implementation**:
- Endpoint: `POST /export` with format=`related_work_draft` (already exists)
- Enhance with better synthesis logic
- Add bibliography with full citations

**Frontend**: Already exists in `/dashboard/export`

**Effort**: Low (~1 day, mostly refinement)

---

### E2. Smart Citation Manager
**Purpose**: Manage + export references in multiple formats

**Input**: paper collection  
**Output**: BibTeX, JSON, CSV, RIS (multiple formats)

**Implementation**:
- New endpoint: `GET /citations/export?format=bibtex|json|csv|ris`
- Support multiple export formats
- Validate citations
- Generate from extracted metadata

**Frontend**: `/dashboard/export` → enhanced format selector

**Effort**: Low (~2 days)

---

### E3. Notes & Annotation Layer
**Purpose**: Add persistent notes linked to papers + sections

**Input**: paper_id, section, note_text  
**Output**: Stored annotation

**Implementation**:
- New DB table: `Annotations` (user_id, paper_id, text, section, created_at)
- Endpoints: `POST|GET|DELETE /papers/{id}/notes`
- Return notes with paper queries

**Frontend**: 
- Side panel in `/dashboard/paper/[id]` for notes
- Add/edit/delete notes in UI
- Show note count in paper list

**Effort**: Low (~3 days)

---

## 🧩 CATEGORY F: EXPLORATION MODULES

### F1. Dataset Explorer
**Purpose**: Understand dataset landscape

**Input**: corpus  
**Output**:
```json
{
  "datasets": [
    {
      "name": "ImageNet",
      "usage_count": 47,
      "first_paper": "ARX-001",
      "last_paper": "ARX-482",
      "trend": "declining",
      "papers": ["ARX-001", "ARX-105", ...]
    }
  ],
  "dataset_stats": {
    "total_unique": 127,
    "most_used": "ImageNet",
    "emerging": "LAION-2B"
  }
}
```

**Implementation**:
- Endpoint: `GET /datasets`
- Aggregate from all papers
- Build ranking by usage

**Frontend**: `/dashboard/datasets` table + charts

**Effort**: Low (~2 days)

---

### F2. Method Evolution Timeline
**Purpose**: See how methods change over time

**Input**: corpus by year  
**Output**: Timeline visualization

**Implementation**:
- Endpoint: `GET /methods/timeline`
- Group by year + method
- Calculate adoption curves

**Frontend**: `/dashboard/method-timeline` with animated timeline

**Effort**: Medium (~3 days)

---

### F3. Field Health Dashboard ⭐
**Purpose**: Macro-level research quality metric

**Input**: corpus  
**Output**:
```json
{
  "overall_health_score": 71.3,
  "reproducibility_rate": "34%",
  "code_availability": "28%",
  "dataset_availability": "45%",
  "benchmark_saturation": {
    "ImageNet": 0.92,
    "CIFAR-10": 0.88
  },
  "paper_quality_trend": "stable",
  "risk_areas": [
    "Few papers with open code",
    "Heavy dataset reuse",
    "Benchmark saturation"
  ]
}
```

**Implementation**:
- Service: `app/services/field_health.py`
- Aggregate health metrics across corpus
- Calculate percentages + trends
- Return dashboard data

**Frontend**: `/dashboard` (already exists, enhance with real calculations)

**Effort**: Medium (~4 days)

---

# 🟨 SYSTEM-LEVEL FEATURES

## Plugin Architecture
- **Goal**: Make features modular and independently toggleable
- **Implementation**: 
  - Feature flags in `app/core/config.py`
  - Conditionally load services + routes
  - Frontend can check feature availability via `/api/v1/features` endpoint

**Effort**: Low (~1 day setup, applies to all modules)

---

## User Workspaces
- **Goal**: Let users organize papers into personal collections
- **Implementation**:
  - New DB tables: `Collections`, `collection_papers`
  - Endpoints: CRUD collections + add papers to collection
  - Filter matrix/queries by collection

**Effort**: Medium (~5 days)

---

## Real-Time Processing Feedback
- **Goal**: Show users what's happening during processing
- **Implementation**:
  - WebSocket for processing updates
  - Status endpoint currently polls; upgrade to push
  - Show: extraction phase, embedding progress, scanning speed

**Effort**: Medium (~4 days)

---

## Scalable API Design
- **Goal**: Make adding new features fast
- **Implementation**:
  - Standardize endpoint patterns
  - Shared error handling
  - Modular service layer
  - Already mostly in place; refine as needed

**Effort**: Low (ongoing)

---

# 🧊 FINAL PRODUCT VISION

> **Arxion** is a modular research operating system that unifies scattered research tools into a single platform, enabling users to understand, evaluate, compare, and act on academic literature at scale. Instead of juggling 10 tools (PDFjs, Google Scholar, Notion, GitHub search, etc.), researchers have **one system** that does all of it.

---

# ⚠️ IMPLEMENTATION STRATEGY

## NOT Building Everything At Once ❌

You are defining the **universe**. Then strategically pick:

### Phase 1: Core (SHIPPED ✅)
All LAYER 1 features (1.1 - 1.12)

### Phase 2: Core + Impact Modules (RECOMMENDED NEXT)
Pick 3-5 high-ROI modules:
1. **B1: Credibility Scorer** (trust research before building)
2. **C1: Contradiction Detector** (find conflicting claims)
3. **C2: Gap Finder** (know what's unexplored)
4. **D3: Effort Estimator** (realistic reproduction cost)
5. **F3: Field Health** (macro research quality)

**Why these?**
- Highest user value
- Clear ROI
- Directly address pain points
- Enable action

**Timeline**: ~6-8 weeks (parallel development)

### Phase 3: Convenience + Exploration
A1-A3, C3, C4, E1-E3, F1-F2

### Phase 4: The "Wow" Factor
D1 (Code Generator), D2 (Reproduction Planner) – these differentiate Arxion

---

# 🎯 PRIORITY MATRIX

```
HIGH IMPACT / LOW EFFORT:
- B1 Credibility Scorer (5 days)
- D3 Effort Estimator (4 days)
- F3 Field Health (4 days)
- A1 Paper Simplifier (2 days)

HIGH IMPACT / MEDIUM EFFORT:
- C1 Contradiction Detector (6 days)
- C2 Gap Finder (8 days)
- D1 Code Generator (8 days)
- C3 Trend Analyzer (4 days)

MEDIUM IMPACT / LOW EFFORT:
- E1 Related Work (1 day)
- E2 Citations (2 days)
- E3 Annotations (3 days)
- A2 Math Explainer (1 day)

MEDIUM IMPACT / HIGH EFFORT:
- C4 Citation Network (10 days)
- D2 Reproduction Planner (5 days)
- Workspaces (5 days)
```

---

# 📋 FEATURE CHECKLIST FOR FUTURE PRS

When adding a new module, ensure:

- [ ] Backend service in `app/services/`
- [ ] New route in appropriate router
- [ ] Request/response Pydantic models
- [ ] Database migration (if needed)
- [ ] Frontend page/modal/component
- [ ] API docs updated
- [ ] Feature flag (if optional)
- [ ] Error handling + fallbacks
- [ ] Caching strategy (if applicable)
- [ ] Test coverage
- [ ] README updated

---

# 🚀 GETTING STARTED (NEXT STEPS)

1. **Pick Phase 2 module**: Start with Credibility Scorer (highest impact/lowest friction)
2. **Create feature branch**: `feature/credibility-scorer`
3. **Backend first**: 
   - Build `app/services/credibility_scorer.py`
   - Add route to `/papers/{id}/credibility`
   - Test with curl
4. **Frontend second**:
   - Add breakdown display in `/dashboard/paper/[id]`
   - Wire API call
   - Style to match design
5. **PR + review**: Merge when done
6. **Repeat**: Next module

---

# 📚 REFERENCE

**Associated Files**:
- Core architecture: [README.md](README.md)
- API reference: Swagger at http://localhost:8000/docs
- Backend structure: `backend/app/`
- Frontend pages: `frontend/app/dashboard/`

---

Generated: 2026-03-31  
Version: 1.0 (Product Spec)
