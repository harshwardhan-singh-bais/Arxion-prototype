"use client";

import { useEffect, useState } from "react";
import { DownloadCloud, Quote, FileText, CheckSquare, Layers, FileJson, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api, triggerDownload, type MatrixRow } from "@/lib/api";

export default function ExportDraftsPage() {
    const [selectedFormat, setSelectedFormat] = useState("bibtex");
    const [papers, setPapers] = useState<MatrixRow[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [preview, setPreview] = useState<string>("");
    const [generating, setGenerating] = useState(false);
    const [loadingPapers, setLoadingPapers] = useState(true);

    useEffect(() => {
        api.getMatrix()
            .then((r) => {
                setPapers(r.papers);
                // Auto-select all by default
                setSelectedIds(new Set(r.papers.map(p => p.paper_id)));
            })
            .catch(console.error)
            .finally(() => setLoadingPapers(false));
    }, []);

    const toggleId = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const ids = [...selectedIds];

    const handleGenerate = async () => {
        if (ids.length === 0) return;
        setGenerating(true);
        setPreview("");

        try {
            if (selectedFormat === "bibtex") {
                const blob = await api.exportBibtex(ids);
                const text = await blob.text();
                setPreview(text);
                triggerDownload(blob, "arxion_export.bib");
            } else if (selectedFormat === "csv_matrix") {
                const blob = await api.exportCSV(ids);
                const text = await blob.text();
                setPreview(text);
                triggerDownload(blob, "arxion_matrix.csv");
            } else if (selectedFormat === "related_work_draft") {
                const result = await api.generateRelatedWork(ids);
                setPreview(result.paragraph);
            }
        } catch (err: any) {
            setPreview(`ERROR: ${err?.message ?? "Generation failed"}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto pb-10">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6 shrink-0">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        G. Writing &amp; Export Layer
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="DRAFTS & EXPORT">
                        DRAFTS &amp; EXPORT
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Controls */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Paper selection */}
                    <div className="bg-[#050505] border border-[#3C091E]/30 p-6 clip-card-solais">
                        <h3 className="font-mono text-xs text-[#97494E] tracking-widest uppercase mb-6 flex items-center gap-2">
                            <Layers size={14} className="text-white" /> Target Selection
                        </h3>
                        {loadingPapers ? (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#97494E] uppercase">
                                <Loader2 size={12} className="animate-spin" /> Loading papers...
                            </div>
                        ) : papers.length === 0 ? (
                            <p className="font-mono text-[10px] text-[#3C091E] uppercase">No processed papers yet.</p>
                        ) : (
                            <div className="space-y-2 font-mono text-[10px] text-white uppercase tracking-widest max-h-64 overflow-y-auto">
                                {papers.map(p => (
                                    <div
                                        key={p.paper_id}
                                        onClick={() => toggleId(p.paper_id)}
                                        className="flex gap-3 items-center border border-[#3C091E]/20 p-2 hover:bg-[#3C091E]/10 transition-colors cursor-pointer"
                                    >
                                        <CheckSquare
                                            size={12}
                                            className={selectedIds.has(p.paper_id) ? "text-[#C02B0A]" : "text-[#3C091E]"}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate">{p.paper_id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-[8px] text-[#97494E] truncate">{p.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Format selector */}
                    <div className="bg-[#050505] border border-[#3C091E]/30 p-6 clip-card">
                        <h3 className="font-mono text-xs text-[#97494E] tracking-widest uppercase mb-6 flex items-center gap-2">
                            <FileJson size={14} className="text-white" /> Output Formats
                        </h3>
                        <div className="flex flex-col gap-2 font-mono text-xs tracking-widest uppercase">
                            {(["bibtex", "csv_matrix", "related_work_draft"] as const).map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => { setSelectedFormat(fmt); setPreview(""); }}
                                    className={`p-3 border text-left flex items-center gap-3 transition-colors ${selectedFormat === fmt
                                        ? "bg-[#C02B0A]/10 border-[#C02B0A] text-[#C02B0A]"
                                        : "bg-black border-[#3C091E]/30 text-white hover:border-[#97494E]"}`}
                                >
                                    {fmt === "bibtex" && <Quote size={14} />}
                                    {fmt === "csv_matrix" && <FileText size={14} />}
                                    {fmt === "related_work_draft" && <Layers size={14} />}
                                    {fmt.replace(/_/g, " ")}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating || ids.length === 0}
                            className="mt-8 w-full flex items-center justify-center gap-3 bg-[#3C091E] hover:bg-[#C02B0A] text-white p-4 font-mono text-xs tracking-widest uppercase transition-colors clip-button disabled:opacity-40"
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                            {generating ? "GENERATING..." : "GENERATE ARTIFACT"}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#C02B0A]/30 p-8 clip-card relative overflow-hidden h-[600px] flex flex-col">

                    <div className="flex items-center justify-between border-b border-[#3C091E]/30 pb-4 mb-6 shrink-0">
                        <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase">
                            LIVE STREAM PREVIEW
                        </h3>
                        <div className={`w-2 h-2 rounded-full ${generating ? "bg-[#C02B0A] animate-pulse" : "bg-green-500"}`} />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 font-mono text-xs text-white/80 leading-loose tracking-wide whitespace-pre-wrap">
                        {generating ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[#C02B0A] text-[10px] uppercase">
                                <Loader2 size={12} className="animate-spin" /> QUERYING GEMINI...
                            </motion.div>
                        ) : preview ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre-wrap">
                                {selectedFormat === "bibtex" && (
                                    preview.split("\n").map((line, i) => (
                                        <span key={i}>
                                            {line.startsWith("@") ? (
                                                <><span className="text-[#C02B0A]">{line}</span><br /></>
                                            ) : (
                                                <>{line}<br /></>
                                            )}
                                        </span>
                                    ))
                                )}
                                {selectedFormat !== "bibtex" && preview}
                            </motion.div>
                        ) : (
                            <div className="text-[#3C091E] text-[10px] uppercase tracking-widest">
                                SELECT PAPERS AND FORMAT, THEN CLICK GENERATE...
                            </div>
                        )}
                    </div>

                    {/* Scan line */}
                    <div className="absolute left-0 top-0 w-full h-[1px] bg-[#C02B0A]/50 shadow-[0_0_15px_rgba(192,43,10,1)] z-10 animate-[scan_3s_ease-in-out_infinite]" />
                    <style jsx>{`
                        @keyframes scan {
                            0% { top: -10px; opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { top: 100%; opacity: 0; }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
