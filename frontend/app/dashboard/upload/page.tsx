"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText, CheckCircle, XCircle, Database, X } from "lucide-react";
import { motion } from "framer-motion";

interface FileUpload {
    file: File;
    id: string;
    status: "pending" | "uploading" | "processing" | "done" | "error";
    paperId?: string;
    message?: string;
    progress: number;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
    pending: { text: "PENDING", color: "text-[#94a3b8] border-[#94a3b8]/30" },
    uploading: { text: "UPLOADING", color: "text-[#ef4444] border-[#ef4444]/30 animate-pulse" },
    processing: { text: "PROCESSING", color: "text-[#ef4444] border-[#ef4444]/30 animate-pulse" },
    done: { text: "INGESTED", color: "text-green-400 border-green-800/30" },
    error: { text: "FAILED", color: "text-red-400 border-red-800/30" },
};

export default function IngestionPage() {
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const uploads: FileUpload[] = Array.from(newFiles)
            .filter(f => f.name.toLowerCase().endsWith(".pdf"))
            .map(f => ({
                file: f,
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                status: "pending" as const,
                progress: 0,
            }));
        setFiles(prev => [...prev, ...uploads]);
    }, []);

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const uploadAll = async () => {
        const pending = files.filter(f => f.status === "pending");
        if (pending.length === 0) return;

        // Upload all at once via multi-endpoint
        const formData = new FormData();
        pending.forEach(f => formData.append("files", f.file));

        // Mark as uploading
        setFiles(prev => prev.map(f =>
            pending.find(p => p.id === f.id) ? { ...f, status: "uploading" as const, progress: 30 } : f
        ));

        try {
            const res = await fetch("http://localhost:8000/api/v1/upload/pdfs", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const results = await res.json();

            setFiles(prev => prev.map(f => {
                const idx = pending.findIndex(p => p.id === f.id);
                if (idx === -1) return f;
                const result = results[idx];
                if (!result) return f;

                return {
                    ...f,
                    status: result.status === "FAILED" ? "error" as const : "done" as const,
                    paperId: result.paper_id,
                    message: result.message,
                    progress: 100,
                };
            }));
        } catch (e) {
            setFiles(prev => prev.map(f =>
                pending.find(p => p.id === f.id) ? { ...f, status: "error" as const, message: "Upload failed" } : f
            ));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    };

    const pendingCount = files.filter(f => f.status === "pending").length;
    const doneCount = files.filter(f => f.status === "done").length;

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#1e293b]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#ef4444]" />
                        A. Ingestion & Understanding
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="DATA PIPELINE">
                        DATA PIPELINE
                    </h1>
                </div>
                {files.length > 0 && (
                    <div className="font-mono text-[9px] text-[#94a3b8] tracking-widest uppercase">
                        {doneCount}/{files.length} Processed
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">

                {/* Drag & Drop Zone */}
                <div
                    className={`border-2 border-dashed ${isDragging ? "border-[#ef4444] bg-[#ef4444]/[0.03]" : "border-[#1e293b] hover:border-[#ef4444]"} bg-[#0b0f19] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative min-h-[400px]`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                    />

                    <UploadCloud size={48} className={`${isDragging ? "text-[#ef4444]" : "text-[#1e293b]"} mb-6 transition-colors`} />
                    <h3 className="font-mono text-white text-sm uppercase tracking-widest font-bold mb-2">
                        {isDragging ? "DROP FILES HERE" : "INITIALIZE UPLOAD SEQUENCE"}
                    </h3>
                    <p className="font-mono text-[10px] text-[#94a3b8] max-w-xs leading-relaxed uppercase">
                        Drag & drop multiple PDF artifacts. System will autonomously trigger entity extraction protocol for each file.
                    </p>

                    <div className="absolute bottom-4 right-4 flex gap-1">
                        <div className="w-1 h-1 bg-[#1e293b]" />
                        <div className="w-1 h-3 bg-[#1e293b]" />
                        <div className="w-1 h-2 bg-[#ef4444]" />
                        <div className="w-1 h-4 bg-[#1e293b]" />
                    </div>
                </div>

                {/* File List & Status */}
                <div className="flex flex-col bg-white/[0.06] border border-[#1e293b]/30 p-6 h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-6 border-b border-[#1e293b]/30 pb-4">
                        <h4 className="font-mono text-xs uppercase tracking-widest text-[#94a3b8]">Upload Queue</h4>
                        {pendingCount > 0 && (
                            <button
                                onClick={uploadAll}
                                className="px-4 py-1.5 bg-[#ef4444] text-white font-mono text-[9px] tracking-[0.2em] uppercase hover:bg-[#ef4444]/80 transition-colors"
                            >
                                Upload {pendingCount} File{pendingCount > 1 ? "s" : ""}
                            </button>
                        )}
                    </div>

                    {files.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="font-mono text-[10px] text-[#1e293b] uppercase tracking-widest">
                                WAITING FOR ARTIFACTS...
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1 space-y-3 overflow-y-auto">
                            {files.map((f, i) => (
                                <motion.div
                                    key={f.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3 p-3 bg-white/5 border border-[#1e293b]/20 group"
                                >
                                    <FileText size={14} className={f.status === "done" ? "text-green-400" : f.status === "error" ? "text-red-400" : "text-[#94a3b8]"} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-[10px] text-white truncate">{f.file.name}</div>
                                        <div className="font-mono text-[8px] text-[#1e293b] uppercase tracking-widest">
                                            {(f.file.size / 1024 / 1024).toFixed(1)} MB
                                        </div>
                                        {/* Progress bar */}
                                        {(f.status === "uploading" || f.status === "done") && (
                                            <div className="w-full h-[2px] bg-[#1e293b]/30 mt-1.5 overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${f.status === "done" ? "bg-green-500" : "bg-[#ef4444]"}`}
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${f.progress}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`font-mono text-[8px] tracking-[0.15em] uppercase border px-1.5 py-0.5 ${STATUS_LABELS[f.status]?.color || ""}`}>
                                        {STATUS_LABELS[f.status]?.text}
                                    </span>
                                    {f.status === "pending" && (
                                        <button onClick={() => removeFile(f.id)} className="text-[#1e293b] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={12} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
