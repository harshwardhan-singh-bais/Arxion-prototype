# 🧊 Arxion: Advanced Research Intelligence Pipeline

**Arxion** is a professional-grade, full-stack intelligence engine designed to automatically ingest, comprehend, and structure raw scientific PDFs into a highly queryable, semantic knowledge platform.

Arxion leverages cutting-edge LLMs natively bound to rigorous vector databases to automate the synthesis of literature matrices, extract scientific contradictions, perform Retrieval-Augmented Generation (RAG) over entire paper collections, and highlight missing research gaps automatically.

---

## 🏗 System Architecture (The "3-Layer" Strategy)

This platform is deliberately modeled against true production-tier constraints.

1. **Structured Truth Layer**: Supported by **NeonDB (PostgreSQL)** + SQLAlchemy Async. All relational data, absolute facts, metadata relationships, and audit flags are stored securely here. 
2. **Semantic Engine Layer**: Supported by **Qdrant Vector Database**. Responsible strictly for proximity algorithms, handling hundreds of high-dimensional chunk arrays and abstract semantic tracking natively outside of the RDBMS state.
3. **Cognitive Agent Layer**: Powered by **Google Gemini (2.5-Flash / Embedding-001)**. Responsible for reading text structures, formatting strict JSON payloads without hallucinations (via native SDK), and bridging human intent into Qdrant spatial math queries.

---

## 🚀 Key Capabilities

- **Autonomous Background Ingestion Pipeline**: Drop a massive PDF (or batch set), and the ASGI pipeline instantly queues the extraction process into background processing without freezing your FastAPI endpoint.
- **Academic Matrix CSV Exports**: Click a button to instantly download tabular summaries encompassing extracted Hypotheses, Limitations, Frameworks, methodologies, and confidence ratios bounding your entire library.
- **Interactive Multi-Agent Knowledge Chat**: Deep RAG queries over your entire document scope safely filtered through Vector-Store matching boundaries.
- **Literature Risk Assessment**: Automatically raises flags dynamically such as `MISSING_BASELINE`, `HIDDEN_HYPERPARAMETERS` or `OMITTED_CODE_REPOS`.

---

## 📂 Project Structure

```bash
📦 arxion
 ┣ 📂 backend           # FastAPI Application (Python)
 ┃ ┣ 📂 app
 ┃ ┃ ┣ 📂 core      # DB connections, Auth bypasses & Gemini clients
 ┃ ┃ ┣ 📂 models    # Postgres tables (sql_models), Pydantic schemas, Local store
 ┃ ┃ ┣ 📂 routers   # Chat, Export, Upload, Papers, Gaps
 ┃ ┃ ┗ 📂 services  # Data pipeline (Ingestion, Chunking, Extraction, Qdrant vectors)
 ┃ ┣ 📜 main.py         # Entry point for ASGI
 ┃ ┗ ...
 ┣ 📂 frontend          # Next.js Application (React 18 / Tailwind)
 ┃ ┣ 📂 app
 ┃ ┃ ┣ 📂 dashboard # Complex Matrix, Knowledge Graphs, Visual Artifacts
 ┃ ┃ ┣ 📂 components# Reusable UI architecture (Framer Motion)
 ┃ ┣ 📜 package.json
 ┃ ┗ ...
```

---

## 🔌 Environment Variables

You need active credentials for NeonDB, Qdrant Cloud, and Google AI Studio to run the environment locally. 

**Backend `.env` format:**
```ini
GEMINI_API_KEY=YOUR_NATIVE_API_KEY
QDRANT_URL=https://your-cluster-url.cloud.qdrant.io:6333
QDRANT_API_KEY=YOUR_AUTH_KEY
DATABASE_URL=postgresql://user:password@neon.tech/neondb?sslmode=require
UPLOAD_DIR=uploads
DEBUG=True
```

*(Note: Ensure your Google API Key natively supports both `gemini-2.5-flash` and `gemini-embedding-001` or your ingestion vectorization layers will return 404 blockades).*

---

## 💻 Running the Infrastructure Locally

### Step 1: The FastAPI Backend
Open your terminal in the `backend` folder and ensure you have `uv` or `pip` natively installed alongside Python 3.12:

```bash
cd backend
# Install dependencies into your local virtual environment
uv pip install -r requirements.txt
# Alternatively, ensure the latest Qdrant/GenAI packages are specifically pulled:
uv pip install -U google-genai qdrant-client fastapi uvicorn sqlalchemy asyncpg psycopg2

# Run the local server live
uvicorn main:app --reload
```
*The server will boot safely at `http://localhost:8000` and automatically verify its connection payloads with Neon and Qdrant before releasing the HTTP bindings.*

### Step 2: The Next.js Frontend
Open a second terminal directly into the `frontend` folder:

```bash
cd frontend
# Clean install all heavy React dependencies
npm install 
# Launch the client
npm run dev
```
*The web dashboard is fully available at `http://localhost:3000`.*

---

## 🛡 Stability & Scale Protections (In-Code)

1. **Dimensional Auto-Binding:** `app/core/config.py` explicitly scopes `EMBEDDING_DIMENSION = 3072` mathematically preventing `qdrant-client` 400 Bad Requests when dropping `gemini-embedding-001` payloads.
2. **Postgres UUID Casting:** Automatic translation mapping between UI `strings` and local RDBMS `uuid.UUID()` objects to ensure query operators don't fatally crash NeonDB connections.
3. **Vector Deployment Rate-Limiting:** Direct free-tier protections natively scripted into `app/services/vector_store.py` explicitly batching chunks behind `await asyncio.sleep(1.0)` breaks with `wait=False` async offload signals, to stop `httpx.ReadTimeout` errors dead in their tracks.
4. **Resilient Local Caching:** Live data transitions correctly bind over `arxion_memory.json` locally preventing "Missing Paper" endpoints when users randomly restart development servers during prototype testing.

---

> *"Arxion is not a wrapper. It is an end-to-end framework built for true scientific velocity."*
