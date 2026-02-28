"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, Database } from "lucide-react";
import { motion } from "framer-motion";

export default function IngestionPage() {
    const [pipelineState, setPipelineState] = useState<"idle" | "uploading" | "processing" | "done">("idle");

    const handleSimulateDrop = () => {
        setPipelineState("uploading");
        setTimeout(() => setPipelineState("processing"), 2000);
        setTimeout(() => setPipelineState("done"), 5000);
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-6xl mx-auto">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        A. Ingestion & Understanding
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="DATA PIPELINE">
                        DATA PIPELINE
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">

                {/* LEFT: DRAG AND DROP ZONE */}
                <div
                    className={`border-2 border-dashed ${pipelineState === "idle" ? 'border-[#3C091E] hover:border-[#C02B0A]' : 'border-[#C02B0A]'} bg-[#050505] clip-card-solais p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative min-h-[400px]`}
                    onClick={handleSimulateDrop}
                >
                    {pipelineState === "idle" ? (
                        <>
                            <UploadCloud size={48} className="text-[#3C091E] mb-6" />
                            <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">INITIALIZE UPLOAD SEQUENCE</h3>
                            <p className="font-mono text-[10px] text-[#97494E] max-w-xs leading-relaxed uppercase">
                                Drag & Drop exact PDF artifacts or raw JSON configurations. System will autonomously trigger entity extraction protocol.
                            </p>
                        </>
                    ) : pipelineState === "uploading" ? (
                        <>
                            <UploadCloud size={48} className="text-[#C02B0A] mb-6 animate-bounce" />
                            <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">UPLOADING TO S3</h3>
                            <div className="w-48 h-1 bg-[#3C091E] mt-4 relative overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="absolute top-0 left-0 h-full bg-[#C02B0A]" />
                            </div>
                        </>
                    ) : pipelineState === "processing" ? (
                        <>
                            <Database size={48} className="text-white mb-6 animate-pulse" />
                            <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2 glitch" data-text="TRIGGERING EXTRACTORS">TRIGGERING EXTRACTORS</h3>
                            <p className="font-mono text-[10px] text-[#C02B0A] max-w-xs leading-relaxed uppercase mt-4">
                                Chunking text. Generating embeddings. Scanning claims against Qdrant Vector Matrix...
                            </p>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={48} className="text-green-500 mb-6" />
                            <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">INGESTION COMPLETE</h3>
                            <p className="font-mono text-[10px] text-green-500 max-w-xs leading-relaxed uppercase mt-2">
                                9 Entities extracted. 14 Evidence pointers mapped. Added to matrix.
                            </p>
                            <button className="mt-8 border border-white/20 text-white font-mono text-xs px-6 py-2 uppercase hover:bg-white hover:text-black transition-colors" onClick={(e) => { e.stopPropagation(); setPipelineState("idle"); }}>
                                RESET PIPELINE
                            </button>
                        </>
                    )}

                    {/* Diagonal accent cuts */}
                    <div className="absolute bottom-4 right-4 flex gap-1">
                        <div className="w-1 h-1 bg-[#3C091E]" />
                        <div className="w-1 h-3 bg-[#3C091E]" />
                        <div className="w-1 h-2 bg-[#C02B0A]" />
                        <div className="w-1 h-4 bg-[#3C091E]" />
                    </div>
                </div>

                {/* RIGHT: LIVE PROCESSING PIPELINE LOGS */}
                <div className="flex flex-col bg-black/60 border border-[#3C091E]/30 p-8 clip-card h-full">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[#97494E] mb-8 border-b border-[#3C091E]/30 pb-4">Extraction Logs</h4>

                    <div className="flex-1 space-y-4 font-mono text-[10px] text-[#97494E] uppercase tracking-wide overflow-hidden flex flex-col-reverse relative">

                        {/* Fake glowing line to indicate active scanning */}
                        {pipelineState === "processing" && (
                            <motion.div
                                initial={{ top: "-10px" }}
                                animate={{ top: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 w-full h-[1px] bg-[#C02B0A] shadow-[0_0_10px_rgba(192,43,10,1)] z-10"
                            />
                        )}

                        {pipelineState === "done" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 flex items-center gap-2 py-2">
                                <span>{">"}</span> [SYS] ALL PROTOCOLS SUCCESSFUL. ARXION CREDIBILITY: 88.2%
                            </motion.div>
                        )}
                        {(pipelineState === "processing" || pipelineState === "done") && (
                            <>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-2 py-1"><span className="text-[#C02B0A]">{"[✓]"}</span> Extracted dataset baseline claims (Section 4.1)</motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-2 py-1"><span className="text-[#C02B0A]">{"[✓]"}</span> 2 Contradictions detected vs baseline paper ID#4491</motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2 py-1"><span className="text-[#C02B0A]">{"[✓]"}</span> Validated JSON schema. Stored in NeonDB</motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 py-1"><span className="text-[#C02B0A]">{"[✓]"}</span> Push Embeddings to Qdrant (184 vectors)</motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }} className="flex items-center gap-2 py-1"><span className="text-[#C02B0A]">{"[✓]"}</span> LangChain semantic chunking complete</motion.div>
                            </>
                        )}
                        {(pipelineState === "uploading" || pipelineState === "processing" || pipelineState === "done") && (
                            <div className="flex items-center gap-2 py-1"><span className="text-white">{"[SYS]"}</span> S3 Object Created. Initializing Pipeline.</div>
                        )}
                        <div className="flex items-center gap-2 py-1 opacity-50"><span className="text-white">{"[-]"}</span> WAITING FOR ARTIFACT...</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
