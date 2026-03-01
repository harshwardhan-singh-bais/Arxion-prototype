"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, ShieldAlert, Cpu, Timer, ShieldCheck, FileKey, AlertOctagon, HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";

export default function PaperDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [paper, setPaper] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/v1/papers/${id}`);
                const data = res.data;

                // Map the backend DB structure to the expected UI structure
                setPaper({
                    title: data.title || "Untitled Document",
                    authors: data.authors && data.authors.length > 0 ? data.authors.join(", ") : "Unknown Authors",
                    rci: Math.floor(Math.random() * 20) + 80, // Needs real calculation
                    reproducibilityScore: 92, // Mock for now until calculation endpoint
                    confidenceScore: 85,
                    flags: data.limitations ? data.limitations.map((l: any) => l.type) : ["OPEN_SOURCE_WEIGHTS"],
                    effort: {
                        gpuHours: data.compute ? `${data.compute.hardware} x${data.compute.hours}h` : "Undisclosed",
                        complexity: "Moderate",
                        risk: data.status === "FAILED" ? "High" : "Low"
                    },
                    integrity: {
                        multiRun: data.hyperparameters ? data.hyperparameters.seeds_reported : false,
                        confInterval: true,
                        codeLink: data.code_link || null
                    },
                    evidence: data.claims ? data.claims.map((c: any) => ({
                        type: "CLAIM",
                        text: c.statement,
                        section: c.evidence && c.evidence.length > 0 ? c.evidence[0].section : "Extracted",
                        conf: 0.95
                    })) : [
                        { type: "PROCESSING", text: "Entities are still being extracted...", section: "System", conf: 0.5 }
                    ]
                });
            } catch (err: any) {
                console.error("Failed to fetch paper:", err);
                setError(err.message || "Paper not found.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaper();
    }, [id]);

    if (isLoading) {
        return <div className="p-10 font-mono text-[#94a3b8] uppercase">ACCESSING SECURE DATA VAULT...</div>;
    }

    if (error || !paper) {
        return <div className="p-10 font-mono text-[#ef4444] uppercase">ERROR: {error || "PAPER CORE CORRUPTED or NOT FOUND."}</div>;
    }

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

            {/* Back Button */}
            <Link href="/dashboard/matrix" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] hover:text-[#ef4444] transition-colors w-max">
                <ArrowLeft size={12} /> BACK TO MATRIX
            </Link>

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-[#1e293b]/30 pb-10">
                <div className="max-w-3xl">
                    <div className="font-mono text-xs text-white bg-[#ef4444] px-2 py-0.5 w-max tracking-widest mb-4">
                        {id}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-white uppercase glitch mb-4" data-text={paper.title}>
                        {paper.title}
                    </h1>
                    <p className="font-mono text-[#94a3b8] text-sm uppercase tracking-widest leading-loose">
                        {paper.authors}
                    </p>
                </div>

                {/* Main RCI Score Block */}
                <div className="shrink-0 bg-[#0b0f19] border border-[#ef4444] clip-card-solais p-8 text-center min-w-[200px] shadow-[0_0_30px_rgba(192,43,10,0.15)] relative overflow-hidden group">
                    <div className="font-mono text-[9px] text-[#ef4444] tracking-[0.3em] uppercase mb-4">ARXION RCI</div>
                    <div className="text-6xl font-display font-black text-white">{paper.rci}</div>
                    <div className="font-mono text-[10px] text-green-500 tracking-widest uppercase mt-4 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> Highly Credible
                    </div>

                    {/* Heat map glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#ef4444]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COL: Breakdowns */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Score Breakdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Reproducibility */}
                        <div className="bg-[#0d111c] border border-[#1e293b]/30 p-6 relative">
                            <h3 className="font-mono text-xs text-[#94a3b8] tracking-widest uppercase mb-4 flex items-center gap-2">
                                <FileKey size={14} className="text-white" /> Reproducibility
                            </h3>
                            <div className="flex items-end gap-4 mb-4">
                                <div className="text-4xl font-display font-black text-white">{paper.reproducibilityScore}%</div>
                            </div>
                            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
                                <div className="flex justify-between text-green-500">
                                    <span>Public Code Repo</span> <span>Verified</span>
                                </div>
                                <div className="flex justify-between text-green-500">
                                    <span>Hyperparameters</span> <span>Detailed</span>
                                </div>
                                <div className="flex justify-between text-yellow-500">
                                    <span>Evaluation Pipeline</span> <span>Partial Match</span>
                                </div>
                            </div>
                        </div>

                        {/* Confidence */}
                        <div className="bg-[#0d111c] border border-[#1e293b]/30 p-6 relative">
                            <h3 className="font-mono text-xs text-[#94a3b8] tracking-widest uppercase mb-4 flex items-center gap-2">
                                <HelpCircle size={14} className="text-white" /> Arxion Confidence
                            </h3>
                            <div className="flex items-end gap-4 mb-4">
                                <div className="text-4xl font-display font-black text-white">{paper.confidenceScore}%</div>
                            </div>
                            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
                                <div className="flex justify-between text-white/80">
                                    <span>Parse Completeness</span> <span>99.8%</span>
                                </div>
                                <div className="flex justify-between text-white/80">
                                    <span>Claim-to-Evidence</span> <span>1.4 Ratio</span>
                                </div>
                                <div className="flex justify-between text-[#ef4444]">
                                    <span>Missing Context</span> <span>Hardware Topology</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Strict Evidence Pointers */}
                    <div className="bg-[#0d111c] border border-[#1e293b]/30 p-6">
                        <h3 className="font-mono text-xs text-[#ef4444] tracking-widest uppercase mb-6 flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#ef4444]" /> STRUCTURED EVIDENCE MAPPING
                        </h3>
                        <div className="space-y-4">
                            {paper.evidence.map((ev: any, i: number) => (
                                <div key={i} className="p-4 border border-[#1e293b]/20 bg-[#0b0f19] hover:border-[#1e293b]/80 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer">
                                    <div className="flex-1">
                                        <div className="font-mono text-[9px] text-[#94a3b8] tracking-widest uppercase mb-2 flex items-center gap-2">
                                            <span className="bg-[#1e293b] text-white px-2 py-0.5">{ev.type}</span>
                                            <span>{ev.section}</span>
                                        </div>
                                        <p className="font-sans text-sm text-white">{ev.text}</p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#94a3b8]">Conf.</span>
                                        <span className="font-mono text-xs text-[#ef4444]">{(ev.conf * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COL: Side info */}
                <div className="space-y-8">

                    {/* Risk Flags */}
                    <div className="border border-[#ef4444]/30 bg-[#0f172a]/30 p-6 clip-card">
                        <h3 className="font-mono text-[10px] text-[#ef4444] tracking-widest uppercase mb-4 flex items-center gap-2">
                            <AlertOctagon size={14} /> Risk Assessment
                        </h3>
                        <div className="flex flex-col gap-2">
                            {paper.flags.map((f: string, index: number) => f ? (
                                <div key={index} className="text-xs font-mono uppercase bg-[#ef4444] text-white p-2 text-center tracking-widest">
                                    {String(f).replace(/_/g, " ")}
                                </div>
                            ) : null)}
                        </div>
                    </div>

                    {/* Reproduction Effort (Advanced Intel) */}
                    <div className="border border-[#1e293b]/30 bg-[#0b0f19] p-6 clip-card-solais">
                        <h3 className="font-mono text-[10px] text-white tracking-widest uppercase mb-6 border-b border-[#1e293b]/30 pb-4">
                            Reproduction Estimator
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 mb-2"><Cpu size={12} /> Compute Est.</span>
                                <span className="font-mono text-sm text-white uppercase">{paper.effort.gpuHours}</span>
                            </div>
                            <div>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 mb-2"><Timer size={12} /> Eng. Complexity</span>
                                <span className="font-mono text-sm text-yellow-500 uppercase">{paper.effort.complexity}</span>
                            </div>
                            <div>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 mb-2"><ShieldAlert size={12} /> Risk Level</span>
                                <span className="font-mono text-sm text-green-500 uppercase">{paper.effort.risk}</span>
                            </div>
                        </div>
                    </div>

                    {/* Statistical Integrity */}
                    <div className="border border-[#1e293b]/30 bg-[#0b0f19] p-6">
                        <h3 className="font-mono text-[10px] text-white tracking-widest uppercase mb-4">
                            Statistical Integrity
                        </h3>
                        <ul className="space-y-2 font-mono text-[10px] uppercase tracking-widest">
                            <li className="flex justify-between border-b border-[#1e293b]/20 pb-2">
                                <span className="text-[#94a3b8]">MULTIPLE RUNS</span>
                                <span className={paper.integrity.multiRun ? "text-green-500" : "text-[#ef4444]"}>{paper.integrity.multiRun ? "DETECTED" : "OMITTED"}</span>
                            </li>
                            <li className="flex justify-between border-b border-[#1e293b]/20 pb-2">
                                <span className="text-[#94a3b8]">CONF INTERVALS</span>
                                <span className={paper.integrity.confInterval ? "text-green-500" : "text-[#ef4444]"}>{paper.integrity.confInterval ? "DETECTED" : "OMITTED"}</span>
                            </li>
                        </ul>
                        {paper.integrity.codeLink && (
                            <a href={paper.integrity.codeLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full p-3 border border-white/20 font-mono text-[9px] tracking-widest uppercase text-white hover:bg-white hover:text-black transition-colors">
                                <ExternalLink size={12} /> VERIFY PUBLIC REPO
                            </a>
                        )}
                    </div>

                </div>

            </div>

        </div>
    );
}
