"use client";

import { useState, useEffect } from "react";
import { DownloadCloud, Quote, FileText, CheckSquare, Layers, FileJson } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export default function ExportDraftsPage() {
    const [selectedFormat, setSelectedFormat] = useState("bibtex");
    const [isLoading, setIsLoading] = useState(false);
    const [previewContent, setPreviewContent] = useState<string>("");

    // Default papers we expect if the vector database isn't fully loaded
    const [selectedPapers, setSelectedPapers] = useState([
        { id: "ARX-142", title: "Mamba (Mock)" },
        { id: "ARX-811", title: "DPO (Mock)" },
    ]);

    // Ideally, we'd fetch actual papers from a GET /api/v1/papers endpoint here
    // but for now we pass the mock IDs. The backend will fail if these IDs don't exist.

    const handleExport = async () => {
        if (selectedPapers.length === 0) return;
        setIsLoading(true);
        setPreviewContent("GENERATING ARTIFACT... PLEASE WAIT.");

        try {
            const paperIds = selectedPapers.map(p => p.id);
            const res = await axios.post("http://localhost:8000/api/v1/export", {
                paper_ids: paperIds,
                format: selectedFormat
            });

            setPreviewContent(res.data.content);
        } catch (error: any) {
            console.error("Export Error:", error);
            setPreviewContent(`NETWORK ERROR: COULD NOT GENERATE EXPORT.\n\nNote: Make sure paper IDs exist in the database.\nMessage: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto pb-10">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#1e293b]/30 pb-6 shrink-0">
                <div>
                    <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#ef4444]" />
                        G. Writing & Export Layer
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="DRAFTS & EXPORT">
                        DRAFTS & EXPORT
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Export Controls */}
                <div className="lg:col-span-1 space-y-6">

                    <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-6 clip-card-solais">
                        <h3 className="font-mono text-xs text-[#94a3b8] tracking-widest uppercase mb-6 flex items-center gap-2">
                            <Layers size={14} className="text-white" /> Target Selection
                        </h3>
                        <div className="space-y-3 font-mono text-[10px] text-white uppercase tracking-widest">
                            {selectedPapers.map(p => (
                                <div key={p.id} className="flex gap-3 items-center border border-[#1e293b]/20 p-2 hover:bg-[#1e293b]/10 transition-colors">
                                    <CheckSquare size={12} className="text-[#ef4444]" />
                                    <span className="truncate flex-1">{p.id} - {p.title}</span>
                                </div>
                            ))}
                            <button className="w-full mt-4 p-2 border border-dashed border-[#1e293b] text-[#94a3b8] hover:text-[#ef4444] hover:border-[#ef4444] transition-colors">
                                + Select From Matrix
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-6 clip-card">
                        <h3 className="font-mono text-xs text-[#94a3b8] tracking-widest uppercase mb-6 flex items-center gap-2">
                            <FileJson size={14} className="text-white" /> Output Formats
                        </h3>
                        <div className="flex flex-col gap-2 font-mono text-xs tracking-widest uppercase">
                            {['bibtex', 'csv_matrix', 'related_work_draft'].map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => setSelectedFormat(fmt)}
                                    className={`p-3 border text-left flex items-center gap-3 transition-colors
                                ${selectedFormat === fmt
                                            ? 'bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444]'
                                            : 'bg-black border-[#1e293b]/30 text-white hover:border-[#94a3b8]'}`}
                                >
                                    {fmt === 'bibtex' && <Quote size={14} />}
                                    {fmt === 'csv_matrix' && <FileText size={14} />}
                                    {fmt === 'related_work_draft' && <Layers size={14} />}
                                    {fmt.replace(/_/g, " ")}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isLoading}
                            className="mt-8 w-full flex items-center justify-center gap-3 bg-[#1e293b] hover:bg-[#ef4444] text-white p-4 font-mono text-xs tracking-widest uppercase transition-colors clip-button disabled:opacity-50"
                        >
                            <DownloadCloud size={16} /> {isLoading ? "GENERATING..." : "GENERATE ARTIFACT"}
                        </button>
                    </div>

                </div>

                {/* RIGHT: Live Preview */}
                <div className="lg:col-span-2 bg-[#0d111c] border border-[#ef4444]/30 p-8 clip-card relative overflow-hidden h-[600px] flex flex-col">

                    <div className="flex items-center justify-between border-b border-[#1e293b]/30 pb-4 mb-6 shrink-0">
                        <h3 className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase">
                            LIVE STREAM PREVIEW
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 font-mono text-xs text-white/80 leading-loose tracking-wide whitespace-pre-wrap">
                        {previewContent ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {previewContent}
                            </motion.div>
                        ) : (
                            <div className="opacity-50 h-full flex items-center justify-center text-[#94a3b8]">
                                WAITING FOR GENERATION TRIGGER...
                            </div>
                        )}
                    </div>

                    {/* Solais scan line */}
                    <div className="absolute left-0 top-0 w-full h-[1px] bg-[#ef4444]/50 shadow-[0_0_15px_rgba(192,43,10,1)] z-10 animate-[scan_3s_ease-in-out_infinite]" />
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
