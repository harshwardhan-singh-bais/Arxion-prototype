"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText, CheckCircle, Database, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, pollStatus, type PaperStatus, type UploadResponse } from "@/lib/api";

type PipelineState = "idle" | "uploading" | "processing" | "done" | "error";

interface LogEntry {
    text: string;
    type: "sys" | "ok" | "err";
}

export default function IngestionPage() {
    const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
    const [logs, setLogs] = useState<LogEntry[]>([{ text: "WAITING FOR ARTIFACT...", type: "sys" }]);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [finalStatus, setFinalStatus] = useState<PaperStatus | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addLog = useCallback((text: string, type: LogEntry["type"] = "ok") => {
        setLogs(prev => [{ text, type }, ...prev]);
    }, []);

    const handleFile = useCallback(async (file: File) => {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            addLog("ERROR: Only PDF files are accepted.", "err");
            setPipelineState("error");
            return;
        }

        setPipelineState("uploading");
        setLogs([{ text: "INITIALIZING UPLOAD SEQUENCE...", type: "sys" }]);

        try {
            // Step 1: Upload
            const result = await api.uploadPDF(file);
            setUploadResult(result);
            addLog(`ARTIFACT RECEIVED. ID: ${result.paper_id}`, "sys");
            addLog("PIPELINE INITIALIZED. TRIGGERING EXTRACTORS...", "ok");
            setPipelineState("processing");

            // Step 2: Poll for status
            const final = await pollStatus(result.paper_id, (s) => {
                addLog(`STATUS: ${s.status}`, "ok");
            }, 2500);

            setFinalStatus(final);

            if (final.status === "PROCESSED") {
                addLog("ALL PROTOCOLS SUCCESSFUL", "ok");
                addLog(`ARXION ENTITY EXTRACTION COMPLETE`, "ok");
                addLog(`PAPER ADDED TO KNOWLEDGE MATRIX`, "sys");
                setPipelineState("done");
            } else {
                addLog(`PIPELINE FAILED: ${final.error_message ?? "Unknown error"}`, "err");
                setPipelineState("error");
            }
        } catch (err: any) {
            addLog(`SYSTEM ERROR: ${err?.message ?? "Network unreachable"}`, "err");
            setPipelineState("error");
        }
    }, [addLog]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const reset = () => {
        setPipelineState("idle");
        setLogs([{ text: "WAITING FOR ARTIFACT...", type: "sys" }]);
        setUploadResult(null);
        setFinalStatus(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const borderColor = isDragging
        ? "border-white"
        : pipelineState === "idle"
            ? "border-[#3C091E] hover:border-[#C02B0A]"
            : pipelineState === "error"
                ? "border-red-700"
                : "border-[#C02B0A]";

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        A. Ingestion &amp; Understanding
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="DATA PIPELINE">
                        DATA PIPELINE
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">

                {/* LEFT: DROP ZONE */}
                <div
                    className={`border-2 border-dashed ${borderColor} bg-[#050505] clip-card-solais p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative min-h-[400px]`}
                    onClick={() => pipelineState === "idle" && fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileInput}
                    />

                    <AnimatePresence mode="wait">
                        {pipelineState === "idle" && (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                <UploadCloud size={48} className="text-[#3C091E] mb-6" />
                                <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">INITIALIZE UPLOAD SEQUENCE</h3>
                                <p className="font-mono text-[10px] text-[#97494E] max-w-xs leading-relaxed uppercase">
                                    Drag &amp; drop your PDF research paper. System will autonomously trigger entity extraction protocol.
                                </p>
                            </motion.div>
                        )}

                        {pipelineState === "uploading" && (
                            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                <UploadCloud size={48} className="text-[#C02B0A] mb-6 animate-bounce" />
                                <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">UPLOADING TO ARXION</h3>
                                <div className="w-48 h-1 bg-[#3C091E] mt-4 relative overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5 }} className="absolute top-0 left-0 h-full bg-[#C02B0A]" />
                                </div>
                            </motion.div>
                        )}

                        {pipelineState === "processing" && (
                            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                <Database size={48} className="text-white mb-6 animate-pulse" />
                                <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2 glitch" data-text="TRIGGERING EXTRACTORS">TRIGGERING EXTRACTORS</h3>
                                <p className="font-mono text-[10px] text-[#C02B0A] max-w-xs leading-relaxed uppercase mt-4">
                                    Chunking text. Generating embeddings. Scanning claims against Qdrant Vector Matrix...
                                </p>
                                {uploadResult && (
                                    <p className="font-mono text-[9px] text-[#97494E] mt-4 uppercase">
                                        ID: {uploadResult.paper_id}
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {pipelineState === "done" && (
                            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                <CheckCircle size={48} className="text-green-500 mb-6" />
                                <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">INGESTION COMPLETE</h3>
                                <p className="font-mono text-[10px] text-green-500 max-w-xs leading-relaxed uppercase mt-2">
                                    {finalStatus?.title || "Paper"} added to Knowledge Matrix.
                                </p>
                                <button
                                    className="mt-8 border border-white/20 text-white font-mono text-xs px-6 py-2 uppercase hover:bg-white hover:text-black transition-colors"
                                    onClick={(e) => { e.stopPropagation(); reset(); }}
                                >
                                    RESET PIPELINE
                                </button>
                            </motion.div>
                        )}

                        {pipelineState === "error" && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                <XCircle size={48} className="text-red-500 mb-6" />
                                <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">PIPELINE FAILURE</h3>
                                <p className="font-mono text-[10px] text-red-400 max-w-xs leading-relaxed uppercase mt-2">
                                    {finalStatus?.error_message ?? "Check backend connection and try again."}
                                </p>
                                <button
                                    className="mt-8 border border-red-500/50 text-red-400 font-mono text-xs px-6 py-2 uppercase hover:bg-red-500/20 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); reset(); }}
                                >
                                    RETRY
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Corner accents */}
                    <div className="absolute bottom-4 right-4 flex gap-1">
                        <div className="w-1 h-1 bg-[#3C091E]" />
                        <div className="w-1 h-3 bg-[#3C091E]" />
                        <div className="w-1 h-2 bg-[#C02B0A]" />
                        <div className="w-1 h-4 bg-[#3C091E]" />
                    </div>
                </div>

                {/* RIGHT: LIVE EXTRACTION LOGS */}
                <div className="flex flex-col bg-black/60 border border-[#3C091E]/30 p-8 clip-card h-full min-h-[400px]">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[#97494E] mb-8 border-b border-[#3C091E]/30 pb-4">Extraction Logs</h4>

                    <div className="flex-1 space-y-1 font-mono text-[10px] text-[#97494E] uppercase tracking-wide overflow-y-auto flex flex-col-reverse relative">

                        {pipelineState === "processing" && (
                            <motion.div
                                initial={{ top: "-10px" }}
                                animate={{ top: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 w-full h-[1px] bg-[#C02B0A] shadow-[0_0_10px_rgba(192,43,10,1)] z-10"
                            />
                        )}

                        {logs.map((log, i) => (
                            <motion.div
                                key={`${log.text}-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`flex items-center gap-2 py-1 ${log.type === "err" ? "text-red-400" : log.type === "sys" ? "text-white" : "text-[#97494E]"}`}
                            >
                                <span className={log.type === "ok" ? "text-[#C02B0A]" : log.type === "err" ? "text-red-500" : "text-white"}>
                                    {log.type === "ok" ? "[✓]" : log.type === "err" ? "[✗]" : "[SYS]"}
                                </span>
                                {log.text}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
