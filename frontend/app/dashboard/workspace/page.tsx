"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:8000/api/v1";

export default function WorkspacePage() {
    const [collections, setCollections] = useState<any[]>([]);
    const [queries, setQueries] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [queryName, setQueryName] = useState("");
    const [queryText, setQueryText] = useState("");
    const [queryPapers, setQueryPapers] = useState("");
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        void loadAll();
    }, []);

    async function loadAll() {
        try {
            const [cRes, qRes] = await Promise.all([
                fetch(`${API}/workspace/collections`, { credentials: "include" }),
                fetch(`${API}/workspace/queries`, { credentials: "include" }),
            ]);
            if (cRes.ok) setCollections(await cRes.json());
            if (qRes.ok) setQueries(await qRes.json());
        } catch (e) {
            console.error("Failed to load workspace:", e);
        }
    }

    async function createCollection() {
        if (!name.trim()) return;
        await fetch(`${API}/workspace/collections`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description: desc }),
        });
        setName("");
        setDesc("");
        await loadAll();
    }

    async function removeCollection(id: string) {
        await fetch(`${API}/workspace/collections/${id}`, { method: "DELETE", credentials: "include" });
        await loadAll();
    }

    async function createSavedQuery() {
        if (!queryName.trim() || !queryText.trim()) return;
        await fetch(`${API}/workspace/queries`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: queryName,
                query_text: queryText,
                paper_ids: queryPapers.split(",").map((s) => s.trim()).filter(Boolean),
            }),
        });
        setQueryName("");
        setQueryText("");
        setQueryPapers("");
        await loadAll();
    }

    async function runSavedQuery(id: string) {
        const res = await fetch(`${API}/workspace/queries/${id}/run`, { method: "POST", credentials: "include" });
        if (res.ok) setResult(await res.json());
    }

    async function deleteSavedQuery(id: string) {
        await fetch(`${API}/workspace/queries/${id}`, { method: "DELETE", credentials: "include" });
        await loadAll();
    }

    return (
        <div className="h-full w-full max-w-[1300px] mx-auto flex flex-col gap-6 pb-8">
            <div className="border-b border-[#1e293b]/30 pb-6">
                <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2">System Level</div>
                <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase">Workspace</h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <section className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
                    <h2 className="font-mono text-xs text-[#ef4444] tracking-[0.22em] uppercase mb-4">Collections</h2>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white" />
                        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white" />
                        <button onClick={createCollection} className="px-3 py-2 bg-[#ef4444] text-white font-mono text-xs uppercase tracking-widest">Create Collection</button>
                    </div>
                    <div className="space-y-2">
                        {collections.map((c) => (
                            <div key={c.id} className="bg-black border border-[#1e293b]/40 p-3 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm text-white font-semibold">{c.name}</div>
                                    <div className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-widest">{c.papers_count} papers</div>
                                </div>
                                <button onClick={() => removeCollection(c.id)} className="text-[10px] text-[#ef4444] font-mono uppercase tracking-widest">Delete</button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
                    <h2 className="font-mono text-xs text-[#ef4444] tracking-[0.22em] uppercase mb-4">Saved Queries</h2>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        <input value={queryName} onChange={(e) => setQueryName(e.target.value)} placeholder="Query name" className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white" />
                        <input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Query text" className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white" />
                        <input value={queryPapers} onChange={(e) => setQueryPapers(e.target.value)} placeholder="Paper IDs comma-separated (optional)" className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white" />
                        <button onClick={createSavedQuery} className="px-3 py-2 bg-[#ef4444] text-white font-mono text-xs uppercase tracking-widest">Save Query</button>
                    </div>
                    <div className="space-y-2">
                        {queries.map((q) => (
                            <div key={q.id} className="bg-black border border-[#1e293b]/40 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm text-white font-semibold">{q.name}</div>
                                        <div className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-widest">{q.query_text}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => runSavedQuery(q.id)} className="text-[10px] text-white font-mono uppercase tracking-widest border border-[#1e293b] px-2 py-1">Run</button>
                                        <button onClick={() => deleteSavedQuery(q.id)} className="text-[10px] text-[#ef4444] font-mono uppercase tracking-widest">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
                <h2 className="font-mono text-xs text-[#ef4444] tracking-[0.22em] uppercase mb-3">Saved Query Results</h2>
                <pre className="bg-black border border-[#1e293b]/40 p-3 text-xs text-[#d1d5db] overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
            </section>
        </div>
    );
}
