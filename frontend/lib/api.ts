/**
 * Arxion API Client
 * Typed wrappers for every FastAPI backend endpoint.
 * Base URL is read from NEXT_PUBLIC_API_URL env (defaults to localhost:8000).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Generic fetch helper ───────────────────────────────────────────────────────

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`);
    return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${res.statusText}`);
    return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { method: "POST", body: form });
    if (!res.ok) {
        // Try to parse FastAPI's { detail: "..." } error body
        let detail = `${res.status} ${res.statusText}`;
        try {
            const err = await res.json();
            if (err?.detail) detail = err.detail;
        } catch { /* ignore JSON parse failure */ }
        throw new Error(detail);
    }
    return res.json();
}

async function downloadBlob(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<Blob> {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
    return res.blob();
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PaperStatus {
    paper_id: string;
    status: "INGESTED" | "PROCESSING" | "PROCESSED" | "FAILED";
    error_message?: string;
    title?: string;
}

export interface UploadResponse {
    paper_id: string;
    filename: string;
    status: string;
    message: string;
}

export interface MatrixRow {
    paper_id: string;
    title: string;
    authors: string[];
    year?: number;
    tags: string[];
    rci: number;
    grade: string;
    risk_flags: string[];
    datasets: string[];
    methods: string[];
    claims_count: number;
    metrics_count: number;
    has_code: boolean;
    has_data: boolean;
    status: string;
    top_flag?: string;
}

export interface MatrixResponse {
    papers: MatrixRow[];
    total: number;
    avg_rci: number;
}

export interface GraphNode {
    id: string;
    type: "paper" | "dataset" | "method";
    label: string;
    paper_id?: string;
    rci?: number;
    size: number;
    color: string;
}

export interface GraphEdge {
    source: string;
    target: string;
    type: string;
    color: string;
    opacity: number;
}

export interface GraphResponse {
    nodes: GraphNode[];
    edges: GraphEdge[];
    node_count: number;
    edge_count: number;
}

export interface GapItem {
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    affected_datasets: string[];
    affected_methods: string[];
    evidence_paper_ids: string[];
    raw_signal: string;
}

export interface GapFeed {
    gaps: GapItem[];
    total: number;
    scan_timestamp: string;
}

export interface ChatSource {
    paper_id: string;
    title?: string;
    section?: string;
    snippet: string;
    confidence: number;
}

export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    query_embedding_used: boolean;
}

export interface FieldHealth {
    total_papers: number;
    processed_papers: number;
    avg_rci: number;
    pct_public_code: number;
    pct_full_hyperparams: number;
    pct_compute_disclosed: number;
    contradiction_density: number;
    dataset_overuse: { name: string; count: number }[];
    grade_distribution: Record<string, number>;
}

export interface CredibilitySummary {
    total_papers: number;
    processed_papers: number;
    avg_rci: number;
    avg_reproducibility: number;
    avg_confidence: number;
    avg_transparency: number;
    grade_distribution: Record<string, number>;
    most_common_flags: { flag: string; count: number }[];
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    email: string;
    name: string;
}

// ── Component A — Upload & Status ─────────────────────────────────────────────

export const api = {
    /** Upload a PDF file and kick off background ingestion. */
    uploadPDF: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return postForm<UploadResponse>("/upload/pdf", form);
    },

    /** Upload raw text and kick off background ingestion. */
    uploadText: (text: string, title?: string) => {
        const form = new FormData();
        form.append("text", text);
        if (title) form.append("title", title);
        return postForm<UploadResponse>("/upload/text", form);
    },

    /** Poll processing status for a paper. */
    getStatus: (paperId: string) => get<PaperStatus>(`/status/${paperId}`),

    /** List all papers (filter by status or tag). */
    listPapers: (params?: { status?: string; tag?: string }) =>
        get<{ papers: MatrixRow[]; total: number }>("/papers", params as Record<string, string>),

    // ── Component B — Credibility ───────────────────────────────────────────────

    /** Full RCI credibility report for a paper. */
    getCredibility: (paperId: string) => get<any>(`/papers/${paperId}/credibility`),

    /** Aggregate credibility summary (field health). */
    getCredibilitySummary: () => get<CredibilitySummary>("/credibility/summary"),

    // ── Component C — Matrix & Graph ───────────────────────────────────────────

    /** Literature matrix with optional filters. */
    getMatrix: (params?: { tag?: string; dataset?: string; method?: string }) =>
        get<MatrixResponse>("/matrix", params as Record<string, string>),

    /** Knowledge graph nodes and edges. */
    getGraph: () => get<GraphResponse>("/graph"),

    // ── Component D/E — Gaps & Intelligence ────────────────────────────────────

    /** Gap opportunity feed. */
    getGaps: () => get<GapFeed>("/gaps"),

    /** Field health dashboard aggregate. */
    getFieldHealth: () => get<FieldHealth>("/field/health"),

    /** Contradiction detection (slow — call on demand). */
    getContradictions: () => get<any[]>("/contradictions"),

    /** Reproduction effort for a paper. */
    getReproductionEffort: (paperId: string) => get<any>(`/papers/${paperId}/reproduction-effort`),

    // ── Component F/G — Chat & Export ──────────────────────────────────────────

    /** RAG chat with the knowledge matrix. */
    chat: (query: string, paperIds?: string[]) =>
        post<ChatResponse>("/chat", { query, paper_ids: paperIds ?? null, limit: 8 }),

    /** Download bulk BibTeX as a .bib blob. */
    exportBibtex: (paperIds: string[]) =>
        downloadBlob("/export/bibtex", "POST", { paper_ids: paperIds }),

    /** Download literature matrix as CSV blob. */
    exportCSV: (paperIds?: string[]) =>
        downloadBlob("/export/csv", "POST", { paper_ids: paperIds ?? null, include_credibility: true }),

    /** Generate a related work paragraph. */
    generateRelatedWork: (paperIds: string[], topicHint?: string) =>
        post<{ paragraph: string; paper_ids_used: string[] }>("/export/related-work", {
            paper_ids: paperIds,
            topic_hint: topicHint ?? null,
        }),

    // ── Component H — Auth ─────────────────────────────────────────────────────

    login: (email: string, password: string) =>
        post<AuthResponse>("/auth/login", { email, password }),

    register: (email: string, password: string, name: string) =>
        post<AuthResponse>("/auth/register", { email, password, name }),
};

// ── Poll helper — wraps getStatus with retries ────────────────────────────────

/**
 * Polls /status/{paperId} until status is PROCESSED or FAILED.
 * Calls onUpdate each poll interval.
 */
export async function pollStatus(
    paperId: string,
    onUpdate: (status: PaperStatus) => void,
    intervalMs = 2000,
    maxAttempts = 90,
): Promise<PaperStatus> {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const timer = setInterval(async () => {
            try {
                const s = await api.getStatus(paperId);
                onUpdate(s);
                if (s.status === "PROCESSED" || s.status === "FAILED") {
                    clearInterval(timer);
                    resolve(s);
                }
            } catch (err) {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(timer);
                    reject(err);
                }
            }
        }, intervalMs);
    });
}

/** Trigger browser download for a Blob. */
export function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
