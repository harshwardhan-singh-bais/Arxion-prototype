"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Layers, Crosshair, Plus, Pencil, Trash2, X, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// Static demo gaps (shown alongside user-created gaps)
const demoGaps = [
    {
        id: -1,
        type: "DATA SATURATION",
        title: "GSM8K Benchmark Saturated",
        description: "14 recent papers report <1% variance on GSM8K. Dataset is fully saturated. Future evaluation on this dataset provides zero distinguishing value.",
        confidence: 98,
        icon: <Layers className="text-[#C02B0A]" />,
        papers: ["ARX-442", "ARX-129", "ARX-988"],
        isDemo: true,
    },
    {
        id: -2,
        type: "CONTRADICTION",
        title: "Linear Attention Scaling Law Mismatch",
        description: "Paper ARX-711 claims O(N) scaling, but reproduced benchmarks from ARX-992 show O(N log N) degradation in specific kernel configurations.",
        confidence: 92,
        icon: <AlertTriangle className="text-yellow-500" />,
        papers: ["ARX-711", "ARX-992"],
        isDemo: true,
    },
];

interface Gap {
    id: number;
    title: string;
    description: string;
    linked_paper_ids: string[];
    created_at: string;
    updated_at: string;
}

export default function GapsPage() {
    const [gaps, setGaps] = useState<Gap[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editingGap, setEditingGap] = useState<Gap | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formPaperIds, setFormPaperIds] = useState("");

    useEffect(() => { fetchGaps(); }, []);

    async function fetchGaps() {
        try {
            const res = await fetch("http://localhost:8000/api/v1/gaps", { credentials: "include" });
            if (res.ok) setGaps(await res.json());
        } catch (e) {
            console.error("Failed to fetch gaps:", e);
        }
    }

    async function handleCreate() {
        try {
            await fetch("http://localhost:8000/api/v1/gaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title: formTitle,
                    description: formDesc,
                    linked_paper_ids: formPaperIds.split(",").map(s => s.trim()).filter(Boolean),
                }),
            });
            setShowCreate(false);
            resetForm();
            fetchGaps();
        } catch (e) {
            console.error("Failed to create gap:", e);
        }
    }

    async function handleEdit() {
        if (!editingGap) return;
        try {
            await fetch(`http://localhost:8000/api/v1/gaps/${editingGap.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title: formTitle,
                    description: formDesc,
                    linked_paper_ids: formPaperIds.split(",").map(s => s.trim()).filter(Boolean),
                }),
            });
            setEditingGap(null);
            resetForm();
            fetchGaps();
        } catch (e) {
            console.error("Failed to edit gap:", e);
        }
    }

    async function handleDelete() {
        if (deleteId === null) return;
        try {
            await fetch(`http://localhost:8000/api/v1/gaps/${deleteId}`, {
                method: "DELETE",
                credentials: "include",
            });
            setDeleteId(null);
            fetchGaps();
        } catch (e) {
            console.error("Failed to delete gap:", e);
        }
    }

    function openEdit(gap: Gap) {
        setEditingGap(gap);
        setFormTitle(gap.title);
        setFormDesc(gap.description);
        setFormPaperIds(gap.linked_paper_ids.join(", "));
    }

    function resetForm() {
        setFormTitle("");
        setFormDesc("");
        setFormPaperIds("");
    }

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        D. Autonomous Gap Intelligence
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="OPPORTUNITY FEED">
                        OPPORTUNITY FEED
                    </h1>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreate(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C02B0A] text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-[#C02B0A]/80 transition-colors"
                >
                    <Plus size={14} />
                    New Gap
                </button>
            </div>

            {/* User-Created Gaps */}
            {gaps.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#C02B0A]" />
                        Your Gaps ({gaps.length})
                    </h3>
                    {gaps.map((gap, i) => (
                        <motion.div
                            key={gap.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#050505] border border-[#3C091E]/30 p-6 hover:border-[#C02B0A] transition-colors relative group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black flex items-center justify-center border border-[#3C091E]/30">
                                        <Crosshair className="text-[#C02B0A]" size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-mono text-[10px] tracking-widest text-[#97494E] uppercase mb-1">USER GAP</h4>
                                        <h2 className="font-sans text-lg font-bold text-white uppercase">{gap.title}</h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(gap)} className="p-1.5 text-[#97494E] hover:text-[#C02B0A] hover:bg-[#C02B0A]/10 transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => setDeleteId(gap.id)} className="p-1.5 text-[#97494E] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            <p className="font-mono text-xs text-white/70 leading-relaxed uppercase tracking-wide max-w-4xl mb-4 pl-14">
                                {gap.description}
                            </p>
                            {gap.linked_paper_ids.length > 0 && (
                                <div className="pl-14 flex items-center gap-3">
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E]">Linked:</span>
                                    {gap.linked_paper_ids.map(id => (
                                        <span key={id} className="text-[10px] font-mono bg-[#3C091E] text-white px-2 py-0.5 border border-transparent">{id}</span>
                                    ))}
                                </div>
                            )}
                            <div className="absolute top-0 right-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Demo Gaps (existing static data) */}
            <div className="space-y-4">
                <h3 className="font-mono text-[10px] text-[#97494E] tracking-[0.3em] uppercase flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-[#97494E]" />
                    Auto-Detected Gaps
                </h3>
                {demoGaps.map((gap, i) => (
                    <motion.div
                        key={gap.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#050505] border border-[#3C091E]/30 p-6 xl:p-8 hover:border-[#C02B0A] transition-colors relative group clip-card"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black flex items-center justify-center border border-[#3C091E]/30">
                                    {gap.icon}
                                </div>
                                <div>
                                    <h4 className="font-mono text-[10px] tracking-widest text-[#97494E] uppercase mb-1">{gap.type}</h4>
                                    <h2 className="font-sans text-xl font-bold text-white uppercase">{gap.title}</h2>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E]">Arxion Confidence</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-[#C02B0A]">{gap.confidence}%</span>
                                    <div className="w-24 h-1 bg-black overflow-hidden border border-[#3C091E]/30">
                                        <div className="h-full bg-[#C02B0A]" style={{ width: `${gap.confidence}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="font-mono text-xs text-white/70 leading-relaxed uppercase tracking-wide max-w-4xl mb-6 pl-16">
                            {gap.description}
                        </p>
                        <div className="pl-16 flex items-center gap-4">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E]">Evidence Links:</span>
                            {gap.papers.length > 0 ? (
                                gap.papers.map(p => (
                                    <span key={p} className="text-[10px] font-mono bg-[#3C091E] text-white px-2 py-0.5 hover:bg-[#C02B0A] cursor-pointer transition-colors border border-transparent hover:border-white/20">
                                        {p}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] font-mono text-[#C02B0A] border border-[#C02B0A]/30 px-2 py-0.5">NO PRIOR LITERATURE DETECTED</span>
                            )}
                        </div>
                        <div className="absolute top-0 right-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />
                    </motion.div>
                ))}
            </div>

            {/* Create / Edit Modal */}
            {(showCreate || editingGap) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]" onClick={() => { setShowCreate(false); setEditingGap(null); }}>
                    <div className="w-full max-w-md bg-[#050505] border border-[#3C091E]/30 p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-[#C02B0A]" />
                                {editingGap ? "Edit Gap" : "Create Gap"}
                            </h3>
                            <button onClick={() => { setShowCreate(false); setEditingGap(null); }} className="text-[#97494E] hover:text-[#C02B0A]">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Title</label>
                                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50" placeholder="Gap title" />
                            </div>
                            <div>
                                <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Description</label>
                                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50 resize-none" placeholder="Describe the gap..." />
                            </div>
                            <div>
                                <label className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase block mb-1">Linked Paper IDs (comma separated)</label>
                                <input value={formPaperIds} onChange={e => setFormPaperIds(e.target.value)} className="w-full bg-black/60 border border-[#3C091E]/50 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#C02B0A]/50" placeholder="ARX-001, ARX-002" />
                            </div>
                        </div>
                        <button
                            onClick={editingGap ? handleEdit : handleCreate}
                            className="mt-6 w-full py-2.5 bg-[#C02B0A] text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-[#C02B0A]/80 transition-colors"
                        >
                            {editingGap ? "Save Changes" : "Create Gap"}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]" onClick={() => setDeleteId(null)}>
                    <div className="w-full max-w-sm bg-[#050505] border border-[#3C091E]/30 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-[#C02B0A]" />
                            Confirm Delete
                        </h3>
                        <p className="font-mono text-xs text-[#97494E] mb-6">
                            This will permanently delete this research gap.
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
