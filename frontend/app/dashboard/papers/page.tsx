"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Pencil, Trash2, X, Search, ChevronRight } from "lucide-react";

interface Paper {
    id: string;
    title: string;
    authors: string[];
    tags: string[];
    status: string;
    filename: string;
    year: number | null;
    abstract: string | null;
}

const STATUS_COLORS: Record<string, string> = {
    INGESTED: "bg-[#97494E]/20 text-[#97494E] border-[#97494E]/30",
    PROCESSING: "bg-[#C02B0A]/20 text-[#C02B0A] border-[#C02B0A]/30 animate-pulse",
    PROCESSED: "bg-green-900/20 text-green-400 border-green-800/30",
    FAILED: "bg-red-900/30 text-red-400 border-red-800/30",
};

export default function PapersPage() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Edit form state
    const [editTitle, setEditTitle] = useState("");
    const [editAuthors, setEditAuthors] = useState("");
    const [editTags, setEditTags] = useState("");
    const [editYear, setEditYear] = useState("");

    useEffect(() => { fetchPapers(); }, []);

    async function fetchPapers() {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/papers");
            if (res.ok) setPapers(await res.json());
        } catch (e) {
            console.error("Failed to fetch papers:", e);
        } finally {
            setLoading(false);
        }
    }

    function openEdit(p: Paper) {
        setEditingPaper(p);
        setEditTitle(p.title);
        setEditAuthors(p.authors.join(", "));
        setEditTags(p.tags.join(", "));
        setEditYear(p.year?.toString() || "");
    }

    async function handleEdit() {
        if (!editingPaper) return;
        try {
            await fetch(`http://localhost:8000/api/v1/papers/${editingPaper.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    authors: editAuthors.split(",").map(a => a.trim()).filter(Boolean),
                    tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
                    year: editYear ? parseInt(editYear) : null,
                }),
            });
            setEditingPaper(null);
            fetchPapers();
        } catch (e) {
            console.error("Failed to edit paper:", e);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await fetch(`http://localhost:8000/api/v1/papers/${deleteId}`, { method: "DELETE" });
            setDeleteId(null);
            fetchPapers();
        } catch (e) {
            console.error("Failed to delete paper:", e);
        }
    }

    async function handleReanalyze(paperId: string) {
        try {
            await fetch(`http://localhost:8000/api/v1/papers/${paperId}/reanalyze`, { method: "POST" });
            fetchPapers();
        } catch (e) {
            console.error("Failed to reanalyze:", e);
        }
    }

    const filtered = papers.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.authors.some(a => a.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="h-full w-full flex flex-col gap-8">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        Paper Management
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tighter uppercase">
                        Papers
                    </h1>
                </div>
                <div className="font-mono text-[9px] text-[#97494E] tracking-widest uppercase">
                    {papers.length} Total
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#97494E]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search papers..."
                    className="w-full bg-black/40 border border-[#3C091E]/30 pl-10 pr-4 py-3 font-mono text-xs text-white tracking-wider focus:outline-none focus:border-[#C02B0A]/50 placeholder:text-[#3C091E]"
                />
            </div>

            {/* Table */}
            <div className="bg-black/40 border border-[#3C091E]/30 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-[#3C091E]/30 font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase">
                    <div className="col-span-4">Title</div>
                    <div className="col-span-2">Authors</div>
                    <div className="col-span-1">Year</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#C02B0A] animate-pulse rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center font-mono text-xs text-[#3C091E] tracking-widest uppercase">
                        No papers found
                    </div>
                ) : (
                    filtered.map((paper) => (
                        <div
                            key={paper.id}
                            className="grid grid-cols-12 gap-2 p-4 border-b border-[#3C091E]/15 hover:bg-white/[0.01] transition-colors group items-center"
                        >
                            <div className="col-span-4 font-mono text-xs text-white truncate">{paper.title}</div>
                            <div className="col-span-2 font-mono text-[10px] text-[#97494E] truncate">
                                {paper.authors.slice(0, 2).join(", ")}
                                {paper.authors.length > 2 && "..."}
                            </div>
                            <div className="col-span-1 font-mono text-[10px] text-[#97494E]">{paper.year || "—"}</div>
                            <div className="col-span-2">
                                <span className={`inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.15em] uppercase border ${STATUS_COLORS[paper.status] || ""}`}>
                                    {paper.status}
                                </span>
                            </div>
                            <div className="col-span-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleReanalyze(paper.id)}
                                    title="Re-Analyze"
                                    className="p-1.5 text-[#97494E] hover:text-[#C02B0A] hover:bg-[#C02B0A]/10 transition-colors"
                                >
                                    <RefreshCw size={13} />
                                </button>
                                <button
                                    onClick={() => openEdit(paper)}
                                    title="Edit"
                                    className="p-1.5 text-[#97494E] hover:text-[#C02B0A] hover:bg-[#C02B0A]/10 transition-colors"
                                >
                                    <Pencil size={13} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(paper.id)}
                                    title="Delete"
                                    className="p-1.5 text-[#97494E] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingPaper && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]" onClick={() => setEditingPaper(null)}>
                    <div className="w-full max-w-md bg-[#050505] border border-[#3C091E]/30 p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-[#C02B0A]" />
                                Edit Paper
                            </h3>
                            <button onClick={() => setEditingPaper(null)} className="text-[#97494E] hover:text-[#C02B0A]">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Title</label>
                                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50" />
                            </div>
                            <div>
                                <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Authors (comma separated)</label>
                                <input value={editAuthors} onChange={e => setEditAuthors(e.target.value)} className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Tags (comma separated)</label>
                                    <input value={editTags} onChange={e => setEditTags(e.target.value)} className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50" />
                                </div>
                                <div>
                                    <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Year</label>
                                    <input value={editYear} onChange={e => setEditYear(e.target.value)} type="number" className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleEdit} className="mt-6 w-full py-2.5 bg-[#C02B0A] text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-[#C02B0A]/80 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]" onClick={() => setDeleteId(null)}>
                    <div className="w-full max-w-sm bg-[#050505] border border-[#3C091E]/30 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-[#C02B0A]" />
                            Confirm Delete
                        </h3>
                        <p className="font-mono text-xs text-[#97494E] mb-6">
                            This will permanently delete the paper and all associated vectors. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-[#3C091E]/30 font-mono text-[10px] text-[#97494E] tracking-[0.2em] uppercase hover:border-[#97494E]/50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600/80 text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-red-600 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
