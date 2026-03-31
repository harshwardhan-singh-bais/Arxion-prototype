"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:8000/api/v1/layer2";

type Health = {
    overall_health_score: number;
    reproducibility_rate: number;
    code_availability_rate: number;
    benchmark_saturation_score: number;
    papers_count: number;
};

export default function Layer2Page() {
    const [paperId, setPaperId] = useState("");
    const [mathEq, setMathEq] = useState("y = Wx + b");
    const [citationFormat, setCitationFormat] = useState("bibtex");
    const [health, setHealth] = useState<Health | null>(null);
    const [datasets, setDatasets] = useState<any>(null);
    const [trends, setTrends] = useState<any>(null);
    const [gaps, setGaps] = useState<any>(null);
    const [contradictions, setContradictions] = useState<any>(null);
    const [paperOutput, setPaperOutput] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [noteText, setNoteText] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        void loadOverview();
        void loadNotes();
    }, []);

    async function jsonGet(path: string) {
        const res = await fetch(`${API}${path}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Request failed: ${path}`);
        return await res.json();
    }

    async function loadOverview() {
        try {
            const [h, d, t, g, c] = await Promise.all([
                jsonGet("/field-health"),
                jsonGet("/datasets"),
                jsonGet("/trends"),
                jsonGet("/gap-finder"),
                jsonGet("/contradictions"),
            ]);
            setHealth(h);
            setDatasets(d);
            setTrends(t);
            setGaps(g);
            setContradictions(c);
        } catch (e) {
            console.error("Failed loading Layer-2 overview:", e);
        }
    }

    async function runPaperAction(
        action:
            | "simplify"
            | "credibility"
            | "effort"
            | "sections"
            | "fairness"
            | "bias"
            | "repro"
            | "starter"
            | "code"
    ) {
        if (!paperId.trim()) {
            alert("Enter a paper ID first.");
            return;
        }
        setLoading(true);
        try {
            let data: any;
            if (action === "simplify") {
                const res = await fetch(`${API}/papers/${paperId}/simplify`, { method: "POST", credentials: "include" });
                data = await res.json();
            } else if (action === "credibility") {
                data = await jsonGet(`/papers/${paperId}/credibility`);
            } else if (action === "fairness") {
                data = await jsonGet(`/papers/${paperId}/benchmark-fairness`);
            } else if (action === "bias") {
                data = await jsonGet(`/papers/${paperId}/bias`);
            } else if (action === "effort") {
                data = await jsonGet(`/papers/${paperId}/effort-estimator`);
            } else if (action === "repro") {
                data = await jsonGet(`/papers/${paperId}/reproduction-plan`);
            } else if (action === "starter") {
                data = await jsonGet(`/papers/${paperId}/starter-kit`);
            } else if (action === "code") {
                data = await jsonGet(`/papers/${paperId}/generate-code`);
            } else {
                data = await jsonGet(`/papers/${paperId}/section-summaries`);
            }
            setPaperOutput({ action, data });
        } catch (e) {
            console.error("Paper action failed:", e);
            setPaperOutput({ action, data: { error: "Request failed. Check paper ID and backend logs." } });
        } finally {
            setLoading(false);
        }
    }

    async function runMathExplainer() {
        setLoading(true);
        try {
            const res = await fetch(`${API}/math/explain`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ equation: mathEq, context: "Layer2 dashboard request" }),
            });
            const data = await res.json();
            setPaperOutput({ action: "math", data });
        } catch (e) {
            console.error("Math explainer failed:", e);
            setPaperOutput({ action: "math", data: { error: "Math explain failed." } });
        } finally {
            setLoading(false);
        }
    }

    async function runCitationExport() {
        setLoading(true);
        try {
            const data = await jsonGet(`/citations/export?format=${citationFormat}`);
            setPaperOutput({ action: "citations", data });
        } catch (e) {
            console.error("Citation export failed:", e);
            setPaperOutput({ action: "citations", data: { error: "Citation export failed." } });
        } finally {
            setLoading(false);
        }
    }

    async function loadNotes() {
        try {
            const res = await fetch(`${API}/notes`, { credentials: "include" });
            if (!res.ok) return;
            setNotes(await res.json());
        } catch (e) {
            console.error("Failed to load notes:", e);
        }
    }

    async function createNote() {
        if (!paperId.trim() || !noteText.trim()) return;
        try {
            await fetch(`${API}/notes`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paper_id: paperId, text: noteText, section: "layer2" }),
            });
            setNoteText("");
            await loadNotes();
        } catch (e) {
            console.error("Failed to create note:", e);
        }
    }

    async function deleteNote(id: number) {
        try {
            await fetch(`${API}/notes/${id}`, { method: "DELETE", credentials: "include" });
            await loadNotes();
        } catch (e) {
            console.error("Failed to delete note:", e);
        }
    }

    return (
        <div className="h-full w-full max-w-[1300px] mx-auto flex flex-col gap-6 pb-8">
            <div className="border-b border-[#1e293b]/30 pb-6">
                <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2">Layer 2 Modules</div>
                <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase">Research Intelligence Suite</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard label="Health Score" value={health ? `${health.overall_health_score}%` : "..."} />
                <MetricCard label="Reproducibility" value={health ? `${health.reproducibility_rate}%` : "..."} />
                <MetricCard label="Code Availability" value={health ? `${health.code_availability_rate}%` : "..."} />
                <MetricCard label="Papers Indexed" value={health ? String(health.papers_count) : "..."} />
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
                <h2 className="font-mono text-xs text-[#ef4444] tracking-[0.22em] uppercase mb-3">Paper Tools</h2>
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <input
                        value={paperId}
                        onChange={(e) => setPaperId(e.target.value)}
                        placeholder="Enter Paper ID"
                        className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white font-mono uppercase tracking-wider outline-none focus:border-[#ef4444]"
                    />
                    <div className="flex flex-wrap gap-2">
                        <ActionButton label="Simplify" onClick={() => runPaperAction("simplify")} disabled={loading} />
                        <ActionButton label="Credibility" onClick={() => runPaperAction("credibility")} disabled={loading} />
                        <ActionButton label="Fairness" onClick={() => runPaperAction("fairness")} disabled={loading} />
                        <ActionButton label="Bias" onClick={() => runPaperAction("bias")} disabled={loading} />
                        <ActionButton label="Effort" onClick={() => runPaperAction("effort")} disabled={loading} />
                        <ActionButton label="Sections" onClick={() => runPaperAction("sections")} disabled={loading} />
                        <ActionButton label="Reproduction" onClick={() => runPaperAction("repro")} disabled={loading} />
                        <ActionButton label="Starter Kit" onClick={() => runPaperAction("starter")} disabled={loading} />
                        <ActionButton label="Code Gen" onClick={() => runPaperAction("code")} disabled={loading} />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                    <div className="bg-black border border-[#1e293b]/40 p-3 flex flex-col gap-2">
                        <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest">Math Explainer</div>
                        <input
                            value={mathEq}
                            onChange={(e) => setMathEq(e.target.value)}
                            className="bg-[#0b0f19] border border-[#1e293b] px-3 py-2 text-sm text-white font-mono outline-none focus:border-[#ef4444]"
                        />
                        <ActionButton label="Explain Equation" onClick={runMathExplainer} disabled={loading} />
                    </div>
                    <div className="bg-black border border-[#1e293b]/40 p-3 flex flex-col gap-2">
                        <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest">Citation Manager</div>
                        <select
                            value={citationFormat}
                            onChange={(e) => setCitationFormat(e.target.value)}
                            className="bg-[#0b0f19] border border-[#1e293b] px-3 py-2 text-sm text-white font-mono outline-none focus:border-[#ef4444]"
                        >
                            <option value="bibtex">BIBTEX</option>
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="ris">RIS</option>
                        </select>
                        <ActionButton label="Export Citations" onClick={runCitationExport} disabled={loading} />
                    </div>
                </div>
                <pre className="mt-4 bg-black border border-[#1e293b]/40 p-3 text-xs text-[#d1d5db] overflow-auto max-h-72">{JSON.stringify(paperOutput, null, 2)}</pre>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Panel title="Gap Finder" data={gaps} />
                <Panel title="Contradictions" data={contradictions} />
                <Panel title="Dataset Explorer" data={datasets} />
                <Panel title="Method + Dataset Trends" data={trends} />
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
                <h2 className="font-mono text-xs text-[#ef4444] tracking-[0.22em] uppercase mb-3">Research Notes</h2>
                <div className="flex flex-col md:flex-row gap-3">
                    <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write a note linked to current Paper ID"
                        className="flex-1 bg-black border border-[#1e293b] px-3 py-2 text-sm text-white font-mono outline-none focus:border-[#ef4444]"
                    />
                    <button onClick={createNote} className="px-4 py-2 bg-[#ef4444] text-white font-mono text-xs tracking-widest uppercase">Save Note</button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.map((n) => (
                        <div key={n.id} className="bg-black border border-[#1e293b]/40 p-3">
                            <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest">Paper {n.paper_id}</div>
                            <p className="text-sm text-white/80 mt-2">{n.text}</p>
                            <button onClick={() => deleteNote(n.id)} className="mt-3 text-[10px] font-mono uppercase tracking-widest text-[#ef4444]">Delete</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#94a3b8]">{label}</div>
            <div className="text-2xl font-bold text-white mt-2">{value}</div>
        </div>
    );
}

function ActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="px-3 py-2 border border-[#ef4444]/60 text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors text-[10px] font-mono tracking-[0.2em] uppercase disabled:opacity-50"
        >
            {label}
        </button>
    );
}

function Panel({ title, data }: { title: string; data: any }) {
    return (
        <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
            <h3 className="font-mono text-xs text-[#ef4444] tracking-[0.22em] uppercase mb-3">{title}</h3>
            <pre className="bg-black border border-[#1e293b]/40 p-3 text-xs text-[#d1d5db] overflow-auto max-h-72">{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
